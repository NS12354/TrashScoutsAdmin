import { notFound } from "next/navigation";
import Image from "next/image";
import { BrandHeader } from "@/components/BrandHeader";
import { TileIcons, TileNav } from "@/components/TileNav";
import { BRAND_NAME } from "@/lib/brand";
import { getAllProperties, getPorter, getProperty } from "@/lib/data";
import type { Porter } from "@/data/types";

export function generateStaticParams() {
  return getAllProperties().map((p) => ({ id: p.id }));
}

export default async function PropertyHome({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = getProperty(id);
  if (!property) return notFound();
  const porter = getPorter(property.porterId);

  const tiles = [
    {
      href: `/p/${id}/setup`,
      number: 1,
      label: "Setup Photos",
      icon: TileIcons.Camera,
    },
    {
      href: `/p/${id}/schedule`,
      number: 2,
      label: "Service Schedule",
      icon: TileIcons.Calendar,
    },
    {
      href: `/p/${id}/report`,
      number: 3,
      label: "Report an Issue",
      icon: TileIcons.Megaphone,
    },
    {
      href: `/p/${id}/hhw`,
      number: 4,
      label: "Hazardous Waste Guide",
      icon: TileIcons.Warning,
    },
    {
      href: `/p/${id}/guide`,
      number: 5,
      label: "Recycling Guide",
      icon: TileIcons.Recycle,
    },
  ];

  return (
    <>
      <BrandHeader backHref="/" />

      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Welcome,{" "}
        <span className="text-brand-dark">{property.name}</span>{" "}
        resident
      </h1>
      <p className="mt-1 text-sm text-zinc-500">{property.address}</p>

      <PorterCard porter={porter} />

      <div className="mt-5">
        <TileNav tiles={tiles} />
      </div>
    </>
  );
}

function PorterCard({ porter }: { porter: Porter | null }) {
  if (!porter) {
    return (
      <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-zinc-500 ring-1 ring-zinc-200">
        No Trash Scout assigned yet.
      </div>
    );
  }
  return (
    <article className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
      <div className="relative aspect-[4/3] w-full bg-zinc-100">
        {porter.photoUrl ? (
          <Image
            src={porter.photoUrl}
            alt={porter.name}
            fill
            className="object-cover"
            sizes="448px"
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-zinc-400">
            {porter.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-brand-dark">
          Meet your Trash Scout
        </div>
        <div className="mt-1 text-lg font-semibold">{porter.name}</div>
        {porter.title && (
          <p className="mt-1 text-sm text-zinc-500">{porter.title}</p>
        )}
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-xs text-brand-dark">
          <span>✓</span> Authorized {BRAND_NAME} staff
        </div>
      </div>
    </article>
  );
}
