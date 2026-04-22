# Level 4 -- Agency Factory: TOWER DEFENSE

## Complete Game Design Document

**Scene file:** `src/scenes/AgencyFactoryScene.js` (replaces current pipeline-builder implementation)
**Target duration:** 90-120 seconds of active gameplay, ~10s intro/outro
**Canvas:** 1280x720
**Registry keys:** `KEYS.SCORE_L4`, `KEYS.COMPLETED_L4`, `KEYS.STAT_TECH`

---

## 1. Map / Path Layout

The path is drawn as a hand-sketched trail on the parchment, like a route drawn on a journal map page. It winds from left to right with two switchbacks, creating a serpentine shape that gives towers maximum coverage.

### Path Waypoints (enemy walk path)

Enemies follow these waypoints in order, using linear interpolation between each point:

```javascript
const PATH_POINTS = [
  { x: -40,  y: 200 },   // spawn off-screen left
  { x: 200,  y: 200 },   // enter screen
  { x: 500,  y: 200 },   // straight right
  { x: 700,  y: 200 },   // approach first turn
  { x: 780,  y: 260 },   // curve down
  { x: 780,  y: 360 },   // straight down
  { x: 700,  y: 440 },   // curve left (switchback)
  { x: 500,  y: 440 },   // straight left
  { x: 300,  y: 440 },   // continue left
  { x: 220,  y: 380 },   // curve up
  { x: 220,  y: 320 },   // straight up short
  { x: 280,  y: 280 },   // curve right
  { x: 500,  y: 560 },   // diagonal down-right (long stretch)
  { x: 700,  y: 560 },   // straight right
  { x: 900,  y: 560 },   // continue right
  { x: 1000, y: 500 },   // curve up
  { x: 1050, y: 400 },   // straight up
  { x: 1100, y: 340 },   // approach exit
  { x: 1320, y: 340 },   // exit off-screen right
]
```

**Path total length:** approximately 2800px of walking distance.

### Path Visual

```javascript
_drawPath() {
  const g = this.add.graphics()

  // Main path: thick ink line, hand-drawn style (slightly wobbly)
  g.lineStyle(24, C.PARCHMENT_DARK, 0.5)
  g.beginPath()
  g.moveTo(PATH_POINTS[0].x, PATH_POINTS[0].y)
  PATH_POINTS.forEach((pt, i) => {
    if (i === 0) return
    // Add slight wobble for hand-drawn feel
    const wx = pt.x + (Math.sin(i * 1.7) * 2)
    const wy = pt.y + (Math.cos(i * 2.3) * 2)
    g.lineTo(wx, wy)
  })
  g.strokePath()

  // Path outline: thin ink border on each side
  g.lineStyle(1, C.INK, 0.25)
  // (simplified -- trace same path offset by +/-12px perpendicular)

  // Dashed center line (like a trail on a map)
  g.lineStyle(0.5, C.INK_FADED, 0.2)
  // Draw dashed segments along the path center
}
```

### Tower Placement Spots (14 total)

Small circles on the parchment where towers can be placed. Positioned adjacent to the path for maximum strategic coverage.

```javascript
const TOWER_SPOTS = [
  // Near path entrance -- Tier 1 area
  { id: 0,  x: 340,  y: 140 },
  { id: 1,  x: 340,  y: 260 },
  { id: 2,  x: 600,  y: 140 },
  { id: 3,  x: 600,  y: 260 },

  // Mid-path -- switchback area
  { id: 4,  x: 460,  y: 370 },
  { id: 5,  x: 680,  y: 370 },
  { id: 6,  x: 160,  y: 440 },
  { id: 7,  x: 420,  y: 500 },

  // Late path -- lower stretch
  { id: 8,  x: 600,  y: 500 },
  { id: 9,  x: 600,  y: 630 },
  { id: 10, x: 800,  y: 500 },
  { id: 11, x: 800,  y: 630 },

  // Exit approach -- premium spots
  { id: 12, x: 950,  y: 440 },
  { id: 13, x: 1050, y: 480 },
]
```

**Spot visual (empty):**
```javascript
_drawTowerSpot(x, y) {
  const g = this.add.graphics()
  // Dotted circle
  g.lineStyle(1, C.INK_FADED, 0.3)
  for (let a = 0; a < Math.PI * 2; a += 0.4) {
    g.beginPath()
    g.arc(x, y, 18, a, a + 0.2)
    g.strokePath()
  }
  // Small "+" in center
  g.lineStyle(0.5, C.INK_FADED, 0.25)
  g.beginPath()
  g.moveTo(x - 5, y); g.lineTo(x + 5, y)
  g.moveTo(x, y - 5); g.lineTo(x, y + 5)
  g.strokePath()
  return g
}
```

---

## 2. Complete Tower List

### Tier 1 -- Basic (available from start)

| Property | Google Sheets | Mailchimp | LinkedIn | HubSpot |
|----------|--------------|-----------|----------|---------|
| **Damage** | 8 | 10 | 14 | 6 (per tick) |
| **Fire rate** | 1 shot / 1.6s | 1 shot / 1.2s | 1 shot / 1.4s | 1 tick / 2.0s |
| **Range** | 100px | 110px | 120px | 90px |
| **Cost** | 15 ink | 20 ink | 25 ink | 30 ink |
| **Special** | None (reliable basic) | Targets nearest | Targets strongest in range | Area damage: hits all enemies in range for 6 each |
| **Unlock** | Start | Start | Start | Start |

**Tier 1 Visuals:**

```javascript
// Google Sheets -- green grid icon
_drawGoogleSheets(g, x, y) {
  // Small grid (3x3)
  g.lineStyle(1.5, 0x2a6040, 0.8)  // green
  for (let i = 0; i < 4; i++) {
    g.beginPath()
    g.moveTo(x - 10 + i * 7, y - 10)
    g.lineTo(x - 10 + i * 7, y + 10)
    g.strokePath()
    g.beginPath()
    g.moveTo(x - 10, y - 10 + i * 7)
    g.lineTo(x + 10, y - 10 + i * 7)
    g.strokePath()
  }
  // Label below
  return 'Sheets'
}

// Mailchimp -- envelope icon
_drawMailchimp(g, x, y) {
  g.lineStyle(1.5, C.INK, 0.7)
  g.strokeRect(x - 10, y - 7, 20, 14)
  // Flap
  g.beginPath()
  g.moveTo(x - 10, y - 7)
  g.lineTo(x, y + 2)
  g.lineTo(x + 10, y - 7)
  g.strokePath()
  return 'Mailchimp'
}

// LinkedIn -- "in" text in rounded rect
_drawLinkedIn(g, x, y) {
  g.lineStyle(1.5, 0x1a4a8a, 0.8)  // blue
  g.strokeRoundedRect(x - 11, y - 11, 22, 22, 4)
  // "in" text drawn as part of tower label
  return 'LinkedIn'
}

// HubSpot -- gear/cog icon (simplified)
_drawHubSpot(g, x, y) {
  g.lineStyle(1.5, C.RED_MARGIN, 0.7)
  g.strokeCircle(x, y, 8)
  // 6 small rectangles around circle (gear teeth)
  for (let a = 0; a < 6; a++) {
    const angle = (a / 6) * Math.PI * 2
    const tx = x + Math.cos(angle) * 11
    const ty = y + Math.sin(angle) * 11
    g.fillStyle(C.RED_MARGIN, 0.6)
    g.fillRect(tx - 2, ty - 2, 4, 4)
  }
  return 'HubSpot'
}
```

### Tier 2 -- Intermediate (unlocked at 15 kills)

| Property | Apollo | Instantly | Lemlist | Sales Navigator |
|----------|--------|-----------|---------|-----------------|
| **Damage** | 16 | 22 | 12 | 18 |
| **Fire rate** | 1 shot / 0.8s | 1 shot / 0.6s | 1 shot / 1.0s | 1 shot / 1.2s |
| **Range** | 120px | 100px | 110px | 160px |
| **Cost** | 50 ink | 65 ink | 55 ink | 60 ink |
| **Special** | Reveals enemy HP bars in range | Fires 3-round burst (3 shots at 0.15s intervals, then 1.2s cooldown) | Splash damage: 12 to target + 6 to all enemies within 40px of target | Marks target: marked enemies take 25% more damage from all towers for 3s |
| **Unlock** | 15 kills | 15 kills | 15 kills | 15 kills |

