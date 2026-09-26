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
  /** Integer cents: 2999 is $29.99. With variants, the cheapest one. */
  priceCents: number;
  /** The most expensive variant; the same as priceCents without variants. */
  priceMaxCents: number;
  /** Bought by picking a variant (weight, size, colour...) on the product page. */
  hasVariants: boolean;
  currency: string;
  /** With variants, the total over all of them. */
  stock: number;
  tag: string | null;
  image: string | null;
  category: TaxonomyRef;
  brand: TaxonomyRef;
};

/** One option of a product, with its own price and stock. */
export type ProductVariant = {
  id: string;
  /** "20 kg", "M", "Black"... */
  name: string;
  priceCents: number;
  stock: number;
};

export type Product = ProductSummary & {
  description: string;
  specs: string[];
  /** The options on sale, in display order; empty for a plain product. */
  variants: ProductVariant[];
};

export type AdminVariant = ProductVariant & { isActive: boolean };

export type AdminProduct = Omit<Product, "variants"> & {
  /** Every variant, hidden ones too. */
  variants: AdminVariant[];
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

export type OrderStatus = "pending" | "paid" | "cancelled" | "fulfilled" | "refunded";

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
    /** "20 kg"; null for a product without variants. */
    variantName: string | null;
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
  refundedAt: string | null;
  /** When a refunded order's items went back in stock (null: they didn't, yet). */
  restockedAt: string | null;
  /** When the confirmation email went out (null: not sent, e.g. email isn't set up). */
  confirmationEmailSentAt: string | null;
  updatedAt: string;
  stripe: {
    checkoutSessionId: string | null;
    paymentIntentId: string | null;
    refundId: string | null;
    /** The payment in the Stripe dashboard, when there is one. */
    dashboardUrl: string | null;
  };
  items: {
    id: string;
    /** null when the product has since been deleted. */
    productId: string | null;
    name: string;
    /** Which variant to pack; null for a product without variants. */
    variantName: string | null;
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

/** A category as the admin panel sees it. */
export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  /** Tile colour on the storefront, "#rrggbb". */
  accent: string;
  /** Lower comes first. */
  sortOrder: number;
  /** Every product in it, hidden ones included (they block deleting). */
  productCount: number;
  /** Products the storefront shows. */
  activeProductCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminBrand = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  activeProductCount: number;
  createdAt: string;
  updatedAt: string;
};

/** Reporting window: the last 7, 30 or 90 days, or everything since the first sale. */
export type DashboardRange = 7 | 30 | 90 | "all";

export type ChartBucket = "day" | "week" | "month";

export type Dashboard = {
  currency: string;
  range: DashboardRange;
  /** Length of the window in days, today included. */
  days: number;
  /** First day of the window, "YYYY-MM-DD" (UTC). */
  since: string;
  /** Sales in the window, and in the same span before it (null for "all"). */
  sales: {
    revenueCents: number;
    orderCount: number;
    averageOrderCents: number;
    previousRevenueCents: number | null;
    previousOrderCount: number | null;
    allTimeRevenueCents: number;
  };
  orders: { toShip: number; awaitingPayment: number };
  /** Revenue over time, oldest first; long windows come grouped by week or month. */
  bucket: ChartBucket;
  series: { date: string; revenueCents: number; orderCount: number }[];
  topProducts: { productId: string | null; name: string; units: number; revenueCents: number }[];
  lowStock: { id: string; name: string; slug: string; stock: number; image: string | null }[];
  recentOrders: {
    id: string;
    status: OrderStatus;
    customerName: string | null;
    customerEmail: string | null;
    totalCents: number;
    currency: string;
    createdAt: string;
  }[];
  lowStockThreshold: number;
};

/** One of the signed-in shopper's own orders. */
export type CustomerOrder = {
  id: string;
  status: OrderStatus;
  currency: string;
  subtotalCents: number;
  totalCents: number;
  itemCount: number;
  createdAt: string;
  paidAt: string | null;
  fulfilledAt: string | null;
  refundedAt: string | null;
  shippingAddress: ShippingAddress | null;
  items: {
    name: string;
    variantName: string | null;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
    /** The product today, for a link and photo; null once it's been removed from the shop. */
    product: { slug: string; image: string | null } | null;
  }[];
};

export type WishlistItem = ProductSummary & { addedAt: string };

export type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  /** "Ana B.", never the email. */
  authorName: string;
  verifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RatingSummary = {
  count: number;
  /** One decimal; null with no reviews. */
  average: number | null;
  /** Counts of 1- to 5-star reviews, in that order. */
  distribution: [number, number, number, number, number];
};

export type ReviewList = {
  data: Review[];
  meta: { pagination: Pagination; summary: RatingSummary };
};

export type AdminReview = Review & {
  userId: string;
  product: { id: string; name: string; slug: string } | null;
};
