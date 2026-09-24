"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, ChevronDown, RotateCcw, X } from "lucide-react";
import { sortOptions, type ProductFilters, type SortOption } from "@/lib/catalog";
import { useHoverMenu } from "./use-hover-menu";

type BrandFacet = {
  name: string;
  slug: string;
  count: number;
};

type FilterBarProps = {
  brands: BrandFacet[];
  filters: ProductFilters;
  resultCount: number;
};

export function FilterBar({ brands, filters, resultCount }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  // Local copy so chips react instantly while the server re-renders the grid.
  const [current, setCurrent] = useState(filters);

  // When the URL settles (or back/forward changes it), take the server's filters again.
  // Compared by value, since `filters` is a new object on every render.
  const filtersKey = `${filters.brands.join(",")}|${filters.sort}`;
  const [syncedKey, setSyncedKey] = useState(filtersKey);
  if (filtersKey !== syncedKey) {
    setSyncedKey(filtersKey);
    setCurrent(filters);
  }

  function update(next: ProductFilters) {
    setCurrent(next);

    // Start from the current URL so params the bar doesn't own, like the search query, survive.
    const params = new URLSearchParams(window.location.search);
    params.delete("brand");
    params.delete("sort");
    next.brands.forEach((slug) => params.append("brand", slug));
    if (next.sort !== "featured") {
      params.set("sort", next.sort);
    }

    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  function toggleBrand(slug: string) {
    const selected = current.brands.includes(slug)
      ? current.brands.filter((brand) => brand !== slug)
      : [...current.brands, slug];

    update({ ...current, brands: selected });
  }

  return (
    <div className="filter-bar" data-pending={isPending || undefined}>
      <div className="filter-group" role="group" aria-label="Filter by brand">
        <span className="filter-label">Brand</span>
        {brands.map((brand) => (
          <button
            type="button"
            className="filter-chip"
            key={brand.slug}
            aria-pressed={current.brands.includes(brand.slug)}
            onClick={() => toggleBrand(brand.slug)}
          >
            <span>{brand.name}</span>
            <small>{brand.count}</small>
          </button>
        ))}
        {current.brands.length > 0 && (
          <button
            type="button"
            className="filter-clear"
            onClick={() => update({ ...current, brands: [] })}
          >
            <X size={14} strokeWidth={2.6} />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className="filter-group">
        <span className="result-count" aria-live="polite">
          {resultCount} {resultCount === 1 ? "product" : "products"}
        </span>
        <SortMenu value={current.sort} onChange={(sort) => update({ ...current, sort })} />
      </div>
    </div>
  );
}

function SortMenu({
  value,
  onChange
}: {
  value: SortOption;
  onChange: (sort: SortOption) => void;
}) {
  const { open, setOpen, containerProps, triggerProps } = useHoverMenu();
  const active = sortOptions.find((option) => option.value === value);

  function choose(sort: SortOption) {
    setOpen(false);
    onChange(sort);
  }

  return (
    <div className="nav-menu sort-menu" {...containerProps}>
      <button
        type="button"
        className="filter-chip sort-trigger"
        aria-controls="sort-dropdown"
        data-active={active ? true : undefined}
        {...triggerProps}
      >
        <span>{active?.label ?? "Sort"}</span>
        <ChevronDown size={15} strokeWidth={2.6} />
      </button>

      {open && (
        <div className="dropdown" id="sort-dropdown">
          <div className="dropdown-panel">
            <p className="eyebrow">Sort by</p>
            <ul>
              {sortOptions.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    className="dropdown-item"
                    aria-pressed={option.value === value}
                    onClick={() => choose(option.value)}
                  >
                    <span>{option.label}</span>
                    {option.value === value && <Check size={16} strokeWidth={2.6} />}
                  </button>
                </li>
              ))}
            </ul>
            {active && (
              <button type="button" className="dropdown-footer" onClick={() => choose("featured")}>
                <span>Reset order</span>
                <RotateCcw size={15} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
