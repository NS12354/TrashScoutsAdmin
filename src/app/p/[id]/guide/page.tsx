import { notFound } from "next/navigation";
import { BrandHeader } from "@/components/BrandHeader";
import { GuideRenderer } from "@/components/GuideRenderer";
import { getProperty, getWasteGuide } from "@/lib/data";
import { COUNTY_AGENCY, countyLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function WasteGuidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) return notFound();

  const guide = await getWasteGuide();
  const agency = property.county ? COUNTY_AGENCY[property.county] : null;

  return (
    <>
      <BrandHeader backHref={`/p/${id}`} />
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">
          Waste & Recycling Guide
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{property.name}</p>
      </div>

      {agency && (
        <a
          href={agency.url}
          target="_blank"
          rel="noreferrer"
          className="mb-3 flex items-start gap-3 rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-4 text-white shadow-sm transition hover:brightness-110"
        >
          <span
            aria-hidden
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M14 3h7v7" />
              <path d="M10 14L21 3" />
              <path d="M21 14v7H3V3h7" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold uppercase tracking-wide text-white/85">
              {countyLabel(property.county) ?? "Local"} sorting rules
            </div>
            <div className="mt-0.5 text-[15px] font-semibold leading-tight">
              Official guide: {agency.name}
            </div>
            <div className="mt-0.5 text-xs text-white/85">
              Up-to-date sorting requirements for your address
            </div>
          </div>
        </a>
      )}

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
        <GuideRenderer content={guide.content} variant="light" />
      </div>
    </>
  );
}
