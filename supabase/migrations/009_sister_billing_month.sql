-- Billing month for sister share (independent of purchase date on the transaction).
-- Run after 008_sister_spendings.sql

alter table public.sister_spendings
  add column if not exists year int,
  add column if not exists month int;

-- Backfill from the linked transaction's purchase date
update public.sister_spendings s
set
  year = extract(year from t.date)::int,
  month = extract(month from t.date)::int
from public.transactions t
where s.transaction_id = t.id
  and (s.year is null or s.month is null);

-- Any remaining rows without a transaction date fall back to current calendar month
update public.sister_spendings
set
  year = extract(year from now())::int,
  month = extract(month from now())::int
where year is null or month is null;

alter table public.sister_spendings
  alter column year set not null,
  alter column month set not null;

alter table public.sister_spendings
  drop constraint if exists sister_spendings_year_check,
  drop constraint if exists sister_spendings_month_check;

alter table public.sister_spendings
  add constraint sister_spendings_year_check check (year >= 2000 and year <= 2100),
  add constraint sister_spendings_month_check check (month >= 1 and month <= 12);

create index if not exists sister_spendings_year_month_idx
  on public.sister_spendings (year, month);
