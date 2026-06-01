import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type UpdateBody = {
  name?: string;
  title?: string | null;
  photoUrl?: string | null;
  email?: string | null;
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
  if ("email" in body) {
    const e = body.email?.trim().toLowerCase() || "";
    if (!e) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!EMAIL_RE.test(e)) {
      return NextResponse.json({ error: "Email isn't valid" }, { status: 400 });
    }
    data.email = e;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const porter = await prisma.porter.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      title: true,
      photoUrl: true,
      email: true,
    },
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
  // A porter may be the day OR night assignment (or both) on any number of
  // properties. Null out every reference to them across both slots before
  // deleting so the FK constraints don't fail.
  await prisma.$transaction([
    prisma.property.updateMany({
      where: { porterId: id },
      data: { porterId: null },
    }),
    prisma.property.updateMany({
      where: { nightPorterId: id },
      data: { nightPorterId: null },
    }),
    prisma.porter.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
