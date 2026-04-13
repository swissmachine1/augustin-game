# Requirements: The Augustin Files

**Defined:** 2026-04-13
**Core Value:** The game must be fun enough to play through to the end AND tell a compelling career story — if either fails, the game fails as a job application tool.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Player Controller

- [ ] **CTRL-01**: Player moves left/right with arrow keys or A/D with smooth acceleration/deceleration
- [ ] **CTRL-02**: Player jumps with Space or W with variable height (tap = small, hold = full)
- [ ] **CTRL-03**: Player has double-jump ability (second jump slightly weaker)
- [ ] **CTRL-04**: Player has coyote time (120ms grace period to jump after leaving platform)
- [ ] **CTRL-05**: Player has jump buffering (150ms grace period to queue jump before landing)
- [ ] **CTRL-06**: Player has asymmetric gravity (1.5-2.5x multiplier on descent for crisp feel)
- [ ] **CTRL-07**: Player faces the direction of movement

### Animations

- [ ] **ANIM-01**: Player has idle, run, jump, and fall animation states
- [ ] **ANIM-02**: Animations use placeholder colored rectangles that can be swapped for sprites later
- [ ] **ANIM-03**: Animation state transitions are smooth and responsive to input

### Level 1 — Shanghai Awakening

- [ ] **LVL1-01**: Level has programmatic layout with ground, platforms at varying heights, and moving platforms
- [ ] **LVL1-02**: Level has 5 "skill coin" collectibles placed across the level with pickup feedback
- [ ] **LVL1-03**: Level has 3 "Safe Career Suit" patrol enemies that move left-right on platforms
- [ ] **LVL1-04**: Player takes damage on enemy contact with invincibility frames
- [ ] **LVL1-05**: Level has a book collectible titled "The Exchange Student's Guide to China"
- [ ] **LVL1-06**: Boss door requires all 5 coins + book to open
- [ ] **LVL1-07**: Boss fight: "The Comfort Zone" — grey blob that moves toward player, defeated by jumping on top 3 times
- [ ] **LVL1-08**: Boss has health bar UI visible during fight
- [ ] **LVL1-09**: On boss defeat: "LEVEL COMPLETE" screen with stats earned (+10 Curiosity)
- [ ] **LVL1-10**: Level data defined in external data file, not hardcoded in scene logic

### Stats System

- [ ] **STAT-01**: System tracks 7 stats: Sales, Tech, Grit, EQ, Languages, Independence, TeamPlayer
- [ ] **STAT-02**: Stats persist to localStorage across sessions
- [ ] **STAT-03**: Stats can be added to via gameplay events (collecting items, defeating bosses)
- [ ] **STAT-04**: TAB key opens full stats screen overlay with all 7 stats as horizontal bars

### HUD

- [ ] **HUD-01**: HUD runs as persistent parallel scene on top of game scene
- [ ] **HUD-02**: Top-left shows player health as hearts (3 max)
- [ ] **HUD-03**: Top-right shows coin count
- [ ] **HUD-04**: HUD updates reactively via Registry changedata events

### Game Flow

- [ ] **FLOW-01**: Boot scene loads assets and shows loading bar
- [ ] **FLOW-02**: Title scene shows game title and "PRESS SPACE TO START"
- [ ] **FLOW-03**: Scene transitions use fade-to-black effect
- [ ] **FLOW-04**: Player death triggers respawn at last checkpoint

### Juice / Polish

- [ ] **JUICE-01**: Screen shake on player damage and boss hits
- [ ] **JUICE-02**: Particle burst on coin collection
- [ ] **JUICE-03**: Particle effect on enemy defeat
- [ ] **JUICE-04**: Brief hit-pause on damage events (30-50ms freeze)

### Architecture

- [ ] **ARCH-01**: GameRegistry module defines typed constants for all registry keys
- [ ] **ARCH-02**: Cross-scene state managed through Phaser Registry (not scene params)
- [ ] **ARCH-03**: Scene shutdown handlers clean up audio and event listeners
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
| CTRL-01 | — | Pending |
| CTRL-02 | — | Pending |
| CTRL-03 | — | Pending |
| CTRL-04 | — | Pending |
| CTRL-05 | — | Pending |
| CTRL-06 | — | Pending |
| CTRL-07 | — | Pending |
| ANIM-01 | — | Pending |
| ANIM-02 | — | Pending |
| ANIM-03 | — | Pending |
| LVL1-01 | — | Pending |
| LVL1-02 | — | Pending |
| LVL1-03 | — | Pending |
| LVL1-04 | — | Pending |
| LVL1-05 | — | Pending |
| LVL1-06 | — | Pending |
| LVL1-07 | — | Pending |
| LVL1-08 | — | Pending |
| LVL1-09 | — | Pending |
| LVL1-10 | — | Pending |
| STAT-01 | — | Pending |
| STAT-02 | — | Pending |
| STAT-03 | — | Pending |
| STAT-04 | — | Pending |
| HUD-01 | — | Pending |
| HUD-02 | — | Pending |
| HUD-03 | — | Pending |
| HUD-04 | — | Pending |
| FLOW-01 | — | Pending |
| FLOW-02 | — | Pending |
| FLOW-03 | — | Pending |
| FLOW-04 | — | Pending |
| JUICE-01 | — | Pending |
| JUICE-02 | — | Pending |
| JUICE-03 | — | Pending |
| JUICE-04 | — | Pending |
| ARCH-01 | — | Pending |
| ARCH-02 | — | Pending |
| ARCH-03 | — | Pending |
| ARCH-04 | — | Pending |

**Coverage:**
- v1 requirements: 40 total
- Mapped to phases: 0
- Unmapped: 40

---
*Requirements defined: 2026-04-13*
*Last updated: 2026-04-13 after initial definition*
