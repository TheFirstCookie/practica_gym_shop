import { ApiError, apiRequest } from "./client";
import type {
  Brand,
  Category,
  DataEnvelope,
  Product,
  ProductList,
  ProductSort,
  ProductSummary
} from "./types";

/** Cache tag for every storefront read; the admin clears it after each change. */
export const CATALOG_CACHE_TAG = "catalog";

// Server-side, catalog reads are cached for a minute (and cleared early by admin edits),
// so most page views never wait on the API. In the browser these options are ignored.
const catalogCache = { next: { revalidate: 60, tags: [CATALOG_CACHE_TAG] } };

export type ProductListParams = {
  category?: string;
  brands?: string[];
  q?: string;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
};

/** Resolves to null on 404, so pages can call notFound() instead of catching. */
async function orNull<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}

export async function getCategories(): Promise<Category[]> {
  const { data } = await apiRequest<DataEnvelope<Category[]>>("/categories", catalogCache);
  return data;
}

/**
 * Categories for the header menu and footer. Never throws: navigation should still render
 * (with an empty menu) when the API is unreachable, including during the build, when
 * pages like /cart are prerendered.
 */
export async function getNavCategories(): Promise<Category[]> {
  try {
    return await getCategories();
  } catch (error) {
    console.error("Couldn't load categories for navigation", error);
    return [];
  }
}

export async function getCategory(slug: string): Promise<Category | null> {
  const result = await orNull(
    apiRequest<DataEnvelope<Category>>(`/categories/${encodeURIComponent(slug)}`, catalogCache)
  );
  return result?.data ?? null;
}

export async function getBrands(): Promise<Brand[]> {
  const { data } = await apiRequest<DataEnvelope<Brand[]>>("/brands", catalogCache);
  return data;
}

export function listProducts(params: ProductListParams = {}, signal?: AbortSignal): Promise<ProductList> {
  return apiRequest<ProductList>("/products", {
    ...catalogCache,
    signal,
    query: {
      category: params.category,
      brand: params.brands,
      q: params.q,
      sort: params.sort === "featured" ? undefined : params.sort,
      page: params.page === 1 ? undefined : params.page,
      pageSize: params.pageSize
    }
  });
}

export async function getProduct(slug: string, signal?: AbortSignal): Promise<Product | null> {
  const result = await orNull(
    apiRequest<DataEnvelope<Product>>(`/products/${encodeURIComponent(slug)}`, { ...catalogCache, signal })
  );
  return result?.data ?? null;
}

export async function getRelatedProducts(slug: string, limit = 3): Promise<ProductSummary[]> {
  const { data } = await apiRequest<DataEnvelope<ProductSummary[]>>(
    `/products/${encodeURIComponent(slug)}/related`,
    { ...catalogCache, query: { limit } }
  );
  return data;
}
