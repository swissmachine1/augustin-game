# Architecture Patterns

**Domain:** 2D pixel-art platformer (career CV game)
**Project:** The Augustin Files
**Researched:** 2026-04-13
**Confidence:** HIGH (verified against official Phaser docs + community production patterns)

---

## Recommended Architecture

The game uses a **layered scene stack** where scenes run in parallel at different rendering depths, combined with a **class-per-entity** pattern (inheritance over ECS for this scale) and a **centralized Registry** for cross-scene state.

```
┌─────────────────────────────────────┐
│           HUDScene (launch)         │  ← always on top, depth 100
│   health | coins | XP | inventory  │
├─────────────────────────────────────┤
│       Active Level Scene            │  ← gameplay, depth 10
│  Level1Scene / Level2Scene /        │
│  Level5Scene (one at a time)        │
├─────────────────────────────────────┤
│        Persistent Scenes            │  ← depth 0
│  BootScene → TitleScene             │
│  TransitionScene (fades/overlays)   │
└─────────────────────────────────────┘

Shared state via:  this.registry (game-global Data Manager)
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `BootScene` | Preload all shared assets (atlas, fonts, audio) | Starts `TitleScene` |
| `TitleScene` | Main menu (Play / Continue / Chapter Select), URL param parsing | Starts level scenes; writes to Registry |
| `Level1Scene` | Shanghai gameplay: platforms, collectibles, enemies, boss | Reads/writes Registry; launches HUDScene |
| `Level2Scene` | Latin America gameplay: language meter, flag collectibles, NPCs | Reads/writes Registry; launches HUDScene |
| `Level5Scene` | Interview Room: dialogue tree, stats recap, CTAs | Reads Registry (final stats); no HUD |
| `HUDScene` | Renders health, coins, XP, inventory, stats overlay | Reads Registry reactively via `changedata` event |
| `TransitionScene` | Fade in/out, screen shake, particle burst between levels | Launched by level scenes; stops itself |
| `Player` (class) | Input, movement physics, animation state machine | Owned by level scene; emits events to scene |
| `Enemy` (class) | Patrol/attack AI, hitbox, death | Owned by level scene |
| `GameRegistry` (module) | Typed constants for all registry keys | Imported everywhere; no runtime dep |
| `StatsSystem` (module) | Pure functions for calculating derived stats | Called by scenes; no Phaser dep |
| `AudioManager` | Music playback with cross-scene persistence | Runs as a launched scene or singleton |

---

## Data Flow

### Player State (persists across levels)

```
URL params → TitleScene
         → registry.set('playerName', ...)
         → registry.set('companyName', ...)

Level1Scene ends
         → registry.set('stats.sales', value)
         → registry.set('stats.tech', value)
         → registry.set('inventory', [...items])
         → registry.set('health', remaining)

Level2Scene starts
         → reads registry.get('stats.*')
         → reads registry.get('inventory')
         → initializes player from persisted state
```

### HUD Reactive Updates

```
Player.takeDamage()
  → scene.registry.set('health', newValue)
    → HUDScene listens: this.registry.events.on('changedata', ...)
      → HUDScene re-renders health bar immediately
```

### Level Completion Flow

```
LevelScene.onBossDefeated()
  → writes final stats to registry
  → this.scene.launch('TransitionScene', { nextLevel: 'Level2Scene' })
  → TransitionScene fades out
  → TransitionScene stops LevelScene, stops HUDScene
  → TransitionScene starts next level
  → next level re-launches HUDScene
```

### Dialogue / CTA Flow (Level 5 only)

```
Level5Scene
  → reads all registry stats (sales, tech, grit, EQ, languages...)
  → DialogueSystem renders stat recap
  → CTA buttons (email, LinkedIn, CV download)
  → no level completion → open-ended scene
```

---

## Scene Setup Pattern

Every level scene follows this internal structure:

```javascript
class Level1Scene extends Phaser.Scene {
  constructor() { super('Level1Scene'); }

  init(data) {
    // Receive data from transition OR read from registry
    // Never put game logic here
  }

  preload() {
    // Level-specific assets only (shared assets loaded in Boot)
  }

  create() {
    this._buildLevel();      // platforms, tiles, decorations
    this._spawnPlayer();     // Player class instance
    this._spawnEnemies();    // Enemy group
    this._setupMechanic();   // Level-unique mechanic (see below)
    this._setupCamera();     // follow player, world bounds, parallax
    this._setupColliders();  // physics collisions
    this._setupHUD();        // this.scene.launch('HUDScene')
    this._setupAudio();      // music for this level
  }

