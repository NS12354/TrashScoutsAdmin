import { notFound } from "next/navigation";
import { BrandHeader } from "@/components/BrandHeader";
import { BIN_COLOR, BIN_LABEL, DAY_NAMES } from "@/lib/format";
import { getProperty } from "@/lib/data";

export const dynamic = "force-dynamic";

type DayItem = {
  id: string;
  dayOfWeek: number;
  binType: string;
  action: string;
  binCount: number | null;
  timeWindow: string | null;
};

type Bin = { type: string; count: number | null };

const ACTION_ORDER: Record<string, number> = {
  PULL_OUT: 0,
  RETURN: 1,
  SERVICE_DAY: 2,
};

// Combine a day's rows into "put out" / "bring in" / "service day" groups (one
// per action + time), each listing every bin involved — so a resident reads
// one clear instruction ("Put bins out · by 6:00 PM" with the bins below)
// instead of several cryptic "Trash out" lines.
function groupDay(items: DayItem[]) {
  const map = new Map<
    string,
    { action: string; timeWindow: string | null; bins: Bin[] }
  >();
  for (const it of items) {
    const key = `${it.action}|${it.timeWindow ?? ""}`;
    let g = map.get(key);
    if (!g) {
      g = { action: it.action, timeWindow: it.timeWindow, bins: [] };
      map.set(key, g);
    }
    const existing = g.bins.find((b) => b.type === it.binType);
    if (existing) {
      // If the same bin type is listed twice, keep the larger explicit count.
      if (it.binCount != null) {
        existing.count =
          existing.count != null
            ? Math.max(existing.count, it.binCount)
            : it.binCount;
      }
    } else {
      g.bins.push({ type: it.binType, count: it.binCount });
    }
  }
  return [...map.values()].sort(
    (a, b) => (ACTION_ORDER[a.action] ?? 9) - (ACTION_ORDER[b.action] ?? 9),
  );
}

function actionHeadline(action: string) {
  if (action === "PULL_OUT") return "Put bins out";
  if (action === "RETURN") return "Bring bins in";
  return "Service day";
}

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) return notFound();

  const schedule: DayItem[] = (property.schedule ?? []).map((s, i) => ({
    id: `${id}-${i}`,
    dayOfWeek: s.dayOfWeek,
    binType: s.binType,
    action: s.action,
    binCount: s.binCount ?? null,
    timeWindow: s.timeWindow ?? null,
  }));

  const scheduleByDay = DAY_NAMES.map((name, day) => ({
    day,
    name,
    items: schedule.filter((s) => s.dayOfWeek === day),
  })).filter((d) => d.items.length > 0);

  return (
    <>
      <BrandHeader backHref={`/p/${id}`} />
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">
          Service Schedule
        </h1>
        <p className="mt-1 text-sm capitalize text-zinc-500">{property.name}</p>
      </div>

      {scheduleByDay.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-white px-4 py-8 text-center text-sm text-zinc-500 shadow-sm ring-1 ring-zinc-200">
          No schedule set yet.
        </div>
      ) : (
        <>
          <p className="mt-5 text-sm text-zinc-500">
            Put out the bins shown by the time listed, then bring them back in.
          </p>
          <div className="mt-3 space-y-3">
            {scheduleByDay.map((d) => (
              <div
                key={d.day}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200"
              >
                <div className="border-b border-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-900">
                  {d.name}
                </div>
                <ul className="divide-y divide-zinc-100">
                  {groupDay(d.items).map((g, gi) => {
                    const isOut = g.action === "PULL_OUT";
                    const isService = g.action === "SERVICE_DAY";
                    return (
                      <li key={gi} className="flex items-start gap-3 px-4 py-3">
                        <span
                          className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                            isOut
                              ? "bg-brand/10 text-brand-dark"
                              : isService
                                ? "bg-amber-100 text-amber-700"
                                : "bg-zinc-100 text-zinc-500"
                          }`}
                          aria-hidden
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            {isService ? (
                              <>
                                <circle cx="12" cy="12" r="9" />
                                <path d="M12 7v5l3 2" />
                              </>
                            ) : isOut ? (
                              <path d="M12 19V5M5 12l7-7 7 7" />
                            ) : (
                              <path d="M12 5v14M5 12l7 7 7-7" />
                            )}
                          </svg>
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-[15px] font-semibold text-zinc-900">
                              {actionHeadline(g.action)}
                            </span>
                            {g.timeWindow && (
                              <span className="shrink-0 text-sm font-semibold text-zinc-900">
                                {isService ? "at" : "by"} {g.timeWindow}
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {g.bins.map((bin) => (
                              <span
                                key={bin.type}
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  BIN_COLOR[bin.type] ??
                                  "bg-zinc-200 text-zinc-700"
                                }`}
                              >
                                {BIN_LABEL[bin.type] ?? bin.type}
                                {bin.count != null && ` × ${bin.count}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
