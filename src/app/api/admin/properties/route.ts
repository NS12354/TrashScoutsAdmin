import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";

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

type CreateBody = {
  name: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  county?: string | null;
  hhwInstructions?: string | null;
  porterId?: string | null;
  nightPorterId?: string | null;
  schedule?: ScheduleRowIn[];
  setupPhotos?: PhotoIn[];
};

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let i = 1;
  while (await prisma.property.findUnique({ where: { slug } })) {
    i += 1;
    slug = `${base}-${i}`;
  }
  return slug;
}

export async function POST(req: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as CreateBody;

  if (!body.name?.trim() || !body.address?.trim()) {
    return NextResponse.json(
      { error: "Name and address are required" },
      { status: 400 },
    );
  }

  const slug = await uniqueSlug(slugify(body.address));

  const created = await prisma.property.create({
    data: {
      slug,
      name: body.name.trim(),
      address: body.address.trim(),
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      county: body.county || null,
      hhwInstructions: body.hhwInstructions?.trim() || null,
      porterId: body.porterId || null,
      nightPorterId: body.nightPorterId || null,
      schedule: body.schedule
        ? {
            create: body.schedule.map((s) => ({
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
          }
        : undefined,
      setupPhotos: body.setupPhotos
        ? {
            create: body.setupPhotos.map((p, i) => ({
              url: p.url,
              caption: p.caption || null,
              subcaption: p.subcaption || null,
              sortOrder: i,
            })),
          }
        : undefined,
    },
    select: { id: true, slug: true },
  });

  return NextResponse.json({ id: created.id, slug: created.slug });
}
