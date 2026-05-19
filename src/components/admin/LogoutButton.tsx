"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={logout}
      className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100"
    >
      Sign out
    </button>
  );
}
