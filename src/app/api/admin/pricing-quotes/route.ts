import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Mirrors the SerializedTool shape in PricingTool.tsx — kept loose
// because the pricing tool's settings evolve and we don't want the API
// to be the brittle layer.
type CreateBody = {
  propertyId: string;
  clientName: string;
  preparedBy?: string | null;
  data: unknown;
  monthlyPrice: number;
  weeklyPrice: number;
  breakEvenCost: number;
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
    !body.data ||
    typeof body.monthlyPrice !== "number" ||
    typeof body.weeklyPrice !== "number" ||
    typeof body.breakEvenCost !== "number"
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

  const quote = await prisma.pricingQuote.create({
    data: {
      propertyId: body.propertyId,
      createdByName: session.name,
      clientName: body.clientName.trim(),
      preparedBy: body.preparedBy?.trim() || null,
      data: body.data as object,
      monthlyPrice: body.monthlyPrice,
      weeklyPrice: body.weeklyPrice,
      breakEvenCost: body.breakEvenCost,
    },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({
    id: quote.id,
    createdAt: quote.createdAt.toISOString(),
  });
}
