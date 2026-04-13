---
phase: 04-level-1-shanghai-awakening
plan: "02"
subsystem: level-scene
tags: [level, scene, platforms, camera, phaser, moving-platform]
dependency_graph:
  requires:
    - 04-01 (level1Data.js — LEVEL1 frozen export)
    - 03-01 (HUDScene — launched as overlay)
    - 02-01 (Player sprite module)
    - 01-02 (StatsManager)
    - 01-01 (GameRegistry KEYS)
  provides:
    - Level1Scene (full level container, 3200x720 world)
    - Moving platform with tween + body sync
    - Camera follow bound to world
  affects:
    - 04-03 (collectibles added into this scene)
    - 04-04 (enemies added into this scene)
    - 04-05 (boss added into this scene)
tech_stack:
  added: []
  patterns:
    - Static physics body for ground and platforms via physics.add.existing(rect, true)
    - Moving platform: static body + tween with onUpdate body.reset for position sync
    - staticGroup for batch platform collider setup; individual colliders for moving platforms
    - Camera setBounds + startFollow with lerp 0.1 for smooth scroll
    - Placeholder arrays (_coins, _book, _enemies, _boss, _bossDoor) prepared for Plans 03-05
key_files:
  created:
    - src/scenes/Level1Scene.js
  modified:
    - src/config/GameConfig.js
    - src/scenes/TitleScene.js
decisions:
  - Level1Scene replaces GameScene as active gameplay scene — GameScene import removed from GameConfig
  - Moving platform uses static body + tween + body.reset(rect.x, rect.y) each tween frame — only correct approach for static bodies in Phaser 4 arcade physics
  - platforms array split: static platforms go into this._platforms staticGroup; moving platforms kept in this._movingPlatforms array with individual colliders
metrics:
  duration: "~1min"
  completed_date: "2026-04-13"
  tasks_completed: 2
  files_modified: 3
---

# Phase 04 Plan 02: Level1Scene Shell Summary

Level1Scene built as the full gameplay container: 3200x720 world with ground, 10 static platforms, 1 moving platform (tween + body sync), player integration, smooth camera follow, and HUDScene overlay — replacing GameScene as the active scene.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create Level1Scene.js with world, platforms, camera, Player | f8f2939 | src/scenes/Level1Scene.js |
| 2 | Wire Level1Scene into GameConfig and TitleScene | 9b32487 | src/config/GameConfig.js, src/scenes/TitleScene.js |

## What Was Built

**Level1Scene.js** (120 lines):
- World bounds: 3200x720 (`physics.world.setBounds`)
- Ground: full-width strip from `LEVEL1.ground`
- 10 static platforms: looped from `LEVEL1.platforms`, added to `staticGroup`
- 1 moving platform (platforms[5]): tween oscillates `rangeX=120px` at `speed=80px/s`; `onUpdate` calls `body.reset(rect.x, rect.y)` to sync static physics body
- Player at `LEVEL1.playerSpawn` (200, 580) with world bounds collision
- Colliders: player vs ground, player vs `_platforms` group, player vs each moving platform
- Camera: `setBounds` + `startFollow` with lerp 0.1 for smooth follow
- StatsManager loads persisted values; registry seeded; checkpoint set to `LEVEL1.checkpoint`
- HUDScene launched as overlay; SHUTDOWN handler stops it
- `deathFloorY = worldHeight + 100`; `handleDeath()` + `respawn()` mirroring GameScene pattern
- Placeholder arrays `_coins`, `_book`, `_enemies`, `_boss`, `_bossDoor` for Plans 03-05

**GameConfig.js**: `GameScene` replaced by `Level1Scene` in scene array and imports.

**TitleScene.js**: `this.scene.start('GameScene')` → `this.scene.start('Level1Scene')`.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `this._coins = []` — no coins spawned yet (Plan 03)
- `this._book = null` — no book spawned yet (Plan 03)
- `this._enemies = []` — no enemies spawned yet (Plan 04)
- `this._boss = null` — no boss spawned yet (Plan 05)
- `this._bossDoor = null` — no boss door spawned yet (Plan 05)

These are intentional placeholder arrays per plan spec. Plans 03-05 will populate them.

## Self-Check: PASSED

Files created:
- src/scenes/Level1Scene.js — FOUND
- src/config/GameConfig.js — FOUND (modified)
- src/scenes/TitleScene.js — FOUND (modified)

Commits verified:
- f8f2939 — feat(04-02): create Level1Scene
- 9b32487 — feat(04-02): wire Level1Scene into GameConfig and TitleScene
