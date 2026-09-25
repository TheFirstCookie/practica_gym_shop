import type { ProductSort } from "./api/types";

// Reading the storefront's URL (?brand=…&sort=…&page=…&q=…) into typed filters.
// The API validates everything again; this just keeps obviously bad values out.

/** Shape of a page's resolved `searchParams` in the App Router. */
export type SearchParams = Record<string, string | string[] | undefined>;

export const MAX_QUERY_LENGTH = 80;
export const PAGE_SIZE = 12;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// "featured" is the default order and isn't offered as a choice.
export const sortOptions = [
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" }
] as const satisfies readonly { value: ProductSort; label: string }[];

export type ProductFilters = {
  brands: string[];
  sort: ProductSort;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseFilters(searchParams: SearchParams): ProductFilters {
  const brandParam = searchParams.brand ?? [];
  const brands = [...new Set(Array.isArray(brandParam) ? brandParam : [brandParam])]
    .filter((slug) => SLUG.test(slug))
    .slice(0, 20);
  const requestedSort = firstValue(searchParams.sort);
  const sort = sortOptions.find((option) => option.value === requestedSort)?.value ?? "featured";

  return { brands, sort };
}

export function hasActiveFilters(filters: ProductFilters) {
  return filters.brands.length > 0 || filters.sort !== "featured";
}

export function parseQuery(searchParams: SearchParams) {
  return (firstValue(searchParams.q) ?? "").trim().slice(0, MAX_QUERY_LENGTH);
}

export function parsePage(searchParams: SearchParams) {
  const page = Number(firstValue(searchParams.page));
  return Number.isInteger(page) && page >= 1 ? page : 1;
}
