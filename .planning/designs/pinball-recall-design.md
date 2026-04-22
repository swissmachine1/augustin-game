# Level 5 -- Career Pinball: PINBALL RECALL

## Complete Game Design Document

**Scene file:** `src/scenes/InterviewRoomScene.js` (replaces current Q&A implementation)
**Target duration:** 75-100 seconds of active gameplay, ~10s intro, ~15s outro/completion
**Canvas:** 1280x720
**Registry keys:** `KEYS.SCORE_L5`, `KEYS.COMPLETED_L5`
**Stats awarded:** None directly (this is the final synthesis level -- stats were earned in L1-L4)

---

## 1. Grid Layout

### Grid Dimensions: 8 columns x 8 rows

The grid is the central game board. It represents a field journal game board drawn on parchment.

**Cell size:** 60x60 pixels
**Grid total:** 8 x 8 = 480 x 480 pixels
**Grid origin:** x=160, y=100 (top-left corner of grid)
**Grid ends:** x=640, y=580

This positions the grid left-of-center, leaving ~620px on the right for the platform tray, narrative text, and UI. The grid sits comfortably within the 720px height with margins for header and footer.

### Grid Drawing

```javascript
const GRID = {
  cols: 8,
  rows: 8,
  cellSize: 60,
  originX: 160,
  originY: 100,
}

_drawGrid() {
  const g = this.add.graphics()
  const { cols, rows, cellSize, originX, originY } = GRID

  // Grid background: slightly darker parchment rectangle
  g.fillStyle(C.PARCHMENT_DARK, 0.25)
  g.fillRect(originX, originY, cols * cellSize, rows * cellSize)

  // Grid lines: faint ink, hand-drawn style
  g.lineStyle(0.5, C.INK, 0.15)
  for (let c = 0; c <= cols; c++) {
    const x = originX + c * cellSize
    g.beginPath()
    g.moveTo(x + (Math.sin(c * 2.3) * 1), originY)
    g.lineTo(x + (Math.cos(c * 1.7) * 1), originY + rows * cellSize)
    g.strokePath()
  }
  for (let r = 0; r <= rows; r++) {
    const y = originY + r * cellSize
    g.beginPath()
    g.moveTo(originX, y + (Math.sin(r * 1.9) * 1))
    g.lineTo(originX + cols * cellSize, y + (Math.cos(r * 2.1) * 1))
    g.strokePath()
  }

  // Intersection dots (like the reference image)
  g.fillStyle(C.INK, 0.12)
  for (let c = 0; c <= cols; c++) {
    for (let r = 0; r <= rows; r++) {
      g.fillCircle(originX + c * cellSize, originY + r * cellSize, 2)
    }
  }

  // Border: thicker ink line around the grid
  g.lineStyle(1.5, C.INK, 0.4)
  g.strokeRect(originX - 2, originY - 2, cols * cellSize + 4, rows * cellSize + 4)

  // Decorative corner ornaments (L-shapes, matching JournalUI.drawLeatherCover)
  const corners = [
    [originX - 10, originY - 10, 1, 1],
    [originX + cols * cellSize + 10, originY - 10, -1, 1],
    [originX - 10, originY + rows * cellSize + 10, 1, -1],
    [originX + cols * cellSize + 10, originY + rows * cellSize + 10, -1, -1],
  ]
  g.lineStyle(0.8, C.INK_FADED, 0.5)
  corners.forEach(([cx, cy, dx, dy]) => {
    g.beginPath()
    g.moveTo(cx, cy + 14 * dy)
    g.lineTo(cx, cy)
    g.lineTo(cx + 14 * dx, cy)
    g.strokePath()
  })

  return g
}
```

### Entry and Exit Zones

**Entry zone (top):** A small funnel/arrow drawn above column 1 (grid col index 0, so x=190, y=85). Label: "START" in TEXT.label. This is where the ball drops from.

**Exit zone (bottom):** A small target/landing pad drawn below the grid at column 7 (grid col index 7, so x=610, y=595). Label: "NEXT CHALLENGE" in TEXT.label with a small wax seal drawn via `JournalUI.drawWaxSeal`. This is where the ball should land.

---

## 2. Platform/Bumper List -- Career Stepping Stones

