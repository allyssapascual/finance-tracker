"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  datesForRecurringInMonth,
  formatYearMonth,
  isSisterCard,
  isSpendingGrouping,
  isSpendingType,
  parseYearMonth,
  toRecurringTemplate,
} from "@/lib/finance/constants";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error: string } | { success: true };

function monthPathFromDate(date: string): string {
  const [year, month] = date.split("-");
  return `/months/${formatYearMonth(Number(year), Number(month))}`;
}

function revalidateSpendingPaths(date: string, sisterYm?: string) {
  revalidatePath(monthPathFromDate(date));
  revalidatePath("/sister");
  if (sisterYm && parseYearMonth(sisterYm)) {
    revalidatePath(`/sister/${sisterYm}`);
  }
  revalidatePath("/");
}

function parseAmount(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100) / 100;
}

/** Split shares may be 0; full amount still must be positive. */
function parseShareAmount(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100) / 100;
}

/** Allows 0 for budget/setup fields */
function parseMoney(raw: FormDataEntryValue | null): number {
  if (typeof raw !== "string" || raw.trim() === "") return 0;
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return Math.round(amount * 100) / 100;
}

export async function signIn(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createTransaction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const date = String(formData.get("date") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const grouping = String(formData.get("grouping") ?? "");
  const type = String(formData.get("type") ?? "");
  const amount = parseAmount(formData.get("amount"));
  const isSplit = formData.get("split_with_sister") === "on";
  const cardRaw = String(formData.get("sister_card") ?? "");

  if (!date || !description || !amount) {
    return { error: "Date, description, and a positive amount are required." };
  }
  if (!isSpendingGrouping(grouping) || !isSpendingType(type)) {
    return { error: "Invalid grouping or type." };
  }
  if (isSplit && !isSisterCard(cardRaw)) {
    return { error: "Pick Lloyds or Amex for your sister’s share." };
  }

  let mine = amount;
  let sister = 0;
  let sisterYear = 0;
  let sisterMonth = 0;
  let sisterYm: string | undefined;

  if (isSplit) {
    const myAmount = parseShareAmount(formData.get("my_amount"));
    const sisterAmount = parseShareAmount(formData.get("sister_amount"));
    if (myAmount === null || sisterAmount === null) {
      return { error: "Enter both your share and her share (0 is allowed)." };
    }
    const sum = Math.round((myAmount + sisterAmount) * 100) / 100;
    if (Math.abs(sum - amount) > 0.001) {
      return { error: "Your share and hers must add up to the full amount." };
    }
    const billingYm = String(formData.get("sister_month") ?? "");
    const billing = parseYearMonth(billingYm);
    if (!billing) {
      return { error: "Pick a billing month for your sister’s share." };
    }
    mine = myAmount;
    sister = sisterAmount;
    sisterYear = billing.year;
    sisterMonth = billing.month;
    sisterYm = billingYm;
  }

  const supabase = await createClient();
  const { data: tx, error } = await supabase
    .from("transactions")
    .insert({
      date,
      description,
      grouping,
      type,
      amount: mine,
    })
    .select("id")
    .single();

  if (error || !tx) {
    return { error: error?.message ?? "Could not save spending." };
  }

  if (isSplit) {
    const { error: sisterError } = await supabase.from("sister_spendings").insert({
      transaction_id: tx.id,
      amount: sister,
      card: cardRaw,
      year: sisterYear,
      month: sisterMonth,
    });
    if (sisterError) {
      await supabase.from("transactions").delete().eq("id", tx.id);
      return { error: sisterError.message };
    }
  }

  revalidateSpendingPaths(date, sisterYm);
  return { success: true };
}

export async function updateTransaction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  const date = String(formData.get("date") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const grouping = String(formData.get("grouping") ?? "");
  const type = String(formData.get("type") ?? "");
  const amount = parseAmount(formData.get("amount"));
  const isSplit = formData.get("split_with_sister") === "on";
  const cardRaw = String(formData.get("sister_card") ?? "");

  if (!id || !date || !description || !amount) {
    return { error: "All fields are required." };
  }
  if (!isSpendingGrouping(grouping) || !isSpendingType(type)) {
    return { error: "Invalid grouping or type." };
  }
  if (isSplit && !isSisterCard(cardRaw)) {
    return { error: "Pick Lloyds or Amex for your sister’s share." };
  }

  let mine = amount;
  let sister = 0;
  let sisterYear = 0;
  let sisterMonth = 0;
  let sisterYm: string | undefined;

  if (isSplit) {
    const myAmount = parseShareAmount(formData.get("my_amount"));
    const sisterAmount = parseShareAmount(formData.get("sister_amount"));
    if (myAmount === null || sisterAmount === null) {
      return { error: "Enter both your share and her share (0 is allowed)." };
    }
    const sum = Math.round((myAmount + sisterAmount) * 100) / 100;
    if (Math.abs(sum - amount) > 0.001) {
      return { error: "Your share and hers must add up to the full amount." };
    }
    const billingYm = String(formData.get("sister_month") ?? "");
    const billing = parseYearMonth(billingYm);
    if (!billing) {
      return { error: "Pick a billing month for your sister’s share." };
    }
    mine = myAmount;
    sister = sisterAmount;
    sisterYear = billing.year;
    sisterMonth = billing.month;
    sisterYm = billingYm;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({ date, description, grouping, type, amount: mine })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  if (isSplit) {
    const { error: sisterError } = await supabase.from("sister_spendings").upsert(
      {
        transaction_id: id,
        amount: sister,
        card: cardRaw,
        year: sisterYear,
        month: sisterMonth,
      },
      { onConflict: "transaction_id" },
    );
    if (sisterError) {
      return { error: sisterError.message };
    }
  } else {
    await supabase.from("sister_spendings").delete().eq("transaction_id", id);
  }

  revalidateSpendingPaths(date, sisterYm);
  return { success: true };
}

export async function deleteTransaction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const date = String(formData.get("date") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("transactions").delete().eq("id", id);

  if (date) {
    revalidateSpendingPaths(date);
  } else {
    revalidatePath("/sister");
  }
}

export async function setSisterCardBillingPaid(
  formData: FormData,
): Promise<void> {
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  const card = String(formData.get("card") ?? "");
  const paid = formData.get("paid") === "true";

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !isSisterCard(card)
  ) {
    return;
  }

  const supabase = await createClient();
  await supabase.from("sister_card_billings").upsert(
    {
      year,
      month,
      card,
      paid,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "year,month,card" },
  );

  revalidatePath("/sister");
  revalidatePath(`/sister/${formatYearMonth(year, month)}`);
}

export async function upsertMonthPlan(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return { error: "Invalid year or month." };
  }

  const income = parseMoney(formData.get("income"));
  const groupings = [
    "bills",
    "transport",
    "shopping",
    "tithes",
    "housing",
  ] as const;

  const groupingRows = groupings.map((grouping) => ({
    year,
    month,
    grouping,
    budget: parseMoney(formData.get(`budget_${grouping}`)),
  }));

  const expense_budget = groupingRows.reduce((sum, row) => sum + row.budget, 0);

  const supabase = await createClient();

  const { error: planError } = await supabase.from("month_plans").upsert(
    {
      year,
      month,
      income_budget: 0,
      income_actual: income,
      expense_budget,
    },
    { onConflict: "year,month" },
  );

  if (planError) {
    return { error: planError.message };
  }

  const { error: budgetError } = await supabase
    .from("month_grouping_budgets")
    .upsert(groupingRows, { onConflict: "year,month,grouping" });

  if (budgetError) {
    return { error: budgetError.message };
  }

  revalidatePath(`/months/${formatYearMonth(year, month)}`);
  return { success: true };
}

