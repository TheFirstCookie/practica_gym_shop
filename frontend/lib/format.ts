const formatters = new Map<string, Intl.NumberFormat>();

/** 22900 cents -> "$229", 2999 -> "$29.99". Whole amounts drop the ".00". */
export function formatPrice(cents: number, currency = "usd") {
  const whole = cents % 100 === 0;
  const key = `${currency}:${whole}`;

  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2
    });
    formatters.set(key, formatter);
  }

  return formatter.format(cents / 100);
}
