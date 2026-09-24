import Link from "next/link";
import { notFound } from "next/navigation";
import { Heart, ShoppingBag } from "lucide-react";
import { formatPrice, getProduct, products } from "@/lib/catalog";
import { SiteHeader } from "@/app/components/site-header";

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProduct(params.slug);

  if (!product) {
    notFound();
  }

  const related = products
    .filter((item) => item.categorySlug === product.categorySlug && item.slug !== product.slug)
    .slice(0, 3);

  return (
    <main>
      <SiteHeader compact />

      <section className="product-detail">
        <div className="detail-image">
          <img src={product.image} alt={product.name} />
          <span>{product.tag}</span>
        </div>

        <div className="detail-copy">
          <p className="eyebrow">
            <Link href={`/category/${product.categorySlug}?brand=${product.brandSlug}`}>
              {product.brand}
            </Link>
            {" / "}
            <Link href={`/category/${product.categorySlug}`}>{product.category}</Link>
          </p>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <div className="price-row">
            <strong>{formatPrice(product.price)}</strong>
            <span>{product.stock} in stock</span>
          </div>
          <div className="detail-actions">
            <button type="button" className="button primary">
              <ShoppingBag size={18} />
              <span>Add to cart</span>
            </button>
            <button type="button" className="icon-button" aria-label="Save product">
              <Heart size={19} />
            </button>
          </div>
          <ul className="spec-list">
            {product.specs.map((spec) => (
              <li key={spec}>{spec}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="catalog-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Related</p>
            <h2>Pairs well with this setup</h2>
          </div>
        </div>
        <div className="mini-grid">
          {related.map((item) => (
            <Link href={`/product/${item.slug}`} className="mini-card" key={item.slug}>
              <img src={item.image} alt={item.name} />
              <span>{item.name}</span>
              <strong>{formatPrice(item.price)}</strong>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
