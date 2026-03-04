# Phase 1: Dual Telegram CTA - Research

**Researched:** 2026-03-03
**Domain:** React success-screen UI patch — multi-trainer Telegram CTA buttons
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Button layout & order**
- Stacked vertically, full width — same as current single button layout
- Ripo's button on top, Azul's below
- Equal visual weight — same size, same style, different colors (emerald for Ripo, sky/blue for Azul)

**Updated success copy**
- Success message uses generic "tu trainer" — e.g. "contactar a tu trainer por Telegram y empezar tu transformacion"
- Heading stays as-is: "¡Aplicacion recibida! 🎉"
- Button labels include trainer name: "Contactar a Ripo por Telegram" / "Contactar a Azul por Telegram"

**Message template**
- Keep current conversational style with phone added: "Hola {trainer}, ya me inscribi en tu pagina web. Mi nombre es {fullName}, mi telefono es {phone}. ¿Como seguimos?"
- Phone number combines country code + number (full international format)
- Same template for both trainers — only the trainer name and Telegram username differ
- Start with "Hola" for a friendlier tone

**Ripo phone card placement**
- Phone card goes below both buttons (buttons first as primary CTAs, then phone card, then helper text)
- Card text stays exactly as-is ("El numero de Ripo es:") per COPY-03

