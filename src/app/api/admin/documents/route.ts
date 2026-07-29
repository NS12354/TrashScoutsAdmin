import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  DEFAULT_CATEGORY,
  MAX_DOCUMENT_BYTES,
  formatFileSize,
  isAllowedDocument,
  isValidCategory,
  sanitizeFilename,
} from "@/lib/documents";
import { saveFileToStorage, storageObjectExists } from "@/lib/uploads";

export const runtime = "nodejs";

const SELECT = {
  id: true,
  title: true,
  description: true,
  category: true,
  filename: true,
  mimeType: true,
  size: true,
  uploadedByName: true,
  createdAt: true,
} as const;

export async function GET() {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const documents = await prisma.document.findMany({
    orderBy: [{ category: "asc" }, { title: "asc" }],
    select: SELECT,
  });
  return NextResponse.json({ documents });
}


// Creates the document record. Two shapes, because there are two ways the
// bytes can get to storage:
//
//   application/json  — the browser already PUT the file straight to
//                       storage via /upload-url; we just record it. This is
//                       the production path (Vercel caps function request
//                       bodies at 4.5 MB, far below our 25 MB limit).
//   multipart/form-data — no object storage configured (local dev), so the
//                       file rides along and the server writes it.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isJson = (req.headers.get("content-type") ?? "").includes(
    "application/json",
  );

  try {
    const fields = isJson
      ? await fieldsFromDirectUpload(req)
      : await fieldsFromMultipart(req);
    if ("error" in fields) {
      return NextResponse.json({ error: fields.error }, { status: 400 });
    }

    const document = await prisma.document.create({
      data: { ...fields, uploadedByName: session.name },
      select: SELECT,
    });
    return NextResponse.json({ document });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("[documents] create failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type NewDocument = {
  title: string;
  description: string | null;
  category: string;
  storageKey: string;
  filename: string;
  mimeType: string;
  size: number;
};

// Title is optional throughout — an admin who just picks a file gets the
// filename as the display name rather than a validation error.
function metadata(
  raw: { title?: string; description?: string; category?: string },
  filename: string,
) {
  return {
    title: (raw.title ?? "").trim() || filename,
    description: (raw.description ?? "").trim() || null,
    category: isValidCategory((raw.category ?? "").trim())
      ? (raw.category ?? "").trim()
      : DEFAULT_CATEGORY,
  };
}

async function fieldsFromDirectUpload(
  req: NextRequest,
): Promise<NewDocument | { error: string }> {
  const body = (await req.json().catch(() => ({}))) as {
    storageKey?: string;
    filename?: string;
    mimeType?: string;
    size?: number;
    title?: string;
    description?: string;
    category?: string;
  };

  const storageKey = (body.storageKey ?? "").trim();
  const filename = sanitizeFilename(body.filename ?? "");
  const size = Number(body.size);

  // The key came back from our own /upload-url, but it round-trips through
  // the browser, so re-check it lands in the documents prefix rather than
  // trusting the client to point anywhere in the bucket.
  if (!storageKey.startsWith("documents/") || storageKey.includes("..")) {
    return { error: "Invalid upload reference" };
  }
  if (!body.filename || !isAllowedDocument(filename)) {
    return { error: "That file type isn't supported" };
  }
  if (!Number.isFinite(size) || size <= 0) {
    return { error: "Choose a file to upload" };
  }
  if (size > MAX_DOCUMENT_BYTES) {
    return { error: `File must be under ${formatFileSize(MAX_DOCUMENT_BYTES)}` };
  }
  if (!(await storageObjectExists(storageKey))) {
    return { error: "That upload didn't finish — try again" };
  }

  return {
    ...metadata(body, filename),
    storageKey,
    filename,
    mimeType: body.mimeType || "application/octet-stream",
    size,
  };
}

async function fieldsFromMultipart(
  req: NextRequest,
): Promise<NewDocument | { error: string }> {
  // Next buffers proxied bodies (10 MB by default, raised in next.config.ts)
  // and hands the route a truncated body rather than an error when the cap
  // is hit — which surfaces here as a FormData parse failure.
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return {
      error: `File is too large to upload here — keep it under ${formatFileSize(MAX_DOCUMENT_BYTES)}`,
    };
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload" };
  }
  if (!isAllowedDocument(file.name)) {
    return { error: "That file type isn't supported" };
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return { error: `File must be under ${formatFileSize(MAX_DOCUMENT_BYTES)}` };
  }

  const filename = sanitizeFilename(file.name);
  const storageKey = await saveFileToStorage(file, "documents");

  return {
    ...metadata(
      {
        title: (form.get("title") as string) ?? "",
        description: (form.get("description") as string) ?? "",
        category: (form.get("category") as string) ?? "",
      },
      filename,
    ),
    storageKey,
    filename,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
  };
}
