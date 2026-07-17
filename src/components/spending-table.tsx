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

export function SpendingTable({ transactions, defaultDate }: SpendingTableProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);

  const total = useMemo(
    () => transactions.reduce((sum, t) => sum + Number(t.amount), 0),
    [transactions],
  );

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
              · total <span className="font-medium text-foreground">{formatGbp(total)}</span>
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
            <thead className="border-b border-foreground/10 bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Grouping</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-foreground/5 last:border-0">
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
