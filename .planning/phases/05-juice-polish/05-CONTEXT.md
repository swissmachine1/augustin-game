# Phase 5: Juice & Polish - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped)

<domain>
## Phase Boundary

Damage, collection, and defeat events feel punchy and satisfying — the difference between a demo and a game worth sending. Adds screen shake, particle effects, and hit-pause to existing gameplay events.

Requirements: JUICE-01 (screen shake on damage/boss hits), JUICE-02 (particle burst on coin collection), JUICE-03 (particle effect on enemy defeat), JUICE-04 (30-50ms hit-pause on damage).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure polish layer.

Key guidance from research:
- Screen shake: `cameras.main.shake(duration, intensity)` — Phaser 4 built-in
- Particles: Phaser 4 particle emitter — max 3 simultaneous emitters, max 50 live particles
- Hit-pause: `scene.time.delayedCall(30, resumeFn)` or `scene.physics.pause()` + resume after 30-50ms
- Reuse emitters via `emitter.explode()` rather than creating new ones per effect
- These effects are purely additive — no architecture changes needed
- Must work with existing: Level1Scene damage handler, coin collection, enemy defeat, boss stomps

</decisions>

<code_context>
## Existing Code Insights

### Integration Points
- `Level1Scene._handlePlayerHit()` — add screen shake + hit-pause here
- `Level1Scene._handleBossHit()` — add screen shake on boss stomp
- Coin overlap callback — add particle burst on collection
- Enemy defeat (currently enemies don't die — may need to add defeat on stomp or just particles on boss hits)
- Boss stomp feedback — already has health bar dimming, add shake + particles

### Established Patterns
- Camera accessed via `this.cameras.main`
- Tweens via `this.tweens.add()`
- Physics pause/resume via `this.physics.pause()` / `this.physics.resume()`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard juice patterns from game feel research.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
