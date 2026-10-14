# Design direction — clean and bright (Oct 2026)

Owner chose **clean and bright, like Apple / Stripe**. Owner's rule for copy:
*"most people just want their quote or to select items and move on — no plenty talk."*
Every build agent working on public pages follows this file.

## Who we studied

| Reference | Signature move | Take |
|---|---|---|
| Apple Store (buy flow) | Product on a soft grey tile, one price, one button; configure → bag | Product tiles, one decision per screen |
| Stripe.com | White ground, huge tight display type, real numbers as hero | Price as the hero; tabular numerals |
| Octopus Energy quote | Plain-English quote in under a minute | Short copy, no jargon |
| Lemonade | One question per screen, instant answer | `/find` pacing |
| solar.nexprove.com/find | 3 taps to a matched kit | Our `/find` flow (shipped separately) |

Category default we are rejecting: Nigerian solar sites that are long, dense, WhatsApp-first and
built from stock photos of panels on roofs. Also not adopting nexprove's cream ground (an
AI-default attractor).

## Art direction

- **Signature move:** real product photography on soft `canvas` tiles (Apple Store grid). Every
  product image sits on the same tile colour, centred, with the same padding. No lifestyle stock, no AI images.
- **Ground:** white page, `canvas` (#F5F6F8) tiles and alternating bands. Ink text. One accent, the
  sun yellow, only on the primary action and small highlights. Never on large backgrounds.
- **Depth:** hairline borders (`line`) and at most `shadow-soft`. No gradients, blobs or grain.
- **Type:** Plus Jakarta Sans display with tight negative tracking; Inter body. Prices use
  `tabular-nums`, heavy weight, large.
- **Copy budget:** a headline, at most one short line under it, and the action. Cut any paragraph
  that explains *how we work* from shopping and quote surfaces; it belongs on /how-it-works only.

## Interaction budget

E-commerce tier: low motion. Only 150–200ms state transitions (hover, select, step change). No
scroll-reveal on text. Respect `prefers-reduced-motion`. Cart and quote screens: no motion.

## Page priorities

1. Home: hero headline + one CTA → `/find`, persona quick-start tiles, product photo strip, short price proof. Nothing else.
2. Shop: Apple-style product grid, filters as chips (horizontal scroll on mobile), price + "Add" per card.
3. Product/brand pages: photo first, price, add to order.
4. Nav: logo, Shop, Find my kit, cart. Everything else lives in the footer.

## Deferred (tracked, not forgotten)

Dark theme, full a11y audit, per-page OG images.
