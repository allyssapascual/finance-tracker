-- Global target amount on each savings account (goal vs monthly current_value).
-- Run after 006_recurring_templates.sql

alter table public.savings_accounts
  add column if not exists target numeric(12, 2) not null default 0
  check (target >= 0);
