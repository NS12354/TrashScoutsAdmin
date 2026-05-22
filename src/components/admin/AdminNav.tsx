"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

export function AdminNav({
  items,
  className = "",
}: {
  items: Item[];
  className?: string;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className={className}>
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          data-active={isActive(it.href)}
          className="admin-navlink text-sm font-medium"
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
