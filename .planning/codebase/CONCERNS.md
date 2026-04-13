# Codebase Concerns

**Analysis Date:** 2026-04-13

## Project State

This is an early-stage scaffolding project. The codebase contains baseline Phaser 4 scene structure with no game mechanics implemented. The build plan spans 14 days across multiple layers, but the current implementation is foundational only.

---

## Tech Debt

**Missing Core Game Loop Logic:**
- Files: `src/scenes/GameScene.js`
- Issue: Player object exists but has no input handlers, no animation states, and no real controller. The player is a static colored rectangle that does not respond to keyboard input.
- Impact: Game is unplayable. No way to move character, jump, or interact. Blocks all subsequent development phases (Levels 2-5, mechanics, power-ups).
- Fix approach: Implement Player controller class in `src/sprites/Player.js` with keyboard input binding, state machine for idle/run/jump/fall, smooth acceleration, deceleration, double-jump, coyote time, and jump buffering before proceeding to asset integration.

**Asset Pipeline Incomplete:**
- Files: `src/assets/`, `public/assets/`
- Issue: Only `src/assets/hero.png` exists (44KB placeholder icon, not a game sprite). Audio directory (`src/assets/audio/`) and backgrounds directory (`src/assets/backgrounds/`) are empty. Sprite sheet directory (`public/assets/sprites/`) is empty.
- Impact: Cannot load real player sprites or level backgrounds. All visuals are hardcoded geometry (colored rectangles). Parallax scrolling, animation, and atmosphere features cannot be implemented until assets exist.
- Fix approach: Generate or obtain pixel-art assets before Day 2 (parallax camera) and Day 3 (Level 1). Use Midjourney/Suno per build plan if licensed. Ensure sprite sheets follow expected frame layout before wiring to animation system.

**No Configuration Management:**
- Files: `src/config/GameConfig.js`
- Issue: Hardcoded physics constants (gravity: 800), canvas dimensions (1280x720), and scene sequence. No ability to quickly adjust tuning parameters or test configurations. No per-level config support.
- Impact: Difficulty tuning and balancing across 5 levels will be slow. Players may find levels too easy/hard but no quick way to adjust without code changes.
- Fix approach: Extend GameConfig to include tuning parameter exports (gravity, jump velocity, acceleration, coyote time, jump buffer). Create level-specific config files under `src/config/levels/` before implementing multi-level progression.

**Placeholder Asset in Production Build:**
- Files: `src/assets/hero.png`
- Issue: 44KB generic icon is checked into version control and will be included in production build. This is not the intended character sprite from the build plan.
- Impact: Deployed game will show wrong visual. Confusion for end users testing the game.
- Fix approach: Replace `hero.png` with actual pixel-art character sprite (32x32 grid with animation frames: idle, run, jump, fall). Update asset loading in `src/scenes/BootScene.js` to reference correct sprite sheet.

---

## Known Gaps

**Player Controller Missing:**
- What's not implemented: Keyboard input, movement, jumping, animations, collision response
- Files: `src/scenes/GameScene.js`
- Risk: Everything depends on this. Entire game is blocked until controller exists.
- Safe modification: Create new `src/sprites/Player.js` class extending Phaser.Physics.Arcade.Sprite. Wire up in GameScene.create() but do not modify GameScene until Player class is stable and tested.

**Physics Tuning Untested:**
- What's untested: Gravity (800), jump arc, platform collision feel, edge-case behaviors (jumping into ceiling, coyote time logic)
- Files: `src/config/GameConfig.js`, `src/scenes/GameScene.js`
- Risk: Platformer feel is critical to user experience. Wrong tuning makes game unplayable or frustrating. Early playtesting required.
- Priority: High — must be tuned before Level 1 launch.

**No Scene Transition Logic:**
- What's missing: No pause menu, no level complete screens, no death/respawn system, no main menu integration
- Files: All scene files
- Risk: Game cannot progress between levels. No way to pause, restart, or gracefully handle failure states.
- Priority: Medium — implement after player controller and Level 1 mechanics work.

**No Input Validation or Error Handling:**
- What's missing: No null checks for Phaser objects, no try-catch blocks, no validation of configuration values
- Files: All `.js` files in `src/`
- Risk: Runtime errors will crash the game without user feedback. Hard to debug.
- Priority: Medium — add defensive checks as each system is built.

---

## Performance Bottlenecks

**No Camera Optimization:**
- Problem: Future implementation plans include parallax backgrounds and multiple levels. Camera follows player but no culling, no viewport optimization.
- Files: Will affect `src/scenes/` when parallax system is added
- Cause: Early stage — optimizations not needed yet but should be planned
- Improvement path: When parallax backgrounds and moving platforms are added, implement object culling to avoid rendering off-screen tiles. Use Phaser's built-in viewport optimization.

**No Object Pooling:**
- Problem: Projectiles, particles, enemies (future) will be instantiated/destroyed continuously. Can cause garbage collection stutter.
- Files: Will affect future enemy and projectile systems
- Cause: Not yet implemented
- Improvement path: Create object pool manager before implementing enemies and projectiles. Reuse physics bodies rather than creating new ones.

---

## Fragile Areas

**Scene Coupling:**
- Files: `src/config/GameConfig.js`, `src/scenes/BootScene.js`, `src/scenes/TitleScene.js`, `src/scenes/GameScene.js`
- Why fragile: Scene order is hardcoded in GameConfig array. If scenes are added/removed/reordered, transitions break. No scene manager abstraction.
- Safe modification: Document scene order as comments. Create a scene registry enum/constant before adding more scenes.
- Test coverage: None — scene transitions are untested.

