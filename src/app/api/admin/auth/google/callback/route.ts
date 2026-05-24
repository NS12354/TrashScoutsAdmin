import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  GOOGLE_NEXT_COOKIE,
  GOOGLE_STATE_COOKIE,
  exchangeCode,
  googleRedirectUri,
  isGoogleEnabled,
  verifyIdToken,
} from "@/lib/googleAuth";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/brand";
import { isAllowedSignupEmail } from "@/lib/permissions";

export const runtime = "nodejs";

// Step 2 of Google SSO. Validates the state cookie, exchanges the code for
// an id_token, verifies it against Google's JWKs, and matches the verified
// identity to an existing admin User row. We never auto-create admins —
// only emails already in the User table can sign in. If matched, we mint a
// session cookie via the same createSession() the password flow uses, so
// middleware + the rest of the dashboard don't know SSO was involved.
export async function GET(req: NextRequest) {
  const back = (reason: string) =>
    NextResponse.redirect(new URL(`/admin/login?sso_error=${reason}`, req.url));

  if (!isGoogleEnabled()) return back("not_configured");

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const jar = await cookies();
  const stateCookie = jar.get(GOOGLE_STATE_COOKIE)?.value;
  const nextCookie = jar.get(GOOGLE_NEXT_COOKIE)?.value;

  // Burn both single-use cookies regardless of outcome.
  jar.delete(GOOGLE_STATE_COOKIE);
  jar.delete(GOOGLE_NEXT_COOKIE);

  if (errorParam) {
    // User clicked "Cancel" on Google's consent screen, or Google declined.
    return back(errorParam === "access_denied" ? "cancelled" : "google_error");
  }
  if (!code || !stateParam || !stateCookie || stateParam !== stateCookie) {
    return back("state");
  }

  let tokens;
  try {
    tokens = await exchangeCode({
      code,
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: googleRedirectUri(SITE_URL),
    });
  } catch (err) {
    console.error("[google-sso] token exchange failed:", err);
    return back("token");
  }

  let identity;
  try {
    identity = await verifyIdToken(tokens.id_token, process.env.GOOGLE_CLIENT_ID!);
  } catch (err) {
    console.error("[google-sso] id_token verify failed:", err);
    return back("identity");
  }
  if (!identity.emailVerified) return back("email_unverified");

  // Hard domain gate: only @trashscouts.com / @revisent.com Google accounts
  // may sign in, regardless of what's already in the User table.
  if (!isAllowedSignupEmail(identity.email)) return back("domain");

  // Lookup: prefer a previously-stamped subject (stable across email changes),
  // then fall back to email. We never auto-provision new admins via SSO.
  let user = await prisma.user.findUnique({
    where: { googleSubject: identity.subject },
  });
  if (!user) {
    user = await prisma.user.findUnique({ where: { email: identity.email } });
  }
  if (!user) return back("not_authorized");

  // Stamp googleSubject on first SSO sign-in. Also stamp passwordSetAt so
  // SSO-only users aren't blocked by the password-login pending check and
  // can use Forgot password later if they ever want a local password.
  const patch: { googleSubject?: string; passwordSetAt?: Date } = {};
  if (!user.googleSubject) patch.googleSubject = identity.subject;
  if (!user.passwordSetAt) patch.passwordSetAt = new Date();
  if (Object.keys(patch).length > 0) {
    user = await prisma.user.update({ where: { id: user.id }, data: patch });
  }

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
  });

  const dest =
    nextCookie && nextCookie.startsWith("/admin") ? nextCookie : "/admin";
  return NextResponse.redirect(new URL(dest, req.url));
}
