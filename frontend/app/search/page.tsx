import type { Metadata } from "next";
import Link from "next/link";
import {
  applyFilters,
  categories,
  getBrandFacets,
  parseFilters,
  parseQuery,
  products,
  searchProducts
} from "@/lib/catalog";
import { SiteHeader } from "@/app/components/site-header";
import { FilterBar } from "@/app/components/filter-bar";
import { ProductGrid } from "@/app/components/product-grid";

type SearchPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export function generateMetadata({ searchParams }: SearchPageProps): Metadata {
  const query = parseQuery(searchParams);

  return {
    title: query ? `Search: ${query}` : "Search",
    // Result pages are endless variations of the catalog, so keep them out of search engines.
    robots: { index: false }
  };
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = parseQuery(searchParams);
  // An empty search shows the whole catalog rather than a blank page.
  const matches = query ? searchProducts(products, query) : products;
  const filters = parseFilters(searchParams);
  const visible = applyFilters(matches, filters);

  return (
    <main>
      <SiteHeader compact query={query} />

      <section className="listing-hero">
        <div>
          <p className="eyebrow">{query ? "Search results" : "Search"}</p>
          <h1 className="search-heading">{query ? <>&ldquo;{query}&rdquo;</> : "All equipment"}</h1>
        </div>
      </section>

      <section className="catalog-section">
        {matches.length === 0 ? (
          <div className="empty-state">
            <h3>No results for &ldquo;{query}&rdquo;</h3>
            <p>Check the spelling, try a more general word, or browse a category.</p>
            <div className="search-categories">
              {categories.map((category) => (
                <Link href={`/category/${category.slug}`} className="filter-chip" key={category.slug}>
                  <span>{category.name}</span>
                  <small>{category.count}</small>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <>
            <FilterBar
              brands={getBrandFacets(matches, filters.brands)}
              filters={filters}
              resultCount={visible.length}
            />
            <ProductGrid
              products={visible}
              clearHref={query ? `/search?q=${encodeURIComponent(query)}` : "/search"}
            />
          </>
        )}
      </section>
    </main>
  );
}
