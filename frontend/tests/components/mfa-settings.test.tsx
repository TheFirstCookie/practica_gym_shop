import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ listFactors: vi.fn(), enroll: vi.fn(), unenroll: vi.fn(), challengeAndVerify: vi.fn() }));
vi.mock("@/lib/supabase/client", () => {
  const client = { auth: { mfa: mock } };
  return { getSupabaseBrowserClient: () => client };
});
import { MfaSettings } from "@/app/components/mfa-settings";
const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path fill="#000"/></svg>';
beforeEach(() => {
  mock.listFactors.mockResolvedValue({ data: { all: [], totp: [] }, error: null });
  mock.enroll.mockResolvedValue({ data: { id: "factor", totp: { qr_code: `data:image/svg+xml;utf-8,${svg}` } }, error: null });
  mock.unenroll.mockResolvedValue({ error: null });
  mock.challengeAndVerify.mockResolvedValue({ error: null });
});
it("renders the SDK's data-URI QR correctly and verifies enrollment", async () => {
  const onVerified = vi.fn();
  render(<MfaSettings onVerified={onVerified} />);
  const enroll = screen.getByRole("button", { name: "Enable authenticator" });
  await waitFor(() => expect(enroll).toBeEnabled());
  await userEvent.click(enroll);
  const image = await screen.findByAltText("Authenticator enrollment QR code");
  expect(decodeURIComponent(image.getAttribute("src")!.split(",")[1]!)).toBe(svg);
  await userEvent.type(screen.getByLabelText("Authenticator code"), "123456");
  await userEvent.click(screen.getByRole("button", { name: "Verify code" }));
  expect(mock.challengeAndVerify).toHaveBeenCalledWith({ factorId: "factor", code: "123456" });
  expect(onVerified).toHaveBeenCalledOnce();
});
it("cleans up abandoned enrollment without removing a verified factor", async () => {
  mock.listFactors.mockResolvedValue({ data: { all: [{ id: "abandoned", factor_type: "totp", status: "unverified" }], totp: [] }, error: null });
  render(<MfaSettings />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Enable authenticator" })).toBeEnabled());
  await userEvent.click(screen.getByRole("button", { name: "Enable authenticator" }));
  await screen.findByAltText("Authenticator enrollment QR code");
  expect(mock.unenroll).toHaveBeenCalledWith({ factorId: "abandoned" });
});