**Tier 2 Visuals:**

```javascript
// Apollo -- rocket icon (small)
_drawApollo(g, x, y) {
  g.lineStyle(1.5, C.INK, 0.8)
  // Small upward rocket
  g.beginPath()
  g.moveTo(x, y - 12)       // nose
  g.lineTo(x + 5, y - 4)
  g.lineTo(x + 5, y + 6)
  g.lineTo(x - 5, y + 6)
  g.lineTo(x - 5, y - 4)
  g.closePath()
  g.strokePath()
  // Flame
  g.lineStyle(1, C.RED_MARGIN, 0.6)
  g.fillStyle(C.RED_MARGIN, 0.3)
  g.fillTriangle(x - 3, y + 6, x + 3, y + 6, x, y + 12)
  return 'Apollo'
}

// Instantly -- lightning bolt
_drawInstantly(g, x, y) {
  g.lineStyle(2, C.WAX_RED, 0.8)
  g.beginPath()
  g.moveTo(x + 3, y - 12)
  g.lineTo(x - 4, y)
  g.lineTo(x + 2, y)
  g.lineTo(x - 3, y + 12)
  g.strokePath()
  return 'Instantly'
}

// Lemlist -- pen/quill icon
_drawLemlist(g, x, y) {
  g.lineStyle(1.5, C.STAMP_GREEN, 0.8)
  // Diagonal pen shape
  g.beginPath()
  g.moveTo(x - 8, y + 8)
  g.lineTo(x + 6, y - 6)
  g.lineTo(x + 8, y - 8)
  g.lineTo(x + 10, y - 6)
  g.lineTo(x - 4, y + 8)
  g.closePath()
  g.strokePath()
  return 'Lemlist'
}

// Sales Navigator -- compass/crosshair
_drawSalesNav(g, x, y) {
  g.lineStyle(1.5, 0x1a4a8a, 0.7)
  g.strokeCircle(x, y, 10)
  g.strokeCircle(x, y, 4)
  g.beginPath()
  g.moveTo(x, y - 14); g.lineTo(x, y - 6)
  g.moveTo(x, y + 6);  g.lineTo(x, y + 14)
  g.moveTo(x - 14, y); g.lineTo(x - 6, y)
  g.moveTo(x + 6, y);  g.lineTo(x + 14, y)
  g.strokePath()
  return 'Sales Nav'
}
```

### Tier 3 -- Advanced (unlocked at 40 kills)

| Property | Clay | n8n | Claude Code | Zapier |
|----------|------|-----|-------------|--------|
| **Damage** | 45 | 20 | 55 | 0 (support) |
| **Fire rate** | 1 shot / 2.5s | 1 shot / 1.8s | 1 shot / 2.0s | N/A (aura) |
| **Range** | 130px | 140px | 150px | 100px (aura) |
| **Cost** | 100 ink | 90 ink | 120 ink | 80 ink |
| **Special** | Enrichment: each hit on the same target does +10% cumulative damage (stacking debuff) | Chain lightning: hit jumps to up to 3 nearby enemies within 60px, each jump does 60% of previous damage | Adaptive AI: damage increases by 5% for each different enemy type killed. Also prioritizes the strongest enemy in range. | Integration Hub: all towers within aura range fire 30% faster and gain +10% range. Zapier itself deals no damage. |
| **Unlock** | 40 kills | 40 kills | 40 kills | 40 kills |

**Tier 3 Visuals:**

```javascript
// Clay -- hexagonal crystal/gem shape
_drawClay(g, x, y) {
  g.lineStyle(2, C.INK, 0.9)
  // Hexagon
  g.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 6
    const px = x + Math.cos(angle) * 12
    const py = y + Math.sin(angle) * 12
    if (i === 0) g.moveTo(px, py)
    else g.lineTo(px, py)
  }
  g.closePath()
  g.strokePath()
  // Inner lines (facets)
  g.lineStyle(0.5, C.INK, 0.4)
  g.beginPath()
  g.moveTo(x, y - 12); g.lineTo(x, y + 12)
  g.moveTo(x - 10, y - 6); g.lineTo(x + 10, y + 6)
  g.strokePath()
  return 'Clay'
}

// n8n -- interconnected nodes (3 small circles with lines)
_drawN8n(g, x, y) {
  g.lineStyle(1, C.INK, 0.5)
  // Lines connecting 3 nodes
  g.beginPath()
  g.moveTo(x - 8, y - 8); g.lineTo(x + 8, y)
  g.moveTo(x + 8, y); g.lineTo(x - 8, y + 8)
  g.strokePath()
  // 3 filled circles (nodes)
  g.fillStyle(C.INK, 0.8)
  g.fillCircle(x - 8, y - 8, 4)
  g.fillCircle(x + 8, y, 4)
  g.fillCircle(x - 8, y + 8, 4)
  // Orange accent
  g.fillStyle(C.RED_MARGIN, 0.6)
  g.fillCircle(x + 8, y, 2.5)
  return 'n8n'
}

// Claude Code -- terminal/bracket icon with sparkle
_drawClaudeCode(g, x, y) {
  g.lineStyle(2, C.INK, 0.9)
  // Terminal brackets: >_
  g.beginPath()
  g.moveTo(x - 10, y - 8)
  g.lineTo(x - 2, y)
  g.lineTo(x - 10, y + 8)
  g.strokePath()
  // Underscore cursor
  g.beginPath()
  g.moveTo(x + 2, y + 8)
  g.lineTo(x + 10, y + 8)
  g.strokePath()
  // Sparkle dot (AI indicator)
  g.fillStyle(C.WAX_RED, 0.8)
  g.fillCircle(x + 8, y - 6, 2.5)
  return 'Claude'
}

// Zapier -- two interlocking rings (like a chain link)
_drawZapier(g, x, y) {
  g.lineStyle(1.5, C.RED_MARGIN, 0.7)
  g.strokeCircle(x - 5, y, 8)
  g.strokeCircle(x + 5, y, 8)
  // Lightning bolt in overlap center
  g.lineStyle(1, C.WAX_RED, 0.6)
  g.beginPath()
  g.moveTo(x + 1, y - 5)
  g.lineTo(x - 2, y)
  g.lineTo(x + 1, y)
  g.lineTo(x - 1, y + 5)
  g.strokePath()
  return 'Zapier'
}
```

### Tower Container Structure (all tiers)

Each placed tower is a container:
```javascript
tower = {
  container: Phaser.Container,
  type: 'googleSheets' | 'mailchimp' | ... ,
  tier: 1 | 2 | 3,
  spotId: 0-13,
  damage: Number,
  fireRate: Number,        // ms between shots
  range: Number,           // px
  lastFired: 0,            // timestamp of last shot
  killCount: 0,            // kills by this tower
  special: Function|null,  // special ability handler
  label: Phaser.Text,      // tower name label below icon
  rangeCircle: Graphics,   // drawn on hover, hidden otherwise
}
```

---

## 3. Enemy Types

### Full Enemy List

| Enemy Name | HP | Speed (px/s) | Reward (ink) | Special | Visual |
|------------|-----|-------------|-------------|---------|--------|
| Bad Leads | 30 | 70 | 5 | None (basic grunt) | Small ink blot (irregular circle, 8px radius) |
| Low Reply Rate | 45 | 60 | 7 | None | Slightly larger blot (10px) with a frown line |
| Spam Complaints | 55 | 80 | 8 | Fast: 15% faster than base | Spiky ink blot (jagged edges, red-tinted) |
| Missed Quota | 70 | 55 | 10 | Armored: takes 20% less damage from Tier 1 towers | Blocky rectangle shape (like a bar chart gone wrong) |
| Deliverability Issues | 85 | 50 | 12 | Regenerates 3 HP/s while not being hit | Cloudy blot that pulses (alpha oscillation) |
| Domain Blacklisted | 100 | 45 | 14 | Shield: absorbs the first 25 damage, then breaks (one-time) | Dark ink blot with a circle-slash icon on it |
| Client Churn | 130 | 40 | 16 | Spawns 2 "Bad Leads" on death | Large dripping ink blot with smaller satellite blobs |
| Competitor Undercut | 180 | 35 | 20 | Boss: appears once per game (wave 7). Slows all towers in 80px range by 30% while alive | Huge ink stain with a jagged "X" through it |

### Enemy Visual Drawing

