# Architecture

**Analysis Date:** 2026-04-13

## Pattern Overview

**Overall:** Phaser 4 Scene-based State Machine with Centralized Configuration

**Key Characteristics:**
- Scene-driven lifecycle management (BootScene → TitleScene → GameScene)
- Centralized game configuration (GameConfig.js) bootstraps all scenes and engine parameters
- Direct game object instantiation in Phaser 4 API (rectangles, text, physics bodies)
- Modular scene classes following Phaser constructor pattern (Scene extends Phaser.Scene)
- Physics engine integration via Phaser's Arcade physics system

## Layers

**Configuration Layer:**
- Purpose: Centralize game setup, scene ordering, physics defaults, and rendering options
- Location: `src/config/GameConfig.js`
- Contains: Game dimensions, physics config (gravity), scene registry, rendering mode, scale behavior
- Depends on: Phaser library, all Scene classes
- Used by: `src/main.js` to instantiate the Phaser.Game instance

**Scene Layer (Game State):**
- Purpose: Manage distinct game states and their lifecycles (Boot → Title → Gameplay)
- Location: `src/scenes/`
- Contains: BootScene.js (asset loading, placeholder creation), TitleScene.js (UI menu), GameScene.js (active gameplay)
- Depends on: Phaser library, input system, camera system, physics system
- Used by: Phaser engine lifecycle, scene transitions

**Game Objects & Visuals:**
- Purpose: Create and render on-screen entities (rectangles for platforms/player, text, graphics)
- Location: Inline within scene `create()` methods (GameScene.js, TitleScene.js)
- Contains: Rectangle geometry for platforms/player, text overlays, loading bar UI
- Depends on: Phaser rendering system, camera positioning
- Used by: Physics engine, input handlers, scene rendering pipeline

**Physics System:**
- Purpose: Handle collision detection, gravity, and rigid body dynamics
- Location: Integrated via Phaser Arcade physics (GameScene.js lines 27-37)
- Contains: Player dynamic body, static platform colliders, world bounds enforcement
- Depends on: Phaser physics engine configuration
- Used by: Scene lifecycle, frame update loop (implicit)

## Data Flow

**Game Initialization:**

1. `index.html` loads `src/main.js` as a module
2. `main.js` imports GameConfig and instantiates `new Phaser.Game(GameConfig)`
3. Phaser engine initializes with config and scene array [BootScene, TitleScene, GameScene]
4. BootScene starts automatically (first scene in array)

**Boot Phase:**

1. BootScene.preload() creates placeholder texture and loading bar
2. BootScene.create() transitions to TitleScene via `this.scene.start('TitleScene')`

**Title Phase:**

1. TitleScene.create() renders title text, subtitle, and blinking prompt
2. Keyboard input listener waits for SPACE key
3. On SPACE, transitions to GameScene via `this.scene.start('GameScene')`

**Gameplay Phase:**

1. GameScene.create() instantiates static platforms (rectangles with static physics bodies)
2. Creates dynamic player rectangle with arcade physics body
3. Registers colliders: player vs. [ground, plat1, plat2, plat3]
4. Sets world bounds and renders scene label
5. Frame loop runs implicitly, applying gravity and collision responses

**State Management:**
- No persistent state layer; each scene manages its own entities and lifecycle
- Scene transitions are unidirectional (Boot → Title → Game)
- No cross-scene state sharing currently implemented
- Physics state maintained by Phaser physics engine per scene

## Key Abstractions

**Scene:**
- Purpose: Encapsulate a distinct game state (loading, menu, gameplay)
- Examples: `src/scenes/BootScene.js`, `src/scenes/TitleScene.js`, `src/scenes/GameScene.js`
- Pattern: Extend Phaser.Scene, override preload() and/or create() lifecycle hooks
- Responsibilities: Initialize entities, bind input, manage transitions

**Game Configuration:**
- Purpose: Centralize engine parameters and scene registry (avoids magic strings scattered in code)
- Examples: `src/config/GameConfig.js` (dimensions, physics gravity, scene array)
- Pattern: Exported constant object with Phaser.Game configuration shape
- Responsibilities: Define canvas size, physics defaults, rendering mode, scene load order

**Physics Collider:**
- Purpose: Define rigid body interaction rules (platforms solid to player)
- Examples: Lines 31-34 in GameScene.js (player collides with platforms)
- Pattern: `this.physics.add.collider(bodyA, bodyB)` enables physics response
- Responsibilities: Handle collision response automatically (stops body penetration)

**Text Overlay:**
- Purpose: Render UI text (title, prompts, labels)
- Examples: TitleScene title/subtitle/prompt, GameScene label
- Pattern: `this.add.text(x, y, string, style)` with fontFamily/fontSize/color
- Responsibilities: Display game state information and player guidance

## Entry Points

**Application Entry:**
- Location: `index.html`
- Triggers: Browser loads page, requests module script
- Responsibilities: Provide DOM container (#game) and load main.js

**Game Engine Initialization:**
- Location: `src/main.js`
- Triggers: Module loads, Phaser.Game constructor called
- Responsibilities: Instantiate Phaser game instance with configuration

**Scene Bootstrap:**
- Location: `src/config/GameConfig.js` (scene array property)
- Triggers: Phaser engine initializes
- Responsibilities: Define scene load order (BootScene auto-starts)

## Error Handling

**Strategy:** No explicit error handling layer currently implemented

**Patterns:**
- Physics collisions handled implicitly by Phaser engine (no errors)
- Scene transitions assume scene keys exist (no validation)
- Input handling assumes keyboard available (no fallback)
- No try-catch blocks or error callbacks in current code

## Cross-Cutting Concerns

**Logging:** Not implemented. No console output or debug logging.

**Validation:** Not implemented. Physics and scene parameters assumed valid.

**Input Handling:** Keyboard input bound in scene create() methods (TitleScene space key, future GameScene controls in GameScene).

**Camera Management:** Uses default main camera; positioning handled via camera center references.

---

*Architecture analysis: 2026-04-13*
