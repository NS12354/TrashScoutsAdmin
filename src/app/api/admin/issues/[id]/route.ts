import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteUploadedFiles } from "@/lib/uploads";

export const runtime = "nodejs";

const VALID_STATUSES = new Set(["OPEN", "IN_PROGRESS", "RESOLVED"]);

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

  // When a report is resolved we no longer need its photos — purge them to
  // keep Blob storage flat. Delete the rows first (so the admin UI stops
  // showing them immediately), then best-effort clean up the blob files.
  if (status === "RESOLVED") {
    const photos = await prisma.issuePhoto.findMany({
      where: { issueId: id },
      select: { url: true },
    });
    if (photos.length > 0) {
      await prisma.issuePhoto.deleteMany({ where: { issueId: id } });
      await deleteUploadedFiles(photos.map((p) => p.url));
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  // Grab photo URLs before the cascade removes the IssuePhoto rows, so we
  // can clean up the underlying blob files (the cascade only deletes DB rows).
  const photos = await prisma.issuePhoto.findMany({
    where: { issueId: id },
    select: { url: true },
  });

  await prisma.issue.delete({ where: { id } });

  if (photos.length > 0) {
    await deleteUploadedFiles(photos.map((p) => p.url));
  }

  return NextResponse.json({ ok: true });
}
