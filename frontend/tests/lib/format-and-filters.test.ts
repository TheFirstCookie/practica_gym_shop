import { describe, expect, it } from "vitest";
import { hasActiveFilters, parseFilters, parsePage, parseQuery } from "@/lib/filters";
import { formatDate, formatPrice } from "@/lib/format";
import { addressLines, orderNumber } from "@/lib/orders";
import { toMetaDescription } from "@/lib/site";

describe("formatPrice", () => {
  it("drops .00 from whole amounts and keeps cents otherwise", () => {
    expect(formatPrice(22900)).toBe("$229");
    expect(formatPrice(2999)).toBe("$29.99");
    expect(formatPrice(123456)).toBe("$1,234.56");
  });

  it("uses the product's currency", () => {
    expect(formatPrice(1000, "eur")).toBe("€10");
  });
});

describe("formatDate", () => {
  it("formats an ISO timestamp as a short date", () => {
    expect(formatDate("2026-09-25T12:00:00Z")).toBe("Sep 25, 2026");
  });
});

describe("storefront URL filters", () => {
  it("keeps valid, unique brand slugs and a known sort", () => {
    expect(parseFilters({ brand: ["ironline", "ironline", "Bad Slug!", "groundwork"], sort: "price-asc" })).toEqual({
      brands: ["ironline", "groundwork"],
      sort: "price-asc"
    });
  });

  it("falls back to featured for unknown sorts", () => {
    const filters = parseFilters({ sort: "cheapest-first" });
    expect(filters.sort).toBe("featured");
    expect(hasActiveFilters(filters)).toBe(false);
    expect(hasActiveFilters(parseFilters({ brand: "ironline" }))).toBe(true);
  });

  it("reads the page and search, ignoring nonsense", () => {
    expect(parsePage({ page: "3" })).toBe(3);
    expect(parsePage({ page: "-1" })).toBe(1);
    expect(parsePage({ page: "2.5" })).toBe(1);
    expect(parsePage({})).toBe(1);
    expect(parseQuery({ q: "  kettle  " })).toBe("kettle");
    expect(parseQuery({ q: "x".repeat(200) })).toHaveLength(80);
  });
});

describe("orders", () => {
  it("shows a short order number", () => {
    expect(orderNumber("57ab6234-0000-4000-8000-000000000000")).toBe("#57AB6234");
  });

  it("lays out an address like a shipping label", () => {
    expect(
      addressLines({
        name: "Ana Buyer",
        line1: "Str. 1",
        line2: null,
        city: "Chisinau",
        state: null,
        postalCode: "2000",
        country: "MD"
      })
    ).toEqual(["Ana Buyer", "Str. 1", "2000 Chisinau", "Moldova"]);
  });
});

describe("toMetaDescription", () => {
  it("leaves short text alone and cuts long text at a word", () => {
    expect(toMetaDescription("  Short   text ")).toBe("Short text");
    const long = toMetaDescription("word ".repeat(60));
    expect(long.length).toBeLessThanOrEqual(155);
    expect(long.endsWith("word…")).toBe(true);
  });
});
