// Client-side error monitoring. Next loads this automatically in the browser.
// Initializes Sentry only when a public DSN is set (DSNs are safe to expose);
// otherwise it's a no-op and adds no network calls.
import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    // Error monitoring only — no performance tracing or session replay.
    tracesSampleRate: 0,
  });
}
