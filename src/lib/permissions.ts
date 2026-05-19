import type { Session } from "./auth";

// Source of truth for who can manage other admins (add / remove / resend
// invite). All entries are normalized to lowercase; lookups normalize too.
// Everyone else is a "regular" admin — full access to the rest of the
// dashboard but locked out of /admin/admins.
export const SUPER_ADMIN_EMAILS = new Set<string>([
  "nayan@revisent.com",
  "pedrito@trashscouts.com",
]);

export function isSuperAdmin(session: Session | null): boolean {
  if (!session) return false;
  return SUPER_ADMIN_EMAILS.has(session.email.toLowerCase());
}
