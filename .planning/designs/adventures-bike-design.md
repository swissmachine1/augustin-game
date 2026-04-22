# Level 3 -- Adventures: THE RIDE

## Bike Side-Scroller Design Document

**Scene file:** `src/scenes/GreenlandScene.js` (replaces current storm survival implementation)
**Target duration:** 70-90 seconds of active gameplay, ~10s intro, ~10s outro
**Canvas:** 1280x720
**Registry keys:** `KEYS.SCORE_L3`, `KEYS.COMPLETED_L3`, `KEYS.STAT_GRIT`, `KEYS.STAT_INDEPENDENCE`

---

## 1. Game Flow -- Second by Second

### Phase A: Intro Screen (0s-6s)

```
0.0s  Camera fadeIn(500ms, from black)
      JournalUI.drawParchment(this, 0, 0, 1280, 720)

0.3s  Header fades in:
      "Chapter 3" in TEXT.label (x: 40, y: 30)
      "Adventures" in TEXT.heading, bold (x: 40, y: 50)

0.5s  Title fades in (TEXT.title, 36px, bold, centered at 640, 200):
      "THE RIDE"

1.0s  Subtitle fades in (TEXT.bodyItalic, 14px, centered at 640, 250):
      "Istanbul to Greenland to Bulgaria and beyond."

1.5s  Disclaimer box appears (centered at 640, 340):
      Ink-bordered rectangle (400x80), lineStyle(0.5, C.INK, 0.3)
      Inside, TEXT.body, 12px, centered:
      "Every obstacle in this ride actually happened."
      Second line, TEXT.label, 10px, INK_FADED:
      "Names changed. Stories not."

2.5s  Obstacle preview list fades in (640, 460), staggered 200ms each:
      Each line is TEXT.small, 10px, with a small ink dot before it:
        "- Wild dogs in Istanbul"
        "- Dengue fever"
        "- Icebergs in Greenland"
        "- Empty village in Bulgaria"
        "- ...and more"
      Lines use INK_LIGHT color, slight alpha 0.7

4.5s  Bottom prompt pulses (TEXT.small, alpha 0.3-0.7, yoyo, 800ms):
      "PRESS SPACE to start riding"

      Player presses SPACE (or auto-advance at 6.0s)

5.5s  All intro text tweens alpha to 0 over 400ms
      Camera shake (intensity 2, duration 200ms)

6.0s  Transition to gameplay. Build the road and rider.
```

### Phase B: Game Setup (6s-7.5s)

```
6.0s  Road draws across the bottom of the screen:
      A hand-drawn wavy line from x:0 to x:1280 at y:560
      Below the line: ink wash fill (C.INK, alpha 0.06) from y:560 to y:720

6.2s  Bicycle + rider appear at x:200, y:530 (above the road line)
      Fade in from alpha 0 to 1 over 300ms, slight scale 0.9->1.0

6.4s  Location header appears at top-center:
      "TURKEY" in TEXT.chapter, 22px, italic, alpha 0.4
      Thin underline draws below it (300ms)

6.6s  Health system: 3 ink hearts appear at top-left (x:40, y:30)
      Hearts are drawn with ink lines (see section 7)

6.8s  Score counter at top-right: "0" in TEXT.stat (x:1240, y:30)

7.0s  Brief prompt (TEXT.prompt, 13px, centered at 640, 140):
      "UP to jump. DOWN to duck. TAP to knock."
      Fades to alpha 0.2 after 2 seconds

7.5s  First obstacle appears at x:1400 (off-screen right)
      World begins scrolling. Game is live.
```

### Phase C: Active Gameplay (7.5s-80s)

```
The world scrolls left at increasing speed (see section 9).
Obstacles approach from the right.
The rider stays at a fixed x position (x:200).
Player uses UP/DOWN/TAP to avoid obstacles.

Each dodged obstacle triggers:
  1. The obstacle label briefly highlighted
  2. A one-liner story fades in at bottom-center
  3. Score increases

Each hit obstacle triggers:
  1. Camera shake
  2. Lose one heart
  3. Rider flashes red briefly (200ms blink)
  4. Brief invincibility (800ms)

Location transitions happen between obstacle groups (see section 6).
```

### Phase D: Final Sprint (80s-90s)

```
After the last obstacle is dodged/hit:
  Speed increases by 30%
  Background elements accelerate
  A "finish line" appears: a vertical dashed line at x:1280
  Text at the finish: "HOME" in TEXT.chapter

When rider crosses the finish line:
  Speed decelerates over 1.5s (ease out)
  Rider coasts to a stop
  Phase E begins
```

### Phase E: Closing (90s-105s) -- see section 13

---

## 2. Complete Obstacle List

### Obstacle Sequence (in order of appearance)

All 9 obstacles are encountered in a fixed order. The ride covers 5 location segments. Obstacles are spaced ~8-10 seconds apart.

---

#### Obstacle 1: "WILD DOGS" [CONFIRMED REAL]
- **Real story:** Surrounded by wild dogs barking around his tent at night while camping in the outskirts of Istanbul.
- **Location segment:** Turkey
- **Action:** JUMP (UP arrow)
- **Visual:** 3 low-profile shapes (ink rectangles 30x15px each, spaced 40px apart) running along the ground from right to left. Above each shape, "BARK!" text in TEXT.label, red color, bouncing up and down (y oscillation +/-3px, 200ms). The shapes have small triangle "ears" on top.
- **Timing window:** 600ms (generous -- the dog pack is 160px wide total)
- **On dodge -- one-liner:**
  > "Istanbul suburbs. Camping alone. 3am. Six dogs circling the tent. I didn't sleep. They didn't bite."
- **On hit:** Player stumbles (rider y drops 10px and bounces back over 300ms)

---

#### Obstacle 2: "FLAT TIRE" [INVENTED -- plausible]
- **Real story:** Flat tire on a remote road with no repair kit nearby.
- **Location segment:** Turkey
- **Action:** JUMP (UP arrow)
- **Visual:** A circle (radius 20px, INK color, lineStyle 1.5px) lying flat on the road, with a small "x" mark on it. Deflated look: slightly oval (scaleY: 0.7).
- **Timing window:** 500ms
- **On dodge -- one-liner:**
  > "Third flat in two days. No pump. Found a gas station 6km later. Walked."
- **On hit:** Player wobbles (rider x oscillates +/-5px for 400ms)

---

#### Obstacle 3: "DENGUE FEVER" [CONFIRMED REAL]
- **Real story:** Got dengue while traveling. Had to push through illness on the road.
- **Location segment:** Southeast Asia (transition happens before this obstacle)
- **Action:** DUCK (DOWN arrow)
- **Visual:** A translucent red-orange haze that fills the top 60% of the screen (y:0 to y:430). Drawn as a rectangle (C.WAX_RED, alpha 0.12) with wavy bottom edge (sine wave). The word "FEVER" floats inside in TEXT.title, WAX_RED, alpha 0.3, slowly pulsing scale 1.0-1.1. A thermometer icon (vertical line with circle at bottom) drawn in red at the right edge of the haze.
- **Timing window:** 900ms (the haze is wide -- 250px -- but you must be ducking the entire time it passes)
- **On dodge -- one-liner:**
  > "40-degree fever on a bus in Southeast Asia. Couldn't stop. The next town was 8 hours away."
- **On hit:** Screen flashes red briefly (WAX_RED overlay, alpha 0.1, 300ms)

---

#### Obstacle 4: "LANGUAGE BARRIER" [INVENTED -- plausible]
- **Real story:** Couldn't communicate, had to rely on gestures and drawings.
- **Location segment:** Southeast Asia
- **Action:** JUMP (UP arrow)
- **Visual:** A wall of overlapping text fragments in various scripts/gibberish characters ("???", "#@!", "??!?"). Drawn as 6-8 TEXT.body objects stacked in a 80x100px column, INK color, alpha 0.5, slightly rotated (+/-5 degrees each). The whole cluster sits on the ground level.
- **Timing window:** 500ms
- **On dodge -- one-liner:**
  > "No shared language. Drew what I needed on a napkin. Got a meal. Made a friend."
