-- Recurring spending templates (subscriptions / weekly spends).
-- Run after previous migrations.

create table if not exists public.recurring_templates (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  amount numeric(12, 2) not null check (amount > 0),
  grouping text not null
    check (grouping in ('bills', 'transport', 'shopping', 'tithes', 'housing')),
  type text not null
    check (type in ('wants', 'needs', 'goals')),
  frequency text not null
    check (frequency in ('weekly', 'monthly')),
  -- 0 = Sunday … 6 = Saturday (weekly)
  weekday int check (weekday is null or (weekday >= 0 and weekday <= 6)),
  -- 1–28 (monthly); clamped to last day of shorter months when applying
  month_day int check (month_day is null or (month_day >= 1 and month_day <= 28)),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint recurring_weekly_needs_weekday check (
    frequency <> 'weekly' or weekday is not null
  ),
  constraint recurring_monthly_needs_day check (
    frequency <> 'monthly' or month_day is not null
  )
);

alter table public.recurring_templates enable row level security;

create policy "Authenticated all recurring_templates"
  on public.recurring_templates for all to authenticated
  using (true) with check (true);
