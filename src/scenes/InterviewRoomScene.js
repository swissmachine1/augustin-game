import * as Phaser from 'phaser'
import { KEYS } from '../systems/GameRegistry.js'
import { completeLevel } from './LevelSelectHub.js'
import { COLORS, TEXT, C, FONT, FONT_DISPLAY, FONT_HAND } from '../config/theme.js'
import { JournalUI } from '../ui/JournalUI.js'

const GRID = { cols: 8, rows: 8, cellSize: 60, originX: 160, originY: 100 }
const BALL_SPEED = 180
const CELL_MOVE_MS = (GRID.cellSize / BALL_SPEED) * 1000
const RECALL_TIME = 45

const PLATFORMS = [
  { id: 0, label: 'Law School',      shortLabel: 'Law School',    year: '2014', col: 1, row: 0, angle: '\\', oneLiner: '2014 — International law in Shanghai. Row 4, back left. Mind elsewhere.' },
  { id: 1, label: 'Startup Weekend', shortLabel: 'Startup Wknd',  year: '2014', col: 5, row: 0, angle: '\\', oneLiner: '48 hours. One pitch. Everything changed.' },
  { id: 2, label: 'First Sales Job', shortLabel: 'First Sales',   year: '2015', col: 5, row: 2, angle: '/',  oneLiner: 'First tech job. First cold call. First "no." Then the first "yes."' },
  { id: 3, label: 'LatAm Move',      shortLabel: 'LatAm Move',    year: '2017', col: 2, row: 2, angle: '/',  oneLiner: 'No Spanish. No network. Just a suitcase and a quota.' },
  { id: 4, label: 'Training KOLs',   shortLabel: 'Training KOLs', year: '2018', col: 2, row: 4, angle: '\\', oneLiner: "You can't hard-sell a surgeon. So I learned to teach." },
  { id: 5, label: '$1M ARR',         shortLabel: '$1M ARR',       year: '2020', col: 6, row: 4, angle: '\\', oneLiner: '11 countries. 200 doctors. One million in recurring revenue.' },
  { id: 6, label: 'Greenland',       shortLabel: 'Greenland',     year: '2007', col: 6, row: 6, angle: '/',  oneLiner: "Icebergs, wild dogs, dengue. Some grit you can't learn in an office." },
  { id: 7, label: 'Agency Launch',   shortLabel: 'Agency Launch', year: '2023', col: 3, row: 6, angle: '/',  oneLiner: 'Went solo. Built systems for clients across 3 continents.' },
  { id: 8, label: 'AI Tools',        shortLabel: 'AI Tools',      year: '2025', col: 3, row: 7, angle: '\\', oneLiner: 'Clay, n8n, GPT. The GTM stack that makes one person feel like ten.' },
]

