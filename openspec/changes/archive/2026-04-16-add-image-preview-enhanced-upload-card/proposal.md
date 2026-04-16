## Why

Image attachments in messages currently render as plain text links (icon + filename), identical to PDFs. Parents must tap each link and wait for it to open in a new browser tab to see what was shared. This creates unnecessary friction in a mobile-first communication flow where teachers frequently share classroom photos. Adding inline image previews inside the message bubble — and improving the upload-file chips to show image thumbnails — makes the attachment experience feel native and immediate.

## What Changes

- **Inline image previews in message bubbles**: Image attachments (`image/jpeg`, `image/png`, `image/webp`) render as clickable thumbnail previews inside the `MessageCard` instead of text links. PDFs continue to render as icon + filename links.
- **Thumbnail grid layout**: When a message has multiple image attachments, they display in a responsive grid (1 column for 1 image, 2-column grid for 2–4 images, with the first image spanning full width for 3+ images).
- **Full-screen image viewer**: Tapping an image thumbnail opens a full-screen overlay/modal for viewing the image at its natural resolution with close/dismiss controls.
- **Enhanced upload file chips**: Selected files in `MessageInput` show image thumbnails (via `URL.createObjectURL`) instead of plain text chips for image types. PDFs keep the current chip style.
- **Loading states**: Image thumbnails show skeleton/blur placeholders while signed URLs are being fetched, with smooth fade-in on load.
- **Error states**: Failed image loads display a broken-image placeholder with the filename, without crashing the message card.

## Capabilities

### New Capabilities
- `image-preview`: Inline image thumbnail rendering in message bubbles, full-screen image viewer, image grid layout, and enhanced upload preview chips. Covers rendering logic, loading/error states, and responsive layout.

### Modified Capabilities
<!-- None — message-attachments spec covers upload/storage/signing which remain unchanged. This change is purely a rendering enhancement on the client side. -->

## Impact

- **Modified code**:
  - `src/components/messages/MessageAttachments.tsx` — split rendering logic: images get `<img>` thumbnail treatment, PDFs keep current link style.
  - `src/components/messages/MessageCard.tsx` — layout adjustments to accommodate image grid within the card body.
  - `src/components/messages/MessageInput.tsx` — enhanced file chips with image thumbnails for selected files before upload.
  - New component: `src/components/messages/ImagePreviewModal.tsx` — full-screen image viewer overlay.
- **No backend changes**: No edge function, S3, or database modifications. All changes are client-side rendering.
- **No new dependencies**: Uses native `<img>` tags with signed URLs, `URL.createObjectURL` for upload previews, and HeroUI `Modal` for the viewer.
- **No breaking changes**: Messages with `attachments: null` or PDF-only attachments render unchanged.
