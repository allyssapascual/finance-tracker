import {
  formatGbp,
  formatPercent,
  fundProgress,
  type FundItem,
} from "@/lib/finance/constants";

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
    <div className="overflow-x-auto border border-foreground/10">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-foreground/10 bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium text-right">Current</th>
            <th className="px-4 py-3 font-medium text-right">Target</th>
            <th className="px-4 py-3 font-medium">Progress</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const progress = fundProgress(item.current_value, item.target);
            const barWidth = progress
              ? Math.min(100, Math.max(0, progress.percent))
              : 0;

            return (
              <tr
                key={item.id}
                className="border-b border-foreground/5 odd:bg-white even:bg-accent-soft/35 last:border-0"
              >
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatGbp(item.current_value)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {item.target > 0 ? formatGbp(item.target) : "—"}
                </td>
                <td className="px-4 py-3">
                  {progress ? (
                    <div className="min-w-[12rem]">
                      <div className="h-2 w-full bg-accent-soft">
                        <div
                          className="h-2 bg-accent"
                          style={{ width: `${barWidth}%` }}
                        />
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
                  ) : (
                    <span className="text-xs text-muted">No target set</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
