---
phase: 03-hud-stats-system
plan: 02
subsystem: hud
tags: [hud, phaser-scenes, registry, hearts, coins]
dependency_graph:
  requires: [GameRegistry.js, GameScene.js, GameConfig.js]
  provides: [HUDScene parallel overlay with hearts and coin counter]
  affects: [GameScene launch/shutdown lifecycle]
tech_stack:
  added: [HUDScene parallel scene pattern, Phaser Registry changedata events]
  patterns: [changedata-{key} event listeners, setScrollFactor(0) for screen-fixed UI, ARCH-03 SHUTDOWN cleanup]
key_files:
  created: [src/scenes/HUDScene.js]
  modified: [src/config/GameConfig.js, src/scenes/GameScene.js]
decisions:
  - HUDScene uses setBackgroundColor('rgba(0,0,0,0)') for transparent overlay — game world visible through HUD camera
  - Registry changedata events used (not polling) — HUD updates within same frame as registry change
  - setScrollFactor(0) on all HUD elements — unaffected by game camera scroll
  - HUDScene array position after GameScene ensures render-on-top when launched as parallel scene
metrics:
  duration: 1min
  completed: 2026-04-13
  tasks: 2
  files: 3
---

# Phase 03 Plan 02: HUDScene — Hearts and Coin Counter

Phaser parallel overlay scene with reactive health hearts and coin display — tied to registry via changedata events, fixed to screen coordinates, cleaned up on shutdown.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | HUDScene with hearts and coin counter | 32535d2 | src/scenes/HUDScene.js |
| 2 | Wire HUDScene into GameConfig and GameScene | ad26406 | src/config/GameConfig.js, src/scenes/GameScene.js |

## What Was Built

**HUDScene.js** — A Phaser scene running in parallel to GameScene with:
- Transparent camera (`setBackgroundColor('rgba(0,0,0,0)')`) so game world shows through
- 3 heart rectangles at top-left (y=24, x=24+i*36), red for full, dark grey for empty
- Coin counter text at top-right (x=1256, setOrigin(1,0)) showing `COINS: N`
- All elements use `setScrollFactor(0)` — fixed to screen regardless of camera movement
- `setDepth(10)` — renders above game world objects
- Reactive `changedata-health` and `changedata-coins` registry listeners — zero-polling, frame-accurate updates
- SHUTDOWN handler removes listeners (ARCH-03 pattern — no memory leaks)

**GameConfig.js** — HUDScene imported and added after GameScene in scene array.

**GameScene.js** — `this.scene.launch('HUDScene')` called in create(); SHUTDOWN handler updated to call `this.scene.stop('HUDScene')`.

## Decisions Made

- Used `setBackgroundColor('rgba(0,0,0,0)')` (not `transparent = true`) — the string rgba form is Phaser 4's documented API for transparent backgrounds
- Registry listeners use `changedata-${KEYS.HEALTH}` (resolves to `changedata-health`) — string value from KEYS, not the constant name
- HUDScene position in scene array after GameScene is required — parallel scenes launched with `scene.launch()` render above their launcher

## Deviations from Plan

### Pre-existing Build Issue (Out of Scope)

`npm run build` produces 7 `[MISSING_EXPORT]` errors for `import Phaser from 'phaser'` across multiple existing scene files. This error exists on the commit immediately before this plan's first task (verified by `git stash`). Our HUDScene.js uses the same import pattern as all existing scenes — this is a pre-existing Rolldown/Vite 8 ESM compatibility issue not introduced by this plan.

Deferred to `deferred-items.md` — does not affect Vite dev server (HMR works correctly).

## Known Stubs

None — HUD reads live registry values seeded by initRegistry in BootScene. Health and coin display are fully wired.

## Self-Check: PASSED
