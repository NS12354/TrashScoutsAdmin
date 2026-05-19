import Link from "next/link";
import { prisma } from "@/lib/db";
import { IssueRow } from "@/components/admin/IssueRow";

export const dynamic = "force-dynamic";

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;

export default async function AdminIssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = STATUSES.includes(status as typeof STATUSES[number])
    ? (status as string)
    : undefined;

  const issues = await prisma.issue.findMany({
    where: filter ? { status: filter } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      property: { select: { name: true, address: true } },
      photos: true,
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Issues submitted by residents via the QR code.
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <FilterPill href="/admin/issues" active={!filter} label="All" />
        {STATUSES.map((s) => (
          <FilterPill
            key={s}
            href={`/admin/issues?status=${s}`}
            active={filter === s}
            label={s.replaceAll("_", " ")}
          />
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {issues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-sm text-zinc-500">
            No reports here.
          </div>
        ) : (
          issues.map((iss) => <IssueRow key={iss.id} issue={iss} />)
        )}
      </div>
    </div>
  );
}

function FilterPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-sm font-medium ${
        active
          ? "bg-zinc-900 text-white"
          : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
      }`}
    >
      {label}
    </Link>
  );
}
