# Requirements: Rippo Web — Segundo Botón Telegram

**Defined:** 2026-03-02
**Core Value:** Los usuarios pueden contactar a su trainer por Telegram inmediatamente después de completar el formulario.

## v1 Requirements

### Telegram Buttons

- [x] **BTN-01**: Segundo botón de Telegram para Azul (t.me/azulfantino), siempre visible junto al de Ripo
- [x] **BTN-02**: Cada botón muestra nombre de trainer ("Contactar a Ripo" / "Contactar a Azul")
- [x] **BTN-03**: Cada botón envía mensaje pre-armado con nombre correcto del trainer (no "Ripo" en el de Azul)
- [x] **BTN-04**: Botones con colores distintos (emerald para Ripo, sky/blue para Azul)

### Message Template

- [x] **MSG-01**: Template de mensaje centralizado en un solo lugar, fácil de modificar
- [x] **MSG-02**: Template usa nombre del trainer (hardcoded por botón) + datos del formulario (fullName de name+lastName, phone de whatsapp_country_code+whatsapp_number)
- [x] **MSG-03**: Formato provisional: "Hola {trainer}, soy {fullName}, mi teléfono es {phone}, estoy listo para empezar" (el cliente definirá el texto final después)

### UI Copy

- [x] **COPY-01**: Texto de éxito genérico — no "contactar a Ripo" sino "contactar a tu trainer" o mencionar ambas
- [x] **COPY-02**: Texto helper actualizado para reflejar dos trainers
- [x] **COPY-03**: Card de número de Ripo se mantiene tal cual está

## v2 Requirements

Ninguno — app temporal que migrará a otra app.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Selección de trainer en el formulario | Ambos botones siempre visibles, sin selección |
| Config dinámica de trainers desde backend | App temporal, hardcode aceptable |
| Analytics de clicks por botón | No pedido, app temporal |
| Env var para segundo trainer | Hardcode evita tocar .env, .env.example, workflow YAML, GitHub secrets |
| Card de número de Azul | Solo se mantiene el de Ripo |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BTN-01 | Phase 1 | Complete |
| BTN-02 | Phase 1 | Complete |
| BTN-03 | Phase 1 | Complete |
| BTN-04 | Phase 1 | Complete |
| MSG-01 | Phase 1 | Complete |
| MSG-02 | Phase 1 | Complete |
| MSG-03 | Phase 1 | Complete |
| COPY-01 | Phase 1 | Complete |
| COPY-02 | Phase 1 | Complete |
| COPY-03 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-02*
*Last updated: 2026-03-02 after initial definition*
