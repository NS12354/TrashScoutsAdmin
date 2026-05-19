import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

// Saves an uploaded file and returns a public URL.
// - If BLOB_READ_WRITE_TOKEN is set (Vercel prod), routes to Vercel Blob.
// - Otherwise (local dev), writes to /public/uploads/<subdir>/<filename>.
export async function saveUploadedFile(file: File, subdir = "") {
  const ext = path.extname(file.name) || guessExt(file.type);
  const id = randomBytes(8).toString("hex");
  const filename = `${Date.now()}-${id}${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const key = `${subdir ? subdir + "/" : ""}${filename}`;
    const blob = await put(key, file, {
      access: "public",
      addRandomSuffix: false,
    });
    return blob.url;
  }

  // Production on Vercel has a read-only filesystem, so falling back to
  // /public/uploads will silently fail at writeFile. Surface a clear error
  // instead so admin sees what to fix.
  if (process.env.VERCEL) {
    throw new Error(
      "Photo storage isn't configured. Enable Vercel Blob in your project's Storage tab — it auto-injects BLOB_READ_WRITE_TOKEN.",
    );
  }

  const dir = path.join(UPLOAD_ROOT, subdir);
  await mkdir(dir, { recursive: true });
  const fullPath = path.join(dir, filename);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buf);
  return `/uploads/${subdir ? subdir + "/" : ""}${filename}`;
}

function guessExt(mime: string) {
  if (mime === "image/png") return ".png";
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/heic") return ".heic";
  return "";
}
