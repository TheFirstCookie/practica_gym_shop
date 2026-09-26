"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { LogIn, Mail, UserPlus } from "lucide-react";
import { useCustomerSession } from "@/app/components/customer-session";
import { CheckInbox } from "./check-inbox";
import { LinkNotice } from "./link-notice";
import { TextField } from "./text-field";

type Mode = "sign-in" | "create";

/** An email we just sent: the sign-up confirmation or a one-time sign-in link. */
type Sent = { kind: "confirm" | "sign-in-link"; email: string };

const MIN_PASSWORD = 8;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Only paths on this site, so ?next= can't bounce people to another website.
export function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/account/sign-in")) {
    return "/account";
  }
  return value;
}

/** Sign in (password or emailed link) or create a shop account; returns to ?next= afterwards. */
export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const { state, signIn, signUp, resendConfirmation, sendSignInLink } = useCustomerSession();
  const [mode, setMode] = useState<Mode>(searchParams.get("mode") === "create" ? "create" : "sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Set when sign-in failed because the address was never confirmed, to offer a new link.
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<Sent | null>(null);

  // Signed in (just now, or already when the page opened): carry on where they were.
  useEffect(() => {
    if (state.status === "signed-in") router.replace(next);
  }, [state.status, next, router]);

  function switchMode(value: Mode) {
    setMode(value);
    setError(null);
    setUnconfirmed(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setUnconfirmed(false);
    const address = email.trim();

    if (mode === "create" && password.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters for your password.`);
      return;
    }

    setSubmitting(true);
    if (mode === "sign-in") {
      const message = await signIn(address, password);
      setSubmitting(false);
      if (message) {
        setError(message);
        setUnconfirmed(message.startsWith("Confirm your email"));
      }
      return;
    }

    const result = await signUp({ name: name.trim(), email: address, password });
    setSubmitting(false);
    if (result.status === "error") setError(result.message);
    if (result.status === "confirm-email") setSent({ kind: "confirm", email: address });
  }

  async function emailSignInLink() {
    const address = email.trim();
    if (!EMAIL.test(address)) {
      setError("Enter your email address first, and we'll send the link there.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const message = await sendSignInLink(address, next);
    setSubmitting(false);
    if (message) setError(message);
    else setSent({ kind: "sign-in-link", email: address });
  }

  async function resendFromError() {
    const message = await resendConfirmation(email.trim());
    if (message) {
      setError(message);
    } else {
      setUnconfirmed(false);
      setSent({ kind: "confirm", email: email.trim() });
    }
  }

  if (state.status === "unconfigured") {
    return (
      <section className="account-card auth-card">
        <p className="eyebrow">Accounts</p>
        <h1>Accounts are switched off</h1>
        <p className="account-muted">
          This copy of the shop has no Supabase project configured. You can still shop and check out as a guest.
        </p>
        <Link href="/" className="button primary">
          Back to the shop
        </Link>
      </section>
    );
  }

  if (sent) {
    const confirming = sent.kind === "confirm";
    return (
      <CheckInbox
        title="Check your inbox"
        email={sent.email}
        what={confirming ? "a link to confirm your account" : "a one-time sign-in link"}
        onResend={() => (confirming ? resendConfirmation(sent.email) : sendSignInLink(sent.email, next))}
        onBack={() => {
          setSent(null);
          switchMode("sign-in");
        }}
      />
    );
  }

  const busy = submitting || state.status === "loading" || state.status === "signed-in";
  const creating = mode === "create";

  return (
    <section className="account-card auth-card">
      <p className="eyebrow">Your account</p>
      <h1>{creating ? "Create account" : "Sign in"}</h1>
      <p className="account-muted">
        {creating
          ? "Track your orders, keep a wishlist and review the gear you bought."
          : "Welcome back. Your orders and wishlist are waiting."}
      </p>

      <LinkNotice errorsOnly />

      <div className="auth-tabs" role="group" aria-label="Sign in or create an account">
        <button type="button" aria-pressed={!creating} onClick={() => switchMode("sign-in")}>
          Sign in
        </button>
        <button type="button" aria-pressed={creating} onClick={() => switchMode("create")}>
          Create account
        </button>
      </div>

      <form className="account-form" onSubmit={handleSubmit}>
        {creating && (
          <TextField
            label="Name"
            hint="Reviews show your first name and last initial."
            type="text"
            autoComplete="name"
            required
            maxLength={60}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        )}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          label="Password"
          hint={creating ? `At least ${MIN_PASSWORD} characters.` : undefined}
          type="password"
          autoComplete={creating ? "new-password" : "current-password"}
          required
          minLength={creating ? MIN_PASSWORD : undefined}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {!creating && (
          <Link href="/account/forgot-password" className="auth-forgot">
            Forgot your password?
          </Link>
        )}

        {error && (
          <div className="account-error" role="alert">
            <p>{error}</p>
            {unconfirmed && (
              <button type="button" className="auth-link-button" onClick={resendFromError}>
                Send the confirmation email again
              </button>
            )}
          </div>
        )}

        <button type="submit" className="button primary" disabled={busy}>
          {creating ? <UserPlus size={18} aria-hidden="true" /> : <LogIn size={18} aria-hidden="true" />}
          <span>
            {submitting ? (creating ? "Creating account…" : "Signing in…") : creating ? "Create account" : "Sign in"}
          </span>
        </button>

        {!creating && (
          <>
            <p className="auth-divider">
              <span>or</span>
            </p>
            <button type="button" className="button secondary" disabled={busy} onClick={emailSignInLink}>
              <Mail size={18} aria-hidden="true" />
              <span>Email me a sign-in link</span>
            </button>
          </>
        )}
      </form>

      {creating && (
        <p className="auth-guest">
          We&apos;ll email you a link to confirm your address. By creating an account you accept the{" "}
          <Link href="/terms">terms</Link> and the <Link href="/privacy">privacy policy</Link>.
        </p>
      )}

      <p className="auth-guest">
        No account needed to buy: <Link href="/cart">check out as a guest</Link>.
      </p>
    </section>
  );
}