```javascript
_drawEnemy(type, x, y) {
  const g = this.add.graphics()
  const container = this.add.container(x, y)

  switch (type) {
    case 'badLeads':
      // Small irregular ink blot
      g.fillStyle(C.INK, 0.8)
      g.beginPath()
      for (let i = 0; i <= 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        const r = 8 * (0.7 + Math.random() * 0.3)
        const px = Math.cos(angle) * r
        const py = Math.sin(angle) * r
        if (i === 0) g.moveTo(px, py)
        else g.lineTo(px, py)
      }
      g.closePath()
      g.fillPath()
      break

    case 'spamComplaints':
      // Spiky red-tinted blot
      g.fillStyle(C.WAX_RED, 0.7)
      g.beginPath()
      for (let i = 0; i <= 10; i++) {
        const angle = (i / 10) * Math.PI * 2
        const r = (i % 2 === 0) ? 12 : 7  // alternating spikes
        const px = Math.cos(angle) * r
        const py = Math.sin(angle) * r
        if (i === 0) g.moveTo(px, py)
        else g.lineTo(px, py)
      }
      g.closePath()
      g.fillPath()
      break

    case 'competitorUndercut':
      // Boss: huge ink stain
      JournalUI.drawInkBlot(this, 0, 0, 18)
      // "X" mark
      g.lineStyle(2, C.WAX_RED, 0.8)
      g.beginPath()
      g.moveTo(-8, -8); g.lineTo(8, 8)
      g.moveTo(8, -8); g.lineTo(-8, 8)
      g.strokePath()
      break

    // ... similar patterns for other types
  }

  container.add(g)
  return container
}
```

### Enemy HP Bar

Displayed above each enemy (only visible once damaged or when Apollo tower reveals):

```javascript
// HP bar: 20px wide, 3px tall, positioned 12px above enemy center
_drawHPBar(enemy) {
  const bg = this.add.rectangle(0, -12, 20, 3, C.INK, 0.2)
  const fill = this.add.rectangle(-10, -12, 20 * (enemy.hp / enemy.maxHp), 3, C.WAX_RED, 0.7)
  fill.setOrigin(0, 0.5)
  enemy.container.add(bg)
  enemy.container.add(fill)
  enemy.hpBar = fill
}
```

---

## 4. Wave System

**Total waves: 8**
**Total game time: ~100 seconds** (waves + inter-wave gaps)
**Inter-wave delay: 4 seconds** (first 3 waves), then 3 seconds (waves 4-8)

### Wave Composition

| Wave | Enemies | Composition | Spawn Interval | Notes |
|------|---------|-------------|----------------|-------|
| 1 | 5 | 5x Bad Leads | 1.2s | Tutorial wave. Player learns to place Tier 1 towers. |
| 2 | 7 | 5x Bad Leads, 2x Low Reply Rate | 1.0s | Slightly harder. |
| 3 | 8 | 3x Bad Leads, 3x Low Reply Rate, 2x Spam Complaints | 0.9s | Spam Complaints are fast -- tests coverage. |
| 4 | 9 | 2x Bad Leads, 3x Missed Quota, 2x Spam Complaints, 2x Deliverability Issues | 0.85s | **Tier 2 should unlock mid-wave** (around kill 15). Missed Quota resists Tier 1. |
| 5 | 10 | 2x Low Reply Rate, 3x Deliverability Issues, 3x Domain Blacklisted, 2x Missed Quota | 0.8s | Shields and regen test tower diversity. |
| 6 | 10 | 4x Spam Complaints, 3x Client Churn, 3x Domain Blacklisted | 0.75s | Client Churn spawns minions on death. Effective enemy count: ~10 + 6 = 16. |
| 7 | 8 + 1 | 3x Deliverability Issues, 2x Client Churn, 2x Domain Blacklisted, 1x Competitor Undercut (boss, spawns last) | 0.8s | **Boss wave.** Tier 3 should unlock. Boss is the final challenge. |
| 8 | 6 | 2x Spam Complaints, 2x Domain Blacklisted, 2x Client Churn | 0.7s | Victory lap wave. Player has full arsenal. Should feel powerful. |

**Total enemies killed to complete (approximate):** 63 base + ~10 spawned from Client Churn = ~73

### Wave Spawn Implementation

```javascript
const WAVES = [
  { enemies: ['badLeads','badLeads','badLeads','badLeads','badLeads'], interval: 1200, delay: 0 },
  { enemies: ['badLeads','badLeads','badLeads','badLeads','badLeads','lowReply','lowReply'], interval: 1000, delay: 4000 },
  { enemies: ['badLeads','badLeads','badLeads','lowReply','lowReply','lowReply','spam','spam'], interval: 900, delay: 4000 },
  { enemies: ['badLeads','badLeads','missedQuota','missedQuota','missedQuota','spam','spam','deliverability','deliverability'], interval: 850, delay: 4000 },
  { enemies: ['lowReply','lowReply','deliverability','deliverability','deliverability','blacklisted','blacklisted','blacklisted','missedQuota','missedQuota'], interval: 800, delay: 3000 },
  { enemies: ['spam','spam','spam','spam','churn','churn','churn','blacklisted','blacklisted','blacklisted'], interval: 750, delay: 3000 },
  { enemies: ['deliverability','deliverability','deliverability','churn','churn','blacklisted','blacklisted','boss'], interval: 800, delay: 3000 },
  { enemies: ['spam','spam','blacklisted','blacklisted','churn','churn'], interval: 700, delay: 3000 },
]
```

---

## 5. Economy

### Starting Resources

- **Starting ink:** 60
- This is enough for 2-3 Tier 1 towers immediately (Sheets=15, Mailchimp=20, LinkedIn=25)

### Income

| Source | Ink Reward |
|--------|-----------|
| Bad Leads killed | 5 |
| Low Reply Rate killed | 7 |
| Spam Complaints killed | 8 |
| Missed Quota killed | 10 |
| Deliverability Issues killed | 12 |
| Domain Blacklisted killed | 14 |
| Client Churn killed | 16 |
| Competitor Undercut killed | 20 |
| Wave completion bonus | 10 (flat, every wave) |
| Interest (passive) | 1 ink / 3 seconds |

**Expected total ink earned:** ~700-800 over 8 waves (enough for 4-5 Tier 1, 2-3 Tier 2, and 1-2 Tier 3 towers).

### Tower Sell-Back

Towers can be sold for 60% of their purchase cost. Click a placed tower, then click the "Sell" button that appears.

```
Sell value = Math.floor(tower.cost * 0.6)
```

This lets players recycle early Tier 1 towers to afford Tier 3 when they unlock.

### No Tower Upgrades

Towers do NOT upgrade individually. The progression comes from unlocking new tiers and placing better towers. This keeps the system simple and the play session short.

---

## 6. Unlock System

### Kill Thresholds

```javascript
const UNLOCK_THRESHOLDS = {
  tier2: 15,   // ~mid wave 3 or early wave 4
  tier3: 40,   // ~mid wave 6 or early wave 7
}
```

### Unlock Notification

When a tier unlocks, a banner slides in from the right:

```javascript
_showUnlockBanner(tier) {
  const tierNames = { 2: 'INTERMEDIATE TOOLS', 3: 'ADVANCED TOOLS' }
  const tierColors = { 2: C.STAMP_GREEN, 3: C.WAX_RED }

  // Banner background
  const banner = this.add.rectangle(1280, 50, 300, 40, tierColors[tier], 0.15)
  banner.setStrokeStyle(1, tierColors[tier], 0.5)

  const text = this.add.text(1280, 50, `TIER ${tier} UNLOCKED: ${tierNames[tier]}`, {
    ...TEXT.stamp,
    fontSize: '10px',
    color: tier === 2 ? COLORS.STAMP_GREEN : COLORS.WAX_RED,
  }).setOrigin(0.5)

  // Slide in from right
  this.tweens.add({
    targets: [banner, text],
    x: '-=180',
    duration: 400,
    ease: 'Back.easeOut',
    hold: 2500,
    yoyo: true,
    onComplete: () => { banner.destroy(); text.destroy() },
  })

  // Flash the tower panel to draw attention
  this._flashTowerPanel(tier)
}
```

### What Happens on Unlock

- New tower buttons appear in the tower selection panel (bottom of screen)
- The new buttons slide in with a brief glow animation
- Previously placed towers remain unchanged
- A journal-style annotation appears: "Skill unlocked: Apollo, Instantly, Lemlist, Sales Nav" (for Tier 2)

