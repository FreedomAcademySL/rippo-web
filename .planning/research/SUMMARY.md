# Project Research Summary

**Project:** rippo-web — segundo boton Telegram (second Telegram CTA button)
**Domain:** Fitness form post-submission success screen — multi-trainer CTA
**Researched:** 2026-03-02
**Confidence:** HIGH

## Executive Summary

This project is a tightly scoped UI patch to a temporary fitness intake form. The existing React + Vite + Tailwind + TypeScript stack already contains everything needed; no new dependencies, no new environment variables, and no pipeline changes are required. Research across all four areas converges on a single clear recommendation: add a hardcoded trainer config array inside `contact-form.tsx`, add one parameterized URL-builder function to `contact.ts`, and render two `<a>` buttons via a `.map()` in the success state. This approach keeps the diff minimal, reviewable in minutes, and easily reverted with a single `git revert`.

The main risk is not technical but copywriting: the existing success screen has "Ripo" hardcoded in four distinct places (contact message, success heading text, phone number label, helper text). All four must be updated, not just the button. Missing any one of them leaves a confusing UI where one trainer is still named while the other is not. Every research file independently identified this as the most likely mistake.

Because this is a temporary app with an explicit planned migration, any abstraction beyond a simple inline array is over-engineering and should be rejected. The implementation should be completed in a single focused phase with no follow-on phases needed.

## Key Findings

### Recommended Stack

No stack changes. The current stack handles this feature without additions. The decision research focused on implementation pattern, not technology selection.

**Core technologies (unchanged):**
- React 18+: component rendering — already present, no changes needed
- Vite: build tooling — no new env vars, no pipeline changes needed
- Tailwind CSS: button styling — existing CTA styles reused as-is
- TypeScript: type safety — `as const` trainer array provides type-safe config
- lucide-react: icons (MessageCircle, ArrowRight) — already in use, both buttons use same icons

**Implementation pattern chosen:** Inline `TRAINERS` const array in `contact-form.tsx` + `buildTelegramUrl(username, message)` sibling function in `contact.ts`. Not a `trainers.ts` config module, not a `TrainerButton` component, not `VITE_TELEGRAM_USER_2` env var.

See: `.planning/research/STACK.md`

### Expected Features

**Must have (table stakes):**
- Second Telegram button for Azul (`t.me/azulfantino`) — the literal requirement
- Trainer name on each button ("Contactar a Ripo" / "Contactar a Azul") — minimum disambiguation
- Unique pre-filled message per trainer — "Azul, ya me inscribi..." not "Ripo, ya me inscribi..."
- Both buttons always visible — no trainer selection during form per PROJECT.md
- Updated success message text — remove "contactar a Ripo", replace with trainer-agnostic copy

**Should have (differentiators):**
- Color-coded buttons per trainer — low complexity, instant visual identity (emerald for Ripo, sky/blue for Azul)
- Responsive stacking — `flex-col md:flex-row` for side-by-side on desktop, stacked on mobile

**Defer (out of scope for this patch):**
- Trainer avatars/photos — requires sourcing assets, not needed with clear labels
- Dual contact info cards — only relevant if Azul's phone number is provided
- Analytics on button clicks — useful but out of scope for temporary app
- Dynamic trainer config from backend — over-engineering for exactly 2 known trainers

See: `.planning/research/FEATURES.md`

### Architecture Approach

The change is confined to two files. `contact.ts` gets one additive function (no existing functions modified). `contact-form.tsx` gets an inline trainer array at module level and the success-state JSX updated to render two buttons. No other files change — questionnaire, submission service, data files, env, and deploy pipeline all stay untouched.

**Major components and changes:**
1. `src/utils/contact.ts` — add `buildTelegramUrl(username: string, message: string): string` (~4 lines, additive only)
2. `src/components/contact-form.tsx` — add `TRAINERS` const array, update success-state JSX to `.map()` two buttons, update all four "Ripo" copy references (~30 lines net change)
3. All other files — zero changes

**Key pattern: Additive-only utility changes.** Never modify existing `buildContactUrl()` signature — add a sibling function instead. This prevents regressions for any consumer of the existing function.

