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

  // Decide which shift is "active" right now in the property's local time
  // so the active porter shows first in the swipe stack. Properties are all
  // in California today, so we hardcode the LA timezone — if you ever take
  // this to other regions, store a tz field on Property and read it here.
  // Window: 4pm–midnight = night, midnight–4pm = day.
  const hourPT = Number(
    new Date().toLocaleString("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/Los_Angeles",
    }),
  );
  const isNightShift = hourPT >= 16;

  const porterCards: { porter: Porter; shift: string }[] =
    dayPorter && nightPorter && dayPorter.id === nightPorter.id
      ? [{ porter: dayPorter, shift: "Day & Night Shift" }]
      : (() => {
          const day = dayPorter && { porter: dayPorter, shift: "Day Shift" };
          const night =
            nightPorter && { porter: nightPorter, shift: "Night Shift" };
          const ordered = isNightShift ? [night, day] : [day, night];
          return ordered.filter(
            (c): c is { porter: Porter; shift: string } => Boolean(c),
          );
        })();

  // Four tiles, not five — consolidating HHW into the "What Goes Where"
  // guide page (which deep-links back into the HHW page) keeps the home
  // screen scrollable in one glance on most phones.
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
      href: `/p/${id}/guide`,
      number: 4,
      label: "What Goes Where",
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

      <a
        href={`/p/${id}/wall-sign`}
        className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50"
      >
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-zinc-900">
            Request a Trash Scouts Wall Sign
          </div>
          <div className="mt-0.5 text-xs text-zinc-500">
            For your trash enclosure — we&apos;ll follow up with details.
          </div>
        </div>
        <span
          aria-hidden
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/10 text-brand-dark"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
      </a>
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
