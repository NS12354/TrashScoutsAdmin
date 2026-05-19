import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type UpdateBody = {
  name?: string;
  title?: string | null;
  photoUrl?: string | null;
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await req.json()) as UpdateBody;

  const data: Record<string, unknown> = {};
  if ("name" in body) {
    const n = body.name?.trim();
    if (!n) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    data.name = n;
  }
  if ("title" in body) data.title = body.title?.trim() || null;
  if ("photoUrl" in body) data.photoUrl = body.photoUrl || null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const porter = await prisma.porter.update({
    where: { id },
    data,
    select: { id: true, name: true, title: true, photoUrl: true },
  });
  return NextResponse.json({ porter });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  // Property.porter has no onDelete cascade in the schema, so deleting a
  // porter that's still assigned to properties would fail on the FK. Null
  // out the assignment first in a single transaction.
  await prisma.$transaction([
    prisma.property.updateMany({
      where: { porterId: id },
      data: { porterId: null },
    }),
    prisma.porter.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