See: `.planning/research/ARCHITECTURE.md`

### Critical Pitfalls

1. **Wrong trainer name in contact message** — Azul's button accidentally sends "Ripo, ya me inscribi..." to Azul's Telegram. Prevent by defining separate `ripoMessage` and `azulMessage` strings, each addressing the correct trainer. Verify by clicking each button and reading the pre-filled Telegram text.

2. **Hardcoded "Ripo" remaining in UI copy** — Four locations in `contact-form.tsx` currently name Ripo explicitly (success message line ~38, contact message line ~60, phone label line ~102, helper text line ~107). All four must be updated. Verify by reading every visible word on the success screen.

3. **Phone number display assumes single trainer** — Lines 106-111 show only Ripo's number. With two trainers, this section either needs both numbers or should be removed. The safest choice: remove it, since Telegram buttons handle contact directly and Azul's number may not be available.

See: `.planning/research/PITFALLS.md`

## Implications for Roadmap

This feature is a single-phase implementation. There are no architectural dependencies that require sequencing across multiple phases.

### Phase 1: Implement dual Telegram CTA
**Rationale:** All work is confined to two files with no blocking dependencies. The utility function can be added first (no consumers yet), then the component updated. Zero risk of partial deployment.
**Delivers:** Completed success screen with two trainer buttons, correct pre-filled messages, updated copy throughout, and no pipeline changes.
**Addresses:** All table-stakes features from FEATURES.md (second button, trainer names, unique messages, always-visible, updated copy). Optionally adds color differentiation.
**Avoids:**
- Pitfall 1 (wrong message): define trainer messages explicitly per trainer
- Pitfall 2 (stale "Ripo" copy): audit all four named locations before finishing
- Pitfall 3 (phone number): remove or generalize the contact info card

### Phase Ordering Rationale

- Single phase is correct because: no backend changes, no env changes, no new dependencies, no external integrations. The entire change is self-contained UI work.
- Implementation order within the phase: (1) add `buildTelegramUrl()` to `contact.ts`, (2) update `contact-form.tsx` success state, (3) verify both buttons on mobile and desktop.
- The pitfall checklist from PITFALLS.md serves as the QA gate before merge.

### Research Flags

Phases needing deeper research during planning:
- None. All patterns are well-established. The codebase was read directly.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Direct codebase inspection provides HIGH confidence. No external API, no new library, no niche domain. Implement directly.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | No stack changes; existing stack inspected directly |
| Features | HIGH | Requirements from PROJECT.md are explicit; UX patterns are well-established |
| Architecture | HIGH | Both affected files read directly; change surface is small and clear |
| Pitfalls | HIGH | Pitfalls derived from direct code inspection, not inference |

**Overall confidence:** HIGH

### Gaps to Address

- **Azul's phone number:** If the contact info card is retained (rather than removed), Azul's phone number is needed. Decision: remove the card, since Telegram buttons are the actual contact method. No gap in implementation.
- **Button color for Azul:** Research recommends emerald (Ripo) vs. sky/blue (Azul) but this is a design call. Either color or identical colors with distinct labels are both acceptable. Decision can be made during implementation with no research needed.
- **Mobile layout:** Two stacked buttons on small screens — no known issue, but a quick device test after implementation is recommended.

## Sources

### Primary (HIGH confidence)
- `src/components/contact-form.tsx` — current success screen, button rendering, all "Ripo" copy locations (read directly)
- `src/utils/contact.ts` — current URL builder implementation (read directly)
- `.env` / `.env.example` — current env var structure confirmed (read directly)
- `.github/workflows/deploy-pages.yml` — deploy pipeline confirmed, no changes needed (read directly)
- `.planning/PROJECT.md` — project constraints, scope, "parche aceptable" directive (read directly)

### Secondary (MEDIUM confidence)
- UX literature on multi-CTA completion screens: side-by-side or stacked buttons with clear labels and optional color differentiation is the standard pattern for two equal-priority actions.

---
*Research completed: 2026-03-02*
*Ready for roadmap: yes*
