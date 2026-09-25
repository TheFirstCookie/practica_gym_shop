import type { Metadata } from "next";
import { AccountPage } from "../components/account-page";
import { WishlistView } from "../components/wishlist-view";

export const metadata: Metadata = {
  title: "Wishlist"
};

export default function WishlistPage() {
  return (
    <AccountPage>
      <WishlistView />
    </AccountPage>
  );
}
