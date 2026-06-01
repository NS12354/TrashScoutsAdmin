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
  const r = await prisma.diversionReport.findUnique({ where: { id } });
  if (!r) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: r.id,
    propertyId: r.propertyId,
    clientName: r.clientName,
    address: r.address,
    period: r.period,
    propType: r.propType,
    mode: r.mode,
    rows: r.rows,
    totalWeekly: r.totalWeekly,
    divertedWeekly: r.divertedWeekly,
    divRate: r.divRate,
    createdByName: r.createdByName,
    createdAt: r.createdAt.toISOString(),
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
  await prisma.diversionReport
    .delete({ where: { id } })
    .catch(() => null);
  return NextResponse.json({ ok: true });
}
