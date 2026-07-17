-- Sister share of split spendings (your half stays in transactions).
-- Run after 007_savings_target.sql

create table if not exists public.sister_spendings (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null unique
    references public.transactions (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  card text not null check (card in ('lloyds', 'amex')),
  created_at timestamptz not null default now()
);

create index if not exists sister_spendings_card_idx
  on public.sister_spendings (card);

alter table public.sister_spendings enable row level security;

create policy "Authenticated all sister_spendings"
  on public.sister_spendings for all to authenticated
  using (true) with check (true);
