import type { Metadata } from "next";
import "./account.css";

export const metadata: Metadata = {
  title: "Your account",
  // Personal pages: nothing here is for search engines.
  robots: { index: false, follow: false }
};

// Each page renders its own header (like the rest of the shop), so opening one from far down
// another page lands at the top with the header in view.
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
