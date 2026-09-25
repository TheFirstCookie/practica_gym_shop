"use client";

import { RotateCcw } from "lucide-react";

/** Shown in place of account data that failed to load. */
export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="account-empty" role="alert">
      <h2>Couldn&apos;t load this</h2>
      <p className="account-muted">{message}</p>
      <button type="button" className="button secondary" onClick={onRetry}>
        <RotateCcw size={16} aria-hidden="true" />
        <span>Try again</span>
      </button>
    </div>
  );
}