---

## 7. Controls

### Tower Placement Flow

1. **Select a tower from the panel** -- Click a tower button in the bottom panel. The cursor changes to show the tower icon following the mouse.
2. **Hover over placement spots** -- Valid empty spots glow (border brightens). Invalid spots (occupied or out of ink) show no glow.
3. **Click a valid spot** -- Tower is placed. Ink is deducted. Placement mode exits.
4. **Right-click or press ESC** -- Cancel placement mode.

### Tower Interaction

- **Hover over placed tower:** Shows range circle (dotted circle at tower.range radius, STAMP_GREEN at alpha 0.15) and tower stats tooltip
- **Click placed tower:** Selects it. Shows range circle persistently + "Sell" button appears
- **Click elsewhere:** Deselects tower, hides range circle

### Keyboard Shortcuts

```
1-4:     Select Tier 1 towers (Sheets, Mailchimp, LinkedIn, HubSpot)
5-8:     Select Tier 2 towers (Apollo, Instantly, Lemlist, Sales Nav) — only if unlocked
9, 0, -, =: Select Tier 3 towers (Clay, n8n, Claude, Zapier) — only if unlocked
ESC:     Cancel placement / deselect tower
SPACE:   Start next wave early (during inter-wave pause)
S:       Sell selected tower
```

### Mouse Behavior

```javascript
// In update():
if (this._placingTower) {
  // Tower ghost follows mouse
  this._ghostTower.x = this.input.x
  this._ghostTower.y = this.input.y

  // Check proximity to empty spots
  const nearestSpot = this._findNearestEmptySpot(this.input.x, this.input.y, 30)
  if (nearestSpot) {
    this._ghostTower.x = nearestSpot.x
    this._ghostTower.y = nearestSpot.y
    this._ghostTower.setAlpha(0.8)  // snap to spot
    // Show range preview
    this._showRangePreview(nearestSpot.x, nearestSpot.y, this._placingTower.range)
  } else {
    this._ghostTower.setAlpha(0.4)  // can't place here
  }
}
```

---

## 8. UI Layout (1280x720)

### Layout Map

```
+------------------------------------------------------------------+
| [Chapter 4]  AGENCY FACTORY          Wave: 3/8  |  Lives: ♥♥♥♥♥ |  <- Header (y: 0-40)
|                                      Kills: 23  |  Ink: 145     |
|------------------------------------------------------------------|
|                                                                  |
|      [GAME AREA: Path + Towers + Enemies]                        |  <- Main area (y: 40-620)
|      1100px wide, 580px tall                                     |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|------------------------------------------------------------------|
| TOWER PANEL:                                                     |  <- Bottom panel (y: 620-720)
| [Sheets 15] [Mail 20] [LnkdIn 25] [Hub 30] | [Apollo 50] ...    |
|                                     (Tier 2+ greyed until unlock) |
+------------------------------------------------------------------+
```

### Header Bar (y: 0-40)

```javascript
_drawHeader() {
  // Background bar
  this.add.rectangle(640, 20, 1280, 40, C.PARCHMENT_DARK, 0.4)

  // Chapter label (left)
  this.add.text(20, 12, 'Chapter 4', TEXT.label)
  this.add.text(20, 24, 'AGENCY FACTORY', {
    ...TEXT.heading,
    fontSize: '14px',
    fontStyle: 'bold',
  })

  // Wave counter (center-left)
  this._waveText = this.add.text(500, 20, 'Wave: 1 / 8', {
    ...TEXT.body,
    fontSize: '12px',
  }).setOrigin(0.5)

  // Kill counter (center)
  this._killText = this.add.text(680, 20, 'Kills: 0', {
    ...TEXT.body,
    fontSize: '12px',
  }).setOrigin(0.5)

  // Lives (center-right)
  this._livesText = this.add.text(900, 20, 'Lives: 20', {
    ...TEXT.body,
    fontSize: '12px',
    color: COLORS.WAX_RED,
  }).setOrigin(0.5)

  // Ink (right)
  this._inkText = this.add.text(1100, 20, 'Ink: 60', {
    ...TEXT.stamp,
    fontSize: '14px',
  }).setOrigin(0.5)
}
```

### Tower Selection Panel (y: 625-715)

A horizontal bar at the bottom. Each tower is a clickable button.

```javascript
_drawTowerPanel() {
  // Panel background
  this.add.rectangle(640, 670, 1260, 90, C.PARCHMENT_DARK, 0.5)
  this.add.rectangle(640, 670, 1260, 90).setStrokeStyle(0.5, C.INK, 0.3)

  // Tier labels
  this.add.text(70, 628, 'BASIC', { ...TEXT.label, fontSize: '7px' })
  this.add.text(470, 628, 'INTERMEDIATE', { ...TEXT.label, fontSize: '7px' })
  this.add.text(870, 628, 'ADVANCED', { ...TEXT.label, fontSize: '7px' })

  // Tier 1 buttons (always available)
  const tier1 = [
    { key: 'googleSheets', label: 'Sheets', cost: 15, shortcut: '1' },
    { key: 'mailchimp', label: 'Mailchimp', cost: 20, shortcut: '2' },
    { key: 'linkedIn', label: 'LinkedIn', cost: 25, shortcut: '3' },
    { key: 'hubSpot', label: 'HubSpot', cost: 30, shortcut: '4' },
  ]
  tier1.forEach((t, i) => this._drawTowerButton(t, 70 + i * 100, 670, true))

  // Tier 2 buttons (locked initially)
  const tier2 = [
    { key: 'apollo', label: 'Apollo', cost: 50, shortcut: '5' },
    { key: 'instantly', label: 'Instantly', cost: 65, shortcut: '6' },
    { key: 'lemlist', label: 'Lemlist', cost: 55, shortcut: '7' },
    { key: 'salesNav', label: 'Sales Nav', cost: 60, shortcut: '8' },
  ]
  tier2.forEach((t, i) => this._drawTowerButton(t, 470 + i * 100, 670, false))

  // Tier 3 buttons (locked initially)
  const tier3 = [
    { key: 'clay', label: 'Clay', cost: 100, shortcut: '9' },
    { key: 'n8n', label: 'n8n', cost: 90, shortcut: '0' },
    { key: 'claudeCode', label: 'Claude', cost: 120, shortcut: '-' },
    { key: 'zapier', label: 'Zapier', cost: 80, shortcut: '=' },
  ]
  tier3.forEach((t, i) => this._drawTowerButton(t, 870 + i * 100, 670, false))
}
```

### Tower Button Visual

```javascript
_drawTowerButton(towerDef, x, y, unlocked) {
  const w = 86, h = 70

  // Button background
  const bg = this.add.rectangle(x, y, w, h, C.PARCHMENT, unlocked ? 0.6 : 0.2)
  bg.setStrokeStyle(0.5, C.INK, unlocked ? 0.4 : 0.15)

  // Tower icon (draw the mini icon at x, y-14)
  const iconG = this.add.graphics()
  this['_draw' + towerDef.key.charAt(0).toUpperCase() + towerDef.key.slice(1)](iconG, x, y - 14)

  // Tower name
  this.add.text(x, y + 10, towerDef.label, {
    ...TEXT.label,
    fontSize: '8px',
    color: unlocked ? COLORS.INK : COLORS.INK_FADED,
  }).setOrigin(0.5)

  // Cost
  this.add.text(x, y + 22, `${towerDef.cost} ink`, {
    ...TEXT.small,
    fontSize: '8px',
    color: unlocked ? COLORS.STAMP_GREEN : COLORS.INK_FADED,
  }).setOrigin(0.5)

  // Shortcut hint
  this.add.text(x + w/2 - 4, y - h/2 + 4, towerDef.shortcut, {
    ...TEXT.label,
    fontSize: '7px',
    color: COLORS.INK_FADED,
  }).setOrigin(1, 0)

  if (!unlocked) {
    // Lock overlay
    this.add.text(x, y - 14, '🔒', { fontSize: '14px' }).setOrigin(0.5).setAlpha(0.4)
    iconG.setAlpha(0.2)
  }

  if (unlocked) {
    bg.setInteractive({ useHandCursor: true })
    bg.on('pointerover', () => bg.setFillStyle(C.PARCHMENT_DARK, 0.6))
    bg.on('pointerout', () => bg.setFillStyle(C.PARCHMENT, 0.6))
    bg.on('pointerdown', () => this._startPlacing(towerDef.key))
  }

  // Store reference for unlock animation
  towerDef._bg = bg
  towerDef._iconG = iconG

  return bg
}
```

