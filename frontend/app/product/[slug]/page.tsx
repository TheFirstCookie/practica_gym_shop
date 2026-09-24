import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice, getProduct, getRelatedProducts } from "@/lib/catalog";
import { SiteHeader } from "@/app/components/site-header";
import { AddToCart } from "@/app/components/add-to-cart";
import { TagBadge } from "@/app/components/tag-badge";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = getProduct((await params).slug);
  return product ? { title: product.name, description: product.description } : {};
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = getProduct((await params).slug);

  if (!product) {
    notFound();
  }

  const related = getRelatedProducts(product);

  return (
    <main>
      <SiteHeader compact />

      <section className="product-detail">
        <div className="detail-image">
          <img src={product.image} alt={product.name} />
          <TagBadge tag={product.tag} className="detail-tag" />
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
            <span className={product.stock === 0 ? "out-of-stock" : undefined}>
              {product.stock > 0 ? `${product.stock} in stock` : "Sold out"}
            </span>
          </div>
          <AddToCart slug={product.slug} name={product.name} stock={product.stock} />
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
