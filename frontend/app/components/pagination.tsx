import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Pagination as PaginationMeta } from "@/lib/api/types";
import type { SearchParams } from "@/lib/filters";

type PaginationProps = {
  pagination: PaginationMeta;
  pathname: string;
  /** Current params, so filters and search survive page changes. */
  searchParams: SearchParams;
  /** Appended to every link, e.g. "#catalog" to keep the grid in view. */
  hash?: string;
};

function pageHref(pathname: string, searchParams: SearchParams, page: number, hash = "") {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page" || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) params.append(key, item);
  }
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ""}${hash}`;
}

// Page numbers to show: always the first and last, plus a window around the current one.
function visiblePages(current: number, total: number): (number | "gap")[] {
  const pages: (number | "gap")[] = [];

  for (let page = 1; page <= total; page += 1) {
    if (page === 1 || page === total || Math.abs(page - current) <= 1) {
      pages.push(page);
    } else if (pages.at(-1) !== "gap") {
      pages.push("gap");
    }
  }

  return pages;
}

export function Pagination({ pagination, pathname, searchParams, hash }: PaginationProps) {
  const { page, totalPages } = pagination;

  if (totalPages <= 1) {
    return null;
  }

  const href = (target: number) => pageHref(pathname, searchParams, target, hash);

  return (
    <nav className="pagination" aria-label="Pages">
      {page > 1 ? (
        <Link href={href(page - 1)} className="pagination-step" rel="prev">
          <ArrowLeft size={16} />
          <span>Previous</span>
        </Link>
      ) : (
        <span className="pagination-step" aria-hidden="true" />
      )}

      <ol>
        {visiblePages(page, totalPages).map((item, index) =>
          item === "gap" ? (
            <li key={`gap-${index}`} className="pagination-gap" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={item}>
              <Link href={href(item)} aria-current={item === page ? "page" : undefined}>
                {item}
              </Link>
            </li>
          )
        )}
      </ol>

      {page < totalPages ? (
        <Link href={href(page + 1)} className="pagination-step" rel="next">
          <span>Next</span>
          <ArrowRight size={16} />
        </Link>
      ) : (
        <span className="pagination-step" aria-hidden="true" />
      )}
    </nav>
  );
}
