"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AuthError, Session } from "@supabase/supabase-js";
import type { AuthLanding } from "@/lib/auth-landing";
import { getAuthLanding, getSupabaseBrowserClient } from "@/lib/supabase/client";

export type Customer = {
  id: string;
  email: string;
  /** What they typed when signing up; null for accounts made without one. */
  fullName: string | null;
  /** A new address waiting for its confirmation link to be clicked. */
  pendingEmail: string | null;
  /**
   * Has the admin role, so the shop links to /admin. Only for showing the way there: the
   * API checks the role itself on every admin request.
   */
  isAdmin: boolean;
};

export type CustomerSessionState =
  | { status: "loading" }
  | { status: "unconfigured" }
  | { status: "signed-out" }
  | { status: "signed-in"; customer: Customer };

export type SignUpResult =
  | { status: "signed-in" }
  /** Supabase has "Confirm email" on, so the account works after clicking the link. */
  | { status: "confirm-email" }
  | { status: "error"; message: string };

/** Every action resolves to an error message for the shopper, or null when it worked. */
type Outcome = Promise<string | null>;

type CustomerSessionValue = {
  state: CustomerSessionState;
  customer: Customer | null;
  /** The email link this page was opened from (confirmation, reset, error…), until dismissed. */
  landing: AuthLanding | null;
  dismissLanding: () => void;
  /** Signed in through a password-reset link: the reset page may set a new password. */
  recovering: boolean;
  signIn: (email: string, password: string) => Outcome;
  signUp: (input: { name: string; email: string; password: string }) => Promise<SignUpResult>;
  resendConfirmation: (email: string) => Outcome;
  /** Emails a one-time sign-in link that returns to `nextPath`. Existing accounts only. */
  sendSignInLink: (email: string, nextPath: string) => Outcome;
  sendPasswordReset: (email: string) => Outcome;
  /** Finishes a password reset (after the emailed link signed them in). */
  setNewPassword: (password: string) => Outcome;
  /** From Settings: checks the current password first. */
  changePassword: (currentPassword: string, newPassword: string) => Outcome;
  changeEmail: (email: string) => Outcome;
  updateName: (name: string) => Outcome;
  signOut: () => Promise<void>;
  /** A fresh access token, or null when nobody is signed in. */
  getToken: () => Promise<string | null>;
};

const CustomerSessionContext = createContext<CustomerSessionValue | null>(null);

const NOT_CONFIGURED = "Accounts aren't configured.";

function toCustomer(session: Session | null): Customer | null {
  if (!session) return null;
  const { user } = session;
  const name = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: name || null,
    pendingEmail: user.new_email ?? null,
    isAdmin: user.app_metadata?.role === "admin"
  };
}

function toState(session: Session | null): CustomerSessionState {
  const customer = toCustomer(session);
  return customer ? { status: "signed-in", customer } : { status: "signed-out" };
}

/**
 * Takes the email link's tokens out of the address bar, so they don't end up in history,
 * bookmarks or a shared screenshot. (Supabase tries too, but the router can restore the
 * original URL while the page hydrates.) Uses the native History API, which Next's router
 * keeps in sync with.
 */
function clearLinkFromUrl() {
  const { hash, pathname, search } = window.location;
  if (/access_token|error|message/.test(hash)) {
    window.history.replaceState(window.history.state, "", pathname + search);
  }
}

/** Where an email link should bring the shopper back to, on this same site. */
const backTo = (path: string) => `${window.location.origin}${path}`;

// Supabase's messages are fine for most cases; these read better in a shop.
function describe(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Wrong email or password.";
    case "email_not_confirmed":
      return "Confirm your email first: open the link we sent you, or send it again below.";
    case "user_already_exists":
    case "email_exists":
      return "There's already an account with this email.";
    case "weak_password":
      return "Pick a stronger password: at least 8 characters.";
    case "same_password":
      return "That's already your password.";
    case "signup_disabled":
      return "New accounts are switched off right now.";
    case "over_email_send_rate_limit":
      return "We've just sent you an email. Wait a minute before asking for another one.";
    case "over_request_rate_limit":
      return "Too many attempts. Wait a minute and try again.";
    case "email_address_invalid":
      return "That email address doesn't look right.";
    default:
      return error.message;
  }
}

/**
 * The shopper's sign-in (the same session /admin uses; see lib/supabase/client).
 * Supabase stores the session in the browser and sends the account emails (confirmation,
 * sign-in links, password resets); the API checks the token on every call.
 */
