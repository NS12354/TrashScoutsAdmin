// Client-side image downscaler used before any photo upload. Vercel's
// serverless body limit is 4.5 MB per request — modern phone photos
// (3–10 MB) routinely blow past that, so we resize on the client before
// posting. Falls back to the original File on any failure so the upload
// still happens.

export type ResizeOptions = {
  maxEdge?: number; // longest edge in px after resize
  quality?: number; // JPEG quality 0..1
};

const DEFAULT_MAX_EDGE = 2000;
const DEFAULT_QUALITY = 0.85;
// Files already small enough to fit comfortably in a serverless body are
// passed through untouched — re-encoding a 200 KB JPEG can actually make
// it bigger.
const SKIP_RESIZE_BELOW_BYTES = 800 * 1024;

export async function resizeImageFile(
  file: File,
  options: ResizeOptions = {},
): Promise<File> {
  if (typeof window === "undefined") return file;
  if (!file.type.startsWith("image/")) return file;
  if (file.size < SKIP_RESIZE_BELOW_BYTES) return file;

  const maxEdge = options.maxEdge ?? DEFAULT_MAX_EDGE;
  const quality = options.quality ?? DEFAULT_QUALITY;

  try {
    const bitmap = await createImageBitmap(file);
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = longest > maxEdge ? maxEdge / longest : 1;
    const targetW = Math.max(1, Math.round(bitmap.width * scale));
    const targetH = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) return file;

    // Re-encoded as JPEG, so swap the extension. If the resized file
    // somehow ended up larger than the original (very small images), keep
    // the original — we never want to make uploads worse.
    if (blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
