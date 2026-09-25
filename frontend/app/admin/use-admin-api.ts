"use client";

import { useCallback } from "react";
import { ApiError } from "@/lib/api/client";
import { refreshStorefront } from "./actions";
import { useAdminSession } from "./admin-session";

/**
 * Runs admin API calls with a fresh token. A 401 means the session ended (it expired, or
 * you signed out in another tab), so it signs out here too and the guard shows the login.
 */
export function useAdminApi() {
  const { getToken, signOut } = useAdminSession();

  const run = useCallback(
    async <T,>(call: (token: string) => Promise<T>): Promise<T> => {
      try {
        return await call(await getToken());
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) await signOut();
        throw error;
      }
    },
    [getToken, signOut]
  );

  // Best effort: if it fails, the storefront still catches up within a minute.
  const refreshShop = useCallback(async () => {
    try {
      await refreshStorefront(await getToken());
    } catch (error) {
      console.warn("Couldn't refresh the storefront cache", error);
    }
  }, [getToken]);

  return { run, refreshShop };
}
