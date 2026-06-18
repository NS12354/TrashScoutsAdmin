"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { SentProposalStatusFilter } from "./SentProposalsList";

const OPTIONS: Array<{ value: SentProposalStatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "sent", label: "Sent" },
  { value: "viewed", label: "Viewed" },
  { value: "signed", label: "Signed" },
  { value: "expired", label: "Expired" },
];

export function ProposalsFilters({
  current,
  counts,
}: {
  current: SentProposalStatusFilter;
  counts: Record<SentProposalStatusFilter, number>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setFilter(v: SentProposalStatusFilter) {
    const params = new URLSearchParams(searchParams.toString());
    if (v === "all") params.delete("status");
    else params.set("status", v);
    const qs = params.toString();
    router.push(qs ? `/admin/proposals?${qs}` : "/admin/proposals");
  }

  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => setFilter(o.value)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            current === o.value
              ? "bg-brand-dark text-white"
              : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
          }`}
        >
          {o.label}
          <span
            className={`ml-1.5 ${current === o.value ? "text-white/80" : "text-zinc-400"}`}
          >
            {counts[o.value]}
          </span>
        </button>
      ))}
    </div>
  );
}
