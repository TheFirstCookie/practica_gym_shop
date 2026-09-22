import Link from "next/link";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import { ThemeToggle } from "@/app/components/theme-toggle";
import {
  categories,
  formatPrice,
  getProductsByCategory
} from "@/lib/catalog";

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const category = categories.find((item) => item.slug === params.slug);
  const products = getProductsByCategory(params.slug);

  return (
    <main>
      <header className="site-header compact">
        <Link href="/" className="brand">
          <span className="brand-mark">FS</span>
          <span>ForgeFit Supply</span>
        </Link>
        <div className="header-actions">
          <Link href="/" className="back-link">
            <ArrowLeft size={17} />
            <span>Back to shop</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <section className="listing-hero">
        <div>
          <p className="eyebrow">Category</p>
          <h1>{category?.name ?? "Equipment"}</h1>
        </div>
        <button type="button" className="button secondary">
          <SlidersHorizontal size={18} />
          <span>Filters</span>
        </button>
      </section>

      <section className="catalog-section">
        <div className="product-grid">
          {products.map((product) => (
            <Link href={`/product/${product.slug}`} className="product-card" key={product.slug}>
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
