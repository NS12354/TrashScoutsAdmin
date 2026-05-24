import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/admin/LoginForm";
import { BRAND_NAME, BRAND_LOGO } from "@/lib/brand";
import { isGoogleEnabled } from "@/lib/googleAuth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getSession()) redirect("/admin");

  const googleEnabled = isGoogleEnabled();

  return (
    <main className="mx-auto w-full max-w-md px-5 py-16">
      <div className="flex flex-col items-center text-center">
        {BRAND_LOGO ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={BRAND_LOGO} alt={BRAND_NAME} className="h-12 w-auto" />
        ) : (
          <span className="text-2xl font-semibold tracking-tight">
            {BRAND_NAME}
          </span>
        )}
        <p className="mb-6 mt-3 text-sm text-zinc-500">
          Sign in to manage properties, porters, and incoming reports.
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <Suspense fallback={null}>
          <LoginForm googleEnabled={googleEnabled} />
        </Suspense>
      </div>
    </main>
  );
}
