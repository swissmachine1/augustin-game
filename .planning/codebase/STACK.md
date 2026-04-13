# Technology Stack

**Analysis Date:** 2026-04-13

## Languages

**Primary:**
- JavaScript (ES6+) - All source code, game logic, and scenes

**Secondary:**
- HTML5 - Entry point markup
- CSS3 - Minimal styling (reset only, game renders via Phaser canvas)

## Runtime

**Environment:**
- Node.js 20+ - Development and build environment

**Package Manager:**
- npm 10+ (inferred from package-lock.json v3)
- Lockfile: Present (`package-lock.json`)

## Frameworks

**Core:**
- Phaser 4.0.0 - Game engine for 2D platformer development
  - Arcade physics enabled for gravity, collisions, movement
  - Scene system for managing BootScene, TitleScene, GameScene
  - Rendering via AUTO (WebGL with Canvas fallback)
  - Pixel-art rendering mode enabled

**Development:**
- Vite 8.0.4 - Build tool and dev server
  - ES6 module bundling
  - Hot Module Replacement (HMR) for development
  - Production build optimization

## Key Dependencies

**Critical:**
- phaser (^4.0.0) - Only production dependency; handles all game rendering, physics, input, tweening, and scene management

**Development:**
- vite (^8.0.4) - Dev server and build toolchain

## Build Configuration

**Vite Setup:**
- Entry point: `index.html` references `/src/main.js` as module script
- Output target: ES2020+ (modern JavaScript)
- Default output: `dist/` directory (standard Vite build output)

**Game Configuration:**
- Viewport: 1280x720 (fixed dimensions in `src/config/GameConfig.js`)
- Physics: Arcade physics with gravity 800 (y-axis)
- Scaling: FIT mode with CENTER_BOTH auto-centering
- Rendering: Pixel-art mode enabled for crisp sprite rendering
- Parent element: `#game` div in HTML

## Configuration Files

**Package Manifest:**
- `package.json` - Version 0.0.0, type: "module" (ES6 modules), private project

**Build Scripts:**
- `npm run dev` - Start Vite dev server with HMR
- `npm run build` - Create optimized production build
- `npm run preview` - Preview production build locally

**Game Configuration:**
- `src/config/GameConfig.js` - Centralized Phaser game config with scenes, physics, scaling

## Platform Requirements

**Development:**
- Node.js 20+
- npm 10+ (or yarn/pnpm)
- Modern browser with WebGL support (fallback to Canvas)
- Terminal/CLI for running npm scripts

**Production:**
- Modern browser (Chrome, Firefox, Safari, Edge)
- WebGL or Canvas 2D rendering support
- No server required (static build output)

---

*Stack analysis: 2026-04-13*
