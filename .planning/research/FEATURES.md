# Feature Landscape

**Domain:** Multi-trainer CTA completion screen (fitness form post-submission)
**Researched:** 2026-03-02
**Confidence:** HIGH (well-scoped feature on existing codebase; UX patterns are well-established)

## Current State

The success screen after form submission currently shows:
1. A checkmark icon + "Aplicacion recibida" heading
2. A success message mentioning Ripo by name
3. A single green CTA button: "Abrir Telegram ahora" linking to `t.me/joa_ripo`
4. A contact info card showing Ripo's phone number
5. Helper text telling the user to click the green button

The contact URL is built via `buildContactUrl()` in `src/utils/contact.ts`, which reads a single `VITE_TELEGRAM_USER` env var. The pre-filled message is hardcoded: "Ripo, ya me inscribi en tu pagina web..."

**Goal:** Add a second Telegram button for trainer Azul (`t.me/azulfantino`) so both buttons are always visible after form completion.

---

## Table Stakes

Features users expect. Missing = confusing or broken experience.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Second Telegram button for Azul | The entire point of the milestone -- users need to contact either trainer | Low | Add a second `<a>` element mirroring the existing Ripo button |
| Trainer name on each button | Users must know which button goes to which trainer | Low | Each button should say "Contactar a Ripo" / "Contactar a Azul" instead of generic "Abrir Telegram ahora" |
| Unique pre-filled message per trainer | The message currently says "Ripo, ya me inscribi..." -- Azul's button must address Azul | Low | Create a second `contactMessage` with "Azul" instead of "Ripo" |
| Both buttons always visible | Per PROJECT.md: no trainer selection during form, both always shown | Low | No conditional logic, no toggle -- both render in the success state |
| Visual distinction between buttons | Two identical green buttons side-by-side create confusion about which is which | Low | Different label text is the minimum. Optionally different accent colors |
| Updated success message text | Currently says "contactar a Ripo" -- must acknowledge both trainers exist | Low | Change to "contactar a tu trainer" or "contactar a Ripo o Azul" |

## Differentiators

Features that improve the experience but are not strictly required for the milestone.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Color-coded buttons per trainer | Instant visual identity -- "the green one is Ripo, the blue one is Azul" | Low | Use different Tailwind color classes (emerald for Ripo, blue/sky for Azul) |
| Trainer avatar/photo on each button | Adds trust and personality; users recognize their trainer visually | Low-Med | Requires sourcing and adding a small image asset for Azul |
| Contact info card per trainer | Currently shows "El numero de Ripo es: +54..." -- could show both | Low | Duplicate the info card or stack two cards |
| Button hover state with trainer identity | Micro-interaction reinforcing which button the user is about to click | Low | Already has hover animation (`group-hover/cta`), just needs per-button identity |
| Responsive stacking (side-by-side on desktop, stacked on mobile) | Two full-width buttons stacked on mobile work fine; side-by-side on desktop saves space | Low | Use `flex-col md:flex-row` wrapper |

## Anti-Features

Features to deliberately NOT build. This is a temporary app with a planned migration.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Trainer selection during the questionnaire | Adds form complexity, changes data model, no value since both buttons always show | Show both buttons on completion -- user decides at that point |
| Dynamic trainer config from backend/API | Over-engineered for a temporary app with exactly 2 known trainers | Hardcode Azul's username or use a second env var (`VITE_TELEGRAM_USER_2`) |
| Generic multi-trainer data model / array config | Abstracting for N trainers when there are exactly 2, and the app is temporary | Keep it simple: two explicit blocks of JSX or at most a small inline array |
| Trainer profile pages or bios | Scope creep -- the completion screen is a CTA, not a directory | Trainer name + button is sufficient |
| Analytics on which trainer button is clicked | Useful data but out of scope for a patch on a temporary app | Can be added later if the app survives migration |
| WhatsApp fallback per trainer | Current code supports WhatsApp mode via `VITE_CONTACT_APP` but this milestone is Telegram-only | Both trainers use Telegram; no need to support mixed contact apps |
| Refactoring `contact.ts` into a multi-trainer utility | The current single-trainer utility works fine; a second call with different params is simpler than refactoring | Either duplicate the URL-building inline or add a parameter to `buildContactUrl` |
| Internationalization of trainer names/messages | App is Spanish-only for Argentine fitness clients | Keep all strings in Spanish, hardcoded |

## Feature Dependencies

```
Trainer name on button --> requires knowing which trainer each button represents
Unique pre-filled message --> requires per-trainer message text
Color-coded buttons --> requires design decision on Azul's color (independent of functionality)
Contact info per trainer --> requires Azul's phone number (may not be available/needed)
Updated success message --> independent, can be done first or last
```

The core dependency chain is minimal. The second button depends on nothing except a Telegram username for Azul, which is already known (`azulfantino`).

## MVP Recommendation

Prioritize (all Low complexity, all table stakes):

1. **Second Telegram button for Azul** -- the literal requirement
2. **Trainer name on each button** -- "Contactar a Ripo" / "Contactar a Azul"
3. **Unique pre-filled message per trainer** -- address the correct trainer
4. **Updated success message** -- acknowledge both trainers
5. **Visual distinction** -- at minimum different labels, ideally different button colors

Defer:
- **Trainer avatars**: Nice but requires assets, and the buttons with names are clear enough
- **Dual contact info cards**: Only if Azul's phone number is provided; may not be needed since Telegram handles identity
- **Responsive side-by-side layout**: Stacked buttons work fine on all screen sizes for 2 buttons

## Implementation Notes

The simplest approach, consistent with the "parche minimo" constraint:

1. In `contact-form.tsx`, define two contact messages (one for Ripo, one for Azul)
2. Build two Telegram URLs: `https://t.me/joa_ripo?text=...` and `https://t.me/azulfantino?text=...`
3. Render two `<a>` buttons in the success state, each with the trainer's name
4. Optionally use `VITE_TELEGRAM_USER_2=azulfantino` env var, or hardcode since the app is temporary
5. Update the success message and helper text to be trainer-agnostic or mention both

No changes needed to `questionnaire.tsx`, `submitQuestionnaireApplication`, or the form flow itself. This is purely a success screen change.

## Sources

- Codebase analysis: `src/components/contact-form.tsx` (lines 78-115, current success screen)
- Codebase analysis: `src/utils/contact.ts` (current URL builder, single-trainer)
- Codebase analysis: `.planning/PROJECT.md` (requirements and constraints)
- UX patterns: Multi-CTA completion screens are well-documented in UX literature -- the key principle is "one primary action, clear visual hierarchy." With two equal-priority CTAs (both trainers), the standard approach is side-by-side or stacked buttons with clear labels and optional color differentiation.
