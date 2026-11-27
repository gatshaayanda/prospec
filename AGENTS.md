# Prospec Group — Project Operating Contract

## Identity and source lineage
- Product: Prospec Group, Botswana; 100% youth citizen-owned business group.
- Divisions: Prospec AG (marketing & advertising), Prospec Supplies (procurement and sourcing), Prospec NFC (NFC/QR digital business cards), Prospec AG Printing (printing, sublimation, heatpress, signage and branded products).
- Brand: teal/cyan, charcoal and white; flowing script Prospec wordmark with clean sans-serif UI; QWERTY voice; “We keep our noses in other people's business”; “Pitbulls of Branding”.
- Foundation: gatshaayanda/iteration13, source branch main, source commit d94dd55ad92de1ec2d0d98145c6f5e48a263b445.
- Target: gatshaayanda/prospec, branch main. Clean baseline pushed at d94dd55.
- Candidate review: John The Stylist Bw is an appointment/deposit-first salon PWA; The Plug is a sneaker/apparel sourcing-request PWA with guest/customer tracking and owner-scoped Firebase workflows. Both are narrower than Prospec's four-division business catalogue and operations needs. Iteration 13 was selected as the general Business OS foundation because its Store → Account → Briefcase, catalogue, quote/status, receipt and owner-workspace patterns fit the full product. No JTS/The Plug code, Firebase project, rules or credentials were transplanted. Their customer-first request patterns remain useful references for the later Prospec persistence pass.

## Design gate
Read DESIGN.md before visual work. Dominant genre Character; Loud public campaign moments; Data-led Account/Briefcase. Apply the direction across public Store, customer Account, receipts, owner Briefcase and important states.

## Architecture and current routes
- Next.js App Router, React storefront in src/app/page.tsx.
- Customer Account component: src/app/AccountWorkspace.tsx.
- Scripted guide: src/app/ServiceGuide.tsx — preserve behavior; adapt Prospec copy/actions only.
- Owner money insights: src/app/AdminMoneyInsights.tsx.
- UploadThing routes: src/app/api/uploadthing/.
- Firebase client scaffold: src/lib/firebase/client.ts.
- PWA registration: src/app/pwa-register.tsx; service worker: public/sw.js; offline route: src/app/offline/page.tsx; iOS guide: src/app/iphone-install/page.tsx.

## Customer workflow
Public visitor → browse compact expandable departments or search/filter the catalogue → select a priced or unpriced item → customer Account → submit enquiry → owner Briefcase review. Keep the public Store uncluttered, use clearly labelled illustrative imagery until approved media is uploaded, and make status/toast copy plain-language and action-oriented. All products are requestable, including unpriced items. Fixed catalogue prices are BWP and must be displayed as supplied. Items without a price are quote items and must display “Quote on request”, never P0.00 or unavailable. Every enquiry is written to `prospecEnquiries` with its authenticated customer UID and appears in the owner Briefcase through the server-side workspace API. Customer reads remain UID-scoped; supported customer writes queue through Firestore's persistent offline cache.

## Owner workflow
The sole public owner entry is the icon-only 💼 footer control. One access-word field, validated server-side against the exact environment key ADMIN_PASSWORD; no hard-coded fallback, no second credential and no Firebase staff account provisioning. Session cookie is HttpOnly, Secure in production, SameSite strict and expires after 12 hours. Owner UI inactivity lock remains 30 minutes.

## Data and security boundary
- Firebase project: `theworks-f4957` (explicitly supplied by the product owner for Prospec). Public web config is in `src/lib/firebase/client.ts` and `.env.example`; it is not a private credential.
- Customer sessions use persistent Firebase Anonymous Auth identities; each customer can read only their own `prospecEnquiries` documents. Firestore persistent local cache and multiple-tab manager queue writes while offline and sync on reconnect.
- Public storefront content is stored at `prospecPublic/storefront`. Customer profiles use `prospecCustomers/{uid}`. Enquiries use `prospecEnquiries/{id}` with owner-only status/quote/payment updates and customer-only message appends.
- Owner Briefcase reads/writes through `/api/admin/workspace`, protected by the HttpOnly owner session and Firebase Admin SDK. `FIREBASE_ADMIN_KEY` is required server-side and must match `theworks-f4957`; it is not the public web config.
- Owner catalogue/service CRUD, media references, availability, announcements, sprint rewards/special offerings and receipt profile are persisted together in `prospecPublic/storefront` by the protected owner API. The public client has read-only access to this document.
- UploadThing's customer/setup `fileUploader` remains available for enquiry attachments and pre-owner setup. Owner Briefcase media editors use the separate `adminMediaUploader` route, which verifies the HttpOnly owner session before issuing upload credentials. Keep UploadThing callbacks reachable; do not protect the whole callback route with page middleware.
- Firestore rules and the customer query index are maintained in `firestore.rules` and `firestore.indexes.json`. They must be published to the supplied Firebase project before production customer sync works.
- Anonymous Auth and Google provider sign-in must be enabled in Firebase Authentication, and the production domain must be listed as an authorised domain. Guest identity remains device-persistent until linked; verified Google sign-in provides cross-device recovery. Do not claim email/password account recovery.
- Do not add Firebase Storage rules. Keep UploadThing for approved uploads. The product owner has an existing database; connect to that project, not a newly invented one.
- No Firebase Storage rules. Keep UploadThing for approved uploads; do not copy credentials.
- Do not claim payment gateway, payment capture, email delivery or push notifications unless implemented and tested.

