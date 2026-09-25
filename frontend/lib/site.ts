// Site identity used for SEO: canonical URLs, the sitemap, robots.txt and share previews.

export const SITE_NAME = "ForgeFit Supply";

export const SITE_DESCRIPTION =
  "Strength equipment, conditioning tools, recovery staples and smart storage for home gyms " +
  "and compact studios. Ships within 15 days, 30-day returns.";

/**
 * The public origin, without a trailing slash. Set NEXT_PUBLIC_SITE_URL for a custom domain;
 * on Vercel the production domain is picked up automatically (VERCEL_PROJECT_PRODUCTION_URL,
 * a system variable available on the server).
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/+$/, "");

/** Search snippets show roughly 155 characters; cut longer text at a word boundary. */
export function toMetaDescription(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 80 ? cut.lastIndexOf(" ") : cut.length)}…`;
}
