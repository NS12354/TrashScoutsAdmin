import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [propertyCount, porterCount, openIssues] = await Promise.all([
    prisma.property.count(),
    prisma.porter.count(),
    prisma.issue.count({ where: { status: "OPEN" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
      <p className="mt-1 text-sm text-zinc-500">Quick snapshot of the platform.</p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Properties" value={propertyCount} href="/admin/properties" />
        <Stat label="Porters" value={porterCount} href="/admin/porters" />
        <Stat label="Open issues" value={openIssues} href="/admin/issues?status=OPEN" />
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center">
        <p className="text-sm text-zinc-600">
          Ready to add a new building?
        </p>
        <Link
          href="/admin/properties/new"
          className="mt-3 inline-block rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          + Add Property
        </Link>
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
