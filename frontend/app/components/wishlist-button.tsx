"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Heart } from "lucide-react";
import { signInHref, useCustomerSession } from "./customer-session";
import { useWishlist } from "./wishlist-provider";

type WishlistButtonProps = {
  slug: string;
  name: string;
  /** "icon": round heart laid over a product card. "full": button with a label. */
  variant?: "icon" | "full";
};

/** Saves a product to the shopper's wishlist; signed-out shoppers are sent to sign in. */
export function WishlistButton({ slug, name, variant = "icon" }: WishlistButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useCustomerSession();
  const wishlist = useWishlist();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Accounts need Supabase; without it the heart would lead nowhere.
  if (state.status === "unconfigured") return null;

  const saved = wishlist.has(slug);
  // A toggle button: aria-pressed says whether it's saved, so the label stays the same.
  const label = `Save ${name} to your wishlist`;

  async function onClick() {
    if (state.status === "signed-out") {
      router.push(signInHref(pathname));
      return;
    }
    setPending(true);
    setError(null);
    const message = await wishlist.toggle(slug);
    setPending(false);
    setError(message);
  }

  const busy = pending || state.status === "loading" || (state.status === "signed-in" && !wishlist.ready);

  return (
    <>
      <button
        type="button"
        className={variant === "icon" ? "wishlist-icon" : "button secondary wishlist-full"}
        aria-label={variant === "icon" ? label : undefined}
        aria-pressed={saved}
        title={variant === "icon" ? (saved ? "Saved to your wishlist" : "Save to your wishlist") : undefined}
        disabled={busy}
        onClick={onClick}
      >
        <Heart size={18} aria-hidden="true" fill={saved ? "currentColor" : "none"} />
        {variant === "full" && <span>{saved ? "Saved to wishlist" : "Save to wishlist"}</span>}
      </button>
      {error && variant === "full" && (
        <p className="cart-note wishlist-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
