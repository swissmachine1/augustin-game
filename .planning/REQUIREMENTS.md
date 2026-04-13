# Requirements: The Augustin Files

**Defined:** 2026-04-13
**Core Value:** The game must be fun enough to play through to the end AND tell a compelling career story — if either fails, the game fails as a job application tool.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Player Controller

- [x] **CTRL-01**: Player moves left/right with arrow keys or A/D with smooth acceleration/deceleration
- [x] **CTRL-02**: Player jumps with Space or W with variable height (tap = small, hold = full)
- [x] **CTRL-03**: Player has double-jump ability (second jump slightly weaker)
- [x] **CTRL-04**: Player has coyote time (120ms grace period to jump after leaving platform)
- [x] **CTRL-05**: Player has jump buffering (150ms grace period to queue jump before landing)
- [x] **CTRL-06**: Player has asymmetric gravity (1.5-2.5x multiplier on descent for crisp feel)
- [x] **CTRL-07**: Player faces the direction of movement

### Animations

- [x] **ANIM-01**: Player has idle, run, jump, and fall animation states
- [x] **ANIM-02**: Animations use placeholder colored rectangles that can be swapped for sprites later
- [x] **ANIM-03**: Animation state transitions are smooth and responsive to input

### Level 1 — Shanghai Awakening

- [x] **LVL1-01**: Level has programmatic layout with ground, platforms at varying heights, and moving platforms
- [x] **LVL1-02**: Level has 5 "skill coin" collectibles placed across the level with pickup feedback
- [x] **LVL1-03**: Level has 3 "Safe Career Suit" patrol enemies that move left-right on platforms
- [x] **LVL1-04**: Player takes damage on enemy contact with invincibility frames
- [x] **LVL1-05**: Level has a book collectible titled "The Exchange Student's Guide to China"
- [x] **LVL1-06**: Boss door requires all 5 coins + book to open
- [x] **LVL1-07**: Boss fight: "The Comfort Zone" — grey blob that moves toward player, defeated by jumping on top 3 times
- [x] **LVL1-08**: Boss has health bar UI visible during fight
- [x] **LVL1-09**: On boss defeat: "LEVEL COMPLETE" screen with stats earned (+10 Curiosity)
- [x] **LVL1-10**: Level data defined in external data file, not hardcoded in scene logic

### Stats System

- [x] **STAT-01**: System tracks 7 stats: Sales, Tech, Grit, EQ, Languages, Independence, TeamPlayer
- [x] **STAT-02**: Stats persist to localStorage across sessions
- [x] **STAT-03**: Stats can be added to via gameplay events (collecting items, defeating bosses)
- [x] **STAT-04**: TAB key opens full stats screen overlay with all 7 stats as horizontal bars

### HUD

- [x] **HUD-01**: HUD runs as persistent parallel scene on top of game scene
- [x] **HUD-02**: Top-left shows player health as hearts (3 max)
- [x] **HUD-03**: Top-right shows coin count
- [x] **HUD-04**: HUD updates reactively via Registry changedata events

### Game Flow

- [x] **FLOW-01**: Boot scene loads assets and shows loading bar
- [x] **FLOW-02**: Title scene shows game title and "PRESS SPACE TO START"
- [x] **FLOW-03**: Scene transitions use fade-to-black effect
- [x] **FLOW-04**: Player death triggers respawn at last checkpoint

### Juice / Polish

- [ ] **JUICE-01**: Screen shake on player damage and boss hits
- [ ] **JUICE-02**: Particle burst on coin collection
- [ ] **JUICE-03**: Particle effect on enemy defeat
- [ ] **JUICE-04**: Brief hit-pause on damage events (30-50ms freeze)

### Architecture

- [x] **ARCH-01**: GameRegistry module defines typed constants for all registry keys
- [x] **ARCH-02**: Cross-scene state managed through Phaser Registry (not scene params)
- [x] **ARCH-03**: Scene shutdown handlers clean up audio and event listeners
- [ ] **ARCH-04**: Player class is a separate module in src/sprites/Player.js

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Levels

