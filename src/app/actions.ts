"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  formatYearMonth,
  isSpendingGrouping,
  isSpendingType,
} from "@/lib/finance/constants";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error: string } | { success: true };

function monthPathFromDate(date: string): string {
  const [year, month] = date.split("-");
  return `/months/${formatYearMonth(Number(year), Number(month))}`;
}

function parseAmount(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) return null;
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

  if (!date || !description || !amount) {
    return { error: "Date, description, and a positive amount are required." };
  }
  if (!isSpendingGrouping(grouping) || !isSpendingType(type)) {
    return { error: "Invalid grouping or type." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("transactions").insert({
    date,
    description,
    grouping,
    type,
    amount,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(monthPathFromDate(date));
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

  if (!id || !date || !description || !amount) {
    return { error: "All fields are required." };
  }
  if (!isSpendingGrouping(grouping) || !isSpendingType(type)) {
    return { error: "Invalid grouping or type." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({ date, description, grouping, type, amount })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(monthPathFromDate(date));
  return { success: true };
}

export async function deleteTransaction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const date = String(formData.get("date") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("transactions").delete().eq("id", id);

  if (date) {
    revalidatePath(monthPathFromDate(date));
  }
}
