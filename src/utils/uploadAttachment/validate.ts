// Client-side attachment validation before requesting presigned URLs

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_FILE_COUNT = 4;

export interface ValidationError {
  file: File;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validates a list of files for type, size, and count constraints.
 * Returns localized error messages.
 *
 * Note: We accept a `t` function compatible with next-intl's `useTranslations` output
 * so that callers can pass their own translator. Falls back to English defaults.
 *
 * `existingCount` lets callers whose already-attached items aren't File objects
 * (e.g. previously uploaded attachments) fold them into the count check.
 */
export function validateAttachments(
  files: File[],
  t?: (key: string, options?: { defaultValue: string; [k: string]: unknown }) => string,
  existingCount = 0
): ValidationResult {
  const errors: ValidationError[] = [];

  const translate = (key: string, defaultValue: string, vars?: Record<string, unknown>) =>
    t ? t(key, { defaultValue, ...vars }) : defaultValue;

  // Count validation
  if (existingCount + files.length > MAX_FILE_COUNT) {
    // Return immediately — no point checking individual files
    return {
      valid: false,
      errors: files.map(file => ({
        file,
        message: translate(
          'Attachments.tooManyFiles',
          `Maximum ${MAX_FILE_COUNT} attachments per message`,
          { max: MAX_FILE_COUNT }
        ),
      })),
    };
  }

  for (const file of files) {
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      errors.push({
        file,
        message: translate(
          'Attachments.invalidType',
          `Unsupported file type "${file.type}". Only JPEG, PNG, WEBP, and PDF are allowed.`,
          { type: file.type }
        ),
      });
      continue;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      errors.push({
        file,
        message: translate(
          'Attachments.fileTooLarge',
          `"${file.name}" exceeds the 10 MB size limit`,
          { name: file.name, maxMb: 10 }
        ),
      });
    }
  }

  return { valid: errors.length === 0, errors };
}
