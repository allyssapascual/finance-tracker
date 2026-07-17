import Link from "next/link";
import { notFound } from "next/navigation";
import { signOut } from "@/app/actions";
import { SpendingTable } from "@/components/spending-table";
import {
  monthDateBounds,
  monthLabel,
  parseYearMonth,
  shiftYearMonth,
  type SpendingGrouping,
  type SpendingType,
  type Transaction,
} from "@/lib/finance/constants";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ ym: string }>;
};

export default async function MonthPage({ params }: PageProps) {
  const { ym } = await params;
  const parsed = parseYearMonth(ym);
  if (!parsed) notFound();

  const bounds = monthDateBounds(ym);
  if (!bounds) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("id, date, description, grouping, type, amount, created_at")
    .gte("date", bounds.start)
    .lte("date", bounds.end)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-red-700">Could not load spending: {error.message}</p>
        <p className="mt-2 text-sm text-muted">
          Check that Supabase env vars are set and the migration has been run.
        </p>
      </div>
    );
  }

  const transactions = (data ?? []).map((row) => ({
    ...row,
    amount: Number(row.amount),
    grouping: row.grouping as SpendingGrouping,
    type: row.type as SpendingType,
  })) as Transaction[];

  const prev = shiftYearMonth(ym, -1);
  const next = shiftYearMonth(ym, 1);
  const defaultDate =
    (() => {
      const today = new Date();
      const todayYm = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
      if (todayYm === ym) {
        return today.toISOString().slice(0, 10);
      }
      return bounds.start;
    })();

  return (
    <div className="relative min-h-full flex-1">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,#f3f6f4_0%,#e7efe9_55%,#dce8e1_100%)]"
      />
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-10 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-foreground/10 pb-6">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-accent uppercase">
              Finance Tracker
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {monthLabel(ym)}
            </h1>
            <nav className="mt-3 flex items-center gap-3 text-sm">
              <Link href={`/months/${prev}`} className="text-muted hover:text-foreground">
                ← {monthLabel(prev)}
              </Link>
              <span className="text-foreground/20">|</span>
              <Link href={`/months/${next}`} className="text-muted hover:text-foreground">
                {monthLabel(next)} →
              </Link>
            </nav>
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
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Spending</h2>
          <SpendingTable transactions={transactions} defaultDate={defaultDate} />
        </section>
      </div>
    </div>
  );
}
