import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { QRBlock } from "@/components/admin/QRBlock";

export const dynamic = "force-dynamic";

export default async function PropertyQRPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    select: { id: true, slug: true, name: true, address: true },
  });
  if (!property) return notFound();

  return (
    <div>
      <Link
        href="/admin"
        className="text-sm text-zinc-500 hover:underline"
      >
        ← All properties
      </Link>

      <div className="mt-4 flex flex-col items-center text-center">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-brand/15 text-brand-dark">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8"
            aria-hidden
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Property ready
        </h1>
        <p className="mt-1 max-w-md text-sm text-zinc-600">
          Scan the QR below, or download it to print and post in the trash room.
        </p>
      </div>

      <QRBlock slug={property.slug} name={property.name} address={property.address} />

      <div className="mt-6 flex justify-center gap-2">
        <Link
          href={`/admin/properties/${property.id}`}
          className="btn-secondary"
        >
          Edit this property
        </Link>
        <Link
          href={`/admin/properties/${property.id}/pricing`}
          className="btn-secondary"
        >
          Pricing
        </Link>
        <Link
          href="/admin/properties/new"
          className="btn-primary"
        >
          + Add another
        </Link>
      </div>
    </div>
  );
}
