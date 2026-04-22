import * as Phaser from 'phaser'
import { KEYS } from '../systems/GameRegistry.js'
import { completeLevel } from './LevelSelectHub.js'
import { COLORS, C, TEXT, FONT_DISPLAY, FONT_MONO } from '../config/theme.js'
import { BrutalUI } from '../ui/BrutalUI.js'

// Level 3 — THE RIDE (behind-the-bike perspective)
// Neo-brutalist: black road, bone lane markers, shock pink accents.
// Scene key stays 'GreenlandScene' for legacy compatibility.

const WIDTH = 1280
const HEIGHT = 720
const HORIZON_Y = 260       // vanishing point y
const ROAD_BOTTOM_Y = HEIGHT
const ROAD_HALF_BOTTOM = 520
const ROAD_HALF_TOP = 30
const BIKE_Y = 600
const LANES = [-1, 0, 1]    // left, center, right
const LANE_X_AT_BOTTOM = 230  // offset from center at the player's y
const SPAWN_Z = 0           // far
const HIT_Z = 0.92          // z at which an obstacle collides with the bike
const PASS_Z = 1.08         // z at which obstacle leaves view
const OBSTACLE_SPEED = 0.35 // z per second

const OBSTACLES = [
  { key: 'dogs',     label: 'WILD DOGS',       fill: C.SHOCK_PINK,    text: COLORS.BLACK, story: "I WOKE UP AT 3AM. SURROUNDED. HELD MY BREATH UNTIL DAWN." },
  { key: 'dengue',   label: 'DENGUE FEVER',    fill: C.HAZARD_YELLOW, text: COLORS.BLACK, story: "3 DAYS OF FEVER IN A SHARED DORM. NO HOSPITAL." },
  { key: 'language', label: 'LANGUAGE BARRIER',fill: C.BONE,          text: COLORS.BLACK, story: "I POINTED. I SMILED. I LEARNED 40 WORDS A DAY." },
  { key: 'card',     label: 'CARD DECLINED',   fill: C.SHOCK_PINK,    text: COLORS.BLACK, story: "NO MONEY. TEN DAYS FROM THE NEXT CITY." },
  { key: 'border',   label: 'BORDER HASSLE',   fill: C.HAZARD_YELLOW, text: COLORS.BLACK, story: "SIX HOURS. THREE OFFICIALS. ONE BRIBE REFUSED." },
  { key: 'icebergs', label: 'ICEBERGS',        fill: C.BONE,          text: COLORS.BLACK, story: "THE BOAT WASN'T COMING. I PUT ON THE PACK." },
  { key: 'backpack', label: '20KG BACKPACK',   fill: C.SHOCK_PINK,    text: COLORS.BLACK, story: "TWO DAYS. GLACIER ROUTE. NO TRAIL." },
  { key: 'village',  label: 'EMPTY VILLAGE',   fill: C.BONE,          text: COLORS.BLACK, story: "I KNOCKED ON EVERY DOOR. HOUSE #7 HAD A FIRE GOING." },
  { key: 'food',     label: 'NO FOOD',         fill: C.HAZARD_YELLOW, text: COLORS.BLACK, story: "I ATE BREAD AND BUTTER. IT WAS THE BEST MEAL OF MY LIFE." },
]

export class GreenlandScene extends Phaser.Scene {
  constructor() {
    super('GreenlandScene')
  }

  create() {
    this._gameActive = false
    this._ended = false
    this._returning = false
    this._invincible = false
    this._fumesShown = false
    this._lives = 3
    this._dodged = 0
    this._hit = 0
    this._currentLane = 1
    this._targetLaneX = 0
    this._laneOffset = 0
    this._roadScroll = 0
    this._activeObstacles = []
    this._spawnIndex = 0
    this._nextSpawnTimer = 0
    this._spawnInterval = 2.6
    this._speedLines = []

    this.cameras.main.fadeIn(400, 10, 10, 10)
    this.cameras.main.setBackgroundColor(COLORS.BLACK)

    this._drawBackground()
    this._drawRoad()
    this._drawBike()
    this._drawHUD()

    // Home button (always visible)
    BrutalUI.drawHomeButton(this)

    // Intro narrative
    this._showIntro()

    this.events.once('shutdown', () => {
      this.input.keyboard.removeAllListeners()
      this.input.removeAllListeners()
      this.tweens.killAll()
      this.time.removeAllEvents()
    }, this)
  }

