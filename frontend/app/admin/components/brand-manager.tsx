"use client";

import { createBrand, deleteBrand, listAdminBrands, updateBrand } from "@/lib/api/admin";
import type { AdminBrand } from "@/lib/api/types";
import { TaxonomyManager, type TaxonomyConfig } from "./taxonomy-manager";

// Module-level so its identity is stable (the manager reloads when the config changes).
const brandConfig: TaxonomyConfig<AdminBrand> = {
  noun: "brand",
  title: "Brands",
  intro:
    "Brands appear on product pages and as filters in the shop. " +
    "A brand can be deleted once no products (hidden ones included) use it.",
  hasAccentAndOrder: false,
  list: listAdminBrands,
  create: (token, input) => createBrand(token, { name: input.name, slug: input.slug }),
  update: (token, id, input) => updateBrand(token, id, { name: input.name, slug: input.slug }),
  remove: deleteBrand
};

export function BrandManager() {
  return <TaxonomyManager config={brandConfig} />;
}
