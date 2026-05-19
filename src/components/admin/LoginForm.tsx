"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const SSO_ERROR_MESSAGES: Record<string, string> = {
  not_configured: "Google sign-in isn't configured on this server.",
  state: "The sign-in attempt expired or was tampered with. Try again.",
  token: "Couldn't complete the Google sign-in. Try again.",
  identity: "Couldn't verify your Google identity. Try again.",
  email_unverified: "Your Google email isn't verified. Verify it with Google and retry.",
  not_authorized:
    "This Google account isn't authorized for this dashboard. Ask an existing admin to invite your email.",
  cancelled: "Sign-in was cancelled.",
  google_error: "Google ran into an issue. Try again in a moment.",
};

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const ssoError = searchParams.get("sso_error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ssoMessage = ssoError
    ? (SSO_ERROR_MESSAGES[ssoError] ?? "Couldn't sign in with Google. Try again.")
    : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Sign-in failed");
      }
      const dest = next && next.startsWith("/admin") ? next : "/admin";
      router.push(dest);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  const googleHref =
    "/api/admin/auth/google/start" +
    (next ? `?next=${encodeURIComponent(next)}` : "");

  return (
    <div className="space-y-4">
      {ssoMessage && (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
          {ssoMessage}
        </div>
      )}

      {googleEnabled && (
        <>
          <a
            href={googleHref}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <GoogleMark />
            Sign in with Google
          </a>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="h-px flex-1 bg-zinc-200" />
            or sign in with email
            <span className="h-px flex-1 bg-zinc-200" />
          </div>
        </>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5"
          />
        </label>
        <label className="block">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-sm font-medium">Password</span>
            <Link
              href="/admin/forgot"
              className="text-xs text-zinc-500 hover:text-zinc-900 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5"
          />
        </label>
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.95-2.18l-2.9-2.26c-.8.54-1.83.86-3.05.86-2.34 0-4.32-1.58-5.03-3.7H.95v2.32A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.96H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.04l3.02-2.32Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.96l3.02 2.32C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