  _showIntro() {
    BrutalUI.showNarrative(
      this, WIDTH / 2, HEIGHT / 2, 720, 200,
      "THESE OBSTACLES ARE REAL.\nEVERY ONE OF THEM HAPPENED.",
      () => this._startRide(),
      { fill: C.BONE, accentColor: C.SHOCK_PINK, fontSize: '20px' },
    )
  }

  _startRide() {
    this._gameActive = true
    this._bindInput()
    // Show small prompt
    const prompt = this.add.text(WIDTH / 2, HEIGHT - 40, '← →  DODGE  ·  TAP LEFT / RIGHT', {
      fontFamily: FONT_MONO, fontSize: '12px', fontStyle: 'bold', color: COLORS.BONE,
    }).setOrigin(0.5).setAlpha(0)
    this.tweens.add({ targets: prompt, alpha: 0.8, duration: 400 })
    this.tweens.add({ targets: prompt, alpha: 0, duration: 500, delay: 3500 })
  }

  _bindInput() {
    this._keyLeft = this.input.keyboard.addKey(37)
    this._keyRight = this.input.keyboard.addKey(39)
    this._keyLeft.on('down', () => this._dodge(-1))
    this._keyRight.on('down', () => this._dodge(1))

    this.input.on('pointerdown', (p) => {
      if (!this._gameActive) return
      // Ignore home button area
      if (p.x < 120 && p.y < 60) return
      if (p.x < WIDTH / 2) this._dodge(-1)
      else this._dodge(1)
    })
  }

  _dodge(direction) {
    if (!this._gameActive) return
    const next = Phaser.Math.Clamp(this._currentLane + direction, 0, 2)
    if (next === this._currentLane) return
    this._currentLane = next
  }

  _drawBackground() {
    // Solid black
    const bg = this.add.graphics()
    bg.fillStyle(C.BLACK, 1)
    bg.fillRect(0, 0, WIDTH, HEIGHT)

    // Faint horizon grid (blueprint feel)
    const grid = this.add.graphics()
    grid.lineStyle(1, C.GREY_900, 1)
    for (let y = 0; y < HORIZON_Y; y += 30) {
      grid.beginPath(); grid.moveTo(0, y); grid.lineTo(WIDTH, y); grid.strokePath()
    }
    for (let x = 0; x < WIDTH; x += 60) {
      grid.beginPath(); grid.moveTo(x, 0); grid.lineTo(x, HORIZON_Y); grid.strokePath()
    }

    // Horizon line (thick bone)
    const hz = this.add.graphics()
    hz.fillStyle(C.BONE, 1)
    hz.fillRect(0, HORIZON_Y - 2, WIDTH, 4)

    // Horizon shock pink band
    const band = this.add.graphics()
    band.fillStyle(C.SHOCK_PINK, 1)
    band.fillRect(0, HORIZON_Y - 8, WIDTH, 4)
  }

  _drawRoad() {
    // Trapezoid road
    const cx = WIDTH / 2
    const road = this.add.graphics()
    road.fillStyle(C.OFF_BLACK, 1)
    road.beginPath()
    road.moveTo(cx - ROAD_HALF_TOP, HORIZON_Y)
    road.lineTo(cx + ROAD_HALF_TOP, HORIZON_Y)
    road.lineTo(cx + ROAD_HALF_BOTTOM, ROAD_BOTTOM_Y)
    road.lineTo(cx - ROAD_HALF_BOTTOM, ROAD_BOTTOM_Y)
    road.closePath()
    road.fillPath()

    // Road edges (thick bone)
    const edges = this.add.graphics()
    edges.lineStyle(5, C.BONE, 1)
    edges.beginPath()
    edges.moveTo(cx - ROAD_HALF_TOP, HORIZON_Y)
    edges.lineTo(cx - ROAD_HALF_BOTTOM, ROAD_BOTTOM_Y)
    edges.strokePath()
    edges.beginPath()
    edges.moveTo(cx + ROAD_HALF_TOP, HORIZON_Y)
    edges.lineTo(cx + ROAD_HALF_BOTTOM, ROAD_BOTTOM_Y)
    edges.strokePath()

    // Dashed lane markers — regenerated each frame for scroll effect
    this._laneG = this.add.graphics()

    // Speed lines (from vanishing point)
    this._speedG = this.add.graphics()
  }

