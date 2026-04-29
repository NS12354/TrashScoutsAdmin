import { HHW_DROPOFFS, HHW_DROPOFFS_SOURCE_URL } from "@/lib/hhwDropoffs";
import { formatDistance, haversineMeters } from "@/lib/geo";

export function HHWDropoffList({
  referenceLat,
  referenceLng,
}: {
  // Optional reference point — when provided, facilities are sorted nearest
  // first and each row shows its distance from the reference.
  referenceLat?: number;
  referenceLng?: number;
}) {
  const ranked = HHW_DROPOFFS.map((d) => ({
    ...d,
    distance:
      referenceLat != null && referenceLng != null
        ? haversineMeters(referenceLat, referenceLng, d.latitude, d.longitude)
        : null,
  }));

  if (ranked.every((r) => r.distance != null)) {
    ranked.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }

  return (
    <div>
      <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Drop-off facilities{ranked[0]?.distance != null ? " — nearest first" : ""}
      </h2>
      <ul className="space-y-2">
        {ranked.map((d) => {
          const dirHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(d.address)}`;
          return (
            <li
              key={d.address}
              className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-semibold text-zinc-900">{d.name}</span>
                    {d.distance != null && (
                      <span className="text-xs font-medium text-brand-dark">
                        {formatDistance(d.distance)} away
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-zinc-500">{d.address}</div>
                </div>
                <a
                  href={dirHref}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 rounded-md bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100"
                >
                  Directions →
                </a>
              </div>

              <ul className="mt-3 space-y-0.5 text-sm text-zinc-700">
                {d.hours.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
              <div className="mt-1 text-xs text-zinc-500">{d.closures}</div>
              {d.notes && (
                <div className="mt-2 rounded-md bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-700">
                  {d.notes}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs text-zinc-500">
        Hours and closures change periodically.{" "}
        <a
          href={HHW_DROPOFFS_SOURCE_URL}
          target="_blank"
          rel="noreferrer"
          className="text-link hover:underline"
        >
          Check StopWaste&rsquo;s official list ↗
        </a>
        .
      </p>
    </div>
  );
}
