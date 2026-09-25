"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { createImageUpload, type ImageContentType } from "@/lib/api/admin";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ProductImage } from "@/app/components/product-image";
import { useAdminApi } from "../use-admin-api";
import { MAX_IMAGE_EDGE, prepareProductImage } from "./prepare-image";

const ACCEPTED_TYPES: ImageContentType[] = ["image/jpeg", "image/png", "image/webp", "image/avif"];
/** Big photos are shrunk before upload, so the original may exceed the bucket's limit. */
const MAX_ORIGINAL_BYTES = 30 * 1024 * 1024;
/** The Storage bucket's limit (migration 0003), for what's actually uploaded. */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

type ImageFieldProps = {
  value: string | null;
  onChange: (url: string | null) => void;
  error?: string;
};

/**
 * Product photo: upload a file or paste a URL. Uploads go straight from the browser to
 * Supabase Storage with a one-time signed URL from the API, so files never pass through
 * the API server.
 */
export function ImageField({ value, onChange, error }: ImageFieldProps) {
  const { run } = useAdminApi();
  const inputId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadNote, setUploadNote] = useState<string | null>(null);

  async function upload(file: File) {
    setUploadError(null);
    setUploadNote(null);

    const type = file.type as ImageContentType;
    if (!ACCEPTED_TYPES.includes(type)) {
      setUploadError("Use a JPEG, PNG, WebP or AVIF image");
      return;
    }
    if (file.size > MAX_ORIGINAL_BYTES) {
      setUploadError("That file is over 30 MB. Try a smaller photo.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setUploadError("Uploads aren't configured");
      return;
    }

    setUploading(true);
    try {
      const image = await prepareProductImage(file, type);
      if (image.blob.size > MAX_UPLOAD_BYTES) {
        throw new Error("This image is still over 5 MB after resizing. Try a JPEG or WebP.");
      }

      const ticket = await run((token) => createImageUpload(token, image.contentType));
      const { error: storageError } = await supabase.storage
        .from(ticket.bucket)
        .uploadToSignedUrl(ticket.path, ticket.token, image.blob, { contentType: image.contentType });
      if (storageError) throw storageError;
      onChange(ticket.publicUrl);
      if (image.resized) {
        const { width, height } = image.resized;
        setUploadNote(`Resized to ${width} × ${height} (${formatBytes(file.size)} → ${formatBytes(image.blob.size)}).`);
      }
    } catch (caught) {
      setUploadError(caught instanceof Error ? caught.message : "The upload failed");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  const message = uploadError ?? error;

  return (
    <div className="admin-image-field">
      <div className="admin-image-preview">
        <ProductImage src={value} alt="Product photo preview" />
      </div>

      <div className="admin-image-controls">
        <input
          ref={fileInput}
          id={inputId}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="visually-hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <label htmlFor={inputId} className="button secondary" aria-disabled={uploading}>
          <ImagePlus size={17} />
          <span>{uploading ? "Uploading…" : value ? "Replace photo" : "Upload photo"}</span>
        </label>
        {value && (
          <button
            type="button"
            className="admin-link-button"
            onClick={() => {
              onChange(null);
              setUploadNote(null);
            }}
          >
            <Trash2 size={15} />
            <span>Remove</span>
          </button>
        )}

        <label className="admin-field">
          <span>Or paste an image URL</span>
          <input
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={value ?? ""}
            onChange={(event) => onChange(event.target.value.trim() || null)}
          />
        </label>
        <small className="admin-hint">
          JPEG, PNG, WebP or AVIF. Large photos are shrunk to {MAX_IMAGE_EDGE}px before upload. Square
          photos look best.
        </small>
        {uploadNote && (
          <small className="admin-hint" role="status">
            {uploadNote}
          </small>
        )}
        {message && (
          <p className="admin-field-error" role="alert">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
