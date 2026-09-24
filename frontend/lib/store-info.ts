// Store-wide promises shown in the marquee and the perks band.
// Keep these in line with the FAQ copy so the site never contradicts itself.
export type StorePerk = {
  id: "dispatch" | "returns" | "warranty" | "checkout";
  title: string;
  detail: string;
};

export const storePerks: StorePerk[] = [
  {
    id: "dispatch",
    title: "Ships in 1–2 days",
    detail: "Small items leave the warehouse fast. Freight pieces get a booked slot."
  },
  {
    id: "returns",
    title: "30-day returns",
    detail: "Unused and in its box? Send it back within 30 days."
  },
  {
    id: "warranty",
    title: "Up to 5-year warranty",
    detail: "Manufacturer cover on every item, longest on steel frames."
  },
  {
    id: "checkout",
    title: "Stripe checkout",
    detail: "Card details stay on Stripe's hosted page, never on our servers."
  }
];
