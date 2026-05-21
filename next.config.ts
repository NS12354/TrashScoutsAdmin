import type { NextConfig } from "next";

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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co",
      "media-src 'self' blob:",
      "connect-src 'self' https://nominatim.openstreetmap.org",
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