### Claude's Discretion
- Success card border color (currently emerald — may keep or neutralize given two trainers)
- Helper text wording below the phone card
- Spacing and visual polish between the two buttons

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BTN-01 | Second Telegram button for Azul (t.me/azulfantino), always visible alongside Ripo's button | Add second `<a>` element to success state JSX; Azul's username `azulfantino` hardcoded per locked decision |
| BTN-02 | Each button shows the trainer name ("Contactar a Ripo" / "Contactar a Azul") | Button label text includes trainer name from the TRAINERS const array |
| BTN-03 | Each button sends a pre-filled message with the correct trainer name (not "Ripo" in Azul's button) | Separate message string computed per trainer using the locked template |
| BTN-04 | Buttons with distinct colors (emerald for Ripo, sky/blue for Azul) | Tailwind classes: `bg-emerald-400/90` for Ripo, `bg-sky-400/90` for Azul — both already in Tailwind palette |
| MSG-01 | Message template centralized in one place, easy to modify | Single template function/string in `contact-form.tsx`; both buttons call it with different trainer names |
| MSG-02 | Template uses trainer name (hardcoded per button) + form data (fullName from name+lastName, phone from whatsapp_country_code+whatsapp_number) | Phone data is in `result.answers`; existing pattern for `fullName` extraction already in component; phone requires extracting `whatsapp_country_code` + `whatsapp_number` answer fields |
| MSG-03 | Provisional format: "Hola {trainer}, ya me inscribi en tu pagina web. Mi nombre es {fullName}, mi telefono es {phone}. ¿Como seguimos?" | String template with trainer name, fullName (already derived in component), and phone (new extraction needed) |
| COPY-01 | Generic success text — not "contactar a Ripo" but "contactar a tu trainer" | Change `submissionMessage` string at line ~34 of `contact-form.tsx` |
| COPY-02 | Helper text updated to reflect two trainers | Change bottom helper text (line ~113) to be trainer-agnostic |
| COPY-03 | Ripo's phone number card kept exactly as-is, moved below both buttons | Keep the `<div>` block (lines ~106-111) unchanged; reorder in JSX so it appears after both buttons |
</phase_requirements>

## Summary

This phase is a tightly scoped UI patch to `src/components/contact-form.tsx` and `src/utils/contact.ts`. No new dependencies, no new environment variables, no backend or pipeline changes. The existing React + Vite + Tailwind + TypeScript stack already contains everything needed. Research across the existing `.planning/research/` files (ARCHITECTURE.md, STACK.md, FEATURES.md, PITFALLS.md) and direct code inspection all converge on the same single implementation pattern.

The primary technical work is: (1) add a parameterized URL builder to `contact.ts`, (2) add a `TRAINERS` const array and phone extraction to `contact-form.tsx`, (3) update the success-state JSX to render two buttons via the array, and (4) update all four "Ripo"-only copy locations. The CONTEXT.md locked decisions resolve every significant design question — button order, colors, message template, phone format, and card placement are all specified.

The one new data requirement compared to the existing contact message is the **phone number** in the message template. The current `contactMessage` does not include phone. The component already has `result` in state containing `answers.whatsapp_country_code` and `answers.whatsapp_number` — these need to be extracted in the component the same way `fullName` is extracted, combining them into `+{countryCode}{number}` format.

**Primary recommendation:** Two files change. Add `buildTelegramUrl(username, message)` to `contact.ts`. In `contact-form.tsx`, add phone extraction alongside the existing `fullName` extraction, define a `TRAINERS` const array, build the message from the locked template, and render both buttons with `.map()`. Move the Ripo phone card below both buttons. Update the three remaining "Ripo"-only copy strings.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.2.0 | Component rendering | Already in project; no change |
| TypeScript | ~5.9.3 | Type safety | Already in project; `as const` for TRAINERS array |
| Tailwind CSS | ^4.1.17 | Button styling | Already in project; emerald + sky color classes available |
| lucide-react | ^0.553.0 | Icons (MessageCircle, ArrowRight) | Already in project; same icons reused for both buttons |

### Supporting

No new supporting libraries needed.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hardcoded TRAINERS array in component | `VITE_TELEGRAM_USER_2` env var | Env var requires updating .env, .env.example, deploy workflow, and GitHub secrets — four files for a hardcoded value on a temporary app; rejected |
| `.map()` over TRAINERS array | Two explicit `<a>` blocks | Both work for exactly 2 trainers; array map is slightly more maintainable and keeps the diff smaller |
| New `buildTelegramUrl()` function | Modifying `buildContactUrl()` signature | Modifying existing function risks breakage for current Ripo button consumer; additive new function is safer |

**Installation:** No `npm install` commands needed.

## Architecture Patterns

### Recommended Project Structure

No new files or directories. Changes confined to:

```
src/
├── utils/
│   └── contact.ts          # ADD: buildTelegramUrl(username, message)
└── components/
    └── contact-form.tsx    # MODIFY: TRAINERS array, phone extraction, JSX update
```

### Pattern 1: Additive-Only Utility Function

**What:** Add a new exported function to `contact.ts` that accepts explicit parameters instead of reading module-level env vars. Do not modify `buildContactUrl()`.

**When to use:** When the existing utility serves its current consumer correctly and adding a parameter would break the existing call signature.

**Example:**
```typescript
// Source: src/utils/contact.ts (existing — DO NOT MODIFY)
export function buildContactUrl(message: string): string {
  const encoded = encodeURIComponent(message)
  if (CONTACT_APP === 'telegram') {
    return `https://t.me/${TELEGRAM_USER}?text=${encoded}`
  }
  return `https://api.whatsapp.com/send?phone=${CONTACT_NUMBER}&text=${encoded}`
}

// NEW — additive, explicit parameters, no env var dependency
export function buildTelegramUrl(username: string, message: string): string {
  return `https://t.me/${username}?text=${encodeURIComponent(message)}`
}
```

### Pattern 2: TRAINERS Const Array at Module Level

**What:** Define trainer configuration as an `as const` array at the top of `contact-form.tsx` (module level, outside the component). Both entries are fully explicit — no dynamic lookup, no env vars.

**When to use:** When there are exactly N known static values that drive rendering and extraction into a config module would be over-engineering.

**Example:**
```typescript
// Source: module level in contact-form.tsx
const TRAINERS = [
  { name: 'Ripo', username: import.meta.env.VITE_TELEGRAM_USER as string, label: 'Contactar a Ripo por Telegram', colorClass: 'bg-emerald-400/90 hover:bg-emerald-300 shadow-emerald-500/40' },
  { name: 'Azul', username: 'azulfantino', label: 'Contactar a Azul por Telegram', colorClass: 'bg-sky-400/90 hover:bg-sky-300 shadow-sky-500/40' },
] as const
```

Note: Ripo's username still reads from `VITE_TELEGRAM_USER` per locked decision ("Ripo's Telegram username: from existing `VITE_TELEGRAM_USER` env var").

### Pattern 3: Phone Extraction Alongside fullName

**What:** Extract phone components from `result.answers` the same way `fullName` is currently extracted. The `whatsapp_country_code` answer is a select field (value stored as text) and `whatsapp_number` is a phone field (value stored as text). Combine as `+{countryCode}{number}`.

**When to use:** MSG-02 requires phone in the message template. The data is already in component state (`result`).

**Example:**
```typescript
// Existing pattern in contact-form.tsx for fullName:
const firstName =
  typeof result?.answers?.name?.[0]?.value === 'string' &&
    result.answers.name[0].value.trim().length > 0
    ? result.answers.name[0].value.trim()
    : null
