import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PropertyPricingDeleteButton } from "@/components/admin/PropertyPricingDeleteButton";
import {
  SentProposalsList,
  type SentProposalRow,
} from "@/components/admin/SentProposalsList";

export const dynamic = "force-dynamic";

function usd(n: number): string {
  return (
    "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 })
  );
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

  const [quotes, proposals] = await Promise.all([
    prisma.pricingQuote.findMany({
      where: { propertyId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        clientName: true,
        preparedBy: true,
        monthlyPrice: true,
        weeklyPrice: true,
        createdByName: true,
        createdAt: true,
      },
    }),
    prisma.proposal.findMany({
      where: { propertyId: id },
      orderBy: { createdAt: "desc" },
      take: 30,
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
    }),
  ]);

  const proposalRows: SentProposalRow[] = proposals.map((p) => ({
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

  return (
    <div>
      <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
        ← All properties
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
            Edit property
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
            + New quote
          </Link>
        </div>
      </div>

      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Sent proposals &amp; signed agreements
      </h2>
      <div className="mt-3">
        <SentProposalsList
          proposals={proposalRows}
          emptyMessage="No proposals sent to clients yet for this property."
        />
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Saved pricing quotes
      </h2>

      {quotes.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-sm text-zinc-500">
          No quotes saved for this property yet.{" "}
          <Link
            href={`/admin/pricing?property=${property.id}`}
            className="font-medium text-brand-dark hover:underline"
          >
            Build one →
          </Link>
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Client</th>
                <th className="px-4 py-2.5 text-left font-semibold">Monthly</th>
                <th className="px-4 py-2.5 text-left font-semibold">Weekly</th>
                <th className="px-4 py-2.5 text-left font-semibold">Saved</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {quotes.map((q) => (
                <tr key={q.id}>
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-zinc-900">
                      {q.clientName}
                    </div>
                    {q.preparedBy && (
                      <div className="text-xs text-zinc-500">
                        Prepared by {q.preparedBy}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top font-semibold text-zinc-900">
                    {usd(q.monthlyPrice)}
                    <span className="ml-0.5 text-xs font-normal text-zinc-500">
                      /mo
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top text-zinc-700">
                    {usd(q.weeklyPrice)}
                    <span className="ml-0.5 text-xs text-zinc-500">/wk</span>
                  </td>
                  <td className="px-4 py-3 align-top text-zinc-600">
                    {new Date(q.createdAt).toLocaleDateString()}
                    {q.createdByName && (
                      <div className="text-xs text-zinc-400">
                        {q.createdByName}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                    <Link
                      href={`/admin/pricing?quote=${q.id}`}
                      className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      Open
                    </Link>
                    <PropertyPricingDeleteButton quoteId={q.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
