import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AccountLink } from "@/app/components/account-link";
import { useCustomerSession, type Customer } from "@/app/components/customer-session";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/app/components/customer-session", { spy: true });

function signedInAs(customer: Customer) {
  vi.mocked(useCustomerSession).mockReturnValue({
    state: { status: "signed-in", customer },
    signOut: vi.fn()
  } as unknown as ReturnType<typeof useCustomerSession>);
}

const base = { id: "u1", email: "sam@example.com", fullName: "Sam Shopper", pendingEmail: null };

describe("header account menu", () => {
  it("links admins to the dashboard", async () => {
    signedInAs({ ...base, isAdmin: true });
    render(<AccountLink />);

    await userEvent.click(screen.getByRole("button", { name: "Account: Sam" }));

    expect(screen.getByRole("link", { name: "Admin dashboard" })).toHaveAttribute("href", "/admin");
  });

  it("doesn't show the dashboard to shoppers", async () => {
    signedInAs({ ...base, isAdmin: false });
    render(<AccountLink />);

    await userEvent.click(screen.getByRole("button", { name: "Account: Sam" }));

    expect(screen.getByRole("link", { name: "Orders" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Admin dashboard" })).not.toBeInTheDocument();
  });
});
