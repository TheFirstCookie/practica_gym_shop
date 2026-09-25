import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductTable } from "../components/product-table";

export const metadata: Metadata = {
  title: "Products"
};

export default function AdminProductsPage() {
  // The table keeps its filters in the URL (useSearchParams), which needs a Suspense boundary.
  return (
    <Suspense>
      <ProductTable />
    </Suspense>
  );
}
