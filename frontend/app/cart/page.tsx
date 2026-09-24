import { SiteHeader } from "@/app/components/site-header";
import { CartView } from "@/app/components/cart-view";

export default function CartPage() {
  return (
    <main>
      <SiteHeader compact />
      <CartView />
    </main>
  );
}
