import * as Phaser from 'phaser'
import { KEYS, recordBestTime, addPlayTime } from '../systems/GameRegistry.js'
import { completeLevel } from './LevelSelectHub.js'
import { COLORS, C, TEXT, FONT_DISPLAY, FONT_MONO, LEVEL_COLORS } from '../config/theme.js'
import { BrutalUI } from '../ui/BrutalUI.js'
import { AudioCtx } from '../ui/AudioCtx.js'
import { Particles } from '../ui/Particles.js'
import { TextReveal } from '../ui/TextReveal.js'

// Level 1 — Shanghai: Escape Velocity (Vertical Shoot-em-up)
// Neo-Brutalist. Pilot a rocket at the bottom of the screen.
// SHOOT falling FUEL items to collect them.
// SHOOT or DODGE descending LAW ENEMIES that fire back.

const FUEL_ITEMS = [
  'PITCH IDEA', 'FIND CO-FOUNDER', 'DEMO CRASHES', 'PIVOT AT 2AM',
  'SLEEP ON FLOOR', 'TALK TO INVESTOR', 'PRESENT WITH ACCENT',
  'CALL YOUR FATHER', 'SKIP LAW EXAM', 'FIRST CUSTOMER',
  'RAISE SEED', 'MENTOR INTRO',
]

const LAW_ENEMIES = [
  'BAR EXAM', 'LAW LECTURE', 'INTERNSHIP',
  'MOOT COURT', 'CASE BRIEF', 'TORT EXAM',
]

const LAW_PATH_TARGETS = [
  'ATTEND LECTURE', 'PRACTICE EXAM', 'STUDY GROUP',
  'FOLLOW SYLLABUS', 'OFFICE HOURS', 'BAR REVIEW',
]

const INTRO_BEATS = [
  'SHANGHAI. 2014.\n\nSTUDYING LAW.\nEAST CHINA UNIVERSITY\nOF POLITICAL SCIENCE AND LAW.',
  'A FRIEND DRAGS YOU TO\nA STARTUP WEEKEND.\n\n54 HOURS. BUILD A COMPANY\nFROM NOTHING.',
  'AHA MOMENT.\n\nYOU DISCOVER SOMETHING\nYOU PREFER.',
  'TECH AND STARTUPS —\nA LIFE OF CHALLENGE\nAND ADVENTURE.',
]

const FINISH_BEATS = [
  'THE ROCKET CLEARS THE CEILING.\nYOU FOUND YOUR PATH.',
  'TECH FIT YOUR CHARACTER\nBETTER THAN LAW EVER COULD.',
  'A YEAR LATER SWITZERLAND GETS QUIET.\nYOU BUY A ONE-WAY TICKET TO MEDELLIN.',
]

export class ShanghaiScene extends Phaser.Scene {
  constructor() {
    super('ShanghaiScene')
  }

  create() {
    this.cameras.main.fadeIn(400, 10, 10, 10)
    this.cameras.main.setBackgroundColor(COLORS.BLACK)
    this._playerName = this.registry.get(KEYS.PLAYER_NAME) ?? 'friend'

    // State
    this._phase = 'intro'
    this._gameActive = false

    // World
    this._rocket = null
    this._rocketX = 640
    this._rocketY = 620
    this._rocketVelX = 0
    this._rocketVelY = 0

    this._fuel = 0
    this._health = 3
    this._maxHealth = 3
    this._fumesMode = false

    this._fuelItems = []
    this._lawTargets = []
    this._enemies = []
    this._playerBullets = []
    this._enemyBullets = []
    this._fuelSpawnCount = 0

    this._totalFuelCollected = 0
    this._totalEnemiesKilled = 0
    this._totalHits = 0
    this._currentStreak = 0
    this._bestStreak = 0

    this._gameStartTime = 0
    this._launchTime = 0

    // Tuning (scales with fuel%)
    this._fuelSpawnInterval = 1100
    this._enemySpawnInterval = 2600
    this._fuelDriftSpeed = 110
    this._enemyDriftSpeed = 90
    this._enemyFireInterval = 1800
    this._bulletSpeed = 720
    this._enemyBulletSpeed = 320

    this._lastShotAt = 0
    this._shotCooldown = 180

    this._drawBackground()
    BrutalUI.drawScanlines(this, 1280, 720)

    this.input.once('pointerdown', () => AudioCtx.resume())
    AudioCtx.fx('open')

    BrutalUI.drawHomeButton(this, {
      onClick: () => {
        AudioCtx.fx('click')
        BrutalUI.pageTurn(this, () => this.scene.start('LevelSelectHub'))
      },
    })

    this._buildIntro()

    this.events.once('shutdown', () => {
      this.tweens.killAll()
      if (this._fuelSpawnTimer) this._fuelSpawnTimer.remove(false)
      if (this._enemySpawnTimer) this._enemySpawnTimer.remove(false)
      if (this._enemyFireTimer) this._enemyFireTimer.remove(false)
      if (this._smokeTimer) this._smokeTimer.remove(false)
      if (this._flameUpdate) this._flameUpdate.remove(false)
      if (this.input && this.input.keyboard) this.input.keyboard.removeAllListeners()
      if (this.input) this.input.removeAllListeners()
    }, this)
  }

