# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Segundo Boton Telegram

**Shipped:** 2026-03-03
**Phases:** 1 | **Plans:** 1 | **Sessions:** 1

### What Was Built
- Dual stacked trainer CTA buttons (Ripo emerald, Azul sky) on success screen
- `buildTelegramUrl()` utility with parameterized Telegram deep links
- Centralized message template with trainer name, user full name, and phone
- Trainer-agnostic UI copy ("tu trainer" instead of "Ripo")

### What Worked
- Single-phase milestone kept scope tight and delivered in one session
- TRAINERS array pattern made adding new trainers trivial (additive, no modification)
- Hardcoding config for a temporary app avoided unnecessary env/infra complexity
- UAT passed 5/5 on first attempt — plan quality was high

### What Was Inefficient
- Nothing notable — scope was minimal and well-defined

### Patterns Established
- TRAINERS const array as single source of truth for trainer config (name, username, label, colorClass)
- `buildTrainerMessage()` for centralized, parameterized message templates
- Phone extraction from whatsapp_country_code + whatsapp_number answer keys

### Key Lessons
1. For temporary apps, hardcoding config is the right call — skip env vars, config modules, and dynamic fetching
2. Additive changes (new exports, new array entries) are safer than modifying existing code

### Cost Observations
- Model mix: 100% opus (single session)
- Sessions: 1
- Notable: Entire milestone (research + plan + execute + UAT + complete) in one sitting

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 1 | 1 | First milestone — baseline established |

### Cumulative Quality

| Milestone | UAT Tests | Pass Rate | Issues |
|-----------|-----------|-----------|--------|
| v1.0 | 5 | 100% | 0 |

### Top Lessons (Verified Across Milestones)

1. (Pending — need multiple milestones to cross-validate)
