import { CreditCard, Minus, Plus, Trash2 } from "lucide-react";
import { formatPrice, products } from "@/lib/catalog";
import { SiteHeader } from "@/app/components/site-header";

const cartItems = products.slice(0, 3);
const subtotal = cartItems.reduce((total, product) => total + product.price, 0);

export default function CartPage() {
  return (
    <main>
      <SiteHeader compact />

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
