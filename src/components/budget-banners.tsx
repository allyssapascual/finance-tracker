import { buildSpendingTotalsRows } from "@/lib/finance/aggregates";
import {
  formatGbp,
  type GroupingBudgetMap,
  type Transaction,
} from "@/lib/finance/constants";

export function ShoppingBudgetBanner({
  transactions,
  groupingBudgets,
}: {
  transactions: Transaction[];
  groupingBudgets: GroupingBudgetMap;
}) {
  const shopping = buildSpendingTotalsRows(transactions, groupingBudgets).find(
    (row) => row.key === "shopping",
  );

  if (!shopping || shopping.budget <= 0 || shopping.actual <= shopping.budget) {
    return null;
  }

  const over = shopping.actual - shopping.budget;

  return (
    <div
      role="alert"
      className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
    >
      <p className="font-medium">Shopping over budget</p>
      <p className="mt-1 text-red-800">
        You have spent {formatGbp(shopping.actual)} on shopping against a budget
        of {formatGbp(shopping.budget)} ({formatGbp(over)} over
        {shopping.percentUsed !== null
          ? ` · ${Math.round(shopping.percentUsed)}% used`
          : ""}
        ).
      </p>
    </div>
  );
}
