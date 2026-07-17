"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import {
  createFundItem,
  deleteFundItem,
  updateFundItem,
  type ActionResult,
} from "@/app/actions";
import {
  formatGbp,
  type FundItem,
} from "@/lib/finance/constants";

type FundKind = "savings" | "investment";

function MoneyInput({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
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

function FundForm({
  kind,
  year,
  month,
  initial,
  onClose,
  onSuccess,
}: {
  kind: FundKind;
  year: number;
  month: number;
  initial?: FundItem;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const action = initial ? updateFundItem : createFundItem;
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    action,
    null,
  );

  useEffect(() => {
    if (state && "success" in state) {
      router.refresh();
      onSuccess?.();
      onClose();
    }
  }, [state, onClose, onSuccess, router]);

  return (
    <form action={formAction} className="flex flex-col gap-3 border border-foreground/10 bg-white/80 p-4">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Name</span>
        <input
          type="text"
          name="name"
          required
          defaultValue={initial?.name ?? ""}
          placeholder={kind === "savings" ? "e.g. Emergency" : "e.g. SS"}
          className="h-10 border border-foreground/15 bg-white px-3 outline-none focus:border-accent"
        />
      </label>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <MoneyInput name="budget" label="Budget" defaultValue={initial?.budget} />
        <MoneyInput name="actual" label="Actual" defaultValue={initial?.actual} />
        <MoneyInput
          name="current_value"
          label="Current"
          defaultValue={initial?.current_value}
        />
        {kind === "savings" ? (
          <MoneyInput
            name="target"
            label="Target"
            defaultValue={initial?.target}
          />
        ) : null}
      </div>

      {state && "error" in state ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="h-10 flex-1 bg-accent text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Saving…" : initial ? "Save" : "Add"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="h-10 px-3 text-sm text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function FundItemsTable({
  kind,
  title,
  year,
  month,
  items,
}: {
  kind: FundKind;
  title: string;
  year: number;
  month: number;
  items: FundItem[];
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const totals = items.reduce(
    (acc, item) => ({
      budget: acc.budget + item.budget,
      actual: acc.actual + item.actual,
      current: acc.current + item.current_value,
    }),
    { budget: 0, actual: 0, current: 0 },
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          <p className="mt-1 text-xs text-muted">
            Names
            {kind === "savings" ? " and targets" : ""} apply to every month.
            Budget, actual, and current value are for this month only. Delete
            removes the account from all months.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setAdding(true);
          }}
          className="h-9 bg-accent px-3 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Add {kind === "savings" ? "saving" : "investment"}
        </button>
      </div>

      {adding ? (
        <div className="mb-4">
          <FundForm
            kind={kind}
            year={year}
            month={month}
            onClose={() => setAdding(false)}
          />
        </div>
      ) : null}

      {items.length === 0 && !adding ? (
        <p className="mb-3 text-sm text-muted">
          No {kind} yet. Add one to track budget, actual, and current value.
        </p>
      ) : null}

      {items.length > 0 ? (
        <div className="table-scroll border border-foreground/10 bg-white/70">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-foreground/10 bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium text-right">Budget</th>
                <th className="px-4 py-3 font-medium text-right">Actual</th>
                <th className="px-4 py-3 font-medium text-right">Current value</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-foreground/5 odd:bg-white even:bg-accent-soft/35"
                >
                  {editingId === item.id ? (
                    <td colSpan={5} className="px-4 py-3">
                      <FundForm
                        kind={kind}
                        year={year}
                        month={month}
                        initial={item}
                        onClose={() => setEditingId(null)}
                      />
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatGbp(item.budget)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatGbp(item.actual)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatGbp(item.current_value)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setAdding(false);
                              setEditingId(item.id);
                            }}
                            className="text-sm text-accent hover:underline"
                          >
                            Edit
                          </button>
                          <form action={deleteFundItem}>
                            <input type="hidden" name="kind" value={kind} />
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="year" value={year} />
                            <input type="hidden" name="month" value={month} />
                            <button
                              type="submit"
                              className="text-sm text-red-700 hover:underline"
                            >
                              Delete
                            </button>
                          </form>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              <tr className="bg-accent-soft/20 font-medium">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatGbp(totals.budget)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatGbp(totals.actual)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatGbp(totals.current)}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
