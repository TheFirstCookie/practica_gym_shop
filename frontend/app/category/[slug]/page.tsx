import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  applyFilters,
  categories,
  getBrandFacets,
  getProductsByCategory,
  parseFilters
} from "@/lib/catalog";
import { SiteHeader } from "@/app/components/site-header";
import { FilterBar } from "@/app/components/filter-bar";
import { ProductGrid } from "@/app/components/product-grid";

type CategoryPageProps = {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export function generateMetadata({ params }: Pick<CategoryPageProps, "params">): Metadata {
  const category = categories.find((item) => item.slug === params.slug);
  return category ? { title: category.name } : {};
}

export default function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const category = categories.find((item) => item.slug === params.slug);

  if (!category) {
    notFound();
  }

  const products = getProductsByCategory(params.slug);
  const filters = parseFilters(searchParams);
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
