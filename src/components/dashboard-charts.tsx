import { formatGbp } from "@/lib/finance/constants";
import {
  MONTH_SHORT_LABELS,
  type YearOverview,
} from "@/lib/finance/year-overview";

type ChartSeries = {
  title: string;
  values: number[];
  color: string;
};

function YearBarChart({ title, values, color }: ChartSeries) {
  const width = 320;
  const height = 160;
  const padX = 8;
  const padTop = 12;
  const padBottom = 28;
  const chartW = width - padX * 2;
  const chartH = height - padTop - padBottom;
  const max = Math.max(...values, 1);
  const barGap = 4;
  const barW = (chartW - barGap * (values.length - 1)) / values.length;

  return (
    <div className="border border-foreground/10 bg-panel/60 p-4">
      <h3 className="text-sm font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-1 text-xs text-muted">
        Year total {formatGbp(values.reduce((a, b) => a + b, 0))}
      </p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-3 h-auto w-full"
        role="img"
        aria-label={`${title} by month`}
      >
        {values.map((value, i) => {
          const barH = (value / max) * chartH;
          const x = padX + i * (barW + barGap);
          const y = padTop + chartH - barH;
          return (
            <g key={MONTH_SHORT_LABELS[i]}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(barH, value > 0 ? 2 : 0)}
                fill={color}
                opacity={0.85}
              />
              <text
                x={x + barW / 2}
                y={height - 8}
                textAnchor="middle"
                className="fill-muted"
                fontSize="9"
              >
                {MONTH_SHORT_LABELS[i]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function DashboardCharts({ overview }: { overview: YearOverview }) {
  const income = overview.months.map((m) => m.income);
  const expenses = overview.months.map((m) => m.expense);
  const savings = overview.months.map((m) => m.savingsTotal);
  const investments = overview.months.map((m) => m.investmentsTotal);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <YearBarChart title="Income" values={income} color="#5a8fbc" />
      <YearBarChart title="Expenses" values={expenses} color="#6b9bc7" />
      <YearBarChart title="Savings" values={savings} color="#7aa8d0" />
      <YearBarChart title="Investments" values={investments} color="#89b5d9" />
    </div>
  );
}
