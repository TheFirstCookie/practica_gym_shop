import type { Metadata } from "next";
import Link from "next/link";
import { RETURN_DAYS, SHIPPING_DAYS, SHIPPING_REGIONS, STORE_EMAIL, STORE_MAILTO } from "@/lib/store-info";
import { LegalPage } from "../components/legal-page";

export const metadata: Metadata = {
  title: "Shipping & returns",
  description: `Delivery within ${SHIPPING_DAYS} days and ${RETURN_DAYS}-day returns: where ForgeFit Supply ships, how to send something back and when refunds arrive.`,
  alternates: { canonical: "/shipping-returns" }
};

export default function ShippingReturnsPage() {
  return (
    <LegalPage
      path="/shipping-returns"
      title="Shipping & returns"
      intro={`Delivery within ${SHIPPING_DAYS} days, and ${RETURN_DAYS} days to change your mind.`}
    >
      <section aria-labelledby="shipping">
        <h2 id="shipping">Shipping</h2>
        <ul>
          <li>We deliver to {SHIPPING_REGIONS}. Checkout only accepts addresses in these countries.</li>
          <li>Delivery is included in the price you see at checkout. There are no extra shipping fees.</li>
          <li>
            Every order arrives within {SHIPPING_DAYS} days of payment. Smaller items go by parcel courier; bikes,
            racks and other large pieces go by freight, and the carrier contacts you to book a delivery slot.
          </li>
          <li>
            Import duties or taxes charged by your country on delivery, if any, are paid to the carrier by the
            recipient.
          </li>
        </ul>
      </section>

      <section aria-labelledby="tracking">
        <h2 id="tracking">Following your order</h2>
        <p>
          You get a confirmation email as soon as the payment goes through. If you checked out while signed in, the
          order is also under <Link href="/account">Orders</Link> in your account, where its status changes from{" "}
          <em>Preparing</em> to <em>Shipped</em> when it leaves the warehouse.
        </p>
      </section>

      <section aria-labelledby="cancel">
        <h2 id="cancel">Cancelling an order</h2>
        <p>
          Changed your mind before it ships? Email <a href={STORE_MAILTO}>{STORE_EMAIL}</a> with your order number
          and we&apos;ll cancel it and refund the full amount. Once an order has shipped, send it back as a return
          instead.
        </p>
      </section>

      <section aria-labelledby="returns">
        <h2 id="returns">Returns</h2>
        <p>
          You can return anything unused, in its original packaging, within {RETURN_DAYS} days of delivery. To
          start a return:
        </p>
        <ol>
          <li>
            Email <a href={STORE_MAILTO}>{STORE_EMAIL}</a> with your order number (it&apos;s in your confirmation
            email, and in your account) and the items you&apos;re sending back.
          </li>
          <li>We reply with a prepaid return label, or book a collection for freight items.</li>
          <li>Pack the items in their original box and hand them to the carrier.</li>
        </ol>
        <p>
          Items that have been used, assembled or damaged after delivery can&apos;t be taken back, except under the
          warranty below.
        </p>
      </section>

      <section aria-labelledby="refunds">
        <h2 id="refunds">Refunds</h2>
        <p>
          When the parcel is back and checked, we refund the items through Stripe to the card you paid with; orders
          placed while signed in then show as <em>Refunded</em> in your account. Banks usually show the money within 5 to 10 working days. If something
          arrived damaged or we sent the wrong item, the return is free and you get the full amount back.
        </p>
      </section>

      <section aria-labelledby="warranty">
        <h2 id="warranty">Warranty</h2>
        <p>
          Every product carries its manufacturer&apos;s warranty, from 1 year on accessories up to 5 years on steel
          frames; the term is listed in each product&apos;s specs. If something breaks under normal use, email us
          with your order number and a photo and we&apos;ll arrange a repair or replacement with the brand. This
          comes on top of your statutory rights, which it doesn&apos;t limit.
        </p>
      </section>
    </LegalPage>
  );
}