  _updateLaneMarkers() {
    const g = this._laneG
    g.clear()
    const cx = WIDTH / 2
    // Two lane dividers: at -1/3 and +1/3 of road
    // We draw dashes at discrete z values and project them
    const steps = 14
    for (let i = 0; i < steps; i++) {
      const z = ((i / steps) + (this._roadScroll % (1 / steps))) % 1
      const t = z          // 0 = far, 1 = near
      const y = HORIZON_Y + (ROAD_BOTTOM_Y - HORIZON_Y) * t
      const halfW = ROAD_HALF_TOP + (ROAD_HALF_BOTTOM - ROAD_HALF_TOP) * t
      // Dash thickness grows with perspective
      const dashH = 4 + t * 18
      const dashW = 2 + t * 10
      const leftX = cx - halfW / 3
      const rightX = cx + halfW / 3
      g.fillStyle(C.BONE, 0.85)
      g.fillRect(leftX - dashW / 2, y - dashH / 2, dashW, dashH)
      g.fillRect(rightX - dashW / 2, y - dashH / 2, dashW, dashH)
    }
  }

  _updateSpeedLines(dt) {
    const g = this._speedG
    g.clear()
    // 8 radiating pink lines from vanishing point
    g.lineStyle(2, C.SHOCK_PINK, 0.25)
    const cx = WIDTH / 2
    const phase = (this.time.now / 400) % 1
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2
      const len = 40 + phase * 30
      const sx = cx + Math.cos(angle) * 10
      const sy = HORIZON_Y + Math.sin(angle) * 6
      const ex = cx + Math.cos(angle) * len
      const ey = HORIZON_Y + Math.sin(angle) * len * 0.4
      g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.strokePath()
    }
  }

  _drawBike() {
    this._bikeContainer = this.add.container(WIDTH / 2, BIKE_Y)
    const g = this.add.graphics()

    // Shadow
    g.fillStyle(C.BLACK, 0.6)
    g.fillEllipse(0, 50, 140, 18)

    // Wheels (viewed from behind: two dark ellipses side by side)
    g.fillStyle(C.BLACK, 1)
    g.lineStyle(4, C.BONE, 1)
    g.fillEllipse(-38, 40, 40, 18)
    g.strokeEllipse(-38, 40, 40, 18)
    g.fillEllipse(38, 40, 40, 18)
    g.strokeEllipse(38, 40, 40, 18)

    // Rear wheel hub (center)
    g.fillStyle(C.OFF_BLACK, 1)
    g.fillRect(-20, 0, 40, 36)
    g.lineStyle(3, C.BONE, 1)
    g.strokeRect(-20, 0, 40, 36)

    // Seat (shock pink)
    g.fillStyle(C.SHOCK_PINK, 1)
    g.fillRect(-22, -10, 44, 14)
    g.lineStyle(3, C.BLACK, 1)
    g.strokeRect(-22, -10, 44, 14)

    // Rider torso (silhouette)
    g.fillStyle(C.BLACK, 1)
    g.lineStyle(3, C.BONE, 1)
    g.fillRect(-26, -60, 52, 52)
    g.strokeRect(-26, -60, 52, 52)

    // Rider head
    g.fillStyle(C.BONE, 1)
    g.fillCircle(0, -78, 14)
    g.lineStyle(3, C.BLACK, 1)
    g.strokeCircle(0, -78, 14)

    // Handlebars
    g.lineStyle(5, C.BONE, 1)
    g.beginPath(); g.moveTo(-50, -30); g.lineTo(50, -30); g.strokePath()
    // Handlebar grips
    g.fillStyle(C.SHOCK_PINK, 1)
    g.fillRect(-56, -34, 10, 10)
    g.fillRect(46, -34, 10, 10)

    this._bikeContainer.add(g)
  }

  _drawHUD() {
    // Hearts top-left
    this._hearts = []
    for (let i = 0; i < 3; i++) {
      const hx = 150 + i * 36
      const hy = 42
      const g = this.add.graphics()
      this._drawHeart(g, hx, hy, C.SHOCK_PINK)
      this._hearts.push(g)
    }

    // Score top-right (brutal card)
    this._scoreLabel = this.add.text(WIDTH - 30, 30, 'SCORE', {
      fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: COLORS.BONE,
      letterSpacing: 2,
    }).setOrigin(1, 0)
    this._scoreText = this.add.text(WIDTH - 30, 48, '0', {
      fontFamily: FONT_DISPLAY, fontSize: '36px', color: COLORS.SHOCK_PINK,
    }).setOrigin(1, 0)

    // Lane indicator (3 dots bottom center)
    this._laneDots = []
    for (let i = 0; i < 3; i++) {
      const dot = this.add.graphics()
      this._laneDots.push(dot)
    }
    this._updateLaneDots()

    // Obstacle counter
    this._progressText = this.add.text(30, HEIGHT - 30, '0 / 9', {
      fontFamily: FONT_DISPLAY, fontSize: '16px', color: COLORS.BONE,
    }).setOrigin(0, 1)
  }

  _updateLaneDots() {
    const cx = WIDTH / 2
    for (let i = 0; i < 3; i++) {
      const dot = this._laneDots[i]
      dot.clear()
      const x = cx + (i - 1) * 36
      const y = HEIGHT - 30
      const active = (i === this._currentLane)
      dot.fillStyle(active ? C.SHOCK_PINK : C.GREY_700, 1)
      dot.fillRect(x - 10, y - 6, 20, 12)
      if (active) {
        dot.lineStyle(2, C.BONE, 1)
        dot.strokeRect(x - 10, y - 6, 20, 12)
      }
    }
  }

  _drawHeart(g, x, y, color) {
    g.clear()
    g.fillStyle(color, 1)
    g.fillCircle(x - 7, y, 9)
    g.fillCircle(x + 7, y, 9)
    g.fillTriangle(x - 14, y + 2, x + 14, y + 2, x, y + 18)
    g.lineStyle(2, C.BLACK, 1)
    g.strokeCircle(x - 7, y, 9)
    g.strokeCircle(x + 7, y, 9)
  }

  _laneXAtZ(laneIndex, z) {
    // z: 0 = far (horizon), 1 = at bike
    const cx = WIDTH / 2
    const laneOffset = (laneIndex - 1)  // -1, 0, 1
    const offsetAtBottom = laneOffset * LANE_X_AT_BOTTOM
    const offsetAtTop = laneOffset * (LANE_X_AT_BOTTOM * (ROAD_HALF_TOP / ROAD_HALF_BOTTOM))
    return cx + offsetAtTop + (offsetAtBottom - offsetAtTop) * z
  }

  _yAtZ(z) {
    return HORIZON_Y + (BIKE_Y - HORIZON_Y) * z
  }

  _scaleAtZ(z) {
    // at z=0 (horizon) scale near 0.15, at z=1 (bike) scale 1.0
    return 0.15 + 0.85 * z
  }

  _spawnObstacle() {
    if (this._spawnIndex >= OBSTACLES.length) return
    const def = OBSTACLES[this._spawnIndex++]
    const laneIndex = Phaser.Math.Between(0, 2)

    const cardW = 200
    const cardH = 120

    const container = this.add.container(0, 0)

    // Shadow
    const shadow = this.add.graphics()
    shadow.fillStyle(C.BLACK, 1)
    shadow.fillRect(-cardW / 2 + 8, -cardH / 2 + 8, cardW, cardH)

    // Card
    const bg = this.add.graphics()
    bg.fillStyle(def.fill, 1)
    bg.fillRect(-cardW / 2, -cardH / 2, cardW, cardH)
    bg.lineStyle(6, C.BLACK, 1)
    bg.strokeRect(-cardW / 2, -cardH / 2, cardW, cardH)

    // Accent strip
    const strip = this.add.graphics()
    strip.fillStyle(C.BLACK, 1)
    strip.fillRect(-cardW / 2, -cardH / 2, cardW, 14)

    const label = this.add.text(0, 8, def.label, {
      fontFamily: FONT_DISPLAY, fontSize: '26px', color: def.text,
      align: 'center', wordWrap: { width: cardW - 20 },
    }).setOrigin(0.5)

    container.add([shadow, bg, strip, label])

    const ob = {
      def, container, lane: laneIndex,
      z: SPAWN_Z, resolved: false, hit: false,
    }
    this._activeObstacles.push(ob)
    this._updateObstacleTransform(ob)
  }

  _updateObstacleTransform(ob) {
    const z = Phaser.Math.Clamp(ob.z, 0, 1.15)
    const x = this._laneXAtZ(ob.lane, z)
    const y = this._yAtZ(z)
    const s = this._scaleAtZ(z)
    ob.container.setPosition(x, y)
    ob.container.setScale(s)
    // Depth: farther = deeper back
    ob.container.setDepth(Math.floor(z * 1000))
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05)

    // Smooth bike lane transition
    const targetX = WIDTH / 2 + (this._currentLane - 1) * LANE_X_AT_BOTTOM
    const curX = this._bikeContainer.x
    this._bikeContainer.x = curX + (targetX - curX) * 0.18
    this._updateLaneDots()

    if (!this._gameActive) return

    // Road scroll
    this._roadScroll += dt * 1.8
    this._updateLaneMarkers()
    this._updateSpeedLines(dt)

    // Spawn timer
    this._nextSpawnTimer -= dt
    if (this._nextSpawnTimer <= 0 && this._spawnIndex < OBSTACLES.length) {
      this._spawnObstacle()
      this._nextSpawnTimer = this._spawnInterval
    }

    // Update obstacles
    for (let i = this._activeObstacles.length - 1; i >= 0; i--) {
      const ob = this._activeObstacles[i]
      ob.z += OBSTACLE_SPEED * dt
      this._updateObstacleTransform(ob)

      // Collision check when obstacle reaches bike range
      if (!ob.resolved && ob.z >= HIT_Z) {
        if (ob.lane === this._currentLane && !this._invincible) {
          ob.hit = true
          this._onHit(ob)
        }
        ob.resolved = true
        if (!ob.hit) this._onDodge(ob)
      }

      // Despawn when passed
      if (ob.z >= PASS_Z) {
        ob.container.destroy()
        this._activeObstacles.splice(i, 1)
      }
    }

    // Update score display
    this._scoreText.setText(String(this._calculateScore()))
    this._progressText.setText(`${this._dodged + this._hit} / ${OBSTACLES.length}`)

    // End check — all spawned, all cleared
    if (!this._ended && this._spawnIndex >= OBSTACLES.length && this._activeObstacles.length === 0) {
      this._ended = true
      this._gameActive = false
      this.time.delayedCall(700, () => this._finish())
    }
  }

  _onDodge(ob) {
    this._dodged++
    // Quick flash pink tick near bike
    const tick = this.add.text(this._bikeContainer.x, BIKE_Y - 120, 'CLEAR', {
      fontFamily: FONT_DISPLAY, fontSize: '22px', color: COLORS.SHOCK_PINK,
    }).setOrigin(0.5)
    this.tweens.add({
      targets: tick, y: tick.y - 30, alpha: 0, duration: 700,
      onComplete: () => tick.destroy(),
    })
  }

  _onHit(ob) {
    this._hit++
    this._loseHeart()
    this.cameras.main.shake(200, 0.012)

    const flash = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0xff2d95, 0.3)
    flash.setDepth(2000)
    this.tweens.add({
      targets: flash, alpha: 0, duration: 300,
      onComplete: () => flash.destroy(),
    })
  }

  _loseHeart() {
    if (this._lives <= 0) return
    this._lives--
    const heart = this._hearts[this._lives]
    if (heart) {
      this.tweens.add({
        targets: heart, alpha: 0.15, duration: 300,
      })
    }

    this._invincible = true
    // Flash bike
    const flashTween = this.tweens.add({
      targets: this._bikeContainer, alpha: 0.3, duration: 100, yoyo: true, repeat: 3,
    })
    this.time.delayedCall(800, () => {
      this._invincible = false
      this._bikeContainer.alpha = 1
      if (flashTween) flashTween.stop()
    })

    if (this._lives <= 0 && !this._fumesShown) {
      this._fumesShown = true
      this._bikeContainer.setAlpha(1)
      // Tint bike pink overlay
      const overlay = this.add.graphics()
      overlay.fillStyle(C.SHOCK_PINK, 0.5)
      overlay.fillRect(-40, -90, 80, 150)
      this._bikeContainer.add(overlay)

      const fumes = this.add.text(WIDTH / 2, 200, 'RUNNING ON FUMES', {
        fontFamily: FONT_DISPLAY, fontSize: '32px', color: COLORS.SHOCK_PINK,
      }).setOrigin(0.5)
      this.tweens.add({
        targets: fumes, alpha: 0, duration: 2500, delay: 1200,
        onComplete: () => fumes.destroy(),
      })
    }
  }

  _calculateScore() {
    const total = OBSTACLES.length
    const dodgeRate = this._dodged / total
    const dodgeScore = dodgeRate * 75
    const heartScore = Math.max(0, this._lives) * 8
    const raw = dodgeScore + heartScore + 1
    return Math.max(15, Math.min(100, Math.round(raw)))
  }

  _finish() {
    const score = this._calculateScore()
    const gritGain = Math.round(score / 4)
    const indepGain = Math.round(score / 5)

    const curGrit = this.registry.get(KEYS.STAT_GRIT) ?? 0
    const curIndep = this.registry.get(KEYS.STAT_INDEPENDENCE) ?? 0
    this.registry.set(KEYS.STAT_GRIT, Math.min(100, curGrit + gritGain))
    this.registry.set(KEYS.STAT_INDEPENDENCE, Math.min(100, curIndep + indepGain))
    completeLevel(this, KEYS.SCORE_L3, KEYS.COMPLETED_L3, score)

    // Walk through stories as click-reel
    this._playStoryReel(() => this._showCompletion(score, gritGain, indepGain))
  }

  _playStoryReel(onDone) {
    const stories = OBSTACLES.map(o => `"${o.story}"\n\n— ${o.label}`)
    let i = 0
    const showNext = () => {
      if (i >= stories.length) { onDone(); return }
      const s = stories[i++]
      BrutalUI.showNarrative(
        this, WIDTH / 2, HEIGHT / 2, 760, 220, s, showNext,
        { fill: C.BONE, accentColor: C.SHOCK_PINK, fontSize: '16px' },
      )
    }
    showNext()
  }

  _showCompletion(score, gritGain, indepGain) {
    // Dark overlay
    const overlay = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x0a0a0a, 0.92)
    overlay.setDepth(3000)

    const title = this.add.text(WIDTH / 2, 140, 'THE RIDE', {
      fontFamily: FONT_DISPLAY, fontSize: '72px', color: COLORS.BONE,
    }).setOrigin(0.5).setDepth(3001)

    const shadow = this.add.text(WIDTH / 2 + 6, 146, 'THE RIDE', {
      fontFamily: FONT_DISPLAY, fontSize: '72px', color: COLORS.SHOCK_PINK,
    }).setOrigin(0.5).setDepth(3000)

    const sub = this.add.text(WIDTH / 2, 220, 'YOU MADE IT. EVERY OBSTACLE WAS REAL.', {
      fontFamily: FONT_MONO, fontSize: '14px', fontStyle: 'bold', color: COLORS.BONE,
      letterSpacing: 2,
    }).setOrigin(0.5).setDepth(3001)

    const scoreBig = this.add.text(WIDTH / 2, 330, `${score}%`, {
      fontFamily: FONT_DISPLAY, fontSize: '120px', color: COLORS.SHOCK_PINK,
    }).setOrigin(0.5).setDepth(3001)

    const stats = this.add.text(WIDTH / 2, 440,
      `${this._dodged}/${OBSTACLES.length} DODGED   +${gritGain} GRIT   +${indepGain} INDEPENDENCE`, {
      fontFamily: FONT_MONO, fontSize: '14px', fontStyle: 'bold', color: COLORS.BONE,
      letterSpacing: 2,
    }).setOrigin(0.5).setDepth(3001)

    let flavor
    if (score >= 90) flavor = "UNTOUCHABLE. YOU'VE DONE THIS BEFORE."
    else if (score >= 70) flavor = 'THE ROAD LEFT MARKS. YOU KEPT GOING.'
    else if (score >= 50) flavor = "SCRAPPY. GOT HIT. GOT UP. KEPT PEDALING."
    else flavor = "YOU SURVIVED. THAT'S WHAT MATTERS OUT THERE."

    this.add.text(WIDTH / 2, 500, flavor, {
      fontFamily: FONT_MONO, fontSize: '13px', color: COLORS.SHOCK_PINK, fontStyle: 'italic',
      wordWrap: { width: 700 }, align: 'center',
    }).setOrigin(0.5).setDepth(3001)

    BrutalUI.drawButton(this, WIDTH / 2, 610, 280, 60, 'RETURN TO INDEX', () => {
      if (this._returning) return
      this._returning = true
      this.cameras.main.fadeOut(400, 10, 10, 10)
      this.time.delayedCall(420, () => this.scene.start('LevelSelectHub'))
    }, {
      fill: C.SHOCK_PINK, labelColor: COLORS.BLACK, fontSize: '20px', shadowOffset: 6,
    }).container.setDepth(3001)
  }
}
