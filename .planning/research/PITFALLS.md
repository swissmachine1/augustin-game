# Domain Pitfalls

**Domain:** Phaser 4 short-form narrative platformer (interactive career CV)
**Researched:** 2026-04-13
**Project:** The Augustin Files

---

## Critical Pitfalls

Mistakes that cause rewrites, destroy game feel, or kill the tool's primary purpose (getting hired).

---

### Pitfall 1: Floaty Jump Feel — Not Modeling Physics Intentionally

**What goes wrong:** The default Phaser arcade physics gravity is constant throughout the jump arc, producing a symmetrical, floaty parabola. Players feel zero weight at the apex. The game immediately reads as a "student project."

**Why it happens:** Developers use `setVelocityY(-jumpSpeed)` and leave gravity alone. This is correct code but wrong physics for feel.

**Consequences:** Players lose confidence in the game within the first 5 seconds. The Celeste/Mario feel cited in PROJECT.md becomes impossible to achieve.

**Prevention:**
- Apply **higher gravity multiplier when falling** (velocity.y > 0): `player.body.setGravityY(fallGravityBoost)`. A 1.5–2.5x gravity multiplier during descent is the industry standard.
- Apply **medium gravity when ascending but jump key released early** (variable jump height): cap vertical velocity to a minimum if the jump key is released before the apex.
- Do NOT use a fixed `setVelocityY` cut — instead halve upward velocity on key release or apply even heavier gravity.
- Tune numbers empirically: jump height ≈ 3–4 tile heights, time-to-apex ≈ 0.35–0.45s.

**Warning signs:**
- Jump feels the same going up and coming down.
- Releasing jump early produces no effect on height.
- Player visually floats at apex for a visible moment.

**Phase:** Player Controller (Phase 1/earliest milestone). Cannot be retrofitted — affects level design and all collision detection.

---

### Pitfall 2: Missing Coyote Time and Jump Buffer

**What goes wrong:** Players who run off a platform edge cannot jump (even 50ms later), and players who press jump a frame before landing have no action taken. The game punishes precision rather than rewarding intent.

**Why it happens:** Naive implementation: `if (onGround && jumpPressed) { jump() }`. This requires pixel-perfect timing.

**Consequences:** Repeated unfair deaths. Players blame controls, not themselves. For a hiring manager playing on a trackpad, this is especially punishing.

**Prevention:**
- **Coyote time:** Track `lastOnGroundTime`. Allow jump if `(Date.now() - lastOnGroundTime) < 120` (120ms is a typical window). Reset only when an actual jump is taken, not when the player leaves the ground.
- **Jump buffer:** Track `lastJumpPressTime`. Allow jump to execute if `(Date.now() - lastJumpPressTime) < 150` when the player next touches ground.
- Both are ~10-line additions that dramatically change perceived control quality.

**Warning signs:**
- Playtesters say "the jump didn't register" more than once.
- Platform edge jumps feel inconsistent.
- Fast movement feels punishing rather than skillful.

**Phase:** Player Controller (same phase as movement). Non-negotiable for Celeste-quality feel.

---

### Pitfall 3: Phaser 4 API Breaks — Applying Phaser 3 Knowledge Directly

**What goes wrong:** Phaser 4 has multiple breaking changes from Phaser 3 that will silently fail or throw runtime errors if Phaser 3 patterns are copy-pasted.

**Why it happens:** Most tutorials, Stack Overflow answers, and forum posts target Phaser 3. Phaser 4 is new (RC1 released April 2025). Training data for AI assistants is also mostly Phaser 3.

**Consequences:** Invisible rendering bugs, runtime crashes, hours debugging code that "should work."

**Specific Phaser 4 API changes that affect this project:**

| Phaser 3 Pattern | Phaser 4 Replacement | Impact |
|---|---|---|
| `setTintFill()` | `setTint().setTintMode(Phaser.TintModes.FILL)` | Sprite coloring breaks silently |
| `Math.PI2` | `Math.TAU` (now equals `PI * 2`, not `PI / 2`) | Math in animation/movement wrong |
| `Point` class | `Vector2` | Geometry calculations error |
| `setPipeline('Light2D')` | `setLighting(true)` | Lighting silently missing |
| Custom WebGL pipelines | Rewrite as RenderNodes | All custom shaders break |
| DynamicTexture draw immediate | Must call `.render()` after draw commands | HUD/dynamic art not appearing |
| BitmapMask | New `Mask` filter | Masking effects absent |
| Spine 3/4 plugins | Official Esoteric Software plugin | Plugin crashes |
| Canvas renderer (reliable) | WebGL-primary, Canvas deprecated | Canvas fallback unreliable for advanced features |

