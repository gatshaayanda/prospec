# Prospec offline, PWA and account-navigation audit

**Audit date:** 2026-11-26  
**Repository:** gatshaayanda/prospec, branch main  
**Scope:** source inspection only; no live-device/browser automation or physical offline/reconnect test was performed.

## Current assessment

### Customer offline data
- Customer-side Firestore is configured for persistent local caching and queued supported writes.
- Customer listeners use Firestore snapshots and metadata to observe cache/server state.
- This is a sound foundation for customer offline reads and writes, but the full customer journey has not yet been verified by disconnecting, reloading, submitting, reconnecting and confirming server acknowledgement.
- Anonymous customer identity is persistent on the device but is not yet a recoverable cross-device sign-in.
- File uploads still require connectivity.

### Owner Briefcase offline data
- Owner Briefcase reads and mutations use the protected /api/admin/workspace HTTP API and Firebase Admin SDK.
- This is online-only at present. There is no durable local mutation outbox that safely queues owner CRUD while offline and replays it after reconnect.
- Do not describe owner-side CRUD as offline-synchronised until that capability is implemented and tested.

### PWA / install
- Prospec has a web app manifest, service-worker registration, an app-shell/offline fallback strategy, public-page caching and a branded bottom-fixed install card.
- The install flow retains the browser's beforeinstallprompt event and invokes the native prompt only from the user's explicit Install click. Preserve this lifecycle and the approved bottom-fixed placement.
- The current card render condition is restrictive: it appears only when the browser has fired beforeinstallprompt, or when the browser is iOS Safari and manual guidance is available. A normal desktop browser that does not fire the event gets no invitation or manual install guidance.
- A dismissal is stored for seven days under prospec:install:dismissed-at:v6.
- The early capture script in src/app/layout.tsx and listener adoption in src/app/pwa-register.tsx are intended to avoid losing an early browser event.
- Therefore service-worker registration alone does not guarantee that the card appears. On desktop Chrome, absence of the card means at least one of these conditions is true: Chrome has not made the app install-eligible/emitted the event; the seven-day dismissal is active; the app is already running in standalone mode; or the browser is classified as embedded. The user's browser storage and runtime event state were not inspected in this source audit.
- The manifest declares SVG, 192px PNG and 512px PNG icons. Their live HTTP responses and browser installability diagnostics still need runtime verification.
- Iteration 13 is the reference for the install lifecycle and offline quality. Do not call Prospec's offline behaviour fully equivalent to Iteration 13 until customer, owner and media boundaries are tested and owner offline mutation replay is addressed.

### Account icon showing only 0
- src/app/page.tsx renders a person-outline SVG with class prospec-account-icon, followed by a request-count badge (data.orders.length).
- src/app/globals.css contains explicit rules to display the SVG at 23px and position the count as a small badge over the icon.
- Consequently, seeing only 0 is not the intended design and is inconsistent with the current source markup and its targeted CSS.
- The source inspection alone cannot prove whether the deployed page is serving stale markup/CSS, whether a later CSS rule is overriding the SVG, or whether the browser is rendering a different cached deployment. Confirming the exact cause requires inspecting the live rendered DOM/computed styles in the browser where the defect is visible.
- Keep the account control icon-only with the count as a small badge; do not restore the Store text navigation or turn the badge into the button's only visible content.

## Required acceptance checks
1. Inspect the live account button DOM and computed styles at desktop and mobile widths; confirm the SVG is visible and the count is a badge.
2. Check the exact production deployment/commit and hard-reload with updated assets before attributing a stale build.
3. In desktop Chrome, inspect Application > Manifest and DevTools installability diagnostics; confirm the manifest and all icon URLs return successfully, service worker is active, and the browser's install event/eligibility state is known.
4. Verify install card appearance, collapse, seven-day dismissal, native prompt click, already-installed state and embedded-browser gate. Do not fake a native prompt.
5. Verify customer account offline reload, queued enquiry/message writes and reconnect acknowledgement.
6. Verify owner Briefcase behaviour honestly as online-only until a durable, authenticated, idempotent offline outbox and conflict handling are implemented.
7. Verify media remains clearly marked pending until upload and the saved media reference both succeed.

## Change policy
This is a recorded audit, not authorisation to redesign the Store, Account, Briefcase, PWA install lifecycle or Firebase architecture. Preserve the current golden baseline and make only narrowly scoped corrections after the live failure is reproduced.