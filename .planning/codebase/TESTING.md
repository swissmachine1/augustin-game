# Testing Patterns

**Analysis Date:** 2026-04-13

## Current State

**No tests exist in this codebase.**

Testing infrastructure is not yet established. This document provides recommended patterns and setup for future test implementation.

## Recommended Test Framework

**Runner:**
- Vitest - Recommended for modern ES modules and Phaser 4
- Zero-config support for `.js` ES modules
- Fast execution and watch mode
- Native TypeScript support (for future TS migration)

**Alternative:**
- Jest with ES module configuration (requires additional setup)

**Assertion Library:**
- Vitest includes chai assertions by default
- Or use `node:assert` for simple assertions

## Test Setup Commands

```bash
npm install -D vitest

# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Recommended Test File Organization

**Location:**
- Co-located pattern recommended
- Test files in same directory as source
- Example: `src/scenes/GameScene.test.js` next to `src/scenes/GameScene.js`

**Naming:**
- `*.test.js` extension for all test files
- Matches source file name: `GameScene.js` → `GameScene.test.js`

**Structure:**
```
src/
├── scenes/
│   ├── BootScene.js
│   ├── BootScene.test.js
│   ├── GameScene.js
│   ├── GameScene.test.js
│   ├── TitleScene.js
│   └── TitleScene.test.js
├── config/
│   ├── GameConfig.js
│   └── GameConfig.test.js
└── main.js
```

## Test Structure Pattern

For Phaser scene testing with Vitest:

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Phaser from 'phaser';
import { GameScene } from './GameScene.js';

describe('GameScene', () => {
  let game;
  let scene;

  beforeEach(() => {
    // Create minimal game instance for scene testing
    game = new Phaser.Game({
      type: Phaser.HEADLESS,
      scene: GameScene,
      physics: {
        default: 'arcade',
        arcade: { gravity: { y: 800 } },
      },
    });
    scene = game.scene.getScene('GameScene');
  });

  afterEach(() => {
    // Clean up game instance
    game.destroy(true);
  });

  it('should create game scene', () => {
    expect(scene).toBeDefined();
    expect(scene.physics).toBeDefined();
  });
});
```

## Mocking Strategy

**What to Mock:**
- Phaser input system: `this.input.keyboard` events
- Physics callbacks: collision callbacks, overlap callbacks
- Asset loading: defer actual asset loading to integration tests

