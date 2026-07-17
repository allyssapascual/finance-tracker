import Link from "next/link";
import { currentYearMonth } from "@/lib/finance/constants";
import { MONTH_SHORT_LABELS } from "@/lib/finance/year-overview";

type YearNavProps = {
  year: number;
};

export function YearNav({ year }: YearNavProps) {
  const thisYear = new Date().getFullYear();
  const prev = year - 1;
  const next = year + 1;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Link
        href={`/?year=${prev}`}
        className="inline-flex h-10 w-10 items-center justify-center border border-foreground/15 bg-surface text-foreground hover:border-foreground/30"
        aria-label={`Previous year, ${prev}`}
      >
        ←
      </Link>
      <span className="inline-flex h-10 items-center border border-foreground/15 bg-surface px-4 text-sm font-medium tabular-nums">
        {year}
      </span>
      <Link
        href={`/?year=${next}`}
        className="inline-flex h-10 w-10 items-center justify-center border border-foreground/15 bg-surface text-foreground hover:border-foreground/30"
        aria-label={`Next year, ${next}`}
      >
        →
      </Link>
      {year !== thisYear ? (
        <Link
          href={`/?year=${thisYear}`}
          className="inline-flex h-10 items-center border border-foreground/15 bg-surface px-3 text-sm font-medium text-foreground hover:border-foreground/30"
        >
          This year
        </Link>
      ) : null}
    </div>
  );
}

type MonthLinksProps = {
  year: number;
};

export function MonthLinks({ year }: MonthLinksProps) {
  const current = currentYearMonth();

  return (
    <nav aria-label="Months" className="mt-6">
      <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
        Monthly views
      </p>
      <ul className="flex flex-wrap gap-2">
        {MONTH_SHORT_LABELS.map((label, index) => {
          const month = index + 1;
          const ym = `${year}-${String(month).padStart(2, "0")}`;
          const isCurrent = ym === current;
          return (
            <li key={ym}>
              <Link
                href={`/months/${ym}`}
                className={`inline-flex h-9 min-w-12 items-center justify-center border px-3 text-sm font-medium ${
                  isCurrent
                    ? "border-accent bg-accent text-white"
                    : "border-foreground/15 bg-surface text-foreground hover:border-accent hover:bg-accent-soft"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
