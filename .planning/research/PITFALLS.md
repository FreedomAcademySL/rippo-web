# Pitfalls Research

**Domain:** Fitness form — multi-trainer Telegram CTA buttons
**Researched:** 2026-03-02
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Hardcoded trainer name in contact message

**What goes wrong:**
The current `contactMessage` (line 56 of contact-form.tsx) says "Ripo, ya me inscribí en tu página web...". If this same message is sent to Azul, it still says "Ripo" — confusing for the trainer receiving it.

**Why it happens:**
The message was written for a single trainer and is easy to overlook when adding a second button.

**How to avoid:**
Each button must generate its own contact message with the correct trainer name.

**Warning signs:**
Both buttons open Telegram with identical pre-filled text mentioning "Ripo".

**Phase to address:**
Phase 1 (implementation)

---

### Pitfall 2: Hardcoded "Ripo" references in UI text

**What goes wrong:**
Lines 34, 109, and 113 of contact-form.tsx have hardcoded "Ripo" text. The success message says "contactar a Ripo", the number label says "El numero de Ripo es:", and the footer says "continuar la conversación con Ripo." These become misleading when there are two trainers.

**Why it happens:**
Single-trainer assumption baked into UI copy.

**How to avoid:**
Update the surrounding copy to be trainer-agnostic or mention both trainers. E.g., "El siguiente paso es contactar a tu trainer" instead of "contactar a Ripo".

**Warning signs:**
UI text references only one trainer while showing two buttons.

**Phase to address:**
Phase 1 (implementation)

---

### Pitfall 3: Phone number display assumes single trainer

**What goes wrong:**
Lines 106-111 show "El numero de Ripo es: +549..." — only one number. With two trainers, this section either needs two numbers or should be removed/generalized.

**Why it happens:**
The phone number display was designed for one trainer with one contact method.

**How to avoid:**
Either show both trainer numbers or remove the explicit number display since the buttons handle contact directly.

**Warning signs:**
Only Ripo's number displayed even though Azul is also an option.

**Phase to address:**
Phase 1 (implementation)

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode trainer data in component | No deploy pipeline changes | Must edit code to add/remove trainers | Always — app is temporary |
| Skip env var for second trainer | Avoid touching .env, .env.example, workflow YAML, GitHub secrets | Less configurable | Always — app is temporary |
| Duplicate button JSX vs .map() | Simpler diff | Slightly more code to maintain | Either is fine for 2 trainers |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Buttons look identical | User doesn't know which trainer they're contacting | Clear trainer name on each button |
| No visual distinction between buttons | Confusion about which to click | Different colors or clear labels |
| Overwhelming with two big CTAs | Decision paralysis | Stack vertically with clear labels, keep same style |

## "Looks Done But Isn't" Checklist

- [ ] **Contact message:** Each button sends message with correct trainer name (not both saying "Ripo")
- [ ] **UI copy:** Success text doesn't reference only "Ripo" when two trainers exist
- [ ] **Phone number:** Either shows both numbers or is generalized
- [ ] **Mobile layout:** Two buttons stack properly on small screens

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Wrong trainer in message | Phase 1 | Click each button, verify pre-filled text |
| Hardcoded "Ripo" in UI copy | Phase 1 | Read all visible text on success screen |
| Single phone number display | Phase 1 | Visual check of success screen |
| Mobile layout | Phase 1 | Resize browser or test on phone |

---
*Pitfalls research for: fitness form multi-trainer Telegram CTA*
*Researched: 2026-03-02*
