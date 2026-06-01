import { prisma } from "@/lib/db";
import {
  DiversionReportBuilder,
  type PropertyOption,
} from "@/components/admin/DiversionReportBuilder";

export const dynamic = "force-dynamic";

export default async function DiversionReportPage() {
  const rows = await prisma.property.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, address: true },
  });
  const properties: PropertyOption[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    address: r.address,
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Diversion Report</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Build a per-property waste diversion summary from bin sizes &amp;
        pickup frequency, or actual hauler weights. Print or save as PDF when
        you&apos;re done.
      </p>
      <div className="mt-6">
        <DiversionReportBuilder properties={properties} />
      </div>
    </div>
  );
}
