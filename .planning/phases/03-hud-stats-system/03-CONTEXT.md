# Phase 3: HUD & Stats System - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped)

<domain>
## Phase Boundary

A persistent HUD displays player state (health hearts, coin count) and a stats system tracks career progress across 7 RPG stats — both reactive via Registry and persistent via localStorage. TAB key opens full stats overlay.

Requirements: HUD-01 through HUD-04 (persistent parallel scene, health hearts, coin count, reactive updates), STAT-01 through STAT-04 (7 stats tracking, localStorage persistence, gameplay event integration, TAB overlay).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion.

Key guidance from research:
- HUD runs as a parallel scene launched alongside GameScene (Phaser 4 recommended pattern)
- HUD uses its own camera (unaffected by game camera transforms)
- HUD listens reactively via `registry.events.on('changedata-HEALTH', callback)` etc.
- Stats system: StatsManager in src/systems/ with add/get/getAll methods
- Stats persist to localStorage — load on init, save on change
- 7 stats: Sales, Tech, Grit, EQ, Languages, Independence, TeamPlayer
- TAB key toggles stats overlay (horizontal bars for each stat)
- Health displayed as heart icons (or colored rectangles for placeholder)
- GameRegistry KEYS already includes HEALTH, COINS, and 7 stat keys

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/systems/GameRegistry.js` — KEYS already defined for health, coins, all 7 stats
- `src/config/GameConfig.js` — scene array needs HUDScene added
- `src/scenes/GameScene.js` — needs to launch HUDScene as parallel scene

### Established Patterns
- ES module imports/exports, named exports
- Registry-based cross-scene state (KEYS constants)
- SHUTDOWN cleanup handlers in every scene

### Integration Points
- GameConfig.js scene array needs HUDScene added
- GameScene.create() needs `this.scene.launch('HUDScene')` call
- GameScene SHUTDOWN handler should stop HUDScene

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond what's in the build plan and requirements.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
