import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type ScheduleRowIn = {
  dayOfWeek: number;
  binType: string;
  action: string;
  binCount?: number | null;
  binSize?: number | null;
  timeWindow?: string | null;
};
type PhotoIn = {
  url: string;
  caption?: string | null;
  subcaption?: string | null;
};
type UpdateBody = {
  name?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  county?: string | null;
  guideUrl?: string | null;
  hhwInstructions?: string | null;
  porterId?: string | null;
  nightPorterId?: string | null;
  schedule?: ScheduleRowIn[];
  setupPhotos?: PhotoIn[];
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await req.json()) as UpdateBody;

  // Update only the scalar fields explicitly present in the request, so a
  // partial PATCH (e.g. just a rename) doesn't null out other fields.
  const data: Record<string, unknown> = {};
  if ("name" in body) data.name = body.name?.trim();
  if ("address" in body) data.address = body.address?.trim();
  if ("latitude" in body) data.latitude = body.latitude ?? null;
  if ("longitude" in body) data.longitude = body.longitude ?? null;
  if ("county" in body) data.county = body.county || null;
  if ("guideUrl" in body) data.guideUrl = body.guideUrl?.trim() || null;
  if ("hhwInstructions" in body)
    data.hhwInstructions = body.hhwInstructions?.trim() || null;
  if ("porterId" in body) data.porterId = body.porterId || null;
  if ("nightPorterId" in body)
    data.nightPorterId = body.nightPorterId || null;
  if (Object.keys(data).length > 0) {
    await prisma.property.update({ where: { id }, data });
  }

  // Replace schedule + photos if provided (simple replace-all strategy).
  if (body.schedule) {
    await prisma.scheduleItem.deleteMany({ where: { propertyId: id } });
    if (body.schedule.length > 0) {
      await prisma.scheduleItem.createMany({
        data: body.schedule.map((s) => ({
          propertyId: id,
          dayOfWeek: s.dayOfWeek,
          binType: s.binType,
          action: s.action,
          binCount:
            typeof s.binCount === "number" && Number.isFinite(s.binCount)
              ? s.binCount
              : null,
          binSize:
            typeof s.binSize === "number" && Number.isFinite(s.binSize)
              ? s.binSize
              : null,
          timeWindow: s.timeWindow || null,
        })),
      });
    }
  }
  if (body.setupPhotos) {
    await prisma.setupPhoto.deleteMany({ where: { propertyId: id } });
    if (body.setupPhotos.length > 0) {
      await prisma.setupPhoto.createMany({
        data: body.setupPhotos.map((p, i) => ({
          propertyId: id,
          url: p.url,
          caption: p.caption || null,
          subcaption: p.subcaption || null,
          sortOrder: i,
        })),
      });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.property.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
