import { Dumbbell } from "lucide-react";

type ProductImageProps = {
  src: string | null;
  alt: string;
};

// Products can be saved without a photo, so every image slot needs a fallback.
export function ProductImage({ src, alt }: ProductImageProps) {
  if (!src) {
    return (
      <span className="image-placeholder" role="img" aria-label={alt || undefined}>
        <Dumbbell size={40} strokeWidth={1.6} aria-hidden="true" />
      </span>
    );
  }

  // Plain <img>: photos come from several hosts (Supabase Storage, Unsplash), and the
  // grid already sizes them, so next/image's optimiser adds little here.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" />;
}
