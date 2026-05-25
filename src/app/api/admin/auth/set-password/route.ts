import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  consumeToken,
  findActiveToken,
  invalidateActiveTokens,
} from "@/lib/passwordTokens";
import { createSession } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const MIN_PASSWORD_LEN = 8;
// Throttle this public endpoint (defense-in-depth — tokens are already
// unguessable + single-use): 10 attempts per IP per 15 minutes.
const SETPW_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 };

// Public endpoint. Consumes a single-use token from /admin/set-password and
// sets the user's password, then signs them in.
export async function POST(req: NextRequest) {
  const limit = await rateLimit(`setpw:${getClientIp(req)}`, SETPW_LIMIT);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many attempts — try again in ${limit.resetIn} seconds.` },
      { status: 429, headers: { "Retry-After": String(limit.resetIn) } },
    );
  }

  const { token, password } = await req.json().catch(() => ({}));
  const raw = String(token ?? "");
  const pw = String(password ?? "");

  if (!raw) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }
  if (pw.length < MIN_PASSWORD_LEN) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LEN} characters` },
      { status: 400 },
    );
  }

  const tokenRow = await findActiveToken(raw);
  if (!tokenRow) {
    return NextResponse.json(
      { error: "This link is invalid or has expired. Ask another admin to resend." },
      { status: 400 },
    );
  }

  const hash = await bcrypt.hash(pw, 10);
  const user = await prisma.user.update({
    where: { id: tokenRow.userId },
    data: { password: hash, passwordSetAt: new Date() },
    select: { id: true, email: true, name: true },
  });

  // Burn this token + any other outstanding ones for the user, so a stolen
  // copy can't be reused after a successful set.
  await consumeToken(tokenRow.id);
  await invalidateActiveTokens(user.id);

  // Sign them in directly — saves a trip back to the login screen.
  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
  });

  return NextResponse.json({ ok: true });
}
