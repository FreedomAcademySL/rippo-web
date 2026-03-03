# Architecture: Second Telegram Button Integration

**Domain:** Fitness form CTA modification
**Researched:** 2026-03-02
**Confidence:** HIGH -- small codebase, all sources are the actual code

## Current Architecture

The contact flow is split across two files with a simple data path:

```
.env (VITE_TELEGRAM_USER, VITE_CONTACT_NUMBER, VITE_CONTACT_APP)
  |
  v
src/utils/contact.ts (reads env vars at module load, exports 3 functions)
  |
  v
src/components/contact-form.tsx (calls buildContactUrl() to render one CTA button)
```

### Current Component Structure

`contact-form.tsx` is a single component (~130 lines) with two visual states:

1. **Questionnaire state** -- renders `<Questionnaire>` component, handles submission
2. **Success state** -- renders a success card with:
   - Check icon + success heading
   - One `<a>` tag CTA button pointing to `buildContactUrl(contactMessage)`
   - One info box showing "El numero de Ripo es: ..."
   - Helper text referencing Ripo by name

The success state is a single JSX block inside a ternary (`submissionSuccess ? ... : ...`). The CTA button, info box, and helper text are all inline JSX -- not extracted components.

### Current Data Flow

```
contact.ts module load:
  CONTACT_APP = env.VITE_CONTACT_APP       -> "telegram"
  CONTACT_NUMBER = env.VITE_CONTACT_NUMBER -> "5491131376049"
  TELEGRAM_USER = env.VITE_TELEGRAM_USER   -> "joa_ripo"

contact-form.tsx render:
  contactMessage = "Ripo, ya me inscribi..." (hardcoded trainer name)
  href = buildContactUrl(contactMessage)    -> "https://t.me/joa_ripo?text=..."
  label = getContactAppName()              -> "Telegram"
  number = getDisplayNumber()              -> "+5491131376049"
```

Key observation: The trainer name "Ripo" is hardcoded in **three places** within `contact-form.tsx`:
1. `contactMessage` string (line ~60): `"Ripo, ya me inscribi en tu pagina web..."`
2. Success message (line ~38): `"contactar a Ripo por ${getContactAppName()}..."`
3. Info box label (line ~102): `"El numero de Ripo es:"`
4. Helper text (line ~107): `"...continuar la conversacion con Ripo."`

## Recommended Architecture

### Approach: Inline Duplication (Minimal Patch)

Given PROJECT.md explicitly marks multi-trainer refactoring as out of scope ("app temporal, parche aceptable"), the correct approach is **duplicate the CTA block inline** rather than abstracting a reusable `<TrainerCTA>` component.

Why NOT extract a component:
- The app is temporary and will migrate
- There are exactly 2 trainers, not N trainers
- Extracting a component adds files, types, and imports for zero future payoff
- PROJECT.md says "parche aceptable"

Why NOT abstract `contact.ts` into multi-trainer:
- Same reasoning -- app is temporary
- Adding a second env var (`VITE_TELEGRAM_USER_2`) or hardcoding `azulfantino` are both acceptable

### Component Boundaries (What Changes Where)

**File 1: `src/utils/contact.ts`**

Add a parallel function that accepts a trainer username parameter, OR add a second set of constants. The simplest path: add a `buildTelegramUrl(username: string, message: string): string` function that takes explicit parameters instead of reading from env vars. This avoids touching env vars entirely and keeps Ripo's existing functions untouched.

```typescript
// NEW -- explicit trainer URL builder (no env var dependency)
export function buildTelegramUrl(username: string, message: string): string {
  return `https://t.me/${username}?text=${encodeURIComponent(message)}`
}
```

This is additive only. Zero changes to existing functions. Ripo's button can optionally switch to this too, or stay on the existing `buildContactUrl()`.

**File 2: `src/components/contact-form.tsx`**

Changes confined to the success state JSX block (the `submissionSuccess ? (...)` branch). Specifically:

1. Update `submissionMessage` to remove trainer-specific name (say "a tu trainer" instead of "a Ripo")
2. Define two contact messages with trainer-specific names
3. Duplicate the CTA `<a>` button -- one for Ripo, one for Azul
4. Update the info box to show both trainers or remove it (it currently shows Ripo's phone number, which is less relevant with Telegram usernames)
5. Update helper text to be trainer-neutral

**File 3: `.env` -- NO CHANGES NEEDED**

Azul's Telegram username (`azulfantino`) can be hardcoded directly in the component or in `contact.ts`. For a temporary app with 2 known trainers, adding `VITE_TELEGRAM_USER_2` is unnecessary indirection. The existing `VITE_TELEGRAM_USER=joa_ripo` can stay as-is.

**No other files change.** The questionnaire, submission service, types, and data files are untouched.

### Resulting Data Flow

```
contact-form.tsx (success state):
  |
  |-- Ripo button:
  |     contactMessage = "Ripo, ya me inscribi..."
  |     href = buildTelegramUrl("joa_ripo", contactMessage)
  |
  |-- Azul button:
  |     contactMessage = "Azul, ya me inscribi..."
  |     href = buildTelegramUrl("azulfantino", contactMessage)
