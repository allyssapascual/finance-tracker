-- Remove investment from spending groupings (investments are tracked separately).
-- Run after 004_global_fund_accounts.sql

delete from public.month_grouping_budgets where grouping = 'investment';

-- Drop old check constraints (auto-named from inline CHECK)
alter table public.transactions
  drop constraint if exists transactions_grouping_check;

alter table public.month_grouping_budgets
  drop constraint if exists month_grouping_budgets_grouping_check;

-- Reclassify any legacy spending rows tagged as investment
update public.transactions
set grouping = 'shopping'
where grouping = 'investment';

alter table public.transactions
  add constraint transactions_grouping_check
  check (grouping in ('bills', 'transport', 'shopping', 'tithes', 'housing'));

alter table public.month_grouping_budgets
  add constraint month_grouping_budgets_grouping_check
  check (grouping in ('bills', 'transport', 'shopping', 'tithes', 'housing'));
