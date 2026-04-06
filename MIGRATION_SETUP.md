# Database Migrations - Auto-Apply Setup

## ✅ Migration Ready for Auto-Apply

The database migration for `total_remaining` field has been created and is ready to be auto-applied.

**Migration File:** `supabase/migrations/20260406_add_total_remaining_to_archives.sql`

---

## 🚀 How to Apply (Choose One Method)

### Method 1: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Push migrations to your Supabase project
npm run supabase:push
```

Or directly:
```bash
supabase db push
```

### Method 2: Using Supabase Web Dashboard

1. Go to [Supabase Console](https://app.supabase.com)
2. Select your project (`putoiqvxeuwbiuwknohi`)
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy the content from `supabase/migrations/20260406_add_total_remaining_to_archives.sql`
6. Run the query

### Method 3: Automatic (If Using GitHub Actions)

If you have Supabase GitHub integration set up, the migration will be automatically applied when you push to your repository.

---

## 📋 What the Migration Does

```sql
-- Adds new column to track remaining amount at time of archiving
ALTER TABLE archives ADD COLUMN IF NOT EXISTS total_remaining decimal(10,2) DEFAULT 0;

-- Creates index for better query performance
CREATE INDEX IF NOT EXISTS idx_archives_total_remaining ON archives(user_id, total_remaining);
```

---

## ✨ Result After Migration

Once migrated, the archive section will correctly show:

```
⏱️ STATUS AT TIME OF ARCHIVING
   Total Amount Left to Pay: ₹1,150 ✓
```

Instead of showing ₹0.00

---

## 🔍 To Verify Migration Applied

1. Go to Supabase Console
2. Select your project
3. Go to **Table Editor**
4. Find the `archives` table
5. Check for the new `total_remaining` column
6. Column should be visible! ✓

---

## 💡 Quick Reference

- **Project ID:** `putoiqvxeuwbiuwknohi`
- **Migrations Location:** `supabase/migrations/`
- **Config File:** `supabase.json`

---

## 📝 Notes

- The migration uses `IF NOT EXISTS` so it's safe to run multiple times
- Default value is 0 for existing archives
- New archives will be created with the correct `total_remaining` value
- The field is optional in TypeScript (`total_remaining?: number`)