function accountTable(kind: "savings" | "investment") {
  return kind === "savings" ? "savings_accounts" : "investment_accounts";
}

function valuesTable(kind: "savings" | "investment") {
  return kind === "savings" ? "savings_month_values" : "investment_month_values";
}

export async function createFundItem(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const kind = String(formData.get("kind") ?? "");
  if (kind !== "savings" && kind !== "investment") {
    return { error: "Invalid fund type." };
  }

  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  const name = String(formData.get("name") ?? "").trim();

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return { error: "Invalid year or month." };
  }
  if (!name) {
    return { error: "Name is required." };
  }

  const supabase = await createClient();

  let account: { id: string } | null = null;
  let accountError: { message: string } | null = null;

  if (kind === "savings") {
    const result = await supabase
      .from("savings_accounts")
      .insert({ name, target: parseMoney(formData.get("target")) })
      .select("id")
      .single();
    account = result.data;
    accountError = result.error;
  } else {
    const result = await supabase
      .from("investment_accounts")
      .insert({ name })
      .select("id")
      .single();
    account = result.data;
    accountError = result.error;
  }

  if (accountError || !account) {
    return { error: accountError?.message ?? "Could not create account." };
  }

  const { error: valuesError } = await supabase.from(valuesTable(kind)).insert({
    account_id: account.id,
    year,
    month,
    budget: parseMoney(formData.get("budget")),
    actual: parseMoney(formData.get("actual")),
    current_value: parseMoney(formData.get("current_value")),
  });

  if (valuesError) {
    return { error: valuesError.message };
  }

  revalidatePath(`/months/${formatYearMonth(year, month)}`);
  revalidatePath("/savings");
  return { success: true };
}

