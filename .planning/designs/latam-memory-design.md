# Level 2 — Latin America: CRACK THE MARKET

## Memory/Match Game Design Document

**Scene file:** `src/scenes/LatinAmericaScene.js` (replaces current network-builder implementation)
**Target duration:** 60-90 seconds
**Canvas:** 1280x720

---

## 1. Grid Layout

**Grid:** 6 columns x 4 rows = 24 cards = 12 pairs (10 challenge/skill pairs + 1 wild card pair + 1 bonus pair)

**Card dimensions:** 150w x 90h pixels
**Horizontal spacing:** 16px between cards
**Vertical spacing:** 14px between cards

**Grid positioning (left-aligned to leave room for right-side UI panel):**
- Grid total width: (150 x 6) + (16 x 5) = 900 + 80 = 980px
- Grid total height: (90 x 4) + (14 x 3) = 360 + 42 = 402px
- Grid origin X: 20px (left padding)
- Grid origin Y: 140px (below header area)
- Grid ends at X = 1000px

**Right panel:** 1010px to 1260px (250px wide) — stats, counters, insight display

**Header area:** y: 20-120 — chapter title, intro text

```
Card position formula:
  cardX = 20 + col * (150 + 16)  // col 0-5
  cardY = 140 + row * (90 + 14)  // row 0-3
```

---

## 2. Complete Card Pair List (12 Pairs)

### 10 Challenge-Skill Pairs

| # | Challenge Card | Skill Card | Insight Text (shown on match) |
|---|---------------|------------|-------------------------------|
| 1 | No Spanish | Adaptability | "No hablaba espanol. So I learned to sell with diagrams on napkins, body language, and sheer persistence. The language came later. The deals came first." |
| 2 | Zero network in LatAm | Cold outreach mastery | "I had nobody's number. So I cold-emailed every KOL I could find, showed up at conferences uninvited, and turned strangers into partners." |
| 3 | Cultural differences across 11 countries | Cross-cultural EQ | "What closes in Colombia offends in Chile. I learned to read the room before I opened my mouth — and to never assume two Latin countries work the same way." |
| 4 | Training doctors remotely | Consultative selling | "You can't hard-sell a surgeon. I learned to teach first, prove value second, and let the product speak through results." |
| 5 | 11 countries, 11 regulations | Navigating complexity | "Every country had its own medical device rules, tax codes, and approval timelines. I built a spreadsheet that became my bible." |
| 6 | Solo in Medellin, no backup | Independence & grit | "No team. No office. Just a laptop in a coworking space and a list of 200 doctors. Some weeks the only voice I heard was my own pitch." |
| 7 | Convincing skeptical KOLs | Stakeholder management | "Senior surgeons don't take meetings with 25-year-olds. I earned the first meeting through a published case study. I earned the second by remembering their daughter's name." |
| 8 | No marketing budget | Scrappy GTM | "Zero ad spend. I built the pipeline with WhatsApp groups, conference hallway ambushes, and a demo that fit in my backpack." |
| 9 | Product-market fit in a new continent | Market research | "The product worked in Europe. Latin America wanted something different. I spent 3 months just listening before I pitched a single feature change." |
| 10 | Hiring across borders | Remote leadership | "My first hire was in Bogota. My second in Mexico City. I managed a team across 4 time zones before I had a single direct report in the same room." |

### 1 Wild Card Pair (Celebration Trigger)

| # | Card A | Card B | Celebration Insight |
|---|--------|--------|-------------------|
| 11 | $0 → $1M ARR | 11 Countries Conquered | "From a one-way ticket to Medellin to a million in recurring revenue across an entire continent. Not bad for someone who couldn't order coffee in Spanish." |

### 1 Bonus Pair

| # | Card A | Card B | Insight Text |
|---|--------|--------|-------------|
| 12 | Building trust across borders | Relationship building | "Business in Latin America runs on relationships, not contracts. I learned that a 2-hour lunch matters more than a 20-page proposal." |

---

## 3. Wild Card Pair — "$0 to $1M ARR" + "11 Countries Conquered"

**Visual differentiation:** Both cards have a subtle gold/amber border instead of the standard ink border when face-down (hint that they are special). Face-up, they use a larger font and a wax-red accent color instead of the standard ink/green scheme.

**On match — celebration sequence (1.5 seconds total):**
1. Both cards flash wax-red (C.WAX_RED) pulse, scale to 1.15x over 200ms, then settle back to 1.0x
2. A full-width banner drops from the top: "$1,000,000 ARR" in 36px bold Lora, wax-red color, with a parchment-dark background bar
3. Confetti effect: 30 small rectangles (4x8px each) in STAMP_GREEN, WAX_RED, LEATHER, INK_LIGHT colors fall from the banner with random x-velocity and gravity, fading out over 1.5s
4. The banner slides up and disappears after 2 seconds
5. Score bonus: +15 points added to raw score

