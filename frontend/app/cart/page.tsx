import type { Metadata } from "next";
import { SiteHeader } from "@/app/components/site-header";
import { CartView } from "@/app/components/cart-view";

export const metadata: Metadata = {
  title: "Cart"
};

export default function CartPage() {
  return (
    <main>
      <SiteHeader compact />
      <CartView />
    </main>
  );
}
