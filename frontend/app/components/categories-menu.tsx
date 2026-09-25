"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { Category } from "@/lib/api/types";
import { useHoverMenu } from "./use-hover-menu";

export function CategoriesMenu({ categories }: { categories: Category[] }) {
  const { open, setOpen, containerProps, triggerProps } = useHoverMenu();
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  return (
    <div className="nav-menu" {...containerProps}>
      <button
        type="button"
        className="nav-menu-trigger"
        aria-controls="categories-dropdown"
        {...triggerProps}
      >
        <span>Categories</span>
        <ChevronDown size={16} strokeWidth={2.6} />
      </button>

      {open && (
        <div className="dropdown" id="categories-dropdown">
          <div className="dropdown-panel">
            <p className="eyebrow">Shop by category</p>
            <ul>
              {categories.map((category) => {
                const href = `/category/${category.slug}`;

                return (
                  <li key={category.slug}>
                    <Link
                      href={href}
                      className="dropdown-item"
                      aria-current={pathname === href ? "page" : undefined}
                      onClick={() => setOpen(false)}
                    >
                      <span>{category.name}</span>
                      <small>{category.count}</small>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link href="/#catalog" className="dropdown-footer" onClick={() => setOpen(false)}>
              <span>All equipment</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
