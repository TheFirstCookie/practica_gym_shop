import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderTable } from "../components/order-table";

export const metadata: Metadata = {
  title: "Orders"
};

export default function AdminOrdersPage() {
  // The table keeps its filters in the URL (useSearchParams), which needs a Suspense boundary.
  return (
    <Suspense>
      <OrderTable />
    </Suspense>
  );
}
