# The Augustin Files

## What This Is

A pixel-art 2D platformer that transforms Augustin Romaneschi's career journey into a playable video game. Instead of a traditional CV, recruiters play through 3 levels representing career chapters — from Shanghai startup weekend to $1M ARR in Latin America to the final interview room. Built with Phaser 4 and designed to be sent as a link to hiring managers.

## Core Value

The game must be fun enough to play through to the end AND tell a compelling career story — if either fails, the game fails as a job application tool.

## Requirements

### Validated

- ✓ Phaser 4 game engine setup with Vite build tool — existing
- ✓ Scene-based architecture (Boot → Title → Game) — existing
- ✓ Arcade physics system configured — existing
- ✓ Responsive scaling with pixel-art rendering — existing
- ✓ Basic project structure (src/scenes, src/sprites, src/systems, src/config) — existing

### Active

- [ ] Celeste-quality player controller (double jump, coyote time, variable jump height)
- [ ] Level 1: Shanghai Awakening (collectibles, enemies, boss fight)
- [ ] Level 2: Latin America, Zero to $1M (language mechanic, flag collectibles, boss)
- [ ] Level 5: Interview Room (dialogue tree, stats recap, CTAs)
- [ ] Stats system (Sales, Tech, Grit, EQ, Languages, Independence, TeamPlayer)
- [ ] Inventory / power-up system (Clay, n8n, Instantly, SmartLead, Claude Code)
- [ ] HUD overlay (health, coins, XP, inventory slots, stats screen)
- [ ] Sprite system with animations (idle, run, jump, fall)
- [ ] Camera follow with parallax backgrounds
- [ ] Audio system (music per level, SFX for actions)
- [ ] Main menu with Play / Continue / Chapter Select
- [ ] Damage / health / death / respawn system
- [ ] Scene transitions with polish (fades, screen shake, particles)
- [ ] URL params for per-company customization (?company=, ?name=, ?role=)
- [ ] Deploy to Vercel with custom domain

### Out of Scope

- Level 3: Greenland (hidden level) — deferred to v2
- Level 4: Agency Factory — deferred to v2
- Mobile touch controls — deferred to v2
- Analytics (Plausible) — deferred to v2
- Share button / social cards — deferred to v2
- Voice lines (ElevenLabs) — deferred to v2
- Credits sequence — deferred to v2
- Tiled map editor integration — will use programmatic level generation for MVP

## Context

- **Who**: Augustin Romaneschi, Swiss-based GTM/BDM professional targeting European startup roles
- **Purpose**: Creative job application — send `theaugustinfiles.com` instead of a CV PDF
- **Target audience**: Hiring managers and recruiters at European tech startups
- **Inspiration**: Career platformer concept where each level = a career chapter with its own mechanics
- **Assets**: None ready yet — will use colored rectangle placeholders until sprite sheets, backgrounds, and music are generated (Midjourney, Suno AI, pixelatorapp.com)
- **Existing code**: Phaser 4 scaffolding with Boot/Title/Game scenes, no gameplay yet. GameScene has static green rectangle with no controls.

## Constraints

- **Tech stack**: Phaser 4 + Vite + vanilla JavaScript (ES modules) — already committed
- **No backend**: Pure client-side game, no server needed
- **Assets**: Placeholder-first — all gameplay must work with colored rectangles before real art is swapped in
- **Performance**: Must run smoothly on any modern browser (WebGL with Canvas fallback)
- **Quality**: Gameplay feel matters — movement should feel like Celeste/Mario, not a student project

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Phaser 4 over Phaser 3 | Latest version, already installed | — Pending |
| Programmatic levels over Tiled | Simpler toolchain, faster iteration | — Pending |
| 3 levels for MVP (Shanghai, LatAm, Interview) | Career arc: origin → achievement → CTA | — Pending |
| Placeholder-first art pipeline | Unblocks all gameplay coding before assets exist | — Pending |
| Vercel deployment | Free tier, custom domain, easy CI | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-13 after initialization*
