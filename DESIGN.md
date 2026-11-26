# Prospec Group — Design Direction

## Identity and audience
A bold, youth-led Botswana business group serving organisations, SMEs, event teams, entrepreneurs and individuals who need marketing, sourcing, digital identity or print production. The brand is cheeky and confident, but operational details remain precise and credible.

Voice: QWERTY — Quirky, Witty, Enthusiastic, Transcendent and Youthful.
Public line: “We keep our noses in other people's business.”
Persona: “Pitbulls of Branding.”
Vision cue: “Annihilate” — a campaign statement, not a claim about customers or competitors.

## Visual genre
- Dominant: Character. The brand is expressive, youthful and recognisable; typography and copy carry personality.
- Secondary: Loud on the public hero, division introductions and campaign/announcement moments.
- Secondary: Data inside Account and the Owner Briefcase, where requests, quotes, dates and money need compact, readable hierarchy.

## Typography
- Wordmark: flowing script treatment, with clean sans-serif support.
- Product/UI: system sans-serif / Inter-style stack. Use strong, compact headings; body copy remains readable and calm.
- Avoid script for navigation, form labels, prices, statuses or operational data.

## Colour and surfaces
- Primary brand hue: Prospec teal/cyan #00B9C7.
- Secondary: charcoal #20272D.
- White is the clean contrast/surface colour, not a reason to introduce more decorative hues.
- Neutral surfaces and borders carry most content. Semantic status colours remain restrained and are paired with text.
- No low-contrast teal body text on charcoal or white; check real foreground/background pairs.

## Imagery and composition
- Use real Prospec work, print products, NFC interactions, sourcing and campaign imagery when approved assets are published through the owner Briefcase.
- Until then, use clearly labelled illustrative category imagery. Never imply stock photography is completed Prospec work; never invent client logos or testimonials.
- Public flow: concise brand statement → compact expandable departments → searchable/filterable catalogue → customer Account request → clear status feedback. Keep public contact details secondary; do not publish phone numbers as primary conversion paths.
- Catalogue browsing uses progressive disclosure: short scannable cards, two-line description limits and expanded detail only when needed. Department filters remain visible and products from related offerings remain comparable.
- Account: selected items, request details, next step, updates and receipt/request record. Keep it task-first.
- Briefcase: compact owner overview, incoming enquiries, quote/status actions, catalogue management and financial records. Data density belongs here, not in the public hero.

## Density, motion and interaction
- Mobile-first. Short sections, compact rows, clear labels, readable type and touch-sized controls.
- Use division filters to reduce catalogue scanning. Keep all catalogue products requestable.
- Every unpriced product uses a visible “Quote on request” label and still enters the same enquiry flow.
- Motion is purposeful and brief; honour reduced-motion preferences.
- Announcements are owner-published content, not hard-coded launch claims.

## Protected behavior and boundaries
- Preserve the inherited PWA install event lifecycle, inline install-card placement, iOS guidance, embedded-browser handoff, offline shell, cache update and refresh behavior.
- Preserve the inherited scripted ServiceGuide behavior; change only Prospec identity and task-specific copy/actions.
- The live Prospec Store uses the supplied `theworks-f4957` Firestore project for the public catalogue, customer-owned enquiries and request messages; the owner Briefcase reads and updates shared records through its server-authenticated API. Customer identity is persistent Anonymous Auth on the same browser/device, not a recoverable cross-device account. Owner notes and local activity counters remain browser-local. Do not claim email/push delivery, payment-gateway capture or cross-device account recovery.
- Do not change Firebase project IDs, secrets, Firestore rules or storage configuration without verified Prospec configuration and authorization.


## Owner Briefcase information architecture
The Briefcase is organised around Prospec's actual operating rhythm, not inherited generic Business OS labels:
- Overview: shift/session, customer-facing availability, requests needing attention, current pipeline and next actions.
- Client work: customer directory, incoming enquiries, quote/status/payment actions and customer conversation.
- Finance: currency, payment records, expenses, receipt/business details and finance insights.
- Store & offers: business identity, division-facing catalogue, product/service media, storefront preview and customer announcements.
- Notes: private working notes.
- Performance: recorded activity, customer journey and directional conversion/operations measures.
The four divisions remain visible in the workspace: Prospec AG (marketing & advertising), Prospec Supplies (procurement & sourcing), Prospec NFC (digital identity, NFC & QR), and Prospec AG Printing (print & branded production). Do not imply separate division-specific pipelines exist until implemented.

### Usability principles applied
- Recognition over recall: use explicit task names and keep division context visible. Avoid icon-only navigation for core work.
- Progressive disclosure: keep the six main work areas visible; retain specialist editors and less-frequent controls inside their relevant area.
- Match the user's language: prefer enquiries, client work, sourcing, print production, offers, receipts and payments over generic system jargon.
- Visibility of system status: keep shift state, availability and data-scope labels visible; clearly distinguish local preview records from shared records.
- Readability is a functional requirement: operational labels and helper copy should not be microtext; form controls must remain comfortably legible on mobile.

Research basis: Nielsen Norman Group, [10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/), [Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/), and [Recognition and Recall](https://www.nngroup.com/articles/recognition-and-recall/).
