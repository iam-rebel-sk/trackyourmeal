/*
  # Add total_remaining field to archives table

  This migration adds a field to track the total remaining amount at the time of archiving.
  This helps display the exact amount left to pay before mark as paid was clicked.
*/

ALTER TABLE archives ADD COLUMN IF NOT EXISTS total_remaining decimal(10,2) DEFAULT 0;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_archives_total_remaining ON archives(user_id, total_remaining);
