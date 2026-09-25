import type { Metadata } from "next";
import { NotFoundContent } from "./components/not-found-content";
import { SiteFooter } from "./components/site-footer";

export const metadata: Metadata = {
  title: "Page not found"
};

// For URLs that match no route. These render outside the (shop) layout, so the footer is
// added here; a missing product or category uses app/(shop)/not-found.tsx instead.
export default function NotFound() {
  return (
    <>
      <NotFoundContent />
      <SiteFooter />
    </>
  );
}
