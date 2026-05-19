import { prisma } from "@/lib/db";
import { GuideEditor } from "@/components/admin/GuideEditor";

export const dynamic = "force-dynamic";

export default async function AdminGuidesPage() {
  const guides = await prisma.guide.findMany({
    where: { slug: { in: ["waste", "hhw"] } },
  });

  const waste = guides.find((g) => g.slug === "waste");
  const hhw = guides.find((g) => g.slug === "hhw");

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Guides</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Shared content shown on every property's <strong>Waste Guide</strong>{" "}
        and <strong>HHW</strong> page. Changes go live on the next resident
        page load.
      </p>

      <div className="mt-6 space-y-6">
        {waste ? (
          <GuideEditor
            slug="waste"
            initialTitle={waste.title}
            initialContent={waste.content}
            updatedAt={waste.updatedAt}
          />
        ) : (
          <MissingNotice slug="waste" />
        )}

        {hhw ? (
          <GuideEditor
            slug="hhw"
            initialTitle={hhw.title}
            initialContent={hhw.content}
            updatedAt={hhw.updatedAt}
          />
        ) : (
          <MissingNotice slug="hhw" />
        )}
      </div>
    </div>
  );
}

function MissingNotice({ slug }: { slug: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
      Guide row <code className="font-mono">{slug}</code> is missing from the
      database. Resident pages are falling back to the hardcoded default. Run{" "}
      <code className="font-mono">npm run db:seed</code> to create it.
    </div>
  );
}
