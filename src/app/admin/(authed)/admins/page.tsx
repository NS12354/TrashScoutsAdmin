import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { AddAdminForm } from "@/components/admin/AddAdminForm";
import { AdminRow } from "@/components/admin/AdminRow";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  const session = await requireSession();

  if (!isSuperAdmin(session)) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admins</h1>
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-base font-semibold text-amber-900">
            Restricted page
          </h2>
          <p className="mt-2 text-sm text-amber-800">
            Adding and removing admins is reserved for the Trash Scouts owners.
            If you need someone added or removed, ask one of them to do it.
          </p>
          <Link
            href="/admin"
            className="mt-4 inline-block rounded-xl bg-white px-4 py-2 text-sm font-medium text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100"
          >
            ← Back to overview
          </Link>
        </div>
      </div>
    );
  }

  const admins = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      passwordSetAt: true,
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Admins</h1>
      <p className="mt-1 text-sm text-zinc-500">
        People who can sign in to this dashboard. Add new admins on the right,
        remove with the button on each row.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-zinc-200 bg-white">
          <ul className="divide-y divide-zinc-100">
            {admins.map((a) => (
              <AdminRow
                key={a.id}
                admin={a}
                isYou={a.id === session.userId}
                totalAdmins={admins.length}
              />
            ))}
          </ul>
        </div>

        <AddAdminForm />
      </div>
    </div>
  );
}
