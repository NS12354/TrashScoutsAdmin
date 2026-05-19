import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { invalidateActiveTokens, issueToken } from "@/lib/passwordTokens";
import { sendPasswordEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/brand";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }
  if (user.passwordSetAt) {
    // Already activated. Resending an "invite" would be confusing — point
    // the inviter at the forgot-password flow if a reset is what they want.
    return NextResponse.json(
      { error: "This admin has already activated. Use Forgot password instead." },
      { status: 400 },
    );
  }

  // Any old invite link should stop working once a fresh one is in flight.
  await invalidateActiveTokens(user.id, "invite");
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
    ok: true,
    sent: sendResult.ok,
    skipped: sendResult.skipped ?? false,
    link,
  });
}
