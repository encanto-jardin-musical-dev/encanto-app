## 1. Image Grid Component

- [x] 1.1 Create `ImageGrid` component in `src/components/messages/ImageGrid.tsx` that accepts an array of image attachments with their signed URLs and renders them in the responsive grid layout (1 image = full width, 2 = 2-col, 3 = first full + 2-col row, 4+ = 2-col wrapping grid)
- [x] 1.2 Add fixed aspect-ratio containers using CSS `aspect-ratio` property to prevent layout shifts, with `object-fit: cover` and rounded corners on each thumbnail
- [x] 1.3 Implement per-image loading state: render `Skeleton` placeholder initially, track `onLoad` per image with local state, fade in via CSS `opacity` transition on load
- [x] 1.4 Implement per-image error state: on `onError`, replace `<img>` with a fallback placeholder showing `PhotoIcon` + truncated filename, without affecting other images in the grid

## 2. Full-Screen Image Viewer

- [x] 2.1 Create `ImagePreviewModal` component in `src/components/messages/ImagePreviewModal.tsx` using HeroUI `Modal` with full-screen sizing, dark backdrop, and `object-fit: contain` image rendering
- [x] 2.2 Wire the modal to accept the image URL and filename as props, with a close button and accessible label (aria-label on the image)
- [x] 2.3 Connect `ImageGrid` thumbnails to open `ImagePreviewModal` on click — pass the clicked image's signed URL and name to the modal

## 3. Update MessageAttachments

- [x] 3.1 Refactor `MessageAttachments.tsx` to separate image attachments from non-image attachments using the existing `isImageType()` helper
- [x] 3.2 Render image attachments via the new `ImageGrid` component (above file links), passing signed URLs from the `signedUrlMap` prop
- [x] 3.3 Render non-image attachments (PDFs) using the existing icon + filename link style (unchanged behavior)
- [x] 3.4 Update the loading skeleton: show grid-shaped skeletons for image attachments and bar-shaped skeletons for file attachments

## 4. Enhanced Upload Preview Chips

- [x] 4.1 In `MessageInput.tsx`, create thumbnail previews for selected image files using `URL.createObjectURL(file)` — render a small `<img>` with the object URL instead of the text-only `<Chip>` for image types
- [x] 4.2 Keep the existing `<Chip>` rendering for PDF files (filename + size text)
- [x] 4.3 Add `URL.revokeObjectURL` calls in the `handleRemoveFile` handler when an image file is removed
- [x] 4.4 Add a `useEffect` cleanup that revokes all active object URLs on component unmount to prevent memory leaks

## 5. Integration and Verification

- [x] 5.1 Verify `MessageCard` passes image attachments correctly through `MessageAttachments` → `ImageGrid` → `ImagePreviewModal` flow with real signed URLs
- [x] 5.2 Test rendering of all grid variants: 1 image, 2 images, 3 images, 4 images, 5 images (max), and mixed image + PDF messages
- [x] 5.3 Verify loading states: skeleton placeholders while signed URLs load, per-image skeleton during image fetch, smooth fade-in on load complete
- [x] 5.4 Verify error states: broken image fallback per image, no crash on signed URL fetch failure, no impact on sibling images
- [x] 5.5 Verify upload preview chips: image thumbnails appear for selected images, PDF chips unchanged, object URLs revoked on removal and unmount
- [x] 5.6 Run `npm run build` and `npm run lint` to confirm no type errors or lint violations