- **On hit:** Player bounces back slightly

---

#### Obstacle 5: "CREDIT CARD BLOCKED" [CONFIRMED REAL]
- **Real story:** Stranded with no access to funds, card stopped working.
- **Location segment:** Eastern Europe (transition before this)
- **Action:** JUMP (UP arrow)
- **Visual:** A stack of 3 overlapping rectangles (60x35px each, PARCHMENT fill, INK border) angled like fallen cards. Each has "DECLINED" stamped across it in TEXT.label, WAX_RED, 8px, rotated -5 degrees. A large red "X" (two crossing lines, WAX_RED, lineStyle 2px) overlays the stack.
- **Timing window:** 500ms
- **On dodge -- one-liner:**
  > "Card blocked. Zero cash. Three countries from home. Slept in a park. Found a Western Union at dawn."
- **On hit:** Player stumbles

---

#### Obstacle 6: "BORDER HASSLE" [INVENTED -- plausible]
- **Real story:** Difficult border crossing with bureaucratic complications.
- **Location segment:** Eastern Europe
- **Action:** DUCK (DOWN arrow)
- **Visual:** A horizontal barrier/gate across the top 55% of the screen (y:0 to y:400). Drawn as a thick horizontal line (C.LEATHER, lineStyle 3px) at y:400 with vertical stripes below it (like a boom gate). "STOP" text in TEXT.heading, WAX_RED, above the barrier. A small rectangular stamp shape next to it.
- **Timing window:** 800ms
- **On dodge -- one-liner:**
  > "Three hours at the border. Wrong form. Wrong line. Wrong language. Got through on the fourth try."
- **On hit:** Screen briefly dims (dark overlay, alpha 0.08, 400ms)

---

#### Obstacle 7: "ICEBERGS" [CONFIRMED REAL]
- **Real story:** Had to walk 2 days carrying 20kg on his back because icebergs blocked the boat in Greenland.
- **Location segment:** Greenland (transition before this)
- **Action:** JUMP (UP arrow) -- but this is a TALL obstacle requiring precise timing
- **Visual:** A large angular shape (drawn with fillTriangle and fillRect): base 80px wide, height 120px above ground. Pale blue-white coloring: PARCHMENT fill with INK_FADED outline (lineStyle 1px). Jagged top edge (3-4 small triangles along the top). The word "ICEBERGS" in TEXT.label below the shape. A subtle cold blue tint rectangle behind it (0x8899aa, alpha 0.04).
- **Timing window:** 700ms -- the jump must be higher/longer. The rider's jump arc is extended for this obstacle (see section 4 controls).
- **On dodge -- one-liner:**
  > "Greenland. The boat couldn't get through. Walked 2 days. 20kg on my back. No trail. Just ice."
- **On hit:** Strong camera shake (intensity 6, 300ms)

---

#### Obstacle 8: "EMPTY VILLAGE" [CONFIRMED REAL]
- **Real story:** Ran out of food, arrived in a deserted Bulgarian village, knocked on every door to find someone who could help.
- **Location segment:** Bulgaria (transition before this)
- **Action:** TAP/CLICK -- a series of 4 doors pass by. Player must click/tap each door as it reaches the rider's position. This is the unique mechanic obstacle.
- **Visual:** 4 door shapes (rectangles 35x55px, LEATHER fill, INK border, with a small circle "knob" at right-center). They appear sequentially, spaced 120px apart. Each door has a house roof above it (a small triangle, INK, lineStyle 0.5). The whole village is slightly faded (alpha 0.6) to convey emptiness.
- **Knock zone:** Each door is "knockable" when its x-position is within 40px of the rider's x (200). Player must click/tap or press SPACE.
- **Timing window:** Each door is knockable for 500ms as it passes. First 3 doors show "..." on knock (nobody home). The 4th door shows "!" (someone answers).
- **Scoring:** Full dodge credit requires knocking on at least 3 of 4 doors. Knocking all 4 gives a bonus.
- **On dodge -- one-liner:**
  > "Bulgaria. No food for two days. Ghost village. Knocked on every door. An old woman answered the last one. Fed me soup."
- **On hit (missed knocking 3+ doors):** Player slows down briefly (scroll speed -30% for 1 second)

---

#### Obstacle 9: "STORM" [INVENTED -- plausible]
- **Real story:** Caught in a violent storm while cycling, had to push through.
- **Location segment:** Final stretch (mixed/home segment)
- **Action:** HOLD DOWN (duck and hold for the duration) -- sustained duck for 1.2 seconds
- **Visual:** The entire screen darkens (INK overlay, alpha 0.08). Diagonal rain lines (30+ thin lines, 1px, INK, alpha 0.2) streak across the screen from top-right to bottom-left. Lightning flash: full-screen white rectangle (PARCHMENT, alpha 0.3) blinks twice (50ms on, 100ms off, 50ms on). Wind-blown ink splatters drift across the screen (3-4 small ink blot shapes moving left at 300px/s). Text "STORM" in TEXT.title, 28px, alpha 0.15, centered.
- **Timing window:** 1200ms -- player must stay ducked the entire time the storm passes over the rider
- **On dodge -- one-liner:**
  > "The storm hit at noon. Couldn't see 10 meters ahead. Kept pedaling. What else was there to do?"
- **On hit:** Double camera shake (two shakes, 200ms each, intensity 4)

---

### Obstacle Summary Table

| # | Name | Real? | Location | Action | Timing (ms) | Position in ride |
|---|------|-------|----------|--------|-------------|-----------------|
| 1 | Wild Dogs | CONFIRMED | Turkey | Jump | 600 | 0:08 |
| 2 | Flat Tire | Invented | Turkey | Jump | 500 | 0:17 |
| 3 | Dengue Fever | CONFIRMED | SE Asia | Duck | 900 | 0:26 |
| 4 | Language Barrier | Invented | SE Asia | Jump | 500 | 0:34 |
| 5 | Credit Card Blocked | CONFIRMED | E. Europe | Jump | 500 | 0:42 |
| 6 | Border Hassle | Invented | E. Europe | Duck | 800 | 0:50 |
| 7 | Icebergs | CONFIRMED | Greenland | Jump (tall) | 700 | 0:58 |
| 8 | Empty Village | CONFIRMED | Bulgaria | Tap x4 | 500 each | 1:06 |
| 9 | Storm | Invented | Final | Hold Duck | 1200 | 1:14 |

---

## 3. Controls

### Keyboard

| Key | Action |
|-----|--------|
| UP arrow / W | Jump -- rider leaps upward in an arc. Clears ground-level obstacles. |
| DOWN arrow / S | Duck -- rider crouches low. Clears overhead/haze obstacles. |
| SPACE / Click/Tap | Knock -- used only for the Empty Village obstacle (doors). Also used for intro/outro advancement. |

### Jump Mechanics

```javascript
// Jump constants
const JUMP_VELOCITY = -420    // initial upward velocity
const GRAVITY = 1200          // pulls rider back down
const GROUND_Y = 530          // rider's resting y position

// In update():
if (this._isJumping) {
  this._riderVY += GRAVITY * dt
  this._riderY += this._riderVY * dt
  if (this._riderY >= GROUND_Y) {
    this._riderY = GROUND_Y
    this._isJumping = false
    this._riderVY = 0
  }
}

// On UP press (if not already jumping):
if ((cursors.up.isDown || keyW.isDown) && !this._isJumping) {
  this._isJumping = true
  this._riderVY = JUMP_VELOCITY
}
```

