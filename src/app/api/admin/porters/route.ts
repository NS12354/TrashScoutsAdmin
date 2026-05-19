import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const porters = await prisma.porter.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, title: true, photoUrl: true },
  });
  return NextResponse.json({ porters });
}

export async function POST(req: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { name, title, photoUrl } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const porter = await prisma.porter.create({
    data: {
      name: name.trim(),
      title: title?.trim() || null,
      photoUrl: photoUrl || null,
    },
  });
  return NextResponse.json({
    porter: {
      id: porter.id,
      name: porter.name,
      title: porter.title,
      photoUrl: porter.photoUrl,
    },
  });
}
