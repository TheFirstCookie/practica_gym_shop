import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthForm } from "@/app/(shop)/account/components/auth-form";
import { ForgotPasswordForm } from "@/app/(shop)/account/components/forgot-password-form";
import { ResetPasswordForm } from "@/app/(shop)/account/components/reset-password-form";
import { SettingsForm } from "@/app/(shop)/account/components/settings-form";
import { useCustomerSession, type CustomerSessionState } from "@/app/components/customer-session";

const replace = vi.fn();
const push = vi.fn();
let search = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push }),
  useSearchParams: () => search
}));
vi.mock("@/app/components/customer-session", { spy: true });

const customer = { id: "u1", email: "sam@example.com", fullName: "Sam Shopper", pendingEmail: null, isAdmin: false };

function setup(overrides: Partial<ReturnType<typeof useCustomerSession>> = {}, state?: CustomerSessionState) {
  const session = {
    state: state ?? { status: "signed-out" },
    customer: state?.status === "signed-in" ? state.customer : null,
    landing: null,
    recovering: false,
    dismissLanding: vi.fn(),
    signIn: vi.fn().mockResolvedValue(null),
    signUp: vi.fn().mockResolvedValue({ status: "confirm-email" }),
    resendConfirmation: vi.fn().mockResolvedValue(null),
    sendSignInLink: vi.fn().mockResolvedValue(null),
    sendPasswordReset: vi.fn().mockResolvedValue(null),
    setNewPassword: vi.fn().mockResolvedValue(null),
    changePassword: vi.fn().mockResolvedValue(null),
    changeEmail: vi.fn().mockResolvedValue(null),
    updateName: vi.fn().mockResolvedValue(null),
    signOut: vi.fn(),
    getToken: vi.fn(),
    ...overrides
  };
  vi.mocked(useCustomerSession).mockReturnValue(session as ReturnType<typeof useCustomerSession>);
  return session;
}

beforeEach(() => {
  replace.mockReset();
  push.mockReset();
  search = new URLSearchParams();
});

describe("sign-in page emails", () => {
  it("emails a one-time sign-in link that returns to where the shopper was", async () => {
    search = new URLSearchParams("next=/product/mat");
    const session = setup();
    render(<AuthForm />);

    await userEvent.type(screen.getByLabelText("Email"), "sam@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Email me a sign-in link" }));

    expect(session.sendSignInLink).toHaveBeenCalledWith("sam@example.com", "/product/mat");
    expect(await screen.findByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
    // Supabase allows one email a minute, so resending waits.
    expect(screen.getByRole("button", { name: /Send again in \d+s/ })).toBeDisabled();
  });

  it("asks for the email before sending a link", async () => {
    const session = setup();
    render(<AuthForm />);

    await userEvent.click(screen.getByRole("button", { name: "Email me a sign-in link" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Enter your email address first");
    expect(session.sendSignInLink).not.toHaveBeenCalled();
  });

  it("offers a new confirmation email when the address was never confirmed", async () => {
    const session = setup({
      signIn: vi.fn().mockResolvedValue("Confirm your email first: open the link we sent you, or send it again below.")
    });
    render(<AuthForm />);

    await userEvent.type(screen.getByLabelText("Email"), "ana@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "long-enough");
    await userEvent.click(screen.getAllByRole("button", { name: "Sign in" }).at(-1)!);
    await userEvent.click(await screen.findByRole("button", { name: "Send the confirmation email again" }));

    expect(session.resendConfirmation).toHaveBeenCalledWith("ana@example.com");
    expect(await screen.findByText(/a link to confirm your account/)).toBeInTheDocument();
  });

  it("links to the password reset", () => {
    setup();
    render(<AuthForm />);
    expect(screen.getByRole("link", { name: "Forgot your password?" })).toHaveAttribute("href", "/account/forgot-password");
  });
});

describe("forgot password", () => {
  it("sends the reset link and says to check the inbox", async () => {
    const session = setup();
    render(<ForgotPasswordForm />);

    await userEvent.type(screen.getByLabelText("Email"), " sam@example.com ");
    await userEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(session.sendPasswordReset).toHaveBeenCalledWith("sam@example.com");
    expect(await screen.findByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
  });
});

describe("reset password page", () => {
  it("explains an expired link instead of showing the form", () => {
    setup({ landing: { type: null, error: "That link has expired or was already used.", message: null } });
    render(<ResetPasswordForm />);

    expect(screen.getByRole("heading", { name: "Link expired" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("expired");
    expect(screen.getByRole("link", { name: "Send a new link" })).toHaveAttribute("href", "/account/forgot-password");
  });

  it("saves the new password and opens the account", async () => {
    const session = setup({ recovering: true }, { status: "signed-in", customer });
    render(<ResetPasswordForm />);

    await userEvent.type(screen.getByLabelText("New password"), "brand-new-pass");
    await userEvent.type(screen.getByLabelText("Repeat it"), "brand-new-typo");
    await userEvent.click(screen.getByRole("button", { name: "Save new password" }));
    expect(screen.getByRole("alert")).toHaveTextContent("don't match");
    expect(session.setNewPassword).not.toHaveBeenCalled();

    await userEvent.clear(screen.getByLabelText("Repeat it"));
    await userEvent.type(screen.getByLabelText("Repeat it"), "brand-new-pass");
    await userEvent.click(screen.getByRole("button", { name: "Save new password" }));

    expect(session.setNewPassword).toHaveBeenCalledWith("brand-new-pass");
    expect(replace).toHaveBeenCalledWith("/account");
  });
});

describe("settings", () => {
  it("needs the current password to set a new one", async () => {
    const session = setup({}, { status: "signed-in", customer });
    render(<SettingsForm />);

    await userEvent.type(screen.getByLabelText("Current password"), "old-password");
    await userEvent.type(screen.getByLabelText("New password"), "new-password-1");
    await userEvent.type(screen.getByLabelText("Repeat it"), "new-password-1");
    await userEvent.click(screen.getByRole("button", { name: "Change password" }));

    expect(session.changePassword).toHaveBeenCalledWith("old-password", "new-password-1");
    expect(await screen.findByText("Password changed.")).toBeInTheDocument();
  });

  it("changes the email only after confirmation, and shows the pending address", async () => {
    const session = setup({}, { status: "signed-in", customer: { ...customer, pendingEmail: "new@example.com" } });
    render(<SettingsForm />);

    expect(screen.getByText(/Waiting for confirmation of/)).toHaveTextContent("new@example.com");

    await userEvent.type(screen.getByLabelText("New email"), "sam@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Change email" }));
    expect(screen.getByRole("alert")).toHaveTextContent("already your email");

    await userEvent.clear(screen.getByLabelText("New email"));
    await userEvent.type(screen.getByLabelText("New email"), "sam.new@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Change email" }));

    expect(session.changeEmail).toHaveBeenCalledWith("sam.new@example.com");
    expect(await screen.findByText("Check your inbox to confirm the change.")).toBeInTheDocument();
  });
});
