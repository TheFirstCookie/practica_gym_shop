import type { ShippingAddress } from "./api/types";

// Order display helpers shared by the shopper's account and the admin.

/** Short, readable order number: the first 8 characters of the id, e.g. "#57AB6234". */
export function orderNumber(id: string) {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

function countryName(code: string) {
  try {
    return countryNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/** The address as it goes on a shipping label, one line per entry. */
export function addressLines(address: ShippingAddress): string[] {
  const cityLine = [address.postalCode, address.city].filter(Boolean).join(" ");
  return [
    address.name,
    address.line1,
    address.line2,
    [cityLine, address.state].filter(Boolean).join(", "),
    address.country ? countryName(address.country) : null
  ].filter((line): line is string => Boolean(line));
}
