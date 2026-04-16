'use client';

// MessageAttachments — renders all attachments for a message bubble.
//
// Images (jpeg/png/webp) → ImageGrid (inline thumbnails, click-to-preview)
// Files (PDF) → clickable icon+filename links (unchanged from Phase 1)
//
// Images always render above file links within the card.
// Loading and error states are isolated per-attachment type.

import type { Attachment } from '@/types/messages.types';
import type { SignedUrlMap } from '@/hooks/UseAttachmentUrlsQuery';
import {
  DocumentIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { Skeleton } from '@heroui/react';
import ImageGrid from '@/components/messages/ImageGrid';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MessageAttachmentsProps {
  attachments: Attachment[];
  /** Map of attachment key → presigned GET URL */
  signedUrls: SignedUrlMap;
  /** Whether the signed URLs are still being fetched */
  isLoading?: boolean;
  /** Whether the URL signing request failed entirely */
  isError?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isImageType(contentType: string): boolean {
  return contentType.startsWith('image/');
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

/**
 * Skeleton displayed while signed URLs are being fetched.
 * Shows grid-shaped blocks for images and bar-shaped blocks for files.
 */
function LoadingSkeleton({ imageCount, fileCount }: { imageCount: number; fileCount: number }) {
  return (
    <div className="flex flex-col gap-1 mt-2">
      {/* Grid-shaped skeletons for image attachments */}
      {imageCount > 0 && (
        <div className={imageCount === 1 ? 'grid grid-cols-1' : 'grid grid-cols-2 gap-1'}>
          {Array.from({ length: imageCount }).map((_, i) => {
            const isFirstOfThree = imageCount === 3 && i === 0;
            return (
              <Skeleton
                key={i}
                className={[
                  'rounded-lg',
                  isFirstOfThree ? 'col-span-2 aspect-[2/1]' : 'aspect-square',
                  imageCount === 1 ? 'aspect-[4/3] max-h-[300px]' : '',
                ].join(' ')}
              />
            );
          })}
        </div>
      )}

      {/* Bar-shaped skeletons for file attachments */}
      {fileCount > 0 && (
        <div className="flex flex-col gap-1">
          {Array.from({ length: fileCount }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-40 rounded-md" />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders message attachments:
 * - Image attachments → inline thumbnail grid with click-to-fullscreen (via ImageGrid)
 * - File attachments → clickable icon+filename links (PDFs)
 *
 * Neither section crashes the message card if a single attachment fails.
 */
export default function MessageAttachments({
  attachments,
  signedUrls,
  isLoading = false,
  isError = false,
}: MessageAttachmentsProps) {
  if (!attachments || attachments.length === 0) return null;

  const imageAttachments = attachments.filter(att => isImageType(att.contentType));
  const fileAttachments = attachments.filter(att => !isImageType(att.contentType));

  // Show type-aware skeleton while URLs are being fetched
  if (isLoading) {
    return (
      <LoadingSkeleton
        imageCount={imageAttachments.length}
        fileCount={fileAttachments.length}
      />
    );
  }

  return (
    <div>
      {/* Image attachments: inline thumbnail grid */}
      {imageAttachments.length > 0 && (
        <ImageGrid
          images={imageAttachments}
          signedUrls={signedUrls}
        />
      )}

      {/* File attachments: icon + filename links (PDFs) */}
      {fileAttachments.length > 0 && (
        <div className="flex flex-col gap-1 mt-2">
          {fileAttachments.map((att, i) => {
            const url = signedUrls[att.key];
            const hasError = isError || (!isLoading && !url);

            // Inline error state per file — does not crash the message
            if (hasError) {
              return (
                <div
                  key={`${att.key}-${i}`}
                  className="flex items-center gap-1.5 text-danger text-sm"
                  aria-label={`Failed to load attachment: ${att.name}`}
                >
                  <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
                  <span className="truncate max-w-[200px]">{att.name}</span>
                </div>
              );
            }

            // Clickable link: document icon + filename, opens in new tab
            return (
              <a
                key={`${att.key}-${i}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                aria-label={`Open attachment: ${att.name}`}
              >
                <DocumentIcon className="w-4 h-4 shrink-0" />
                <span className="truncate max-w-[200px]">{att.name}</span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
