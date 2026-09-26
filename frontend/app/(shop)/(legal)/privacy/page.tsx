import type { Metadata } from "next";
import { STORE_EMAIL, STORE_MAILTO } from "@/lib/store-info";
import { LegalPage } from "../components/legal-page";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What personal data ForgeFit Supply collects, why, who processes it, how long it's kept and your rights.",
  alternates: { canonical: "/privacy" }
};

/** Services that handle personal data for the shop, and what for. */
const PROCESSORS = [
  { name: "Stripe", purpose: "Takes payments and collects your email, name and delivery address at checkout." },
  { name: "Supabase", purpose: "Stores the shop's database (orders, accounts, reviews, wishlists) and handles sign-in." },
  { name: "Resend", purpose: "Sends order confirmation emails." },
  { name: "Vercel", purpose: "Hosts this website." },
  { name: "Render", purpose: "Hosts the server that runs the shop." }
];

export default function PrivacyPage() {
  return (
    <LegalPage
      path="/privacy"
      title="Privacy policy"
      intro="What we collect when you shop with us, why, and what you can ask us to do with it."
    >
      <section aria-labelledby="collect">
        <h2 id="collect">What we collect</h2>
        <ul>
          <li>
            <strong>Orders:</strong> what you bought and paid, and the email, name and delivery address you enter on
            Stripe&apos;s checkout page. Your card details go to Stripe only; we never see them.
          </li>
          <li>
            <strong>Account</strong> (optional): your email, the name you sign up with and your password, which
            Supabase stores only in scrambled (hashed) form.
          </li>
          <li>
            <strong>Reviews and wishlist:</strong> the ratings and text you post, shown with your first name and last
            initial, and the products you save.
          </li>
          <li>
            <strong>Technical data:</strong> your IP address and browser details reach our hosting providers with every
            request. We use them to keep the shop running and to block abuse, such as too many checkout attempts.
          </li>
        </ul>
      </section>

      <section aria-labelledby="why">
        <h2 id="why">Why we use it</h2>
        <ul>
          <li>To take payment, deliver your order, handle returns and send your receipt (needed to fulfil the sale).</li>
          <li>To run your account, order history, wishlist and reviews (you asked for these when you signed up).</li>
          <li>To keep the shop secure and working (our legitimate interest).</li>
        </ul>
        <p>We don&apos;t sell your data, send marketing emails, or use advertising or tracking cookies.</p>
      </section>

      <section aria-labelledby="storage">
        <h2 id="storage">What stays in your browser</h2>
        <p>
          The shop saves a few things in your browser&apos;s storage so it works between visits: your cart (product
          and quantity only), your sign-in session if you have an account, and, for the length of a checkout, a
          reference to the payment you started. None of it is used for tracking, and clearing your browser&apos;s site
          data removes it. Stripe sets its own cookies on its checkout page to process payments and prevent fraud.
        </p>
      </section>

      <section aria-labelledby="processors">
        <h2 id="processors">Who processes it for us</h2>
        <ul>
          {PROCESSORS.map((processor) => (
            <li key={processor.name}>
              <strong>{processor.name}:</strong> {processor.purpose}
            </li>
          ))}
        </ul>
        <p>
          They handle data only on our behalf. Some of them are based outside your country, including in the United
          States, and transfer data under standard contractual safeguards.
        </p>
      </section>

      <section aria-labelledby="retention">
        <h2 id="retention">How long we keep it</h2>
        <ul>
          <li>Orders are kept for as long as tax and accounting rules require.</li>
          <li>
            Account details, wishlist and reviews are kept until you close your account. Closing it deletes your
            wishlist and reviews; your past orders stay in our records but are no longer linked to you.
          </li>
          <li>Hosting logs are kept by our providers for a short period, usually days to weeks.</li>
        </ul>
      </section>

      <section aria-labelledby="rights">
        <h2 id="rights">Your rights</h2>
        <p>
          You can ask for a copy of your data, have it corrected or deleted, take it elsewhere, or object to how we use
          it. You can edit your name and password yourself under Settings in your account and delete your reviews on
          the product pages; for anything else, email <a href={STORE_MAILTO}>{STORE_EMAIL}</a> from the address on
          your account or order. If you&apos;re unhappy with our answer, you can complain to your country&apos;s data
          protection authority.
        </p>
      </section>
    </LegalPage>
  );
}
