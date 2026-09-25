"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { createImageUpload, type ImageContentType } from "@/lib/api/admin";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ProductImage } from "@/app/components/product-image";
import { useAdminApi } from "../use-admin-api";

// Same limits as the Storage bucket (migration 0003), checked here for a faster answer.
const ACCEPTED_TYPES: ImageContentType[] = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 5 * 1024 * 1024;

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

  async function upload(file: File) {
    setUploadError(null);

    if (!ACCEPTED_TYPES.includes(file.type as ImageContentType)) {
      setUploadError("Use a JPEG, PNG, WebP or AVIF image");
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError("Images can be up to 5 MB");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setUploadError("Uploads aren't configured");
      return;
    }

    setUploading(true);
    try {
      const ticket = await run((token) => createImageUpload(token, file.type as ImageContentType));
      const { error: storageError } = await supabase.storage
        .from(ticket.bucket)
        .uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: file.type });
      if (storageError) throw storageError;
      onChange(ticket.publicUrl);
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
          <button type="button" className="admin-link-button" onClick={() => onChange(null)}>
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
        <small className="admin-hint">JPEG, PNG, WebP or AVIF, up to 5 MB. Square photos look best.</small>
        {message && (
          <p className="admin-field-error" role="alert">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
