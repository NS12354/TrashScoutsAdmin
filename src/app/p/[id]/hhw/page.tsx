import { notFound } from "next/navigation";
import { BrandHeader } from "@/components/BrandHeader";
import { HHWCategoryGrid } from "@/components/HHWCategoryGrid";
import { HHWDropoffList } from "@/components/HHWDropoffList";
import { HHW_CATEGORIES } from "@/lib/hhwCategories";
import { GuideRenderer } from "@/components/GuideRenderer";
import { getAllProperties, getHHWGeneralGuide, getProperty } from "@/lib/data";

export function generateStaticParams() {
  return getAllProperties().map((p) => ({ id: p.id }));
}


export default async function HHWPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = getProperty(id);
  if (!property) return notFound();

  const generalGuide = getHHWGeneralGuide();

  return (
    <>
      <BrandHeader backHref={`/p/${id}`} />
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">
          Hazardous waste guide
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{property.name}</p>
      </div>

      {property.hhwInstructions ? (
        <div className="mb-4 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            For this property
          </div>
          <p className="mt-1.5 text-[15px] leading-relaxed text-amber-900">
            {property.hhwInstructions}
          </p>
        </div>
      ) : (
        <div className="mb-4 rounded-2xl bg-white p-4 text-sm text-zinc-500 shadow-sm ring-1 ring-zinc-200">
          No property-specific HHW rules yet.
        </div>
      )}

      <h2 className="mb-2 mt-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Common categories
      </h2>
      <HHWCategoryGrid categories={HHW_CATEGORIES} />

      <HHWDropoffList
        referenceLat={property.latitude}
        referenceLng={property.longitude}
      />

      <details className="mt-5 rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-700">
          Full safety reference
        </summary>
        <div className="px-4 pb-4">
          <GuideRenderer content={generalGuide.content} variant="light" />
        </div>
      </details>
    </>
  );
}
