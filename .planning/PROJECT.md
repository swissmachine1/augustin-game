# The Augustin Files

## What This Is

A Lumosity-style anthology of 5 mini-games — each testing a real skill that Augustin Romaneschi built during a specific chapter of his career. Instead of reading a CV, recruiters play through 10-15 minutes of distinct mini-games (day-in-the-life pivot → network builder → storm survival → n8n debug → defend-your-CV Q&A), earn stats, and finish in an interview room with soft CTAs to book a call. Built with Phaser 4, designed to be sent as a link to hiring managers at European tech startups.

## Core Value

Every mini-game must let the recruiter *feel* the skill it represents — not just see it listed on a CV. If a level fails to communicate that skill, the game fails as a job application tool.

## Current State

**v1.0 shipped:** Phaser 4 career platformer (Level 1 Shanghai Awakening + RPG systems). Working game, but the 5-level concept felt repetitive and the platformer format didn't differentiate each career chapter. See `.planning/milestones/v1.0-ROADMAP.md`.

**v2.0 pivot:** 5 distinct mini-games matching 5 career chapters. Each level is a different game genre tied to the skill earned.

## Requirements

### Validated (v1.0 — shipped)

- ✓ Phaser 4 + Vite build pipeline — v1.0
- ✓ Scene-based architecture (Boot → Title → Game) — v1.0
- ✓ GameRegistry cross-scene state with typed constants — v1.0
- ✓ StatsManager with localStorage persistence (7 stats) — v1.0
- ✓ HUDScene reactive parallel scene — v1.0
- ✓ Celeste-quality Player controller — v1.0 (will be archived, kept only for potential easter-egg use)
- ✓ Scene shutdown cleanup patterns — v1.0
- ✓ Fade transitions between scenes — v1.0

### Active (v2.0 — building)

- [ ] Opening cinematic (gritty/personal tone, optional name input)
- [ ] Level-select hub with 5 cosmetically-locked silhouettes
- [ ] Level 1: Shanghai — Day-in-the-Life Pivot (interactive vignette, law → tech aha moment)
- [ ] Level 2: Latin America — Network Builder (KOL compound growth → 11 countries, $1M ARR)
- [ ] Level 3: Greenland — Storm Survival (reactive endurance, dodge gusts, stay warm)
- [ ] Level 4: Agency Factory — n8n Routing + Debug (two-stage build → break → fix)
- [ ] Level 5: Interview Room — Defend-Your-CV Q&A (stat-gated dialogue, soft CTAs)
- [ ] Inter-level narrative vignettes (personalized with player name)
- [ ] Per-level visual identity (pixel Shanghai, warm vector LatAm, white/blue Greenland, terminal-green Agency, clean office Interview)
- [ ] Percentage-based scoring per mini-game (0-100%)
- [ ] Replay mode (any level, improve scores)
- [ ] Stats earned from mini-games gate Level 5 dialogue responses
- [ ] Name personalization (title screen input + `?name=X` URL param, fallback: "friend")
- [ ] Final CTA screen (soft: Book call, LinkedIn, Download CV)
- [ ] Deploy to Vercel

### Out of Scope (for v2.0)

- Audio / music — deferred to v2.1 (ship visuals first)
- Voice lines (ElevenLabs) — deferred
- Mobile touch controls — deferred
- Analytics — deferred
- Share button / social cards — deferred
- Credits sequence — deferred
- URL `?company=` customization per recruiter — deferred (name param only for v2)
- The v1.0 platformer code (Level1Scene, Player, Enemy, Boss, Coin, Book, level1Data) — removed

## Context

- **Who**: Augustin Romaneschi, Swiss-based GTM/BDM professional targeting European startup roles
- **Purpose**: Creative job application — send `theaugustinfiles.com` instead of a CV PDF
- **Target audience**: Hiring managers at European tech startups
- **Inspiration**: Lumosity (each exercise tests one cognitive skill) + Robby Leonardi's interactive resume
- **Why the pivot**: v1.0 proved the architecture works but the platformer format made every career chapter feel identical. Recruiters want differentiation and surprise, not 5 jumping puzzles.
- **Career chapters being represented**:
  - **Shanghai (2014)**: Law student on exchange, discovered tech at a startup weekend — the *aha moment* that pivoted the whole career
  - **Latin America**: Zero Spanish, zero network, introduced a Swiss medical device, built KOL-based growth to 11 countries and $1M ARR
  - **Greenland**: Endurance expedition — pure grit / independence
  - **Agency years**: Ran a technical agency (Clay, n8n, campaigns) — systems thinking / engineering
  - **Interview Room**: Synthesis, the conversion event

## Constraints

- **Tech stack**: Phaser 4 + Vite + vanilla JavaScript — keep v1 infra (Boot/Title/HUD/Registry/Stats/GameConfig)
- **No backend**: Pure client-side, static deploy
- **Visual style**: Per-level identity (mixed styles) — no shared art budget
- **Playtime**: 10-15 minutes total, 2-3 min per mini-game. Hard cap — longer = recruiter drop-off
- **Audio**: Single evolving score (deferred to v2.1)
- **Name personalization**: Optional, fallback "friend", also supports `?name=X` URL param

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Phaser 4 over Phaser 3 | Latest stable, already committed in v1 | ✓ Good — works for mini-games too |
| Pivot from platformer to mini-game anthology | 5 same-mechanic levels = boring; differentiated mechanics = wow factor | — Pending |
| Scrap v1 platformer code but keep infrastructure | Registry/HUD/Stats are agnostic to level format | — Pending |
| Per-level visual style | Each career chapter gets distinct visual identity — amplifies the "different world" feeling | — Pending |
| Soft CTA (respectful, not pushy) | Target audience is European startup recruiters — bold/swagger tone doesn't land | — Pending |
| Name input optional, fallback "friend" | Keeps opening personal even if recruiter skips the prompt | — Pending |
| Replay allowed | Encourages return visits, higher engagement; doesn't harm first-play story | — Pending |
| Shanghai as "Day-in-the-Life Pivot" (narrative vignette) | More emotional than abstract puzzle; the aha moment needs to be *felt* | — Pending |

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
*Last updated: 2026-04-14 — v1.0 archived, pivoted to v2.0 mini-game anthology*
