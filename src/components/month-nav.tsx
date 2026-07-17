"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  currentYearMonth,
  monthLabel,
  shiftYearMonth,
} from "@/lib/finance/constants";

type MonthNavProps = {
  ym: string;
  /** Path prefix before /{ym}, e.g. "/months" or "/sister" */
  basePath?: string;
};

export function MonthNav({ ym, basePath = "/months" }: MonthNavProps) {
  const router = useRouter();
  const prev = shiftYearMonth(ym, -1);
  const next = shiftYearMonth(ym, 1);
  const thisMonth = currentYearMonth();
  const isCurrent = ym === thisMonth;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Link
        href={`${basePath}/${prev}`}
        className="inline-flex h-10 w-10 items-center justify-center border border-foreground/15 bg-surface text-foreground hover:border-foreground/30"
        aria-label={`Previous month, ${monthLabel(prev)}`}
        title={monthLabel(prev)}
      >
        ←
      </Link>

      <label className="sr-only" htmlFor="month-picker">
        Jump to month
      </label>
      <input
        id="month-picker"
        type="month"
        value={ym}
        onChange={(e) => {
          const value = e.target.value;
          if (/^\d{4}-\d{2}$/.test(value)) {
            router.push(`${basePath}/${value}`);
          }
        }}
        className="h-10 border border-foreground/15 bg-surface px-3 text-sm text-foreground outline-none focus:border-accent"
      />

      <Link
        href={`${basePath}/${next}`}
        className="inline-flex h-10 w-10 items-center justify-center border border-foreground/15 bg-surface text-foreground hover:border-foreground/30"
        aria-label={`Next month, ${monthLabel(next)}`}
        title={monthLabel(next)}
      >
        →
      </Link>

      {!isCurrent ? (
        <Link
          href={`${basePath}/${thisMonth}`}
          className="inline-flex h-10 items-center border border-foreground/15 bg-surface px-3 text-sm font-medium text-foreground hover:border-foreground/30"
        >
          This month
        </Link>
      ) : null}
    </div>
  );
}
