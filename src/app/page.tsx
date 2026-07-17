import Link from "next/link";
import { signOut } from "@/app/actions";
import { DashboardCharts } from "@/components/dashboard-charts";
import { MonthLinks, YearNav } from "@/components/year-nav";
import { YearOverviewTable } from "@/components/year-overview-table";
import {
  buildYearOverview,
  toYearTransactions,
} from "@/lib/finance/year-overview";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<{ year?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const thisYear = new Date().getFullYear();
  const parsedYear = Number(params.year);
  const year =
    Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100
      ? parsedYear
      : thisYear;

  const supabase = await createClient();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const [
    txResult,
    planResult,
    savingsAccountsResult,
    savingsValuesResult,
    investAccountsResult,
    investValuesResult,
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, date, description, grouping, type, amount, created_at")
      .gte("date", yearStart)
      .lte("date", yearEnd)
      .order("date", { ascending: true }),
    supabase.from("month_plans").select("*").eq("year", year),
    supabase
      .from("savings_accounts")
      .select("id, name, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("savings_month_values")
      .select("account_id, month, budget, actual, current_value")
      .eq("year", year),
    supabase
      .from("investment_accounts")
      .select("id, name, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("investment_month_values")
      .select("account_id, month, budget, actual, current_value")
      .eq("year", year),
  ]);

  if (txResult.error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-red-700">
          Could not load dashboard: {txResult.error.message}
        </p>
        <p className="mt-2 text-sm text-muted">
          Check that Supabase env vars are set and migrations have been run.
        </p>
      </div>
    );
  }

  const overview = buildYearOverview({
    year,
    transactions: toYearTransactions(txResult.data ?? []),
    plans: (planResult.data ?? []) as Record<string, unknown>[],
    savingsAccounts: savingsAccountsResult.data ?? [],
    savingsValues: savingsValuesResult.data ?? [],
    investmentAccounts: investAccountsResult.data ?? [],
    investmentValues: investValuesResult.data ?? [],
  });

  const loadWarning =
    planResult.error?.message ||
    savingsAccountsResult.error?.message ||
    savingsValuesResult.error?.message ||
    investAccountsResult.error?.message ||
    investValuesResult.error?.message;

  return (
    <div className="relative min-h-full flex-1 bg-white">
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-foreground/10 pb-6">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-accent uppercase">
              Finance Tracker
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Overview
            </h1>
            <YearNav year={year} />
            <MonthLinks year={year} />
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/savings"
                className="inline-flex h-10 items-center border border-foreground/15 bg-surface px-3 text-sm font-medium text-foreground hover:border-foreground/30"
              >
                Savings goals
              </Link>
              <Link
                href="/sister"
                className="inline-flex h-10 items-center border border-foreground/15 bg-surface px-3 text-sm font-medium text-foreground hover:border-foreground/30"
              >
                Sister spendings
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
            Some dashboard data could not load ({loadWarning}). Run the latest
            migrations in Supabase if you have not yet.
          </p>
        ) : null}

        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">
            Year at a glance
          </h2>
          <DashboardCharts overview={overview} />
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">
            Year overview
          </h2>
          <p className="mb-4 text-sm text-muted">
            Monthly actuals for income, savings accounts, investment accounts,
            and expenses. Click a month to open its detail view.
          </p>
          <YearOverviewTable overview={overview} />
        </section>
      </div>
    </div>
  );
}