There are 10 platforms total. Each platform occupies one grid cell and has an angle (either `/` or `\`).

### Ball Movement Rules (needed to understand positions)

The ball enters a cell from one of 4 directions: UP, DOWN, LEFT, RIGHT.
- A `/` platform deflects: DOWN->LEFT, LEFT->DOWN, UP->RIGHT, RIGHT->UP
- A `\` platform deflects: DOWN->RIGHT, RIGHT->DOWN, UP->LEFT, LEFT->UP

The ball always enters the grid moving DOWN from the entry zone.

### Platform Definitions

The path is designed so the ball bounces through all 10 platforms in chronological order, tracing a zigzag journey across the grid. The path must be physically valid under the deflection rules.

```javascript
const PLATFORMS = [
  {
    id: 0,
    label: 'Law School',
    year: '2014',
    col: 0, row: 0,
    angle: '\\',  // ball enters DOWN, deflects RIGHT
    oneLiner: '2014 — International law. Shanghai. Row 4, back left.',
  },
  {
    id: 1,
    label: 'Startup Weekend',
    year: '2014',
    col: 3, row: 0,
    angle: '/',   // ball enters RIGHT, deflects UP... wait, we need DOWN flow
    // Let me trace the actual path:
  },
  // ... see full path trace below
]
```

### Complete Path Trace

The ball enters at col 0, moving DOWN.

```
Step 1: Ball enters col 0, row 0, moving DOWN
  Platform: "Law School" at (0,0), angle \
  Deflection: DOWN → RIGHT
  Ball exits moving RIGHT

Step 2: Ball moves RIGHT through cols 1, 2 to col 3, row 0
  Platform: "Startup Weekend" at (3,0), angle /
  Deflection: RIGHT → UP... ERROR — ball goes off grid

  REDESIGN: Need the path to stay on the grid.
```

Let me design a valid path properly. The ball starts at column 1 (not 0), moving DOWN from above row 0.

### FINAL VALID PATH (verified step by step)

```
Ball drops from above into (col 1, row 0), moving DOWN.

1. "Law School"         — (col 1, row 1), angle \
   Ball moving DOWN → deflects RIGHT.
   Ball moves RIGHT across row 1.

2. "Startup Weekend"    — (col 5, row 1), angle /
   Ball moving RIGHT → deflects UP.
   Ball moves UP through row 0 (stays in col 5).
   Ball hits top wall at (col 5, row 0) → wall bounce, now moving DOWN.
   Ball moves DOWN through rows 0, 1, 2...
   WAIT — it will hit platform 2 again.
```

This approach of tracing mid-design is error-prone. Let me lay out the complete path with a clean systematic design.

### VERIFIED PATH DESIGN

**Convention:** Ball enters each cell from a direction. The platform in that cell deflects it.

**Wall behavior:** When the ball hits a grid edge, it bounces back (reverses the component that hit the wall). Specifically:
- Hits left wall → direction reverses LEFT to RIGHT
- Hits right wall → direction reverses RIGHT to LEFT
- Hits top wall → direction reverses UP to DOWN
- Hits bottom wall → ball exits grid (game over / path end)

**NO wall bounces in the designed path.** The path uses only platform deflections. If the ball reaches an edge without a platform, it exits the grid (bad placement = path broken).

**Grid coordinates: (col, row) where col 0-7 is left-right, row 0-7 is top-bottom.**

```
Ball drops into the grid at col 1, moving DOWN from above.
Ball travels down column 1...

1. LAW SCHOOL — (1, 1), angle \
   DOWN → RIGHT. Ball moves right along row 1.

2. STARTUP WEEKEND — (4, 1), angle /
   RIGHT → UP. Ball moves up along col 4.
   Ball exits top of grid at col 4. ERROR.
```

Ok. Let me use a different strategy: design the path on paper first, then document it.

### PATH DESIGN (grid is 8x8, cols 0-7, rows 0-7)

Rules:
- `/` deflects: DOWN→LEFT, LEFT→DOWN, UP→RIGHT, RIGHT→UP
- `\` deflects: DOWN→RIGHT, RIGHT→DOWN, UP→LEFT, LEFT→UP
- Ball must not exit the grid except at the final destination (bottom)
- No wall bounces (clean path)

**Path:**

```
Ball enters moving DOWN at col 1, passes through row 0.

 1. LAW SCHOOL         (1, 1)  \    DOWN→RIGHT    →  moves right along row 1
 2. STARTUP WEEKEND    (4, 1)  /    RIGHT→UP      →  moves up along col 4
```

UP at col 4 exits the grid. Bad. Let me flip angle 2.

```
 1. LAW SCHOOL         (1, 1)  \    DOWN→RIGHT    →  moves right along row 1
 2. STARTUP WEEKEND    (4, 1)  \    RIGHT→DOWN    →  moves down along col 4
 3. FIRST SALES JOB    (4, 3)  /    DOWN→LEFT     →  moves left along row 3
 4. LATIN AMERICA      (1, 3)  \    LEFT→UP       →  moves up along col 1
```

UP at col 1 — will hit platform 1 again at (1,1). The ball would re-enter (1,1) moving UP and hit the `\` there: UP→LEFT, exits grid left. Bad.

Let me use different columns to avoid re-traversal.

```
 1. LAW SCHOOL         (1, 1)  \    DOWN→RIGHT    →  moves right along row 1
 2. STARTUP WEEKEND    (5, 1)  \    RIGHT→DOWN    →  moves down along col 5
 3. FIRST SALES JOB    (5, 3)  /    DOWN→LEFT     →  moves left along row 3
 4. LATIN AMERICA      (2, 3)  \    LEFT→UP       ... wait, \ with LEFT→UP
```

`\` deflects LEFT→UP. Ball moves UP along col 2. That eventually exits top. Bad.

`/` deflects LEFT→DOWN. So:

```
 4. LATIN AMERICA      (2, 3)  /    LEFT→DOWN     →  moves down along col 2
 5. TRAINING DOCTORS   (2, 5)  \    DOWN→RIGHT    →  moves right along row 5
 6. $1M ARR            (6, 5)  /    RIGHT→UP      →  moves up along col 6
```

UP along col 6 exits top. Bad. Use `\` instead:

```
 6. $1M ARR            (6, 5)  \    RIGHT→DOWN    →  moves down along col 6
 7. GREENLAND          (6, 7)  /    DOWN→LEFT     →  moves left along row 7
 8. AGENCY LAUNCH      (3, 7)  /    LEFT→DOWN     ... wait
```

`/` deflects LEFT→DOWN. But row 7 is the last row. DOWN exits the grid. Bad timing — we still have 2 platforms left.

Let me shift things up:

```
 1. LAW SCHOOL         (1, 0)  \    DOWN→RIGHT     →  right along row 0
 2. STARTUP WEEKEND    (5, 0)  \    RIGHT→DOWN     →  down along col 5
 3. FIRST SALES JOB    (5, 2)  /    DOWN→LEFT      →  left along row 2
 4. LATIN AMERICA      (2, 2)  /    LEFT→DOWN      →  down along col 2
 5. TRAINING DOCTORS   (2, 4)  \    DOWN→RIGHT     →  right along row 4
 6. $1M ARR            (6, 4)  \    RIGHT→DOWN     →  down along col 6
 7. GREENLAND          (6, 6)  /    DOWN→LEFT      →  left along row 6
 8. AGENCY LAUNCH      (3, 6)  /    LEFT→DOWN      →  down along col 3
 9. AI TOOLS           (3, 7)  \    DOWN→RIGHT     →  right along row 7
10. NEXT CHALLENGE     (6, 7)  /    RIGHT→UP       ... 
```

No — platform 10 should be the LAST bounce. After it, the ball should exit the bottom as the "destination." But RIGHT→UP sends it up. Let me make the last one end differently.

Actually, the "Next Challenge" / "HIRE ME" zone should be where the ball LANDS, not a platform. So we only need 9 platforms (steps 1-9), and the ball's final trajectory should take it to a landing zone.

Let me redesign with 9 platforms + 1 landing zone:

```
Ball enters moving DOWN at col 1.

 1. LAW SCHOOL         (1, 0)  \    DOWN→RIGHT     →  right along row 0
 2. STARTUP WEEKEND    (5, 0)  \    RIGHT→DOWN     →  down along col 5
 3. FIRST SALES JOB    (5, 2)  /    DOWN→LEFT      →  left along row 2
 4. LATIN AMERICA      (2, 2)  /    LEFT→DOWN      →  down along col 2
 5. TRAINING DOCTORS   (2, 4)  \    DOWN→RIGHT     →  right along row 4
 6. $1M ARR            (6, 4)  \    RIGHT→DOWN     →  down along col 6
 7. GREENLAND          (6, 6)  /    DOWN→LEFT      →  left along row 6
 8. AGENCY LAUNCH      (3, 6)  /    LEFT→DOWN      →  down along col 3
 9. AI TOOLS           (3, 7)  \    DOWN→RIGHT     →  right along row 7

Ball moves right along row 7 and reaches col 6.
LANDING ZONE at (6, 7) — "NEXT CHALLENGE / HIRE ME" — the ball rolls into this zone and stops.
```

This path is valid. Let me verify no collisions (no cell is used twice):
- (1,0), (5,0), (5,2), (2,2), (2,4), (6,4), (6,6), (3,6), (3,7) — all unique. Confirmed.

The ball travels through empty cells between platforms. Let me verify none of those traversed cells overlap with platform cells:
- Row 0: cols 2,3,4 (empty, fine)
- Col 5: rows 1 (empty, fine)
- Row 2: cols 3,4 (empty, fine)
- Col 2: row 3 (empty, fine)
- Row 4: cols 3,4,5 (empty, fine)
- Col 6: row 5 (empty, fine)
- Row 6: cols 4,5 (empty, fine)
- Col 3: (empty, 3,7 is a platform — ball enters 3,7 from above, that's correct)
- Row 7: cols 4,5 (empty, fine)

Path is clean. No cell is traversed twice. No collisions.

### Final Platform Table

| # | Label | Short Label | Col | Row | Angle | Ball enters | Ball exits | One-liner |
|---|-------|-------------|-----|-----|-------|-------------|------------|-----------|
| 1 | Law School (Shanghai) | Law School | 1 | 0 | `\` | DOWN | RIGHT | "2014 -- International law in Shanghai. Row 4, back left. Mind elsewhere." |
| 2 | Startup Weekend | Startup Wknd | 5 | 0 | `\` | RIGHT | DOWN | "48 hours. One pitch. Everything changed." |
| 3 | First Sales Job | First Sales | 5 | 2 | `/` | DOWN | LEFT | "First tech job. First cold call. First 'no.' Then the first 'yes.'" |
| 4 | Latin America Move | LatAm Move | 2 | 2 | `/` | LEFT | DOWN | "No Spanish. No network. Just a suitcase and a quota." |
| 5 | Training Doctors (KOLs) | Training KOLs | 2 | 4 | `\` | DOWN | RIGHT | "You can't hard-sell a surgeon. So I learned to teach." |
| 6 | $1M ARR | $1M ARR | 6 | 4 | `\` | RIGHT | DOWN | "11 countries. 200 doctors. One million in recurring revenue." |
| 7 | Greenland Expedition | Greenland | 6 | 6 | `/` | DOWN | LEFT | "Icebergs, wild dogs, dengue. Some grit you can't learn in an office." |
| 8 | Agency Launch | Agency Launch | 3 | 6 | `/` | LEFT | DOWN | "Went solo. Built systems for clients across 3 continents." |
| 9 | Clay / n8n / AI Tools | AI Tools | 3 | 7 | `\` | DOWN | RIGHT | "Clay, n8n, GPT. The GTM stack that makes one person feel like ten." |
| -- | LANDING ZONE | HIRE ME | 6 | 7 | (none) | RIGHT | (stops) | "Looking for the next challenge. Maybe it's yours." |

### Platform Data Structure

```javascript
const PLATFORMS = [
  { id: 0, label: 'Law School',       shortLabel: 'Law School',    col: 1, row: 0, angle: '\\', oneLiner: '2014 \u2014 International law in Shanghai. Row 4, back left. Mind elsewhere.' },
  { id: 1, label: 'Startup Weekend',  shortLabel: 'Startup Wknd',  col: 5, row: 0, angle: '\\', oneLiner: '48 hours. One pitch. Everything changed.' },
  { id: 2, label: 'First Sales Job',  shortLabel: 'First Sales',   col: 5, row: 2, angle: '/',  oneLiner: 'First tech job. First cold call. First "no." Then the first "yes."' },
  { id: 3, label: 'LatAm Move',       shortLabel: 'LatAm Move',    col: 2, row: 2, angle: '/',  oneLiner: 'No Spanish. No network. Just a suitcase and a quota.' },
  { id: 4, label: 'Training KOLs',    shortLabel: 'Training KOLs', col: 2, row: 4, angle: '\\', oneLiner: "You can\u2019t hard-sell a surgeon. So I learned to teach." },
  { id: 5, label: '$1M ARR',          shortLabel: '$1M ARR',       col: 6, row: 4, angle: '\\', oneLiner: '11 countries. 200 doctors. One million in recurring revenue.' },
  { id: 6, label: 'Greenland',        shortLabel: 'Greenland',     col: 6, row: 6, angle: '/',  oneLiner: 'Icebergs, wild dogs, dengue. Some grit you can\u2019t learn in an office.' },
  { id: 7, label: 'Agency Launch',    shortLabel: 'Agency Launch',  col: 3, row: 6, angle: '/',  oneLiner: 'Went solo. Built systems for clients across 3 continents.' },
  { id: 8, label: 'AI Tools',         shortLabel: 'AI Tools',      col: 3, row: 7, angle: '\\', oneLiner: 'Clay, n8n, GPT. The GTM stack that makes one person feel like ten.' },
]

const LANDING_ZONE = { col: 6, row: 7, label: 'HIRE ME' }
```

---

## 3. Ball Physics

### Movement Model

The ball does NOT use Phaser's physics engine. It uses **tween-based step animation** -- the ball moves from cell to cell along its path.

**Speed:** The ball moves at a constant speed of **120px per second** (2 cells per second at 60px cell size). This gives a steady, readable pace. During Phase 1 (Watch), the ball pauses briefly at each platform for the one-liner. During Phase 3 (Verify), the ball moves at the same speed but without pauses.

### Movement Implementation

```javascript
// Convert grid position to pixel center
_cellCenter(col, row) {
  return {
    x: GRID.originX + col * GRID.cellSize + GRID.cellSize / 2,
    y: GRID.originY + row * GRID.cellSize + GRID.cellSize / 2,
  }
}

// Ball travels from one cell to the next
// Returns array of {col, row} for every cell the ball passes through
_tracePath() {
  const path = []
  let col = 1, row = -1  // starts above grid
  let dir = 'DOWN'

  // Entry: ball drops from above into the grid
  path.push({ col: 1, row: -1, dir: 'DOWN', platform: null })

  while (true) {
    // Move one step in current direction
    if (dir === 'DOWN')  row++
    if (dir === 'UP')    row--
    if (dir === 'LEFT')  col--
    if (dir === 'RIGHT') col++

    // Check bounds -- if off grid, path ends
    if (col < 0 || col >= GRID.cols || row < 0 || row >= GRID.rows) break

    // Check for platform at this cell
    const plat = PLATFORMS.find(p => p.col === col && p.row === row)

    // Check for landing zone
    if (col === LANDING_ZONE.col && row === LANDING_ZONE.row) {
      path.push({ col, row, dir, platform: 'LANDING' })
      break
    }

    if (plat) {
      path.push({ col, row, dir, platform: plat })
      dir = _deflect(dir, plat.angle)
    } else {
      path.push({ col, row, dir, platform: null })
    }
  }
  return path
}

_deflect(dir, angle) {
  if (angle === '/') {
    return { DOWN: 'LEFT', LEFT: 'DOWN', UP: 'RIGHT', RIGHT: 'UP' }[dir]
  } else {
    return { DOWN: 'RIGHT', RIGHT: 'DOWN', UP: 'LEFT', LEFT: 'UP' }[dir]
  }
}
```

### Ball Visual

The ball is a **wax seal dot** -- a small filled circle (radius 8px) with a subtle highlight, drawn in `C.WAX_RED` with a lighter `C.WAX_RED_LIGHT` inner circle (radius 4px). It leaves a faint ink trail behind it as it moves (a dotted line of `C.INK_FADED` at alpha 0.15).

```javascript
_createBall() {
  const g = this.add.graphics()
  g.fillStyle(C.WAX_RED, 1)
  g.fillCircle(0, 0, 8)
  g.fillStyle(C.WAX_RED_LIGHT, 1)
  g.fillCircle(-2, -2, 4)
  g.generateTexture('ball', 20, 20)
  g.destroy()
  this._ball = this.add.image(0, 0, 'ball').setOrigin(0.5).setVisible(false)
}
```

### Trail Effect

As the ball moves, it leaves behind faint dots every 15px along its path. Each dot is a circle (radius 1.5px) drawn in `C.INK_FADED` at alpha 0.12. The trail persists during Phase 1 to help the player remember the path. The trail is cleared before Phase 2.

---

## 4. Phase 1 -- WATCH

**Duration:** ~18-22 seconds total (varies based on path length)

### Sequence

```
0.0s   Scene fades in. Parchment background drawn.
       Header: "Chapter 5" (TEXT.label, x:40, y:30)
       "Pinball Recall" (TEXT.heading, x:40, y:50)
       Grid is drawn with all 9 platforms visible.
       Each platform is drawn as a diagonal ink line inside its cell.
       Each platform has its short label written in TEXT.label below/beside the line.
       Landing zone shows a small wax seal with "HIRE ME" text.

0.5s   Instruction text appears at right panel (x:680, y:120):
       "Watch the ball trace Augustin's career path."
       "Then place the platforms from memory."
       (TEXT.bodyItalic, color INK_LIGHT, max width 280px)

1.5s   Ball appears at entry point (col 1, above grid).
       Ball drops into the grid.

2.0s   Ball hits Platform 1 (Law School).
       BOUNCE EFFECT: Platform line flashes bright (alpha 1.0 → glow for 200ms)
       A small burst of 4-6 ink particles sprays from the collision point.
       One-liner text appears in the narrative area (right panel, x:680, y:200):
         "2014 -- International law in Shanghai."
         "Row 4, back left. Mind elsewhere."
       Text uses TEXT.bodyItalic, fades in over 200ms.
       Ball pauses for 800ms at the platform (total dwell: ~1s).

~3.0s  Ball moves RIGHT along row 0 toward Platform 2.
       Previous one-liner fades out as ball approaches next platform (crossfade).

~4.5s  Ball hits Platform 2 (Startup Weekend).
       Same bounce effect. New one-liner appears.
       Ball pauses 800ms.

... continues for all 9 platforms ...

~18s   Ball reaches Landing Zone (6, 7).
       Special effect: the wax seal at the landing zone pulses.
       Final one-liner: "Looking for the next challenge. Maybe it's yours."
       Ball settles into the landing zone and stops.

~20s   After 2s pause, all platform labels briefly flash once (200ms glow).
       Text appears: "Memorize the positions."
       Platforms begin to fade out over 1.5s (alpha 1.0 → 0.0).
       The trail also fades out.

~22s   Grid is empty. Phase 2 begins.
```

### Per-bounce Timing Breakdown

Each platform encounter takes approximately:
- Travel time to reach platform: varies (1-2s depending on distance)
- Platform hit effect: 200ms
- One-liner display + pause: 800ms

Total estimated: ~1.5s per platform average x 9 platforms + travel overhead = ~18s

### Bounce Visual Effect

When the ball hits a platform:
1. The platform line flashes from `C.INK` to `C.PARCHMENT` and back (100ms each way)
2. A small screen shake (intensity 1, duration 100ms)
3. 4-6 tiny ink particles (circles, radius 1-2px, `C.INK` alpha 0.5) spray outward from the collision point in a fan pattern, then fade over 300ms
4. The platform's label text briefly scales up from 1.0 to 1.15 and back (200ms tween)

---

## 5. Phase 2 -- RECALL

**Duration:** 45 seconds (countdown timer visible)

### Layout

**Grid area (left):** Same grid, now empty (no platforms visible). Grid lines and intersection dots remain.

**Platform tray (right side):** A vertical list of all 9 platforms, displayed as draggable "pieces" in the right panel.

```
Tray area: x=680, y=100, width=280, height=480
```

Each piece in the tray is a small card (250w x 42h) containing:
- The platform's short label (TEXT.body, 12px)
- A small diagonal line icon showing the current angle (/ or \)
- Ink-outlined border (0.5px, INK, alpha 0.3)

The pieces are listed in **randomized order** (not chronological) to prevent simple pattern matching.

### Timer

A countdown timer is displayed at the top-right (x:1200, y:40):
- Format: "0:45" counting down
- Uses TEXT.stat style, bold
- At 10 seconds remaining: text color changes to `COLORS.WAX_RED` and pulses (alpha 0.7-1.0, 500ms yoyo)
- At 0 seconds: Phase 2 ends automatically, whatever is placed stays

### Drag and Drop Mechanics

**Picking up a piece:**
1. Player clicks on a tray piece
2. Piece follows the cursor (setPosition to pointer x,y on pointermove)
3. While dragging, the piece has a slight drop shadow (second rectangle offset +2,+2, INK alpha 0.1)
4. Grid cells highlight on hover: when the dragged piece is over a grid cell, that cell gets a faint fill (`C.INK_FADED`, alpha 0.08)

**Placing a piece:**
1. Player releases the mouse button while over a grid cell
2. The piece snaps to the center of that cell
3. The piece is removed from the tray
4. A small "placed" sound effect cue: the piece does a quick scale-bounce (1.0 → 1.1 → 1.0, 150ms)
5. The diagonal line is drawn inside the cell at the placed angle
6. The label appears below the diagonal line in TEXT.label

**Removing a placed piece:**
1. Player clicks on a piece already placed on the grid
2. Piece returns to the tray (tweens back to its tray position over 200ms)
3. The cell is cleared

**Toggling angle:**
1. Player RIGHT-CLICKS on a placed piece (or on a tray piece before placing)
2. The angle toggles: `/` becomes `\` and vice versa
3. The diagonal line redraws with the new angle
4. A small rotate animation (the line rotates 90 degrees over 150ms)

**Alternative angle toggle (for trackpad users):**
1. A small toggle button appears next to each tray piece: a tiny `[/]` button (20x20px)
2. Clicking it toggles the angle
3. For placed pieces, double-clicking toggles the angle

### Tray Visual

```javascript
_drawTray() {
  // Tray background: slight parchment panel with ruled lines
  const g = this.add.graphics()
  g.fillStyle(C.PARCHMENT_DARK, 0.15)
  g.fillRect(670, 90, 290, 500)
  g.lineStyle(0.5, C.INK, 0.2)
  g.strokeRect(670, 90, 290, 500)

  // Header
  this.add.text(815, 100, 'CAREER STEPS', {
    ...TEXT.label,
    fontSize: '10px',
    fontStyle: 'bold',
  }).setOrigin(0.5)

  // Hint text
  this.add.text(815, 118, 'Drag to grid. Right-click to rotate.', {
    ...TEXT.small,
    fontSize: '9px',
  }).setOrigin(0.5)
}
```

### Platform Piece in Tray

Each piece starts with a RANDOM default angle (50% chance `/` or `\`). This means the player must remember BOTH position AND angle.

```javascript
_createTrayPiece(platform, index) {
  const trayX = 815  // center of tray
  const trayY = 140 + index * 48
  const container = this.add.container(trayX, trayY)

  // Background card
  const bg = this.add.rectangle(0, 0, 250, 42, C.PARCHMENT, 0.01)
  bg.setStrokeStyle(0.5, C.INK, 0.3)
  bg.setInteractive({ useHandCursor: true, draggable: true })

  // Label
  const label = this.add.text(-100, 0, platform.shortLabel, {
    ...TEXT.body,
    fontSize: '12px',
  }).setOrigin(0, 0.5)

  // Angle indicator (drawn line)
  const angleLine = this.add.graphics()
  // ... draw / or \ inside a small 24x24 box at right side of card

  // Angle toggle button
  const toggleBtn = this.add.rectangle(105, 0, 24, 24, C.PARCHMENT_DARK, 0.3)
  toggleBtn.setStrokeStyle(0.5, C.INK, 0.2)
  toggleBtn.setInteractive({ useHandCursor: true })
  const toggleLabel = this.add.text(105, 0, platform._currentAngle, {
    ...TEXT.body, fontSize: '14px',
  }).setOrigin(0.5)

  container.add([bg, label, angleLine, toggleBtn, toggleLabel])

  // Drag handlers
  this.input.setDraggable(bg)
  bg.on('drag', (pointer, dragX, dragY) => {
    container.setPosition(dragX, dragY)
  })
  bg.on('dragend', (pointer) => {
    // Snap to grid cell or return to tray
    const gridCol = Math.floor((pointer.x - GRID.originX) / GRID.cellSize)
    const gridRow = Math.floor((pointer.y - GRID.originY) / GRID.cellSize)
    if (gridCol >= 0 && gridCol < GRID.cols && gridRow >= 0 && gridRow < GRID.rows) {
      // Check cell not already occupied
      // Snap to cell center
      // Mark as placed
    } else {
      // Return to tray position
      container.setPosition(trayX, trayY)
    }
  })

  // Right-click to toggle angle
  bg.on('pointerdown', (pointer) => {
    if (pointer.rightButtonDown()) {
      platform._currentAngle = platform._currentAngle === '/' ? '\\' : '/'
      // Redraw angle indicator
    }
  })

  return container
}
```

### What Happens When Timer Expires

When the 45-second timer hits 0:
1. Timer text flashes red 3 times (200ms each)
2. All pieces still in the tray are ignored (counted as not placed)
3. Pieces already on the grid are locked in place
4. A 1s pause, then Phase 3 begins
5. Text appears: "Let's see how you did." (TEXT.prompt, centered above grid, fades in)

---

## 6. Phase 3 -- VERIFY

**Duration:** ~15-20 seconds

### Ball Re-drop

The ball re-appears at the entry point (col 1, above grid) and drops again. This time it moves at the SAME speed (120px/s) but with NO pauses at platforms. The total animation is faster because there's no one-liner delay.

### Verification Logic

For each cell the ball visits (following the ORIGINAL correct path):

**If the player placed the CORRECT platform at the CORRECT position with the CORRECT angle:**
- Ball bounces correctly (deflects as expected)
- Platform line turns `C.STAMP_GREEN` (green stamp color)
- A small green checkmark stamp appears next to the cell (drawn as two ink lines forming a V)
- Label text turns green
- Score: +11 points (9 platforms x 11 = 99, +1 for landing = 100)

**If the player placed the CORRECT platform at the CORRECT position but WRONG angle:**
- Ball passes THROUGH the cell without deflecting (the angle was wrong, so the platform "doesn't work")
- Platform line turns `C.RED_MARGIN` (red)
- A small red X appears next to the cell
- The CORRECT angle is shown as a ghosted green line in the cell (alpha 0.3)
- Score: +3 points (partial credit for remembering position)
- Ball continues in its CURRENT direction (not the correct path direction) — this means subsequent platforms may also be missed. However, see "Verification Mode" below.

**If the player placed NOTHING at a platform position (cell is empty):**
- Ball passes through the empty cell
- The correct platform position is revealed: a ghosted green diagonal line appears (alpha 0.3) with the label in green ink
- Score: 0 for this platform

**If the player placed a platform in a WRONG position:**
- That platform is shown in red wherever they placed it
- The correct position is revealed in green ghost

### Verification Mode: Fixed Path Replay

To make the verification visually clear and avoid the ball going wildly off-course after one wrong platform, use this approach:

**The ball ALWAYS follows the correct path during verification.** At each platform cell:
- If the player's placement is correct: the ball bounces naturally, green glow
- If wrong: the ball briefly hesitates (100ms pause), a red flash appears, then the ball continues along the CORRECT path (as if the ghost platform caught it)
- This ensures all 9 platforms get evaluated regardless of early mistakes

This is important because otherwise one wrong platform at step 2 would cause the ball to miss all subsequent platforms, making the verification uninformative.

### Verification Sequence

```
Ball drops into grid.
For each platform position in order (1-9):
  Ball travels to the correct cell.
  Check: did the player place the right piece here with the right angle?
    YES → green stamp, +11 points
    PARTIAL (right position, wrong angle) → yellow/amber mark, +3 points
    WRONG (right piece, wrong position) → red X at wrong position + green ghost at correct, +0
    MISSING → green ghost appears, +0

Ball reaches landing zone.
  If it arrived via all correct placements: wax seal pulses gold, landing zone lights up
  Otherwise: landing zone shows normally

Pause 1s.
Score summary appears.
```

### Landing Zone Bonus

If the player gets ALL 9 platforms correct (perfect score), the landing zone triggers a special effect:
- The "HIRE ME" text transforms into "YOU'RE HIRED" with a wax seal stamp animation
- +1 bonus point (bringing total to 100)
- Confetti-like ink splatter particles burst across the screen (20-30 small ink dots in various colors from the stamp palette: STAMP_GREEN, STAMP_BLUE, RED_MARGIN)

---

## 7. Difficulty Progression

### Single Round (Recommended for target audience)

**Use one round with all 9 platforms.** Rationale:
- Target audience is busy recruiters (60-90 seconds is the sweet spot)
- 9 platforms is challenging but not overwhelming (Lumosity Pinball Recall typically uses 5-8)
- Multiple rounds would push total playtime past 2 minutes for the final level
- The one-liner narrative flow works best as a single uninterrupted career story

### Optional: Progressive Reveal (if playtesting shows 9 is too hard)

If the difficulty needs to be reduced, implement a "hint system" instead of multiple rounds:

**Hint 1 (free):** The grid shows faint ghost dots at the 9 correct positions (not which platform, just that a platform goes there). Player still needs to assign the right platform and angle.

**Hint 2 (costs 10 points):** Player can click a "Show Path" button that briefly (2s) shows the ball's trail from Phase 1 as a dotted line. Deducts 10 from final score.

**Hint 3 (costs 5 points per use):** Player can click a "Peek" button on any tray piece to see that specific piece flash at its correct grid position for 0.5s. Costs 5 points per peek.

Hints appear as small ink-drawn buttons below the timer in the right panel.

---

## 8. Scoring

### Score Calculation (0-100)

```javascript
const POINTS_CORRECT = 11       // right platform, right position, right angle
const POINTS_PARTIAL = 3        // right platform, right position, wrong angle
const POINTS_WRONG_POS = 0      // wrong position
const POINTS_MISSING = 0        // not placed
const POINTS_PERFECT_BONUS = 1  // all 9 correct

// Per platform:
//   Check: is the platform at (correctCol, correctRow)?
//     YES: is the angle correct?
//       YES: +11 (CORRECT)
//       NO: +3 (PARTIAL)
//     NO: +0 (WRONG/MISSING)

// Total = sum of all platform scores + perfect bonus
// Max = 9 * 11 + 1 = 100
// Min = 0
```

### Score Interpretation (shown on completion screen)

| Score | Rating | Message |
|-------|--------|---------|
| 100 | PERFECT | "Flawless recall. You know this career better than most." |
| 80-99 | EXCELLENT | "Impressive. You followed the journey closely." |
| 60-79 | GOOD | "You caught the key pivots. The story stuck." |
| 40-59 | FAIR | "Some steps got shuffled. The career's more winding than it looks." |
| 20-39 | ROUGH | "A few pieces clicked. Maybe worth a second read." |
| 0-19 | MISSED | "The path's still a mystery. Replay to see it again." |

### Stats Awarded

This level does NOT award new stats. It is the synthesis level. However, the completion screen displays ALL stats earned across levels 1-4.

### Registry Save

```javascript
completeLevel(this, KEYS.SCORE_L5, KEYS.COMPLETED_L5, totalScore)
```

---

## 9. Controls

### Mouse Controls (Primary)

| Action | Input | Context |
|--------|-------|---------|
| Pick up tray piece | Left-click + drag | Phase 2, piece in tray |
| Place piece on grid | Release drag over grid cell | Phase 2 |
| Remove placed piece | Left-click on placed piece | Phase 2, piece on grid |
| Toggle angle | Right-click on piece | Phase 2, any piece |
| Toggle angle (alt) | Double-click on piece | Phase 2, any piece (trackpad-friendly) |
| Toggle angle (alt 2) | Click the `[/]` button on tray piece | Phase 2, piece in tray |
| Use hint | Left-click hint button | Phase 2 |
| Skip intro | SPACE | Phase 1 intro (before ball drops) |
| Continue | SPACE | After Phase 3 score reveal |
| Return to hub | ESC | Any time |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| SPACE | Skip/continue (context-dependent) |
| ESC | Return to Level Select Hub |
| R | Reset all placed pieces to tray (Phase 2 only) |
| H | Use cheapest available hint (Phase 2 only) |

### Right-click Context Menu

Disable the browser's right-click context menu on the game canvas to allow right-click angle toggling:

```javascript
this.game.canvas.addEventListener('contextmenu', e => e.preventDefault())
```

---

## 10. UI Layout

### Full Screen Layout (1280x720)

```
+------------------------------------------------------------------+
|  Chapter 5                                          0:45    p.10  |
|  PINBALL RECALL                                                   |
|                                                                   |
|   +--[START]--+                    +---------------------------+  |
|   |           |                    | CAREER STEPS              |  |
|   |           |                    | Drag to grid. R-click     |  |
|   |           |                    | to rotate.                |  |
|   |   8x8     |                    |                           |  |
|   |   GRID    |                    | [Law School        /]    |  |
|   |           |                    | [Startup Wknd      \]    |  |
|   |           |                    | [First Sales       /]    |  |
|   |           |                    | [LatAm Move        \]    |  |
|   |           |                    | [Training KOLs     /]    |  |
|   |           |                    | [#1M ARR           \]    |  |
|   |           |                    | [Greenland         /]    |  |
|   |           |                    | [Agency Launch     \]    |  |
|   |           |                    | [AI Tools          /]    |  |
|   +--[HIRE ME]+                    +---------------------------+  |
|                                                                   |
|   "2014 -- International law in Shanghai..."                      |
|                                    [Show Path -10]  [Peek -5]    |
+------------------------------------------------------------------+

Grid:     x=160-640, y=100-580 (480x480)
Tray:     x=680-960, y=100-570 (280x470)
Timer:    x=1150, y=40
Narrative: x=160, y=600, w=500 (one-liner text during Phase 1)
Hints:    x=820, y=595 (during Phase 2)
Page num: x=1240, y=690
```

### Phase-Specific UI States

**Phase 1 (Watch):**
- Grid visible with all platforms and labels
- Tray area shows instruction text instead of pieces
- Narrative text area (bottom-left) shows one-liners as ball bounces
- No timer

**Phase 2 (Recall):**
- Grid visible but empty (no platforms)
- Tray shows all 9 draggable pieces in random order
- Timer counts down at top-right
- Hint buttons visible at bottom-right
- Narrative area shows "Place the career steps from memory."

**Phase 3 (Verify):**
- Grid shows player's placed pieces (being evaluated)
- Tray is hidden
- No timer
- Score counter appears at top-right, incrementing as correct placements are confirmed
- Narrative area shows brief feedback per platform

---

## 11. Career One-Liners (Complete)

These appear in the narrative area during Phase 1 as the ball bounces off each platform. They also briefly reappear during Phase 3 for correctly placed platforms.

| # | Platform | One-Liner |
|---|----------|-----------|
| 1 | Law School | "2014 -- International law in Shanghai. Row 4, back left. Mind elsewhere." |
| 2 | Startup Weekend | "48 hours. One pitch. Everything changed." |
| 3 | First Sales Job | "First tech job. First cold call. First 'no.' Then the first 'yes.'" |
| 4 | LatAm Move | "No Spanish. No network. Just a suitcase and a quota." |
| 5 | Training KOLs | "You can't hard-sell a surgeon. So I learned to teach." |
| 6 | $1M ARR | "11 countries. 200 doctors. One million in recurring revenue." |
| 7 | Greenland | "Icebergs, wild dogs, dengue. Some grit you can't learn in an office." |
| 8 | Agency Launch | "Went solo. Built systems for clients across 3 continents." |
| 9 | AI Tools | "Clay, n8n, GPT. The GTM stack that makes one person feel like ten." |
| -- | Landing Zone | "Looking for the next challenge. Maybe it's yours." |

---

## 12. Completion Screen -- CAREER COMPLETE

This is the FINAL screen of the entire game. It replaces the current InterviewRoomScene report card. It must feel like a culmination.

### Trigger

After Phase 3 verification completes and the score is shown, a 2-second pause, then the screen transitions.

### Transition Effect

```
1. All game elements (grid, platforms, ball) tween alpha to 0 over 800ms
2. Screen flashes briefly to parchment (clean slate)
3. New parchment draws in with JournalUI.drawParchment()
```

### Completion Screen Layout (3 sections)

#### Section 1: Career Map (top, y=40-280)

A miniature version of the grid path is drawn as a simple connected line (not the full grid -- just the zigzag career path as a journey line). Each career step is a node on the line with a small dot and its label.

The line draws itself progressively (animated over 3s) using a path tween, as if being drawn by an ink pen. This mirrors the ball's journey but as a clean career timeline.

```
LAW SCHOOL ──── STARTUP WKND
                     |
LATAM MOVE ──── FIRST SALES
     |
TRAINING KOLs ──── $1M ARR
                      |
AGENCY LAUNCH ── GREENLAND
     |
AI TOOLS ──────── HIRE ME ★
```

Each node appears with a small pop animation (scale 0→1, 100ms) as the line reaches it. The year appears below each node in TEXT.label.

#### Section 2: Score + Stats (middle, y=290-460)

**Score display:**
```
CAREER RECALL: 87%
"Impressive. You followed the journey closely."
```

Score number animates from 0 to final value over 1s (counting up effect). Uses TEXT.stat, 36px, bold. Rating text appears below in TEXT.bodyItalic.

**Stats summary (all stats from all levels):**

Six stat bars arranged in 2 columns of 3, showing all stats earned across the game:

```
Curiosity    ████████░░  72     Sales        ██████████  95
EQ           ███████░░░  65     Grit         █████████░  88
Independence ████████░░  78     Tech         ██████░░░░  55
```

Each bar animates from 0 to its value over 800ms (staggered 100ms apart). Uses the same bar style as the current InterviewRoomScene report card (see `_showReportCard()`).

#### Section 3: CTA (bottom, y=470-680)

The player's name (from registry) appears in a personal message:

```
"Thanks for playing, {playerName}."
"You just lived 10 years of career pivots in 15 minutes."
"If this story resonates, let's talk."
```

Text uses TEXT.heading (first line), TEXT.bodyItalic (second and third lines). Lines stagger in 300ms apart.

**Three CTA buttons** (same style as current `_drawCTA()` but larger and more prominent):

```
+--------------------+  +--------------------+  +--------------------+
|   BOOK A CALL      |  |     LINKEDIN       |  |    DOWNLOAD CV     |
|   calendly.com     |  |   /in/augustinr    |  |                    |
+--------------------+  +--------------------+  +--------------------+
```

Button dimensions: 280w x 60h (larger than current 200x50)
Button positions: centered at x=250, x=640, x=1030, y=560

**Button style (upgraded from current):**
```javascript
_drawCTAButton(x, y, label, subtitle, url) {
  const w = 280, h = 60

  // Leather-style button
  const bg = this.add.rectangle(x, y, w, h, C.LEATHER_DARK)
  bg.setStrokeStyle(1.5, C.INK_LIGHT, 0.5)
  bg.setInteractive({ useHandCursor: true })

  // Main label
  this.add.text(x, y - 8, label, {
    fontFamily: FONT,
    fontSize: '16px',
    color: COLORS.PARCHMENT,
    fontStyle: 'bold',
  }).setOrigin(0.5)

  // Subtitle (URL hint)
  if (subtitle) {
    this.add.text(x, y + 12, subtitle, {
      fontFamily: FONT,
      fontSize: '10px',
      color: COLORS.PARCHMENT_DARK,
    }).setOrigin(0.5)
  }

  // Hover effects
  bg.on('pointerover', () => {
    bg.setFillStyle(C.LEATHER)
    bg.setStrokeStyle(2, C.RED_MARGIN, 0.7)
    // Scale up slightly
    this.tweens.add({ targets: bg, scaleX: 1.03, scaleY: 1.03, duration: 100 })
  })
  bg.on('pointerout', () => {
    bg.setFillStyle(C.LEATHER_DARK)
    bg.setStrokeStyle(1.5, C.INK_LIGHT, 0.5)
    this.tweens.add({ targets: bg, scaleX: 1.0, scaleY: 1.0, duration: 100 })
  })
  bg.on('pointerdown', () => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  })
}
```

**CTA URLs:**
- Book a Call: `https://calendly.com/augustinromaneschi`
- LinkedIn: `https://linkedin.com/in/augustinr`
- Download CV: `null` (placeholder -- replace with actual CV link when uploaded)

#### Wax Seal Signature

A `JournalUI.drawWaxSeal(this, 1180, 660, 'A', 22)` is drawn in the bottom-right corner as a signature mark.

#### Return to Hub

Small text at very bottom: "PRESS SPACE to replay / ESC to return to hub" (TEXT.small, centered, y=700)

### Perfect Score Special Effect

If the player scored 100 (perfect):
1. The career path line on the completion screen draws in GOLD (`C.INK_LIGHT` instead of `C.INK`)
2. A "PERFECT RECALL" stamp appears (using JournalUI.drawPassportStamp aesthetic):
   - Rotated 15 degrees
   - Positioned at x=900, y=200
   - Text: "PERFECT RECALL"
   - Year: "2026"
   - Color: STAMP_GREEN
3. The wax seal in the corner is larger (size 30 instead of 22)

---

## 13. Visual Details

### Grid Drawing (Phaser Primitives)

**Grid lines:** Drawn with `graphics.lineStyle(0.5, C.INK, 0.15)` -- very faint so they read as a subtle game board, not overwhelming.

**Intersection dots:** `graphics.fillCircle(x, y, 2)` at each grid intersection, using `C.INK` at alpha 0.12. These are the small dots visible in the reference image.

**Cell highlight (during drag):** A filled rectangle `graphics.fillRect(cellX, cellY, 60, 60)` using `C.INK_FADED` at alpha 0.08. Only the cell under the cursor highlights.

### Platform Drawing

Each platform is a diagonal line inside its cell:

```javascript
_drawPlatform(g, col, row, angle, color = C.INK, alpha = 0.8) {
  const x = GRID.originX + col * GRID.cellSize
  const y = GRID.originY + row * GRID.cellSize
  const pad = 8  // padding from cell edges

  g.lineStyle(2.5, color, alpha)
  g.beginPath()
  if (angle === '/') {
    g.moveTo(x + pad, y + GRID.cellSize - pad)         // bottom-left
    g.lineTo(x + GRID.cellSize - pad, y + pad)          // top-right
  } else {
    g.moveTo(x + pad, y + pad)                           // top-left
    g.lineTo(x + GRID.cellSize - pad, y + GRID.cellSize - pad) // bottom-right
  }
  g.strokePath()
}
```

**Line thickness:** 2.5px for platforms (thick enough to read as a bumper/deflector).
**Line ends:** No special caps (Phaser default round caps work fine).
**Label:** Positioned 2px below the line center, TEXT.label (9px, italic, INK_LIGHT).

### Ball Animation

The ball moves between cells using Phaser tweens:

```javascript
_animateBallToCell(col, row, duration, onComplete) {
  const target = this._cellCenter(col, row)
  this.tweens.add({
    targets: this._ball,
    x: target.x,
    y: target.y,
    duration: duration,
    ease: 'Linear',
    onComplete: onComplete,
  })
}
```

**Between platforms:** Ball moves at constant speed through empty cells. The tween duration for each cell-to-cell movement = `GRID.cellSize / BALL_SPEED * 1000` = 60/120*1000 = 500ms per cell.

**On bounce:** When hitting a platform, the ball's tween sequence is:
1. Move INTO the platform cell (500ms)
2. Brief pause (50ms -- barely perceptible, just enough for the hit effect to register)
3. During Phase 1: additional pause for one-liner display (750ms)
4. Move OUT of the platform cell in the new direction

### Trail Particles

As the ball moves, tiny circles are left behind:

```javascript
_dropTrailDot(x, y) {
  const g = this.add.graphics()
  g.fillStyle(C.INK_FADED, 0.12)
  g.fillCircle(x, y, 1.5)
  this._trailDots.push(g)
}

// Called every 15px of ball movement (tracked by distance accumulator)
```

### Bounce Particles (Ink Spray)

When the ball hits a platform, 4-6 small particles spray out:

```javascript
_spawnBounceParticles(x, y, exitDir) {
  const count = 4 + Math.floor(Math.random() * 3)
  for (let i = 0; i < count; i++) {
    const angle = (Math.random() - 0.5) * Math.PI * 0.8  // ~72-degree fan
    // Rotate fan to face exit direction
    const baseAngle = { RIGHT: 0, DOWN: Math.PI/2, LEFT: Math.PI, UP: -Math.PI/2 }[exitDir]
    const finalAngle = baseAngle + angle
    const speed = 30 + Math.random() * 50
    const dot = this.add.circle(x, y, 1 + Math.random(), C.INK, 0.5)
    this.tweens.add({
      targets: dot,
      x: x + Math.cos(finalAngle) * speed,
      y: y + Math.sin(finalAngle) * speed,
      alpha: 0,
      duration: 300 + Math.random() * 200,
      ease: 'Quad.easeOut',
      onComplete: () => dot.destroy(),
    })
  }
}
```

### Glow Effect (Platform Hit)

When a platform is hit, it briefly "glows" by being redrawn at higher alpha and slightly thicker:

```javascript
_flashPlatform(col, row, angle) {
  const g = this.add.graphics()
  // Draw a thicker, brighter version
  this._drawPlatform(g, col, row, angle, C.PARCHMENT, 1.0)
  g.lineStyle(4, C.PARCHMENT, 0.6)
  // ... redraw the line

  // Fade out over 300ms
  this.tweens.add({
    targets: g,
    alpha: 0,
    duration: 300,
    onComplete: () => g.destroy(),
  })
}
```

### Landing Zone Visual

The landing zone at (6, 7) is drawn as:
- A small wax seal (using JournalUI.drawWaxSeal pattern but smaller, radius 14)
- Surrounded by a faint dashed circle (radius 20, dashed via arc segments)
- Label "HIRE ME" in TEXT.label, bold, below the seal

When the ball reaches it:
- The seal pulses (scale 1.0 → 1.2 → 1.0, 400ms, yoyo x2)
- A ring of particles expands outward from the seal (8 dots in a circle, expanding to radius 40, then fading)

---

## 14. Edge Cases

### Player places nothing (0 platforms placed)
- Phase 3 proceeds normally: ball drops, all 9 correct positions are revealed as green ghosts
- Score: 0
- Message: "The path's still a mystery. Replay to see it again."
- The completion screen still shows, with all stat bars from previous levels
- CTA buttons still appear (the point is always to convert)

### Player gets everything wrong (all in wrong positions)
- Same as above: score 0, all correct positions revealed
- Each wrongly-placed platform is shown in red at its wrong position, then the correct position ghosts in green
- The player sees the full correct path for learning

### Player places some but not all
- Unplaced platforms are scored as 0
- Placed platforms are evaluated normally
- Partial scores are awarded

### Player runs out of time with pieces being dragged
- If a piece is mid-drag when timer expires, it snaps back to the tray (not placed)
- Only pieces fully placed on the grid count

### Player double-places (tries to put two pieces in same cell)
- Second piece is rejected: it bounces back to the tray with a small shake animation
- A brief tooltip appears: "Cell occupied" (TEXT.small, fades after 1s)

### Player places platform on the landing zone cell
- Allowed (it's a valid grid cell), but it won't match any correct platform position (landing zone is not a platform), so it scores 0

### Right-click not available (some trackpads, some browsers)
- Double-click is the fallback for angle toggling
- The `[/]` toggle button on each tray piece is always available
- Instruction text mentions both: "Right-click or double-click to rotate"

### Browser context menu appears despite prevention
- The `preventDefault()` on contextmenu should handle this
- If it fails, double-click and the toggle button are adequate fallbacks

### Screen too small (canvas scaling)
- Phaser FIT scaling handles this (configured in GameConfig)
- Grid and tray positions use absolute coordinates within the 1280x720 canvas
- No responsive adjustments needed

### Replay
- Player presses SPACE on completion screen to replay
- Scene restarts from Phase 1 with a fresh grid
- Previous score is preserved in registry (only overwritten if new score is higher)

---

## 15. Implementation Checklist

```
[ ] Scene setup (extend Phaser.Scene, constructor key, imports)
[ ] drawParchment background
[ ] drawGrid with intersection dots and corner ornaments
[ ] Platform data structure (PLATFORMS array)
[ ] Path tracer (_tracePath, _deflect)
[ ] Ball creation (wax seal texture)
[ ] Ball tween animation system
[ ] Trail dot system
[ ] Phase 1: Watch
    [ ] Platform drawing with labels
    [ ] Ball drop and bounce animation
    [ ] One-liner text display per bounce
    [ ] Bounce effects (flash, particles, shake)
    [ ] Platform fade-out transition
[ ] Phase 2: Recall
    [ ] Tray piece creation (randomized order, random starting angles)
    [ ] Drag and drop system
    [ ] Grid cell snap logic
    [ ] Angle toggle (right-click, double-click, button)
    [ ] Timer countdown
    [ ] Hint system (optional)
    [ ] Remove placed piece (click to return to tray)
    [ ] Cell occupation tracking
[ ] Phase 3: Verify
    [ ] Ball re-drop along correct path
    [ ] Per-platform evaluation (correct/partial/wrong/missing)
    [ ] Green stamp / red X feedback
    [ ] Ghost platform reveal for mistakes
    [ ] Score counter animation
[ ] Completion Screen
    [ ] Career path line animation (progressive draw)
    [ ] Score display with count-up
    [ ] Score rating message
    [ ] All-stats summary bars (6 stats from all levels)
    [ ] Personal message with player name
    [ ] Three CTA buttons (Book, LinkedIn, CV)
    [ ] Wax seal signature
    [ ] Perfect score special effects
[ ] completeLevel() call with score
[ ] Scene cleanup (shutdown event, destroy all graphics)
[ ] Keyboard controls (SPACE, ESC, R, H)
[ ] Right-click context menu prevention
[ ] Page number (p. 10)
```

---

## 16. Scene File Structure

```javascript
import * as Phaser from 'phaser'
import { KEYS } from '../systems/GameRegistry.js'
import { completeLevel } from './LevelSelectHub.js'
import { COLORS, TEXT, C, FONT } from '../config/theme.js'
import { JournalUI } from '../ui/JournalUI.js'

const GRID = { cols: 8, rows: 8, cellSize: 60, originX: 160, originY: 100 }
const BALL_SPEED = 120  // pixels per second
const RECALL_TIME = 45  // seconds
const CELL_MOVE_MS = (GRID.cellSize / BALL_SPEED) * 1000  // 500ms per cell
const PLATFORMS = [ /* ... as defined in section 2 ... */ ]
const LANDING_ZONE = { col: 6, row: 7, label: 'HIRE ME' }

export class InterviewRoomScene extends Phaser.Scene {
  constructor() {
    super('InterviewRoom')
  }

  create() {
    this._playerName = this.registry.get(KEYS.PLAYER_NAME) ?? 'friend'
    this._phase = 'WATCH'
    this._score = 0
    this._placements = []  // { platformId, col, row, angle }
    this._trailDots = []

    this.game.canvas.addEventListener('contextmenu', e => e.preventDefault())

    JournalUI.drawParchment(this, 0, 0, 1280, 720)
    this._drawGrid()
    this._createBall()
    JournalUI.drawPageNumber(this, 10)

    // Header
    this.add.text(40, 30, 'Chapter 5', TEXT.label)
    this.add.text(40, 50, 'Pinball Recall', TEXT.heading)

    this._startPhaseWatch()
  }

  // ... Phase 1, 2, 3 methods as described above ...
  // ... Helper methods: _tracePath, _deflect, _cellCenter, etc ...
  // ... UI methods: _drawGrid, _drawPlatform, _createBall, etc ...
  // ... Completion: _showCompletionScreen, _drawCTAButton, etc ...

  shutdown() {
    this.game.canvas.removeEventListener('contextmenu', this._ctxHandler)
    this._trailDots.forEach(d => d.destroy())
  }
}
```

---

## 17. Timing Summary

| Phase | Duration | Player Action |
|-------|----------|---------------|
| Intro | 1.5s | Read title, see grid |
| Phase 1 (Watch) | 18-22s | Watch ball trace career path |
| Transition | 2s | Platforms fade out |
| Phase 2 (Recall) | 45s max | Drag platforms to grid, set angles |
| Transition | 1s | Lock placements |
| Phase 3 (Verify) | 12-15s | Watch ball re-trace, see results |
| Score reveal | 3s | Read score + rating |
| Completion screen | Until player acts | Read stats, click CTA or replay |
| **Total active:** | **~80-90s** | |
