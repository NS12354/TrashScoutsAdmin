// Real password-based admin auth. Sessions are JWTs in an httpOnly cookie,
// signed with AUTH_SECRET. First admin is created via `npm run admin:create`
// (see prisma/createAdmin.ts) — after that, admins manage each other through
// /admin/admins.

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export type Session = { userId: string; email: string; name: string };

const COOKIE_NAME = "ts_admin_session";
const SESSION_DAYS = 14;
const SESSION_TTL_SEC = SESSION_DAYS * 24 * 60 * 60;

function getSecret(): Uint8Array {
  const raw = process.env.AUTH_SECRET;
  if (!raw || raw.length < 16) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Set it in .env.local (32+ random chars).",
    );
  }
  return new TextEncoder().encode(raw);
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string"
    ) {
      return null;
    }
    return {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) throw new Error("Unauthorized");
  return s;
}

export async function createSession(payload: Session): Promise<void> {
  const token = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SEC,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}
