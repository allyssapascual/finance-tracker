export const SPENDING_GROUPINGS = [
  "bills",
  "transport",
  "shopping",
  "tithes",
  "housing",
] as const;

export type SpendingGrouping = (typeof SPENDING_GROUPINGS)[number];

export const SPENDING_TYPES = ["wants", "needs", "goals"] as const;

export type SpendingType = (typeof SPENDING_TYPES)[number];

export const GROUPING_LABELS: Record<SpendingGrouping, string> = {
  bills: "Bills",
  transport: "Transport",
  shopping: "Shopping",
  tithes: "Tithes",
  housing: "Housing",
};

export const TYPE_LABELS: Record<SpendingType, string> = {
  wants: "Wants",
  needs: "Needs",
  goals: "Goals",
};

export type Transaction = {
  id: string;
  date: string;
  description: string;
  grouping: SpendingGrouping;
  type: SpendingType;
  amount: number;
  created_at: string;
};

export const RECURRING_FREQUENCIES = ["weekly", "monthly"] as const;
export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number];

export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type RecurringTemplate = {
  id: string;
  description: string;
  amount: number;
  grouping: SpendingGrouping;
  type: SpendingType;
  frequency: RecurringFrequency;
  weekday: number | null;
  month_day: number | null;
  active: boolean;
  created_at: string;
};

export function toRecurringTemplate(row: Record<string, unknown>): RecurringTemplate {
  return {
    id: String(row.id),
    description: String(row.description ?? ""),
    amount: Number(row.amount ?? 0),
    grouping: row.grouping as SpendingGrouping,
    type: row.type as SpendingType,
    frequency: row.frequency as RecurringFrequency,
    weekday: row.weekday === null || row.weekday === undefined ? null : Number(row.weekday),
    month_day:
      row.month_day === null || row.month_day === undefined
        ? null
        : Number(row.month_day),
    active: Boolean(row.active ?? true),
    created_at: String(row.created_at ?? ""),
  };
}

/** Dates (YYYY-MM-DD) this template should create in a given calendar month */
export function datesForRecurringInMonth(
  template: Pick<RecurringTemplate, "frequency" | "weekday" | "month_day">,
  year: number,
  month: number,
): string[] {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  if (template.frequency === "monthly") {
    const day = Math.min(template.month_day ?? 1, lastDay);
    return [`${formatYearMonth(year, month)}-${String(day).padStart(2, "0")}`];
  }

  // weekly: every matching weekday in the month
  const weekday = template.weekday ?? 1;
  const dates: string[] = [];
  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCDay() === weekday) {
      dates.push(
        `${formatYearMonth(year, month)}-${String(day).padStart(2, "0")}`,
      );
    }
  }
  return dates;
}

/** Month-level income + overall expense budget (expense often = sum of grouping budgets) */
export type MonthPlan = {
  id: string;
  year: number;
  month: number;
  income: number;
  expense_budget: number;
};

export const EMPTY_MONTH_PLAN: Omit<MonthPlan, "id" | "year" | "month"> = {
  income: 0,
  expense_budget: 0,
};

export type GroupingBudgetMap = Record<SpendingGrouping, number>;

export const EMPTY_GROUPING_BUDGETS: GroupingBudgetMap = {
  bills: 0,
  transport: 0,
  shopping: 0,
  tithes: 0,
  housing: 0,
};

export type FundItem = {
  /** Account id (stable across months) */
  id: string;
  name: string;
  /** Global goal for savings accounts; 0 for investments or when unset */
  target: number;
  budget: number;
  actual: number;
  current_value: number;
  created_at: string;
};

export function mergeFundAccounts(
  accounts: { id: string; name: string; created_at: string; target?: number | string }[],
  monthValues: {
    account_id: string;
    budget: number | string;
    actual: number | string;
    current_value: number | string;
  }[],
): FundItem[] {
  const byAccount = new Map(
    monthValues.map((v) => [
      v.account_id,
      {
        budget: Number(v.budget ?? 0),
        actual: Number(v.actual ?? 0),
        current_value: Number(v.current_value ?? 0),
      },
    ]),
  );

  return accounts.map((account) => {
    const values = byAccount.get(account.id);
    return {
      id: account.id,
      name: account.name,
      target: Number(account.target ?? 0),
      budget: values?.budget ?? 0,
      actual: values?.actual ?? 0,
      current_value: values?.current_value ?? 0,
      created_at: account.created_at,
    };
  });
}

/** Progress toward a savings target; null when no target is set */
export function fundProgress(
  current: number,
  target: number,
): { percent: number; remaining: number; reached: boolean } | null {
  if (target <= 0) return null;
  const percent = (current / target) * 100;
  const remaining = Math.max(0, target - current);
  return {
    percent,
    remaining,
    reached: current >= target,
  };
}

export function toMonthPlan(row: Record<string, unknown>): MonthPlan {
  const num = (key: string) => Number(row[key] ?? 0);
  const income = num("income_actual") || num("income_budget");
  return {
    id: String(row.id),
    year: Number(row.year),
    month: Number(row.month),
    income,
    expense_budget: num("expense_budget"),
  };
}

export function toGroupingBudgets(
  rows: { grouping: string; budget: number | string }[],
): GroupingBudgetMap {
  const map = { ...EMPTY_GROUPING_BUDGETS };
  for (const row of rows) {
    if ((SPENDING_GROUPINGS as readonly string[]).includes(row.grouping)) {
      map[row.grouping as SpendingGrouping] = Number(row.budget ?? 0);
    }
  }
  return map;
}

export function isSpendingGrouping(value: string): value is SpendingGrouping {
  return (SPENDING_GROUPINGS as readonly string[]).includes(value);
}

export function isSpendingType(value: string): value is SpendingType {
  return (SPENDING_TYPES as readonly string[]).includes(value);
}

export function formatGbp(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

export function formatPercent(used: number): string {
  if (!Number.isFinite(used)) return "—";
  return `${Math.round(used * 10) / 10}%`;
}

/** actual / budget * 100; null if no budget */
export function budgetUsedPercent(budget: number, actual: number): number | null {
  if (budget <= 0) return null;
  return (actual / budget) * 100;
}

export function parseYearMonth(ym: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(ym);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export function formatYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function shiftYearMonth(ym: string, delta: number): string {
  const parsed = parseYearMonth(ym);
  if (!parsed) return ym;
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1 + delta, 1));
  return formatYearMonth(date.getUTCFullYear(), date.getUTCMonth() + 1);
}

export function currentYearMonth(): string {
  const now = new Date();
  return formatYearMonth(now.getFullYear(), now.getMonth() + 1);
}

export function monthLabel(ym: string): string {
  const parsed = parseYearMonth(ym);
  if (!parsed) return ym;
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(parsed.year, parsed.month - 1, 1)));
}

export function monthDateBounds(ym: string): { start: string; end: string } | null {
  const parsed = parseYearMonth(ym);
  if (!parsed) return null;
  const start = `${formatYearMonth(parsed.year, parsed.month)}-01`;
  const lastDay = new Date(Date.UTC(parsed.year, parsed.month, 0)).getUTCDate();
  const end = `${formatYearMonth(parsed.year, parsed.month)}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}