---

## 9. Scoring (0-100)

### Score Calculation

```javascript
_calculateScore() {
  // Components:
  // 1. Lives remaining (max 20 = max 40 points)
  const livesPct = this._lives / 20
  const livesScore = livesPct * 40

  // 2. Efficiency — towers placed vs kills achieved (fewer towers = better)
  const efficiency = this._totalKills / Math.max(1, this._towersPlaced)
  const efficiencyScore = Math.min(20, efficiency * 2)  // cap at 20

  // 3. Tier diversity — did you use all 3 tiers?
  const tiersUsed = new Set(this._placedTowers.map(t => t.tier)).size
  const diversityScore = tiersUsed * 7  // 7/14/21 points for 1/2/3 tiers

  // 4. Speed bonus — finishing under 100 seconds
  const elapsed = (this.time.now - this._gameStartTime) / 1000
  const speedScore = elapsed < 100 ? 10 : (elapsed < 120 ? 5 : 0)

  // 5. Boss kill bonus
  const bossBonus = this._bossKilled ? 9 : 0

  const raw = livesScore + efficiencyScore + diversityScore + speedScore + bossBonus
  return Math.max(10, Math.min(100, Math.round(raw)))
}
```

**Score interpretation:**
- 90-100: Master builder. Full tool stack, minimal leaks, efficient placement.
- 70-89: Strong defense. Good tower diversity.
- 50-69: Held the line. Some enemies got through.
- 30-49: Scraped by.
- 10-29: Floor. Everyone gets at least 10 for completing.

### Stat Awards

```javascript
const techGain = Math.round(finalScore / 4)   // 2-25 points
const curTech = this.registry.get(KEYS.STAT_TECH) ?? 0
this.registry.set(KEYS.STAT_TECH, Math.min(100, curTech + techGain))

completeLevel(this, KEYS.SCORE_L4, KEYS.COMPLETED_L4, finalScore)
```

---

## 10. Difficulty Curve

### Pacing Philosophy

The game is tuned so a recruiter WINS on first play but feels challenged. The final 2-3 waves should feel hectic but manageable.

### Enemy HP Scaling

No hidden scaling. Enemy HP values are fixed per type (see section 3). Difficulty ramps through:
1. More enemies per wave
2. Tougher enemy types introduced
3. Faster spawn intervals
4. Enemy special abilities (regen, shields, spawns)

### Wave Pacing Timeline

```
0-3s:    Intro text, player reads, first tower placement
3-5s:    Wave 1 starts. Player places 1-2 more Tier 1 towers.
5-15s:   Wave 1 (easy). Learning phase. ~5 kills.
15-19s:  Inter-wave pause. Place towers.
19-30s:  Wave 2. Slightly harder. ~7 kills. Total: ~12.
30-34s:  Pause. Place towers.
34-46s:  Wave 3. Spam Complaints are fast. ~8 kills. Total: ~20.
         TIER 2 UNLOCKS (at kill 15).
46-49s:  Pause. Player buys first Tier 2 tower.
49-62s:  Wave 4. Mixed enemies, Missed Quota resist Tier 1. ~9 kills. Total: ~29.
62-65s:  Pause.
65-78s:  Wave 5. Shields and regen. ~10 kills. Total: ~39.
         TIER 3 UNLOCKS (at kill 40).
78-81s:  Pause. Player buys first Tier 3 tower.
81-95s:  Wave 6. Client Churn spawns minions. Hectic. Total: ~55.
95-98s:  Pause.
98-115s: Wave 7. Boss wave. Intense. Total: ~65.
115-118s: Pause.
118-130s: Wave 8. Victory lap. Full arsenal. Total: ~73.
130s:    Victory.
```

### Anti-Frustration Measures

1. **Generous lives (20):** Even losing 5-8 enemies still results in a win
2. **Passive income:** 1 ink every 3 seconds means even idle players accumulate resources
3. **Wave pause:** 3-4 seconds between waves gives time to think and place
4. **Sell-back:** Players can correct bad placements
5. **No perma-fail state:** Even a "loss" (0 lives) shows the completion screen with a low score and a retry prompt
6. **SPACE to start next wave early:** Impatient players can speed up

---

## 11. Win/Lose Conditions

### Win Condition

All 8 waves cleared with at least 1 life remaining.

### Lose Condition

Lives reach 0. Each enemy that reaches the exit (end of path) costs 1 life.

### On Win

Transition to completion screen (see section 12).

### On Loss

```javascript
_onLoss() {
  // Don't hard-fail -- show a reduced-score completion screen
  // The recruiter should never feel they "failed the resume"

  // Freeze game
  this._gameActive = false

  // Show overlay
  this.add.rectangle(640, 360, 1280, 720, C.PARCHMENT, 0.92)

  this.add.text(640, 200, 'THE PIPELINE BROKE.', {
    ...TEXT.title,
    fontSize: '26px',
    fontStyle: 'bold',
  }).setOrigin(0.5)

  this.add.text(640, 260,
    `But that's how you learn.\nAugustin's first campaigns bombed too.`,
    {
      ...TEXT.bodyItalic,
      fontSize: '14px',
      align: 'center',
      lineSpacing: 6,
    }
  ).setOrigin(0.5)

  // Award partial score (based on waves completed)
  const wavesCleared = this._currentWave
  const partialScore = Math.max(10, Math.round((wavesCleared / 8) * 50))

  this.add.text(640, 340, `Waves survived: ${wavesCleared} / 8`, {
    ...TEXT.body,
    fontSize: '16px',
  }).setOrigin(0.5)

  this.add.text(640, 380, `Score: ${partialScore}%`, {
    ...TEXT.body,
    fontSize: '18px',
    color: COLORS.INK_FADED,
  }).setOrigin(0.5)

  const techGain = Math.round(partialScore / 4)
  // ... award stats same as win ...

  // Retry option
  this.add.text(640, 480, 'PRESS R to retry   |   PRESS SPACE to continue', {
    ...TEXT.small,
  }).setOrigin(0.5)

  this.input.keyboard.once('keydown-R', () => {
    this.cameras.main.fadeOut(300, 0, 0, 0)
    this.time.delayedCall(320, () => this.scene.restart())
  })
  this.input.keyboard.once('keydown-SPACE', () => {
    completeLevel(this, KEYS.SCORE_L4, KEYS.COMPLETED_L4, partialScore)
    this.cameras.main.fadeOut(400, 0, 0, 0)
    this.time.delayedCall(420, () => this.scene.start('LevelSelectHub'))
  })
}
```

---

## 12. Game Flow -- Second by Second

### Scene Entry (0-3s)

```
0.0s  Camera fadeIn(400ms, from black)
0.0s  JournalUI.drawParchment(this, 0, 0, 1280, 720)
0.0s  Draw path (hand-sketched trail)
0.0s  Draw empty tower spots (14 dotted circles)
0.2s  Header fades in: "Chapter 4" + "AGENCY FACTORY"
0.4s  Intro text fades in at center (640, 360):
      "Building the growth engine.
       From spreadsheets to AI.
       Place your tools. Defend the pipeline."
      TEXT.bodyItalic, 14px, centered
0.5s  Tower panel slides up from bottom (y: 750 -> y: 670, 300ms)
1.0s  Starting ink display: "60 INK" pulses once in STAMP_GREEN
2.0s  Intro text fades to alpha 0.15
2.5s  "Wave 1 incoming..." text appears briefly near path entrance
3.0s  Wave 1 begins. First enemy spawns.
```

### Gameplay Loop (3s-130s)

```
Each frame (update):
  1. Move all enemies along path (interpolate between waypoints)
  2. For each tower:
     a. Find target in range (based on targeting priority)
     b. If target found and cooldown elapsed: fire projectile
  3. Move all projectiles toward their targets
  4. Check projectile-enemy collisions
  5. On hit: apply damage + special effects
  6. On enemy death: award ink, increment kill counter, check unlock thresholds
  7. On enemy reaching exit: decrement lives, destroy enemy
  8. Check wave completion (all enemies in wave spawned + all dead/exited)
  9. Check win/lose conditions
  10. Update UI (ink, lives, wave, kills)
```

