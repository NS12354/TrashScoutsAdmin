import { notFound } from "next/navigation";
import { BrandHeader } from "@/components/BrandHeader";
import { SetupPhotoGrid } from "@/components/SetupPhotoGrid";
import { getProperty } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SetupPhotosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) return notFound();

  const photos = (property.setupPhotos ?? []).map((p, i) => ({
    id: `${id}-${i}`,
    url: p.url,
    caption: p.caption ?? null,
    subcaption: p.subcaption ?? null,
  }));

  return (
    <>
      <BrandHeader backHref={`/p/${id}`} />
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">Setup Photos</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {property.name} — how the trash room should look.
        </p>
      </div>

      {photos.length === 0 ? (
        <div className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-zinc-500 shadow-sm ring-1 ring-zinc-200">
          No setup photos yet.
        </div>
      ) : (
        <SetupPhotoGrid photos={photos} />
      )}
    </>
  );
}
