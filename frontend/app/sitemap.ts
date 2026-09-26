import type { MetadataRoute } from "next";
import { getCategories, listProducts } from "@/lib/api/catalog";
import type { ProductSummary } from "@/lib/api/types";
import { LEGAL_PAGES, LEGAL_UPDATED } from "@/lib/legal";
import { SITE_URL } from "@/lib/site";

// Cached like the rest of the catalog (lib/api/catalog.ts), so new products appear within
// about a minute.

/**
 * Next writes sitemap values into the XML as-is, and photo URLs often carry query strings
 * ("?w=1200&q=80"), whose "&" would make the file invalid.
 */
function xmlSafe(url: string) {
  return url.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** The API caps pages at 100 products. */
const PAGE_SIZE = 100;

async function allProducts(): Promise<ProductSummary[]> {
  const products: ProductSummary[] = [];
  for (let page = 1; ; page++) {
    const { data, meta } = await listProducts({ page, pageSize: PAGE_SIZE });
    products.push(...data);
    if (page >= meta.pagination.totalPages) return products;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pages that don't depend on the API, so they're listed even when it's asleep.
  const home: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    ...LEGAL_PAGES.map((page) => ({
      url: `${SITE_URL}${page.href}`,
      lastModified: LEGAL_UPDATED,
      changeFrequency: "yearly" as const,
      priority: 0.3
    }))
  ];

  try {
    const [categories, products] = await Promise.all([getCategories(), allProducts()]);

    return [
      ...home,
      ...categories.map((category) => ({
        url: `${SITE_URL}/category/${category.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.8
      })),
      ...products.map((product) => ({
        url: `${SITE_URL}/product/${product.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.6,
        images: product.image ? [xmlSafe(product.image)] : undefined
      }))
    ];
  } catch (error) {
    // The API may be asleep during a build. A partial sitemap beats a failed deploy, and
    // it's regenerated within the hour.
    console.warn("Sitemap: couldn't load the catalog", error);
    return home;
  }
}
