# Dashboard Components

This directory previously contained visualization components for the dashboard, including charts and lead pipeline status displays. 

In a recent update, we've moved away from chart-based visualizations to a more action-oriented dashboard that focuses on:

1. High-priority information that requires immediate attention
2. Upcoming appointments and scheduled follow-ups
3. Key metrics displayed in a simplified, user-friendly format

This change better aligns with the core purpose of the dashboard - to help salespeople quickly identify which leads need attention and what actions they should take next.

## Current Implementation

The dashboard now focuses on actionable data sections:

- **Immediate Attention Required**
  - High-Value Opportunities (prioritized leads)
  - Upcoming Appointments 
  - Scheduled Follow-Ups
  - Recent Activity

- **Key Metrics**
  - Lead Status Distribution
  - Unanswered Messages

This approach ensures salespeople can quickly identify which leads need attention without having to interpret complex visualizations.

## Future Components

If we decide to add visualization components in the future, they'll be placed in this directory and will focus on actionability rather than just data representation.

## Components

### LeadMetricsChart

A line chart that displays lead creation and conversion metrics over time. Users can toggle between different time periods (week, month, quarter, year).

**Props:**
- `data`: Array of metrics data points with `date`, `new_leads`, `converted_leads`, and `conversion_rate`
- `onPeriodChange`: Callback function when time period is changed
- `period`: Current selected period ('week', 'month', 'quarter', 'year')
- `loading`: Boolean indicating if data is loading

### ReferralSourceChart

A donut chart that shows the distribution of leads by referral source.

**Props:**
- `data`: Array of objects with `source` and `count` properties
- `loading`: Boolean indicating if data is loading

### LeadPipelineStatus

Visualizes the distribution of leads across pipeline stages with progress bars and statistics.

**Props:**
- `stageData`: Object with stage names as keys and counts as values
- `totalLeads`: Total number of leads
- `loading`: Boolean indicating if data is loading

## Supabase SQL Function Setup

The dashboard relies on a SQL function in Supabase to calculate lead metrics. Follow these steps to set it up:

1. Go to your Supabase project SQL Editor
2. Execute the SQL function from `server/config/sql/get_lead_metrics_by_period.sql`:

```sql
-- Function to calculate lead metrics by time period
CREATE OR REPLACE FUNCTION get_lead_metrics_by_period(
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  period_interval TEXT, -- '1 day', '1 week', '1 month'
  user_id UUID
)
RETURNS TABLE (
  date TEXT,
  new_leads INTEGER,
  converted_leads INTEGER,
  conversion_rate NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    -- Generate a series of dates based on the period_interval
    SELECT 
      date_trunc(
        CASE 
          WHEN period_interval = '1 day' THEN 'day'
          WHEN period_interval = '1 week' THEN 'week'
          WHEN period_interval = '1 month' THEN 'month'
          ELSE 'day'
        END,
        series_date
      ) AS trunc_date
    FROM generate_series(
      start_date,
      end_date,
      period_interval::INTERVAL
    ) AS series_date
  ),
  
  -- Get new leads created in each period
  new_leads_data AS (
    SELECT
      date_trunc(
        CASE 
          WHEN period_interval = '1 day' THEN 'day'
          WHEN period_interval = '1 week' THEN 'week'
          WHEN period_interval = '1 month' THEN 'month'
          ELSE 'day'
        END,
        created_at
      ) AS trunc_date,
      COUNT(*) AS new_lead_count
    FROM persons
    WHERE 
      is_lead = TRUE AND
      assigned_to = user_id AND
      created_at BETWEEN start_date AND end_date
    GROUP BY trunc_date
  ),
  
  -- Get converted leads (when status changed to 'won') in each period
  converted_leads_data AS (
    SELECT
      date_trunc(
        CASE 
          WHEN period_interval = '1 day' THEN 'day'
          WHEN period_interval = '1 week' THEN 'week'
          WHEN period_interval = '1 month' THEN 'month'
          ELSE 'day'
        END,
        updated_at
      ) AS trunc_date,
      COUNT(*) AS converted_lead_count
    FROM lead_extensions le
    JOIN persons p ON le.person_id = p.id
    WHERE 
      le.lead_status = 'won' AND
      p.assigned_to = user_id AND
      le.updated_at BETWEEN start_date AND end_date
    GROUP BY trunc_date
  )
  
  -- Join the series with the lead data and calculate metrics
  SELECT
    to_char(ds.trunc_date, 'YYYY-MM-DD') AS date,
    COALESCE(nld.new_lead_count, 0) AS new_leads,
    COALESCE(cld.converted_lead_count, 0) AS converted_leads,
    CASE 
      WHEN COALESCE(nld.new_lead_count, 0) > 0 THEN
        COALESCE(cld.converted_lead_count, 0)::NUMERIC / COALESCE(nld.new_lead_count, 1)
      ELSE 0
    END AS conversion_rate
  FROM date_series ds
  LEFT JOIN new_leads_data nld ON ds.trunc_date = nld.trunc_date
  LEFT JOIN converted_leads_data cld ON ds.trunc_date = cld.trunc_date
  ORDER BY ds.trunc_date;
END;
$$;
```

3. Test the function with a sample query:

```sql
SELECT * FROM get_lead_metrics_by_period(
  '2023-01-01'::TIMESTAMP,
  '2023-12-31'::TIMESTAMP,
  '1 month',
  'YOUR_USER_ID_HERE'::UUID
);
```

## Data Service Integration

The dashboard components are connected to Supabase through the `dashboardService.js` file, which provides the following functions:

- `fetchDashboardData()`: Gets all dashboard data including leads, referrals, appointments, and activity
- `fetchLeadConversionMetrics(period)`: Gets time-series data for lead metrics chart
- `getReferralSourceDistribution()`: Gets data for the referral sources chart

All these functions include fallback data in case of API errors, ensuring the dashboard remains functional during development or connectivity issues.

## Usage Example

```jsx
import { useState, useEffect } from 'react';
import LeadMetricsChart from '../components/dashboard/LeadMetricsChart';
import { fetchLeadConversionMetrics } from '../services/dashboardService';

function DashboardPage() {
  const [metricsData, setMetricsData] = useState([]);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchLeadConversionMetrics(period);
      setMetricsData(data);
      setLoading(false);
    };
    
    loadData();
  }, [period]);
  
  return (
    <LeadMetricsChart
      data={metricsData}
      onPeriodChange={setPeriod}
      period={period}
      loading={loading}
    />
  );
}
``` 