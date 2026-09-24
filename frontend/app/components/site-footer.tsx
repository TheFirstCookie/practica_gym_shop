import Link from "next/link";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { categories } from "@/lib/catalog";

const helpLinks = [
  { label: "FAQs", href: "/#faq" },
  { label: "Your cart", href: "/cart" },
  { label: "Contact us", href: "mailto:hello@forgefit.example" }
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-intro">
          <p className="eyebrow">ForgeFit Supply</p>
          <h2>Built for the room you train in.</h2>
          <p>
            Strength, conditioning and recovery gear from independent brands, picked for
            home gyms and compact studios.
          </p>
        </div>

        <nav className="footer-links" aria-label="Footer">
          <div>
            <h3 className="eyebrow">Shop</h3>
            <ul>
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link href={`/category/${category.slug}`}>
                    <span>{category.name}</span>
                    <small>{category.count}</small>
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/#catalog">
                  <span>All equipment</span>
                  <ArrowUpRight size={16} />
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="eyebrow">Help</h3>
            <ul>
              {helpLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>
                    <span>{link.label}</span>
                    <ArrowUpRight size={16} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      <p className="footer-wordmark" aria-hidden="true">
        ForgeFit
      </p>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} ForgeFit Supply</p>
        <a href="#" className="back-to-top">
          <span>Back to top</span>
          <ArrowUp size={15} strokeWidth={2.6} />
        </a>
      </div>
    </footer>
  );
}
