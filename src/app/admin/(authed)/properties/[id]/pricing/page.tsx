import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  SentProposalsList,
  type SentProposalRow,
} from "@/components/admin/SentProposalsList";

export const dynamic = "force-dynamic";

function usd(n: number): string {
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function PropertyPricingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    select: { id: true, name: true, address: true },
  });
  if (!property) return notFound();

  const proposals = await prisma.proposal.findMany({
    where: { propertyId: id },
    orderBy: { createdAt: "desc" },
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
      agreements: {
        orderBy: { signedAt: "desc" },
        take: 1,
        select: { id: true, signerName: true, signedAt: true },
      },
    },
  });

  const rows: SentProposalRow[] = proposals.map((p) => ({
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
    property: null,
    latestAgreement: p.agreements[0]
      ? {
          id: p.agreements[0].id,
          signerName: p.agreements[0].signerName,
          signedAt: p.agreements[0].signedAt.toISOString(),
        }
      : null,
  }));

  // "Current" = the most-recently-signed proposal. There's only one
  // active agreement per property: when a newer signed proposal
  // arrives it automatically becomes current and the prior signed one
  // slides into history.
  const signedRows = rows.filter((r) => !!r.latestAgreement);
  const currentAgreement = signedRows[0] ?? null;

  const now = new Date();
  const pendingRows = rows.filter(
    (r) =>
      !r.acceptedAt &&
      new Date(r.validUntil) >= now &&
      // Don't double-list a proposal that's already the current one.
      r.id !== currentAgreement?.id,
  );

  const historyRows = rows.filter(
    (r) =>
      r.id !== currentAgreement?.id &&
      !pendingRows.some((p) => p.id === r.id),
  );

  return (
    <div>
      <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
        ← All Properties
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight capitalize">
            {property.name}
          </h1>
          <p className="text-sm capitalize text-zinc-500">
            {property.address}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/properties/${property.id}`}
            className="btn-secondary"
          >
            Edit Property
          </Link>
          <Link
            href={`/admin/properties/${property.id}/qr`}
            className="btn-secondary"
          >
            View QR
          </Link>
          <Link
            href={`/admin/pricing?property=${property.id}`}
            className="btn-primary"
          >
            + New Proposal
          </Link>
        </div>
      </div>

      {/* ─── Current Agreement ─── */}
      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Current Agreement
      </h2>
      {currentAgreement ? (
        <div className="mt-3 overflow-hidden rounded-2xl border-2 border-emerald-200 bg-emerald-50/50">
          <div className="flex flex-wrap items-start justify-between gap-4 p-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Signed
                </span>
                <span className="text-xs text-zinc-600">
                  by {currentAgreement.latestAgreement!.signerName} on{" "}
                  {fmtDate(
                    new Date(currentAgreement.latestAgreement!.signedAt),
                  )}
                </span>
              </div>
              <div className="mt-2 text-lg font-semibold text-zinc-900">
                {currentAgreement.clientName}
              </div>
              <div className="text-xs text-zinc-500">
                {currentAgreement.clientEmail}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-emerald-700">
                {usd(currentAgreement.monthlyPrice)}
                <span className="text-sm font-normal text-emerald-600">
                  {" "}/mo
                </span>
              </div>
              <div className="text-xs text-zinc-500">
                {usd(currentAgreement.weeklyPrice)}/wk
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-emerald-100 bg-white/60 px-5 py-3">
            <Link
              href={`/proposals/${currentAgreement.token}/signed/${currentAgreement.latestAgreement!.id}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              View Signed Agreement
            </Link>
            <Link
              href={`/proposals/${currentAgreement.token}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Open Proposal
            </Link>
            <Link
              href={`/admin/pricing?proposal=${currentAgreement.id}`}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Reuse to Build a New Proposal
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500">
          No signed agreement yet for this property.{" "}
          <Link
            href={`/admin/pricing?property=${property.id}`}
            className="font-medium text-brand-dark hover:underline"
          >
            Build a proposal →
          </Link>
        </div>
      )}

      {/* ─── Pending (sent but not signed, not expired) ─── */}
      {pendingRows.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Pending Proposals ({pendingRows.length})
          </h2>
          <div className="mt-3">
            <SentProposalsList proposals={pendingRows} />
          </div>
        </>
      )}

      {/* ─── History (older signed + expired + superseded) ─── */}
      {historyRows.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            History ({historyRows.length})
          </h2>
          <div className="mt-3">
            <SentProposalsList proposals={historyRows} />
          </div>
        </>
      )}
    </div>
  );
}