### Between Waves

```
Wave complete:
  +10 ink bonus
  "Wave X Complete" text flashes at top (TEXT.stamp, 500ms fade-out)
  3-4 second pause
  Player can place/sell towers
  "Wave X+1 incoming..." text at 1 second before next wave
  SPACE to start next wave early
```

### Completion Screen (on win)

```
0.0s  All remaining towers fire a celebration shot (particles fly upward)
0.5s  Game area fades to alpha 0.3
1.0s  Parchment overlay fades in (0.92 alpha)

1.5s  Title: "PIPELINE MASTERED."
      TEXT.title, 30px, bold, centered (640, 160)

2.0s  Narrative text:
      "From Google Sheets to Claude Code.
       From manual tracking to AI-powered automation.
       Every tool earned. Every skill battle-tested."
      TEXT.chapter, 16px, italic, centered (640, 250), lineSpacing 8

3.0s  Score: "Score: {finalScore}%"
      TEXT.body, 18px, INK_FADED, centered (640, 340)

3.5s  Stat gain: "+{techGain} Tech"
      TEXT.stamp, 16px, STAMP_GREEN, centered (640, 380)

4.0s  Performance line (dynamic):
      90-100: "Full-stack GTM operator. You'd automate your own breakfast."
      70-89:  "Strong arsenal. The pipeline held."
      50-69:  "Some leaks, but you learned. That's the agency life."
      30-49:  "Rough start. But every agency founder starts somewhere."
      10-29:  "The tools are there. Mastery takes reps."
      TEXT.bodyItalic, 12px, INK_FADED, centered (640, 420)

4.5s  Tool stack summary (all tools used in this game, listed):
      "Tools deployed: Google Sheets, LinkedIn, Apollo, Clay..."
      TEXT.small, 10px, INK_FADED, centered (640, 460)

5.5s  Vignette teaser (next level):
      "The agency scaled. The tools sharpened.
       But one question remained:
       Could you do it for someone else's dream?"
      TEXT.prompt, 13px, italic, centered (640, 540), lineSpacing 6

6.5s  "PRESS SPACE to return to the hub"
      TEXT.small, INK_FADED, centered (640, 660)

Return: SPACE or auto-advance after 8 seconds -> LevelSelectHub
```

---

## 13. Visual Details -- Phaser Primitives

### Projectile Visuals

Each tower fires a different projectile, all drawn with primitives:

```javascript
// Google Sheets: small green square (like a cell)
_fireSheets(fromX, fromY, target) {
  const proj = this.add.rectangle(fromX, fromY, 4, 4, C.STAMP_GREEN, 0.7)
  this._moveProjectile(proj, target, 300)  // 300px/s
}

// Mailchimp: small envelope (tiny rectangle)
_fireMail(fromX, fromY, target) {
  const proj = this.add.rectangle(fromX, fromY, 6, 4, C.INK, 0.6)
  this._moveProjectile(proj, target, 350)
}

// LinkedIn: blue circle
_fireLinkedIn(fromX, fromY, target) {
  const proj = this.add.circle(fromX, fromY, 3, C.STAMP_BLUE, 0.7)
  this._moveProjectile(proj, target, 320)
}

// HubSpot: expanding ring (area damage visual)
_fireHubSpot(fromX, fromY) {
  const ring = this.add.circle(fromX, fromY, 5, 0, 0).setStrokeStyle(1, C.RED_MARGIN, 0.5)
  this.tweens.add({
    targets: ring,
    radius: 90,    // match range
    alpha: 0,
    duration: 400,
    onComplete: () => ring.destroy(),
  })
}

// Apollo: orange triangle (small rocket)
_fireApollo(fromX, fromY, target) {
  const g = this.add.graphics()
  g.fillStyle(C.RED_MARGIN, 0.7)
  g.fillTriangle(-3, 3, 3, 3, 0, -5)
  g.setPosition(fromX, fromY)
  this._moveProjectile(g, target, 450)
}

// Instantly: red lightning bolt (fast line)
_fireInstantly(fromX, fromY, target) {
  const proj = this.add.graphics()
  proj.lineStyle(1.5, C.WAX_RED, 0.8)
  proj.beginPath()
  proj.moveTo(0, -4); proj.lineTo(-2, 0); proj.lineTo(0, 0); proj.lineTo(-1, 4)
  proj.strokePath()
  proj.setPosition(fromX, fromY)
  this._moveProjectile(proj, target, 550)  // very fast
}

// Lemlist: ink splash (circle that expands on hit)
_fireLemlist(fromX, fromY, target) {
  const proj = this.add.circle(fromX, fromY, 3, C.STAMP_GREEN, 0.6)
  this._moveProjectile(proj, target, 350, () => {
    // On hit: splash effect
    const splash = this.add.circle(target.x, target.y, 5, C.STAMP_GREEN, 0.3)
    this.tweens.add({
      targets: splash,
      radius: 40,
      alpha: 0,
      duration: 300,
      onComplete: () => splash.destroy(),
    })
  })
}

// Sales Navigator: blue crosshair beam (instant line)
_fireSalesNav(fromX, fromY, target) {
  const line = this.add.line(0, 0, fromX, fromY, target.x, target.y, C.STAMP_BLUE, 0.4)
  line.setOrigin(0, 0)
  this.tweens.add({
    targets: line,
    alpha: 0,
    duration: 200,
    onComplete: () => line.destroy(),
  })
}

// Clay: large hexagonal projectile
_fireClay(fromX, fromY, target) {
  const g = this.add.graphics()
  g.fillStyle(C.INK, 0.7)
  g.beginPath()
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const px = Math.cos(a) * 5
    const py = Math.sin(a) * 5
    if (i === 0) g.moveTo(px, py)
    else g.lineTo(px, py)
  }
  g.closePath()
  g.fillPath()
  g.setPosition(fromX, fromY)
  this._moveProjectile(g, target, 280)  // slow but heavy
}

// n8n: chain lightning (line that jumps between enemies)
_fireN8n(fromX, fromY, targets) {
  // Draw line from tower to first target, then chain to next 2-3
  let prevX = fromX, prevY = fromY
  targets.forEach((t, i) => {
    const line = this.add.line(0, 0, prevX, prevY, t.x, t.y, C.RED_MARGIN, 0.5 - i * 0.1)
    line.setOrigin(0, 0)
    this.tweens.add({
      targets: line,
      alpha: 0,
      duration: 300 + i * 100,
      onComplete: () => line.destroy(),
    })
    prevX = t.x; prevY = t.y
  })
}

// Claude Code: purple/red energy pulse
_fireClaudeCode(fromX, fromY, target) {
  const proj = this.add.circle(fromX, fromY, 5, C.WAX_RED, 0.8)
  // Sparkle trail
  this._moveProjectile(proj, target, 350, null, true)  // true = leave trail
}

// Zapier: no projectile (aura tower). Visual: pulsing ring
_drawZapierAura(x, y, range) {
  const ring = this.add.circle(x, y, range, 0, 0)
  ring.setStrokeStyle(0.5, C.RED_MARGIN, 0.15)
  // Continuous pulse
  this.tweens.add({
    targets: ring,
    alpha: { from: 0.05, to: 0.2 },
    duration: 1500,
    yoyo: true,
    loop: -1,
  })
  return ring
}
```

### Projectile Movement

```javascript
_moveProjectile(proj, target, speed, onHit = null, leaveTrail = false) {
  const dx = target.container.x - proj.x
  const dy = target.container.y - proj.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const duration = (dist / speed) * 1000

  // Rotate toward target
  proj.setRotation(Math.atan2(dy, dx))

  this.tweens.add({
    targets: proj,
    x: target.container.x,
    y: target.container.y,
    duration: duration,
    onUpdate: () => {
      if (leaveTrail && Math.random() < 0.3) {
        const dot = this.add.circle(proj.x, proj.y, 1.5, C.WAX_RED, 0.4)
        this.tweens.add({
          targets: dot,
          alpha: 0,
          duration: 200,
          onComplete: () => dot.destroy(),
        })
      }
    },
    onComplete: () => {
      if (onHit) onHit()
      proj.destroy()
    },
  })

  this._projectiles.push({ obj: proj, target })
}
```

### Enemy Death Effects

