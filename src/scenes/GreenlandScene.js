import * as Phaser from 'phaser'
import { KEYS, recordBestTime, addPlayTime } from '../systems/GameRegistry.js'
import { completeLevel } from './LevelSelectHub.js'
import { COLORS, C, FONT_DISPLAY, FONT_MONO } from '../config/theme.js'
import { BrutalUI } from '../ui/BrutalUI.js'
import { AudioCtx } from '../ui/AudioCtx.js'
import { Particles } from '../ui/Particles.js'
import { TextReveal } from '../ui/TextReveal.js'

// Level 3 — THE RIDE (behind-the-bike perspective)
// Neo-brutalist: black road, bone lane markers, shock pink accents.
// Scene key stays 'GreenlandScene' for legacy compatibility.

const WIDTH = 1280
const HEIGHT = 720
const HORIZON_Y = 260
const ROAD_BOTTOM_Y = HEIGHT
const ROAD_HALF_BOTTOM = 520
const ROAD_HALF_TOP = 30
const BIKE_Y = 600
const LANE_X_AT_BOTTOM = 230
const SPAWN_Z = 0
const HIT_Z = 0.92
const PASS_Z = 1.08

// Obstacles — 12 total, each tagged to a "region" for horizon scenery
const OBSTACLES = [
  { key: 'dogs',     label: 'WILD DOGS',        region: 'turkey',  fill: C.SHOCK_PINK,    text: COLORS.BLACK, story: "I WOKE UP AT 3AM. SURROUNDED. HELD MY BREATH UNTIL DAWN." },
  { key: 'language', label: 'LANGUAGE BARRIER', region: 'turkey',  fill: C.BONE,          text: COLORS.BLACK, story: "I POINTED. I SMILED. I LEARNED 40 WORDS A DAY." },
  { key: 'storm',    label: 'STORM',            region: 'turkey',  fill: C.HAZARD_YELLOW, text: COLORS.BLACK, story: "RAIN HORIZONTAL. NO SHELTER. JUST PEDAL THROUGH." },
  { key: 'dengue',   label: 'DENGUE FEVER',     region: 'asia',    fill: C.HAZARD_YELLOW, text: COLORS.BLACK, story: "3 DAYS OF FEVER IN A SHARED DORM. NO HOSPITAL." },
  { key: 'flat',     label: 'FLAT TIRE',        region: 'asia',    fill: C.BONE,          text: COLORS.BLACK, story: "THIRD PUNCTURE THIS WEEK. PATCH KIT EMPTY." },
  { key: 'card',     label: 'CARD DECLINED',    region: 'europe',  fill: C.SHOCK_PINK,    text: COLORS.BLACK, story: "NO MONEY. TEN DAYS FROM THE NEXT CITY." },
  { key: 'wrong',    label: 'WRONG TURN',       region: 'europe',  fill: C.BONE,          text: COLORS.BLACK, story: "30KM OFF ROUTE. NO SIGNAL. RIDE BACK." },
  { key: 'rough',    label: 'ROUGH ROAD',       region: 'europe',  fill: C.HAZARD_YELLOW, text: COLORS.BLACK, story: "GRAVEL FOR 80KM. WHEELS BARELY HOLDING." },
  { key: 'village',  label: 'EMPTY VILLAGE',    region: 'bulgaria',fill: C.BONE,          text: COLORS.BLACK, story: "I KNOCKED ON EVERY DOOR. HOUSE #7 HAD A FIRE GOING." },
  { key: 'food',     label: 'NO FOOD',          region: 'bulgaria',fill: C.HAZARD_YELLOW, text: COLORS.BLACK, story: "BREAD AND BUTTER. BEST MEAL OF MY LIFE." },
  { key: 'icebergs', label: 'ICEBERGS',         region: 'greenland',fill: C.BONE,         text: COLORS.BLACK, story: "THE BOAT WASN'T COMING. I PUT ON THE PACK." },
  { key: 'backpack', label: '20KG PACK',        region: 'greenland',fill: C.SHOCK_PINK,   text: COLORS.BLACK, story: "TWO DAYS WALK TO THE NEXT VILLAGE. NO TRAIL." },
]

