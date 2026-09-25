import type { ImageContentType } from "@/lib/api/admin";

// Shrinks product photos in the browser before upload: a phone photo (4000px, 5+ MB)
// becomes a ~1600px WebP of a few hundred KB, so the shop loads fast and Storage stays small.

/** Longest side after resizing. Product images are shown at most ~700px wide (2x for retina). */
export const MAX_IMAGE_EDGE = 1600;
/** Files already this small and within MAX_IMAGE_EDGE are uploaded untouched. */
const SMALL_ENOUGH_BYTES = 800 * 1024;
const QUALITY = 0.85;

export type PreparedImage = {
  blob: Blob;
  contentType: ImageContentType;
  /** Set when the file was re-encoded, for a "resized from ..." hint. */
  resized?: { width: number; height: number };
};

function encode(canvas: HTMLCanvasElement, type: ImageContentType): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

/**
 * Returns the photo ready to upload: resized and re-encoded when it's large, or the
 * original file when it's already small or the browser can't decode it (e.g. AVIF in an
 * older browser), in which case the upload's own size limit still applies.
 */
export async function prepareProductImage(file: File, type: ImageContentType): Promise<PreparedImage> {
  const original: PreparedImage = { blob: file, contentType: type };

  let bitmap: ImageBitmap;
  try {
    // "from-image" applies the camera's EXIF rotation, so portrait phone photos stay upright.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return original;
  }

  try {
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= SMALL_ENOUGH_BYTES) return original;

    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return original;

    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, width, height);

    // WebP keeps transparency and is smallest. Browsers that can't encode it hand back a
    // PNG instead; use JPEG then, on white, since JPEG has no transparency.
    let blob = await encode(canvas, "image/webp");
    let contentType: ImageContentType = "image/webp";
    if (!blob || blob.type !== "image/webp") {
      context.globalCompositeOperation = "destination-over";
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      blob = await encode(canvas, "image/jpeg");
      contentType = "image/jpeg";
    }

    // Re-encoding a small, already-compressed file can make it bigger; keep the original then.
    if (!blob || (scale === 1 && blob.size >= file.size)) return original;
    return { blob, contentType, resized: { width, height } };
  } finally {
    bitmap.close();
  }
}
