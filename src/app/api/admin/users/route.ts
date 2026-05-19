import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { issueToken } from "@/lib/passwordTokens";
import { sendPasswordEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/brand";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CreateBody = {
  email?: string;
  name?: string;
};

// Creates a new admin in "invite pending" state and emails them a link to
// pick their own password. No password is set by the inviter — a random
// unusable placeholder fills the bcrypt column until the user completes
// setup. `passwordSetAt` stays null, which login refuses.
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

  const { raw, expiresAt } = await issueToken(user.id, "invite");
  const link = `${SITE_URL}/admin/set-password?token=${raw}`;

  const sendResult = await sendPasswordEmail({
    to: user.email,
    name: user.name,
    link,
    purpose: "invite",
    expiresAt,
  });

  return NextResponse.json({
    user,
    invite: {
      sent: sendResult.ok,
      skipped: sendResult.skipped ?? false,
      // Always surface the raw link to the inviting super-admin so they can
      // share it manually when email delivery fails (e.g. Resend in sandbox
      // mode, an unverified domain, the recipient on a deny-list). The
      // response only goes to an authenticated super-admin over TLS — they
      // could see invite tokens in the DB anyway.
      link,
    },
  });
}
