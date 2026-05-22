import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";
import { requireSession } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { AdminNav } from "@/components/admin/AdminNav";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const canManageAdmins = isSuperAdmin(session);

  const navItems = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/properties", label: "Properties" },
    { href: "/admin/porters", label: "Porters" },
    { href: "/admin/issues", label: "Reports" },
    ...(canManageAdmins ? [{ href: "/admin/admins", label: "Admins" }] : []),
  ];

  return (
    <div className="admin-shell">
      <header className="admin-topbar sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="admin-livedot" aria-hidden />
            <Link
              href="/admin"
              className="admin-wordmark text-sm font-semibold uppercase tracking-wider"
            >
              {BRAND_NAME}{" "}
              <span style={{ color: "var(--fx-green-bright)" }}>/ Admin</span>
            </Link>
          </div>

          <AdminNav
            items={navItems}
            className="hidden items-center gap-1 sm:flex"
          />

          <div className="flex items-center gap-2">
            <Link
              href="/admin/profile"
              className="admin-chip hidden px-2.5 py-1 text-right text-xs leading-tight sm:block"
              aria-label="Open your profile"
            >
              <div className="font-medium" style={{ color: "var(--fx-text-2)" }}>
                {session.name}
              </div>
              <div style={{ color: "var(--fx-dim)" }}>{session.email}</div>
            </Link>
            <LogoutButton />
          </div>
        </div>

        <AdminNav
          items={navItems}
          className="flex gap-1 overflow-x-auto px-2 py-2 sm:hidden"
        />
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
