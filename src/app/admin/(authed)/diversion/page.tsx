import { prisma } from "@/lib/db";
import {
  DiversionReportBuilder,
  type PropertyOption,
  type SavedReport,
} from "@/components/admin/DiversionReportBuilder";

export const dynamic = "force-dynamic";

const SAVED_REPORT_LIMIT = 30;

export default async function DiversionReportPage() {
  const [props, reports] = await Promise.all([
    prisma.property.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        address: true,
        schedule: {
          select: {
            binType: true,
            action: true,
            binCount: true,
            binSize: true,
          },
        },
      },
    }),
    prisma.diversionReport.findMany({
      orderBy: { createdAt: "desc" },
      take: SAVED_REPORT_LIMIT,
      select: {
        id: true,
        propertyId: true,
        clientName: true,
        period: true,
        propType: true,
        mode: true,
        divRate: true,
        totalWeekly: true,
        createdByName: true,
        createdAt: true,
        property: { select: { name: true } },
      },
    }),
  ]);

  const properties: PropertyOption[] = props.map((p) => ({
    id: p.id,
    name: p.name,
    address: p.address,
    schedule: p.schedule.map((s) => ({
      binType: s.binType,
      action: s.action,
      binCount: s.binCount,
      binSize: s.binSize,
    })),
  }));

  const savedReports: SavedReport[] = reports.map((r) => ({
    id: r.id,
    propertyId: r.propertyId,
    propertyName: r.property.name,
    clientName: r.clientName,
    period: r.period,
    propType: r.propType,
    mode: r.mode,
    divRate: r.divRate,
    totalWeekly: r.totalWeekly,
    createdByName: r.createdByName,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Diversion Report</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Build a per-property waste-diversion summary. Picking a property
        prefills the table from its Service Schedule when bin sizes are set.
        Save the report to view or re-open it later.
      </p>
      <div className="mt-6">
        <DiversionReportBuilder
          properties={properties}
          savedReports={savedReports}
        />
      </div>
    </div>
  );
}
