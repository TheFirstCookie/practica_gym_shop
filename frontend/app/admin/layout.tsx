import type { Metadata } from "next";
import "./admin.css";
import { AdminSessionProvider } from "./admin-session";
import { AdminShell } from "./admin-shell";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | ForgeFit Admin"
  },
  // Nothing here is for search engines.
  robots: { index: false, follow: false }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminSessionProvider>
      <AdminShell>{children}</AdminShell>
    </AdminSessionProvider>
  );
}
