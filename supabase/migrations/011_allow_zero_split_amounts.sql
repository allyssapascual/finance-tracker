-- Allow £0 on split shares (your share and/or hers).
-- Run after 010_sister_card_billings.sql

alter table public.sister_spendings
  drop constraint if exists sister_spendings_amount_check;

alter table public.sister_spendings
  add constraint sister_spendings_amount_check check (amount >= 0);

alter table public.transactions
  drop constraint if exists transactions_amount_check;

alter table public.transactions
  add constraint transactions_amount_check check (amount >= 0);
