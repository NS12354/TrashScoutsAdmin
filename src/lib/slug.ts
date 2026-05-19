// Generate a URL-safe slug from an address string.
// "1248 Maple Ave, Brooklyn NY 11216" → "1248-maple-ave-brooklyn-ny"
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .slice(0, 6)
    .join("-")
    || "property";
}
