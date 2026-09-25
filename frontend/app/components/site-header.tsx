import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { getNavCategories } from "@/lib/api/catalog";
import { AccountLink } from "./account-link";
import { CategoriesMenu } from "./categories-menu";
import { CartLink } from "./cart-link";
import { SearchBar } from "./search-bar";

type SiteHeaderProps = {
  compact?: boolean;
  // Prefills the search box on the results page.
  query?: string;
};

export async function SiteHeader({ compact = false, query }: SiteHeaderProps) {
  // Cached and shared with the rest of the page, so this doesn't cost an extra round trip.
  const categories = await getNavCategories();

  return (
    <header className={compact ? "site-header compact" : "site-header"}>
      <Link href="/" className="brand" aria-label="ForgeFit Supply home">
        <span className="brand-mark">
          <Dumbbell size={18} strokeWidth={2.6} />
        </span>
        <span>ForgeFit Supply</span>
      </Link>
      <SearchBar initialQuery={query} />
      <nav className="main-nav" aria-label="Primary navigation">
        <CategoriesMenu categories={categories} />
        <AccountLink />
        <CartLink />
      </nav>
    </header>
  );
}
