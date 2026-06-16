import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  formatProposalDates,
  ProposalView,
} from "@/components/proposal/ProposalView";
import { PrintButton } from "@/components/proposal/PrintButton";
import type { ProposalData } from "@/lib/proposalData";
import styles from "@/components/proposal/proposal.module.css";

export const dynamic = "force-dynamic";

export default async function PublicProposalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const proposal = await prisma.proposal.findUnique({
    where: { token },
  });
  if (!proposal) return notFound();

  // Track first view non-blockingly.
  if (!proposal.viewedAt) {
    void prisma.proposal
      .update({
        where: { id: proposal.id },
        data: { viewedAt: new Date() },
      })
      .catch(() => null);
  }

  const dates = formatProposalDates(proposal.createdAt, proposal.validUntil);
  const expired = proposal.validUntil < new Date();
  const accepted = !!proposal.acceptedAt;

  return (
    <div className={styles.shell}>
      <div className={styles.actions}>
        <PrintButton />
      </div>
      {expired && !accepted && (
        <div
          style={{
            maxWidth: 760,
            margin: "0 auto 16px",
            padding: "12px 16px",
            background: "#FFF4E5",
            border: "1px solid #FFD79A",
            borderRadius: 10,
            color: "#7C4A00",
            fontSize: 14,
          }}
        >
          This proposal has expired ({dates.validUntil}). Please contact
          Trash Scouts to refresh it.
        </div>
      )}
      <ProposalView
        clientName={proposal.clientName}
        clientAddress={proposal.clientAddress}
        preparedBy={proposal.preparedBy}
        preparedDate={dates.preparedDate}
        validUntil={dates.validUntil}
        monthlyPrice={proposal.monthlyPrice}
        weeklyPrice={proposal.weeklyPrice}
        data={proposal.data as unknown as ProposalData}
        acceptHref={expired ? null : `/proposals/${token}/agreement`}
        alreadyAccepted={accepted}
      />
    </div>
  );
}
