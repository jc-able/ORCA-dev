-- ORCA Lead Management Software
-- Row Level Security (RLS) Migration

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_setting('request.jwt.claims', TRUE)::json->>'role' = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get the current user's ID from JWT
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', TRUE)::json->>'sub')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USERS table policies
-- Admins can see all users
CREATE POLICY admin_see_all_users ON users
  FOR SELECT
  USING (is_admin());

-- Users can see their own record
CREATE POLICY users_see_own_record ON users
  FOR SELECT
  USING (id = get_current_user_id());

-- Only admins can create/update/delete users
CREATE POLICY admin_manage_users ON users
  FOR ALL
  USING (is_admin());

-- PERSONS table policies
-- Admins can see and manage all persons
CREATE POLICY admin_manage_all_persons ON persons
  FOR ALL
  USING (is_admin());

-- Salespeople can see persons assigned to them
CREATE POLICY salespeople_see_assigned_persons ON persons
  FOR SELECT
  USING (assigned_to = get_current_user_id() OR is_admin());

-- Salespeople can update persons assigned to them
CREATE POLICY salespeople_update_assigned_persons ON persons
  FOR UPDATE
  USING (assigned_to = get_current_user_id() OR is_admin());

-- LEAD_EXTENSIONS table policies
-- Admins can manage all lead extensions
CREATE POLICY admin_manage_all_lead_extensions ON lead_extensions
  FOR ALL
  USING (is_admin());

-- Salespeople can see lead extensions for their assigned persons
CREATE POLICY salespeople_see_lead_extensions ON lead_extensions
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM persons WHERE persons.id = lead_extensions.person_id AND (persons.assigned_to = get_current_user_id() OR is_admin())));

-- Salespeople can update lead extensions for their assigned persons
CREATE POLICY salespeople_update_lead_extensions ON lead_extensions
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM persons WHERE persons.id = lead_extensions.person_id AND (persons.assigned_to = get_current_user_id() OR is_admin())));

-- REFERRAL_EXTENSIONS table policies
-- Similar policies for referral extensions
CREATE POLICY admin_manage_all_referral_extensions ON referral_extensions
  FOR ALL
  USING (is_admin());

CREATE POLICY salespeople_see_referral_extensions ON referral_extensions
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM persons WHERE persons.id = referral_extensions.person_id AND (persons.assigned_to = get_current_user_id() OR is_admin())));

CREATE POLICY salespeople_update_referral_extensions ON referral_extensions
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM persons WHERE persons.id = referral_extensions.person_id AND (persons.assigned_to = get_current_user_id() OR is_admin())));

-- MEMBER_EXTENSIONS table policies
-- Similar policies for member extensions
CREATE POLICY admin_manage_all_member_extensions ON member_extensions
  FOR ALL
  USING (is_admin());

CREATE POLICY salespeople_see_member_extensions ON member_extensions
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM persons WHERE persons.id = member_extensions.person_id AND (persons.assigned_to = get_current_user_id() OR is_admin())));

CREATE POLICY salespeople_update_member_extensions ON member_extensions
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM persons WHERE persons.id = member_extensions.person_id AND (persons.assigned_to = get_current_user_id() OR is_admin())));

-- RELATIONSHIPS table policies
-- Admins can manage all relationships
CREATE POLICY admin_manage_all_relationships ON relationships
  FOR ALL
  USING (is_admin());

-- Salespeople can see relationships where either person is assigned to them
CREATE POLICY salespeople_see_relationships ON relationships
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM persons WHERE persons.id = relationships.person_a_id AND (persons.assigned_to = get_current_user_id() OR is_admin()))
    OR 
    EXISTS (SELECT 1 FROM persons WHERE persons.id = relationships.person_b_id AND (persons.assigned_to = get_current_user_id() OR is_admin()))
  );

-- Salespeople can update relationships where either person is assigned to them
CREATE POLICY salespeople_update_relationships ON relationships
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM persons WHERE persons.id = relationships.person_a_id AND (persons.assigned_to = get_current_user_id() OR is_admin()))
    OR 
    EXISTS (SELECT 1 FROM persons WHERE persons.id = relationships.person_b_id AND (persons.assigned_to = get_current_user_id() OR is_admin()))
  );

-- INTERACTIONS table policies
-- Admins can manage all interactions
CREATE POLICY admin_manage_all_interactions ON interactions
  FOR ALL
  USING (is_admin());

-- Salespeople can see interactions for their assigned persons
CREATE POLICY salespeople_see_interactions ON interactions
  FOR SELECT
  USING (
    user_id = get_current_user_id()
    OR
    EXISTS (SELECT 1 FROM persons WHERE persons.id = interactions.person_id AND (persons.assigned_to = get_current_user_id() OR is_admin()))
  );

-- Salespeople can create interactions for their assigned persons
CREATE POLICY salespeople_create_interactions ON interactions
  FOR INSERT
  WITH CHECK (
    user_id = get_current_user_id()
    AND
    EXISTS (SELECT 1 FROM persons WHERE persons.id = interactions.person_id AND (persons.assigned_to = get_current_user_id() OR is_admin()))
  );

-- MESSAGES table policies
-- Admins can manage all messages
CREATE POLICY admin_manage_all_messages ON messages
  FOR ALL
  USING (is_admin());

-- Salespeople can see messages they sent or messages to their assigned persons
CREATE POLICY salespeople_see_messages ON messages
  FOR SELECT
  USING (
    sender_id = get_current_user_id()
    OR
    EXISTS (SELECT 1 FROM persons WHERE persons.id = messages.recipient_id AND (persons.assigned_to = get_current_user_id() OR is_admin()))
  );

-- Salespeople can create messages to their assigned persons
CREATE POLICY salespeople_create_messages ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = get_current_user_id()
    AND
    EXISTS (SELECT 1 FROM persons WHERE persons.id = messages.recipient_id AND (persons.assigned_to = get_current_user_id() OR is_admin()))
  ); 