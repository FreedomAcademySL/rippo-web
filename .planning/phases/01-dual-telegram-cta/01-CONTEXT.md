# Phase 1: Dual Telegram CTA - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a second Telegram CTA button for trainer Azul alongside the existing Ripo button on the post-submission success screen. Both buttons are always visible, each with the correct trainer name, unique pre-filled message, and distinct color. All "Ripo"-specific copy is updated to be trainer-agnostic. The entire change is confined to two files (`contact.ts` and `contact-form.tsx`) with no backend, env, or pipeline changes.

</domain>

<decisions>
## Implementation Decisions

### Button layout & order
- Stacked vertically, full width — same as current single button layout
- Ripo's button on top, Azul's below
- Equal visual weight — same size, same style, different colors (emerald for Ripo, sky/blue for Azul)

### Updated success copy
- Success message uses generic "tu trainer" — e.g. "contactar a tu trainer por Telegram y empezar tu transformacion"
- Heading stays as-is: "¡Aplicacion recibida! 🎉"
- Button labels include trainer name: "Contactar a Ripo por Telegram" / "Contactar a Azul por Telegram"

### Message template
- Keep current conversational style with phone added: "Hola {trainer}, ya me inscribi en tu pagina web. Mi nombre es {fullName}, mi telefono es {phone}. ¿Como seguimos?"
- Phone number combines country code + number (full international format)
- Same template for both trainers — only the trainer name and Telegram username differ
- Start with "Hola" for a friendlier tone

### Ripo phone card placement
- Phone card goes below both buttons (buttons first as primary CTAs, then phone card, then helper text)
- Card text stays exactly as-is ("El numero de Ripo es:") per COPY-03

### Claude's Discretion
- Success card border color (currently emerald — may keep or neutralize given two trainers)
- Helper text wording below the phone card
- Spacing and visual polish between the two buttons

</decisions>

<specifics>
## Specific Ideas

- Message format: "Hola {trainer}, ya me inscribi en tu pagina web. Mi nombre es {fullName}, mi telefono es {phone}. ¿Como seguimos?" — provisional, client may define final text later (per MSG-03)
- Azul's Telegram username: `azulfantino` (hardcoded, no env var)
- Ripo's Telegram username: from existing `VITE_TELEGRAM_USER` env var

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `buildContactUrl(message)` in `contact.ts`: Builds Telegram/WhatsApp URL — needs to accept trainer-specific Telegram username
- `getContactAppName()` in `contact.ts`: Returns "Telegram" or "WhatsApp" — still usable as-is
- `getDisplayNumber()` in `contact.ts`: Formats phone number for display — still usable as-is for Ripo's card

### Established Patterns
- Env vars for Ripo's config (`VITE_TELEGRAM_USER`, `VITE_CONTACT_NUMBER`) — Azul will be hardcoded inline per project decision
- Tailwind CSS with dark theme classes (`bg-slate-900`, `text-white`) — all styling inline
- `lucide-react` icons (`MessageCircle`, `ArrowRight`, `CheckCircle`) — reuse for Azul's button

### Integration Points
- `contact-form.tsx` line 56: `contactMessage` hardcoded to "Ripo" — needs parameterized version
- `contact-form.tsx` lines 94-105: Single `<a>` button — needs duplication with trainer-specific props
- `contact.ts` line 25: `buildContactUrl` uses single `TELEGRAM_USER` — needs to accept username parameter for Azul

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-dual-telegram-cta*
*Context gathered: 2026-03-03*
