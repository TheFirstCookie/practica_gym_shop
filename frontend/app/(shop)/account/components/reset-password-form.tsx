"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { useCustomerSession } from "@/app/components/customer-session";
import { LinkNotice } from "./link-notice";
import { TextField } from "./text-field";

const MIN_PASSWORD = 8;

/**
 * Where the password-reset email leads. The link signs the shopper in (Supabase reads it
 * from the URL); this page then lets them choose a new password.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const { state, recovering, landing, setNewPassword } = useCustomerSession();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setError(null);
    setSaving(true);
    const message = await setNewPassword(password);
    setSaving(false);
    if (message) setError(message);
    else router.replace("/account");
  }

  if (state.status === "loading") {
    return <p className="account-muted">Checking your link…</p>;
  }

  if (!recovering) {
    // Opened without a (working) reset link: expired, used already, or typed in by hand.
    return (
      <section className="account-card auth-card">
        <p className="eyebrow">Your account</p>
        <h1>Link expired</h1>
        <LinkNotice errorsOnly />
        <p className="account-muted">
          {landing?.error
            ? "Ask for a new reset link and use it within an hour."
            : "Password reset links work once, for a limited time. Ask for a new one."}
        </p>
        <Link href="/account/forgot-password" className="button primary">
          Send a new link
        </Link>
        {state.status === "signed-in" && (
          <p className="auth-guest">
            Signed in already? Change your password in <Link href="/account/settings">Settings</Link>.
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="account-card auth-card">
      <p className="eyebrow">Your account</p>
      <h1>New password</h1>
      <p className="account-muted">
        Choose a new password for <strong>{state.status === "signed-in" ? state.customer.email : "your account"}</strong>.
      </p>
      <form className="account-form" onSubmit={onSubmit}>
        <TextField
          label="New password"
          hint={`At least ${MIN_PASSWORD} characters.`}
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <TextField
          label="Repeat it"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
        {error && (
          <p className="account-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="button primary" disabled={saving}>
          <KeyRound size={18} aria-hidden="true" />
          <span>{saving ? "Saving…" : "Save new password"}</span>
        </button>
      </form>
    </section>
  );
}
