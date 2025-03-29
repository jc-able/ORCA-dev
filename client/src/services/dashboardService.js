import { supabase } from './supabaseClient';
import { withApiKey } from '../utils/supabaseUtils';

/**
 * Fetch dashboard data from Supabase
 * Uses the unified Person model with all extension tables
 * @returns {Promise<Object>} Dashboard data including leads, referrals, and appointments
 */
export const fetchDashboardData = async () => {
  try {
    // Get current user ID for filtering
    const { data: { user } } = await withApiKey(() => 
      supabase.auth.getUser()
    );
    const userId = user?.id;

    // Fetch total leads count - using persons with is_lead=true
    const { count: totalLeads, error: leadsError } = await withApiKey(() => 
      supabase
        .from('persons')
        .select('*', { count: 'exact', head: true })
        .eq('is_lead', true)
        .eq('assigned_to', userId)
    );

    if (leadsError) throw leadsError;

    // Fetch new leads from this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString();

    const { count: newLeadsThisWeek, error: newLeadsError } = await withApiKey(() => 
      supabase
        .from('persons')
        .select('*', { count: 'exact', head: true })
        .eq('is_lead', true)
        .eq('assigned_to', userId)
        .gte('created_at', oneWeekAgoStr)
    );

    if (newLeadsError) throw newLeadsError;

    // Fetch converted leads (won status from lead_extensions)
    const { count: convertedLeads, error: convertedError } = await withApiKey(() => 
      supabase
        .from('persons')
        .select('*', { count: 'exact', head: true })
        .eq('is_lead', true)
        .eq('is_member', true)
        .eq('assigned_to', userId)
    );

    if (convertedError) throw convertedError;

    // Calculate conversion rate
    const conversionRate = totalLeads > 0 
      ? Math.round((convertedLeads / totalLeads) * 100) 
      : 0;

    // Fetch leads by stage
    const { data: leadsByStage, error: stageError } = await withApiKey(() => 
      supabase
        .from('lead_extensions')
        .select(`
          lead_status,
          persons!inner(assigned_to)
        `)
        .eq('persons.assigned_to', userId)
        .eq('persons.is_lead', true)
    );

    if (stageError) throw stageError;

    // Count leads by stage from lead_extensions table
    const stageCount = leadsByStage.reduce((acc, lead) => {
      if (lead.lead_status) {
        acc[lead.lead_status] = (acc[lead.lead_status] || 0) + 1;
      }
      return acc;
    }, {});

    // Fetch referrals count from persons with is_referral=true
    const { count: totalReferrals, error: referralsError } = await withApiKey(() => 
      supabase
        .from('persons')
        .select('*', { count: 'exact', head: true })
        .eq('is_referral', true)
        .eq('assigned_to', userId)
    );

    if (referralsError) throw referralsError;

    // Fetch new referrals this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    const firstDayStr = firstDayOfMonth.toISOString();

    const { count: newReferralsThisMonth, error: newReferralsError } = await withApiKey(() => 
      supabase
        .from('persons')
        .select('*', { count: 'exact', head: true })
        .eq('is_referral', true)
        .eq('assigned_to', userId)
        .gte('created_at', firstDayStr)
    );

    if (newReferralsError) throw newReferralsError;

    // Fetch upcoming appointments from interactions table
    const now = new Date().toISOString();
    const { data: appointments, error: appointmentsError } = await withApiKey(() => 
      supabase
        .from('referral_extensions')
        .select(`
          id,
          appointment_date,
          appointment_status,
          persons!inner(first_name, last_name, email, phone, assigned_to)
        `)
        .eq('persons.assigned_to', userId)
        .gte('appointment_date', now)
        .lte('appointment_date', new Date(now).toISOString())
        .order('appointment_date', { ascending: true })
        .limit(5)
    );

    if (appointmentsError) throw appointmentsError;

    // Format appointments for display
    const formattedAppointments = appointments.map(apt => ({
      id: apt.id,
      name: apt.persons ? `${apt.persons.first_name} ${apt.persons.last_name}` : 'Unknown',
      date: apt.appointment_date,
      type: apt.appointment_status || 'Scheduled',
      personId: apt.persons.id
    }));

    // Fetch recent activity from interactions table
    const { data: activities, error: activitiesError } = await withApiKey(() => 
      supabase
        .from('interactions')
        .select(`
          id,
          interaction_type,
          completed_at,
          content,
          person_id,
          persons:person_id (
            first_name,
            last_name
          )
        `)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(5)
    );

    if (activitiesError) throw activitiesError;

    // Format activities for display
    const formattedActivities = activities.map(activity => {
      const activityTypes = {
        'email': 'message',
        'sms': 'message',
        'call': 'call',
        'meeting': 'meeting',
        'note': 'note',
        'appointment': 'appointment',
        'visit': 'visit'
      };
      
      return {
        id: activity.id,
        name: activity.persons ? `${activity.persons.first_name} ${activity.persons.last_name}` : 'Unknown',
        date: activity.completed_at,
        type: activityTypes[activity.interaction_type] || activity.interaction_type,
        content: activity.content,
        personId: activity.person_id
      };
    });

    return {
      leadsData: {
        total: totalLeads || 0,
        newThisWeek: newLeadsThisWeek || 0,
        conversion: conversionRate,
        byStage: stageCount || {}
      },
      referralsData: {
        total: totalReferrals || 0,
        newThisMonth: newReferralsThisMonth || 0
      },
      recentActivity: formattedActivities || [],
      upcomingAppointments: formattedAppointments || []
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    
    // Return fallback data in case of error
    return {
      leadsData: {
        total: 0,
        newThisWeek: 0,
        conversion: 0,
        byStage: {}
      },
      referralsData: {
        total: 0,
        newThisMonth: 0
      },
      recentActivity: [],
      upcomingAppointments: []
    };
  }
};

/**
 * Fetch lead conversion metrics over time
 * @param {string} period - Time period (week, month, quarter, year)
 * @returns {Promise<Object>} Metrics data for chart visualization
 */
export const fetchLeadConversionMetrics = async (period = 'month') => {
  try {
    // Get current user ID for filtering
    const { data: { user } } = await withApiKey(() => 
      supabase.auth.getUser()
    );
    const userId = user?.id;
    
    // Calculate date range based on period
    const endDate = new Date();
    let startDate = new Date();
    let interval = '';
    
    switch(period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        interval = '1 day';
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        interval = '1 day';
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        interval = '1 week';
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        interval = '1 month';
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
        interval = '1 day';
    }
    
    // Format dates for SQL query
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();
    
    // Try using the stored procedure first
    try {
      // Use the stored procedure if available
      const { data, error } = await withApiKey(() => 
        supabase.rpc('get_lead_metrics_by_period', {
          start_date: startDateStr,
          end_date: endDateStr,
          period_interval: interval,
          user_id: userId
        })
      );
      
      if (!error) {
        return data;
      }
      
      // If there's an error, log it and fall through to the direct query approach
      console.warn('Stored procedure error, trying direct query instead:', error);
    } catch (rpcError) {
      console.warn('RPC error, falling back to direct query:', rpcError);
    }
    
    // Direct query approach - a simplified version of the stored procedure logic
    // First set up the date series based on the period
    let dateFormat = 'YYYY-MM-DD';
    let truncPeriod = 'day';
    
    if (interval === '1 week') {
      truncPeriod = 'week';
    } else if (interval === '1 month') {
      truncPeriod = 'month';
      dateFormat = 'YYYY-MM';
    }
    
    // Fetch new leads created in the date range
    const { data: newLeadsData, error: newLeadsError } = await withApiKey(() => 
      supabase
        .from('persons')
        .select('created_at')
        .eq('is_lead', true)
        .eq('assigned_to', userId)
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr)
    );
    
    if (newLeadsError) {
      console.error('Error fetching new leads:', newLeadsError);
      return generateFallbackMetrics(period);
    }
    
    // Fetch converted leads in the date range
    const { data: convertedLeadsData, error: convertedLeadsError } = await withApiKey(() => 
      supabase
        .from('lead_extensions')
        .select('updated_at, person_id, lead_status')
        .eq('lead_status', 'Won')
        .gte('updated_at', startDateStr)
        .lte('updated_at', endDateStr)
    );
    
    if (convertedLeadsError) {
      console.error('Error fetching converted leads:', convertedLeadsError);
      return generateFallbackMetrics(period);
    }
    
    // Filter converted leads to only include those assigned to the current user
    const { data: peopleData, error: peopleError } = await withApiKey(() => 
      supabase
        .from('persons')
        .select('id')
        .eq('assigned_to', userId)
    );
    
    if (peopleError) {
      console.error('Error fetching people data:', peopleError);
      return generateFallbackMetrics(period);
    }
    
    // Create a set of person IDs assigned to the current user for faster lookup
    const userPersonIds = new Set(peopleData.map(p => p.id));
    
    // Filter converted leads to only include those assigned to the current user
    const filteredConvertedLeads = convertedLeadsData.filter(lead => 
      userPersonIds.has(lead.person_id)
    );
    
    // Generate date buckets for the period
    const dateBuckets = {};
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = formatDate(currentDate, truncPeriod, dateFormat);
      dateBuckets[dateKey] = { new_leads: 0, converted_leads: 0 };
      
      // Increment by the appropriate interval
      if (interval === '1 day') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (interval === '1 week') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (interval === '1 month') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    
    // Group new leads by date
    newLeadsData.forEach(lead => {
      const date = new Date(lead.created_at);
      const dateKey = formatDate(date, truncPeriod, dateFormat);
      if (dateBuckets[dateKey]) {
        dateBuckets[dateKey].new_leads++;
      }
    });
    
    // Group converted leads by date
    filteredConvertedLeads.forEach(lead => {
      const date = new Date(lead.updated_at);
      const dateKey = formatDate(date, truncPeriod, dateFormat);
      if (dateBuckets[dateKey]) {
        dateBuckets[dateKey].converted_leads++;
      }
    });
    
    // Convert bucket data to the expected format for the chart
    const result = Object.entries(dateBuckets).map(([date, metrics]) => {
      return {
        date,
        new_leads: metrics.new_leads,
        converted_leads: metrics.converted_leads,
        conversion_rate: metrics.new_leads > 0 
          ? (metrics.converted_leads / metrics.new_leads)
          : 0
      };
    }).sort((a, b) => a.date.localeCompare(b.date));
    
    return result;
  } catch (error) {
    console.error('Error fetching lead conversion metrics:', error);
    return generateFallbackMetrics(period);
  }
};

