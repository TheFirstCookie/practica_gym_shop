import { SiteFooter } from "@/app/components/site-footer";

// Storefront chrome. Pages render their own header (it varies: compact, prefilled search);
// the footer is shared. The admin area sits outside this group, so it gets neither.
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}
