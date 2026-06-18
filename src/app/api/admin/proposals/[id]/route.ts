import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Returns a proposal's full state so the admin calculator can reload
// it — used by the "Edit / Reuse" deep-link from the proposals list
// (?proposal=<id>). Admin-gated so unguessable token aside, the
// proposal record stays internal.

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const p = await prisma.proposal.findUnique({
    where: { id },
    select: {
      id: true,
      propertyId: true,
      clientName: true,
      clientAddress: true,
      clientEmail: true,
      preparedBy: true,
      data: true,
      monthlyPrice: true,
      weeklyPrice: true,
      breakEvenCost: true,
      message: true,
      thankYouMessage: true,
      pocEmails: true,
      createdByName: true,
      createdAt: true,
    },
  });
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    ...p,
    createdAt: p.createdAt.toISOString(),
  });
}
