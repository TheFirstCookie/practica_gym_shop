import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { parseAuthLanding, type AuthLanding } from "../auth-landing";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// The publishable (or legacy anon) key is meant for browsers: Row Level Security decides
// what it can read, and it can't write anything in this project.
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const clients = new Map<string, SupabaseClient>();

function getClient(storageKey: string, detectSessionInUrl: boolean): SupabaseClient | null {
  if (!url || !publishableKey) {
    return null;
  }

  let client = clients.get(storageKey);
  if (!client) {
    client = createClient(url, publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey, detectSessionInUrl }
    });
    clients.set(storageKey, client);
  }
  return client;
}

/**
 * Browser Supabase client for the admin area (sign-in and photo uploads). Returns null
 * when the env vars are missing, so the admin can explain what to set. It never reads
 * sessions from email links: those are the shopper client's.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  return getClient("forgefit-admin-auth", false);
}

let landing: AuthLanding | null | undefined;

/**
 * Browser Supabase client for shopper accounts. A separate session from the admin's, so
 * signing in to the shop and to /admin don't affect each other. Null when not configured.
 * It picks up sessions from email links (sign-up confirmation, sign-in link, password reset).
 */
export function getCustomerAuthClient(): SupabaseClient | null {
  // Read the email-link details before the client consumes and clears them.
  if (landing === undefined && typeof window !== "undefined") {
    landing = parseAuthLanding(window.location.href);
  }
  return getClient("forgefit-customer-auth", true);
}

/** What the email link that opened this page was for; null for an ordinary visit. */
export function getAuthLanding(): AuthLanding | null {
  return landing ?? null;
}
