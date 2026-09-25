import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardView } from "./components/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard"
};

export default function AdminDashboardPage() {
  // The reporting window lives in the URL (?days=7), read with useSearchParams.
  return (
    <Suspense>
      <DashboardView />
    </Suspense>
  );
}
