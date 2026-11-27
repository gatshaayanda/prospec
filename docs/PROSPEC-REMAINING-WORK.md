# Prospec — Remaining Work & Acceptance Checkpoint

Last updated: 27 November 2026
Repository: `gatshaayanda/prospec`
Target branch: `main`

This document is the working checklist for finishing the current Prospec Briefcase/storefront pass. It records observed defects and requested behaviour; it is not a claim that pending work is implemented or QA-approved.

## 1. Priority: owner media upload

### Reported symptom
In the owner Briefcase, selecting **Choose an image from your device** in the product/service editor scrolls or jumps to the price area instead of opening the intended file chooser.

### Code finding and targeted correction
- `ServiceMediaPicker` used the same hard-coded DOM id, `service-media-file`, for every mounted picker instance.
- Both the image and video labels targeted that shared id. The setup flow and owner editor can mount separate picker instances, so duplicate ids make a label activate the wrong file input.
- Updated `src/app/ServiceMediaPicker.tsx` to generate a per-instance id with React `useId()`, and bind the matching label and input to that id.
- This is a targeted DOM association fix. It does not alter UploadThing routing, owner authentication, file limits, offline queueing, or publish behaviour.

### Upload pipeline that must remain protected
- Owner uploads use UploadThing endpoint `adminMediaUploader`.
- `src/app/api/uploadthing/core.ts` checks the HttpOnly Prospec owner session before issuing upload credentials.
- Product/service images: maximum 4 MB. Product/service videos: maximum 16 MB.
- A successful UploadThing response supplies the media URL; the owner editor then saves that URL with the service in the shared Firestore storefront document.
- Offline selections may be saved locally and marked **Pending Sync**. They are not published until UploadThing confirms the upload.
- Announcement thumbnails use `AnnouncementImagePicker`, which already uses a unique React-generated input id. Keep its behaviour intact.
- Do not replace UploadThing with Firebase Storage or bypass owner-session authorization.

### Acceptance checks still required
1. Open the owner Briefcase and edit an existing product/service.
2. Click the image chooser. Confirm the OS file picker opens immediately and the page does not jump to the price field.
3. Select a valid image (JPG/PNG/WebP, <= 4 MB). Confirm progress/status, returned URL and preview.
4. Save the service; confirm the Firestore storefront read-after-write includes the exact media URL.
5. Open the public Store and confirm the image actually renders.
6. Repeat for a new product/service, a video (<= 16 MB), and an announcement thumbnail.
7. Confirm invalid type/oversize files are rejected with a visible explanation; test offline selection becomes Pending Sync and syncs after reconnect.
8. Confirm an unsigned owner cannot obtain `adminMediaUploader` credentials.

The code correction is pushed, but these browser/device and live UploadThing checks are not yet verified.



### Follow-up finding: Save blocked at the price field
- The Briefcase product/service editor's price input declared `step="1"`, which makes the browser reject valid decimal prices (for example, `125.50`) before the form's `onSubmit` handler runs. The browser therefore focuses/scrolls to Price and the save handler never executes.
- The save handler accepts finite non-negative decimal numbers, and the initial setup price input already uses `step="0.01"`; the Briefcase editor was inconsistent with both.
- Corrected the Briefcase editor to `step="0.01"` so cents are valid and native form validation no longer blocks those prices.
- This directly addresses the observed Price-field validation symptom. It does not yet prove the live browser save or Firestore sync path; test both after the updated build is deployed.


## Store / Briefcase audit — 27 November 2026

### Code paths reviewed
- Product/service create and edit use the same validated editor and local commit path; Hide/Show and confirmed Delete update the service list. While the owner session is connected, the storefront autosave writes the catalogue to `prospecPublic/storefront` and reads it back.
- Announcement text, visibility and thumbnail are committed through the same Store state and autosave path. Announcement thumbnail upload uses the owner-only UploadThing endpoint.
- Sprint discount promotion has Save & Publish, Hide and Remove controls. Reward headline, copy, amount and image are included in the shared storefront payload.
- Customer request status, quote and conversation updates are sent through the owner enquiry API. A manually recorded payment is a record of an offline/manual payment entry; it does not move money or integrate with a payment processor.
- Product images are limited to 4 MB and videos to 16 MB by the owner UploadThing endpoint. Announcement/reward thumbnails are image-only, max 4 MB.

### Additional correction in this audit
- The client previously checked Firestore readback only for the service array. A server-side normalization could therefore drop or alter announcement/reward fields without the client detecting the mismatch.
- Updated the client to compare the complete published Store payload (catalogue, availability, announcement, sprint reward, discount amount and receipt profile) against the Firestore readback.
- Sprint reward publishing now explicitly rejects a local `idb-media://` pending-sync thumbnail and non-HTTPS image URLs instead of allowing the API to silently store an empty reward image.

