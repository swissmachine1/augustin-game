# Phase 1: Architecture & Game Flow - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

The game skeleton runs in the browser with correct scene flow, Registry-based state, and teardown safety. Delivers: GameRegistry module with typed constants, Boot → Title → Game scene flow with fade transitions, death/respawn system, and scene shutdown handlers that clean up event listeners.

Requirements: ARCH-01 (GameRegistry typed constants), ARCH-02 (Registry-based cross-scene state), ARCH-03 (scene shutdown cleanup), ARCH-04 (Player class module), FLOW-01 (boot/loading), FLOW-02 (title screen), FLOW-03 (fade transitions), FLOW-04 (death/respawn).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

Key guidance from research:
- Use `this.registry` (Phaser's global Data Manager) for cross-scene state
- Define registry keys as typed constants in `src/systems/GameRegistry.js`
- Register `this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanupFn)` in every scene's create()
- Player class should be in `src/sprites/Player.js` extending Phaser.GameObjects.Sprite (or Rectangle for placeholder)
- Scene transitions use fade-to-black via camera effects
- Phaser 4 API only — verify against v4 migration guide, not v3 tutorials

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/config/GameConfig.js` — existing Phaser config with physics, scale, scenes array
- `src/scenes/BootScene.js` — existing boot with loading bar and placeholder texture generation
- `src/scenes/TitleScene.js` — existing title with blinking text and space key handler
- `src/scenes/GameScene.js` — existing game scene with static platforms and player rect (no controls)

### Established Patterns
- ES module imports/exports throughout
- Named exports for scene classes
- Phaser.Scene subclasses with constructor key registration
- Physics bodies created via `this.physics.add.existing()`

### Integration Points
- `GameConfig.js` scene array needs updating when new scenes are added
- `index.html` div#game is the mount point
- `src/main.js` is the entry point that creates the Phaser.Game instance

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Refer to ROADMAP phase description and success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>
