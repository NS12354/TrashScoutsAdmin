import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { contentDisposition } from "@/lib/documents";
import { readFileFromStorage } from "@/lib/uploads";

export const runtime = "nodejs";

// The only way to get a document's bytes. Streaming through here (rather
// than handing the browser a storage URL) is what makes the library
// login-gated — the storage key never leaves the server.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const doc = await prisma.document.findUnique({
    where: { id },
    select: { storageKey: true, filename: true, mimeType: true },
  });
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let buf: Buffer;
  try {
    buf = await readFileFromStorage(doc.storageKey);
  } catch (err) {
    console.error("[documents] read failed:", doc.storageKey, err);
    return NextResponse.json(
      { error: "That file is missing from storage" },
      { status: 404 },
    );
  }

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      // Always attachment, never inline: a stored HTML or SVG rendered
      // inline would execute on our own origin, alongside the session
      // cookie.
      "Content-Disposition": contentDisposition(doc.filename),
      "Content-Type": doc.mimeType || "application/octet-stream",
      "Content-Length": String(buf.byteLength),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
