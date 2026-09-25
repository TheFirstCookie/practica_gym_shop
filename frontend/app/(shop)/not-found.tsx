import type { Metadata } from "next";
import { NotFoundContent } from "@/app/components/not-found-content";

export const metadata: Metadata = {
  title: "Page not found"
};

// For notFound() in storefront pages (unknown product or category). The (shop) layout
// around it already adds the footer.
export default function ShopNotFound() {
  return <NotFoundContent />;
}
