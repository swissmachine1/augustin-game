# Level 1 -- Shanghai: BUILD THE ROCKET / Escape Velocity

## Complete Game Design Document

**Scene file:** `src/scenes/ShanghaiScene.js` (replaces current choice-based implementation)
**Target duration:** 60-90 seconds of active gameplay, ~15s intro/outro
**Canvas:** 1280x720
**Registry keys:** `KEYS.SCORE_L1`, `KEYS.COMPLETED_L1`, `KEYS.STAT_CURIOSITY`

---

## 1. Game Flow -- Second by Second

### Phase A: The Law Lecture (0s-5s) -- Grey Intro

```
0.0s  Camera fadeIn(500ms, from black)
      Parchment background: JournalUI.drawParchment(this, 0, 0, 1280, 720)

0.0s  Everything renders in GREYSCALE tint -- the parchment is desaturated
      (apply a grey-tinted overlay rectangle: 0x888888, alpha 0.15, blendMode ADD)

0.3s  Header fades in at top-left:
      "Chapter 1" in TEXT.label (x: 40, y: 30)
      "Shanghai, 2014" in TEXT.heading, bold (x: 40, y: 50)

0.5s  Center text fades in (TEXT.chapter, 20px, italic, centered at 640, 280):
      "International Commercial Law.
       Jiao Tong University.
       Row 4. Back left."

1.5s  Second text block fades in below (TEXT.bodyItalic, 15px, centered at 640, 380):
      "You should be taking notes.
       Instead, you're staring at the clock."

3.0s  A small prompt pulses at the bottom (TEXT.small, alpha oscillating 0.3-0.7):
      "PRESS SPACE to skip class"

      Player presses SPACE (or auto-advance at 5.0s)

4.5s  The grey overlay tweens alpha from 0.15 to 0.0 over 800ms
      All intro text tweens alpha to 0 over 400ms
      Slight camera shake (intensity 2, duration 300ms) -- the "snap" moment

5.0s  Transition complete. Full-color parchment. The game field appears.
```

### Phase B: Game Setup (5s-7s)

```
5.0s  The rocket appears at bottom-center (x: 640, y: 600), drawn as ink sketch
      It fades in from alpha 0 to 1 over 300ms with a slight scale up (0.8 -> 1.0)

5.0s  Sky layer labels appear on the RIGHT side of the screen (x: 1180, right-aligned)
      Each label is positioned at its layer boundary (see section 5):
        y: 540  "COMFORT ZONE"      (TEXT.label, INK_FADED, alpha 0.6)
        y: 420  "UNKNOWN"            (TEXT.label, INK_FADED, alpha 0.4)
        y: 300  "ADVENTURE"          (TEXT.label, INK_FADED, alpha 0.3)
        y: 180  "HOLY SHIT"          (TEXT.label, INK_FADED, alpha 0.2)
        y: 60   "THIS IS MY LIFE NOW" (TEXT.label, INK_FADED, alpha 0.15)

      Faint horizontal dashed lines separate each layer (see section 10)

5.3s  Fuel gauge appears on the LEFT side (x: 50, y: 200 to y: 620)
      Vertical bar, 30px wide, 420px tall
      Empty state: outlined rectangle, INK border, PARCHMENT fill
      Label below: "FUEL" in TEXT.label

5.5s  A "catch zone" indicator appears -- a horizontal ruled line at y: 570
      This is the platform where the rocket sits. Items must be caught above this line.

6.0s  Prompt text appears at top-center (TEXT.prompt, 14px, centered at 640, 130):
      "Catch the challenges. Feed the rocket."

6.5s  The prompt fades to alpha 0.3 after 2 seconds

7.0s  First challenge item spawns at the top. Game is live.
```

### Phase C: Active Gameplay (7s-75s)

```
Items fall from the top of the screen (y: -40) at varying speeds.
Player moves a "catch tray" left and right to intercept them.
Caught items add fuel to the gauge.
Missed items hit the bottom and shatter (see section 8).

Every 5 caught items: the rocket shudders (small shake tween)
At 33% fuel: rocket emits faint "smoke" particles from base
At 66% fuel: rocket starts vibrating continuously (subtle oscillation tween)
At 100% fuel: LAUNCH SEQUENCE triggers (Phase D)
```

### Phase D: Launch Sequence (75s-90s) -- see section 5

### Phase E: Closing (90s-105s) -- see section 9

---

## 2. Controls

### Mouse/Keyboard Hybrid (both work simultaneously)

**Mouse:**
- Move the mouse left/right to position the catch tray horizontally
- The tray follows `this.input.x` with light easing (lerp factor 0.15 per frame)
- No clicking required during gameplay

**Keyboard:**
- LEFT ARROW / A: move catch tray left at 500px/s
- RIGHT ARROW / D: move catch tray right at 500px/s
- The tray has smooth acceleration/deceleration (ramp up over 100ms, slow down over 150ms)

**Catch tray constraints:**
- Minimum x: 100 (past the red margin line)
- Maximum x: 1180 (before the right edge)
- Tray width: 120px (generous -- this game is about the feeling, not punishing misses)

**Implementation:**
```javascript
// In create():
this._cursors = this.input.keyboard.createCursorKeys()
this._keyA = this.input.keyboard.addKey('A')
this._keyD = this.input.keyboard.addKey('D')
this._trayX = 640  // start centered
this._trayVelX = 0
this._useMouseControl = false

this.input.on('pointermove', (pointer) => {
  this._useMouseControl = true
  this._mouseTargetX = pointer.x
})

// In update(time, delta):
const dt = delta / 1000

if (this._useMouseControl) {
  // Mouse: lerp toward pointer
  this._trayX += (this._mouseTargetX - this._trayX) * 0.15
} else {
  // Keyboard: acceleration model
  let accel = 0
  if (this._cursors.left.isDown || this._keyA.isDown) accel = -2000
  if (this._cursors.right.isDown || this._keyD.isDown) accel = 2000

  if (accel !== 0) {
    this._trayVelX += accel * dt
    this._trayVelX = Phaser.Math.Clamp(this._trayVelX, -500, 500)
  } else {
    // Deceleration
    this._trayVelX *= 0.85
    if (Math.abs(this._trayVelX) < 5) this._trayVelX = 0
  }
  this._trayX += this._trayVelX * dt
}

// Clamp
this._trayX = Phaser.Math.Clamp(this._trayX, 100, 1180)
this._tray.x = this._trayX

// Reset mouse flag on keyboard input
if (this._cursors.left.isDown || this._cursors.right.isDown ||
    this._keyA.isDown || this._keyD.isDown) {
  this._useMouseControl = false
}
```

