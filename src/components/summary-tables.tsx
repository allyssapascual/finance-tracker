import { FundItemsTable } from "@/components/fund-items";
import {
  buildCashSummary,
  buildGroupingSummary,
  buildSpendingTotalsRows,
} from "@/lib/finance/aggregates";
import {
  formatGbp,
  formatPercent,
  GROUPING_LABELS,
  SPENDING_GROUPINGS,
  SPENDING_TYPES,
  TYPE_LABELS,
  type FundItem,
  type GroupingBudgetMap,
  type MonthPlan,
  type Transaction,
} from "@/lib/finance/constants";

function dashOrMoney(value: number | null): string {
  if (value === null) return "—";
  return formatGbp(value);
}

export function CashSummaryTable({
  plan,
  transactions,
  groupingBudgets,
  savings,
  investments,
}: {
  plan: MonthPlan | null;
  transactions: Transaction[];
  groupingBudgets: GroupingBudgetMap;
  savings: FundItem[];
  investments: FundItem[];
}) {
  const rows = buildCashSummary(
    plan,
    transactions,
    groupingBudgets,
    savings,
    investments,
  );
  const allZero = rows
    .filter((r) => r.key !== "remaining")
    .every((r) => (r.budget ?? 0) === 0 && r.actual === 0);

  return (
    <div>
      <h3 className="mb-3 text-base font-semibold tracking-tight">Cash summary</h3>
      {allZero ? (
        <p className="mb-3 text-sm text-muted">
          Set income and grouping budgets in Setup month. Add savings and
          investments in Totals.
        </p>
      ) : null}
      <p className="mb-3 text-xs text-muted">
        Income remaining = income minus expense, savings, and investment (budget
        column uses budgets; actual column uses actuals).
      </p>
      <div className="overflow-x-auto border border-foreground/10 bg-white/70">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-foreground/10 bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium text-right">Budget</th>
              <th className="px-4 py-3 font-medium text-right">Actual</th>
              <th className="px-4 py-3 font-medium text-right">Variance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isRemaining = row.key === "remaining";
              const negativeBudget = isRemaining && (row.budget ?? 0) < 0;
              const negativeActual = isRemaining && row.actual < 0;
              return (
                <tr
                  key={row.key}
                  className={`border-b border-foreground/5 last:border-0 ${
                    isRemaining ? "bg-accent-soft/30 font-medium" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-medium">{row.label}</td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums ${
                      negativeBudget ? "text-red-700" : ""
                    }`}
                  >
                    {dashOrMoney(row.budget)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums ${
                      negativeActual ? "text-red-700" : ""
                    }`}
                  >
                    {formatGbp(row.actual)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums ${
                      row.variance !== null && row.variance < 0 ? "text-red-700" : ""
                    }`}
                  >
                    {dashOrMoney(row.variance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SpendingTotalsTable({
  transactions,
  groupingBudgets,
}: {
  transactions: Transaction[];
  groupingBudgets: GroupingBudgetMap;
}) {
  const rows = buildSpendingTotalsRows(transactions, groupingBudgets);

  return (
    <div>
      <h3 className="mb-3 text-base font-semibold tracking-tight">
        Spending by grouping
      </h3>
      <p className="mb-3 text-sm text-muted">
        Actual is from your spending entries. Budget comes from Setup month. % is
        how much of the budget you have used.
      </p>
      <div className="overflow-x-auto border border-foreground/10 bg-white/70">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-foreground/10 bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Grouping</th>
              <th className="px-4 py-3 font-medium text-right">Budget</th>
              <th className="px-4 py-3 font-medium text-right">Actual</th>
              <th className="px-4 py-3 font-medium text-right">% used</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-foreground/5 last:border-0">
                <td className="px-4 py-3 font-medium">{row.label}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatGbp(row.budget)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatGbp(row.actual)}
                </td>
                <td
                  className={`px-4 py-3 text-right tabular-nums ${
                    row.percentUsed !== null && row.percentUsed > 100
                      ? "text-red-700"
                      : ""
                  }`}
                >
                  {row.percentUsed === null ? "—" : formatPercent(row.percentUsed)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TotalsSection({
  year,
  month,
  transactions,
  groupingBudgets,
  savings,
  investments,
}: {
  year: number;
  month: number;
  transactions: Transaction[];
  groupingBudgets: GroupingBudgetMap;
  savings: FundItem[];
  investments: FundItem[];
}) {
  return (
    <div className="flex flex-col gap-10">
      <SpendingTotalsTable
        transactions={transactions}
        groupingBudgets={groupingBudgets}
      />
      <FundItemsTable
        kind="savings"
        title="Savings"
        year={year}
        month={month}
        items={savings}
      />
      <FundItemsTable
        kind="investment"
        title="Investments"
        year={year}
        month={month}
        items={investments}
      />
    </div>
  );
}

export function GroupingSummaryTable({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const summary = buildGroupingSummary(transactions);

  return (
    <div>
      <h3 className="mb-3 text-base font-semibold tracking-tight">
        Expenses by grouping
      </h3>
      {summary.grandTotal === 0 ? (
        <p className="mb-3 text-sm text-muted">
          No spending yet — totals appear here once you add entries.
        </p>
      ) : null}
      <div className="overflow-x-auto border border-foreground/10 bg-white/70">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-foreground/10 bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Grouping</th>
              {SPENDING_TYPES.map((t) => (
                <th key={t} className="px-4 py-3 font-medium text-right">
                  {TYPE_LABELS[t]}
                </th>
              ))}
              <th className="px-4 py-3 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {SPENDING_GROUPINGS.map((g) => (
              <tr key={g} className="border-b border-foreground/5">
                <td className="px-4 py-3 font-medium">{GROUPING_LABELS[g]}</td>
                {SPENDING_TYPES.map((t) => (
                  <td key={t} className="px-4 py-3 text-right tabular-nums">
                    {formatGbp(summary.cells[g][t])}
                  </td>
                ))}
                <td className="px-4 py-3 text-right tabular-nums font-medium">
                  {formatGbp(summary.rowTotals[g])}
                </td>
              </tr>
            ))}
            <tr className="bg-accent-soft/20 font-medium">
              <td className="px-4 py-3">Total</td>
              {SPENDING_TYPES.map((t) => (
                <td key={t} className="px-4 py-3 text-right tabular-nums">
                  {formatGbp(summary.colTotals[t])}
                </td>
              ))}
              <td className="px-4 py-3 text-right tabular-nums">
                {formatGbp(summary.grandTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
