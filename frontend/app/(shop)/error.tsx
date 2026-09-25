"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Dumbbell, RotateCcw } from "lucide-react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

// Catches failed API calls on storefront pages. A plain header is inlined because the
// regular one loads data too, and that may be exactly what just failed.
export default function ShopError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main>
      <header className="site-header compact">
        <Link href="/" className="brand" aria-label="ForgeFit Supply home">
          <span className="brand-mark">
            <Dumbbell size={18} strokeWidth={2.6} />
          </span>
          <span>ForgeFit Supply</span>
        </Link>
      </header>
      <section className="empty-page">
        <p className="eyebrow">Connection problem</p>
        <h1>The shop didn&apos;t load</h1>
        <p>
          Our server may be waking up after a quiet spell, which can take up to a minute. Try again
          in a moment.
        </p>
        <button type="button" className="button primary" onClick={reset}>
          <RotateCcw size={18} />
          <span>Try again</span>
        </button>
      </section>
    </main>
  );
}