```

### Success State Layout

Current:
```
+----------------------------------+
|  [check icon]                    |
|  Aplicacion recibida!            |
|  [success message]               |
|                                  |
|  [ Abrir Telegram ahora    ->]  |  <-- single green CTA
|                                  |
|  El numero de Ripo es: +549...   |
|  Hace clic en el boton verde...  |
+----------------------------------+
```

Proposed (two buttons stacked):
```
+----------------------------------+
|  [check icon]                    |
|  Aplicacion recibida!            |
|  [generic success message]       |
|                                  |
|  [ Contactar a Ripo        ->]  |  <-- CTA button 1
|  [ Contactar a Azul        ->]  |  <-- CTA button 2
|                                  |
|  Hace clic en un boton para...   |
+----------------------------------+
```

The two buttons should be visually distinct enough that users can tell them apart. Use the same emerald CTA style for both but include the trainer name in the button label. No need for different colors -- clarity through labeling is sufficient.

### Detailed Change Map

| Location | Current | Change | Risk |
|----------|---------|--------|------|
| `contact.ts` | `buildContactUrl()` reads env vars | Add `buildTelegramUrl(username, message)` | None -- additive only |
| `contact-form.tsx` line ~38 | `"contactar a Ripo por..."` | `"contactar a tu trainer por..."` | None |
| `contact-form.tsx` line ~60 | Single `contactMessage` for Ripo | Two messages: `ripoMessage`, `azulMessage` | None |
| `contact-form.tsx` lines ~94-105 | Single `<a>` CTA button | Two `<a>` CTA buttons with trainer names | Layout shift -- test on mobile |
| `contact-form.tsx` lines ~106-112 | Ripo phone number display | Remove or show both usernames | Minor -- decide per UX preference |
| `contact-form.tsx` line ~113-115 | Helper text references Ripo | Generic: "Elegi tu trainer para abrir Telegram" | None |
| `.env` | `VITE_TELEGRAM_USER=joa_ripo` | No change | None |

## Patterns to Follow

### Pattern: Additive-Only Changes to Utility Functions

When the existing utility (`contact.ts`) serves one consumer correctly, do not modify it. Add a new function alongside it. This prevents regressions.

```typescript
// Existing -- DO NOT MODIFY
export function buildContactUrl(message: string): string { ... }

// New -- additive
export function buildTelegramUrl(username: string, message: string): string {
  return `https://t.me/${username}?text=${encodeURIComponent(message)}`
}
```

### Pattern: Hardcode Known Values in Temporary Apps

For an app with a defined end-of-life, hardcoding `"joa_ripo"` and `"azulfantino"` directly in the component (or in a simple const array in `contact.ts`) is correct. Environment variables add deployment complexity for zero future benefit.

## Anti-Patterns to Avoid

### Anti-Pattern: Over-Engineering for a Temporary App

Creating a `TrainerConfig` type, a `trainers.ts` data file, a `<TrainerCTAButton>` component, and `VITE_TRAINER_*` env vars is textbook over-engineering for an app that will be replaced. The scope is 2 known trainers, not N.

### Anti-Pattern: Modifying Existing Function Signatures

Do not change `buildContactUrl()` to accept optional parameters. Other code may depend on its current signature. The `submitQuestionnaireApplication` service and any mirror submission logic should remain untouched.

## Build Order Implications

This is a single-phase change with no dependencies:

1. Add `buildTelegramUrl()` to `contact.ts` (can be done first, no consumers yet)
2. Modify success state JSX in `contact-form.tsx` (consumes new function)
3. Test both buttons on mobile and desktop

There are no database changes, no API changes, no new env vars needed in CI/CD, and no new dependencies. The deployment pipeline (`deploy.yml`) does not need updates.

## Scalability Considerations

Not applicable -- app is temporary. If a third trainer were ever needed, the inline approach would become unwieldy and a data-driven approach (trainer array + map) would be warranted. But PROJECT.md explicitly scopes this out.

## Sources

- `src/components/contact-form.tsx` -- current component (read directly)
- `src/utils/contact.ts` -- current utility (read directly)
- `.env` -- current environment configuration (read directly)
- `.planning/PROJECT.md` -- project scope and constraints (read directly)
