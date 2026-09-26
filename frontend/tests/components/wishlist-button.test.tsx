import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCustomerSession, type CustomerSessionState } from "@/app/components/customer-session";
import { WishlistButton } from "@/app/components/wishlist-button";
import { useWishlist } from "@/app/components/wishlist-provider";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/product/competition-kettlebell"
}));
vi.mock("@/app/components/customer-session", { spy: true });
vi.mock("@/app/components/wishlist-provider", { spy: true });

function setup(state: CustomerSessionState, saved: string[] = []) {
  const toggle = vi.fn().mockResolvedValue(null);
  vi.mocked(useCustomerSession).mockReturnValue({ state } as ReturnType<typeof useCustomerSession>);
  vi.mocked(useWishlist).mockReturnValue({ ready: true, has: (slug) => saved.includes(slug), toggle });
  return { toggle };
}

const signedIn: CustomerSessionState = {
  status: "signed-in",
  customer: { id: "u1", email: "sam@example.com", fullName: "Sam Shopper" }
};

beforeEach(() => push.mockReset());

describe("WishlistButton", () => {
  it("sends signed-out shoppers to sign in, then back to this page", async () => {
    const { toggle } = setup({ status: "signed-out" });
    render(<WishlistButton slug="competition-kettlebell" name="Competition Kettlebell" />);

    await userEvent.click(screen.getByRole("button", { name: "Save Competition Kettlebell to your wishlist" }));

    expect(push).toHaveBeenCalledWith("/account/sign-in?next=%2Fproduct%2Fcompetition-kettlebell");
    expect(toggle).not.toHaveBeenCalled();
  });

  it("saves and unsaves for a signed-in shopper", async () => {
    const { toggle } = setup(signedIn, ["competition-kettlebell"]);
    render(<WishlistButton slug="competition-kettlebell" name="Competition Kettlebell" />);

    const button = screen.getByRole("button", { name: /Competition Kettlebell/ });
    expect(button).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(button);
    expect(toggle).toHaveBeenCalledWith("competition-kettlebell");
  });

  it("is hidden when accounts aren't configured", () => {
    setup({ status: "unconfigured" });
    const { container } = render(<WishlistButton slug="mat" name="Mat" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the reason when saving fails", async () => {
    const { toggle } = setup(signedIn);
    toggle.mockResolvedValue("Couldn't update your wishlist.");
    render(<WishlistButton slug="mat" name="Mat" variant="full" />);

    await userEvent.click(screen.getByRole("button", { name: "Save to wishlist" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't update your wishlist.");
  });
});
