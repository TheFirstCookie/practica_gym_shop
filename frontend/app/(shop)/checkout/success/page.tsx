import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { SearchParams } from "@/lib/filters";
import { SiteHeader } from "@/app/components/site-header";
import { OrderConfirmation } from "@/app/components/order-confirmation";

export const metadata: Metadata = {
  title: "Order confirmation",
  robots: { index: false }
};

type SuccessPageProps = {
  searchParams: Promise<SearchParams>;
};

// Same shape the API accepts; anything else can't be a real Stripe session.
const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]+$/;

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const { session_id: sessionId } = await searchParams;
  const valid = typeof sessionId === "string" && SESSION_ID.test(sessionId);

  return (
    <main>
      <SiteHeader compact />
      {valid ? (
        // Keyed so a different session starts from a clean slate.
        <OrderConfirmation key={sessionId} sessionId={sessionId} />
      ) : (
        <section className="empty-page">
          <p className="eyebrow">Checkout</p>
          <h1>No order to show</h1>
          <p>This link doesn&apos;t point to an order. If you just paid, check your email for the receipt.</p>
          <Link href="/" className="button primary">
            <span>Back to the shop</span>
            <ArrowRight size={18} />
          </Link>
        </section>
      )}
    </main>
  );
}
