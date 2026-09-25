import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "./site-header";

/** Shared body of the two 404 pages (see app/not-found.tsx and app/(shop)/not-found.tsx). */
export function NotFoundContent() {
  return (
    <main>
      <SiteHeader compact />
      <section className="empty-page">
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p>That product or page doesn&apos;t exist, or it has moved.</p>
        <Link href="/#catalog" className="button primary">
          <span>Back to the shop</span>
          <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  );
}