**Jump arc:** Rider reaches peak height (~73px above ground, at y:457) in ~350ms, lands at ~700ms total. This clears all ground obstacles (max height 55px for dogs/tire/cards) with comfortable margin. For the Icebergs (120px tall), the timing must be more precise -- the rider clears only if jumping at the right moment (when iceberg front edge is ~100px away).

### Duck Mechanics

```javascript
const DUCK_HEIGHT = 20        // crouched rider height (normal is 40)
const DUCK_Y_OFFSET = 10      // rider shifts down slightly when ducking

// On DOWN press:
if (cursors.down.isDown || keyS.isDown) {
  this._isDucking = true
  // Rider body shrinks and shifts down
  this._riderBody.scaleY = 0.5
  this._riderBody.y = GROUND_Y + DUCK_Y_OFFSET
  this._riderHead.y = GROUND_Y + DUCK_Y_OFFSET - 8
} else {
  this._isDucking = false
  this._riderBody.scaleY = 1
  this._riderBody.y = GROUND_Y
  this._riderHead.y = GROUND_Y - 20
}
```

**Duck hitbox:** When ducking, the rider's effective height is 20px (vs 40px normal). The top of the ducked rider is at y:540. Overhead obstacles (Dengue haze, Border gate) occupy y:0 to y:430 or y:0 to y:400, so ducking clears them. The Storm requires holding duck for 1.2s.

### Knock/Tap Mechanic

```javascript
// Only active during Empty Village obstacle
// Player presses SPACE, clicks, or taps anywhere
this.input.keyboard.on('keydown-SPACE', () => this._tryKnock())
this.input.on('pointerdown', () => this._tryKnock())

_tryKnock() {
  if (!this._knockActive) return
  const activeDoor = this._doors.find(d =>
    !d.knocked && Math.abs(d.container.x - 200) < 40
  )
  if (activeDoor) {
    activeDoor.knocked = true
    this._knockCount++
    // Visual: door shakes, "..." or "!" appears
    this._animateKnock(activeDoor)
  }
}
```

### Mobile-Friendly Considerations

Touch controls overlay (drawn with Phaser primitives, only shown on touch devices):

```
Detect touch: this.sys.game.device.input.touch

If touch device:
  Bottom-left: UP arrow button (circle, 60px radius, x:100, y:650)
  Bottom-center: DOWN arrow button (circle, 60px radius, x:250, y:650)
  Bottom-right: TAP/KNOCK button (circle, 60px radius, x:1180, y:650)

  All buttons: PARCHMENT_DARK fill, INK border, alpha 0.4
  On press: alpha 0.7, scale 0.95
  Labels inside: "^", "v", "TAP" in TEXT.label
```

Touch controls map to the same input actions as keyboard.

---

## 4. Bike/Rider Visual

### Drawing the Bicycle (Phaser Graphics Primitives)

The bicycle is an ink sketch -- hand-drawn lines and circles. Deliberately imperfect.

```javascript
_drawBicycle(x, y) {
  // y = ground contact point (bottom of wheels)
  const g = this.add.graphics()

  // --- Wheels ---
  const wheelR = 16
  const wheelY = y - wheelR
  const rearWheelX = x - 18
  const frontWheelX = x + 18

  // Rear wheel
  g.lineStyle(1.2, C.INK, 0.7)
  g.strokeCircle(rearWheelX, wheelY, wheelR)
  // Spokes (4 lines through center)
  g.lineStyle(0.4, C.INK_FADED, 0.4)
  for (let a = 0; a < Math.PI; a += Math.PI / 4) {
    g.beginPath()
    g.moveTo(rearWheelX + Math.cos(a) * wheelR * 0.9, wheelY + Math.sin(a) * wheelR * 0.9)
    g.lineTo(rearWheelX - Math.cos(a) * wheelR * 0.9, wheelY - Math.sin(a) * wheelR * 0.9)
    g.strokePath()
  }

  // Front wheel
  g.lineStyle(1.2, C.INK, 0.7)
  g.strokeCircle(frontWheelX, wheelY, wheelR)
  g.lineStyle(0.4, C.INK_FADED, 0.4)
  for (let a = 0; a < Math.PI; a += Math.PI / 4) {
    g.beginPath()
    g.moveTo(frontWheelX + Math.cos(a) * wheelR * 0.9, wheelY + Math.sin(a) * wheelR * 0.9)
    g.lineTo(frontWheelX - Math.cos(a) * wheelR * 0.9, wheelY - Math.sin(a) * wheelR * 0.9)
    g.strokePath()
  }

  // --- Frame ---
  g.lineStyle(1.5, C.INK, 0.8)
  const seatX = rearWheelX + 4
  const seatY = wheelY - 28
  const handleX = frontWheelX - 2
  const handleY = wheelY - 24

  // Seat tube (rear wheel hub to seat)
  g.beginPath()
  g.moveTo(rearWheelX, wheelY)
  g.lineTo(seatX, seatY)
  g.strokePath()

  // Down tube (seat area to front wheel hub)
  g.beginPath()
  g.moveTo(seatX, seatY)
  g.lineTo(frontWheelX, wheelY)
  g.strokePath()

  // Top tube (seat to handlebars)
  g.beginPath()
  g.moveTo(seatX, seatY)
  g.lineTo(handleX, handleY)
  g.strokePath()

  // Fork (handlebars to front wheel)
  g.beginPath()
  g.moveTo(handleX, handleY)
  g.lineTo(frontWheelX, wheelY)
  g.strokePath()

  // Chain stay (rear wheel to bottom bracket area)
  g.lineStyle(1, C.INK, 0.5)
  g.beginPath()
  g.moveTo(rearWheelX, wheelY)
  g.lineTo(x, wheelY - 6)
  g.strokePath()

  // --- Seat ---
  g.lineStyle(1.5, C.INK, 0.8)
  g.beginPath()
  g.moveTo(seatX - 6, seatY)
  g.lineTo(seatX + 6, seatY)
  g.strokePath()

  // --- Handlebars ---
  g.beginPath()
  g.moveTo(handleX - 2, handleY - 6)
  g.lineTo(handleX, handleY)
  g.lineTo(handleX + 4, handleY - 4)
  g.strokePath()

  return g
}
```

### Drawing the Rider

The rider sits on the bicycle. Simple stick-figure with slightly more detail.

```javascript
_drawRider(x, y) {
  // y = ground contact point (same as bicycle)
  const g = this.add.graphics()
  const seatY = y - 16 - 28  // matches bicycle seat position

  // --- Body (torso) ---
  // Leaning forward slightly
  g.lineStyle(2, C.INK, 0.8)
  g.beginPath()
  g.moveTo(x - 14, seatY)           // hip (on seat)
  g.lineTo(x - 6, seatY - 22)       // shoulder (leaning forward)
  g.strokePath()

  // --- Head ---
  g.lineStyle(1.2, C.INK, 0.8)
  g.strokeCircle(x - 4, seatY - 30, 7)
  // Fill head
  g.fillStyle(C.PARCHMENT_DARK, 0.8)
  g.fillCircle(x - 4, seatY - 30, 6)

  // --- Arms (reaching to handlebars) ---
  g.lineStyle(1.5, C.INK, 0.6)
  g.beginPath()
  g.moveTo(x - 6, seatY - 18)       // shoulder
  g.lineTo(x + 16, seatY - 4)       // hands on handlebars
  g.strokePath()

  // --- Legs (pedaling position -- one up, one down) ---
  g.lineStyle(1.5, C.INK, 0.7)
  // Upper leg (thigh) going down to pedal area
  g.beginPath()
  g.moveTo(x - 14, seatY)           // hip
  g.lineTo(x, seatY + 14)           // knee area / pedal
  g.strokePath()
  // Lower leg
  g.beginPath()
  g.moveTo(x, seatY + 14)
  g.lineTo(x - 4, seatY + 22)       // foot on pedal
  g.strokePath()

  return g
}
```

