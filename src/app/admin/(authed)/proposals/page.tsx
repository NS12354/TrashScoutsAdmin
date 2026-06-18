import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  SentProposalsList,
  type SentProposalRow,
  type SentProposalStatusFilter,
} from "@/components/admin/SentProposalsList";
import { ProposalsFilters } from "@/components/admin/ProposalsFilters";

export const dynamic = "force-dynamic";

function parseFilter(v: string | undefined): SentProposalStatusFilter {
  if (
    v === "sent" ||
    v === "viewed" ||
    v === "signed" ||
    v === "expired"
  )
    return v;
  return "all";
}

type RawProposal = {
  id: string;
  token: string;
  clientName: string;
  clientEmail: string;
  monthlyPrice: number;
  weeklyPrice: number;
  sentAt: Date | null;
  viewedAt: Date | null;
  acceptedAt: Date | null;
  validUntil: Date;
  createdByName: string | null;
  property: { id: string; name: string } | null;
  agreements: Array<{ id: string; signerName: string; signedAt: Date }>;
};

function statusOf(p: RawProposal, now: Date): SentProposalStatusFilter {
  if (p.acceptedAt) return "signed";
  if (p.validUntil < now) return "expired";
  if (p.viewedAt) return "viewed";
  return "sent";
}

function toRow(p: RawProposal): SentProposalRow {
  return {
    id: p.id,
    token: p.token,
    clientName: p.clientName,
    clientEmail: p.clientEmail,
    monthlyPrice: p.monthlyPrice,
    weeklyPrice: p.weeklyPrice,
    sentAt: p.sentAt?.toISOString() ?? null,
    viewedAt: p.viewedAt?.toISOString() ?? null,
    acceptedAt: p.acceptedAt?.toISOString() ?? null,
    validUntil: p.validUntil.toISOString(),
    createdByName: p.createdByName,
    property: p.property,
    latestAgreement: p.agreements[0]
      ? {
          id: p.agreements[0].id,
          signerName: p.agreements[0].signerName,
          signedAt: p.agreements[0].signedAt.toISOString(),
        }
      : null,
  };
}

export default async function ProposalsListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const filter = parseFilter(sp.status);

  // Pull all proposals (capped for safety) — we filter in-memory rather
  // than at the DB layer because "expired" depends on validUntil vs.
  // now() and "viewed but not signed" requires multi-field logic. The
  // 500-row cap is well above any reasonable in-flight pipeline.
  const proposals = (await prisma.proposal.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      token: true,
      clientName: true,
      clientEmail: true,
      monthlyPrice: true,
      weeklyPrice: true,
      sentAt: true,
      viewedAt: true,
      acceptedAt: true,
      validUntil: true,
      createdByName: true,
      property: { select: { id: true, name: true } },
      agreements: {
        orderBy: { signedAt: "desc" },
        take: 1,
        select: { id: true, signerName: true, signedAt: true },
      },
    },
  })) as RawProposal[];

  const now = new Date();
  const withStatus = proposals.map((p) => ({
    ...p,
    _status: statusOf(p, now),
  }));

  const counts: Record<SentProposalStatusFilter, number> = {
    all: withStatus.length,
    sent: withStatus.filter((p) => p._status === "sent").length,
    viewed: withStatus.filter((p) => p._status === "viewed").length,
    signed: withStatus.filter((p) => p._status === "signed").length,
    expired: withStatus.filter((p) => p._status === "expired").length,
  };

  const filtered =
    filter === "all"
      ? withStatus
      : withStatus.filter((p) => p._status === filter);

  const rows: SentProposalRow[] = filtered.map(toRow);

  return (
    <div>
      <Link
        href="/admin/pricing"
        className="text-sm text-zinc-500 hover:underline"
      >
        ← Back to Pricing
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Proposals &amp; Signed Agreements
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        All proposals you&apos;ve sent to clients. Signed agreements stay
        here as your record.
      </p>

      <div className="mt-6">
        <ProposalsFilters current={filter} counts={counts} />
        <SentProposalsList
          proposals={rows}
          showProperty
          emptyMessage="No proposals match this filter."
        />
      </div>
    </div>
  );
}
