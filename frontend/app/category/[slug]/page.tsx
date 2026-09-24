import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  applyFilters,
  categories,
  getBrandFacets,
  getProductsByCategory,
  parseFilters,
  type SearchParams
} from "@/lib/catalog";
import { SiteHeader } from "@/app/components/site-header";
import { FilterBar } from "@/app/components/filter-bar";
import { ProductGrid } from "@/app/components/product-grid";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({
  params
}: Pick<CategoryPageProps, "params">): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  return category ? { title: category.name } : {};
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    notFound();
  }

  const products = getProductsByCategory(slug);
  const filters = parseFilters(await searchParams);
  const visible = applyFilters(products, filters);

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
          brands={getBrandFacets(products, filters.brands)}
          filters={filters}
          resultCount={visible.length}
        />
        <ProductGrid products={visible} clearHref={`/category/${category.slug}`} />
      </section>
    </main>
  );
}
