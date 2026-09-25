import { CustomerSessionProvider } from "./customer-session";
import { WishlistProvider } from "./wishlist-provider";

/** The shopper's session and wishlist, for every page that shows the storefront header. */
export function ShopProviders({ children }: { children: React.ReactNode }) {
  return (
    <CustomerSessionProvider>
      <WishlistProvider>{children}</WishlistProvider>
    </CustomerSessionProvider>
  );
}
