# Finance Tracker

Personal monthly spending tracker (Next.js + Supabase).

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run in order:
   - [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql)
   - [`supabase/migrations/002_current_values.sql`](supabase/migrations/002_current_values.sql)
   - [`supabase/migrations/003_totals_items.sql`](supabase/migrations/003_totals_items.sql)
   - [`supabase/migrations/004_global_fund_accounts.sql`](supabase/migrations/004_global_fund_accounts.sql)
   - [`supabase/migrations/005_remove_investment_grouping.sql`](supabase/migrations/005_remove_investment_grouping.sql)
   - [`supabase/migrations/006_recurring_templates.sql`](supabase/migrations/006_recurring_templates.sql)
   - [`supabase/migrations/007_savings_target.sql`](supabase/migrations/007_savings_target.sql)
   - [`supabase/migrations/008_sister_spendings.sql`](supabase/migrations/008_sister_spendings.sql)
   - [`supabase/migrations/009_sister_billing_month.sql`](supabase/migrations/009_sister_billing_month.sql)
   - [`supabase/migrations/010_sister_card_billings.sql`](supabase/migrations/010_sister_card_billings.sql)
   - [`supabase/migrations/011_allow_zero_split_amounts.sql`](supabase/migrations/011_allow_zero_split_amounts.sql)
3. **Authentication → Providers**: enable Email
4. **Authentication → Providers → Email**: disable “Confirm email” if you want instant login for a personal app
5. **Authentication → Users**: create your user (email + password)
6. Prefer disabling open signups under Auth settings so only your user exists

### 2. Local env

Copy the example file and fill in values from **Project Settings → API**:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you’ll be redirected to login, then to the year overview dashboard.

## Vercel env vars

In the Vercel project: **Settings → Environment Variables**, add for Production (and Preview if you want):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Same as local |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as local |

Redeploy after saving. Without these, auth and data calls will fail.

## Phase 1–2 features

- Email/password login gate (single-tenant DB, no `user_id`)
- Monthly spending list with prev/next month
- Add / edit / delete spending (date, description, grouping, type, amount)
- Month setup: income + spending budgets per grouping
- Cash summary + expenses-by-grouping (wants/needs/goals)
- Totals: spending by grouping (budget / actual / % used); savings and investments with create/edit/delete (budget, actual, current value)
- Year overview dashboard (home): month links, 4 charts (income / expenses / savings / investments), year table with savings & investment account columns
- Savings goals page (`/savings`): target per savings account vs this month’s current value, with progress bars
- Split spendings: your share on the purchase date; her share on a chosen billing month (defaults to current month); Lloyds due 10th / Amex due 27th on `/sister`; mark each card bill paid/unpaid per month