**Implementation — confetti particles:**
```
for (let i = 0; i < 30; i++) {
  const colors = [C.STAMP_GREEN, C.WAX_RED, C.LEATHER, C.INK_LIGHT]
  const c = this.add.rectangle(
    200 + Math.random() * 880,  // spread across grid width
    -10,
    4, 8,
    colors[Math.floor(Math.random() * 4)]
  ).setRotation(Math.random() * Math.PI)

  this.tweens.add({
    targets: c,
    y: 720 + 20,
    x: c.x + (Math.random() - 0.5) * 200,
    rotation: c.rotation + Math.random() * 4,
    alpha: 0,
    duration: 1500 + Math.random() * 500,
    ease: 'Quad.easeIn',
    onComplete: () => c.destroy(),
  })
}
```

---

## 4. Card Visuals

### Face-Down State (all cards identical — mystery)

Draw with Phaser graphics — no image assets needed.

```
drawCardFaceDown(scene, x, y, w, h):
  // Leather-colored card back
  g.fillStyle(C.LEATHER, 1)
  g.fillRoundedRect(x, y, w, h, 6)

  // Inner border (double-line effect)
  g.lineStyle(1, C.INK, 0.5)
  g.strokeRoundedRect(x + 4, y + 4, w - 8, h - 8, 4)

  // Wax seal pattern in center (simplified)
  g.fillStyle(C.WAX_RED, 0.8)
  g.fillCircle(x + w/2, y + h/2, 16)
  g.fillStyle(C.WAX_RED_LIGHT, 1)
  g.fillCircle(x + w/2, y + h/2, 11)

  // "?" letter on seal
  text("?", x + w/2, y + h/2, { fontSize: '14px', color: COLORS.PARCHMENT, fontStyle: 'bold' })
```

### Face-Up — Challenge Cards (left-brain: the problem)

```
drawChallengeCard(scene, x, y, w, h, text):
  // Parchment background with red-margin left stripe
  g.fillStyle(C.PARCHMENT, 1)
  g.fillRoundedRect(x, y, w, h, 6)

  // Red margin stripe (left 6px)
  g.fillStyle(C.RED_MARGIN, 0.6)
  g.fillRect(x, y, 6, h)

  // Outer border
  g.lineStyle(1, C.INK, 0.4)
  g.strokeRoundedRect(x, y, w, h, 6)

  // "CHALLENGE" label — tiny, top-left
  text("CHALLENGE", x + 14, y + 8, TEXT.label with fontSize '7px', color RED_MARGIN)

  // Challenge text — centered, ink color, body size
  text(challengeText, x + w/2, y + h/2 + 4, {
    ...TEXT.body,
    fontSize: '11px',
    align: 'center',
    wordWrap: { width: w - 24 },
  }).setOrigin(0.5)
```

### Face-Up — Skill Cards (right-brain: the growth)

```
drawSkillCard(scene, x, y, w, h, text):
  // Parchment background with green stamp stripe on RIGHT
  g.fillStyle(C.PARCHMENT, 1)
  g.fillRoundedRect(x, y, w, h, 6)

  // Green stripe (right 6px)
  g.fillStyle(C.STAMP_GREEN, 0.5)
  g.fillRect(x + w - 6, y, 6, h)

  // Outer border
  g.lineStyle(1, C.STAMP_GREEN, 0.4)
  g.strokeRoundedRect(x, y, w, h, 6)

  // "SKILL" label — tiny, top-right
  text("SKILL EARNED", x + w - 14, y + 8, TEXT.label with fontSize '7px', color STAMP_GREEN).setOrigin(1, 0)

  // Skill text — centered, stamp-green color
  text(skillText, x + w/2, y + h/2 + 4, {
    ...TEXT.body,
    fontSize: '11px',
    color: COLORS.STAMP_GREEN,
    fontStyle: 'bold',
    align: 'center',
    wordWrap: { width: w - 24 },
  }).setOrigin(0.5)
```

### Matched State

