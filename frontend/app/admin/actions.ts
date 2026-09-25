"use server";

import { updateTag } from "next/cache";
import { getAdminMe } from "@/lib/api/admin";
import { CATALOG_CACHE_TAG } from "@/lib/api/catalog";

/**
 * Clears the storefront's cached catalog so an admin's change shows on the next page view
 * instead of within a minute. Server actions are public endpoints, so the token is checked
 * with the API first; otherwise anyone could keep flushing the cache.
 */
export async function refreshStorefront(token: string): Promise<{ ok: boolean }> {
  try {
    await getAdminMe(token);
  } catch {
    return { ok: false };
  }

  updateTag(CATALOG_CACHE_TAG);
  return { ok: true };
}
