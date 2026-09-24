import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "./components/site-footer";

export const metadata: Metadata = {
  title: "ForgeFit Supply",
  description: "Gym and sport equipment storefront draft"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
