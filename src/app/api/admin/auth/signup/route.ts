import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { isAllowedSignupEmail } from "@/lib/permissions";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LEN = 8;
const MAX_NAME_LEN = 100;

type SignupBody = {
  email?: string;
  name?: string;
  password?: string;
};

// Public endpoint. Anyone whose email is on an allowed domain
// (ALLOWED_SIGNUP_DOMAINS in permissions.ts) can create an admin account
// directly, no invite required. On success the user is activated and
// signed in via the standard session cookie — same end state as the old
// invite + set-password flow.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as SignupBody;
  const email = body.email?.trim().toLowerCase();
  const name = body.name?.trim();
  const password = body.password ?? "";

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }
  if (!isAllowedSignupEmail(email)) {
    return NextResponse.json(
      {
        error:
          "Self sign-up is restricted to @trashscouts.com emails. Ask an existing admin to add you.",
      },
      { status: 403 },
    );
  }
  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (name.length > MAX_NAME_LEN) {
    return NextResponse.json(
      { error: `Name must be ${MAX_NAME_LEN} characters or fewer.` },
      { status: 400 },
    );
  }
  if (password.length < MIN_PASSWORD_LEN) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LEN} characters.` },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      {
        error:
          "An account with that email already exists. Try signing in instead, or use Forgot password.",
      },
      { status: 409 },
    );
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hash,
      passwordSetAt: new Date(),
    },
    select: { id: true, email: true, name: true },
  });

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
  });
  return NextResponse.json({ ok: true });
}
