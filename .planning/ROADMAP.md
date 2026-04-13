# Roadmap: The Augustin Files

## Overview

Five phases that take the project from a static green rectangle to a fully playable career platformer. Phase 1 establishes the architecture and game flow skeleton. Phase 2 builds the player controller — nothing else can be designed until jump arcs are locked. Phase 3 wires up the HUD and stats system so level events have somewhere to write. Phase 4 assembles Level 1 (Shanghai Awakening) as the complete playable experience. Phase 5 adds juice and polish that turns a functional game into one worth sharing with hiring managers.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Architecture & Game Flow** - Registry, scene scaffold, Boot/Title flow, cleanup handlers
- [ ] **Phase 2: Player Controller & Animations** - Celeste-quality movement, coyote time, jump buffer, sprite states
- [ ] **Phase 3: HUD & Stats System** - Persistent HUD scene, 7-stat registry, TAB overlay, localStorage
- [ ] **Phase 4: Level 1 — Shanghai Awakening** - Complete playable level with collectibles, enemies, and boss fight
- [ ] **Phase 5: Juice & Polish** - Screen shake, particles, hit-pause — the feel layer that makes sharing worthwhile

## Phase Details

### Phase 1: Architecture & Game Flow
**Goal**: The game skeleton runs in the browser with correct scene flow, Registry-based state, and teardown safety
**Depends on**: Nothing (first phase)
**Requirements**: ARCH-01, ARCH-02, ARCH-03, ARCH-04, FLOW-01, FLOW-02, FLOW-03, FLOW-04
**Success Criteria** (what must be TRUE):
  1. Opening the game in the browser shows a loading bar followed by the title screen with "PRESS SPACE TO START"
  2. Pressing Space from the title screen transitions to the game scene with a fade-to-black effect
  3. Dying in the game scene triggers a respawn at the last checkpoint without a full reload
  4. All registry keys are defined in a single GameRegistry module — no magic strings anywhere in the codebase
  5. Closing or switching scenes does not leave orphaned audio or event listeners
**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md — GameRegistry module with typed KEYS constants and initRegistry()
- [x] 01-02-PLAN.md — Player.js module (rectangle placeholder + physics body)
- [x] 01-03-PLAN.md — BootScene + TitleScene: registry init, fade transition, shutdown handlers
- [ ] 01-04-PLAN.md — GameScene: Player module wiring, registry state, death/respawn

### Phase 2: Player Controller & Animations
**Goal**: The player character moves with Celeste-quality feel — tight, responsive, and predictable enough to design levels around
**Depends on**: Phase 1
**Requirements**: CTRL-01, CTRL-02, CTRL-03, CTRL-04, CTRL-05, CTRL-06, CTRL-07, ANIM-01, ANIM-02, ANIM-03
**Success Criteria** (what must be TRUE):
  1. Player accelerates and decelerates smoothly when pressing and releasing left/right — no instant velocity snapping
  2. Tapping Space produces a small hop; holding Space produces a full jump — release height is variable
  3. Walking off a platform edge and pressing Space within 120ms still triggers a jump (coyote time works)
  4. Pressing Space 150ms before landing queues the jump so it fires on touchdown (jump buffering works)
  5. The player rectangle visually switches to idle, run, jump, and fall states in sync with movement — all swappable for sprites without changing game logic
**Plans**: TBD
**UI hint**: yes

### Phase 3: HUD & Stats System
**Goal**: A persistent HUD displays player state and a stats system tracks career progress — both reactive and persistent
**Depends on**: Phase 2
**Requirements**: HUD-01, HUD-02, HUD-03, HUD-04, STAT-01, STAT-02, STAT-03, STAT-04
**Success Criteria** (what must be TRUE):
  1. The HUD is visible at all times on top of the game scene — health hearts (top-left) and coin count (top-right) update instantly on registry change
  2. Pressing TAB opens a full-screen stats overlay showing all 7 stats (Sales, Tech, Grit, EQ, Languages, Independence, TeamPlayer) as filled bars
  3. Collecting an item or defeating an enemy visibly increments the relevant stat on the overlay
  4. Closing the browser and reopening it restores the same stat values from localStorage
**Plans**: TBD
**UI hint**: yes

### Phase 4: Level 1 — Shanghai Awakening
**Goal**: A recruiter can play a complete level — enter, explore, collect, fight a boss, and reach the level complete screen
**Depends on**: Phase 3
**Requirements**: LVL1-01, LVL1-02, LVL1-03, LVL1-04, LVL1-05, LVL1-06, LVL1-07, LVL1-08, LVL1-09, LVL1-10
**Success Criteria** (what must be TRUE):
  1. The level contains ground, platforms at varying heights, and at least one moving platform — all defined in an external data file, not in scene logic
  2. Five skill coins and one book collectible are spread across the level; picking each up shows a visible feedback effect
  3. Three patrol enemies move back and forth on platforms; touching one damages the player with invincibility frames
  4. The boss door stays locked until all 5 coins and the book are collected — then opens
  5. The boss fight runs to completion: "The Comfort Zone" blob can be jumped on 3 times, shows a health bar, and defeating it triggers the "LEVEL COMPLETE" screen with +10 Curiosity stat
**Plans**: TBD

### Phase 5: Juice & Polish
**Goal**: Damage, collection, and defeat events feel punchy and satisfying — the difference between a demo and a game worth sending
**Depends on**: Phase 4
**Requirements**: JUICE-01, JUICE-02, JUICE-03, JUICE-04
**Success Criteria** (what must be TRUE):
  1. Taking damage or hitting the boss causes the screen to shake visibly
  2. Collecting a coin produces a particle burst at the pickup location
  3. Defeating an enemy produces a particle effect at its position
  4. Damage events freeze the frame for 30-50ms before resuming — the hit lands with weight
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Architecture & Game Flow | 2/4 | In Progress|  |
| 2. Player Controller & Animations | 0/? | Not started | - |
| 3. HUD & Stats System | 0/? | Not started | - |
| 4. Level 1 — Shanghai Awakening | 0/? | Not started | - |
| 5. Juice & Polish | 0/? | Not started | - |
