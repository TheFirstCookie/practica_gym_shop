"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { LogIn, MailCheck, UserPlus } from "lucide-react";
import { useCustomerSession } from "@/app/components/customer-session";

type Mode = "sign-in" | "create";

const MIN_PASSWORD = 8;

// Only paths on this site, so ?next= can't bounce people to another website.
function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/account/sign-in")) {
    return "/account";
  }
  return value;
}

/** Sign in or create a shop account; returns to ?next= afterwards. */
export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const { state, signIn, signUp } = useCustomerSession();
  const [mode, setMode] = useState<Mode>(searchParams.get("mode") === "create" ? "create" : "sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSentTo, setConfirmSentTo] = useState<string | null>(null);

  // Signed in (just now, or already when the page opened): carry on where they were.
  useEffect(() => {
    if (state.status === "signed-in") router.replace(next);
  }, [state.status, next, router]);

  function switchMode(value: Mode) {
    setMode(value);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (mode === "create" && password.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters for your password.`);
      return;
    }

    setSubmitting(true);
    if (mode === "sign-in") {
      const message = await signIn(email.trim(), password);
      setSubmitting(false);
      if (message) setError(message);
      return;
    }

    const result = await signUp({ name: name.trim(), email: email.trim(), password });
    setSubmitting(false);
    if (result.status === "error") setError(result.message);
    if (result.status === "confirm-email") setConfirmSentTo(email.trim());
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

  if (confirmSentTo) {
    return (
      <section className="account-card auth-card">
        <MailCheck size={34} className="auth-card-icon" aria-hidden="true" />
        <h1>Check your inbox</h1>
        <p className="account-muted">
          We sent a confirmation link to <strong>{confirmSentTo}</strong>. Open it, then sign in here.
        </p>
        <button
          type="button"
          className="button secondary"
          onClick={() => {
            setConfirmSentTo(null);
            switchMode("sign-in");
          }}
        >
          Back to sign in
        </button>
      </section>
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
          <label className="account-field">
            <span>Name</span>
            <input
              type="text"
              autoComplete="name"
              required
              maxLength={60}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <small>Reviews show your first name and last initial.</small>
          </label>
        )}
        <label className="account-field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="account-field">
          <span>Password</span>
          <input
            type="password"
            autoComplete={creating ? "new-password" : "current-password"}
            required
            minLength={creating ? MIN_PASSWORD : undefined}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {creating && <small>At least {MIN_PASSWORD} characters.</small>}
        </label>

        {error && (
          <p className="account-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="button primary" disabled={busy}>
          {creating ? <UserPlus size={18} aria-hidden="true" /> : <LogIn size={18} aria-hidden="true" />}
          <span>
            {submitting ? (creating ? "Creating account…" : "Signing in…") : creating ? "Create account" : "Sign in"}
          </span>
        </button>
      </form>

      <p className="auth-guest">
        No account needed to buy: <Link href="/cart">check out as a guest</Link>.
      </p>
    </section>
  );
}