export async function updateFundItem(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const kind = String(formData.get("kind") ?? "");
  if (kind !== "savings" && kind !== "investment") {
    return { error: "Invalid fund type." };
  }

  const id = String(formData.get("id") ?? "");
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  const name = String(formData.get("name") ?? "").trim();

  if (!id) return { error: "Missing id." };
  if (!name) return { error: "Name is required." };
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return { error: "Invalid year or month." };
  }

  const supabase = await createClient();

  const { error: nameError } =
    kind === "savings"
      ? await supabase
          .from("savings_accounts")
          .update({ name, target: parseMoney(formData.get("target")) })
          .eq("id", id)
      : await supabase
          .from("investment_accounts")
          .update({ name })
          .eq("id", id);

  if (nameError) {
    return { error: nameError.message };
  }

  const { error: valuesError } = await supabase.from(valuesTable(kind)).upsert(
    {
      account_id: id,
      year,
      month,
      budget: parseMoney(formData.get("budget")),
      actual: parseMoney(formData.get("actual")),
      current_value: parseMoney(formData.get("current_value")),
    },
    { onConflict: "account_id,year,month" },
  );

  if (valuesError) {
    return { error: valuesError.message };
  }

  revalidatePath(`/months/${formatYearMonth(year, month)}`);
  revalidatePath("/savings");
  return { success: true };
}

export async function deleteFundItem(formData: FormData): Promise<void> {
  const kind = String(formData.get("kind") ?? "");
  if (kind !== "savings" && kind !== "investment") return;

  const id = String(formData.get("id") ?? "");
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  if (!id) return;

  const supabase = await createClient();
  // Deletes account and cascades all month values
  await supabase.from(accountTable(kind)).delete().eq("id", id);

  if (Number.isInteger(year) && Number.isInteger(month)) {
    revalidatePath(`/months/${formatYearMonth(year, month)}`);
  }
  revalidatePath("/savings");
}

