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

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

/** "2026-09-25T14:39:32Z" -> "Sep 25, 2026, 4:39 PM" in the viewer's time zone. */
export function formatDateTime(iso: string) {
  return dateTimeFormatter.format(new Date(iso));
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

/** "2026-09-25T14:39:32Z" -> "Sep 25, 2026" in the viewer's time zone. */
export function formatDate(iso: string) {
  return dateFormatter.format(new Date(iso));
}
