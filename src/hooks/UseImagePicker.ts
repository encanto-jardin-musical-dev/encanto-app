"use client";
import { useEffect, useRef, useState } from "react";

export type ImagePickerState = {
  /** Tri-state: File = new upload, null = explicit removal, undefined = no change */
  file: File | null | undefined;
  /** Blob URL for new picks, existing URL passed in, or null when removed */
  preview: string | null;
  /** Open the native file picker */
  pick: () => void;
  /** Mark the image as removed */
  remove: () => void;
  /** Props to spread on the hidden <input type="file"> */
  inputProps: {
    ref: React.RefObject<HTMLInputElement | null>;
    type: "file";
    accept: string;
    className: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
};

/**
 * Manages the tri-state image picker:
 *  - `undefined`  → no change (keep the existing URL)
 *  - `File`       → new image to upload
 *  - `null`       → explicitly removed
 *
 * Blob URLs are revoked automatically on change and on unmount.
 */
export function useImagePicker(existingUrl: string | null | undefined): ImagePickerState {
  const [file, setFile] = useState<File | null | undefined>(undefined);
  const [preview, setPreview] = useState<string | null>(existingUrl ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke blob URLs when preview changes or on unmount
  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const pick = () => inputRef.current?.click();

  const remove = () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    const next = URL.createObjectURL(picked);
    setFile(picked);
    setPreview(next);
    e.target.value = "";
  };

  return {
    file,
    preview,
    pick,
    remove,
    inputProps: {
      ref: inputRef,
      type: "file",
      accept: "image/jpeg,image/png,image/webp",
      className: "hidden",
      onChange,
    },
  };
}
