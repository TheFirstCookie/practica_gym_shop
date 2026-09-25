import { ShopProviders } from "@/app/components/shop-providers";
import { SiteFooter } from "@/app/components/site-footer";

// Storefront chrome. Pages render their own header (it varies: compact, prefilled search);
// the footer and the shopper's session are shared. The admin area sits outside this group,
// so it gets neither, and has its own sign-in apart from the shopper's.
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <ShopProviders>
      {children}
      <SiteFooter />
    </ShopProviders>
  );
}
