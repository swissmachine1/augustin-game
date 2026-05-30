import * as Phaser from 'phaser'
import { KEYS, recordBestTime, addPlayTime } from '../systems/GameRegistry.js'
import { completeLevel } from './LevelSelectHub.js'
import { COLORS, C, TEXT, FONT_MONO, FONT_DISPLAY, LEVEL_COLORS } from '../config/theme.js'
import { BrutalUI } from '../ui/BrutalUI.js'
import { AudioCtx } from '../ui/AudioCtx.js'
import { Particles } from '../ui/Particles.js'
import { TextReveal } from '../ui/TextReveal.js'

const GRID = { cols: 8, rows: 8, cellSize: 60, originX: 80, originY: 140 }
const WATCH_CELL_MS = 520    // slow so player can follow
const VERIFY_CELL_MS = 360   // verify — slow but a bit snappier
const PLATFORM_PAUSE_MS = 900
const RECALL_TIME = 45

const ACCENT = LEVEL_COLORS[5] // SHOCK_ACID

const PLATFORMS = [
  { id: 0, label: 'LAW SCHOOL',       year: '2014', col: 1, row: 0, angle: '\\' },
  { id: 1, label: 'STARTUP WEEKEND',  year: '2014', col: 5, row: 0, angle: '\\' },
  { id: 2, label: 'FIRST SALES JOB',  year: '2015', col: 5, row: 2, angle: '/'  },
  { id: 3, label: 'LATIN AMERICA',    year: '2017', col: 2, row: 2, angle: '/'  },
  { id: 4, label: 'TRAINING DOCTORS', year: '2018', col: 2, row: 4, angle: '\\' },
  { id: 5, label: '$1M ARR',          year: '2020', col: 6, row: 4, angle: '\\' },
  { id: 6, label: 'GREENLAND',        year: '2007', col: 6, row: 6, angle: '/'  },
  { id: 7, label: 'AGENCY LAUNCH',    year: '2023', col: 3, row: 6, angle: '/'  },
  { id: 8, label: 'CLAY / N8N / AI',  year: '2025', col: 3, row: 7, angle: '\\' },
]

const LANDING_ZONE = { col: 6, row: 7 }

function deflect(dir, angle) {
  if (angle === '/') {
    return { DOWN: 'LEFT', LEFT: 'DOWN', UP: 'RIGHT', RIGHT: 'UP' }[dir]
  }
  return { DOWN: 'RIGHT', RIGHT: 'DOWN', UP: 'LEFT', LEFT: 'UP' }[dir]
}

function stepDir(col, row, dir) {
  if (dir === 'DOWN')  return { col, row: row + 1 }
  if (dir === 'UP')    return { col, row: row - 1 }
  if (dir === 'LEFT')  return { col: col - 1, row }
  return { col: col + 1, row }
}

function dirVec(dir) {
  if (dir === 'DOWN')  return { x: 0, y: 1 }
  if (dir === 'UP')    return { x: 0, y: -1 }
  if (dir === 'LEFT')  return { x: -1, y: 0 }
  return { x: 1, y: 0 }
}

export class InterviewRoomScene extends Phaser.Scene {
  constructor() {
    super('InterviewRoomScene')
  }

  create() {
    this._playerName = this.registry.get(KEYS.PLAYER_NAME) ?? 'friend'
    this._phase = 'INIT'
    this._score = 0
    this._placements = new Map()
    this._trailDots = []
    this._phaseObjects = []
    this._trayPieces = []
    this._timeLeft = RECALL_TIME
    this._timerEvent = null
    this._ballTweens = []

    this.cameras.main.setBackgroundColor(COLORS.BLACK)
    this.cameras.main.fadeIn(350, 10, 10, 10)

    this._drawBackdrop()
    this._drawHeader()
    this._createBallTexture()

    // Subtle scanlines
    BrutalUI.drawScanlines(this, 1280, 720, { alpha: 0.03 })

    // Persistent home button
    BrutalUI.drawHomeButton(this)

    // Audio: scene open + resume on first pointer
    AudioCtx.fx('open')
    this.input.once('pointerdown', () => AudioCtx.resume())

    this.events.once('shutdown', () => this._cleanup())

    // Onboarding — click-to-advance intro explaining the 3 phases
    this._showIntroNarrative()
  }

  _cleanup() {
    if (this._timerEvent) this._timerEvent.remove(false)
    this._trailDots = []
  }

