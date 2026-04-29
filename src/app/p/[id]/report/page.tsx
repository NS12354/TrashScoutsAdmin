import { notFound } from "next/navigation";
import { BrandHeader } from "@/components/BrandHeader";
import { IssueForm } from "@/components/IssueForm";
import { getAllProperties, getProperty } from "@/lib/data";

export function generateStaticParams() {
  return getAllProperties().map((p) => ({ id: p.id }));
}


export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = getProperty(id);
  if (!property) return notFound();

  return (
    <>
      <BrandHeader backHref={`/p/${id}`} />
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">
          Report an issue
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {property.name} — no account needed.
        </p>
      </div>

      <IssueForm
        propertyId={property.id}
        successHref={`/p/${id}/report/success`}
      />
    </>
  );
}
