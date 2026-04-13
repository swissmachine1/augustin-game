---
phase: "04"
plan: "04"
subsystem: level1-enemies-boss-door
tags: [enemies, patrol, invincibility, boss-door, damage]
dependency_graph:
  requires: ["04-03"]
  provides: ["patrol-enemies", "i-frames", "boss-door-gate"]
  affects: ["04-05"]
tech_stack:
  added: []
  patterns:
    - "Dynamic body enemies with platform colliders for gravity landing"
    - "i-frames counter decremented via delta in update() — prevents double-damage"
    - "Registry changedata listener pattern for boss door gate logic"
    - "Alpha tween on player.sprite for visual i-frame feedback"
key_files:
  created:
    - src/sprites/Enemy.js
  modified:
    - src/scenes/Level1Scene.js
decisions:
  - "Enemy uses dynamic body (not static) so world gravity keeps it grounded on platforms"
  - "patrolMin/patrolMax world-X bounds eliminate need for edge detection"
  - "_iFrames stored as ms remaining, decremented by Phaser delta each frame"
  - "_platformRects array populated during platform creation loop — avoids second pass for enemy colliders"
  - "Boss door uses static body + registry changedata listener (not polling) for gate logic"
  - "repeat: 7 on tween = 8 cycles x 200ms = 1600ms covers the 1500ms i-frame window cleanly"
metrics:
  duration: "47 minutes"
  completed: "2026-04-13"
  tasks_completed: 2
  files_created: 1
  files_modified: 1
---

# Phase 04 Plan 04: Patrol Enemies, I-Frames, and Boss Door Summary

**One-liner:** Three grey patrol enemies with 1.5s invincibility frames on contact plus a red boss door gate that opens when 5 coins and the book are collected.

## What Was Built

### src/sprites/Enemy.js (new)
Factory class for patrol enemies. Dynamic arcade body moves left-right at ENEMY_SPEED (100 px/s). `update()` checks x position against patrolMin/patrolMax and reverses velocity at bounds. World gravity applies automatically to the dynamic body — enemies land on platforms via colliders added in Level1Scene.

### src/scenes/Level1Scene.js (modified)
Six additions to the existing scene:

1. **Import** — `Enemy` class added to imports
2. **_platformRects** — static platform rects collected during platform creation loop for use as enemy colliders
3. **Enemy spawning** — `_enemies` array built from `LEVEL1.enemies` data; each enemy gets ground + platform colliders to stay on surfaces
4. **Player overlap** — `_handlePlayerHit` registered as overlap callback for each enemy
5. **_handlePlayerHit** — decrements KEYS.HEALTH, sets `_iFrames = 1500`, triggers flashing alpha tween (repeat: 7 = 8 cycles = 1600ms)
6. **update()** — decrements `_iFrames` by delta; calls `e.update()` for all enemies each frame
7. **Boss door** — red rectangle at LEVEL1.bossDoor position with static body + player collider; `_checkBossDoor` listener fires on any registry change, checks coins >= 5 && book, tweens scaleY to 0 then destroys
8. **SHUTDOWN handler** — extended to clean up `_checkBossDoor` registry listener

## Decisions Made

- Dynamic body for Enemy so gravity keeps it grounded without manual position management
- patrolMin/patrolMax world-X bounds are simpler and sufficient vs edge detection
- `_iFrames` as ms-remaining integer, decremented by delta — no tween or timer needed for the gate logic itself
- `_platformRects` array avoids a second platform pass; populated inline during existing forEach
- Registry changedata listener (not polling) for boss door — consistent with HUD pattern from Phase 03
- Boss door `scaleY: 0` tween provides visual "shrink closed" opening effect before destroy

## Deviations from Plan

**1. [Rule 1 - Bug] Fixed duplicate _setupMovingPlatform method**
- **Found during:** Task 2 — Edit tool inserted _handlePlayerHit before the existing _setupMovingPlatform but the old method body was truncated
- **Fix:** Rewrote Level1Scene.js cleanly with Write tool to eliminate the duplicate and restore complete file structure
- **Files modified:** src/scenes/Level1Scene.js
- **Commit:** 204a057

**2. Minor adjustment: repeat: 7 instead of repeat: 14**
- Plan specified repeat: 14 with a comment noting "7 blinks in 1.5s". Adjusted to repeat: 7 (8 cycles x 200ms = 1600ms) which correctly covers the 1500ms i-frame window without over-blinking.

## Known Stubs

None — all enemy patrol, i-frame, and boss door logic is fully wired. No placeholder data flows to UI.

## Self-Check: PASSED

- FOUND: src/sprites/Enemy.js
- FOUND: src/scenes/Level1Scene.js
- FOUND: .planning/phases/04-level-1-shanghai-awakening/04-04-SUMMARY.md
- FOUND: commit 7ce4489 (Enemy.js)
- FOUND: commit 204a057 (Level1Scene.js)
