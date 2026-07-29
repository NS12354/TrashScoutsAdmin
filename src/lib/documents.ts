// Team document library (SOPs, forms, training material). Pure helpers
// shared by the /admin/documents UI and the /api/admin/documents routes —
// no DB or storage access here, so this file is safe to import from
// client components.

export const DOCUMENT_CATEGORIES: Array<{ value: string; label: string }> = [
  { value: "FIELD_OPS", label: "Field Operations" },
  { value: "SAFETY", label: "Safety & Compliance" },
  { value: "ONBOARDING", label: "Onboarding & Training" },
  { value: "HR", label: "HR & Payroll" },
  { value: "SALES", label: "Sales & Client-Facing" },
  { value: "OTHER", label: "Other" },
];

const CATEGORY_VALUES = new Set(DOCUMENT_CATEGORIES.map((c) => c.value));

export const DEFAULT_CATEGORY = "OTHER";

// 25 MB. Generous for a scanned SOP or a slide deck, small enough that a
// stray video upload gets rejected before it ties up a serverless request.
export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

// Extension allowlist. Uploads are matched on extension rather than the
// browser-reported MIME type because the latter is inconsistent across
// OSes (a .docx arrives as application/octet-stream often enough to be a
// support problem). Executables and scripts are absent by design — this
// library is served back to staff browsers, so nothing runnable belongs
// in it.
const ALLOWED_EXTENSIONS: Record<string, string> = {
  ".pdf": "PDF",
  ".doc": "Word",
  ".docx": "Word",
  ".xls": "Excel",
  ".xlsx": "Excel",
  ".csv": "CSV",
  ".ppt": "Slides",
  ".pptx": "Slides",
  ".txt": "Text",
  ".md": "Text",
  ".rtf": "Text",
  ".png": "Image",
  ".jpg": "Image",
  ".jpeg": "Image",
  ".webp": "Image",
  ".heic": "Image",
  ".gif": "Image",
  ".zip": "Archive",
};

export const ACCEPT_ATTRIBUTE = Object.keys(ALLOWED_EXTENSIONS).join(",");

export function isValidCategory(value: string): boolean {
  return CATEGORY_VALUES.has(value);
}

export function categoryLabel(value: string): string {
  return DOCUMENT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

// Lowercased extension including the leading dot, or "" when the name has
// none. Only the final segment counts, so "sop.v2.pdf" → ".pdf".
export function fileExtension(filename: string): string {
  const base = filename.slice(filename.lastIndexOf("/") + 1);
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return "";
  return base.slice(dot).toLowerCase();
}

export function isAllowedDocument(filename: string): boolean {
  return fileExtension(filename) in ALLOWED_EXTENSIONS;
}

// Short badge text for the file list ("PDF", "Word", …). Unknown types
// fall back to the bare extension so nothing renders blank.
export function fileKindLabel(filename: string): string {
  const ext = fileExtension(filename);
  if (!ext) return "File";
  return ALLOWED_EXTENSIONS[ext] ?? ext.slice(1).toUpperCase();
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

// Strips directory components and anything that would let a filename break
// out of the storage prefix or smuggle a newline into a response header.
// Always returns something non-empty so the download route can rely on it.
export function sanitizeFilename(filename: string): string {
  const base = filename.split(/[\\/]/).pop() ?? "";
  const cleaned = base
    // Control characters (header smuggling) and double quotes (they would
    // terminate the quoted filename in Content-Disposition).
    .replace(/[\x00-\x1f\x7f"]/g, "")
    .replace(/^\.+/, "")
    .trim();
  return cleaned || "download";
}

// RFC 6266 Content-Disposition value: a plain-ASCII `filename` for old
// clients plus a percent-encoded `filename*` carrying the real name, so a
// document called "Résumé template.docx" downloads with its accents intact.
export function contentDisposition(filename: string): string {
  const safe = sanitizeFilename(filename);
  const ascii = safe.replace(/[^\x20-\x7e]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
}

// Groups documents into the DOCUMENT_CATEGORIES order, dropping empty
// categories. Anything carrying an unrecognized category value is folded
// into "Other" rather than vanishing from the page.
export function groupByCategory<T extends { category: string }>(
  docs: T[],
): Array<{ value: string; label: string; docs: T[] }> {
  return DOCUMENT_CATEGORIES.map((cat) => ({
    value: cat.value,
    label: cat.label,
    docs: docs.filter((d) =>
      cat.value === DEFAULT_CATEGORY
        ? d.category === cat.value || !isValidCategory(d.category)
        : d.category === cat.value,
    ),
  })).filter((group) => group.docs.length > 0);
}
