import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminHome({
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

  const [porterCount, openIssues, properties, totalProperties] =
    await Promise.all([
      prisma.porter.count(),
      prisma.issue.count({ where: { status: "OPEN" } }),
      prisma.property.findMany({
        where,
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
      prisma.property.count(),
    ]);

  // Properties with open reports float to the top so the ones needing
  // attention are first; the rest fall back to alphabetical.
  const sorted = [...properties].sort((a, b) => {
    if (b._count.issues !== a._count.issues)
      return b._count.issues - a._count.issues;
    return a.name.localeCompare(b.name);
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <Link
          href="/admin/properties/new"
          className="btn-primary"
        >
          + Add Property
        </Link>
      </div>

      {/* Stat tiles */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Properties" value={totalProperties} href="/admin" />
        <Stat label="Porters" value={porterCount} href="/admin/porters" />
        <Stat
          label="Open issues"
          value={openIssues}
          href="/admin/issues?status=OPEN"
        />
      </div>

      {/* Search */}
      <form method="GET" action="/admin" className="mt-6 flex items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search properties by name, address, or city…"
          className="w-full input"
        />
        <button
          type="submit"
          className="btn-secondary"
        >
          Search
        </button>
        {query && (
          <Link
            href="/admin"
            className="btn-secondary"
          >
            Clear
          </Link>
        )}
      </form>

      <ul className="mt-4 space-y-2">
        {sorted.length === 0 && (
          <li className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-sm text-zinc-500">
            {query ? (
              <>
                No properties matched <strong>“{query}”</strong>.{" "}
                <Link href="/admin" className="font-medium text-brand-dark hover:underline">
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
        {sorted.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 hover:shadow-sm"
          >
            <Link href={`/admin/properties/${p.id}`} className="min-w-0 flex-1">
              <div className="font-medium capitalize">{p.name}</div>
              <div className="text-sm capitalize text-zinc-500">{p.address}</div>
              <div className="mt-1 text-xs text-zinc-400">
                {p.porter?.name ?? "No porter"} · {p._count.schedule} schedule
                row{p._count.schedule === 1 ? "" : "s"} · {p._count.setupPhotos}{" "}
                photo{p._count.setupPhotos === 1 ? "" : "s"}
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
                  ? `View ${p._count.issues} Open Report${p._count.issues === 1 ? "" : "s"}`
                  : "View Reports"}
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

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-zinc-200 bg-white p-4 hover:shadow-sm"
    >
      <div className="text-sm text-zinc-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold tracking-tight">{value}</div>
    </Link>
  );
}
