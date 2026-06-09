import { notFound } from "next/navigation";
import { BrandHeader } from "@/components/BrandHeader";
import { WallSignForm } from "@/components/WallSignForm";
import { getProperty } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function WallSignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) return notFound();

  return (
    <>
      <BrandHeader backHref={`/p/${id}`} />
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">
          Request a Wall Sign
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {property.name} — we&apos;ll follow up to confirm details.
        </p>
      </div>

      <WallSignForm
        propertyId={property.id}
        successHref={`/p/${id}/wall-sign/success`}
      />
    </>
  );
}
