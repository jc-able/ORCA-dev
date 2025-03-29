-- Schema Verification Functions
-- These functions support the schema verification script (verifySchema.js)

-- Function to get table and column information
CREATE OR REPLACE FUNCTION public.get_table_info()
RETURNS TABLE (
  table_name text,
  column_name text,
  data_type text,
  is_nullable text,
  column_default text
) LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
  FROM 
    information_schema.columns
  WHERE 
    table_schema = 'public'
    AND table_name IN (
      'persons', 'lead_extensions', 'referral_extensions', 'member_extensions',
      'relationships', 'interactions', 'messages', 'users'
    )
  ORDER BY 
    table_name, ordinal_position;
$$;

-- Function to get constraint information
CREATE OR REPLACE FUNCTION public.get_constraint_info()
RETURNS TABLE (
  table_name text,
  constraint_name text,
  constraint_type text,
  constraint_definition text
) LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    pg_get_constraintdef(pgc.oid) as constraint_definition
  FROM 
    information_schema.table_constraints tc
    JOIN pg_constraint pgc ON tc.constraint_name = pgc.conname
  WHERE 
    tc.table_schema = 'public'
    AND tc.table_name IN (
      'persons', 'lead_extensions', 'referral_extensions', 'member_extensions',
      'relationships', 'interactions', 'messages', 'users'
    )
  ORDER BY 
    tc.table_name, tc.constraint_name;
$$;

-- Function to get index information
CREATE OR REPLACE FUNCTION public.get_index_info()
RETURNS TABLE (
  table_name text,
  index_name text,
  index_definition text
) LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT
    t.relname as table_name,
    i.relname as index_name,
    pg_get_indexdef(i.oid) as index_definition
  FROM
    pg_index idx
    JOIN pg_class i ON i.oid = idx.indexrelid
    JOIN pg_class t ON t.oid = idx.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE
    n.nspname = 'public'
    AND t.relname IN (
      'persons', 'lead_extensions', 'referral_extensions', 'member_extensions',
      'relationships', 'interactions', 'messages', 'users'
    )
  ORDER BY
    t.relname, i.relname;
$$;

-- Helper RPC functions for the verification script
CREATE OR REPLACE FUNCTION public.create_get_table_info()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Function is already created above
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_get_constraint_info()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Function is already created above
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_get_index_info()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Function is already created above
  RETURN;
END;
$$;

-- Grant permissions to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_table_info TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_constraint_info TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_index_info TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_get_table_info TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_get_constraint_info TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_get_index_info TO anon, authenticated; 