import type { CSSProperties } from "react";
import { Star } from "lucide-react";

const FIVE = [1, 2, 3, 4, 5];

type StarsProps = {
  /** 0 to 5; fractions fill part of a star (4.5 shows four and a half). */
  rating: number;
  size?: number;
  /** Read out instead of the default "4.5 out of 5 stars". */
  label?: string;
};

/** A row of five stars filled up to `rating`. Works on the server and in the browser. */
export function Stars({ rating, size = 16, label }: StarsProps) {
  const filled = Math.min(Math.max(rating / 5, 0), 1) * 100;
  const style = { "--star-size": `${size}px` } as CSSProperties;

  return (
    <span className="stars" role="img" aria-label={label ?? `${rating} out of 5 stars`} style={style}>
      <span className="stars-row" aria-hidden="true">
        {FIVE.map((value) => (
          <Star key={value} size={size} />
        ))}
      </span>
      {/* The same row, filled, clipped to the rating's width. */}
      <span className="stars-row stars-filled" aria-hidden="true" style={{ width: `${filled}%` }}>
        {FIVE.map((value) => (
          <Star key={value} size={size} fill="currentColor" />
        ))}
      </span>
    </span>
  );
}
