import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isValidCategory } from "@/lib/documents";
import { deleteFilesFromStorage } from "@/lib/uploads";

export const runtime = "nodejs";

type UpdateBody = {
  title?: string;
  description?: string | null;
  category?: string;
};

// Metadata-only edit. Replacing the file itself means deleting the row and
// uploading again, which keeps `storageKey` immutable for a given record.
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
  if ("title" in body) {
    const t = body.title?.trim();
    if (!t) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    data.title = t;
  }
  if ("description" in body) data.description = body.description?.trim() || null;
  if ("category" in body) {
    const c = body.category?.trim() ?? "";
    if (!isValidCategory(c)) {
      return NextResponse.json({ error: "Unknown category" }, { status: 400 });
    }
    data.category = c;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const document = await prisma.document.update({
    where: { id },
    data,
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      filename: true,
      mimeType: true,
      size: true,
      uploadedByName: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ document });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const existing = await prisma.document.findUnique({
    where: { id },
    select: { storageKey: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Row first: deleteFilesFromStorage is best-effort, so if it silently
  // fails we'd rather leak an orphaned object than keep a row pointing at
  // a file the admin believes is gone.
  await prisma.document.delete({ where: { id } });
  await deleteFilesFromStorage([existing.storageKey]);

  return NextResponse.json({ ok: true });
}
