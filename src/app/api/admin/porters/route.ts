import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const porters = await prisma.porter.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      title: true,
      photoUrl: true,
      email: true,
    },
  });
  return NextResponse.json({ porters });
}

export async function POST(req: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { name, title, photoUrl, email } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const trimmedEmail = email?.trim().toLowerCase() || "";
  if (!trimmedEmail) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  if (!EMAIL_RE.test(trimmedEmail)) {
    return NextResponse.json({ error: "Email isn't valid" }, { status: 400 });
  }
  const porter = await prisma.porter.create({
    data: {
      name: name.trim(),
      title: title?.trim() || null,
      photoUrl: photoUrl || null,
      email: trimmedEmail,
    },
  });
  return NextResponse.json({
    porter: {
      id: porter.id,
      name: porter.name,
      title: porter.title,
      photoUrl: porter.photoUrl,
      email: porter.email,
    },
  });
}
