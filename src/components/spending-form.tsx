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
  SISTER_CARD_DEADLINE_DAY,
  SISTER_CARD_LABELS,
  SISTER_CARDS,
  SPENDING_GROUPINGS,
  SPENDING_TYPES,
  TYPE_LABELS,
  currentYearMonth,
  formatYearMonth,
  splitAmountInHalf,
  type SisterCard,
  type Transaction,
} from "@/lib/finance/constants";

type SpendingFormProps = {
  mode: "create" | "edit";
  initial?: Transaction;
  defaultDate: string;
  onClose: () => void;
  onSuccess?: () => void;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseMoneyInput(raw: string): number | null {
  if (raw.trim() === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return roundMoney(n);
}

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

  const existingSplit = initial?.sister_split ?? null;
  const initialFull = existingSplit
    ? roundMoney(Number(initial?.amount ?? 0) + Number(existingSplit.amount))
    : Number(initial?.amount ?? 0);

  const [splitWithSister, setSplitWithSister] = useState(Boolean(existingSplit));
  const [sisterCard, setSisterCard] = useState<SisterCard>(
    existingSplit?.card ?? "lloyds",
  );
  const [sisterMonth, setSisterMonth] = useState(() => {
    if (existingSplit) {
      return formatYearMonth(existingSplit.year, existingSplit.month);
    }
    return currentYearMonth();
  });
  const [fullAmount, setFullAmount] = useState(
    initialFull > 0 ? String(initialFull) : "",
  );
  const [myAmount, setMyAmount] = useState(() => {
    if (existingSplit) return String(roundMoney(Number(initial?.amount ?? 0)));
    if (initialFull > 0) return String(splitAmountInHalf(initialFull).mine);
    return "";
  });
  const [sisterAmount, setSisterAmount] = useState(() => {
    if (existingSplit) return String(roundMoney(Number(existingSplit.amount)));
    if (initialFull > 0) return String(splitAmountInHalf(initialFull).sister);
    return "";
  });

  useEffect(() => {
    if (state && "success" in state) {
      router.refresh();
      onSuccess?.();
      if (mode !== "create") {
        onClose();
      }
    }
  }, [state, mode, onClose, onSuccess, router]);

  function applyHalfSplit(total: number) {
    const { mine, sister } = splitAmountInHalf(total);
    setMyAmount(String(mine));
    setSisterAmount(String(sister));
  }

  function onFullAmountChange(raw: string) {
    setFullAmount(raw);
    if (!splitWithSister) return;
    const total = parseMoneyInput(raw);
    if (total !== null && total > 0) {
      applyHalfSplit(total);
    } else {
      setMyAmount("");
      setSisterAmount("");
    }
  }

  function onToggleSplit(checked: boolean) {
    setSplitWithSister(checked);
    if (!checked) return;
    const total = parseMoneyInput(fullAmount);
    if (total !== null && total > 0) {
      applyHalfSplit(total);
    } else {
      setMyAmount("");
      setSisterAmount("");
    }
  }

  function onMyAmountChange(raw: string) {
    setMyAmount(raw);
    const total = parseMoneyInput(fullAmount);
    const mine = parseMoneyInput(raw);
    if (total === null || total <= 0 || mine === null) return;
    const capped = Math.min(Math.max(0, mine), total);
    const sister = roundMoney(total - capped);
    setSisterAmount(sister > 0 || capped === 0 ? String(sister) : "0");
    if (capped !== mine) {
      setMyAmount(String(capped));
    }
  }

  function onSisterAmountChange(raw: string) {
    setSisterAmount(raw);
    const total = parseMoneyInput(fullAmount);
    const sister = parseMoneyInput(raw);
    if (total === null || total <= 0 || sister === null) return;
    const capped = Math.min(Math.max(0, sister), total);
    const mine = roundMoney(total - capped);
    setMyAmount(mine > 0 || capped === 0 ? String(mine) : "0");
    if (capped !== sister) {
      setSisterAmount(String(capped));
    }
  }

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
        <span className="font-medium">
          Amount (£){splitWithSister ? " — full total" : ""}
        </span>
        <input
          type="number"
          name="amount"
          required
          min="0.01"
          step="0.01"
          value={fullAmount}
          onChange={(e) => onFullAmountChange(e.target.value)}
          placeholder="0.00"
          className="h-11 border border-foreground/15 bg-white px-3 outline-none focus:border-accent"
        />
        {splitWithSister ? (
          <span className="text-xs text-muted">
            Enter the full amount, then adjust your share and hers below. They
            always add up to this total.
          </span>
        ) : null}
      </label>

      <div className="border border-foreground/10 bg-white/60 p-3">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="split_with_sister"
            checked={splitWithSister}
            onChange={(e) => onToggleSplit(e.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="font-medium">Split with sister</span>
            <span className="mt-0.5 block text-xs text-muted">
              Choose her card and billing month, then set how much each of you
              pays.
            </span>
          </span>
        </label>

        {splitWithSister ? (
          <div className="mt-3 flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Her card</span>
              <select
                name="sister_card"
                required
                value={sisterCard}
                onChange={(e) => setSisterCard(e.target.value as SisterCard)}
                className="h-11 border border-foreground/15 bg-white px-3 outline-none focus:border-accent"
              >
                {SISTER_CARDS.map((card) => (
                  <option key={card} value={card}>
                    {SISTER_CARD_LABELS[card]} (due{" "}
                    {SISTER_CARD_DEADLINE_DAY[card]}th)
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Her billing month</span>
              <input
                type="month"
                name="sister_month"
                required
                value={sisterMonth}
                onChange={(e) => setSisterMonth(e.target.value)}
                className="h-11 border border-foreground/15 bg-white px-3 outline-none focus:border-accent"
              />
              <span className="text-xs text-muted">
                When this share should appear on her card list (defaults to this
                month, not the purchase date).
              </span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Your share (£)</span>
                <input
                  type="number"
                  name="my_amount"
                  required
                  min="0"
                  step="0.01"
                  value={myAmount}
                  onChange={(e) => onMyAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="h-11 border border-foreground/15 bg-white px-3 outline-none focus:border-accent"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Her share (£)</span>
                <input
                  type="number"
                  name="sister_amount"
                  required
                  min="0"
                  step="0.01"
                  value={sisterAmount}
                  onChange={(e) => onSisterAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="h-11 border border-foreground/15 bg-white px-3 outline-none focus:border-accent"
                />
              </label>
            </div>
          </div>
        ) : null}
      </div>

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
