import Link from "next/link";
import { formatPrice, type Product } from "@/lib/catalog";

type ProductGridProps = {
  products: Product[];
  featureFirst?: boolean;
  clearHref: string;
};

export function ProductGrid({ products, featureFirst = false, clearHref }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="empty-state">
        <h3>Nothing matches those filters</h3>
        <p>Try another brand, or clear the filters to see everything.</p>
        <Link href={clearHref} className="button secondary" scroll={false}>
          Clear filters
        </Link>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product, index) => (
        <Link
          href={`/product/${product.slug}`}
          className={featureFirst && index === 0 ? "product-card featured-card" : "product-card"}
          key={product.slug}
        >
          <div className="product-image">
            <img src={product.image} alt={product.name} />
            <span>{product.tag}</span>
          </div>
          <div className="product-info">
            <div>
              <small>{product.brand}</small>
              <h3>{product.name}</h3>
            </div>
            <strong>{formatPrice(product.price)}</strong>
          </div>
        </Link>
      ))}
    </div>
  );
}
