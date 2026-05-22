import Link from "next/link";
import { prisma } from "@/lib/db";
import { BRAND_NAME } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [propertyCount, porterCount, openIssues] = await Promise.all([
    prisma.property.count(),
    prisma.porter.count(),
    prisma.issue.count({ where: { status: "OPEN" } }),
  ]);

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="admin-livedot" aria-hidden />
        <span
          className="text-xs font-medium uppercase tracking-[0.2em]"
          style={{ color: "var(--fx-green-bright)" }}
        >
          System online
        </span>
      </div>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Overview</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Live snapshot of the {BRAND_NAME} platform.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Properties" value={propertyCount} href="/admin/properties" />
        <Stat label="Porters" value={porterCount} href="/admin/porters" />
        <Stat
          label="Open issues"
          value={openIssues}
          href="/admin/issues?status=OPEN"
          alert={openIssues > 0}
        />
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center">
        <p className="text-sm text-zinc-600">Ready to add a new building?</p>
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
  alert = false,
}: {
  label: string;
  value: number;
  href: string;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 hover:shadow-sm"
    >
      <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div
        className="mt-2 font-mono text-4xl font-semibold tracking-tight tabular-nums"
        style={{
          color: alert ? "#fcd34d" : "var(--fx-green-bright)",
          textShadow: alert
            ? "0 0 20px rgba(245,158,11,0.45)"
            : "0 0 20px var(--fx-glow)",
        }}
      >
        {value.toString().padStart(2, "0")}
      </div>
      <span
        className="pointer-events-none absolute right-4 top-4 text-zinc-400 transition-transform group-hover:translate-x-0.5"
        aria-hidden
      >
        →
      </span>
    </Link>
  );
}
