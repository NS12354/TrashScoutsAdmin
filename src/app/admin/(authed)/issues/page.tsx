import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { IssueRow } from "@/components/admin/IssueRow";
import { ReportsFilters } from "@/components/admin/ReportsFilters";
import { ISSUE_CATEGORIES } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;
const CATEGORY_VALUES = new Set(ISSUE_CATEGORIES.map((c) => c.value));
const PAGE_SIZE = 20;

export default async function AdminIssuesPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    property?: string;
    porter?: string;
    category?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as (typeof STATUSES)[number])
    ? (sp.status as string)
    : "";
  const category = CATEGORY_VALUES.has(sp.category ?? "") ? sp.category! : "";
  const property = sp.property ?? "";
  const porter = sp.porter ?? "";

  // Build the filter once, reuse for count + page query.
  const where: Prisma.IssueWhereInput = {
    ...(status ? { status } : {}),
    ...(category ? { category } : {}),
    ...(property ? { propertyId: property } : {}),
    ...(porter ? { property: { porterId: porter } } : {}),
  };

  const pageNum = Math.max(1, Number(sp.page) || 1);
  const skip = (pageNum - 1) * PAGE_SIZE;

  const [total, issues, propertyRows, porterRows] = await Promise.all([
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
    prisma.property.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        _count: { select: { issues: { where: { status: "OPEN" } } } },
      },
    }),
    prisma.porter.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : skip + 1;
  const to = Math.min(skip + PAGE_SIZE, total);

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (property) params.set("property", property);
    if (porter) params.set("porter", porter);
    if (category) params.set("category", category);
    params.set("page", String(p));
    return `/admin/issues?${params.toString()}`;
  };

  // Property options show their open-issue count so the most-active buildings
  // are easy to spot and pick.
  const propertyOptions = propertyRows.map((p) => ({
    value: p.id,
    label: p._count.issues > 0 ? `${p.name} (${p._count.issues} open)` : p.name,
  }));
  const porterOptions = porterRows.map((p) => ({ value: p.id, label: p.name }));

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Issues submitted by residents via the QR code.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        <ReportsFilters
          properties={propertyOptions}
          porters={porterOptions}
          categories={ISSUE_CATEGORIES}
          current={{ status, property, porter, category }}
        />

        <div>
          {total > 0 && (
            <p className="mb-2 text-xs text-zinc-400">
              Showing {from}–{to} of {total} report{total === 1 ? "" : "s"}
            </p>
          )}

          <div className="space-y-3">
            {issues.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-sm text-zinc-500">
                No reports match these filters.
              </div>
            ) : (
              issues.map((iss) => <IssueRow key={iss.id} issue={iss} />)
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <PageLink
                href={pageHref(pageNum - 1)}
                disabled={pageNum <= 1}
                label="← Previous"
              />
              <span className="text-sm text-zinc-500">
                Page {pageNum} of {totalPages}
              </span>
              <PageLink
                href={pageHref(pageNum + 1)}
                disabled={pageNum >= totalPages}
                label="Next →"
              />
            </div>
          )}
        </div>
      </div>
    </div>
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
