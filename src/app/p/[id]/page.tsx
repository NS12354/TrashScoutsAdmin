import { notFound } from "next/navigation";
import Image from "next/image";
import { BrandHeader } from "@/components/BrandHeader";
import { TileIcons, TileNav } from "@/components/TileNav";
import { BRAND_NAME } from "@/lib/brand";
import { getPorter, getProperty } from "@/lib/data";
import type { Porter } from "@/data/types";

export const dynamic = "force-dynamic";

export default async function PropertyHome({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) return notFound();

  // Two shifts: most properties have a morning + evening porter. Fetch both
  // (either slot can be empty), and if the same person covers both shifts
  // collapse to a single card with a combined label.
  const [dayPorter, nightPorter] = await Promise.all([
    getPorter(property.porterId),
    getPorter(property.nightPorterId),
  ]);
  const porterCards: { porter: Porter; shift: string }[] =
    dayPorter && nightPorter && dayPorter.id === nightPorter.id
      ? [{ porter: dayPorter, shift: "Day & Night Shift" }]
      : [
          dayPorter && { porter: dayPorter, shift: "Day Shift" },
          nightPorter && { porter: nightPorter, shift: "Night Shift" },
        ].filter((c): c is { porter: Porter; shift: string } => Boolean(c));

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
      label: "Household Hazardous Waste",
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
      <BrandHeader />

      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Welcome,{" "}
        <span className="capitalize text-brand-dark">{property.name}</span>{" "}
        Resident
      </h1>
      <p className="mt-1 text-sm capitalize text-zinc-500">{property.address}</p>

      {porterCards.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-zinc-500 ring-1 ring-zinc-200">
          No Trash Scouts assigned yet.
        </div>
      ) : porterCards.length === 1 ? (
        <div className="mt-4">
          <PorterCard
            porter={porterCards[0]!.porter}
            shift={porterCards[0]!.shift}
          />
        </div>
      ) : (
        <div className="mt-4">
          <div
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Swipe between Day and Night shift porters"
          >
            {porterCards.map(({ porter, shift }) => (
              <div
                key={porter.id + shift}
                className="w-full shrink-0 snap-center"
              >
                <PorterCard porter={porter} shift={shift} />
              </div>
            ))}
          </div>
          <div
            className="mt-2 flex justify-center gap-1.5"
            aria-hidden
          >
            {porterCards.map((_, i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-zinc-300"
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        <TileNav tiles={tiles} />
      </div>
    </>
  );
}

function PorterCard({ porter, shift }: { porter: Porter; shift: string }) {
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
      <div className="relative aspect-[4/3] w-full bg-zinc-100">
        {porter.photoUrl ? (
          <Image
            src={porter.photoUrl}
            alt={porter.name}
            fill
            className="object-cover object-center"
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
          {shift}
        </div>
        <div className="mt-1 text-lg font-semibold capitalize">
          {porter.name}
        </div>
        {porter.title && (
          <p className="mt-1 text-sm capitalize text-zinc-500">
            {porter.title}
          </p>
        )}
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-xs text-brand-dark">
          <span>✓</span> Authorized {BRAND_NAME} staff
        </div>
      </div>
    </article>
  );
}
