"use client";

import { useId, useState, type FormEvent } from "react";
import { Star } from "lucide-react";
import type { ReviewInput } from "@/lib/api/reviews";
import type { Review } from "@/lib/api/types";

const TITLE_MAX = 120;
const BODY_MAX = 2000;
const RATING_WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

type ReviewFormProps = {
  /** The review being edited, or null for a new one. */
  existing: Review | null;
  /** Resolves to an error message, or null once saved. */
  onSave: (input: ReviewInput) => Promise<string | null>;
  onCancel?: () => void;
};

/** Write or edit a review: stars (required), an optional title and text. */
export function ReviewForm({ existing, onSave, onCancel }: ReviewFormProps) {
  const id = useId();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rating) {
      setError("Pick a star rating.");
      return;
    }
    setSaving(true);
    setError(null);
    const message = await onSave({ rating, title: title.trim(), body: body.trim() });
    setSaving(false);
    if (message) setError(message);
  }

  const shown = hovered || rating;

  return (
    <form className="review-form" onSubmit={onSubmit}>
      <fieldset className="star-input" onPointerLeave={() => setHovered(0)}>
        <legend>Your rating</legend>
        <div className="star-input-row">
          {[1, 2, 3, 4, 5].map((value) => (
            // Real radio buttons, so arrow keys and screen readers work as usual.
            <label key={value} onPointerEnter={() => setHovered(value)} data-lit={value <= shown || undefined}>
              <input
                type="radio"
                name={`${id}-rating`}
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                aria-label={`${value} ${value === 1 ? "star" : "stars"}: ${RATING_WORDS[value]}`}
              />
              <Star size={26} fill={value <= shown ? "currentColor" : "none"} aria-hidden="true" />
            </label>
          ))}
          <span className="star-input-word" aria-hidden="true">
            {RATING_WORDS[shown]}
          </span>
        </div>
      </fieldset>

      <label className="review-field">
        <span>Title (optional)</span>
        <input
          type="text"
          maxLength={TITLE_MAX}
          placeholder="Sum it up in a few words"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label className="review-field">
        <span>Your review (optional)</span>
        <textarea
          rows={4}
          maxLength={BODY_MAX}
          placeholder="How does it hold up? What do you use it for?"
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <small>
          {body.length}/{BODY_MAX}
        </small>
      </label>

      {error && (
        <p className="review-error" role="alert">
          {error}
        </p>
      )}

      <div className="review-form-actions">
        <button type="submit" className="button primary" disabled={saving}>
          {saving ? "Saving…" : existing ? "Save changes" : "Post review"}
        </button>
        {onCancel && (
          <button type="button" className="button secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
