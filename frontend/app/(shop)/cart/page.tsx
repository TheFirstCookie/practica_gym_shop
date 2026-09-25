import type { Metadata } from "next";
import type { SearchParams } from "@/lib/filters";
import { SiteHeader } from "@/app/components/site-header";
import { CartView } from "@/app/components/cart-view";

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false }
};

type CartPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function CartPage({ searchParams }: CartPageProps) {
  // Stripe's cancel link brings shoppers back to /cart?checkout=cancelled.
  const { checkout } = await searchParams;

  return (
    <main>
      <SiteHeader compact />
      <CartView checkoutCancelled={checkout === "cancelled"} />
    </main>
  );
}
