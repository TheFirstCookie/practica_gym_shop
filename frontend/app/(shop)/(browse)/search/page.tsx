import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, listProducts } from "@/lib/api/catalog";
import {
  PAGE_SIZE,
  parseFilters,
  parsePage,
  parseQuery,
  type SearchParams
} from "@/lib/filters";
import { SiteHeader } from "@/app/components/site-header";
import { FilterBar } from "@/app/components/filter-bar";
import { ProductGrid } from "@/app/components/product-grid";
import { Pagination } from "@/app/components/pagination";

type SearchPageProps = {
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const query = parseQuery(await searchParams);

  return {
    title: query ? `Search: ${query}` : "Search",
    // Result pages are endless variations of the catalog, so keep them out of search engines.
    robots: { index: false }
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = parseQuery(params);
  const filters = parseFilters(params);

  // An empty search shows the whole catalog rather than a blank page.
  const [catalog, categories] = await Promise.all([
    listProducts({
      q: query || undefined,
      brands: filters.brands,
      sort: filters.sort,
      page: parsePage(params),
      pageSize: PAGE_SIZE
    }),
    getCategories()
  ]);

  // Brand facets ignore the brand filter, so zero across the board means the words
  // themselves matched nothing (rather than the chosen brands hiding everything).
  const noMatches = catalog.meta.facets.brands.every((brand) => brand.count === 0);

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
        {noMatches ? (
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
              brands={catalog.meta.facets.brands}
              filters={filters}
              resultCount={catalog.meta.pagination.total}
            />
            <ProductGrid
              products={catalog.data}
              clearHref={query ? `/search?q=${encodeURIComponent(query)}` : "/search"}
            />
            <Pagination pagination={catalog.meta.pagination} pathname="/search" searchParams={params} />
          </>
        )}
      </section>
    </main>
  );
}
