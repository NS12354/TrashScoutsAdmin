import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PropertyWizard } from "@/components/admin/PropertyWizard";
import { DeletePropertyButton } from "@/components/admin/DeletePropertyButton";

export const dynamic = "force-dynamic";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      schedule: { orderBy: [{ dayOfWeek: "asc" }] },
      setupPhotos: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!property) return notFound();

  return (
    <div>
      <Link
        href="/admin"
        className="text-sm text-zinc-500 hover:underline"
      >
        ← All properties
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight capitalize">{property.name}</h1>
          <p className="text-sm capitalize text-zinc-500">{property.address}</p>
        </div>
        <Link
          href={`/admin/properties/${property.id}/qr`}
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
        >
          View QR
        </Link>
      </div>

      <div className="mt-6">
        <PropertyWizard
          mode="edit"
          propertyId={property.id}
          initial={{
            name: property.name,
            address: property.address,
            latitude: property.latitude,
            longitude: property.longitude,
            hhwInstructions: property.hhwInstructions,
            porterId: property.porterId,
            schedule: property.schedule.map((s) => ({
              dayOfWeek: s.dayOfWeek,
              binType: s.binType as "TRASH" | "RECYCLING" | "ORGANICS" | "OTHER",
              action: s.action as "PULL_OUT" | "RETURN",
              timeWindow: s.timeWindow ?? "",
            })),
            setupPhotos: property.setupPhotos.map((p) => ({
              url: p.url,
              caption: p.caption ?? "",
            })),
          }}
        />
      </div>

      <DeletePropertyButton
        propertyId={property.id}
        propertyName={property.name}
      />
    </div>
  );
}
