import { ACTION_LABEL, BIN_COLOR, BIN_LABEL } from "@/lib/format";
import { nextPickup, type ScheduleEntry } from "@/lib/schedule";

export function NextPickup({ schedule }: { schedule: ScheduleEntry[] }) {
  const group = nextPickup(schedule);
  if (!group) return null;

  const hasPullOut = group.items.some((i) => i.action === "PULL_OUT");
  const headline = hasPullOut ? "Bins go out" : "Bins come in";

  return (
    <div className="mt-2 rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-5 text-white shadow-sm">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-white/85">
          Next pickup
        </div>
        <div className="text-xs text-white/85">
          {group.dayLabel}
          {group.daysAhead === 0 ? "" : `, ${formatShortDate(group.date)}`}
        </div>
      </div>

      <div className="mt-1 text-2xl font-semibold tracking-tight">
        {headline} {group.dayLabel.toLowerCase()}
      </div>

      <ul className="mt-3 space-y-1.5">
        {group.items.map((it) => (
          <li
            key={it.id}
            className="flex items-center justify-between gap-3 text-[15px]"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-white/30 ${BIN_COLOR[it.binType] ?? "bg-white/15"}`}
              >
                {BIN_LABEL[it.binType] ?? it.binType}
              </span>
              <span className="text-white">
                {ACTION_LABEL[it.action] ?? it.action}
              </span>
            </div>
            {it.timeWindow && (
              <span className="shrink-0 text-sm text-white/90">
                {it.timeWindow}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatShortDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
