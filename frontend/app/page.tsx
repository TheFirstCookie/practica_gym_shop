import Link from "next/link";
import {
  ArrowRight,
  Dumbbell,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Zap
} from "lucide-react";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { categories, formatPrice, products } from "@/lib/catalog";

export default function Home() {
  const featured = products.slice(0, 4);

  return (
    <main>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="ForgeFit Supply home">
          <span className="brand-mark">
            <Dumbbell size={18} strokeWidth={2.6} />
          </span>
          <span>ForgeFit Supply</span>
        </Link>
        <nav className="main-nav" aria-label="Primary navigation">
          <Link href="/category/strength">Strength</Link>
          <Link href="/category/conditioning">Conditioning</Link>
          <Link href="/cart" className="cart-pill">
            <ShoppingBag size={17} />
            <span>Cart</span>
          </Link>
          <ThemeToggle />
        </nav>
      </header>

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
        </div>

        <div className="hero-product">
          <img src={featured[0].image} alt={featured[0].name} />
          <div className="hero-product-panel">
            <span>{featured[0].tag}</span>
            <strong>{featured[0].name}</strong>
            <small>
              {formatPrice(featured[0].price)} - {featured[0].stock} in stock
            </small>
          </div>
        </div>
      </section>

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
          <div className="toolbar" aria-label="Catalog tools">
            <button type="button" aria-label="Search catalog">
              <Search size={18} />
            </button>
            <button type="button" aria-label="Filter catalog">
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>

        <div className="product-grid">
          {products.map((product, index) => (
            <Link
              href={`/product/${product.slug}`}
              className={`product-card ${index === 0 ? "featured-card" : ""}`}
              key={product.slug}
            >
              <div className="product-image">
                <img src={product.image} alt={product.name} />
                <span>{product.tag}</span>
              </div>
              <div className="product-info">
                <div>
                  <small>{product.category}</small>
                  <h3>{product.name}</h3>
                </div>
                <strong>{formatPrice(product.price)}</strong>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
