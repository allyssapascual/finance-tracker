-- Run this in the Supabase SQL Editor.
-- Single-tenant personal finance tracker (no user_id).

-- Spending transactions
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  description text not null,
  grouping text not null
    check (grouping in ('bills', 'transport', 'shopping', 'tithes', 'housing', 'investment')),
  type text not null
    check (type in ('wants', 'needs', 'goals')),
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create index if not exists transactions_date_idx on public.transactions (date desc);

-- Month plans (phase 2 UI; table created now)
create table if not exists public.month_plans (
  id uuid primary key default gen_random_uuid(),
  year int not null check (year >= 2000 and year <= 2100),
  month int not null check (month >= 1 and month <= 12),
  income_budget numeric(12, 2) not null default 0,
  income_actual numeric(12, 2) not null default 0,
  expense_budget numeric(12, 2) not null default 0,
  savings_budget numeric(12, 2) not null default 0,
  savings_actual numeric(12, 2) not null default 0,
  savings_hy_budget numeric(12, 2) not null default 0,
  savings_hy_actual numeric(12, 2) not null default 0,
  savings_car_budget numeric(12, 2) not null default 0,
  savings_car_actual numeric(12, 2) not null default 0,
  savings_travel_budget numeric(12, 2) not null default 0,
  savings_travel_actual numeric(12, 2) not null default 0,
  savings_emergency_budget numeric(12, 2) not null default 0,
  savings_emergency_actual numeric(12, 2) not null default 0,
  savings_rainy_day_budget numeric(12, 2) not null default 0,
  savings_rainy_day_actual numeric(12, 2) not null default 0,
  invest_budget numeric(12, 2) not null default 0,
  invest_actual numeric(12, 2) not null default 0,
  invest_ss_budget numeric(12, 2) not null default 0,
  invest_ss_actual numeric(12, 2) not null default 0,
  invest_house_budget numeric(12, 2) not null default 0,
  invest_house_actual numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (year, month)
);

-- Authenticated-only RLS (single personal user)
alter table public.transactions enable row level security;
alter table public.month_plans enable row level security;

create policy "Authenticated can select transactions"
  on public.transactions for select
  to authenticated
  using (true);

create policy "Authenticated can insert transactions"
  on public.transactions for insert
  to authenticated
  with check (true);

create policy "Authenticated can update transactions"
  on public.transactions for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can delete transactions"
  on public.transactions for delete
  to authenticated
  using (true);

create policy "Authenticated can select month_plans"
  on public.month_plans for select
  to authenticated
  using (true);

create policy "Authenticated can insert month_plans"
  on public.month_plans for insert
  to authenticated
  with check (true);

create policy "Authenticated can update month_plans"
  on public.month_plans for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can delete month_plans"
  on public.month_plans for delete
  to authenticated
  using (true);
