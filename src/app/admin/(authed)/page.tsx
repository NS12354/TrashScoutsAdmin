import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [porterCount, openIssues, properties] = await Promise.all([
    prisma.porter.count(),
    prisma.issue.count({ where: { status: "OPEN" } }),
    prisma.property.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        porter: { select: { name: true } },
        _count: { select: { schedule: true, setupPhotos: true, issues: true } },
      },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat
          label="Properties"
          value={properties.length}
          href="/admin/properties"
        />
        <Stat label="Porters" value={porterCount} href="/admin/porters" />
        <Stat
          label="Open issues"
          value={openIssues}
          href="/admin/issues?status=OPEN"
        />
      </div>

      {/* Properties, inline */}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Properties</h2>
        <Link
          href="/admin/properties/new"
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          + Add Property
        </Link>
      </div>

      <ul className="mt-4 space-y-2">
        {properties.length === 0 && (
          <li className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-sm text-zinc-500">
            No properties yet. Click <strong>+ Add Property</strong> to create
            the first one.
          </li>
        )}
        {properties.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 hover:shadow-sm"
          >
            <Link href={`/admin/properties/${p.id}`} className="min-w-0 flex-1">
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-zinc-500">{p.address}</div>
              <div className="mt-1 text-xs text-zinc-400">
                {p.porter?.name ?? "No porter"} · {p._count.schedule} schedule
                row{p._count.schedule === 1 ? "" : "s"} · {p._count.setupPhotos}{" "}
                photo{p._count.setupPhotos === 1 ? "" : "s"}
                {p._count.issues > 0 && (
                  <>
                    {" "}
                    ·{" "}
                    <span className="font-semibold text-amber-700">
                      {p._count.issues} report
                      {p._count.issues === 1 ? "" : "s"}
                    </span>
                  </>
                )}
              </div>
            </Link>
            <div className="flex shrink-0 items-center gap-3">
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