  _drawBackground() {
    const g = this.add.graphics()
    g.fillStyle(C.BLACK, 1)
    g.fillRect(0, 0, 1280, 720)
    g.lineStyle(1, C.GREY_900, 1)
    for (let x = 0; x < 1280; x += 40) {
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 720); g.strokePath()
    }
    for (let y = 0; y < 720; y += 40) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(1280, y); g.strokePath()
    }
    this._bgGraphics = g
  }

  // ── Intro ──────────────────────────────────────────────────────
  _buildIntro() {
    this._introHeader = this.add.text(40, 100, 'CHAPTER 01 / SHANGHAI', {
      fontFamily: FONT_MONO, fontSize: '12px', fontStyle: 'bold', color: COLORS.SHOCK_RED,
      letterSpacing: 3,
    }).setOrigin(0, 0.5)

    this._introTitle = BrutalUI.drawBlockType(this, 640, 200, 'THE SPARK', {
      fontSize: '72px', color: COLORS.BONE, shadowColor: COLORS.SHOCK_RED, shadowOffset: 6,
    })

    this._introIndex = 0
    this._showNextIntroBeat()
  }

  _showNextIntroBeat() {
    if (this._introIndex >= INTRO_BEATS.length) {
      this._showStartupWeekendSticker()
      return
    }
    const text = INTRO_BEATS[this._introIndex]
    this._introIndex++
    BrutalUI.showNarrative(this, 640, 440, 720, 200, text, () => this._showNextIntroBeat())
  }

  _showStartupWeekendSticker() {
    const hint = this.add.text(640, 360, 'CLICK THE STICKER TO BREAK OUT', {
      fontFamily: FONT_MONO, fontSize: '12px', fontStyle: 'bold', color: COLORS.BONE,
      letterSpacing: 2,
    }).setOrigin(0.5).setAlpha(0)
    this.tweens.add({ targets: hint, alpha: 0.85, duration: 400 })

    const sticker = BrutalUI.drawSticker(this, 640, 460, 'STARTUP WEEKEND', {
      fill: C.SHOCK_RED, textColor: COLORS.BONE, rotation: -6 * Math.PI / 180,
      fontSize: '30px', paddingX: 24, paddingY: 12, fontFamily: FONT_DISPLAY, fontStyle: '400',
    })

    this.tweens.add({
      targets: sticker, scale: { from: 0.9, to: 1.0 }, duration: 300, ease: 'Back.easeOut',
    })
    this.tweens.add({
      targets: sticker, y: 470, duration: 1200, yoyo: true, loop: -1, ease: 'Sine.easeInOut',
    })

    const hit = this.add.rectangle(640, 460, 460, 100, 0x000000, 0).setInteractive({ useHandCursor: true })
    hit.on('pointerdown', () => {
      hit.destroy()
      this.tweens.killTweensOf(sticker)
      this.tweens.add({
        targets: sticker, scale: 2.2, alpha: 0, rotation: 0.4, duration: 400, ease: 'Cubic.easeIn',
        onComplete: () => sticker.destroy(),
      })
      this.tweens.add({ targets: [hint, this._introTitle.container, this._introHeader],
        alpha: 0, duration: 400 })
      this.cameras.main.shake(300, 0.005)
      this.time.delayedCall(500, () => {
        if (this._introTitle) this._introTitle.container.destroy()
        if (this._introHeader) this._introHeader.destroy()
        this._buildGameField()
      })
    })
  }

  // ── Game Field ─────────────────────────────────────────────────
  _buildGameField() {
    this._phase = 'game'

    // Top bar
    const bar = this.add.graphics()
    bar.fillStyle(C.BONE, 1)
    bar.fillRect(0, 70, 1280, 50)
    bar.fillStyle(C.SHOCK_RED, 1)
    bar.fillRect(0, 115, 1280, 5)
    this._topBar = bar

    this._titleText = this.add.text(180, 95, 'L01 // ESCAPE VELOCITY', {
      fontFamily: FONT_DISPLAY, fontSize: '18px', color: COLORS.BLACK,
    }).setOrigin(0, 0.5)

    this._subText = this.add.text(1255, 95, 'SHOOT FUEL · DODGE LAW', {
      fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: COLORS.GREY_700,
      letterSpacing: 2,
    }).setOrigin(1, 0.5)

    this._drawLayerLabels()
    this._drawHearts()
    this._drawFuelGauge()

    // Rocket
    this._rocketContainer = this.add.container(this._rocketX, this._rocketY).setAlpha(0).setScale(0.8)
    this._drawRocket(this._rocketContainer)
    this.tweens.add({ targets: this._rocketContainer, alpha: 1, scale: 1, duration: 400 })
    this._rocket = this._rocketContainer

    this._flameGraphics = this.add.graphics().setDepth(-1)

    // Combo
    this._multiplierTag = this.add.text(640, 140, '', {
      fontFamily: FONT_DISPLAY, fontSize: '22px', color: COLORS.HAZARD_YELLOW,
    }).setOrigin(0.5).setAlpha(0)

    // Stats
    this._statsText = this.add.text(1255, 695, 'FUEL HITS 0 · KILLS 0', {
      fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: COLORS.GREY_500,
      letterSpacing: 2,
    }).setOrigin(1, 1)

    // Hint banner
    const hint = this.add.text(640, 695, '← → MOVE · SPACE OR CLICK TO FIRE', {
      fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: COLORS.HAZARD_YELLOW,
      letterSpacing: 2,
    }).setOrigin(0.5, 1)
    this.tweens.add({
      targets: hint, alpha: 0, duration: 600, delay: 5500,
      onComplete: () => hint.destroy(),
    })

    // Input
    this._cursors = this.input.keyboard.createCursorKeys()
    this._keyA = this.input.keyboard.addKey(65)
    this._keyD = this.input.keyboard.addKey(68)
    this._keyW = this.input.keyboard.addKey(87)
    this._keyS = this.input.keyboard.addKey(83)
    this._keySpace = this.input.keyboard.addKey(32)
    this._keyLeft = this.input.keyboard.addKey(37)
    this._keyRight = this.input.keyboard.addKey(39)
    this._keyUp = this.input.keyboard.addKey(38)
    this._keyDown = this.input.keyboard.addKey(40)

    // Mouse / touch fire
    this.input.on('pointerdown', (pointer) => {
      if (this._phase !== 'game') return
      // Touch-style: tap top half = fire, tap bottom half = move horizontally
      if (pointer.y < 360) {
        this._fireBullet()
      } else {
        // Snap rocket horizontally toward pointer
        this._touchTargetX = pointer.x
        this._fireBullet()
      }
    })

    // Start
    this.time.delayedCall(900, () => {
      this._gameStartTime = this.time.now
      this._gameActive = true

      this._fuelSpawnTimer = this.time.addEvent({
        delay: this._fuelSpawnInterval,
        callback: () => {
          if (!this._gameActive) return
          this._spawnFuelItem()
          this._fuelSpawnCount++
          // ~1 law-path decoy per 4 fuel items, with safe spacing
          if (this._fuelSpawnCount % 4 === 0) {
            this.time.delayedCall(400 + Math.random() * 300, () => {
              if (this._gameActive) this._spawnLawTarget()
            })
          }
          if (this._fuelSpawnTimer) this._fuelSpawnTimer.delay = this._fuelSpawnInterval
        },
        loop: true,
      })

      this._enemySpawnTimer = this.time.addEvent({
        delay: this._enemySpawnInterval,
        callback: () => {
          if (!this._gameActive) return
          this._spawnEnemy()
          if (this._enemySpawnTimer) this._enemySpawnTimer.delay = this._enemySpawnInterval
        },
        loop: true,
      })

      this._enemyFireTimer = this.time.addEvent({
        delay: this._enemyFireInterval,
        callback: () => {
          if (!this._gameActive) return
          this._enemiesFire()
        },
        loop: true,
      })
    })
  }

  _drawLayerLabels() {
    const layers = [
      { y: 540, label: 'COMFORT ZONE' },
      { y: 430, label: 'UNKNOWN' },
      { y: 330, label: 'ADVENTURE' },
      { y: 230, label: 'HOLY SHIT' },
      { y: 160, label: 'THIS IS MY LIFE NOW' },
    ]

    this._layerLabels = {}
    layers.forEach(layer => {
      const t = this.add.text(1235, layer.y, layer.label, {
        fontFamily: FONT_MONO, fontSize: '10px', fontStyle: 'bold', color: COLORS.GREY_500,
        letterSpacing: 2,
      }).setOrigin(1, 0.5).setAlpha(0.5)
      this._layerLabels[layer.label] = t
    })
  }

  _drawHearts() {
    this._heartGraphics = []
    const startX = 24
    const y = 158
    for (let i = 0; i < this._maxHealth; i++) {
      const cx = startX + i * 36
      const g = this.add.graphics()
      this._drawHeart(g, cx + 14, y, C.SHOCK_RED)
      this._heartGraphics.push(g)
    }
    this.add.text(24, 138, 'HEALTH', {
      fontFamily: FONT_MONO, fontSize: '10px', fontStyle: 'bold', color: COLORS.BONE,
      letterSpacing: 2,
    }).setOrigin(0, 0.5)
  }

  _drawHeart(g, cx, cy, color) {
    g.clear()
    g.fillStyle(color, 1)
    // Pixel-heart shape — square-ish brutalist
    const s = 5
    // Row layout (1=filled)
    const rows = [
      [0,1,1,0,1,1,0],
      [1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1],
      [0,1,1,1,1,1,0],
      [0,0,1,1,1,0,0],
      [0,0,0,1,0,0,0],
    ]
    for (let ry = 0; ry < rows.length; ry++) {
      for (let rx = 0; rx < rows[ry].length; rx++) {
        if (rows[ry][rx]) g.fillRect(cx - 17 + rx * s, cy - 12 + ry * s, s, s)
      }
    }
  }

  _updateHearts() {
    for (let i = 0; i < this._heartGraphics.length; i++) {
      const g = this._heartGraphics[i]
      const cx = 24 + i * 36 + 14
      const y = 158
      if (i < this._health) {
        this._drawHeart(g, cx, y, C.SHOCK_RED)
        g.setAlpha(1)
      } else {
        this._drawHeart(g, cx, y, C.GREY_700)
        g.setAlpha(0.5)
      }
    }
  }

  _drawFuelGauge() {
    const xRight = 1230
    const w = 36, h = 360, yTop = 200
    const segments = 10
    const segH = (h - (segments - 1) * 4) / segments

    const shadow = this.add.graphics()
    shadow.fillStyle(C.BLACK, 1)
    shadow.fillRect(xRight - w / 2 + 4, yTop + 4, w, h)

    const bg = this.add.graphics()
    bg.fillStyle(C.BONE, 1)
    bg.fillRect(xRight - w / 2, yTop, w, h)
    bg.lineStyle(3, C.BLACK, 1)
    bg.strokeRect(xRight - w / 2, yTop, w, h)

    this._gaugeSegments = []
    for (let i = 0; i < segments; i++) {
      const segY = yTop + h - (i + 1) * segH - i * 4
      const seg = this.add.graphics()
      // LIME fill — clearly "good", not red
      seg.fillStyle(C.SHOCK_LIME, 1)
      seg.fillRect(xRight - w / 2 + 4, segY, w - 8, segH)
      seg.setAlpha(0)
      this._gaugeSegments.push(seg)
    }

    this.add.text(xRight, yTop - 24, 'FUEL', {
      fontFamily: FONT_DISPLAY, fontSize: '14px', color: COLORS.BONE,
    }).setOrigin(0.5)

    this._fuelText = this.add.text(xRight, yTop + h + 18, '0%', {
      fontFamily: FONT_DISPLAY, fontSize: '16px', color: COLORS.SHOCK_LIME,
    }).setOrigin(0.5)

    this._gaugeConfig = { xRight, yTop, w, h, segments }
    this._updateFuelGauge()
  }

  _updateFuelGauge() {
    const { segments } = this._gaugeConfig
    const filled = Math.floor((this._fuel / 100) * segments)
    for (let i = 0; i < segments; i++) {
      const shouldShow = i < filled
      const seg = this._gaugeSegments[i]
      if (shouldShow && seg.alpha < 1) {
        this.tweens.add({ targets: seg, alpha: 1, duration: 200 })
      } else if (!shouldShow && seg.alpha > 0) {
        seg.setAlpha(0)
      }
    }
    this._fuelText.setText(`${Math.round(this._fuel)}%`)
  }

  _drawRocket(container) {
    const g = this.add.graphics()

    g.fillStyle(C.BLACK, 1)
    g.fillTriangle(-18 + 4, 4, 18 + 4, 4, 0 + 4, -78 + 4)
    g.fillRect(-18 + 4, -4, 36, 8)

    g.fillStyle(C.BONE, 1)
    g.beginPath()
    g.moveTo(-18, 4)
    g.lineTo(18, 4)
    g.lineTo(14, -55)
    g.lineTo(0, -78)
    g.lineTo(-14, -55)
    g.closePath()
    g.fillPath()

    g.fillStyle(C.SHOCK_RED, 1)
    g.fillTriangle(-14, -55, 14, -55, 0, -78)

    g.lineStyle(3, C.BLACK, 1)
    g.beginPath()
    g.moveTo(-18, 4)
    g.lineTo(18, 4)
    g.lineTo(14, -55)
    g.lineTo(0, -78)
    g.lineTo(-14, -55)
    g.closePath()
    g.strokePath()

    g.fillStyle(C.BLACK, 1)
    g.fillRect(-6, -42, 12, 12)
    g.fillStyle(C.SHOCK_RED, 1)
    g.fillRect(-4, -40, 8, 3)

    g.fillStyle(C.SHOCK_RED, 1)
    g.fillTriangle(-18, 4, -30, 14, -18, -10)
    g.fillTriangle(18, 4, 30, 14, 18, -10)
    g.lineStyle(2, C.BLACK, 1)
    g.strokeTriangle(-18, 4, -30, 14, -18, -10)
    g.strokeTriangle(18, 4, 30, 14, 18, -10)

    g.fillStyle(C.BLACK, 1)
    g.fillRect(-14, -20, 28, 3)

    container.add(g)
    container.bodyGraphics = g
    return g
  }

  // ── Spawning ───────────────────────────────────────────────────
  _spawnFuelItem() {
    const label = FUEL_ITEMS[Math.floor(Math.random() * FUEL_ITEMS.length)]
    const x = 140 + Math.random() * 1000
    const speed = this._fuelDriftSpeed + Math.random() * 30

    const container = this.add.container(x, -50)

    const txt = this.add.text(0, 0, label, {
      fontFamily: FONT_MONO, fontSize: '12px', fontStyle: 'bold',
      color: COLORS.BLACK, align: 'center',
      wordWrap: { width: 180 },
    }).setOrigin(0.5)

    const padX = 14, padY = 10
    const w = Math.max(120, Math.min(220, txt.width + padX * 2))
    const h = txt.height + padY * 2

    const shadow = this.add.graphics()
    shadow.fillStyle(C.BLACK, 1)
    shadow.fillRect(-w / 2 + 4, -h / 2 + 4, w, h)

    const bg = this.add.graphics()
    bg.fillStyle(C.BONE, 1)
    bg.fillRect(-w / 2, -h / 2, w, h)
    bg.lineStyle(4, C.BLACK, 1)
    bg.strokeRect(-w / 2, -h / 2, w, h)

    // Red tag corner (positive cue)
    const tag = this.add.graphics()
    tag.fillStyle(LEVEL_COLORS[1].num, 1)
    tag.fillRect(-w / 2 - 4, -h / 2 - 4, 26, 14)
    tag.lineStyle(2, C.BLACK, 1)
    tag.strokeRect(-w / 2 - 4, -h / 2 - 4, 26, 14)
    const tagText = this.add.text(-w / 2 + 9, -h / 2 + 3, '★', {
      fontFamily: FONT_DISPLAY, fontSize: '11px', color: COLORS.BONE,
    }).setOrigin(0.5)

    container.add([shadow, bg, txt, tag, tagText])

    container.itemSpeed = speed
    container.itemW = w
    container.itemH = h
    container.bg = bg
    container.kind = 'fuel'
    container.maxHits = 1

    this._fuelItems.push(container)
  }

  _spawnEnemy() {
    const label = LAW_ENEMIES[Math.floor(Math.random() * LAW_ENEMIES.length)]
    const x = 180 + Math.random() * 920
    const speed = this._enemyDriftSpeed + Math.random() * 25

    const container = this.add.container(x, -80)

    // 50% larger font + padding
    const txt = this.add.text(0, 0, label, {
      fontFamily: FONT_MONO, fontSize: '18px', fontStyle: 'bold',
      color: COLORS.BONE, align: 'center',
      wordWrap: { width: 260 },
    }).setOrigin(0.5)

    const padX = 22, padY = 16
    const w = Math.max(180, Math.min(320, txt.width + padX * 2))
    const h = txt.height + padY * 2

    const shadow = this.add.graphics()
    shadow.fillStyle(C.SHOCK_RED, 1)
    shadow.fillRect(-w / 2 + 6, -h / 2 + 6, w, h)

    const bg = this.add.graphics()
    bg.fillStyle(C.OFF_BLACK, 1)
    bg.fillRect(-w / 2, -h / 2, w, h)
    bg.lineStyle(6, C.BLACK, 1)
    bg.strokeRect(-w / 2, -h / 2, w, h)

    // Pulsing red border (animated)
    const pulseBorder = this.add.graphics()
    pulseBorder.lineStyle(4, C.SHOCK_RED, 1)
    pulseBorder.strokeRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4)

    // Top LAW indicator banner
    const banner = this.add.graphics()
    banner.fillStyle(C.SHOCK_RED, 1)
    banner.fillRect(-w / 2, -h / 2 - 22, w, 20)
    banner.lineStyle(2, C.BLACK, 1)
    banner.strokeRect(-w / 2, -h / 2 - 22, w, 20)
    const bannerText = this.add.text(0, -h / 2 - 12, '⚠ LAW ENEMY ⚠', {
      fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: COLORS.BONE,
      letterSpacing: 2,
    }).setOrigin(0.5)

    // HP pips along the bottom
    const hpGfx = this.add.graphics()
    container.hpGfx = hpGfx
    const drawHp = (hp) => {
      hpGfx.clear()
      for (let i = 0; i < 3; i++) {
        const px = -w / 2 + 8 + i * 14
        const py = h / 2 + 6
        hpGfx.fillStyle(i < hp ? C.SHOCK_RED : C.GREY_700, 1)
        hpGfx.fillRect(px, py, 10, 6)
        hpGfx.lineStyle(1, C.BLACK, 1)
        hpGfx.strokeRect(px, py, 10, 6)
      }
    }
    drawHp(3)
    container.drawHp = drawHp

    container.add([shadow, bg, pulseBorder, banner, bannerText, txt, hpGfx])

    // Pulse animation on the red border
    container.pulseTween = this.tweens.add({
      targets: pulseBorder, alpha: { from: 1, to: 0.25 },
      duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })

    container.itemSpeed = speed
    container.itemW = w
    container.itemH = h
    container.bg = bg
    container.kind = 'enemy'
    container.hp = 3
    container.maxHits = 3
    container.telegraphing = false

    this._enemies.push(container)
  }

  _spawnLawTarget() {
    const label = LAW_PATH_TARGETS[Math.floor(Math.random() * LAW_PATH_TARGETS.length)]
    // Keep horizontally away from currently visible fuel items so it's not clustered
    let x = 140 + Math.random() * 1000
    for (let tries = 0; tries < 6; tries++) {
      const tooClose = this._fuelItems.some(f => f.y < 200 && Math.abs(f.x - x) < 180)
      if (!tooClose) break
      x = 140 + Math.random() * 1000
    }
    const speed = this._fuelDriftSpeed + Math.random() * 30

    const container = this.add.container(x, -50)

    const txt = this.add.text(0, 0, label, {
      fontFamily: FONT_MONO, fontSize: '12px', fontStyle: 'bold',
      color: COLORS.BONE, align: 'center',
      wordWrap: { width: 180 },
    }).setOrigin(0.5)

    const padX = 14, padY = 10
    const w = Math.max(120, Math.min(220, txt.width + padX * 2))
    const h = txt.height + padY * 2

    const shadow = this.add.graphics()
    shadow.fillStyle(C.BLACK, 1)
    shadow.fillRect(-w / 2 + 4, -h / 2 + 4, w, h)

    const bg = this.add.graphics()
    bg.fillStyle(C.BLACK, 1)
    bg.fillRect(-w / 2, -h / 2, w, h)
    bg.lineStyle(4, C.SHOCK_RED, 1)
    bg.strokeRect(-w / 2, -h / 2, w, h)

    // Hazard yellow corner tag (different from fuel's red)
    const tag = this.add.graphics()
    tag.fillStyle(C.HAZARD_YELLOW, 1)
    tag.fillRect(-w / 2 - 4, -h / 2 - 4, 30, 14)
    tag.lineStyle(2, C.BLACK, 1)
    tag.strokeRect(-w / 2 - 4, -h / 2 - 4, 30, 14)
    const tagText = this.add.text(-w / 2 + 11, -h / 2 + 3, '✗', {
      fontFamily: FONT_DISPLAY, fontSize: '11px', color: COLORS.BLACK,
    }).setOrigin(0.5)

    container.add([shadow, bg, txt, tag, tagText])

    container.itemSpeed = speed
    container.itemW = w
    container.itemH = h
    container.bg = bg
    container.kind = 'lawTarget'

    this._lawTargets.push(container)
  }

  _enemiesFire() {
    // Each enemy has a chance to fire — with a 300ms telegraph first
    this._enemies.forEach(e => {
      if (e.y < 60 || e.y > 480) return
      if (e.telegraphing) return
      if (Math.random() < 0.55) this._telegraphShoot(e)
    })
  }

  _telegraphShoot(enemy) {
    enemy.telegraphing = true
    // Red glow under enemy that grows during 300ms windup
    const glow = this.add.graphics()
    glow.fillStyle(C.SHOCK_RED, 0.75)
    glow.fillCircle(0, enemy.itemH / 2 + 8, 8)
    enemy.add(glow)
    this.tweens.add({
      targets: glow, scale: { from: 0.6, to: 2.2 }, alpha: { from: 0.9, to: 0.3 },
      duration: 300, ease: 'Quad.easeOut',
      onComplete: () => {
        glow.destroy()
        if (enemy.active !== false && this._gameActive && this._enemies.includes(enemy)) {
          this._enemyShoot(enemy)
        }
        enemy.telegraphing = false
      },
    })
  }

  _enemyShoot(enemy) {
    // Bigger glowing red bullet with halo
    const b = this.add.container(enemy.x, enemy.y + enemy.itemH / 2)
    const halo = this.add.graphics()
    halo.fillStyle(C.SHOCK_RED, 0.35)
    halo.fillCircle(0, 0, 18)
    const core = this.add.graphics()
    core.fillStyle(C.SHOCK_RED, 1)
    core.fillRect(-6, -16, 12, 32)
    core.fillStyle(C.HAZARD_YELLOW, 1)
    core.fillRect(-2, -12, 4, 24)
    core.lineStyle(2, C.BLACK, 1)
    core.strokeRect(-6, -16, 12, 32)
    b.add([halo, core])
    b.speed = this._enemyBulletSpeed
    b.halo = halo
    // Pulsing halo for visibility
    this.tweens.add({
      targets: halo, alpha: { from: 0.35, to: 0.75 }, scale: { from: 1, to: 1.4 },
      duration: 220, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })
    this._enemyBullets.push(b)
    AudioCtx.fx('shoot')
  }

  // ── Firing ─────────────────────────────────────────────────────
  _fireBullet() {
    const now = this.time.now
    if (now - this._lastShotAt < this._shotCooldown) return
    this._lastShotAt = now

    const b = this.add.graphics()
    b.fillStyle(C.SHOCK_LIME, 1)
    b.fillRect(-3, -12, 6, 24)
    b.lineStyle(1, C.BLACK, 1)
    b.strokeRect(-3, -12, 6, 24)
    b.x = this._rocketX
    b.y = this._rocketY - 40
    b.speed = this._bulletSpeed
    this._playerBullets.push(b)
    AudioCtx.fx('shoot')

    // Tiny muzzle pop
    Particles.burst(this, this._rocketX, this._rocketY - 50, C.SHOCK_LIME, 4, {
      speed: 80, size: 3, duration: 200, gravity: 0,
    })
  }

  // ── Update ─────────────────────────────────────────────────────
  update(time, delta) {
    if (!this._gameActive) return
    const dt = delta / 1000

    // Tuning ramps with fuel%
    const t = this._fuel / 100
    this._fuelSpawnInterval = Phaser.Math.Linear(1100, 700, t)
    this._enemySpawnInterval = Phaser.Math.Linear(2600, 1300, t)
    this._fuelDriftSpeed = Phaser.Math.Linear(110, 200, t)
    this._enemyDriftSpeed = Phaser.Math.Linear(90, 160, t)

    // Input
    const leftDown = this._cursors.left.isDown || this._keyA.isDown || this._keyLeft.isDown
    const rightDown = this._cursors.right.isDown || this._keyD.isDown || this._keyRight.isDown
    const upDown = this._cursors.up.isDown || this._keyW.isDown || this._keyUp.isDown
    const downDown = this._cursors.down.isDown || this._keyS.isDown || this._keyDown.isDown

    const accel = 2400
    if (leftDown) this._rocketVelX -= accel * dt
    if (rightDown) this._rocketVelX += accel * dt
    if (!leftDown && !rightDown) this._rocketVelX *= 0.86
    this._rocketVelX = Phaser.Math.Clamp(this._rocketVelX, -540, 540)

    if (upDown) this._rocketVelY -= accel * dt
    if (downDown) this._rocketVelY += accel * dt
    if (!upDown && !downDown) this._rocketVelY *= 0.86
    this._rocketVelY = Phaser.Math.Clamp(this._rocketVelY, -380, 380)

    // Touch target (set on tap)
    if (this._touchTargetX != null) {
      const dx = this._touchTargetX - this._rocketX
      if (Math.abs(dx) < 6) this._touchTargetX = null
      else this._rocketVelX = Phaser.Math.Clamp(dx * 4, -540, 540)
    }

    this._rocketX += this._rocketVelX * dt
    this._rocketY += this._rocketVelY * dt
    this._rocketX = Phaser.Math.Clamp(this._rocketX, 50, 1230)
    this._rocketY = Phaser.Math.Clamp(this._rocketY, 500, 690)
    this._rocketContainer.x = this._rocketX
    this._rocketContainer.y = this._rocketY

    // Fire
    if (this._keySpace.isDown) this._fireBullet()

    // Update bullets
    for (let i = this._playerBullets.length - 1; i >= 0; i--) {
      const b = this._playerBullets[i]
      b.y -= b.speed * dt
      if (b.y < -30) { b.destroy(); this._playerBullets.splice(i, 1); continue }
      // Check collisions vs fuel items
      let hit = false
      for (let j = this._fuelItems.length - 1; j >= 0; j--) {
        const f = this._fuelItems[j]
        if (Math.abs(b.x - f.x) <= f.itemW / 2 && Math.abs(b.y - f.y) <= f.itemH / 2) {
          this._onFuelHit(f)
          this._fuelItems.splice(j, 1)
          hit = true
          break
        }
      }
      if (hit) { b.destroy(); this._playerBullets.splice(i, 1); continue }
      // Check collisions vs law-path targets (BAD — penalize)
      for (let j = this._lawTargets.length - 1; j >= 0; j--) {
        const lt = this._lawTargets[j]
        if (Math.abs(b.x - lt.x) <= lt.itemW / 2 && Math.abs(b.y - lt.y) <= lt.itemH / 2) {
          this._onLawTargetShot(lt)
          this._lawTargets.splice(j, 1)
          hit = true
          break
        }
      }
      if (hit) { b.destroy(); this._playerBullets.splice(i, 1); continue }
      // Check collisions vs enemies
      for (let j = this._enemies.length - 1; j >= 0; j--) {
        const e = this._enemies[j]
        if (Math.abs(b.x - e.x) <= e.itemW / 2 && Math.abs(b.y - e.y) <= e.itemH / 2) {
          this._onEnemyHit(e, j)
          hit = true
          break
        }
      }
      if (hit) { b.destroy(); this._playerBullets.splice(i, 1) }
    }

    // Update enemy bullets (now containers with halos + trail)
    for (let i = this._enemyBullets.length - 1; i >= 0; i--) {
      const b = this._enemyBullets[i]
      b.y += b.speed * dt
      // Drop red trail particles occasionally
      if (Math.random() < 0.6) {
        const trail = this.add.rectangle(b.x, b.y - 12, 4, 4, C.SHOCK_RED, 0.8)
        this.tweens.add({
          targets: trail, alpha: 0, scale: 0.3, duration: 280,
          onComplete: () => trail.destroy(),
        })
      }
      if (b.y > 740) { b.destroy(); this._enemyBullets.splice(i, 1); continue }
      // Hit rocket?
      if (Math.abs(b.x - this._rocketX) <= 28 && Math.abs(b.y - this._rocketY) <= 40) {
        // Highlight the bullet right before destroying so player sees what hit them
        const burstFlash = this.add.graphics()
        burstFlash.fillStyle(C.SHOCK_RED, 1)
        burstFlash.fillCircle(b.x, b.y, 24)
        this.tweens.add({
          targets: burstFlash, alpha: 0, scale: 2, duration: 220,
          onComplete: () => burstFlash.destroy(),
        })
        this._takeDamage('bullet')
        b.destroy(); this._enemyBullets.splice(i, 1)
      }
    }

    // Update fuel items (drift down)
    for (let i = this._fuelItems.length - 1; i >= 0; i--) {
      const f = this._fuelItems[i]
      f.y += f.itemSpeed * dt
      if (f.y > 760) { f.destroy(); this._fuelItems.splice(i, 1) }
    }

    // Update law-path targets (drift down — harmless if let through)
    for (let i = this._lawTargets.length - 1; i >= 0; i--) {
      const lt = this._lawTargets[i]
      lt.y += lt.itemSpeed * dt
      if (lt.y > 760) { lt.destroy(); this._lawTargets.splice(i, 1) }
    }

    // Update enemies (drift down)
    for (let i = this._enemies.length - 1; i >= 0; i--) {
      const e = this._enemies[i]
      e.y += e.itemSpeed * dt
      // Reach bottom = damage
      if (e.y > 660) {
        // Highlight the enemy briefly so player sees what hit them
        const flash = this.add.graphics()
        flash.fillStyle(C.SHOCK_RED, 0.9)
        flash.fillRect(-e.itemW / 2, -e.itemH / 2, e.itemW, e.itemH)
        e.add(flash)
        this.tweens.add({
          targets: flash, alpha: 0, duration: 280,
          onComplete: () => flash.destroy(),
        })
        this._takeDamage('enemyReach')
        Particles.burst(this, e.x, e.y, C.SHOCK_RED, 14)
        if (e.pulseTween) e.pulseTween.stop()
        this.tweens.add({
          targets: e, alpha: 0, duration: 250,
          onComplete: () => e.destroy(),
        })
        this._enemies.splice(i, 1)
      }
    }

    this._updateFuelGauge()
    this._updateMultiplier()
    this._updateStats()

    // Auto-launch safety net
    const elapsed = this._gameStartTime > 0 ? (this.time.now - this._gameStartTime) : 0
    if (elapsed > 100000 && this._fuel < 100) this._fuel = 100

    if (this._fuel >= 100) {
      this._fuel = 100
      this._triggerLaunch()
    }
  }

  _updateMultiplier() {
    let mult = 1.0
    if (this._currentStreak === 3) mult = 1.3
    else if (this._currentStreak === 5) mult = 1.6
    else if (this._currentStreak >= 7) mult = 2.0
    if (mult > 1.0) {
      this._multiplierTag.setText(`COMBO X${mult.toFixed(1)}`)
      if (this._multiplierTag.alpha < 1) {
        this.tweens.add({ targets: this._multiplierTag, alpha: 1, duration: 160 })
      }
    } else if (this._multiplierTag.alpha > 0) {
      this.tweens.add({ targets: this._multiplierTag, alpha: 0, duration: 300 })
    }
  }

  _updateStats() {
    this._statsText.setText(`FUEL HITS ${this._totalFuelCollected} · KILLS ${this._totalEnemiesKilled}`)
  }

  // ── Hit handlers ───────────────────────────────────────────────
  _onFuelHit(fuel) {
    this._currentStreak++
    if (this._currentStreak > this._bestStreak) this._bestStreak = this._currentStreak
    let mult = 1.0
    if (this._currentStreak >= 7) mult = 2.0
    else if (this._currentStreak >= 5) mult = 1.6
    else if (this._currentStreak >= 3) mult = 1.3

    const base = 6 + Math.floor(Math.random() * 5) // 6-10
    const gained = Math.max(1, Math.round(base * mult))
    this._fuel = Math.min(100, this._fuel + gained)
    this._totalFuelCollected++
    this._totalHits++

    AudioCtx.fx('catchGood')

    // BONE flash on the card (NO RED, NO SHAKE)
    const flash = this.add.graphics()
    flash.fillStyle(C.BONE, 1)
    flash.fillRect(-fuel.itemW / 2, -fuel.itemH / 2, fuel.itemW, fuel.itemH)
    fuel.add(flash)
    this.tweens.add({
      targets: flash, alpha: 0, duration: 200,
      onComplete: () => flash.destroy(),
    })

    Particles.burst(this, fuel.x, fuel.y, C.BONE, 12, { speed: 260, size: 5 })
    Particles.popup(this, fuel.x, fuel.y - 10, `+${gained} FUEL`, '#d4ff00', { fontSize: '22px' })

    if (mult > 1.0 && this._currentStreak === 3 || this._currentStreak === 5 || this._currentStreak === 7) {
      AudioCtx.fx('combo')
      Particles.popup(this, this._rocketX, this._rocketY - 80, `COMBO X${mult.toFixed(1)}`, '#ffcf00')
    }

    // Item death anim — quick scale-out, no red
    this.tweens.add({
      targets: fuel, scale: 1.3, alpha: 0, duration: 180,
      onComplete: () => fuel.destroy(),
    })
  }

  _onEnemyHit(enemy, idx) {
    enemy.hp--
    if (enemy.drawHp) enemy.drawHp(Math.max(0, enemy.hp))
    AudioCtx.fx('hit')

    // Knockback flash — bone-white impact
    const flash = this.add.graphics()
    flash.fillStyle(C.BONE, 0.8)
    flash.fillRect(-enemy.itemW / 2, -enemy.itemH / 2, enemy.itemW, enemy.itemH)
    enemy.add(flash)
    this.tweens.add({
      targets: flash, alpha: 0, duration: 150,
      onComplete: () => flash.destroy(),
    })

    Particles.burst(this, enemy.x, enemy.y, C.SHOCK_RED, 6, { speed: 180, size: 4 })

    if (enemy.hp <= 0) {
      AudioCtx.fx('kill')
      this._totalEnemiesKilled++
      this._fuel = Math.min(100, this._fuel + 2)
      Particles.burst(this, enemy.x, enemy.y, C.SHOCK_RED, 14, { speed: 320, size: 6 })
      Particles.popup(this, enemy.x, enemy.y - 10, '+2 FUEL', '#d4ff00', { fontSize: '18px' })
      if (enemy.pulseTween) enemy.pulseTween.stop()
      this.tweens.add({
        targets: enemy, scale: 0.4, alpha: 0, duration: 200,
        onComplete: () => enemy.destroy(),
      })
      this._enemies.splice(idx, 1)
    }
  }

  _onLawTargetShot(lt) {
    AudioCtx.fx('catchBad')
    // Big visual: yellow X popup
    Particles.popup(this, lt.x, lt.y - 10, "DON'T SHOOT LAW!", '#ffcf00', { fontSize: '20px' })
    Particles.burst(this, lt.x, lt.y, C.HAZARD_YELLOW, 12, { speed: 220, size: 4 })
    this._currentStreak = 0
    this.tweens.add({
      targets: lt, scale: 1.4, alpha: 0, duration: 220,
      onComplete: () => lt.destroy(),
    })
    this._takeDamage('lawTarget')
  }

  _takeDamage(cause = 'unknown') {
    if (this._fumesMode) {
      this._flashRocket()
      this.cameras.main.shake(120, 0.008)
      AudioCtx.fx('catchBad')
      return
    }

    const hitHeartIdx = this._health - 1
    this._health--
    this._currentStreak = 0
    this._updateHearts()
    this._flashHeart(hitHeartIdx)
    AudioCtx.fx('catchBad')
    this._flashRocket()
    this._drawDamageRing()
    this.cameras.main.shake(260, 0.018)
    this.cameras.main.flash(120, 80, 10, 10)
    Particles.burst(this, this._rocketX, this._rocketY, C.SHOCK_RED, 14, { speed: 240, size: 5 })
    Particles.popup(this, this._rocketX, this._rocketY - 70, '-1 HEALTH', '#ff2d1f', { fontSize: '24px' })

    // Cause-specific sub-popup
    let subLabel = null
    if (cause === 'bullet') subLabel = 'HIT BY LAW BULLET'
    else if (cause === 'enemyReach') subLabel = 'LAW REACHED YOU'
    else if (cause === 'lawTarget') subLabel = 'WRONG TARGET!'
    if (subLabel) {
      const sub = this.add.text(this._rocketX, this._rocketY - 100, subLabel, {
        fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: COLORS.HAZARD_YELLOW,
        letterSpacing: 2,
      }).setOrigin(0.5).setDepth(190)
      this.tweens.add({
        targets: sub, y: this._rocketY - 130, alpha: 0, duration: 800,
        onComplete: () => sub.destroy(),
      })
    }

    if (this._health <= 0) {
      this._health = 0
      this._enterFumesMode()
    }
  }

  _flashHeart(idx) {
    if (idx < 0 || idx >= this._heartGraphics.length) return
    const g = this._heartGraphics[idx]
    if (!g) return
    const cx = 24 + idx * 36 + 14
    const y = 158
    // Draw a giant bone flash where the heart was
    const flash = this.add.graphics()
    flash.fillStyle(C.BONE, 1)
    flash.fillCircle(cx, y, 22)
    this.tweens.add({
      targets: flash, alpha: 0, scale: 2, duration: 360,
      onComplete: () => flash.destroy(),
    })
  }

  _drawDamageRing() {
    const ring = this.add.graphics()
    ring.lineStyle(6, C.SHOCK_RED, 1)
    ring.strokeCircle(0, 0, 40)
    ring.x = this._rocketX
    ring.y = this._rocketY
    this.tweens.add({
      targets: ring, alpha: 0, scale: 2.5, duration: 480, ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    })
  }

  _flashRocket() {
    if (!this._rocketContainer) return
    const flash = this.add.graphics()
    flash.fillStyle(C.SHOCK_RED, 0.7)
    flash.fillRect(-32, -78, 64, 90)
    this._rocketContainer.add(flash)
    this.tweens.add({
      targets: flash, alpha: 0, duration: 280,
      onComplete: () => flash.destroy(),
    })
  }

  _enterFumesMode() {
    if (this._fumesMode) return
    this._fumesMode = true
    const tag = BrutalUI.drawSticker(this, 640, 180, 'RUNNING ON FUMES', {
      fill: C.HAZARD_YELLOW, textColor: COLORS.BLACK, fontSize: '16px',
      rotation: -3 * Math.PI / 180,
    })
    tag.setDepth(200).setScale(0.6).setAlpha(0)
    this.tweens.add({
      targets: tag, scale: 1.0, alpha: 1, duration: 280, ease: 'Back.easeOut',
    })
    this.tweens.add({
      targets: tag, alpha: 0.5, duration: 700, yoyo: true, loop: -1, delay: 500,
    })
  }

  // ── Launch ─────────────────────────────────────────────────────
  _triggerLaunch() {
    if (this._phase !== 'game') return
    this._phase = 'launch'
    this._gameActive = false
    this._launchTime = this.time.now

    if (this._fuelSpawnTimer) { this._fuelSpawnTimer.remove(false); this._fuelSpawnTimer = null }
    if (this._enemySpawnTimer) { this._enemySpawnTimer.remove(false); this._enemySpawnTimer = null }
    if (this._enemyFireTimer) { this._enemyFireTimer.remove(false); this._enemyFireTimer = null }

    const sweepAway = (arr) => {
      arr.forEach(it => {
        this.tweens.add({ targets: it, alpha: 0, duration: 200,
          onComplete: () => it.destroy() })
      })
      arr.length = 0
    }
    sweepAway(this._fuelItems)
    sweepAway(this._lawTargets)
    sweepAway(this._enemies)
    sweepAway(this._playerBullets)
    sweepAway(this._enemyBullets)

    this.tweens.killTweensOf(this._rocketContainer)

    const launch = BrutalUI.drawBlockType(this, 640, 360, 'LAUNCH', {
      fontSize: '120px', color: COLORS.BONE, shadowColor: COLORS.SHOCK_RED, shadowOffset: 10,
      rotation: -3 * Math.PI / 180,
    })
    launch.container.setAlpha(0).setDepth(100)
    this.tweens.add({ targets: launch.container, alpha: 1, duration: 200 })

    AudioCtx.fx('launch')
    Particles.confetti(this, this._rocketX, this._rocketY, 60)
    this.cameras.main.shake(500, 0.02)

    this.time.delayedCall(700, () => {
      this.tweens.add({
        targets: launch.container, scale: 1.6, alpha: 0, duration: 500,
        onComplete: () => launch.container.destroy(),
      })
    })

    for (let i = 0; i < 24; i++) {
      const p = this.add.rectangle(
        this._rocketX + (Math.random() - 0.5) * 40,
        this._rocketY + 10,
        4 + Math.random() * 4, 4 + Math.random() * 4,
        C.GREY_500, 0.6,
      )
      const ang = Math.random() * Math.PI * 2
      const dist = 80 + Math.random() * 100
      this.tweens.add({
        targets: p,
        x: p.x + Math.cos(ang) * dist,
        y: p.y + Math.sin(ang) * dist,
        alpha: 0, scale: 0.3,
        duration: 900 + Math.random() * 400,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      })
    }

    this._flameSize = 1.0
    this._flameActive = true
    this._flameUpdate = this.time.addEvent({
      delay: 60, loop: true,
      callback: () => {
        if (!this._flameActive || !this._rocketContainer) return
        this._drawFlame(this._rocketContainer.x, this._rocketContainer.y + 8, this._flameSize)
      },
    })

    this.time.delayedCall(1100, () => this._beginAscent())
  }

  _drawFlame(x, y, size) {
    this._flameGraphics.clear()
    const baseW = 14 * size
    const baseH = 26 * size
    this._flameGraphics.fillStyle(C.SHOCK_RED, 0.85)
    this._flameGraphics.fillTriangle(
      x - baseW, y, x + baseW, y,
      x + (Math.random() - 0.5) * 4, y + baseH,
    )
    this._flameGraphics.fillStyle(C.BONE, 0.7)
    this._flameGraphics.fillTriangle(
      x - baseW * 0.45, y, x + baseW * 0.45, y,
      x + (Math.random() - 0.5) * 3, y + baseH * 0.65,
    )
  }

  _beginAscent() {
    this.tweens.add({
      targets: this._rocketContainer,
      y: 340, duration: 4500, ease: 'Cubic.easeIn',
    })

    this.time.delayedCall(300,  () => this._crackLayer('COMFORT ZONE'))
    this.time.delayedCall(1500, () => this._crackLayer('UNKNOWN'))
    this.time.delayedCall(2700, () => this._crackLayer('ADVENTURE'))
    this.time.delayedCall(3900, () => this._crackLayer('HOLY SHIT'))
    this.time.delayedCall(5100, () => this._crackLayer('THIS IS MY LIFE NOW'))

    this.tweens.add({
      targets: this, _flameSize: 2.8, duration: 5000, ease: 'Quad.easeIn',
    })

    this.time.delayedCall(6600, () => this._exitLaunch())
  }

  _crackLayer(labelName) {
    const small = this._layerLabels[labelName]
    if (small) {
      this.tweens.add({
        targets: small, scale: 2.4, alpha: 0, duration: 500,
        onComplete: () => small.destroy(),
      })
    }

    const rot = ((Math.random() - 0.5) * 14) * Math.PI / 180
    const fontSize = labelName.length > 12 ? '56px' : '80px'
    const sticker = BrutalUI.drawSticker(this, 640, 320, labelName, {
      fill: C.BONE, textColor: COLORS.BLACK, rotation: rot,
      fontSize, paddingX: 28, paddingY: 16, fontFamily: FONT_DISPLAY, fontStyle: '400',
    })
    sticker.setDepth(80).setScale(0.7).setAlpha(0)

    this.tweens.add({
      targets: sticker, scale: 1.0, alpha: 1, duration: 250, ease: 'Back.easeOut',
    })

    AudioCtx.fx('layerBreak')
    const isFinal = labelName === 'THIS IS MY LIFE NOW'
    const rx = this._rocketContainer ? this._rocketContainer.x : 640
    const ry = this._rocketContainer ? this._rocketContainer.y : 320
    Particles.burst(this, rx, ry, C.BONE, 14, { speed: 350 })
    this.cameras.main.shake(isFinal ? 800 : 220, isFinal ? 0.025 : 0.018)

    if (isFinal) {
      const rev = TextReveal.typewrite(this, labelName, {
        x: 640, y: 480,
        style: { fontFamily: FONT_MONO, fontSize: '18px', color: COLORS.BONE, fontStyle: 'bold' },
        stepMs: 60,
      })
      rev.setDepth(180)
      this._lastReveal = rev
      const skip = () => {
        if (rev && rev.skipReveal) rev.skipReveal()
        this.input.off('pointerdown', skip)
      }
      this.input.on('pointerdown', skip)
      this.time.delayedCall(2400, () => {
        if (rev && rev.active !== false) {
          this.tweens.add({ targets: rev, alpha: 0, duration: 300,
            onComplete: () => rev.destroy() })
        }
      })
    }

    this.time.delayedCall(900, () => {
      this.tweens.add({
        targets: sticker, scale: 1.3, alpha: 0, duration: 300,
        onComplete: () => sticker.destroy(),
      })
    })
  }

  _exitLaunch() {
    this._flameActive = false
    if (this._flameUpdate) { this._flameUpdate.remove(false); this._flameUpdate = null }
    this._flameGraphics.clear()

    this.tweens.add({
      targets: this._rocketContainer,
      y: -100, alpha: 0, duration: 800, ease: 'Cubic.easeIn',
    })

    this.time.delayedCall(900, () => this._runFinishNarrative())
  }

  // ── Finish / Score ─────────────────────────────────────────────
  _runFinishNarrative() {
    this._phase = 'closing'

    const overlay = this.add.rectangle(640, 360, 1280, 720, 0x0a0a0a, 0).setDepth(150)
    this.tweens.add({ targets: overlay, alpha: 0.85, duration: 500 })

    this._finishIndex = 0
    this.time.delayedCall(500, () => this._showNextFinishBeat())
  }

  _showNextFinishBeat() {
    if (this._finishIndex >= FINISH_BEATS.length) {
      this._showScoreCard()
      return
    }
    const text = FINISH_BEATS[this._finishIndex]
    this._finishIndex++
    const box = BrutalUI.showNarrative(this, 640, 360, 720, 200, text,
      () => this._showNextFinishBeat())
    box.setDepth(160)
  }

  _showScoreCard() {
    const elapsed = this._launchTime - this._gameStartTime
    const timeFactor = elapsed < 60000 ? 1.1 : (elapsed < 85000 ? 1.0 : 0.9)

    const fuelScore = Math.min(50, this._totalFuelCollected * 2.5)
    const killScore = Math.min(25, this._totalEnemiesKilled * 5)
    const comboScore = Math.min(15, this._bestStreak * 2)
    const healthBonus = this._fumesMode ? 0 : this._health * 5
    const raw = (fuelScore + killScore + comboScore + healthBonus) * timeFactor
    const finalScore = Math.max(20, Math.min(100, Math.round(raw)))

    const curiosityGain = Math.round(finalScore / 5)
    const cur = this.registry.get(KEYS.STAT_CURIOSITY) ?? 0
    this.registry.set(KEYS.STAT_CURIOSITY, Math.min(100, cur + curiosityGain))

    const elapsedMs = Math.max(0, Math.round(elapsed))
    const isNewBest = recordBestTime(this, KEYS.BEST_T1, elapsedMs)
    addPlayTime(this, elapsedMs)

    AudioCtx.fx('success')
    completeLevel(this, KEYS.SCORE_L1, KEYS.COMPLETED_L1, finalScore)

    const cardW = 680, cardH = 440
    const card = BrutalUI.drawCard(this, 640, 360, cardW, cardH, {
      fill: C.BONE, shadowOffset: 10,
    })
    card.container.setDepth(170).setAlpha(0).setScale(0.9)
    this.tweens.add({ targets: card.container, alpha: 1, scale: 1, duration: 400, ease: 'Back.easeOut' })

    const topBar = this.add.graphics().setDepth(171)
    topBar.fillStyle(C.SHOCK_RED, 1)
    topBar.fillRect(640 - cardW / 2, 360 - cardH / 2, cardW, 10)

    const kicker = this.add.text(640, 360 - cardH / 2 + 36, 'L01 / COMPLETE', {
      fontFamily: FONT_MONO, fontSize: '12px', fontStyle: 'bold', color: COLORS.GREY_700,
      letterSpacing: 4,
    }).setOrigin(0.5).setDepth(172)

    const title = this.add.text(640, 360 - cardH / 2 + 78, 'ESCAPE VELOCITY', {
      fontFamily: FONT_DISPLAY, fontSize: '36px', color: COLORS.BLACK,
    }).setOrigin(0.5).setDepth(172)

    const bigScore = this.add.text(640 - 30, 360 - 30, `${finalScore}`, {
      fontFamily: FONT_DISPLAY, fontSize: '110px', color: COLORS.BLACK,
    }).setOrigin(0.5).setDepth(172)
    const percent = this.add.text(640 + 80, 360 - 70, '%', {
      fontFamily: FONT_DISPLAY, fontSize: '32px', color: COLORS.SHOCK_RED,
    }).setOrigin(0.5).setDepth(172)

    const badge = BrutalUI.drawStatBadge(this, 640 - 230, 360 + 80, curiosityGain, 'CURIOSITY')
    badge.setDepth(172)

    const totalSec = Math.floor(elapsedMs / 1000)
    const mm = Math.floor(totalSec / 60)
    const ss = String(totalSec % 60).padStart(2, '0')
    const timeStr = `${mm}:${ss}`
    const stats = `FUEL HITS ${this._totalFuelCollected}  ·  KILLS ${this._totalEnemiesKilled}\nBEST STREAK ${this._bestStreak}  ·  HEALTH ${this._health}/${this._maxHealth}\nTIME ${timeStr}`
    const statsText = this.add.text(640 + 30, 360 + 80, stats, {
      fontFamily: FONT_MONO, fontSize: '12px', fontStyle: 'bold', color: COLORS.GREY_700,
      letterSpacing: 1, wordWrap: { width: 320 }, align: 'left', lineSpacing: 6,
    }).setOrigin(0, 0.5).setDepth(172)

    let newBestTag = null
    if (isNewBest) {
      newBestTag = BrutalUI.drawSticker(this, 640 + 200, 360 + 40, 'NEW BEST!', {
        fill: C.HAZARD_YELLOW, fontSize: '12px', rotation: 6 * Math.PI / 180,
      })
      newBestTag.setDepth(173).setScale(0.6).setAlpha(0)
      this.tweens.add({
        targets: newBestTag, scale: 1.0, alpha: 1, duration: 320, ease: 'Back.easeOut', delay: 250,
      })
    }

    let returned = false
    const returnToHub = () => {
      if (returned) return
      returned = true
      AudioCtx.fx('click')
      BrutalUI.pageTurn(this, () => this.scene.start('LevelSelectHub'))
    }

    const btn = BrutalUI.drawButton(this, 640, 360 + cardH / 2 - 50, 280, 56, 'BACK TO INDEX', returnToHub, {
      fill: C.SHOCK_RED, labelColor: COLORS.BONE, fontSize: '18px',
    })
    btn.container.setDepth(172)

    this.input.keyboard.once('keydown-SPACE', returnToHub)
  }
}
