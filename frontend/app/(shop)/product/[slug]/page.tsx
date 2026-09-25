import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getRelatedProducts } from "@/lib/api/catalog";
import { getRatingSummary } from "@/lib/api/reviews";
import type { Product, RatingSummary } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { SITE_NAME, SITE_URL, toMetaDescription } from "@/lib/site";
import { SiteHeader } from "@/app/components/site-header";
import { AddToCart } from "@/app/components/add-to-cart";
import { ProductImage } from "@/app/components/product-image";
import { TagBadge } from "@/app/components/tag-badge";
import { WishlistButton } from "@/app/components/wishlist-button";
import { ProductReviews } from "@/app/components/reviews/product-reviews";
import { Stars } from "@/app/components/reviews/stars";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return {};

  const description = toMetaDescription(
    product.description || `${product.name} by ${product.brand.name}, from ${SITE_NAME}.`
  );
  const path = `/product/${product.slug}`;

  return {
    title: product.name,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: product.name,
      description,
      url: path,
      // Falls back to the site-wide image (app/opengraph-image.tsx) when there's no photo.
      images: product.image ? [{ url: product.image, alt: product.name }] : undefined
    }
  };
}

/** schema.org Product data, so search results can show the price, stock and rating. */
function toJsonLd(product: Product, rating: RatingSummary | null) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: product.image ?? undefined,
    sku: product.slug,
    category: product.category.name,
    brand: { "@type": "Brand", name: product.brand.name },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.slug}`,
      price: (product.priceCents / 100).toFixed(2),
      priceCurrency: product.currency.toUpperCase(),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    },
    aggregateRating:
      rating && rating.average !== null
        ? { "@type": "AggregateRating", ratingValue: rating.average, reviewCount: rating.count, bestRating: 5 }
        : undefined
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const [related, rating] = await Promise.all([getRelatedProducts(product.slug), getRatingSummary(product.slug)]);
  const price = (cents: number, currency: string) => formatPrice(cents, currency);

  return (
    <main>
      <script
        type="application/ld+json"
        // "<" is escaped so text from the database can't close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toJsonLd(product, rating)).replace(/</g, "\\u003c") }}
      />
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
          {rating && rating.average !== null && (
            <a href="#reviews" className="rating-link">
              <Stars rating={rating.average} size={16} />
              <span>
                {rating.average.toFixed(1)} · {rating.count} {rating.count === 1 ? "review" : "reviews"}
              </span>
            </a>
          )}
          {product.description && <p>{product.description}</p>}
          <div className="price-row">
            <strong>{price(product.priceCents, product.currency)}</strong>
            <span className={product.stock === 0 ? "out-of-stock" : undefined}>
              {product.stock > 0 ? `${product.stock} in stock` : "Sold out"}
            </span>
          </div>
          <AddToCart slug={product.slug} name={product.name} stock={product.stock}>
            <WishlistButton slug={product.slug} name={product.name} variant="full" />
          </AddToCart>
          {product.specs.length > 0 && (
            <ul className="spec-list">
              {product.specs.map((spec) => (
                <li key={spec}>{spec}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <ProductReviews slug={product.slug} initialSummary={rating} />

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