When a pair is successfully matched:
- Both cards stay face-up
- A green "MATCHED" stamp overlay rotates in (like `JournalUI.drawPassportStamp`)
- Cards reduce opacity to 0.65 (they're "done" — visual declutter)
- A thin green connection line draws between the two matched cards (200ms tween)

```
onMatch(cardA, cardB):
  // Stamp on each card
  JournalUI.drawPassportStamp(scene, cardA.x + 75, cardA.y + 45, '✓', 2019, -8 + Math.random() * 16)
  JournalUI.drawPassportStamp(scene, cardB.x + 75, cardB.y + 45, '✓', 2019, -8 + Math.random() * 16)

  // Fade matched cards slightly
  tweens: cardA.container.alpha -> 0.65, cardB.container.alpha -> 0.65, duration: 300

  // Connection line between cards
  line from (cardA.centerX, cardA.centerY) to (cardB.centerX, cardB.centerY)
  lineStyle: 1px, C.STAMP_GREEN, alpha 0.3
  tween line alpha from 0 to 0.3 over 200ms
```

### Mismatch State

When two flipped cards don't match:
- Both cards flash briefly with a red tint (fillStyle overlay at C.RED_MARGIN, alpha 0.15) for 200ms
- After 1200ms total display time, both flip back face-down
- Flip-back animation: scaleX 1 -> 0 (150ms) -> swap to face-down graphic -> scaleX 0 -> 1 (150ms)

---

## 5. Game Flow — Second by Second

### Scene Entry (0-3s)

```
0.0s  Camera fadeIn (500ms, from black)
0.0s  Parchment background draws (JournalUI.drawParchment full canvas)
0.0s  Faded LatAm map outline draws in background (very subtle, alpha 0.06)
0.2s  Header fades in: "Chapter 2 — Latin America" (TEXT.heading, bold)
0.4s  Subheader fades in: "CRACK THE MARKET" (TEXT.title, 28px)
0.6s  Intro narration fades in (TEXT.bodyItalic, centered above grid):
      "No Spanish. No network. No experience.
       Match each challenge to the skill it forged."
1.0s  Grid of 24 face-down cards fades in — cards appear in a staggered wave
      (left-to-right, top-to-bottom, 40ms delay per card)
2.0s  Right panel fades in with counters (Pairs: 0/12, Moves: 0, timer starts)
2.5s  All cards briefly flip face-up for 2.5 seconds (preview peek)
5.0s  All cards flip back face-down simultaneously (the game begins)
5.0s  A subtle prompt appears below the grid: "Click any card to begin"
```

### Gameplay Loop (5s-75s typical)

```
Player clicks a face-down card:
  -> Card flip animation (scaleX 1->0, swap graphic, 0->1) — 250ms total
  -> Card is now face-up, showing either CHALLENGE (red stripe) or SKILL (green stripe)
  -> This is the "first pick" — waiting for second pick
  -> Move counter does NOT increment yet

Player clicks a second face-down card:
  -> Card flip animation — 250ms
  -> Move counter increments by 1
  -> Input is LOCKED (no more clicks until resolution)

  IF MATCH:
    -> 200ms pause, then both cards pulse scale 1.0->1.08->1.0 (300ms)
    -> Stamp overlays appear on both cards
    -> Cards fade to 0.65 alpha
    -> Pairs counter increments
    -> Connection line draws between cards
    -> Insight text appears in the right panel (fade in 400ms) — stays for 4 seconds
    -> If wild card pair: celebration sequence plays (see section 3)
    -> Input unlocks after 500ms

  IF MISMATCH:
    -> 1200ms pause (player reads both cards)
    -> Red flash overlay on both cards (200ms)
    -> Both cards flip back face-down (300ms animation)
    -> Input unlocks after flip-back completes
```

### Completion (when 12/12 pairs matched)

```
0.0s  Final insight displays
1.5s  All matched cards flash simultaneously (alpha pulse 0.65->1.0->0.65)
2.0s  Grid fades out (800ms)
2.5s  Completion overlay fades in (parchment rectangle, 0.92 alpha, full canvas)
3.0s  Score and stats appear (see section 10 — Closing)
```

---

## 6. Controls

**Input:** Mouse/touch only. Click/tap to flip a card.

**Click behavior:**
- Clicking a face-down card: flips it face-up
- Clicking a face-up card (already flipped as first pick): ignored
- Clicking a matched card: ignored
- Clicking during flip animation or mismatch delay: ignored (input locked)
- Clicking a face-down card while another is face-up: this is the second pick — triggers match check

**Card hover state:**
- Face-down cards: on pointerover, the card's border brightens (lineStyle width 1 -> 2, alpha 0.5 -> 0.8) and cursor changes to pointer
- Face-up and matched cards: no hover effect, no pointer cursor

**Flip animation — implemented as scaleX tween:**
```javascript
flipCard(card, toFaceUp) {
  // Phase 1: shrink to invisible
  this.tweens.add({
    targets: card.container,
    scaleX: 0,
    duration: 125,
    ease: 'Quad.easeIn',
    onComplete: () => {
      // Swap visuals
      card.faceDown.setVisible(!toFaceUp)
      card.faceUp.setVisible(toFaceUp)
      // Phase 2: expand back
      this.tweens.add({
        targets: card.container,
        scaleX: 1,
        duration: 125,
        ease: 'Quad.easeOut',
      })
    },
  })
}
```

**Mismatch flip-back delay:** 1200ms from the moment the second card is fully revealed. This gives the player enough time to read and memorize both cards.

**Match hold time:** 500ms before input unlocks (lets the stamp animation play).

---

## 7. Scoring (0-100)

### Raw Score Calculation

```
BASE_SCORE = 100
PENALTY_PER_EXTRA_MOVE = 3
PERFECT_MOVES = 12  // theoretical minimum (12 pairs, 12 moves if perfect memory)
WILD_CARD_BONUS = 15
TIME_BONUS_THRESHOLD = 60  // seconds

extraMoves = totalMoves - PERFECT_MOVES
movePenalty = extraMoves * PENALTY_PER_EXTRA_MOVE

timeBonus = 0
if (elapsedSeconds < TIME_BONUS_THRESHOLD) {
  timeBonus = 10  // finishing under 60s adds 10 points
}

wildCardBonus = foundWildCard ? WILD_CARD_BONUS : 0
// Wild card bonus applies automatically since it's always in the grid

rawScore = BASE_SCORE - movePenalty + timeBonus
finalScore = Math.max(10, Math.min(100, rawScore))
```

**Score interpretation:**
- 100: Perfect game (12 moves, under 60s) — virtually impossible on first play
- 85-99: Excellent memory (14-16 moves)
- 70-84: Good (17-22 moves)
- 50-69: Average (23-29 moves)
- 30-49: Took a while (30+ moves)
- 10-29: Floor — everyone gets at least 10 for completing

### Stat Awards

Stats are derived from the final score (0-100):

```
salesGain = Math.round(finalScore / 5)         // 0-20 points
eqGain = Math.round(finalScore / 8)             // 0-12 points
gritGain = Math.round(finalScore / 10)           // 0-10 points
```

These are additive to existing stat values (capped at 100 per stat), matching the current `LatinAmericaScene._finish()` pattern.

Registry keys used:
- `KEYS.SCORE_L2` — final score
- `KEYS.COMPLETED_L2` — true on completion
- `KEYS.STAT_SALES` — sales stat
- `KEYS.STAT_EQ` — EQ stat
- `KEYS.STAT_GRIT` — grit stat

---

## 8. Difficulty

**Grid shuffle:** Yes, fully randomized on each play. The 24 cards are placed in random positions using a Fisher-Yates shuffle.

```javascript
shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
```

**Preview peek:** All cards flip face-up for 2.5 seconds at the start before flipping back. This gives the player a snapshot to memorize, reduces frustration, and teaches the challenge/skill visual distinction immediately.

**Timer:** Displayed but NOT a hard fail condition. Time is only used for the +10 bonus if under 60 seconds. The level always completes when all 12 pairs are found — no time-out game over.

**Hints:** None. The preview peek is the only assist. The game should be completable by any player regardless of memory ability — it just takes more moves.

**Difficulty tuning:** 24 cards (12 pairs) is the sweet spot:
- 16 cards (8 pairs) is too easy — finishes in 30 seconds, not enough story
- 32 cards (16 pairs) is too hard for a recruiter with limited patience
- 24 cards gives ~60-90 seconds of gameplay with 8-15 extra moves typical

---

## 9. UI Elements

### Header Area (y: 20-120)

- **Chapter label** (x: 30, y: 30): "Chapter 2" in TEXT.label
- **Title** (x: 30, y: 50): "CRACK THE MARKET" in TEXT.title, 24px
- **Subtitle** (x: 30, y: 85): "Latin America, 2017-2020" in TEXT.bodyItalic
- **Intro line** (x: 30, y: 108): "Match each challenge to the skill it forged." in TEXT.small

### Right Panel (x: 1010-1260, y: 20-700)

Background: parchment-dark inset rectangle with ink border (same pattern as current `_drawInfoPanel`)

**Counters (top of panel):**
```
y: 60   "PAIRS FOUND"        (TEXT.label, centered)
y: 85   "0 / 12"             (TEXT.stat, 20px, centered) — updates on each match
y: 130  "MOVES"              (TEXT.label, centered)
y: 155  "0"                  (TEXT.stat, 20px, centered) — updates on each second-card flip
y: 200  "TIME"               (TEXT.label, centered)
y: 225  "0:00"               (TEXT.stat, 18px, centered) — updates every second, format M:SS
```

**Insight Display Area (middle of panel, y: 280-550):**
```
// Bordered box for insight text
g.lineStyle(0.5, C.INK, 0.2)
g.strokeRect(1020, 280, 230, 220)

// "FIELD NOTES" label above the box
text("FIELD NOTES", 1135, 270, TEXT.label)

// Insight text renders here when a pair is matched
// Uses TEXT.bodyItalic, fontSize 10px, wordWrap width 210
// Fades in over 400ms, stays for 4 seconds, then fades to alpha 0.3
// Each new match replaces the previous insight
```

**Last matched pair label (y: 510-540):**
```
// Shows the challenge and skill names of the last match
// "No Spanish → Adaptability"
// TEXT.small, color: STAMP_GREEN
```

**Visual legend (bottom of panel, y: 580-680):**
```
// Small red-stripe rectangle + "= Challenge"
// Small green-stripe rectangle + "= Skill earned"
// TEXT.label, fontSize 8px
```

### Below Grid (y: 560-580)

- **Prompt text**: "Click any card to begin" — appears after preview peek, disappears after first click. TEXT.small, alpha 0.6

### Page Number

- `JournalUI.drawPageNumber(this, 4)` — bottom right, "p. 4"

---

## 10. Opening and Closing

### Opening Sequence

The scene starts with a camera fadeIn and the intro described in section 5. No separate "opening cinematic" — the preview peek IS the hook. The recruiter sees all the cards briefly, reads a few (challenge cards with red stripes, skill cards with green stripes), and immediately understands the mechanic.

**Intro text** (above grid, fades in at 0.6s):
> "No Spanish. No network. No experience.
> Match each challenge to the skill it forged."

This disappears (fade to alpha 0.15) when the preview peek ends and gameplay begins.

### Completion Screen

After all 12 pairs matched, the grid fades out and a full-canvas parchment overlay appears:

```
y: 140  "MARKET CRACKED"
        TEXT.title, 32px, bold, centered

y: 210  "From zero to $1M ARR across 11 countries."
        TEXT.chapter, 18px, italic, centered

y: 260  "Every challenge became a skill.
         Every setback became a story."
        TEXT.body, 14px, INK_LIGHT, centered, lineSpacing 8

y: 340  Score display:
        "Score: {finalScore}%"
        TEXT.body, 18px, INK_FADED, centered

y: 380  Stat gains:
        "+{salesGain} Sales   +{eqGain} EQ   +{gritGain} Grit"
        TEXT.stamp, 16px, STAMP_GREEN, centered

y: 420  Performance line (dynamic based on moves):
        If moves <= 15: "Near-perfect recall. You'd make a great sales closer."
        If moves <= 22: "Solid memory. You connected the dots efficiently."
        If moves <= 30: "Persistent. You found every match — just like Augustin."
        If moves > 30:  "The long road. But you got there. That's the whole point."
        TEXT.bodyItalic, 12px, INK_FADED, centered

y: 500  Vignette teaser (for next level — Greenland):
        "Success in Latin America felt hollow.
         Something was missing. Something harder.
         You book a flight to the edge of the world..."
        TEXT.prompt, 14px, italic, centered, lineSpacing 6

y: 650  "PRESS SPACE to return to the hub"
        TEXT.small, INK_FADED, centered
```

**Return to hub:** SPACE key or auto-advance after 8 seconds (matching ShanghaiScene pattern).

```javascript
const returnToHub = () => {
  this.cameras.main.fadeOut(400, 0, 0, 0)
  this.time.delayedCall(420, () => this.scene.start('LevelSelectHub'))
}
this.input.keyboard.once('keydown-SPACE', returnToHub)
this.time.delayedCall(8000, returnToHub)
```

---

## 11. Visual Details — Phaser Primitives and Animations

### Background Layer

1. `JournalUI.drawParchment(this, 0, 0, 1280, 720)` — full-canvas parchment with ruled lines and coffee stains
2. Faded LatAm map outlines — drawn with graphics paths at alpha 0.04-0.06, ink color. Simplified country silhouettes using moveTo/lineTo for Colombia, Brazil, Argentina, Mexico, Chile shapes. These are decorative only — not interactive.

```javascript
_drawLatAmOutlines() {
  const g = this.add.graphics()
  g.lineStyle(1, C.INK, 0.05)

  // Simplified South America continental outline
  // (a rough polygon — not geographically accurate, just evocative)
  g.beginPath()
  g.moveTo(350, 120)   // Mexico top
  g.lineTo(280, 200)
  g.lineTo(250, 320)   // Central America
  g.lineTo(300, 380)   // Colombia
  g.lineTo(200, 500)   // Peru coast
  g.lineTo(250, 600)   // Chile
  g.lineTo(350, 650)   // Argentina tip
  g.lineTo(500, 600)   // Argentina east
  g.lineTo(650, 450)   // Brazil bulge
  g.lineTo(550, 300)   // Venezuela
  g.lineTo(400, 200)   // Caribbean coast
  g.closePath()
  g.strokePath()

  // Fill with very subtle parchment-dark
  g.fillStyle(C.PARCHMENT_DARK, 0.08)
  g.fillPath()
}
```

3. 2-3 passport stamps scattered in non-grid areas using `JournalUI.drawPassportStamp`:
   - `drawPassportStamp(this, 40, 650, 'COLOMBIA', 2019, -12)`
   - `drawPassportStamp(this, 980, 110, 'BRASIL', 2020, 8)`

### Card Container Structure

Each card is a Phaser Container holding:
```
card = {
  container: Phaser.Container(x, y),   // positioned at grid cell center
  faceDownGroup: Container,             // leather back + seal + "?"
  faceUpGroup: Container,              // challenge or skill content
  matchStamp: null,                     // added on match
  type: 'challenge' | 'skill' | 'wild',
  pairId: 0-11,                        // which pair this belongs to
  text: 'No Spanish',                  // display text
  isFlipped: false,
  isMatched: false,
  hitArea: Rectangle,                  // invisible interactive rect
}
```

### Card Flip Animation (detailed)

```javascript
flipToFaceUp(card) {
  if (card.isFlipped || card.isMatched) return

  card.isFlipped = true
  this._inputLocked = (this._firstPick !== null)  // lock if this is second pick

  this.tweens.add({
    targets: card.container,
    scaleX: 0,
    duration: 125,
    ease: 'Quad.easeIn',
    onComplete: () => {
      card.faceDownGroup.setVisible(false)
      card.faceUpGroup.setVisible(true)
      this.tweens.add({
        targets: card.container,
        scaleX: 1,
        duration: 125,
        ease: 'Quad.easeOut',
        onComplete: () => {
          if (this._firstPick === null) {
            this._firstPick = card
          } else {
            this._checkMatch(this._firstPick, card)
          }
        },
      })
    },
  })
}
```

### Insight Text Animation

```javascript
showInsight(text) {
  // Clear previous insight
  if (this._insightText) {
    this.tweens.killTweensOf(this._insightText)
    this._insightText.destroy()
  }

  this._insightText = this.add.text(1135, 400, text, {
    ...TEXT.bodyItalic,
    fontSize: '10px',
    color: COLORS.INK_LIGHT,
    align: 'center',
    wordWrap: { width: 210 },
    lineSpacing: 4,
  }).setOrigin(0.5).setAlpha(0)

  this.tweens.add({
    targets: this._insightText,
    alpha: 1,
    duration: 400,
    hold: 3600,  // stay visible 3.6s after fade-in
    onComplete: () => {
      // Fade to dim (not invisible — it's a journal entry, it stays)
      this.tweens.add({
        targets: this._insightText,
        alpha: 0.3,
        duration: 500,
      })
    },
  })
}
```

### Match Stamp Animation

```javascript
showMatchStamp(card) {
  const stamp = JournalUI.drawPassportStamp(
    this,
    card.container.x + 75,
    card.container.y + 45,
    '✓ MATCHED',
    2019,
    -10 + Math.random() * 20
  )
  stamp.setAlpha(0).setScale(1.5)

  this.tweens.add({
    targets: stamp,
    alpha: 0.7,
    scale: 1,
    duration: 300,
    ease: 'Back.easeOut',
  })
}
```

### Preview Peek Animation

```javascript
_startPreviewPeek() {
  // Flip all cards face-up in a wave
  this._cards.forEach((card, i) => {
    this.time.delayedCall(i * 40, () => {
      card.faceDownGroup.setVisible(false)
      card.faceUpGroup.setVisible(true)
      card.container.setScale(1)
    })
  })

  // After 2.5s, flip all back
  this.time.delayedCall(2500, () => {
    this._cards.forEach((card, i) => {
      this.time.delayedCall(i * 20, () => {
        card.faceDownGroup.setVisible(true)
        card.faceUpGroup.setVisible(false)
      })
    })

    // Enable input after all cards are hidden
    this.time.delayedCall(this._cards.length * 20 + 100, () => {
      this._gameActive = true
      this._timerStarted = true
    })
  })
}
```

### Timer Update

```javascript
update(time, delta) {
  if (!this._timerStarted || this._ended) return

  const elapsed = Math.floor((time - this._gameStartTime) / 1000)
  const min = Math.floor(elapsed / 60)
  const sec = elapsed % 60
  this._timerText.setText(`${min}:${sec.toString().padStart(2, '0')}`)
}
```

---

## 12. Complete Insight Lines

These are the exact strings displayed in the "FIELD NOTES" panel when each pair is matched. Written as journal entries — personal, specific, no corporate polish.

**Pair 1 — No Spanish / Adaptability:**
> "No hablaba espanol. So I learned to sell with diagrams on napkins, body language, and sheer persistence. The language came later. The deals came first."

**Pair 2 — Zero network in LatAm / Cold outreach mastery:**
> "I had nobody's number. So I cold-emailed every KOL I could find, showed up at conferences uninvited, and turned strangers into partners."

**Pair 3 — Cultural differences across 11 countries / Cross-cultural EQ:**
> "What closes in Colombia offends in Chile. I learned to read the room before I opened my mouth — and to never assume two Latin countries work the same way."

**Pair 4 — Training doctors remotely / Consultative selling:**
> "You can't hard-sell a surgeon. I learned to teach first, prove value second, and let the product speak through results."

**Pair 5 — 11 countries, 11 regulations / Navigating complexity:**
> "Every country had its own medical device rules, tax codes, and approval timelines. I built a spreadsheet that became my bible."

**Pair 6 — Solo in Medellin, no backup / Independence & grit:**
> "No team. No office. Just a laptop in a coworking space and a list of 200 doctors. Some weeks the only voice I heard was my own pitch."

**Pair 7 — Convincing skeptical KOLs / Stakeholder management:**
> "Senior surgeons don't take meetings with 25-year-olds. I earned the first meeting through a published case study. I earned the second by remembering their daughter's name."

**Pair 8 — No marketing budget / Scrappy GTM:**
> "Zero ad spend. I built the pipeline with WhatsApp groups, conference hallway ambushes, and a demo that fit in my backpack."

**Pair 9 — Product-market fit in a new continent / Market research:**
> "The product worked in Europe. Latin America wanted something different. I spent 3 months just listening before I pitched a single feature change."

**Pair 10 — Hiring across borders / Remote leadership:**
> "My first hire was in Bogota. My second in Mexico City. I managed a team across 4 time zones before I had a single direct report in the same room."

**Pair 11 — WILD CARD: $0 to $1M ARR / 11 Countries Conquered:**
> "From a one-way ticket to Medellin to a million in recurring revenue across an entire continent. Not bad for someone who couldn't order coffee in Spanish."

**Pair 12 — Building trust across borders / Relationship building:**
> "Business in Latin America runs on relationships, not contracts. I learned that a 2-hour lunch matters more than a 20-page proposal."

---

## Implementation Data Structure

```javascript
const PAIRS = [
  {
    id: 0,
    challenge: 'No Spanish',
    skill: 'Adaptability',
    insight: `No hablaba espanol. So I learned to sell with diagrams on napkins, body language, and sheer persistence. The language came later. The deals came first.`,
    wild: false,
  },
  {
    id: 1,
    challenge: 'Zero network in LatAm',
    skill: 'Cold outreach mastery',
    insight: `I had nobody's number. So I cold-emailed every KOL I could find, showed up at conferences uninvited, and turned strangers into partners.`,
    wild: false,
  },
  {
    id: 2,
    challenge: 'Cultural differences\nacross 11 countries',
    skill: 'Cross-cultural EQ',
    insight: `What closes in Colombia offends in Chile. I learned to read the room before I opened my mouth — and to never assume two Latin countries work the same way.`,
    wild: false,
  },
  {
    id: 3,
    challenge: 'Training doctors\nremotely',
    skill: 'Consultative selling',
    insight: `You can't hard-sell a surgeon. I learned to teach first, prove value second, and let the product speak through results.`,
    wild: false,
  },
  {
    id: 4,
    challenge: '11 countries,\n11 regulations',
    skill: 'Navigating complexity',
    insight: `Every country had its own medical device rules, tax codes, and approval timelines. I built a spreadsheet that became my bible.`,
    wild: false,
  },
  {
    id: 5,
    challenge: 'Solo in Medellin,\nno backup',
    skill: 'Independence & grit',
    insight: `No team. No office. Just a laptop in a coworking space and a list of 200 doctors. Some weeks the only voice I heard was my own pitch.`,
    wild: false,
  },
  {
    id: 6,
    challenge: 'Convincing\nskeptical KOLs',
    skill: 'Stakeholder\nmanagement',
    insight: `Senior surgeons don't take meetings with 25-year-olds. I earned the first meeting through a published case study. I earned the second by remembering their daughter's name.`,
    wild: false,
  },
  {
    id: 7,
    challenge: 'No marketing budget',
    skill: 'Scrappy GTM',
    insight: `Zero ad spend. I built the pipeline with WhatsApp groups, conference hallway ambushes, and a demo that fit in my backpack.`,
    wild: false,
  },
  {
    id: 8,
    challenge: 'Product-market fit\nin a new continent',
    skill: 'Market research',
    insight: `The product worked in Europe. Latin America wanted something different. I spent 3 months just listening before I pitched a single feature change.`,
    wild: false,
  },
  {
    id: 9,
    challenge: 'Hiring across borders',
    skill: 'Remote leadership',
    insight: `My first hire was in Bogota. My second in Mexico City. I managed a team across 4 time zones before I had a single direct report in the same room.`,
    wild: false,
  },
  {
    id: 10,
    challenge: '$0 → $1M ARR',
    skill: '11 Countries\nConquered',
    insight: `From a one-way ticket to Medellin to a million in recurring revenue across an entire continent. Not bad for someone who couldn't order coffee in Spanish.`,
    wild: true,
  },
  {
    id: 11,
    challenge: 'Building trust\nacross borders',
    skill: 'Relationship building',
    insight: `Business in Latin America runs on relationships, not contracts. I learned that a 2-hour lunch matters more than a 20-page proposal.`,
    wild: false,
  },
]
```

**Card array construction:**
```javascript
_buildCards() {
  const cardData = []

  PAIRS.forEach(pair => {
    cardData.push({
      pairId: pair.id,
      type: 'challenge',
      text: pair.challenge,
      wild: pair.wild,
    })
    cardData.push({
      pairId: pair.id,
      type: 'skill',
      text: pair.skill,
      wild: pair.wild,
    })
  })

  // Shuffle
  for (let i = cardData.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cardData[i], cardData[j]] = [cardData[j], cardData[i]]
  }

  return cardData
}
```

**Match check logic:**
```javascript
_checkMatch(cardA, cardB) {
  this._moves++
  this._movesText.setText(String(this._moves))

  if (cardA.pairId === cardB.pairId) {
    // MATCH
    cardA.isMatched = true
    cardB.isMatched = true
    this._pairsFound++
    this._pairsText.setText(`${this._pairsFound} / 12`)

    const pair = PAIRS.find(p => p.id === cardA.pairId)

    this.time.delayedCall(200, () => {
      this._showMatchEffect(cardA, cardB)
      this._showInsight(pair.insight)
      this._showMatchLabel(pair)

      if (pair.wild) {
        this._playCelebration()
      }

      this.time.delayedCall(500, () => {
        this._firstPick = null
        this._inputLocked = false

        if (this._pairsFound >= 12) {
          this.time.delayedCall(1500, () => this._finish())
        }
      })
    })
  } else {
    // MISMATCH
    this.time.delayedCall(1200, () => {
      this._flipToFaceDown(cardA)
      this._flipToFaceDown(cardB)

      this.time.delayedCall(300, () => {
        this._firstPick = null
        this._inputLocked = false
      })
    })
  }
}
```

---

## Scene Lifecycle Summary

```
create()
  ├── drawParchment background
  ├── drawLatAmOutlines (decorative)
  ├── draw header text
  ├── draw right panel (counters, insight area, legend)
  ├── build card data (24 cards from 12 pairs, shuffled)
  ├── create card containers at grid positions (all face-down)
  ├── scatter 2-3 passport stamps in margins
  ├── draw page number
  ├── start preview peek (2.5s all face-up, then flip back)
  └── enable input after peek

update(time, delta)
  └── update timer display if game is active

_onCardClick(card)
  ├── if input locked, card matched, or card already flipped → return
  ├── flip card face-up
  ├── if no first pick → set as first pick
  └── if first pick exists → checkMatch(firstPick, card)

_checkMatch(a, b)
  ├── increment moves
  ├── if pairId matches → match sequence
  └── if pairId differs → mismatch sequence

_finish()
  ├── calculate score
  ├── award stats (Sales, EQ, Grit)
  ├── completeLevel()
  ├── draw completion overlay
  └── wait for SPACE or 8s auto-advance → LevelSelectHub
```

---

## Estimated Line Count

Following the project convention of ~300-400 lines per scene file, this design targets approximately 380 lines:
- Constants/data: ~60 lines (PAIRS array)
- create + UI setup: ~80 lines
- Card creation + grid layout: ~60 lines
- Flip/match/mismatch logic: ~80 lines
- Visual effects (celebration, stamps, insights): ~50 lines
- Finish screen: ~50 lines
