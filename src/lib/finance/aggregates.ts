import {
  budgetUsedPercent,
  EMPTY_GROUPING_BUDGETS,
  EMPTY_MONTH_PLAN,
  GROUPING_LABELS,
  SPENDING_GROUPINGS,
  SPENDING_TYPES,
  type FundItem,
  type GroupingBudgetMap,
  type MonthPlan,
  type SpendingGrouping,
  type SpendingType,
  type Transaction,
} from "@/lib/finance/constants";

export type CashSummaryRow = {
  key: string;
  label: string;
  budget: number | null;
  actual: number;
  variance: number | null;
};

export type SpendingTotalsRow = {
  key: SpendingGrouping;
  label: string;
  budget: number;
  actual: number;
  percentUsed: number | null;
};

export type GroupingSummary = {
  cells: Record<SpendingGrouping, Record<SpendingType, number>>;
  rowTotals: Record<SpendingGrouping, number>;
  colTotals: Record<SpendingType, number>;
  grandTotal: number;
};

function variance(budget: number, actual: number): number {
  return budget - actual;
}

export function buildGroupingSummary(
  transactions: Transaction[],
): GroupingSummary {
  const cells = Object.fromEntries(
    SPENDING_GROUPINGS.map((g) => [
      g,
      Object.fromEntries(SPENDING_TYPES.map((t) => [t, 0])),
    ]),
  ) as Record<SpendingGrouping, Record<SpendingType, number>>;

  for (const tx of transactions) {
    cells[tx.grouping][tx.type] += Number(tx.amount);
  }

  const rowTotals = Object.fromEntries(
    SPENDING_GROUPINGS.map((g) => [
      g,
      SPENDING_TYPES.reduce((sum, t) => sum + cells[g][t], 0),
    ]),
  ) as Record<SpendingGrouping, number>;

  const colTotals = Object.fromEntries(
    SPENDING_TYPES.map((t) => [
      t,
      SPENDING_GROUPINGS.reduce((sum, g) => sum + cells[g][t], 0),
    ]),
  ) as Record<SpendingType, number>;

  const grandTotal = SPENDING_GROUPINGS.reduce((sum, g) => sum + rowTotals[g], 0);

  return { cells, rowTotals, colTotals, grandTotal };
}

export function expenseActual(transactions: Transaction[]): number {
  return transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
}

export function sumFundItems(items: FundItem[]): {
  budget: number;
  actual: number;
  current: number;
} {
  return items.reduce(
    (acc, item) => ({
      budget: acc.budget + Number(item.budget),
      actual: acc.actual + Number(item.actual),
      current: acc.current + Number(item.current_value),
    }),
    { budget: 0, actual: 0, current: 0 },
  );
}

export function sumGroupingBudgets(budgets: GroupingBudgetMap): number {
  return SPENDING_GROUPINGS.reduce((sum, g) => sum + budgets[g], 0);
}

export function buildCashSummary(
  plan: MonthPlan | null,
  transactions: Transaction[],
  groupingBudgets: GroupingBudgetMap,
  savings: FundItem[],
  investments: FundItem[],
): CashSummaryRow[] {
  const p = plan ?? { ...EMPTY_MONTH_PLAN, id: "", year: 0, month: 0 };
  const expenseAct = expenseActual(transactions);
  const expenseBudget =
    p.expense_budget > 0 ? p.expense_budget : sumGroupingBudgets(groupingBudgets);
  const savingsSum = sumFundItems(savings);
  const investSum = sumFundItems(investments);

  const outflowsBudget =
    expenseBudget + savingsSum.budget + investSum.budget;
  const outflowsActual =
    expenseAct + savingsSum.actual + investSum.actual;
  const remainingBudget = p.income - outflowsBudget;
  const remainingActual = p.income - outflowsActual;

  return [
    {
      key: "income",
      label: "Income",
      budget: p.income,
      actual: p.income,
      variance: 0,
    },
    {
      key: "expense",
      label: "Expense",
      budget: expenseBudget,
      actual: expenseAct,
      variance: variance(expenseBudget, expenseAct),
    },
    {
      key: "savings",
      label: "Savings",
      budget: savingsSum.budget,
      actual: savingsSum.actual,
      variance: variance(savingsSum.budget, savingsSum.actual),
    },
    {
      key: "investment",
      label: "Investment",
      budget: investSum.budget,
      actual: investSum.actual,
      variance: variance(investSum.budget, investSum.actual),
    },
    {
      key: "remaining",
      label: "Income remaining",
      budget: remainingBudget,
      actual: remainingActual,
      variance: null,
    },
  ];
}

export function buildSpendingTotalsRows(
  transactions: Transaction[],
  groupingBudgets: GroupingBudgetMap = EMPTY_GROUPING_BUDGETS,
): SpendingTotalsRow[] {
  const grouping = buildGroupingSummary(transactions);
  return SPENDING_GROUPINGS.map((g) => {
    const budget = groupingBudgets[g];
    const actual = grouping.rowTotals[g];
    return {
      key: g,
      label: GROUPING_LABELS[g],
      budget,
      actual,
      percentUsed: budgetUsedPercent(budget, actual),
    };
  });
}

export { GROUPING_LABELS, SPENDING_GROUPINGS, SPENDING_TYPES };
