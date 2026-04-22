import * as Phaser from 'phaser'
import { KEYS } from '../systems/GameRegistry.js'
import { completeLevel } from './LevelSelectHub.js'
import { COLORS, C, TEXT, FONT_DISPLAY, FONT_MONO } from '../config/theme.js'
import { BrutalUI } from '../ui/BrutalUI.js'

// Level 1 — Shanghai: Build the Rocket / Escape Velocity
// Neo-Brutalist rebuild. Catch falling challenge items with a tray to fuel a
// rocket. Brave items give big fuel; safe items give SMALL fuel (never negative).

const BRAVE_ITEMS = [
  { label: 'FIRST PITCH', fuel: 12 },
  { label: 'COLD APPROACH', fuel: 12 },
  { label: 'DEMO CRASHES', fuel: 14 },
  { label: 'PIVOT AT MIDNIGHT', fuel: 12 },
  { label: 'QUIT SAFE PATH', fuel: 14 },
  { label: 'SAY YES EARLY', fuel: 12 },
  { label: 'LEAD THE TEAM', fuel: 12 },
  { label: 'TELL THE DEAN', fuel: 14 },
  { label: 'TALK TO INVESTOR', fuel: 13 },
  { label: 'PRESENT W/ ACCENT', fuel: 12 },
  { label: 'CALL YOUR FATHER', fuel: 13 },
  { label: 'SKIP LAW EXAM', fuel: 14 },
  { label: 'SLEEP ON FLOOR', fuel: 12 },
]

const SAFE_ITEMS = [
  { label: 'TAKE NOTES', fuel: 3 },
  { label: 'READ TEXTBOOK', fuel: 3 },
  { label: 'FOLLOW SYLLABUS', fuel: 2 },
  { label: 'WAIT FOR INSTRUCTIONS', fuel: 2 },
  { label: 'ASK PERMISSION', fuel: 3 },
  { label: 'PLAY IT SAFE', fuel: 2 },
  { label: 'STICK TO PLAN', fuel: 3 },
  { label: 'HEAD DOWN', fuel: 2 },
  { label: 'CHECK EMAIL', fuel: 3 },
  { label: 'DO ASSIGNMENT', fuel: 3 },
  { label: 'TAKE GOOD NOTES', fuel: 3 },
  { label: 'EMAIL PROFESSOR', fuel: 2 },
  { label: 'PREP FOR BAR', fuel: 3 },
  { label: 'FINISH ASSIGNMENT', fuel: 3 },
]

const INTRO_BEATS = [
  'SHANGHAI. 2014.\n\nINTERNATIONAL COMMERCIAL LAW.\nJIAO TONG UNIVERSITY.\nROW 4. BACK LEFT.',
  'YOU SHOULD BE TAKING NOTES.\nINSTEAD YOU ARE STARING AT THE CLOCK.\n\nSOMETHING IS WRONG WITH THIS PATH.',
  'A FRIEND SENT A FLYER.\n"STARTUP WEEKEND — 54 HOURS.\nBUILD A COMPANY FROM NOTHING."\n\nYOU HAVE A LAW EXAM ON MONDAY.',
]

