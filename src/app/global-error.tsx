"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Catches errors thrown in the root layout itself (which the segment-level
// error.tsx can't reach). Must render its own <html>/<body>. Reports to
// Sentry (no-op until a DSN is set).
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
          color: "#18181b",
        }}
      >
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 8px" }}>
            Something went wrong
          </h1>
          <p style={{ margin: 0, color: "#52525b", fontSize: "14px" }}>
            Sorry — we hit an unexpected error. Please refresh the page.
          </p>
        </div>
      </body>
    </html>
  );
}