const lastName =
  typeof result?.answers?.lastName?.[0]?.value === 'string' &&
    result.answers.lastName[0].value.trim().length > 0
    ? result.answers.lastName[0].value.trim()
    : null
const fullName = [firstName, lastName].filter(Boolean).join(' ') || '_____'

// NEW — phone extraction following same pattern:
const countryCode =
  typeof result?.answers?.whatsapp_country_code?.[0]?.value === 'string'
    ? result.answers.whatsapp_country_code[0].value.trim()
    : ''
const phoneNumber =
  typeof result?.answers?.whatsapp_number?.[0]?.value === 'string'
    ? result.answers.whatsapp_number[0].value.trim()
    : ''
const phone = countryCode && phoneNumber ? `${countryCode}${phoneNumber}` : '_____'
```

Note: `whatsapp_country_code` values from the questionnaire data are stored as strings like `"+54"` (they include the `+` prefix already — see `LATAM_CALLING_CODES` in `questionnaire.tsx`). So `phone` will naturally be `+54XXXXXXXXX` without needing to prepend a `+`.

### Pattern 4: Message Template Function

**What:** A single function that produces the contact message given trainer name, fullName, and phone. Centralized per MSG-01.

**Example:**
```typescript
// Locked message format from CONTEXT.md
function buildTrainerMessage(trainerName: string, fullName: string, phone: string): string {
  return `Hola ${trainerName}, ya me inscribi en tu pagina web. Mi nombre es ${fullName}, mi telefono es ${phone}. ¿Como seguimos?`
}
```

### Pattern 5: Two-Button Map in Success JSX

**What:** Replace the single `<a>` button with a `.map()` over `TRAINERS`. Each trainer gets its own button with trainer-specific `href`, label, and color class.

**Example:**
```typescript
{TRAINERS.map((trainer) => (
  <a
    key={trainer.username}
    href={buildTelegramUrl(trainer.username, buildTrainerMessage(trainer.name, fullName, phone))}
    target="_blank"
    rel="noopener noreferrer"
    className={`group/cta flex w-full flex-col items-center justify-center gap-1 rounded-2xl ${trainer.colorClass} px-8 py-4 text-lg font-black uppercase tracking-wide text-slate-900 shadow-lg hover:shadow-xl transition md:flex-row`}
  >
    <span role="img" aria-hidden="true" className="group-hover/cta:-translate-x-1 transition-transform duration-300">
      <MessageCircle className="w-6 h-6" />
    </span>
    {trainer.label}
    <span aria-hidden="true" className="group-hover/cta:translate-x-2 transition-transform duration-300">
      <ArrowRight className="w-6 h-6" />
    </span>
  </a>
))}
```

### Pattern 6: Success-State JSX Layout Order

Per CONTEXT.md locked decision on phone card placement:

```
[success state card]
  [check icon]
  [heading: "¡Aplicacion recibida! 🎉"]
  [generic success message]
  [Ripo button]       <-- emerald
  [Azul button]       <-- sky/blue
  [Ripo phone card]   <-- kept exactly as-is per COPY-03
  [helper text]       <-- updated to be trainer-agnostic
