---
phase: 04-level-1-shanghai-awakening
plan: "03"
subsystem: gameplay
tags: [phaser4, collectibles, arcade-physics, tweens, registry]

# Dependency graph
requires:
  - phase: 04-level-1-shanghai-awakening/04-02
    provides: Level1Scene shell with world, platforms, camera, and placeholder arrays for coins/book
  - phase: 04-level-1-shanghai-awakening/04-01
    provides: LEVEL1 data with coin and book positions
  - phase: 03-hud-stats-system
    provides: HUDScene that reacts to KEYS.COINS registry changes via changedata events
provides:
  - Coin class: gold rectangle, static physics body, alpha tween on collect, KEYS.COINS + KEYS.COINS_COLLECTED increment
  - Book class: blue rectangle with label, static physics body, alpha tween on collect, KEYS.BOOK_COLLECTED set to true
  - 5 coins and 1 book spawned in Level1Scene at LEVEL1 data positions
  - physics.add.overlap wired for all 6 collectibles against player.sprite
affects:
  - 04-04 (enemy patrol) — shares same scene, overlaps must not conflict
  - 04-05 (boss fight) — COINS_COLLECTED and BOOK_COLLECTED gate boss door

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Factory-pattern collectible classes (no extends Phaser.Scene) matching Player.js convention
    - Static body via scene.physics.add.existing(sprite, true) for immovable collectibles
    - Alpha tween to 0 + onComplete destroy for pickup feedback
    - Registry increment pattern: (registry.get(KEY) ?? 0) + 1 for safe counters

key-files:
  created:
    - src/sprites/Coin.js
    - src/sprites/Book.js
  modified:
    - src/scenes/Level1Scene.js

key-decisions:
  - "Coin and Book are factory classes (not Phaser.Scene subclasses) — consistent with Player.js pattern established in Phase 01"
  - "No Phaser import in Coin.js or Book.js — only GameRegistry KEYS needed; scene methods accessed via constructor-injected scene reference"

patterns-established:
  - "Collectible factory pattern: constructor(scene, x, y) creates rectangle + static body; collect() guards with _collected flag then tweens + destroys"

requirements-completed: [LVL1-02, LVL1-05]

# Metrics
duration: 1min
completed: 2026-04-13
---

# Phase 4 Plan 03: Collectibles Summary

**Five gold coin rectangles and one blue book wired into Level1Scene with overlap detection, alpha-fade pickup feedback, and HUD-reactive registry increments**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-04-13T16:40:37Z
- **Completed:** 2026-04-13T16:41:34Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created Coin.js: 20x20 gold rectangle collectible with flash-and-disappear feedback, increments KEYS.COINS (HUD) and KEYS.COINS_COLLECTED (boss gate) on pickup
- Created Book.js: 28x36 blue rectangle with floating 'BOOK' label, sets KEYS.BOOK_COLLECTED on pickup
- Wired all 6 collectibles into Level1Scene using LEVEL1 data positions with physics.add.overlap against player.sprite

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Coin.js and Book.js entity classes** - `f71a301` (feat)
2. **Task 2: Wire collectibles into Level1Scene** - `2366d41` (feat)

**Plan metadata:** _(docs commit — see below)_

## Files Created/Modified
- `src/sprites/Coin.js` - Gold rectangle collectible; collect() increments COINS and COINS_COLLECTED in registry
- `src/sprites/Book.js` - Blue rectangle collectible with label; collect() sets BOOK_COLLECTED true in registry
- `src/scenes/Level1Scene.js` - Added Coin/Book imports, replaced placeholder arrays with live instances, added overlap detection

## Decisions Made
- No Phaser import in Coin.js or Book.js — scene reference injected via constructor is sufficient; keeps classes lightweight and testable outside Phaser lifecycle
- _collected guard flag prevents double-fire if overlap callback triggers multiple frames while tween is running

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None. All 5 coin positions and 1 book position are drawn from LEVEL1 data and wired to live overlap callbacks. Registry values flow to HUD via existing changedata event pipeline established in Phase 03.

## Next Phase Readiness
- Collectibles fully functional — ready for Plan 04 (enemy patrol suits)
- COINS_COLLECTED and BOOK_COLLECTED registry keys will be read by boss door logic in Plan 05
- No blockers

---
*Phase: 04-level-1-shanghai-awakening*
*Completed: 2026-04-13*
