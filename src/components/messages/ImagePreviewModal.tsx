'use client';

// ImagePreviewModal — full-screen image viewer overlay.
// Opened when a thumbnail is tapped in ImageGrid.
// Uses HeroUI Modal for accessibility (focus trap, Escape key dismiss, backdrop tap).

import {
  Modal,
  ModalContent,
  ModalBody,
  Button,
} from '@heroui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImagePreviewModalProps {
  /** Presigned GET URL of the image to display, or null when no image is selected */
  imageUrl: string | null;
  /** Filename used as accessible alt text */
  imageName: string;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called with false when the modal should close */
  onOpenChange: (isOpen: boolean) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Full-screen image viewer modal.
 * Renders the image at natural resolution constrained by the viewport,
 * with a close button in the top-right corner.
 *
 * Dismiss options:
 * - Close button (top-right)
 * - Escape key (HeroUI built-in)
 * - Backdrop tap (HeroUI built-in)
 */
export default function ImagePreviewModal({
  imageUrl,
  imageName,
  isOpen,
  onOpenChange,
}: ImagePreviewModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="full"
      backdrop="blur"
      hideCloseButton
      classNames={{
        base: 'bg-black/90 m-0 max-w-full max-h-full rounded-none',
        body: 'p-0 flex items-center justify-center',
        backdrop: 'bg-black/70',
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            {/* Close button — top-right corner */}
            <Button
              isIconOnly
              variant="flat"
              onPress={onClose}
              aria-label="Close image viewer"
              className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70"
            >
              <XMarkIcon className="w-5 h-5" />
            </Button>

            <ModalBody>
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={imageName}
                  aria-label={imageName}
                  className="max-w-full max-h-screen object-contain"
                />
              )}
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
