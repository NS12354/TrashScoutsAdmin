import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AgreementForm } from "@/components/proposal/AgreementForm";
import type { ProposalData } from "@/lib/proposalData";
import styles from "@/components/proposal/proposal.module.css";

export const dynamic = "force-dynamic";

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function AgreementPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const proposal = await prisma.proposal.findUnique({
    where: { token },
    include: {
      agreements: { orderBy: { signedAt: "desc" }, take: 1 },
    },
  });
  if (!proposal) return notFound();

  // If they've already signed, send them to the signed view.
  if (proposal.agreements[0]) {
    redirect(
      `/proposals/${token}/signed/${proposal.agreements[0].id}`,
    );
  }

  if (proposal.validUntil < new Date()) {
    return (
      <div className={styles.shell}>
        <div className={styles.paper}>
          <h1 style={{ fontFamily: "var(--display)", color: "#0E3F27" }}>
            Proposal expired
          </h1>
          <p style={{ fontSize: 15, color: "#444" }}>
            This proposal expired on {fmtDate(proposal.validUntil)}. Please
            contact Trash Scouts to refresh it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <AgreementForm
        token={token}
        proposalClientName={proposal.clientName}
        proposalAddress={proposal.clientAddress}
        preparedDate={fmtDate(proposal.createdAt)}
        data={proposal.data as unknown as ProposalData}
        monthlyPrice={proposal.monthlyPrice}
        weeklyPrice={proposal.weeklyPrice}
      />
    </div>
  );
}