### Rider Container

```javascript
_createRider() {
  this._riderContainer = this.add.container(200, GROUND_Y)

  // Bicycle at origin (0, 0) of container
  this._bikeGraphics = this._drawBicycle(0, 0)
  this._riderContainer.add(this._bikeGraphics)

  // Rider on top
  this._riderGraphics = this._drawRider(0, 0)
  this._riderContainer.add(this._riderGraphics)

  // Hitbox (invisible rectangle for collision detection)
  // Normal: 40px wide, 50px tall (bike + rider)
  // Ducking: 40px wide, 25px tall
  this._riderHitbox = { x: 200, y: GROUND_Y - 50, w: 40, h: 50 }
}
```

### Wheel Spin Animation

```javascript
// In update(), rotate wheel spokes based on scroll speed
this._wheelRotation += this._scrollSpeed * dt * 0.01
// Redraw bicycle with rotated spokes every few frames
// (or use a container with the spoke graphics and rotate the container)
```

Rather than redrawing spokes each frame (expensive), use a simpler approach: the wheels are Phaser Containers that rotate:

```javascript
// Create wheel containers with spokes as children
this._rearWheel = this.add.container(rearWheelX, wheelY)
// Add spoke graphics to the container
// In update(): this._rearWheel.rotation += scrollSpeed * dt * 0.008
```

### Ducking Visual

When ducking:
- Rider torso rotates to nearly horizontal (rider leans flat over the handlebars)
- Head lowers to handlebar height
- The container scaleY changes to 0.6 and y shifts down by 10px
- Transition is tweened (100ms, Quad.easeOut)

---

## 5. World Scrolling

### Scroll System

The rider stays at a fixed x position (x:200). The world scrolls left. All obstacles, background elements, and decorations move leftward at `scrollSpeed` px/s.

```javascript
// Scroll state
this._scrollSpeed = 160       // starting speed (px/s)
this._targetSpeed = 160
this._worldOffset = 0         // total distance scrolled

// In update():
this._scrollSpeed += (this._targetSpeed - this._scrollSpeed) * 0.02  // smooth transitions
this._worldOffset += this._scrollSpeed * dt

// Move all world elements
this._obstacles.forEach(o => { o.container.x -= this._scrollSpeed * dt })
this._bgElements.forEach(e => { e.x -= this._scrollSpeed * 0.3 * dt })  // parallax
this._roadMarkers.forEach(m => { m.x -= this._scrollSpeed * dt })
```

### Speed Progression

| Time (s) | Scroll Speed (px/s) | Feel |
|----------|-------------------|------|
| 0-20 | 160 | Gentle start, learning controls |
| 20-40 | 190 | Picking up pace |
| 40-60 | 220 | Noticeable speed, requires quicker reactions |
| 60-75 | 250 | Fast, tense |
| 75-85 | 280 | Final sprint |
| 85+ | 320 | Victory rush after last obstacle |

Speed increases are triggered by obstacle dodges (each successful dodge bumps `_targetSpeed` by 15). This way the difficulty is tied to progress, not arbitrary time.

### Background Elements

**Layer 0 (furthest back) -- sky/atmosphere, parallax 0.1x:**
- Faint ruled lines (parchment default) -- these scroll very slowly, creating depth
- Location-specific color wash (see section 6)

**Layer 1 (mid-background, parallax 0.3x):**
- Scattered ink sketches relevant to the current location:
  - Turkey: small mosque dome outlines, crescent shapes
  - SE Asia: palm tree outlines (simple: vertical line + radiating lines at top)
  - Eastern Europe: church spire outlines
  - Greenland: mountain peak triangles
  - Bulgaria: rolling hills (gentle sine curves)
- These are very faint (alpha 0.06-0.1) and drawn with INK_FADED
- 3-4 elements per location segment, spawned at random y positions (100-300)

**Layer 2 (near-background, parallax 0.7x):**
- Terrain features:
  - Road markers (small vertical lines below the road, every 200px)
  - Occasional roadside objects (rocks: small irregular polygons; bushes: small ovals)
  - Very faint (alpha 0.08-0.12)

**Layer 3 (ground level, parallax 1.0x):**
- The road line itself (the main ground)
- Obstacles
- Dust particles behind the rider

### Road Drawing

The road is a continuous hand-drawn line at y:560. As the world scrolls, new road segments are generated and old ones are destroyed.

```javascript
_drawRoadSegment(startX, length) {
  const g = this.add.graphics()

  // Main road line (slightly wavy)
  g.lineStyle(1.2, C.INK, 0.35)
  g.beginPath()
  g.moveTo(startX, 560)
  for (let x = startX; x <= startX + length; x += 15) {
    g.lineTo(x, 560 + (Math.random() - 0.5) * 3)
  }
  g.strokePath()

  // Road surface (subtle ink wash below the line)
  g.fillStyle(C.INK, 0.04)
  g.fillRect(startX, 560, length, 160)

  // Occasional road texture marks
  g.lineStyle(0.3, C.INK_FADED, 0.1)
  for (let x = startX; x <= startX + length; x += 80 + Math.random() * 60) {
    g.beginPath()
    g.moveTo(x, 565)
    g.lineTo(x + 20, 565)
    g.strokePath()
  }

  return g
}
```

### Dust Particles

Small particles trail behind the rider as they cycle:

```javascript
_emitDust() {
  const particle = this.add.circle(
    190 + (Math.random() - 0.5) * 10,
    555 + Math.random() * 8,
    1 + Math.random() * 2,
    C.INK_FADED,
    0.2
  )
  this.tweens.add({
    targets: particle,
    x: particle.x - 30 - Math.random() * 40,
    y: particle.y - 5 - Math.random() * 10,
    alpha: 0,
    scale: 0.3,
    duration: 400 + Math.random() * 300,
    onComplete: () => particle.destroy(),
  })
}

// Emit every 80ms while riding (adjusted by speed):
// this._dustTimer interval = Math.max(40, 120 - scrollSpeed * 0.2)
```

---

## 6. Location Segments

The ride crosses 5 distinct regions. Each transition is a visual chapter change.

### Segment Schedule

| Segment | Location | Obstacles | World Offset Range | Duration |
|---------|----------|-----------|-------------------|----------|
| 1 | Turkey | #1 Wild Dogs, #2 Flat Tire | 0 - 3000px | ~18s |
| 2 | Southeast Asia | #3 Dengue, #4 Language Barrier | 3000 - 6000px | ~16s |
| 3 | Eastern Europe | #5 Credit Card, #6 Border Hassle | 6000 - 9000px | ~14s |
| 4 | Greenland | #7 Icebergs | 9000 - 12000px | ~12s |
| 5 | Bulgaria / Final | #8 Empty Village, #9 Storm | 12000 - 16000px | ~14s |

### Transition Effect

When entering a new segment:

```javascript
_transitionLocation(newLocation) {
  // 1. Old location label fades out (300ms)
  this.tweens.add({
    targets: this._locationLabel,
    alpha: 0,
    duration: 300,
  })

  // 2. Brief vertical ink line sweep across screen (like a page divider)
  const divider = this.add.rectangle(1300, 360, 3, 720, C.INK, 0.15)
  this.tweens.add({
    targets: divider,
    x: -20,
    duration: 600,
    ease: 'Quad.easeInOut',
    onComplete: () => divider.destroy(),
  })

  // 3. New location label appears (after 400ms delay)
  this.time.delayedCall(400, () => {
    this._locationLabel.setText(newLocation.toUpperCase())
    this._locationLabel.setAlpha(0)
    this.tweens.add({
      targets: this._locationLabel,
      alpha: 0.4,
      duration: 500,
    })

    // 4. Background color wash shifts
    this._updateBackgroundWash(newLocation)
  })
}
```

### Background Color Washes (per location)

