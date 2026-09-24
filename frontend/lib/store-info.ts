// Store-wide promises shown in the marquee and the perks band.
// Keep these in line with the FAQ copy so the site never contradicts itself.
export type StorePerk = {
  id: "shipping" | "returns" | "warranty";
  title: string;
  detail: string;
};

export const storePerks: StorePerk[] = [
  {
    id: "shipping",
    title: "15-day shipping",
    detail: "Every order arrives within 15 days. Freight pieces get a booked slot."
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
  }
];