**Warning signs:**
- Googling a Phaser problem and finding the answer without verifying Phaser version.
- Tint, lighting, or masking effects work in code but don't appear visually.
- Math-based animations produce wrong positions.

**Phase:** Every phase. Establish a rule: always check if a Phaser 3 tutorial/answer applies to Phaser 4. Verify against the official Phaser 4 docs and migration guide.

---

### Pitfall 4: Audio Silent on First Load — WebAudio Autoplay Policy

**What goes wrong:** The game loads, the title screen shows, music plays... according to the code. In reality, browsers (especially Chrome and Safari iOS) block audio until a user gesture occurs. The `AudioContext` starts suspended. No error is thrown.

**Why it happens:** Web browsers enforce an autoplay policy requiring a user gesture (click, keypress, tap) before any audio can play. Phaser attempts to resume the context automatically, but the timing is fragile — especially on mobile and in iframes (Vercel-hosted URL shared via email link).

**Consequences:** Hiring managers receive a link, click Play, and hear nothing. The atmospheric immersion is gone. They may think the game is broken.

**Prevention:**
- Never call `this.sound.play()` before a user gesture. Defer music start to after the Play button click (already the architecture for Boot → Title → Game flow).
- Listen for `Phaser.Sound.Events.UNLOCKED` before playing background music in scenes that may load before user input.
- On iOS: only a brief `touchend` (not `touchstart` or drag) unlocks Web Audio. Do not rely on hover or long-press.
- Test in Chrome DevTools mobile emulation AND real Safari iOS before any demo.
- Use MP3 format as the primary codec — it has the widest support across all browsers.

**Warning signs:**
- Music works in local dev but not in deployed URL.
- Audio plays on desktop but not on phone.
- Console shows "AudioContext was not allowed to start."

**Phase:** Audio System milestone. Build the audio unlock flow first, before adding any sound content.

---

### Pitfall 5: Scene Memory Leaks — Audio and Event Listeners Surviving Scene Changes

**What goes wrong:** When transitioning between levels (Shanghai → LatAm → Interview), event listeners, timers, tweens, and especially audio from the previous scene continue running in the background. Level 1 music plays simultaneously with Level 2 music. Enemy update loops run for dead scenes.

**Why it happens:** Phaser scenes are paused/stopped, not garbage collected, unless explicitly destroyed. Event listeners registered with `this.events.on()` or global emitters survive unless explicitly removed. Audio created in a scene does not auto-stop on scene transition.

**Consequences:** Memory usage climbs across the session. Audio cacophony between levels. Ghost physics interactions.

**Prevention:**
- Use `this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { ... })` in every scene's `create()` to explicitly stop music, remove listeners, and clear timers.
- Always use named functions (not anonymous lambdas) for event listeners so they can be removed.
- Stop and destroy audio objects explicitly: `this.music.stop(); this.music.destroy();`
- Destroy texture keys loaded in the scene (not shared assets from Boot): `this.textures.remove('levelSpecificKey')`
- Use object pooling for enemies, projectiles, and particles — never dynamically `add.sprite()` in update loops.

**Warning signs:**
- FPS drops when returning to the title screen.
- Audio from previous level audible during next level.
- Memory usage in DevTools grows monotonically between level loads.

**Phase:** Scene Transitions milestone. Establish cleanup patterns in the first scene before adding more scenes.

---

## Moderate Pitfalls

---

### Pitfall 6: Particle Effects Killing Performance — No Budget

**What goes wrong:** Jump dust, coin collect sparkles, and death explosions feel great individually. Combined, with screen shake, multiple active emitters, and a parallax background, the frame rate drops on mid-range laptops — exactly the hardware a hiring manager uses.

**Why it happens:** Each particle emitter runs its own update loop. Additive-blended particles cause extra draw calls. Developers add effects one at a time and never see the budget exceeded until all systems run together.

**Consequences:** Game stutters at exactly the moment it should feel most impressive (boss fights, death, level completion).

**Prevention:**
- Set a **particle budget**: max 3 simultaneous emitters active at one time.
- Reuse emitters instead of creating new ones (`emitter.explode()` on an existing emitter, not `this.add.particles()` per effect).
- Use small sprite atlas sheets for particle textures (not individual files).
- Avoid more than 50 simultaneous live particles on screen.
- For big moments (boss death, level complete), use a single burst emitter, not a sustained emitter.
- Canvas renderer can outperform WebGL on mid-range devices — consider making it a user toggle or auto-detecting.

