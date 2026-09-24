import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { categories } from "@/lib/catalog";
import { NewsletterForm } from "./newsletter-form";

// "#" links are placeholders until those pages and accounts exist.
const linkColumns = [
  {
    title: "Shop",
    links: [
      ...categories.map((category) => ({
        label: category.name,
        href: `/category/${category.slug}`
      })),
      { label: "All equipment", href: "/#catalog" }
    ]
  },
  {
    title: "Help",
    links: [
      { label: "FAQs", href: "/#faq" },
      { label: "Delivery", href: "/#faq" },
      { label: "Returns", href: "/#faq" },
      { label: "Contact us", href: "mailto:hello@forgefit.example" }
    ]
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Our brands", href: "#" },
      { label: "Sustainability", href: "#" },
      { label: "Work with us", href: "#" }
    ]
  }
];

const socialLinks = [
  { label: "Instagram", href: "#" },
  { label: "TikTok", href: "#" },
  { label: "YouTube", href: "#" },
  { label: "X", href: "#" }
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="newsletter-card">
          <h2>Newsletter</h2>
          <p>New drops, restocks and home gym setups. One email a month, no spam.</p>
          <NewsletterForm />
        </div>

        <nav className="footer-links" aria-label="Footer">
          {linkColumns.map((column) => (
            <div key={column.title}>
              <h3>{column.title}</h3>
              <ul>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="footer-social">
          <h3>Follow us</h3>
          <ul>
            {socialLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-brand">
          <Link href="/" className="brand" aria-label="ForgeFit Supply home">
            <span className="brand-mark">
              <Dumbbell size={18} strokeWidth={2.6} />
            </span>
            <span>ForgeFit Supply</span>
          </Link>
          <span className="footer-tagline">
            Built for the room
            <br />
            you train in.
          </span>
        </div>
        <p>
          © {new Date().getFullYear()} ForgeFit Supply. Portfolio project: payments run in
          Stripe test mode.
        </p>
      </div>
    </footer>
  );
}
