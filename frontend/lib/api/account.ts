import { apiRequest } from "./client";
import type { CustomerOrder, DataEnvelope, WishlistItem } from "./types";

// The signed-in shopper's own data. Every call needs their access token; nothing is
// cached, since it's personal and changes as they shop.
const noStore = { cache: "no-store" as const };

export async function listMyOrders(token: string, signal?: AbortSignal): Promise<CustomerOrder[]> {
  const { data } = await apiRequest<DataEnvelope<CustomerOrder[]>>("/account/orders", { ...noStore, token, signal });
  return data;
}

export async function getMyOrder(token: string, id: string): Promise<CustomerOrder> {
  const { data } = await apiRequest<DataEnvelope<CustomerOrder>>(`/account/orders/${encodeURIComponent(id)}`, {
    ...noStore,
    token
  });
  return data;
}

export async function getWishlist(token: string, signal?: AbortSignal): Promise<WishlistItem[]> {
  const { data } = await apiRequest<DataEnvelope<WishlistItem[]>>("/account/wishlist", { ...noStore, token, signal });
  return data;
}

/** Adding twice is harmless. 404 when the product no longer exists. */
export function addToWishlist(token: string, slug: string): Promise<void> {
  return apiRequest<void>(`/account/wishlist/${encodeURIComponent(slug)}`, { method: "PUT", token });
}

export function removeFromWishlist(token: string, slug: string): Promise<void> {
  return apiRequest<void>(`/account/wishlist/${encodeURIComponent(slug)}`, { method: "DELETE", token });
}
