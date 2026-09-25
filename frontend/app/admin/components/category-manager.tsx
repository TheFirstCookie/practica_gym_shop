"use client";

import { createCategory, deleteCategory, listAdminCategories, updateCategory } from "@/lib/api/admin";
import type { AdminCategory } from "@/lib/api/types";
import { TaxonomyManager, type TaxonomyConfig, type TaxonomyInput } from "./taxonomy-manager";

// Categories always send a colour and an order (the form fills both in).
const withDefaults = (input: TaxonomyInput) => ({
  name: input.name,
  slug: input.slug,
  accent: input.accent ?? "#ff6b1a",
  sortOrder: input.sortOrder ?? 0
});

// Module-level so its identity is stable (the manager reloads when the config changes).
const categoryConfig: TaxonomyConfig<AdminCategory> = {
  noun: "category",
  title: "Categories",
  intro:
    "Categories group products in the shop's menu and home page tiles, lowest order first. " +
    "A category can be deleted once no products (hidden ones included) use it.",
  hasAccentAndOrder: true,
  list: listAdminCategories,
  create: (token, input) => createCategory(token, withDefaults(input)),
  update: (token, id, input) => updateCategory(token, id, withDefaults(input)),
  remove: deleteCategory
};

export function CategoryManager() {
  return <TaxonomyManager config={categoryConfig} />;
}
