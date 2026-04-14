# Phase 1: Infrastructure Cleanup - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning
**Mode:** Auto-generated (pure infrastructure — discuss skipped)

<domain>
## Phase Boundary

The codebase becomes v2-ready. All v1 platformer-specific code is removed. Inherited infrastructure (BootScene, TitleScene, HUDScene, GameRegistry, StatsManager, GameConfig) is extended for v2 needs: name input on TitleScene, PLAYER_NAME + per-level score keys in GameRegistry, LevelSelectHub scaffolded as a new scene.

Requirements: INFRA-01 through INFRA-05, SCORE-04.

</domain>

<decisions>
## Implementation Decisions

### Files to DELETE (v1 platformer debris)
- `src/scenes/Level1Scene.js`
- `src/scenes/GameScene.js` (legacy, already replaced but still present)
- `src/sprites/Player.js`
- `src/sprites/Enemy.js`
- `src/sprites/Boss.js`
- `src/sprites/Coin.js`
- `src/sprites/Book.js`
- `src/data/level1Data.js`

### Files to KEEP (v2 infrastructure)
- `src/main.js` (entry point)
- `src/scenes/BootScene.js` (loading, registry init)
- `src/scenes/TitleScene.js` (will be extended)
- `src/scenes/HUDScene.js` (reused in mini-games)
- `src/systems/GameRegistry.js` (will be extended with v2 keys)
- `src/systems/StatsManager.js` (carries over)
- `src/config/GameConfig.js` (scene array updated)

### Files to CREATE
- `src/scenes/LevelSelectHub.js` — placeholder scene with "Level Select Hub (coming soon)" text, registered in scene array

### Files to MODIFY
- `src/scenes/TitleScene.js` — add HTML input element overlay below "PRESS SPACE TO START", read value on Space press, write to registry as PLAYER_NAME (fallback "friend"). Also support `?name=` URL param.
- `src/systems/GameRegistry.js` — add PLAYER_NAME key, add SCORE_L1 through SCORE_L5 keys, add default values in initRegistry
- `src/config/GameConfig.js` — remove Level1Scene from scene array, add LevelSelectHub. Keep BootScene, TitleScene, HUDScene, LevelSelectHub.
- `src/scenes/BootScene.js` — update transition target (still goes to TitleScene, no change needed)
- `src/scenes/TitleScene.js` — change `scene.start('Level1Scene')` to `scene.start('LevelSelectHub')`

### Technical Notes
- Name input: use Phaser's rexUI plugin? No — rexUI is Phaser 3. For v2, simpler approach: create an HTML `<input>` element overlaid on the Phaser canvas, read value via `document.getElementById()` on Space press. Cleaner, zero extra dependency.
- URL param parsing: `new URLSearchParams(window.location.search).get('name')` — read in TitleScene create().
- localStorage: inherited from StatsManager; no changes needed for persistence.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Registry key pattern in `src/systems/GameRegistry.js` — frozen KEYS object + initRegistry(scene) seeder
- Scene shutdown pattern — `this.events.once('shutdown', cleanupFn)` in every scene
- StatsManager.js — pure JS, no Phaser dep, handles localStorage

### Established Patterns
- ES module imports with `.js` extension
- Named exports (no default exports)
- `import * as Phaser from 'phaser'` for namespace import (Phaser 4 has no default export)
- 2-space indentation, no semicolons optional
- `this.events.once('shutdown', ...)` not `Phaser.Scenes.Events.SHUTDOWN` (namespace paths unreliable in v4 ESM)

### Integration Points
- `index.html` #game div is Phaser mount point — HTML input will be a sibling element positioned over it
- GameConfig.js scene array is the canonical scene registry

</code_context>

<specifics>
## Specific Ideas

Name input UX should be subtle and skippable. The opening cinematic in Phase 2 will use the name — so Phase 1 just needs to ensure PLAYER_NAME is populated (from input, URL param, or "friend" fallback) before TitleScene transitions.

</specifics>

<deferred>
## Deferred Ideas

- Visual polish of name input (styling, placeholder text, animations) — Phase 2
- The actual cinematic that uses the name — Phase 2

</deferred>
