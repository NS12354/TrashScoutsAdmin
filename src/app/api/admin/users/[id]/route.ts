import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function DELETE(
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

  // Guard 1: can't delete yourself (would immediately lock you out, and the
  // session cookie would point at a missing user on the next request).
  if (id === session.userId) {
    return NextResponse.json(
      { error: "You can't delete your own admin account" },
      { status: 400 },
    );
  }

  // Guard 2: never let the last admin be deleted — no one would be able to
  // log in afterwards. Re-bootstrapping requires CLI access.
  const total = await prisma.user.count();
  if (total <= 1) {
    return NextResponse.json(
      { error: "Can't delete the only remaining admin" },
      { status: 400 },
    );
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
