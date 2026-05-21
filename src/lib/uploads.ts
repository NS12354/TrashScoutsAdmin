import { randomBytes } from "crypto";
import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";
import {
  SUPABASE_BUCKET,
  getSupabase,
  isSupabaseConfigured,
  supabasePathFromUrl,
} from "./supabase";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

// Saves an uploaded file and returns a public URL.
// - If Supabase is configured, uploads to the Supabase Storage bucket.
// - Otherwise (local dev), writes to /public/uploads/<subdir>/<filename>.
export async function saveUploadedFile(file: File, subdir = "") {
  const ext = path.extname(file.name) || guessExt(file.type);
  const id = randomBytes(8).toString("hex");
  const filename = `${Date.now()}-${id}${ext}`;
  const key = `${subdir ? subdir + "/" : ""}${filename}`;

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const buf = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(key, buf, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }
    const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(key);
    return data.publicUrl;
  }

  // Production (Vercel) has a read-only filesystem, so the /public/uploads
  // fallback can't work there. Surface a clear error instead of failing
  // cryptically at writeFile.
  if (process.env.VERCEL) {
    throw new Error(
      "Photo storage isn't configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (and create the storage bucket).",
    );
  }

  const dir = path.join(UPLOAD_ROOT, subdir);
  await mkdir(dir, { recursive: true });
  const fullPath = path.join(dir, filename);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buf);
  return `/uploads/${key}`;
}

// Best-effort deletion of previously-saved files. Mirrors saveUploadedFile:
// Supabase URLs are removed from the bucket, local /uploads paths are
// unlinked. Never throws — a failed cleanup leaves an orphaned file (wasted
// storage) but must not break the request that triggered it.
export async function deleteUploadedFiles(urls: string[]): Promise<void> {
  const supabaseKeys: string[] = [];
  const localPaths: string[] = [];

  for (const url of urls) {
    if (!url) continue;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const key = supabasePathFromUrl(url);
      if (key) supabaseKeys.push(key);
      // Non-Supabase remote URLs (e.g. legacy Vercel Blob) are left as-is.
    } else if (url.startsWith("/uploads/")) {
      localPaths.push(path.join(process.cwd(), "public", url));
    }
  }

  if (supabaseKeys.length > 0 && isSupabaseConfigured()) {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .remove(supabaseKeys);
      if (error) console.error("[uploads] supabase delete failed:", error.message);
    } catch (err) {
      console.error("[uploads] supabase delete threw:", err);
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