- **LVL2-01**: Level 2 — Latin America with language meter, 11 flag collectibles, NPC training, Quota Dragon boss
- **LVL5-01**: Level 5 — Interview Room with dialogue tree, stats recap, CTA buttons (Book Call, LinkedIn, Download CV)
- **LVL3-01**: Level 3 — Greenland (hidden level) with endurance mechanic
- **LVL4-01**: Level 4 — Agency Factory with diagnostic mode and type-matched enemies

### Features

- **PWR-01**: Power-up inventory system (Clay, n8n, Instantly, SmartLead, Claude Code)
- **AUD-01**: Per-level looping background music with crossfade
- **AUD-02**: SFX suite (jump, land, collect, hit, death — minimum 5 sounds)
- **CAM-01**: Smooth camera follow with deadzone and lerp
- **CAM-02**: Parallax scrolling backgrounds (2-3 layers)
- **URL-01**: URL params for per-company customization (?company=, ?name=, ?role=)
- **MENU-01**: Main menu with Play / Continue / Chapter Select
- **MENU-02**: Pause menu (ESC key)
- **DEPLOY-01**: Deploy to Vercel with custom domain
- **MOB-01**: Mobile touch controls
- **SHARE-01**: Share button / social cards
- **CRED-01**: Credits sequence
- **ANA-01**: Analytics (Plausible)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Tiled map editor integration | Programmatic levels are simpler for 3 custom levels |
| Voice lines (ElevenLabs) | Scope risk, synchronization complexity |
| Save/load system | 3 levels takes under 15 minutes — chapter select sufficient |
| Leaderboards / speedrun modes | No hiring value |
| Matter.js physics | Arcade Physics is sufficient for platforming |
| ECS (Phatty) | Not justified at this scale — extend Sprite directly |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ARCH-01 | Phase 1 | Complete |
| ARCH-02 | Phase 1 | Complete |
| ARCH-03 | Phase 1 | Complete |
| ARCH-04 | Phase 1 | Pending |
| FLOW-01 | Phase 1 | Complete |
| FLOW-02 | Phase 1 | Complete |
| FLOW-03 | Phase 1 | Complete |
| FLOW-04 | Phase 1 | Complete |
| CTRL-01 | Phase 2 | Complete |
| CTRL-02 | Phase 2 | Complete |
| CTRL-03 | Phase 2 | Complete |
| CTRL-04 | Phase 2 | Complete |
| CTRL-05 | Phase 2 | Complete |
| CTRL-06 | Phase 2 | Complete |
| CTRL-07 | Phase 2 | Complete |
| ANIM-01 | Phase 2 | Complete |
| ANIM-02 | Phase 2 | Complete |
| ANIM-03 | Phase 2 | Complete |
| HUD-01 | Phase 3 | Complete |
| HUD-02 | Phase 3 | Complete |
| HUD-03 | Phase 3 | Complete |
| HUD-04 | Phase 3 | Complete |
| STAT-01 | Phase 3 | Complete |
| STAT-02 | Phase 3 | Complete |
| STAT-03 | Phase 3 | Complete |
| STAT-04 | Phase 3 | Complete |
| LVL1-01 | Phase 4 | Complete |
| LVL1-02 | Phase 4 | Complete |
| LVL1-03 | Phase 4 | Complete |
| LVL1-04 | Phase 4 | Complete |
| LVL1-05 | Phase 4 | Complete |
| LVL1-06 | Phase 4 | Complete |
| LVL1-07 | Phase 4 | Complete |
| LVL1-08 | Phase 4 | Complete |
| LVL1-09 | Phase 4 | Complete |
| LVL1-10 | Phase 4 | Complete |
| JUICE-01 | Phase 5 | Pending |
| JUICE-02 | Phase 5 | Pending |
| JUICE-03 | Phase 5 | Pending |
| JUICE-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 40 total
- Mapped to phases: 40
- Unmapped: 0

---
*Requirements defined: 2026-04-13*
*Last updated: 2026-04-13 after roadmap creation — all 40 requirements mapped*
