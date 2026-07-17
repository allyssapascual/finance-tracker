-- Global savings/investment accounts; monthly budget/actual/current only.
-- Run after 003_totals_items.sql

create table if not exists public.savings_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.savings_month_values (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.savings_accounts (id) on delete cascade,
  year int not null check (year >= 2000 and year <= 2100),
  month int not null check (month >= 1 and month <= 12),
  budget numeric(12, 2) not null default 0 check (budget >= 0),
  actual numeric(12, 2) not null default 0 check (actual >= 0),
  current_value numeric(12, 2) not null default 0 check (current_value >= 0),
  unique (account_id, year, month)
);

create table if not exists public.investment_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.investment_month_values (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.investment_accounts (id) on delete cascade,
  year int not null check (year >= 2000 and year <= 2100),
  month int not null check (month >= 1 and month <= 12),
  budget numeric(12, 2) not null default 0 check (budget >= 0),
  actual numeric(12, 2) not null default 0 check (actual >= 0),
  current_value numeric(12, 2) not null default 0 check (current_value >= 0),
  unique (account_id, year, month)
);

alter table public.savings_accounts enable row level security;
alter table public.savings_month_values enable row level security;
alter table public.investment_accounts enable row level security;
alter table public.investment_month_values enable row level security;

create policy "Authenticated all savings_accounts"
  on public.savings_accounts for all to authenticated
  using (true) with check (true);

create policy "Authenticated all savings_month_values"
  on public.savings_month_values for all to authenticated
  using (true) with check (true);

create policy "Authenticated all investment_accounts"
  on public.investment_accounts for all to authenticated
  using (true) with check (true);

create policy "Authenticated all investment_month_values"
  on public.investment_month_values for all to authenticated
  using (true) with check (true);

-- Migrate rows from legacy per-month tables (if they have data)
insert into public.savings_accounts (name)
select d.name
from (select distinct trim(name) as name from public.savings_items) d
where d.name <> ''
  and not exists (
    select 1 from public.savings_accounts a where a.name = d.name
  );

insert into public.savings_month_values (account_id, year, month, budget, actual, current_value)
select a.id, s.year, s.month, s.budget, s.actual, s.current_value
from public.savings_items s
join public.savings_accounts a on a.name = trim(s.name)
on conflict (account_id, year, month) do update set
  budget = excluded.budget,
  actual = excluded.actual,
  current_value = excluded.current_value;

insert into public.investment_accounts (name)
select d.name
from (select distinct trim(name) as name from public.investment_items) d
where d.name <> ''
  and not exists (
    select 1 from public.investment_accounts a where a.name = d.name
  );

insert into public.investment_month_values (account_id, year, month, budget, actual, current_value)
select a.id, i.year, i.month, i.budget, i.actual, i.current_value
from public.investment_items i
join public.investment_accounts a on a.name = trim(i.name)
on conflict (account_id, year, month) do update set
  budget = excluded.budget,
  actual = excluded.actual,
  current_value = excluded.current_value;