  update(time, delta) {
    this.player.update(time, delta);
    this.enemies.preUpdate(time, delta);  // Group handles iteration
    this._mechanicUpdate(time, delta);   // Level-unique mechanic update
  }
}
```

---

## Entity Class Hierarchy

Use **class extension of Phaser.GameObjects.Sprite**, not a full ECS. The project has 3 levels and clear entity types — ECS overhead is not justified.

```
Phaser.GameObjects.Sprite
├── Player                  ← shared across all levels
│   ├── InputHandler        ← keyboard/gamepad abstraction (composition)
│   ├── StateMachine        ← idle|run|jump|fall|hurt|dead states
│   └── AnimationController ← maps state → animation key
├── Enemy (base)
│   ├── GroundPatrol        ← Level 1: left/right patrol, turns at edge
│   ├── BossShanghai        ← Level 1 boss
│   ├── NPCVendor           ← Level 2: talk-triggerable NPC
│   └── BossLatAm           ← Level 2 boss
├── Collectible (base)
│   ├── CoinCollectible     ← Level 1
│   ├── FlagCollectible     ← Level 2
│   └── PowerUpItem         ← inventory items (Clay, n8n, etc.)
└── DialogueBox             ← Level 5, not a physics object
```

**Manual registration required** — Phaser sprites don't add themselves to scenes:
```javascript
// In level create():
this.player = new Player(this, x, y);
this.add.existing(this.player);
this.physics.add.existing(this.player);
```

---

## Per-Level Unique Mechanics (Clean Isolation Pattern)

Each level-unique mechanic lives in its own module file and is instantiated by the owning scene. The scene calls `mechanic.create(scene)` / `mechanic.update(time, delta)` / `mechanic.destroy()`. This keeps level scenes readable and makes mechanics independently testable.

### Level 1: Collectibles + Enemy System
```
src/mechanics/CollectibleSystem.js
  - Creates coin group, handles overlap with player
  - Updates registry on collect
  - Nothing else touches this file
```

### Level 2: Language Meter
```
src/mechanics/LanguageMeter.js
  - Tracks meter value (0–100) in local state
  - Reads NPC interaction events (emitted by NPCVendor)
  - Writes final meter value to registry on level end
  - Renders own UI bar (separate from HUD)
```

### Level 5: Dialogue Tree + CTAs
```
src/mechanics/DialogueSystem.js
  - Reads from data/dialogue.json (content lives in data, not code)
  - Manages dialogue state machine (node → choice → node)
  - Emits 'dialogueComplete' event when tree exhausted
  - CTAPanel.js renders links/buttons on dialogue end
```

**Rule:** Level mechanics modules MUST NOT read from other levels' mechanics modules. All cross-level data passes through `this.registry` only.

---

## State Architecture

### Registry Key Schema

All keys defined in `src/systems/GameRegistry.js` as constants:

```javascript
export const REGISTRY = {
  // Player progression
  HEALTH:         'player.health',
  MAX_HEALTH:     'player.maxHealth',
  COINS:          'player.coins',
  XP:             'player.xp',

  // Stats (7 stats)
  STAT_SALES:     'stats.sales',
  STAT_TECH:      'stats.tech',
  STAT_GRIT:      'stats.grit',
  STAT_EQ:        'stats.eq',
  STAT_LANGUAGES: 'stats.languages',
  STAT_INDEPENDENCE: 'stats.independence',
  STAT_TEAMPLAYER:   'stats.teamplayer',

  // Inventory (array of item keys)
  INVENTORY:      'player.inventory',

  // Personalization (from URL params)
  COMPANY_NAME:   'meta.company',
  RECRUITER_NAME: 'meta.recruiterName',
  ROLE_NAME:      'meta.role',

  // Progress
  CURRENT_LEVEL:  'progress.currentLevel',
  LEVELS_CLEARED: 'progress.levelsCleared',
};
```

### What Goes Where

| State type | Storage | Lifetime |
|-----------|---------|----------|
| Player movement, physics | `this.player.body` | Frame |
| Current level temp state | Scene local variables | Scene lifetime |
| Level mechanics state | Mechanic class instance | Scene lifetime |
| Player stats, inventory, health | `this.registry` | Game session |
| URL params (company, name) | `this.registry` | Game session |
| Dialogue progress | `DialogueSystem` instance | Level 5 scene only |
| High score / continue | `localStorage` | Browser persistent |

---

## Programmatic Level Generation (No Tiled)

Per PROJECT.md decision, levels are built in code not Tiled. Use a **level data object** pattern:

```javascript
// src/data/level1Data.js
export const LEVEL_1 = {
  worldWidth: 3200,
  worldHeight: 768,
  platforms: [
    { x: 0, y: 704, w: 3200, h: 64, type: 'ground' },
    { x: 300, y: 560, w: 200, h: 20, type: 'platform' },
    // ...
  ],
  enemies: [
    { x: 600, y: 560, type: 'GroundPatrol' },
    // ...
  ],
  collectibles: [
    { x: 350, y: 520, type: 'coin' },
    // ...
  ],
  spawnPoint: { x: 100, y: 650 },
  exitPoint: { x: 3100, y: 650 },
};
```

Level scene reads this data in `_buildLevel()`. Swapping level layouts = editing data files, not scene logic.

---

## Camera + Parallax

```
World bounds: this.physics.world.setBounds(0, 0, level.worldWidth, level.worldHeight)
Camera follow: this.cameras.main.startFollow(this.player, true, 0.1, 0.1) // lerp
Parallax:      Background layers as separate game objects with different scroll factors
               layer.setScrollFactor(0.2) // moves at 20% of camera speed
