import { HHW_DROPOFFS, HHW_DROPOFFS_SOURCE_URL } from "@/lib/hhwDropoffs";

export function HHWDropoffList() {
  return (
    <div>
      <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Drop-off facilities
      </h2>
      <ul className="space-y-2">
        {HHW_DROPOFFS.map((d) => (
          <li
            key={d.address}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200"
          >
            <div className="font-semibold text-zinc-900">{d.name}</div>
            <div className="text-sm text-zinc-500">{d.address}</div>

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
        ))}
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
