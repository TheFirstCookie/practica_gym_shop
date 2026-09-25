import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getRelatedProducts } from "@/lib/api/catalog";
import { formatPrice } from "@/lib/format";
import { SiteHeader } from "@/app/components/site-header";
import { AddToCart } from "@/app/components/add-to-cart";
import { ProductImage } from "@/app/components/product-image";
import { TagBadge } from "@/app/components/tag-badge";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  return product ? { title: product.name, description: product.description } : {};
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const related = await getRelatedProducts(product.slug);
  const price = (cents: number, currency: string) => formatPrice(cents, currency);

  return (
    <main>
      <SiteHeader compact />

      <section className="product-detail">
        <div className="detail-image">
          <ProductImage src={product.image} alt={product.name} />
          {product.tag && <TagBadge tag={product.tag} className="detail-tag" />}
        </div>

        <div className="detail-copy">
          <p className="eyebrow">
            <Link href={`/category/${product.category.slug}?brand=${product.brand.slug}`}>
              {product.brand.name}
            </Link>
            {" / "}
            <Link href={`/category/${product.category.slug}`}>{product.category.name}</Link>
          </p>
          <h1>{product.name}</h1>
          {product.description && <p>{product.description}</p>}
          <div className="price-row">
            <strong>{price(product.priceCents, product.currency)}</strong>
            <span className={product.stock === 0 ? "out-of-stock" : undefined}>
              {product.stock > 0 ? `${product.stock} in stock` : "Sold out"}
            </span>
          </div>
          <AddToCart slug={product.slug} name={product.name} stock={product.stock} />
          {product.specs.length > 0 && (
            <ul className="spec-list">
              {product.specs.map((spec) => (
                <li key={spec}>{spec}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="catalog-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Related</p>
              <h2>Pairs well with this setup</h2>
            </div>
          </div>
          <div className="mini-grid">
            {related.map((item) => (
              <Link href={`/product/${item.slug}`} className="mini-card" key={item.id}>
                <span className="mini-card-image">
                  <ProductImage src={item.image} alt={item.name} />
                </span>
                <span>{item.name}</span>
                <strong>{price(item.priceCents, item.currency)}</strong>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
