// Response shapes of the ForgeFit API (mirrors the backend's DTOs).

type TaxonomyRef = {
  id: string;
  name: string;
  slug: string;
};

export type Category = TaxonomyRef & {
  accent: string;
  /** Active products in the category. */
  count: number;
};

export type Brand = TaxonomyRef;

export type BrandFacet = TaxonomyRef & {
  /** Matching products for this brand, ignoring the brand filter itself. */
  count: number;
};

export type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  /** Integer cents: 2999 is $29.99. */
  priceCents: number;
  currency: string;
  stock: number;
  tag: string | null;
  image: string | null;
  category: TaxonomyRef;
  brand: TaxonomyRef;
};

export type Product = ProductSummary & {
  description: string;
  specs: string[];
};

export type AdminProduct = Product & {
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ProductList<T = ProductSummary> = {
  data: T[];
  meta: {
    pagination: Pagination;
    facets: { brands: BrandFacet[] };
  };
};

export type ProductSort = "featured" | "price-asc" | "price-desc" | "newest";

export type DataEnvelope<T> = { data: T };

export type OrderStatus = "pending" | "paid" | "cancelled" | "fulfilled";

export type CheckoutSession = {
  sessionId: string;
  /** Stripe-hosted payment page. */
  url: string;
};

/** An order as the confirmation page sees it. */
export type CheckoutOrder = {
  id: string;
  status: OrderStatus;
  currency: string;
  subtotalCents: number;
  totalCents: number;
  customerEmail: string | null;
  createdAt: string;
  paidAt: string | null;
  items: {
    productId: string | null;
    name: string;
    unitPriceCents: number;
    quantity: number;
    lineTotalCents: number;
  }[];
};
