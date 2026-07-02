// Shared helpers for validating + normalizing email addresses at API
// boundaries and in the Send Proposal UI. Kept in one place so admin
// input and server-side validation apply the same rules — otherwise
// a user could type a value the UI accepts but the API rejects (or
// vice versa).

export const MAX_EMAIL_LEN = 200;
export const MAX_LIST_LEN = 10;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// True if `s` looks like a syntactically valid email address.
// Deliberately permissive — matches SendGrid's own laxness. Anything
// with a local-part, @, domain-part, and a TLD passes.
export function isEmail(s: string): boolean {
  return typeof s === "string" && EMAIL_RE.test(s.trim());
}

// Split a free-form string into email tokens. Accepts comma,
// semicolon, or whitespace as separators — matches what humans
// actually type into email fields. Empty strings and whitespace
// tokens filter out.
export function parseEmailString(input: string): string[] {
  if (!input) return [];
  return input
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Clean + validate a list of emails from an API request body. Drops
// anything that isn't a well-formed email, trims, dedupes case-
// insensitively, and caps at MAX_LIST_LEN so a malicious body can't
// blow up the outbound send.
export function cleanEmailList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of v) {
    if (typeof raw !== "string") continue;
    const e = raw.trim();
    if (!e || e.length > MAX_EMAIL_LEN || !isEmail(e)) continue;
    const key = e.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
    if (out.length >= MAX_LIST_LEN) break;
  }
  return out;
}

// Filter `list` down to entries that are NOT the same address as
// `primary` (case-insensitive). Used to dedupe extras + POCs against
// the primary recipient so the same person doesn't get two copies.
export function excludeAddress(
  list: string[],
  primary: string | null | undefined,
): string[] {
  if (!primary) return list;
  const lower = primary.trim().toLowerCase();
  return list.filter((e) => e.toLowerCase() !== lower);
}