Each location has a subtle color tint overlaid on the parchment:

| Location | Wash Color | Alpha | Feel |
|----------|-----------|-------|------|
| Turkey | C.WAX_RED | 0.02 | Warm, dusty |
| Southeast Asia | C.STAMP_GREEN | 0.02 | Tropical, humid |
| Eastern Europe | C.INK_FADED | 0.03 | Grey, overcast |
| Greenland | C.STAMP_BLUE | 0.03 | Cold, stark |
| Bulgaria / Final | C.LEATHER | 0.02 | Earthy, tired |

```javascript
_updateBackgroundWash(location) {
  const washes = {
    'turkey':       { color: C.WAX_RED,    alpha: 0.02 },
    'southeast asia': { color: C.STAMP_GREEN, alpha: 0.02 },
    'eastern europe': { color: C.INK_FADED,  alpha: 0.03 },
    'greenland':    { color: C.STAMP_BLUE, alpha: 0.03 },
    'bulgaria':     { color: C.LEATHER,    alpha: 0.02 },
  }
  const wash = washes[location]
  this.tweens.add({
    targets: this._bgWash,
    alpha: 0,
    duration: 300,
    onComplete: () => {
      this._bgWash.setFillStyle(wash.color, wash.alpha)
      this.tweens.add({ targets: this._bgWash, alpha: 1, duration: 500 })
    },
  })
}
```

---

## 7. Health/Lives System

### Three Ink Hearts

The player has 3 hearts (lives). Each hit from an obstacle removes one heart.

```javascript
_drawHearts() {
  this._hearts = []
  for (let i = 0; i < 3; i++) {
    const hx = 40 + i * 36
    const hy = 36
    const heart = this._drawInkHeart(hx, hy)
    this._hearts.push(heart)
  }
}

_drawInkHeart(x, y) {
  const g = this.add.graphics()
  g.lineStyle(1.2, C.INK, 0.7)

  // Heart shape using two arcs and lines
  g.beginPath()
  g.moveTo(x, y + 8)          // bottom point
  g.lineTo(x - 8, y)          // left
  g.arc(x - 4, y - 3, 5, Math.PI, 0, false)  // left bump
  g.arc(x + 4, y - 3, 5, Math.PI, 0, false)  // right bump
  g.lineTo(x + 8, y)          // right
  g.closePath()
  g.strokePath()

  // Fill
  g.fillStyle(C.WAX_RED, 0.6)
  g.fillPath()

  return g
}

_loseHeart() {
  this._livesRemaining--
  const heart = this._hearts[this._livesRemaining]

  // Heart shatters: scale up then fade, fragments fly out
  this.tweens.add({
    targets: heart,
    alpha: 0,
    scale: 1.5,
    duration: 400,
    ease: 'Quad.easeOut',
  })

  // Camera shake on hit
  this.cameras.main.shake(200, 0.008)

  // Rider flash red (blink 3 times)
  let blinks = 0
  const blinkTimer = this.time.addEvent({
    delay: 100,
    callback: () => {
      this._riderContainer.alpha = this._riderContainer.alpha === 1 ? 0.3 : 1
      blinks++
      if (blinks >= 6) {
        blinkTimer.destroy()
        this._riderContainer.alpha = 1
      }
    },
    loop: true,
  })

  // Invincibility period
  this._invincible = true
  this.time.delayedCall(800, () => { this._invincible = false })

  // If 0 hearts, the player keeps riding (see section 14 edge cases)
  // The game is always completable
}
```

### Heart Display During Gameplay

Hearts are drawn at top-left: x:40, x:76, x:112, y:36. When lost, they visually shatter and fade.

---

## 8. Scoring (0-100)

### Score Calculation

```javascript
_calculateScore() {
  // Base: how many obstacles successfully dodged
  const dodgeRate = this._obstaclesDodged / this._totalObstacles  // 0 to 1
  const dodgeScore = dodgeRate * 60    // up to 60 points

  // Hearts remaining bonus
  const heartScore = this._livesRemaining * 10  // 0, 10, 20, or 30

  // Knock bonus (Empty Village special)
  const knockBonus = this._knockCount >= 4 ? 5 : (this._knockCount >= 3 ? 3 : 0)

  // Near-miss bonus (see section 12)
  const nearMissBonus = Math.min(5, this._nearMisses * 1)

  const raw = dodgeScore + heartScore + knockBonus + nearMissBonus
  return Math.max(15, Math.min(100, Math.round(raw)))
}
```

**Score interpretation:**
- 90-100: Untouchable. Dodged everything, full hearts, nailed every knock.
- 70-89: Seasoned traveler. Missed one or two, but kept going.
- 50-69: Scrappy. Took some hits, lost hearts, but made it through.
- 30-49: Bruised but standing. Hit most obstacles, barely survived.
- 15-29: Floor. Everyone gets at least 15 for completing the ride.

### Stat Awards

```javascript
const score = this._calculateScore()

// Grit: primary stat for this level
const gritGain = Math.round(score / 4)    // 4-25 points
const curGrit = this.registry.get(KEYS.STAT_GRIT) ?? 0
this.registry.set(KEYS.STAT_GRIT, Math.min(100, curGrit + gritGain))

// Independence: secondary stat
const indepGain = Math.round(score / 5)   // 3-20 points
const curIndep = this.registry.get(KEYS.STAT_INDEPENDENCE) ?? 0
this.registry.set(KEYS.STAT_INDEPENDENCE, Math.min(100, curIndep + indepGain))

// Save
completeLevel(this, KEYS.SCORE_L3, KEYS.COMPLETED_L3, score)
```

### Stats Tracked During Gameplay

```javascript
this._totalObstacles = 9
this._obstaclesDodged = 0
this._obstaclesHit = 0
this._livesRemaining = 3
this._knockCount = 0          // doors knocked in Empty Village
this._nearMisses = 0          // close calls (see section 12)
this._scrollSpeed = 160
this._worldOffset = 0
this._currentSegment = 0
this._invincible = false
this._isJumping = false
this._isDucking = false
this._gameActive = false
this._ended = false
```

---

## 9. Difficulty Curve

### Speed Progression (automatic)

Speed increases in two ways:
1. **Per-dodge boost:** Each successful dodge adds +15 to `_targetSpeed`
2. **Minimum floor:** Speed never drops below `160 + (segment * 15)` for the current segment

This means:
- A perfect player accelerates faster (the ride gets harder as a reward for skill)
- A struggling player still has a manageable ride since hits don't increase speed

### Obstacle Timing Windows

| Obstacle # | Timing Window (ms) | Difficulty | Notes |
|-----------|-------------------|------------|-------|
| 1 (Dogs) | 600 | Easy | Tutorial-level. Very forgiving. |
| 2 (Flat Tire) | 500 | Easy | Simple jump, slower speed. |
| 3 (Dengue) | 900 | Medium | Wide obstacle but must duck the whole time. |
| 4 (Language) | 500 | Medium | Speed is higher now. |
| 5 (Credit Card) | 500 | Medium | Standard jump at moderate speed. |
| 6 (Border) | 800 | Medium | Duck under. Generous window. |
| 7 (Icebergs) | 700 | Hard | Tall obstacle. Jump timing matters. |
| 8 (Village) | 500 x4 | Hard | Multiple taps required. Novel mechanic. |
| 9 (Storm) | 1200 | Hard | Must hold duck for full duration. |

### Obstacle Spacing

Obstacles are spawned based on world offset (distance scrolled), not time. This means faster scrolling = obstacles come sooner in real time. The spacing in world-pixels:

