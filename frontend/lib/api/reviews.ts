import { CATALOG_CACHE_TAG } from "./catalog";
import { apiRequest } from "./client";
import type { DataEnvelope, RatingSummary, Review, ReviewList } from "./types";

const path = (slug: string) => `/products/${encodeURIComponent(slug)}/reviews`;

/** Cache tag for one product's rating summary (refreshed when its reviews change). */
export const ratingCacheTag = (slug: string) => `rating:${slug}`;

export type ReviewInput = {
  rating: number;
  title: string;
  body: string;
};

/** A page of reviews, newest first, with the rating summary. Always fresh (not cached). */
export function listReviews(slug: string, page = 1, signal?: AbortSignal): Promise<ReviewList> {
  return apiRequest<ReviewList>(path(slug), { cache: "no-store", signal, query: { page, pageSize: 10 } });
}

/**
 * The rating summary for server-rendered pages (stars under the title, search results
 * data). Cached like the catalog, and refreshed when a review changes (see
 * app/components/reviews/actions.ts). A null result (API down, product gone) just hides it.
 */
export async function getRatingSummary(slug: string): Promise<RatingSummary | null> {
  try {
    const { meta } = await apiRequest<ReviewList>(path(slug), {
      next: { revalidate: 60, tags: [CATALOG_CACHE_TAG, ratingCacheTag(slug)] },
      query: { pageSize: 1 }
    });
    return meta.summary;
  } catch {
    return null;
  }
}

export async function getMyReview(token: string, slug: string): Promise<Review | null> {
  const { data } = await apiRequest<DataEnvelope<Review | null>>(`${path(slug)}/mine`, {
    cache: "no-store",
    token
  });
  return data;
}

/** Creates the shopper's review of this product, or replaces the one they wrote before. */
export async function saveMyReview(token: string, slug: string, input: ReviewInput): Promise<Review> {
  const { data } = await apiRequest<DataEnvelope<Review>>(`${path(slug)}/mine`, {
    method: "PUT",
    token,
    body: input
  });
  return data;
}

export function deleteMyReview(token: string, slug: string): Promise<void> {
  return apiRequest<void>(`${path(slug)}/mine`, { method: "DELETE", token });
}