HUD exemption: HUDScene has its own camera unaffected by game camera
```

---

## Audio Architecture

Run `AudioScene` as a persistent launched scene (like HUDScene):

```
AudioScene (launched once in Boot, never stopped)
  - listens for 'playMusic' / 'stopMusic' / 'playSFX' events on game.events
  - manages crossfades between level themes
  - level scenes emit: this.game.events.emit('playMusic', 'level1_theme')
```

This prevents music cut when scenes transition (common Phaser gotcha).

---

## Suggested Build Order (Dependency Graph)

```
1. GameRegistry.js          — no deps, defines all keys
   ↓
2. Player class             — needs registry schema, arcade physics
   ↓
3. BootScene + asset pipeline — loads all shared textures
   ↓
4. TitleScene               — needs Boot complete, registry
   ↓
5. HUDScene                 — needs registry schema, launched by levels
   ↓
6. Level1Scene (simplest)   — needs Player, HUD, registry
   CollectibleSystem         — mechanic for Level 1
   Enemy/GroundPatrol        — first enemy type
   ↓
7. Level2Scene              — adds LanguageMeter mechanic, NPC type
   LanguageMeter             — mechanic for Level 2
   NPCVendor                 — new entity type
   ↓
8. Level5Scene              — no physics-heavy gameplay
   DialogueSystem            — reads all stats, no phaser physics dep
   CTAPanel                  — pure UI, no physics dep
   ↓
9. TransitionScene          — wires all levels together
   AudioScene                — persistent music management
   ↓
10. URL param system        — TitleScene reads params, writes to registry
    localStorage save/load  — continue feature
```

---

## Anti-Patterns to Avoid

### 1. Monolithic GameScene
**What:** Putting all 3 levels into one scene with conditional logic.
**Why bad:** Unmanageable at 3000+ lines. Levels can't be independently iterated.
**Instead:** Separate scene per level. Scene start/stop is cheap in Phaser.

### 2. Passing State via Scene Parameters Alone
**What:** Using only `this.scene.start('Level2', { health, stats })` for state transfer.
**Why bad:** If scene restarts (death/retry), init data is lost. State only lives in the start call.
**Instead:** Write to registry at stat change time. Read from registry in init. Scene params are for trigger data only, not canonical state.

### 3. Game Objects Accessing Scenes Directly
**What:** `this.player.scene.registry.get(...)` inside Player class.
**Why bad:** Creates tight coupling between entities and specific scenes. Hard to reuse Player across levels.
**Instead:** Scene passes data to Player via method calls. Player emits events, scene listens and writes registry.

### 4. HUD in Game Scene
**What:** Adding health bars, XP text directly to the level scene.
**Why bad:** Camera transforms affect world-space UI. Must manually undo scroll offset. Breaks during transitions.
**Instead:** HUDScene launched alongside game scene. HUD camera is fixed (no scroll).

### 5. Hardcoding Level Content in Scene Logic
**What:** `if (x > 300 && x < 500) spawnEnemy()` scattered through create().
**Why bad:** Impossible to tune level feel without reading JS code.
**Instead:** Level data objects (src/data/level1Data.js) as the single source of truth for layout.

---

## Scalability Notes

This game is a 3-level portfolio project, not a commercial title. The architecture should be **simple and direct**, not over-engineered.

| Concern | MVP approach | If game expands (v2+) |
|---------|-------------|----------------------|
| 3 levels | One scene per level | Abstract BaseLevel class |
| 7 stats | Hard-coded registry keys | Stats config JSON |
| Enemies | Class per type | Consider ECS (Phatty) |
| Audio | Simple AudioScene | Full audio state machine |
| Save | localStorage simple | Versioned save schema |

---

## Sources

- Phaser official docs — Scenes: https://docs.phaser.io/phaser/concepts/scenes
- Phaser official docs — Cross-Scene Communication: https://docs.phaser.io/phaser/concepts/scenes/cross-scene-communication
- Phaser official docs — Game Objects: https://docs.phaser.io/phaser/concepts/gameobjects
- Phaser official docs — Arcade Physics: https://docs.phaser.io/phaser/concepts/physics/arcade
- Phaser production architecture gist (Kemal Mus): https://gist.github.com/kemalmus/783087b7105cf69d59d30fb6c0894e06
- Phatty ECS for Phaser: https://phaser.io/news/2025/04/phatty
- Phaser 4 TypeScript platformer example: https://emanueleferonato.com/2026/01/21/html5-prototype-of-a-planet-gravity-platform-using-phaser-4-and-arcade-physics-written-in-typescript/
- Phaser HUD Scene pattern: https://phaser.discourse.group/t/hud-scene-multiple-scenes/6348
