-- Setup for database management utilities

-- Create a function to execute arbitrary SQL statements
-- This is needed by our migration script to apply complex migrations
CREATE OR REPLACE FUNCTION pgfunction(statement text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE statement;
END;
$$;

-- Create a function to get table column information
-- This is used by our check-schema script
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable text,
  column_default text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
  FROM 
    information_schema.columns
  WHERE 
    table_schema = 'public' AND 
    table_name = table_name
  ORDER BY 
    ordinal_position;
$$; 