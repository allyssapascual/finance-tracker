import Link from "next/link";
import { notFound } from "next/navigation";
import { signOut } from "@/app/actions";
import { MonthNav } from "@/components/month-nav";
import { MonthSetupButton } from "@/components/month-setup";
import { ShoppingBudgetBanner } from "@/components/budget-banners";
import { RecurringSection } from "@/components/recurring";
import { SpendingTable } from "@/components/spending-table";
import {
  CashSummaryTable,
  GroupingSummaryTable,
  TotalsSection,
} from "@/components/summary-tables";
import {
  monthDateBounds,
  monthLabel,
  mergeFundAccounts,
  parseYearMonth,
  toGroupingBudgets,
  toMonthPlan,
  toRecurringTemplate,
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

  const [
    txResult,
    planResult,
    budgetsResult,
    savingsAccountsResult,
    savingsValuesResult,
    investAccountsResult,
    investValuesResult,
    recurringResult,
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, date, description, grouping, type, amount, created_at")
      .gte("date", bounds.start)
      .lte("date", bounds.end)
      .order("date", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("month_plans")
      .select("*")
      .eq("year", parsed.year)
      .eq("month", parsed.month)
      .maybeSingle(),
    supabase
      .from("month_grouping_budgets")
      .select("grouping, budget")
      .eq("year", parsed.year)
      .eq("month", parsed.month),
    supabase
      .from("savings_accounts")
      .select("id, name, created_at, target")
      .order("created_at", { ascending: true }),
    supabase
      .from("savings_month_values")
      .select("account_id, budget, actual, current_value")
      .eq("year", parsed.year)
      .eq("month", parsed.month),
    supabase
      .from("investment_accounts")
      .select("id, name, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("investment_month_values")
      .select("account_id, budget, actual, current_value")
      .eq("year", parsed.year)
      .eq("month", parsed.month),
    supabase
      .from("recurring_templates")
      .select("*")
      .order("created_at", { ascending: true }),
  ]);

  if (txResult.error) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-red-700">Could not load spending: {txResult.error.message}</p>
        <p className="mt-2 text-sm text-muted">
          Check that Supabase env vars are set and the migration has been run.
        </p>
      </div>
    );
  }

  const transactions = (txResult.data ?? []).map((row) => ({
    ...row,
    amount: Number(row.amount),
    grouping: row.grouping as SpendingGrouping,
    type: row.type as SpendingType,
  })) as Transaction[];

  const plan = planResult.data ? toMonthPlan(planResult.data) : null;
  const groupingBudgets = toGroupingBudgets(budgetsResult.data ?? []);
  const savings = mergeFundAccounts(
    savingsAccountsResult.data ?? [],
    savingsValuesResult.data ?? [],
  );
  const investments = mergeFundAccounts(
    investAccountsResult.data ?? [],
    investValuesResult.data ?? [],
  );
  const recurringTemplates = (recurringResult.data ?? []).map(toRecurringTemplate);

  const loadWarning =
    budgetsResult.error?.message ||
    savingsAccountsResult.error?.message ||
    savingsValuesResult.error?.message ||
    investAccountsResult.error?.message ||
    investValuesResult.error?.message ||
    recurringResult.error?.message;

  const defaultDate = (() => {
    const today = new Date();
    const todayYm = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    if (todayYm === ym) {
      return today.toISOString().slice(0, 10);
    }
    return bounds.start;
  })();

  return (
    <div className="relative min-h-full flex-1 bg-white">
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-10 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-foreground/10 pb-6">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-accent uppercase">
              Finance Tracker
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {monthLabel(ym)}
            </h1>
            <MonthNav ym={ym} />
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/?year=${parsed.year}`}
              className="inline-flex h-10 items-center border border-foreground/15 bg-surface px-3 text-sm font-medium text-foreground hover:border-foreground/30"
            >
              Overview
            </Link>
            <Link
              href="/savings"
              className="inline-flex h-10 items-center border border-foreground/15 bg-surface px-3 text-sm font-medium text-foreground hover:border-foreground/30"
            >
              Savings goals
            </Link>
            <MonthSetupButton
              year={parsed.year}
              month={parsed.month}
              initial={plan}
              groupingBudgets={groupingBudgets}
            />
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-muted hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        {loadWarning ? (
          <p className="mt-4 text-sm text-amber-800">
            Some totals data could not load ({loadWarning}). Run the latest
            migrations in Supabase (through{" "}
            <code className="font-mono">006_recurring_templates.sql</code>) if
            you have not yet.
          </p>
        ) : null}

        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Summary</h2>
          <ShoppingBudgetBanner
            transactions={transactions}
            groupingBudgets={groupingBudgets}
          />
          <div className="grid gap-8 lg:grid-cols-2">
            <CashSummaryTable
              plan={plan}
              transactions={transactions}
              groupingBudgets={groupingBudgets}
              savings={savings}
              investments={investments}
            />
            <GroupingSummaryTable transactions={transactions} />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Totals</h2>
          <TotalsSection
            year={parsed.year}
            month={parsed.month}
            transactions={transactions}
            groupingBudgets={groupingBudgets}
            savings={savings}
            investments={investments}
          />
        </section>

        <section className="mt-10">
          <RecurringSection
            year={parsed.year}
            month={parsed.month}
            templates={recurringTemplates}
          />
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Spending</h2>
          <SpendingTable transactions={transactions} defaultDate={defaultDate} />
        </section>
      </div>
    </div>
  );
}
