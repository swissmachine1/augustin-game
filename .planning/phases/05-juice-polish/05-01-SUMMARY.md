---
phase: 05-juice-polish
plan: 01
subsystem: ui
tags: [phaser4, particles, camera, physics, juice, game-feel]

# Dependency graph
requires:
  - phase: 04-level-1-shanghai-awakening
    provides: Level1Scene with _handlePlayerHit, _handleBossHit, Coin.collect() — all hooks extended here
provides:
  - Screen shake on player damage (JUICE-01)
  - Gold particle burst on coin collect (JUICE-02)
  - Grey-purple particle explosion on boss defeat (JUICE-03)
  - 40ms hit-pause on every damage event (JUICE-04)
affects: [05-juice-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Particle emitters pre-created in create() and fired with .explode() per event (not instantiated per event)"
    - "Callback injection pattern: scene passes _onCoinCollect to Coin constructor for decoupled particle triggering"
    - "Hit-pause via physics.pause() + tweens.pauseAll() + time.delayedCall(40, resume) — scene clock unaffected by physics/tween pause"
    - "Shared 4x4 pixel texture generated once with make.graphics().generateTexture() and reused by both emitters"

key-files:
  created: []
  modified:
    - src/scenes/Level1Scene.js
    - src/sprites/Coin.js

key-decisions:
  - "Pre-generate shared 4x4 pixel texture (not per-emitter) — avoids redundant texture uploads to GPU"
  - "Callback injection (_onCoinCollect) over scene reference in Coin — keeps Coin class decoupled from Level1Scene particle API"
  - "physics.pause() stops arcade physics; time.delayedCall still fires since scene clock is independent — confirmed safe pattern"
  - "emitting: false on both emitters — no continuous emission, burst-only via .explode()"

patterns-established:
  - "Particle burst pattern: pre-create emitter in create(), fire with .explode(count, x, y) at event site"
  - "Hit-pause pattern: physics.pause() + tweens.pauseAll() + time.delayedCall(40, resume) wraps any damage handler"

requirements-completed: [JUICE-01, JUICE-02, JUICE-03, JUICE-04]

# Metrics
duration: 2min
completed: 2026-04-13
---

# Phase 05 Plan 01: Juice & Polish Summary

**Four game-feel effects added to Level1Scene: camera shake on player damage, gold particle burst on coin pickup, grey-purple particle explosion on boss defeat, and 40ms physics/tween freeze on every damage hit.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-13T17:43:53Z
- **Completed:** 2026-04-13T17:45:08Z
- **Tasks:** 2 (+ 1 checkpoint auto-approved in autonomous mode)
- **Files modified:** 2

## Accomplishments

- JUICE-01: `cameras.main.shake(120, 0.008)` added to `_handlePlayerHit()` — complements existing shake in `_handleBossHit`
- JUICE-02: `_coinEmitter` (gold, 12 particles, 350ms lifespan) fires at each coin pickup position via `_onCoinCollect` callback injected into `Coin` constructor
- JUICE-03: `_defeatEmitter` (grey-purple, 30 particles, 500ms lifespan) fires at boss position when `hp <= 0` in `_handleBossHit()`
- JUICE-04: `physics.pause()` + `tweens.pauseAll()` + `time.delayedCall(40, resume)` sequence added to both `_handlePlayerHit()` and `_handleBossHit()`

## Task Commits

Each task was committed atomically:

1. **Task 1: Particle emitters — coin burst (JUICE-02) and boss defeat explosion (JUICE-03)** - `3df9672` (feat)
2. **Task 2: Screen shake on player damage (JUICE-01) and hit-pause on all damage events (JUICE-04)** - `a1336cc` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified

- `src/scenes/Level1Scene.js` — Added particle texture generation, `_coinEmitter`, `_defeatEmitter`, `_onCoinCollect` callback, callback passed to `Coin` constructors, `explode()` calls, screen shake + hit-pause in `_handlePlayerHit()`, hit-pause in `_handleBossHit()`
- `src/sprites/Coin.js` — Updated constructor to accept optional `onCollect` param; calls `_onCollect(x, y)` in `collect()` before flash tween

## Decisions Made

- Pre-generate single 4x4 white pixel texture once and reuse for both emitters — avoids redundant GPU texture uploads
- Callback injection pattern for Coin keeps sprite class decoupled from Level1Scene particle internals
- `time.delayedCall` confirmed safe during `physics.pause()` — scene clock is independent of physics/tween systems in Phaser 4
- `emitting: false` on both emitters ensures burst-only mode, no ambient particles

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All 4 JUICE requirements (JUICE-01 through JUICE-04) are complete
- Phase 05 is now complete — game has Celeste-quality hit feedback, rewarding coin pickups, and a satisfying boss defeat moment
- Ready for deployment phase or additional polish (audio SFX would complement the visual juice added here)

---
*Phase: 05-juice-polish*
*Completed: 2026-04-13*
