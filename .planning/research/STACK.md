# Technology Stack: Second Telegram CTA Button

**Project:** rippo-web (segundo boton Telegram)
**Researched:** 2026-03-02

## Recommended Approach

This is NOT a technology/library decision. The existing stack (React + Vite + Tailwind + lucide-react) already has everything needed. The decision is about **implementation pattern**: how to add a second Telegram CTA button with minimal, safe changes to a temporary app.

### Approach: Inline Trainer Config Array + Duplicated Button

| Decision | Choice | Why | Confidence |
|----------|--------|-----|------------|
| Trainer data source | Hardcoded array in `contact-form.tsx` | App is temporary; env var abstraction adds deploy complexity (new GitHub secret, workflow update) for zero future benefit. Hardcoding `azulfantino` next to the existing Ripo button is the fastest, most reviewable patch. | HIGH |
| Contact URL builder | Add `buildContactUrlFor(username, message)` to `contact.ts` | Current `buildContactUrl` reads module-level `TELEGRAM_USER`. A new function that accepts username as param lets both buttons use the same URL logic without breaking the existing function signature. | HIGH |
| Button rendering | Map over a 2-element trainer config array | Avoids copy-pasting the entire button JSX. A simple `trainers.map()` with name/username/message keeps the diff small and the two buttons visually consistent. | HIGH |
| Env vars | Keep existing `VITE_TELEGRAM_USER` for Ripo; do NOT add `VITE_TELEGRAM_USER_2` | Adding a second env var means updating `.env`, `.env.example`, `deploy-pages.yml`, and GitHub repo secrets. Four files changed for a hardcoded username on a temporary app is waste. | HIGH |
| Success message text | Change from Ripo-specific to generic | Current message says "contactar a Ripo". With two trainers, change to "contactar a tu trainer" or similar neutral phrasing. | HIGH |
| Display number section | Remove or make per-trainer | Current "El numero de Ripo es:" section shows a phone number. Either duplicate per trainer or remove since Telegram usernames are the actual contact method, not phone numbers. | MEDIUM |

## Implementation Blueprint

### 1. New function in `contact.ts`

```typescript
export function buildContactUrlFor(telegramUser: string, message: string): string {
  const encoded = encodeURIComponent(message)
  return `https://t.me/${telegramUser}?text=${encoded}`
}
```

Keep the existing `buildContactUrl` working (no breaking change), but the new component code uses `buildContactUrlFor`.

### 2. Trainer config in `contact-form.tsx`

```typescript
const TRAINERS = [
  { name: 'Ripo', username: 'joa_ripo', greeting: 'Ripo' },
  { name: 'Azul', username: 'azulfantino', greeting: 'Azul' },
] as const
```

Defined at module level in the component file. Not in a separate config file (overkill for a temp app).

### 3. Button rendering via map

```typescript
{TRAINERS.map((trainer) => {
  const msg = `${trainer.greeting}, ya me inscribi en tu pagina web. Mi nombre es ${fullName}. Como seguimos?`
  return (
    <a
      key={trainer.username}
      href={buildContactUrlFor(trainer.username, msg)}
      target="_blank"
      rel="noopener noreferrer"
      className="..."
    >
      Contactar a {trainer.name}
    </a>
  )
})}
```

### 4. No workflow/env changes needed

Zero changes to `.github/workflows/deploy-pages.yml`, `.env`, or GitHub repo secrets.

## What NOT To Do

| Anti-Pattern | Why Not |
|-------------|---------|
| Add `VITE_TELEGRAM_USER_2` env var | Touches 4 files (`.env`, `.env.example`, workflow YAML, GitHub secrets). Deploy pipeline change for a hardcoded value on a temp app is unnecessary risk and friction. |
| Create a `trainers.ts` config module | Over-engineering for 2 static entries on a temp app. The config lives in the component where it is used. |
| Refactor `contact.ts` to be multi-trainer aware at module level | Breaking change to existing code. The current `buildContactUrl` works; adding a parameterized sibling function is safer. |
| Dynamic trainer selection during the form | PROJECT.md explicitly marks this out of scope: "ambos botones siempre visibles". |
| Abstract a `TrainerButton` component | Temp app, 2 buttons. A `.map()` over an array is sufficient. A new component file adds navigation overhead for reviewers with no reuse upside. |

## Files That Change

| File | Change | Size |
|------|--------|------|
| `src/utils/contact.ts` | Add `buildContactUrlFor(username, message)` | ~4 lines |
| `src/components/contact-form.tsx` | Trainer array + `.map()` rendering for 2 buttons, update success message text | ~30 lines net |
| `.env.example` | No change needed | 0 |
| `.github/workflows/deploy-pages.yml` | No change needed | 0 |

## Existing Stack (No Changes)

The current stack handles this feature without additions:

| Technology | Role | Already Present |
|------------|------|-----------------|
| React 18+ | Component rendering | Yes |
| Vite | Build tooling | Yes |
| Tailwind CSS | Button styling | Yes |
| lucide-react | Icons (MessageCircle, ArrowRight) | Yes |
| TypeScript | Type safety | Yes |

**No new dependencies needed.** Zero `npm install` commands.

## Deploy Considerations

| Concern | Status | Action |
|---------|--------|--------|
| GitHub Secrets | No new secrets needed | None |
| Workflow file | No changes needed | None |
| Build cache | Standard Vite rebuild | Merge to main triggers deploy |
| Rollback | Standard git revert | Single commit to revert |

## Sources

- `src/utils/contact.ts` -- current URL builder implementation (read directly)
- `src/components/contact-form.tsx` -- current CTA button rendering (read directly)
- `.env` / `.env.example` -- current env var structure (read directly)
- `.github/workflows/deploy-pages.yml` -- deploy pipeline (read directly)
- `.planning/PROJECT.md` -- project constraints and scope (read directly)

All findings are HIGH confidence based on direct codebase inspection. No external research was needed -- this is a UI pattern change within an existing, well-understood codebase.