const FINISH_BEATS = [
  'THE ROCKET IS THROUGH THE CEILING.\nYOU DO NOT GO BACK TO CLASS.',
  'THAT WEEKEND YOU STOPPED PLANNING YOUR LIFE\nAND STARTED BUILDING IT.',
  'A YEAR LATER SWITZERLAND GETS BORING.\nYOU BUY A ONE-WAY TICKET TO MEDELLÍN.',
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
    this._activeItems = []
    this._fuel = 0
    this._totalCaught = 0
    this._totalMissed = 0
    this._totalSpawned = 0
    this._bravesCaught = 0
    this._safesCaught = 0
    this._currentStreak = 0
    this._bestStreak = 0
    this._gameStartTime = 0
    this._launchTime = 0
    this._spawnCount = 0

    this._spawnInterval = 1400
    this._baseSpeed = 130
    this._speedVariance = 25
    this._braveChance = 0.32
    this._maxItems = 3

    this._trayX = 640
    this._trayVelX = 0
    this._useMouseControl = false
    this._mouseTargetX = 640

    // Background: black + faint grid
    this._drawBackground()

    // Home button — always visible, always works
    BrutalUI.drawHomeButton(this, {
      onClick: () => {
        this.cameras.main.fadeOut(250, 10, 10, 10)
        this.time.delayedCall(270, () => this.scene.start('LevelSelectHub'))
      },
    })

    // Build intro
    this._buildIntro()

    // Shutdown cleanup
    this.events.once('shutdown', () => {
      this.tweens.killAll()
      if (this._spawnTimer) this._spawnTimer.remove(false)
      if (this._smokeTimer) this._smokeTimer.remove(false)
      if (this._rumbleTimer) this._rumbleTimer.remove(false)
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
    // Chapter header
    this._introHeader = this.add.text(40, 100, 'CHAPTER 01 / SHANGHAI', {
      fontFamily: FONT_MONO, fontSize: '12px', fontStyle: 'bold', color: COLORS.SHOCK_RED,
      letterSpacing: 3,
    })

    this._introTitle = BrutalUI.drawBlockType(this, 640, 220, 'THE SPARK', {
      fontSize: '84px', color: COLORS.BONE, shadowColor: COLORS.SHOCK_RED, shadowOffset: 6,
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
    BrutalUI.showNarrative(this, 640, 440, 760, 180, text, () => this._showNextIntroBeat())
  }

  _showStartupWeekendSticker() {
    const hint = this.add.text(640, 380, 'CLICK THE STICKER TO BREAK OUT', {
      fontFamily: FONT_MONO, fontSize: '12px', fontStyle: 'bold', color: COLORS.BONE,
      letterSpacing: 2,
    }).setOrigin(0.5).setAlpha(0)
    this.tweens.add({ targets: hint, alpha: 0.8, duration: 400 })

    const sticker = BrutalUI.drawSticker(this, 640, 460, 'STARTUP WEEKEND', {
      fill: C.SHOCK_RED, textColor: COLORS.BONE, rotation: -6 * Math.PI / 180,
      fontSize: '32px', paddingX: 26, paddingY: 14, fontFamily: FONT_DISPLAY, fontStyle: '400',
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
    this._introSticker = sticker
    this._introHint = hint
    this._introStickerHit = hit
  }

  // ── Game Field ─────────────────────────────────────────────────
  _buildGameField() {
    this._phase = 'game'

    // Level title bar (top)
    const bar = this.add.graphics()
    bar.fillStyle(C.BONE, 1)
    bar.fillRect(0, 70, 1280, 50)
    bar.fillStyle(C.SHOCK_RED, 1)
    bar.fillRect(0, 115, 1280, 5)
    this._topBar = bar

    this._titleText = this.add.text(180, 95, 'L01 // ESCAPE VELOCITY', {
      fontFamily: FONT_DISPLAY, fontSize: '20px', color: COLORS.BLACK,
    }).setOrigin(0, 0.5)

    this._subText = this.add.text(1260, 95, 'CATCH THE BRAVE. FEED THE ROCKET.', {
      fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: COLORS.GREY_700,
      letterSpacing: 2,
    }).setOrigin(1, 0.5)

    // Layer labels (right side - will shatter on launch)
    this._drawLayerLabels()

    // Fuel gauge (segmented bar, left side)
    this._drawFuelGauge()

    // Catch line
    const line = this.add.graphics()
    line.lineStyle(3, C.SHOCK_RED, 0.4)
    line.beginPath(); line.moveTo(130, 585); line.lineTo(1150, 585); line.strokePath()

    // Rocket
    this._rocketContainer = this.add.container(640, 620).setAlpha(0).setScale(0.8)
    this._drawRocket(this._rocketContainer)
    this.tweens.add({ targets: this._rocketContainer, alpha: 1, scale: 1, duration: 400 })

    // Flame
    this._flameGraphics = this.add.graphics().setDepth(-1)

    // Tray
    this._tray = this._drawTray(this._trayX, 570)

    // Combo tag
    this._multiplierTag = this.add.text(90, 650, '', {
      fontFamily: FONT_DISPLAY, fontSize: '24px', color: COLORS.SHOCK_RED,
    }).setOrigin(0, 0.5).setAlpha(0)

    // Stats HUD
    this._statsText = this.add.text(1260, 650, 'CAUGHT 0 · MISSED 0', {
      fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: COLORS.GREY_500,
      letterSpacing: 2,
    }).setOrigin(1, 0.5)

    // Input
    this._cursors = this.input.keyboard.createCursorKeys()
    this._keyA = this.input.keyboard.addKey(65)
    this._keyD = this.input.keyboard.addKey(68)
    this._keyLeft = this.input.keyboard.addKey(37)
    this._keyRight = this.input.keyboard.addKey(39)

    this.input.on('pointermove', (pointer) => {
      if (this._phase !== 'game') return
      this._useMouseControl = true
      this._mouseTargetX = pointer.x
    })

    // Start spawning after a short beat
    this.time.delayedCall(900, () => {
      this._gameStartTime = this.time.now
      this._gameActive = true
      this._spawnTimer = this.time.addEvent({
        delay: this._spawnInterval,
        callback: () => {
          if (!this._gameActive) return
          if (this._activeItems.length < this._maxItems) this._spawnItem()
          if (this._spawnTimer) this._spawnTimer.delay = this._spawnInterval
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
      { y: 155, label: 'THIS IS MY LIFE NOW' },
    ]

    this._layerLabels = {}
    layers.forEach(layer => {
      const t = this.add.text(1240, layer.y, layer.label, {
        fontFamily: FONT_MONO, fontSize: '10px', fontStyle: 'bold', color: COLORS.GREY_500,
        letterSpacing: 2,
      }).setOrigin(1, 0.5).setAlpha(0.7)
      this._layerLabels[layer.label] = t
    })
  }

  _drawFuelGauge() {
    const x = 50, yTop = 200, w = 36, h = 360
    const segments = 10
    const segH = (h - (segments - 1) * 4) / segments

    // Shadow
    const shadow = this.add.graphics()
    shadow.fillStyle(C.BLACK, 1)
    shadow.fillRect(x - w / 2 + 4, yTop + 4, w, h)

    // Bg
    const bg = this.add.graphics()
    bg.fillStyle(C.BONE, 1)
    bg.fillRect(x - w / 2, yTop, w, h)
    bg.lineStyle(3, C.BLACK, 1)
    bg.strokeRect(x - w / 2, yTop, w, h)

    this._gaugeSegments = []
    for (let i = 0; i < segments; i++) {
      const segY = yTop + h - (i + 1) * segH - i * 4
      const seg = this.add.graphics()
      seg.fillStyle(C.SHOCK_RED, 1)
      seg.fillRect(x - w / 2 + 4, segY, w - 8, segH)
      seg.setAlpha(0)
      this._gaugeSegments.push(seg)
    }

    this.add.text(x, yTop - 28, 'FUEL', {
      fontFamily: FONT_DISPLAY, fontSize: '16px', color: COLORS.BONE,
    }).setOrigin(0.5)

    this._fuelText = this.add.text(x, yTop + h + 20, '0%', {
      fontFamily: FONT_DISPLAY, fontSize: '18px', color: COLORS.BONE,
    }).setOrigin(0.5)

    this._gaugeConfig = { x, yTop, w, h, segments }
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

    // Drop shadow
    g.fillStyle(C.BLACK, 1)
    g.fillTriangle(-18 + 4, 4, 18 + 4, 4, 0 + 4, -78 + 4)
    g.fillRect(-18 + 4, -4, 36, 8)

    // Body (bone)
    g.fillStyle(C.BONE, 1)
    g.beginPath()
    g.moveTo(-18, 4)
    g.lineTo(18, 4)
    g.lineTo(14, -55)
    g.lineTo(0, -78)
    g.lineTo(-14, -55)
    g.closePath()
    g.fillPath()

    // Red nose cone
    g.fillStyle(C.SHOCK_RED, 1)
    g.fillTriangle(-14, -55, 14, -55, 0, -78)

    // Black outline
    g.lineStyle(3, C.BLACK, 1)
    g.beginPath()
    g.moveTo(-18, 4)
    g.lineTo(18, 4)
    g.lineTo(14, -55)
    g.lineTo(0, -78)
    g.lineTo(-14, -55)
    g.closePath()
    g.strokePath()

    // Window
    g.fillStyle(C.BLACK, 1)
    g.fillRect(-6, -42, 12, 12)
    g.fillStyle(C.SHOCK_RED, 1)
    g.fillRect(-4, -40, 8, 3)

    // Fins (angular, red)
    g.fillStyle(C.SHOCK_RED, 1)
    g.fillTriangle(-18, 4, -30, 14, -18, -10)
    g.fillTriangle(18, 4, 30, 14, 18, -10)
    g.lineStyle(2, C.BLACK, 1)
    g.strokeTriangle(-18, 4, -30, 14, -18, -10)
    g.strokeTriangle(18, 4, 30, 14, 18, -10)

    // Body stripe
    g.fillStyle(C.BLACK, 1)
    g.fillRect(-14, -20, 28, 3)

    container.add(g)
    return g
  }

  _drawTray(x, y) {
    const container = this.add.container(x, y)

    const shadow = this.add.graphics()
    shadow.fillStyle(C.BLACK, 1)
    shadow.fillRect(-70 + 4, -12 + 4, 140, 18)

    const bg = this.add.graphics()
    bg.fillStyle(C.BONE, 1)
    bg.fillRect(-70, -12, 140, 18)
    bg.lineStyle(3, C.BLACK, 1)
    bg.strokeRect(-70, -12, 140, 18)

    const stripe = this.add.graphics()
    stripe.fillStyle(C.SHOCK_RED, 1)
    stripe.fillRect(-70, -12, 140, 4)

    container.add([shadow, bg, stripe])
    return container
  }

  // ── Items ──────────────────────────────────────────────────────
  _spawnItem() {
    let isBrave
    if (this._spawnCount < 2) isBrave = false
    else isBrave = Math.random() < this._braveChance
    this._spawnCount++

    // Mercy rule
    const elapsed = this._gameStartTime > 0 ? (this.time.now - this._gameStartTime) : 0
    if (elapsed > 70000 && this._fuel < 70) isBrave = true

    const pool = isBrave ? BRAVE_ITEMS : SAFE_ITEMS
    const template = pool[Math.floor(Math.random() * pool.length)]

    const x = 150 + Math.random() * 980
    const speed = this._baseSpeed + Math.random() * this._speedVariance

    const item = this._createItemVisual(x, -60, template, isBrave)
    item.itemSpeed = speed
    item.fuel = template.fuel
    item.isBrave = isBrave

    this._activeItems.push(item)
    this._totalSpawned++
  }

  _createItemVisual(x, y, template, isBrave) {
    const container = this.add.container(x, y)

    const fill = isBrave ? C.BONE : C.GREY_500
    const textColor = isBrave ? COLORS.BLACK : COLORS.BONE
    const alpha = isBrave ? 1 : 0.85

    const label = this.add.text(0, 0, template.label, {
      fontFamily: FONT_MONO, fontSize: isBrave ? '12px' : '11px', fontStyle: 'bold',
      color: textColor, align: 'center',
    }).setOrigin(0.5)

    const padX = 14, padY = 10
    const w = Math.max(110, label.width + padX * 2)
    const h = label.height + padY * 2

    const shadow = this.add.graphics()
    shadow.fillStyle(C.BLACK, 1)
    shadow.fillRect(-w / 2 + 4, -h / 2 + 4, w, h)

    const bg = this.add.graphics()
    bg.fillStyle(fill, alpha)
    bg.fillRect(-w / 2, -h / 2, w, h)
    bg.lineStyle(3, C.BLACK, 1)
    bg.strokeRect(-w / 2, -h / 2, w, h)

    container.add([shadow, bg, label])

    if (isBrave) {
      // red tag sticker on corner
      const tag = this.add.graphics()
      tag.fillStyle(C.SHOCK_RED, 1)
      tag.fillRect(-w / 2 - 4, -h / 2 - 4, 22, 12)
      tag.lineStyle(2, C.BLACK, 1)
      tag.strokeRect(-w / 2 - 4, -h / 2 - 4, 22, 12)
      const tagText = this.add.text(-w / 2 + 7, -h / 2 + 2, '!', {
        fontFamily: FONT_DISPLAY, fontSize: '11px', color: COLORS.BONE,
      }).setOrigin(0.5)
      container.add([tag, tagText])
    }

    container.itemWidth = w
    container.itemHeight = h
    return container
  }

  // ── Update ─────────────────────────────────────────────────────
  update(time, delta) {
    if (!this._gameActive) return
    const dt = delta / 1000

    // Difficulty ramp
    const t = this._fuel / 100
    this._spawnInterval = Phaser.Math.Linear(1400, 650, t)
    this._baseSpeed = Phaser.Math.Linear(130, 280, t)
    this._speedVariance = Phaser.Math.Linear(25, 70, t)
    this._braveChance = Phaser.Math.Linear(0.32, 0.55, t)
    this._maxItems = Math.floor(Phaser.Math.Linear(3, 6, t))

    // Tray movement
    const leftDown = this._cursors.left.isDown || this._keyA.isDown || this._keyLeft.isDown
    const rightDown = this._cursors.right.isDown || this._keyD.isDown || this._keyRight.isDown
    if (leftDown || rightDown) this._useMouseControl = false

    if (this._useMouseControl) {
      this._trayX += (this._mouseTargetX - this._trayX) * 0.2
    } else {
      let accel = 0
      if (leftDown) accel = -2200
      if (rightDown) accel = 2200
      if (accel !== 0) {
        this._trayVelX += accel * dt
        this._trayVelX = Phaser.Math.Clamp(this._trayVelX, -520, 520)
      } else {
        this._trayVelX *= 0.85
        if (Math.abs(this._trayVelX) < 5) this._trayVelX = 0
      }
      this._trayX += this._trayVelX * dt
    }
    this._trayX = Phaser.Math.Clamp(this._trayX, 130, 1150)
    this._tray.x = this._trayX

    // Items
    for (let i = this._activeItems.length - 1; i >= 0; i--) {
      const item = this._activeItems[i]
      item.y += item.itemSpeed * dt
      if (item.y >= 555 && item.y <= 595) {
        if (Math.abs(item.x - this._trayX) <= 72) {
          this._onCatch(item)
          this._activeItems.splice(i, 1)
          continue
        }
      }
      if (item.y > 680) {
        this._onMiss(item)
        this._activeItems.splice(i, 1)
      }
    }

    this._updateFuelGauge()
    this._updateMultiplier()
    this._updateStats()

    // Rocket vibration over 60% fuel
    if (this._fuel >= 60 && !this._rocketVibrating) {
      this._rocketVibrating = true
      this.tweens.add({
        targets: this._rocketContainer,
        x: { from: 638, to: 642 }, duration: 70, yoyo: true, loop: -1,
      })
    }

    // Smoke at 40%+
    if (this._fuel >= 40 && !this._smokeTimer) {
      this._smokeTimer = this.time.addEvent({
        delay: 220, callback: () => this._emitSmoke(), loop: true,
      })
    }

    // Mercy cap
    const elapsed = this._gameStartTime > 0 ? (this.time.now - this._gameStartTime) : 0
    if (elapsed > 95000 && this._fuel < 100) this._fuel = 100

    if (this._fuel >= 100) {
      this._fuel = 100
      this._triggerLaunch()
    }
  }

  _updateMultiplier() {
    let mult = 1.0
    if (this._currentStreak === 2) mult = 1.3
    else if (this._currentStreak === 3) mult = 1.6
    else if (this._currentStreak >= 4) mult = 2.0
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
    this._statsText.setText(`CAUGHT ${this._totalCaught} · MISSED ${this._totalMissed}`)
  }

  _emitSmoke() {
    if (!this._rocketContainer) return
    const rx = this._rocketContainer.x
    const ry = this._rocketContainer.y + 10
    for (let i = 0; i < 2; i++) {
      const p = this.add.rectangle(
        rx + (Math.random() - 0.5) * 22, ry,
        4 + Math.random() * 3, 4 + Math.random() * 3,
        C.GREY_500, 0.6,
      )
      this.tweens.add({
        targets: p,
        y: ry + 40 + Math.random() * 30,
        x: p.x + (Math.random() - 0.5) * 40,
        alpha: 0, scale: 0.3,
        duration: 600 + Math.random() * 400,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      })
    }
  }

  // ── Catch / Miss ───────────────────────────────────────────────
  _onCatch(item) {
    let mult = 1.0
    if (item.isBrave) {
      this._currentStreak++
      if (this._currentStreak === 2) mult = 1.3
      else if (this._currentStreak === 3) mult = 1.6
      else if (this._currentStreak >= 4) mult = 2.0
      if (this._currentStreak > this._bestStreak) this._bestStreak = this._currentStreak
      this._bravesCaught++
    } else {
      this._currentStreak = 0
      this._safesCaught++
    }

    // CRITICAL: fuel is ALWAYS positive. Brave big, safe small.
    const gained = Math.max(1, item.fuel * mult)
    this._fuel = Math.min(100, this._fuel + gained)
    this._totalCaught++

    if (item.isBrave) {
      this.cameras.main.shake(140, 0.003)
      const flash = this.add.rectangle(640, 360, 1280, 720, C.SHOCK_RED, 0.12).setDepth(50)
      this.tweens.add({ targets: flash, alpha: 0, duration: 260,
        onComplete: () => flash.destroy() })
    }

    this.tweens.add({
      targets: item,
      scale: item.isBrave ? 1.3 : 0.5,
      alpha: 0, duration: 200,
      onComplete: () => item.destroy(),
    })
  }

  _onMiss(item) {
    this._totalMissed++
    const mx = item.x
    for (let i = 0; i < 4; i++) {
      const frag = this.add.rectangle(mx + (Math.random() - 0.5) * 20, 680,
        5, 3, C.GREY_500, 0.7)
      this.tweens.add({
        targets: frag,
        y: 680 + 60, x: mx + (Math.random() - 0.5) * 100,
        alpha: 0, duration: 400, ease: 'Quad.easeIn',
        onComplete: () => frag.destroy(),
      })
    }
    item.destroy()
  }

  // ── Launch ─────────────────────────────────────────────────────
  _triggerLaunch() {
    if (this._phase !== 'game') return
    this._phase = 'launch'
    this._gameActive = false
    this._launchTime = this.time.now

    if (this._spawnTimer) { this._spawnTimer.remove(false); this._spawnTimer = null }
    if (this._smokeTimer) { this._smokeTimer.remove(false); this._smokeTimer = null }

    this._activeItems.forEach(it => {
      this.tweens.add({ targets: it, alpha: 0, duration: 200,
        onComplete: () => it.destroy() })
    })
    this._activeItems = []

    this.tweens.add({ targets: this._tray, alpha: 0, duration: 300 })
    this.tweens.killTweensOf(this._rocketContainer)

    // LAUNCH block type
    const launch = BrutalUI.drawBlockType(this, 640, 360, 'LAUNCH', {
      fontSize: '140px', color: COLORS.BONE, shadowColor: COLORS.SHOCK_RED, shadowOffset: 10,
      rotation: -3 * Math.PI / 180,
    })
    launch.container.setAlpha(0).setDepth(100)
    this.tweens.add({ targets: launch.container, alpha: 1, duration: 200 })
    this.cameras.main.shake(500, 0.008)

    this.time.delayedCall(700, () => {
      this.tweens.add({
        targets: launch.container, scale: 1.6, alpha: 0, duration: 500,
        onComplete: () => launch.container.destroy(),
      })
    })

    // Smoke burst
    for (let i = 0; i < 24; i++) {
      const p = this.add.rectangle(
        this._rocketContainer.x + (Math.random() - 0.5) * 40,
        this._rocketContainer.y + 10,
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

    // Flame loop
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
    // Rocket stays on screen (moves up to center), layers shatter one by one
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
    // Shatter the small right-side label
    const small = this._layerLabels[labelName]
    if (small) {
      this.tweens.add({
        targets: small, scale: 2.4, alpha: 0, duration: 500,
        onComplete: () => small.destroy(),
      })
    }

    // Huge tilted sticker center
    const rot = ((Math.random() - 0.5) * 14) * Math.PI / 180
    const fontSize = labelName === 'THIS IS MY LIFE NOW' ? '72px' : '96px'
    const sticker = BrutalUI.drawSticker(this, 640, 300, labelName, {
      fill: C.BONE, textColor: COLORS.BLACK, rotation: rot,
      fontSize, paddingX: 30, paddingY: 18, fontFamily: FONT_DISPLAY, fontStyle: '400',
    })
    sticker.setDepth(80).setScale(0.7).setAlpha(0)

    this.tweens.add({
      targets: sticker, scale: 1.0, alpha: 1, duration: 250, ease: 'Back.easeOut',
    })
    this.cameras.main.shake(220, 0.004)

    this.time.delayedCall(900, () => {
      this.tweens.add({
        targets: sticker, scale: 1.4, alpha: 0, duration: 300,
        onComplete: () => sticker.destroy(),
      })
    })
  }

  _exitLaunch() {
    this._flameActive = false
    if (this._flameUpdate) { this._flameUpdate.remove(false); this._flameUpdate = null }
    this._flameGraphics.clear()

    // Fade rocket out upward
    this.tweens.add({
      targets: this._rocketContainer,
      y: -100, alpha: 0, duration: 800, ease: 'Cubic.easeIn',
    })

    this.time.delayedCall(900, () => this._runFinishNarrative())
  }

  // ── Finish / Score ─────────────────────────────────────────────
  _runFinishNarrative() {
    this._phase = 'closing'

    // Dim and clear gameplay hud
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
    const box = BrutalUI.showNarrative(this, 640, 360, 760, 200, text,
      () => this._showNextFinishBeat())
    box.setDepth(160)
  }

  _showScoreCard() {
    // Calculate score
    const braveRatio = this._bravesCaught / Math.max(1, this._totalCaught)
    const catchRate = this._totalCaught / Math.max(1, this._totalSpawned)
    const elapsed = this._launchTime - this._gameStartTime
    const timeFactor = elapsed < 50000 ? 1.1 : (elapsed < 70000 ? 1.0 : 0.9)
    const braveScore = braveRatio * 50
    const catchScore = catchRate * 30
    const comboScore = this._bestStreak * 5
    const raw = (braveScore + catchScore + comboScore) * timeFactor
    const finalScore = Math.max(20, Math.min(100, Math.round(raw)))

    const curiosityGain = Math.round(finalScore / 5)
    const cur = this.registry.get(KEYS.STAT_CURIOSITY) ?? 0
    this.registry.set(KEYS.STAT_CURIOSITY, Math.min(100, cur + curiosityGain))

    completeLevel(this, KEYS.SCORE_L1, KEYS.COMPLETED_L1, finalScore)

    // Card container
    const cardW = 680, cardH = 440
    const card = BrutalUI.drawCard(this, 640, 360, cardW, cardH, {
      fill: C.BONE, shadowOffset: 10,
    })
    card.container.setDepth(170).setAlpha(0).setScale(0.9)
    this.tweens.add({ targets: card.container, alpha: 1, scale: 1, duration: 400, ease: 'Back.easeOut' })

    // Top red bar
    const topBar = this.add.graphics().setDepth(171)
    topBar.fillStyle(C.SHOCK_RED, 1)
    topBar.fillRect(640 - cardW / 2, 360 - cardH / 2, cardW, 10)

    const kicker = this.add.text(640, 360 - cardH / 2 + 40, 'L01 / COMPLETE', {
      fontFamily: FONT_MONO, fontSize: '12px', fontStyle: 'bold', color: COLORS.GREY_700,
      letterSpacing: 4,
    }).setOrigin(0.5).setDepth(172)

    const title = this.add.text(640, 360 - cardH / 2 + 80, 'ESCAPE VELOCITY', {
      fontFamily: FONT_DISPLAY, fontSize: '42px', color: COLORS.BLACK,
    }).setOrigin(0.5).setDepth(172)

    const bigScore = this.add.text(640, 360 - 30, `${finalScore}`, {
      fontFamily: FONT_DISPLAY, fontSize: '120px', color: COLORS.BLACK,
    }).setOrigin(0.5).setDepth(172)
    const percent = this.add.text(640 + 100, 360 - 70, '%', {
      fontFamily: FONT_DISPLAY, fontSize: '36px', color: COLORS.SHOCK_RED,
    }).setOrigin(0.5).setDepth(172)

    // Stat badge (Curiosity)
    const badge = BrutalUI.drawStatBadge(this, 640 - 230, 360 + 70, curiosityGain, 'CURIOSITY')
    badge.setDepth(172)

    // Stats strip
    const stats = `BRAVE ${this._bravesCaught} · SAFE ${this._safesCaught} · BEST STREAK ${this._bestStreak} · CATCH ${Math.round(catchRate * 100)}%`
    const statsText = this.add.text(640 + 40, 360 + 70, stats, {
      fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: COLORS.GREY_700,
      letterSpacing: 1, wordWrap: { width: 340 }, align: 'left', lineSpacing: 6,
    }).setOrigin(0, 0.5).setDepth(172)

    // CTA button
    let returned = false
    const returnToHub = () => {
      if (returned) return
      returned = true
      this.cameras.main.fadeOut(400, 10, 10, 10)
      this.time.delayedCall(420, () => this.scene.start('LevelSelectHub'))
    }

    const btn = BrutalUI.drawButton(this, 640, 360 + cardH / 2 - 50, 280, 56, 'BACK TO INDEX', returnToHub, {
      fill: C.SHOCK_RED, labelColor: COLORS.BONE, fontSize: '20px',
    })
    btn.container.setDepth(172)

    this.input.keyboard.once('keydown-SPACE', returnToHub)

    this._scoreCleanup = [topBar, kicker, title, bigScore, percent, badge, statsText]
  }
}
