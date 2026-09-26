import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { parseAuthLanding, type AuthLanding } from "../auth-landing";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// The publishable (or legacy anon) key is meant for browsers: Row Level Security decides
// what it can read, and it can't write anything in this project.
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const STORAGE_KEY = "forgefit-auth";
/** Where earlier versions kept separate shop and admin sessions; cleared on first load. */
const OLD_STORAGE_KEYS = ["forgefit-admin-auth", "forgefit-customer-auth"];

let client: SupabaseClient | null | undefined;
let landing: AuthLanding | null = null;

/**
 * The one browser Supabase client, shared by the shop and /admin: signing in anywhere signs
 * you in everywhere, and admins are ordinary accounts with the admin role (the API checks
 * it). It also picks up sessions from email links (sign-up confirmation, sign-in link,
 * password reset). Null when the env vars are missing, so pages can explain what to set.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  if (!url || !publishableKey) return (client = null);

  if (typeof window !== "undefined") {
    // Read the email-link details before the client consumes and clears them.
    landing = parseAuthLanding(window.location.href);
    try {
      OLD_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
    } catch {
      // Storage blocked (private mode): nothing was saved there anyway.
    }
  }

  client = createClient(url, publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: STORAGE_KEY, detectSessionInUrl: true }
  });
  return client;
}

/** What the email link that opened this page was for; null for an ordinary visit. */
export function getAuthLanding(): AuthLanding | null {
  return landing;
}
