# Coding Conventions

**Analysis Date:** 2026-04-13

## Naming Patterns

**Files:**
- PascalCase for class files: `BootScene.js`, `GameScene.js`, `TitleScene.js`
- PascalCase for exports: `GameConfig.js`
- Single purpose per file, matching exported class/object name
- `.js` extension (ES modules)

**Functions:**
- camelCase for methods: `preload()`, `create()`, `setCollideWorldBounds()`
- Lifecycle methods named after Phaser Scene callbacks: `preload`, `create`
- Private helpers would use camelCase prefix (none currently exist in codebase)

**Variables:**
- camelCase for local variables: `barW`, `barH`, `barX`, `barY`, `fill`, `ground`, `plat1`
- Abbreviated names acceptable for local scope (width → `w`, height → `h`)
- Descriptive names for game objects: `prompt`, `player`, `ground`
- Constants in PascalCase when part of config: GameConfig

**Types:**
- Classes extend Phaser.Scene using PascalCase constructor names: `BootScene extends Phaser.Scene`
- Object configuration uses camelCase properties: `fontFamily`, `fontSize`, `backgroundColor`

## Code Style

**Formatting:**
- No enforced formatter detected (no .prettierrc, eslint, or biome config)
- Consistent 2-space indentation observed in all source files
- No semicolons at end of statements (optional in ES modules)
- Braces on same line for control structures and methods

**Linting:**
- No linter configured (no .eslintrc files)
- Code relies on ES module imports with explicit `.js` extension

## Import Organization

**Order:**
1. External framework imports: `import Phaser from 'phaser'`
2. Internal relative imports: `import { BootScene } from '../scenes/BootScene.js'`
3. Imports use explicit `.js` extension for ES modules

**Path Aliases:**
- No path aliases configured
- Relative paths use standard `../` notation
- All imports from `src/` use relative paths from caller location

**Examples:**
- `src/main.js`: `import { GameConfig } from './config/GameConfig.js'`
- `src/config/GameConfig.js`: `import { BootScene } from '../scenes/BootScene.js'`

## Error Handling

**Patterns:**
- No explicit error handling in current codebase
- Phaser lifecycle methods (`preload`, `create`) rely on framework error propagation
- Graphics operations use framework error handling: `g.generateTexture()` assume success
- Physics operations assume valid configuration: `this.physics.add.collider()` no guards

**Future approach:**
- Event listeners use `.once()` for one-time events: `this.input.keyboard.once('keydown-SPACE')`
- Load events monitored: `this.load.on('progress', ...)` receives progress callback

## Logging

**Framework:** Console logging not used

**Patterns:**
- No structured logging in codebase
- Phaser scene labels used for UI feedback: `this.add.text()` with descriptive messages
- Example: `'GAME SCENE — Player on ground (no controls yet)'` as scene indicator

## Comments

**When to Comment:**
- Sparse commenting observed
- Comments used for major logic sections
- Example: `// Ground platform`, `// A couple of floating platforms`, `// Listen for space`
- Comments precede corresponding code block

**JSDoc/TSDoc:**
- Not used (JavaScript, not TypeScript)
- No type annotations
- Methods follow Phaser convention with self-explanatory names

## Function Design

**Size:** 
- Methods are small (10-15 lines max)
- BootScene.preload is largest at ~30 lines
- Create methods range 8-45 lines with clear single responsibility

**Parameters:**
- Phaser lifecycle methods accept no parameters (part of framework contract)
- Event callbacks receive event parameter: `(v) => { ... }` for progress
- Destructuring used for common properties: `const { width, height } = this.cameras.main`

**Return Values:**
- Lifecycle methods (`preload`, `create`) return nothing
- Methods typically return `undefined`
- Chaining not used (Phaser methods don't chain in these contexts)

## Module Design

**Exports:**
- Named exports for classes: `export class BootScene extends Phaser.Scene`
- Named exports for config objects: `export const GameConfig = { ... }`
- Single export per file is standard pattern

**Barrel Files:**
- Not used
- Each scene imported directly: `import { BootScene } from '../scenes/BootScene.js'`

## Object Configuration

**Style:**
- Configuration objects use object literal syntax: `const GameConfig = { ... }`
- Config objects expose as named exports for injection
- Phaser configuration follows framework conventions for known properties

**Example (GameConfig):**
```javascript
export const GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  physics: { ... },
  scene: [BootScene, TitleScene, GameScene],
};
```

## Game Object Creation

**Pattern:**
- Objects created via Phaser scene methods: `this.add.rectangle()`, `this.add.text()`, `this.physics.add.existing()`
- Physics bodies attached separately: `this.physics.add.existing(ground, true)` for static bodies
- Collision detection configured as explicit calls: `this.physics.add.collider()`

**Example:**
```javascript
const ground = this.add.rectangle(width / 2, height - 32, width, 64, 0x444466);
this.physics.add.existing(ground, true); // true = static body
this.physics.add.collider(this.player, ground);
```

## Magic Numbers

**Approach:**
- Magic numbers used directly in code
- Hardcoded values for game constants: `width: 1280`, `height: 720`, `gravity: { y: 800 }`
- Local magic numbers for calculations: `barW = 300`, `barH = 20`

**Future improvement:** Extract game constants to separate configuration object

---

*Convention analysis: 2026-04-13*
