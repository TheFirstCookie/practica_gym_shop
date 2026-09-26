import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CustomerSessionProvider, useCustomerSession } from "@/app/components/customer-session";
import type { AuthLanding } from "@/lib/auth-landing";
import { getAuthLanding, getSupabaseBrowserClient } from "@/lib/supabase/client";

vi.mock("@/lib/supabase/client", () => ({ getSupabaseBrowserClient: vi.fn(), getAuthLanding: vi.fn() }));

type Listener = (event: string, session: unknown) => void;

const session = {
  access_token: "token",
  user: { id: "u1", email: "sam@example.com", user_metadata: { full_name: "Sam Shopper" }, new_email: null }
};

/** A stand-in for Supabase's auth client: records calls, answers with no error by default. */
function fakeAuth(initialSession: unknown) {
  let listener: Listener = () => {};
  const ok = { data: {}, error: null };
  const auth = {
    onAuthStateChange: vi.fn((callback: Listener) => {
      listener = callback;
      queueMicrotask(() => callback("INITIAL_SESSION", initialSession));
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    }),
    signInWithPassword: vi.fn(async () => ok),
    signUp: vi.fn(async () => ({ data: { session: null }, error: null })),
    signInWithOtp: vi.fn(async () => ok),
    resetPasswordForEmail: vi.fn(async () => ok),
    resend: vi.fn(async () => ok),
    updateUser: vi.fn(async () => ok),
    signOut: vi.fn(async () => ok),
    getSession: vi.fn(async () => ({ data: { session: initialSession } }))
  };
  vi.mocked(getSupabaseBrowserClient).mockReturnValue({ auth } as never);
  return { auth, emit: (event: string, value: unknown) => listener(event, value) };
}

/** Mounts the provider and waits until it knows whether someone is signed in. */
async function mount(landing: AuthLanding | null = null) {
  vi.mocked(getAuthLanding).mockReturnValue(landing);
  const hook = renderHook(() => useCustomerSession(), { wrapper: CustomerSessionProvider });
  await waitFor(() => expect(hook.result.current.state.status).toMatch(/signed-(in|out)/));
  return hook.result;
}

beforeEach(() => {
  vi.mocked(getSupabaseBrowserClient).mockReset();
});

describe("CustomerSessionProvider emails", () => {
  it("asks for a confirmation link back to the account on sign-up", async () => {
    const { auth } = fakeAuth(null);
    const result = await mount();

    const outcome = await result.current.signUp({ name: "Ana Buyer", email: "ana@example.com", password: "long-enough" });

    expect(outcome).toEqual({ status: "confirm-email" });
    expect(auth.signUp).toHaveBeenCalledWith({
      email: "ana@example.com",
      password: "long-enough",
      options: { data: { full_name: "Ana Buyer" }, emailRedirectTo: `${window.location.origin}/account` }
    });
  });

  it("sends sign-in links to existing accounts only, without revealing who has one", async () => {
    const { auth } = fakeAuth(null);
    const result = await mount();

    auth.signInWithOtp.mockResolvedValueOnce({ data: {}, error: { code: "otp_disabled", message: "Signups not allowed for otp" } } as never);
    expect(await result.current.sendSignInLink("nobody@example.com", "/product/mat")).toBeNull();
    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      email: "nobody@example.com",
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/product/mat` }
    });
  });

  it("points password-reset emails at the reset page", async () => {
    const { auth } = fakeAuth(null);
    const result = await mount();

    await result.current.sendPasswordReset("sam@example.com");

    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("sam@example.com", {
      redirectTo: `${window.location.origin}/account/reset-password`
    });
  });

  it("explains the email cooldown in plain words", async () => {
    const { auth } = fakeAuth(null);
    const result = await mount();

    auth.resend.mockResolvedValueOnce({ data: {}, error: { code: "over_email_send_rate_limit", message: "…" } } as never);
    expect(await result.current.resendConfirmation("ana@example.com")).toMatch(/Wait a minute/);
  });

  it("checks the current password before changing it", async () => {
    const { auth } = fakeAuth(session);
    const result = await mount();

    auth.signInWithPassword.mockResolvedValueOnce({ data: {}, error: { code: "invalid_credentials", message: "…" } } as never);
    expect(await result.current.changePassword("wrong", "new-password-1")).toBe("Your current password isn't right.");
    expect(auth.updateUser).not.toHaveBeenCalled();

    expect(await result.current.changePassword("right", "new-password-1")).toBeNull();
    expect(auth.signInWithPassword).toHaveBeenLastCalledWith({ email: "sam@example.com", password: "right" });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "new-password-1" });
  });

  it("sends the email-change confirmation back to Settings", async () => {
    const { auth } = fakeAuth(session);
    const result = await mount();

    await result.current.changeEmail("new@example.com");

    expect(auth.updateUser).toHaveBeenCalledWith(
      { email: "new@example.com" },
      { emailRedirectTo: `${window.location.origin}/account/settings` }
    );
  });

  it("lets a password-reset link set a new password, once", async () => {
    fakeAuth(session);
    const result = await mount({ type: "recovery", error: null, message: null });
    expect(result.current.recovering).toBe(true);

    await act(async () => {
      expect(await result.current.setNewPassword("brand-new-pass")).toBeNull();
    });

    expect(result.current.recovering).toBe(false);
    expect(result.current.landing?.message).toMatch(/new password is saved/);
  });

  it("knows an admin from the role Supabase keeps in app_metadata", async () => {
    fakeAuth({ ...session, user: { ...session.user, app_metadata: { role: "admin" } } });
    const result = await mount();
    expect(result.current.customer?.isAdmin).toBe(true);
  });

  it("treats everyone else as a shopper", async () => {
    fakeAuth(session);
    const result = await mount();
    expect(result.current.customer?.isAdmin).toBe(false);
  });

  it("isn't in recovery mode after an ordinary sign-in", async () => {
    const { emit } = fakeAuth(null);
    const result = await mount();

    act(() => emit("SIGNED_IN", session));

    await waitFor(() => expect(result.current.state.status).toBe("signed-in"));
    expect(result.current.recovering).toBe(false);
  });
});
