"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MessageSquarePlus, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { deleteMyReview, getMyReview, listReviews, saveMyReview, type ReviewInput } from "@/lib/api/reviews";
import type { Pagination, RatingSummary, Review } from "@/lib/api/types";
import { signInHref, useCustomerSession } from "../customer-session";
import { refreshProductRating } from "./actions";
import { ReviewForm } from "./review-form";
import { ReviewItem } from "./review-item";
import { Stars } from "./stars";

type ProductReviewsProps = {
  slug: string;
  /** From the server render, so the summary shows before the list loads. */
  initialSummary: RatingSummary | null;
};

type Listing = { reviews: Review[]; pagination: Pagination; summary: RatingSummary };

// The shopper's own review: not loaded yet, none, or theirs.
type Mine = { userId: string; review: Review | null };

const EMPTY_SUMMARY: RatingSummary = { count: 0, average: null, distribution: [0, 0, 0, 0, 0] };

/** Ratings, the review list and (for signed-in shoppers) writing their own review. */
export function ProductReviews({ slug, initialSummary }: ProductReviewsProps) {
  const { state: session, customer, getToken } = useCustomerSession();
  const [listing, setListing] = useState<Listing | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);
  const [mine, setMine] = useState<Mine | null>(null);
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // First page (again after a save, so the new review and averages show).
  useEffect(() => {
    const controller = new AbortController();
    listReviews(slug, 1, controller.signal)
      .then(({ data, meta }) => {
        setListError(null);
        setListing({ reviews: data, pagination: meta.pagination, summary: meta.summary });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setListError(error instanceof Error ? error.message : "Couldn't load reviews");
      });
    return () => controller.abort();
  }, [slug, reloadCount]);

  const userId = customer?.id ?? null;
  useEffect(() => {
    if (!userId) return;
    let current = true;
    getToken()
      .then((token) => (token ? getMyReview(token, slug) : null))
      .then((review) => current && setMine({ userId, review }))
      // Without it the form just starts empty; saving still replaces any older review.
      .catch(() => current && setMine({ userId, review: null }));
    return () => {
      current = false;
    };
  }, [userId, slug, getToken]);

  const ownReview = mine && mine.userId === userId ? mine.review : null;
  const mineLoaded = mine !== null && mine.userId === userId;

  async function loadMore() {
    if (!listing) return;
    setLoadingMore(true);
    try {
      const { data, meta } = await listReviews(slug, listing.pagination.page + 1);
      setListing((current) => {
        if (!current) return current;
        const seen = new Set(current.reviews.map((review) => review.id));
        return {
          reviews: [...current.reviews, ...data.filter((review) => !seen.has(review.id))],
          pagination: meta.pagination,
          summary: meta.summary
        };
      });
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Couldn't load more reviews");
    } finally {
      setLoadingMore(false);
    }
  }

  const refresh = useCallback(() => setReloadCount((count) => count + 1), []);

  async function save(input: ReviewInput) {
    const token = await getToken();
    if (!token || !userId) return "Your session ended. Sign in again.";
    try {
      const review = await saveMyReview(token, slug, input);
      setMine({ userId, review });
      setEditing(false);
      refresh();
      void refreshProductRating(token, slug);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Couldn't save your review";
    }
  }

  async function remove() {
    const token = await getToken();
    if (!token || !userId) return;
    setRemoving(true);
    setActionError(null);
    try {
      await deleteMyReview(token, slug);
      setMine({ userId, review: null });
      setEditing(false);
      refresh();
      void refreshProductRating(token, slug);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Couldn't delete your review");
    } finally {
      setRemoving(false);
    }
  }

  const summary = listing?.summary ?? initialSummary ?? EMPTY_SUMMARY;
  // The author's review has its own card, so it isn't repeated in the list.
  const others = listing?.reviews.filter((review) => review.id !== ownReview?.id) ?? [];
  const hasMore = listing ? listing.pagination.page < listing.pagination.totalPages : false;

  return (
    <section className="catalog-section product-reviews" id="reviews" aria-labelledby="reviews-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Reviews</p>
          <h2 id="reviews-heading">What lifters say</h2>
        </div>
      </div>

      <div className="reviews-layout">
        <RatingOverview summary={summary} />

        <div className="reviews-main">
          <div className="review-compose">
            {session.status === "signed-out" && (
              <p className="review-prompt">
                <MessageSquarePlus size={18} aria-hidden="true" />
                <span>
                  Own this? <Link href={signInHref(`/product/${slug}#reviews`)}>Sign in to write a review</Link>.
                </span>
              </p>
            )}

            {session.status === "signed-in" && mineLoaded && (
              <>
                {ownReview && !editing ? (
                  <div className="review-own">
                    <p className="eyebrow">Your review</p>
                    <ReviewItem
                      review={ownReview}
                      actions={
                        <>
                          <button type="button" className="review-action" onClick={() => setEditing(true)}>
                            <Pencil size={14} aria-hidden="true" />
                            <span>Edit</span>
                          </button>
                          <button type="button" className="review-action" onClick={remove} disabled={removing}>
                            <Trash2 size={14} aria-hidden="true" />
                            <span>{removing ? "Deleting…" : "Delete"}</span>
                          </button>
                        </>
                      }
                    />
                    {actionError && (
                      <p className="review-error" role="alert">
                        {actionError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="review-own">
                    <p className="eyebrow">{ownReview ? "Edit your review" : "Write a review"}</p>
                    <ReviewForm
                      key={ownReview?.updatedAt ?? "new"}
                      existing={ownReview}
                      onSave={save}
                      onCancel={ownReview ? () => setEditing(false) : undefined}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {listError && !listing && (
            <div className="review-prompt" role="alert">
              <span>{listError}</span>
              <button type="button" className="review-action" onClick={refresh}>
                <RotateCcw size={14} aria-hidden="true" />
                <span>Try again</span>
              </button>
            </div>
          )}

          {!listing && !listError && summary.count > 0 && <p className="review-muted">Loading reviews…</p>}

          {listing && others.length === 0 && !ownReview && (
            <p className="review-muted">No reviews yet. Bought one? Be the first to say how it holds up.</p>
          )}

          {others.length > 0 && (
            <ul className="review-list">
              {others.map((review) => (
                <li key={review.id}>
                  <ReviewItem review={review} />
                </li>
              ))}
            </ul>
          )}

          {hasMore && (
            <button type="button" className="button secondary review-more" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading…" : "Show more reviews"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/** Average, star count and a bar per star value. */
function RatingOverview({ summary }: { summary: RatingSummary }) {
  const bars = [...summary.distribution].map((count, index) => ({ stars: index + 1, count })).reverse();

  return (
    <div className="rating-overview">
      {summary.average === null ? (
        <>
          <strong className="rating-average">–</strong>
          <Stars rating={0} size={18} label="No ratings yet" />
          <small>No ratings yet</small>
        </>
      ) : (
        <>
          <strong className="rating-average">{summary.average.toFixed(1)}</strong>
          <Stars rating={summary.average} size={18} />
          <small>
            {summary.count} {summary.count === 1 ? "review" : "reviews"}
          </small>
        </>
      )}

      <ul className="rating-bars">
        {bars.map(({ stars, count }) => (
          <li key={stars}>
            <span aria-hidden="true">{stars}★</span>
            <span className="rating-bar" aria-hidden="true">
              <span style={{ width: `${summary.count ? (count / summary.count) * 100 : 0}%` }} />
            </span>
            <span className="rating-bar-count">
              {count}
              <span className="visually-hidden"> {count === 1 ? "review" : "reviews"} with {stars} {stars === 1 ? "star" : "stars"}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
