"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import {
  applyRecurringsToMonth,
  createRecurringTemplate,
  deleteRecurringTemplate,
  updateRecurringTemplate,
  type ActionResult,
} from "@/app/actions";
import {
  datesForRecurringInMonth,
  formatGbp,
  GROUPING_LABELS,
  SPENDING_GROUPINGS,
  SPENDING_TYPES,
  TYPE_LABELS,
  WEEKDAY_LABELS,
  type RecurringTemplate,
} from "@/lib/finance/constants";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function TemplateForm({
  year,
  month,
  initial,
  onClose,
}: {
  year: number;
  month: number;
  initial?: RecurringTemplate;
  onClose: () => void;
}) {
  const router = useRouter();
  const action = initial ? updateRecurringTemplate : createRecurringTemplate;
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    action,
    null,
  );
  const [frequency, setFrequency] = useState<"weekly" | "monthly">(
    initial?.frequency ?? "monthly",
  );

  useEffect(() => {
    if (state && "success" in state) {
      router.refresh();
      onClose();
    }
  }, [state, onClose, router]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 border border-foreground/10 bg-panel p-4"
    >
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}

      <Field label="Description">
        <input
          name="description"
          required
          defaultValue={initial?.description ?? ""}
          placeholder="e.g. Netflix, Weekly groceries"
          className="h-10 border border-foreground/15 bg-white px-3 outline-none focus:border-accent"
        />
      </Field>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Field label="Amount (£)">
          <input
            type="number"
            name="amount"
            required
            min="0.01"
            step="0.01"
            defaultValue={initial?.amount ?? ""}
            className="h-10 border border-foreground/15 bg-white px-3 outline-none focus:border-accent"
          />
        </Field>
        <Field label="Grouping">
          <select
            name="grouping"
            defaultValue={initial?.grouping ?? "bills"}
            className="h-10 border border-foreground/15 bg-white px-3 outline-none focus:border-accent"
          >
            {SPENDING_GROUPINGS.map((g) => (
              <option key={g} value={g}>
                {GROUPING_LABELS[g]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Type">
          <select
            name="type"
            defaultValue={initial?.type ?? "needs"}
            className="h-10 border border-foreground/15 bg-white px-3 outline-none focus:border-accent"
          >
            {SPENDING_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Frequency">
          <select
            name="frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as "weekly" | "monthly")}
            className="h-10 border border-foreground/15 bg-white px-3 outline-none focus:border-accent"
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
          </select>
        </Field>
      </div>

      {frequency === "weekly" ? (
        <Field label="Day of week">
          <select
            name="weekday"
            defaultValue={initial?.weekday ?? 1}
            className="h-10 border border-foreground/15 bg-white px-3 outline-none focus:border-accent"
          >
            {WEEKDAY_LABELS.map((label, i) => (
              <option key={label} value={i}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <Field label="Day of month (1–28)">
          <input
            type="number"
            name="month_day"
            min={1}
            max={28}
            defaultValue={initial?.month_day ?? 1}
            className="h-10 border border-foreground/15 bg-white px-3 outline-none focus:border-accent"
          />
        </Field>
      )}

      {initial ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            value="true"
            defaultChecked={initial.active}
          />
          Active (can be selected when adding to a month)
        </label>
      ) : null}

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
          {pending ? "Saving…" : initial ? "Save template" : "Add template"}
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

export function RecurringSection({
  year,
  month,
  templates,
}: {
  year: number;
  month: number;
  templates: RecurringTemplate[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const activeTemplates = useMemo(
    () => templates.filter((t) => t.active),
    [templates],
  );

  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setSelected((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        if (activeTemplates.some((t) => t.id === id)) next.add(id);
      }
      return next;
    });
  }, [activeTemplates]);

  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    applyRecurringsToMonth,
    null,
  );

  useEffect(() => {
    if (state && "success" in state) {
      router.refresh();
      setSelected(new Set());
    }
  }, [state, router]);

  const allActiveSelected =
    activeTemplates.length > 0 &&
    activeTemplates.every((t) => selected.has(t.id));

  function toggleAll() {
    if (allActiveSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(activeTemplates.map((t) => t.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Recurring</h2>
          <p className="mt-1 text-sm text-muted">
            Tick the templates you want, then add them to this month — or select
            all. Skips duplicates already in spending.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setAdding(true);
          }}
          className="h-10 border border-foreground/15 bg-surface px-4 text-sm font-medium hover:border-foreground/30"
        >
          New template
        </button>
      </div>

      {adding ? (
        <div className="mb-4">
          <TemplateForm year={year} month={month} onClose={() => setAdding(false)} />
        </div>
      ) : null}

      {templates.length === 0 && !adding ? (
        <p className="text-sm text-muted">
          No templates yet. Add Netflix (monthly) or groceries (weekly), then
          select and add them to this month.
        </p>
      ) : null}

      {templates.length > 0 ? (
        <>
          <form action={formAction} className="mb-3 flex flex-wrap items-center gap-3">
            <input type="hidden" name="year" value={year} />
            <input type="hidden" name="month" value={month} />
            {[...selected].map((id) => (
              <input key={id} type="hidden" name="template_id" value={id} />
            ))}
            <button
              type="button"
              onClick={toggleAll}
              className="h-9 border border-foreground/15 px-3 text-sm hover:border-foreground/30"
              disabled={activeTemplates.length === 0}
            >
              {allActiveSelected ? "Clear selection" : "Select all active"}
            </button>
            <button
              type="submit"
              disabled={pending || selected.size === 0}
              className="h-9 bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {pending
                ? "Adding…"
                : selected.size === 0
                  ? "Add selected"
                  : `Add selected (${selected.size})`}
            </button>
            {state && "error" in state ? (
              <span className="text-sm text-red-700">{state.error}</span>
            ) : null}
            {state && "success" in state ? (
              <span className="text-sm text-accent">Done — spending list updated.</span>
            ) : null}
          </form>

          <div className="overflow-x-auto border border-foreground/10 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-foreground/10 bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Add</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Schedule</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">This month</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => {
                  const dates = datesForRecurringInMonth(t, year, month);
                  const schedule =
                    t.frequency === "weekly"
                      ? `Weekly · ${WEEKDAY_LABELS[t.weekday ?? 0]}`
                      : `Monthly · day ${t.month_day}`;
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-foreground/5 odd:bg-white even:bg-accent-soft/35"
                    >
                      {editingId === t.id ? (
                        <td colSpan={6} className="px-4 py-3">
                          <TemplateForm
                            year={year}
                            month={month}
                            initial={t}
                            onClose={() => setEditingId(null)}
                          />
                        </td>
                      ) : (
                        <>
                          <td className="px-4 py-3">
                            {t.active ? (
                              <input
                                type="checkbox"
                                checked={selected.has(t.id)}
                                onChange={() => toggleOne(t.id)}
                                aria-label={`Select ${t.description}`}
                              />
                            ) : (
                              <span className="text-xs text-muted">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{t.description}</div>
                            <div className="text-xs text-muted">
                              {GROUPING_LABELS[t.grouping]} · {TYPE_LABELS[t.type]}
                              {!t.active ? " · paused" : ""}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted">{schedule}</td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium">
                            {formatGbp(t.amount)}
                          </td>
                          <td className="px-4 py-3 text-muted">
                            {t.active
                              ? `${dates.length}× → ${formatGbp(t.amount * dates.length)}`
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-3">
                              {t.active ? (
                                <button
                                  type="button"
                                  className="text-sm text-accent hover:underline"
                                  onClick={() => {
                                    const fd = new FormData();
                                    fd.set("year", String(year));
                                    fd.set("month", String(month));
                                    fd.append("template_id", t.id);
                                    void applyRecurringsToMonth(null, fd).then(
                                      (result) => {
                                        if (result && "success" in result) {
                                          router.refresh();
                                        } else if (result && "error" in result) {
                                          window.alert(result.error);
                                        }
                                      },
                                    );
                                  }}
                                >
                                  Add only
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => {
                                  setAdding(false);
                                  setEditingId(t.id);
                                }}
                                className="text-sm text-accent hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="text-sm text-red-700 hover:underline"
                                onClick={() => {
                                  const fd = new FormData();
                                  fd.set("id", t.id);
                                  fd.set("year", String(year));
                                  fd.set("month", String(month));
                                  void deleteRecurringTemplate(fd).then(() =>
                                    router.refresh(),
                                  );
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
