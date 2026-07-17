import { setSisterCardBillingPaid } from "@/app/actions";
import {
  formatGbp,
  GROUPING_LABELS,
  SISTER_CARD_LABELS,
  SISTER_CARDS,
  sisterCardDeadlineLabel,
  TYPE_LABELS,
  type SisterCard,
  type SpendingGrouping,
  type SpendingType,
} from "@/lib/finance/constants";

export type SisterSpendingRow = {
  id: string;
  amount: number;
  card: SisterCard;
  date: string;
  description: string;
  grouping: SpendingGrouping;
  type: SpendingType;
  transaction_id: string;
};

export type SisterCardPaidMap = Record<SisterCard, boolean>;

function CardPaidToggle({
  year,
  month,
  card,
  paid,
}: {
  year: number;
  month: number;
  card: SisterCard;
  paid: boolean;
}) {
  return (
    <form action={setSisterCardBillingPaid} className="inline-flex">
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />
      <input type="hidden" name="card" value={card} />
      <input type="hidden" name="paid" value={paid ? "false" : "true"} />
      <button
        type="submit"
        className={`inline-flex h-8 items-center border px-3 text-xs font-medium ${
          paid
            ? "border-accent bg-accent text-white hover:bg-accent-hover"
            : "border-foreground/15 bg-surface text-muted hover:border-foreground/30 hover:text-foreground"
        }`}
      >
        {paid ? "Paid" : "Unpaid"}
      </button>
    </form>
  );
}

export function SisterSpendingsTable({
  year,
  month,
  rows,
  paidByCard,
}: {
  year: number;
  month: number;
  rows: SisterSpendingRow[];
  paidByCard: SisterCardPaidMap;
}) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  const byCard = {
    lloyds: rows.filter((r) => r.card === "lloyds"),
    amex: rows.filter((r) => r.card === "amex"),
  };

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted">
        {rows.length === 0 ? (
          "No split spendings for this billing month yet."
        ) : (
          <>
            {rows.length} {rows.length === 1 ? "entry" : "entries"} · sister
            total{" "}
            <span className="font-medium text-foreground">
              {formatGbp(total)}
            </span>
          </>
        )}
      </p>

      {SISTER_CARDS.map((card) => {
        const cardRows = byCard[card];
        const cardTotal = cardRows.reduce((sum, r) => sum + r.amount, 0);
        const paid = paidByCard[card];

        return (
          <div key={card}>
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold tracking-tight">
                  {SISTER_CARD_LABELS[card]}
                </h3>
                <p className="mt-1 text-xs text-muted">
                  {sisterCardDeadlineLabel(card)}
                  {cardRows.length > 0 ? (
                    <>
                      {" "}
                      · {formatGbp(cardTotal)} this month
                    </>
                  ) : null}
                </p>
              </div>
              <CardPaidToggle
                year={year}
                month={month}
                card={card}
                paid={paid}
              />
            </div>

            {cardRows.length === 0 ? (
              <p className="border border-dashed border-foreground/15 px-4 py-6 text-sm text-muted">
                No items on this card for this billing month.
              </p>
            ) : (
              <div className="overflow-x-auto border border-foreground/10">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-foreground/10 bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
                    <tr>
                      <th className="px-4 py-3 font-medium">Purchase date</th>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium">Grouping</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium text-right">
                        Amount
                      </th>
                      <th className="px-4 py-3 font-medium">Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cardRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-foreground/5 odd:bg-white even:bg-accent-soft/35 last:border-0"
                      >
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                          {row.date}
                        </td>
                        <td className="px-4 py-3">{row.description}</td>
                        <td className="px-4 py-3">
                          {GROUPING_LABELS[row.grouping]}
                        </td>
                        <td className="px-4 py-3">{TYPE_LABELS[row.type]}</td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                          {formatGbp(row.amount)}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted">
                          {sisterCardDeadlineLabel(card)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
