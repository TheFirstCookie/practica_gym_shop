"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BadgeCheck, ExternalLink, RotateCcw, Trash2 } from "lucide-react";
import { deleteAdminReview, listAdminReviews, type AdminReviewList } from "@/lib/api/admin";
import type { AdminReview } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { Stars } from "@/app/components/reviews/stars";
import { useAdminApi } from "../use-admin-api";

type Loaded = { key: string; list: AdminReviewList } | { key: string; error: string };

const EXCERPT = 180;

function excerpt(text: string) {
  return text.length > EXCERPT ? `${text.slice(0, EXCERPT).trimEnd()}…` : text;
}

/** Every review on the shop, newest first, with a way to take one down. */
export function ReviewModeration() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { run, refreshShop } = useAdminApi();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [removed, setRemoved] = useState<AdminReview | null>(null);
  const requestKey = `${page}|${reloadCount}`;

  useEffect(() => {
    let current = true;
    run((token) => listAdminReviews(token, page))
      .then((list) => current && setLoaded({ key: requestKey, list }))
      .catch((error: Error) => current && setLoaded({ key: requestKey, error: error.message }));
    return () => {
      current = false;
    };
  }, [run, page, requestKey]);

  function goToPage(next: number) {
    router.replace(next > 1 ? `${pathname}?page=${next}` : pathname, { scroll: false });
  }

  async function remove(review: AdminReview) {
    setBusyId(review.id);
    setActionError(null);
    try {
      await run((token) => deleteAdminReview(token, review.id));
      setConfirmingId(null);
      setRemoved(review);
      setReloadCount((count) => count + 1);
      // The product page caches its star rating; this refreshes it now.
      void refreshShop();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Couldn't delete the review");
    } finally {
      setBusyId(null);
    }
  }

  const loading = loaded?.key !== requestKey;
  const list = loaded && "list" in loaded ? loaded.list : null;
  const loadError = loaded && "error" in loaded && !loading ? loaded.error : null;
  const pagination = list?.meta.pagination;

  return (
    <section className="admin-section">
      <div className="admin-section-heading">
        <div>
          <p className="eyebrow">Customers</p>
          <h1>Reviews</h1>
        </div>
        {pagination && (
          <p className="admin-hint">
            {pagination.total} {pagination.total === 1 ? "review" : "reviews"} in the shop
          </p>
        )}
      </div>

      {removed && (
        <p className="admin-notice" role="status">
          <span>
            Deleted {removed.authorName}&apos;s review{removed.product ? ` of ${removed.product.name}` : ""}.
          </span>
        </p>
      )}
      {actionError && (
        <p className="admin-error" role="alert">
          {actionError}
        </p>
      )}

      {loadError ? (
        <div className="admin-card admin-inline-card">
          <p>{loadError}</p>
          <button type="button" className="button secondary" onClick={() => setReloadCount((c) => c + 1)}>
            <RotateCcw size={16} />
            <span>Try again</span>
          </button>
        </div>
      ) : (
        <div className="admin-table-wrap" aria-busy={loading}>
          <table className="admin-table admin-review-table">
            <thead>
              <tr>
                <th scope="col">Review</th>
                <th scope="col">Product</th>
                <th scope="col">Author</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list?.data.map((review) => (
                <tr key={review.id}>
                  <td>
                    <span className="admin-review-cell">
                      <Stars rating={review.rating} size={14} />
                      {review.title && <strong>{review.title}</strong>}
                      {review.body && <span>{excerpt(review.body)}</span>}
                      <small>{formatDateTime(review.createdAt)}</small>
                    </span>
                  </td>
                  <td>
                    {review.product ? (
                      <a
                        href={`/product/${review.product.slug}#reviews`}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-external-link"
                      >
                        <span>{review.product.name}</span>
                        <ExternalLink size={14} aria-hidden="true" />
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span className="admin-order-customer">
                      <span>{review.authorName}</span>
                      {review.verifiedPurchase && (
                        <small className="admin-review-verified">
                          <BadgeCheck size={13} aria-hidden="true" />
                          <span>Verified purchase</span>
                        </small>
                      )}
                    </span>
                  </td>
                  <td>
                    {confirmingId === review.id ? (
                      <div className="admin-confirm" role="group" aria-label="Delete this review?">
                        <span>Delete?</span>
                        <button
                          type="button"
                          className="admin-danger-button"
                          disabled={busyId === review.id}
                          onClick={() => remove(review)}
                        >
                          {busyId === review.id ? "Deleting…" : "Delete"}
                        </button>
                        <button type="button" className="admin-link-button" onClick={() => setConfirmingId(null)}>
                          Keep
                        </button>
                      </div>
                    ) : (
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          aria-label={`Delete ${review.authorName}'s review`}
                          title="Delete"
                          onClick={() => setConfirmingId(review.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {list && list.data.length === 0 && (
            <p className="admin-empty">
              No reviews yet. Shoppers can review products once they create an account.{" "}
              <Link href="/" target="_blank">
                Open the shop
              </Link>
            </p>
          )}
          {!list && <p className="admin-empty">Loading reviews…</p>}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="admin-pager">
          <button type="button" className="button secondary" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
            Previous
          </button>
          <span>
            Page {page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            className="button secondary"
            disabled={page >= pagination.totalPages}
            onClick={() => goToPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