```

### Anti-Patterns to Avoid

- **Modifying `buildContactUrl()` signature:** Other code calls it. Adding optional params risks subtle bugs. Add a sibling function instead.
- **Adding `VITE_TELEGRAM_USER_2` env var:** Requires updating `.env`, `.env.example`, `deploy-pages.yml`, and GitHub Secrets — four files for a hardcoded value.
- **Extracting a `<TrainerButton>` component:** Adds a new file, new types, new imports for exactly 2 static buttons in a temporary app. The `.map()` pattern is sufficient.
- **Creating a `trainers.ts` config module:** Over-engineering for 2 static entries. Config lives in the component where it is used.
- **Leaving any "Ripo"-only copy in the shared heading/message areas:** Four locations in the current component name Ripo explicitly. All four must be addressed (three updated + one kept per COPY-03).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Telegram URL construction | Custom URL encoding | `encodeURIComponent()` (built-in) | Already used in current `buildContactUrl()`; handles special chars, spaces, accents correctly |
| Phone formatting | Custom phone formatter | String concatenation of country code + number | The questionnaire already stores them split; `+{code}{number}` is sufficient for the message |
| Button color variants | Custom CSS variables | Tailwind utility classes (`bg-emerald-400/90`, `bg-sky-400/90`) | Already the project pattern; zero new CSS needed |

**Key insight:** This is a pure JSX/string change. No utility libraries, no formatters, no new abstractions. The "don't hand-roll" discipline here means not over-abstracting the simple string operations.

## Common Pitfalls

### Pitfall 1: Wrong Trainer Name in Contact Message
**What goes wrong:** Azul's button sends "Hola Ripo, ya me inscribi..." to Azul's Telegram — the original hardcoded message left unchanged or copied without updating the trainer name.
**Why it happens:** Current `contactMessage` string at line 56 of `contact-form.tsx` has "Ripo" hardcoded. Easy to duplicate and forget to update.
**How to avoid:** Use the `buildTrainerMessage(trainer.name, ...)` pattern — trainer name comes from the TRAINERS array entry, not from a hardcoded string.
**Warning signs:** Both buttons open Telegram with identical pre-filled text mentioning "Ripo."

### Pitfall 2: Residual "Ripo"-Only Copy in Shared UI Areas
**What goes wrong:** The success screen still says "contactar a Ripo" in the subtitle, or the helper text still says "continuar la conversación con Ripo", even though two trainers are now shown.
**Why it happens:** Four locations in the current component name Ripo explicitly. Updating only the button label misses the surrounding copy.
**How to avoid:** Audit all four locations before marking done:
1. Line ~34: `submissionMessage` — change to use "tu trainer"
2. Line ~56: `contactMessage` — replaced by `buildTrainerMessage()` call
3. Lines ~106-111: Ripo phone card — kept exactly as-is per COPY-03 (this is intentional, not a bug)
4. Lines ~113-115: Helper text — update to trainer-agnostic copy
**Warning signs:** Reading every visible word on the success screen reveals a trainer name in the subtitle or footer text outside of the buttons and the Ripo phone card.

### Pitfall 3: Phone Data Not Available at Render Time
**What goes wrong:** `result` is `null` when the component first renders (before form completion), so `result.answers.whatsapp_country_code` throws or produces undefined.
**Why it happens:** Phone extraction is computed at render time. The component uses `result` state which starts as `null`.
**How to avoid:** Use the same optional chaining pattern as `fullName`: `result?.answers?.whatsapp_country_code?.[0]?.value`. The phone variable then falls back to `'_____'` when result is null (pre-submission), which is correct since the buttons only render inside `submissionSuccess ? (...)`.
**Warning signs:** TypeScript error on `result?.answers` or runtime error when the form first loads.

### Pitfall 4: Country Code Already Has `+` Prefix
**What goes wrong:** Phone number rendered as `++54XXXXXXXXX` because code prepends `+` to a value that already starts with `+`.
**Why it happens:** `LATAM_CALLING_CODES` in `questionnaire.tsx` stores values as `"+54"`, `"+55"`, etc. (the `+` is already included). Adding another `+` in the template produces a double prefix.
**How to avoid:** Do not prepend `+` to the country code when constructing the phone string. Use `${countryCode}${phoneNumber}` directly, since `countryCode` already contains `"+54"`.
**Warning signs:** Pre-filled Telegram message shows `++54` at the start of the phone number.

### Pitfall 5: Mobile Layout with Two Full-Width Buttons
**What goes wrong:** Two large full-width buttons stack awkwardly, or the gap between them is missing, making the success card feel cramped on mobile.
**Why it happens:** The original single button had no sibling spacing concerns. Two buttons need a wrapper with `space-y-3` or `gap-3` in a flex column.
**How to avoid:** Wrap both buttons in a `<div className="space-y-3 w-full">` or use the existing `space-y-6` container and add the buttons as siblings. Verify on a 375px viewport.
**Warning signs:** Buttons appear fused together or overlap on mobile.

### Pitfall 6: Success Card Border Color Remains Emerald
**What goes wrong:** The outer card still has `border-emerald-400` even though there are now two trainers with distinct colors. This is marked "Claude's Discretion" in CONTEXT.md but worth noting.
**What goes right:** The card border is cosmetic only. Options: (a) keep emerald (no change needed, Ripo is first and it matches), (b) change to `border-slate-600` for neutrality, (c) use a gradient border. This does not affect button functionality.
**Recommendation:** Keep `border-emerald-400` unchanged — Ripo is first and the emerald matches. Changing it is polish-only and risks unnecessary visual regression.

## Code Examples

Verified patterns from direct codebase inspection:

### Current `contact.ts` (full file — shows exactly what to add alongside)
```typescript
// Source: src/utils/contact.ts (current)
const CONTACT_APP = (import.meta.env.VITE_CONTACT_APP ?? '').toLowerCase().trim()
const CONTACT_NUMBER = import.meta.env.VITE_CONTACT_NUMBER ?? ''
const TELEGRAM_USER = import.meta.env.VITE_TELEGRAM_USER ?? ''

