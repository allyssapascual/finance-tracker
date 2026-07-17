import {
  formatGbp,
  formatPercent,
  fundProgress,
  type FundItem,
} from "@/lib/finance/constants";

function ProgressBlock({
  current,
  target,
}: {
  current: number;
  target: number;
}) {
  const progress = fundProgress(current, target);
  if (!progress) {
    return <span className="text-xs text-muted">No target set</span>;
  }
  const barWidth = Math.min(100, Math.max(0, progress.percent));
  return (
    <div className="w-full min-w-0">
      <div className="h-2 w-full bg-accent-soft">
        <div className="h-2 bg-accent" style={{ width: `${barWidth}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-muted">
        {progress.reached ? (
          <span className="font-medium text-accent">Reached</span>
        ) : (
          <>
            {formatPercent(progress.percent)}
            {" · "}
            {formatGbp(progress.remaining)} left
          </>
        )}
      </p>
    </div>
  );
}

export function SavingsProgressList({ items }: { items: FundItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted">
        No savings accounts yet. Open a monthly view, go to Totals, and add a
        saving with a target.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {items.map((item) => (
          <li
            key={item.id}
            className="border border-foreground/10 bg-white px-3 py-3"
          >
            <p className="font-medium">{item.name}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm tabular-nums">
              <span>
                Current{" "}
                <span className="font-medium">
                  {formatGbp(item.current_value)}
                </span>
              </span>
              <span>
                Target{" "}
                <span className="font-medium">
                  {item.target > 0 ? formatGbp(item.target) : "—"}
                </span>
              </span>
            </div>
            <div className="mt-3">
              <ProgressBlock
                current={item.current_value}
                target={item.target}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="table-scroll hidden border border-foreground/10 md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-foreground/10 bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="px-3 py-3 font-medium sm:px-4">Name</th>
              <th className="px-3 py-3 font-medium text-right sm:px-4">
                Current
              </th>
              <th className="px-3 py-3 font-medium text-right sm:px-4">
                Target
              </th>
              <th className="px-3 py-3 font-medium sm:px-4">Progress</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-foreground/5 odd:bg-white even:bg-accent-soft/35 last:border-0"
              >
                <td className="px-3 py-3 font-medium sm:px-4">{item.name}</td>
                <td className="px-3 py-3 text-right tabular-nums sm:px-4">
                  {formatGbp(item.current_value)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums sm:px-4">
                  {item.target > 0 ? formatGbp(item.target) : "—"}
                </td>
                <td className="px-3 py-3 sm:px-4">
                  <ProgressBlock
                    current={item.current_value}
                    target={item.target}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
