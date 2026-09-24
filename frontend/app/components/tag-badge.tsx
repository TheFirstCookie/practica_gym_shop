type TagTone = "brand" | "hot" | "fresh" | "calm";

// Tags are free text from the catalog, so unknown ones fall back to the brand tone.
const toneByTag: Record<string, TagTone> = {
  "best seller": "brand",
  "low stock": "hot",
  new: "fresh",
  recovery: "calm"
};

type TagBadgeProps = {
  tag: string;
  className?: string;
};

export function TagBadge({ tag, className }: TagBadgeProps) {
  const tone = toneByTag[tag.toLowerCase()] ?? "brand";

  return (
    <span className={className ? `tag-badge ${className}` : "tag-badge"} data-tone={tone}>
      {tag}
    </span>
  );
}
