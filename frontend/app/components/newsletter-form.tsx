"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

// Nothing is stored yet: this only confirms on screen until the backend has a signup route.
export function NewsletterForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <p className="newsletter-done" role="status">
        You&apos;re on the list. Watch your inbox for the next drop.
      </p>
    );
  }

  return (
    <form
      className="newsletter-form"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <label htmlFor="newsletter-email" className="visually-hidden">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        name="email"
        placeholder="you@example.com"
        autoComplete="email"
        required
      />
      <button type="submit" className="button primary">
        <ChevronRight size={18} strokeWidth={2.6} />
        <span>Subscribe</span>
      </button>
    </form>
  );
}
