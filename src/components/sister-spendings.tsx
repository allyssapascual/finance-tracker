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
    <form action={setSisterCardBillingPaid} className="inline-flex shrink-0">
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />
      <input type="hidden" name="card" value={card} />
      <input type="hidden" name="paid" value={paid ? "false" : "true"} />
      <button
        type="submit"
        className={`inline-flex h-9 min-w-[4.5rem] items-center justify-center border px-3 text-xs font-medium sm:h-8 ${
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
            <span className="font-medium text-foreground tabular-nums">
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
          <div
            key={card}
            className="border border-foreground/10 bg-panel/40 p-4 sm:border-0 sm:bg-transparent sm:p-0"
          >
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold tracking-tight sm:text-base">
                  {SISTER_CARD_LABELS[card]}
                </h3>
                <p className="mt-1 text-xs text-muted">
                  {sisterCardDeadlineLabel(card)}
                </p>
                <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl">
                  {formatGbp(cardTotal)}
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
              <p className="border border-dashed border-foreground/15 px-4 py-6 text-sm text-muted sm:border-solid">
                No items on this card for this billing month.
              </p>
            ) : (
              <>
                {/* Mobile: stacked cards */}
                <ul className="space-y-3 md:hidden">
                  {cardRows.map((row) => (
                    <li
                      key={row.id}
                      className="border border-foreground/10 bg-white px-3 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium break-words">
                            {row.description}
                          </p>
                          <p className="mt-1 text-xs text-muted tabular-nums">
                            {row.date} · {GROUPING_LABELS[row.grouping]} ·{" "}
                            {TYPE_LABELS[row.type]}
                          </p>
                        </div>
                        <p className="shrink-0 text-base font-semibold tabular-nums">
                          {formatGbp(row.amount)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Desktop: table */}
                <div className="table-scroll hidden border border-foreground/10 md:block">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-foreground/10 bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
                      <tr>
                        <th className="px-3 py-3 font-medium sm:px-4">
                          Purchase date
                        </th>
                        <th className="px-3 py-3 font-medium sm:px-4">
                          Description
                        </th>
                        <th className="hidden px-3 py-3 font-medium lg:table-cell sm:px-4">
                          Grouping
                        </th>
                        <th className="hidden px-3 py-3 font-medium lg:table-cell sm:px-4">
                          Type
                        </th>
                        <th className="px-3 py-3 font-medium text-right sm:px-4">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cardRows.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-foreground/5 bg-white odd:bg-white even:bg-accent-soft/35 last:border-0"
                        >
                          <td className="whitespace-nowrap px-3 py-3 tabular-nums sm:px-4">
                            {row.date}
                          </td>
                          <td className="max-w-[14rem] px-3 py-3 break-words sm:max-w-none sm:px-4">
                            {row.description}
                          </td>
                          <td className="hidden px-3 py-3 lg:table-cell sm:px-4">
                            {GROUPING_LABELS[row.grouping]}
                          </td>
                          <td className="hidden px-3 py-3 lg:table-cell sm:px-4">
                            {TYPE_LABELS[row.type]}
                          </td>
                          <td className="px-3 py-3 text-right font-medium tabular-nums sm:px-4">
                            {formatGbp(row.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
