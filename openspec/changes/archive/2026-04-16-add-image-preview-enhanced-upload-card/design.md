## Context

Message attachments (images and PDFs) were shipped in Phase 1 as clickable text links — a file-type icon plus a truncated filename that opens in a new browser tab. This was a deliberate simplification to ship the upload/storage pipeline quickly (see `add-message-image-attachments-s3` design, Decision 9). The infrastructure is fully operational: presigned PUT URLs for upload, presigned GET URLs for reads (24h TTL, cached ~23h via React Query), and the `MessageAttachments` component already distinguishes images from PDFs via `isImageType()`.

Current rendering pipeline:
- `MessageCard.tsx` parses `message_attachments` jsonb, fetches signed URLs via `useAttachmentUrlsQuery`, passes them to `MessageAttachments`.
- `MessageAttachments.tsx` renders every attachment as an `<a>` link regardless of type.
- `MessageInput.tsx` shows selected files as `<Chip>` components with filename + size text.

This change is purely client-side — no backend, edge function, S3, or database modifications.

## Goals / Non-Goals

**Goals:**
- Render image attachments as inline thumbnails inside message bubbles with responsive grid layout.
- Provide a full-screen image viewer when a thumbnail is tapped.
- Show image thumbnails in the `MessageInput` file chips for selected images before upload.
- Maintain graceful loading states (skeleton placeholders, fade-in) and error states (broken-image fallback) that never crash the message card.
- Keep PDFs rendering as they do today (icon + filename link).

**Non-Goals:**
- PDF thumbnail generation or inline PDF previews — remains deferred to Phase 3.
- HEIC support or client-side image conversion — remains deferred to Phase 2 of the attachment pipeline.
- Image editing, cropping, or compression before upload.
- Server-side thumbnail generation or storing `thumbnailKey`/`width`/`height` on the `Attachment` type — this change uses full-size images via existing signed URLs with CSS-based sizing.
- Video or audio attachment rendering.
- Changes to the upload flow, S3 storage, or edge functions.

## Decisions

### Decision 1: Inline `<img>` rendering using existing signed GET URLs

**Chosen:** Render image attachments as `<img>` tags using the same presigned GET URLs already fetched by `useAttachmentUrlsQuery`. No separate thumbnail generation or additional API calls.

**Rationale:** The signed URLs are already fetched and cached for 23 hours. Using them directly for `<img src>` avoids adding backend complexity. Image sizing is handled entirely via CSS (`object-fit: cover`, fixed aspect ratio containers). For the typical classroom photo (1-5 MB JPEG), modern mobile browsers handle rendering efficiently. The trade-off is higher bandwidth for thumbnails vs. server-generated thumbnails, but this is acceptable for Phase 2 given the existing 24h URL caching and the school-use traffic pattern (low concurrency, WiFi/LTE).

**Alternative considered:** Server-side thumbnail generation (e.g., Sharp in an edge function). Rejected for this phase — adds deployment complexity, storage costs for thumbnails, and delays the feature. Can be revisited if bandwidth becomes a concern.

### Decision 2: Responsive image grid layout

**Chosen:** Grid layout adapts based on image count within a message:
- **1 image**: Full width of the message card, max-height constrained with `object-fit: cover`.
- **2 images**: 2-column grid, equal sizing.
- **3 images**: First image spans full width, remaining two in a 2-column row below.
- **4+ images**: 2-column grid wrapping.

**Rationale:** This is the standard pattern used by WhatsApp, iMessage, and Telegram for image messages. Users have built-in familiarity. The layout is achievable with CSS Grid without custom JavaScript layout calculations.

**Alternative considered:** Masonry layout. Rejected — more complex, requires JavaScript measurement, and inconsistent rendering during image load.

### Decision 3: Full-screen image viewer using HeroUI Modal

**Chosen:** Tapping an image thumbnail opens a `Modal` (from HeroUI) in full-screen mode with the image rendered at natural resolution via `object-fit: contain`. The modal includes a close button and supports swipe-to-dismiss on mobile via the modal's built-in dismiss behavior.

**Rationale:** HeroUI `Modal` is already a project dependency and provides accessibility (focus trap, Escape key dismiss), backdrop overlay, and mobile-friendly dismiss gestures out of the box. No additional dependency needed.

**Alternative considered:** Custom overlay with portals. Rejected — reinvents modal behavior already provided by HeroUI.

### Decision 4: Upload chip thumbnails via `URL.createObjectURL`

**Chosen:** In `MessageInput`, when a selected file is an image, the `<Chip>` is replaced with a small thumbnail preview generated from `URL.createObjectURL(file)`. PDFs keep the existing chip style. Object URLs are revoked on file removal or component unmount to prevent memory leaks.

**Rationale:** `URL.createObjectURL` is synchronous, works offline, and requires no server round-trip. It gives immediate visual feedback to the user about which images they've selected before upload begins.

### Decision 5: Separation of image and non-image rendering in MessageAttachments

**Chosen:** Split `MessageAttachments` into two rendering sections:
1. **Image grid section**: All image attachments rendered as thumbnails in the grid layout.
2. **File links section**: All non-image attachments (PDFs) rendered as the existing icon + filename links.

Images always appear above file links within a message card.

**Rationale:** Clean separation keeps the grid layout self-contained and avoids complex interleaving logic. Messages with only PDFs render identically to today. Messages with only images get the full grid treatment. Mixed messages show images first, then file links — a natural visual hierarchy.

### Decision 6: Loading and error states

**Chosen:**
- **Loading**: While signed URLs are being fetched, image attachments show `Skeleton` placeholders matching the grid aspect ratio. PDFs continue using the existing skeleton bars.
- **Image loading**: After the signed URL is available, each `<img>` starts with a skeleton placeholder and fades in on the `onLoad` event using a CSS transition (`opacity 0 → 1`).
- **Error**: If an image fails to load (`onError` event), it falls back to a placeholder with `PhotoIcon` + filename, styled similarly to the existing link but without the hyperlink behavior. This prevents broken image icons from appearing.
- **Isolation**: Each image handles its own load/error state independently — one failed image does not affect others in the same message.

**Rationale:** Progressive loading prevents layout shifts and provides a polished mobile experience. Independent error handling per image matches the existing per-attachment error isolation pattern in `MessageAttachments`.

## Risks / Trade-offs

- **[Bandwidth: full-size images as thumbnails]** → Mitigation: CSS constrains rendered size; browser caching via React Query's 23h staleTime means images are fetched once per session. Acceptable for school-use traffic. Escalation: add server-side thumbnails in a future phase.
- **[Layout shift during image load]** → Mitigation: Fixed aspect-ratio containers via `aspect-ratio` CSS property prevent content jumping. Skeleton placeholders maintain the space.
- **[Memory pressure from multiple large images]** → Mitigation: Max 5 attachments per message (enforced by upload validation). Browser-native `<img>` lazy loading (`loading="lazy"`) for images outside viewport in long message threads.
- **[Object URL memory leaks in MessageInput]** → Mitigation: `URL.revokeObjectURL` called in cleanup (file removal handler + `useEffect` cleanup on unmount).