**Warning signs:**
- FPS drops below 50 when particle effects trigger.
- `this.add.particles()` called inside an update loop.
- Multiple emitters active simultaneously for the same effect type.

**Phase:** Polish and Effects milestone. Profile with all gameplay systems active before adding VFX.

---

### Pitfall 7: Programmatic Level Design — No Visual Feedback Loop

**What goes wrong:** Building levels from arrays of tile coordinates without a visual editor means every adjustment requires editing a number, saving, reloading, and visually checking. This makes level tuning 10x slower than it should be.

**Why it happens:** PROJECT.md correctly defers Tiled integration (right call for MVP). But programmatic levels without a debug visualizer become opaque.

**Consequences:** Levels that look wrong (platforms too far apart, enemies in walls, collectibles unreachable) take hours to fix. This is the most likely cause of MVP schedule overrun.

**Prevention:**
- Build a **debug display mode** (toggle with a key): renders tile grid, physics body outlines, collision bounds, and entity spawn markers as colored overlays.
- Define levels as data objects (arrays of platform specs, enemy spawns, collectible positions) in separate files — not hardcoded in the scene.
- Use constants for tile size (don't hardcode `32` — use `TILE_SIZE`). Changing tile size later ripples through everything.
- Validate spawn positions in `create()` with `console.warn` if an entity is spawned outside world bounds.

**Warning signs:**
- You are editing level coordinates by trial and error with no visual reference.
- Platform positions are hardcoded magic numbers in scene files.
- A level layout change requires modifying the scene class directly.

**Phase:** Level 1 (Shanghai) implementation. Design the data format and debug visualizer before building level content.

---

### Pitfall 8: Interactive CV Pacing — Players Drop Before the CTA

**What goes wrong:** The game's ultimate job is to deliver Augustin's career story and get the hiring manager to act (reply, schedule, connect). If Level 1 alone takes 5+ minutes, most players never reach the Interview Room (Level 5) where the CTA lives.

**Why it happens:** Designers love their content. Each career chapter feels important. The game grows to feel comprehensive rather than compelling.

**Consequences:** The hiring manager plays Level 1, thinks "interesting concept," and closes the tab. They never see the contact CTA. The entire project fails its primary purpose.

**Prevention:**
- **Total playtime target: 6–9 minutes** (2–3 min per level). Design to this constraint, not to how much story you want to tell.
- Put a soft CTA on the title screen and a hard CTA at the end of every level (not just Level 5). The player may quit mid-run.
- Each level should have a **skip mechanism** (visible, not hidden) for players who want to reach the ending fast.
- Test with a cold audience: give the link to someone unfamiliar and time how long they play before quitting.

**Warning signs:**
- Level 1 has more than 4 distinct areas or takes longer than 3 minutes to complete.
- The contact info/LinkedIn only appears at the very end of the game.
- No skip or fast-forward exists for repeat visitors.

**Phase:** Level design across all milestones. Enforce time budgets from Level 1.

---

### Pitfall 9: Cross-Browser WebGL Gaps — Safari and Older Laptops

**What goes wrong:** The game renders correctly in Chrome, but in Safari (used by many Mac-based startup employees) certain visual effects are absent or broken. Blend modes behave differently. On older integrated GPUs, WebGL context is lost under memory pressure.

**Why it happens:** Phaser 4 is WebGL-primary. Canvas renderer is deprecated. Safari's WebGL implementation has historically lagged and has iOS-specific quirks (context interrupted by phone calls, iframes blocking IndexedDB).

**Specific risks:**
- WebGL context loss on iOS when an incoming call interrupts — requires `contextlost`/`contextrestored` event handling.
- Safari iframe restrictions (relevant if the game is embedded in a portfolio page rather than served at its own domain — use standalone domain, which PROJECT.md already plans).
- Blend modes: Phaser 4's new Blend filter can recreate Canvas blend modes in WebGL, but requires explicit use.

**Prevention:**
- Deploy to a standalone domain (`theaugustinfiles.com`), not an iframe. This avoids Safari iframe restrictions entirely.
- Test in Safari desktop on macOS before any demo. Chrome DevTools mobile emulation does not replicate Safari's WebGL quirks.
- Handle `this.game.events.on('hidden')` / `'visible'` for tab-switch audio pausing explicitly.
- Avoid WebGL 2.0 exclusive features — WebGL 1.0 baseline is safer for hiring manager laptops.

**Warning signs:**
- Game only tested in Chrome.
- Effects that use custom blend modes.
- Game embedded in an iframe on another domain.

**Phase:** Deployment milestone. Establish Safari testing as mandatory in the definition of done.

---

## Minor Pitfalls

---

### Pitfall 10: Asset Loading Race Conditions — Preload Not Awaited

**What goes wrong:** Game code in `create()` references assets before they finish loading. Returns `null`, causes silent failures or invisible sprites.

**Prevention:** All assets must be loaded in `preload()`. Never load assets in `create()` or `update()`. Use Phaser's built-in LoaderPlugin events if dynamic loading is needed.

**Phase:** Any milestone adding new assets.

---

### Pitfall 11: Placeholder-to-Real-Asset Swap Breaking Physics Bodies

**What goes wrong:** Placeholder colored rectangles have exact pixel dimensions matching the physics body. When real sprite sheets are swapped in, sprites are larger/smaller, and collision bodies no longer match the visual. Players get hit by invisible edges or pass through platforms.

**Prevention:** Define physics body dimensions as explicit constants (`PLAYER_BODY_WIDTH`, `PLAYER_BODY_HEIGHT`) independent of sprite frame size. Use `setSize()` and `setOffset()` explicitly — never rely on auto-body-from-sprite-frame.

**Phase:** Asset integration milestone. Document the size constants before the first art swap.

---

### Pitfall 12: HUD Rendering Above Game World — Camera Binding

**What goes wrong:** HUD elements (health, coins, XP) scroll with the camera instead of staying fixed on screen.

**Prevention:** Set HUD elements to `setScrollFactor(0)` or create a separate UI scene running in parallel (`this.scene.launch('UIScene')`). The parallel scene approach is more scalable for this project's HUD complexity.

**Phase:** HUD milestone.

---

### Pitfall 13: URL Param Customization Breaking on Encoding

**What goes wrong:** `?company=Stripe&name=Patrick` works fine. `?company=Acme Corp&name=Jean-François` breaks because of spaces and special characters in the URL.

**Prevention:** Always use `encodeURIComponent()` when generating URLs and `decodeURIComponent()` when reading params. Test with French names (common for European hiring managers) and company names with special characters.

**Phase:** URL customization milestone.

---

## Phase-Specific Warnings

| Phase Topic | Most Likely Pitfall | Mitigation |
|---|---|---|
| Player controller | Floaty feel + missing coyote time | Build feel first, level design second |
| Audio system | Autoplay policy silences all audio | Gate all sound behind first user gesture |
| Level 1 design | Pacing too long, CTA too late | Cap Level 1 at 2.5 min, add mid-level CTA |
| Scene transitions | Audio leak + memory leak | SHUTDOWN handler in every scene from day 1 |
| Particle effects | Budget exceeded during boss/death | Profile with all systems active before polish |
| Asset swap | Physics bodies break on real sprites | Explicit body constants, never auto-size |
| HUD | Scrolls with camera | Separate UI scene or setScrollFactor(0) |
| Deployment | Safari audio/WebGL silent failures | Safari test in definition of done |
| URL params | Encoding breaks on special characters | encodeURIComponent throughout |

---

## Sources

- Phaser 4 Migration Guide: https://github.com/phaserjs/phaser/blob/master/changelog/v4/4.0/MIGRATION-GUIDE.md
- Phaser v4 Release Candidate 1: https://phaser.io/news/2025/04/phaser-v4-release-candidate-1
- Phaser 4 Rendering Concepts: https://phaser.io/tutorials/phaser-4-rendering-concepts
- How I optimized my Phaser 3 action game in 2025: https://franzeus.medium.com/how-i-optimized-my-phaser-3-action-game-in-2025-5a648753f62b
- Phaser scene memory leak issue: https://github.com/photonstorm/phaser/issues/5456
- iOS audio lock issue: https://github.com/phaserjs/phaser/issues/5390
- Celeste player movement and physics: https://deepwiki.com/NoelFB/Celeste/2.3-player-movement-and-physics
- 5 tips for better platformer controls: https://shaggydev.com/2022/06/29/platformer-tips/
- Phaser audio best practices: https://blog.ourcade.co/posts/2020/phaser-3-web-audio-best-practices-games/
- Phaser particle system docs: https://deepwiki.com/phaserjs/phaser/4.3-particle-systems
- Phaser scene lifecycle: https://deepwiki.com/phaserjs/phaser/3.1-scene-lifecycle
- Phaser jitter/smooth movement discussion: https://github.com/phaserjs/phaser/discussions/6294
