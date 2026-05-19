import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";
import { requireSession } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const canManageAdmins = isSuperAdmin(session);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/admin" className="font-semibold tracking-tight">
            {BRAND_NAME} <span className="text-zinc-400">/ Admin</span>
          </Link>
          <nav className="hidden gap-1 text-sm sm:flex">
            <NavLink href="/admin">Overview</NavLink>
            <NavLink href="/admin/properties">Properties</NavLink>
            <NavLink href="/admin/porters">Porters</NavLink>
            <NavLink href="/admin/guides">Guides</NavLink>
            <NavLink href="/admin/issues">Reports</NavLink>
            {canManageAdmins && <NavLink href="/admin/admins">Admins</NavLink>}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/profile"
              className="hidden rounded-md px-2 py-1 text-right text-xs leading-tight hover:bg-zinc-100 sm:block"
              aria-label="Open your profile"
            >
              <div className="font-medium text-zinc-700">{session.name}</div>
              <div className="text-zinc-400">{session.email}</div>
            </Link>
            <LogoutButton />
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-zinc-100 px-2 py-2 text-sm sm:hidden">
          <NavLink href="/admin">Overview</NavLink>
          <NavLink href="/admin/properties">Properties</NavLink>
          <NavLink href="/admin/porters">Porters</NavLink>
          <NavLink href="/admin/guides">Guides</NavLink>
          <NavLink href="/admin/issues">Reports</NavLink>
          {canManageAdmins && <NavLink href="/admin/admins">Admins</NavLink>}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
    >
      {children}
    </Link>
  );
}
