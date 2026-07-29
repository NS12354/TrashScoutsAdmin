import type { NextConfig } from "next";

// 'unsafe-eval' is only needed by the dev server (HMR) — never ship it to prod.
const isDev = process.env.NODE_ENV !== "production";

// Defense-in-depth security headers applied to every response.
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: [
      "camera=(self)",
      "geolocation=()",
      "microphone=()",
      "payment=()",
      "usb=()",
      "midi=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
      "interest-cohort=()",
    ].join(", "),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co",
      "media-src 'self' blob:",
      // *.supabase.co: admin document uploads PUT straight from the browser
      // to Supabase Storage, bypassing the 4.5 MB serverless body limit.
      "connect-src 'self' https://nominatim.openstreetmap.org https://*.sentry.io https://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // proxy.ts makes Next buffer every request body, capped at 10 MB by
    // default — and it silently truncates past the cap rather than
    // erroring, which shows up downstream as a FormData parse failure.
    // Only the local-dev document upload path sends bodies this large;
    // in prod those bytes go browser → Supabase and never reach us.
    proxyClientMaxBodySize: "30mb",
  },
  // Photos uploaded in admin live in Supabase Storage in prod (and on
  // /public/uploads locally). The Supabase project host must be allowlisted
  // for next/image optimization.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  // Don't expose a public resident homepage on this admin deployment —
  // anonymous traffic to `/` lands on the login screen. But keep `/p/<slug>`
  // and its children reachable so QR scans (the resident-facing target)
  // work on this same domain.
  async redirects() {
    return [
      { source: "/", destination: "/admin/login", permanent: false },
    ];
  },
};

export default nextConfig;
