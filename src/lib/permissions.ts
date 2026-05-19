import type { Session } from "./auth";

// Source of truth for who can manage other admins (add / remove). All
// entries are normalized to lowercase; lookups normalize too. Everyone
// else is a "regular" admin — full access to the rest of the dashboard
// but locked out of /admin/admins.
export const SUPER_ADMIN_EMAILS = new Set<string>([
  "nayan@revisent.com",
  "pedrito@trashscouts.com",
]);

// Email domains that can self-register at /admin/signup. Trust comes from
// owning a mailbox at one of these domains — no extra verification step.
// To restrict further or add SSO later, this is the single hook to change.
export const ALLOWED_SIGNUP_DOMAINS = new Set<string>([
  "trashscouts.com",
]);

export function isSuperAdmin(session: Session | null): boolean {
  if (!session) return false;
  return SUPER_ADMIN_EMAILS.has(session.email.toLowerCase());
}

// Returns true if the email is on an allowed signup domain. Case-insensitive.
export function isAllowedSignupEmail(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const domain = email.slice(at + 1).trim().toLowerCase();
  return ALLOWED_SIGNUP_DOMAINS.has(domain);
}