export function getContactAppName(): string {
  return CONTACT_APP === 'telegram' ? 'Telegram' : 'WhatsApp'
}

export function getDisplayNumber(): string {
  return CONTACT_NUMBER.startsWith('+') ? CONTACT_NUMBER : `+${CONTACT_NUMBER}`
}

export function buildContactUrl(message: string): string {
  const encoded = encodeURIComponent(message)
  if (CONTACT_APP === 'telegram') {
    return `https://t.me/${TELEGRAM_USER}?text=${encoded}`
  }
  return `https://api.whatsapp.com/send?phone=${CONTACT_NUMBER}&text=${encoded}`
}

// ADD: new function below existing ones
export function buildTelegramUrl(username: string, message: string): string {
  return `https://t.me/${username}?text=${encodeURIComponent(message)}`
}
```

### Phone Extraction Pattern (matches existing `fullName` extraction in component)
```typescript
// Existing in contact-form.tsx (lines 44-54):
const firstName =
  typeof result?.answers?.name?.[0]?.value === 'string' &&
    result.answers.name[0].value.trim().length > 0
    ? result.answers.name[0].value.trim()
    : null
const lastName =
  typeof result?.answers?.lastName?.[0]?.value === 'string' &&
    result.answers.lastName[0].value.trim().length > 0
    ? result.answers.lastName[0].value.trim()
    : null
const fullName = [firstName, lastName].filter(Boolean).join(' ') || '_____'

// NEW — add immediately after fullName extraction:
const countryCode =
  typeof result?.answers?.whatsapp_country_code?.[0]?.value === 'string'
    ? result.answers.whatsapp_country_code[0].value.trim()
    : ''
const phoneNumber =
  typeof result?.answers?.whatsapp_number?.[0]?.value === 'string'
    ? result.answers.whatsapp_number[0].value.trim()
    : ''
