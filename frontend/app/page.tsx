import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import {
  applyFilters,
  brands,
  categories,
  formatPrice,
  getBrandFacets,
  hasActiveFilters,
  parseFilters,
  products,
  type SearchParams
} from "@/lib/catalog";
import { SiteHeader } from "@/app/components/site-header";
import { FilterBar } from "@/app/components/filter-bar";
import { ProductGrid } from "@/app/components/product-grid";
import { FaqSection } from "@/app/components/faq-section";
import { MarqueeStrip } from "@/app/components/marquee-strip";
import { PerksBand } from "@/app/components/perks-band";
import { TagBadge } from "@/app/components/tag-badge";

type HomeProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Home({ searchParams }: HomeProps) {
  const featured = products.slice(0, 4);
  const filters = parseFilters(await searchParams);
  const visible = applyFilters(products, filters);

  return (
    <main>
      <SiteHeader />

      <section className="hero-grid" aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="eyebrow">Training gear for serious daily use</p>
          <h1 id="home-title">Build the room before the routine breaks.</h1>
          <p className="hero-text">
            Strength equipment, conditioning tools, recovery staples, and smart
            storage selected for home gyms and compact studios.
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
              <dd>{products.length}</dd>
            </div>
            <div>
              <dt>Brands</dt>
              <dd>{brands.length}</dd>
            </div>
            <div>
              <dt>Categories</dt>
              <dd>{categories.length}</dd>
            </div>
          </dl>
        </div>

        <div className="hero-product">
          <img src={featured[0].image} alt={featured[0].name} />
          <div className="hero-product-panel">
            <TagBadge tag={featured[0].tag} />
            <strong>{featured[0].name}</strong>
            <small>
              {formatPrice(featured[0].price)} - {featured[0].stock} in stock
            </small>
          </div>
        </div>
      </section>

      <MarqueeStrip />

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
          brands={getBrandFacets(products, filters.brands)}
          filters={filters}
          resultCount={visible.length}
        />
        {/* The big featured tile only makes sense in the default order. */}
        <ProductGrid
          products={visible}
          featureFirst={!hasActiveFilters(filters)}
          clearHref="/#catalog"
        />
      </section>

      <PerksBand />

      <FaqSection />
    </main>
  );
}
