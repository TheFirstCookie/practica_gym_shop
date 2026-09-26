"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { useCustomerSession } from "@/app/components/customer-session";
import { CheckInbox } from "./check-inbox";
import { TextField } from "./text-field";

/** Asks for an email and sends a password-reset link to it. */
export function ForgotPasswordForm() {
  const router = useRouter();
  const { state, sendPasswordReset } = useCustomerSession();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSending(true);
    const address = email.trim();
    const message = await sendPasswordReset(address);
    setSending(false);
    if (message) setError(message);
    else setSentTo(address);
  }

  if (sentTo) {
    return (
      <CheckInbox
        title="Check your inbox"
        email={sentTo}
        what="a link to choose a new password (if there's an account for this address)"
        onResend={() => sendPasswordReset(sentTo)}
        onBack={() => router.push("/account/sign-in")}
      />
    );
  }

  return (
    <section className="account-card auth-card">
      <p className="eyebrow">Your account</p>
      <h1>Reset password</h1>
      <p className="account-muted">
        Enter the email you signed up with and we&apos;ll send you a link to choose a new password.
      </p>

      <form className="account-form" onSubmit={onSubmit}>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {error && (
          <p className="account-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="button primary" disabled={sending || state.status === "unconfigured"}>
          <KeyRound size={18} aria-hidden="true" />
          <span>{sending ? "Sending…" : "Send reset link"}</span>
        </button>
      </form>

      <p className="auth-guest">
        Remembered it? <Link href="/account/sign-in">Back to sign in</Link>.
      </p>
    </section>
  );
}
