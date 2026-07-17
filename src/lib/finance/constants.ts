export const SPENDING_GROUPINGS = [
  "bills",
  "transport",
  "shopping",
  "tithes",
  "housing",
  "investment",
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
  investment: "Investment",
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
