"use client";

import { useCallback, useEffect, useState } from "react";
import { useCustomerSession } from "@/app/components/customer-session";

type Loaded<T> = { key: number; data: T } | { key: number; error: Error };

export type AccountData<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; error: Error };

/**
 * Loads something personal with the shopper's token (pages under the account shell, so
 * someone is signed in). `load` must be stable, e.g. wrapped in useCallback.
 */
export function useAccountData<T>(load: (token: string, signal: AbortSignal) => Promise<T>) {
  const { getToken } = useCustomerSession();
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<Loaded<T> | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getToken()
      .then((token) => {
        if (!token) throw new Error("Your session ended. Sign in again.");
        return load(token, controller.signal);
      })
      .then((data) => setLoaded({ key: attempt, data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoaded({ key: attempt, error: error instanceof Error ? error : new Error("Something went wrong") });
      });
    return () => controller.abort();
  }, [getToken, load, attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  let state: AccountData<T> = { status: "loading" };
  if (loaded && loaded.key === attempt) {
    state = "data" in loaded ? { status: "ready", data: loaded.data } : { status: "error", error: loaded.error };
  }
  return { state, reload };
}
