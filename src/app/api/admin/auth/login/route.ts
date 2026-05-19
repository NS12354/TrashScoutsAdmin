import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
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
