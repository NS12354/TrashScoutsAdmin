// Resident-side data accessors. Reads from the Postgres database via Prisma.
// Same shape the resident components have always consumed — admin writes
// to these tables through /admin/* and changes go live immediately.

import { prisma } from "./db";
import { WASTE_GUIDE, HHW_GENERAL_GUIDE } from "@/data/guides";
import { haversineMeters } from "./geo";
import type {
  Property,
  Porter,
  Guide,
  ScheduleItem,
} from "@/data/types";

type PrismaProperty = {
  id: string;
  slug: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  hhwInstructions: string | null;
  porterId: string | null;
  nightPorterId: string | null;
  schedule: Array<{
    dayOfWeek: number;
    binType: string;
    action: string;
    timeWindow: string | null;
  }>;
  setupPhotos: Array<{
    url: string;
    caption: string | null;
  }>;
};

function toProperty(p: PrismaProperty): Property {
  return {
    id: p.slug, // resident URLs use slug → /p/<slug>
    name: p.name,
    address: p.address,
    latitude: p.latitude ?? 0,
    longitude: p.longitude ?? 0,
    porterId: p.porterId ?? undefined,
    nightPorterId: p.nightPorterId ?? undefined,
    hhwInstructions: p.hhwInstructions ?? undefined,
    setupPhotos: p.setupPhotos.map((sp) => ({
      url: sp.url,
      caption: sp.caption ?? undefined,
    })),
    schedule: p.schedule.map(
      (s): ScheduleItem => ({
        dayOfWeek: s.dayOfWeek,
        binType: s.binType as ScheduleItem["binType"],
        action: s.action as ScheduleItem["action"],
        timeWindow: s.timeWindow ?? undefined,
      }),
    ),
  };
}

export async function getAllProperties(): Promise<Property[]> {
  const rows = await prisma.property.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      schedule: { orderBy: [{ dayOfWeek: "asc" }] },
      setupPhotos: { orderBy: { sortOrder: "asc" } },
    },
  });
  return rows.map(toProperty);
}

export async function getProperty(slugOrId: string): Promise<Property | null> {
  const row = await prisma.property.findFirst({
    where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
    include: {
      schedule: { orderBy: [{ dayOfWeek: "asc" }] },
      setupPhotos: { orderBy: { sortOrder: "asc" } },
    },
  });
  return row ? toProperty(row) : null;
}

export async function getPorter(id: string | undefined): Promise<Porter | null> {
  if (!id) return null;
  const p = await prisma.porter.findUnique({ where: { id } });
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    title: p.title ?? undefined,
    photoUrl: p.photoUrl ?? undefined,
  };
}

// Guides live in the DB (one row each, slug="waste" and slug="hhw"), seeded
// from the hardcoded defaults. If a row is missing (fresh DB without seed),
// fall back to the original hardcoded content so the resident pages never
// break.
export async function getWasteGuide(): Promise<Guide> {
  const row = await prisma.guide.findUnique({ where: { slug: "waste" } });
  return row
    ? { title: row.title, content: row.content }
    : WASTE_GUIDE;
}

export async function getHHWGeneralGuide(): Promise<Guide> {
  const row = await prisma.guide.findUnique({ where: { slug: "hhw" } });
  return row
    ? { title: row.title, content: row.content }
    : HHW_GENERAL_GUIDE;
}

export async function findNearestProperty(
  lat: number,
  lng: number,
): Promise<{ property: Property; distance: number } | null> {
  const all = await getAllProperties();
  let best: { property: Property; distance: number } | null = null;
  for (const p of all) {
    const d = haversineMeters(lat, lng, p.latitude, p.longitude);
    if (!best || d < best.distance) best = { property: p, distance: d };
  }
  return best;
}