// countryCode already has '+' prefix (e.g. "+54"), so no prepend needed
const phone = countryCode && phoneNumber ? `${countryCode}${phoneNumber}` : '_____'
```

### Updated `submissionMessage` (COPY-01)
```typescript
// Current (line ~34):
setSubmissionMessage(
  `¡Todo listo! El siguiente paso es contactar a Ripo por ${getContactAppName()} y empezar tu transformación.`,
)

// Updated (generic — COPY-01):
setSubmissionMessage(
  `¡Todo listo! El siguiente paso es contactar a tu trainer por Telegram y empezar tu transformación.`,
)
```

Note: `getContactAppName()` can be dropped since both trainers always use Telegram (per requirements — this is a Telegram-only feature).

### Message Template and Button Rendering (full success-state replacement)
```typescript
// Module-level constants (above ContactForm function):
const TRAINERS = [
  {
    name: 'Ripo',
    username: import.meta.env.VITE_TELEGRAM_USER as string,
    label: 'Contactar a Ripo por Telegram',
    colorClass: 'bg-emerald-400/90 hover:bg-emerald-300 shadow-emerald-500/40',
  },
  {
    name: 'Azul',
    username: 'azulfantino',
    label: 'Contactar a Azul por Telegram',
    colorClass: 'bg-sky-400/90 hover:bg-sky-300 shadow-sky-500/40',
  },
] as const

function buildTrainerMessage(trainerName: string, fullName: string, phone: string): string {
  return `Hola ${trainerName}, ya me inscribi en tu pagina web. Mi nombre es ${fullName}, mi telefono es ${phone}. ¿Como seguimos?`
}

// In success state JSX (replace single <a> block at lines 94-105):
{TRAINERS.map((trainer) => (
  <a
    key={trainer.username}
    href={buildTelegramUrl(trainer.username, buildTrainerMessage(trainer.name, fullName, phone))}
    target="_blank"
    rel="noopener noreferrer"
    className={`group/cta flex w-full flex-col items-center justify-center gap-1 rounded-2xl ${trainer.colorClass} px-8 py-4 text-lg font-black uppercase tracking-wide text-slate-900 shadow-lg hover:shadow-xl transition md:flex-row`}
  >
    <span role="img" aria-hidden="true" className="group-hover/cta:-translate-x-1 transition-transform duration-300">
      <MessageCircle className="w-6 h-6" />
    </span>
    {trainer.label}
    <span aria-hidden="true" className="group-hover/cta:translate-x-2 transition-transform duration-300">
      <ArrowRight className="w-6 h-6" />
    </span>
  </a>
))}
```

### Helper Text Update (COPY-02)
```typescript
// Current (lines 113-115):
<p className="text-sm text-slate-400">
  Hacé clic en el botón verde para abrir {getContactAppName()} y continuar la conversación con Ripo.
</p>

// Updated (trainer-agnostic — COPY-02):
<p className="text-sm text-slate-400">
  Hacé clic en el botón de tu trainer para abrir Telegram y empezar.
</p>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single hardcoded trainer in contact message | Per-trainer message via template function | This phase | Messages correctly address each trainer |
| Single `buildContactUrl()` reading env vars | `buildTelegramUrl(username, message)` accepting explicit params | This phase | Second button works without env var changes |
| Generic "Abrir Telegram ahora" button label | Trainer-specific "Contactar a {Ripo/Azul} por Telegram" | This phase | Users know which button contacts which trainer |

**No deprecated/outdated patterns** — the existing code is simple and idiomatic; this phase extends it cleanly.

## Open Questions

1. **Button spacing between Ripo and Azul**
   - What we know: Locked decision is "stacked vertically, full width" — same as current single button layout
   - What's unclear: Whether `space-y-6` (current container gap) is correct between buttons, or a tighter `space-y-3` is better
   - Recommendation: Use `space-y-3` between the two buttons specifically (wrap them in a `<div className="flex flex-col w-full space-y-3">`); the outer `space-y-6` container handles spacing between the button group and the phone card

