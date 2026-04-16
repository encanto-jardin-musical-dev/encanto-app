## ADDED Requirements

### Requirement: Inline image thumbnail rendering
Image attachments (`image/jpeg`, `image/png`, `image/webp`) in message bubbles SHALL render as inline thumbnail previews using `<img>` tags with the presigned GET URL as the source. PDF attachments SHALL continue rendering as icon + filename links.

#### Scenario: Message with a single image attachment
- **WHEN** a message has exactly one image attachment and the signed URL is available
- **THEN** the image SHALL render as a full-width thumbnail within the message card body, constrained by `object-fit: cover` and a maximum height, with rounded corners

#### Scenario: Message with only PDF attachments
- **WHEN** a message has one or more PDF attachments and no image attachments
- **THEN** all attachments SHALL render as clickable icon + filename links (unchanged from current behavior)

#### Scenario: Message with mixed image and PDF attachments
- **WHEN** a message has both image and PDF attachments
- **THEN** image thumbnails SHALL render first (above), followed by PDF file links (below), within the same message card

### Requirement: Responsive image grid layout
When a message contains multiple image attachments, they SHALL display in a responsive grid layout within the message card.

#### Scenario: Two image attachments
- **WHEN** a message has exactly 2 image attachments
- **THEN** they SHALL render in a 2-column grid with equal sizing

#### Scenario: Three image attachments
- **WHEN** a message has exactly 3 image attachments
- **THEN** the first image SHALL span the full width and the remaining 2 images SHALL render in a 2-column row below

#### Scenario: Four or more image attachments
- **WHEN** a message has 4 or more image attachments
- **THEN** they SHALL render in a 2-column grid that wraps, with consistent spacing between items

### Requirement: Full-screen image viewer
Tapping an image thumbnail in a message bubble SHALL open a full-screen viewer displaying the image at its natural resolution.

#### Scenario: Open full-screen viewer
- **WHEN** a user taps/clicks on an image thumbnail in a message bubble
- **THEN** a full-screen modal SHALL open displaying the image at natural resolution with `object-fit: contain` and a dark backdrop overlay

#### Scenario: Close full-screen viewer
- **WHEN** the full-screen image viewer is open
- **THEN** the user SHALL be able to close it by tapping the close button, pressing the Escape key, or tapping the backdrop

#### Scenario: Full-screen viewer accessibility
- **WHEN** the full-screen image viewer is open
- **THEN** focus SHALL be trapped within the modal and an accessible label SHALL identify the image

### Requirement: Image thumbnail loading states
Image thumbnails SHALL display progressive loading states that prevent layout shifts.

#### Scenario: Signed URL is being fetched
- **WHEN** the signed GET URLs for image attachments are still loading
- **THEN** skeleton placeholders SHALL render in the grid layout matching the expected aspect ratio and position of the thumbnails

#### Scenario: Image is loading after URL is available
- **WHEN** the signed URL is available but the image has not finished loading
- **THEN** a skeleton placeholder SHALL display, and the image SHALL fade in with a CSS transition when the `onLoad` event fires

#### Scenario: Image fails to load
- **WHEN** an image attachment fails to load (the `onError` event fires on the `<img>` tag)
- **THEN** a fallback placeholder SHALL render showing a photo icon and the filename, without displaying a broken image icon
- **AND** other images in the same message SHALL NOT be affected

### Requirement: Enhanced upload file preview chips
Selected image files in the message composer SHALL display as thumbnail previews instead of text-only chips.

#### Scenario: Image file selected for upload
- **WHEN** a user selects an image file (jpeg, png, webp) in the file picker
- **THEN** the file SHALL display as a small thumbnail preview generated from `URL.createObjectURL(file)` instead of a text chip with filename

#### Scenario: PDF file selected for upload
- **WHEN** a user selects a PDF file in the file picker
- **THEN** the file SHALL continue displaying as the existing text chip with filename and size

#### Scenario: Image file removed from selection
- **WHEN** a user removes a previously selected image file from the upload queue
- **THEN** the object URL created for the thumbnail preview SHALL be revoked to free memory

#### Scenario: Component unmounts with selected images
- **WHEN** the message input component unmounts while image files are selected
- **THEN** all object URLs created for thumbnail previews SHALL be revoked
