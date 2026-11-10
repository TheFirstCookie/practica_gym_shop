import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
const session = vi.hoisted(() => ({ customer: { id: "A" }, getToken: vi.fn(async () => "A-token") }));
vi.mock("@/app/components/customer-session", () => ({ useCustomerSession: () => session }));
import { useAccountData } from "@/app/(shop)/account/components/use-account-data";
beforeEach(() => { session.customer = { id: "A" }; session.getToken.mockResolvedValue("A-token"); });
describe("account result identity", () => {
  it("hides previous personal data immediately and reloads on a direct account switch", async () => {
    let resolveB!: (value: string) => void;
    const load = vi.fn((token: string) => token === "A-token" ? Promise.resolve("A-private") : new Promise<string>((resolve) => { resolveB = resolve; }));
    const hook = renderHook(() => useAccountData(load));
    await waitFor(() => expect(hook.result.current.state).toEqual({ status: "ready", data: "A-private" }));
    session.customer = { id: "B" }; session.getToken.mockResolvedValue("B-token"); hook.rerender();
    expect(hook.result.current.state.status).toBe("loading");
    await waitFor(() => expect(load).toHaveBeenCalledWith("B-token", expect.any(AbortSignal)));
    await act(async () => resolveB("B-private"));
    expect(hook.result.current.state).toEqual({ status: "ready", data: "B-private" });
  });
  it("rejects obsolete responses even when their loader ignores abort", async () => {
    let resolveA!: (value: string) => void;
    const loadA = vi.fn(() => new Promise<string>((resolve) => { resolveA = resolve; }));
    const loadB = vi.fn(async () => "B");
    const hook = renderHook(({ load }) => useAccountData(load), { initialProps: { load: loadA } });
    await waitFor(() => expect(loadA).toHaveBeenCalled());
    hook.rerender({ load: loadB });
    await waitFor(() => expect(hook.result.current.state).toEqual({ status: "ready", data: "B" }));
    await act(async () => resolveA("A"));
    expect(hook.result.current.state).toEqual({ status: "ready", data: "B" });
  });
});
