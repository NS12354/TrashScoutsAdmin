import { notFound } from "next/navigation";
import { BrandHeader } from "@/components/BrandHeader";
import { BIN_COLOR, DAY_NAMES, formatBinBadge } from "@/lib/format";
import { getProperty } from "@/lib/data";

export const dynamic = "force-dynamic";

type DayItem = {
  dayOfWeek: number;
  binType: string;
  action: string;
  binCount: number | null;
  binSize: number | null;
  timeWindow: string | null;
};

type Bin = { type: string; count: number | null; size: number | null };

// Combine a day's rows into a single list of bins serviced that day.
// We intentionally drop the PULL_OUT / RETURN / SERVICE_DAY distinction
// from the resident view — those are internal-ops concepts and we don't
// want to communicate them to residents. RETURN rows are skipped
// entirely so a same-day pull-out + bring-in pair only shows up once.
function bineDay(items: DayItem[]): Bin[] {
  const bins: Bin[] = [];
  for (const it of items) {
    if (it.action === "RETURN") continue;
    const sizeKey = it.binSize ?? "_";
    const existing = bins.find(
      (b) => b.type === it.binType && (b.size ?? "_") === sizeKey,
    );
    if (existing) {
      if (it.binCount != null) {
        existing.count =
          existing.count != null
            ? Math.max(existing.count, it.binCount)
            : it.binCount;
      }
    } else {
      bins.push({
        type: it.binType,
        count: it.binCount,
        size: it.binSize,
      });
    }
  }
  return bins;
}

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) return notFound();

  const schedule: DayItem[] = (property.schedule ?? []).map((s) => ({
    dayOfWeek: s.dayOfWeek,
    binType: s.binType,
    action: s.action,
    binCount: s.binCount ?? null,
    binSize: s.binSize ?? null,
    timeWindow: s.timeWindow ?? null,
  }));

  const scheduleByDay = DAY_NAMES.map((name, day) => ({
    day,
    name,
    bins: bineDay(schedule.filter((s) => s.dayOfWeek === day)),
  })).filter((d) => d.bins.length > 0);

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
            Below are the days the hauler services the bins.
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
                  {d.bins.map((bin, i) => (
                    <li
                      key={`${bin.type}-${bin.size ?? "_"}-${i}`}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          BIN_COLOR[bin.type] ?? "bg-zinc-200 text-zinc-700"
                        }`}
                      >
                        {formatBinBadge(bin.type, bin.count, bin.size)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
