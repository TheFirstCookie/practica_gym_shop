import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "./components/site-footer";
import { CartProvider } from "./components/cart-provider";
import { bodyFont, displayFont } from "./fonts";

export const metadata: Metadata = {
  title: {
    default: "ForgeFit Supply",
    template: "%s | ForgeFit Supply"
  },
  description: "Gym and sport equipment storefront draft"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <CartProvider>
          {children}
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
