import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandHeader } from "@/components/BrandHeader";
import { WhatGoesWhereCards } from "@/components/WhatGoesWhereCards";
import { getProperty } from "@/lib/data";
import { COUNTY_AGENCY, countyLabel } from "@/lib/format";
import { guideForCounty } from "@/data/countyGuides";

export const dynamic = "force-dynamic";

export default async function WhatGoesWherePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) return notFound();

  const guide = guideForCounty(property.county);
  const agency = property.county ? COUNTY_AGENCY[property.county] : null;
  const officialUrl = property.guideUrl || agency?.url || null;
  const officialName =
    agency?.name ?? (property.guideUrl ? "Official Guide" : null);
  const countyName = countyLabel(property.county);

  return (
    <>
      <BrandHeader backHref={`/p/${id}`} />
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">
          What Goes Where
        </h1>
        <p className="mt-1 text-sm capitalize text-zinc-500">
          {property.name}
          {countyName ? ` · ${countyName}` : ""}
        </p>
      </div>

      {/* City/county-specific authoritative guide — shown whenever we
          have a URL (admin-pasted property.guideUrl wins, agency map
          is the fallback). This is the source of truth; the cards
          below are the in-app quick-reference. */}
      {officialUrl && (
        <a
          href={officialUrl}
          target="_blank"
          rel="noreferrer"
          className="mb-4 flex items-start gap-3 rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-4 text-white shadow-sm transition hover:brightness-110"
        >
          <span
            aria-hidden
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M14 3h7v7" />
              <path d="M10 14L21 3" />
              <path d="M21 14v7H3V3h7" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold uppercase tracking-wide text-white/85">
              {countyName ?? "Local"} sorting guide
            </div>
            <div className="mt-0.5 text-[15px] font-semibold leading-tight">
              Open official guide{officialName ? `: ${officialName}` : ""}
            </div>
            <div className="mt-0.5 text-xs text-white/85">
              Searchable A–Z list with photos for your address
            </div>
          </div>
        </a>
      )}

      {/* Visual material cards — Yes / Keep out lists with emoji
          item icons. Content is per-county so SF residents see SF's
          stricter copy, etc. */}
      <WhatGoesWhereCards guide={guide} />

      {/* Deep link into the Household Hazardous Waste page so we can
          drop the standalone HHW tile from the resident home screen
          without losing access to that content. */}
      <Link
        href={`/p/${id}/hhw`}
        className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 transition hover:bg-amber-100"
      >
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Household Hazardous Waste
          </div>
          <div className="mt-0.5 text-[15px] font-semibold text-amber-900">
            Batteries, paint, electronics, sharps &amp; more
          </div>
        </div>
        <span
          aria-hidden
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-200 text-amber-800"
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
      </Link>
    </>
  );
}
