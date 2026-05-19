import { NextRequest, NextResponse } from "next/server";
import { createSession, getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const MAX_NAME_LEN = 100;

// Updates the signed-in admin's profile. For now: name only. Email isn't
// editable here — changing your own login email mid-session is gnarly and
// nobody's asked for it. Re-issues the session cookie when name changes so
// the header in the layout updates without a logout.
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json().catch(() => ({}));
  const trimmed = String(name ?? "").trim();

  if (!trimmed) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (trimmed.length > MAX_NAME_LEN) {
    return NextResponse.json(
      { error: `Name must be ${MAX_NAME_LEN} characters or fewer` },
      { status: 400 },
    );
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: { name: trimmed },
    select: { id: true, email: true, name: true },
  });

  // Refresh the JWT so the header (which reads name from the session) shows
  // the new value immediately.
  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
  });

  return NextResponse.json({ user });
}