2. **`getContactAppName()` usage in `submissionMessage`**
   - What we know: Currently used as `${getContactAppName()}` in the success message; both trainers are Telegram-only
   - What's unclear: Whether to keep the dynamic call or hardcode "Telegram"
   - Recommendation: Hardcode "Telegram" in the updated success message — this phase is explicitly Telegram-only, and simplifying the string removes unnecessary indirection

3. **TypeScript type for TRAINERS array**
   - What we know: `as const` makes it a readonly tuple; `.map()` works on readonly arrays
   - What's unclear: Whether TypeScript will infer the element type from `as const` correctly for `trainer.colorClass` template usage
   - Recommendation: `as const` is sufficient. If TypeScript complains about `colorClass` being `readonly`, the type assertion is `typeof TRAINERS[number]`

## Validation Architecture

> Skipped — no `.planning/config.json` found in this project. No test framework is configured (no vitest.config.*, jest.config.*, or test files detected anywhere in the codebase). All validation for this phase is manual.

**Manual validation checklist (replaces automated tests):**

| Req ID | Behavior | Validation Method |
|--------|----------|-------------------|
| BTN-01 | Azul button always visible on success screen | Visual check — both buttons appear after form submission |
| BTN-02 | Button labels show trainer names | Read button text: "Contactar a Ripo por Telegram" / "Contactar a Azul por Telegram" |
| BTN-03 | Each button pre-fills correct trainer name in message | Click each button; read pre-filled Telegram message — check "Hola Ripo" vs "Hola Azul" |
| BTN-04 | Ripo emerald, Azul sky/blue | Visual check — distinct colors |
| MSG-01 | Single template location | Code review — one `buildTrainerMessage()` function |
| MSG-02 | Message contains fullName and phone | Submit form with known name+phone; click button; verify Telegram message contains them |
| MSG-03 | "Hola {trainer}, ya me inscribi en tu pagina web. Mi nombre es {fullName}, mi telefono es {phone}. ¿Como seguimos?" | Click each button; read full message text |
| COPY-01 | Success subtitle says "tu trainer" not "Ripo" | Read subtitle text on success screen |
| COPY-02 | Helper text is trainer-agnostic | Read footer text below phone card |
| COPY-03 | Ripo phone card unchanged and below buttons | Visual check — "El numero de Ripo es:" card present, below buttons |

## Sources

### Primary (HIGH confidence)
- `src/utils/contact.ts` — current URL builder; full file read directly; shows exact place to add `buildTelegramUrl()`
- `src/components/contact-form.tsx` — current success screen; full file read directly; all line number references verified
- `src/services/questionnaire-mapper.ts` — shows how `whatsapp_country_code` and `whatsapp_number` are extracted; confirms field key names
- `src/data/questionnaire.tsx` — confirms `LATAM_CALLING_CODES` values include `+` prefix (e.g. `"+54"`)
- `src/types/questionnaire.ts` — confirms `QuestionnaireResult.answers` shape: `Record<string, QuestionnaireResultAnswer[]>`
- `package.json` — confirms React ^19.2.0, TypeScript ~5.9.3, Tailwind ^4.1.17, lucide-react ^0.553.0
- `.planning/research/ARCHITECTURE.md` — prior architecture research (2026-03-02); findings confirmed by direct code inspection
- `.planning/research/STACK.md` — prior stack research (2026-03-02); findings confirmed
- `.planning/research/PITFALLS.md` — prior pitfalls research (2026-03-02); all pitfalls verified against current code
- `.planning/phases/01-dual-telegram-cta/01-CONTEXT.md` — locked decisions that constrain this phase

### Secondary (MEDIUM confidence)
- None needed — all findings are from direct codebase inspection

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all technologies read from package.json and used directly in existing code
- Architecture: HIGH — both files read in full; change surface is small, well-understood, and matches existing patterns
- Pitfalls: HIGH — derived from direct code inspection of all four "Ripo" copy locations and phone field data structure
- Phone extraction pattern: HIGH — questionnaire-mapper.ts shows exact same extraction pattern; LATAM_CALLING_CODES confirms `+` prefix format

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (stable codebase — no external API dependencies, no fast-moving libraries)
