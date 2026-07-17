"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { upsertMonthPlan, type ActionResult } from "@/app/actions";
import {
  EMPTY_GROUPING_BUDGETS,
  EMPTY_MONTH_PLAN,
  GROUPING_LABELS,
  SPENDING_GROUPINGS,
  type GroupingBudgetMap,
  type MonthPlan,
} from "@/lib/finance/constants";

function MoneyField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <input
        type="number"
        name={name}
        min="0"
        step="0.01"
        defaultValue={defaultValue || ""}
        placeholder="0.00"
        className="h-10 border border-foreground/15 bg-white px-3 outline-none focus:border-accent"
      />
    </label>
  );
}

type MonthSetupFormProps = {
  year: number;
  month: number;
  initial: MonthPlan | null;
  groupingBudgets: GroupingBudgetMap;
  onClose: () => void;
};

export function MonthSetupForm({
  year,
  month,
  initial,
  groupingBudgets,
  onClose,
}: MonthSetupFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    upsertMonthPlan,
    null,
  );
  const p = initial ?? { ...EMPTY_MONTH_PLAN, id: "", year, month };
  const budgets = { ...EMPTY_GROUPING_BUDGETS, ...groupingBudgets };

  useEffect(() => {
    if (state && "success" in state) {
      router.refresh();
      onClose();
    }
  }, [state, onClose, router]);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />

      <section>
        <h3 className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">
          Income
        </h3>
        <MoneyField name="income" label="Income" defaultValue={p.income} />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">
          Spending budgets by grouping
        </h3>
        <p className="mb-3 text-xs text-muted">
          Used in Totals for budget vs actual %. Overall expense budget is the sum
          of these.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {SPENDING_GROUPINGS.map((g) => (
            <MoneyField
              key={g}
              name={`budget_${g}`}
              label={GROUPING_LABELS[g]}
              defaultValue={budgets[g]}
            />
          ))}
        </div>
      </section>

      <p className="text-xs text-muted">
        Manage individual savings and investments in the Totals section below.
      </p>

      {state && "error" in state ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-11 flex-1 bg-accent text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save month setup"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="h-11 px-4 text-sm font-medium text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

type MonthSetupPanelProps = {
  open: boolean;
  year: number;
  month: number;
  initial: MonthPlan | null;
  groupingBudgets: GroupingBudgetMap;
  onClose: () => void;
};

export function MonthSetupPanel({
  open,
  year,
  month,
  initial,
  groupingBudgets,
  onClose,
}: MonthSetupPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close panel"
        className="absolute inset-0 bg-foreground/20"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-foreground/10 bg-panel shadow-xl">
        <div className="flex items-center justify-between border-b border-foreground/10 px-5 py-4">
          <h2 className="text-lg font-semibold tracking-tight">Setup month</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted hover:text-foreground"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <MonthSetupForm
            year={year}
            month={month}
            initial={initial}
            groupingBudgets={groupingBudgets}
            onClose={onClose}
          />
        </div>
      </aside>
    </div>
  );
}

type MonthSetupButtonProps = {
  year: number;
  month: number;
  initial: MonthPlan | null;
  groupingBudgets: GroupingBudgetMap;
};

export function MonthSetupButton({
  year,
  month,
  initial,
  groupingBudgets,
}: MonthSetupButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-10 border border-foreground/15 bg-surface px-4 text-sm font-medium text-foreground hover:border-foreground/30"
      >
        Setup month
      </button>
      <MonthSetupPanel
        open={open}
        year={year}
        month={month}
        initial={initial}
        groupingBudgets={groupingBudgets}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
