# Phase 2: Player Controller & Animations - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

The player character moves with Celeste-quality feel — tight, responsive, and predictable enough to design levels around. Delivers: smooth acceleration/deceleration, variable jump height, double jump, coyote time (120ms), jump buffering (150ms), asymmetric gravity (1.5-2.5x on descent), direction facing, and animation state machine (idle/run/jump/fall) using placeholder colored rectangles.

Requirements: CTRL-01 through CTRL-07 (movement, jump mechanics, double jump, coyote time, jump buffer, asymmetric gravity, facing direction), ANIM-01 through ANIM-03 (animation states, placeholder rects, smooth transitions).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — core gameplay phase with well-documented patterns.

Key guidance from research:
- Coyote time: 120ms grace period (5-6 frames at 60fps) using `scene.time.now` deltas
- Jump buffer: 150ms grace period — queue jump input, execute on next landing
- Variable jump height: halve upward velocity on early key release
- Asymmetric gravity: 1.5-2.5x gravity multiplier when velocity.y > 0 (descending)
- Double jump: second jump slightly weaker (80% of first jump velocity)
- Smooth acceleration: don't set velocity directly — use acceleration + drag for natural feel
- State machine for animation: IDLE, RUN, JUMP, FALL states driving visual appearance
- Player.js already exists as a factory wrapper — extend it with input handling and state machine
- Use Phaser 4 Arcade Physics `body.blocked.down` for ground detection (verify this exists in v4)
- Placeholder animations: change rectangle color or size per state (swap for sprites later)
- All tuning constants should be clearly named and grouped at top of file for easy tweaking

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/sprites/Player.js` — existing factory-pattern Player class with physics body
- `src/systems/GameRegistry.js` — KEYS constants for cross-scene state
- `src/scenes/GameScene.js` — existing scene with platforms, player instantiation, death/respawn

### Established Patterns
- Factory pattern for Player (not class extension — Phaser 4 limitation)
- KEYS constants for registry access
- SHUTDOWN cleanup handlers in every scene

### Integration Points
- Player.js needs input handling added (keyboard cursors + WASD)
- GameScene.update() currently only calls handleDeath() — needs to call player.update()
- Animation state changes should be visual (color/shape changes on placeholder rects)

</code_context>

<specifics>
## Specific Ideas

Celeste-quality movement feel is the #1 priority. The specific frame data from Celeste's GDC postmortem:
- Coyote time: ~6 frames (100ms at 60fps, we're using 120ms for slightly more forgiveness)
- Jump buffer: ~6 frames (100ms, we're using 150ms)
- Jump apex: 0.35-0.45 seconds
- Jump height: 3-4 tiles (96-128 pixels at 32px tiles)

</specifics>

<deferred>
## Deferred Ideas

None — all movement mechanics are in scope for this phase.

</deferred>