**SPACE key:** During the law lecture intro, skips to the game. During the closing, returns to hub.

**No tutorial needed:** The first item falls slowly (180px/s). A recruiter will instinctively move the mouse or press arrow keys. The generous tray width (120px) ensures immediate success.

---

## 3. Challenge Items -- Full List

### Brave Items (Red-Pulsing, High Fuel)

These are the scary, bold, uncomfortable actions. They pulse with a WAX_RED glow and are worth 3x fuel. They appear less frequently than safe items (30% of spawns).

| # | Label | Fuel Value | Visual Description |
|---|-------|-----------|-------------------|
| 1 | "FIRST PITCH" | 15 | Bold uppercase, red ink, exclamation underline |
| 2 | "COLD APPROACH A STRANGER" | 15 | Text slightly trembling (rotation oscillation +/-2deg) |
| 3 | "DEMO CRASHES ON STAGE" | 18 | Text has a small "X" cross-out mark then rewritten below it |
| 4 | "PIVOT AT MIDNIGHT" | 15 | Clock icon (small circle with two lines) drawn next to text |
| 5 | "QUIT THE SAFE PATH" | 18 | Text with a line struck through "SAFE" |
| 6 | "SAY YES BEFORE YOU'RE READY" | 15 | Text is slightly larger than others (14px vs 11px) |
| 7 | "LEAD THE TEAM (DAY ONE)" | 15 | Small crown sketch (3 triangles) above the text |
| 8 | "TELL THE DEAN" | 18 | Envelope icon sketch next to text |

