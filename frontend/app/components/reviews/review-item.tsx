import { BadgeCheck } from "lucide-react";
import type { Review } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { Stars } from "./stars";

/** One review as shoppers read it. `actions` adds buttons (for the author's own review). */
export function ReviewItem({ review, actions }: { review: Review; actions?: React.ReactNode }) {
  const edited = review.updatedAt !== review.createdAt;

  return (
    <article className="review">
      <header className="review-header">
        <Stars rating={review.rating} size={15} />
        {review.title && <h3>{review.title}</h3>}
      </header>
      {review.body && <p className="review-body">{review.body}</p>}
      <footer className="review-meta">
        <strong>{review.authorName}</strong>
        {review.verifiedPurchase && (
          <span className="review-verified">
            <BadgeCheck size={14} aria-hidden="true" />
            <span>Verified purchase</span>
          </span>
        )}
        <time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
        {edited && <span>(edited)</span>}
        {actions && <span className="review-actions">{actions}</span>}
      </footer>
    </article>
  );
}
