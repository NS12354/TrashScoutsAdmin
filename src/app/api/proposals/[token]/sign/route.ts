import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rateLimit";
import { sendSignedAgreementEmails } from "@/lib/proposalEmails";

export const runtime = "nodejs";

const RATE_LIMIT = { limit: 4, windowMs: 10 * 60 * 1000 };

type SignBody = {
  formData: Record<string, unknown>;
  signatureType: "drawn" | "typed";
  signatureValue: string;
  signatureFont?: string | null;
  signerName: string;
  signerTitle?: string | null;
};

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anon"
  );
}

const MAX_SIG_BYTES = 200_000;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const ip = getClientIp(req);
  const limit = await rateLimit(`sign:${ip}`, RATE_LIMIT);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many submissions — please wait a few minutes." },
      { status: 429, headers: { "Retry-After": String(limit.resetIn) } },
    );
  }

  const { token } = await params;
  const proposal = await prisma.proposal.findUnique({
    where: { token },
    select: {
      id: true,
      clientName: true,
      clientEmail: true,
      monthlyPrice: true,
      weeklyPrice: true,
      validUntil: true,
      thankYouMessage: true,
      pocEmails: true,
    },
  });
  if (!proposal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (proposal.validUntil < new Date()) {
    return NextResponse.json(
      { error: "This proposal has expired. Please contact Trash Scouts." },
      { status: 410 },
    );
  }

  const body = (await req.json().catch(() => null)) as SignBody | null;
  if (
    !body ||
    !body.formData ||
    typeof body.formData !== "object" ||
    (body.signatureType !== "drawn" && body.signatureType !== "typed") ||
    typeof body.signatureValue !== "string" ||
    !body.signatureValue.trim() ||
    typeof body.signerName !== "string" ||
    !body.signerName.trim()
  ) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (body.signatureValue.length > MAX_SIG_BYTES) {
    return NextResponse.json(
      { error: "Signature is too large — try typing instead." },
      { status: 413 },
    );
  }

  const agreement = await prisma.signedAgreement.create({
    data: {
      proposalId: proposal.id,
      formData: body.formData as object,
      signatureType: body.signatureType,
      signatureValue: body.signatureValue,
      signatureFont: body.signatureFont?.slice(0, 60) || null,
      signerName: body.signerName.trim().slice(0, 200),
      signerTitle: body.signerTitle?.trim().slice(0, 120) || null,
    },
    select: { id: true },
  });

  await prisma.proposal.update({
    where: { id: proposal.id },
    data: { acceptedAt: new Date() },
  });

  // Fire-and-forget emails — don't fail the submission if SendGrid is
  // slow or the env isn't configured.
  void sendSignedAgreementEmails({
    clientEmail: proposal.clientEmail,
    clientName: proposal.clientName,
    monthlyPrice: proposal.monthlyPrice,
    weeklyPrice: proposal.weeklyPrice,
    signerName: body.signerName.trim(),
    token,
    agreementId: agreement.id,
    thankYouMessage: proposal.thankYouMessage,
    pocEmails: proposal.pocEmails ?? [],
  }).catch((err) => {
    console.error("[sign] email send failed", err);
  });

  return NextResponse.json({ id: agreement.id });
}
