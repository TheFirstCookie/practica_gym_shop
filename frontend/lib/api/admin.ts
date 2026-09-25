import { apiRequest } from "./client";
import type {
  AdminBrand,
  AdminCategory,
  AdminOrder,
  AdminOrderList,
  AdminProduct,
  Dashboard,
  DashboardRange,
  DataEnvelope,
  OrderStatus,
  ProductList,
  ProductSort
} from "./types";

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

export type AdminOrderListParams = {
  status?: OrderStatus | "all";
  q?: string;
  page?: number;
  pageSize?: number;
};

/** The only status changes an admin makes by hand: ship a paid order, or undo that. */
export type ManualOrderStatus = "fulfilled" | "paid";

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

export function listAdminOrders(
  token: string,
  params: AdminOrderListParams,
  signal?: AbortSignal
): Promise<AdminOrderList> {
  return apiRequest<AdminOrderList>("/admin/orders", {
    ...noStore,
    token,
    signal,
    query: { status: params.status, q: params.q, page: params.page, pageSize: params.pageSize }
  });
}

export async function getAdminOrder(token: string, id: string): Promise<AdminOrder> {
  const { data } = await apiRequest<DataEnvelope<AdminOrder>>(`/admin/orders/${id}`, { ...noStore, token });
  return data;
}

/** 409 invalid_status_transition when the order isn't in a state that allows it. */
export async function updateOrderStatus(
  token: string,
  id: string,
  status: ManualOrderStatus
): Promise<AdminOrder> {
  const { data } = await apiRequest<DataEnvelope<AdminOrder>>(`/admin/orders/${id}`, {
    method: "PATCH",
    token,
    body: { status }
  });
  return data;
}

/** Full refund through Stripe; `restock` also puts the items back on the shelf. */
export async function refundOrder(token: string, id: string, restock: boolean): Promise<AdminOrder> {
  const { data } = await apiRequest<DataEnvelope<AdminOrder>>(`/admin/orders/${id}/refund`, {
    method: "POST",
    token,
    body: { restock }
  });
  return data;
}

/** Puts a refunded order's items back in stock (once). */
export async function restockOrder(token: string, id: string): Promise<AdminOrder> {
  const { data } = await apiRequest<DataEnvelope<AdminOrder>>(`/admin/orders/${id}/restock`, {
    method: "POST",
    token
  });
  return data;
}

export async function getDashboard(token: string, range: DashboardRange, signal?: AbortSignal): Promise<Dashboard> {
  const { data } = await apiRequest<DataEnvelope<Dashboard>>("/admin/dashboard", {
    ...noStore,
    token,
    signal,
    query: { days: range }
  });
  return data;
}

// Categories and brands. Deleting one that products still use fails with 409 "in_use".

export type CategoryInput = {
  name: string;
  slug?: string;
  accent: string;
  sortOrder: number;
};

export type BrandInput = {
  name: string;
  slug?: string;
};

export async function listAdminCategories(token: string): Promise<AdminCategory[]> {
  const { data } = await apiRequest<DataEnvelope<AdminCategory[]>>("/admin/categories", { ...noStore, token });
  return data;
}

export async function createCategory(token: string, input: CategoryInput): Promise<AdminCategory> {
  const { data } = await apiRequest<DataEnvelope<AdminCategory>>("/admin/categories", {
    method: "POST",
    token,
    body: input
  });
  return data;
}

export async function updateCategory(
  token: string,
  id: string,
  input: Partial<CategoryInput>
): Promise<AdminCategory> {
  const { data } = await apiRequest<DataEnvelope<AdminCategory>>(`/admin/categories/${id}`, {
    method: "PATCH",
    token,
    body: input
  });
  return data;
}

export function deleteCategory(token: string, id: string): Promise<void> {
  return apiRequest<void>(`/admin/categories/${id}`, { method: "DELETE", token });
}

export async function listAdminBrands(token: string): Promise<AdminBrand[]> {
  const { data } = await apiRequest<DataEnvelope<AdminBrand[]>>("/admin/brands", { ...noStore, token });
  return data;
}

export async function createBrand(token: string, input: BrandInput): Promise<AdminBrand> {
  const { data } = await apiRequest<DataEnvelope<AdminBrand>>("/admin/brands", {
    method: "POST",
    token,
    body: input
  });
  return data;
}

export async function updateBrand(token: string, id: string, input: Partial<BrandInput>): Promise<AdminBrand> {
  const { data } = await apiRequest<DataEnvelope<AdminBrand>>(`/admin/brands/${id}`, {
    method: "PATCH",
    token,
    body: input
  });
  return data;
}

export function deleteBrand(token: string, id: string): Promise<void> {
  return apiRequest<void>(`/admin/brands/${id}`, { method: "DELETE", token });
}
