import { prisma } from "@/lib/db";
import { AddPorterForm } from "@/components/admin/AddPorterForm";
import { PorterCard } from "@/components/admin/PorterCard";

export const dynamic = "force-dynamic";

export default async function PortersPage() {
  const porters = await prisma.porter.findMany({
    orderBy: { name: "asc" },
    include: { properties: { select: { id: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Porters</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Field staff residents see on each property page.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-zinc-200 bg-white">
          {porters.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-zinc-500">
              No porters yet. Add one on the right.
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {porters.map((p) => (
                <PorterCard
                  key={p.id}
                  porter={{
                    id: p.id,
                    name: p.name,
                    title: p.title,
                    photoUrl: p.photoUrl,
                    email: p.email,
                    propertyCount: p.properties.length,
                  }}
                />
              ))}
            </ul>
          )}
        </div>

        <AddPorterForm />
      </div>
    </div>
  );
}
