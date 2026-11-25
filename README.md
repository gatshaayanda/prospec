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

## Current implementation boundary
The public storefront and all four division catalogues are configured for Prospec. The inherited prototype's data layer is still browser-local: enquiries, account messages, status changes, notes and owner edits do not yet sync across devices or create a shared remote inbox. The owner login is server-validated, but local preview data is not a production customer database. Do not use this release for live customer records until the supplied Prospec Firebase project is connected and its customer/staff authorization rules and server data paths have been implemented and tested.

The repository includes Firebase client configuration scaffolding and UploadThing upload routes. No Firebase project ID, credentials, customer authentication flow or Firestore rules have been changed as part of this visual/catalogue adaptation. Uploads require valid UploadThing configuration and internet access.

## Business contacts
- Head office: Plot 20643 Unit 1, Block 3 Industrial, Gaborone, Botswana
- Branch: Tribal Lot 4216 Unit 6B, Supasave Mall, Mogoditshane, Botswana
- Phone: +267 76 609 311 / +267 72 647 807
- WhatsApp: +267 71 215 185
- Email: info@prospecagency.com

## Development

    npm install
    npm run dev
    npm run lint
    npm run build

The build runs identity, offline and typography regression checks before Next.js build.

## Protected foundation behavior
The compact dismissible PWA install card, retained native beforeinstallprompt event, iOS Safari installation guidance, embedded-browser handoff, service-worker lifecycle, offline shell and update behavior remain protected. Branding and cache identity are adapted; installation mechanics are not rewritten.
