import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private or per-visitor pages. Search results stay crawlable but carry noindex.
      disallow: ["/admin", "/account", "/cart", "/checkout"]
    },
    sitemap: `${SITE_URL}/sitemap.xml`
  };
}