  _drawBackdrop() {
    const W = 1280, H = 720
    const g = this.add.graphics()
    g.fillStyle(C.BLACK, 1)
    g.fillRect(0, 0, W, H)
    // Subtle bone grid blueprint — NOT confused with the playfield grid
    g.lineStyle(1, C.BONE, 0.04)
    for (let x = 0; x <= W; x += 80) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.strokePath() }
    for (let y = 0; y <= H; y += 80) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.strokePath() }
  }

  _drawHeader() {
    // Chapter tag, top bar on the right of the home button
    this.add.text(160, 38, 'CHAPTER 05', {
      fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: COLORS.BONE,
      letterSpacing: 3,
    })
    this.add.text(160, 54, 'PINBALL RECALL', {
      fontFamily: FONT_DISPLAY, fontSize: '26px', color: COLORS.BONE,
    })
    // Accent strip
    const strip = this.add.graphics()
    strip.fillStyle(ACCENT.num, 1)
    strip.fillRect(160, 90, 220, 4)
  }

  _showIntroNarrative() {
    this._phase = 'INTRO'
    const lines = [
      [
        'PHASE 1 — WATCH',
        'YOU WILL WATCH A BALL BOUNCE THROUGH MY CAREER.',
      ],
      [
        'PHASE 2 — RECALL',
        'THEN PLATFORMS DISAPPEAR.\nPLACE THEM BACK FROM MEMORY.',
      ],
      [
        'PHASE 3 — VERIFY',
        'THE BETTER YOUR MEMORY, THE HIGHER YOUR SCORE.',
      ],
    ]

    const step = (i) => {
      if (i >= lines.length) {
        this.time.delayedCall(200, () => {
          // Start game timer once onboarding ends
          this._gameStartMs = this.time.now
          this._startPhaseWatch()
        })
        return
      }
      const [title, body] = lines[i]
      this._typewriteNarrative(title, body, () => step(i + 1))
    }
    step(0)
  }

  _typewriteNarrative(title, body, onNext) {
    const w = 760, h = 280
    const cx = 640, cy = 360
    const container = this.add.container(cx, cy)

    const shadow = this.add.graphics()
    shadow.fillStyle(C.BLACK, 1)
    shadow.fillRect(-w / 2 + 6, -h / 2 + 6, w, h)

    const bg = this.add.graphics()
    bg.fillStyle(C.BONE, 1)
    bg.fillRect(-w / 2, -h / 2, w, h)
    bg.lineStyle(4, C.BLACK, 1)
    bg.strokeRect(-w / 2, -h / 2, w, h)

    const accent = this.add.graphics()
    accent.fillStyle(ACCENT.num, 1)
    accent.fillRect(-w / 2, -h / 2, w, 8)

    container.add([shadow, bg, accent])

    // Title (instant, big)
    const titleTxt = this.add.text(cx, cy - 70, title, {
      fontFamily: FONT_DISPLAY, fontSize: '28px', color: COLORS.BLACK,
    }).setOrigin(0.5)

    // Body — typewriter
    const bodyReveal = TextReveal.typewrite(this, body, {
      x: cx, y: cy + 10,
      style: {
        fontFamily: FONT_MONO, fontSize: '16px', color: COLORS.BLACK,
        align: 'center', wordWrap: { width: w - 60 }, lineSpacing: 4,
      },
      stepMs: 22, origin: 0.5,
    })

    const hint = this.add.text(cx, cy + h / 2 - 24, '▶ CLICK TO CONTINUE', {
      fontFamily: FONT_MONO, fontSize: '10px', fontStyle: 'bold',
      color: COLORS.GREY_500,
    }).setOrigin(0.5).setAlpha(0)
    this.tweens.add({ targets: hint, alpha: 1, duration: 400, delay: 700 })
    const blink = this.tweens.add({
      targets: hint, alpha: 0.3, duration: 600, yoyo: true, repeat: -1, delay: 1200,
    })

    const handler = () => {
      this.input.off('pointerdown', handler)
      blink.stop()
      AudioCtx.fx('click')
      // Skip reveal if not done
      if (bodyReveal.skipReveal) bodyReveal.skipReveal()
      this.tweens.add({
        targets: [container, titleTxt, bodyReveal, hint],
        alpha: 0, duration: 180,
        onComplete: () => {
          container.destroy(); titleTxt.destroy(); bodyReveal.destroy(); hint.destroy()
          if (onNext) onNext()
        },
      })
    }
    this.input.once('pointerdown', handler)
  }

  _cellCenter(col, row) {
    return {
      x: GRID.originX + col * GRID.cellSize + GRID.cellSize / 2,
      y: GRID.originY + row * GRID.cellSize + GRID.cellSize / 2,
    }
  }

  _drawGrid() {
    const { cols, rows, cellSize, originX, originY } = GRID
    const g = this.add.graphics()
    this._addPhaseObject(g)

    // Outer thick bone border
    g.lineStyle(5, C.BONE, 1)
    g.strokeRect(originX - 4, originY - 4, cols * cellSize + 8, rows * cellSize + 8)

    // Grid lines — thick bone
    g.lineStyle(1.5, C.BONE, 0.55)
    for (let c = 0; c <= cols; c++) {
      const x = originX + c * cellSize
      g.beginPath(); g.moveTo(x, originY); g.lineTo(x, originY + rows * cellSize); g.strokePath()
    }
    for (let r = 0; r <= rows; r++) {
      const y = originY + r * cellSize
      g.beginPath(); g.moveTo(originX, y); g.lineTo(originX + cols * cellSize, y); g.strokePath()
    }

    // Intersection dots — small bone circles
    g.fillStyle(C.BONE, 0.8)
    for (let c = 0; c <= cols; c++) {
      for (let r = 0; r <= rows; r++) {
        g.fillCircle(originX + c * cellSize, originY + r * cellSize, 2.2)
      }
    }
  }

  _drawEntryExit() {
    const entry = this._cellCenter(1, 0)
    const exit = this._cellCenter(LANDING_ZONE.col, LANDING_ZONE.row)

    // START marker at top
    const startG = this.add.graphics()
    startG.fillStyle(ACCENT.num, 1)
    startG.fillTriangle(entry.x - 10, GRID.originY - 26, entry.x + 10, GRID.originY - 26, entry.x, GRID.originY - 6)
    this._addPhaseObject(startG)
    const startTxt = this.add.text(entry.x, GRID.originY - 42, 'START', {
      fontFamily: FONT_DISPLAY, fontSize: '14px', color: COLORS.BONE,
    }).setOrigin(0.5)
    this._addPhaseObject(startTxt)

    // HIRE ME zone — big bone rectangle at bottom below exit column
    const gx = GRID.originX + LANDING_ZONE.col * GRID.cellSize
    const gy = GRID.originY + GRID.rows * GRID.cellSize + 16
    const zone = this.add.graphics()
    zone.fillStyle(C.BLACK, 1)
    zone.fillRect(gx + 6, gy + 6, 180, 50)
    zone.fillStyle(C.BONE, 1)
    zone.fillRect(gx, gy, 180, 50)
    zone.lineStyle(3, C.BLACK, 1)
    zone.strokeRect(gx, gy, 180, 50)
    // Accent slash
    zone.fillStyle(ACCENT.num, 1)
    zone.fillRect(gx, gy, 8, 50)
    this._addPhaseObject(zone)

    const zoneText = this.add.text(gx + 96, gy + 25, 'HIRE ME →', {
      fontFamily: FONT_DISPLAY, fontSize: '20px', color: COLORS.BLACK,
    }).setOrigin(0.5)
    this._addPhaseObject(zoneText)

    // Dotted drop guide from grid bottom to zone
    const guide = this.add.graphics()
    guide.lineStyle(2, ACCENT.num, 0.5)
    for (let yy = GRID.originY + GRID.rows * GRID.cellSize; yy < gy; yy += 6) {
      guide.beginPath(); guide.moveTo(exit.x, yy); guide.lineTo(exit.x, yy + 3); guide.strokePath()
    }
    this._addPhaseObject(guide)
  }

  _createBallTexture() {
    if (this.textures.exists('l5ball')) return
    const g = this.add.graphics()
    // Black border
    g.fillStyle(0x000000, 1)
    g.fillCircle(14, 14, 13)
    // Acid green fill
    g.fillStyle(0x00ff6a, 1)
    g.fillCircle(14, 14, 10)
    // Tiny bone highlight
    g.fillStyle(0xf5f0e6, 0.9)
    g.fillCircle(10, 10, 2.5)
    g.generateTexture('l5ball', 28, 28)
    g.destroy()
  }

  _drawPlatform(col, row, angle, color = C.BONE, thickness = 5) {
    const x = GRID.originX + col * GRID.cellSize
    const y = GRID.originY + row * GRID.cellSize
    const pad = 8
    const g = this.add.graphics()
    // Thick black casing
    g.lineStyle(thickness + 4, C.BLACK, 1)
    g.beginPath()
    if (angle === '/') {
      g.moveTo(x + pad, y + GRID.cellSize - pad)
      g.lineTo(x + GRID.cellSize - pad, y + pad)
    } else {
      g.moveTo(x + pad, y + pad)
      g.lineTo(x + GRID.cellSize - pad, y + GRID.cellSize - pad)
    }
    g.strokePath()
    // Main color line
    g.lineStyle(thickness, color, 1)
    g.beginPath()
    if (angle === '/') {
      g.moveTo(x + pad, y + GRID.cellSize - pad)
      g.lineTo(x + GRID.cellSize - pad, y + pad)
    } else {
      g.moveTo(x + pad, y + pad)
      g.lineTo(x + GRID.cellSize - pad, y + GRID.cellSize - pad)
    }
    g.strokePath()
    return g
  }

  _addPhaseObject(obj) {
    this._phaseObjects.push(obj)
    return obj
  }

  _clearPhaseObjects() {
    this._phaseObjects.forEach(o => { if (o && o.destroy) o.destroy() })
    this._phaseObjects = []
  }

  // =================== PHASE 1: WATCH ===================

  _startPhaseWatch() {
    this._phase = 'WATCH'
    this._drawGrid()
    this._drawEntryExit()

    // Side panel on the right — shows current career milestone
    this._drawWatchPanel()

    PLATFORMS.forEach(p => {
      const plat = this._drawPlatform(p.col, p.row, p.angle, C.BONE, 5)
      this._addPhaseObject(plat)
      p._graphic = plat
    })

    this.time.delayedCall(700, () => this._runBallWatch())
  }

  _drawWatchPanel() {
    const px = 640, py = 140, pw = 560, ph = 420
    const panel = this.add.graphics()
    panel.fillStyle(C.BLACK, 1)
    panel.fillRect(px + 8, py + 8, pw, ph)
    panel.fillStyle(C.BONE, 1)
    panel.fillRect(px, py, pw, ph)
    panel.lineStyle(4, C.BLACK, 1)
    panel.strokeRect(px, py, pw, ph)
    panel.fillStyle(ACCENT.num, 1)
    panel.fillRect(px, py, pw, 10)
    this._addPhaseObject(panel)

    const hdr = this.add.text(px + 24, py + 30, 'PHASE 1 — WATCH', {
      fontFamily: FONT_MONO, fontSize: '12px', fontStyle: 'bold', color: COLORS.GREY_700,
      letterSpacing: 3,
    })
    this._addPhaseObject(hdr)

    const sub = this.add.text(px + 24, py + 54, 'FOLLOW THE BALL.\nMEMORIZE THE PATH.', {
      fontFamily: FONT_DISPLAY, fontSize: '26px', color: COLORS.BLACK,
      lineSpacing: 4,
    })
    this._addPhaseObject(sub)

    // Step counter + milestone
    this._watchYear = this.add.text(px + 24, py + 150, '', {
      fontFamily: FONT_DISPLAY, fontSize: '54px', color: COLORS.BLACK,
    })
    this._addPhaseObject(this._watchYear)

    this._watchLabel = this.add.text(px + 24, py + 220, '', {
      fontFamily: FONT_DISPLAY, fontSize: '28px', color: COLORS.BLACK,
      wordWrap: { width: pw - 48 },
    })
    this._addPhaseObject(this._watchLabel)

    this._watchStep = this.add.text(px + 24, py + ph - 40, '', {
      fontFamily: FONT_MONO, fontSize: '13px', fontStyle: 'bold', color: COLORS.GREY_700,
      letterSpacing: 2,
    })
    this._addPhaseObject(this._watchStep)
  }

  _runBallWatch() {
    const start = this._cellCenter(1, 0)
    this._ball = this.add.image(start.x, GRID.originY - 60, 'l5ball').setDepth(10)
    this._addPhaseObject(this._ball)

    const path = this._buildPath()
    this._animateAlongPath(path, true, () => this._endPhaseWatch())
  }

  _buildPath() {
    const path = []
    let col = 1, row = 0, dir = 'DOWN'
    const first = PLATFORMS.find(p => p.col === col && p.row === row)
    path.push({ col, row, platform: first, isLanding: false, dirBefore: dir, dirAfter: first ? deflect(dir, first.angle) : dir })
    if (first) dir = deflect(dir, first.angle)

    let steps = 0
    while (steps++ < 200) {
      const next = stepDir(col, row, dir)
      col = next.col
      row = next.row
      if (col < 0 || col >= GRID.cols || row < 0 || row >= GRID.rows) break
      const plat = PLATFORMS.find(p => p.col === col && p.row === row)
      const isLanding = (col === LANDING_ZONE.col && row === LANDING_ZONE.row)
      const dirBefore = dir
      const dirAfter = plat ? deflect(dir, plat.angle) : dir
      path.push({ col, row, platform: plat, isLanding, dirBefore, dirAfter })
      if (isLanding) break
      if (plat) dir = deflect(dir, plat.angle)
    }
    return path
  }

  _animateAlongPath(path, isWatch, onDone) {
    let idx = 0
    const stepNext = () => {
      const expectedPhase = isWatch ? 'WATCH' : 'VERIFY'
      if (this._phase !== expectedPhase) return
      if (idx >= path.length) { if (onDone) onDone(); return }
      const node = path[idx]
      const target = this._cellCenter(node.col, node.row)
      const duration = isWatch ? WATCH_CELL_MS : VERIFY_CELL_MS
      const tween = this.tweens.add({
        targets: this._ball,
        x: target.x,
        y: target.y,
        duration,
        ease: 'Linear',
        onUpdate: () => {
          if (isWatch) this._dropTrail(this._ball.x, this._ball.y)
        },
        onComplete: () => {
          if (node.platform) {
            this._onPlatformHit(node, isWatch, () => { idx++; stepNext() })
          } else if (node.isLanding) {
            this._onLandingHit(isWatch, () => { idx++; stepNext() })
          } else {
            idx++
            stepNext()
          }
        },
      })
      this._ballTweens.push(tween)
    }
    stepNext()
  }

  _dropTrail(x, y) {
    if (!this._lastTrail) this._lastTrail = { x, y }
    const dx = x - this._lastTrail.x
    const dy = y - this._lastTrail.y
    if (dx * dx + dy * dy < 180) return
    this._lastTrail = { x, y }
    const dot = this.add.circle(x, y, 2, ACCENT.num, 0.6).setDepth(5)
    this._trailDots.push(dot)
  }

  _onPlatformHit(node, isWatch, done) {
    const plat = node.platform
    const center = this._cellCenter(plat.col, plat.row)

    // Bounce sound (Watch + Verify both)
    AudioCtx.fx('bounce')

    // Flash the platform
    if (plat._graphic) {
      this.tweens.add({
        targets: plat._graphic, alpha: 0.25, duration: 120, yoyo: true,
        onComplete: () => { if (plat._graphic) plat._graphic.alpha = 1 },
      })
    }

    if (isWatch) {
      // Show sticker label above platform
      const sticker = BrutalUI.drawSticker(this, center.x, center.y - GRID.cellSize / 2 - 22, plat.label, {
        fill: ACCENT.num, textColor: COLORS.BLACK, fontSize: '11px',
        rotation: -4 * Math.PI / 180,
      })
      sticker.setDepth(12)
      this._addPhaseObject(sticker)
      sticker.setScale(0)
      this.tweens.add({ targets: sticker, scale: 1, duration: 180, ease: 'Back.easeOut' })

      // Arrow pointing in direction of travel AFTER the bounce
      const arrow = this._drawArrow(center.x, center.y, node.dirAfter)
      this._addPhaseObject(arrow)

      // Update side panel
      if (this._watchYear) this._watchYear.setText(plat.year)
      if (this._watchLabel) this._watchLabel.setText(plat.label)
      if (this._watchStep) this._watchStep.setText(`STEP ${plat.id + 1} / 9`)

      this.cameras.main.shake(60, 0.0015)
      this.time.delayedCall(PLATFORM_PAUSE_MS, done)
    } else {
      this.time.delayedCall(40, done)
    }
  }

  _drawArrow(cx, cy, dir) {
    const v = dirVec(dir)
    const len = 36
    const g = this.add.graphics().setDepth(11)
    const ex = cx + v.x * len, ey = cy + v.y * len
    // Shadow
    g.lineStyle(9, C.BLACK, 1)
    g.beginPath(); g.moveTo(cx + v.x * 16, cy + v.y * 16); g.lineTo(ex, ey); g.strokePath()
    // Fill
    g.lineStyle(5, ACCENT.num, 1)
    g.beginPath(); g.moveTo(cx + v.x * 16, cy + v.y * 16); g.lineTo(ex, ey); g.strokePath()
    // Arrowhead
    const perpX = -v.y, perpY = v.x
    g.fillStyle(C.BLACK, 1)
    g.fillTriangle(
      ex + v.x * 8, ey + v.y * 8,
      ex - v.x * 4 + perpX * 7, ey - v.y * 4 + perpY * 7,
      ex - v.x * 4 - perpX * 7, ey - v.y * 4 - perpY * 7,
    )
    g.fillStyle(ACCENT.num, 1)
    g.fillTriangle(
      ex + v.x * 5, ey + v.y * 5,
      ex - v.x * 3 + perpX * 5, ey - v.y * 3 + perpY * 5,
      ex - v.x * 3 - perpX * 5, ey - v.y * 3 - perpY * 5,
    )
    // Fade out after pause
    this.tweens.add({ targets: g, alpha: 0, duration: 600, delay: PLATFORM_PAUSE_MS - 200 })
    return g
  }

  _onLandingHit(isWatch, done) {
    const center = this._cellCenter(LANDING_ZONE.col, LANDING_ZONE.row)
    this.cameras.main.shake(140, 0.004)

    // Burst of acid green
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2
      const speed = 50 + Math.random() * 60
      const dot = this.add.circle(center.x, center.y, 3 + Math.random() * 2, ACCENT.num, 0.9).setDepth(9)
      this.tweens.add({
        targets: dot,
        x: center.x + Math.cos(a) * speed,
        y: center.y + Math.sin(a) * speed,
        alpha: 0,
        duration: 500 + Math.random() * 300,
        onComplete: () => dot.destroy(),
      })
    }

    if (isWatch) {
      if (this._watchYear) this._watchYear.setText('2026')
      if (this._watchLabel) this._watchLabel.setText('HIRE ME.')
      if (this._watchStep) this._watchStep.setText('END OF PATH')
      this.time.delayedCall(1600, done)
    } else {
      this.time.delayedCall(120, done)
    }
  }

  _endPhaseWatch() {
    if (this._phase !== 'WATCH') return
    this._phase = 'TRANSITION'

    PLATFORMS.forEach(p => {
      if (p._graphic) this.tweens.add({ targets: p._graphic, alpha: 0, duration: 700 })
    })
    this._trailDots.forEach(d => this.tweens.add({ targets: d, alpha: 0, duration: 700, onComplete: () => d.destroy() }))
    this._trailDots = []

    this.time.delayedCall(800, () => {
      this._clearPhaseObjects()
      PLATFORMS.forEach(p => { p._graphic = null })

      BrutalUI.showNarrative(this, 640, 360, 760, 240,
        'PHASE 2 — RECALL\n\nDRAG PLATFORMS FROM THE TRAY ONTO THE GRID.\nCLICK A PLACED PLATFORM TO ROTATE ITS ANGLE.\n\nHIT "LOCK IN" WHEN READY.',
        () => this._startPhaseRecall(),
        { fill: C.BONE, accentColor: ACCENT.num, fontSize: '16px' },
      )
    })
  }

  // =================== PHASE 2: RECALL ===================

  _startPhaseRecall() {
    this._phase = 'RECALL'
    this._placements = new Map()

    this._drawGrid()
    this._drawEntryExit()
    this._drawRecallPanel()

    this._timeLeft = RECALL_TIME
    this._timerEvent = this.time.addEvent({
      delay: 1000,
      repeat: RECALL_TIME - 1,
      callback: () => this._tickTimer(),
    })

    this._buildTray()
  }

  _drawRecallPanel() {
    // Header strip over the grid
    const hdr = this.add.text(GRID.originX, GRID.originY - 52, 'PHASE 2 — RECALL', {
      fontFamily: FONT_MONO, fontSize: '12px', fontStyle: 'bold', color: ACCENT.hex,
      letterSpacing: 3,
    })
    this._addPhaseObject(hdr)

    const instr = this.add.text(GRID.originX, GRID.originY - 32, 'DRAG FROM TRAY →  CLICK TO ROTATE', {
      fontFamily: FONT_DISPLAY, fontSize: '18px', color: COLORS.BONE,
    })
    this._addPhaseObject(instr)

    // Tray frame on the right
    const trayX = 640, trayY = 140, trayW = 560, trayH = 480
    const frame = this.add.graphics()
    frame.fillStyle(C.BLACK, 1)
    frame.fillRect(trayX + 6, trayY + 6, trayW, trayH)
    frame.fillStyle(C.BONE, 1)
    frame.fillRect(trayX, trayY, trayW, trayH)
    frame.lineStyle(4, C.BLACK, 1)
    frame.strokeRect(trayX, trayY, trayW, trayH)
    frame.fillStyle(ACCENT.num, 1)
    frame.fillRect(trayX, trayY, trayW, 8)
    this._addPhaseObject(frame)

    const trayHdr = this.add.text(trayX + 20, trayY + 24, 'TRAY — 9 MILESTONES', {
      fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: COLORS.GREY_700,
      letterSpacing: 3,
    })
    this._addPhaseObject(trayHdr)

    // Timer
    this._timerBadge = this.add.graphics()
    this._timerBadge.fillStyle(C.BLACK, 1)
    this._timerBadge.fillRect(trayX + trayW - 108, trayY + 18, 90, 36)
    this._addPhaseObject(this._timerBadge)

    this._timerText = this.add.text(trayX + trayW - 63, trayY + 36, '0:45', {
      fontFamily: FONT_DISPLAY, fontSize: '20px', color: ACCENT.hex,
    }).setOrigin(0.5)
    this._addPhaseObject(this._timerText)

    // Buttons at bottom of tray
    const btnY = trayY + trayH - 40
    const reset = BrutalUI.drawButton(this, trayX + 110, btnY, 160, 44, 'RESET', () => this._resetAllPieces(), {
      fill: C.GREY_700, labelColor: COLORS.BONE, fontSize: '14px',
    })
    this._addPhaseObject(reset.container); this._addPhaseObject(reset.hit)

    const lock = BrutalUI.drawButton(this, trayX + 320, btnY, 220, 44, 'LOCK IN ANSWERS', () => this._endPhaseRecall(), {
      fill: ACCENT.num, labelColor: COLORS.BLACK, fontSize: '14px',
    })
    this._addPhaseObject(lock.container); this._addPhaseObject(lock.hit)
  }

  _buildTray() {
    const shuffled = [...PLATFORMS].sort(() => Math.random() - 0.5)
    const trayX0 = 660, trayY0 = 180
    const cardW = 240, cardH = 56, gap = 8
    const cols = 2

    this._trayPieces = []
    shuffled.forEach((plat, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const tx = trayX0 + col * (cardW + 16)
      const ty = trayY0 + row * (cardH + gap)
      const startAngle = Math.random() < 0.5 ? '/' : '\\'
      const piece = this._createTrayPiece(plat, tx, ty, cardW, cardH, startAngle)
      this._trayPieces.push(piece)
      this._addPhaseObject(piece.container)
    })
  }

  _tickTimer() {
    this._timeLeft--
    if (this._timeLeft < 0) this._timeLeft = 0
    const m = Math.floor(this._timeLeft / 60)
    const s = this._timeLeft % 60
    if (this._timerText) this._timerText.setText(`${m}:${s.toString().padStart(2, '0')}`)
    if (this._timeLeft <= 10 && this._timerText) this._timerText.setColor(COLORS.SHOCK_RED)
    if (this._timeLeft <= 0) this._endPhaseRecall()
  }

  _createTrayPiece(plat, tx, ty, w, h, startAngle) {
    const container = this.add.container(tx, ty)

    const shadow = this.add.graphics()
    shadow.fillStyle(C.BLACK, 1)
    shadow.fillRect(4, 4, w, h)

    const bg = this.add.rectangle(0, 0, w, h, 0xf5f0e6, 1).setOrigin(0, 0)
    bg.setStrokeStyle(3, 0x0a0a0a, 1)

    const angleBadge = this.add.graphics()
    angleBadge.fillStyle(C.BLACK, 1)
    angleBadge.fillRect(w - 44, 0, 44, h)

    const angleText = this.add.text(w - 22, h / 2, startAngle === '/' ? '/' : '\\', {
      fontFamily: FONT_DISPLAY, fontSize: '26px', color: ACCENT.hex,
    }).setOrigin(0.5)

    const label = this.add.text(14, h / 2 - 8, plat.label, {
      fontFamily: FONT_DISPLAY, fontSize: '14px', color: COLORS.BLACK,
      wordWrap: { width: w - 60 },
    }).setOrigin(0, 0.5)

    const year = this.add.text(14, h - 10, plat.year, {
      fontFamily: FONT_MONO, fontSize: '10px', fontStyle: 'bold', color: COLORS.GREY_700,
      letterSpacing: 2,
    }).setOrigin(0, 1)

    container.add([shadow, bg, angleBadge, angleText, label, year])
    container.setSize(w, h)

    const piece = {
      container, bg, shadow, label, year, angleText, angleBadge,
      platform: plat,
      angle: startAngle,
      placed: false,
      homeX: tx, homeY: ty,
      cellKey: null,
      width: w, height: h,
    }

    const toggleAngle = () => {
      piece.angle = piece.angle === '/' ? '\\' : '/'
      angleText.setText(piece.angle === '/' ? '/' : '\\')
      AudioCtx.fx('click')
      this.tweens.add({ targets: angleText, scale: { from: 0.5, to: 1 }, duration: 150 })
    }

    bg.setInteractive({ useHandCursor: true, draggable: true })
    this.input.setDraggable(bg)

    let lastClick = 0
    bg.on('pointerdown', () => {
      const now = this.time.now
      if (now - lastClick < 350) toggleAngle()
      lastClick = now
    })

    bg.on('dragstart', () => {
      container.setDepth(100)
      if (piece.placed) this._removePlacement(piece)
    })

    bg.on('drag', (pointer) => {
      container.setPosition(pointer.x - piece.width / 2, pointer.y - piece.height / 2)
      this._highlightCell(pointer.x, pointer.y)
    })

    bg.on('dragend', (pointer) => {
      container.setDepth(0)
      this._clearCellHighlight()
      const gx = pointer.x, gy = pointer.y
      const col = Math.floor((gx - GRID.originX) / GRID.cellSize)
      const row = Math.floor((gy - GRID.originY) / GRID.cellSize)
      if (col >= 0 && col < GRID.cols && row >= 0 && row < GRID.rows) {
        const key = `${col},${row}`
        if (!this._placements.has(key)) {
          this._placePieceAt(piece, col, row)
          return
        }
      }
      this._returnPieceHome(piece)
    })

    return piece
  }

  _highlightCell(px, py) {
    if (!this._cellHL) this._cellHL = this.add.graphics().setDepth(2)
    this._cellHL.clear()
    const col = Math.floor((px - GRID.originX) / GRID.cellSize)
    const row = Math.floor((py - GRID.originY) / GRID.cellSize)
    if (col < 0 || col >= GRID.cols || row < 0 || row >= GRID.rows) return
    const x = GRID.originX + col * GRID.cellSize
    const y = GRID.originY + row * GRID.cellSize
    const occupied = this._placements.has(`${col},${row}`)
    this._cellHL.fillStyle(occupied ? C.SHOCK_RED : ACCENT.num, 0.35)
    this._cellHL.fillRect(x + 2, y + 2, GRID.cellSize - 4, GRID.cellSize - 4)
  }

  _clearCellHighlight() {
    if (this._cellHL) this._cellHL.clear()
  }

  _placePieceAt(piece, col, row) {
    const center = this._cellCenter(col, row)
    const size = GRID.cellSize - 4
    piece.placed = true
    piece.cellKey = `${col},${row}`
    this._placements.set(piece.cellKey, piece)

    AudioCtx.fx('place')

    this.tweens.add({
      targets: piece.container,
      x: center.x - size / 2,
      y: center.y - size / 2,
      duration: 180,
      ease: 'Back.easeOut',
    })

    // Compact: shrink card to single cell, show only the angle glyph + tiny label
    piece.bg.setSize(size, size)
    piece.bg.setFillStyle(0xf5f0e6, 1)
    piece.bg.setStrokeStyle(3, 0x0a0a0a, 1)
    piece.shadow.clear()
    piece.shadow.fillStyle(C.BLACK, 1)
    piece.shadow.fillRect(3, 3, size, size)
    piece.angleBadge.clear()
    piece.angleBadge.fillStyle(ACCENT.num, 1)
    piece.angleBadge.fillRect(0, 0, size, 14)
    piece.angleText.setPosition(size / 2, size / 2 + 4).setFontSize(34).setColor(COLORS.BLACK)
    piece.label.setPosition(size / 2, size - 6).setOrigin(0.5, 1).setFontSize(7).setWordWrapWidth(size - 4)
    piece.year.setVisible(false)
  }

  _removePlacement(piece) {
    if (!piece.cellKey) return
    this._placements.delete(piece.cellKey)
    piece.cellKey = null
    piece.placed = false
    const w = piece.width, h = piece.height
    piece.bg.setSize(w, h)
    piece.bg.setStrokeStyle(3, 0x0a0a0a, 1)
    piece.shadow.clear()
    piece.shadow.fillStyle(C.BLACK, 1)
    piece.shadow.fillRect(4, 4, w, h)
    piece.angleBadge.clear()
    piece.angleBadge.fillStyle(C.BLACK, 1)
    piece.angleBadge.fillRect(w - 44, 0, 44, h)
    piece.angleText.setPosition(w - 22, h / 2).setFontSize(26).setColor(ACCENT.hex)
    piece.label.setPosition(14, h / 2 - 8).setOrigin(0, 0.5).setFontSize(14).setWordWrapWidth(w - 60)
    piece.year.setVisible(true).setPosition(14, h - 10)
  }

  _returnPieceHome(piece) {
    AudioCtx.fx('click')
    this.tweens.add({
      targets: piece.container,
      x: piece.homeX,
      y: piece.homeY,
      duration: 200,
      ease: 'Back.easeOut',
    })
  }

  _resetAllPieces() {
    if (this._phase !== 'RECALL') return
    this._trayPieces.forEach(p => {
      if (p.placed) this._removePlacement(p)
      this._returnPieceHome(p)
    })
  }

  _endPhaseRecall() {
    if (this._phase !== 'RECALL') return
    this._phase = 'TRANSITION'
    AudioCtx.fx('lockIn')
    this.cameras.main.shake(120, 0.008)
    if (this._timerEvent) { this._timerEvent.remove(false); this._timerEvent = null }

    this._finalPlacements = new Map()
    this._trayPieces.forEach(p => {
      if (p.placed && p.cellKey) {
        const [c, r] = p.cellKey.split(',').map(Number)
        this._finalPlacements.set(p.platform.id, { col: c, row: r, angle: p.angle, piece: p })
      }
    })

    // Clean: fade away unused tray pieces, keep placed pieces visible
    this._trayPieces.forEach(p => {
      if (!p.placed) {
        this.tweens.add({
          targets: p.container, alpha: 0, duration: 300,
          onComplete: () => { if (p.container && p.container.destroy) p.container.destroy() },
        })
      }
    })

    if (this._cellHL) { this._cellHL.destroy(); this._cellHL = null }

    this.time.delayedCall(600, () => {
      BrutalUI.showNarrative(this, 640, 360, 760, 220,
        'PHASE 3 — VERIFY\n\nBALL DROPS AGAIN.\nEACH PLATFORM GETS STAMPED:\nCORRECT · CLOSE · WRONG.',
        () => this._startPhaseVerify(),
        { fill: C.BONE, accentColor: ACCENT.num, fontSize: '16px' },
      )
    })
  }

  // =================== PHASE 3: VERIFY ===================

  _startPhaseVerify() {
    this._phase = 'VERIFY'
    this._score = 0

    // Clear non-grid phase leftovers but KEEP placed pieces (in _finalPlacements)
    // We rebuild the grid & panel, then evaluate
    const placedContainers = []
    this._trayPieces.forEach(p => { if (p.placed) placedContainers.push(p) })

    // Drop the old phase objects (grid + panel were added previously)
    this._clearPhaseObjects()

    this._drawGrid()
    this._drawEntryExit()
    this._drawVerifyPanel()

    // Draw the CORRECT answer lightly underneath (the "real" path) so CORRECT stamps feel earned
    // Actually we draw on evaluation, not preemptively.

    const start = this._cellCenter(1, 0)
    this._ball = this.add.image(start.x, GRID.originY - 60, 'l5ball').setDepth(10)
    this._addPhaseObject(this._ball)

    // Re-add placed piece containers to phase cleanup so they get wiped at end
    placedContainers.forEach(p => this._addPhaseObject(p.container))

    const path = this._buildPath()
    this._verifyIdx = 0
    this._verifyPath = path
    this._verifyEvaluated = new Set()
    this._verifyStep()
  }

  _drawVerifyPanel() {
    const px = 640, py = 140, pw = 560, ph = 480
    const panel = this.add.graphics()
    panel.fillStyle(C.BLACK, 1)
    panel.fillRect(px + 8, py + 8, pw, ph)
    panel.fillStyle(C.BONE, 1)
    panel.fillRect(px, py, pw, ph)
    panel.lineStyle(4, C.BLACK, 1)
    panel.strokeRect(px, py, pw, ph)
    panel.fillStyle(ACCENT.num, 1)
    panel.fillRect(px, py, pw, 10)
    this._addPhaseObject(panel)

    const hdr = this.add.text(px + 24, py + 30, 'PHASE 3 — VERIFY', {
      fontFamily: FONT_MONO, fontSize: '12px', fontStyle: 'bold', color: COLORS.GREY_700,
      letterSpacing: 3,
    })
    this._addPhaseObject(hdr)

    this._verifyTitle = this.add.text(px + 24, py + 54, 'EVALUATING...', {
      fontFamily: FONT_DISPLAY, fontSize: '32px', color: COLORS.BLACK,
    })
    this._addPhaseObject(this._verifyTitle)

    // Score
    const scoreLbl = this.add.text(px + 24, py + 140, 'SCORE', {
      fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: COLORS.GREY_700,
      letterSpacing: 3,
    })
    this._addPhaseObject(scoreLbl)

    this._scoreDisplay = this.add.text(px + 24, py + 160, '0', {
      fontFamily: FONT_DISPLAY, fontSize: '88px', color: COLORS.BLACK,
    })
    this._addPhaseObject(this._scoreDisplay)

    this._verifyLine = this.add.text(px + 24, py + 280, '', {
      fontFamily: FONT_MONO, fontSize: '14px', fontStyle: 'bold', color: COLORS.BLACK,
      wordWrap: { width: pw - 48 },
    })
    this._addPhaseObject(this._verifyLine)
  }

  _verifyStep() {
    if (this._phase !== 'VERIFY') return
    if (this._verifyIdx >= this._verifyPath.length) {
      // After the ball has traced its trajectory, also evaluate any platforms the ball never reached
      PLATFORMS.forEach(p => {
        if (!this._verifyEvaluated.has(p.id)) {
          this._evaluatePlatform(p, () => {}, true)
        }
      })
      this.time.delayedCall(800, () => this._finishVerify())
      return
    }
    const node = this._verifyPath[this._verifyIdx]
    const target = this._cellCenter(node.col, node.row)
    this.tweens.add({
      targets: this._ball,
      x: target.x,
      y: target.y,
      duration: VERIFY_CELL_MS,
      ease: 'Linear',
      onComplete: () => {
        if (node.platform) {
          this._evaluatePlatform(node.platform, () => { this._verifyIdx++; this._verifyStep() }, false)
        } else if (node.isLanding) {
          this._onLandingHit(false, () => { this._verifyIdx++; this._verifyStep() })
        } else {
          this._verifyIdx++
          this._verifyStep()
        }
      },
    })
  }

  _evaluatePlatform(plat, done, silent) {
    if (this._verifyEvaluated.has(plat.id)) { if (done) done(); return }
    this._verifyEvaluated.add(plat.id)

    const center = this._cellCenter(plat.col, plat.row)
    const placement = this._finalPlacements.get(plat.id)

    let status = 'MISSING'
    if (placement) {
      if (placement.col === plat.col && placement.row === plat.row) {
        status = placement.angle === plat.angle ? 'CORRECT' : 'PARTIAL'
      } else {
        status = 'WRONG_POS'
      }
    }

    let gained = 0
    if (status === 'CORRECT') gained = 11
    else if (status === 'PARTIAL') gained = 4

    this._score += gained
    if (this._scoreDisplay) this._scoreDisplay.setText(`${this._score}`)

    // Stamp + feedback
    let stampLabel, stampFill, lineText, lineColor
    if (status === 'CORRECT') {
      stampLabel = 'CORRECT'; stampFill = ACCENT.num; lineText = `${plat.label} — +11`; lineColor = ACCENT.hex
      if (!silent) AudioCtx.fx('correct')
      Particles.burst(this, center.x, center.y, C.SHOCK_ACID, 8)
    } else if (status === 'PARTIAL') {
      stampLabel = 'CLOSE'; stampFill = C.HAZARD_YELLOW; lineText = `${plat.label} — +4 ANGLE OFF`; lineColor = COLORS.HAZARD_YELLOW
      if (!silent) AudioCtx.fx('click')
      Particles.burst(this, center.x, center.y, C.HAZARD_YELLOW, 6)
    } else if (status === 'WRONG_POS') {
      stampLabel = 'WRONG'; stampFill = C.SHOCK_RED; lineText = `${plat.label} — WRONG SPOT`; lineColor = COLORS.SHOCK_RED
      if (!silent) AudioCtx.fx('wrong')
      Particles.burst(this, center.x, center.y, C.SHOCK_RED, 6)
    } else {
      stampLabel = 'MISSED'; stampFill = C.GREY_500; lineText = `${plat.label} — MISSED`; lineColor = COLORS.GREY_500
      if (!silent) AudioCtx.fx('wrong')
    }

    // Draw the real platform as a ghost at its true location
    if (status !== 'CORRECT') {
      const ghost = this._drawPlatform(plat.col, plat.row, plat.angle, ACCENT.num, 4)
      ghost.setAlpha(0.55)
      this._addPhaseObject(ghost)
    } else {
      const real = this._drawPlatform(plat.col, plat.row, plat.angle, ACCENT.num, 5)
      this._addPhaseObject(real)
    }

    const sticker = BrutalUI.drawSticker(this, center.x, center.y - GRID.cellSize / 2 - 18, stampLabel, {
      fill: stampFill, textColor: COLORS.BLACK, fontSize: '11px',
      rotation: (Math.random() * 16 - 8) * Math.PI / 180,
    })
    sticker.setDepth(15).setScale(0)
    this._addPhaseObject(sticker)
    this.tweens.add({ targets: sticker, scale: 1, duration: 180, ease: 'Back.easeOut' })

    if (!silent && this._verifyLine) {
      this._verifyLine.setText(lineText)
      this._verifyLine.setColor(lineColor)
    }
    if (!silent) this.cameras.main.shake(50, 0.0015)
    if (!silent) this.time.delayedCall(420, done)
    else if (done) done()
  }

  _finishVerify() {
    const allCorrect = PLATFORMS.every(p => {
      const pl = this._finalPlacements.get(p.id)
      return pl && pl.col === p.col && pl.row === p.row && pl.angle === p.angle
    })
    if (allCorrect) {
      this._score += 1
      if (this._scoreDisplay) this._scoreDisplay.setText(`${this._score}`)
    }
    const finalScore = Math.min(100, this._score)
    completeLevel(this, KEYS.SCORE_L5, KEYS.COMPLETED_L5, finalScore)
    this._score = finalScore

    // Best time + play time
    const elapsedMs = (this._gameStartMs != null) ? (this.time.now - this._gameStartMs) : 0
    this._elapsedMs = elapsedMs
    this._isNewBest = false
    if (elapsedMs > 0) {
      this._isNewBest = recordBestTime(this, KEYS.BEST_T5, elapsedMs)
      addPlayTime(this, elapsedMs)
    }

    if (allCorrect) {
      AudioCtx.fx('perfect')
      this.cameras.main.shake(600, 0.020)
      Particles.confetti(this, 640, 360, 100)
      Particles.ring(this, 640, 360, C.SHOCK_ACID, { maxRadius: 500 })
    }

    this.time.delayedCall(1200, () => this._showCompletionScreen(allCorrect))
  }

  // =================== FINALE: CTA SCREEN ===================

  _showCompletionScreen(perfect) {
    this._phase = 'COMPLETE'
    const cam = this.cameras.main
    cam.fadeOut(500, 10, 10, 10)
    cam.once('camerafadeoutcomplete', () => {
      this.children.list.slice().forEach(o => { if (o && o.destroy) o.destroy() })
      cam.fadeIn(500, 10, 10, 10)
      this._drawCTA(perfect)
    })
  }

  _drawCTA(perfect) {
    const W = 1280, H = 720
    this._drawBackdrop()
    BrutalUI.drawScanlines(this, W, H, { alpha: 0.03 })

    BrutalUI.drawHomeButton(this)

    // Success cue
    AudioCtx.fx('success')

    // Big header "CAREER UNLOCKED" — letter-by-letter typewriter at 80ms/char
    const heroText = 'CAREER UNLOCKED'
    // Shadow underlay (full text, accent color, behind)
    const heroShadow = this.add.text(W / 2 + 6, 96 + 6, '', {
      fontFamily: FONT_DISPLAY, fontSize: '64px', color: ACCENT.hex,
    }).setOrigin(0.5)
    const heroMain = TextReveal.typewrite(this, heroText, {
      x: W / 2, y: 96,
      style: { fontFamily: FONT_DISPLAY, fontSize: '64px', color: COLORS.BONE },
      stepMs: 80, origin: 0.5,
      onComplete: () => { heroShadow.setText(heroText) },
    })
    // Keep shadow in sync as it types
    const heroSync = this.time.addEvent({
      delay: 40, loop: true,
      callback: () => {
        heroShadow.setText(heroMain.text)
        if (heroMain.text === heroText) heroSync.remove(false)
      },
    })

    // Personalized line
    const name = (this._playerName && this._playerName !== 'friend') ? this._playerName.toUpperCase() : 'YOU'
    this.add.text(W / 2, 146, `${name}, YOU NOW KNOW MY STORY.`, {
      fontFamily: FONT_MONO, fontSize: '14px', fontStyle: 'bold', color: COLORS.BONE,
      letterSpacing: 3, wordWrap: { width: W - 80 }, align: 'center',
    }).setOrigin(0.5)

    // Time display + NEW BEST tag
    if (this._elapsedMs != null && this._elapsedMs > 0) {
      const secs = Math.floor(this._elapsedMs / 1000)
      const mm = Math.floor(secs / 60)
      const ss = secs % 60
      const timeStr = `TIME ${mm}:${ss.toString().padStart(2, '0')}`
      const tTxt = this.add.text(W / 2, 168, timeStr, {
        fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: COLORS.GREY_300,
        letterSpacing: 3,
      }).setOrigin(0.5)
      if (this._isNewBest) {
        const tagX = tTxt.x + tTxt.width / 2 + 50
        const tag = BrutalUI.drawSticker(this, tagX, 168, 'NEW BEST!', {
          fill: ACCENT.num, textColor: COLORS.BLACK, fontSize: '10px',
          rotation: -6 * Math.PI / 180,
        })
        tag.setScale(0)
        this.tweens.add({ targets: tag, scale: 1, duration: 360, delay: 400, ease: 'Back.easeOut' })
      }
    }

    // Career timeline
    this._drawCareerTimeline(W)

    // Score + rating badge
    this._drawScoreBadge(W, perfect)

    // Stat bars
    this._drawStatBars(W)

    // CTAs
    this._drawCTAButtons(W)

    // VIEW FULL REPORT — only if all 5 levels complete
    const allDone = this.registry.get(KEYS.COMPLETED_L1) && this.registry.get(KEYS.COMPLETED_L2)
      && this.registry.get(KEYS.COMPLETED_L3) && this.registry.get(KEYS.COMPLETED_L4)
      && this.registry.get(KEYS.COMPLETED_L5)
    if (allDone) {
      const reportBtn = BrutalUI.drawButton(this, W / 2, H - 60, 280, 44, 'VIEW FULL REPORT', () => {
        AudioCtx.fx('click')
        BrutalUI.pageTurn(this, () => this.scene.start('FinalReportScene'))
      }, {
        fill: ACCENT.num, labelColor: COLORS.BLACK, fontSize: '14px', shadowOffset: 6,
      })
    }

    // Replay link
    const replay = this.add.text(W / 2, H - 24, '↻ REPLAY', {
      fontFamily: FONT_MONO, fontSize: '12px', fontStyle: 'bold', color: COLORS.GREY_300,
      letterSpacing: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    replay.on('pointerover', () => replay.setColor(ACCENT.hex))
    replay.on('pointerout', () => replay.setColor(COLORS.GREY_300))
    replay.on('pointerdown', () => {
      AudioCtx.fx('click')
      BrutalUI.pageTurn(this, () => this.scene.start('LevelSelectHub'))
    })
  }

  _drawCareerTimeline(W) {
    const nodes = [
      { label: 'LAW SCHOOL',       year: '2014' },
      { label: 'STARTUP WKND',     year: '2014' },
      { label: 'FIRST SALES',      year: '2015' },
      { label: 'LATIN AMERICA',    year: '2017' },
      { label: 'TRAINING DOCS',    year: '2018' },
      { label: '$1M ARR',          year: '2020' },
      { label: 'GREENLAND',        year: '2007' },
      { label: 'AGENCY LAUNCH',    year: '2023' },
      { label: 'CLAY/N8N/AI',      year: '2025' },
    ]
    const y = 204
    const padL = 60
    const padR = 180 // reserve room for "→ HIRE ME" label
    const pad = padL
    const step = (W - padL - padR) / (nodes.length - 1)

    // Connector line (thick bone)
    const g = this.add.graphics()
    g.lineStyle(4, C.BONE, 1)
    g.beginPath(); g.moveTo(padL, y); g.lineTo(W - padR, y); g.strokePath()
    // Accent overlay
    g.lineStyle(2, ACCENT.num, 1)
    g.beginPath(); g.moveTo(padL, y); g.lineTo(W - padR, y); g.strokePath()

    nodes.forEach((n, i) => {
      const x = pad + step * i
      const delay = 60 * i
      const node = this.add.graphics()
      node.fillStyle(C.BLACK, 1)
      node.fillCircle(x + 2, y + 2, 8)
      node.fillStyle(ACCENT.num, 1)
      node.fillCircle(x, y, 8)
      node.lineStyle(2, C.BLACK, 1)
      node.strokeCircle(x, y, 8)
      node.setAlpha(0)
      this.tweens.add({ targets: node, alpha: 1, duration: 200, delay })

      const year = this.add.text(x, y - 22, n.year, {
        fontFamily: FONT_MONO, fontSize: '10px', fontStyle: 'bold', color: COLORS.GREY_300,
        letterSpacing: 2,
      }).setOrigin(0.5).setAlpha(0)
      this.tweens.add({ targets: year, alpha: 1, duration: 200, delay })

      const label = this.add.text(x, y + 18, n.label, {
        fontFamily: FONT_MONO, fontSize: '9px', fontStyle: 'bold', color: COLORS.BONE,
        letterSpacing: 2, wordWrap: { width: step - 8 }, align: 'center',
      }).setOrigin(0.5, 0).setAlpha(0)
      this.tweens.add({ targets: label, alpha: 1, duration: 200, delay })
    })

    // Final HIRE ME marker
    const xEnd = W - padR
    const flag = this.add.text(xEnd + 24, y, '→ HIRE ME', {
      fontFamily: FONT_DISPLAY, fontSize: '16px', color: ACCENT.hex,
    }).setOrigin(0, 0.5).setAlpha(0)
    this.tweens.add({ targets: flag, alpha: 1, duration: 300, delay: 60 * nodes.length + 100 })
  }

  _drawScoreBadge(W, perfect) {
    const score = this._score
    const rating = this._getRating(score)

    const bx = W / 2, by = 320
    const bw = 540, bh = 110

    // Shadow
    const sh = this.add.graphics()
    sh.fillStyle(C.BLACK, 1)
    sh.fillRect(bx - bw / 2 + 8, by - bh / 2 + 8, bw, bh)

    // Body
    const body = this.add.graphics()
    body.fillStyle(C.BONE, 1)
    body.fillRect(bx - bw / 2, by - bh / 2, bw, bh)
    body.lineStyle(4, C.BLACK, 1)
    body.strokeRect(bx - bw / 2, by - bh / 2, bw, bh)
    body.fillStyle(ACCENT.num, 1)
    body.fillRect(bx - bw / 2, by - bh / 2, 14, bh)

    // Score value
    const val = this.add.text(bx - 130, by, '0', {
      fontFamily: FONT_DISPLAY, fontSize: '72px', color: COLORS.BLACK,
    }).setOrigin(0.5)
    this.tweens.addCounter({
      from: 0, to: score, duration: 1100, ease: 'Cubic.easeOut',
      onUpdate: (t) => val.setText(`${Math.floor(t.getValue())}`),
    })
    this.add.text(bx - 130, by + 40, '/ 100', {
      fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: COLORS.GREY_700,
      letterSpacing: 2,
    }).setOrigin(0.5)

    // Rating label
    this.add.text(bx + 80, by - 22, rating.label, {
      fontFamily: FONT_DISPLAY, fontSize: '42px', color: COLORS.BLACK,
    }).setOrigin(0.5)
    this.add.text(bx + 80, by + 18, rating.msg, {
      fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: COLORS.GREY_700,
      letterSpacing: 2, wordWrap: { width: 280 }, align: 'center',
    }).setOrigin(0.5)

    if (perfect) {
      const stamp = BrutalUI.drawSticker(this, bx + bw / 2 - 30, by - bh / 2 + 14, 'PERFECT', {
        fill: ACCENT.num, textColor: COLORS.BLACK, fontSize: '12px',
        rotation: 10 * Math.PI / 180,
      })
      stamp.setDepth(20).setScale(0)
      this.tweens.add({ targets: stamp, scale: 1, duration: 400, delay: 800, ease: 'Back.easeOut' })
    }
  }

  _drawStatBars(W) {
    const stats = [
      { label: 'CURIOSITY',    key: KEYS.STAT_CURIOSITY },
      { label: 'SALES',        key: KEYS.STAT_SALES },
      { label: 'EQ',           key: KEYS.STAT_EQ },
      { label: 'GRIT',         key: KEYS.STAT_GRIT },
      { label: 'INDEPENDENCE', key: KEYS.STAT_INDEPENDENCE },
      { label: 'TECH',         key: KEYS.STAT_TECH },
    ]
    const startY = 420
    const rowH = 30
    const colW = 480
    const gapX = 40
    const totalW = colW * 2 + gapX
    const startX = (W - totalW) / 2

    stats.forEach((s, i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const x = startX + col * (colW + gapX)
      const y = startY + row * rowH
      const raw = this.registry.get(s.key) ?? 0
      const val = Math.max(0, Math.min(100, raw))

      this.add.text(x, y, s.label, {
        fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: COLORS.BONE,
        letterSpacing: 3,
      }).setOrigin(0, 0.5)

      const barX = x + 140
      const barW = colW - 180
      const barH = 14

      // Bone track
      const track = this.add.graphics()
      track.lineStyle(2, C.BONE, 1)
      track.strokeRect(barX, y - barH / 2, barW, barH)
      // Inner bone (translucent)
      track.fillStyle(C.BONE, 0.08)
      track.fillRect(barX + 1, y - barH / 2 + 1, barW - 2, barH - 2)

      // Acid fill
      const fillG = this.add.graphics()
      const targetW = Math.max(0, (val / 100) * (barW - 4))
      fillG.fillStyle(ACCENT.num, 1)
      fillG.fillRect(barX + 2, y - barH / 2 + 2, 0, barH - 4)

      const valTxt = this.add.text(barX + barW + 10, y, '0', {
        fontFamily: FONT_DISPLAY, fontSize: '18px', color: COLORS.BONE,
      }).setOrigin(0, 0.5)

      const state = { w: 0 }
      this.tweens.add({
        targets: state, w: targetW, duration: 900, delay: 200 + 90 * i, ease: 'Cubic.easeOut',
        onUpdate: () => {
          fillG.clear()
          fillG.fillStyle(ACCENT.num, 1)
          fillG.fillRect(barX + 2, y - barH / 2 + 2, state.w, barH - 4)
        },
      })
      this.tweens.addCounter({
        from: 0, to: val, duration: 900, delay: 200 + 90 * i,
        onUpdate: (t) => valTxt.setText(`${Math.floor(t.getValue())}`),
      })
    })
  }

  _drawCTAButtons(W) {
    const y = 608
    const btnW = 280, btnH = 68
    const gap = 32
    const total = btnW * 3 + gap * 2
    const startX = (W - total) / 2 + btnW / 2

    // BOOK A CALL — acid fill, black text (primary)
    const a = BrutalUI.drawButton(this, startX, y, btnW, btnH, 'BOOK A CALL', () => {
      window.open('https://cal.com/augustinr/30min', '_blank')
    }, {
      fill: ACCENT.num, labelColor: COLORS.BLACK, fontSize: '20px', shadowOffset: 8,
    })

    // LINKEDIN — bone fill, black text
    BrutalUI.drawButton(this, startX + btnW + gap, y, btnW, btnH, 'LINKEDIN', () => {
      window.open('https://www.linkedin.com/in/augustinr/', '_blank')
    }, {
      fill: C.BONE, labelColor: COLORS.BLACK, fontSize: '20px', shadowOffset: 8,
    })

    // CV — black fill, bone text with acid border accent
    BrutalUI.drawButton(this, startX + (btnW + gap) * 2, y, btnW, btnH, 'DOWNLOAD CV', () => {
      window.open('/cv.pdf', '_blank')
    }, {
      fill: C.BLACK, labelColor: COLORS.BONE, fontSize: '20px', shadowOffset: 8,
    })
  }

  _getRating(score) {
    if (score >= 95) return { label: 'PERFECT', msg: 'FLAWLESS. YOU ABSORBED IT ALL.' }
    if (score >= 75) return { label: 'STRONG',  msg: 'YOU CAUGHT THE ARC. CLEAR SIGNAL.' }
    if (score >= 50) return { label: 'SOLID',   msg: 'THE STORY STUCK. MOST OF IT.' }
    if (score >= 25) return { label: 'OK',      msg: 'SOME PIECES LANDED. WORTH A REPLAY.' }
    return { label: 'REPLAY',  msg: 'THE PATH IS STILL FUZZY.' }
  }
}
