# Design brief

Use only if the design pass is regenerated. If the Framer output already exists, that output governs and this file is reference.

Design surface produces standalone designed pages with realistic sample content. No CMS collections, no form wiring, minimal motion. Detail pages are built as single templates with one representative record; they map to dynamic routes at build time.

## Brand

Two-agent team under Coldwell Banker, serving Lakewood Ranch and Sarasota, Florida. Tone and visual system per the brand system. Fill colors, type, and spacing from `BRAND-TOKENS.md` before starting.

## Pages

1. Home — hero with valuation CTA, featured listings (6), stat band (4 stats), neighborhoods row (3), upcoming events row (3), testimonial slider, latest posts (3), closing CTA band
2. Buy — hero, four-step process, featured listings, FAQ accordion, contact form
3. Sell — hero, four-step process, recent solds grid, valuation form, testimonials, FAQ
4. Listings index — header, filter bar UI (price, beds, baths, status), grid of 9, pagination
5. Listing detail — gallery, address and price header, facts bar, description, features, map, agent card, inquiry form, similar listings
6. Calendar index — month or list toggle, category filter chips, event cards, subscribe CTA
7. Event detail — image, title, date and time, venue with map, description, ticket CTA, other events at this venue, nearby listings
8. Venue detail — hero, about, upcoming events at this venue
9. Neighborhoods index — intro, grid of 6
10. Neighborhood detail — hero, overview, highlights grid, listings row, **upcoming events row**, CTA
11. About — team story, two agent cards with license numbers, values, CTA
12. Blog index and post detail
13. Home valuation — single-focus landing, address form, trust indicators, three steps, testimonial
14. Contact — form, office info, map
15. Privacy and Terms — plain text template

## Global

Sticky nav, transparent over hero, solid on scroll. Footer compliance block: Coldwell Banker name and logo placeholder, both license numbers, office address, Equal Housing mark. Sticky mobile call and text bar.

Components: listing card, event card, venue card, stat band, CTA band, testimonial slider, agent card, filter chip, FAQ accordion.

## Forms

First name, last name, email, phone, message where relevant, and an unchecked consent checkbox. Consent wording per `COMPLIANCE.md`. Design only — no submission wiring.

## Responsive

Desktop 1200, tablet 810, phone 390. Grids step 3 to 2 to 1. Nav collapses at tablet.

## Content

Realistic Sarasota and Lakewood Ranch sample data throughout. Real venue names and plausible event titles for the calendar. No lorem ipsum.