export async function createRecurringTemplate(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const description = String(formData.get("description") ?? "").trim();
  const grouping = String(formData.get("grouping") ?? "");
  const type = String(formData.get("type") ?? "");
  const frequency = String(formData.get("frequency") ?? "");
  const amount = parseAmount(formData.get("amount"));

  if (!description || !amount) {
    return { error: "Description and a positive amount are required." };
  }
  if (!isSpendingGrouping(grouping) || !isSpendingType(type)) {
    return { error: "Invalid grouping or type." };
  }
  if (frequency !== "weekly" && frequency !== "monthly") {
    return { error: "Frequency must be weekly or monthly." };
  }

  const weekday =
    frequency === "weekly" ? Number(formData.get("weekday")) : null;
  const month_day =
    frequency === "monthly" ? Number(formData.get("month_day")) : null;

  if (
    frequency === "weekly" &&
    (weekday === null ||
      !Number.isInteger(weekday) ||
      weekday < 0 ||
      weekday > 6)
  ) {
    return { error: "Pick a weekday for weekly templates." };
  }
  if (
    frequency === "monthly" &&
    (month_day === null ||
      !Number.isInteger(month_day) ||
      month_day < 1 ||
      month_day > 28)
  ) {
    return { error: "Pick a day of month (1–28) for monthly templates." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("recurring_templates").insert({
    description,
    amount,
    grouping,
    type,
    frequency,
    weekday,
    month_day,
    active: true,
  });

  if (error) {
    return { error: error.message };
  }

  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  if (Number.isInteger(year) && Number.isInteger(month)) {
    revalidatePath(`/months/${formatYearMonth(year, month)}`);
  }
  return { success: true };
}

export async function updateRecurringTemplate(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const grouping = String(formData.get("grouping") ?? "");
  const type = String(formData.get("type") ?? "");
  const frequency = String(formData.get("frequency") ?? "");
  const amount = parseAmount(formData.get("amount"));
  const active = formData.get("active") === "on" || formData.get("active") === "true";

  if (!id) return { error: "Missing id." };
  if (!description || !amount) {
    return { error: "Description and a positive amount are required." };
  }
  if (!isSpendingGrouping(grouping) || !isSpendingType(type)) {
    return { error: "Invalid grouping or type." };
  }
  if (frequency !== "weekly" && frequency !== "monthly") {
    return { error: "Frequency must be weekly or monthly." };
  }

  const weekday =
    frequency === "weekly" ? Number(formData.get("weekday")) : null;
  const month_day =
    frequency === "monthly" ? Number(formData.get("month_day")) : null;

  if (
    frequency === "weekly" &&
    (weekday === null ||
      !Number.isInteger(weekday) ||
      weekday < 0 ||
      weekday > 6)
  ) {
    return { error: "Pick a weekday for weekly templates." };
  }
  if (
    frequency === "monthly" &&
    (month_day === null ||
      !Number.isInteger(month_day) ||
      month_day < 1 ||
      month_day > 28)
  ) {
    return { error: "Pick a day of month (1–28) for monthly templates." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_templates")
    .update({
      description,
      amount,
      grouping,
      type,
      frequency,
      weekday,
      month_day,
      active,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  if (Number.isInteger(year) && Number.isInteger(month)) {
    revalidatePath(`/months/${formatYearMonth(year, month)}`);
  }
  return { success: true };
}

export async function deleteRecurringTemplate(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("recurring_templates").delete().eq("id", id);

  if (Number.isInteger(year) && Number.isInteger(month)) {
    revalidatePath(`/months/${formatYearMonth(year, month)}`);
  }
}

export async function applyRecurringsToMonth(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return { error: "Invalid year or month." };
  }

  const selectedIds = formData
    .getAll("template_id")
    .map((v) => String(v))
    .filter(Boolean);

  if (selectedIds.length === 0) {
    return { error: "Select at least one recurring template to add." };
  }

  const supabase = await createClient();
  const { data: templates, error: loadError } = await supabase
    .from("recurring_templates")
    .select("*")
    .in("id", selectedIds)
    .eq("active", true);

  if (loadError) {
    return { error: loadError.message };
  }

  if (!templates || templates.length === 0) {
    return { error: "No active templates matched your selection." };
  }

  const boundsStart = `${formatYearMonth(year, month)}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const boundsEnd = `${formatYearMonth(year, month)}-${String(lastDay).padStart(2, "0")}`;

  const { data: existing } = await supabase
    .from("transactions")
    .select("date, description, amount, grouping")
    .gte("date", boundsStart)
    .lte("date", boundsEnd);

  const existingKeys = new Set(
    (existing ?? []).map(
      (t) => `${t.date}|${t.description}|${Number(t.amount)}|${t.grouping}`,
    ),
  );

  const toInsert: {
    date: string;
    description: string;
    amount: number;
    grouping: string;
    type: string;
  }[] = [];

  for (const row of templates) {
    const template = toRecurringTemplate(row);
    const dates = datesForRecurringInMonth(template, year, month);
    for (const date of dates) {
      const key = `${date}|${template.description}|${template.amount}|${template.grouping}`;
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);
      toInsert.push({
        date,
        description: template.description,
        amount: template.amount,
        grouping: template.grouping,
        type: template.type,
      });
    }
  }

  if (toInsert.length === 0) {
    return {
      error: "Nothing new to add — selected recurrings are already in this month.",
    };
  }

  const { error: insertError } = await supabase.from("transactions").insert(toInsert);
  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath(`/months/${formatYearMonth(year, month)}`);
  return { success: true };
}
