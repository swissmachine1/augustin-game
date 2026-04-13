<!-- GSD:project-start source:PROJECT.md -->
## Project

**The Augustin Files**

A pixel-art 2D platformer that transforms Augustin Romaneschi's career journey into a playable video game. Instead of a traditional CV, recruiters play through 3 levels representing career chapters — from Shanghai startup weekend to $1M ARR in Latin America to the final interview room. Built with Phaser 4 and designed to be sent as a link to hiring managers.

**Core Value:** The game must be fun enough to play through to the end AND tell a compelling career story — if either fails, the game fails as a job application tool.

### Constraints

- **Tech stack**: Phaser 4 + Vite + vanilla JavaScript (ES modules) — already committed
- **No backend**: Pure client-side game, no server needed
- **Assets**: Placeholder-first — all gameplay must work with colored rectangles before real art is swapped in
- **Performance**: Must run smoothly on any modern browser (WebGL with Canvas fallback)
- **Quality**: Gameplay feel matters — movement should feel like Celeste/Mario, not a student project
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- JavaScript (ES6+) - All source code, game logic, and scenes
- HTML5 - Entry point markup
- CSS3 - Minimal styling (reset only, game renders via Phaser canvas)
## Runtime
- Node.js 20+ - Development and build environment
- npm 10+ (inferred from package-lock.json v3)
- Lockfile: Present (`package-lock.json`)
## Frameworks
- Phaser 4.0.0 - Game engine for 2D platformer development
- Vite 8.0.4 - Build tool and dev server
## Key Dependencies
- phaser (^4.0.0) - Only production dependency; handles all game rendering, physics, input, tweening, and scene management
- vite (^8.0.4) - Dev server and build toolchain
## Build Configuration
- Entry point: `index.html` references `/src/main.js` as module script
- Output target: ES2020+ (modern JavaScript)
- Default output: `dist/` directory (standard Vite build output)
- Viewport: 1280x720 (fixed dimensions in `src/config/GameConfig.js`)
- Physics: Arcade physics with gravity 800 (y-axis)
- Scaling: FIT mode with CENTER_BOTH auto-centering
- Rendering: Pixel-art mode enabled for crisp sprite rendering
- Parent element: `#game` div in HTML
## Configuration Files
- `package.json` - Version 0.0.0, type: "module" (ES6 modules), private project
- `npm run dev` - Start Vite dev server with HMR
- `npm run build` - Create optimized production build
- `npm run preview` - Preview production build locally
- `src/config/GameConfig.js` - Centralized Phaser game config with scenes, physics, scaling
## Platform Requirements
- Node.js 20+
- npm 10+ (or yarn/pnpm)
- Modern browser with WebGL support (fallback to Canvas)
- Terminal/CLI for running npm scripts
- Modern browser (Chrome, Firefox, Safari, Edge)
- WebGL or Canvas 2D rendering support
- No server required (static build output)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- PascalCase for class files: `BootScene.js`, `GameScene.js`, `TitleScene.js`
- PascalCase for exports: `GameConfig.js`
- Single purpose per file, matching exported class/object name
- `.js` extension (ES modules)
- camelCase for methods: `preload()`, `create()`, `setCollideWorldBounds()`
- Lifecycle methods named after Phaser Scene callbacks: `preload`, `create`
- Private helpers would use camelCase prefix (none currently exist in codebase)
- camelCase for local variables: `barW`, `barH`, `barX`, `barY`, `fill`, `ground`, `plat1`
- Abbreviated names acceptable for local scope (width → `w`, height → `h`)
- Descriptive names for game objects: `prompt`, `player`, `ground`
- Constants in PascalCase when part of config: GameConfig
- Classes extend Phaser.Scene using PascalCase constructor names: `BootScene extends Phaser.Scene`
- Object configuration uses camelCase properties: `fontFamily`, `fontSize`, `backgroundColor`
## Code Style
- No enforced formatter detected (no .prettierrc, eslint, or biome config)
- Consistent 2-space indentation observed in all source files
- No semicolons at end of statements (optional in ES modules)
- Braces on same line for control structures and methods
- No linter configured (no .eslintrc files)
- Code relies on ES module imports with explicit `.js` extension
## Import Organization
- No path aliases configured
- Relative paths use standard `../` notation
- All imports from `src/` use relative paths from caller location
- `src/main.js`: `import { GameConfig } from './config/GameConfig.js'`
- `src/config/GameConfig.js`: `import { BootScene } from '../scenes/BootScene.js'`
## Error Handling
- No explicit error handling in current codebase
- Phaser lifecycle methods (`preload`, `create`) rely on framework error propagation
- Graphics operations use framework error handling: `g.generateTexture()` assume success
- Physics operations assume valid configuration: `this.physics.add.collider()` no guards
- Event listeners use `.once()` for one-time events: `this.input.keyboard.once('keydown-SPACE')`
- Load events monitored: `this.load.on('progress', ...)` receives progress callback
## Logging
- No structured logging in codebase
- Phaser scene labels used for UI feedback: `this.add.text()` with descriptive messages
- Example: `'GAME SCENE — Player on ground (no controls yet)'` as scene indicator
## Comments
- Sparse commenting observed
- Comments used for major logic sections
- Example: `// Ground platform`, `// A couple of floating platforms`, `// Listen for space`
- Comments precede corresponding code block
- Not used (JavaScript, not TypeScript)
- No type annotations
- Methods follow Phaser convention with self-explanatory names
## Function Design
- Methods are small (10-15 lines max)
- BootScene.preload is largest at ~30 lines
- Create methods range 8-45 lines with clear single responsibility
- Phaser lifecycle methods accept no parameters (part of framework contract)
- Event callbacks receive event parameter: `(v) => { ... }` for progress
- Destructuring used for common properties: `const { width, height } = this.cameras.main`
- Lifecycle methods (`preload`, `create`) return nothing
- Methods typically return `undefined`
- Chaining not used (Phaser methods don't chain in these contexts)
## Module Design
- Named exports for classes: `export class BootScene extends Phaser.Scene`
- Named exports for config objects: `export const GameConfig = { ... }`
- Single export per file is standard pattern
- Not used
- Each scene imported directly: `import { BootScene } from '../scenes/BootScene.js'`
## Object Configuration
- Configuration objects use object literal syntax: `const GameConfig = { ... }`
- Config objects expose as named exports for injection
- Phaser configuration follows framework conventions for known properties
## Game Object Creation
- Objects created via Phaser scene methods: `this.add.rectangle()`, `this.add.text()`, `this.physics.add.existing()`
- Physics bodies attached separately: `this.physics.add.existing(ground, true)` for static bodies
- Collision detection configured as explicit calls: `this.physics.add.collider()`
## Magic Numbers
- Magic numbers used directly in code
- Hardcoded values for game constants: `width: 1280`, `height: 720`, `gravity: { y: 800 }`
- Local magic numbers for calculations: `barW = 300`, `barH = 20`
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Scene-driven lifecycle management (BootScene → TitleScene → GameScene)
- Centralized game configuration (GameConfig.js) bootstraps all scenes and engine parameters
- Direct game object instantiation in Phaser 4 API (rectangles, text, physics bodies)
- Modular scene classes following Phaser constructor pattern (Scene extends Phaser.Scene)
- Physics engine integration via Phaser's Arcade physics system
## Layers
- Purpose: Centralize game setup, scene ordering, physics defaults, and rendering options
- Location: `src/config/GameConfig.js`
- Contains: Game dimensions, physics config (gravity), scene registry, rendering mode, scale behavior
- Depends on: Phaser library, all Scene classes
- Used by: `src/main.js` to instantiate the Phaser.Game instance
- Purpose: Manage distinct game states and their lifecycles (Boot → Title → Gameplay)
- Location: `src/scenes/`
- Contains: BootScene.js (asset loading, placeholder creation), TitleScene.js (UI menu), GameScene.js (active gameplay)
- Depends on: Phaser library, input system, camera system, physics system
- Used by: Phaser engine lifecycle, scene transitions
- Purpose: Create and render on-screen entities (rectangles for platforms/player, text, graphics)
- Location: Inline within scene `create()` methods (GameScene.js, TitleScene.js)
- Contains: Rectangle geometry for platforms/player, text overlays, loading bar UI
- Depends on: Phaser rendering system, camera positioning
- Used by: Physics engine, input handlers, scene rendering pipeline
- Purpose: Handle collision detection, gravity, and rigid body dynamics
- Location: Integrated via Phaser Arcade physics (GameScene.js lines 27-37)
- Contains: Player dynamic body, static platform colliders, world bounds enforcement
- Depends on: Phaser physics engine configuration
- Used by: Scene lifecycle, frame update loop (implicit)
## Data Flow
- No persistent state layer; each scene manages its own entities and lifecycle
- Scene transitions are unidirectional (Boot → Title → Game)
- No cross-scene state sharing currently implemented
- Physics state maintained by Phaser physics engine per scene
## Key Abstractions
- Purpose: Encapsulate a distinct game state (loading, menu, gameplay)
- Examples: `src/scenes/BootScene.js`, `src/scenes/TitleScene.js`, `src/scenes/GameScene.js`
- Pattern: Extend Phaser.Scene, override preload() and/or create() lifecycle hooks
- Responsibilities: Initialize entities, bind input, manage transitions
- Purpose: Centralize engine parameters and scene registry (avoids magic strings scattered in code)
- Examples: `src/config/GameConfig.js` (dimensions, physics gravity, scene array)
- Pattern: Exported constant object with Phaser.Game configuration shape
- Responsibilities: Define canvas size, physics defaults, rendering mode, scene load order
- Purpose: Define rigid body interaction rules (platforms solid to player)
- Examples: Lines 31-34 in GameScene.js (player collides with platforms)
- Pattern: `this.physics.add.collider(bodyA, bodyB)` enables physics response
- Responsibilities: Handle collision response automatically (stops body penetration)
- Purpose: Render UI text (title, prompts, labels)
- Examples: TitleScene title/subtitle/prompt, GameScene label
- Pattern: `this.add.text(x, y, string, style)` with fontFamily/fontSize/color
- Responsibilities: Display game state information and player guidance
## Entry Points
- Location: `index.html`
- Triggers: Browser loads page, requests module script
- Responsibilities: Provide DOM container (#game) and load main.js
- Location: `src/main.js`
- Triggers: Module loads, Phaser.Game constructor called
- Responsibilities: Instantiate Phaser game instance with configuration
- Location: `src/config/GameConfig.js` (scene array property)
- Triggers: Phaser engine initializes
- Responsibilities: Define scene load order (BootScene auto-starts)
## Error Handling
- Physics collisions handled implicitly by Phaser engine (no errors)
- Scene transitions assume scene keys exist (no validation)
- Input handling assumes keyboard available (no fallback)
- No try-catch blocks or error callbacks in current code
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
