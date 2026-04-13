# Technology Stack

**Project:** The Augustin Files — Phaser 4 Career Platformer
**Researched:** 2026-04-13
**Research mode:** Ecosystem

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Phaser | 4.0.0 | Game engine | Just hit stable release on April 10, 2026 ("Caladan"). New node-based WebGL renderer is faster. Arcade physics, animations, audio, tilemaps all built-in. Already installed in this project. |
| Vite | latest (^6.x) | Build tool + dev server | Hot reload, fast builds, zero config for static game assets. Official Phaser + Vite template exists. Already installed. |

**Phaser 4 vs Phaser 3 status:** Phaser 3.90 is the last Phaser 3 release. All future development is v4 only. The project already has Phaser 4 installed — do not downgrade.

**Key Phaser 4 breaking changes to know (HIGH confidence — migration guide):**
- Pipeline system removed — replaced by render nodes (irrelevant for this project, no custom shaders planned)
- `Point` class removed — use `Vector2`
- Y=0 is now bottom (GL orientation) in WebGL context — affects any raw coordinate math
- `DynamicTexture` and `RenderTexture` require explicit `render()` call
- `BitmapMask` removed — use the unified Filter system instead

---

### Audio

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Phaser built-in Sound Manager | (bundled) | Music + SFX | Handles Web Audio API with HTML5 Audio fallback automatically. Supports looping, volume control at instance and global level, `sound.add()`, `sound.getAll()`, `sound.getAllPlaying()`. Sufficient for per-level music and action SFX without any external dependency. |

**Do NOT use Howler.js.** Howler adds 7KB and a second audio context on top of what Phaser already manages. Conflicts arise when two libraries compete for the AudioContext. Phaser 4 Sound Manager covers all requirements: looping background music, pooled SFX instances, fade in/out, volume control, spatial audio. Use Howler only if you leave Phaser's audio system entirely — which is not warranted here.

**Confidence:** HIGH — verified against official Phaser 4 audio docs.

---

### Sprite Animation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Aseprite | 1.3.x (desktop app) | Pixel art creation + animation authoring | Native Phaser loader support via `this.load.aseprite()` and `this.anims.createFromAseprite()`. Export produces PNG + JSON. Tag-based animation names map directly to Phaser animation keys. No additional packing step needed for MVP. |
| Phaser AnimationManager | (bundled) | Runtime animation playback | Built-in, handles frame sequencing, repeat, yoyo, ping-pong, callbacks on complete. |

**Workflow:** Aseprite → File > Export Sprite Sheet → Output: PNG + JSON data → `this.load.aseprite('player', 'player.png', 'player.json')` → `this.anims.createFromAseprite('player')` → `sprite.play('idle')`.

**TexturePacker is not needed for MVP.** It adds value when you have many separate character/environment assets to pack into a single atlas for draw-call efficiency. With Aseprite's own export, each character's animations live in one atlas already. Revisit if draw calls become a performance issue.

**Placeholder-first approach:** Since assets don't exist yet, use `this.add.rectangle()` for the player and `Graphics` objects for tiles. Aseprite workflow only becomes relevant when art is commissioned from Midjourney → pixelatorapp.com pipeline.

**Confidence:** HIGH — `createFromAseprite` is documented in Phaser 3 and forward-ported to Phaser 4. Verified in docs.

---

### Dialogue and Narrative

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| inkjs | 2.4.0 | Narrative scripting runtime | JavaScript port of Ink (by Inkle Studios). Zero dependencies, browser-compatible, actively maintained (last publish ~Feb 2026). Ink is the industry standard for interactive fiction branching — used in Disco Elysium, 80 Days, Heaven's Vault. Provides: branching dialogue trees, variable tracking, conditional logic, knots/stitches structure. |
| Inky (desktop) | latest | Ink script editor | Visual editor for `.ink` files, real-time playback testing, compile to JSON for runtime. Free. |

**Integration pattern:**
```javascript
// Load compiled Ink JSON as a Phaser text asset
this.load.text('interview', 'assets/dialogue/interview.ink.json');

// In scene create():
const storyData = this.cache.text.get('interview');
const story = new inkjs.Story(storyData);

// Advance dialogue:
while (story.canContinue) {
  const line = story.Continue();
  // render line to dialogue box UI
}
// Show choices:
story.currentChoices.forEach((choice, i) => {
  // render choice buttons
});
story.ChooseChoiceIndex(selectedIndex);
```

