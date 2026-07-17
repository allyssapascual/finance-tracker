-- Add current value fields for savings and investment buckets.
-- Run in Supabase SQL Editor after 001_init.sql.

alter table public.month_plans
  add column if not exists savings_hy_current numeric(12, 2) not null default 0,
  add column if not exists savings_car_current numeric(12, 2) not null default 0,
  add column if not exists savings_travel_current numeric(12, 2) not null default 0,
  add column if not exists savings_emergency_current numeric(12, 2) not null default 0,
  add column if not exists savings_rainy_day_current numeric(12, 2) not null default 0,
  add column if not exists invest_ss_current numeric(12, 2) not null default 0,
  add column if not exists invest_house_current numeric(12, 2) not null default 0;
