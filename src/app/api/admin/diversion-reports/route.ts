import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Mirrors the Row shape in DiversionReportBuilder.tsx — kept loose
// because the table's columns evolve and we don't want the API to be
// the brittle layer.
type RowIn = {
  stream: string;
  bins: number;
  sizeVal: number;
  pickups: number;
  tons: string;
  lbs: string;
};

type CreateBody = {
  propertyId: string;
  clientName: string;
  address: string;
  period: string;
  propType: string;
  mode: "volume" | "weight";
  rows: RowIn[];
  totalWeekly: number;
  divertedWeekly: number;
  divRate: number;
};

function isString(v: unknown, max = 500): v is string {
  return typeof v === "string" && v.length <= max;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as CreateBody | null;
  if (
    !body ||
    !isString(body.propertyId, 64) ||
    !isString(body.clientName, 200) ||
    !isString(body.address, 500) ||
    !isString(body.period, 100) ||
    !isString(body.propType, 100) ||
    (body.mode !== "volume" && body.mode !== "weight") ||
    !Array.isArray(body.rows) ||
    body.rows.length === 0 ||
    typeof body.totalWeekly !== "number" ||
    typeof body.divertedWeekly !== "number" ||
    typeof body.divRate !== "number"
  ) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const property = await prisma.property.findUnique({
    where: { id: body.propertyId },
    select: { id: true },
  });
  if (!property) {
    return NextResponse.json({ error: "Unknown property" }, { status: 404 });
  }

  const report = await prisma.diversionReport.create({
    data: {
      propertyId: body.propertyId,
      createdByName: session.name,
      clientName: body.clientName.trim(),
      address: body.address.trim(),
      period: body.period.trim(),
      propType: body.propType,
      mode: body.mode,
      rows: body.rows,
      totalWeekly: body.totalWeekly,
      divertedWeekly: body.divertedWeekly,
      divRate: body.divRate,
    },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({
    id: report.id,
    createdAt: report.createdAt.toISOString(),
  });
}
