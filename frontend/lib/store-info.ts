// Store-wide promises shown in the marquee, the perks band, the FAQ and the policy pages.
// Keep them in one place so the site never contradicts itself.

/** Where shoppers write for returns, cancellations and privacy requests. */
export const STORE_EMAIL = "forgefit.shops@gmail.com";
export const STORE_MAILTO = `mailto:${STORE_EMAIL}`;

export const SHIPPING_DAYS = 15;
export const RETURN_DAYS = 30;

/** Countries Stripe Checkout accepts a delivery address in (see the API's checkout gateway). */
export const SHIPPING_REGIONS =
  "the EU, the United Kingdom, Switzerland, Norway, Moldova, the United States and Canada";

export type StorePerk = {
  id: "shipping" | "returns" | "warranty";
  title: string;
  detail: string;
};

export const storePerks: StorePerk[] = [
  {
    id: "shipping",
    title: `${SHIPPING_DAYS}-day shipping`,
    detail: `Every order arrives within ${SHIPPING_DAYS} days. Freight pieces get a booked slot.`
  },
  {
    id: "returns",
    title: `${RETURN_DAYS}-day returns`,
    detail: `Unused and in its box? Send it back within ${RETURN_DAYS} days.`
  },
  {
    id: "warranty",
    title: "Up to 5-year warranty",
    detail: "Manufacturer cover on every item, longest on steel frames."
  }
];
