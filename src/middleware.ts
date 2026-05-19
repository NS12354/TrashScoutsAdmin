import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "ts_admin_session";

// Public auth endpoints — never gate these, otherwise login is impossible.
const PUBLIC_PATHS = new Set<string>([
  "/admin/login",
  "/admin/signup",
  "/admin/forgot",
  "/admin/set-password",
  "/api/admin/auth/login",
  "/api/admin/auth/logout",
  "/api/admin/auth/signup",
  "/api/admin/auth/forgot-password",
  "/api/admin/auth/set-password",
  "/api/admin/auth/google/start",
  "/api/admin/auth/google/callback",
]);

function getSecret(): Uint8Array {
  const raw = process.env.AUTH_SECRET;
  if (!raw) throw new Error("AUTH_SECRET missing in env");
  return new TextEncoder().encode(raw);
}

async function isAuthed(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return typeof payload.userId === "string";
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const authed = await isAuthed(req);
  if (authed) return NextResponse.next();

  // API routes get a JSON 401 so client fetches can handle it cleanly.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Page routes redirect to login, preserving the destination for post-login.
  const loginUrl = new URL("/admin/login", req.url);
  if (pathname !== "/admin") {
    loginUrl.searchParams.set("next", pathname + req.nextUrl.search);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
