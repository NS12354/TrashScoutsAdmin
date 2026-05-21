import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-side Supabase client for Storage. Uses the service-role key, so it
// must NEVER be imported into client components — keep it server-only.
// Photo uploads/deletes go through this; everything else (users, properties)
// stays on Prisma/Neon.

export const SUPABASE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET || "uploads";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase storage isn't configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  if (!cached) {
    cached = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
  }
  return cached;
}

// Given a Supabase public URL, extract the object path inside the bucket so
// it can be passed to storage.remove(). Public URLs look like:
//   https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
export function supabasePathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${SUPABASE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx < 0) return null;
  return url.slice(idx + marker.length);
}
