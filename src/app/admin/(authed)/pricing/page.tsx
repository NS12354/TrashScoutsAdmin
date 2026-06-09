import { prisma } from "@/lib/db";
import {
  PricingTool,
  type PricingPropertyOption,
  type SavedPricingQuote,
} from "@/components/admin/PricingTool";

export const dynamic = "force-dynamic";

const SAVED_QUOTE_LIMIT = 30;

export default async function PricingPage() {
  const [properties, quotes] = await Promise.all([
    prisma.property.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        address: true,
        schedule: {
          select: {
            binType: true,
            action: true,
            binCount: true,
            binSize: true,
            dayOfWeek: true,
          },
        },
      },
    }),
    prisma.pricingQuote.findMany({
      orderBy: { createdAt: "desc" },
      take: SAVED_QUOTE_LIMIT,
      select: {
        id: true,
        propertyId: true,
        clientName: true,
        preparedBy: true,
        monthlyPrice: true,
        weeklyPrice: true,
        createdByName: true,
        createdAt: true,
        property: { select: { name: true } },
      },
    }),
  ]);

  const propertyOptions: PricingPropertyOption[] = properties.map((p) => ({
    id: p.id,
    name: p.name,
    address: p.address,
    schedule: p.schedule.map((s) => ({
      binType: s.binType,
      action: s.action,
      binCount: s.binCount,
      binSize: s.binSize,
      dayOfWeek: s.dayOfWeek,
    })),
  }));

  const savedQuotes: SavedPricingQuote[] = quotes.map((q) => ({
    id: q.id,
    propertyId: q.propertyId,
    propertyName: q.property.name,
    clientName: q.clientName,
    preparedBy: q.preparedBy,
    monthlyPrice: q.monthlyPrice,
    weeklyPrice: q.weeklyPrice,
    createdByName: q.createdByName,
    createdAt: q.createdAt.toISOString(),
  }));

  return (
    <PricingTool properties={propertyOptions} savedQuotes={savedQuotes} />
  );
}
