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

/** One row of the admin order list. */
export type AdminOrderSummary = {
  id: string;
  status: OrderStatus;
  customerEmail: string | null;
  customerName: string | null;
  currency: string;
  totalCents: number;
  itemCount: number;
  createdAt: string;
  paidAt: string | null;
  fulfilledAt: string | null;
};

/** Where to ship, as collected by Stripe Checkout. */
export type ShippingAddress = {
  name: string | null;
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  /** Two-letter country code, e.g. "MD". */
  country: string | null;
};

/** Everything the admin needs to pack and ship one order. */
export type AdminOrder = AdminOrderSummary & {
  subtotalCents: number;
  shippingAddress: ShippingAddress | null;
  cancelledAt: string | null;
  updatedAt: string;
  stripe: {
    checkoutSessionId: string | null;
    paymentIntentId: string | null;
    /** The payment in the Stripe dashboard, when there is one. */
    dashboardUrl: string | null;
  };
  items: {
    id: string;
    /** null when the product has since been deleted. */
    productId: string | null;
    name: string;
    unitPriceCents: number;
    quantity: number;
    lineTotalCents: number;
  }[];
};

export type OrderStatusCounts = Record<OrderStatus | "all", number>;

export type AdminOrderList = {
  data: AdminOrderSummary[];
  meta: {
    pagination: Pagination;
    /** Orders per status across the whole shop, for the tabs. */
    counts: OrderStatusCounts;
  };
};
