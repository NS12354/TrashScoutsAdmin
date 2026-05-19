// Tiny hand-rolled OAuth2 client for Google sign-in. Two route handlers
// drive it: /api/admin/auth/google/start (authorization URL + state cookie)
// and /api/admin/auth/google/callback (state check, code exchange, id_token
// verification). Sessions are minted with the existing createSession()
// helper, so the rest of the middleware doesn't know SSO is happening.

import { createRemoteJWKSet, jwtVerify } from "jose";

export const GOOGLE_STATE_COOKIE = "google_oauth_state";
export const GOOGLE_NEXT_COOKIE = "google_oauth_next";
export const GOOGLE_AUTH_ENDPOINT =
  "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

export function isGoogleEnabled(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleRedirectUri(siteUrl: string): string {
  return `${siteUrl.replace(/\/$/, "")}/api/admin/auth/google/callback`;
}

export function buildAuthorizationUrl(args: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const url = new URL(GOOGLE_AUTH_ENDPOINT);
  url.searchParams.set("client_id", args.clientId);
  url.searchParams.set("redirect_uri", args.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", args.state);
  url.searchParams.set("access_type", "online");
  // Always show the account chooser — avoids the "wrong Google account
  // cached" foot-gun where users get silently signed in with the wrong one.
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export type GoogleTokens = {
  id_token: string;
  access_token: string;
};

export async function exchangeCode(args: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<GoogleTokens> {
  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: args.code,
      client_id: args.clientId,
      client_secret: args.clientSecret,
      redirect_uri: args.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Google token exchange failed (${res.status}): ${body}`);
  }
  return (await res.json()) as GoogleTokens;
}

export type GoogleIdentity = {
  subject: string; // stable user id from Google
  email: string; // lowercased
  emailVerified: boolean;
  name: string;
};

// Verifies the id_token's signature against Google's JWKs and checks issuer,
// audience, and expiry. Throws on any mismatch.
export async function verifyIdToken(
  idToken: string,
  clientId: string,
): Promise<GoogleIdentity> {
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: clientId,
  });

  const subject = typeof payload.sub === "string" ? payload.sub : undefined;
  const emailRaw = typeof payload.email === "string" ? payload.email : undefined;
  const emailVerified =
    typeof payload.email_verified === "boolean"
      ? payload.email_verified
      : payload.email_verified === "true";
  const name =
    (typeof payload.name === "string" && payload.name) ||
    (typeof payload.given_name === "string" && payload.given_name) ||
    emailRaw ||
    "Admin";

  if (!subject || !emailRaw) {
    throw new Error("Google id_token missing subject or email");
  }
  return {
    subject,
    email: emailRaw.toLowerCase(),
    emailVerified,
    name: String(name),
  };
}
