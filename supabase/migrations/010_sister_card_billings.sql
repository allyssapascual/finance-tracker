-- Per-card paid status for a sister billing month.
-- Run after 009_sister_billing_month.sql

create table if not exists public.sister_card_billings (
  id uuid primary key default gen_random_uuid(),
  year int not null check (year >= 2000 and year <= 2100),
  month int not null check (month >= 1 and month <= 12),
  card text not null check (card in ('lloyds', 'amex')),
  paid boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (year, month, card)
);

alter table public.sister_card_billings enable row level security;

create policy "Authenticated all sister_card_billings"
  on public.sister_card_billings for all to authenticated
  using (true) with check (true);
