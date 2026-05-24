import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PropertiesListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const where: Prisma.PropertyWhereInput | undefined = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { address: { contains: query, mode: "insensitive" } },
        ],
      }
    : undefined;

  const [properties, totalCount] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        porter: true,
        _count: {
          select: {
            schedule: true,
            setupPhotos: true,
            issues: { where: { status: "OPEN" } },
          },
        },
      },
    }),
    query ? prisma.property.count() : Promise.resolve(null),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Properties</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {query
              ? `${properties.length} of ${totalCount ?? 0} matching “${query}”.`
              : `${properties.length} building${properties.length === 1 ? "" : "s"} on the platform.`}
          </p>
        </div>
        <Link
          href="/admin/properties/new"
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          + Add Property
        </Link>
      </div>

      <form
        method="GET"
        action="/admin/properties"
        className="mt-6 flex items-center gap-2"
      >
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search by name, address, or city…"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Search
        </button>
        {query && (
          <Link
            href="/admin/properties"
            className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
          >
            Clear
          </Link>
        )}
      </form>

      <ul className="mt-4 space-y-2">
        {properties.length === 0 && (
          <li className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-sm text-zinc-500">
            {query ? (
              <>
                No properties matched <strong>“{query}”</strong>.{" "}
                <Link
                  href="/admin/properties"
                  className="font-medium text-brand-dark hover:underline"
                >
                  Clear search
                </Link>
                .
              </>
            ) : (
              <>
                No properties yet. Click <strong>+ Add Property</strong> to
                create the first one.
              </>
            )}
          </li>
        )}
        {properties.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 hover:shadow-sm"
          >
            <Link
              href={`/admin/properties/${p.id}`}
              className="min-w-0 flex-1"
            >
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-zinc-500">{p.address}</div>
              <div className="mt-1 text-xs text-zinc-400">
                {p.porter?.name ?? "No porter"} · {p._count.schedule}{" "}
                schedule row{p._count.schedule === 1 ? "" : "s"} ·{" "}
                {p._count.setupPhotos} photo
                {p._count.setupPhotos === 1 ? "" : "s"}
              </div>
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/admin/issues?property=${p.id}&status=OPEN`}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ring-1 ${
                  p._count.issues > 0
                    ? "bg-amber-50 text-amber-800 ring-amber-200 hover:bg-amber-100"
                    : "bg-zinc-50 text-zinc-700 ring-zinc-200 hover:bg-zinc-100"
                }`}
              >
                {p._count.issues > 0
                  ? `View ${p._count.issues} open report${p._count.issues === 1 ? "" : "s"}`
                  : "View reports"}
              </Link>
              <Link
                href={`/admin/properties/${p.id}/qr`}
                className="rounded-md bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100"
              >
                QR ↓
              </Link>
              <Link
                href={`/admin/properties/${p.id}`}
                aria-label={`Edit ${p.name}`}
                className="text-zinc-400 hover:text-zinc-600"
              >
                →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
