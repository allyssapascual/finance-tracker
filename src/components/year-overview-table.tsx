import Link from "next/link";
import { formatGbp } from "@/lib/finance/constants";
import {
  MONTH_SHORT_LABELS,
  type YearOverview,
} from "@/lib/finance/year-overview";

function moneyCell(amount: number): string {
  if (amount === 0) return "—";
  return formatGbp(amount);
}

export function YearOverviewTable({ overview }: { overview: YearOverview }) {
  const { savingsAccounts, investmentAccounts, months, totals } = overview;
  const savingsCols = Math.max(savingsAccounts.length, 1);
  const investCols = Math.max(investmentAccounts.length, 1);

  return (
    <div className="table-scroll border border-foreground/10">
      <table className="min-w-[40rem] border-collapse text-xs sm:min-w-full sm:text-sm">
        <thead>
          <tr className="bg-accent-soft/80 text-left">
            <th
              rowSpan={2}
              className="sticky-col border-b border-r border-foreground/10 bg-accent-soft/80 px-2 py-2 font-semibold sm:px-3"
            >
              Month
            </th>
            <th
              rowSpan={2}
              className="border-b border-r border-foreground/10 px-3 py-2 text-right font-semibold"
            >
              Income
            </th>
            <th
              colSpan={savingsCols + 1}
              className="border-b border-r border-foreground/10 px-3 py-2 text-center font-semibold"
            >
              Savings
            </th>
            <th
              colSpan={investCols + 1}
              className="border-b border-r border-foreground/10 px-3 py-2 text-center font-semibold"
            >
              Investments
            </th>
            <th
              rowSpan={2}
              className="border-b border-foreground/10 px-3 py-2 text-right font-semibold"
            >
              Expenses
            </th>
          </tr>
          <tr className="bg-accent-soft/50 text-left text-xs text-muted">
            {savingsAccounts.length === 0 ? (
              <th className="border-b border-r border-foreground/10 px-3 py-2 font-medium">
                —
              </th>
            ) : (
              savingsAccounts.map((a) => (
                <th
                  key={a.id}
                  className="border-b border-r border-foreground/10 px-3 py-2 font-medium"
                >
                  {a.name}
                </th>
              ))
            )}
            <th className="border-b border-r border-foreground/10 px-3 py-2 text-right font-medium">
              Total
            </th>
            {investmentAccounts.length === 0 ? (
              <th className="border-b border-r border-foreground/10 px-3 py-2 font-medium">
                —
              </th>
            ) : (
              investmentAccounts.map((a) => (
                <th
                  key={a.id}
                  className="border-b border-r border-foreground/10 px-3 py-2 font-medium"
                >
                  {a.name}
                </th>
              ))
            )}
            <th className="border-b border-r border-foreground/10 px-3 py-2 text-right font-medium">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {months.map((row, index) => (
            <tr
              key={row.ym}
              className="border-b border-foreground/5 odd:bg-white even:bg-accent-soft/35 last:border-0"
            >
              <td className="sticky-col border-r border-foreground/5 bg-inherit px-2 py-2.5 font-medium odd:bg-white even:bg-accent-soft/35 sm:px-3">
                <Link
                  href={`/months/${row.ym}`}
                  className="text-accent hover:text-accent-hover hover:underline"
                >
                  {MONTH_SHORT_LABELS[index]}
                </Link>
              </td>
              <td className="border-r border-foreground/5 px-3 py-2.5 text-right tabular-nums">
                {moneyCell(row.income)}
              </td>
              {savingsAccounts.length === 0 ? (
                <td className="border-r border-foreground/5 px-3 py-2.5 text-right text-muted">
                  —
                </td>
              ) : (
                savingsAccounts.map((a) => (
                  <td
                    key={a.id}
                    className="border-r border-foreground/5 px-3 py-2.5 text-right tabular-nums"
                  >
                    {moneyCell(row.savingsByAccount[a.id] ?? 0)}
                  </td>
                ))
              )}
              <td className="border-r border-foreground/5 px-3 py-2.5 text-right font-medium tabular-nums">
                {moneyCell(row.savingsTotal)}
              </td>
              {investmentAccounts.length === 0 ? (
                <td className="border-r border-foreground/5 px-3 py-2.5 text-right text-muted">
                  —
                </td>
              ) : (
                investmentAccounts.map((a) => (
                  <td
                    key={a.id}
                    className="border-r border-foreground/5 px-3 py-2.5 text-right tabular-nums"
                  >
                    {moneyCell(row.investmentsByAccount[a.id] ?? 0)}
                  </td>
                ))
              )}
              <td className="border-r border-foreground/5 px-3 py-2.5 text-right font-medium tabular-nums">
                {moneyCell(row.investmentsTotal)}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                {moneyCell(row.expense)}
              </td>
            </tr>
          ))}
          <tr className="bg-accent-soft/60 font-semibold">
            <td className="sticky-col border-r border-foreground/10 bg-accent-soft/60 px-2 py-2.5 sm:px-3">
              Total
            </td>
            <td className="border-r border-foreground/10 px-3 py-2.5 text-right tabular-nums">
              {moneyCell(totals.income)}
            </td>
            {savingsAccounts.length === 0 ? (
              <td className="border-r border-foreground/10 px-3 py-2.5 text-right">
                —
              </td>
            ) : (
              savingsAccounts.map((a) => (
                <td
                  key={a.id}
                  className="border-r border-foreground/10 px-3 py-2.5 text-right tabular-nums"
                >
                  {moneyCell(totals.savingsByAccount[a.id] ?? 0)}
                </td>
              ))
            )}
            <td className="border-r border-foreground/10 px-3 py-2.5 text-right tabular-nums">
              {moneyCell(totals.savingsTotal)}
            </td>
            {investmentAccounts.length === 0 ? (
              <td className="border-r border-foreground/10 px-3 py-2.5 text-right">
                —
              </td>
            ) : (
              investmentAccounts.map((a) => (
                <td
                  key={a.id}
                  className="border-r border-foreground/10 px-3 py-2.5 text-right tabular-nums"
                >
                  {moneyCell(totals.investmentsByAccount[a.id] ?? 0)}
                </td>
              ))
            )}
            <td className="border-r border-foreground/10 px-3 py-2.5 text-right tabular-nums">
              {moneyCell(totals.investmentsTotal)}
            </td>
            <td className="px-3 py-2.5 text-right tabular-nums">
              {moneyCell(totals.expense)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