### Remaining boundaries / QA
- Directly assigned promotional discount claims are currently stored in this browser's local workspace data; the owner enquiry/storefront API does not persist or distribute those claims across devices. Do not treat direct promotion assignment as a cross-device customer feature yet.
- Offline-selected service and announcement media remain marked Pending Sync until UploadThing returns a hosted URL. Publish only after that sync completes; the service/announcement save validation rejects local-only media references.
- Static code review and GitHub CI do not prove actual UploadThing credentials, browser file picker behaviour, Firebase production writes, public image delivery, or cross-device customer visibility. Those require live browser QA with an authenticated owner session.
- Four division tiles are still static labels, not workspace selectors; they do not filter the Briefcase sections. This remains unimplemented and must not be described as working.
- The CI workflow runs ESLint and a production build, including the identity, offline and typography verification scripts. It does not run browser end-to-end tests.

## 2. Currency consistency

### Observed mismatch
- Prospec's seeded printing catalogue descriptions explicitly state prices in Botswana pula (for example, `P5,130` and `P3,800`).
- The current Briefcase display showed the GBP symbol (`£`) and labelled the editor price as GBP.
- The currency selector currently changes the displayed denomination; it does not perform foreign-exchange conversion.

### Required resolution
- Confirm the operating/default currency for Prospec before changing stored settings or labels.
- Do not display GBP against BWP-denominated seeded prices.
- If BWP is confirmed, use BWP / `P` consistently across catalogue, customer requests, quotes, payments, receipts, and finance summaries.
- Do not convert existing numeric amounts merely by changing the currency label. Any conversion requires an explicit rate and owner approval.

Status: identified; default currency decision and implementation remain pending.

## 3. Four-division Briefcase context

### Current state
The Briefcase shows four business divisions:
- Prospec AG — Marketing & advertising
- Prospec Supplies — Procurement & sourcing
- Prospec NFC — Digital identity / NFC & QR
- Prospec AG Printing — Print & branded production

They are currently presentation elements, not workspace selectors. The admin navigation (Overview, Client work, Finance, Store & offers, Notes, Performance) is group-wide. The Store catalogue already has an industry/division field and public catalogue filtering, but this does not create division-scoped owner workspaces.

### Requested behaviour
Selecting one of the four divisions should change the active Briefcase context. Within that selected context, the owner should be able to use the existing sections:
- Overview
- Client work
- Finance
- Store & offers
- Notes
- Performance

The selected division must consistently scope its relevant catalogue/services, customer enquiries, quotes, finance records, notes and performance activity. Switching divisions must not merge, overwrite or misattribute another division's records.

### Implementation constraints
- Preserve existing owner session/authentication, Firestore persistence, customer account and request flows, UploadThing uploads, receipts, offline/PWA behaviour and existing CRUD.
- Do not implement a cosmetic selected state that leaves the data group-wide.
- Do not invent division-specific automation or claim it exists.
- Define and verify a safe migration/default for existing records that currently lack a reliable division association before applying division scoping.
- Keep the four divisions visible as the group identity; the selected division is an operational filter/context, not a replacement for the Prospec Group identity.

Status: requirement documented; implementation not started.

## 4. Briefcase shell and navigation constraints

- Keep the Store/Account navigation header visible while the owner is inside the Briefcase.
- The Briefcase must not gain an invented replacement workspace heading that removes or hides the existing header.
- Keep the customer chat widget in its original position.
- The footer Briefcase control remains right-aligned as previously requested.
- Keep the existing six Briefcase sections and their working functionality.

## 5. Build and delivery discipline

- Treat warnings separately from compile/type errors. Fix build-blocking errors first; avoid unrelated warning cleanup during targeted work.
- Run the repository verification/build after code changes and inspect the actual result.
- Functional QA must cover the complete owner upload → save → public Store render path, not just a successful file-picker click.
- Visual QA requires real mobile and desktop screenshots. Do not claim visual completion without them.
- A GitHub push is not a Vercel deployment. Report code commit, Actions/build result, functional QA, visual QA, deployment state and remaining configuration separately.

## Current status summary

| Area | Status |
|---|---|
| Duplicate service-media input IDs | Fixed in code; live browser verification pending |
| UploadThing owner authorization and routing | Existing protected implementation retained; end-to-end verification pending |
| Media URL persistence | Firestore read-after-write exists; actual public image rendering verification pending |
| Currency mismatch | Identified; default currency confirmation and correction pending |
| Division-aware Briefcase | Requested and documented; not implemented |
| Header/chat/footer placement | Preserve current approved constraints; do not broaden changes |
