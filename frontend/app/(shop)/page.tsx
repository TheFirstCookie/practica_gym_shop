import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { getCategories, listProducts } from "@/lib/api/catalog";
import { formatPrice } from "@/lib/format";
import {
  PAGE_SIZE,
  hasActiveFilters,
  parseFilters,
  parsePage,
  type SearchParams
} from "@/lib/filters";
import { SiteHeader } from "@/app/components/site-header";
import { FilterBar } from "@/app/components/filter-bar";
import { ProductGrid } from "@/app/components/product-grid";
import { ProductImage } from "@/app/components/product-image";
import { Pagination } from "@/app/components/pagination";
import { FaqSection } from "@/app/components/faq-section";
import { MarqueeStrip } from "@/app/components/marquee-strip";
import { PerksBand } from "@/app/components/perks-band";
import { TagBadge } from "@/app/components/tag-badge";

type HomeProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const page = parsePage(params);

  // Independent requests, fetched in parallel. The hero always shows the top featured
  // product, whatever filters the catalog below has.
  const [categories, featured, catalog] = await Promise.all([
    getCategories(),
    listProducts({ pageSize: 1 }),
    listProducts({ brands: filters.brands, sort: filters.sort, page, pageSize: PAGE_SIZE })
  ]);

  const hero = featured.data[0];
  const totalProducts = featured.meta.pagination.total;
  const brandCount = featured.meta.facets.brands.filter((brand) => brand.count > 0).length;
  // The big featured tile only makes sense in the default order, on the first page.
  const featureFirst = !hasActiveFilters(filters) && page === 1;

  return (
    <main>
      <SiteHeader />

      <section className="hero-grid" aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="eyebrow">Training gear for serious daily use</p>
          <h1 id="home-title">Build the room before the routine breaks.</h1>
          <p className="hero-text">
            Strength equipment, conditioning tools, recovery staples, and smart storage selected
            for home gyms and compact studios.
          </p>
          <div className="hero-actions">
            <Link href="#catalog" className="button primary">
              <span>Shop catalog</span>
              <ArrowRight size={18} />
            </Link>
            <Link href="/category/strength" className="button secondary">
              <Zap size={18} />
              <span>Strength picks</span>
            </Link>
          </div>
          <dl className="hero-stats">
            <div>
              <dt>Products</dt>
              <dd>{totalProducts}</dd>
            </div>
            <div>
              <dt>Brands</dt>
              <dd>{brandCount}</dd>
            </div>
            <div>
              <dt>Categories</dt>
              <dd>{categories.length}</dd>
            </div>
          </dl>
        </div>

        {hero && (
          <Link href={`/product/${hero.slug}`} className="hero-product">
            <ProductImage src={hero.image} alt={hero.name} />
            <div className="hero-product-panel">
              {hero.tag && <TagBadge tag={hero.tag} />}
              <strong>{hero.name}</strong>
              <small>
                {formatPrice(hero.priceCents, hero.currency)} - {hero.stock} in stock
              </small>
            </div>
          </Link>
        )}
      </section>

      <MarqueeStrip categories={categories} />

      <section className="category-strip" aria-label="Featured categories">
        {categories.map((category) => (
          <Link
            href={`/category/${category.slug}`}
            className="category-tile"
            key={category.slug}
            style={{ "--accent": category.accent } as React.CSSProperties}
          >
            <span>{category.name}</span>
            <strong>{category.count}</strong>
            <small>items</small>
          </Link>
        ))}
      </section>

      <section className="catalog-section" id="catalog">
        <div className="section-heading">
          <div>
            <p className="eyebrow">First drop</p>
            <h2>Equipment that earns floor space</h2>
          </div>
        </div>

        <FilterBar
          brands={catalog.meta.facets.brands}
          filters={filters}
          resultCount={catalog.meta.pagination.total}
        />
        <ProductGrid products={catalog.data} featureFirst={featureFirst} clearHref="/#catalog" />
        <Pagination
          pagination={catalog.meta.pagination}
          pathname="/"
          searchParams={params}
          hash="#catalog"
        />
      </section>

      <PerksBand />

      <FaqSection />
    </main>
  );
}
