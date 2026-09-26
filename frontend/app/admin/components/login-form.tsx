"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Dumbbell, LogIn } from "lucide-react";
import { useAdminSession } from "../admin-session";

// Only same-site admin paths, so ?next= can't bounce people to another website.
function safeNext(value: string | null) {
  return value && value.startsWith("/admin") && !value.startsWith("//") ? value : "/admin";
}

export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const { state, signIn, signOut } = useAdminSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (state.status === "ready") router.replace(next);
  }, [state.status, next, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const message = await signIn(email.trim(), password);
    setSubmitting(false);
    if (message) setError(message);
  }

  if (state.status === "unconfigured") {
    return (
      <section className="admin-card">
        <p className="eyebrow">Setup needed</p>
        <h1>Admin sign-in isn&apos;t configured</h1>
        <p>
          Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>, then restart the app.
        </p>
      </section>
    );
  }

  const busy = submitting || state.status === "loading" || state.status === "ready";

  return (
    <section className="admin-card admin-login">
      <Link href="/" className="brand">
        <span className="brand-mark">
          <Dumbbell size={18} strokeWidth={2.6} />
        </span>
        <span>
          ForgeFit <em>Admin</em>
        </span>
      </Link>
      <h1>Sign in</h1>

      {state.status === "forbidden" ? (
        <>
          <p className="admin-error" role="alert">
            {state.email ?? "This account"} doesn&apos;t have admin access.
          </p>
          <button type="button" className="button secondary" onClick={signOut}>
            Use another account
          </button>
        </>
      ) : (
        <form className="admin-form" onSubmit={handleSubmit}>
          <label className="admin-field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="admin-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {(error || state.status === "error") && (
            <p className="admin-error" role="alert">
              {error ?? (state.status === "error" ? state.message : null)}
            </p>
          )}

          <button type="submit" className="button primary" disabled={busy}>
            <LogIn size={18} />
            <span>{submitting ? "Signing in…" : "Sign in"}</span>
          </button>
        </form>
      )}

      {/* Admins are Supabase users too, so the shop's reset flow works for them. */}
      <Link href="/account/forgot-password" className="admin-back-link">
        <span>Forgot your password?</span>
        <ArrowRight size={15} />
      </Link>
      <Link href="/" className="admin-back-link">
        <span>Back to the shop</span>
        <ArrowRight size={15} />
      </Link>
    </section>
  );
}
