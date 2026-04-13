# Codebase Structure

**Analysis Date:** 2026-04-13

## Directory Layout

```
video-game/
├── index.html                   # Entry point; container div and main.js loader
├── package.json                 # Project metadata (Phaser v4, Vite, Node.js)
├── package-lock.json            # Dependency lock file
├── src/                          # Source code (ES modules)
│   ├── main.js                   # Application entry; initializes Phaser.Game
│   ├── config/
│   │   └── GameConfig.js         # Centralized game configuration and scene registry
│   ├── scenes/
│   │   ├── BootScene.js          # Asset loading and initialization scene
│   │   ├── TitleScene.js         # Title screen and start prompt
│   │   └── GameScene.js          # Main gameplay scene with platforms and player
│   ├── sprites/                  # (Empty; placeholder for sprite classes)
│   ├── systems/                  # (Empty; placeholder for game systems)
│   └── assets/
│       └── hero.png              # Player/character sprite asset
├── public/
│   └── assets/
│       ├── audio/                # (Empty; placeholder for sound files)
│       ├── backgrounds/          # (Empty; placeholder for background images)
│       └── sprites/              # (Empty; placeholder for sprite sheets)
└── .planning/
    └── codebase/                 # Architecture and structure documentation
```

## Directory Purposes

**Root:**
- Purpose: Project configuration and build entry point
- Contains: HTML entry point, package management, git config, documentation
- Key files: `index.html`, `package.json`, `.gitignore`

**src/:**
- Purpose: Application source code (all ES modules)
- Contains: Game initialization, configuration, scenes, utilities
- Key files: `main.js` (app entry), `config/GameConfig.js` (engine config)

**src/config/:**
- Purpose: Centralized engine and game configuration
- Contains: Game initialization parameters (canvas size, physics, scene order)
- Key files: `GameConfig.js` (exported const object with Phaser.Game shape)

**src/scenes/:**
- Purpose: Scene classes managing distinct game states
- Contains: Three scene classes (Boot, Title, Game) extending Phaser.Scene
- Key files: `BootScene.js`, `TitleScene.js`, `GameScene.js`

**src/sprites/:**
- Purpose: Reusable sprite/entity classes (e.g., Player, Enemy, Platform)
- Contains: (Currently empty; placeholder for future sprite abstractions)
- Key files: None yet

**src/systems/:**
- Purpose: Reusable game systems (e.g., input handler, particle manager, animation controller)
- Contains: (Currently empty; placeholder for system abstractions)
- Key files: None yet

**src/assets/:**
- Purpose: Source assets (images, sprites, potentially before optimization)
- Contains: hero.png (player/character sprite)
- Key files: `hero.png`

**public/assets/:**
- Purpose: Static assets bundled with distribution (served directly)
- Contains: Three subdirectories for organizing game assets by type
- Key files: None yet (directories empty; ready for asset additions)

## Key File Locations

**Entry Points:**
- `index.html`: HTML document loaded by browser; contains `<div id="game">` and `<script src="/src/main.js">`
- `src/main.js`: ES module entry; imports GameConfig, instantiates Phaser.Game

**Configuration:**
- `src/config/GameConfig.js`: Export const with Phaser.Game config (type, width, height, physics, scene array, rendering)

**Core Game Logic:**
- `src/scenes/BootScene.js`: Asset loading and placeholder texture generation
- `src/scenes/TitleScene.js`: Title screen with text overlay and space key input listener
- `src/scenes/GameScene.js`: Gameplay scene with platforms, player entity, physics colliders, world bounds

**Assets:**
- `src/assets/hero.png`: Character sprite image
- `public/assets/`: Static assets directory (audio/, backgrounds/, sprites/ subdirectories)

## Naming Conventions

**Files:**
- PascalCase for scene classes: `BootScene.js`, `TitleScene.js`, `GameScene.js`
- camelCase for config/utility files: `GameConfig.js`, `main.js`
- Lowercase directories for feature groups: `scenes/`, `config/`, `sprites/`, `systems/`
- kebab-case for static assets in public/: `public/assets/audio/`, `backgrounds/`, `sprites/`

**Directories:**
- Feature-based grouping: scenes/ (state management), config/ (engine parameters), systems/ (reusable logic)
- Asset category grouping: audio/, backgrounds/, sprites/

**JavaScript Identifiers:**
- Scene identifiers (scene keys): UPPER_CASE when referenced as strings (e.g., 'BootScene', 'TitleScene', 'GameScene')
- Class names: PascalCase (BootScene, TitleScene, GameScene)
- Methods: camelCase (preload(), create(), setOrigin())
- Variables: camelCase (width, height, ground, player, prompt)

## Where to Add New Code

**New Scene:**
- Location: `src/scenes/[FeatureName]Scene.js`
- Pattern: `export class [FeatureName]Scene extends Phaser.Scene` with constructor, preload(), create()
- Register: Add to scene array in `src/config/GameConfig.js`
- Example: `src/scenes/PauseScene.js` for pause menu

**New Sprite Class:**
- Location: `src/sprites/[EntityName].js`
- Pattern: `export class [EntityName] extends Phaser.Physics.Arcade.Sprite` or custom class wrapping game objects
- Use in: Import and instantiate in scene create() methods
- Example: `src/sprites/Player.js` for player entity encapsulation

**New System (Reusable Logic):**
- Location: `src/systems/[SystemName].js`
- Pattern: `export class [SystemName]` with static methods or instance methods for scene reuse
- Use in: Import and instantiate/call in scenes
- Example: `src/systems/InputHandler.js` for centralized keyboard/gamepad input

**New Game Asset:**
- Static asset (image, audio): `public/assets/[category]/[filename]`
- Source asset: `src/assets/[filename]` (if preprocessing needed)
- Load in: BootScene.preload() via `this.load.image()`, `this.load.audio()`, etc.
- Example: `public/assets/sprites/enemy.png` for enemy sprite

**New Configuration:**
- Feature flags, difficulty levels, constants: `src/config/[FeatureName].js`
- Pattern: Export const objects or enums
- Import in: Scenes or systems that need the config
- Example: `src/config/Difficulty.js` for game difficulty parameters

## Special Directories

**node_modules/:**
- Purpose: Installed dependencies (Phaser 4, Vite)
- Generated: Yes (via npm install)
- Committed: No (in .gitignore)

**.git/:**
- Purpose: Git version control metadata
- Generated: Yes (via git init)
- Committed: No (system directory)

**.planning/codebase/:**
- Purpose: Architecture and structure documentation for future development
- Generated: Yes (by codebase mapper tool)
- Committed: Yes (reference for developers)

---

*Structure analysis: 2026-04-13*
