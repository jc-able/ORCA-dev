import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Button,
  Tooltip,
  Chip,
  CardHeader,
  IconButton,
  CardActions
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  AccessTime as AccessTimeIcon,
  Share as ShareIcon,
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  Phone as PhoneIcon,
  Mail as MailIcon,
  Event as EventIcon,
  Notifications as NotificationsIcon,
  LocalFireDepartment as HotIcon,
  WatchLater as WatchLaterIcon
} from '@mui/icons-material';

// Import services
import { 
  fetchDashboardData, 
  fetchPriorityLeads,
  fetchUpcomingAppointments,
  fetchFollowUpLeads,
  fetchLeadStatusDistribution,
  fetchUnansweredMessages
} from '../services/dashboardService';

/**
 * Dashboard page component
 * Main entry point after login, displays key metrics and action items using data from Supabase
 * Shows most critical information that needs immediate attention
 */
function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [priorityLeadsLoading, setPriorityLeadsLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [followUpLoading, setFollowUpLoading] = useState(true);
  const [statusDistributionLoading, setStatusDistributionLoading] = useState(true);
  const [unansweredMessagesLoading, setUnansweredMessagesLoading] = useState(true);
  
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
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
  });
  
  // State for new action-focused data
  const [priorityLeads, setPriorityLeads] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [followUpLeads, setFollowUpLeads] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [unansweredMessages, setUnansweredMessages] = useState([]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Format relative time (e.g., "2 hours ago")
  const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) {
      return diffMins <= 1 ? 'just now' : `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays < 30) {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else {
      return formatDate(dateString).split(',')[0]; // Return just the date part
    }
  };

  // Get status color based on lead status
  const getStatusColor = (status) => {
    const statusMap = {
      'new': 'primary',
      'contacted': 'info',
      'appointment_scheduled': 'secondary',
      'appointment_completed': 'success',
      'proposal_made': 'warning',
      'negotiation': 'warning',
      'won': 'success',
      'lost': 'error',
      'nurturing': 'info',
      'New': 'primary',
      'Contacted': 'info',
      'Appointment Scheduled': 'secondary',
      'Appointment Completed': 'success',
      'Proposal Made': 'warning',
      'Negotiation': 'warning',
      'Won': 'success',
      'Lost': 'error',
      'Nurturing': 'info'
    };
    
    return statusMap[status] || 'default';
  };

  // Fetch dashboard data on component mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const data = await fetchDashboardData();
        setDashboardData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);
  
  // Fetch priority leads that need attention
  useEffect(() => {
    const loadPriorityLeads = async () => {
      try {
        setPriorityLeadsLoading(true);
        const leads = await fetchPriorityLeads();
        setPriorityLeads(leads);
        setPriorityLeadsLoading(false);
      } catch (error) {
        console.error('Error loading priority leads:', error);
        setPriorityLeadsLoading(false);
      }
    };
    
    loadPriorityLeads();
  }, []);
  
  // Fetch upcoming appointments
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setAppointmentsLoading(true);
        const apts = await fetchUpcomingAppointments();
        setAppointments(apts);
        setAppointmentsLoading(false);
      } catch (error) {
        console.error('Error loading appointments:', error);
        setAppointmentsLoading(false);
      }
    };
    
    loadAppointments();
  }, []);
  
  // Fetch leads needing follow-up
  useEffect(() => {
    const loadFollowUpLeads = async () => {
      try {
        setFollowUpLoading(true);
        const leads = await fetchFollowUpLeads();
        setFollowUpLeads(leads);
        setFollowUpLoading(false);
      } catch (error) {
        console.error('Error loading follow-up leads:', error);
        setFollowUpLoading(false);
      }
    };
    
    loadFollowUpLeads();
  }, []);
  
  // Fetch lead status distribution
  useEffect(() => {
    const loadStatusDistribution = async () => {
      try {
        setStatusDistributionLoading(true);
        const distribution = await fetchLeadStatusDistribution();
        setStatusDistribution(distribution);
        setStatusDistributionLoading(false);
      } catch (error) {
        console.error('Error loading status distribution:', error);
        setStatusDistributionLoading(false);
      }
    };
    
    loadStatusDistribution();
  }, []);
  
  // Fetch unanswered messages
  useEffect(() => {
    const loadUnansweredMessages = async () => {
      try {
        setUnansweredMessagesLoading(true);
        const messages = await fetchUnansweredMessages();
        setUnansweredMessages(messages);
        setUnansweredMessagesLoading(false);
      } catch (error) {
        console.error('Error loading unanswered messages:', error);
        setUnansweredMessagesLoading(false);
      }
    };
    
    loadUnansweredMessages();
  }, []);

  if (loading && priorityLeadsLoading && appointmentsLoading && followUpLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="medium">
          Dashboard
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          component={Link}
          to="/leads/new"
        >
          Add New Lead
        </Button>
      </Box>
      
      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <PeopleIcon />
                </Avatar>
                <Typography variant="h6" component="div">
                  Total Leads
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                {dashboardData.leadsData.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {dashboardData.leadsData.newThisWeek} new this week
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <TrendingUpIcon />
                </Avatar>
                <Typography variant="h6" component="div">
                  Conversion Rate
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                {dashboardData.leadsData.conversion}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Based on closed leads
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <AccessTimeIcon />
                </Avatar>
                <Typography variant="h6" component="div">
                  Appointments
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ color: 'info.main', fontWeight: 'bold' }}>
                {appointments.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upcoming this week
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  <ShareIcon />
                </Avatar>
                <Typography variant="h6" component="div">
                  Referrals
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ color: 'secondary.main', fontWeight: 'bold' }}>
                {dashboardData.referralsData.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {dashboardData.referralsData.newThisMonth} new this month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Action Items & Immediate Attention Required Section */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        Needs Immediate Attention
      </Typography>
      
      <Grid container spacing={3}>
        {/* Priority Leads */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader 
              title="High-Value Opportunities" 
              titleTypographyProps={{ variant: 'h6' }}
              avatar={
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <HotIcon />
                </Avatar>
              }
            />
            <Divider />
            {priorityLeadsLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                <CircularProgress />
              </Box>
            ) : priorityLeads.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" p={3} height="200px">
                <Typography variant="body2" color="text.secondary">
                  No high-priority leads at the moment.
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {priorityLeads.map((lead) => (
                  <React.Fragment key={lead.id}>
                    <ListItem
                      component={Link}
                      to={`/leads/${lead.id}`}
                      sx={{ 
                        textDecoration: 'none', 
                        color: 'text.primary',
                        transition: 'background-color 0.2s',
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                      secondaryAction={
                        <Box display="flex" gap={1}>
                          {lead.phone && (
                            <Tooltip title={`Call ${lead.name}`}>
                              <IconButton 
                                component="a" 
                                href={`tel:${lead.phone}`}
                                size="small"
                                color="primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <PhoneIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          {lead.email && (
                            <Tooltip title={`Email ${lead.name}`}>
                              <IconButton 
                                component="a" 
                                href={`mailto:${lead.email}`}
                                size="small"
                                color="primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MailIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: lead.temperature === 'hot' ? 'error.main' : 'warning.main' }}>
                          {lead.name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={lead.name}
                        secondary={
                          <Box>
                            <Chip 
                              label={lead.status} 
                              size="small" 
                              color={getStatusColor(lead.status)}
                              sx={{ mr: 1, mb: 0.5 }} 
                            />
                            {lead.temperature === 'hot' && (
                              <Chip 
                                label="Hot" 
                                size="small" 
                                color="error"
                                icon={<HotIcon fontSize="small" />}
                                sx={{ mr: 1, mb: 0.5 }} 
                              />
                            )}
                            <Box component="span" display="block" fontSize="small">
                              {lead.lastContacted ? `Last contacted: ${getRelativeTime(lead.lastContacted)}` : 'Never contacted'}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
            <CardActions sx={{ justifyContent: 'flex-end' }}>
              <Button 
                component={Link} 
                to="/leads"
                endIcon={<ArrowForwardIcon />}
                size="small"
              >
                View All Leads
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Upcoming Appointments */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader 
              title="Upcoming Appointments" 
              titleTypographyProps={{ variant: 'h6' }}
              avatar={
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <EventIcon />
                </Avatar>
              }
            />
            <Divider />
            {appointmentsLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                <CircularProgress />
              </Box>
            ) : appointments.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" p={3} height="200px">
                <Typography variant="body2" color="text.secondary">
                  No upcoming appointments scheduled.
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {appointments.map((appointment) => (
                  <React.Fragment key={appointment.id}>
                    <ListItem
                      component={Link}
                      to={`/referrals/${appointment.personId}`}
                      sx={{ 
                        textDecoration: 'none', 
                        color: 'text.primary',
                        transition: 'background-color 0.2s',
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                      secondaryAction={
                        <Box display="flex" gap={1}>
                          {appointment.phone && (
                            <Tooltip title={`Call ${appointment.name}`}>
                              <IconButton 
                                component="a" 
                                href={`tel:${appointment.phone}`}
                                size="small"
                                color="primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <PhoneIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          {appointment.calendarEventId && (
                            <Tooltip title="View in Calendar">
                              <IconButton 
                                component="a" 
                                href={`https://calendar.google.com/calendar/event?eid=${appointment.calendarEventId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                size="small"
                                color="primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <EventIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.main' }}>
                          {appointment.name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={appointment.name}
                        secondary={
                          <Box>
                            <Box component="span" display="block" fontWeight="medium">
                              {formatDate(appointment.date)}
                            </Box>
                            <Chip 
                              label={appointment.status || 'Scheduled'} 
                              size="small" 
                              color="info"
                              sx={{ mr: 1, mb: 0.5 }} 
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
            <CardActions sx={{ justifyContent: 'flex-end' }}>
              <Button 
                component={Link} 
                to="/calendar"
                endIcon={<ArrowForwardIcon />}
                size="small"
              >
                View Calendar
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Follow-Up Leads */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader 
              title="Scheduled Follow-Ups" 
              titleTypographyProps={{ variant: 'h6' }}
              avatar={
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <WatchLaterIcon />
                </Avatar>
              }
            />
            <Divider />
            {followUpLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                <CircularProgress />
              </Box>
            ) : followUpLeads.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" p={3} height="200px">
                <Typography variant="body2" color="text.secondary">
                  No follow-ups scheduled for the next 3 days.
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {followUpLeads.map((lead) => (
                  <React.Fragment key={lead.id}>
                    <ListItem
                      component={Link}
                      to={`/leads/${lead.id}`}
                      sx={{ 
                        textDecoration: 'none', 
                        color: 'text.primary',
                        transition: 'background-color 0.2s',
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                      secondaryAction={
                        <Box display="flex" gap={1}>
                          {lead.phone && (
                            <Tooltip title={`Call ${lead.name}`}>
                              <IconButton 
                                component="a" 
                                href={`tel:${lead.phone}`}
                                size="small"
                                color="primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <PhoneIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          {lead.email && (
                            <Tooltip title={`Email ${lead.name}`}>
                              <IconButton 
                                component="a" 
                                href={`mailto:${lead.email}`}
                                size="small"
                                color="primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MailIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          {lead.name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={lead.name}
                        secondary={
                          <Box>
                            <Box component="span" display="block" fontWeight="medium">
                              Follow-up: {formatDate(lead.nextContact)}
                            </Box>
                            <Chip 
                              label={lead.status} 
                              size="small" 
                              color={getStatusColor(lead.status)}
                              sx={{ mr: 1, mb: 0.5 }} 
                            />
                            {lead.temperature === 'hot' && (
                              <Chip 
                                label="Hot" 
                                size="small" 
                                color="error"
                                sx={{ mr: 1, mb: 0.5 }} 
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
            <CardActions sx={{ justifyContent: 'flex-end' }}>
              <Button 
                component={Link} 
                to="/leads"
                endIcon={<ArrowForwardIcon />}
                size="small"
              >
                View All Leads
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader 
              title="Recent Activity" 
              titleTypographyProps={{ variant: 'h6' }}
              avatar={
                <Avatar sx={{ bgcolor: 'grey.600' }}>
                  <NotificationsIcon />
                </Avatar>
              }
            />
            <Divider />
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                <CircularProgress />
              </Box>
            ) : dashboardData.recentActivity.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" p={3} height="200px">
                <Typography variant="body2" color="text.secondary">
                  No recent activity to display.
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {dashboardData.recentActivity.map((activity) => (
                  <React.Fragment key={activity.id}>
                    <ListItem
                      component={Link}
                      to={`/people/${activity.personId}`}
                      sx={{ 
                        textDecoration: 'none', 
                        color: 'text.primary',
                        transition: 'background-color 0.2s',
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar>
                          {activity.name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.name}
                        secondary={
                          <Box>
                            <Box component="span" display="block" fontWeight="medium">
                              {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                            </Box>
                            <Box component="span" display="block" fontSize="small">
                              {getRelativeTime(activity.date)}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
            <CardActions sx={{ justifyContent: 'flex-end' }}>
              <Button 
                component={Link} 
                to="/communications"
                endIcon={<ArrowForwardIcon />}
                size="small"
              >
                View All Activity
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
      
      {/* Metrics Section */}
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Key Metrics
      </Typography>
      
      <Grid container spacing={3}>
        {/* Lead Status Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Lead Status Distribution"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <Divider />
            {statusDistributionLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" p={3} height="200px">
                <CircularProgress />
              </Box>
            ) : statusDistribution.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" p={3} height="200px">
                <Typography variant="body2" color="text.secondary">
                  No lead status data available.
                </Typography>
              </Box>
            ) : (
              <CardContent>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {statusDistribution.map((item) => (
                    <Chip
                      key={item.status}
                      label={`${item.status}: ${item.count}`}
                      color={getStatusColor(item.status)}
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Box>
              </CardContent>
            )}
            <CardActions sx={{ justifyContent: 'flex-end' }}>
              <Button 
                component={Link} 
                to="/leads"
                endIcon={<ArrowForwardIcon />}
                size="small"
              >
                View Pipeline
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Recent Messages */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Unanswered Messages"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <Divider />
            {unansweredMessagesLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" p={3} height="200px">
                <CircularProgress />
              </Box>
            ) : unansweredMessages.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" p={3} height="200px">
                <Typography variant="body2" color="text.secondary">
                  No unanswered messages.
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {unansweredMessages.map((message) => (
                  <React.Fragment key={message.id}>
                    <ListItem
                      component={Link}
                      to={`/communications/messages/${message.id}`}
                      sx={{ 
                        textDecoration: 'none', 
                        color: 'text.primary',
                        transition: 'background-color 0.2s',
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: message.type === 'email' ? 'primary.main' : 'secondary.main' }}>
                          {message.type === 'email' ? <MailIcon /> : <PhoneIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={message.personName}
                        secondary={
                          <Box>
                            <Box component="span" display="block" fontWeight="medium">
                              {message.subject || 'No subject'}
                            </Box>
                            <Box component="span" display="block" fontSize="small">
                              Sent {getRelativeTime(message.sentAt)}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
            <CardActions sx={{ justifyContent: 'flex-end' }}>
              <Button 
                component={Link} 
                to="/communications"
                endIcon={<ArrowForwardIcon />}
                size="small"
              >
                View All Messages
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard; 