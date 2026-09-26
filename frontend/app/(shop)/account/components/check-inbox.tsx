"use client";

import { useEffect, useState } from "react";
import { MailCheck, RotateCcw } from "lucide-react";

/** Supabase refuses a second email to the same address within about a minute. */
const RESEND_COOLDOWN_SECONDS = 60;

type CheckInboxProps = {
  title: string;
  email: string;
  /** What the email is for, e.g. "a confirmation link". */
  what: string;
  /** Sends the email again; resolves to an error message or null. */
  onResend?: () => Promise<string | null>;
  onBack: () => void;
  backLabel?: string;
};

/** "We sent you an email" screen, with a resend button that respects the cooldown. */
export function CheckInbox({ title, email, what, onResend, onBack, backLabel = "Back to sign in" }: CheckInboxProps) {
  const [wait, setWait] = useState(RESEND_COOLDOWN_SECONDS);
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setTimeout(() => setWait((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);

  async function resend() {
    if (!onResend) return;
    setStatus(null);
    const message = await onResend();
    setStatus(message ? { tone: "error", text: message } : { tone: "ok", text: "Sent again." });
    setWait(RESEND_COOLDOWN_SECONDS);
  }

  return (
    <section className="account-card auth-card">
      <MailCheck size={34} className="auth-card-icon" aria-hidden="true" />
      <h1>{title}</h1>
      <p className="account-muted">
        We sent {what} to <strong>{email}</strong>. It can take a minute to arrive; check the spam folder too.
      </p>

      {status && (
        <p className={status.tone === "ok" ? "account-success" : "account-error"} role={status.tone === "ok" ? "status" : "alert"}>
          {status.text}
        </p>
      )}

      <div className="auth-actions">
        {onResend && (
          <button type="button" className="button secondary" disabled={wait > 0} onClick={resend}>
            <RotateCcw size={16} aria-hidden="true" />
            <span>{wait > 0 ? `Send again in ${wait}s` : "Send again"}</span>
          </button>
        )}
        <button type="button" className="auth-link-button" onClick={onBack}>
          {backLabel}
        </button>
      </div>
    </section>
  );
}