```javascript
const OBSTACLE_SPAWNS = [
  { offset: 1500,  type: 'dogs' },
  { offset: 3000,  type: 'tire' },
  { offset: 4800,  type: 'dengue',    transition: 'southeast asia' },
  { offset: 6200,  type: 'language' },
  { offset: 7800,  type: 'credit',    transition: 'eastern europe' },
  { offset: 9200,  type: 'border' },
  { offset: 10800, type: 'icebergs',  transition: 'greenland' },
  { offset: 12500, type: 'village',   transition: 'bulgaria' },
  { offset: 14200, type: 'storm' },
]

// Check in update():
this._obstacleSpawns.forEach(spawn => {
  if (!spawn.triggered && this._worldOffset >= spawn.offset) {
    spawn.triggered = true
    if (spawn.transition) this._transitionLocation(spawn.transition)
    this._spawnObstacle(spawn.type)
  }
})
```

### Warning System

Each obstacle gets a brief warning 1.5 seconds before it reaches the rider:

```javascript
_showWarning(obstacleName) {
  const warning = this.add.text(640, 480, obstacleName.toUpperCase(), {
    ...TEXT.label,
    fontSize: '11px',
    color: COLORS.WAX_RED,
    fontStyle: 'italic',
  }).setOrigin(0.5).setAlpha(0)

  this.tweens.add({
    targets: warning,
    alpha: 0.6,
    duration: 300,
    hold: 800,
    yoyo: true,
    onComplete: () => warning.destroy(),
  })
}
```

This gives the player time to prepare (press UP or DOWN). The warning appears when the obstacle enters the screen at x:1280.

---

## 10. The One-Liners (Complete Text)

These appear at bottom-center (x:640, y:660) after successfully dodging each obstacle. They stay visible for 3 seconds then fade. Written as journal entries -- personal, specific, vivid.

```javascript
const STORIES = {
  dogs:     'Istanbul suburbs. Camping alone. 3am. Six dogs circling the tent.\nI didn\'t sleep. They didn\'t bite.',
  tire:     'Third flat in two days. No pump.\nFound a gas station 6km later. Walked.',
  dengue:   '40-degree fever on a bus in Southeast Asia.\nCouldn\'t stop. The next town was 8 hours away.',
  language: 'No shared language. Drew what I needed on a napkin.\nGot a meal. Made a friend.',
  credit:   'Card blocked. Zero cash. Three countries from home.\nSlept in a park. Found a Western Union at dawn.',
  border:   'Three hours at the border. Wrong form. Wrong line.\nWrong language. Got through on the fourth try.',
  icebergs: 'Greenland. The boat couldn\'t get through.\nWalked 2 days. 20kg on my back. No trail. Just ice.',
  village:  'Bulgaria. No food for two days. Ghost village.\nKnocked on every door. An old woman answered the last one.\nFed me soup.',
  storm:    'The storm hit at noon. Couldn\'t see 10 meters ahead.\nKept pedaling. What else was there to do?',
}
```

### Story Display Implementation

```javascript
_showStoryLine(obstacleKey) {
  // Clear previous story
  if (this._storyText) {
    this.tweens.killTweensOf(this._storyText)
    this._storyText.destroy()
  }

  // Story confirmation marker
  const checkmark = this.add.text(200, 500, '~', {
    ...TEXT.stamp,
    fontSize: '16px',
  }).setAlpha(0)
  this.tweens.add({
    targets: checkmark,
    alpha: 0.7,
    duration: 200,
    hold: 500,
    yoyo: true,
    onComplete: () => checkmark.destroy(),
  })

  // Story text
  this._storyText = this.add.text(640, 660, STORIES[obstacleKey], {
    ...TEXT.bodyItalic,
    fontSize: '11px',
    color: COLORS.INK_LIGHT,
    align: 'center',
    lineSpacing: 4,
  }).setOrigin(0.5, 1).setAlpha(0)

  this.tweens.add({
    targets: this._storyText,
    alpha: 0.8,
    duration: 400,
    hold: 2600,
    onComplete: () => {
      this.tweens.add({
        targets: this._storyText,
        alpha: 0,
        duration: 500,
        onComplete: () => { this._storyText?.destroy(); this._storyText = null },
      })
    },
  })
}
```

---

## 11. Intro Screen

### Purpose

Set the tone. Make it crystal clear: these are not invented game obstacles. These things happened.

### Layout (see Phase A in section 1)

```
Top: "Chapter 3 / Adventures"
Center: "THE RIDE" (large title)
Subtitle: "Istanbul to Greenland to Bulgaria and beyond."

Disclaimer box (centered, bordered):
  "Every obstacle in this ride actually happened."
  "Names changed. Stories not."

Obstacle preview (bulleted list):
  - Wild dogs in Istanbul
  - Dengue fever
  - Icebergs in Greenland
  - Empty village in Bulgaria
  - ...and more

Bottom: "PRESS SPACE to start riding"
```

The disclaimer box uses a dotted border (dashed lineStyle) to look like a stamped notice in the journal.

```javascript
_drawDisclaimerBox(x, y) {
  const g = this.add.graphics()
  const bw = 420, bh = 70

  // Dashed border
  g.lineStyle(0.8, C.INK, 0.3)
  const dashLen = 6, gapLen = 4
  // Top
  for (let dx = 0; dx < bw; dx += dashLen + gapLen) {
    g.beginPath()
    g.moveTo(x - bw/2 + dx, y - bh/2)
    g.lineTo(x - bw/2 + Math.min(dx + dashLen, bw), y - bh/2)
    g.strokePath()
  }
  // Bottom, Left, Right (same pattern)
  // ... (repeat for each side)

  // Fill
  g.fillStyle(C.PARCHMENT_DARK, 0.15)
  g.fillRoundedRect(x - bw/2, y - bh/2, bw, bh, 3)

  return g
}
```

---

## 12. Visual Details

### Near-Miss Feedback

When an obstacle passes the rider within 15px of collision but doesn't hit:

```javascript
_checkNearMiss(obstacle) {
  // After obstacle passes rider (obstacle.x < 160) without collision:
  const distance = this._getCollisionDistance(obstacle)
  if (distance < 15 && distance > 0) {
    this._nearMisses++
    this._showNearMissEffect()
  }
}

_showNearMissEffect() {
  // Ink splatter at rider's position
  const splat = JournalUI.drawInkBlot(this, 200 + Math.random() * 20, 530, 6)
  splat.setAlpha(0.3)
  this.tweens.add({
    targets: splat,
    alpha: 0,
    duration: 600,
    onComplete: () => splat.destroy(),
  })

  // "CLOSE!" text
  const closeText = this.add.text(230, 510, 'CLOSE!', {
    ...TEXT.label,
    fontSize: '9px',
    color: COLORS.WAX_RED,
    fontStyle: 'italic',
  }).setAlpha(0)
  this.tweens.add({
    targets: closeText,
    alpha: 0.6,
    y: 500,
    duration: 300,
    hold: 200,
    yoyo: true,
    onComplete: () => closeText.destroy(),
  })
}
```

### Hit Feedback

When the rider collides with an obstacle:

```javascript
_onObstacleHit(obstacle) {
  if (this._invincible) return

  this._obstaclesHit++
  this._loseHeart()

  // Camera shake (scaled by obstacle severity)
  this.cameras.main.shake(200, obstacle.shakeIntensity || 0.008)

  // Brief slowdown (dramatic pause)
  const savedSpeed = this._targetSpeed
  this._scrollSpeed *= 0.3
  this.time.delayedCall(200, () => {
    this._scrollSpeed = savedSpeed
  })

  // Red flash on rider container
  const flash = this.add.rectangle(200, 530, 60, 60, C.WAX_RED, 0.2)
  this.tweens.add({
    targets: flash,
    alpha: 0,
    duration: 300,
    onComplete: () => flash.destroy(),
  })
}
```

### Obstacle Label Display

Each obstacle has its name displayed as it approaches. The label floats above the obstacle:

```javascript
// On obstacle creation:
const label = this.add.text(obstacle.container.x, obstacle.labelY, obstacle.name, {
  ...TEXT.label,
  fontSize: '9px',
  color: COLORS.INK_LIGHT,
  fontStyle: 'italic',
}).setOrigin(0.5)
obstacle.container.add(label)
```

Label examples:
- "WILD DOGS" (above the dog shapes)
- "DENGUE FEVER" (inside the haze, near the top)
- "ICEBERGS" (below the ice block)
- "EMPTY VILLAGE" (above the first door)

### Parallax Depth Layers

3 parallax layers (see section 5). Implementation:

```javascript
// Background elements array with depth multiplier
this._bgLayers = [
  { elements: [], speed: 0.1 },  // far (sky/atmosphere)
  { elements: [], speed: 0.3 },  // mid (terrain silhouettes)
  { elements: [], speed: 0.7 },  // near (roadside details)
]

// In update():
this._bgLayers.forEach(layer => {
  layer.elements.forEach(el => {
    el.x -= this._scrollSpeed * layer.speed * dt
    if (el.x < -100) {
      el.x = 1400 + Math.random() * 200
      el.y = 100 + Math.random() * 200
    }
  })
})
```

---

## 13. Completion Screen

After the rider crosses the finish line and decelerates:

```
T+0.0s  Rider coasts to stop at center of screen (x:640)
        Speed decelerates from current to 0 over 1.5s (Quad.easeOut)
        Dust particles settle

T+1.5s  Full-canvas parchment overlay fades in (alpha 0.92, 500ms)

T+2.0s  Score card appears:

        y:140  "THE RIDE"
               TEXT.title, 32px, bold, centered

        y:200  "You made it. Every obstacle was real."
               TEXT.bodyItalic, 14px, INK_LIGHT, centered

        y:260  "{obstaclesDodged} / {totalObstacles} obstacles dodged"
               TEXT.body, 16px, centered

        y:310  Stat display:
               "+{gritGain} Grit   +{indepGain} Independence"
               TEXT.stamp, 18px, STAMP_GREEN, centered

        y:360  "Score: {finalScore}%"
               TEXT.body, 16px, INK_FADED, centered

        y:420  Performance flavor text:
               90-100: "Untouchable. You've clearly done this before. Oh wait — you have."
               70-89:  "Seasoned traveler. The road left marks, but you kept going."
               50-69:  "Scrappy. You got hit, got up, kept pedaling. That's the whole point."
               30-49:  "Bruised but here. The road doesn't care about style."
               15-29:  "You survived. That's all that matters out there."
               TEXT.bodyItalic, 12px, INK_FADED, centered

        y:490  Stories recap (scrolling or stacked, small text):
               The one-liners from dodged obstacles are listed in a faint column
               TEXT.small, 9px, INK_FADED, alpha 0.5
               Only show dodged stories (not hit ones)

        y:580  Wax seal: JournalUI.drawWaxSeal(this, 640, 580, 'A', 24)
               (A for Adventures)

        y:630  "PRESS SPACE to return to the hub"
               TEXT.small, INK_FADED, centered
```

### Implementation

```javascript
_showCompletionScreen() {
  const { width, height } = this.cameras.main
  const score = this._calculateScore()
  const gritGain = Math.round(score / 4)
  const indepGain = Math.round(score / 5)

  // Award stats
  const curGrit = this.registry.get(KEYS.STAT_GRIT) ?? 0
  const curIndep = this.registry.get(KEYS.STAT_INDEPENDENCE) ?? 0
  this.registry.set(KEYS.STAT_GRIT, Math.min(100, curGrit + gritGain))
  this.registry.set(KEYS.STAT_INDEPENDENCE, Math.min(100, curIndep + indepGain))
  completeLevel(this, KEYS.SCORE_L3, KEYS.COMPLETED_L3, score)

  // Overlay
  this.add.rectangle(width / 2, height / 2, width, height, C.PARCHMENT, 0.92)

  // Title
  this.add.text(width / 2, 140, 'THE RIDE', {
    ...TEXT.title,
    fontSize: '32px',
    fontStyle: 'bold',
  }).setOrigin(0.5)

  // Subtitle
  this.add.text(width / 2, 200, 'You made it. Every obstacle was real.', {
    ...TEXT.bodyItalic,
    fontSize: '14px',
    color: COLORS.INK_LIGHT,
  }).setOrigin(0.5)

  // Dodge count
  this.add.text(width / 2, 260,
    `${this._obstaclesDodged} / ${this._totalObstacles} obstacles dodged`, {
    ...TEXT.body,
    fontSize: '16px',
  }).setOrigin(0.5)

  // Stats
  this.add.text(width / 2, 310,
    `+${gritGain} Grit   +${indepGain} Independence`, {
    ...TEXT.stamp,
    fontSize: '18px',
  }).setOrigin(0.5)

  // Score
  this.add.text(width / 2, 360, `Score: ${score}%`, {
    ...TEXT.body,
    fontSize: '16px',
    color: COLORS.INK_FADED,
  }).setOrigin(0.5)

  // Flavor text
  let flavor
  if (score >= 90) flavor = "Untouchable. You've clearly done this before. Oh wait — you have."
  else if (score >= 70) flavor = 'Seasoned traveler. The road left marks, but you kept going.'
  else if (score >= 50) flavor = "Scrappy. You got hit, got up, kept pedaling. That's the whole point."
  else if (score >= 30) flavor = "Bruised but here. The road doesn't care about style."
  else flavor = "You survived. That's all that matters out there."

  this.add.text(width / 2, 420, flavor, {
    ...TEXT.bodyItalic,
    fontSize: '12px',
    color: COLORS.INK_FADED,
  }).setOrigin(0.5)

  // Wax seal
  JournalUI.drawWaxSeal(this, 640, 560, 'A', 24)

  // Return prompt
  this.add.text(width / 2, 640, 'PRESS SPACE to return to the hub', {
    ...TEXT.small,
    color: COLORS.INK_FADED,
  }).setOrigin(0.5)

  // Navigation
  const returnToHub = () => {
    this.cameras.main.fadeOut(400, 0, 0, 0)
    this.time.delayedCall(420, () => this.scene.start('LevelSelectHub'))
  }
  this.input.keyboard.once('keydown-SPACE', returnToHub)
  this.time.delayedCall(8000, returnToHub)
}
```

---

## 14. Edge Cases

### What if the player hits every obstacle?

- They lose all 3 hearts after obstacles #1-3
- **Zero-hearts state:** The player does NOT die. Instead:
  - Hearts display shows 3 empty outlines (hollow hearts)
  - The rider visual becomes faded (alpha 0.5) -- "running on fumes"
  - A small text appears near the rider: "...keep going" (TEXT.label, INK_FADED, alpha 0.4)
  - All remaining obstacles still appear but the player cannot lose further hearts
  - Score is heavily penalized (0 heart bonus = -30 points) but player still finishes
  - Minimum score: 15 (floor)
- **Rationale:** This is a recruiter. A fail/restart screen means they close the tab. The game always completes. Getting hit IS the story -- grit means continuing despite the hits.

### What if the player never presses any key?

