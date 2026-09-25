"use server";

import { updateTag } from "next/cache";
import { getMyReview, ratingCacheTag } from "@/lib/api/reviews";

/**
 * Refreshes a product's cached star rating after the shopper changed their review, so the
 * stars under the title (and the search data) match the review list right away.
 * Server actions are public endpoints: the token must belong to a signed-in shopper, and it
 * can only refresh that one product's rating.
 */
export async function refreshProductRating(token: string, slug: string): Promise<{ ok: boolean }> {
  try {
    await getMyReview(token, slug);
  } catch {
    return { ok: false };
  }

  updateTag(ratingCacheTag(slug));
  return { ok: true };
}
