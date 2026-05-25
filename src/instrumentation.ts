// Server-side error monitoring via Next's native instrumentation hooks — no
// Sentry build plugin, so it stays compatible with this Next build. Sentry is
// only initialized when SENTRY_DSN is set, so dev / preview / a not-yet-
// configured prod are completely unaffected (captureRequestError no-ops when
// no client is initialized).
import * as Sentry from "@sentry/nextjs";

// Runs once per server runtime (Node and Edge) before requests are served.
export function register() {
  if (!process.env.SENTRY_DSN) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    // Error monitoring only — no performance tracing overhead/quota by default.
    tracesSampleRate: 0,
  });
}

// Forwards server errors (route handlers, RSC, server actions) to Sentry.
export const onRequestError = Sentry.captureRequestError;
