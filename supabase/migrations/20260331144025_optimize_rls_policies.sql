/*
  # Optimize RLS Policies Performance

  ## Overview
  This migration optimizes RLS policies to use subselect expressions for auth.uid() calls
  to improve query performance at scale. Instead of re-evaluating auth.uid() for each row,
  we cache it once with (SELECT auth.uid()).

  Also removes unused indexes that are not being utilized.

  ## Changes
  1. Drop and recreate all RLS policies with optimized expressions
  2. Remove unused indexes on meals table
*/

-- Drop existing policies and recreate with optimized subselect expressions
-- Members table policies
DROP POLICY IF EXISTS "Users can view own members" ON members;
CREATE POLICY "Users can view own members"
  ON members FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own members" ON members;
CREATE POLICY "Users can insert own members"
  ON members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own members" ON members;
CREATE POLICY "Users can update own members"
  ON members FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own members" ON members;
CREATE POLICY "Users can delete own members"
  ON members FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Meals table policies
DROP POLICY IF EXISTS "Users can view own meals" ON meals;
CREATE POLICY "Users can view own meals"
  ON meals FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own meals" ON meals;
CREATE POLICY "Users can insert own meals"
  ON meals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own meals" ON meals;
CREATE POLICY "Users can update own meals"
  ON meals FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own meals" ON meals;
CREATE POLICY "Users can delete own meals"
  ON meals FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Settings table policies
DROP POLICY IF EXISTS "Users can view own settings" ON settings;
CREATE POLICY "Users can view own settings"
  ON settings FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own settings" ON settings;
CREATE POLICY "Users can insert own settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own settings" ON settings;
CREATE POLICY "Users can update own settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Archives table policies
DROP POLICY IF EXISTS "Users can view own archives" ON archives;
CREATE POLICY "Users can view own archives"
  ON archives FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own archives" ON archives;
CREATE POLICY "Users can insert own archives"
  ON archives FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own archives" ON archives;
CREATE POLICY "Users can delete own archives"
  ON archives FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Remove unused indexes
DROP INDEX IF EXISTS idx_meals_user_id;
DROP INDEX IF EXISTS idx_meals_member_id;

-- Keep the most essential indexes for query performance
-- user_id indexes are still useful for filtering by user
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_user_archived ON meals(user_id, archived);
CREATE INDEX IF NOT EXISTS idx_archives_user_id ON archives(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);
