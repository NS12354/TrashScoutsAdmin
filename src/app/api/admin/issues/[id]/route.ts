import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const VALID_STATUSES = new Set(["OPEN", "IN_PROGRESS", "RESOLVED"]);

// Reports can only be moved between statuses (Open / In progress / Resolved).
// There is intentionally no DELETE — reports and their photos are kept in
// the database as a permanent record.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const { status } = await req.json();
  if (!VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await prisma.issue.update({ where: { id }, data: { status } });

  return NextResponse.json({ ok: true });
}