**Brave item visual treatment:**
- Background: small rectangle (item width x 36px), filled with WAX_RED at alpha 0.08
- Border: 1px WAX_RED, alpha 0.5, with a pulsing tween (alpha 0.3 to 0.7, yoyo, 600ms loop)
- Text: Lora 11px bold, color WAX_RED (#8a2020)
- A faint red glow circle (radius 30, WAX_RED, alpha 0.06) behind the item, pulsing with the border
- On catch: screen shake (intensity 4, duration 200ms), WAX_RED flash overlay (full screen, alpha 0.08, fades over 300ms)

### Safe Items (Grey, Low Fuel)

These are comfortable, predictable actions. They're visually muted and worth base fuel. They appear more frequently (70% of spawns).

| # | Label | Fuel Value | Visual Description |
|---|-------|-----------|-------------------|
| 1 | "Take Notes" | 4 | Plain text, slightly faded |
| 2 | "Read the Textbook" | 4 | Small book icon (rectangle with spine line) |
| 3 | "Follow the Syllabus" | 3 | Checkbox icon (small square with checkmark) |
| 4 | "Wait for Instructions" | 3 | Ellipsis "..." after text |
| 5 | "Ask Permission" | 4 | Question mark drawn next to text |
| 6 | "Play it Safe" | 3 | Text in parentheses: "(Play it Safe)" |
| 7 | "Stick to the Plan" | 4 | Small arrow pointing right -> next to text |
| 8 | "Keep Your Head Down" | 3 | Text is slightly smaller (9px) |
| 9 | "Check Your Email" | 3 | Small @ symbol next to text |
| 10 | "Do the Assignment" | 4 | Text is perfectly aligned, neat |

**Safe item visual treatment:**
- Background: small rectangle (item width x 30px), filled with PARCHMENT_DARK at alpha 0.3
- Border: 0.5px INK_FADED, alpha 0.3
- Text: Lora 10px normal (not bold), color INK_FADED (#a08050)
- No glow, no pulse -- deliberately boring
- On catch: no screen shake, just a soft "plop" feel (item scales to 0.8 then 0 over 200ms)

### Item Spawn Logic

```javascript
const BRAVE_ITEMS = [
  { label: 'FIRST PITCH', fuel: 15 },
  { label: 'COLD APPROACH\nA STRANGER', fuel: 15 },
  { label: 'DEMO CRASHES\nON STAGE', fuel: 18 },
  { label: 'PIVOT AT MIDNIGHT', fuel: 15 },
  { label: 'QUIT THE SAFE PATH', fuel: 18 },
  { label: 'SAY YES BEFORE\nYOU\'RE READY', fuel: 15 },
  { label: 'LEAD THE TEAM\n(DAY ONE)', fuel: 15 },
  { label: 'TELL THE DEAN', fuel: 18 },
]

const SAFE_ITEMS = [
  { label: 'Take Notes', fuel: 4 },
  { label: 'Read the Textbook', fuel: 4 },
  { label: 'Follow the Syllabus', fuel: 3 },
  { label: 'Wait for Instructions', fuel: 3 },
  { label: 'Ask Permission', fuel: 4 },
  { label: '(Play it Safe)', fuel: 3 },
  { label: 'Stick to the Plan', fuel: 4 },
  { label: 'Keep Your Head Down', fuel: 3 },
  { label: 'Check Your Email', fuel: 3 },
  { label: 'Do the Assignment', fuel: 4 },
]

_spawnItem() {
  const isBrave = Math.random() < this._braveChance  // starts at 0.25, rises to 0.40
  const pool = isBrave ? BRAVE_ITEMS : SAFE_ITEMS
  const template = pool[Math.floor(Math.random() * pool.length)]

  const x = 120 + Math.random() * 1040  // random x within playfield
  const speed = this._baseSpeed + Math.random() * this._speedVariance

  // Create item object (see section 10 for drawing details)
  const item = this._createItemVisual(x, -40, template, isBrave)
  item.speed = speed
  item.fuel = template.fuel
  item.isBrave = isBrave
  this._activeItems.push(item)
}
```

---

## 4. Fuel/Momentum System

### Fuel Gauge

- **Max fuel:** 100 units
- **Launch threshold:** 100 (gauge must be completely full)
- **Gauge visual:** Vertical bar on the left side of the screen
  - Position: x: 50, y: 200 (top) to y: 620 (bottom), width: 30
  - Outer border: 1px INK, alpha 0.5
  - Fill: rises from bottom (y: 620) upward as fuel increases
  - Fill color changes with level:
    - 0-33%: INK_LIGHT (0x8a6a3a), alpha 0.6
    - 34-66%: LEATHER (0x5a3a1a), alpha 0.7
    - 67-99%: RED_MARGIN (0xc45a3a), alpha 0.8
    - 100%: WAX_RED (0x8a2020), alpha 1.0 -- pulsing
  - Fill height = (fuel / 100) * 420

### Fuel Accumulation

```
On catch:
  this._fuel += item.fuel
  this._fuel = Math.min(100, this._fuel)

  // Animate the gauge fill (tween to new height over 200ms, Quad.easeOut)
  // If brave item: gauge "jumps" with overshoot (Back.easeOut)
```

### Combo System: "Momentum"

Catching consecutive brave items builds a multiplier.

```
Brave catch streak:
  1 brave in a row: 1.0x (no bonus)
  2 brave in a row: 1.3x fuel multiplier
  3 brave in a row: 1.6x fuel multiplier
  4+ brave in a row: 2.0x fuel multiplier (cap)

Catching a safe item resets the streak to 0.
Missing any item does NOT reset the streak.

Visual feedback for active streak:
  - At 2x streak: small "x1.3" text appears next to fuel gauge (TEXT.label, WAX_RED)
  - At 3x streak: "x1.6" -- text scales up slightly and the rocket emits more smoke
  - At 4x streak: "x2.0" -- text pulses, rocket vibrates faster

Multiplier display:
  x: 85, y: next to current fuel level
  Fades in on streak start, fades out 1s after streak breaks
```

### Fuel Events (Rocket Reactions)

```
At 20% fuel (20 units):
  Rocket jitters once (x oscillation +/-3px, 150ms, 3 cycles)
  Label appears briefly near rocket: "ignition..." (TEXT.label, alpha 0.5, fades after 1.5s)

At 33% fuel:
  Smoke particles begin from rocket base (see section 10)
  Faint rumble: camera shake (intensity 1, duration 100ms) every 3 seconds

At 50% fuel:
  Prompt text changes to: "Keep going." (TEXT.prompt, centered, alpha 0.4)
  The "COMFORT ZONE" layer label gets a strikethrough line drawn through it

At 66% fuel:
  Rocket vibration begins (continuous x oscillation +/-2px, 80ms loop)
  Smoke particles increase in frequency (from every 200ms to every 100ms)
  The "UNKNOWN" layer label gets a strikethrough

At 85% fuel:
  Screen edge vignette: dark corners appear (4 rectangles with gradient alpha)
  All active items speed up by 20% -- urgency
  Background parchment ruled lines begin to distort slightly (subtle y-offset noise on redraw -- optional, skip if complex)

At 100% fuel:
  LAUNCH triggered. All active items freeze and fade out.
  Input disabled.
  Phase D begins.
```

---

## 5. The Launch Sequence

### Timing Breakdown (15 seconds total)

```
T+0.0s  LAUNCH TRIGGER
        All falling items freeze in place, then fade out (alpha 0 over 300ms)
        Catch tray fades out (300ms)
        Fuel gauge flashes WAX_RED 3 times (alpha pulse 1.0->0.5->1.0, 150ms each)
        The word "LAUNCH" appears huge at center (TEXT.title, 48px, WAX_RED, bold)
        Camera shake: intensity 6, duration 500ms

T+0.5s  "LAUNCH" text scales from 1.0 to 1.5 and fades out over 500ms
        Rocket flame ignites: large orange-red triangle below rocket base
        (see section 10 for flame drawing)
        Smoke particles intensify: 20 particles burst outward from base

T+1.0s  ROCKET BEGINS ASCENDING
        Rocket tweens from y:600 upward
        Speed: starts slow (first 100px over 1.5s), then accelerates dramatically
        Easing: Cubic.easeIn for the first phase, then Linear

        The ENTIRE background scrolls DOWN as the rocket "rises"
        (Actually: rocket stays at y:400 after initial rise, background scrolls)

T+1.0s  LAYER 1: "COMFORT ZONE" (y: 540-420 relative to start)
        As rocket passes through:
          The dashed line at y:540 CRACKS -- it splits into fragments
          Fragments are 5-8 small lines that tween outward with rotation and fade
          The "COMFORT ZONE" label turns bold, scales up 1.2x, then shatters
          (text splits into individual characters that fly outward with physics-like gravity)
          Background tint shifts slightly warmer

T+3.0s  LAYER 2: "UNKNOWN" (y: 420-300)
        This layer is visually foggy -- add a semi-transparent PARCHMENT_DARK overlay
        As rocket enters, the fog clears (overlay alpha tweens from 0.3 to 0)
        The label blurs past (scale 1.0 to 2.0, alpha 1.0 to 0, 400ms)
        Speed is increasing -- background scrolls faster

T+5.0s  LAYER 3: "ADVENTURE" (y: 300-180)
        The parchment background starts showing INK splatters (JournalUI.drawInkBlot)
        3-4 ink blots appear in random positions as the rocket passes
        The "ADVENTURE" label is drawn in WAX_RED instead of INK_FADED
        It STAYS on screen for a beat (600ms at full alpha) before scrolling past
        Rocket flame grows larger (triangle height increases)

T+8.0s  LAYER 4: "HOLY SHIT" (y: 180-60)
        Camera shake returns: intensity 3, continuous while in this layer
        The "HOLY SHIT" label is handwritten-style (slightly rotated, larger, 16px)
        Exclamation marks appear around it: scattered "!" text objects
        Background color shifts: PARCHMENT darkens slightly toward LEATHER tone
        Speed is now very fast -- layers fly past

T+10.0s LAYER 5: "THIS IS MY LIFE NOW" (y: 60 and above)
         The rocket BREAKS THROUGH the top of the page
         Visual: a torn-paper edge effect at y:40
         (draw jagged line with fillTriangle alternating up/down across full width)
         Above the tear: bright PARCHMENT (clean, fresh -- like a new page)
         The old page scrolls down and away

T+11.0s The screen is now clean parchment -- a blank page
         Rocket hovers at center (y: 360), flame flickering gently
         Small ink-sketch stars appear around it (5-6 asterisk shapes, fading in)

T+12.0s The final line appears, handwriting-style (TEXT.chapter, 18px, italic):
         "Shanghai, 2014."

T+13.0s Second line appears below (TEXT.bodyItalic, 14px):
         "The weekend I stopped planning my life"

T+14.0s Third line completes (TEXT.bodyItalic, 14px):
         "and started building it."

T+15.0s Hold for 2 seconds, then transition to Phase E (closing)
```

### Layer Positions (Pre-Launch Static View)

During gameplay, the layers are visible as faint guides on the right side. They represent where the rocket will travel during launch.

```
Layer boundaries (dashed lines across full width):
  y: 570  ---- ground level (rocket platform)
  y: 540  ---- COMFORT ZONE ceiling
  y: 420  ---- UNKNOWN ceiling
  y: 300  ---- ADVENTURE ceiling
  y: 180  ---- HOLY SHIT ceiling
  y: 60   ---- THIS IS MY LIFE NOW ceiling (top of "page")

Dashed line style:
  lineStyle(0.5, C.INK_FADED, 0.15)
  Segments: 8px on, 8px off (drawn with a loop of short strokes)

Labels are right-aligned at x: 1230, positioned just below each boundary.
```

---

## 6. Scoring (0-100)

### Score Calculation

```javascript
_calculateScore() {
  // Brave vs safe ratio (what % of caught items were brave?)
  const braveRatio = this._bravesCaught / Math.max(1, this._totalCaught)

  // Efficiency (how few items missed?)
  const catchRate = this._totalCaught / Math.max(1, this._totalSpawned)

  // Time factor (faster completion = slight bonus)
  const elapsed = this._launchTime - this._gameStartTime  // ms
  const timeFactor = elapsed < 50000 ? 1.1 : (elapsed < 70000 ? 1.0 : 0.9)

  // Combo factor (best streak achieved)
  const comboFactor = 1 + (this._bestStreak * 0.05)  // 0-4 streak = 1.0-1.2

  // Raw score components
  const braveScore = braveRatio * 50         // up to 50 points for catching brave items
  const catchScore = catchRate * 30          // up to 30 points for catching everything
  const comboScore = this._bestStreak * 5    // up to 20 points (4 streak cap)

  const raw = (braveScore + catchScore + comboScore) * timeFactor
  return Math.max(15, Math.min(100, Math.round(raw)))
}
```

**Score interpretation:**
- 90-100: Fearless. Caught mostly brave items, high catch rate, good combos
- 70-89: Adventurous. Balanced mix, solid catch rate
- 50-69: Cautious but committed. Mostly safe items, decent catch rate
- 30-49: Hesitant. Low brave ratio or missed many items
- 15-29: Floor. Everyone gets at least 15 for completing the level

### Stat Awards

```javascript
// Curiosity stat: primary stat for this level
const curiosityGain = Math.round(finalScore / 5)  // 3-20 points
const currentCuriosity = this.registry.get(KEYS.STAT_CURIOSITY) ?? 0
this.registry.set(KEYS.STAT_CURIOSITY, Math.min(100, currentCuriosity + curiosityGain))

// Save
completeLevel(this, KEYS.SCORE_L1, KEYS.COMPLETED_L1, finalScore)
```

### Stats Tracked During Gameplay

```javascript
this._fuel = 0              // current fuel (0-100)
this._totalCaught = 0       // items caught
this._totalMissed = 0       // items that hit bottom
this._totalSpawned = 0      // items created
this._bravesCaught = 0      // brave items caught
this._safesCaught = 0       // safe items caught
this._currentStreak = 0     // current consecutive brave catches
this._bestStreak = 0        // highest brave streak achieved
this._gameStartTime = 0     // timestamp when first item spawns
this._launchTime = 0        // timestamp when fuel hits 100
```

---

## 7. Difficulty Curve

### Three Phases of Escalation

**Phase 1: "What is this?" (0-20 seconds, fuel 0-25%)**
```
Spawn interval: 1400ms (one item every 1.4 seconds)
Base fall speed: 120 px/s
Speed variance: +/- 20 px/s
Brave chance: 25%
Max simultaneous items: 3

Purpose: Let the player understand the mechanic. First 2-3 items are always safe
(hardcoded) so the player catches something immediately and sees the fuel gauge move.
```

**Phase 2: "I want more" (20-50 seconds, fuel 25-70%)**
```
Spawn interval: ramps from 1400ms down to 900ms (linear interpolation)
Base fall speed: ramps from 120 to 200 px/s
Speed variance: +/- 40 px/s
Brave chance: 30% -> 35%
Max simultaneous items: 5

Purpose: The player is now chasing brave items. They've seen the difference in
fuel gain. Safe items feel unsatisfying. The game teaches the lesson through feel.
```

**Phase 3: "Almost there" (50-75 seconds, fuel 70-100%)**
```
Spawn interval: ramps from 900ms down to 650ms
Base fall speed: ramps from 200 to 280 px/s
Speed variance: +/- 60 px/s
Brave chance: 35% -> 45%
Max simultaneous items: 7

Purpose: Urgency. More items, faster. The rocket is visibly shaking. The fuel
gauge is almost full. The player is leaning forward. Brave items appear more
often -- the game rewards courage right when the player needs to be courageous.
```

### Difficulty Parameter Interpolation

```javascript
// In update(), calculate difficulty based on fuel percentage
const t = this._fuel / 100  // 0.0 to 1.0

this._spawnInterval = Phaser.Math.Linear(1400, 650, t)
this._baseSpeed = Phaser.Math.Linear(120, 280, t)
this._speedVariance = Phaser.Math.Linear(20, 60, t)
this._braveChance = Phaser.Math.Linear(0.25, 0.45, t)
this._maxItems = Math.floor(Phaser.Math.Linear(3, 7, t))
```

### Spawn Timer Implementation

```javascript
// In create():
this._spawnTimer = this.time.addEvent({
  delay: this._spawnInterval,
  callback: () => {
    if (this._activeItems.length < this._maxItems) {
      this._spawnItem()
    }
    // Update interval for next spawn
    this._spawnTimer.delay = this._spawnInterval
  },
  loop: true,
})

// First 2 items are always safe (guaranteed early success)
this._spawnCount = 0
```

---

## 8. Edge Cases

### Missing Items

**What happens when an item reaches the bottom (y > 680):**
```
- Item "shatters": splits into 3-4 small fragments
  Fragments: tiny rectangles (4x2px), INK_FADED color
  Each fragment tweens: random x velocity, y velocity upward (-50 to -100),
  then gravity pulls down, alpha fades to 0 over 400ms
- this._totalMissed++
- The rocket does NOT lose fuel (fuel only goes up, never down)
- NO penalty -- this is a game about gain, not loss
- A faint "..." text appears at the impact point (TEXT.small, alpha 0.3, fades over 500ms)
```

### Can the Player Fail?

**No. The player cannot fail this level.** The level always completes.

Reasoning: This is a recruiter playing a resume. A fail state means they close the tab. The game adjusts to ensure completion:

```
Failsafe #1: Minimum fuel per item
  Even safe items give 3-4 fuel. At minimum spawn rate, a player catches
  ~40 items in 90 seconds. Even catching only safe items = 40 * 3.5 = 140 fuel.
  100 fuel needed. Player would fill the gauge in ~65 seconds even playing badly.

Failsafe #2: Mercy rule at 80 seconds elapsed
  If fuel < 70 after 80 seconds of gameplay:
    - Spawn rate doubles
    - All spawned items become brave
    - Brave item fuel increased to 20
    - The game effectively auto-completes within 10 more seconds

Failsafe #3: Hard cap at 100 seconds elapsed
  If fuel somehow still < 100 at 100 seconds:
    - Force fuel to 100 and trigger launch
    - This should never happen with failsafe #2, but prevents infinite games
```

### What if the Player Doesn't Move?

If the player stands still (tray at center x:640):
- Items spawn across the full width (120-1160), so ~10% will land on the tray naturally
- Safe items alone would eventually fill the gauge
- The mercy rule kicks in at 80 seconds
- Worst case: ~95 seconds to complete

### What if the Player Moves to One Side and Stays?

- Items still spawn randomly across the full width
- Player catches ~20% of items (tray width 120 / playfield width 1060)
- Still enough safe items to fill gauge in ~90 seconds
- Mercy rule ensures completion

### Overlapping Items

Multiple items can occupy the same screen space. They do not collide with each other. Only the tray catches them.

### Rapid Catches

If the player catches 2+ items in the same frame (items overlapping on the tray):
- Both are caught and both award fuel
- Screen shake stacks (intensity doubles briefly)
- This is a fun moment, not a bug

---

## 9. Opening and Closing

### Opening: The Grey Law Lecture

**Purpose:** Establish contrast. The player starts in a dull, safe, grey world. Then color snaps in with the game. The contrast IS the story.

```
Scene entry:
  camera.fadeIn(500, 0, 0, 0)

Grey overlay:
  const greyOverlay = this.add.rectangle(640, 360, 1280, 720, 0x888888, 0.15)
  greyOverlay.setBlendMode(Phaser.BlendModes.MULTIPLY)

  // Alternative if blend mode looks wrong on some browsers:
  // Use a parchment-grey color (0xd0d0c8) at high alpha instead of parchment gold

Text sequence (all using setAlpha(0) then tweened in):

  t=0.3s: "Chapter 1" -- TEXT.label, x:40, y:30
          "Shanghai, 2014" -- TEXT.heading, bold, x:40, y:50

  t=0.5s: Center block (640, 280):
          "International Commercial Law."
          "Jiao Tong University."
          "Row 4. Back left."
          Style: TEXT.chapter, 20px, italic, align center, lineSpacing 10

  t=1.5s: Below center (640, 380):
          "You should be taking notes."
          "Instead, you're staring at the clock."
          Style: TEXT.bodyItalic, 15px, INK_LIGHT color, align center

  t=3.0s: Bottom prompt (640, 620):
          "PRESS SPACE to skip class"
          Style: TEXT.small, INK_FADED
          Pulsing alpha tween: 0.3 to 0.7, yoyo, loop, duration 800ms

Input handler:
  this.input.keyboard.once('keydown-SPACE', () => this._transitionToGame())

Auto-advance:
  this.time.delayedCall(5000, () => this._transitionToGame())

_transitionToGame():
  // Remove grey overlay with drama
  this.tweens.add({
    targets: greyOverlay,
    alpha: 0,
    duration: 800,
    ease: 'Quad.easeOut',
  })

  // Fade all intro text
  introTexts.forEach(t => {
    this.tweens.add({ targets: t, alpha: 0, duration: 400 })
  })

  // The "snap" -- a small camera shake to mark the transition
  this.cameras.main.shake(300, 0.003)

  // After transition, build the game field
  this.time.delayedCall(900, () => this._buildGameField())
```

### Closing: Score and Transition

After the launch sequence final text ("and started building it.") holds for 2 seconds:

```
T+17.0s  The final text and rocket fade out gently (alpha 0 over 600ms)

T+17.5s  Full-canvas parchment overlay fades in (alpha 0.95, 500ms)

T+18.0s  Score card appears:

         y: 160  "ESCAPE VELOCITY"
                 TEXT.title, 32px, bold, centered

         y: 230  Stat display:
                 "+{curiosityGain} Curiosity"
                 TEXT.stamp, 20px, STAMP_GREEN

         y: 280  "Score: {finalScore}%"
                 TEXT.body, 16px, INK_FADED

         y: 330  Performance flavor text (based on score):
                 90-100: "Fearless. You didn't just leave the comfort zone -- you launched through it."
                 70-89:  "Adventurous. You leaned into the unknown."
                 50-69:  "Cautious, but you got there. The rocket doesn't care how -- it flies."
                 15-49:  "A slow burn. But you launched. That's what matters."
                 TEXT.bodyItalic, 13px, INK_LIGHT

         y: 400  Stats summary box (ink-bordered rectangle):
                 "Items caught: {totalCaught}"
                 "Brave choices: {bravesCaught}"
                 "Best streak: {bestStreak}"
                 "Catch rate: {Math.round(catchRate*100)}%"
                 TEXT.small, 10px, INK_FADED

         y: 520  Wax seal: JournalUI.drawWaxSeal(this, 640, 520, 'S', 24)
                 (S for Shanghai)

         y: 580  Vignette teaser for next level:
                 "A year later, Switzerland gets boring."
                 "You buy a one-way ticket to Medellin..."
                 TEXT.prompt, 13px, italic, centered, lineSpacing 6

         y: 660  "PRESS SPACE to return to the hub"
                 TEXT.small, INK_FADED

Return to hub:
  const returnToHub = () => {
    this.cameras.main.fadeOut(400, 0, 0, 0)
    this.time.delayedCall(420, () => this.scene.start('LevelSelectHub'))
  }
  this.input.keyboard.once('keydown-SPACE', returnToHub)
  this.time.delayedCall(8000, returnToHub)
```

---

## 10. Visual Details -- Phaser Primitives

### The Rocket (Ink Sketch Style)

The rocket is drawn entirely with Phaser graphics primitives. It should look like a hasty doodle in a notebook margin -- charming, not polished.

```javascript
_drawRocket(x, y) {
  const g = this.add.graphics()

  // Rocket body: tall narrow trapezoid
  // Width: 30 at base, 20 at top. Height: 70
  g.fillStyle(C.PARCHMENT_DARK, 0.8)
  g.beginPath()
  g.moveTo(x - 15, y)        // bottom-left
  g.lineTo(x + 15, y)        // bottom-right
  g.lineTo(x + 10, y - 60)   // top-right
  g.lineTo(x - 10, y - 60)   // top-left
  g.closePath()
  g.fillPath()

  // Outline (hand-drawn effect: slightly wobbly)
  g.lineStyle(1.5, C.INK, 0.8)
  g.beginPath()
  g.moveTo(x - 15, y)
  g.lineTo(x - 16, y - 20)   // slight wobble
  g.lineTo(x - 11, y - 45)
  g.lineTo(x - 10, y - 60)
  g.lineTo(x, y - 75)        // nose cone tip
  g.lineTo(x + 10, y - 60)
  g.lineTo(x + 11, y - 45)
  g.lineTo(x + 16, y - 20)   // slight wobble
  g.lineTo(x + 15, y)
  g.strokePath()

  // Nose cone (triangle at top)
  g.fillStyle(C.INK, 0.15)
  g.fillTriangle(x - 10, y - 60, x + 10, y - 60, x, y - 75)

  // Window (small circle)
  g.lineStyle(1, C.INK, 0.6)
  g.strokeCircle(x, y - 40, 6)
  g.fillStyle(C.PARCHMENT, 0.5)
  g.fillCircle(x, y - 40, 5)

  // Fins (two small triangles at base)
  g.lineStyle(1, C.INK, 0.6)
  // Left fin
  g.fillStyle(C.INK, 0.1)
  g.fillTriangle(x - 15, y, x - 25, y + 10, x - 15, y - 15)
  g.beginPath()
  g.moveTo(x - 15, y)
  g.lineTo(x - 25, y + 10)
  g.lineTo(x - 15, y - 15)
  g.strokePath()
  // Right fin
  g.fillTriangle(x + 15, y, x + 25, y + 10, x + 15, y - 15)
  g.beginPath()
  g.moveTo(x + 15, y)
  g.lineTo(x + 25, y + 10)
  g.lineTo(x + 15, y - 15)
  g.strokePath()

  // Cross-hatch shading on body (3-4 diagonal lines)
  g.lineStyle(0.5, C.INK, 0.15)
  for (let i = 0; i < 4; i++) {
    const ly = y - 10 - i * 12
    g.beginPath()
    g.moveTo(x - 8, ly)
    g.lineTo(x + 8, ly - 8)
    g.strokePath()
  }

  return g
}
```

**Rocket dimensions:** ~30px wide, ~85px tall (base to nose tip)
**Rocket origin:** bottom-center of the body (x, y = base center)

### The Catch Tray

A simple ruled-line platform that the player moves. It looks like an underline or bracket in a notebook.

```javascript
_drawTray(x, y) {
  const container = this.add.container(x, y)

  const g = this.add.graphics()

  // Main platform line (thick ruled line)
  g.lineStyle(2.5, C.INK, 0.7)
  g.beginPath()
  g.moveTo(-60, 0)
  g.lineTo(60, 0)
  g.strokePath()

  // Small end brackets (like [ and ])
  g.lineStyle(1.5, C.INK, 0.5)
  // Left bracket
  g.beginPath()
  g.moveTo(-60, -8)
  g.lineTo(-60, 0)
  g.strokePath()
  // Right bracket
  g.beginPath()
  g.moveTo(60, -8)
  g.lineTo(60, 0)
  g.strokePath()

  // Subtle fill behind tray (so player can see it against items)
  g.fillStyle(C.PARCHMENT_DARK, 0.3)
  g.fillRect(-60, -10, 120, 12)

  container.add(g)
  return container
}
```

**Tray width:** 120px (from -60 to +60 relative to center)
**Tray position:** y: 570 (just above the ground/platform line)
**Hit detection:** item.x is within tray.x +/- 60, and item.y >= 555 and item.y <= 585

### Falling Items

Each item is a Phaser Container holding a background rectangle and text.

```javascript
_createItemVisual(x, y, template, isBrave) {
  const container = this.add.container(x, y)

  // Measure text to size the background
  const fontSize = isBrave ? '11px' : '10px'
  const textObj = this.add.text(0, 0, template.label, {
    fontFamily: 'Lora',
    fontSize: fontSize,
    color: isBrave ? COLORS.WAX_RED : COLORS.INK_FADED,
    fontStyle: isBrave ? 'bold' : 'normal',
    align: 'center',
  }).setOrigin(0.5)

  const padX = 14
  const padY = 8
  const w = Math.max(80, textObj.width + padX * 2)
  const h = textObj.height + padY * 2

  const g = this.add.graphics()

  if (isBrave) {
    // Red pulsing background
    g.fillStyle(C.WAX_RED, 0.08)
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 4)
    g.lineStyle(1, C.WAX_RED, 0.5)
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 4)

    // Glow circle behind
    const glow = this.add.graphics()
    glow.fillStyle(C.WAX_RED, 0.06)
    glow.fillCircle(0, 0, 30)
    container.add(glow)

    // Pulse tween on the border graphic
    this.tweens.add({
      targets: g,
      alpha: { from: 0.7, to: 1 },
      duration: 600,
      yoyo: true,
      loop: -1,
    })
  } else {
    // Muted grey background
    g.fillStyle(C.PARCHMENT_DARK, 0.3)
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 3)
    g.lineStyle(0.5, C.INK_FADED, 0.3)
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 3)
  }

  container.add(g)
  container.add(textObj)

  // Store metadata on the container
  container.setData('fuel', template.fuel)
  container.setData('isBrave', isBrave)
  container.setData('speed', 0)  // set by caller

  return container
}
```

### Fuel Gauge

```javascript
_drawFuelGauge() {
  const x = 50, y = 200, w = 30, h = 420

  // Outer border
  this._gaugeGraphics = this.add.graphics()
  this._gaugeGraphics.lineStyle(1, C.INK, 0.5)
  this._gaugeGraphics.strokeRect(x - w / 2, y, w, h)

  // Fill (redrawn each update)
  this._gaugeFill = this.add.graphics()

  // Label
  this.add.text(x, y + h + 15, 'FUEL', {
    ...TEXT.label,
    fontSize: '9px',
  }).setOrigin(0.5)

  // Percentage text (updates)
  this._fuelText = this.add.text(x, y - 15, '0%', {
    ...TEXT.small,
    fontSize: '11px',
    fontStyle: 'bold',
  }).setOrigin(0.5)
}

_updateFuelGauge() {
  const x = 50, y = 200, w = 30, h = 420
  const fillH = (this._fuel / 100) * h
  const fillY = y + h - fillH

  this._gaugeFill.clear()

  // Choose color based on fuel level
  let color, alpha
  if (this._fuel < 34) { color = C.INK_LIGHT; alpha = 0.6 }
  else if (this._fuel < 67) { color = C.LEATHER; alpha = 0.7 }
  else if (this._fuel < 100) { color = C.RED_MARGIN; alpha = 0.8 }
  else { color = C.WAX_RED; alpha = 1.0 }

  this._gaugeFill.fillStyle(color, alpha)
  this._gaugeFill.fillRect(x - w / 2 + 1, fillY, w - 2, fillH)

  this._fuelText.setText(`${Math.round(this._fuel)}%`)
}
```

### Sky Layer Dividers

```javascript
_drawSkyLayers() {
  const layers = [
    { y: 540, label: 'COMFORT ZONE', alpha: 0.6 },
    { y: 420, label: 'UNKNOWN', alpha: 0.4 },
    { y: 300, label: 'ADVENTURE', alpha: 0.3 },
    { y: 180, label: 'HOLY SHIT', alpha: 0.2 },
    { y: 60,  label: 'THIS IS MY LIFE NOW', alpha: 0.15 },
  ]

  const g = this.add.graphics()

  layers.forEach(layer => {
    // Dashed horizontal line
    g.lineStyle(0.5, C.INK_FADED, 0.15)
    for (let x = 90; x < 1200; x += 16) {
      g.beginPath()
      g.moveTo(x, layer.y)
      g.lineTo(x + 8, layer.y)
      g.strokePath()
    }

    // Label (right-aligned)
    this.add.text(1230, layer.y + 4, layer.label, {
      ...TEXT.label,
      fontSize: '8px',
      color: COLORS.INK_FADED,
    }).setOrigin(1, 0).setAlpha(layer.alpha)
  })

  return g
}
```

### Smoke Particles (Rocket Exhaust)

```javascript
_emitSmoke() {
  const rocketX = this._rocketContainer.x
  const rocketY = this._rocketContainer.y

  for (let i = 0; i < 3; i++) {
    const particle = this.add.circle(
      rocketX + (Math.random() - 0.5) * 20,
      rocketY + 5,
      2 + Math.random() * 3,
      C.INK_FADED,
      0.3
    )

    this.tweens.add({
      targets: particle,
      y: rocketY + 40 + Math.random() * 30,
      x: particle.x + (Math.random() - 0.5) * 40,
      alpha: 0,
      scale: 0.3,
      duration: 600 + Math.random() * 400,
      ease: 'Quad.easeOut',
      onComplete: () => particle.destroy(),
    })
  }
}
```

### Rocket Flame (During Launch)

```javascript
_drawFlame(rocketX, rocketY, size) {
  // size: 1.0 = normal, grows during launch up to 3.0
  this._flameGraphics.clear()

  const baseW = 12 * size
  const baseH = 20 * size

  // Outer flame (orange-red = RED_MARGIN)
  this._flameGraphics.fillStyle(C.RED_MARGIN, 0.7)
  this._flameGraphics.fillTriangle(
    rocketX - baseW, rocketY,
    rocketX + baseW, rocketY,
    rocketX + (Math.random() - 0.5) * 4, rocketY + baseH
  )

  // Inner flame (brighter, WAX_RED_LIGHT)
  this._flameGraphics.fillStyle(C.WAX_RED_LIGHT, 0.5)
  this._flameGraphics.fillTriangle(
    rocketX - baseW * 0.5, rocketY,
    rocketX + baseW * 0.5, rocketY,
    rocketX + (Math.random() - 0.5) * 3, rocketY + baseH * 0.7
  )
}
```

### Comfort Zone Crack Effect

```javascript
_crackLayer(y) {
  // Create 8 line fragments from the dashed line
  for (let i = 0; i < 8; i++) {
    const startX = 90 + i * 140
    const frag = this.add.graphics()
    frag.lineStyle(1, C.INK_FADED, 0.4)
    frag.beginPath()
    frag.moveTo(0, 0)
    frag.lineTo(20 + Math.random() * 30, 0)
    frag.strokePath()
    frag.setPosition(startX, y)

    this.tweens.add({
      targets: frag,
      y: y + 30 + Math.random() * 50,
      x: startX + (Math.random() - 0.5) * 80,
      rotation: (Math.random() - 0.5) * 1.5,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeIn',
      onComplete: () => frag.destroy(),
    })
  }
}
```

### Screen Shake Helper

```javascript
_shake(intensity = 4, duration = 200) {
  this.cameras.main.shake(duration, intensity / 1000)
}
```

### Page Number

```javascript
JournalUI.drawPageNumber(this, 2)  // "p. 2" at bottom-right
```

---

## 11. Sound Cue Moments (Future Implementation)

Even though sound is not implemented yet, these moments are marked for future audio:

```
CATCH_SAFE:       soft paper rustle / pen scratch (subtle, quick)
CATCH_BRAVE:      stamp thud / heavy journal close (impactful, satisfying)
COMBO_START:      rising tone (when streak hits 2)
COMBO_BREAK:      no sound (silence is enough)
FUEL_33:          low rumble begins
FUEL_66:          rumble intensifies
FUEL_100:         silence for 0.3s, then LAUNCH sound
LAUNCH:           roar + ascending pitch (crescendo over 10s)
LAYER_CRACK:      glass/paper crack
BREAKTHROUGH:     clean, triumphant tone (the "ah" moment)
FINAL_TEXT:        quiet, contemplative piano note
```

---

## 12. Scene Lifecycle Summary

```
create()
  +-- Draw parchment background
  +-- Draw grey overlay (law lecture)
  +-- Show intro text sequence
  +-- Listen for SPACE / set auto-advance timer
  |
  +-- _transitionToGame() [on SPACE or after 5s]
  |   +-- Remove grey overlay with tween
  |   +-- Fade intro texts
  |   +-- Camera shake (snap moment)
  |   +-- _buildGameField() [after 900ms]
  |
  +-- _buildGameField()
  |   +-- Draw rocket at (640, 600)
  |   +-- Draw sky layer dividers and labels
  |   +-- Draw fuel gauge (left side)
  |   +-- Draw catch tray at (640, 570)
  |   +-- Show "Catch the challenges. Feed the rocket." prompt
  |   +-- Create input handlers (keyboard + mouse)
  |   +-- Start spawn timer
  |   +-- Draw page number
  |
  +-- Gameplay loop runs in update()

update(time, delta)
  +-- If not gameActive: return
  +-- Update difficulty parameters based on fuel level
  +-- Move catch tray (mouse or keyboard)
  +-- Move all active items downward (item.y += item.speed * dt)
  +-- Check catch collisions (item near tray)
  +-- Check missed items (item.y > 680)
  +-- Update fuel gauge visual
  +-- Emit smoke particles if fuel > 33%
  +-- Update rocket vibration if fuel > 66%
  +-- Check mercy rule at 80s elapsed
  +-- Check hard cap at 100s elapsed
  +-- If fuel >= 100: _triggerLaunch()

_onCatch(item)
  +-- Calculate fuel with combo multiplier
  +-- Add fuel
  +-- Update stats (totalCaught, bravesCaught, streak)
  +-- Play catch effect (shake if brave, scale-down if safe)
  +-- Remove item from activeItems
  +-- Destroy item container

_triggerLaunch()
  +-- Set gameActive = false
  +-- Record launchTime
  +-- Freeze and fade all active items
  +-- Hide tray
  +-- Flash fuel gauge
  +-- Show "LAUNCH" text
  +-- Begin launch sequence (layer-by-layer ascent)
  +-- On completion: show final text
  +-- After hold: _finish()

_finish()
  +-- Calculate score
  +-- Award curiosity stat
  +-- completeLevel(this, KEYS.SCORE_L1, KEYS.COMPLETED_L1, finalScore)
  +-- Draw completion overlay with score card
  +-- Wait for SPACE or 8s auto-advance -> LevelSelectHub
```

---

## 13. Estimated Line Count

Following the project convention of ~300-400 lines per scene file, this design targets approximately 400 lines:

- Constants/data (BRAVE_ITEMS, SAFE_ITEMS): ~40 lines
- create() + intro sequence: ~50 lines
- _buildGameField() (rocket, tray, gauge, layers): ~70 lines
- update() loop (movement, collisions, difficulty): ~60 lines
- _spawnItem() + _createItemVisual(): ~50 lines
- _onCatch() + combo logic: ~30 lines
- _triggerLaunch() + launch sequence: ~60 lines
- _finish() + score screen: ~40 lines

Total: ~400 lines

---

## 14. Implementation Priority (Build Order)

If implementing incrementally, build in this order:

1. **Skeleton:** Parchment background, rocket drawing, tray drawing, tray movement (mouse + keyboard). Verify the feel of moving the tray.

2. **Items:** Spawn safe items only, falling at constant speed. Catch detection. Fuel gauge that fills. Verify catch feels satisfying.

3. **Brave/safe split:** Add brave items with visual distinction. Implement combo multiplier. Verify that brave items FEEL different (pulse, shake, color).

4. **Difficulty curve:** Implement speed/spawn ramping based on fuel. Add mercy rule. Verify 60-90 second completion time.

5. **Launch sequence:** The big payoff. Layer cracking, rocket ascent, final text. This is the emotional climax -- invest time here.

6. **Opening/closing:** Grey law lecture intro, score card, hub transition. The bookends.

7. **Polish:** Smoke particles, rocket vibration, screen shake calibration, ink blots during launch.
