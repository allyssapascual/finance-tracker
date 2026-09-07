import Link from "next/link";

export const MONTH_TABS = [
  { id: "log", label: "Log spending", shortLabel: "Log" },
  { id: "summary", label: "Summary & totals", shortLabel: "Summary" },
  { id: "funds", label: "Funds & recurring", shortLabel: "Funds" },
] as const;

export type MonthTabId = (typeof MONTH_TABS)[number]["id"];

export function parseMonthTab(value: string | undefined): MonthTabId {
  if (value === "summary" || value === "funds") return value;
  return "log";
}

export function MonthTabsNav({
  ym,
  active,
}: {
  ym: string;
  active: MonthTabId;
}) {
  return (
    <nav aria-label="Month sections" className="mt-8 border-b border-foreground/10">
      <ul className="-mb-px flex gap-1 overflow-x-auto">
        {MONTH_TABS.map((tab) => {
          const href =
            tab.id === "log" ? `/months/${ym}` : `/months/${ym}?tab=${tab.id}`;
          const isActive = active === tab.id;
          return (
            <li key={tab.id} className="shrink-0">
              <Link
                href={href}
                scroll={false}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex h-11 items-center border-b-2 px-3 text-sm font-medium transition-colors sm:px-4 ${
                  isActive
                    ? "border-accent text-foreground"
                    : "border-transparent text-muted hover:border-foreground/20 hover:text-foreground"
                }`}
              >
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
