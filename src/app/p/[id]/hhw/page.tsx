import { notFound } from "next/navigation";
import { BrandHeader } from "@/components/BrandHeader";
import { HHWCategoryGrid } from "@/components/HHWCategoryGrid";
import { HHWDropoffList } from "@/components/HHWDropoffList";
import { HHW_CATEGORIES } from "@/lib/hhwCategories";
import { GuideRenderer } from "@/components/GuideRenderer";
import { getHHWGeneralGuide, getProperty } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HHWPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) return notFound();

  const generalGuide = await getHHWGeneralGuide();

  return (
    <>
      <BrandHeader backHref={`/p/${id}`} />
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">
          Household Hazardous Waste
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
          No property-specific Household Hazardous Waste rules yet.
        </div>
      )}

      <h2 className="mb-2 mt-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Common categories
      </h2>
      <HHWCategoryGrid categories={HHW_CATEGORIES} />

      <HHWDropoffList />

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
