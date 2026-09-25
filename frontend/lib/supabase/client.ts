import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// The publishable (or legacy anon) key is meant for browsers: Row Level Security decides
// what it can read, and it can't write anything in this project.
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const clients = new Map<string, SupabaseClient>();

function getClient(storageKey: string): SupabaseClient | null {
  if (!url || !publishableKey) {
    return null;
  }

  let client = clients.get(storageKey);
  if (!client) {
    client = createClient(url, publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey }
    });
    clients.set(storageKey, client);
  }
  return client;
}

/**
 * Browser Supabase client for the admin area (sign-in and photo uploads). Returns null
 * when the env vars are missing, so the admin can explain what to set.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  return getClient("forgefit-admin-auth");
}

/**
 * Browser Supabase client for shopper accounts. A separate session from the admin's, so
 * signing in to the shop and to /admin don't affect each other. Null when not configured.
 */
export function getCustomerAuthClient(): SupabaseClient | null {
  return getClient("forgefit-customer-auth");
}