/**
 * Helper function to format dates according to the specified period
 * @param {Date} date - The date to format
 * @param {string} truncPeriod - The period to truncate to (day, week, month)
 * @param {string} format - The output format
 * @returns {string} Formatted date string
 */
const formatDate = (date, truncPeriod, format) => {
  // Clone the date to avoid modifying the original
  const newDate = new Date(date);
  
  // Truncate the date based on the period
  if (truncPeriod === 'week') {
    // Set to the beginning of the week (Sunday)
    const day = newDate.getDay();
    newDate.setDate(newDate.getDate() - day);
  } else if (truncPeriod === 'month') {
    // Set to the first day of the month
    newDate.setDate(1);
  }
  
  // Format the date as YYYY-MM-DD or YYYY-MM
  if (format === 'YYYY-MM') {
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  } else {
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const day = String(newDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

/**
 * Generate fallback metrics data when the database function is not available
 * @param {string} period - Time period (week, month, quarter, year)
 * @returns {Object} Simulated metrics data
 */
const generateFallbackMetrics = (period) => {
  const metrics = [];
  const endDate = new Date();
  let startDate = new Date();
  let points = 0;
  
  switch(period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      points = 7;
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      points = 30;
      break;
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 3);
      points = 12;
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      points = 12;
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
      points = 30;
  }
  
  // Generate points between start and end date
  const interval = (endDate - startDate) / points;
  
  for (let i = 0; i < points; i++) {
    const date = new Date(startDate.getTime() + interval * i);
    metrics.push({
      date: date.toISOString().split('T')[0],
      new_leads: Math.floor(Math.random() * 5) + 1,
      converted_leads: Math.floor(Math.random() * 3),
      conversion_rate: Math.random() * 0.4 // 0-40%
    });
  }
  
  return metrics;
};

/**
 * Get referral source distribution data
 * @returns {Promise<Array>} Array of referral sources and counts
 */
export const getReferralSourceDistribution = async () => {
  try {
    // Get current user ID for filtering
    const { data: { user } } = await withApiKey(() => 
      supabase.auth.getUser()
    );
    const userId = user?.id;
    
    // Query to get referral sources with counts
    const { data, error } = await withApiKey(() => 
      supabase
        .from('persons')
        .select('referral_source')
        .eq('is_lead', true)
        .eq('assigned_to', userId)
        .not('referral_source', 'is', null)
    );
    
    if (error) throw error;
    
    // Count occurrences of each referral source
    const sourceCount = data.reduce((acc, person) => {
      const source = person.referral_source || 'Unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});
    
    // Convert to array for charting
    return Object.entries(sourceCount).map(([source, count]) => ({
      source,
      count
    }));
  } catch (error) {
    console.error('Error fetching referral source distribution:', error);
    
    // Return fallback data
    return [
      { source: 'Referral', count: 14 },
      { source: 'Website', count: 8 },
      { source: 'Walk-in', count: 12 },
      { source: 'Social Media', count: 6 },
      { source: 'Advertisement', count: 4 },
      { source: 'Other', count: 3 }
    ];
  }
};

/**
 * Fetch priority leads that need attention
 * These are leads with high readiness score, conversion probability,
 * or hot temperature that haven't been contacted recently
 * @returns {Promise<Array>} Array of priority leads
 */
export const fetchPriorityLeads = async () => {
  try {
    // Get current user ID for filtering
    const { data: { user } } = await withApiKey(() => 
      supabase.auth.getUser()
    );
    const userId = user?.id;

    // Instead of using a complex OR condition, run three separate queries and combine results
    
    // Query 1: High readiness score leads
    const { data: highReadinessLeads, error: error1 } = await withApiKey(() => 
      supabase
        .from('persons')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          last_contacted,
          lead_extensions!inner (
            lead_status,
            readiness_score,
            lead_temperature,
            estimated_value,
            conversion_probability
          )
        `)
        .eq('is_lead', true)
        .eq('active_status', true)
        .eq('assigned_to', userId)
        .gte('lead_extensions.readiness_score', 7)
        .order('lead_extensions(readiness_score)', { ascending: false })
        .limit(10)
    );

    if (error1) console.error("Error fetching high readiness leads:", error1);
    
    // Query 2: High conversion probability leads
    const { data: highProbabilityLeads, error: error2 } = await withApiKey(() => 
      supabase
        .from('persons')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          last_contacted,
          lead_extensions!inner (
            lead_status,
            readiness_score,
            lead_temperature,
            estimated_value,
            conversion_probability
          )
        `)
        .eq('is_lead', true)
        .eq('active_status', true)
        .eq('assigned_to', userId)
        .gte('lead_extensions.conversion_probability', 70)
        .order('lead_extensions(conversion_probability)', { ascending: false })
        .limit(10)
    );

    if (error2) console.error("Error fetching high probability leads:", error2);
    
    // Query 3: Hot temperature leads
    const { data: hotLeads, error: error3 } = await withApiKey(() => 
      supabase
        .from('persons')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          last_contacted,
          lead_extensions!inner (
            lead_status,
            readiness_score,
            lead_temperature,
            estimated_value,
            conversion_probability
          )
        `)
        .eq('is_lead', true)
        .eq('active_status', true)
        .eq('assigned_to', userId)
        .eq('lead_extensions.lead_temperature', 'hot')
        .order('lead_extensions(readiness_score)', { ascending: false })
        .limit(10)
    );

    if (error3) console.error("Error fetching hot leads:", error3);
    
    // If all queries failed, throw an error
    if (error1 && error2 && error3) {
      throw new Error("All priority lead queries failed");
    }
    
    // Combine and deduplicate results
    const allLeads = [
      ...(highReadinessLeads || []),
      ...(highProbabilityLeads || []),
      ...(hotLeads || [])
    ];
    
    // Deduplicate by ID
    const uniqueLeadsMap = new Map();
    allLeads.forEach(lead => {
      uniqueLeadsMap.set(lead.id, lead);
    });
    
    // Convert back to array
    const uniqueLeads = Array.from(uniqueLeadsMap.values());
    
    // Sort by readiness score and conversion probability (descending)
    uniqueLeads.sort((a, b) => {
      // First by readiness score
      const readinessA = a.lead_extensions[0].readiness_score || 0;
      const readinessB = b.lead_extensions[0].readiness_score || 0;
      if (readinessB !== readinessA) {
        return readinessB - readinessA;
      }
      
      // Then by conversion probability
      const probA = a.lead_extensions[0].conversion_probability || 0;
      const probB = b.lead_extensions[0].conversion_probability || 0;
      return probB - probA;
    });
    
    // Limit to 5 results
    const priorityLeads = uniqueLeads.slice(0, 5);

    return priorityLeads.map(lead => ({
      id: lead.id,
      name: `${lead.first_name} ${lead.last_name}`,
      email: lead.email,
      phone: lead.phone,
      status: lead.lead_extensions[0].lead_status,
      readiness: lead.lead_extensions[0].readiness_score,
      temperature: lead.lead_extensions[0].lead_temperature,
      conversionProbability: lead.lead_extensions[0].conversion_probability,
      estimatedValue: lead.lead_extensions[0].estimated_value,
      lastContacted: lead.last_contacted
    }));
  } catch (error) {
    console.error('Error fetching priority leads:', error);
    return [];
  }
};

/**
 * Fetch upcoming appointments in the next 7 days
 * @returns {Promise<Array>} Array of upcoming appointments
 */
export const fetchUpcomingAppointments = async () => {
  try {
    // Get current user ID for filtering
    const { data: { user } } = await withApiKey(() => 
      supabase.auth.getUser()
    );
    const userId = user?.id;

    const now = new Date().toISOString();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString();

    const { data: appointments, error } = await withApiKey(() => 
      supabase
        .from('referral_extensions')
        .select(`
          id,
          appointment_date,
          appointment_status,
          google_calendar_event_id,
          persons!inner (
            id,
            first_name, 
            last_name, 
            email, 
            phone, 
            assigned_to
          )
        `)
        .eq('persons.assigned_to', userId)
        .gte('appointment_date', now)
        .lte('appointment_date', nextWeekStr)
        .not('appointment_status', 'in', '(cancelled,completed)')
        .order('appointment_date', { ascending: true })
        .limit(5)
    );

    if (error) throw error;

    return appointments.map(apt => ({
      id: apt.id,
      personId: apt.persons.id,
      name: `${apt.persons.first_name} ${apt.persons.last_name}`,
      email: apt.persons.email,
      phone: apt.persons.phone,
      date: apt.appointment_date,
      status: apt.appointment_status,
      calendarEventId: apt.google_calendar_event_id
    }));
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    return [];
  }
};

/**
 * Fetch leads that need follow-up based on scheduled contact dates
 * @returns {Promise<Array>} Array of leads needing follow-up
 */
export const fetchFollowUpLeads = async () => {
  try {
    // Get current user ID for filtering
    const { data: { user } } = await withApiKey(() => 
      supabase.auth.getUser()
    );
    const userId = user?.id;

    const now = new Date().toISOString();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const threeDaysLaterStr = threeDaysLater.toISOString();

    const { data: followUpLeads, error } = await withApiKey(() => 
      supabase
        .from('persons')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          next_scheduled_contact,
          lead_extensions!inner (
            lead_status,
            lead_temperature
          )
        `)
        .eq('is_lead', true)
        .eq('active_status', true)
        .eq('assigned_to', userId)
        .gte('next_scheduled_contact', now)
        .lte('next_scheduled_contact', threeDaysLaterStr)
        .order('next_scheduled_contact', { ascending: true })
        .limit(5)
    );

    if (error) throw error;

    return followUpLeads.map(lead => ({
      id: lead.id,
      name: `${lead.first_name} ${lead.last_name}`,
      email: lead.email,
      phone: lead.phone,
      status: lead.lead_extensions[0].lead_status,
      temperature: lead.lead_extensions[0].lead_temperature,
      nextContact: lead.next_scheduled_contact
    }));
  } catch (error) {
    console.error('Error fetching follow-up leads:', error);
    return [];
  }
};

/**
 * Fetch lead distribution by status
 * @returns {Promise<Array>} Array of lead counts by status
 */
export const fetchLeadStatusDistribution = async () => {
  try {
    // Get current user ID for filtering
    const { data: { user } } = await withApiKey(() => 
      supabase.auth.getUser()
    );
    const userId = user?.id;

    const { data, error } = await withApiKey(() => 
      supabase
        .from('lead_extensions')
        .select(`
          lead_status,
          persons!inner(assigned_to)
        `)
        .eq('persons.assigned_to', userId)
        .eq('persons.is_lead', true)
        .eq('persons.active_status', true)
    );

    if (error) throw error;

    // Count leads by stage
    const statusCounts = data.reduce((acc, lead) => {
      const status = lead.lead_status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Convert to array of objects
    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status: status,
      count: count
    }));

    // Sort by count descending
    return statusDistribution.sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error fetching lead status distribution:', error);
    return [];
  }
};

/**
 * Fetch recent messages without responses
 * @returns {Promise<Array>} Array of unanswered messages
 */
export const fetchUnansweredMessages = async () => {
  try {
    // Get current user ID for filtering
    const { data: { user } } = await withApiKey(() => 
      supabase.auth.getUser()
    );
    const userId = user?.id;

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const twoWeeksAgoStr = twoWeeksAgo.toISOString();

    const { data, error } = await withApiKey(() => 
      supabase
        .from('messages')
        .select(`
          id,
          message_type,
          subject,
          content,
          status,
          sent_at,
          has_response,
          persons:recipient_id (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('sender_id', userId)
        .eq('has_response', false)
        .eq('status', 'delivered')
        .gte('sent_at', twoWeeksAgoStr)
        .order('sent_at', { ascending: false })
        .limit(5)
    );

    if (error) throw error;

    return data.map(message => ({
      id: message.id,
      type: message.message_type,
      subject: message.subject,
      content: message.content,
      sentAt: message.sent_at,
      personId: message.persons ? message.persons.id : null,
      personName: message.persons ? `${message.persons.first_name} ${message.persons.last_name}` : 'Unknown'
    }));
  } catch (error) {
    console.error('Error fetching unanswered messages:', error);
    return [];
  }
}; 