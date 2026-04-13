---
phase: 01-architecture-game-flow
plan: 03
subsystem: ui
tags: [phaser4, scenes, registry, shutdown, fade-transition]

requires:
  - phase: 01-architecture-game-flow plan 01
    provides: GameRegistry.js with initRegistry() and KEYS constants
  - phase: 01-architecture-game-flow plan 02
    provides: Player class module

provides:
  - BootScene wired to GameRegistry — seeds 17 default registry values before TitleScene starts
  - TitleScene fade-to-black transition (300ms) before GameScene start
  - Both scenes register SHUTDOWN cleanup handlers per ARCH-03 pattern

affects: [02-player-controller, 03-level-1, any scene that reads registry on start]

tech-stack:
  added: []
  patterns:
    - "Phaser.Scenes.Events.SHUTDOWN used for per-scene cleanup registration"
    - "Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE used for transition gating"
    - "initRegistry called once in BootScene.create() to seed global Phaser registry before any gameplay scene runs"

key-files:
  created: []
  modified:
    - src/scenes/BootScene.js
    - src/scenes/TitleScene.js

key-decisions:
  - "Registry seeded in BootScene (not TitleScene) so it is ready before any scene reads it"
  - "Fade duration 300ms — brief enough not to feel sluggish, long enough to be clearly visible"
  - "SHUTDOWN handler in BootScene is a no-op placeholder — confirms ARCH-03 pattern is wired even when no cleanup is needed"

patterns-established:
  - "ARCH-03: Every scene registers a SHUTDOWN handler in create() for cleanup"
  - "FLOW-03: Scene transitions use fadeOut + FADE_OUT_COMPLETE callback, never direct scene.start"

requirements-completed: [ARCH-03, FLOW-01, FLOW-02, FLOW-03]

duration: 1min
completed: 2026-04-13
---

# Phase 01 Plan 03: Boot/Title Scene Wiring Summary

**GameRegistry seeded in BootScene with 300ms fade-to-black transition in TitleScene, both scenes wired with SHUTDOWN cleanup handlers**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-04-13T11:05:26Z
- **Completed:** 2026-04-13T11:06:12Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- BootScene now calls `initRegistry(this)` before transitioning to TitleScene — global registry seeded with 17 default values for health, coins, checkpoint, and stats
- TitleScene now fades to black over 300ms (via `cameras.main.fadeOut`) before starting GameScene — FLOW-03 satisfied
- Both BootScene and TitleScene register `Phaser.Scenes.Events.SHUTDOWN` handlers — ARCH-03 satisfied for both scenes
- All existing content preserved: loading bar, title text, subtitle, "PRESS SPACE TO START" prompt, and blinking tween

## Task Commits

Each task was committed atomically:

1. **Task 1: Update BootScene — add registry init and shutdown handler** - `02ec61b` (feat)
2. **Task 2: Update TitleScene — add fade transition and shutdown cleanup** - `ef9b697` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `src/scenes/BootScene.js` - Added `initRegistry` import + call + SHUTDOWN handler no-op
- `src/scenes/TitleScene.js` - Replaced direct `scene.start` with fadeOut + FADE_OUT_COMPLETE callback; added SHUTDOWN keyboard cleanup

## Decisions Made

- Registry seeded in BootScene (not TitleScene) so it is available before any scene reads it — ensures no scene ever accesses uninitialized registry keys
- SHUTDOWN handler in BootScene is a no-op — still wired to confirm ARCH-03 pattern is applied consistently across all scenes
- `removeAllListeners()` in TitleScene SHUTDOWN guard is belt-and-suspenders: Phaser's `.once()` self-cleans, but explicit removal protects against edge cases (rapid scene restarts during dev)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Known Stubs

None — no stubs or placeholder values introduced in this plan.

## Next Phase Readiness

- BootScene and TitleScene fully wired per architecture plan — ready for Phase 02 (player controller)
- GameScene will receive fade-in counterpart when its create() is extended (future plan)
- Registry is seeded and stable — any scene can now read `KEYS.*` values without risk of undefined

---
*Phase: 01-architecture-game-flow*
*Completed: 2026-04-13*
