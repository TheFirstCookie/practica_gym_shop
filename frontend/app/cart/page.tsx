import Link from "next/link";
import { ArrowLeft, CreditCard, Minus, Plus, Trash2 } from "lucide-react";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { formatPrice, products } from "@/lib/catalog";

const cartItems = products.slice(0, 3);
const subtotal = cartItems.reduce((total, product) => total + product.price, 0);

export default function CartPage() {
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
            <span>Continue shopping</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <section className="cart-layout">
        <div>
          <p className="eyebrow">Cart draft</p>
          <h1>Ready for checkout</h1>
          <div className="cart-list">
            {cartItems.map((item) => (
              <article className="cart-item" key={item.slug}>
                <img src={item.image} alt={item.name} />
                <div>
                  <small>{item.category}</small>
                  <h2>{item.name}</h2>
                  <strong>{formatPrice(item.price)}</strong>
                </div>
                <div className="quantity-tools">
                  <button type="button" aria-label={`Decrease ${item.name} quantity`}>
                    <Minus size={16} />
                  </button>
                  <span>1</span>
                  <button type="button" aria-label={`Increase ${item.name} quantity`}>
                    <Plus size={16} />
                  </button>
                  <button type="button" aria-label={`Remove ${item.name}`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="summary-panel">
          <span>Subtotal</span>
          <strong>{formatPrice(subtotal)}</strong>
          <p>Taxes and shipping are calculated during Stripe checkout.</p>
          <button type="button" className="button primary">
            <CreditCard size={18} />
            <span>Checkout</span>
          </button>
        </aside>
      </section>
    </main>
  );
}
