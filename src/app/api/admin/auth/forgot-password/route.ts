import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { issueToken } from "@/lib/passwordTokens";
import { sendPasswordEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/brand";

export const runtime = "nodejs";

// Public endpoint. Always responds 200 with a generic message to avoid
// leaking which emails are valid admin accounts. The email is only sent if
// the address belongs to an existing admin who has already completed setup.
export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));
  const normalized = String(email ?? "").trim().toLowerCase();

  const GENERIC = NextResponse.json({
    ok: true,
    message:
      "If that email belongs to an admin account, a reset link is on the way.",
  });

  if (!normalized) return GENERIC;

  const user = await prisma.user.findUnique({ where: { email: normalized } });
  // Skip silently if the user doesn't exist or hasn't completed initial setup
  // (in which case they should use their existing invite link, not reset).
  if (!user || !user.passwordSetAt) return GENERIC;

  const { raw, expiresAt } = await issueToken(user.id, "reset");
  const link = `${SITE_URL}/admin/set-password?token=${raw}`;

  // Fire-and-forget — failures are logged inside sendEmail; we never tell
  // the caller whether send succeeded, again to prevent enumeration.
  await sendPasswordEmail({
    to: user.email,
    name: user.name,
    link,
    purpose: "reset",
    expiresAt,
  });

  return GENERIC;
}
