import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const q = await prisma.pricingQuote.findUnique({ where: { id } });
  if (!q) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: q.id,
    propertyId: q.propertyId,
    clientName: q.clientName,
    preparedBy: q.preparedBy,
    data: q.data,
    monthlyPrice: q.monthlyPrice,
    weeklyPrice: q.weeklyPrice,
    breakEvenCost: q.breakEvenCost,
    createdByName: q.createdByName,
    createdAt: q.createdAt.toISOString(),
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.pricingQuote.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
