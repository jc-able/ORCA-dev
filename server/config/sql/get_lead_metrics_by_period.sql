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