import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  generateProposalToken,
  sendProposalReadyEmail,
} from "@/lib/proposalEmails";
import { PROPOSAL_VALIDITY_DAYS } from "@/lib/proposalConstants";
import { cleanEmailList, isEmail } from "@/lib/emailValidation";

export const runtime = "nodejs";

type CreateBody = {
  propertyId?: string | null;
  pricingQuoteId?: string | null;
  clientName: string;
  clientAddress?: string | null;
  // Primary client email. Additional recipients may be listed in
  // clientEmailCcs — they get the same message as the primary.
  clientEmail: string;
  clientEmailCcs?: string[] | null;
  preparedBy?: string | null;
  data: unknown;
  monthlyPrice: number;
  weeklyPrice: number;
  breakEvenCost: number;
  message?: string | null;
  thankYouMessage?: string | null;
  pocEmails?: string[] | null;
};

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

  let propertyName: string | null = null;
  let propertyAddress: string | null = null;
  if (body.propertyId) {
    const property = await prisma.property.findUnique({
      where: { id: body.propertyId },
      select: { id: true, name: true, address: true },
    });
    if (!property) {
      return NextResponse.json({ error: "Unknown property" }, { status: 404 });
    }
    propertyName = property.name;
    propertyAddress = property.address;
  }

  const validUntil = new Date(
    Date.now() + PROPOSAL_VALIDITY_DAYS * 24 * 60 * 60 * 1000,
  );

  const clientEmailCcs = cleanEmailList(body.clientEmailCcs);
  const pocEmails = cleanEmailList(body.pocEmails);

  const proposal = await prisma.proposal.create({
    data: {
      token: generateProposalToken(),
      propertyId: body.propertyId || null,
      pricingQuoteId: body.pricingQuoteId || null,
      createdByName: session.name,
      clientName: body.clientName.trim().slice(0, 200),
      clientAddress: body.clientAddress?.trim().slice(0, 300) || null,
      clientEmail: body.clientEmail.trim().slice(0, 200),
      clientEmailCcs,
      preparedBy: body.preparedBy?.trim().slice(0, 200) || null,
      data: body.data as object,
      monthlyPrice: body.monthlyPrice,
      weeklyPrice: body.weeklyPrice,
      breakEvenCost: body.breakEvenCost,
      validUntil,
      message: body.message?.trim().slice(0, 2000) || null,
      thankYouMessage: body.thankYouMessage?.trim().slice(0, 2000) || null,
      pocEmails,
      sentAt: new Date(),
    },
    select: {
      id: true,
      token: true,
      clientName: true,
      clientEmail: true,
      clientEmailCcs: true,
      preparedBy: true,
      pocEmails: true,
      validUntil: true,
    },
  });

  const email = await sendProposalReadyEmail({
    primaryTo: proposal.clientEmail,
    extraTos: proposal.clientEmailCcs,
    pocEmails: proposal.pocEmails,
    clientName: proposal.clientName,
    propertyName: propertyName ?? body.clientName,
    serviceAddress: propertyAddress ?? body.clientAddress ?? null,
    validUntil: proposal.validUntil,
    token: proposal.token,
    preparedBy: proposal.preparedBy,
    message: body.message,
  });

  return NextResponse.json({
    id: proposal.id,
    token: proposal.token,
    emailOk: email.ok,
    delivered: email.delivered,
  });
}
