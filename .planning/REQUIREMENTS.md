# Requirements: The Augustin Files v2.0

**Defined:** 2026-04-14
**Core Value:** Every mini-game must let the recruiter *feel* the skill it represents — not just see it listed on a CV.

## v2.0 Requirements

### Opening & Personalization

- [ ] **OPEN-01**: Title screen has an optional name input field below "PRESS SPACE TO START"
- [ ] **OPEN-02**: Name input is skippable — blank defaults to "friend"
- [ ] **OPEN-03**: `?name=X` URL param pre-fills the input (for personalized recruiter links)
- [ ] **OPEN-04**: Opening cinematic plays gritty/personal text reveals ("2014. 20 years old. Don't speak the language...")
- [ ] **OPEN-05**: Player name appears in opening cinematic ("Hey {name}. What you're about to play...")

### Level Select Hub

- [ ] **HUB-01**: After opening cinematic, 5 level tiles appear in sequence (Shanghai → LatAm → Greenland → Agency → Interview)
- [ ] **HUB-02**: Unreached levels show as silhouettes with cryptic teasers (cosmetic lock only, all clickable)
- [ ] **HUB-03**: Completed levels show score percentage and allow replay
- [ ] **HUB-04**: Clicking a level transitions to its scene with fade

### Inter-Level Vignettes

- [ ] **VIGN-01**: After each level, a narrative vignette loads before returning to hub
- [ ] **VIGN-02**: Vignettes reference player name and set up the next chapter
- [ ] **VIGN-03**: Vignettes have a "Continue" prompt and auto-advance after 8 seconds

### Level 1 — Shanghai: Day-in-the-Life Pivot

- [ ] **LVL1-01**: Interactive vignette split into 3 beats: morning law class → afternoon startup weekend → evening decision
- [ ] **LVL1-02**: Player makes small choices throughout (dialogue, click-to-advance); final choice reveals the pivot moment
- [ ] **LVL1-03**: Pixel-art Shanghai visual identity (neon, night skyline)
- [ ] **LVL1-04**: Level completion awards Curiosity stat (0-100% score based on engagement/choices)
- [ ] **LVL1-05**: Exit transition shows vignette: "A year later, Switzerland gets boring..."

### Level 2 — Latin America: Network Builder

- [ ] **LVL2-01**: LatAm map visible, 0 doctors trained at start
- [ ] **LVL2-02**: Player clicks doctors to "train" them (KOL strategy); each trained doctor connects to 3-5 more
- [ ] **LVL2-03**: Influential doctors (visually distinct) unlock entire countries when trained
- [ ] **LVL2-04**: Compound growth visible — network grows exponentially
- [ ] **LVL2-05**: Level ends when 11 countries are lit + $1M ARR ticker hits target
- [ ] **LVL2-06**: Warm vector visual identity (earth tones, map-based)
- [ ] **LVL2-07**: Score based on time-to-completion and doctor selection efficiency
- [ ] **LVL2-08**: Awards Sales, EQ, Grit stats

### Level 3 — Greenland: Storm Survival

- [ ] **LVL3-01**: Player character on ice, storm effects (wind particles, reduced visibility vignette)
- [ ] **LVL3-02**: Dodge wind gusts that push player off path
- [ ] **LVL3-03**: Warmth bar depletes over time, refilled by reaching checkpoints
- [ ] **LVL3-04**: Reach final checkpoint to complete level
- [ ] **LVL3-05**: White/blue visual identity with aurora borealis detail
- [ ] **LVL3-06**: Score based on warmth remaining + time
- [ ] **LVL3-07**: Awards Grit, Independence stats

### Level 4 — Agency Factory: n8n Routing + Debug

- [ ] **LVL4-01**: Stage 1 — node-routing puzzle (connect lead input → enrichment → output)
- [ ] **LVL4-02**: Stage 1 completes when all nodes are correctly wired
- [ ] **LVL4-03**: Stage 2 — broken version of the campaign appears with a bug
- [ ] **LVL4-04**: Player identifies and fixes the bug (click-to-select from options)
- [ ] **LVL4-05**: Terminal-green visual identity (dark background, glowing connections)
- [ ] **LVL4-06**: Score based on nodes used (fewer = higher) + debug speed
- [ ] **LVL4-07**: Awards Tech stat

### Level 5 — Interview Room: Defend-Your-CV Q&A

- [ ] **LVL5-01**: Clean office visual identity, hiring manager NPC visible
- [ ] **LVL5-02**: 5 rapid-fire questions appear ("Tell me your story", "Why this role?", etc.)
- [ ] **LVL5-03**: Each question shows 3-4 response options; high stats unlock the best responses
- [ ] **LVL5-04**: Low-stat players still get a complete answer, just less nuanced
- [ ] **LVL5-05**: Hiring manager addresses player by name throughout dialogue
- [ ] **LVL5-06**: After Q&A, "RECRUITER REPORT CARD" stats recap screen appears
- [ ] **LVL5-07**: Final screen shows soft CTAs: "Book a call" (Calendly), "LinkedIn", "Download CV"
- [ ] **LVL5-08**: CTA tone is respectful, no urgency pressure

### Scoring & Stats Integration

