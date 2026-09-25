import type { Metadata } from "next";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { CartProvider } from "./components/cart-provider";
import { bodyFont, displayFont } from "./fonts";

export const metadata: Metadata = {
  // Resolves relative canonical and image URLs in every page's metadata.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME}: gym and sport equipment`,
    template: `%s | ${SITE_NAME}`
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US"
  },
  twitter: {
    card: "summary_large_image"
  }
};

// Shared by the storefront, app/(shop), and the admin area, app/admin. Each adds its own chrome.
export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
