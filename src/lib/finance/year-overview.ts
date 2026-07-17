import {
  expenseActual,
  sumFundItems,
} from "@/lib/finance/aggregates";
import {
  formatYearMonth,
  mergeFundAccounts,
  toMonthPlan,
  type FundItem,
  type MonthPlan,
  type SpendingGrouping,
  type SpendingType,
  type Transaction,
} from "@/lib/finance/constants";

export type NamedAccount = {
  id: string;
  name: string;
};

export type YearMonthOverview = {
  month: number;
  ym: string;
  income: number;
  expense: number;
  savingsByAccount: Record<string, number>;
  investmentsByAccount: Record<string, number>;
  savingsTotal: number;
  investmentsTotal: number;
};

export type YearOverview = {
  year: number;
  savingsAccounts: NamedAccount[];
  investmentAccounts: NamedAccount[];
  months: YearMonthOverview[];
  totals: {
    income: number;
    expense: number;
    savingsByAccount: Record<string, number>;
    investmentsByAccount: Record<string, number>;
    savingsTotal: number;
    investmentsTotal: number;
  };
};

function emptyAccountMap(accounts: NamedAccount[]): Record<string, number> {
  return Object.fromEntries(accounts.map((a) => [a.id, 0]));
}

function transactionsForMonth(
  all: Transaction[],
  year: number,
  month: number,
): Transaction[] {
  const prefix = formatYearMonth(year, month);
  return all.filter((tx) => tx.date.startsWith(prefix));
}

function fundActuals(
  accounts: NamedAccount[],
  items: FundItem[],
): { byAccount: Record<string, number>; total: number } {
  const byAccount = emptyAccountMap(accounts);
  for (const item of items) {
    byAccount[item.id] = Number(item.actual);
  }
  return { byAccount, total: sumFundItems(items).actual };
}

export function buildYearOverview(input: {
  year: number;
  transactions: Transaction[];
  plans: Record<string, unknown>[];
  savingsAccounts: { id: string; name: string; created_at: string }[];
  savingsValues: {
    account_id: string;
    month: number;
    budget: number | string;
    actual: number | string;
    current_value: number | string;
  }[];
  investmentAccounts: { id: string; name: string; created_at: string }[];
  investmentValues: {
    account_id: string;
    month: number;
    budget: number | string;
    actual: number | string;
    current_value: number | string;
  }[];
}): YearOverview {
  const { year } = input;
  const savingsAccounts: NamedAccount[] = input.savingsAccounts.map((a) => ({
    id: a.id,
    name: a.name,
  }));
  const investmentAccounts: NamedAccount[] = input.investmentAccounts.map(
    (a) => ({
      id: a.id,
      name: a.name,
    }),
  );

  const plansByMonth = new Map<number, MonthPlan>();
  for (const row of input.plans) {
    const plan = toMonthPlan(row);
    plansByMonth.set(plan.month, plan);
  }

  const savingsByMonth = new Map<number, typeof input.savingsValues>();
  for (const row of input.savingsValues) {
    const list = savingsByMonth.get(row.month) ?? [];
    list.push(row);
    savingsByMonth.set(row.month, list);
  }

  const investByMonth = new Map<number, typeof input.investmentValues>();
  for (const row of input.investmentValues) {
    const list = investByMonth.get(row.month) ?? [];
    list.push(row);
    investByMonth.set(row.month, list);
  }

  const months: YearMonthOverview[] = [];
  const totals = {
    income: 0,
    expense: 0,
    savingsByAccount: emptyAccountMap(savingsAccounts),
    investmentsByAccount: emptyAccountMap(investmentAccounts),
    savingsTotal: 0,
    investmentsTotal: 0,
  };

  for (let month = 1; month <= 12; month++) {
    const ym = formatYearMonth(year, month);
    const plan = plansByMonth.get(month);
    const txs = transactionsForMonth(input.transactions, year, month);
    const savings = mergeFundAccounts(
      input.savingsAccounts,
      savingsByMonth.get(month) ?? [],
    );
    const investments = mergeFundAccounts(
      input.investmentAccounts,
      investByMonth.get(month) ?? [],
    );

    const income = plan?.income ?? 0;
    const expense = expenseActual(txs);
    const savingsActuals = fundActuals(savingsAccounts, savings);
    const investActuals = fundActuals(investmentAccounts, investments);

    months.push({
      month,
      ym,
      income,
      expense,
      savingsByAccount: savingsActuals.byAccount,
      investmentsByAccount: investActuals.byAccount,
      savingsTotal: savingsActuals.total,
      investmentsTotal: investActuals.total,
    });

    totals.income += income;
    totals.expense += expense;
    totals.savingsTotal += savingsActuals.total;
    totals.investmentsTotal += investActuals.total;
    for (const a of savingsAccounts) {
      totals.savingsByAccount[a.id] += savingsActuals.byAccount[a.id];
    }
    for (const a of investmentAccounts) {
      totals.investmentsByAccount[a.id] += investActuals.byAccount[a.id];
    }
  }

  return { year, savingsAccounts, investmentAccounts, months, totals };
}

export function toYearTransactions(
  rows: {
    id: string;
    date: string;
    description: string;
    grouping: string;
    type: string;
    amount: number | string;
    created_at: string;
  }[],
): Transaction[] {
  return rows.map((row) => ({
    id: row.id,
    date: row.date,
    description: row.description,
    grouping: row.grouping as SpendingGrouping,
    type: row.type as SpendingType,
    amount: Number(row.amount),
    created_at: row.created_at,
  }));
}

export const MONTH_SHORT_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;
