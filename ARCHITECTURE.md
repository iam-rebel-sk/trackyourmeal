# TrackYourMeal architecture

This document describes the production architecture, data ownership, critical
business rules, and deployment paths for TrackYourMeal.

## 1. System overview

```text
Browser
  │
  ├─ React + TypeScript + Vite frontend
  │    ├─ AuthProvider
  │    ├─ AppContent route/state gate
  │    ├─ Dashboard
  │    ├─ History
  │    └─ Settings
  │
  └─ Supabase JavaScript client
       ├─ Auth API
       ├─ PostgREST database API
       └─ Realtime channels

Supabase project
  ├─ Auth users
  ├─ PostgreSQL tables
  ├─ Row Level Security policies
  └─ Realtime publication

GitHub main
  ├─ Vercel build and production deployment
  └─ GitHub Actions → Supabase migration deployment
```

The browser communicates directly with Supabase using the public anon or
publishable key. Authorization is enforced by Supabase Auth and PostgreSQL RLS,
not by trusting frontend filters.

## 2. Frontend composition

### Entry and configuration

- `src/main.tsx` mounts the React application.
- `src/App.tsx` checks `isSupabaseConfigured` before rendering the app. A
  visible setup screen is shown when required `VITE_` variables are missing.
- `AuthProvider` restores the Supabase session and listens for auth changes.
- `AppContent` checks whether the authenticated user has members and selects
  `MemberSetup` or the main navigation.

### Page responsibilities

| Module | Responsibility |
| --- | --- |
| `Landing` | Switches between landing, sign-in, and sign-up views |
| `SignIn` / `SignUp` | Validate credentials and display Auth errors |
| `MemberSetup` | Create the initial 2–4 members and settings row |
| `Dashboard` | Load active meals, calculate balances, record payments, archive |
| `History` | Display visible payments and archive snapshots |
| `Settings` | Update price, add/remove members, sign out |

### Shared UI

Drawers collect meal and payment input without changing the page route.
`Toast`, `SuccessAnimation`, confirmation dialogs, skeleton components, and
`ErrorBoundary` provide feedback and resilience around asynchronous operations.

## 3. Data model

```text
auth.users
    │
    ├── members.user_id
    ├── meals.user_id
    ├── settings.user_id (unique)
    ├── payments.user_id
    └── archives.user_id

members ──< meals
```

### `members`

```text
id          uuid primary key
user_id     uuid → auth.users
name        text
created_at  timestamptz
```

### `meals`

```text
id             uuid primary key
user_id        uuid → auth.users
member_id      uuid → members
meal_date      date
meal_type      lunch | dinner
price_at_time  decimal(10,2)
archived       boolean
created_at     timestamptz
```

`price_at_time` is a snapshot. Updating the global price affects only future
meal entries.

### `settings`

```text
id                uuid primary key
user_id           uuid unique → auth.users
global_meal_price decimal(10,2)
created_at        timestamptz
updated_at        timestamptz
```

### `payments`

```text
id                  uuid primary key
user_id             uuid → auth.users
payment_date        timestamptz
total_paid          decimal(10,2)
description         text
payment_breakdown   jsonb
created_at          timestamptz
deleted_at          timestamptz nullable
```

`payment_breakdown` maps member IDs to names and amounts:

```json
{
  "member-id": {
    "name": "Member 1",
    "amount": 80
  }
}
```

`deleted_at` implements soft deletion. A non-null value means the transaction
is hidden from History but remains available to balance calculations.

### `archives`

```text
id               uuid primary key
user_id          uuid → auth.users
archived_at      timestamptz
total_amount     decimal(10,2)
meal_count       integer
snapshot_data    jsonb
price_at_archive decimal(10,2)
total_remaining  decimal(10,2) when supported by the migration
```

An archive stores a historical snapshot so later edits to members, meals, or
prices do not change the displayed historical period.

## 4. Security model

All application tables enable RLS. Policies use the authenticated user's ID:

```sql
auth.uid() = user_id
```

The database, not the client, enforces ownership for select, insert, update,
and delete operations. The browser must only receive:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The service-role key, database password, pooler URI, and Supabase access token
must remain in server-side or GitHub/Vercel secret stores.

## 5. Payment calculation rules

### Current period boundary

Dashboard loads the most recent archive timestamp. A payment belongs to the
current period only when:

```text
payment.payment_date > latest_archive.archived_at
```

Payments at or before the latest archive belong to the archived period.

### Per-member balance

For each member:

```text
meal_total = sum(active meal price_at_time)
paid_total = sum(payment_breakdown[member_id].amount)
remaining  = max(0, meal_total - paid_total)
```

Only active (`archived = false`) meals are used for the current Dashboard.
Payments are not excluded solely because they are soft-deleted; this is what
preserves accounting after a History deletion.

### Manual full-payment archive

The order is important:

1. Load the latest payment data.
2. Calculate each member's remaining amount.
3. Insert a settlement payment for outstanding amounts.
4. Insert the archive snapshot.
5. Mark the current meals as archived.

The settlement payment must be inserted before the archive so it is included in
the period being archived and excluded from the next period.

## 6. Soft-delete behavior

History deletion uses an update:

```sql
UPDATE payments
SET deleted_at = now()
WHERE id = :payment_id
  AND user_id = auth.uid();
```

History queries use:

```text
deleted_at IS NULL
```

Dashboard queries intentionally do not apply that filter. This produces the
desired behavior:

```text
Meals:   ₹120
Payment: ₹80, hidden from History
Balance: ₹40
```

The payment row remains available for audit and accounting. A future retention
job could permanently remove old soft-deleted rows if storage policy requires
it.

## 7. Realtime behavior

Dashboard subscribes to Supabase Postgres changes for `meals` and `payments`.
Any matching change triggers a fresh data load. The subscription cleanup
function unsubscribes channels when Dashboard unmounts or the user changes.

The application still performs explicit reloads after mutations so user actions
do not depend solely on realtime delivery.

## 8. Migration history

Migrations are ordered by filename and applied by Supabase CLI:

1. `20260330185617_create_meal_tracker_schema.sql`
   - Creates members, meals, settings, and archives
   - Adds initial RLS policies and indexes
2. `20260331144025_optimize_rls_policies.sql`
   - Rebuilds RLS policies with cached `auth.uid()` expressions
3. `20260404222642_create_payments_table.sql`
   - Creates payments and payment RLS policies
4. `20260406_add_total_remaining_to_archives.sql`
   - Adds archive remaining-total support
5. `20261108215000_soft_delete_payments.sql`
   - Adds `payments.deleted_at`
   - Adds active-payment index
   - Adds payment update policy for soft deletion

## 9. CI/CD

### Vercel

Pushes to `main` trigger a Vercel production build:

```text
npm run build
dist/
```

Vercel must define `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the
production environment. Vite embeds these values at build time.

### GitHub Actions

`.github/workflows/supabase-migrate.yml` runs when migration files change or
when manually dispatched. It runs:

```bash
supabase db push --db-url "$SUPABASE_DB_URL" --yes
```

The workflow uses repository secrets:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_URL`

The pooler URL is required for reliable GitHub-hosted runner connectivity.

## 10. Operational guidance

- Never commit `.env.local`, database URLs, passwords, or service keys.
- Keep email confirmation enabled in production unless there is a deliberate
  alternative verification flow.
- Apply schema changes through a new migration; do not edit an already-applied
  migration.
- Test period boundaries after changing archive or payment behavior.
- Run `npm run typecheck` and `npm run build` before publishing frontend changes.