- The rider stays at default position (not jumping, not ducking)
- Ground obstacles (#1 dogs, #2 tire, #4 language, #5 credit, #7 icebergs) will all hit the rider
- Overhead obstacles (#3 dengue, #6 border) will also hit (rider is standing, haze covers standing height)
- The storm (#9) will hit (not ducking)
- Only the empty village (#8) might partially work (no knocks = fail)
- Result: 0/9 obstacles dodged, 0 hearts, score = 15 (floor)
- The game still completes in ~90 seconds. The rider limps across the finish line.

### What about the Empty Village door-knocking on mobile?

- On touch devices, the TAP button in the bottom-right handles knocking
- The knockable zone is generous (40px around rider's x:200)
- The 4 doors are spaced 120px apart at current scroll speed, giving ~500ms per door
- Even knocking 2 of 4 doors counts as a partial success (though 3+ needed for full dodge credit)

### Obstacle collision detection

```javascript
_checkCollision(obstacle) {
  if (this._invincible) return false

  // Rider hitbox
  const rx = 200
  const ry = this._isJumping ? this._riderY : (this._isDucking ? GROUND_Y + 10 : GROUND_Y)
  const rw = 40
  const rh = this._isDucking ? 20 : 50

  // Simple AABB overlap
  const ox = obstacle.container.x + obstacle.hitboxOffsetX
  const oy = obstacle.hitboxY
  const ow = obstacle.hitboxW
  const oh = obstacle.hitboxH

  return (rx < ox + ow &&
          rx + rw > ox &&
          ry - rh < oy + oh &&
          ry > oy)
}
```

### Ground obstacles vs overhead obstacles

- **Ground obstacles** (dogs, tire, language, credit, icebergs): hitbox sits on the road (y:510-560). Player clears by jumping (rider y goes above y:457 at peak).
- **Overhead obstacles** (dengue, border): hitbox fills y:0 to y:430. Player clears by ducking (rider top goes below y:540).
- **Storm:** hitbox is full-screen MINUS the bottom 160px (y:0 to y:560). Only ducking (rider is below y:540 with height 20) clears it.
- **Village doors:** no traditional hitbox collision. Failure = not knocking 3+ doors.

### Timing tolerance

All timing windows have a 100ms grace period on both sides. If the player is 100ms early or late on a jump/duck, it still counts as a dodge. This prevents frustration from latency or imprecise input.

```javascript
// In collision check, use a slightly smaller hitbox than visual:
const GRACE_PIXELS = 8  // ~100ms at 160px/s
obstacle.hitboxW -= GRACE_PIXELS * 2
obstacle.hitboxOffsetX += GRACE_PIXELS
```

### Can the player jump AND duck?

No. If UP is pressed while DOWN is held, jump takes priority. If DOWN is pressed while airborne, nothing happens (can't duck mid-jump).

### What if the player spams SPACE during non-village obstacles?

SPACE/click is only processed when `this._knockActive` is true (set during the Empty Village sequence). At all other times, SPACE input is ignored during gameplay. It's only re-enabled at the intro and completion screens.

---

## 15. Scene Lifecycle Summary

```
create()
  +-- Draw parchment background (JournalUI.drawParchment)
  +-- Draw intro screen (disclaimer, obstacle preview)
  +-- Listen for SPACE / set 6s auto-advance timer
  |
  +-- _startRide() [on SPACE or after 6s]
  |   +-- Fade intro texts
  |   +-- Camera shake (snap)
  |   +-- _buildGameWorld() [after 500ms]
  |
  +-- _buildGameWorld()
  |   +-- Draw road segments
  |   +-- Create rider + bicycle container at (200, 530)
  |   +-- Draw location header ("TURKEY")
  |   +-- Draw 3 hearts (top-left)
  |   +-- Draw score counter (top-right)
  |   +-- Show control prompt
  |   +-- Create parallax background layers
  |   +-- Create background color wash overlay
  |   +-- Initialize obstacle spawn schedule
  |   +-- Create input handlers (UP, DOWN, SPACE)
  |   +-- Start dust particle emitter
  |   +-- Draw page number (JournalUI.drawPageNumber(this, 6))
  |   +-- Set this._gameActive = true
  |
  +-- Gameplay loop runs in update()

update(time, delta)
  +-- If not _gameActive: return
  +-- Advance _worldOffset by scrollSpeed * dt
  +-- Update scroll speed (smooth toward target)
  +-- Move all world elements leftward
  +-- Update parallax layers
  +-- Handle jump physics (if jumping)
  +-- Handle duck state (if DOWN held)
  +-- Check obstacle spawn triggers (based on worldOffset)
  +-- Check location transitions (based on worldOffset)
  +-- For each active obstacle:
  |   +-- Move leftward
  |   +-- Check collision with rider
  |   +-- Check near-miss
  |   +-- Check if passed (successful dodge)
  |   +-- Despawn if off-screen left
  +-- Emit dust particles
  +-- Update wheel rotation
  +-- Recycle/spawn road segments
  +-- Recycle/spawn background elements
  +-- Check if all obstacles passed -> _startFinalSprint()
  +-- Check if finish line crossed -> _finish()

_spawnObstacle(type)
  +-- Create obstacle container at x:1400
  +-- Add visual elements (shapes, labels, text)
  +-- Set hitbox data
  +-- Add to _activeObstacles array
  +-- Show warning text

_onObstacleDodged(obstacle)
  +-- Increment _obstaclesDodged
  +-- Show story one-liner
  +-- Bump _targetSpeed by 15
  +-- Brief positive feedback (checkmark)

_onObstacleHit(obstacle)
  +-- If invincible: return
  +-- Increment _obstaclesHit
  +-- Call _loseHeart()
  +-- Camera shake
  +-- Brief slowdown
  +-- Red flash

_startFinalSprint()
  +-- _targetSpeed += 40
  +-- Spawn finish line at appropriate distance
  +-- Text: "HOME" appears

_finish()
  +-- Set _gameActive = false
  +-- Decelerate rider
  +-- After deceleration: _showCompletionScreen()

_showCompletionScreen()
  +-- Calculate score
  +-- Award Grit and Independence stats
  +-- completeLevel()
  +-- Draw score card overlay
  +-- Wait for SPACE or 8s auto-advance -> LevelSelectHub
```

---

## 16. Estimated Line Count

Following the project convention of ~300-400 lines per scene file:

- Constants/data (OBSTACLE_SPAWNS, STORIES): ~50 lines
- create() + intro sequence: ~60 lines
- _buildGameWorld() (rider, road, UI): ~70 lines
- _drawBicycle() + _drawRider(): ~60 lines
- update() loop (scrolling, physics, collision): ~60 lines
- Obstacle spawning (9 types): ~80 lines
- Hit/dodge/near-miss handlers: ~40 lines
- Location transitions: ~30 lines
- _showCompletionScreen(): ~50 lines
- Helpers (dust, hearts, warnings, stories): ~40 lines

Total: ~540 lines (slightly over convention due to 9 obstacle types, but each obstacle's visual code can be condensed into a factory function with config objects)

To compress, the 9 obstacle types should use a data-driven approach:

```javascript
const OBSTACLE_CONFIGS = {
  dogs:     { action: 'jump', width: 160, height: 30, groundLevel: true, shakeIntensity: 0.006, ... },
  tire:     { action: 'jump', width: 40, height: 40, groundLevel: true, ... },
  dengue:   { action: 'duck', width: 250, height: 430, overhead: true, ... },
  // ...
}
```

This keeps the scene file closer to ~420 lines with the obstacle visuals parameterized.

---

## 17. Implementation Priority (Build Order)

1. **Skeleton:** Parchment, road, rider+bicycle drawing, left-to-right scrolling. Verify the feel of the side-scroller movement.

2. **Controls:** Jump and duck mechanics. Verify jump arc clears ground obstacles, duck clears overhead space.

3. **First 3 obstacles:** Dogs (jump), Flat Tire (jump), Dengue (duck). Simple collision detection. Verify hit/dodge feels right.

4. **Hearts + scoring:** 3 hearts, hit feedback (shake, flash, invincibility). Score calculation.

5. **All 9 obstacles:** Add remaining obstacles including the Empty Village tap mechanic. Location transitions.

6. **Polish:** Parallax backgrounds, dust particles, near-miss feedback, wheel spin animation, warning system, story one-liners.

7. **Intro/outro:** Disclaimer screen, completion screen with score card.

8. **Speed tuning:** Calibrate scroll speed progression, timing windows, and obstacle spacing so the ride feels challenging but fair at 70-90 seconds.
