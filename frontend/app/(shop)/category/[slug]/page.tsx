import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategory, listProducts } from "@/lib/api/catalog";
import { PAGE_SIZE, parseFilters, parsePage, type SearchParams } from "@/lib/filters";
import { SITE_NAME } from "@/lib/site";
import { SiteHeader } from "@/app/components/site-header";
import { FilterBar } from "@/app/components/filter-bar";
import { ProductGrid } from "@/app/components/product-grid";
import { Pagination } from "@/app/components/pagination";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({
  params
}: Pick<CategoryPageProps, "params">): Promise<Metadata> {
  const category = await getCategory((await params).slug);
  if (!category) return {};

  const description = `Shop ${category.count} ${category.name.toLowerCase()} ${
    category.count === 1 ? "product" : "products"
  } at ${SITE_NAME}. Ships within 15 days, 30-day returns.`;
  const path = `/category/${category.slug}`;

  return {
    title: category.name,
    description,
    // Filtered and sorted variants (?brand=, ?sort=, ?page=) all point search engines here.
    alternates: { canonical: path },
    openGraph: { title: category.name, description, url: path }
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const filters = parseFilters(query);

  const [category, catalog] = await Promise.all([
    getCategory(slug),
    listProducts({
      category: slug,
      brands: filters.brands,
      sort: filters.sort,
      page: parsePage(query),
      pageSize: PAGE_SIZE
    })
  ]);

  if (!category) {
    notFound();
  }

  const pathname = `/category/${category.slug}`;

  return (
    <main>
      <SiteHeader compact />

      <section className="listing-hero">
        <div>
          <p className="eyebrow">Category</p>
          <h1>{category.name}</h1>
        </div>
      </section>

      <section className="catalog-section">
        <FilterBar
          brands={catalog.meta.facets.brands}
          filters={filters}
          resultCount={catalog.meta.pagination.total}
        />
        <ProductGrid products={catalog.data} clearHref={pathname} />
        <Pagination pagination={catalog.meta.pagination} pathname={pathname} searchParams={query} />
      </section>
    </main>
  );
}
