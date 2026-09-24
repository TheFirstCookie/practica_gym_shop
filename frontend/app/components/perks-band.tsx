import { RotateCcw, ShieldCheck, Truck, LockKeyhole, type LucideIcon } from "lucide-react";
import { storePerks, type StorePerk } from "@/lib/store-info";

const perkIcons: Record<StorePerk["id"], LucideIcon> = {
  dispatch: Truck,
  returns: RotateCcw,
  warranty: ShieldCheck,
  checkout: LockKeyhole
};

export function PerksBand() {
  return (
    <section className="perks-band" aria-labelledby="perks-title">
      <div className="perks-heading">
        <p className="eyebrow">Why ForgeFit</p>
        <h2 id="perks-title">Gear that shows up and stays put.</h2>
      </div>

      <ul className="perks-list">
        {storePerks.map((perk) => {
          const Icon = perkIcons[perk.id];

          return (
            <li key={perk.id}>
              <Icon size={26} strokeWidth={2.2} aria-hidden="true" />
              <strong>{perk.title}</strong>
              <p>{perk.detail}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
