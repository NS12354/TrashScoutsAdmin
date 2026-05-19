import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { issueToken } from "@/lib/passwordTokens";
import { SITE_URL } from "@/lib/brand";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CreateBody = {
  email?: string;
  name?: string;
};

// Creates a new admin in "invite pending" state. No password is set by the
// inviter — a random unusable placeholder fills the bcrypt column until the
// invitee completes setup. The super-admin receives a one-time setup link in
// the response and shares it manually (Slack, SMS, etc) — no email is sent
// from the server, so we don't need a verified Resend domain to work.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await req.json()) as CreateBody;
  const email = body.email?.trim().toLowerCase();
  const name = body.name?.trim();

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An admin with that email already exists" },
      { status: 409 },
    );
  }

  // Random unusable bcrypt hash. bcrypt will never match against any input
  // until the user completes setup, at which point this is overwritten.
  const placeholder = await bcrypt.hash(randomBytes(32).toString("hex"), 10);

  const user = await prisma.user.create({
    data: { email, name, password: placeholder },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  const { raw } = await issueToken(user.id, "invite");
  const link = `${SITE_URL}/admin/set-password?token=${raw}`;

  return NextResponse.json({ user, invite: { link } });
}
