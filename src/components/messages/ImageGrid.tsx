'use client';

// ImageGrid — renders image attachments as inline thumbnails in a responsive grid.
// Grid layout adapts by image count: 1=full-width, 2=2-col, 3=first full+2-col, 4+=2-col wrap.
// Each image has independent loading/error state; one failure never affects siblings.
// Clicking a thumbnail opens the ImagePreviewModal.

import { useState, useCallback } from 'react';
import { Skeleton } from '@heroui/react';
import { PhotoIcon } from '@heroicons/react/24/outline';

import type { Attachment } from '@/types/messages.types';
import type { SignedUrlMap } from '@/hooks/UseAttachmentUrlsQuery';
import ImagePreviewModal from '@/components/messages/ImagePreviewModal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImageGridProps {
  /** Only image attachments — caller must pre-filter */
  images: Attachment[];
  /** Map of attachment key → presigned GET URL */
  signedUrls: SignedUrlMap;
}

type ImageLoadState = 'loading' | 'loaded' | 'error';

// ---------------------------------------------------------------------------
// Single image tile
// ---------------------------------------------------------------------------

interface ImageTileProps {
  attachment: Attachment;
  url: string;
  /** CSS classes for the outer container (controls grid placement & aspect ratio) */
  containerClassName: string;
  onImageClick: (url: string, name: string) => void;
}

function ImageTile({ attachment, url, containerClassName, onImageClick }: ImageTileProps) {
  const [loadState, setLoadState] = useState<ImageLoadState>('loading');

  const handleLoad = useCallback(() => setLoadState('loaded'), []);
  const handleError = useCallback(() => setLoadState('error'), []);

  const handleClick = useCallback(() => {
    if (loadState === 'loaded') {
      onImageClick(url, attachment.name);
    }
  }, [loadState, url, attachment.name, onImageClick]);

  return (
    <div className={`relative overflow-hidden rounded-lg bg-default-100 ${containerClassName}`}>
      {/* Skeleton placeholder — visible while loading */}
      {loadState === 'loading' && (
        <Skeleton className="absolute inset-0 rounded-lg" />
      )}

      {/* Error fallback */}
      {loadState === 'error' && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-default-400"
          aria-label={`Failed to load image: ${attachment.name}`}
        >
          <PhotoIcon className="w-6 h-6 shrink-0" />
          <span className="text-xs truncate max-w-full text-center">{attachment.name}</span>
        </div>
      )}

      {/* The actual image — always in DOM so onLoad/onError fire */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={attachment.name}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        onClick={handleClick}
        className={[
          'absolute inset-0 w-full h-full object-cover rounded-lg cursor-pointer',
          'transition-opacity duration-300',
          loadState === 'loaded' ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        aria-hidden={loadState !== 'loaded'}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error tile (no URL available for this attachment)
// ---------------------------------------------------------------------------

function ErrorTile({ attachment, containerClassName }: { attachment: Attachment; containerClassName: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-default-100 flex flex-col items-center justify-center gap-1 p-2 text-default-400 ${containerClassName}`}
      aria-label={`Attachment unavailable: ${attachment.name}`}
    >
      <PhotoIcon className="w-6 h-6 shrink-0" />
      <span className="text-xs truncate max-w-full text-center">{attachment.name}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton tile (URL still loading from API)
// ---------------------------------------------------------------------------

function SkeletonTile({ containerClassName }: { containerClassName: string }) {
  return (
    <Skeleton className={`rounded-lg ${containerClassName}`} />
  );
}

// ---------------------------------------------------------------------------
// Grid layout helpers
// ---------------------------------------------------------------------------

/**
 * Returns Tailwind classes for the outer grid container based on image count.
 */
function gridContainerClass(count: number): string {
  if (count === 1) return 'grid grid-cols-1';
  return 'grid grid-cols-2 gap-1';
}

/**
 * Returns Tailwind classes for each tile's container given its index and total count.
 * Controls grid placement (col-span) and aspect ratio.
 */
function tileContainerClass(index: number, count: number): string {
  const base = 'w-full';

  if (count === 1) {
    // Single image: full width, 4:3 ratio, max 300px tall
    return `${base} aspect-[4/3] max-h-[300px]`;
  }

  if (count === 2) {
    // Two images: equal 2-col, square
    return `${base} aspect-square`;
  }

  if (count === 3) {
    if (index === 0) {
      // First image spans both columns
      return `col-span-2 ${base} aspect-[2/1]`;
    }
    // Remaining two: square tiles in a 2-col row
    return `${base} aspect-square`;
  }

  // 4+ images: uniform 2-col wrapping grid, square tiles
  return `${base} aspect-square`;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Renders image attachments in a responsive grid with inline previews.
 * Handles URL-loading state (skeleton), per-image load/error state, and
 * full-screen preview via ImagePreviewModal.
 */
export default function ImageGrid({ images, signedUrls }: ImageGridProps) {
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);

  const handleImageClick = useCallback((url: string, name: string) => {
    setPreview({ url, name });
  }, []);

  const handleModalClose = useCallback((isOpen: boolean) => {
    if (!isOpen) setPreview(null);
  }, []);

  if (images.length === 0) return null;

  const count = images.length;

  return (
    <>
      <div className={`mt-2 ${gridContainerClass(count)}`}>
        {images.map((att, i) => {
          const url = signedUrls[att.key];
          const containerCls = tileContainerClass(i, count);

          // URL not yet available (still fetching signed URL)
          if (!url) {
            return (
              <SkeletonTile
                key={`${att.key}-${i}`}
                containerClassName={containerCls}
              />
            );
          }

          // URL fetch failed (signedUrls map has no entry at all after loading)
          if (url === '') {
            return (
              <ErrorTile
                key={`${att.key}-${i}`}
                attachment={att}
                containerClassName={containerCls}
              />
            );
          }

          return (
            <ImageTile
              key={`${att.key}-${i}`}
              attachment={att}
              url={url}
              containerClassName={containerCls}
              onImageClick={handleImageClick}
            />
          );
        })}
      </div>

      {/* Full-screen image viewer — rendered at this level so grid tiles can trigger it */}
      <ImagePreviewModal
        imageUrl={preview?.url ?? null}
        imageName={preview?.name ?? ''}
        isOpen={preview !== null}
        onOpenChange={handleModalClose}
      />
    </>
  );
}
