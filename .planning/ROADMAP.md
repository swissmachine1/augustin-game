# Roadmap: The Augustin Files v2.0

## Archived Milestones

- **v1.0** (shipped 2026-04-13) — Phaser 4 career platformer with Level 1 Shanghai Awakening, RPG systems, HUD, and juice pass. See `.planning/milestones/v1.0-ROADMAP.md`. **Status:** Complete but pivoted — platformer format deprecated.

## Current Milestone: v2.0

Eight phases that pivot from the v1.0 platformer to a Lumosity-style anthology of 5 distinct mini-games. Phase 1 cleans up v1 debris and extends the inherited infrastructure. Phase 2 builds the opening cinematic, name personalization, level-select hub, and scoring framework — the spine of the experience. Phases 3-7 each deliver one complete mini-game with its own visual identity and skill payoff. Phase 8 ships to Vercel.

Mini-game phases (3-7) are architecturally independent and could run in parallel, but execute sequentially here.

v1 infrastructure kept: BootScene, TitleScene, HUDScene, GameRegistry, StatsManager, GameConfig.
v1 platformer code removed: Level1Scene, Player, Enemy, Boss, Coin, Book, level1Data.

## Phases

Phase numbering: integer phases (1-8) are planned milestone work. Decimal phases (e.g. 2.1) are urgent insertions via `/gsd:insert-phase`.

- [ ] **Phase 1: Infrastructure Cleanup** - Remove v1 platformer, extend Registry/TitleScene, scaffold LevelSelectHub
- [ ] **Phase 2: Opening & Hub Foundation** - Opening cinematic, name personalization, hub UX, scoring framework
- [ ] **Phase 3: Level 1 — Shanghai** - Day-in-the-life pivot vignette, pixel-art identity, Curiosity stat
- [ ] **Phase 4: Level 2 — Latin America** - Network builder click mechanic, compound growth, Sales/EQ/Grit stats
- [ ] **Phase 5: Level 3 — Greenland** - Storm survival dodge mechanic, warmth bar, Grit/Independence stats
- [ ] **Phase 6: Level 4 — Agency Factory** - n8n node routing + debug puzzle, terminal-green identity, Tech stat
- [ ] **Phase 7: Level 5 — Interview Room** - Stat-gated Q&A, recruiter report card, soft CTAs
- [ ] **Phase 8: Deployment** - Vercel deploy, custom domain, cross-browser verification

## Phase Details

### Phase 1: Infrastructure Cleanup

Goal: The codebase is v2-ready — v1 platformer files removed, TitleScene accepts name input, GameRegistry carries player name and score keys, LevelSelectHub scene exists as a skeleton

Depends on: Nothing (v1 shipped, this is the reset)

Requirements: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, SCORE-04

Success Criteria (what must be TRUE):

1. The src/ directory contains no v1 platformer files (Level1Scene, Player, Enemy, Boss, Coin, Book, level1Data) — build still passes
2. TitleScene renders an optional name input field below "PRESS SPACE TO START" and writes the value (or "friend") to GameRegistry
3. GameRegistry exports PLAYER_NAME and per-level score keys alongside existing v1 keys
4. LevelSelectHub.js exists as a registered Phaser scene that can be launched without errors (placeholder content acceptable)
5. Stats persist across browser sessions — refreshing the page restores the same stat values from localStorage

**Plans:** 2 plans

Plans:
- [ ] 01-01-PLAN.md — Delete v1 platformer files, clean GameConfig, extend GameRegistry with PLAYER_NAME + SCORE_L1..L5
- [ ] 01-02-PLAN.md — Extend TitleScene with name input + URL param, create LevelSelectHub placeholder, wire GameConfig

### Phase 2: Opening & Hub Foundation

Goal: A recruiter opens the game, optionally enters their name, watches a gritty opening cinematic, and lands in the level-select hub where all 5 levels are clickable tiles

Depends on: Phase 1

Requirements: OPEN-01, OPEN-02, OPEN-03, OPEN-04, OPEN-05, HUB-01, HUB-02, HUB-03, HUB-04, SCORE-01, SCORE-02, SCORE-03

Success Criteria (what must be TRUE):

1. Visiting the game with `?name=Camille` pre-fills the name input; submitting blank defaults to "friend"; the name appears in the opening cinematic text
2. The opening cinematic plays sequential gritty text reveals ("2014. 20 years old. Don't speak the language...") personalized with the player's name
3. After the cinematic, 5 level tiles appear in order: Shanghai, LatAm, Greenland, Agency, Interview — unplayed levels show silhouettes with cryptic teasers
4. Clicking any level tile triggers a fade transition into that level's scene
5. After completing and returning from a level, the hub shows the level's score percentage and a replay option
6. Score system is wired: each mini-game returns a 0-100% score that converts to stat points, and replaying only keeps the higher score

Plans: TBD

UI hint: yes

### Phase 3: Level 1 — Shanghai

Goal: The recruiter experiences the Shanghai career-pivot moment through an interactive 3-beat vignette — makes small choices, reaches the aha moment, earns the Curiosity stat

Depends on: Phase 2

Requirements: LVL1-01, LVL1-02, LVL1-03, LVL1-04, LVL1-05

Success Criteria (what must be TRUE):

1. The level presents 3 distinct beats (morning law class → afternoon startup weekend → evening decision) with click-to-advance or dialogue choices in each
2. The final beat reveals the pivot moment and the screen locks in — the player cannot miss it
3. The pixel-art Shanghai visual identity is applied: neon tones, night skyline atmosphere
4. Completing the level writes a Curiosity stat gain (0-100% range based on choices made)
5. After the level ends, a vignette loads: "A year later, Switzerland gets boring..." with a Continue prompt and 8-second auto-advance before returning to the hub

