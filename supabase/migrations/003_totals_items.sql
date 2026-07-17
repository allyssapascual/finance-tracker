-- Flexible savings/investments + per-grouping budgets.
-- Run in Supabase SQL Editor after 001 and 002.

create table if not exists public.month_grouping_budgets (
  id uuid primary key default gen_random_uuid(),
  year int not null check (year >= 2000 and year <= 2100),
  month int not null check (month >= 1 and month <= 12),
  grouping text not null
    check (grouping in ('bills', 'transport', 'shopping', 'tithes', 'housing', 'investment')),
  budget numeric(12, 2) not null default 0 check (budget >= 0),
  unique (year, month, grouping)
);

create table if not exists public.savings_items (
  id uuid primary key default gen_random_uuid(),
  year int not null check (year >= 2000 and year <= 2100),
  month int not null check (month >= 1 and month <= 12),
  name text not null,
  budget numeric(12, 2) not null default 0 check (budget >= 0),
  actual numeric(12, 2) not null default 0 check (actual >= 0),
  current_value numeric(12, 2) not null default 0 check (current_value >= 0),
  created_at timestamptz not null default now()
);

create index if not exists savings_items_month_idx
  on public.savings_items (year, month);

create table if not exists public.investment_items (
  id uuid primary key default gen_random_uuid(),
  year int not null check (year >= 2000 and year <= 2100),
  month int not null check (month >= 1 and month <= 12),
  name text not null,
  budget numeric(12, 2) not null default 0 check (budget >= 0),
  actual numeric(12, 2) not null default 0 check (actual >= 0),
  current_value numeric(12, 2) not null default 0 check (current_value >= 0),
  created_at timestamptz not null default now()
);

create index if not exists investment_items_month_idx
  on public.investment_items (year, month);

alter table public.month_grouping_budgets enable row level security;
alter table public.savings_items enable row level security;
alter table public.investment_items enable row level security;

create policy "Authenticated select month_grouping_budgets"
  on public.month_grouping_budgets for select to authenticated using (true);
create policy "Authenticated insert month_grouping_budgets"
  on public.month_grouping_budgets for insert to authenticated with check (true);
create policy "Authenticated update month_grouping_budgets"
  on public.month_grouping_budgets for update to authenticated using (true) with check (true);
create policy "Authenticated delete month_grouping_budgets"
  on public.month_grouping_budgets for delete to authenticated using (true);

create policy "Authenticated select savings_items"
  on public.savings_items for select to authenticated using (true);
create policy "Authenticated insert savings_items"
  on public.savings_items for insert to authenticated with check (true);
create policy "Authenticated update savings_items"
  on public.savings_items for update to authenticated using (true) with check (true);
create policy "Authenticated delete savings_items"
  on public.savings_items for delete to authenticated using (true);

create policy "Authenticated select investment_items"
  on public.investment_items for select to authenticated using (true);
create policy "Authenticated insert investment_items"
  on public.investment_items for insert to authenticated with check (true);
create policy "Authenticated update investment_items"
  on public.investment_items for update to authenticated using (true) with check (true);
create policy "Authenticated delete investment_items"
  on public.investment_items for delete to authenticated using (true);
