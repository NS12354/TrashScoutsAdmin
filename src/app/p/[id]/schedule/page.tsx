import { notFound } from "next/navigation";
import { BrandHeader } from "@/components/BrandHeader";
import { NextPickup } from "@/components/NextPickup";
import { BIN_COLOR, BIN_LABEL, DAY_NAMES } from "@/lib/format";
import { getProperty } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) return notFound();

  const schedule = (property.schedule ?? []).map((s, i) => ({
    id: `${id}-${i}`,
    dayOfWeek: s.dayOfWeek,
    binType: s.binType,
    action: s.action,
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
          Service schedule
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{property.name}</p>
      </div>

      <NextPickup schedule={schedule} />

      {scheduleByDay.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-white px-4 py-8 text-center text-sm text-zinc-500 shadow-sm ring-1 ring-zinc-200">
          No schedule set yet.
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
          <ul className="divide-y divide-zinc-100">
            {scheduleByDay.map((d) => (
              <li key={d.day} className="px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {d.name}
                </div>
                <ul className="mt-2 space-y-1.5">
                  {d.items.map((item) => {
                    const direction = item.action === "PULL_OUT" ? "out" : "in";
                    return (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-3 text-[15px]"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${BIN_COLOR[item.binType] ?? "bg-zinc-200 text-zinc-700"}`}
                          >
                            {BIN_LABEL[item.binType] ?? item.binType}
                          </span>
                          <span className="font-medium text-zinc-800">
                            {direction}
                          </span>
                        </span>
                        {item.timeWindow && (
                          <span className="shrink-0 font-semibold text-zinc-900">
                            {item.timeWindow}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
