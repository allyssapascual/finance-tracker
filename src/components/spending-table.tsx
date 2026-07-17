"use client";

import { useMemo, useState } from "react";
import { deleteTransaction } from "@/app/actions";
import { SpendingPanel } from "@/components/spending-form";
import {
  formatGbp,
  GROUPING_LABELS,
  TYPE_LABELS,
  type Transaction,
} from "@/lib/finance/constants";

type SpendingTableProps = {
  transactions: Transaction[];
  defaultDate: string;
};

type SortKey = "date" | "description" | "grouping" | "type" | "amount";
type SortDir = "asc" | "desc";

const SORT_COLUMNS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "date", label: "Date" },
  { key: "description", label: "Description" },
  { key: "grouping", label: "Grouping" },
  { key: "type", label: "Type" },
  { key: "amount", label: "Amount", align: "right" },
];

function compareTransactions(
  a: Transaction,
  b: Transaction,
  key: SortKey,
  dir: SortDir,
): number {
  const factor = dir === "asc" ? 1 : -1;
  let result = 0;

  switch (key) {
    case "date":
      result = a.date.localeCompare(b.date);
      if (result === 0) {
        result = a.created_at.localeCompare(b.created_at);
      }
      break;
    case "description":
      result = a.description.localeCompare(b.description, "en", {
        sensitivity: "base",
      });
      break;
    case "grouping":
      result = GROUPING_LABELS[a.grouping].localeCompare(
        GROUPING_LABELS[b.grouping],
        "en",
        { sensitivity: "base" },
      );
      break;
    case "type":
      result = TYPE_LABELS[a.type].localeCompare(TYPE_LABELS[b.type], "en", {
        sensitivity: "base",
      });
      break;
    case "amount":
      result = Number(a.amount) - Number(b.amount);
      break;
  }

  if (result === 0 && key !== "date") {
    result = a.date.localeCompare(b.date);
  }

  return result * factor;
}

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  align,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  align?: "right";
  onSort: (key: SortKey) => void;
}) {
  const active = activeKey === sortKey;
  const indicator = active ? (dir === "asc" ? " ↑" : " ↓") : "";

  return (
    <th
      className={`px-4 py-3 font-medium ${align === "right" ? "text-right" : ""}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-0.5 uppercase tracking-wide hover:text-foreground ${
          active ? "text-foreground" : "text-muted"
        } ${align === "right" ? "ml-auto" : ""}`}
        aria-sort={
          active ? (dir === "asc" ? "ascending" : "descending") : "none"
        }
      >
        {label}
        <span className="inline-block w-3 font-normal normal-case" aria-hidden>
          {indicator || " "}
        </span>
      </button>
    </th>
  );
}

export function SpendingTable({ transactions, defaultDate }: SpendingTableProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const total = useMemo(
    () => transactions.reduce((sum, t) => sum + Number(t.amount), 0),
    [transactions],
  );

  const sorted = useMemo(() => {
    return [...transactions].sort((a, b) =>
      compareTransactions(a, b, sortKey, sortDir),
    );
  }, [transactions, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function openCreate() {
    setEditTarget(null);
    setPanelOpen(true);
  }

  function openEdit(tx: Transaction) {
    setEditTarget(tx);
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setEditTarget(null);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {transactions.length}{" "}
          {transactions.length === 1 ? "entry" : "entries"}
          {transactions.length > 0 ? (
            <>
              {" "}
              · total{" "}
              <span className="font-medium text-foreground">{formatGbp(total)}</span>
            </>
          ) : null}
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="h-10 bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Add spending
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="border border-dashed border-foreground/20 px-6 py-14 text-center">
          <p className="text-foreground">No spending this month yet.</p>
          <p className="mt-1 text-sm text-muted">Add your first entry to get started.</p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-5 h-10 bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Add spending
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-foreground/10 bg-white/70">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-foreground/10 bg-accent-soft/40 text-xs tracking-wide">
              <tr>
                {SORT_COLUMNS.map((col) => (
                  <SortHeader
                    key={col.key}
                    label={col.label}
                    sortKey={col.key}
                    activeKey={sortKey}
                    dir={sortDir}
                    align={col.align}
                    onSort={handleSort}
                  />
                ))}
                <th className="px-4 py-3 text-right font-medium text-muted uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-foreground/5 odd:bg-white even:bg-accent-soft/35 last:border-0"
                >
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                    {tx.date}
                  </td>
                  <td className="px-4 py-3">{tx.description}</td>
                  <td className="px-4 py-3">{GROUPING_LABELS[tx.grouping]}</td>
                  <td className="px-4 py-3">{TYPE_LABELS[tx.type]}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {formatGbp(Number(tx.amount))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => openEdit(tx)}
                        className="text-sm text-accent hover:underline"
                      >
                        Edit
                      </button>
                      <form action={deleteTransaction}>
                        <input type="hidden" name="id" value={tx.id} />
                        <input type="hidden" name="date" value={tx.date} />
                        <button
                          type="submit"
                          className="text-sm text-red-700 hover:underline"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SpendingPanel
        open={panelOpen}
        mode={editTarget ? "edit" : "create"}
        initial={editTarget ?? undefined}
        defaultDate={defaultDate}
        onClose={closePanel}
      />
    </div>
  );
}
