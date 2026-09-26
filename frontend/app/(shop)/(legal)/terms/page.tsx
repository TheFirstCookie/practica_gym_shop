import type { Metadata } from "next";
import Link from "next/link";
import { STORE_EMAIL, STORE_MAILTO } from "@/lib/store-info";
import { LegalPage } from "../components/legal-page";

export const metadata: Metadata = {
  title: "Terms of sale",
  description: "The terms for buying from ForgeFit Supply: orders, prices, payment, accounts and reviews.",
  alternates: { canonical: "/terms" }
};

export default function TermsPage() {
  return (
    <LegalPage
      path="/terms"
      title="Terms of sale"
      intro="The rules for buying from ForgeFit Supply and for using an account on the shop."
    >
      <section aria-labelledby="orders">
        <h2 id="orders">Orders</h2>
        <ul>
          <li>
            When you start checkout, we hold the items in your cart for 30 minutes while you pay on Stripe&apos;s
            secure page. If you leave without paying, they go back on sale.
          </li>
          <li>
            Your order is accepted once the payment goes through and we send the confirmation email. That email is
            your receipt.
          </li>
          <li>
            If we can&apos;t fulfil an order (for example a pricing mistake or damaged stock), we&apos;ll tell you and
            refund the full amount.
          </li>
        </ul>
      </section>

      <section aria-labelledby="prices">
        <h2 id="prices">Prices and payment</h2>
        <p>
          Prices are in US dollars and include delivery. The price you pay is the one shown at checkout, read from our
          catalog at that moment; a cart saved earlier never carries an old price. Payments are handled by Stripe, and
          your card details go straight to them: we never see or store them.
        </p>
      </section>

      <section aria-labelledby="delivery">
        <h2 id="delivery">Delivery, returns and warranty</h2>
        <p>
          Delivery times, where we ship, how to return something and how refunds work are on the{" "}
          <Link href="/shipping-returns">Shipping &amp; returns</Link> page, which is part of these terms.
        </p>
      </section>

      <section aria-labelledby="accounts">
        <h2 id="accounts">Accounts</h2>
        <ul>
          <li>You don&apos;t need an account to buy. An account keeps your order history, wishlist and reviews.</li>
          <li>Use your own email address and keep your password to yourself; you&apos;re responsible for what happens in your account.</li>
          <li>
            You can ask us to close your account at any time by emailing{" "}
            <a href={STORE_MAILTO}>{STORE_EMAIL}</a>. See the <Link href="/privacy">privacy policy</Link> for what
            happens to your data.
          </li>
        </ul>
      </section>

      <section aria-labelledby="reviews">
        <h2 id="reviews">Reviews</h2>
        <ul>
          <li>
            You can write one review per product and edit or delete it whenever you like. It&apos;s shown with your
            first name and last initial. <em>Verified purchase</em> means you paid for that product with this account.
          </li>
          <li>
            Reviews must be your own honest experience. We remove reviews that are abusive, off-topic, advertising, or
            share someone&apos;s personal details. We don&apos;t remove reviews just because they&apos;re negative.
          </li>
          <li>By posting a review, you let us show it on the shop.</li>
        </ul>
      </section>

      <section aria-labelledby="liability">
        <h2 id="liability">Using the equipment</h2>
        <p>
          Follow the manufacturer&apos;s instructions for assembly, weight limits and use. Nothing in these terms
          limits your statutory rights as a consumer.
        </p>
      </section>

      <section aria-labelledby="changes">
        <h2 id="changes">Changes to these terms</h2>
        <p>
          We may update these terms; the date at the top shows the latest version. An order is always covered by the
          terms in force when you placed it.
        </p>
      </section>
    </LegalPage>
  );
}
