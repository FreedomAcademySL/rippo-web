# Roadmap: Rippo Web - Segundo Boton Telegram

## Overview

Add a second Telegram CTA button for trainer Azul alongside the existing Ripo button on the post-submission success screen. Both buttons are always visible, each with the correct trainer name, unique pre-filled message, and distinct color. All "Ripo"-specific copy is updated to be trainer-agnostic. The entire change is confined to two files (`contact.ts` and `contact-form.tsx`) with no backend, env, or pipeline changes.

## Phases

- [ ] **Phase 1: Dual Telegram CTA** - Add second trainer button, parameterized messages, and updated UI copy

## Phase Details

### Phase 1: Dual Telegram CTA
**Goal**: Users see two distinct trainer buttons on the success screen and can contact either trainer with a correctly personalized Telegram message
**Depends on**: Nothing (first phase)
**Requirements**: BTN-01, BTN-02, BTN-03, BTN-04, MSG-01, MSG-02, MSG-03, COPY-01, COPY-02, COPY-03
**Success Criteria** (what must be TRUE):
  1. User sees two Telegram buttons on the success screen -- one for Ripo (emerald) and one for Azul (sky/blue) -- both always visible
  2. Clicking Ripo's button opens Telegram to Ripo's chat with a pre-filled message addressing "Ripo" by name, including the user's full name and phone number
  3. Clicking Azul's button opens Telegram to Azul's chat (`t.me/azulfantino`) with a pre-filled message addressing "Azul" by name, including the user's full name and phone number
  4. All visible text on the success screen refers to trainers generically ("tu trainer") or mentions both -- no leftover "Ripo"-only copy except on Ripo's own button and the existing phone card
**Plans**: 1 plan

Plans:
- [ ] 01-01-PLAN.md — Add buildTelegramUrl utility, dual trainer buttons, phone extraction, centralized message template, and updated UI copy

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Dual Telegram CTA | 0/1 | Not started | - |
