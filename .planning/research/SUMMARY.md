# Project Research Summary

**Project:** The Augustin Files — Phaser 4 Career Platformer
**Domain:** Browser-based 2D narrative platformer as interactive CV/job application
**Researched:** 2026-04-13
**Confidence:** HIGH

---

## Executive Summary

The Augustin Files is a short-form narrative platformer built in Phaser 4 (stable 4.0.0 "Caladan", released April 10 2026) designed to replace a conventional CV with a 10-15 minute interactive experience sent directly to hiring managers. The recommended approach is to build the player controller first (feel before content), establish the Registry-based state system early (everything depends on it), and treat URL-based personalization (`?company=Stripe&name=Marc`) as the highest-value feature to ship quickly since it is also the lowest-complexity differentiator.

The critical risks are all about feel and delivery. A floaty jump or missing coyote time will end the recruiter's session in under 10 seconds. Audio that silently fails on first load (a browser autoplay policy issue) eliminates atmospheric impact entirely. And if any individual level runs longer than 3 minutes, a meaningful percentage of hiring managers will close the tab before reaching the Interview Room CTA — the entire point of the project.

---

## Recommended Stack

- **Phaser 4.0.0** — game engine (already installed). WebGL-primary, Arcade physics bundled.
- **Vite ^8.x** — build tool. Set `assetsInlineLimit: 0` in `vite.config.js` or audio files break.
- **Phaser Sound Manager (bundled)** — all audio needs. Do NOT add Howler.js.
- **Phaser Arcade Physics (bundled)** — AABB collision. Do NOT use Matter.js.
- **Custom JS state machine** — player controller for Celeste-quality feel.
- **inkjs 2.4.0** — branching dialogue for Interview Room. Install only at Phase 4.
- **URLSearchParams (browser built-in)** — zero-dependency URL personalization.
- **Vercel** — static hosting with `vercel.json` rewrite rule.

**Critical Phaser 4 breaking changes vs Phaser 3:**
- `Point` class removed → use `Vector2`
- `setTintFill()` → `setTint().setTintMode(Phaser.TintModes.FILL)`
- `DynamicTexture` requires explicit `.render()` call
- `Math.PI2` now equals `PI * 2` not `PI / 2` — use `Math.TAU`
- Canvas renderer deprecated — WebGL is primary

---

## Table Stakes vs Differentiators

### Table Stakes (missing = prototype feel)
- Celeste-quality player controller (coyote time 120ms, jump buffer 150ms, variable height, asymmetric gravity)
- Platform collision, camera follow with lerp
- Title/menu screen, scene transitions (fades)
- Basic HUD: health + coin counter
- Collectibles with audio + visual feedback
- Death animation + respawn at checkpoint
- Minimum 5 SFX (jump, land, collect, hit, death)
- Looping background music per level

### Differentiators (what makes this a standout job application)
- Per-company URL customization — **highest value, lowest effort**
- RPG stats system (7 stats, TAB overlay)
- Power-up inventory with real tool names (Clay, n8n, Claude Code)
- Interview Room with hard CTA buttons (Book call, LinkedIn, Download CV)
- Stats recap screen before CTA
- Parallax scrolling backgrounds
- Screen shake + particle bursts

### Defer to v2+
- Mobile touch controls, voice lines, Tiled maps, save/load, leaderboards, analytics

**Target playtime:** 8-10 minutes total. Cap each level at 2-3 minutes.

---

## Architecture Pattern

Layered scene stack: persistent `HUDScene` and `AudioScene` run alongside whichever level scene is active, sharing state through `this.registry` (Phaser's global Data Manager).

**Key components:**
1. `GameRegistry.js` — typed constants for all registry keys (defined first)
2. `BootScene` → `TitleScene` → Level scenes (one per level)
3. `HUDScene` (persistent) — listens on `registry.events.on('changedata')`
4. `AudioScene` (persistent) — manages crossfades, prevents music cut on scene transition
5. `Player` class — input + state machine + animation controller
6. Level data in external files (`src/data/level1Data.js`) — separate content from logic
7. Per-level mechanics in isolated modules (`CollectibleSystem.js`, `LanguageMeter.js`, `DialogueSystem.js`)

**Anti-patterns:** No monolithic GameScene, no state via scene params only, no HUD in game scene, no hardcoded level content.

---

## Critical Pitfalls

1. **Floaty jump physics** — Apply 1.5-2.5x gravity on descent + variable jump height on early key release. Must be Phase 1.
2. **Missing coyote time / jump buffer** — 20 lines of code, transformative quality impact. Phase 1.
3. **Audio silent on first load** — Never play audio before user gesture. Use `Sound.Events.UNLOCKED`. Phase 1 architecture.
4. **Scene memory leaks** — Register `SHUTDOWN` cleanup in every scene from day one.
5. **Pacing — players drop before CTA** — Hard 2.5-minute budget per level. Soft CTA on title screen.
6. **Phaser 3 API in Phaser 4 code** — Verify every API call against v4 migration guide, not v3 tutorials.

---

## Suggested Build Order (5 phases)

| Phase | Name | Goal | Key Risk |
|-------|------|------|----------|
| 1 | Foundation & Player Feel | Player controller, Registry, Boot/Title flow | Floaty controls |
| 2 | Level 1 — Shanghai | Full level + all base systems + URL personalization deployed | Audio unlock, pacing |
| 3 | Level 2 — Latin America | Language Meter, flags, NPCs extending proven base | Mechanic isolation |
| 4 | Interview Room & CTA | inkjs dialogue, stats recap, conversion buttons | inkjs integration |
| 5 | Polish, Asset Swap, Cross-Browser | Safari testing, Aseprite art pipeline, particle budget | Safari WebGL |

**Ordering rationale:** Player controller before level design (platform spacing = function of jump arc). Registry before any scene. Audio unlock before audio content. Level 1 before Level 2 (validates base systems). Interview Room last (reads accumulated stats). Polish after feature-complete.

---

## Research Flags

- **Phase 4:** inkjs x Phaser 4 integration — build 20-line spike before full implementation
- **Phase 5:** Safari WebGL — establish real Safari smoke test during Phase 2 deployment

---

*Synthesized from: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md*
