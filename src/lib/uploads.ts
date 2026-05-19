import { randomBytes } from "crypto";
import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";
import { del, put } from "@vercel/blob";

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

// Best-effort deletion of previously-saved files. Mirrors saveUploadedFile:
// Vercel Blob URLs go through `del()`, local /uploads paths get unlinked.
// Never throws — a failed cleanup leaves an orphaned file (wasted storage)
// but must not break the request that triggered it.
export async function deleteUploadedFiles(urls: string[]): Promise<void> {
  const blobUrls: string[] = [];
  const localPaths: string[] = [];

  for (const url of urls) {
    if (!url) continue;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      blobUrls.push(url);
    } else if (url.startsWith("/uploads/")) {
      // Map "/uploads/issues/abc.jpg" → "<cwd>/public/uploads/issues/abc.jpg"
      localPaths.push(path.join(process.cwd(), "public", url));
    }
  }

  if (blobUrls.length > 0 && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await del(blobUrls);
    } catch (err) {
      console.error("[uploads] blob delete failed:", err);
    }
  }

  for (const p of localPaths) {
    try {
      await rm(p, { force: true });
    } catch (err) {
      console.error("[uploads] local delete failed:", p, err);
    }
  }
}

function guessExt(mime: string) {
  if (mime === "image/png") return ".png";
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/heic") return ".heic";
  return "";
}
