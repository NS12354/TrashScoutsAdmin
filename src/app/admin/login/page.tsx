import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/admin/LoginForm";
import { BRAND_NAME } from "@/lib/brand";
import { isGoogleEnabled } from "@/lib/googleAuth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getSession()) redirect("/admin");

  const googleEnabled = isGoogleEnabled();

  return (
    <main className="mx-auto w-full max-w-md px-5 py-16">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← Back to site
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        {BRAND_NAME} admin
      </h1>
      <p className="mb-6 mt-1 text-sm text-zinc-500">
        Sign in to manage properties, porters, and incoming reports.
      </p>
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <Suspense fallback={null}>
          <LoginForm googleEnabled={googleEnabled} />
        </Suspense>
      </div>
    </main>
  );
}
