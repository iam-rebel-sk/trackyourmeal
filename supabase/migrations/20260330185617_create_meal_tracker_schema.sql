/*
  # Shared Meal Tracker Schema

  ## Overview
  This migration creates the complete database structure for a household meal tracking application
  where multiple members share a single login and track meals with split costs.

  ## New Tables
  
  ### `members`
  Stores household member names (2-4 per account)
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users) - Links to the household account
  - `name` (text) - Member's display name
  - `created_at` (timestamptz) - When member was added
  
  ### `meals`
  Stores individual meal entries with price snapshots
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users) - Household account
  - `member_id` (uuid, references members) - Who ate this meal
  - `meal_date` (date) - When the meal was consumed (manual entry)
  - `meal_type` (text) - 'lunch' or 'dinner'
  - `price_at_time` (decimal) - Price snapshot when meal was logged
  - `archived` (boolean) - Whether this meal has been marked as paid
  - `created_at` (timestamptz) - When entry was created
  
  ### `settings`
  Stores per-household configuration
  - `id` (uuid, primary key)
  - `user_id` (uuid, unique, references auth.users) - One setting row per household
  - `global_meal_price` (decimal) - Default price for new meals (default: 60)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `archives`
  Stores historical snapshots when "Mark as Paid" is clicked
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `archived_at` (timestamptz) - When this batch was archived
  - `total_amount` (decimal) - Grand total for this period
  - `meal_count` (integer) - Total number of meals
  - `snapshot_data` (jsonb) - Complete breakdown with member splits and meal list
  - `price_at_archive` (decimal) - The global price at time of archiving

  ## Security
  All tables have RLS enabled with policies ensuring users can only access their own household data.
*/

-- Create members table
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create meals table
CREATE TABLE IF NOT EXISTS meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  meal_date date NOT NULL,
  meal_type text NOT NULL CHECK (meal_type IN ('lunch', 'dinner')),
  price_at_time decimal(10,2) NOT NULL,
  archived boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  global_meal_price decimal(10,2) DEFAULT 60.00 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create archives table
CREATE TABLE IF NOT EXISTS archives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  archived_at timestamptz DEFAULT now() NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  meal_count integer NOT NULL,
  snapshot_data jsonb NOT NULL,
  price_at_archive decimal(10,2) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE archives ENABLE ROW LEVEL SECURITY;

-- RLS Policies for members table
CREATE POLICY "Users can view own members"
  ON members FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own members"
  ON members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own members"
  ON members FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own members"
  ON members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for meals table
CREATE POLICY "Users can view own meals"
  ON meals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals"
  ON meals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals"
  ON meals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals"
  ON meals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for settings table
CREATE POLICY "Users can view own settings"
  ON settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for archives table
CREATE POLICY "Users can view own archives"
  ON archives FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own archives"
  ON archives FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own archives"
  ON archives FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_archived ON meals(user_id, archived);
CREATE INDEX IF NOT EXISTS idx_meals_member_id ON meals(member_id);
CREATE INDEX IF NOT EXISTS idx_archives_user_id ON archives(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);