**What NOT to Mock:**
- Phaser Scene lifecycle (use framework's lifecycle directly)
- Game object creation: test actual game object properties
- Physics simulation: test collision detection with real bodies

**Mocking Keyboard Input Example:**

```javascript
it('should transition to GameScene on space press', () => {
  const scene = game.scene.getScene('TitleScene');
  
  // Simulate space key press
  scene.input.keyboard.emit('keydown-SPACE');
  
  // Assert scene transition occurred
  expect(game.scene.isActive('GameScene')).toBe(true);
});
```

**Mocking Physics Callbacks Example:**

```javascript
it('should trigger collision when player hits ground', () => {
  const scene = game.scene.getScene('GameScene');
  const collisionCallback = vitest.fn();
  
  // Override collision handler for testing
  scene.physics.add.collider(
    scene.player,
    scene.ground,
    collisionCallback
  );
  
  // Simulate physics step
  game.scene.pause();
  game.physics.world.step(16); // 16ms step
  
  // Assert collision was detected
  expect(scene.player.body.touching.down).toBe(true);
});
```

## Test Fixtures

**Test Data Pattern:**

```javascript
// fixtures/GameConfigs.test.js
export const createTestGameConfig = (overrides = {}) => ({
  type: Phaser.HEADLESS,
  width: 1280,
  height: 720,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 800 } },
  },
  ...overrides,
});

export const createTestScene = (SceneClass, config = {}) => {
  const game = new Phaser.Game({
    ...createTestGameConfig(),
    scene: SceneClass,
  });
  return game.scene.getScene(SceneClass.name || 'default');
};
```

**Usage:**

```javascript
import { createTestScene } from '../fixtures/GameConfigs.test.js';

it('creates scene with custom config', () => {
  const scene = createTestScene(GameScene, {
    physics: { arcade: { gravity: { y: 0 } } },
  });
  expect(scene.physics.world.gravity.y).toBe(0);
});
```

## Test Types

**Unit Tests:**
- Test individual methods: scene initialization, property updates
- Test configuration objects: GameConfig properties and values
- Scope: Single class or function
- Example: Test that GameConfig has correct width/height

```javascript
it('should have correct game dimensions', () => {
  expect(GameConfig.width).toBe(1280);
  expect(GameConfig.height).toBe(720);
});
```

**Integration Tests:**
- Test scene interactions: transitions between scenes
- Test physics: collision detection between entities
- Test input: keyboard events trigger scene changes
- Scope: Multiple components working together

```javascript
it('should transition from TitleScene to GameScene', () => {
  const game = new Phaser.Game({
    type: Phaser.HEADLESS,
    scene: [TitleScene, GameScene],
  });
  const title = game.scene.getScene('TitleScene');
  
  // Trigger transition
  title.input.keyboard.emit('keydown-SPACE');
  
  expect(game.scene.isActive('GameScene')).toBe(true);
  expect(game.scene.isActive('TitleScene')).toBe(false);
});
```

**E2E Tests:**
- Not recommended for Phaser games (full browser automation not typical)
- Use integration tests with headless Phaser instead
- If needed: Playwright or Cypress with visual regression testing

## Async Testing Pattern

For physics and animation testing:

```javascript
it('should update position over time', async () => {
  const scene = game.scene.getScene('GameScene');
  const initialY = scene.player.y;
  
  // Step physics simulation
  for (let i = 0; i < 10; i++) {
    game.physics.world.step(16);
  }
  
  // Player should fall due to gravity
  expect(scene.player.y).toBeGreaterThan(initialY);
});
```

## Testing Game Objects

**Testing Rectangle Creation:**

```javascript
it('should create ground with correct properties', () => {
  const scene = game.scene.getScene('GameScene');
  
  expect(scene.children.length).toBeGreaterThan(0);
  const groundObject = scene.children.entries.find(
    child => child === scene.ground
  );
  expect(groundObject).toBeDefined();
  expect(groundObject.width).toBe(1280);
});
```

**Testing Text Display:**

```javascript
it('should display title text', () => {
  const scene = game.scene.getScene('TitleScene');
  
  const texts = scene.children.entries.filter(
    child => child instanceof Phaser.GameObjects.Text
  );
  const titleText = texts.find(t => t.text === 'THE AUGUSTIN FILES');
  
  expect(titleText).toBeDefined();
  expect(titleText.style.fontSize).toBe('48px');
});
```

## Coverage Goals

**Recommended Targets:**
- Unit test coverage: 70%+ for game logic
- Integration test coverage: 50%+ for scene interactions
- Critical paths: 100% for collision detection, scene transitions

**View Coverage:**
```bash
npm run test:coverage
```

## Phaser-Specific Testing Considerations

**Headless Mode:**
- Use `type: Phaser.HEADLESS` for faster tests
- No canvas rendering required
- Allows physics and input testing without DOM

**Game Instance Cleanup:**
- Always call `game.destroy(true)` in afterEach
- Prevents memory leaks in test suite
- Clears all scenes and objects

**Physics Testing:**
- Use `game.physics.world.step(deltaTime)` to advance physics simulation
- Test collision bodies with `body.touching` properties
- Example: `expect(sprite.body.touching.down).toBe(true)` for ground collision

**Scene Lifecycle:**
- Scenes emit lifecycle events: `create`, `update`, `shutdown`
- Can listen to events: `scene.events.on('create', callback)`
- Test initialization with `scene.isActive()` and `scene.isPaused()`

## CI/CD Testing

**Add to package.json scripts:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage"
  }
}
```

**GitHub Actions Example:**

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run test:coverage
```

---

*Testing analysis: 2026-04-13*
