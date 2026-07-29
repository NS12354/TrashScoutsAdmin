import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  MAX_DOCUMENT_BYTES,
  formatFileSize,
  isAllowedDocument,
  sanitizeFilename,
} from "@/lib/documents";
import { createDirectUpload } from "@/lib/uploads";

export const runtime = "nodejs";

// Step 1 of the upload. Validates what the browser is about to send, then
// hands back a one-shot URL it can PUT the bytes to directly. Keeping the
// file out of this request is the whole point — see createDirectUpload.
//
// Responds { mode: "server" } when there's no object storage configured
// (local dev), telling the client to post the file to /api/admin/documents
// as multipart instead.
export async function POST(req: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    filename?: string;
    size?: number;
  };
  const filename = sanitizeFilename(body.filename ?? "");
  const size = Number(body.size);

  if (!body.filename || !isAllowedDocument(filename)) {
    return NextResponse.json(
      { error: "That file type isn't supported" },
      { status: 400 },
    );
  }
  if (!Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: "Choose a file to upload" }, { status: 400 });
  }
  if (size > MAX_DOCUMENT_BYTES) {
    return NextResponse.json(
      { error: `File must be under ${formatFileSize(MAX_DOCUMENT_BYTES)}` },
      { status: 400 },
    );
  }

  try {
    const upload = await createDirectUpload(filename, "documents");
    if (!upload) {
      return NextResponse.json({ mode: "server" });
    }
    return NextResponse.json({
      mode: "direct",
      key: upload.key,
      signedUrl: upload.signedUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start upload";
    console.error("[documents] signed upload URL failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
