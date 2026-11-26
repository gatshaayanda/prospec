# Prospec Group — Business OS

Prospec Group is a Botswana 100% youth citizen-owned business group operating through four divisions:

- Prospec AG — marketing, advertising, strategy, public relations, branding and content
- Prospec Supplies — local and international sourcing and procurement brokerage
- Prospec NFC — NFC and QR digital business cards, including Tap Share & Go
- Prospec AG Printing — large-format printing, sublimation, heatpress, signage and branded products

Brand voice: QWERTY — Quirky, Witty, Enthusiastic, Transcendent and Youthful. Public line: “We keep our noses in other people's business.” Brand persona: “Pitbulls of Branding”.

## Customer journey
1. Browse the four divisions and the Prospec catalogue.
2. Select any priced or unpriced item. Unpriced items are marked “Quote on request” and remain fully requestable.
3. Continue to the customer Account and submit an enquiry with contact details, requested date and brief.
4. The enquiry is reviewed by the Prospec team. A listed price is a catalogue price, not proof of stock, a delivery promise or payment.
5. The customer can review the request preview and status on the same browser profile.

## Owner Briefcase
The single 💼 icon in the footer opens the owner access screen. The server validates the one-word access secret using the server-only ADMIN_PASSWORD variable. The owner workspace retains the foundation's catalogue editing, announcements, enquiry queue, status management, money records, receipts, notes and insights.

## Persistence, security and production readiness

Prospec is connected in code to the supplied Firebase project `theworks-f4957`.

- The public catalogue and announcement are read from `prospecPublic/storefront`. Owner changes are saved through the authenticated server-side Briefcase API.
- Customers use persistent Firebase Anonymous Auth identities. Enquiries are stored in `prospecEnquiries`, scoped to the creating customer UID, and streamed into that customer's Account. The Account uses the authenticated session as its record boundary; the contact email is not an account-recovery credential.
- Firestore uses persistent IndexedDB cache with multi-tab support. Supported customer enquiry and message writes queue locally while offline and synchronise after reconnection. The Account reports cached, pending and server-confirmed states separately.
- Owner enquiry status, quote and manual payment-record updates are saved through the server-side workspace API. Owner catalogue, availability and announcement changes are shared through the same API.
- The owner access word is validated server-side against `ADMIN_PASSWORD`. The HttpOnly owner session expires after 12 hours; the Briefcase locks after 30 minutes of inactivity.
- UploadThing handles approved catalogue and enquiry attachments. Uploads require an internet connection.
- Owner working notes and the current activity/performance counters are still browser-local. They are not shared across devices.
- Customer in-app updates and conversations are available. Email delivery, push notifications and payment-gateway capture are not implemented. A recorded payment is an owner-entered record, not proof of a gateway transaction. Receipts are operational records, not a claim of tax-invoice compliance.
- Anonymous customer identities persist on the same browser/device. Cross-device account recovery or email/password sign-in is not implemented.

### Required deployment configuration

Before production customer use:

1. Enable **Authentication → Sign-in method → Anonymous** in Firebase Authentication.
2. Publish `firestore.rules` and `firestore.indexes.json` to `theworks-f4957`.
3. Set server-only `ADMIN_PASSWORD`.
4. Set server-only `FIREBASE_ADMIN_KEY` using a service-account JSON key from the same Firebase project. Never prefix it with `NEXT_PUBLIC_` or commit the JSON.
5. Set `UPLOADTHING_TOKEN` for media uploads and `NEXT_PUBLIC_BASE_URL` for canonical metadata.
6. Verify customer ownership, owner authorization, offline queue/reconnect, first customer message, attachment upload and owner status/quote/payment-record flows on the deployed build.

The Firebase web configuration in `src/lib/firebase/client.ts` is public application configuration, not a private credential. Do not create a new Firebase project or add Firebase Storage rules.

## Business contacts
- Head office: Plot 20643 Unit 1, Block 3 Industrial, Gaborone, Botswana
- Branch: Tribal Lot 4216 Unit 6B, Supasave Mall, Mogoditshane, Botswana
- Email: info@prospecagency.com

## Development

    npm install
    npm run dev
    npm run lint
    npm run build

The build runs identity, offline and typography regression checks before Next.js build.

## Protected foundation behavior
The compact dismissible PWA install card, retained native beforeinstallprompt event, iOS Safari installation guidance, embedded-browser handoff, service-worker lifecycle, offline shell and update behavior remain protected. Branding and cache identity are adapted; installation mechanics are not rewritten.


## Firebase connection

Prospec uses the supplied Firebase project `theworks-f4957`. The web configuration in `src/lib/firebase/client.ts` is public application configuration; it is not a secret.

- Enable **Authentication → Sign-in method → Anonymous** for passwordless persistent customer sessions.
- Publish `firestore.rules` and `firestore.indexes.json` to the project.
- Configure `FIREBASE_ADMIN_KEY` as a server-only Vercel environment variable using a service-account JSON key from the same `theworks-f4957` project. Never prefix it with `NEXT_PUBLIC_` or commit the JSON.
- Keep `ADMIN_PASSWORD` server-only for the owner Briefcase session.
- Firestore persistence uses IndexedDB with multi-tab support. Customer enquiry and message writes are queued by the SDK while offline and synchronised after reconnection. UploadThing uploads still require connectivity.

Customer identities currently use Firebase Anonymous Auth and persist on the same browser/device. This is not yet a cross-device recoverable email/password account.
