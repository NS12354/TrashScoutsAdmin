import Link from "next/link";
import { ForgotPasswordForm } from "@/components/admin/ForgotPasswordForm";
import { BRAND_NAME } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto w-full max-w-md px-5 py-16">
      <Link href="/admin/login" className="text-sm text-zinc-500 hover:underline">
        ← Sign in
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        {BRAND_NAME} admin
      </h1>
      <p className="mb-6 mt-1 text-sm text-zinc-500">
        Enter your admin email and we&apos;ll send you a link to reset your
        password.
      </p>
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
