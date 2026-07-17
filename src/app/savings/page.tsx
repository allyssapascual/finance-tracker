import Link from "next/link";
import { signOut } from "@/app/actions";
import { SavingsProgressList } from "@/components/savings-progress";
import {
  currentYearMonth,
  mergeFundAccounts,
  monthLabel,
  parseYearMonth,
} from "@/lib/finance/constants";
import { createClient } from "@/lib/supabase/server";

export default async function SavingsGoalsPage() {
  const ym = currentYearMonth();
  const parsed = parseYearMonth(ym);
  if (!parsed) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-red-700">Could not determine the current month.</p>
      </div>
    );
  }

  const supabase = await createClient();
  const [accountsResult, valuesResult] = await Promise.all([
    supabase
      .from("savings_accounts")
      .select("id, name, created_at, target")
      .order("created_at", { ascending: true }),
    supabase
      .from("savings_month_values")
      .select("account_id, budget, actual, current_value")
      .eq("year", parsed.year)
      .eq("month", parsed.month),
  ]);

  if (accountsResult.error) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-red-700">
          Could not load savings: {accountsResult.error.message}
        </p>
        <p className="mt-2 text-sm text-muted">
          Run migration{" "}
          <code className="font-mono">007_savings_target.sql</code> in Supabase
          if you have not yet.
        </p>
      </div>
    );
  }

  const items = mergeFundAccounts(
    accountsResult.data ?? [],
    valuesResult.data ?? [],
  );

  const loadWarning = valuesResult.error?.message;

  return (
    <div className="relative min-h-full flex-1 bg-white">
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-10 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-foreground/10 pb-6">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-accent uppercase">
              Finance Tracker
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Savings goals
            </h1>
            <p className="mt-2 text-sm text-muted">
              Based on {monthLabel(ym)} current values
            </p>
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
                This month
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

        {loadWarning ? (
          <p className="mt-4 text-sm text-amber-800">
            Some values could not load ({loadWarning}).
          </p>
        ) : null}

        <section className="mt-8">
          <p className="mb-4 text-sm text-muted">
            Each account&apos;s target is set when you add or edit a saving in
            monthly Totals. Progress compares this month&apos;s current value to
            that target.
          </p>
          <SavingsProgressList items={items} />
        </section>
      </div>
    </div>
  );
}