const LANDING_ZONE = { col: 6, row: 7, label: 'HIRE ME' }

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

    this._ctxHandler = (e) => e.preventDefault()
    this.game.canvas.addEventListener('contextmenu', this._ctxHandler)

    this._escKey = this.input.keyboard.addKey('ESC')
    this._spaceKey = this.input.keyboard.addKey('SPACE')
    this._rKey = this.input.keyboard.addKey('R')

    this._escHandler = () => this._returnToHub()
    this._escKey.on('down', this._escHandler)

    JournalUI.drawParchment(this, 0, 0, 1280, 720)
    JournalUI.drawGrain(this, 0, 0, 1280, 720, 0.06)
    JournalUI.drawPageNumber(this, 10)

    this.add.text(40, 30, 'CHAPTER 5', { ...TEXT.label, fontSize: '12px' })
    this.add.text(40, 48, 'Pinball Recall', { ...TEXT.chapter, fontSize: '28px' })
    this.add.text(40, 82, 'Trace the path. Rebuild from memory.', { ...TEXT.bodyItalic, fontSize: '13px', color: COLORS.INK_LIGHT })

    this._gridGraphics = this.add.graphics()
    this._drawGrid()
    this._drawEntryExit()
    this._createBallTexture()

    this.events.once('shutdown', () => this._cleanup())

    this.time.delayedCall(800, () => this._startPhaseWatch())
  }

  _cleanup() {
    if (this._ctxHandler) {
      this.game.canvas.removeEventListener('contextmenu', this._ctxHandler)
      this._ctxHandler = null
    }
    if (this._timerEvent) this._timerEvent.remove(false)
    if (this._escKey && this._escHandler) this._escKey.off('down', this._escHandler)
    if (this._spaceKey && this._spaceHandler) this._spaceKey.off('down', this._spaceHandler)
    if (this._spaceKey && this._spaceReplay) this._spaceKey.off('down', this._spaceReplay)
    if (this._rKey && this._rHandler) this._rKey.off('down', this._rHandler)
    this._trailDots = []
  }

  _returnToHub() {
    this.scene.start('LevelSelectHub')
  }

  _cellCenter(col, row) {
    return {
      x: GRID.originX + col * GRID.cellSize + GRID.cellSize / 2,
      y: GRID.originY + row * GRID.cellSize + GRID.cellSize / 2,
    }
  }

  _drawGrid() {
    const g = this._gridGraphics
    const { cols, rows, cellSize, originX, originY } = GRID

    g.fillStyle(C.PARCHMENT_DARK, 0.25)
    g.fillRect(originX, originY, cols * cellSize, rows * cellSize)

    g.lineStyle(0.5, C.INK, 0.15)
    for (let c = 0; c <= cols; c++) {
      const x = originX + c * cellSize
      g.beginPath()
      g.moveTo(x, originY)
      g.lineTo(x, originY + rows * cellSize)
      g.strokePath()
    }
    for (let r = 0; r <= rows; r++) {
      const y = originY + r * cellSize
      g.beginPath()
      g.moveTo(originX, y)
      g.lineTo(originX + cols * cellSize, y)
      g.strokePath()
    }

    g.fillStyle(C.INK, 0.18)
    for (let c = 0; c <= cols; c++) {
      for (let r = 0; r <= rows; r++) {
        g.fillCircle(originX + c * cellSize, originY + r * cellSize, 1.6)
      }
    }

    g.lineStyle(1.5, C.INK, 0.4)
    g.strokeRect(originX - 2, originY - 2, cols * cellSize + 4, rows * cellSize + 4)

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
  }

  _drawEntryExit() {
    const entry = this._cellCenter(1, 0)
    const g = this.add.graphics()
    g.lineStyle(1.2, C.INK, 0.6)
    g.beginPath()
    g.moveTo(entry.x - 8, GRID.originY - 18)
    g.lineTo(entry.x, GRID.originY - 4)
    g.lineTo(entry.x + 8, GRID.originY - 18)
    g.strokePath()
    this.add.text(entry.x, GRID.originY - 30, 'START', { ...TEXT.label, fontSize: '10px' }).setOrigin(0.5)

    const exit = this._cellCenter(LANDING_ZONE.col, LANDING_ZONE.row)
    this._landingSeal = JournalUI.drawWaxSeal(this, exit.x, exit.y + 2, 'H', 18)
    this.add.text(exit.x, GRID.originY + GRID.rows * GRID.cellSize + 18, 'HIRE ME', { ...TEXT.label, fontSize: '11px', fontStyle: 'bold italic', color: COLORS.WAX_RED }).setOrigin(0.5)
  }

  _createBallTexture() {
    if (this.textures.exists('l5ball')) return
    const g = this.add.graphics()
    g.fillStyle(C.WAX_RED, 1)
    g.fillCircle(10, 10, 8)
    g.fillStyle(C.WAX_RED_LIGHT, 1)
    g.fillCircle(8, 8, 4)
    g.fillStyle(0xffffff, 0.45)
    g.fillCircle(7, 7, 1.6)
    g.generateTexture('l5ball', 20, 20)
    g.destroy()
  }

  _drawPlatform(col, row, angle, color = C.INK, alpha = 0.85, thickness = 2.5) {
    const x = GRID.originX + col * GRID.cellSize
    const y = GRID.originY + row * GRID.cellSize
    const pad = 10
    const g = this.add.graphics()
    g.lineStyle(thickness, color, alpha)
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

    PLATFORMS.forEach(p => {
      const plat = this._drawPlatform(p.col, p.row, p.angle, C.INK, 0.85)
      this._addPhaseObject(plat)
      p._graphic = plat
      const center = this._cellCenter(p.col, p.row)
      const label = this.add.text(center.x, center.y + GRID.cellSize / 2 - 2, p.shortLabel, {
        ...TEXT.label, fontSize: '8px', color: COLORS.INK,
      }).setOrigin(0.5, 1)
      this._addPhaseObject(label)
      p._label = label
    })

    const instr = this.add.text(680, 120, 'Watch the ball trace\nAugustin’s career path.', {
      ...TEXT.bodyItalic, fontSize: '16px', color: COLORS.INK_LIGHT, wordWrap: { width: 540 },
    })
    this._addPhaseObject(instr)
    const subInstr = this.add.text(680, 170, 'Then rebuild it from memory.', {
      ...TEXT.body, fontSize: '13px', color: COLORS.INK_FADED,
    })
    this._addPhaseObject(subInstr)

    this._narrativeBox = this.add.graphics()
    this._narrativeBox.fillStyle(C.PARCHMENT_DARK, 0.2)
    this._narrativeBox.fillRect(680, 210, 560, 160)
    this._narrativeBox.lineStyle(0.5, C.INK, 0.25)
    this._narrativeBox.strokeRect(680, 210, 560, 160)
    this._addPhaseObject(this._narrativeBox)

    this._narrativeYear = this.add.text(700, 225, '', { ...TEXT.hand, fontSize: '28px', color: COLORS.INDIGO })
    this._narrativeText = this.add.text(700, 270, '', { ...TEXT.bodyItalic, fontSize: '16px', color: COLORS.INK, wordWrap: { width: 520 } })
    this._narrativeLabel = this.add.text(700, 340, '', { ...TEXT.label, fontSize: '11px', color: COLORS.INK_FADED })
    this._addPhaseObject(this._narrativeYear)
    this._addPhaseObject(this._narrativeText)
    this._addPhaseObject(this._narrativeLabel)

    const skip = this.add.text(1240, 690, 'SPACE to skip  ·  ESC for hub', {
      ...TEXT.small, fontSize: '10px',
    }).setOrigin(1, 1)
    this._addPhaseObject(skip)

    this._spaceHandler = () => this._skipWatch()
    this._spaceKey.on('down', this._spaceHandler)

    this.time.delayedCall(1200, () => this._runBallWatch())
  }

  _skipWatch() {
    if (this._phase !== 'WATCH') return
    this._ballTweens.forEach(t => { if (t && t.stop) t.stop() })
    this._ballTweens = []
    this._endPhaseWatch()
  }

  _runBallWatch() {
    const start = this._cellCenter(1, 0)
    this._ball = this.add.image(start.x, GRID.originY - 40, 'l5ball').setDepth(10)
    this._addPhaseObject(this._ball)

    const path = this._buildPath()
    this._animateAlongPath(path, true, () => this._endPhaseWatch())
  }

  _buildPath() {
    const path = []
    let col = 1, row = 0, dir = 'DOWN'
    const first = PLATFORMS.find(p => p.col === col && p.row === row)
    path.push({ col, row, platform: first, isLanding: false })
    if (first) dir = deflect(dir, first.angle)

    let steps = 0
    while (steps++ < 200) {
      const next = stepDir(col, row, dir)
      col = next.col
      row = next.row
      if (col < 0 || col >= GRID.cols || row < 0 || row >= GRID.rows) break
      const plat = PLATFORMS.find(p => p.col === col && p.row === row)
      const isLanding = (col === LANDING_ZONE.col && row === LANDING_ZONE.row)
      path.push({ col, row, platform: plat, isLanding })
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
      const tween = this.tweens.add({
        targets: this._ball,
        x: target.x,
        y: target.y,
        duration: CELL_MOVE_MS,
        ease: 'Linear',
        onUpdate: () => {
          if (isWatch) this._dropTrail(this._ball.x, this._ball.y)
        },
        onComplete: () => {
          if (node.platform) {
            this._onPlatformHit(node.platform, isWatch, () => {
              idx++
              stepNext()
            })
          } else if (node.isLanding) {
            this._onLandingHit(isWatch, () => {
              idx++
              stepNext()
            })
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
    if (dx * dx + dy * dy < 225) return
    this._lastTrail = { x, y }
    const dot = this.add.circle(x, y, 1.5, C.INK_FADED, 0.35).setDepth(5)
    this._trailDots.push(dot)
  }

  _onPlatformHit(plat, isWatch, done) {
    this.cameras.main.shake(80, 0.002)
    const center = this._cellCenter(plat.col, plat.row)
    this._spawnInkBurst(center.x, center.y)

    if (plat._graphic) {
      this.tweens.add({
        targets: plat._graphic,
        alpha: 0.3,
        duration: 100,
        yoyo: true,
        onComplete: () => { if (plat._graphic) plat._graphic.alpha = 0.85 },
      })
    }
    if (plat._label) {
      this.tweens.add({
        targets: plat._label,
        scale: 1.3,
        duration: 120,
        yoyo: true,
      })
    }

    if (isWatch) {
      this._narrativeYear.setText(plat.year)
      this._narrativeLabel.setText(`Step ${plat.id + 1} of 9 — ${plat.label}`)
      this._narrativeText.setText(plat.oneLiner)
      this._narrativeYear.alpha = 0
      this._narrativeText.alpha = 0
      this._narrativeLabel.alpha = 0
      this.tweens.add({ targets: [this._narrativeYear, this._narrativeText, this._narrativeLabel], alpha: 1, duration: 200 })
      this.time.delayedCall(850, done)
    } else {
      this.time.delayedCall(50, done)
    }
  }

  _onLandingHit(isWatch, done) {
    const center = this._cellCenter(LANDING_ZONE.col, LANDING_ZONE.row)
    this._spawnInkBurst(center.x, center.y)
    this.cameras.main.shake(120, 0.003)

    if (this._landingSeal) {
      this.tweens.add({ targets: this._landingSeal, scale: 1.3, duration: 300, yoyo: true, repeat: 1 })
    }

    if (isWatch) {
      this._narrativeYear.setText('2026')
      this._narrativeLabel.setText('What’s next?')
      this._narrativeText.setText('Looking for the next challenge. Maybe it’s yours.')
      this.tweens.add({ targets: [this._narrativeYear, this._narrativeText, this._narrativeLabel], alpha: 1, duration: 200 })
      this.time.delayedCall(1600, done)
    } else {
      this.time.delayedCall(100, done)
    }
  }

  _spawnInkBurst(x, y) {
    const count = 5 + Math.floor(Math.random() * 3)
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2
      const speed = 25 + Math.random() * 45
      const dot = this.add.circle(x, y, 1 + Math.random() * 1.5, C.INK, 0.55).setDepth(9)
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(a) * speed,
        y: y + Math.sin(a) * speed,
        alpha: 0,
        duration: 300 + Math.random() * 200,
        ease: 'Quad.easeOut',
        onComplete: () => dot.destroy(),
      })
    }
  }

  _endPhaseWatch() {
    if (this._phase !== 'WATCH') return
    this._phase = 'TRANSITION'
    if (this._spaceHandler) {
      this._spaceKey.off('down', this._spaceHandler)
      this._spaceHandler = null
    }

    PLATFORMS.forEach(p => {
      if (p._graphic) this.tweens.add({ targets: p._graphic, alpha: 0, duration: 900 })
      if (p._label) this.tweens.add({ targets: p._label, alpha: 0, duration: 900 })
    })
    this._trailDots.forEach(d => this.tweens.add({ targets: d, alpha: 0, duration: 900, onComplete: () => d.destroy() }))
    this._trailDots = []

    this.time.delayedCall(1000, () => {
      this._clearPhaseObjects()
      // Clear any stored ref on PLATFORMS so later uses aren't referencing destroyed objects
      PLATFORMS.forEach(p => { p._graphic = null; p._label = null })
      this._startPhaseRecall()
    })
  }

  // =================== PHASE 2: RECALL ===================

  _startPhaseRecall() {
    this._phase = 'RECALL'
    this._placements = new Map()

    const hdr = this.add.text(680, 100, 'PLACE FROM MEMORY', { ...TEXT.label, fontSize: '12px', fontStyle: 'bold', color: COLORS.INK })
    this._addPhaseObject(hdr)
    const hint = this.add.text(680, 118, 'Drag cards to the grid. Double-click or FLIP to rotate.', {
      ...TEXT.small, fontSize: '11px', color: COLORS.INK_FADED,
    })
    this._addPhaseObject(hint)

    this._timerText = this.add.text(1240, 40, '0:45', { ...TEXT.stat, fontSize: '26px', color: COLORS.INK_BLACK }).setOrigin(1, 0)
    this._addPhaseObject(this._timerText)
    const timerLbl = this.add.text(1240, 70, 'TIME', { ...TEXT.label, fontSize: '10px' }).setOrigin(1, 0)
    this._addPhaseObject(timerLbl)

    this._timeLeft = RECALL_TIME
    this._timerEvent = this.time.addEvent({
      delay: 1000,
      repeat: RECALL_TIME - 1,
      callback: () => this._tickTimer(),
    })

    const shuffled = [...PLATFORMS].sort(() => Math.random() - 0.5)
    const trayX0 = 680
    const trayY0 = 150
    const cardW = 240
    const cardH = 42
    const gap = 6

    this._trayPieces = []
    shuffled.forEach((plat, i) => {
      const tx = trayX0
      const ty = trayY0 + i * (cardH + gap)
      const startAngle = Math.random() < 0.5 ? '/' : '\\'
      const piece = this._createTrayPiece(plat, tx, ty, cardW, cardH, startAngle)
      this._trayPieces.push(piece)
      this._addPhaseObject(piece.container)
    })

    const resetBtn = this.add.rectangle(940, 650, 140, 32, C.LEATHER_DARK, 0.9).setStrokeStyle(1, C.INK_LIGHT, 0.6).setInteractive({ useHandCursor: true })
    this._addPhaseObject(resetBtn)
    const resetLbl = this.add.text(940, 650, 'RESET ALL', { ...TEXT.label, fontSize: '11px', fontStyle: 'bold', color: COLORS.PARCHMENT }).setOrigin(0.5)
    this._addPhaseObject(resetLbl)
    resetBtn.on('pointerdown', () => this._resetAllPieces())

    const submitBtn = this.add.rectangle(1100, 650, 160, 32, C.WAX_RED, 1).setStrokeStyle(1, C.WAX_RED_LIGHT, 0.8).setInteractive({ useHandCursor: true })
    this._addPhaseObject(submitBtn)
    const submitLbl = this.add.text(1100, 650, 'LOCK IN ANSWERS', { ...TEXT.label, fontSize: '11px', fontStyle: 'bold', color: COLORS.PARCHMENT_LIGHT }).setOrigin(0.5)
    this._addPhaseObject(submitLbl)
    submitBtn.on('pointerdown', () => this._endPhaseRecall())
    submitBtn.on('pointerover', () => submitBtn.setFillStyle(C.WAX_RED_LIGHT))
    submitBtn.on('pointerout', () => submitBtn.setFillStyle(C.WAX_RED))

    this._rHandler = () => this._resetAllPieces()
    this._rKey.on('down', this._rHandler)
  }

  _tickTimer() {
    this._timeLeft--
    if (this._timeLeft < 0) this._timeLeft = 0
    const m = Math.floor(this._timeLeft / 60)
    const s = this._timeLeft % 60
    if (this._timerText) this._timerText.setText(`${m}:${s.toString().padStart(2, '0')}`)
    if (this._timeLeft <= 10 && this._timerText) {
      this._timerText.setColor(COLORS.WAX_RED)
    }
    if (this._timeLeft <= 0) {
      this._endPhaseRecall()
    }
  }

  _createTrayPiece(plat, tx, ty, w, h, startAngle) {
    const container = this.add.container(tx, ty)
    const bg = this.add.rectangle(0, 0, w, h, C.PARCHMENT_LIGHT, 0.85).setOrigin(0, 0)
    bg.setStrokeStyle(1, C.INK, 0.45)
    const label = this.add.text(12, h / 2, plat.shortLabel, { ...TEXT.body, fontSize: '13px' }).setOrigin(0, 0.5)
    const year = this.add.text(12, h - 4, plat.year, { ...TEXT.label, fontSize: '9px' }).setOrigin(0, 1)

    const angleBox = this.add.rectangle(w - 64, h / 2, 28, 28, C.PARCHMENT_DARK, 0.4).setStrokeStyle(0.5, C.INK, 0.4)
    const angleText = this.add.text(w - 64, h / 2, startAngle === '/' ? '/' : '\\', {
      fontFamily: FONT_DISPLAY, fontSize: '22px', color: COLORS.INK, fontStyle: 'bold',
    }).setOrigin(0.5)

    const rotBtn = this.add.rectangle(w - 30, h / 2, 34, 26, C.LEATHER, 1).setStrokeStyle(0.8, C.INK, 0.6).setInteractive({ useHandCursor: true })
    const rotLbl = this.add.text(w - 30, h / 2, 'FLIP', { ...TEXT.label, fontSize: '9px', fontStyle: 'bold', color: COLORS.PARCHMENT }).setOrigin(0.5)

    container.add([bg, label, year, angleBox, angleText, rotBtn, rotLbl])
    container.setSize(w, h)

    const piece = {
      container, bg, label, year, angleText, rotBtn, rotLbl, angleBox,
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
      this.tweens.add({ targets: angleText, scale: { from: 0.6, to: 1 }, duration: 160 })
    }

    rotBtn.on('pointerdown', (pointer) => {
      toggleAngle()
    })

    bg.setInteractive({ useHandCursor: true, draggable: true })
    this.input.setDraggable(bg)

    let lastClick = 0
    bg.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown && pointer.rightButtonDown()) {
        toggleAngle()
        return
      }
      const now = this.time.now
      if (now - lastClick < 350) {
        toggleAngle()
      }
      lastClick = now
    })

    bg.on('dragstart', () => {
      container.setDepth(100)
      if (piece.placed) {
        this._removePlacement(piece)
      }
      bg.setFillStyle(C.PARCHMENT, 0.95)
    })

    bg.on('drag', (pointer) => {
      container.setPosition(pointer.x - piece.width / 2, pointer.y - piece.height / 2)
      this._highlightCell(pointer.x, pointer.y)
    })

    bg.on('dragend', (pointer) => {
      container.setDepth(0)
      bg.setFillStyle(C.PARCHMENT_LIGHT, 0.85)
      this._clearCellHighlight()
      const gx = pointer.x
      const gy = pointer.y
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
    if (!this._cellHL) {
      this._cellHL = this.add.graphics().setDepth(2)
    }
    this._cellHL.clear()
    const col = Math.floor((px - GRID.originX) / GRID.cellSize)
    const row = Math.floor((py - GRID.originY) / GRID.cellSize)
    if (col < 0 || col >= GRID.cols || row < 0 || row >= GRID.rows) return
    const x = GRID.originX + col * GRID.cellSize
    const y = GRID.originY + row * GRID.cellSize
    const occupied = this._placements.has(`${col},${row}`)
    this._cellHL.fillStyle(occupied ? C.WAX_RED : C.INK_FADED, occupied ? 0.15 : 0.18)
    this._cellHL.fillRect(x + 1, y + 1, GRID.cellSize - 2, GRID.cellSize - 2)
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

    this.tweens.add({
      targets: piece.container,
      x: center.x - size / 2,
      y: center.y - size / 2,
      duration: 180,
      ease: 'Back.easeOut',
    })

    piece.bg.setSize(size, size)
    piece.bg.setFillStyle(C.PARCHMENT_LIGHT, 0.8)
    piece.bg.setStrokeStyle(1, C.INK, 0.7)
    piece.label.setPosition(size / 2, size - 6).setOrigin(0.5, 1).setFontSize(7)
    piece.year.setVisible(false)
    piece.angleBox.setVisible(false)
    piece.angleText.setPosition(size / 2, size / 2 - 3).setFontSize(30)
    piece.rotBtn.setPosition(size / 2, 8).setSize(size - 6, 12)
    piece.rotLbl.setPosition(size / 2, 8).setFontSize(7)
  }

  _removePlacement(piece) {
    if (!piece.cellKey) return
    this._placements.delete(piece.cellKey)
    piece.cellKey = null
    piece.placed = false
    const w = piece.width, h = piece.height
    piece.bg.setSize(w, h)
    piece.bg.setFillStyle(C.PARCHMENT_LIGHT, 0.85)
    piece.bg.setStrokeStyle(1, C.INK, 0.45)
    piece.label.setPosition(12, h / 2).setOrigin(0, 0.5).setFontSize(13)
    piece.year.setVisible(true).setPosition(12, h - 4)
    piece.angleBox.setVisible(true).setPosition(w - 64, h / 2)
    piece.angleText.setPosition(w - 64, h / 2).setFontSize(22)
    piece.rotBtn.setPosition(w - 30, h / 2).setSize(34, 26)
    piece.rotLbl.setPosition(w - 30, h / 2).setFontSize(9)
  }

  _returnPieceHome(piece) {
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
    if (this._timerEvent) { this._timerEvent.remove(false); this._timerEvent = null }
    if (this._rHandler) { this._rKey.off('down', this._rHandler); this._rHandler = null }

    this._finalPlacements = new Map()
    this._trayPieces.forEach(p => {
      if (p.placed && p.cellKey) {
        const [c, r] = p.cellKey.split(',').map(Number)
        this._finalPlacements.set(p.platform.id, { col: c, row: r, angle: p.angle, piece: p })
      }
    })

    this._trayPieces.forEach(p => {
      if (!p.placed) {
        this.tweens.add({ targets: p.container, alpha: 0, duration: 300, onComplete: () => { if (p.container && p.container.destroy) p.container.destroy() } })
      }
    })

    this._clearPhaseObjects()
    if (this._cellHL) { this._cellHL.destroy(); this._cellHL = null }

    this.time.delayedCall(500, () => this._startPhaseVerify())
  }

  // =================== PHASE 3: VERIFY ===================

  _startPhaseVerify() {
    this._phase = 'VERIFY'
    this._score = 0

    const hdr = this.add.text(680, 100, 'VERIFICATION', { ...TEXT.label, fontSize: '12px', fontStyle: 'bold', color: COLORS.INK })
    this._addPhaseObject(hdr)
    this._verifyLine = this.add.text(680, 118, 'Let’s see how you did.', { ...TEXT.bodyItalic, fontSize: '14px', color: COLORS.INK })
    this._addPhaseObject(this._verifyLine)

    this._scoreDisplay = this.add.text(1240, 40, '0', { ...TEXT.stat, fontSize: '32px', color: COLORS.INK_BLACK }).setOrigin(1, 0)
    this._addPhaseObject(this._scoreDisplay)
    const slbl = this.add.text(1240, 78, 'SCORE', { ...TEXT.label, fontSize: '10px' }).setOrigin(1, 0)
    this._addPhaseObject(slbl)

    const path = this._buildPath()
    const start = this._cellCenter(1, 0)
    this._ball = this.add.image(start.x, GRID.originY - 40, 'l5ball').setDepth(10)
    this._addPhaseObject(this._ball)

    this._verifyIdx = 0
    this._verifyPath = path
    this._verifyStep()
  }

  _verifyStep() {
    if (this._phase !== 'VERIFY') return
    if (this._verifyIdx >= this._verifyPath.length) {
      this._finishVerify()
      return
    }
    const node = this._verifyPath[this._verifyIdx]
    const target = this._cellCenter(node.col, node.row)
    this.tweens.add({
      targets: this._ball,
      x: target.x,
      y: target.y,
      duration: CELL_MOVE_MS * 0.6,
      ease: 'Linear',
      onComplete: () => {
        if (node.platform) {
          this._evaluatePlatform(node.platform, () => {
            this._verifyIdx++
            this._verifyStep()
          })
        } else if (node.isLanding) {
          this._onLandingHit(false, () => {
            this._verifyIdx++
            this._verifyStep()
          })
        } else {
          this._verifyIdx++
          this._verifyStep()
        }
      },
    })
  }

  _evaluatePlatform(plat, done) {
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
    else if (status === 'PARTIAL') gained = 3

    this._score += gained
    this._scoreDisplay.setText(`${this._score}`)

    this._spawnInkBurst(center.x, center.y)
    this.cameras.main.shake(60, 0.002)

    if (status === 'CORRECT') {
      if (placement && placement.piece) {
        placement.piece.bg.setStrokeStyle(2, C.STAMP_GREEN, 1)
        placement.piece.angleText.setColor(COLORS.STAMP_GREEN)
        placement.piece.label.setColor(COLORS.STAMP_GREEN)
      }
      this._drawCheckmark(center.x + 22, center.y - 22, C.STAMP_GREEN)
      this._showFeedbackLine(plat, '+11', COLORS.STAMP_GREEN)
    } else if (status === 'PARTIAL') {
      if (placement && placement.piece) {
        placement.piece.bg.setStrokeStyle(2, C.GOLD_LEAF, 1)
        placement.piece.angleText.setColor(COLORS.RED_MARGIN)
      }
      const ghost = this._drawPlatform(plat.col, plat.row, plat.angle, C.STAMP_GREEN, 0.35, 2)
      this._addPhaseObject(ghost)
      this._drawCheckmark(center.x + 22, center.y - 22, C.GOLD_LEAF, true)
      this._showFeedbackLine(plat, '+3 (angle off)', COLORS.GOLD_LEAF)
    } else if (status === 'WRONG_POS') {
      if (placement && placement.piece) {
        placement.piece.bg.setStrokeStyle(2, C.RED_MARGIN, 1)
        placement.piece.angleText.setColor(COLORS.RED_MARGIN)
        placement.piece.label.setColor(COLORS.RED_MARGIN)
      }
      const ghost = this._drawPlatform(plat.col, plat.row, plat.angle, C.STAMP_GREEN, 0.35, 2)
      this._addPhaseObject(ghost)
      const lbl = this.add.text(center.x, center.y + GRID.cellSize / 2 - 2, plat.shortLabel, {
        ...TEXT.label, fontSize: '8px', color: COLORS.STAMP_GREEN,
      }).setOrigin(0.5, 1)
      this._addPhaseObject(lbl)
      this._drawXmark(center.x + 22, center.y - 22, C.RED_MARGIN)
      this._showFeedbackLine(plat, '+0 (wrong spot)', COLORS.RED_MARGIN)
    } else {
      const ghost = this._drawPlatform(plat.col, plat.row, plat.angle, C.STAMP_GREEN, 0.3, 2)
      this._addPhaseObject(ghost)
      const lbl = this.add.text(center.x, center.y + GRID.cellSize / 2 - 2, plat.shortLabel, {
        ...TEXT.label, fontSize: '8px', color: COLORS.STAMP_GREEN,
      }).setOrigin(0.5, 1)
      this._addPhaseObject(lbl)
      this._showFeedbackLine(plat, '+0 (missed)', COLORS.INK_FADED)
    }

    this.time.delayedCall(550, done)
  }

  _showFeedbackLine(plat, delta, color) {
    if (this._verifyLine) {
      this._verifyLine.setText(`${plat.label} — ${delta}`)
      this._verifyLine.setColor(color)
    }
  }

  _drawCheckmark(x, y, color, partial = false) {
    const g = this.add.graphics().setDepth(12)
    g.lineStyle(2.5, color, 1)
    g.beginPath()
    g.moveTo(x - 6, y)
    g.lineTo(x - 2, y + 5)
    g.lineTo(x + 7, y - 6)
    g.strokePath()
    this._addPhaseObject(g)
    if (partial) g.alpha = 0.7
    this.tweens.add({ targets: g, scale: { from: 1.8, to: 1 }, alpha: { from: 0, to: 1 }, duration: 200 })
  }

  _drawXmark(x, y, color) {
    const g = this.add.graphics().setDepth(12)
    g.lineStyle(2.5, color, 1)
    g.beginPath()
    g.moveTo(x - 6, y - 6)
    g.lineTo(x + 6, y + 6)
    g.moveTo(x + 6, y - 6)
    g.lineTo(x - 6, y + 6)
    g.strokePath()
    this._addPhaseObject(g)
    this.tweens.add({ targets: g, scale: { from: 1.8, to: 1 }, alpha: { from: 0, to: 1 }, duration: 200 })
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

    completeLevel(this, KEYS.SCORE_L5, KEYS.COMPLETED_L5, this._score)

    this.time.delayedCall(1500, () => this._showCompletionScreen(allCorrect))
  }

  // =================== COMPLETION SCREEN ===================

  _showCompletionScreen(perfect) {
    this._phase = 'COMPLETE'

    // Fade out everything then redraw
    const cam = this.cameras.main
    cam.fadeOut(600, 244, 232, 208)
    cam.once('camerafadeoutcomplete', () => {
      // Wipe the scene
      this.children.list.slice().forEach(o => {
        if (o && o.destroy) o.destroy()
      })
      cam.fadeIn(400, 244, 232, 208)
      this._drawCompletion(perfect)
    })
  }

  _drawCompletion(perfect) {
    JournalUI.drawParchment(this, 0, 0, 1280, 720)
    JournalUI.drawGrain(this, 0, 0, 1280, 720, 0.08)
    JournalUI.drawPageNumber(this, 10)

    this.add.text(640, 50, 'CAREER COMPLETE', { ...TEXT.label, fontSize: '13px', fontStyle: 'bold', color: COLORS.INK_LIGHT }).setOrigin(0.5)
    this.add.text(640, 82, 'The Augustin Files', { ...TEXT.title, fontSize: '40px' }).setOrigin(0.5)

    this._drawCareerMap(perfect)

    const score = this._score
    const rating = this._getRating(score)

    this.add.text(640, 320, 'CAREER RECALL', { ...TEXT.label, fontSize: '11px', fontStyle: 'bold' }).setOrigin(0.5)
    const scoreText = this.add.text(640, 352, '0%', { ...TEXT.title, fontSize: '52px', color: perfect ? COLORS.GOLD_LEAF : COLORS.INK_BLACK }).setOrigin(0.5)
    this.tweens.addCounter({
      from: 0, to: score,
      duration: 1200,
      ease: 'Cubic.easeOut',
      onUpdate: (t) => scoreText.setText(`${Math.floor(t.getValue())}%`),
    })

    this.add.text(640, 392, rating.label, { ...TEXT.label, fontSize: '12px', fontStyle: 'bold', color: COLORS.INK }).setOrigin(0.5)
    this.add.text(640, 412, rating.msg, { ...TEXT.bodyItalic, fontSize: '14px', color: COLORS.INK_LIGHT }).setOrigin(0.5)

    this._drawStatBars()

    const name = this._playerName && this._playerName !== 'friend' ? this._playerName : 'friend'
    const line1 = this.add.text(640, 540, `Thanks for playing, ${name}.`, { ...TEXT.heading, fontSize: '20px' }).setOrigin(0.5).setAlpha(0)
    const line2 = this.add.text(640, 568, 'You just lived 15 years of career pivots in 15 minutes.', { ...TEXT.bodyItalic, fontSize: '14px', color: COLORS.INK_LIGHT }).setOrigin(0.5).setAlpha(0)
    const line3 = this.add.text(640, 588, 'If this story resonates, let’s talk.', { ...TEXT.bodyItalic, fontSize: '14px', color: COLORS.INK }).setOrigin(0.5).setAlpha(0)

    this.tweens.add({ targets: line1, alpha: 1, duration: 400, delay: 400 })
    this.tweens.add({ targets: line2, alpha: 1, duration: 400, delay: 700 })
    this.tweens.add({ targets: line3, alpha: 1, duration: 400, delay: 1000 })

    this._drawCTAButton(250, 645, 'BOOK A CALL', 'calendly.com/augustin', 'https://calendly.com/augustin', 1300)
    this._drawCTAButton(640, 645, 'LINKEDIN', '/in/augustin-romaneschi', 'https://linkedin.com/in/augustin-romaneschi', 1500)
    this._drawCTAButton(1030, 645, 'DOWNLOAD CV', 'augustin-romaneschi.pdf', '/cv.pdf', 1700)

    JournalUI.drawWaxSeal(this, 1200, 690, 'A', perfect ? 26 : 20)

    this.add.text(640, 710, 'SPACE to replay  ·  ESC to return to the hub', {
      ...TEXT.small, fontSize: '10px', color: COLORS.INK_FADED,
    }).setOrigin(0.5)

    if (perfect) this._drawPerfectStamp()

    this._spaceReplay = () => this.scene.restart()
    this._spaceKey.on('down', this._spaceReplay)
  }

  _drawCareerMap(perfect) {
    const nodes = [
      { label: 'Law School',    year: '2014', x: 120 },
      { label: 'Startup Wknd',  year: '2014', x: 250 },
      { label: 'First Sales',   year: '2015', x: 370 },
      { label: 'LatAm Move',    year: '2017', x: 500 },
      { label: 'Training KOLs', year: '2018', x: 630 },
      { label: '$1M ARR',       year: '2020', x: 760 },
      { label: 'Greenland',     year: '2007', x: 880 },
      { label: 'Agency Launch', year: '2023', x: 1010 },
      { label: 'AI Tools',      year: '2025', x: 1130 },
    ]
    const lineColor = perfect ? C.GOLD_LEAF : C.INK
    const lineY = 210

    const lineG = this.add.graphics()
    lineG.lineStyle(1.8, lineColor, 0.75)

    nodes.forEach((n, i) => {
      if (i === 0) return
      this.time.delayedCall(180 * i + 200, () => {
        lineG.beginPath()
        lineG.moveTo(nodes[i - 1].x, lineY)
        lineG.lineTo(n.x, lineY)
        lineG.strokePath()
      })
    })

    nodes.forEach((n, i) => {
      const delay = 180 * i + 200
      this.time.delayedCall(delay, () => {
        const outer = this.add.circle(n.x, lineY, 7, C.PARCHMENT_LIGHT).setStrokeStyle(1.5, lineColor, 1)
        this.add.circle(n.x, lineY, 3, lineColor)
        outer.setScale(0)
        this.tweens.add({ targets: outer, scale: 1, duration: 200, ease: 'Back.easeOut' })
        this.add.text(n.x, lineY - 18, n.year, { ...TEXT.label, fontSize: '9px', color: COLORS.INK_FADED }).setOrigin(0.5)
        this.add.text(n.x, lineY + 20, n.label, { ...TEXT.label, fontSize: '9px', color: COLORS.INK }).setOrigin(0.5, 0)
      })
    })

    this.time.delayedCall(180 * nodes.length + 250, () => {
      const starX = 1210
      lineG.beginPath()
      lineG.moveTo(nodes[nodes.length - 1].x, lineY)
      lineG.lineTo(starX, lineY)
      lineG.strokePath()
      this.add.text(starX, lineY, '★', { fontFamily: FONT_DISPLAY, fontSize: '22px', color: COLORS.WAX_RED }).setOrigin(0.5)
      this.add.text(starX, lineY + 20, 'HIRE ME', { ...TEXT.label, fontSize: '9px', fontStyle: 'bold', color: COLORS.WAX_RED }).setOrigin(0.5, 0)
    })
  }

  _drawStatBars() {
    const stats = [
      { label: 'Curiosity',    key: KEYS.STAT_CURIOSITY },
      { label: 'Sales',        key: KEYS.STAT_SALES },
      { label: 'EQ',           key: KEYS.STAT_EQ },
      { label: 'Grit',         key: KEYS.STAT_GRIT },
      { label: 'Independence', key: KEYS.STAT_INDEPENDENCE },
      { label: 'Tech',         key: KEYS.STAT_TECH },
    ]
    const startX = 300
    const startY = 455
    const colW = 340
    const rowH = 28
    stats.forEach((s, i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const x = startX + col * colW
      const y = startY + row * rowH
      const raw = this.registry.get(s.key) ?? 0
      const val = Math.max(0, Math.min(100, raw))

      this.add.text(x, y, s.label, { ...TEXT.body, fontSize: '11px', color: COLORS.INK }).setOrigin(0, 0.5)
      const barX = x + 100
      const barW = 160
      const barH = 10
      this.add.rectangle(barX, y, barW, barH, C.PARCHMENT_DARK, 0.8).setOrigin(0, 0.5).setStrokeStyle(0.5, C.INK, 0.3)
      const fill = this.add.rectangle(barX, y, 0, barH, C.STAMP_GREEN, 0.85).setOrigin(0, 0.5)
      const valTxt = this.add.text(barX + barW + 8, y, '0', { ...TEXT.label, fontSize: '11px', fontStyle: 'bold', color: COLORS.INK }).setOrigin(0, 0.5)

      this.tweens.add({
        targets: fill,
        width: (val / 100) * barW,
        duration: 800,
        delay: 100 * i,
        ease: 'Cubic.easeOut',
      })
      this.tweens.addCounter({
        from: 0, to: val,
        duration: 800,
        delay: 100 * i,
        onUpdate: (t) => valTxt.setText(`${Math.floor(t.getValue())}`),
      })
    })
  }

  _drawCTAButton(x, y, label, subtitle, url, delay = 0) {
    const w = 260, h = 56
    const bg = this.add.rectangle(x, y, w, h, C.LEATHER_DARK, 1).setStrokeStyle(1.5, C.INK_LIGHT, 0.55).setInteractive({ useHandCursor: true })
    const mainLabel = this.add.text(x, y - 10, label, {
      fontFamily: FONT, fontSize: '15px', color: COLORS.PARCHMENT_LIGHT, fontStyle: 'bold',
    }).setOrigin(0.5)
    const sub = this.add.text(x, y + 12, subtitle, {
      fontFamily: FONT, fontSize: '10px', color: COLORS.INK_FADED, fontStyle: 'italic',
    }).setOrigin(0.5)

    bg.setAlpha(0); mainLabel.setAlpha(0); sub.setAlpha(0)
    this.tweens.add({ targets: [bg, mainLabel, sub], alpha: 1, duration: 400, delay })

    bg.on('pointerover', () => {
      bg.setFillStyle(C.LEATHER)
      bg.setStrokeStyle(2, C.WAX_RED, 0.9)
      this.tweens.add({ targets: [bg, mainLabel, sub], scaleX: 1.04, scaleY: 1.04, duration: 120 })
    })
    bg.on('pointerout', () => {
      bg.setFillStyle(C.LEATHER_DARK)
      bg.setStrokeStyle(1.5, C.INK_LIGHT, 0.55)
      this.tweens.add({ targets: [bg, mainLabel, sub], scaleX: 1, scaleY: 1, duration: 120 })
    })
    bg.on('pointerdown', () => {
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
    })
  }

  _drawPerfectStamp() {
    const x = 1060, y = 210
    const container = this.add.container(x, y)
    const bg = this.add.rectangle(0, 0, 180, 54, C.PARCHMENT, 0).setStrokeStyle(2.5, C.STAMP_GREEN, 0.85)
    const inner = this.add.rectangle(0, 0, 170, 44, C.PARCHMENT, 0).setStrokeStyle(0.8, C.STAMP_GREEN, 0.7)
    const t1 = this.add.text(0, -8, 'PERFECT RECALL', { fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: COLORS.STAMP_GREEN }).setOrigin(0.5)
    const t2 = this.add.text(0, 12, '2026', { fontFamily: FONT, fontSize: '10px', color: COLORS.STAMP_GREEN, fontStyle: 'italic' }).setOrigin(0.5)
    container.add([bg, inner, t1, t2])
    container.setRotation(Phaser.Math.DegToRad(-14))
    container.setScale(0)
    this.tweens.add({ targets: container, scale: 1, duration: 400, delay: 1200, ease: 'Back.easeOut' })
  }

  _getRating(score) {
    if (score >= 100) return { label: 'PERFECT', msg: 'Flawless recall. You know this career better than most.' }
    if (score >= 80)  return { label: 'EXCELLENT', msg: 'Impressive. You followed the journey closely.' }
    if (score >= 60)  return { label: 'GOOD', msg: 'You caught the key pivots. The story stuck.' }
    if (score >= 40)  return { label: 'FAIR', msg: 'Some steps got shuffled. The career’s more winding than it looks.' }
    if (score >= 20)  return { label: 'ROUGH', msg: 'A few pieces clicked. Maybe worth a second read.' }
    return { label: 'MISSED', msg: 'The path’s still a mystery. Replay to see it again.' }
  }
}