## PWA / offline lock
- Preserve beforeinstallprompt early capture, retained native event, click-triggered browser prompt, dismissible bottom-fixed install-card placement (bottom edge; right-aligned on desktop), iOS Safari Share → Add to Home Screen guidance, embedded-browser handoff, service-worker registration/update lifecycle and offline shell. The customer may collapse the branded install card without dismissing it; explicit dismissal is in-memory for the current page only.
- The bottom-fixed placement is the approved Iteration 13/Africhiko pattern. Do not convert it to an inline/top-of-page element. Keep placement stable; change only branding/assets and isolated cache namespace. Do not fake a prompt, duplicate listeners or change native prompt lifecycle mechanics.
- Offline copy must explain that Firestore retains a persistent local cache and queues supported customer writes until connectivity returns. Uploads still require internet.

## Verification
- npm run lint
- npm run build (includes verify:identity, verify:offline and verify:typography)
- Review customer enquiry and owner status/quote flows; verify all unpriced catalogue items can be selected.
- Inspect mobile and desktop screenshots before claiming visual completion.
- Verify install, offline and update behavior on supported browsers/devices when available.
- Do not claim production database readiness until Firebase Authentication, Firestore rules/indexes, `FIREBASE_ADMIN_KEY`, customer ownership, owner authorization, shared persistence, upload policy and notification behavior are verified.

## Last verified checkpoint
- Baseline clone and push: d94dd55; source commit and target baseline match.
- Firebase integration: web client, persistent offline Firestore cache, anonymous customer identity, customer-owned enquiries/messages, public storefront listener, owner-session API and Firestore rules/index added. Firebase Console configuration and end-to-end QA remain acceptance gates.


## Owner Briefcase UX contract
- Main areas: Overview, Client work, Finance, Store & offers, Notes, Performance. These are clearer labels for existing sections, not feature removals.
- Keep the four Prospec divisions visible as business context; do not invent division-specific workflow automation or claim it exists.
- Preserve all existing owner controls and records: shift/session, availability, customers, enquiries, quotes, status, payment recording, expenses, receipts, Store identity/palette/catalogue/media/preview, announcements, sprint rewards, notes and insights.
- Use progressive disclosure for specialist forms while keeping primary work areas visible. Prefer recognition over recall and Prospec operational language.
- Owner text and form controls must be comfortably readable on desktop and mobile. Avoid micro-sized helper text and tiny navigation controls. Do not treat colour/contrast tweaks as a substitute for readable type, spacing and clear labels.

## Store media publishing and owner activity
- Owner media uploads use UploadThing's `adminMediaUploader`; do not route owner uploads through the public/customer uploader. The picker returns the confirmed UploadThing URL to the editor; the owner must save the product/service or announcement before it is published.
- Storefront writes are debounced and serialized to prevent older overlapping saves from overwriting newer catalogue/media edits. `/api/admin/workspace` reads the Firestore storefront document back after writing; the UI confirms a save only when the returned service/media payload matches.
- The public Store listens to `prospecPublic/storefront` with Firestore `onSnapshot`. This readback plus listener is the intended publish path; still perform browser QA for actual image delivery/rendering.
- Successful owner actions are recorded in the Briefcase Performance activity trail instead of producing a toast for every edit. Attribute image replacement/removal explicitly. Keep validation and genuine persistence failures visible.
- The owner Store/Account header is hidden while the owner Briefcase is open. The footer Briefcase is right-aligned on mobile, opposite the left-side guide launcher.
- Install invitation appears on every eligible visit in Chrome (desktop/Android) and iOS Safari; standalone and embedded browsers are excluded. Dismissal is in-memory for the current page only and must not use visit thresholds, cooldowns, localStorage or sessionStorage.
- Chrome install CTA must invoke the retained browser-owned `beforeinstallprompt` event directly from the explicit click whenever Chrome supplies it. The early `beforeInteractive` capture must remain active until React has adopted any early event and registered its own listener; register the React listener before setting `__iteration13PwaListenerReady` to avoid dropping an event in the handoff race.
- If Chrome has not supplied `beforeinstallprompt`, the same visible CTA opens a truthful, dismissible fallback explaining the Chrome menu route (`⋮` → Install app / Add to Home screen, if offered). Never claim that a native prompt was opened or fabricate one. Chrome alone controls native install eligibility. iOS Safari retains its Share → Add to Home Screen guidance.
- Preserve the compact branded collapsible card, current responsive placement, embedded-browser handoff, service-worker lifecycle and offline shell.
