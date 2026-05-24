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

type IssueWithRels = Prisma.IssueGetPayload<{
  include: {
    property: { select: { name: true; address: true } };
    photos: true;
  };
}>;

export default async function AdminIssuesPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    property?: string;
    porter?: string;
    category?: string;
    page?: string;
    view?: string;
  }>;
}) {
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as (typeof STATUSES)[number])
    ? (sp.status as string)
    : "";
  const category = CATEGORY_VALUES.has(sp.category ?? "") ? sp.category! : "";
  const property = sp.property ?? "";
  const porter = sp.porter ?? "";
  const view = sp.view === "list" ? "list" : "grouped";

  const where: Prisma.IssueWhereInput = {
    ...(status ? { status } : {}),
    ...(category ? { category } : {}),
    ...(property ? { propertyId: property } : {}),
    ...(porter ? { property: { porterId: porter } } : {}),
  };

  const [propertyRows, porterRows] = await Promise.all([
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

  const propertyOptions = propertyRows.map((p) => ({
    value: p.id,
    label: p._count.issues > 0 ? `${p.name} (${p._count.issues} open)` : p.name,
  }));
  const porterOptions = porterRows.map((p) => ({ value: p.id, label: p.name }));

  // Preserve filters in links; swap one param.
  const buildHref = (over: Record<string, string>) => {
    const base: Record<string, string> = {
      status,
      property,
      porter,
      category,
      view,
    };
    const merged = { ...base, ...over };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
      if (v && !(k === "view" && v === "grouped")) params.set(k, v);
    }
    const qs = params.toString();
    return `/admin/issues${qs ? `?${qs}` : ""}`;
  };

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
          {/* View toggle */}
          <div className="mb-4 inline-flex rounded-lg ring-1 ring-zinc-200">
            <Link
              href={buildHref({ view: "grouped" })}
              className={`rounded-l-lg px-3 py-1.5 text-sm font-medium ${
                view === "grouped"
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              Grouped by property
            </Link>
            <Link
              href={buildHref({ view: "list" })}
              className={`rounded-r-lg px-3 py-1.5 text-sm font-medium ${
                view === "list"
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              All
            </Link>
          </div>

          {view === "grouped" ? (
            <GroupedReports where={where} />
          ) : (
            <ListReports where={where} page={sp.page} buildHref={buildHref} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Grouped by property, sorted by number of open issues ─────────────── */
async function GroupedReports({ where }: { where: Prisma.IssueWhereInput }) {
  const issues = await prisma.issue.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      property: { select: { name: true, address: true } },
      photos: true,
    },
  });

  if (issues.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-sm text-zinc-500">
        No reports match these filters.
      </div>
    );
  }

  // Group by property.
  const groups = new Map<
    string,
    { propertyId: string; name: string; address: string; issues: IssueWithRels[] }
  >();
  for (const iss of issues) {
    const g = groups.get(iss.propertyId);
    if (g) g.issues.push(iss);
    else
      groups.set(iss.propertyId, {
        propertyId: iss.propertyId,
        name: iss.property.name,
        address: iss.property.address,
        issues: [iss],
      });
  }

  // Sort groups by number of OPEN issues (within the current result set),
  // then by total in the group, then name.
  const openCount = (gi: IssueWithRels[]) =>
    gi.filter((i) => i.status === "OPEN").length;
  const ordered = [...groups.values()].sort((a, b) => {
    const oa = openCount(a.issues);
    const ob = openCount(b.issues);
    if (ob !== oa) return ob - oa;
    if (b.issues.length !== a.issues.length)
      return b.issues.length - a.issues.length;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-6">
      {ordered.map((g) => {
        const open = openCount(g.issues);
        return (
          <section key={g.propertyId}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={`/admin/properties/${g.propertyId}`}
                  className="font-semibold capitalize tracking-tight hover:underline"
                >
                  {g.name}
                </Link>
                <span className="ml-2 text-sm capitalize text-zinc-500">{g.address}</span>
              </div>
              <span className="shrink-0 text-xs font-medium text-zinc-500">
                {open > 0 && (
                  <span className="mr-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                    {open} open
                  </span>
                )}
                {g.issues.length} total
              </span>
            </div>
            <div className="space-y-3">
              {g.issues.map((iss) => (
                <IssueRow key={iss.id} issue={iss} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ── Flat chronological list with pagination ─────────────────────────── */
async function ListReports({
  where,
  page,
  buildHref,
}: {
  where: Prisma.IssueWhereInput;
  page?: string;
  buildHref: (over: Record<string, string>) => string;
}) {
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

  return (
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
            href={buildHref({ page: String(pageNum - 1) })}
            disabled={pageNum <= 1}
            label="← Previous"
          />
          <span className="text-sm text-zinc-500">
            Page {pageNum} of {totalPages}
          </span>
          <PageLink
            href={buildHref({ page: String(pageNum + 1) })}
            disabled={pageNum >= totalPages}
            label="Next →"
          />
        </div>
      )}
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
