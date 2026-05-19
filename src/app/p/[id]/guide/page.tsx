import { notFound } from "next/navigation";
import { BrandHeader } from "@/components/BrandHeader";
import { GuideRenderer } from "@/components/GuideRenderer";
import { getProperty, getWasteGuide } from "@/lib/data";

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

  return (
    <>
      <BrandHeader backHref={`/p/${id}`} />
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">
          Waste & recycling guide
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{property.name}</p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
        <GuideRenderer content={guide.content} variant="light" />
      </div>
    </>
  );
}