const REGION_ORDER = ['turkey', 'asia', 'europe', 'bulgaria', 'greenland']

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
    this._coinsCollected = 0
    this._streak = 0
    this._bestStreak = 0
    this._streakSticker = null
    this._elapsedMs = 0
    this._timerStartMs = 0
    this._newBest = false
    this._currentLane = 1
    this._roadScroll = 0
    this._activeObstacles = []
    this._activeCoins = []
    this._spawnIndex = 0
    this._coinSpawnIndex = 0
    this._nextSpawnTimer = 1.2
    this._nextCoinTimer = 0.6
    this._spawnInterval = 2.5
    this._coinInterval = 0.9
    this._rideTime = 0
    this._totalRideEstimate = OBSTACLES.length * 2.5 + 4 // for progress
    this._scrollSpeed = 1.6      // grows over time
    this._obstacleSpeed = 0.34   // z per second, grows over time
    this._totalCoinsToSpawn = 26

    this.cameras.main.fadeIn(400, 10, 10, 10)
    this.cameras.main.setBackgroundColor(COLORS.BLACK)

    this._drawBackground()
    this._drawRoad()
    this._scenery = this.add.container(0, 0)
    this._drawScenery('turkey')
    this._drawBike()
    this._drawHUD()

    BrutalUI.drawHomeButton(this)

    // Atmospherics + audio kick
    BrutalUI.drawScanlines(this, WIDTH, HEIGHT)
    AudioCtx.fx('open')
    this.input.once('pointerdown', () => AudioCtx.resume())
    this.input.keyboard.once('keydown', () => AudioCtx.resume())

    this._showIntro()

    this.events.once('shutdown', () => {
      this.input.keyboard.removeAllListeners()
      this.input.removeAllListeners()
      this.tweens.killAll()
      this.time.removeAllEvents()
    }, this)
  }

  // ── Intro: pre-ride context ───────────────────────────────────
  _showIntro() {
    const lines = [
      "THESE OBSTACLES ARE REAL.\nEVERY ONE OF THEM HAPPENED.",
      "I WAS 20. I PACKED A BIKE AND LEFT.",
      "SOLO BIKEPACKING ACROSS TURKEY,\nSOUTHEAST ASIA, AND EASTERN EUROPE.",
      "LATER, GREENLAND — WHERE I CARRIED\n20KG ON MY BACK FOR TWO DAYS.",
      "HERE'S WHAT TRIED TO STOP ME.",
    ]
    let i = 0
    const showNext = () => {
      if (i >= lines.length) { this._startRide(); return }
      const text = lines[i++]
      BrutalUI.showNarrative(
        this, WIDTH / 2, HEIGHT / 2, 760, 220, text, showNext,
        { fill: C.BONE, accentColor: C.SHOCK_PINK, fontSize: '20px' },
      )
    }
    showNext()
  }

  _startRide() {
    this._gameActive = true
    this._timerStartMs = this.time.now
    this._bindInput()
    const prompt = this.add.text(WIDTH / 2, HEIGHT - 56, '← →  DODGE  ·  TAP LEFT / RIGHT  ·  GRAB COINS', {
      fontFamily: FONT_MONO, fontSize: '12px', fontStyle: 'bold', color: COLORS.BONE,
    }).setOrigin(0.5).setAlpha(0)
    this.tweens.add({ targets: prompt, alpha: 0.85, duration: 400 })
    this.tweens.add({ targets: prompt, alpha: 0, duration: 500, delay: 3500,
      onComplete: () => prompt.destroy() })
  }

  _bindInput() {
    this._keyLeft = this.input.keyboard.addKey(37)
    this._keyRight = this.input.keyboard.addKey(39)
    this._keyLeft.on('down', () => this._dodge(-1))
    this._keyRight.on('down', () => this._dodge(1))

    this.input.on('pointerdown', (p) => {
      if (!this._gameActive) return
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

  // ── Background ────────────────────────────────────────────────
  _drawBackground() {
    const bg = this.add.graphics()
    bg.fillStyle(C.BLACK, 1)
    bg.fillRect(0, 0, WIDTH, HEIGHT)

    const grid = this.add.graphics()
    grid.lineStyle(1, C.GREY_900, 1)
    for (let y = 0; y < HORIZON_Y; y += 30) {
      grid.beginPath(); grid.moveTo(0, y); grid.lineTo(WIDTH, y); grid.strokePath()
    }
    for (let x = 0; x < WIDTH; x += 60) {
      grid.beginPath(); grid.moveTo(x, 0); grid.lineTo(x, HORIZON_Y); grid.strokePath()
    }

    const hz = this.add.graphics()
    hz.fillStyle(C.BONE, 1)
    hz.fillRect(0, HORIZON_Y - 2, WIDTH, 4)

    const band = this.add.graphics()
    band.fillStyle(C.SHOCK_PINK, 1)
    band.fillRect(0, HORIZON_Y - 8, WIDTH, 4)
  }

  // ── Region scenery (silhouettes at horizon) ───────────────────
  _drawScenery(region) {
    if (this._currentRegion === region) return
    this._currentRegion = region
    this._scenery.removeAll(true)

    const g = this.add.graphics()
    const baseY = HORIZON_Y - 4

    if (region === 'turkey') {
      // Minarets
      g.fillStyle(C.GREY_700, 1)
      const ms = [180, 360, 1020, 1180]
      ms.forEach(x => {
        g.fillRect(x - 4, baseY - 60, 8, 60)
        g.fillRect(x - 14, baseY - 30, 28, 8)
        g.fillTriangle(x - 8, baseY - 60, x + 8, baseY - 60, x, baseY - 78)
      })
      // Domes
      g.fillStyle(C.GREY_500, 1)
      g.fillEllipse(270, baseY - 12, 90, 36)
      g.fillEllipse(1100, baseY - 12, 80, 32)
    } else if (region === 'asia') {
      // Palm trees
      g.fillStyle(C.GREY_700, 1)
      const palms = [120, 240, 980, 1100, 1220]
      palms.forEach(x => {
        g.fillRect(x - 2, baseY - 50, 4, 50)
        // fronds
        for (let f = 0; f < 5; f++) {
          const a = (f / 5) * Math.PI - Math.PI / 2
          const ex = x + Math.cos(a) * 22
          const ey = baseY - 50 + Math.sin(a) * 14
          g.lineStyle(3, C.GREY_500, 1)
          g.beginPath(); g.moveTo(x, baseY - 50); g.lineTo(ex, ey); g.strokePath()
        }
      })
    } else if (region === 'europe') {
      // Village rooflines
      g.fillStyle(C.GREY_700, 1)
      let x = 80
      while (x < WIDTH - 80) {
        const w = 60 + Math.random() * 40
        const h = 30 + Math.random() * 25
        g.fillRect(x, baseY - h, w, h)
        // peaked roof
        g.fillTriangle(x - 4, baseY - h, x + w + 4, baseY - h, x + w / 2, baseY - h - 16)
        x += w + 10
        if (x > 500 && x < 800) x = 800 // gap for road horizon
      }
    } else if (region === 'bulgaria') {
      // Sparse bare trees
      g.lineStyle(2, C.GREY_500, 1)
      const trees = [100, 200, 320, 980, 1080, 1200]
      trees.forEach(x => {
        g.beginPath(); g.moveTo(x, baseY); g.lineTo(x, baseY - 40); g.strokePath()
        // branches
        g.beginPath(); g.moveTo(x, baseY - 30); g.lineTo(x - 12, baseY - 42); g.strokePath()
        g.beginPath(); g.moveTo(x, baseY - 34); g.lineTo(x + 12, baseY - 46); g.strokePath()
        g.beginPath(); g.moveTo(x, baseY - 22); g.lineTo(x - 8, baseY - 32); g.strokePath()
      })
    } else if (region === 'greenland') {
      // Jagged white icebergs
      g.fillStyle(C.BONE, 1)
      const peaks = [
        [60, 1, 110], [220, 1, 80], [380, 1, 130],
        [900, 1, 100], [1060, 1, 140], [1220, 1, 90],
      ]
      peaks.forEach(([cx, _, w]) => {
        const h = 40 + Math.random() * 30
        g.fillTriangle(cx - w / 2, baseY, cx + w / 2, baseY, cx - 8, baseY - h)
        g.fillTriangle(cx - 8, baseY - h, cx + w / 2, baseY, cx + w / 4, baseY - h * 0.6)
      })
      g.lineStyle(2, C.GREY_300, 1)
      peaks.forEach(([cx, _, w]) => {
        g.beginPath(); g.moveTo(cx - w / 2, baseY); g.lineTo(cx - 8, baseY - 50); g.lineTo(cx + w / 2, baseY); g.strokePath()
      })
    }

    this._scenery.add(g)
  }

  // ── Road ──────────────────────────────────────────────────────
  _drawRoad() {
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

    const edges = this.add.graphics()
    edges.lineStyle(6, C.BONE, 1)
    edges.beginPath()
    edges.moveTo(cx - ROAD_HALF_TOP, HORIZON_Y)
    edges.lineTo(cx - ROAD_HALF_BOTTOM, ROAD_BOTTOM_Y)
    edges.strokePath()
    edges.beginPath()
    edges.moveTo(cx + ROAD_HALF_TOP, HORIZON_Y)
    edges.lineTo(cx + ROAD_HALF_BOTTOM, ROAD_BOTTOM_Y)
    edges.strokePath()

    this._laneG = this.add.graphics()
    this._speedG = this.add.graphics()
  }

  _updateLaneMarkers() {
    const g = this._laneG
    g.clear()
    const cx = WIDTH / 2
    const steps = 16
    for (let i = 0; i < steps; i++) {
      const z = ((i / steps) + (this._roadScroll % (1 / steps))) % 1
      const t = z
      const y = HORIZON_Y + (ROAD_BOTTOM_Y - HORIZON_Y) * t
      const halfW = ROAD_HALF_TOP + (ROAD_HALF_BOTTOM - ROAD_HALF_TOP) * t
      const dashH = 6 + t * 24
      const dashW = 3 + t * 12
      const leftX = cx - halfW / 3
      const rightX = cx + halfW / 3
      g.fillStyle(C.BONE, 0.92)
      g.fillRect(leftX - dashW / 2, y - dashH / 2, dashW, dashH)
      g.fillRect(rightX - dashW / 2, y - dashH / 2, dashW, dashH)
    }
  }

  _updateSpeedLines() {
    const g = this._speedG
    g.clear()
    const cx = WIDTH / 2
    const speedFactor = Phaser.Math.Clamp(this._scrollSpeed / 1.6, 1, 2.4)
    const phase = (this.time.now / (380 / speedFactor)) % 1
    const alpha = 0.18 + phase * 0.22
    g.lineStyle(2, C.SHOCK_PINK, alpha)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const len = 30 + phase * 60 * speedFactor
      const sx = cx + Math.cos(angle) * 8
      const sy = HORIZON_Y + Math.sin(angle) * 5
      const ex = cx + Math.cos(angle) * len
      const ey = HORIZON_Y + Math.sin(angle) * len * 0.4
      g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.strokePath()
    }
  }

  // ── Bike (more detailed) ──────────────────────────────────────
  _drawBike() {
    this._bikeContainer = this.add.container(WIDTH / 2, BIKE_Y)
    this._bikeContainer.setDepth(1500)
    const g = this.add.graphics()

    // Shadow
    g.fillStyle(C.BLACK, 0.65)
    g.fillEllipse(0, 56, 160, 22)

    // Wheels (rear-quarter view)
    g.fillStyle(C.BLACK, 1)
    g.lineStyle(4, C.BONE, 1)
    g.fillEllipse(-42, 44, 44, 20)
    g.strokeEllipse(-42, 44, 44, 20)
    g.fillEllipse(42, 44, 44, 20)
    g.strokeEllipse(42, 44, 44, 20)
    // Wheel spokes hint
    g.lineStyle(1, C.GREY_500, 1)
    g.beginPath(); g.moveTo(-42, 36); g.lineTo(-42, 52); g.strokePath()
    g.beginPath(); g.moveTo(42, 36); g.lineTo(42, 52); g.strokePath()

    // Frame (rear hub + seat post)
    g.fillStyle(C.OFF_BLACK, 1)
    g.lineStyle(3, C.BONE, 1)
    g.fillRect(-22, 4, 44, 36)
    g.strokeRect(-22, 4, 44, 36)
    // Seat post
    g.fillStyle(C.GREY_700, 1)
    g.fillRect(-4, -12, 8, 18)

    // Seat
    g.fillStyle(C.SHOCK_PINK, 1)
    g.fillRect(-22, -16, 44, 12)
    g.lineStyle(3, C.BLACK, 1)
    g.strokeRect(-22, -16, 44, 12)

    // Pack on rider's back (20KG PACK detail)
    g.fillStyle(C.HAZARD_YELLOW, 1)
    g.fillRect(-22, -54, 44, 38)
    g.lineStyle(3, C.BLACK, 1)
    g.strokeRect(-22, -54, 44, 38)
    // Pack straps
    g.lineStyle(2, C.BLACK, 1)
    g.beginPath(); g.moveTo(-14, -54); g.lineTo(-14, -16); g.strokePath()
    g.beginPath(); g.moveTo(14, -54); g.lineTo(14, -16); g.strokePath()
    // "20KG" tag
    g.fillStyle(C.BLACK, 1)
    g.fillRect(-10, -38, 20, 10)

    // Rider torso (leaning forward slightly)
    g.fillStyle(C.BLACK, 1)
    g.lineStyle(3, C.BONE, 1)
    g.beginPath()
    g.moveTo(-20, -16)
    g.lineTo(20, -16)
    g.lineTo(16, -64)
    g.lineTo(-16, -64)
    g.closePath()
    g.fillPath()
    g.strokePath()

    // Arms reaching to handlebars
    g.lineStyle(6, C.BLACK, 1)
    g.beginPath(); g.moveTo(-16, -52); g.lineTo(-46, -32); g.strokePath()
    g.beginPath(); g.moveTo(16, -52); g.lineTo(46, -32); g.strokePath()

    // Helmet (rounded top)
    g.fillStyle(C.SHOCK_PINK, 1)
    g.fillEllipse(0, -82, 32, 22)
    g.lineStyle(3, C.BLACK, 1)
    g.strokeEllipse(0, -82, 32, 22)
    // Helmet vents
    g.lineStyle(2, C.BLACK, 1)
    g.beginPath(); g.moveTo(-8, -90); g.lineTo(-8, -78); g.strokePath()
    g.beginPath(); g.moveTo(0, -92); g.lineTo(0, -76); g.strokePath()
    g.beginPath(); g.moveTo(8, -90); g.lineTo(8, -78); g.strokePath()

    // Head/neck under helmet
    g.fillStyle(C.BONE_WARM, 1)
    g.fillCircle(0, -72, 8)
    g.lineStyle(2, C.BLACK, 1)
    g.strokeCircle(0, -72, 8)

    // Handlebars
    g.lineStyle(6, C.BONE, 1)
    g.beginPath(); g.moveTo(-54, -32); g.lineTo(54, -32); g.strokePath()
    // Grips
    g.fillStyle(C.SHOCK_PINK, 1)
    g.fillRect(-60, -36, 12, 10)
    g.fillRect(48, -36, 12, 10)
    g.lineStyle(2, C.BLACK, 1)
    g.strokeRect(-60, -36, 12, 10)
    g.strokeRect(48, -36, 12, 10)

    this._bikeContainer.add(g)
  }

  // ── HUD ───────────────────────────────────────────────────────
  _drawHUD() {
    // Hearts top-left (after home button at x≈110)
    this._hearts = []
    for (let i = 0; i < 3; i++) {
      const hx = 150 + i * 32
      const hy = 40
      const g = this.add.graphics()
      this._drawHeart(g, hx, hy, C.SHOCK_PINK)
      this._hearts.push(g)
    }

    // Coin counter (next to hearts)
    this._coinIcon = this.add.graphics()
    const cix = 260, ciy = 40
    this._coinIcon.fillStyle(C.HAZARD_YELLOW, 1)
    this._coinIcon.fillCircle(cix, ciy, 11)
    this._coinIcon.lineStyle(2, C.BLACK, 1)
    this._coinIcon.strokeCircle(cix, ciy, 11)
    this._coinText = this.add.text(cix + 18, ciy, 'x 0', {
      fontFamily: FONT_DISPLAY, fontSize: '20px', color: COLORS.HAZARD_YELLOW,
    }).setOrigin(0, 0.5)

    // Score top-right
    this._scoreLabel = this.add.text(WIDTH - 24, 22, 'SCORE', {
      fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: COLORS.BONE,
      letterSpacing: 2,
    }).setOrigin(1, 0)
    this._scoreText = this.add.text(WIDTH - 24, 38, '0', {
      fontFamily: FONT_DISPLAY, fontSize: '32px', color: COLORS.SHOCK_PINK,
    }).setOrigin(1, 0)

    // Lane indicator
    this._laneDots = []
    for (let i = 0; i < 3; i++) {
      const dot = this.add.graphics()
      this._laneDots.push(dot)
    }
    this._updateLaneDots()

    // Progress / distance
    this._progressText = this.add.text(24, HEIGHT - 24, `0 / ${OBSTACLES.length}`, {
      fontFamily: FONT_DISPLAY, fontSize: '14px', color: COLORS.BONE,
    }).setOrigin(0, 1)

    // Distance bar
    this._distBarBg = this.add.graphics()
    this._distBarBg.fillStyle(C.GREY_900, 1)
    this._distBarBg.fillRect(WIDTH - 200, HEIGHT - 24, 176, 8)
    this._distBarBg.lineStyle(1, C.BONE, 0.6)
    this._distBarBg.strokeRect(WIDTH - 200, HEIGHT - 24, 176, 8)
    this._distBar = this.add.graphics()
    this._distLabel = this.add.text(WIDTH - 200, HEIGHT - 36, 'DISTANCE TO FINISH', {
      fontFamily: FONT_MONO, fontSize: '9px', fontStyle: 'bold', color: COLORS.BONE,
      letterSpacing: 2,
    }).setOrigin(0, 1)

    // In-game story flash text container (bottom)
    this._flashText = null
  }

  _updateLaneDots() {
    const cx = WIDTH / 2
    for (let i = 0; i < 3; i++) {
      const dot = this._laneDots[i]
      dot.clear()
      const x = cx + (i - 1) * 36
      const y = HEIGHT - 24
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
    g.fillCircle(x - 6, y, 8)
    g.fillCircle(x + 6, y, 8)
    g.fillTriangle(x - 12, y + 2, x + 12, y + 2, x, y + 16)
    g.lineStyle(2, C.BLACK, 1)
    g.strokeCircle(x - 6, y, 8)
    g.strokeCircle(x + 6, y, 8)
  }

  // ── Perspective helpers ───────────────────────────────────────
  _laneXAtZ(laneIndex, z) {
    const cx = WIDTH / 2
    const laneOffset = (laneIndex - 1)
    const offsetAtBottom = laneOffset * LANE_X_AT_BOTTOM
    const offsetAtTop = laneOffset * (LANE_X_AT_BOTTOM * (ROAD_HALF_TOP / ROAD_HALF_BOTTOM))
    return cx + offsetAtTop + (offsetAtBottom - offsetAtTop) * z
  }

  _yAtZ(z) {
    return HORIZON_Y + (BIKE_Y - HORIZON_Y) * z
  }

  _scaleAtZ(z) {
    return 0.15 + 0.85 * z
  }

  // ── Spawn obstacle ────────────────────────────────────────────
  _spawnObstacle() {
    if (this._spawnIndex >= OBSTACLES.length) return
    const def = OBSTACLES[this._spawnIndex++]

    // Update region scenery as we cross into a new region
    this._drawScenery(def.region)

    const laneIndex = Phaser.Math.Between(0, 2)

    const cardW = 200
    const cardH = 110

    const container = this.add.container(0, 0)

    const shadow = this.add.graphics()
    shadow.fillStyle(C.BLACK, 1)
    shadow.fillRect(-cardW / 2 + 8, -cardH / 2 + 8, cardW, cardH)

    const bg = this.add.graphics()
    bg.fillStyle(def.fill, 1)
    bg.fillRect(-cardW / 2, -cardH / 2, cardW, cardH)
    bg.lineStyle(6, C.BLACK, 1)
    bg.strokeRect(-cardW / 2, -cardH / 2, cardW, cardH)

    const strip = this.add.graphics()
    strip.fillStyle(C.BLACK, 1)
    strip.fillRect(-cardW / 2, -cardH / 2, cardW, 14)

    // Auto-shrink fontSize if label long
    const fontSize = def.label.length > 14 ? '20px' : '24px'
    const label = this.add.text(0, 6, def.label, {
      fontFamily: FONT_DISPLAY, fontSize, color: def.text,
      align: 'center', wordWrap: { width: cardW - 24 },
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
    ob.container.setDepth(Math.floor(z * 1000))
  }

  // ── Spawn coin ────────────────────────────────────────────────
  _spawnCoin() {
    if (this._coinSpawnIndex >= this._totalCoinsToSpawn) return
    this._coinSpawnIndex++

    const laneIndex = Phaser.Math.Between(0, 2)

    const container = this.add.container(0, 0)

    const shadow = this.add.graphics()
    shadow.fillStyle(C.BLACK, 1)
    shadow.fillCircle(3, 3, 22)

    const bg = this.add.graphics()
    bg.fillStyle(C.HAZARD_YELLOW, 1)
    bg.fillCircle(0, 0, 22)
    bg.lineStyle(4, C.BLACK, 1)
    bg.strokeCircle(0, 0, 22)

    const star = this.add.text(0, 0, '★', {
      fontFamily: FONT_DISPLAY, fontSize: '22px', color: COLORS.BLACK,
    }).setOrigin(0.5)

    container.add([shadow, bg, star])

    const coin = {
      container, lane: laneIndex,
      z: SPAWN_Z, resolved: false,
    }
    this._activeCoins.push(coin)
    this._updateObstacleTransform(coin)
  }

  // ── Update loop ───────────────────────────────────────────────
  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05)

    // Smooth bike lane transition
    const targetX = WIDTH / 2 + (this._currentLane - 1) * LANE_X_AT_BOTTOM
    const curX = this._bikeContainer.x
    this._bikeContainer.x = curX + (targetX - curX) * 0.20
    // Body lean
    this._bikeContainer.setRotation((targetX - curX) * 0.0008)
    this._updateLaneDots()

    if (!this._gameActive) return

    this._rideTime += dt

    // Difficulty ramp: scroll & obstacle speed grow over time
    const ramp = Phaser.Math.Clamp(this._rideTime / 30, 0, 1)
    this._scrollSpeed = 1.6 + ramp * 1.6
    this._obstacleSpeed = 0.34 + ramp * 0.32
    // Spawn intervals tighten
    this._spawnInterval = 2.5 - ramp * 0.9

    // Road scroll
    this._roadScroll += dt * this._scrollSpeed
    this._updateLaneMarkers()
    this._updateSpeedLines()

    // Spawn obstacle
    this._nextSpawnTimer -= dt
    if (this._nextSpawnTimer <= 0 && this._spawnIndex < OBSTACLES.length) {
      this._spawnObstacle()
      this._nextSpawnTimer = this._spawnInterval
    }

    // Spawn coin (more frequent than obstacles)
    this._nextCoinTimer -= dt
    if (this._nextCoinTimer <= 0 && this._coinSpawnIndex < this._totalCoinsToSpawn) {
      // Don't spawn coin too close to a near obstacle in same lane
      this._spawnCoin()
      this._nextCoinTimer = Phaser.Math.FloatBetween(0.6, 1.1)
    }

    // Update obstacles
    for (let i = this._activeObstacles.length - 1; i >= 0; i--) {
      const ob = this._activeObstacles[i]
      ob.z += this._obstacleSpeed * dt
      this._updateObstacleTransform(ob)

      if (!ob.resolved && ob.z >= HIT_Z) {
        if (ob.lane === this._currentLane && !this._invincible) {
          ob.hit = true
          this._onHit(ob)
        }
        ob.resolved = true
        if (!ob.hit) this._onDodge(ob)
      }

      if (ob.z >= PASS_Z) {
        ob.container.destroy()
        this._activeObstacles.splice(i, 1)
      }
    }

    // Update coins
    for (let i = this._activeCoins.length - 1; i >= 0; i--) {
      const coin = this._activeCoins[i]
      coin.z += this._obstacleSpeed * dt
      this._updateObstacleTransform(coin)
      // gentle spin
      coin.container.setScale(this._scaleAtZ(coin.z) * (0.9 + 0.1 * Math.sin(time / 100 + i)))

      if (!coin.resolved && coin.z >= HIT_Z) {
        if (coin.lane === this._currentLane) {
          this._collectCoin(coin)
        }
        coin.resolved = true
      }

      if (coin.z >= PASS_Z) {
        coin.container.destroy()
        this._activeCoins.splice(i, 1)
      }
    }

    // HUD
    this._scoreText.setText(String(this._calculateScore()))
    this._progressText.setText(`${this._dodged + this._hit} / ${OBSTACLES.length}`)

    // Distance bar
    const progress = Phaser.Math.Clamp((this._dodged + this._hit) / OBSTACLES.length, 0, 1)
    this._distBar.clear()
    this._distBar.fillStyle(C.SHOCK_PINK, 1)
    this._distBar.fillRect(WIDTH - 200, HEIGHT - 24, 176 * progress, 8)

    // End check
    if (!this._ended && this._spawnIndex >= OBSTACLES.length && this._activeObstacles.length === 0) {
      this._ended = true
      this._gameActive = false
      this.time.delayedCall(700, () => this._finish())
    }
  }

  // ── Coin collect ──────────────────────────────────────────────
  _collectCoin(coin) {
    this._coinsCollected++
    this._coinText.setText(`x ${this._coinsCollected}`)
    AudioCtx.fx('coin')
    Particles.burst(this, coin.container.x, coin.container.y, C.HAZARD_YELLOW, 8, { shape: 'circle', size: 4 })

    // Score popup
    const popup = this.add.text(coin.container.x, coin.container.y - 20, '+5', {
      fontFamily: FONT_DISPLAY, fontSize: '22px', color: COLORS.HAZARD_YELLOW,
    }).setOrigin(0.5).setDepth(1800)
    this.tweens.add({
      targets: popup, y: popup.y - 50, alpha: 0, duration: 600,
      onComplete: () => popup.destroy(),
    })

    // Particles (small bone squares)
    for (let i = 0; i < 6; i++) {
      const p = this.add.graphics()
      p.fillStyle(C.HAZARD_YELLOW, 1)
      p.fillRect(-3, -3, 6, 6)
      p.x = coin.container.x
      p.y = coin.container.y
      p.setDepth(1700)
      const ang = Math.random() * Math.PI * 2
      const dist = 30 + Math.random() * 30
      this.tweens.add({
        targets: p, x: p.x + Math.cos(ang) * dist, y: p.y + Math.sin(ang) * dist,
        alpha: 0, duration: 500, onComplete: () => p.destroy(),
      })
    }

    // Counter pulse
    this.tweens.add({
      targets: this._coinText, scale: 1.3, duration: 100, yoyo: true,
    })
  }

  // ── Dodge / Hit ───────────────────────────────────────────────
  _onDodge(ob) {
    this._dodged++
    this._streak++
    if (this._streak > this._bestStreak) this._bestStreak = this._streak
    AudioCtx.fx('dodge')
    Particles.burst(this, ob.container.x, ob.container.y, C.BONE, 6)

    // Subtle shake for big obstacles even on dodge
    if (ob.def.key === 'icebergs' || ob.def.key === 'backpack') {
      this.cameras.main.shake(120, 0.006)
    }

    // Streak sticker at top-right after 3+
    if (this._streak >= 3) this._showStreakSticker(this._streak)

    const tick = this.add.text(this._bikeContainer.x, BIKE_Y - 130, 'CLEAR', {
      fontFamily: FONT_DISPLAY, fontSize: '22px', color: COLORS.SHOCK_PINK,
    }).setOrigin(0.5).setDepth(1800)
    this.tweens.add({
      targets: tick, y: tick.y - 30, alpha: 0, duration: 700,
      onComplete: () => tick.destroy(),
    })
    // Flash story line at bottom
    this._flashStoryLine(ob.def)
  }

  _showStreakSticker(n) {
    if (this._streakSticker) { this._streakSticker.destroy(); this._streakSticker = null }
    const sticker = BrutalUI.drawSticker(this, WIDTH - 90, 90, `STREAK x${n}`, {
      fill: C.SHOCK_PINK, textColor: COLORS.BLACK, fontSize: '16px',
    })
    sticker.setDepth(2100)
    this._streakSticker = sticker
    this.tweens.add({
      targets: sticker, scale: { from: 1.3, to: 1.0 }, duration: 200, ease: 'Back.easeOut',
    })
    this.tweens.add({
      targets: sticker, scale: 1.08, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })
  }

  _clearStreakSticker() {
    if (this._streakSticker) {
      const s = this._streakSticker
      this._streakSticker = null
      this.tweens.killTweensOf(s)
      this.tweens.add({
        targets: s, alpha: 0, scale: 0.6, duration: 220,
        onComplete: () => s.destroy(),
      })
    }
  }

  _flashStoryLine(def) {
    if (this._flashText) {
      if (this._flashText.skipReveal) this._flashText.skipReveal()
      this._flashText.destroy()
      this._flashText = null
    }
    const padX = 24
    const maxW = WIDTH - 200
    const full = `"${def.story}"`
    const text = TextReveal.typewrite(this, full, {
      x: WIDTH / 2, y: HEIGHT - 86,
      style: {
        fontFamily: FONT_MONO, fontSize: '14px', fontStyle: 'bold', color: COLORS.BONE,
        align: 'center', wordWrap: { width: maxW },
        backgroundColor: '#000000aa',
        padding: { x: padX, y: 8 },
      },
      stepMs: 22,
      origin: 0.5,
    })
    text.setDepth(1900)
    this._flashText = text

    // Click to skip reveal
    const skipHandler = () => {
      if (text && text.skipReveal) text.skipReveal()
    }
    this.input.on('pointerdown', skipHandler)

    this.tweens.add({
      targets: text, alpha: 0, duration: 350, delay: 1800,
      onComplete: () => {
        this.input.off('pointerdown', skipHandler)
        text.destroy()
        if (this._flashText === text) this._flashText = null
      },
    })
  }

  _onHit(ob) {
    this._hit++
    this._streak = 0
    this._clearStreakSticker()
    AudioCtx.fx('hit')
    Particles.burst(this, this._bikeContainer.x, BIKE_Y, C.SHOCK_RED, 12, { speed: 300 })
    this._loseHeart()
    this.cameras.main.shake(320, 0.022)

    const flash = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0xff2d95, 0.35)
    flash.setDepth(2000)
    this.tweens.add({
      targets: flash, alpha: 0, duration: 320,
      onComplete: () => flash.destroy(),
    })
    // Show story even on hit
    this._flashStoryLine(ob.def)
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

      const fumes = this.add.text(WIDTH / 2, 200, 'RUNNING ON FUMES', {
        fontFamily: FONT_DISPLAY, fontSize: '32px', color: COLORS.SHOCK_PINK,
      }).setOrigin(0.5).setDepth(1900)
      this.tweens.add({
        targets: fumes, alpha: 0, duration: 2500, delay: 1200,
        onComplete: () => fumes.destroy(),
      })
    }
  }

  // ── Score ─────────────────────────────────────────────────────
  _calculateScore() {
    const total = OBSTACLES.length
    const dodgeRate = this._dodged / total
    const dodgeScore = dodgeRate * 65
    const heartScore = Math.max(0, this._lives) * 6
    const coinScore = this._coinsCollected * 1.2
    const streakBonus = Math.min(10, this._bestStreak * 1.2)
    const raw = dodgeScore + heartScore + coinScore + streakBonus + 1
    return Math.max(15, Math.min(100, Math.round(raw)))
  }

  // ── Finish ────────────────────────────────────────────────────
  _finish() {
    const score = this._calculateScore()
    const gritGain = Math.round(score / 4)
    const indepGain = Math.round(score / 5)

    // Stop timer, record best, accumulate play time
    this._elapsedMs = this.time.now - this._timerStartMs
    this._newBest = recordBestTime(this, KEYS.BEST_T3, this._elapsedMs)
    addPlayTime(this, this._elapsedMs)

    AudioCtx.fx('success')
    Particles.confetti(this, this._bikeContainer.x, BIKE_Y, 60)
    this._clearStreakSticker()

    const curGrit = this.registry.get(KEYS.STAT_GRIT) ?? 0
    const curIndep = this.registry.get(KEYS.STAT_INDEPENDENCE) ?? 0
    this.registry.set(KEYS.STAT_GRIT, Math.min(100, curGrit + gritGain))
    this.registry.set(KEYS.STAT_INDEPENDENCE, Math.min(100, curIndep + indepGain))
    completeLevel(this, KEYS.SCORE_L3, KEYS.COMPLETED_L3, score)

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
    const overlay = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x0a0a0a, 0.94)
    overlay.setDepth(3000)

    const title = this.add.text(WIDTH / 2, 110, 'THE RIDE', {
      fontFamily: FONT_DISPLAY, fontSize: '64px', color: COLORS.BONE,
    }).setOrigin(0.5).setDepth(3001)

    const shadow = this.add.text(WIDTH / 2 + 6, 116, 'THE RIDE', {
      fontFamily: FONT_DISPLAY, fontSize: '64px', color: COLORS.SHOCK_PINK,
    }).setOrigin(0.5).setDepth(3000)

    const sub = this.add.text(WIDTH / 2, 170, 'YOU MADE IT. EVERY OBSTACLE WAS REAL.', {
      fontFamily: FONT_MONO, fontSize: '13px', fontStyle: 'bold', color: COLORS.BONE,
      letterSpacing: 2, wordWrap: { width: WIDTH - 80 }, align: 'center',
    }).setOrigin(0.5).setDepth(3001)

    const scoreBig = this.add.text(WIDTH / 2, 280, `${score}%`, {
      fontFamily: FONT_DISPLAY, fontSize: '110px', color: COLORS.SHOCK_PINK,
    }).setOrigin(0.5).setDepth(3001)

    const timeStr = this._formatTime(this._elapsedMs)
    const stats = this.add.text(WIDTH / 2, 380,
      `${this._dodged}/${OBSTACLES.length} DODGED   ${this._coinsCollected} COINS   BEST STREAK x${this._bestStreak}   TIME ${timeStr}   +${gritGain} GRIT   +${indepGain} INDEP.`, {
      fontFamily: FONT_MONO, fontSize: '13px', fontStyle: 'bold', color: COLORS.BONE,
      letterSpacing: 2, wordWrap: { width: WIDTH - 60 }, align: 'center',
    }).setOrigin(0.5).setDepth(3001)

    if (this._newBest) {
      const tag = BrutalUI.drawSticker(this, WIDTH / 2 + 130, 280, 'NEW BEST!', {
        fill: C.HAZARD_YELLOW, textColor: COLORS.BLACK, fontSize: '16px',
        rotation: 8 * Math.PI / 180,
      })
      tag.setDepth(3002)
      this.tweens.add({
        targets: tag, scale: { from: 0, to: 1 }, duration: 320, ease: 'Back.easeOut',
      })
    }

    let flavor
    if (score >= 90) flavor = "UNTOUCHABLE. YOU'VE DONE THIS BEFORE."
    else if (score >= 70) flavor = 'THE ROAD LEFT MARKS. YOU KEPT GOING.'
    else if (score >= 50) flavor = "SCRAPPY. GOT HIT. GOT UP. KEPT PEDALING."
    else flavor = "YOU SURVIVED. THAT'S WHAT MATTERS OUT THERE."

    this.add.text(WIDTH / 2, 450, flavor, {
      fontFamily: FONT_MONO, fontSize: '13px', color: COLORS.SHOCK_PINK, fontStyle: 'italic',
      wordWrap: { width: 700 }, align: 'center',
    }).setOrigin(0.5).setDepth(3001)

    BrutalUI.drawButton(this, WIDTH / 2, 580, 280, 60, 'RETURN TO INDEX', () => {
      if (this._returning) return
      this._returning = true
      AudioCtx.fx('pageTurn')
      BrutalUI.pageTurn(this, () => this.scene.start('LevelSelectHub'))
    }, {
      fill: C.SHOCK_PINK, labelColor: COLORS.BLACK, fontSize: '20px', shadowOffset: 6,
    }).container.setDepth(3001)
  }

  _formatTime(ms) {
    const totalSec = Math.floor(ms / 1000)
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }
}
