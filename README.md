# TrackYourMeal

TrackYourMeal is a household meal and expense tracker. A shared household
account can record meals for multiple members, collect partial payments, see
per-member balances, and archive completed billing periods.

## What the app does

- Email/password authentication through Supabase Auth
- First-use household setup with 2–4 members
- Configurable default meal price
- Lunch and dinner entries for one or more members
- Price snapshots on every meal, so later price changes do not alter old meals
- Individual or equal-split combined payments
- Overpayment protection
- Dashboard totals for meals paid, remaining, and per-member balances
- Payment and archive history
- Archive snapshots containing the meals and member totals for that period
- Confirmation dialogs and success/error feedback for destructive actions
- Soft-deleted payment history: deleting a history item hides it from History but
  keeps its accounting effect in Dashboard
- Responsive dark UI with mobile bottom navigation
- Realtime refresh for meal and payment changes
- Skeleton loading states and an error boundary

## Application flow

1. A user signs up or signs in.
2. The app checks whether the account has members.
3. New accounts complete household setup with 2–4 members and a default price.
4. The Dashboard records meals and calculates each member's current balance.
5. Payments reduce balances without changing the original meal prices.
6. A completed period can be archived. Its snapshot is preserved in `archives`.
7. The next period starts with active, unarchived meals and payments after the
   latest archive boundary.

## Technology

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase Auth, PostgreSQL, Row Level Security, and Realtime
- Lucide React icons
- Vercel production deployment
- GitHub Actions for Supabase migrations

## Local development

### Requirements

- Node.js 18 or newer
- npm
- A Supabase project with the migrations applied

### Install

```bash
git clone https://github.com/iam-rebel-sk/trackyourmeal.git
cd trackyourmeal
npm install
```

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_public_anon_or_publishable_key
```

Only the public anon/publishable key belongs in frontend environment variables.
Never expose a Supabase service-role or secret key in this application.

Start the app:

```bash
npm run dev
```

Open the URL printed by Vite, usually
`http://localhost:5173/`.

## Commands

```bash
npm run dev           # Start Vite development server
npm run build         # Create the production bundle
npm run preview       # Preview the production bundle locally
npm run typecheck     # Run TypeScript without emitting files
npm run lint          # Run ESLint
npm run supabase:push # Apply migrations with a configured Supabase CLI
```

## Repository layout

```text
src/
├── App.tsx                    # Auth gate and top-level page routing
├── components/                # Drawers, navigation, feedback, skeletons
├── contexts/AuthContext.tsx   # Supabase session and auth operations
├── lib/supabase.ts            # Supabase client and shared database types
└── pages/
    ├── Dashboard.tsx          # Meals, balances, payments, archiving
    ├── History.tsx            # Payments and archive snapshots
    ├── Landing.tsx            # Sign-in/sign-up entry point
    ├── MemberSetup.tsx         # First-use household setup
    └── Settings.tsx           # Price, members, and sign-out

supabase/migrations/           # Ordered PostgreSQL schema and policy changes
.github/workflows/             # Automatic migration deployment
ARCHITECTURE.md                # Detailed system design
```

## Database and security

The database contains:

- `members`: household members owned by an authenticated user
- `meals`: meal entries and immutable price snapshots
- `settings`: one default meal price per household
- `payments`: payment transactions and per-member JSON breakdowns
- `archives`: immutable period snapshots

Every application table uses Row Level Security. Policies restrict reads and
writes to rows whose `user_id` equals the authenticated user's ID.

Payment deletion is intentionally a soft delete. The History page updates
`payments.deleted_at`, while Dashboard calculations still include the payment.
This keeps balances correct while allowing the user to hide a transaction from
the visible history.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full data model and flows.

## Automatic database migrations

The workflow in
[.github/workflows/supabase-migrate.yml](./.github/workflows/supabase-migrate.yml)
runs on changes to `supabase/` pushed to `main`. It uses the Supabase session
pooler URL because GitHub-hosted runners may not reach a project's direct
database endpoint.

Configure these GitHub repository secrets:

```text
SUPABASE_ACCESS_TOKEN
SUPABASE_DB_URL
```

`SUPABASE_DB_URL` must be the complete Supabase session-pooler URI with the
database password included and URL-encoded when necessary. Do not commit it.

## Production deployment

The `main` branch is connected to Vercel. Vercel runs `npm run build` and
publishes `dist/`.

Configure these Vercel environment variables for Production, Preview, and
Development:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

After changing Vercel environment variables, redeploy so Vite embeds the new
values in the frontend bundle.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Configuration screen appears | Confirm both `VITE_` variables exist and restart Vite |
| Login fails in production | Check Vercel variable names and environment scope |
| Tables are missing | Check the Supabase migration workflow and its secrets |
| Sign-up returns 429 | Wait for Supabase Auth limits or configure custom SMTP |
| Dashboard shows old payment totals | Confirm the payment row was soft-deleted, not removed before the soft-delete migration |
| Realtime does not refresh | Check Supabase Realtime/table publication settings |

## License

See the repository for the project's licensing terms.
