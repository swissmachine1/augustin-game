# Phase 4: Level 1 — Shanghai Awakening - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped)

<domain>
## Phase Boundary

A recruiter can play a complete level — enter, explore, collect items, fight enemies, defeat a boss, and reach the "LEVEL COMPLETE" screen. This is the first real gameplay experience and proves the full stack: player controller + level design + enemies + collectibles + boss + stats integration + HUD.

Requirements: LVL1-01 through LVL1-10 (programmatic layout with platforms, 5 skill coins, 3 patrol enemies, damage with i-frames, book collectible, boss door gate, boss fight, boss health bar, level complete screen, external data file).

</domain>

<decisions>
## Implementation Decisions

### Level Design
- Level data in `src/data/level1Data.js` — arrays of platform positions, enemy spawn points, collectible locations
- Ground layer spans full level width, floating platforms at varying heights
- At least 1 moving platform (horizontal oscillation using tween)
- Level wider than viewport — camera follows player (basic follow, no parallax yet)
- World bounds set to level dimensions

### Enemies
- "Safe Career Suit" enemies: grey rectangles that patrol left-right on platforms
- Simple AI: reverse direction at platform edges or on wall hit
- Contact damage to player (1 heart per hit)
- Player invincibility frames after hit (1.5s, flashing effect via alpha tween)

### Collectibles
- 5 "skill coins": gold/yellow rectangles with overlap detection
- 1 book collectible: blue rectangle, larger than coins
- Coins and book increment registry counters when collected
- Visual/audio feedback on pickup (flash + disappear)

### Boss
- "The Comfort Zone" — large grey blob rectangle that moves toward player
- Defeated by jumping on top 3 times (overlap detection when player velocity.y > 0)
- Boss health bar: 3 segments displayed above boss
- Boss door: rectangle barrier that checks registry for 5 coins + 1 book, opens when all collected

### Level Complete
- On boss defeat: freeze gameplay, show "LEVEL COMPLETE" text overlay
- Display stats earned: "+10 Curiosity" (add to Grit stat via StatsManager)
- Auto-transition back to title after 3 seconds (or on key press)

### Claude's Discretion
- Exact platform positions and spacing (must be fun with the Celeste-quality controller)
- Enemy patrol speed and range
- Boss movement speed and behavior pattern
- Camera follow parameters (deadzone, lerp)
- Level length and difficulty curve

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/sprites/Player.js` — full Celeste-quality controller with PLAYER_CONSTANTS
- `src/systems/GameRegistry.js` — KEYS for health, coins, checkpoints, all 7 stats
- `src/systems/StatsManager.js` — add/get/getAll with localStorage persistence
- `src/scenes/HUDScene.js` — reactive hearts, coins, TAB stats overlay
- `src/scenes/GameScene.js` — existing scene with platforms, Player import, death/respawn, StatsManager

### Established Patterns
- Factory-pattern Player (wrapper, not extension)
- Registry-based cross-scene state via KEYS constants
- SHUTDOWN cleanup handlers in every scene
- `setAccelerationX` + `setDragX` for physics-based movement
- `body.blocked.down` for ground detection

### Integration Points
- GameScene.js will be significantly expanded (or replaced with Level1Scene)
- GameConfig.js scene array may need Level1Scene added
- HUDScene already launched by GameScene — continues working
- StatsManager already instantiated in GameScene

</code_context>

<specifics>
## Specific Ideas

From the build plan:
- Shanghai skyline at night, neon, startup vibe (placeholder geometry for now)
- Boss fight should feel satisfying — visual feedback on each stomp
- Level should take 2-3 minutes max to complete
- The 5 coins should require some platforming skill to collect (not all on ground level)

</specifics>

<deferred>
## Deferred Ideas

- Parallax background layers (v2 feature, CAM-02)
- Audio/SFX (v2 feature, AUD-01/02)
- Moving platforms with complex paths
- Multiple checkpoint locations (single checkpoint at level start is fine for MVP)

</deferred>
