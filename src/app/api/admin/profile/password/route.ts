import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { invalidateActiveTokens } from "@/lib/passwordTokens";

export const runtime = "nodejs";

const MIN_PASSWORD_LEN = 8;

// Changes the currently-signed-in admin's password. We always require the
// current password as a gate — a stolen session cookie alone can't lock the
// real admin out by rotating the password.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json().catch(() => ({}));
  const current = String(currentPassword ?? "");
  const next = String(newPassword ?? "");

  if (!current) {
    return NextResponse.json(
      { error: "Current password is required" },
      { status: 400 },
    );
  }
  if (next.length < MIN_PASSWORD_LEN) {
    return NextResponse.json(
      { error: `New password must be at least ${MIN_PASSWORD_LEN} characters` },
      { status: 400 },
    );
  }
  if (next === current) {
    return NextResponse.json(
      { error: "New password must be different from your current password" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, password: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  const ok = await bcrypt.compare(current, user.password);
  if (!ok) {
    return NextResponse.json(
      { error: "Current password is incorrect" },
      { status: 401 },
    );
  }

  const hash = await bcrypt.hash(next, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hash, passwordSetAt: new Date() },
  });
  // Any outstanding invite or reset tokens for this user are now stale.
  await invalidateActiveTokens(user.id);

  return NextResponse.json({ ok: true });
}
