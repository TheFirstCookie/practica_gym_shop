import Link from "next/link";
import type { ProductSummary } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "./product-image";
import { TagBadge } from "./tag-badge";

type ProductGridProps = {
  products: ProductSummary[];
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
          key={product.id}
        >
          <div className="product-image">
            <ProductImage src={product.image} alt={product.name} />
            {product.tag && <TagBadge tag={product.tag} className="product-tag" />}
          </div>
          <div className="product-info">
            <div>
              <small>{product.brand.name}</small>
              <h3>{product.name}</h3>
            </div>
            <strong>{formatPrice(product.priceCents, product.currency)}</strong>
          </div>
        </Link>
      ))}
    </div>
  );
}
