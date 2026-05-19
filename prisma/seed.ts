// Seeds the database with the initial 4 Trash Scouts properties + Sergio.
// Admin auth is via Google (NextAuth) with an allowlist in src/lib/auth.ts
// — no user record needed to log in.
//
// Usage:  npm run db:seed

import { PrismaClient } from "@prisma/client";
import { WASTE_GUIDE, HHW_GENERAL_GUIDE } from "../src/data/guides";

const prisma = new PrismaClient();

type SeedProperty = {
  slug: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  hhwInstructions?: string | null;
};

const STANDARD_SCHEDULE = [
  { dayOfWeek: 2, binType: "TRASH", action: "PULL_OUT", timeWindow: null },
  { dayOfWeek: 3, binType: "RECYCLING", action: "PULL_OUT", timeWindow: null },
  { dayOfWeek: 4, binType: "ORGANICS", action: "PULL_OUT", timeWindow: null },
];

const PROPERTIES: SeedProperty[] = [
  {
    slug: "1919-market",
    name: "1919 Market Street",
    address: "1919 Market St, Oakland, CA 94607",
    latitude: 37.8083,
    longitude: -122.2741,
  },
  {
    slug: "378-embarcadero",
    name: "378 Embarcadero West",
    address: "378 Embarcadero West, Oakland, CA 94607",
    latitude: 37.7951,
    longitude: -122.2766,
  },
  {
    slug: "1955-broadway",
    name: "1955 Broadway",
    address: "1955 Broadway, Oakland, CA 94612",
    latitude: 37.8123,
    longitude: -122.2691,
  },
  {
    slug: "950-shorepoint",
    name: "950 Shorepoint Court",
    address: "950 Shorepoint Ct, Alameda, CA 94501",
    latitude: 37.7711,
    longitude: -122.265,
  },
];

async function main() {
  const sergio = await prisma.porter.upsert({
    where: { id: "porter-sergio" },
    update: {
      name: "Sergio Carrillo",
      title: "Field Supervisor since 2020",
      photoUrl: "/porters/sergio.jpg",
    },
    create: {
      id: "porter-sergio",
      name: "Sergio Carrillo",
      title: "Field Supervisor since 2020",
      photoUrl: "/porters/sergio.jpg",
    },
  });

  for (const p of PROPERTIES) {
    await prisma.property.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        address: p.address,
        latitude: p.latitude,
        longitude: p.longitude,
        porterId: sergio.id,
      },
      create: {
        slug: p.slug,
        name: p.name,
        address: p.address,
        latitude: p.latitude,
        longitude: p.longitude,
        porterId: sergio.id,
        hhwInstructions: p.hhwInstructions ?? null,
        schedule: { create: STANDARD_SCHEDULE },
      },
    });
  }

  // Guides: only create on first run. Re-running the seed should NOT
  // clobber admin edits, so we use create-or-skip rather than upsert.
  const guideRows = [
    { slug: "waste", title: WASTE_GUIDE.title, content: WASTE_GUIDE.content },
    { slug: "hhw", title: HHW_GENERAL_GUIDE.title, content: HHW_GENERAL_GUIDE.content },
  ];
  let createdGuides = 0;
  for (const g of guideRows) {
    const existing = await prisma.guide.findUnique({ where: { slug: g.slug } });
    if (!existing) {
      await prisma.guide.create({ data: g });
      createdGuides += 1;
    }
  }

  console.log(
    `Seed complete: ${PROPERTIES.length} properties, 1 porter, ${createdGuides} new guide(s).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
