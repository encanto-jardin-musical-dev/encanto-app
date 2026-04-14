'use client';

// 9.1 MessageAttachments component — renders attachment links for a message bubble.
// Accepts resolved signed URLs and displays file-type icons + filenames as clickable links.

import type { Attachment } from '@/types/messages.types';
import type { SignedUrlMap } from '@/hooks/UseAttachmentUrlsQuery';
import {
  DocumentIcon,
  PhotoIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { Skeleton } from '@heroui/react';

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

function AttachmentIcon({ contentType }: { contentType: string }) {
  if (isImageType(contentType)) {
    return <PhotoIcon className="w-4 h-4 shrink-0" />;
  }
  return <DocumentIcon className="w-4 h-4 shrink-0" />;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders a list of message attachments as clickable links.
 * Shows a loading skeleton while signed URLs are being fetched,
 * and an inline error state per attachment if the URL is unavailable.
 * Does NOT crash the surrounding message if a single attachment fails.
 */
export default function MessageAttachments({
  attachments,
  signedUrls,
  isLoading = false,
  isError = false,
}: MessageAttachmentsProps) {
  if (!attachments || attachments.length === 0) return null;

  // 9.3 Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col gap-1 mt-2">
        {attachments.map((att, i) => (
          <Skeleton key={`${att.key}-${i}`} className="h-6 w-40 rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 mt-2">
      {attachments.map((att, i) => {
        const url = signedUrls[att.key];
        const hasError = isError || (!isLoading && !url);

        // 9.4 Inline error state per attachment — does not crash the message
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

        // 9.2 Clickable link: file-type icon + filename, opens in new tab
        return (
          <a
            key={`${att.key}-${i}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-primary hover:underline"
            aria-label={`Open attachment: ${att.name}`}
          >
            <AttachmentIcon contentType={att.contentType} />
            <span className="truncate max-w-[200px]">{att.name}</span>
          </a>
        );
      })}
    </div>
  );
}
