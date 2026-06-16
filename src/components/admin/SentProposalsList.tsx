import Link from "next/link";

export type SentProposalRow = {
  id: string;
  token: string;
  clientName: string;
  clientEmail: string;
  monthlyPrice: number;
  weeklyPrice: number;
  sentAt: string | null;
  viewedAt: string | null;
  acceptedAt: string | null;
  validUntil: string;
  createdByName: string | null;
  property: { id: string; name: string } | null;
  // The most-recent signed agreement, if any. Used to render the "View
  // signed agreement" link without a second round-trip.
  latestAgreement: {
    id: string;
    signerName: string;
    signedAt: string;
  } | null;
};

function usd(n: number): string {
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

type Status = {
  label: string;
  className: string;
};

function status(p: SentProposalRow): Status {
  if (p.acceptedAt) {
    return {
      label: "Signed",
      className: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
    };
  }
  if (new Date(p.validUntil) < new Date()) {
    return {
      label: "Expired",
      className: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
    };
  }
  if (p.viewedAt) {
    return {
      label: "Viewed",
      className: "bg-blue-100 text-blue-800 ring-1 ring-blue-200",
    };
  }
  return {
    label: "Sent",
    className: "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200",
  };
}

function relDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

export function SentProposalsList({
  proposals,
  showProperty = false,
  emptyMessage = "No proposals sent yet.",
}: {
  proposals: SentProposalRow[];
  showProperty?: boolean;
  emptyMessage?: string;
}) {
  if (proposals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-2.5 text-left font-semibold">Client</th>
            {showProperty && (
              <th className="px-4 py-2.5 text-left font-semibold">Property</th>
            )}
            <th className="px-4 py-2.5 text-left font-semibold">Rate</th>
            <th className="px-4 py-2.5 text-left font-semibold">Status</th>
            <th className="px-4 py-2.5 text-left font-semibold">Date</th>
            <th className="px-4 py-2.5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {proposals.map((p) => {
            const s = status(p);
            // Pick the most informative date for the row — accepted >
            // viewed > sent — so the column always shows the latest
            // event for that proposal.
            const dateLabel = p.acceptedAt
              ? `Signed ${relDate(p.acceptedAt)}`
              : p.viewedAt
                ? `Viewed ${relDate(p.viewedAt)}`
                : `Sent ${relDate(p.sentAt)}`;
            return (
              <tr key={p.id}>
                <td className="px-4 py-3 align-top">
                  <div className="font-medium text-zinc-900">
                    {p.clientName}
                  </div>
                  <div className="text-xs text-zinc-500">{p.clientEmail}</div>
                </td>
                {showProperty && (
                  <td className="px-4 py-3 align-top text-zinc-700">
                    {p.property ? (
                      <Link
                        href={`/admin/properties/${p.property.id}/pricing`}
                        className="hover:underline"
                      >
                        {p.property.name}
                      </Link>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                )}
                <td className="px-4 py-3 align-top">
                  <div className="font-semibold text-zinc-900">
                    {usd(p.monthlyPrice)}
                    <span className="ml-0.5 text-xs font-normal text-zinc-500">
                      /mo
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500">
                    {usd(p.weeklyPrice)}/wk
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.className}`}
                  >
                    {s.label}
                  </span>
                  {p.latestAgreement && (
                    <div className="mt-1 text-xs text-zinc-500">
                      by {p.latestAgreement.signerName}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 align-top text-xs text-zinc-600">
                  {dateLabel}
                  {p.createdByName && (
                    <div className="text-zinc-400">
                      sent by {p.createdByName}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                  {p.latestAgreement && (
                    <Link
                      href={`/proposals/${p.token}/signed/${p.latestAgreement.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mr-1 inline-block rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      View signed
                    </Link>
                  )}
                  <Link
                    href={`/proposals/${p.token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
