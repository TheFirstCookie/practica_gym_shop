// The policy pages, for their tab bar, the footer and the sitemap.

export const LEGAL_PAGES = [
  { href: "/shipping-returns", label: "Shipping & returns" },
  { href: "/terms", label: "Terms of sale" },
  { href: "/privacy", label: "Privacy policy" }
] as const;

export type LegalPath = (typeof LEGAL_PAGES)[number]["href"];

/** When the policies last changed (UTC day). Update it with any edit to their text. */
export const LEGAL_UPDATED = "2026-09-26";
