import type { Metadata } from "next";
import { NotFoundContent } from "./components/not-found-content";
import { ShopProviders } from "./components/shop-providers";
import { SiteFooter } from "./components/site-footer";

export const metadata: Metadata = {
  title: "Page not found"
};

// For URLs that match no route. These render outside the (shop) layout, so its footer and
// providers are added here; a missing product or category uses app/(shop)/not-found.tsx instead.
export default function NotFound() {
  return (
    <ShopProviders>
      <NotFoundContent />
      <SiteFooter />
    </ShopProviders>
  );
}
