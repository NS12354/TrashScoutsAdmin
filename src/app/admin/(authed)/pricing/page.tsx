import { prisma } from "@/lib/db";
import {
  PricingTool,
  type PricingPropertyOption,
} from "@/components/admin/PricingTool";
import { type SentProposalRow } from "@/components/admin/SentProposalsList";

export const dynamic = "force-dynamic";

const PROPOSAL_LIMIT = 30;

export default async function PricingPage() {
  const [properties, proposals] = await Promise.all([
    prisma.property.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        address: true,
        schedule: {
          select: {
            binType: true,
            action: true,
            binCount: true,
            binSize: true,
            dayOfWeek: true,
          },
        },
      },
    }),
    prisma.proposal.findMany({
      orderBy: { createdAt: "desc" },
      take: PROPOSAL_LIMIT,
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
    }),
  ]);

  const propertyOptions: PricingPropertyOption[] = properties.map((p) => ({
    id: p.id,
    name: p.name,
    address: p.address,
    schedule: p.schedule.map((s) => ({
      binType: s.binType,
      action: s.action,
      binCount: s.binCount,
      binSize: s.binSize,
      dayOfWeek: s.dayOfWeek,
    })),
  }));

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
    property: p.property,
    latestAgreement: p.agreements[0]
      ? {
          id: p.agreements[0].id,
          signerName: p.agreements[0].signerName,
          signedAt: p.agreements[0].signedAt.toISOString(),
        }
      : null,
  }));

  return (
    <PricingTool properties={propertyOptions} sentProposals={proposalRows} />
  );
}
