/*
  # Create Payments Table

  1. New Tables
    - `payments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - Household account
      - `payment_date` (timestamptz) - When payment was made
      - `total_paid` (decimal) - Total amount paid in this transaction
      - `description` (text) - Optional payment description
      - `payment_breakdown` (jsonb) - Breakdown of which members contributed what amount
      
  2. Security
    - Enable RLS on `payments` table
    - Add policy for users to view/insert their own payments

  3. Purpose
    - Track partial and full payments with flexible member contributions
    - Store payment breakdown showing who paid what
    - Enable historical payment tracking in History section
*/

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  payment_date timestamptz DEFAULT now() NOT NULL,
  total_paid decimal(10,2) NOT NULL,
  description text DEFAULT '',
  payment_breakdown jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payments"
  ON payments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(user_id, payment_date DESC);