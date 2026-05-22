import Link from "next/link";
import { prisma } from "@/lib/db";
import { IssueRow } from "@/components/admin/IssueRow";

export const dynamic = "force-dynamic";

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;
const PAGE_SIZE = 20;

export default async function AdminIssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page } = await searchParams;
  const filter = STATUSES.includes(status as (typeof STATUSES)[number])
    ? (status as string)
    : undefined;
  const where = filter ? { status: filter } : undefined;

  const pageNum = Math.max(1, Number(page) || 1);
  const skip = (pageNum - 1) * PAGE_SIZE;

  const [total, issues] = await Promise.all([
    prisma.issue.count({ where }),
    prisma.issue.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { name: true, address: true } },
        photos: true,
      },
      skip,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : skip + 1;
  const to = Math.min(skip + PAGE_SIZE, total);
  const qs = (p: number) =>
    `/admin/issues?${filter ? `status=${filter}&` : ""}page=${p}`;

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

      {total > 0 && (
        <p className="mt-4 text-xs text-zinc-400">
          Showing {from}–{to} of {total} report{total === 1 ? "" : "s"}
        </p>
      )}

      <div className="mt-2 space-y-3">
        {issues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-sm text-zinc-500">
            No reports here.
          </div>
        ) : (
          issues.map((iss) => <IssueRow key={iss.id} issue={iss} />)
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <PageLink
            href={qs(pageNum - 1)}
            disabled={pageNum <= 1}
            label="← Previous"
          />
          <span className="text-sm text-zinc-500">
            Page {pageNum} of {totalPages}
          </span>
          <PageLink
            href={qs(pageNum + 1)}
            disabled={pageNum >= totalPages}
            label="Next →"
          />
        </div>
      )}
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

function PageLink({
  href,
  disabled,
  label,
}: {
  href: string;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return (
      <span className="cursor-not-allowed rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-300">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
    >
      {label}
    </Link>
  );
}
