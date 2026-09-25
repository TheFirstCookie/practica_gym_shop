"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { getWishlist } from "@/lib/api/account";
import { ProductGrid } from "@/app/components/product-grid";
import { useWishlist } from "@/app/components/wishlist-provider";
import { LoadError } from "./load-error";
import { useAccountData } from "./use-account-data";

/** Saved products, newest first. Un-hearting one takes it off the list right away. */
export function WishlistView() {
  const { state, reload } = useAccountData(getWishlist);
  const wishlist = useWishlist();

  if (state.status === "loading") return <p className="account-muted">Loading your wishlist…</p>;
  if (state.status === "error") return <LoadError message={state.error.message} onRetry={reload} />;

  const items = wishlist.ready ? state.data.filter((item) => wishlist.has(item.slug)) : state.data;

  if (items.length === 0) {
    return (
      <div className="account-empty">
        <Heart size={30} aria-hidden="true" />
        <h2>Your wishlist is empty</h2>
        <p className="account-muted">Tap the heart on any product to save it here for later.</p>
        <Link href="/#catalog" className="button primary">
          Browse the gear
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="account-muted account-count">
        {items.length} saved {items.length === 1 ? "product" : "products"}. Prices and stock are live.
      </p>
      <ProductGrid products={items} clearHref="/#catalog" />
    </>
  );
}