```javascript
_onEnemyDeath(enemy) {
  const x = enemy.container.x
  const y = enemy.container.y

  // Ink splatter effect
  const splat = this.add.graphics()
  splat.fillStyle(C.INK, 0.6)

  // 5-8 small ink fragments
  const fragCount = 5 + Math.floor(Math.random() * 4)
  for (let i = 0; i < fragCount; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = 5 + Math.random() * 15
    const size = 1 + Math.random() * 3
    const fx = x + Math.cos(angle) * dist
    const fy = y + Math.sin(angle) * dist

    const frag = this.add.circle(fx, fy, size, C.INK, 0.7)
    this.tweens.add({
      targets: frag,
      x: fx + (Math.random() - 0.5) * 20,
      y: fy + (Math.random() - 0.5) * 20,
      alpha: 0.15,  // fades but doesn't disappear (like a stain on parchment)
      scale: 0.5,
      duration: 400 + Math.random() * 300,
      ease: 'Quad.easeOut',
      // Don't destroy -- ink stains stay on the parchment (capped at 50)
    })
  }

  // Small ink blot remains permanently at death location (journal stain)
  if (this._inkStains < 50) {
    splat.fillCircle(x, y, 3 + Math.random() * 3)
    splat.setAlpha(0.12)
    this._inkStains++
  }

  // Floating ink reward text
  const rewardText = this.add.text(x, y - 10, `+${enemy.reward}`, {
    ...TEXT.label,
    fontSize: '9px',
    color: COLORS.STAMP_GREEN,
    fontStyle: 'bold',
  }).setOrigin(0.5)

  this.tweens.add({
    targets: rewardText,
    y: y - 35,
    alpha: 0,
    duration: 800,
    ease: 'Quad.easeOut',
    onComplete: () => rewardText.destroy(),
  })

  // Destroy enemy container
  enemy.container.destroy()
}
```

### Range Indicator

```javascript
_showRange(x, y, range, color = C.STAMP_GREEN) {
  if (this._rangeCircle) this._rangeCircle.destroy()

  this._rangeCircle = this.add.graphics()

  // Dotted circle
  this._rangeCircle.lineStyle(0.5, color, 0.2)
  for (let a = 0; a < Math.PI * 2; a += 0.15) {
    this._rangeCircle.beginPath()
    this._rangeCircle.arc(x, y, range, a, a + 0.08)
    this._rangeCircle.strokePath()
  }

  // Filled area (very subtle)
  this._rangeCircle.fillStyle(color, 0.04)
  this._rangeCircle.fillCircle(x, y, range)
}
```

### Tower Placement Animation

```javascript
_placeTower(spot, towerKey) {
  // Deduct ink
  this._ink -= TOWER_DEFS[towerKey].cost
  this._updateInkDisplay()

  // Draw tower at spot
  const container = this.add.container(spot.x, spot.y)
  const iconG = this.add.graphics()
  const drawMethod = '_draw' + towerKey.charAt(0).toUpperCase() + towerKey.slice(1)
  const label = this[drawMethod](iconG, 0, 0)
  container.add(iconG)

  // Tower name label
  const nameText = this.add.text(0, 20, label, {
    ...TEXT.label,
    fontSize: '7px',
    fontStyle: 'bold',
  }).setOrigin(0.5)
  container.add(nameText)

  // Placement animation: scale up with slight bounce
  container.setScale(0)
  this.tweens.add({
    targets: container,
    scale: 1,
    duration: 300,
    ease: 'Back.easeOut',
  })

  // Ink splash effect at placement
  const splash = this.add.circle(spot.x, spot.y, 3, C.INK, 0.3)
  this.tweens.add({
    targets: splash,
    scale: 8,
    alpha: 0,
    duration: 400,
    onComplete: () => splash.destroy(),
  })

  // Register tower
  const tower = {
    container,
    type: towerKey,
    tier: TOWER_DEFS[towerKey].tier,
    spotId: spot.id,
    ...TOWER_DEFS[towerKey],
    lastFired: 0,
    killCount: 0,
  }
  this._placedTowers.push(tower)
  this._towersPlaced++
  spot.occupied = true
}
```

### Background Details

```javascript
_drawBackground() {
  // Parchment base
  JournalUI.drawParchment(this, 0, 0, 1280, 720)

  // Faded graph paper grid (engineering notebook feel, like current scene)
  const gridG = this.add.graphics()
  gridG.lineStyle(0.3, C.INK_FADED, 0.08)
  for (let x = 0; x < 1280; x += 40) {
    gridG.beginPath(); gridG.moveTo(x, 40); gridG.lineTo(x, 620); gridG.strokePath()
  }
  for (let y = 40; y < 620; y += 40) {
    gridG.beginPath(); gridG.moveTo(0, y); gridG.lineTo(1280, y); gridG.strokePath()
  }

  // "Agency Factory v3.0" annotation in margin
  this.add.text(135, 80, 'growth engine v3.0', {
    ...TEXT.label,
    fontSize: '8px',
    color: COLORS.INK_FADED,
  }).setAlpha(0.4).setRotation(-0.02)

  // Small sketch annotations near path
  this.add.text(100, 180, 'pipeline entry', {
    ...TEXT.label, fontSize: '7px',
  }).setAlpha(0.2)

  this.add.text(1120, 320, 'exit', {
    ...TEXT.label, fontSize: '7px',
  }).setAlpha(0.2)

  // Arrow sketches pointing along the path
  const arrowG = this.add.graphics()
  arrowG.lineStyle(0.5, C.INK_FADED, 0.12)
  // Small arrows at key path points
  const arrowPoints = [
    { x: 350, y: 200, angle: 0 },
    { x: 780, y: 310, angle: Math.PI / 2 },
    { x: 400, y: 440, angle: Math.PI },
    { x: 700, y: 560, angle: 0 },
  ]
  arrowPoints.forEach(({ x, y, angle }) => {
    arrowG.beginPath()
    arrowG.moveTo(x + Math.cos(angle) * 10, y + Math.sin(angle) * 10)
    arrowG.lineTo(x + Math.cos(angle + 2.8) * 5, y + Math.sin(angle + 2.8) * 5)
    arrowG.moveTo(x + Math.cos(angle) * 10, y + Math.sin(angle) * 10)
    arrowG.lineTo(x + Math.cos(angle - 2.8) * 5, y + Math.sin(angle - 2.8) * 5)
    arrowG.strokePath()
  })

  // Page number
  JournalUI.drawPageNumber(this, 8)
}
```

---

## 14. Tower Targeting Logic

```javascript
_findTarget(tower) {
  const inRange = this._enemies.filter(e => {
    const dx = e.container.x - tower.container.x
    const dy = e.container.y - tower.container.y
    return Math.sqrt(dx * dx + dy * dy) <= tower.range
  })

  if (inRange.length === 0) return null

  switch (tower.type) {
    case 'mailchimp':
    case 'googleSheets':
    case 'apollo':
    case 'lemlist':
    case 'zapier':
      // Target nearest (closest to tower)
      return inRange.sort((a, b) => {
        const da = Math.hypot(a.container.x - tower.container.x, a.container.y - tower.container.y)
        const db = Math.hypot(b.container.x - tower.container.x, b.container.y - tower.container.y)
        return da - db
      })[0]

    case 'linkedIn':
    case 'claudeCode':
      // Target strongest (highest current HP)
      return inRange.sort((a, b) => b.hp - a.hp)[0]

    case 'hubSpot':
    case 'n8n':
      // Area: hit all in range (return the array)
      return inRange

    case 'instantly':
      // Target first (furthest along the path)
      return inRange.sort((a, b) => b.pathProgress - a.pathProgress)[0]

    case 'salesNav':
      // Target unmarked first, then strongest
      const unmarked = inRange.filter(e => !e.marked)
      if (unmarked.length > 0) return unmarked.sort((a, b) => b.hp - a.hp)[0]
      return inRange.sort((a, b) => b.hp - a.hp)[0]

    case 'clay':
      // Target enemy with most Clay stacks (to compound damage)
      return inRange.sort((a, b) => (b.clayStacks || 0) - (a.clayStacks || 0))[0]

    default:
      return inRange[0]
  }
}
```

---

## 15. Enemy Movement Along Path

