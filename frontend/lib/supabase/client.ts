import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// The publishable (or legacy anon) key is meant for browsers: Row Level Security decides
// what it can read, and it can't write anything in this project.
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null = null;

/**
 * Browser Supabase client, used only by the admin area for sign-in and photo uploads.
 * Returns null when the env vars are missing, so the admin can explain what to set.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!url || !publishableKey) {
    return null;
  }

  client ??= createClient(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Keeps the admin session separate from anything else on the same domain.
      storageKey: "forgefit-admin-auth"
    }
  });

  return client;
}
