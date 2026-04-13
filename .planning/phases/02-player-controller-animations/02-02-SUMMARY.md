---
phase: 02-player-controller-animations
plan: "02"
subsystem: gameplay
tags: [phaser4, arcade-physics, player-controller, jump, coyote-time, double-jump]

# Dependency graph
requires:
  - phase: 02-player-controller-animations
    plan: "01"
    provides: "PLAYER_CONSTANTS with all jump tuning values, input wiring, Player class structure"
provides:
  - "Complete jump system: variable height, double jump, coyote time (120ms), jump buffer (150ms), asymmetric gravity (2x descent)"
  - "_handleJump(delta) method with full game-feel logic"
  - "_doJump() and _doDoubleJump() methods"
  - "_applyAsymmetricGravity() using setGravityY additive pattern"
affects: [03-level-design, animations-phase, any phase reading player vertical state]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "setGravityY additive pattern: worldGravity * (MULT - 1) adds on top of world gravity to hit target multiplier"
    - "Jump buffer + coyote time: both tracked as countdown timers decremented by delta, consumed on relevant event"
    - "Variable height via velocity damping: 0.85x per frame while rising and jump not held, stops below -200 threshold"
    - "Double jump availability reset on body.blocked.down — ground detection drives state machine"

key-files:
  created: []
  modified:
    - "src/sprites/Player.js"

key-decisions:
  - "setGravityY adds to world gravity (not replace) — worldGravity*(2.0-1) = 1x extra on top of 1x world = 2x total fall gravity"
  - "Jump buffer consumed on landing (!_wasOnGround + _jumpBufferTimeLeft > 0), not just on press — covers pre-landing input"
  - "jumpPressed evaluated before coyote/buffer decrements so same-frame buffer set is not immediately decremented"

patterns-established:
  - "Jump state machine: onGround drives coyote reset, landing triggers buffer consumption, jumpPressed drives buffer set then execution"
  - "Asymmetric gravity: setGravityY(0) on ascent, setGravityY(worldGravity*(MULT-1)) on descent — keeps rise/fall feel distinct"

requirements-completed: [CTRL-02, CTRL-03, CTRL-04, CTRL-05, CTRL-06]

# Metrics
duration: 1min
completed: "2026-04-13"
---

# Phase 02 Plan 02: Jump System Summary

**Celeste-quality jump system added to Player.js: variable height via velocity cut, 120ms coyote time, 150ms jump buffer, double jump at 80% strength, and 2x asymmetric descent gravity via additive setGravityY**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-04-13T11:23:26Z
- **Completed:** 2026-04-13T11:24:12Z
- **Tasks:** 1 of 1
- **Files modified:** 1

## Accomplishments

- Complete jump system in Player.js with all five game-feel mechanics working together
- Coyote time (120ms) and jump buffer (150ms) implemented as delta-decremented countdown timers
- Asymmetric gravity using the correct additive setGravityY pattern (not replacing world gravity)
- Double jump available after first jump, reset automatically on landing
- Variable jump height via per-frame velocity damping (0.85x) when jump key released early while rising

## Task Commits

1. **Task 1: Implement variable jump height and asymmetric gravity** - `632609b` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `/Users/augustin/Claude/video-game/src/sprites/Player.js` — Added jump state fields in constructor, `_handleJump(delta)`, `_doJump()`, `_doDoubleJump()`, `_applyAsymmetricGravity()` methods; update() now calls all three

## Decisions Made

- `setGravityY` is additive — `worldGravity * (2.0 - 1) = 800` added on top of 800 world gravity = 1600 total on descent (2x). This is the correct formula; replacing would require different math.
- Jump buffer is set BEFORE coyote/buffer decrements run — ensures same-frame input is recorded before the timer ticks down.
- Buffered jump consumed on landing detection (`!_wasOnGround && _jumpBufferTimeLeft > 0`) to handle the "pressed just before landing" case.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Jump system is complete and all CTRL-02 through CTRL-06 requirements are met
- Player.js is now the full movement controller: horizontal (Plan 01) + vertical (Plan 02)
- Ready for Plan 03: animations (idle, run, jump, fall states wired to movement state)
- No blockers; physics body and input keys already established from Plan 01

## Self-Check: PASSED

- src/sprites/Player.js: FOUND
- 02-02-SUMMARY.md: FOUND
- Commit 632609b: FOUND

---
*Phase: 02-player-controller-animations*
*Completed: 2026-04-13*