```javascript
_moveEnemy(enemy, delta) {
  const speed = enemy.speed * (delta / 1000)
  enemy.distanceTraveled += speed

  // Find current segment
  let accumulated = 0
  for (let i = 0; i < PATH_POINTS.length - 1; i++) {
    const dx = PATH_POINTS[i + 1].x - PATH_POINTS[i].x
    const dy = PATH_POINTS[i + 1].y - PATH_POINTS[i].y
    const segLen = Math.sqrt(dx * dx + dy * dy)

    if (accumulated + segLen >= enemy.distanceTraveled) {
      // Enemy is on this segment
      const t = (enemy.distanceTraveled - accumulated) / segLen
      enemy.container.x = PATH_POINTS[i].x + dx * t
      enemy.container.y = PATH_POINTS[i].y + dy * t
      enemy.pathProgress = enemy.distanceTraveled / this._totalPathLength
      return
    }
    accumulated += segLen
  }

  // Enemy reached the end
  this._enemyReachedExit(enemy)
}

_enemyReachedExit(enemy) {
  this._lives--
  this._livesText.setText(`Lives: ${this._lives}`)

  // Screen flash red
  const flash = this.add.rectangle(640, 360, 1280, 720, C.WAX_RED, 0.08)
  this.tweens.add({
    targets: flash,
    alpha: 0,
    duration: 300,
    onComplete: () => flash.destroy(),
  })

  // Camera shake
  this.cameras.main.shake(150, 0.004)

  enemy.container.destroy()
  this._enemies = this._enemies.filter(e => e !== enemy)

  if (this._lives <= 0) this._onLoss()
}
```

---

## 16. Complete Data Structures

### Tower Definitions

```javascript
const TOWER_DEFS = {
  googleSheets: { tier: 1, damage: 8,  fireRate: 1600, range: 100, cost: 15, label: 'Sheets' },
  mailchimp:    { tier: 1, damage: 10, fireRate: 1200, range: 110, cost: 20, label: 'Mailchimp' },
  linkedIn:     { tier: 1, damage: 14, fireRate: 1400, range: 120, cost: 25, label: 'LinkedIn' },
  hubSpot:      { tier: 1, damage: 6,  fireRate: 2000, range: 90,  cost: 30, label: 'HubSpot' },

  apollo:       { tier: 2, damage: 16, fireRate: 800,  range: 120, cost: 50, label: 'Apollo' },
  instantly:    { tier: 2, damage: 22, fireRate: 600,  range: 100, cost: 65, label: 'Instantly' },
  lemlist:      { tier: 2, damage: 12, fireRate: 1000, range: 110, cost: 55, label: 'Lemlist' },
  salesNav:     { tier: 2, damage: 18, fireRate: 1200, range: 160, cost: 60, label: 'Sales Nav' },

  clay:         { tier: 3, damage: 45, fireRate: 2500, range: 130, cost: 100, label: 'Clay' },
  n8n:          { tier: 3, damage: 20, fireRate: 1800, range: 140, cost: 90,  label: 'n8n' },
  claudeCode:   { tier: 3, damage: 55, fireRate: 2000, range: 150, cost: 120, label: 'Claude' },
  zapier:       { tier: 3, damage: 0,  fireRate: 0,    range: 100, cost: 80,  label: 'Zapier' },
}
```

### Enemy Definitions

```javascript
const ENEMY_DEFS = {
  badLeads:       { hp: 30,  speed: 70, reward: 5,  special: null },
  lowReply:       { hp: 45,  speed: 60, reward: 7,  special: null },
  spam:           { hp: 55,  speed: 80, reward: 8,  special: 'fast' },
  missedQuota:    { hp: 70,  speed: 55, reward: 10, special: 'armored' },
  deliverability: { hp: 85,  speed: 50, reward: 12, special: 'regen' },
  blacklisted:    { hp: 100, speed: 45, reward: 14, special: 'shield' },
  churn:          { hp: 130, speed: 40, reward: 16, special: 'spawner' },
  boss:           { hp: 180, speed: 35, reward: 20, special: 'slow_aura' },
}
```

### Enemy Instance

```javascript
enemy = {
  container: Phaser.Container,
  type: 'badLeads' | 'lowReply' | ...,
  hp: Number,
  maxHp: Number,
  speed: Number,
  reward: Number,
  special: String|null,
  distanceTraveled: 0,
  pathProgress: 0,        // 0.0 to 1.0
  hpBar: Graphics|null,
  marked: false,           // Sales Nav mark
  markedTimer: 0,
  clayStacks: 0,           // Clay cumulative debuff
  shieldActive: Boolean,   // Domain Blacklisted shield
  shieldHp: 25,
}
```

---

## 17. Scene Lifecycle Summary

```
create()
  +-- drawBackground (parchment, grid, annotations)
  +-- drawPath (hand-sketched trail between waypoints)
  +-- drawTowerSpots (14 dotted circles)
  +-- drawHeader (wave, kills, lives, ink)
  +-- drawTowerPanel (bottom bar with tower buttons)
  +-- show intro text (2s)
  +-- init game state (ink: 60, lives: 20, wave: 0, kills: 0)
  +-- calculate total path length
  +-- start Wave 1 after 3s delay
  +-- setup input handlers (keyboard shortcuts, mouse click)
  |
  +-- events.once('shutdown'): cleanup input listeners

update(time, delta)
  +-- if not gameActive: return
  +-- move all enemies along path
  +-- for each tower: check fire cooldown, find target, fire
  +-- move all projectiles
  +-- check projectile-enemy hits
  +-- apply damage + special effects
  +-- check enemy deaths (award ink, check unlocks)
  +-- check enemies reaching exit (lose lives)
  +-- check wave completion -> start next wave or trigger win
  +-- check win/lose conditions
  +-- apply passive income (1 ink / 3s)
  +-- update Zapier aura effects on nearby towers
  +-- update enemy regen (Deliverability Issues)
  +-- update marked timer (Sales Nav)

_startWave(waveIndex)
  +-- update wave counter UI
  +-- spawn enemies at interval from wave definition
  +-- increment currentWave

_onEnemyDeath(enemy)
  +-- ink reward + floating text
  +-- kill counter ++
  +-- ink splatter death effect
  +-- check unlock thresholds (15 kills -> Tier 2, 40 kills -> Tier 3)
  +-- if Client Churn: spawn 2 Bad Leads at death position
  +-- check if wave complete

_onWaveComplete()
  +-- +10 ink bonus
  +-- flash "Wave Complete"
  +-- if last wave: _finish()
  +-- else: delay then _startWave(next)

_finish()
  +-- calculate score
  +-- award STAT_TECH
  +-- completeLevel()
  +-- draw completion overlay
  +-- wait for SPACE or 8s -> LevelSelectHub
```

---

## 18. Estimated Line Count

Following the project convention of ~300-400 lines per scene file (though this is a more complex level):

- Constants/data (TOWER_DEFS, ENEMY_DEFS, WAVES, PATH_POINTS, TOWER_SPOTS): ~80 lines
- create() + UI setup: ~80 lines
- Tower drawing functions (12 towers): ~120 lines
- Tower panel + placement logic: ~60 lines
- Enemy spawn + movement: ~50 lines
- Targeting + firing + projectiles: ~70 lines
- Damage + death + specials: ~60 lines
- Wave management: ~30 lines
- Unlock system: ~20 lines
- Score + finish screen: ~50 lines
- Update loop: ~40 lines

Total: ~660 lines (larger than other scenes due to tower defense complexity -- consider splitting tower definitions and drawing functions into a separate `TowerDefenseData.js` helper file)

---

## 19. Implementation Priority (Build Order)

1. **Path + enemies:** Draw the path. Spawn basic enemies that walk along it. Verify movement and exit detection.

2. **Tower spots + placement:** Draw spots. Implement click-to-place with one tower type (Google Sheets). Verify placement feels good.

3. **Firing + damage:** Towers shoot at enemies in range. Enemies take damage and die. Verify the core loop works.

4. **All tower types:** Add all 12 towers with their unique visuals and projectiles. Wire up specials.

5. **Wave system:** Implement 8 waves with inter-wave pauses. Verify timing hits 90-120 seconds.

6. **Economy + unlocks:** Starting ink, kill rewards, unlock thresholds for Tier 2 and Tier 3.

7. **Enemy specials:** Shields, regen, spawners, boss aura. These make the later waves interesting.

8. **UI polish:** Tower panel, header stats, score screen, intro/outro text.

9. **Visual polish:** Ink splatter deaths, projectile trails, range indicators, placement animations, background details.
