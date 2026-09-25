import { apiRequest } from "./client";
import type { AdminProduct, DataEnvelope, ProductList, ProductSort } from "./types";

// Admin endpoints. Every call needs the signed-in admin's access token, and none are
// cached: the admin must always see what's actually in the database.
const noStore = { cache: "no-store" as const };

export type AdminUser = {
  id: string;
  email: string | null;
};

export type AdminProductStatus = "active" | "inactive" | "all";

export type AdminProductListParams = {
  q?: string;
  status?: AdminProductStatus;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
};

/** Body for create and update; update accepts any subset. */
export type ProductInput = {
  name: string;
  slug?: string;
  categoryId: string;
  brandId: string;
  priceCents: number;
  stock: number;
  tag: string | null;
  imageUrl: string | null;
  description: string;
  specs: string[];
  sortOrder: number;
  isActive: boolean;
};

export type ImageUploadTicket = {
  bucket: string;
  path: string;
  token: string;
  signedUrl: string;
  publicUrl: string;
  expiresInSeconds: number;
};

export type ImageContentType = "image/jpeg" | "image/png" | "image/webp" | "image/avif";

export async function getAdminMe(token: string): Promise<AdminUser> {
  const { data } = await apiRequest<DataEnvelope<AdminUser>>("/admin/session/me", { ...noStore, token });
  return data;
}

export function listAdminProducts(
  token: string,
  params: AdminProductListParams,
  signal?: AbortSignal
): Promise<ProductList<AdminProduct>> {
  return apiRequest<ProductList<AdminProduct>>("/admin/products", {
    ...noStore,
    token,
    signal,
    query: {
      q: params.q,
      status: params.status,
      sort: params.sort,
      page: params.page,
      pageSize: params.pageSize
    }
  });
}

export async function getAdminProduct(token: string, id: string): Promise<AdminProduct> {
  const { data } = await apiRequest<DataEnvelope<AdminProduct>>(`/admin/products/${id}`, {
    ...noStore,
    token
  });
  return data;
}

export async function createProduct(token: string, input: ProductInput): Promise<AdminProduct> {
  const { data } = await apiRequest<DataEnvelope<AdminProduct>>("/admin/products", {
    method: "POST",
    token,
    body: input
  });
  return data;
}

export async function updateProduct(
  token: string,
  id: string,
  input: Partial<ProductInput>
): Promise<AdminProduct> {
  const { data } = await apiRequest<DataEnvelope<AdminProduct>>(`/admin/products/${id}`, {
    method: "PATCH",
    token,
    body: input
  });
  return data;
}

/** Hides the product from the shop; restore it with updateProduct(..., { isActive: true }). */
export function archiveProduct(token: string, id: string): Promise<void> {
  return apiRequest<void>(`/admin/products/${id}`, { method: "DELETE", token });
}

export async function createImageUpload(
  token: string,
  contentType: ImageContentType
): Promise<ImageUploadTicket> {
  const { data } = await apiRequest<DataEnvelope<ImageUploadTicket>>("/admin/uploads/product-images", {
    method: "POST",
    token,
    body: { contentType }
  });
  return data;
}
