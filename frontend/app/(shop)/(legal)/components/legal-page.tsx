import Link from "next/link";
import { Info } from "lucide-react";
import { SiteHeader } from "@/app/components/site-header";
import { LEGAL_PAGES, LEGAL_UPDATED, type LegalPath } from "@/lib/legal";
import { STORE_EMAIL, STORE_MAILTO } from "@/lib/store-info";

const updatedLabel = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC"
}).format(new Date(`${LEGAL_UPDATED}T00:00:00Z`));

type LegalPageProps = {
  path: LegalPath;
  title: string;
  intro: string;
  children: React.ReactNode;
};

/** Header, tabs between the policy pages, the demo notice and the policy text. */
export function LegalPage({ path, title, intro, children }: LegalPageProps) {
  return (
    <main>
      <SiteHeader compact />
      <div className="legal-page">
        <nav className="legal-tabs" aria-label="Policies">
          {LEGAL_PAGES.map((page) => (
            <Link key={page.href} href={page.href} aria-current={page.href === path ? "page" : undefined}>
              {page.label}
            </Link>
          ))}
        </nav>

        <article className="legal-article">
          <header>
            <p className="eyebrow">Policies</p>
            <h1>{title}</h1>
            <p className="legal-intro">{intro}</p>
            <p className="legal-updated">
              Last updated <time dateTime={LEGAL_UPDATED}>{updatedLabel}</time>
            </p>
          </header>

          <aside className="legal-notice">
            <Info size={18} aria-hidden="true" />
            <p>
              ForgeFit Supply is a portfolio project. Checkout runs in Stripe&apos;s test mode, so no real
              payments are taken and no parcels are shipped. These policies describe how the shop works as if
              it were trading.
            </p>
          </aside>

          {children}

          <section aria-labelledby="legal-contact">
            <h2 id="legal-contact">Contact</h2>
            <p>
              Questions about this page? Email <a href={STORE_MAILTO}>{STORE_EMAIL}</a> and we&apos;ll reply
              within a working day.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