**Hardcoded Platform Positions:**
- Files: `src/scenes/GameScene.js` (lines 12-23)
- Why fragile: Platform positions are magic numbers (x, y coordinates). Changing level layout means changing code. No tilemap support yet.
- Safe modification: Do not manually edit platform coordinates. When Tiled support is added (Day 3), migrate to tilemap format immediately.
- Test coverage: No automated tests. Manual verification only.

**No Physics Body Cleanup:**
- Files: `src/scenes/GameScene.js`
- Why fragile: Physics bodies created in create() but not explicitly cleaned up on scene shutdown. Can leak memory if scenes are frequently switched.
- Safe modification: Add scene shutdown handler: `this.events.on('shutdown', () => { /* cleanup */ })` before implementing level switching.
- Test coverage: None.

---

## Dependencies at Risk

**Phaser 4 Early Stage:**
- Risk: Phaser 4 is relatively new. API may change. Documentation may be sparse. Community examples are mostly Phaser 3.
- Impact: If Phaser 4 has breaking changes, entire codebase may need refactoring.
- Migration plan: Keep build plan implementation agnostic to Phaser version. Wrap Phaser calls in utility functions (e.g., `createPlayer()`, `addPlatform()`) in `src/utils/PhaserHelpers.js`. If migration needed, update helpers only, not scene code.

**Vite Build System:**
- Risk: Vite 8.0.4 is current but fast-moving. Asset pipeline configuration may need updates as features are added (sprite sheets, audio, tilemaps).
- Impact: Build may break when adding new asset types (compressed audio, tilemap JSON).
- Mitigation: Test asset loading early (Day 1-2). Document any Vite config changes in `vite.config.js` comments.

**No Lock on Production Dependencies:**
- Risk: `package.json` has no lock file committed (or it is large). `phaser` is pinned to `^4.0.0` (allows patch updates). `vite` is `^8.0.4`.
- Impact: Different builds may install different patch versions. Potential for version drift between dev and production.
- Mitigation: Ensure `package-lock.json` is committed and reviewed before deployment.

---

## Missing Critical Features (Blocking Progression)

**Player Controller (Blocks Everything):**
- Problem: Game cannot be played. Player does not move, jump, or animate.
- Blocks: Levels 1-5, power-ups, enemy AI, stat system, HUD.
- Effort: 1-2 days based on build plan (Day 1).

**Asset Generation (Blocks Visual Polish):**
- Problem: No sprites, no backgrounds, no music. Game looks like a debug wireframe.
- Blocks: Parallax camera implementation, level design, audio integration.
- Effort: 3-5 days of asset generation (parallel to coding per build plan).

**Physics Tuning (Blocks Playability):**
- Problem: Current gravity/jump values untested. May feel wrong.
- Blocks: Cannot validate Level 1 design until jump/fall feel is correct.
- Effort: 1 day of iteration.

**Multi-Level Progression (Blocks Campaign):**
- Problem: No level selection, no level-to-level transitions, no persistent stats.
- Blocks: Levels 2-5, stat system, inventory, power-ups.
- Effort: After Level 1 complete.

---

## Test Coverage Gaps

**No Unit Tests:**
- What's not tested: Player controller (does not exist yet), game config, scene transitions
- Files: All source files
- Risk: Bugs in movement, collision, state transitions will only be caught during manual play.
- Priority: Medium — add unit tests for Player controller before shipping.

**No Integration Tests:**
- What's not tested: Scene flow (BootScene → TitleScene → GameScene), physics interactions, camera behavior
- Files: All scene files
- Risk: Regressions in scene flow or physics only caught by manual gameplay.
- Priority: Medium — add Phaser-compatible E2E tests after core mechanics work.

**No Visual Regression Tests:**
- What's not tested: Rendering, camera positioning, parallax behavior
- Files: Scene rendering logic
- Risk: Visual bugs (wrong camera offset, parallax scrolling broken) missed until late in development.
- Priority: Low for now — becomes important when adding parallax and UI.

---

## Security & Deployment Concerns

**No Sensitive Data Handling Yet:**
- Risk: Game plan includes URL parameters (?company=legora, ?name=KushalPatel) and analytics. No input validation or XSS protection yet.
- Files: Will affect future URL param parsing and analytics integration
- Mitigation: When implementing URL params (Day 12), sanitize all user inputs. Use a URL parameter library instead of manual parsing.

**No CORS Configuration Documented:**
- Risk: Game will fetch assets and potentially contact analytics endpoints. CORS must be configured.
- Files: Will affect `vite.config.js` when deploying
- Mitigation: Document CORS requirements before deploying to production. Test cross-origin requests early.

---

## Recommendations (Priority Order)

1. **Implement Player Controller** (Day 1) — Unblocks all gameplay development.
2. **Generate/Obtain Assets** (parallel to Day 1-2) — Unblocks visual implementation.
3. **Tune Physics Constants** (Day 1 iteration) — Validate platformer feel.
4. **Add Scene Manager Abstraction** (before Day 3) — Prepare for multi-level progression.
5. **Create Asset Pipeline Config** (Day 2) — Prepare Vite for sprite sheets, audio, tilemaps.
6. **Add Input Validation** (ongoing) — Prevent crashes from bad data.
7. **Write Player Controller Tests** (after Day 1) — Catch movement regressions.
8. **Implement Tilemap Support** (Day 3) — Replace hardcoded platforms with level data.

---

*Concerns audit: 2026-04-13*
