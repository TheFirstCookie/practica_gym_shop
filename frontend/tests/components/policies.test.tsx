import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PrivacyPage from "@/app/(shop)/(legal)/privacy/page";
import ShippingReturnsPage from "@/app/(shop)/(legal)/shipping-returns/page";
import TermsPage from "@/app/(shop)/(legal)/terms/page";
import { FaqSection } from "@/app/components/faq-section";
import { SiteFooter } from "@/app/components/site-footer";
import sitemap from "@/app/sitemap";
import { getCategories, getNavCategories, listProducts } from "@/lib/api/catalog";
import { STORE_EMAIL } from "@/lib/store-info";

// The real header and catalog call the API; these tests are about the policy content.
vi.mock("@/app/components/site-header", () => ({ SiteHeader: () => <header>Header</header> }));
vi.mock("@/lib/api/catalog", { spy: true });

const PAGES = [
  { Page: ShippingReturnsPage, title: "Shipping & returns", path: "/shipping-returns" },
  { Page: TermsPage, title: "Terms of sale", path: "/terms" },
  { Page: PrivacyPage, title: "Privacy policy", path: "/privacy" }
];

describe.each(PAGES)("$title page", ({ Page, title, path }) => {
  it("has its heading, the demo notice and a way to reach us", () => {
    render(<Page />);
    expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
    expect(screen.getByText(/portfolio project/)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: STORE_EMAIL })[0]).toHaveAttribute("href", `mailto:${STORE_EMAIL}`);
  });

  it("marks itself in the tabs between the policies", () => {
    render(<Page />);
    const tabs = within(screen.getByRole("navigation", { name: "Policies" }));
    expect(tabs.getAllByRole("link")).toHaveLength(3);
    expect(tabs.getByRole("link", { name: title })).toHaveAttribute("aria-current", "page");
    expect(tabs.getByRole("link", { name: title })).toHaveAttribute("href", path);
  });
});

describe("returns information", () => {
  it("tells shoppers how to return something, without a self-service flow the shop doesn't have", () => {
    render(<FaqSection />);
    const answer = screen.getByText(/can be returned within 30 days/);
    expect(answer).toHaveTextContent(STORE_EMAIL);
    expect(answer).not.toHaveTextContent(/start a return from/i);
    expect(screen.getByRole("link", { name: "Shipping & returns" })).toHaveAttribute("href", "/shipping-returns");
  });

  it("explains returns step by step on the policy page", () => {
    render(<ShippingReturnsPage />);
    const returns = screen.getByRole("heading", { name: "Returns" }).closest("section")!;
    expect(within(returns).getAllByRole("listitem")).toHaveLength(3);
  });
});

describe("footer", () => {
  it("links to every policy page", async () => {
    vi.mocked(getNavCategories).mockResolvedValue([]);
    render(await SiteFooter());

    expect(screen.getByRole("link", { name: /Shipping & returns/ })).toHaveAttribute("href", "/shipping-returns");
    const legal = within(screen.getByRole("navigation", { name: "Legal" }));
    expect(legal.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
    expect(legal.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
  });
});

describe("sitemap", () => {
  it("lists the policy pages even when the API is asleep", async () => {
    vi.mocked(getCategories).mockRejectedValue(new Error("API asleep"));
    vi.mocked(listProducts).mockRejectedValue(new Error("API asleep"));
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const urls = (await sitemap()).map((entry) => new URL(entry.url).pathname);

    expect(urls).toEqual(["/", "/shipping-returns", "/terms", "/privacy"]);
  });
});
