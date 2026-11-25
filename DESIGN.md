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
- Use real Prospec work, print products, NFC interactions, sourcing and campaign imagery as approved assets become available.
- Until supplied media exists, use branded placeholders with the item/division name; do not invent portfolio work, client logos or testimonials.
- Public flow: brand statement → four division choices → filterable catalogue → enquiry CTA → contact details.
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
- Browser-local preview data is not production persistence. Do not claim shared accounts, live notifications, remote admin inbox or cross-device sync until the Prospec database integration is complete and verified.
- Do not change Firebase project IDs, secrets, Firestore rules or storage configuration without verified Prospec configuration and authorization.