Plans: TBD

UI hint: yes

### Phase 4: Level 2 — Latin America

Goal: The recruiter feels the KOL network-building strategy by clicking doctors on a LatAm map, watching compound growth cascade across 11 countries until the $1M ARR ticker hits

Depends on: Phase 2

Requirements: LVL2-01, LVL2-02, LVL2-03, LVL2-04, LVL2-05, LVL2-06, LVL2-07, LVL2-08

Success Criteria (what must be TRUE):

1. A LatAm map appears with 0 doctors trained; the player clicks doctors to train them and each trained doctor visibly connects to 3-5 more
2. Influential doctors (visually distinct from regular ones) unlock an entire country when trained — the map lights up country by country
3. The compound growth is visible on screen — the network clearly accelerates as more doctors are trained
4. The level ends when all 11 countries are lit and the $1M ARR ticker reaches its target
5. The warm vector visual identity is applied: earth tones, map-based aesthetic
6. After completion a vignette loads before returning to the hub

Plans: TBD

UI hint: yes

### Phase 5: Level 3 — Greenland

Goal: The recruiter endures the storm — dodging wind gusts, managing the warmth bar, reaching the final checkpoint — and feels the grit and independence the Greenland chapter represents

Depends on: Phase 2

Requirements: LVL3-01, LVL3-02, LVL3-03, LVL3-04, LVL3-05, LVL3-06, LVL3-07

Success Criteria (what must be TRUE):

1. A character stands on ice with visible storm effects (wind particles, reduced visibility vignette around the edges)
2. Wind gusts appear and push the player off the path — the player must dodge to stay on course
3. A warmth bar is visible and depletes over time; reaching a checkpoint refills it
4. Reaching the final checkpoint completes the level and awards Grit and Independence stats
5. The white/blue aurora borealis visual identity is applied throughout
6. After completion a vignette loads before returning to the hub

Plans: TBD

UI hint: yes

### Phase 6: Level 4 — Agency Factory

Goal: The recruiter debugs and builds an n8n-style workflow — wiring nodes in Stage 1, then identifying and fixing a deliberately broken version in Stage 2 — and earns the Tech stat

Depends on: Phase 2

Requirements: LVL4-01, LVL4-02, LVL4-03, LVL4-04, LVL4-05, LVL4-06, LVL4-07

Success Criteria (what must be TRUE):

1. Stage 1 presents a node-routing puzzle (lead input → enrichment → output); the level advances only when all nodes are correctly wired
2. Stage 2 loads a broken version of the campaign; the player identifies the bug by selecting from a set of options
3. Fixing the bug completes Stage 2 and the level
4. The terminal-green visual identity is applied: dark background, glowing green connections
5. Score is calculated from nodes used (fewer = higher) plus debug speed; the Tech stat is awarded
6. After completion a vignette loads before returning to the hub

Plans: TBD

UI hint: yes

### Phase 7: Level 5 — Interview Room

Goal: The recruiter faces rapid-fire interview questions answered via stat-gated dialogue options, receives a recruiter report card of all stats earned, and sees soft CTAs to book a call

Depends on: Phases 3, 4, 5, 6 (needs real stats from prior levels to gate responses)

Requirements: LVL5-01, LVL5-02, LVL5-03, LVL5-04, LVL5-05, LVL5-06, LVL5-07, LVL5-08, VIGN-01, VIGN-02, VIGN-03

Success Criteria (what must be TRUE):

1. 5 rapid-fire questions appear from a hiring manager NPC in a clean office scene; the hiring manager uses the player's name throughout
2. Each question shows 3-4 response options; high-stat players unlock the best responses while low-stat players still receive a complete (less nuanced) answer
3. After the Q&A, a "RECRUITER REPORT CARD" screen shows all stats earned across all levels
4. The final screen displays three soft CTAs: "Book a call" (Calendly link), "LinkedIn", "Download CV" — tone is respectful, no urgency pressure
5. Inter-level vignettes throughout the full game correctly reference the player's name and set up the next chapter with a Continue prompt or 8-second auto-advance

Plans: TBD

UI hint: yes

### Phase 8: Deployment

Goal: The game is live at a public URL, loads without errors in Chrome and Safari, and is ready to be sent to hiring managers

Depends on: Phase 7

Requirements: DEPLOY-01, DEPLOY-02, DEPLOY-03

Success Criteria (what must be TRUE):

1. The game is accessible at theaugustinfiles.com (or staging URL) via HTTPS
2. `npm run build` completes with no errors and the dist/ output is the deployed artifact
3. The full game plays through from title to final CTA without console errors in both Chrome and Safari on desktop

Plans: TBD

## Progress

Execution order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. Mini-game phases (3-6) are architecturally independent but execute sequentially.

| Phase | Plans Complete | Status | Completed |
| --- | --- | --- | --- |
| 1. Infrastructure Cleanup | 0/2 | Not started | - |
| 2. Opening & Hub Foundation | 0/? | Not started | - |
| 3. Level 1 — Shanghai | 0/? | Not started | - |
| 4. Level 2 — Latin America | 0/? | Not started | - |
| 5. Level 3 — Greenland | 0/? | Not started | - |
| 6. Level 4 — Agency Factory | 0/? | Not started | - |
| 7. Level 5 — Interview Room | 0/? | Not started | - |
| 8. Deployment | 0/? | Not started | - |
