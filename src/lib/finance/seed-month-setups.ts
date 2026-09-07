import {
  DEFAULT_GROUPING_BUDGETS,
  DEFAULT_MONTH_INCOME,
  SPENDING_GROUPINGS,
  defaultExpenseBudget,
} from "@/lib/finance/constants";
import { createClient } from "@/lib/supabase/server";

/**
 * Inserts default income + grouping budgets for months that have no
 * month_plans row yet. Only touches the current month onward in the
 * current year, or all months in a future year. Never overwrites.
 */
export async function seedRemainingMonthSetups(
  year: number,
): Promise<{ seeded: number }> {
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth() + 1;

  if (year < thisYear) {
    return { seeded: 0 };
  }

  const startMonth = year === thisYear ? thisMonth : 1;
  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("month_plans")
    .select("month")
    .eq("year", year);

  if (existingError) {
    console.error("seedRemainingMonthSetups:", existingError.message);
    return { seeded: 0 };
  }

  const have = new Set((existing ?? []).map((row) => Number(row.month)));
  const monthsToSeed: number[] = [];
  for (let month = startMonth; month <= 12; month++) {
    if (!have.has(month)) monthsToSeed.push(month);
  }

  if (monthsToSeed.length === 0) {
    return { seeded: 0 };
  }

  const expense_budget = defaultExpenseBudget();
  const planRows = monthsToSeed.map((month) => ({
    year,
    month,
    income_budget: 0,
    income_actual: DEFAULT_MONTH_INCOME,
    expense_budget,
  }));

  const { error: planError } = await supabase
    .from("month_plans")
    .upsert(planRows, { onConflict: "year,month" });

  if (planError) {
    console.error("seedRemainingMonthSetups plans:", planError.message);
    return { seeded: 0 };
  }

  const budgetRows = monthsToSeed.flatMap((month) =>
    SPENDING_GROUPINGS.map((grouping) => ({
      year,
      month,
      grouping,
      budget: DEFAULT_GROUPING_BUDGETS[grouping],
    })),
  );

  const { error: budgetError } = await supabase
    .from("month_grouping_budgets")
    .upsert(budgetRows, { onConflict: "year,month,grouping" });

  if (budgetError) {
    console.error("seedRemainingMonthSetups budgets:", budgetError.message);
    return { seeded: 0 };
  }

  return { seeded: monthsToSeed.length };
}
