import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  generateProposalToken,
  sendProposalReadyEmail,
} from "@/lib/proposalEmails";
import { PROPOSAL_VALIDITY_DAYS } from "@/lib/proposalConstants";

export const runtime = "nodejs";

type CreateBody = {
  propertyId?: string | null;
  pricingQuoteId?: string | null;
  clientName: string;
  clientAddress?: string | null;
  clientEmail: string;
  preparedBy?: string | null;
  data: unknown;
  monthlyPrice: number;
  weeklyPrice: number;
  breakEvenCost: number;
  message?: string | null;
};

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as CreateBody | null;
  if (
    !body ||
    typeof body.clientName !== "string" ||
    typeof body.clientEmail !== "string" ||
    !body.data ||
    typeof body.monthlyPrice !== "number" ||
    typeof body.weeklyPrice !== "number" ||
    typeof body.breakEvenCost !== "number"
  ) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (!isEmail(body.clientEmail)) {
    return NextResponse.json(
      { error: "Please enter a valid client email." },
      { status: 400 },
    );
  }

  if (body.propertyId) {
    const exists = await prisma.property.findUnique({
      where: { id: body.propertyId },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json({ error: "Unknown property" }, { status: 404 });
    }
  }

  const validUntil = new Date(
    Date.now() + PROPOSAL_VALIDITY_DAYS * 24 * 60 * 60 * 1000,
  );

  const proposal = await prisma.proposal.create({
    data: {
      token: generateProposalToken(),
      propertyId: body.propertyId || null,
      pricingQuoteId: body.pricingQuoteId || null,
      createdByName: session.name,
      clientName: body.clientName.trim().slice(0, 200),
      clientAddress: body.clientAddress?.trim().slice(0, 300) || null,
      clientEmail: body.clientEmail.trim().slice(0, 200),
      preparedBy: body.preparedBy?.trim().slice(0, 200) || null,
      data: body.data as object,
      monthlyPrice: body.monthlyPrice,
      weeklyPrice: body.weeklyPrice,
      breakEvenCost: body.breakEvenCost,
      validUntil,
      sentAt: new Date(),
    },
    select: {
      id: true,
      token: true,
      clientName: true,
      clientEmail: true,
      monthlyPrice: true,
      preparedBy: true,
    },
  });

  const email = await sendProposalReadyEmail({
    to: proposal.clientEmail,
    clientName: proposal.clientName,
    monthlyPrice: proposal.monthlyPrice,
    token: proposal.token,
    preparedBy: proposal.preparedBy,
    message: body.message,
  });

  return NextResponse.json({
    id: proposal.id,
    token: proposal.token,
    emailOk: email.ok,
    emailSkipped: email.skipped ?? false,
  });
}
