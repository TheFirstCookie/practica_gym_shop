import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthForm } from "@/app/(shop)/account/components/auth-form";
import { useCustomerSession, type CustomerSessionState } from "@/app/components/customer-session";

const replace = vi.fn();
let search = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => search
}));
vi.mock("@/app/components/customer-session", { spy: true });

function setup(state: CustomerSessionState = { status: "signed-out" }) {
  const session = {
    state,
    signIn: vi.fn().mockResolvedValue(null),
    signUp: vi.fn().mockResolvedValue({ status: "signed-in" })
  };
  vi.mocked(useCustomerSession).mockReturnValue(session as unknown as ReturnType<typeof useCustomerSession>);
  return session;
}

beforeEach(() => {
  replace.mockReset();
  search = new URLSearchParams();
});

describe("AuthForm", () => {
  it("signs in with the trimmed email", async () => {
    const session = setup();
    render(<AuthForm />);

    await userEvent.type(screen.getByLabelText("Email"), " sam@example.com ");
    await userEvent.type(screen.getByLabelText("Password"), "secret-pass");
    // The first "Sign in" is the tab; the last is the submit button.
    await userEvent.click(screen.getAllByRole("button", { name: "Sign in" }).at(-1)!);

    expect(session.signIn).toHaveBeenCalledWith("sam@example.com", "secret-pass");
  });

  it("shows why signing in failed", async () => {
    const session = setup();
    session.signIn.mockResolvedValue("Wrong email or password.");
    render(<AuthForm />);

    await userEvent.type(screen.getByLabelText("Email"), "sam@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "nope");
    await userEvent.click(screen.getAllByRole("button", { name: "Sign in" }).at(-1)!);

    expect(await screen.findByRole("alert")).toHaveTextContent("Wrong email or password.");
  });

  it("creates an account with the name for reviews", async () => {
    search = new URLSearchParams("mode=create");
    const session = setup();
    render(<AuthForm />);

    await userEvent.type(screen.getByLabelText("Name"), "Ana Buyer");
    await userEvent.type(screen.getByLabelText("Email"), "ana@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "long-enough");
    await userEvent.click(screen.getAllByRole("button", { name: "Create account" }).at(-1)!);

    expect(session.signUp).toHaveBeenCalledWith({ name: "Ana Buyer", email: "ana@example.com", password: "long-enough" });
  });

  it("says to check the inbox when Supabase wants the email confirmed", async () => {
    search = new URLSearchParams("mode=create");
    const session = setup();
    session.signUp.mockResolvedValue({ status: "confirm-email" });
    render(<AuthForm />);

    await userEvent.type(screen.getByLabelText("Name"), "Ana Buyer");
    await userEvent.type(screen.getByLabelText("Email"), "ana@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "long-enough");
    await userEvent.click(screen.getAllByRole("button", { name: "Create account" }).at(-1)!);

    expect(await screen.findByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
  });

  it("returns a signed-in shopper to where they came from", () => {
    search = new URLSearchParams("next=/product/mat");
    setup({ status: "signed-in", customer: { id: "u1", email: "sam@example.com", fullName: null } });
    render(<AuthForm />);
    expect(replace).toHaveBeenCalledWith("/product/mat");
  });

  it("never redirects to another website", () => {
    search = new URLSearchParams("next=//evil.example/steal");
    setup({ status: "signed-in", customer: { id: "u1", email: "sam@example.com", fullName: null } });
    render(<AuthForm />);
    expect(replace).toHaveBeenCalledWith("/account");
  });
});
