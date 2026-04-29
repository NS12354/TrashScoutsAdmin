// Single source of truth for brand strings. Swap these and everything updates.
export const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || "Trash Scouts";
export const BRAND_LEGAL_NAME =
  process.env.NEXT_PUBLIC_BRAND_LEGAL_NAME || BRAND_NAME;
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@trashscouts.example";

// Public site URL is needed for any link we put inside an email.
// Falls back to localhost in dev so the app boots without it.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
