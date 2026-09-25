// Shown while a storefront page waits on the API. On Render's free plan the first
// request after a quiet spell can take up to a minute while the server wakes up.
export default function ShopLoading() {
  return (
    <main className="page-loading" aria-busy="true" aria-live="polite">
      <div className="page-loading-bar" />
      <section className="catalog-section">
        <p className="eyebrow">Loading</p>
        <h2>Getting the latest stock…</h2>
        <div className="product-grid skeleton-grid" aria-hidden="true">
          {Array.from({ length: 8 }, (_, index) => (
            <div className="skeleton-card" key={index} />
          ))}
        </div>
      </section>
    </main>
  );
}
