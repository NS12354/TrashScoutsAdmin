import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

// Throttle login attempts to blunt password brute-forcing: 10 tries per IP
// per 10 minutes. Generous for a fat-fingered admin, tight against a bot.
const LOGIN_LIMIT = { limit: 10, windowMs: 10 * 60 * 1000 };

export async function POST(req: NextRequest) {
  const limit = rateLimit(`login:${getClientIp(req)}`, LOGIN_LIMIT);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many attempts — try again in ${limit.resetIn} seconds.` },
      { status: 429, headers: { "Retry-After": String(limit.resetIn) } },
    );
  }

  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({
    where: { email: String(email).toLowerCase() },
  });
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  // Invite still pending — the bcrypt column holds a random unusable hash.
  // Refuse explicitly so the user knows to look for the invite email rather
  // than getting a generic "invalid credentials" loop.
  if (!user.passwordSetAt) {
    return NextResponse.json(
      {
        error:
          "Finish setting up your account first — check your email for the invite link.",
      },
      { status: 403 },
    );
  }
  const ok = await bcrypt.compare(String(password), user.password);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
  });
  return NextResponse.json({ ok: true });
}