- [ ] **SCORE-01**: Each mini-game scores 0-100%
- [ ] **SCORE-02**: Score converts to stat points earned (Curiosity, Sales, EQ, Grit, Independence, Tech)
- [ ] **SCORE-03**: Replaying a level updates to the higher score (never lowers)
- [ ] **SCORE-04**: Stats persist across sessions (localStorage — inherited from v1)

### Infrastructure Cleanup

- [ ] **INFRA-01**: Remove v1 platformer files (Level1Scene, Player, Enemy, Boss, Coin, Book, level1Data.js)
- [ ] **INFRA-02**: Keep BootScene, TitleScene, HUDScene, GameRegistry, StatsManager, GameConfig
- [ ] **INFRA-03**: Extend TitleScene with name input
- [ ] **INFRA-04**: Extend GameRegistry with PLAYER_NAME key and per-level score keys
- [ ] **INFRA-05**: Create LevelSelectHub scene as new entry point after opening

### Deployment

- [ ] **DEPLOY-01**: Deploy to Vercel with custom domain (theaugustinfiles.com or similar)
- [ ] **DEPLOY-02**: Production build passes with no errors
- [ ] **DEPLOY-03**: Tested on Chrome, Safari desktop

## v2.1 Requirements (Deferred)

### Audio

- **AUD-01**: Single evolving background score across levels
- **AUD-02**: SFX per level (clicks, success, failure, transitions)

### Customization

- **URL-01**: `?company=X` URL param customizes Level 5 dialogue
- **URL-02**: `?role=X` URL param references specific role

### Enhancements

- **MOB-01**: Mobile touch controls
- **ANA-01**: Analytics (Plausible)
- **SHARE-01**: Share button with social cards
- **CRED-01**: Credits sequence

## Out of Scope

| Feature | Reason |
| --- | --- |
| Voice lines (ElevenLabs) | Scope risk, synchronization complexity |
| Tiled map editor | Mini-games don't need tile-based level design |
| Leaderboards | No hiring value, just noise |
| Multiplayer / social features | Single-player recruiter experience |
| Save system beyond localStorage | Simplicity — one visitor, one browser |

## Traceability

Requirements mapped to phases. Updated 2026-04-14.

| Requirement | Phase | Status |
| --- | --- | --- |
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 1 | Pending |
| INFRA-04 | Phase 1 | Pending |
| INFRA-05 | Phase 1 | Pending |
| SCORE-04 | Phase 1 | Pending |
| OPEN-01 | Phase 2 | Pending |
| OPEN-02 | Phase 2 | Pending |
| OPEN-03 | Phase 2 | Pending |
| OPEN-04 | Phase 2 | Pending |
| OPEN-05 | Phase 2 | Pending |
| HUB-01 | Phase 2 | Pending |
| HUB-02 | Phase 2 | Pending |
| HUB-03 | Phase 2 | Pending |
| HUB-04 | Phase 2 | Pending |
| SCORE-01 | Phase 2 | Pending |
| SCORE-02 | Phase 2 | Pending |
| SCORE-03 | Phase 2 | Pending |
| LVL1-01 | Phase 3 | Pending |
| LVL1-02 | Phase 3 | Pending |
| LVL1-03 | Phase 3 | Pending |
| LVL1-04 | Phase 3 | Pending |
| LVL1-05 | Phase 3 | Pending |
| LVL2-01 | Phase 4 | Pending |
| LVL2-02 | Phase 4 | Pending |
| LVL2-03 | Phase 4 | Pending |
| LVL2-04 | Phase 4 | Pending |
| LVL2-05 | Phase 4 | Pending |
| LVL2-06 | Phase 4 | Pending |
| LVL2-07 | Phase 4 | Pending |
| LVL2-08 | Phase 4 | Pending |
| LVL3-01 | Phase 5 | Pending |
| LVL3-02 | Phase 5 | Pending |
| LVL3-03 | Phase 5 | Pending |
| LVL3-04 | Phase 5 | Pending |
| LVL3-05 | Phase 5 | Pending |
| LVL3-06 | Phase 5 | Pending |
| LVL3-07 | Phase 5 | Pending |
| LVL4-01 | Phase 6 | Pending |
| LVL4-02 | Phase 6 | Pending |
| LVL4-03 | Phase 6 | Pending |
| LVL4-04 | Phase 6 | Pending |
| LVL4-05 | Phase 6 | Pending |
| LVL4-06 | Phase 6 | Pending |
| LVL4-07 | Phase 6 | Pending |
| LVL5-01 | Phase 7 | Pending |
| LVL5-02 | Phase 7 | Pending |
| LVL5-03 | Phase 7 | Pending |
| LVL5-04 | Phase 7 | Pending |
| LVL5-05 | Phase 7 | Pending |
| LVL5-06 | Phase 7 | Pending |
| LVL5-07 | Phase 7 | Pending |
| LVL5-08 | Phase 7 | Pending |
| VIGN-01 | Phase 7 | Pending |
| VIGN-02 | Phase 7 | Pending |
| VIGN-03 | Phase 7 | Pending |
| DEPLOY-01 | Phase 8 | Pending |
| DEPLOY-02 | Phase 8 | Pending |
| DEPLOY-03 | Phase 8 | Pending |

Coverage: 59/59 v2.0 requirements mapped. 0 unmapped.

---

Requirements defined: 2026-04-14
Pivoted from v1.0 platformer to v2.0 mini-game anthology
