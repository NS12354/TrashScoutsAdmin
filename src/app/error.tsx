"use client";

import Link from "next/link";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Top-level error boundary. Captures any runtime error in a route segment
// and shows a friendly recovery UI rather than a blank screen.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report React render errors caught by this boundary to Sentry (no-op
    // until a DSN is configured), and surface to the console in dev.
    Sentry.captureException(error);
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 py-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-700">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-7 w-7"
          aria-hidden
        >
          <path d="M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      </div>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-sm text-zinc-600">
        Sorry — we hit an unexpected error. You can try again, or go back to
        the home page.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-zinc-400">
          Reference: <code className="font-mono">{error.digest}</code>
        </p>
      )}
      <div className="mt-6 grid w-full grid-cols-1 gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
