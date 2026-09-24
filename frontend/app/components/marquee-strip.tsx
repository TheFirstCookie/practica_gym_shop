import { Fragment } from "react";
import { categories } from "@/lib/catalog";
import { storePerks } from "@/lib/store-info";

const items = [...storePerks.map((perk) => perk.title), ...categories.map((c) => c.name)];

// The track holds the list twice and slides by half its width, so the loop is seamless.
export function MarqueeStrip() {
  return (
    <div className="marquee" role="presentation">
      <div className="marquee-track">
        {[0, 1].map((copy) => (
          <ul className="marquee-list" key={copy} aria-hidden={copy === 1 ? true : undefined}>
            {items.map((item) => (
              <Fragment key={item}>
                <li>{item}</li>
                <li className="marquee-dot" aria-hidden="true" />
              </Fragment>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
