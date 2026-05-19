import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { invalidateActiveTokens, issueToken } from "@/lib/passwordTokens";
import { SITE_URL } from "@/lib/brand";

export const runtime = "nodejs";

// Regenerates the one-time setup link for a pending admin. Any previous
// invite link for this user becomes invalid. The new link is returned to
// the calling super-admin so they can share it manually — no server-side
// email is sent.
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
    return NextResponse.json(
      { error: "This admin has already activated. They can sign in normally." },
      { status: 400 },
    );
  }

  await invalidateActiveTokens(user.id, "invite");
  const { raw } = await issueToken(user.id, "invite");
  const link = `${SITE_URL}/admin/set-password?token=${raw}`;

  return NextResponse.json({ ok: true, link });
}
