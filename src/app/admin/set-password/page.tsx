import Link from "next/link";
import { findActiveToken } from "@/lib/passwordTokens";
import { SetPasswordForm } from "@/components/admin/SetPasswordForm";
import { BRAND_NAME } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const raw = (token ?? "").trim();
  const row = raw ? await findActiveToken(raw) : null;

  return (
    <main className="mx-auto w-full max-w-md px-5 py-16">
      <Link href="/admin/login" className="text-sm text-zinc-500 hover:underline">
        ← Sign in
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        {BRAND_NAME} admin
      </h1>
      <p className="mb-6 mt-1 text-sm text-zinc-500">
        {row?.purpose === "reset"
          ? "Choose a new password for your account."
          : "Set a password to finish setting up your account."}
      </p>
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        {row ? (
          <SetPasswordForm
            token={raw}
            email={row.user.email}
            name={row.user.name}
            purpose={row.purpose === "reset" ? "reset" : "invite"}
          />
        ) : (
          <div className="space-y-3 text-sm text-zinc-700">
            <p className="font-medium text-red-700">
              This link is invalid or has expired.
            </p>
            <p>
              Invite and reset links expire after a short window. Options:
            </p>
            <ul className="ml-4 list-disc space-y-1 text-zinc-600">
              <li>Ask another admin to resend your invite, or</li>
              <li>
                Use{" "}
                <Link
                  href="/admin/forgot"
                  className="text-brand-dark underline"
                >
                  Forgot password
                </Link>{" "}
                from the login page.
              </li>
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
