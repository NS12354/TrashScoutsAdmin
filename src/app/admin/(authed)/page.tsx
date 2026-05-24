import Link from "next/link";
import { prisma } from "@/lib/db";
import { issueCategoryLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [propertyCount, porterCount, openIssues, propertiesWithOpen, recent] =
    await Promise.all([
      prisma.property.count(),
      prisma.porter.count(),
      prisma.issue.count({ where: { status: "OPEN" } }),
      // For "needs attention": properties + their open-issue counts.
      prisma.property.findMany({
        select: {
          id: true,
          name: true,
          _count: { select: { issues: { where: { status: "OPEN" } } } },
        },
      }),
      // Recent open reports feed.
      prisma.issue.findMany({
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { property: { select: { name: true } } },
      }),
    ]);

  const needsAttention = propertiesWithOpen
    .filter((p) => p._count.issues > 0)
    .sort((a, b) => b._count.issues - a._count.issues)
    .slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <Link
          href="/admin/properties/new"
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          + Add Property
        </Link>
      </div>

      {/* Stat tiles */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Properties" value={propertyCount} href="/admin/properties" />
        <Stat label="Porters" value={porterCount} href="/admin/porters" />
        <Stat
          label="Open issues"
          value={openIssues}
          href="/admin/issues?status=OPEN"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Needs attention */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">
              Needs attention
            </h2>
            <Link
              href="/admin/issues?status=OPEN"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:underline"
            >
              All open reports
            </Link>
          </div>
          {needsAttention.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">
              ✓ No open reports — all clear.
            </p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {needsAttention.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/issues?property=${p.id}&status=OPEN`}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-zinc-50"
                  >
                    <span className="min-w-0 truncate text-sm text-zinc-800">
                      {p.name}
                    </span>
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      {p._count.issues} open
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent reports */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">
              Recent reports
            </h2>
            <Link
              href="/admin/issues"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:underline"
            >
              All reports
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">No reports yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-zinc-100">
              {recent.map((iss) => (
                <li key={iss.id}>
                  <Link
                    href={`/admin/issues?property=${iss.propertyId}&status=OPEN`}
                    className="flex items-center justify-between gap-3 py-2 hover:bg-zinc-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-zinc-800">
                        {issueCategoryLabel(iss.category)}
                      </span>
                      <span className="block truncate text-xs text-zinc-500">
                        {iss.property.name}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-zinc-400">
                      {new Date(iss.createdAt).toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
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
