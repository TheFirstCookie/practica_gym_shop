"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AuthError, Session } from "@supabase/supabase-js";
import { getCustomerAuthClient } from "@/lib/supabase/client";

export type Customer = {
  id: string;
  email: string;
  /** What they typed when signing up; null for accounts made without one. */
  fullName: string | null;
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

type CustomerSessionValue = {
  state: CustomerSessionState;
  customer: Customer | null;
  /** Resolves to an error message, or null on success. */
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (input: { name: string; email: string; password: string }) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  /** A fresh access token, or null when nobody is signed in. */
  getToken: () => Promise<string | null>;
  /** Resolves to an error message, or null on success. */
  updateProfile: (changes: { name?: string; password?: string }) => Promise<string | null>;
};

const CustomerSessionContext = createContext<CustomerSessionValue | null>(null);

function toCustomer(session: Session | null): Customer | null {
  if (!session) return null;
  const { user } = session;
  const name = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
  return { id: user.id, email: user.email ?? "", fullName: name || null };
}

function toState(session: Session | null): CustomerSessionState {
  const customer = toCustomer(session);
  return customer ? { status: "signed-in", customer } : { status: "signed-out" };
}

// Supabase's messages are fine for most cases; these read better in a shop.
function describe(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Wrong email or password.";
    case "email_not_confirmed":
      return "Confirm your email first: open the link we sent you, then sign in.";
    case "user_already_exists":
    case "email_exists":
      return "There's already an account with this email. Sign in instead.";
    case "weak_password":
      return "Pick a stronger password: at least 8 characters.";
    case "signup_disabled":
      return "New accounts are switched off right now.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Wait a minute and try again.";
    default:
      return error.message;
  }
}

/**
 * The shopper's own sign-in, kept apart from the admin's session (see lib/supabase/client).
 * Supabase stores the session in the browser; the API checks the token on every call.
 */
export function CustomerSessionProvider({ children }: { children: React.ReactNode }) {
  const supabase = getCustomerAuthClient();
  const [state, setState] = useState<CustomerSessionState>(
    supabase ? { status: "loading" } : { status: "unconfigured" }
  );

  useEffect(() => {
    if (!supabase) return;
    // Fires once right away with the stored session, then on every change (including
    // sign-in in another tab and name updates).
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setState(toState(session)));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return "Accounts aren't configured.";
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? describe(error) : null;
    },
    [supabase]
  );

  const signUp = useCallback(
    async ({ name, email, password }: { name: string; email: string; password: string }): Promise<SignUpResult> => {
      if (!supabase) return { status: "error", message: "Accounts aren't configured." };
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      });
      if (error) return { status: "error", message: describe(error) };
      // With email confirmation on there's a user but no session yet. (For an email that's
      // already registered Supabase answers the same way, so nobody can probe for accounts.)
      return data.session ? { status: "signed-in" } : { status: "confirm-email" };
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

  const updateProfile = useCallback(
    async ({ name, password }: { name?: string; password?: string }) => {
      if (!supabase) return "Accounts aren't configured.";
      const { error } = await supabase.auth.updateUser({
        ...(name !== undefined && { data: { full_name: name } }),
        ...(password !== undefined && { password })
      });
      if (error) {
        return error.code === "same_password" ? "That's already your password." : describe(error);
      }
      return null;
    },
    [supabase]
  );

  const value = useMemo(
    () => ({
      state,
      customer: state.status === "signed-in" ? state.customer : null,
      signIn,
      signUp,
      signOut,
      getToken,
      updateProfile
    }),
    [state, signIn, signUp, signOut, getToken, updateProfile]
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
