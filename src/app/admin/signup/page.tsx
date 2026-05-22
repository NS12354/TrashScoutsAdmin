import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SignupForm } from "@/components/admin/SignupForm";
import { BRAND_NAME } from "@/lib/brand";
import { ALLOWED_SIGNUP_DOMAINS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function AdminSignupPage() {
  // Already signed in? Skip the form and drop them in the dashboard.
  if (await getSession()) redirect("/admin");

  const allowedDomains = Array.from(ALLOWED_SIGNUP_DOMAINS);

  return (
    <div className="admin-shell">
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-16">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← Back to site
        </Link>
        <h1 className="admin-wordmark mt-3 text-2xl font-semibold tracking-tight">
          {BRAND_NAME} <span style={{ color: "var(--fx-green-bright)" }}>admin</span>
        </h1>
        <p className="mb-6 mt-1 text-sm text-zinc-500">
          New employee? Set up your dashboard account in a minute.
        </p>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <SignupForm allowedDomains={allowedDomains} />
        </div>
      </main>
    </div>
  );
}
