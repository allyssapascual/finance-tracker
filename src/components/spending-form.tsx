"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import {
  createTransaction,
  updateTransaction,
  type ActionResult,
} from "@/app/actions";
import {
  GROUPING_LABELS,
  SPENDING_GROUPINGS,
  SPENDING_TYPES,
  TYPE_LABELS,
  type Transaction,
} from "@/lib/finance/constants";

type SpendingFormProps = {
  mode: "create" | "edit";
  initial?: Transaction;
  defaultDate: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export function SpendingForm({
  mode,
  initial,
  defaultDate,
  onClose,
  onSuccess,
}: SpendingFormProps) {
  const router = useRouter();
  const action = mode === "create" ? createTransaction : updateTransaction;
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    action,
    null,
  );

  useEffect(() => {
    if (state && "success" in state) {
      router.refresh();
      onSuccess?.();
      if (mode !== "create") {
        onClose();
      }
    }
  }, [state, mode, onClose, onSuccess, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {mode === "edit" && initial ? (
        <input type="hidden" name="id" value={initial.id} />
      ) : null}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Date</span>
        <input
          type="date"
          name="date"
          required
          defaultValue={initial?.date ?? defaultDate}
          className="h-11 border border-foreground/15 bg-white px-3 outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Description</span>
        <input
          type="text"
          name="description"
          required
          defaultValue={initial?.description ?? ""}
          placeholder="e.g. Tesco"
          className="h-11 border border-foreground/15 bg-white px-3 outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Grouping</span>
        <select
          name="grouping"
          required
          defaultValue={initial?.grouping ?? "shopping"}
          className="h-11 border border-foreground/15 bg-white px-3 outline-none focus:border-accent"
        >
          {SPENDING_GROUPINGS.map((g) => (
            <option key={g} value={g}>
              {GROUPING_LABELS[g]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Type</span>
        <select
          name="type"
          required
          defaultValue={initial?.type ?? "wants"}
          className="h-11 border border-foreground/15 bg-white px-3 outline-none focus:border-accent"
        >
          {SPENDING_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Amount (£)</span>
        <input
          type="number"
          name="amount"
          required
          min="0.01"
          step="0.01"
          defaultValue={initial?.amount ?? ""}
          placeholder="0.00"
          className="h-11 border border-foreground/15 bg-white px-3 outline-none focus:border-accent"
        />
      </label>

      {state && "error" in state ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="mt-2 flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-11 flex-1 bg-accent text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Add spending"
              : "Save changes"}
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

type SpendingPanelProps = {
  open: boolean;
  mode: "create" | "edit";
  initial?: Transaction;
  defaultDate: string;
  onClose: () => void;
};

export function SpendingPanel({
  open,
  mode,
  initial,
  defaultDate,
  onClose,
}: SpendingPanelProps) {
  const [formKey, setFormKey] = useState(0);

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
          <h2 className="text-lg font-semibold tracking-tight">
            {mode === "create" ? "Add spending" : "Edit spending"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted hover:text-foreground"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <SpendingForm
            key={`${mode}-${initial?.id ?? "new"}-${formKey}`}
            mode={mode}
            initial={initial}
            defaultDate={defaultDate}
            onClose={onClose}
            onSuccess={() => {
              if (mode === "create") {
                setFormKey((k) => k + 1);
              }
            }}
          />
          {mode === "create" ? (
            <p className="mt-4 text-xs text-muted">
              After saving, the form clears so you can add another entry.
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
