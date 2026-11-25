# Prospec Group — Project Operating Contract

## Identity and source lineage
- Product: Prospec Group, Botswana; 100% youth citizen-owned business group.
- Divisions: Prospec AG (marketing & advertising), Prospec Supplies (procurement and sourcing), Prospec NFC (NFC/QR digital business cards), Prospec AG Printing (printing, sublimation, heatpress, signage and branded products).
- Brand: teal/cyan, charcoal and white; flowing script Prospec wordmark with clean sans-serif UI; QWERTY voice; “We keep our noses in other people's business”; “Pitbulls of Branding”.
- Foundation: gatshaayanda/iteration13, source branch main, source commit d94dd55ad92de1ec2d0d98145c6f5e48a263b445.
- Target: gatshaayanda/prospec, branch main. Clean baseline pushed at d94dd55.
- JTS and The Plug are visual/interaction references only. Their workflows, Firebase projects, authentication, rules and data must not be transplanted. Iteration 13 remains the Business OS architecture source.

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
Public visitor → select a division/catalogue item → customer Account → submit enquiry → owner Briefcase review. All products are requestable, including unpriced items. Fixed catalogue prices are BWP and must be displayed as supplied. Items without a price are quote items and must display “Quote on request”, never P0.00 or unavailable. Every enquiry must route to Prospec operations once shared persistence is implemented.

## Owner workflow
The sole public owner entry is the icon-only 💼 footer control. One access-word field, validated server-side against the exact environment key ADMIN_PASSWORD; no hard-coded fallback, no second credential and no Firebase staff account provisioning. Session cookie is HttpOnly, Secure in production, SameSite strict and expires after 12 hours. Owner UI inactivity lock remains 30 minutes.

## Data and security boundary
- Current catalogue, requests, messages, statuses, receipts, notes and analytics still use browser-local preview storage. This is not a secure customer account, shared inbox or cross-device database.
- The customer Account currently matches preview requests by email in the same browser profile. Do not describe it as authenticated identity or account recovery.
- Firebase client scaffolding and environment placeholders exist, but no Prospec Firebase project ID/configuration was verified in this repository at baseline. Do not reuse Iteration 13, The Plug, JTS or another client's Firebase project.
- Do not change Firestore rules, indexes, Firebase project IDs or credentials until the actual Prospec project configuration and approved data contract are inspected. The product owner has an existing database; connect to that project, not a newly invented one.
- No Firebase Storage rules. Keep UploadThing for approved uploads; do not copy credentials.
- Do not claim payment gateway, payment capture, email delivery or push notifications unless implemented and tested.

## PWA / offline lock
- Preserve beforeinstallprompt early capture, retained native event, click-triggered browser prompt, dismissible inline install-card placement, iOS Safari Share → Add to Home Screen guidance, embedded-browser handoff, service-worker registration/update lifecycle and offline shell.
- Change only branding/assets and isolated cache namespace. Do not move the install card, fake a prompt, duplicate listeners or change lifecycle mechanics.
- Offline copy must state that browser-local preview data does not sync or queue to the server.

## Verification
- npm run lint
- npm run build (includes verify:identity, verify:offline and verify:typography)
- Review customer enquiry and owner status/quote flows; verify all unpriced catalogue items can be selected.
- Inspect mobile and desktop screenshots before claiming visual completion.
- Verify install, offline and update behavior on supported browsers/devices when available.
- Do not claim production database readiness until customer authentication/ownership, admin authorization at API and Firestore-rule boundaries, shared persistence, upload policy and notification behavior are verified.

## Last verified checkpoint
- Baseline clone and push: d94dd55; source commit and target baseline match.
- Adaptation status: Prospec identity/catalogue/front-end adaptation in progress. Production database integration and browser/device QA remain separate acceptance gates.
