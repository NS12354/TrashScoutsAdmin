import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import {
  GOOGLE_NEXT_COOKIE,
  GOOGLE_STATE_COOKIE,
  buildAuthorizationUrl,
  googleRedirectUri,
  isGoogleEnabled,
} from "@/lib/googleAuth";
import { SITE_URL } from "@/lib/brand";

export const runtime = "nodejs";

// Step 1 of Google SSO. Generates an anti-CSRF `state`, stashes it in an
// httpOnly cookie, and redirects the browser to Google's consent screen.
// Also stashes the post-login destination (?next=…) so we can route back
// after the callback succeeds.
export async function GET(req: NextRequest) {
  if (!isGoogleEnabled()) {
    return NextResponse.redirect(
      new URL("/admin/login?sso_error=not_configured", req.url),
    );
  }

  const url = new URL(req.url);
  const next = url.searchParams.get("next") ?? "";
  const safeNext = next.startsWith("/admin") ? next : "/admin";

  const state = randomBytes(24).toString("base64url");
  const jar = await cookies();
  jar.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 5 * 60, // 5 minutes — plenty for the user to click through Google
  });
  jar.set(GOOGLE_NEXT_COOKIE, safeNext, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 5 * 60,
  });

  const target = buildAuthorizationUrl({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    redirectUri: googleRedirectUri(SITE_URL),
    state,
  });
  return NextResponse.redirect(target);
}
