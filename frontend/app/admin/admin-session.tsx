"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { ApiError } from "@/lib/api/client";
import { getAdminMe, type AdminUser } from "@/lib/api/admin";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type AdminSessionState =
  | { status: "loading" }
  | { status: "unconfigured" }
  | { status: "signed-out" }
  | { status: "forbidden"; email: string | null }
  | { status: "error"; message: string }
  | { status: "ready"; admin: AdminUser };

type AdminSessionValue = {
  state: AdminSessionState;
  signOut: () => Promise<void>;
  /** A fresh access token for API calls (Supabase refreshes it when needed). */
  getToken: () => Promise<string>;
  /** Re-checks admin rights, e.g. after the API was unreachable. */
  recheck: () => void;
};

const AdminSessionContext = createContext<AdminSessionValue | null>(null);

// Supabase keeps the session; the API decides whether it belongs to an admin. Asking the
// API (instead of reading the role in the browser) means the UI and the server can never
// disagree about who gets in.
async function verify(session: Session | null): Promise<AdminSessionState> {
  if (!session) return { status: "signed-out" };

  try {
    return { status: "ready", admin: await getAdminMe(session.access_token) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return { status: "forbidden", email: session.user.email ?? null };
    }
    if (error instanceof ApiError && error.status === 401) {
      return { status: "signed-out" };
    }
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Couldn't check your account"
    };
  }
}

export function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseBrowserClient();
  const [state, setState] = useState<AdminSessionState>(
    supabase ? { status: "loading" } : { status: "unconfigured" }
  );
  const [checkCount, setCheckCount] = useState(0);

  useEffect(() => {
    if (!supabase) return;

    let current = true;
    let verifiedUserId: string | null = null;

    // Fires once right away with the stored session, then on every sign-in and sign-out.
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // Token refreshes don't change who is signed in, so there's nothing to re-check.
      if (event === "TOKEN_REFRESHED" && session?.user.id === verifiedUserId) return;

      verify(session).then((next) => {
        if (!current) return;
        verifiedUserId = next.status === "ready" ? next.admin.id : null;
        setState(next);
      });
    });

    return () => {
      current = false;
      data.subscription.unsubscribe();
    };
  }, [supabase, checkCount]);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, [supabase]);

  const getToken = useCallback(async () => {
    const session = supabase ? (await supabase.auth.getSession()).data.session : null;
    if (!session) throw new ApiError(401, "unauthorized", "Sign in to continue");
    return session.access_token;
  }, [supabase]);

  const recheck = useCallback(() => {
    setState({ status: "loading" });
    setCheckCount((count) => count + 1);
  }, []);

  const value = useMemo(
    () => ({ state, signOut, getToken, recheck }),
    [state, signOut, getToken, recheck]
  );

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}

export function useAdminSession() {
  const value = useContext(AdminSessionContext);
  if (!value) throw new Error("useAdminSession must be used inside <AdminSessionProvider>");
  return value;
}