**Do NOT build a hand-rolled dialogue system.** A custom JSON-based dialogue system seems simpler until you need: branching on stats (player's EQ, Tech, Grit), conditional lines based on collected power-ups, fallback paths, or non-linear flows. Ink handles all of this in its scripting language. The Interview Room scene specifically needs a stats-aware dialogue tree — Ink is built for exactly this.

**Confidence:** MEDIUM-HIGH — inkjs 2.4.0 confirmed on npm. Integration pattern adapted from community examples, not Phaser 4 specific docs.

---

### Level Design

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Programmatic (vanilla JS) | — | Level geometry and platform layout | Already decided in PROJECT.md ("Tiled map editor integration — will use programmatic level generation for MVP"). Faster iteration with colored rectangles as placeholders. No external tooling dependency during prototyping phase. |
| Phaser StaticGroup + Arcade Physics | (bundled) | Collision surfaces | `this.physics.add.staticGroup()` for platforms, walls, and hazards. Arcade physics is the right choice: lightweight AABB collision, no rotation needed, sufficient for Celeste-style platforming. |

**On Tiled:** Phaser 4 does support Tiled JSON maps (TilemapGPULayer was added in the Beam renderer that powers v4). However, the project has explicitly deferred Tiled to v2. The programmatic approach is correct for MVP: it keeps the toolchain minimal and makes placeholder-first development trivial.

**Level structure pattern (recommended):**
```javascript
class Level1Shanghai extends Phaser.Scene {
  create() {
    this.platforms = this.physics.add.staticGroup();
    // Ground
    this.platforms.create(400, 568, 'platform').setScale(2).refreshBody();
    // Floating platforms — defined as data arrays for easy editing
    const platformData = [
      { x: 200, y: 400 }, { x: 500, y: 300 }, { x: 800, y: 200 }
    ];
    platformData.forEach(p => this.platforms.create(p.x, p.y, 'platform'));
  }
}
```

**Confidence:** HIGH — programmatic approach is well-documented, decision already made in PROJECT.md.

---

### Player Controller

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Custom state machine (vanilla JS class) | — | Player movement (idle/run/jump/fall/hurt/dead) | Celeste-quality feel requires explicit state tracking that Phaser's built-in controller doesn't provide out of the box. A state machine prevents impossible transitions (e.g., double-jumping after wall kick) and centralizes animation triggers. |
| Phaser Arcade Physics | (bundled) | Velocity, gravity, collision | `setVelocityX`, `setVelocityY`, `body.onFloor()`, `body.blocked.down` for ground detection. |

**Coyote time and input buffering implementation:**
- Coyote time: track `lastGroundedTime` timestamp; allow jump if `(scene.time.now - lastGroundedTime) < 100` even when `!body.blocked.down`
- Input buffer: track `jumpPressedTime`; if player hits ground within 100ms of jump press, trigger jump
- Variable jump height: apply extra downward gravity (e.g., `body.setGravityY(800)`) when jump key is released before apex

**Confidence:** MEDIUM — coyote time and input buffering are engine-agnostic patterns, well-documented across Celeste postmortems and platformer tutorials. The specific Phaser 4 Arcade Physics API surface is unchanged from v3 for this use case.

---

### URL-Based Customization

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Native `URLSearchParams` | (browser built-in) | Parse `?company=&name=&role=` query params | Zero dependencies, works in all modern browsers, no library needed. Read once in Boot scene, store in a global config object accessible from all scenes. |

**Implementation:**
```javascript
// In Boot scene preload() or create():
const params = new URLSearchParams(window.location.search);
this.registry.set('company', params.get('company') || 'Your Company');
this.registry.set('recruiterName', params.get('name') || 'there');
this.registry.set('role', params.get('role') || 'this role');
```

Use `this.registry` (Phaser's global data store) so all scenes can read `this.registry.get('company')` without prop-drilling.

**Confidence:** HIGH — `URLSearchParams` is a web standard. `Phaser.Registry` is documented and available in v4.

---

### Deployment

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel | — | Static hosting + CDN | Auto-detects Vite projects, zero config. Free tier supports custom domains. `npm run build` → `vercel` CLI or GitHub push to deploy. Already decided in PROJECT.md. |
| `vercel.json` | — | SPA routing config | Required to ensure URL params pass through correctly and prevent 404 on direct URL access. |

**Required `vercel.json`:**
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Build command for Vite + Phaser:**
```json
// package.json scripts
"build": "vite build",
"preview": "vite preview"
```

Vite's `dist/` output is pure static — Vercel serves it directly from edge CDN. No server-side rendering, no functions needed. Game loads fast.

**Asset optimization note:** Set `assetsInlineLimit: 0` in `vite.config.js` to prevent Vite from inlining audio files as base64 (which breaks Phaser's Web Audio loader). Phaser needs to fetch audio as arraybuffers via XHR.

```javascript
// vite.config.js
export default {
  build: {
    assetsInlineLimit: 0
  }
}
```

**Confidence:** HIGH — Vercel + Vite integration is official and documented. Audio inline limit issue is a known Phaser + Vite gotcha verified in community posts.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Audio | Phaser built-in | Howler.js | Two AudioContexts conflict; Phaser already covers all use cases. Extra bundle size for no gain. |
| Dialogue | inkjs | Custom JSON system | Hand-rolled systems can't handle branching on stats, conditional lines, or non-linear flows without becoming unmaintainable. |
| Dialogue | inkjs | Yarn Spinner | inkjs has better browser support, smaller bundle, and more active community. Yarn Spinner requires Unity or Godot for best DX. |
| Level design | Programmatic | Tiled editor | Adds toolchain complexity for MVP. Deferred to v2 per PROJECT.md. |
| Sprite tooling | Aseprite | TexturePacker | Aseprite exports Phaser-native JSON. TexturePacker adds a step and cost (paid) without benefit at MVP scale. |
| Deployment | Vercel | Netlify | Both work equally well; Vercel is already decided in PROJECT.md. |
| Physics | Arcade | Matter.js | Matter.js supports rotation and complex shapes but adds overhead. Celeste-style platforming only needs AABB rectangles. |

---

## Complete Install Reference

```bash
# Already installed (Phaser 4 + Vite scaffold exists)
# Verify Phaser is at 4.0.0:
npm list phaser

# Install inkjs for Interview Room dialogue system (Phase 3+)
npm install inkjs

# No other runtime dependencies needed
# All other systems (audio, physics, animation, tilemap) are bundled in Phaser 4
```

---

## Confidence Summary

| Area | Confidence | Source |
|------|------------|--------|
| Phaser 4.0.0 stable release | HIGH | phaser.io/download/release/v4.0.0, confirmed April 10 2026 |
| Phaser built-in audio sufficiency | HIGH | Official Phaser audio docs |
| Aseprite → Phaser animation pipeline | HIGH | Official Phaser docs (`load.aseprite`, `createFromAseprite`) |
| inkjs 2.4.0 availability | MEDIUM-HIGH | npm search result, ~2 months ago publish date |
| Coyote time implementation | MEDIUM | Engine-agnostic patterns, Celeste postmortems, no Phaser 4 specific example found |
| Vercel + Vite deployment | HIGH | Vercel official docs, Vite static deploy guide |
| `assetsInlineLimit: 0` for audio | MEDIUM | Community reports, not in official Phaser 4 docs |
| Tiled support in Phaser 4 | MEDIUM | Technical preview docs only (TilemapGPULayer) — not needed for MVP |

---

## Sources

- Phaser 4.0.0 "Caladan" release: https://phaser.io/download/release/v4.0.0
- Phaser Mega Update (RC4 context): https://phaser.io/news/2025/05/phaser-mega-update
- Phaser Migration Guide v3→v4: https://github.com/phaserjs/phaser/blob/master/changelog/v4/4.0/MIGRATION-GUIDE.md
- Phaser Audio docs: https://docs.phaser.io/phaser/concepts/audio
- Phaser Animation docs: https://docs.phaser.io/phaser/concepts/animations
- Phaser Arcade Physics docs: https://docs.phaser.io/phaser/concepts/physics/arcade
- inkjs on npm: https://www.npmjs.com/package/inkjs
- inkjs GitHub: https://github.com/y-lohse/inkjs
- Vite + Phaser guide: https://emanueleferonato.com/2025/01/01/develop-build-and-distribute-your-html5-phaser-games-with-vite/
- Vite on Vercel: https://vercel.com/docs/frameworks/frontend/vite
- Celeste game-feel thread (coyote time): https://threadreaderapp.com/thread/1238338574220546049.html
- Aseprite in Phaser: https://saricden.github.io/aseprite-sprites-in-phaser3-5