export function CustomerSessionProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseBrowserClient();
  const [state, setState] = useState<CustomerSessionState>(
    supabase ? { status: "loading" } : { status: "unconfigured" }
  );
  const [landing, setLanding] = useState<AuthLanding | null>(null);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let first = true;
    // Fires once right away with the stored (or just-linked) session, then on every change,
    // including sign-in in another tab and profile updates.
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setState(toState(session));
      if (first) {
        first = false;
        const arrived = getAuthLanding();
        setLanding(arrived);
        if (arrived?.type === "recovery" && session) setRecovering(true);
        if (arrived) clearLinkFromUrl();
      }
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      if (event === "SIGNED_OUT") setRecovering(false);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  const dismissLanding = useCallback(() => setLanding(null), []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return NOT_CONFIGURED;
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? describe(error) : null;
    },
    [supabase]
  );

  const signUp = useCallback(
    async ({ name, email, password }: { name: string; email: string; password: string }): Promise<SignUpResult> => {
      if (!supabase) return { status: "error", message: NOT_CONFIGURED };
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        // The confirmation link signs them in and opens their account.
        options: { data: { full_name: name }, emailRedirectTo: backTo("/account") }
      });
      if (error) return { status: "error", message: describe(error) };
      // With email confirmation on there's a user but no session yet. (For an email that's
      // already registered Supabase answers the same way, so nobody can probe for accounts.)
      return data.session ? { status: "signed-in" } : { status: "confirm-email" };
    },
    [supabase]
  );

  const resendConfirmation = useCallback(
    async (email: string) => {
      if (!supabase) return NOT_CONFIGURED;
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: backTo("/account") }
      });
      return error ? describe(error) : null;
    },
    [supabase]
  );

  const sendSignInLink = useCallback(
    async (email: string, nextPath: string) => {
      if (!supabase) return NOT_CONFIGURED;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        // Signing in only: new accounts go through the sign-up form (with a name and password).
        options: { shouldCreateUser: false, emailRedirectTo: backTo(nextPath) }
      });
      // No account for this email: say the same as for a real one, so nobody can use the
      // form to find out who shops here.
      if (!error || error.code === "otp_disabled" || error.code === "user_not_found") return null;
      return describe(error);
    },
    [supabase]
  );

  const sendPasswordReset = useCallback(
    async (email: string) => {
      if (!supabase) return NOT_CONFIGURED;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: backTo("/account/reset-password")
      });
      return error ? describe(error) : null;
    },
    [supabase]
  );

  const setNewPassword = useCallback(
    async (password: string) => {
      if (!supabase) return NOT_CONFIGURED;
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return describe(error);
      setRecovering(false);
      setLanding({ type: null, error: null, message: "Your new password is saved, and you're signed in." });
      return null;
    },
    [supabase]
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!supabase) return NOT_CONFIGURED;
      const email = state.status === "signed-in" ? state.customer.email : null;
      if (!email) return "Sign in again to change your password.";

      // Someone at an unlocked computer shouldn't be able to take over the account.
      const check = await supabase.auth.signInWithPassword({ email, password: currentPassword });
      if (check.error) {
        return check.error.code === "invalid_credentials" ? "Your current password isn't right." : describe(check.error);
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return error ? describe(error) : null;
    },
    [supabase, state]
  );

  const changeEmail = useCallback(
    async (email: string) => {
      if (!supabase) return NOT_CONFIGURED;
      const { error } = await supabase.auth.updateUser({ email }, { emailRedirectTo: backTo("/account/settings") });
      return error ? describe(error) : null;
    },
    [supabase]
  );

  const updateName = useCallback(
    async (name: string) => {
      if (!supabase) return NOT_CONFIGURED;
      const { error } = await supabase.auth.updateUser({ data: { full_name: name } });
      return error ? describe(error) : null;
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, [supabase]);

  const getToken = useCallback(async () => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, [supabase]);

  const value = useMemo(
    () => ({
      state,
      customer: state.status === "signed-in" ? state.customer : null,
      landing,
      dismissLanding,
      recovering,
      signIn,
      signUp,
      resendConfirmation,
      sendSignInLink,
      sendPasswordReset,
      setNewPassword,
      changePassword,
      changeEmail,
      updateName,
      signOut,
      getToken
    }),
    [
      state,
      landing,
      dismissLanding,
      recovering,
      signIn,
      signUp,
      resendConfirmation,
      sendSignInLink,
      sendPasswordReset,
      setNewPassword,
      changePassword,
      changeEmail,
      updateName,
      signOut,
      getToken
    ]
  );

  return <CustomerSessionContext.Provider value={value}>{children}</CustomerSessionContext.Provider>;
}

export function useCustomerSession() {
  const value = useContext(CustomerSessionContext);
  if (!value) throw new Error("useCustomerSession must be used inside <CustomerSessionProvider>");
  return value;
}

/** Where to send someone to sign in, returning them to `path` afterwards (else their account). */
export function signInHref(path?: string) {
  return path ? `/account/sign-in?next=${encodeURIComponent(path)}` : "/account/sign-in";
}
