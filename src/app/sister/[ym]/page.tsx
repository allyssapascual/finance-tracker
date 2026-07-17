import Link from "next/link";
import { notFound } from "next/navigation";
import { signOut } from "@/app/actions";
import { MonthNav } from "@/components/month-nav";
import {
  SisterSpendingsTable,
  type SisterCardPaidMap,
  type SisterSpendingRow,
} from "@/components/sister-spendings";
import {
  isSisterCard,
  monthLabel,
  parseYearMonth,
  type SpendingGrouping,
  type SpendingType,
} from "@/lib/finance/constants";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ ym: string }>;
};

export default async function SisterSpendingsPage({ params }: PageProps) {
  const { ym } = await params;
  const parsed = parseYearMonth(ym);
  if (!parsed) notFound();

  const supabase = await createClient();

  const [sisterResult, billingResult] = await Promise.all([
    supabase
      .from("sister_spendings")
      .select("id, transaction_id, amount, card, year, month")
      .eq("year", parsed.year)
      .eq("month", parsed.month),
    supabase
      .from("sister_card_billings")
      .select("card, paid")
      .eq("year", parsed.year)
      .eq("month", parsed.month),
  ]);

  if (sisterResult.error) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-red-700">
          Could not load sister spendings: {sisterResult.error.message}
        </p>
        <p className="mt-2 text-sm text-muted">
          Run migrations through{" "}
          <code className="font-mono">010_sister_card_billings.sql</code> if you
          have not yet.
        </p>
      </div>
    );
  }

  const sisterRows = sisterResult.data ?? [];
  const txIds = [...new Set(sisterRows.map((r) => r.transaction_id))];
  const txById = new Map<
    string,
    {
      date: string;
      description: string;
      grouping: string;
      type: string;
    }
  >();

  if (txIds.length > 0) {
    const { data: txs } = await supabase
      .from("transactions")
      .select("id, date, description, grouping, type")
      .in("id", txIds);
    for (const tx of txs ?? []) {
      txById.set(tx.id, tx);
    }
  }

  const rows: SisterSpendingRow[] = sisterRows
    .map((row) => {
      const tx = txById.get(row.transaction_id);
      if (!tx || !isSisterCard(row.card)) return null;
      return {
        id: row.id,
        amount: Number(row.amount),
        card: row.card,
        date: tx.date,
        description: tx.description,
        grouping: tx.grouping as SpendingGrouping,
        type: tx.type as SpendingType,
        transaction_id: row.transaction_id,
      } satisfies SisterSpendingRow;
    })
    .filter((row): row is SisterSpendingRow => row !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  const paidByCard: SisterCardPaidMap = { lloyds: false, amex: false };
  for (const row of billingResult.data ?? []) {
    if (isSisterCard(row.card)) {
      paidByCard[row.card] = Boolean(row.paid);
    }
  }

  return (
    <div className="relative min-h-full flex-1 bg-white">
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-10 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-foreground/10 pb-6">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-accent uppercase">
              Finance Tracker
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Sister spendings
            </h1>
            <p className="mt-2 text-sm text-muted">
              Billing month: {monthLabel(ym)}
            </p>
            <MonthNav ym={ym} basePath="/sister" />
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link
                href="/"
                className="inline-flex h-10 items-center border border-foreground/15 bg-surface px-3 text-sm font-medium text-foreground hover:border-foreground/30"
              >
                Overview
              </Link>
              <Link
                href={`/months/${ym}`}
                className="inline-flex h-10 items-center border border-foreground/15 bg-surface px-3 text-sm font-medium text-foreground hover:border-foreground/30"
              >
                Month detail
              </Link>
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-muted hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </header>

        <section className="mt-8">
          <p className="mb-4 text-sm text-muted">
            Items are keyed to her card billing month, not the purchase date.
            Mark each card as paid when that month’s bill is settled.
          </p>
          <SisterSpendingsTable
            year={parsed.year}
            month={parsed.month}
            rows={rows}
            paidByCard={paidByCard}
          />
        </section>
      </div>
    </div>
  );
}
