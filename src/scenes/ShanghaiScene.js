import * as Phaser from 'phaser'
import { KEYS, saveRegistry } from '../systems/GameRegistry.js'
import { completeLevel } from './LevelSelectHub.js'
import { COLORS, TEXT, C } from '../config/theme.js'
import { JournalUI } from '../ui/JournalUI.js'

// Level 1 — Shanghai: Build the Rocket / Escape Velocity
// Catch falling "challenge" items with a tray to fuel a rocket. Brave items fuel
// more than safe ones. At 100% fuel the rocket launches through 5 sky layers.

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

export class ShanghaiScene extends Phaser.Scene {
  constructor() {
    super('ShanghaiScene')
  }

  create() {
    this.cameras.main.fadeIn(500, 0, 0, 0)
    this._playerName = this.registry.get(KEYS.PLAYER_NAME) ?? 'friend'

    // State
    this._phase = 'intro'  // intro | game | launch | closing
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

    // Difficulty (updated each frame)
    this._spawnInterval = 1400
    this._baseSpeed = 120
    this._speedVariance = 20
    this._braveChance = 0.25
    this._maxItems = 3

    // Event flags for fuel milestones
    this._evt20 = false
    this._evt33 = false
    this._evt50 = false
    this._evt66 = false
    this._evt85 = false

    // Tray state
    this._trayX = 640
    this._trayVelX = 0
    this._useMouseControl = false
    this._mouseTargetX = 640

    // Parchment background
    JournalUI.drawParchment(this, 0, 0, 1280, 720)
    JournalUI.drawPageNumber(this, 2)

    // Build intro
    this._buildIntro()

    // Shutdown cleanup
    this.events.once('shutdown', () => {
      this.tweens.killAll()
      if (this._spawnTimer) this._spawnTimer.remove(false)
      if (this._smokeTimer) this._smokeTimer.remove(false)
      if (this._rumbleTimer) this._rumbleTimer.remove(false)
      if (this.input && this.input.keyboard) this.input.keyboard.removeAllListeners()
      if (this.input) this.input.removeAllListeners()
    }, this)
  }

  // ── Intro (Grey Law Lecture) ───────────────────────────────────
  _buildIntro() {
    const greyOverlay = this.add.rectangle(640, 360, 1280, 720, 0x888888, 0.25)
    this._greyOverlay = greyOverlay

    const introTexts = []

    const chapterLabel = this.add.text(40, 30, 'Chapter 1', TEXT.label).setAlpha(0)
    const placeLabel = this.add.text(40, 50, 'Shanghai, 2014', {
      ...TEXT.heading,
      fontStyle: 'bold',
    }).setAlpha(0)
    introTexts.push(chapterLabel, placeLabel)

    const center = this.add.text(640, 280,
      'International Commercial Law.\nJiao Tong University.\nRow 4. Back left.',
      { ...TEXT.chapter, fontSize: '20px', align: 'center', lineSpacing: 10 }
    ).setOrigin(0.5).setAlpha(0)
    introTexts.push(center)

    const below = this.add.text(640, 400,
      'You should be taking notes.\nInstead, you\'re staring at the clock.',
      { ...TEXT.bodyItalic, fontSize: '15px', color: COLORS.INK_LIGHT, align: 'center', lineSpacing: 8 }
    ).setOrigin(0.5).setAlpha(0)
    introTexts.push(below)

    const prompt = this.add.text(640, 620, 'PRESS SPACE to skip class',
      { ...TEXT.small, color: COLORS.INK_FADED }
    ).setOrigin(0.5).setAlpha(0)
    introTexts.push(prompt)

    this._introTexts = introTexts

    // Fade-ins
    this.tweens.add({ targets: [chapterLabel, placeLabel], alpha: 1, duration: 400, delay: 300 })
    this.tweens.add({ targets: center, alpha: 1, duration: 600, delay: 500 })
    this.tweens.add({ targets: below, alpha: 1, duration: 600, delay: 1500 })
    this.tweens.add({
      targets: prompt,
      alpha: { from: 0.3, to: 0.7 },
      duration: 800,
      yoyo: true,
      loop: -1,
      delay: 3000,
    })

    // Input / auto-advance
    this._introAdvanced = false
    this.input.keyboard.once('keydown-SPACE', () => this._transitionToGame())
    this.time.delayedCall(5000, () => this._transitionToGame())
  }

  _transitionToGame() {
    if (this._introAdvanced) return
    this._introAdvanced = true

    this.tweens.add({ targets: this._greyOverlay, alpha: 0, duration: 800, ease: 'Quad.easeOut' })
    this._introTexts.forEach(t => {
      this.tweens.killTweensOf(t)
      this.tweens.add({ targets: t, alpha: 0, duration: 400 })
    })

    this.cameras.main.shake(300, 0.003)

    this.time.delayedCall(900, () => {
      this._introTexts.forEach(t => t.destroy())
      if (this._greyOverlay) this._greyOverlay.destroy()
      this._buildGameField()
    })
  }

  // ── Game Field Construction ────────────────────────────────────
  _buildGameField() {
    this._phase = 'game'

    // Sky layers
    this._drawSkyLayers()

    // Fuel gauge
    this._drawFuelGauge()

    // Catch-zone ruled line
    JournalUI.drawRuledLine(this, 90, 585, 1200, 585, 1)

    // Rocket
    this._rocketContainer = this.add.container(640, 600)
    this._rocketContainer.setAlpha(0).setScale(0.8)
    const rocketG = this._drawRocket(0, 0)
    this._rocketContainer.add(rocketG)
    this.tweens.add({
      targets: this._rocketContainer,
      alpha: 1,
      scale: 1,
      duration: 300,
      delay: 0,
    })

    // Flame (hidden during play)
    this._flameGraphics = this.add.graphics()
    this._flameGraphics.setDepth(-1)

    // Tray
    this._tray = this._drawTray(this._trayX, 570)

    // Prompt
    this._promptText = this.add.text(640, 130, 'Catch the challenges. Feed the rocket.', {
      ...TEXT.prompt,
      fontSize: '14px',
    }).setOrigin(0.5).setAlpha(0)
    this.tweens.add({
      targets: this._promptText,
      alpha: 1,
      duration: 500,
      delay: 1000,
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          this.tweens.add({ targets: this._promptText, alpha: 0.3, duration: 500 })
        })
      },
    })

    // Multiplier text
    this._multiplierText = this.add.text(85, 180, '', {
      ...TEXT.label,
      fontSize: '12px',
      color: COLORS.WAX_RED,
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0)

    // Input
    this._cursors = this.input.keyboard.createCursorKeys()
    this._keyA = this.input.keyboard.addKey(65)  // A
    this._keyD = this.input.keyboard.addKey(68)  // D

    this.input.on('pointermove', (pointer) => {
      this._useMouseControl = true
      this._mouseTargetX = pointer.x
    })

    // Spawn timer
    this.time.delayedCall(1000, () => {
      this._gameStartTime = this.time.now
      this._gameActive = true
      this._spawnTimer = this.time.addEvent({
        delay: this._spawnInterval,
        callback: () => {
          if (!this._gameActive) return
          if (this._activeItems.length < this._maxItems) {
            this._spawnItem()
          }
          if (this._spawnTimer) this._spawnTimer.delay = this._spawnInterval
        },
        loop: true,
      })
    })
  }

  _drawSkyLayers() {
    const layers = [
      { y: 540, label: 'COMFORT ZONE', alpha: 0.6 },
      { y: 420, label: 'UNKNOWN', alpha: 0.4 },
      { y: 300, label: 'ADVENTURE', alpha: 0.3 },
      { y: 180, label: 'HOLY SHIT', alpha: 0.2 },
      { y: 60,  label: 'THIS IS MY LIFE NOW', alpha: 0.15 },
    ]

    const g = this.add.graphics()
    g.lineStyle(0.5, C.INK_FADED, 0.15)
    layers.forEach(layer => {
      for (let x = 90; x < 1200; x += 16) {
        g.beginPath()
        g.moveTo(x, layer.y)
        g.lineTo(x + 8, layer.y)
        g.strokePath()
      }
    })

    this._layerLabels = {}
    layers.forEach(layer => {
      const t = this.add.text(1230, layer.y + 4, layer.label, {
        ...TEXT.label,
        fontSize: '9px',
        color: COLORS.INK_FADED,
      }).setOrigin(1, 0).setAlpha(layer.alpha)
      this._layerLabels[layer.label] = t
    })
  }

  _drawFuelGauge() {
    const x = 50, y = 200, w = 30, h = 420

    const border = this.add.graphics()
    border.lineStyle(1, C.INK, 0.5)
    border.strokeRect(x - w / 2, y, w, h)

    this._gaugeFill = this.add.graphics()

    this.add.text(x, y + h + 15, 'FUEL', { ...TEXT.label, fontSize: '10px' }).setOrigin(0.5)

    this._fuelText = this.add.text(x, y - 15, '0%', {
      ...TEXT.small,
      fontSize: '11px',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this._updateFuelGauge()
  }

  _updateFuelGauge() {
    const x = 50, y = 200, w = 30, h = 420
    const fillH = (this._fuel / 100) * h
    const fillY = y + h - fillH

    this._gaugeFill.clear()

    let color, alpha
    if (this._fuel < 34) { color = C.INK_LIGHT; alpha = 0.6 }
    else if (this._fuel < 67) { color = C.LEATHER; alpha = 0.7 }
    else if (this._fuel < 100) { color = C.RED_MARGIN; alpha = 0.8 }
    else { color = C.WAX_RED; alpha = 1.0 }

    this._gaugeFill.fillStyle(color, alpha)
    if (fillH > 0) this._gaugeFill.fillRect(x - w / 2 + 1, fillY, w - 2, fillH)

    this._fuelText.setText(`${Math.round(this._fuel)}%`)
  }

  _drawRocket(x, y) {
    const g = this.add.graphics()

    // Body fill
    g.fillStyle(C.PARCHMENT_DARK, 0.8)
    g.beginPath()
    g.moveTo(x - 15, y)
    g.lineTo(x + 15, y)
    g.lineTo(x + 10, y - 60)
    g.lineTo(x - 10, y - 60)
    g.closePath()
    g.fillPath()

    // Hand-drawn outline
    g.lineStyle(1.5, C.INK, 0.8)
    g.beginPath()
    g.moveTo(x - 15, y)
    g.lineTo(x - 16, y - 20)
    g.lineTo(x - 11, y - 45)
    g.lineTo(x - 10, y - 60)
    g.lineTo(x, y - 75)
    g.lineTo(x + 10, y - 60)
    g.lineTo(x + 11, y - 45)
    g.lineTo(x + 16, y - 20)
    g.lineTo(x + 15, y)
    g.strokePath()

    // Nose cone
    g.fillStyle(C.INK, 0.15)
    g.fillTriangle(x - 10, y - 60, x + 10, y - 60, x, y - 75)

    // Window
    g.lineStyle(1, C.INK, 0.6)
    g.strokeCircle(x, y - 40, 6)
    g.fillStyle(C.PARCHMENT, 0.5)
    g.fillCircle(x, y - 40, 5)

    // Fins
    g.lineStyle(1, C.INK, 0.6)
    g.fillStyle(C.INK, 0.1)
    g.fillTriangle(x - 15, y, x - 25, y + 10, x - 15, y - 15)
    g.beginPath()
    g.moveTo(x - 15, y)
    g.lineTo(x - 25, y + 10)
    g.lineTo(x - 15, y - 15)
    g.strokePath()
    g.fillTriangle(x + 15, y, x + 25, y + 10, x + 15, y - 15)
    g.beginPath()
    g.moveTo(x + 15, y)
    g.lineTo(x + 25, y + 10)
    g.lineTo(x + 15, y - 15)
    g.strokePath()

    // Cross-hatch shading
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

  _drawTray(x, y) {
    const container = this.add.container(x, y)
    const g = this.add.graphics()

    g.fillStyle(C.PARCHMENT_DARK, 0.3)
    g.fillRect(-60, -10, 120, 12)

    g.lineStyle(2.5, C.INK, 0.7)
    g.beginPath()
    g.moveTo(-60, 0)
    g.lineTo(60, 0)
    g.strokePath()

    g.lineStyle(1.5, C.INK, 0.5)
    g.beginPath()
    g.moveTo(-60, -8)
    g.lineTo(-60, 0)
    g.strokePath()
    g.beginPath()
    g.moveTo(60, -8)
    g.lineTo(60, 0)
    g.strokePath()

    container.add(g)
    return container
  }

  // ── Item spawning ──────────────────────────────────────────────
  _spawnItem() {
    // First 2 items always safe for early success
    let isBrave
    if (this._spawnCount < 2) {
      isBrave = false
    } else {
      isBrave = Math.random() < this._braveChance
    }
    this._spawnCount++

    // Mercy rule: if at 80s and fuel < 70, force brave + high value
    if (this._gameStartTime > 0) {
      const elapsed = this.time.now - this._gameStartTime
      if (elapsed > 80000 && this._fuel < 70) {
        isBrave = true
      }
    }

    const pool = isBrave ? BRAVE_ITEMS : SAFE_ITEMS
    const template = pool[Math.floor(Math.random() * pool.length)]

    const x = 120 + Math.random() * 1040
    const speed = this._baseSpeed + Math.random() * this._speedVariance

    const item = this._createItemVisual(x, -40, template, isBrave)
    item.itemSpeed = speed
    item.fuel = template.fuel
    item.isBrave = isBrave
    // Override fuel for mercy
    if (this._gameStartTime > 0) {
      const elapsed = this.time.now - this._gameStartTime
      if (elapsed > 80000 && this._fuel < 70 && isBrave) item.fuel = 20
    }

    this._activeItems.push(item)
    this._totalSpawned++
  }

  _createItemVisual(x, y, template, isBrave) {
    const container = this.add.container(x, y)

    const fontSize = isBrave ? '11px' : '10px'
    const textObj = this.add.text(0, 0, template.label, {
      fontFamily: 'Lora',
      fontSize,
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
      const glow = this.add.graphics()
      glow.fillStyle(C.WAX_RED, 0.06)
      glow.fillCircle(0, 0, Math.max(30, w / 2 + 8))
      container.add(glow)

      g.fillStyle(C.WAX_RED, 0.08)
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 4)
      g.lineStyle(1, C.WAX_RED, 0.5)
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 4)

      this.tweens.add({
        targets: g,
        alpha: { from: 0.7, to: 1 },
        duration: 600,
        yoyo: true,
        loop: -1,
      })
    } else {
      g.fillStyle(C.PARCHMENT_DARK, 0.3)
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 3)
      g.lineStyle(0.5, C.INK_FADED, 0.3)
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 3)
    }

    container.add(g)
    container.add(textObj)
    container.itemWidth = w
    container.itemHeight = h

    return container
  }

  // ── Main update loop ───────────────────────────────────────────
  update(time, delta) {
    if (!this._gameActive) return

    const dt = delta / 1000

    // Difficulty ramp from fuel
    const t = this._fuel / 100
    this._spawnInterval = Phaser.Math.Linear(1400, 650, t)
    this._baseSpeed = Phaser.Math.Linear(120, 280, t)
    this._speedVariance = Phaser.Math.Linear(20, 60, t)
    this._braveChance = Phaser.Math.Linear(0.25, 0.45, t)
    this._maxItems = Math.floor(Phaser.Math.Linear(3, 7, t))

    // Tray movement
    const kbActive = this._cursors.left.isDown || this._cursors.right.isDown ||
                     this._keyA.isDown || this._keyD.isDown

    if (kbActive) this._useMouseControl = false

    if (this._useMouseControl) {
      this._trayX += (this._mouseTargetX - this._trayX) * 0.15
    } else {
      let accel = 0
      if (this._cursors.left.isDown || this._keyA.isDown) accel = -2000
      if (this._cursors.right.isDown || this._keyD.isDown) accel = 2000

      if (accel !== 0) {
        this._trayVelX += accel * dt
        this._trayVelX = Phaser.Math.Clamp(this._trayVelX, -500, 500)
      } else {
        this._trayVelX *= 0.85
        if (Math.abs(this._trayVelX) < 5) this._trayVelX = 0
      }
      this._trayX += this._trayVelX * dt
    }

    this._trayX = Phaser.Math.Clamp(this._trayX, 100, 1180)
    this._tray.x = this._trayX

    // Move items
    const urgencyMult = this._fuel >= 85 ? 1.2 : 1.0
    for (let i = this._activeItems.length - 1; i >= 0; i--) {
      const item = this._activeItems[i]
      item.y += item.itemSpeed * urgencyMult * dt

      // Catch check: item within tray bounds and y in catch zone
      if (item.y >= 555 && item.y <= 590) {
        if (Math.abs(item.x - this._trayX) <= 60) {
          this._onCatch(item)
          this._activeItems.splice(i, 1)
          continue
        }
      }

      // Miss check
      if (item.y > 680) {
        this._onMiss(item)
        this._activeItems.splice(i, 1)
      }
    }

    // Update gauge every frame (cheap)
    this._updateFuelGauge()

    // Fuel milestone events
    this._checkFuelEvents()

    // Multiplier text
    this._updateMultiplierText()

    // Rocket vibration at >=66%
    if (this._fuel >= 66 && this._rocketContainer && !this._rocketVibrating) {
      this._rocketVibrating = true
      this.tweens.add({
        targets: this._rocketContainer,
        x: { from: 638, to: 642 },
        duration: 80,
        yoyo: true,
        loop: -1,
      })
    }

    // Mercy hard cap
    const elapsed = this._gameStartTime > 0 ? (this.time.now - this._gameStartTime) : 0
    if (elapsed > 100000 && this._fuel < 100) {
      this._fuel = 100
    }

    // Launch trigger
    if (this._fuel >= 100) {
      this._fuel = 100
      this._triggerLaunch()
    }
  }

  _checkFuelEvents() {
    if (!this._evt20 && this._fuel >= 20) {
      this._evt20 = true
      const ignText = this.add.text(this._rocketContainer.x + 40, this._rocketContainer.y - 20,
        'ignition...', { ...TEXT.label, fontSize: '11px' }).setAlpha(0.5)
      this.tweens.add({ targets: ignText, alpha: 0, duration: 1500, delay: 400,
        onComplete: () => ignText.destroy() })
      this.tweens.add({
        targets: this._rocketContainer,
        x: { from: this._rocketContainer.x - 3, to: this._rocketContainer.x + 3 },
        duration: 50,
        yoyo: true,
        repeat: 5,
      })
    }
    if (!this._evt33 && this._fuel >= 33) {
      this._evt33 = true
      this._smokeTimer = this.time.addEvent({
        delay: 200,
        callback: () => this._emitSmoke(),
        loop: true,
      })
      this._rumbleTimer = this.time.addEvent({
        delay: 3000,
        callback: () => this.cameras.main.shake(100, 0.001),
        loop: true,
      })
    }
    if (!this._evt50 && this._fuel >= 50) {
      this._evt50 = true
      if (this._promptText) {
        this._promptText.setText('Keep going.')
        this.tweens.add({ targets: this._promptText, alpha: 0.4, duration: 400 })
      }
      const czLabel = this._layerLabels['COMFORT ZONE']
      if (czLabel) {
        const sg = this.add.graphics()
        sg.lineStyle(1, C.INK_FADED, 0.6)
        sg.beginPath()
        sg.moveTo(czLabel.x - czLabel.width, czLabel.y + 6)
        sg.lineTo(czLabel.x, czLabel.y + 6)
        sg.strokePath()
      }
    }
    if (!this._evt66 && this._fuel >= 66) {
      this._evt66 = true
      if (this._smokeTimer) this._smokeTimer.delay = 100
      const ukLabel = this._layerLabels['UNKNOWN']
      if (ukLabel) {
        const sg = this.add.graphics()
        sg.lineStyle(1, C.INK_FADED, 0.6)
        sg.beginPath()
        sg.moveTo(ukLabel.x - ukLabel.width, ukLabel.y + 6)
        sg.lineTo(ukLabel.x, ukLabel.y + 6)
        sg.strokePath()
      }
    }
    if (!this._evt85 && this._fuel >= 85) {
      this._evt85 = true
      this._drawVignette()
    }
  }

  _drawVignette() {
    const g = this.add.graphics()
    g.setDepth(100)
    for (let i = 0; i < 30; i++) {
      const a = 0.01 + i * 0.003
      g.fillStyle(C.LEATHER_DARK, a)
      g.fillRect(0, i, 40 - i, 720 - 2 * i)
      g.fillRect(1240 + i, i, 40 - i, 720 - 2 * i)
    }
  }

  _updateMultiplierText() {
    if (!this._multiplierText) return
    let mult = 1.0
    if (this._currentStreak === 2) mult = 1.3
    else if (this._currentStreak === 3) mult = 1.6
    else if (this._currentStreak >= 4) mult = 2.0

    if (mult > 1.0) {
      this._multiplierText.setText(`x${mult.toFixed(1)}`)
      if (this._multiplierText.alpha < 1) {
        this.tweens.add({ targets: this._multiplierText, alpha: 1, duration: 200 })
      }
    } else if (this._multiplierText.alpha > 0) {
      this.tweens.add({ targets: this._multiplierText, alpha: 0, duration: 500 })
    }
  }

  _emitSmoke() {
    if (!this._rocketContainer) return
    const rx = this._rocketContainer.x
    const ry = this._rocketContainer.y
    for (let i = 0; i < 3; i++) {
      const p = this.add.circle(
        rx + (Math.random() - 0.5) * 20,
        ry + 5,
        2 + Math.random() * 3,
        C.INK_FADED,
        0.3
      )
      this.tweens.add({
        targets: p,
        y: ry + 40 + Math.random() * 30,
        x: p.x + (Math.random() - 0.5) * 40,
        alpha: 0,
        scale: 0.3,
        duration: 600 + Math.random() * 400,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      })
    }
  }

  // ── Catch / Miss handlers ──────────────────────────────────────
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

    const gained = item.fuel * mult
    this._fuel = Math.min(100, this._fuel + gained)
    this._totalCaught++

    if (item.isBrave) {
      this.cameras.main.shake(200, 0.004)
      const flash = this.add.rectangle(640, 360, 1280, 720, C.WAX_RED, 0.08)
      flash.setDepth(50)
      this.tweens.add({ targets: flash, alpha: 0, duration: 300,
        onComplete: () => flash.destroy() })

      this.tweens.add({
        targets: item,
        scale: 1.2,
        alpha: 0,
        duration: 250,
        onComplete: () => item.destroy(),
      })
    } else {
      this.tweens.add({
        targets: item,
        scale: 0,
        alpha: 0,
        duration: 200,
        onComplete: () => item.destroy(),
      })
    }
  }

  _onMiss(item) {
    this._totalMissed++
    const mx = item.x
    const my = 680

    for (let i = 0; i < 4; i++) {
      const frag = this.add.rectangle(
        mx + (Math.random() - 0.5) * 20,
        my,
        4, 2,
        C.INK_FADED, 0.6
      )
      const vy = -50 - Math.random() * 50
      const vx = (Math.random() - 0.5) * 120
      this.tweens.add({
        targets: frag,
        y: my + 40,
        x: mx + vx,
        alpha: 0,
        duration: 400,
        ease: 'Quad.easeIn',
        onComplete: () => frag.destroy(),
      })
      // simulate small arc
      this.tweens.add({
        targets: frag,
        y: my + vy,
        duration: 150,
        ease: 'Quad.easeOut',
      })
    }

    const dots = this.add.text(mx, my - 10, '...', {
      ...TEXT.small, fontSize: '10px',
    }).setOrigin(0.5).setAlpha(0.3)
    this.tweens.add({ targets: dots, alpha: 0, duration: 500,
      onComplete: () => dots.destroy() })

    item.destroy()
  }

  // ── Launch Sequence ────────────────────────────────────────────
  _triggerLaunch() {
    if (this._phase !== 'game') return
    this._phase = 'launch'
    this._gameActive = false
    this._launchTime = this.time.now

    if (this._spawnTimer) { this._spawnTimer.remove(false); this._spawnTimer = null }
    if (this._smokeTimer) { this._smokeTimer.remove(false); this._smokeTimer = null }
    if (this._rumbleTimer) { this._rumbleTimer.remove(false); this._rumbleTimer = null }

    // Freeze & fade items
    this._activeItems.forEach(it => {
      this.tweens.add({ targets: it, alpha: 0, duration: 300,
        onComplete: () => it.destroy() })
    })
    this._activeItems = []

    // Fade tray
    this.tweens.add({ targets: this._tray, alpha: 0, duration: 300 })

    // Flash gauge
    this.tweens.add({
      targets: this._gaugeFill,
      alpha: { from: 1, to: 0.5 },
      duration: 150,
      yoyo: true,
      repeat: 2,
    })

    // Kill vibration
    if (this._rocketContainer) {
      this.tweens.killTweensOf(this._rocketContainer)
    }

    // LAUNCH text
    const launchTxt = this.add.text(640, 360, 'LAUNCH', {
      ...TEXT.title,
      fontSize: '64px',
      color: COLORS.WAX_RED,
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0)
    this.tweens.add({ targets: launchTxt, alpha: 1, duration: 200 })
    this.cameras.main.shake(500, 0.006)

    this.time.delayedCall(500, () => {
      this.tweens.add({
        targets: launchTxt,
        scale: 1.5,
        alpha: 0,
        duration: 500,
        onComplete: () => launchTxt.destroy(),
      })
    })

    // Smoke burst
    for (let i = 0; i < 20; i++) {
      const p = this.add.circle(
        this._rocketContainer.x + (Math.random() - 0.5) * 30,
        this._rocketContainer.y + 5,
        3 + Math.random() * 4,
        C.INK_FADED,
        0.4
      )
      const ang = Math.random() * Math.PI * 2
      const dist = 60 + Math.random() * 80
      this.tweens.add({
        targets: p,
        x: p.x + Math.cos(ang) * dist,
        y: p.y + Math.sin(ang) * dist,
        alpha: 0,
        scale: 0.5,
        duration: 800 + Math.random() * 400,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      })
    }

    // Start flame update
    this._flameSize = 1.0
    this._flameActive = true
    this._flameUpdate = this.time.addEvent({
      delay: 60,
      callback: () => {
        if (!this._flameActive || !this._rocketContainer) return
        this._drawFlame(this._rocketContainer.x, this._rocketContainer.y + 5, this._flameSize)
      },
      loop: true,
    })

    // Begin rocket ascent at T+1s
    this.time.delayedCall(1000, () => this._beginAscent())
  }

  _drawFlame(x, y, size) {
    this._flameGraphics.clear()
    const baseW = 12 * size
    const baseH = 20 * size

    this._flameGraphics.fillStyle(C.RED_MARGIN, 0.7)
    this._flameGraphics.fillTriangle(
      x - baseW, y,
      x + baseW, y,
      x + (Math.random() - 0.5) * 4, y + baseH
    )

    this._flameGraphics.fillStyle(C.WAX_RED_LIGHT, 0.5)
    this._flameGraphics.fillTriangle(
      x - baseW * 0.5, y,
      x + baseW * 0.5, y,
      x + (Math.random() - 0.5) * 3, y + baseH * 0.7
    )
  }

  _beginAscent() {
    // Instead of moving the rocket up, simulate ascent by announcing layers
    // The rocket rises from y:600 to y:360, holds there, while layers "pass".
    this.tweens.add({
      targets: this._rocketContainer,
      y: 360,
      duration: 4000,
      ease: 'Cubic.easeIn',
    })

    // Layer triggers timed relative to ascent
    this.time.delayedCall(400, () => this._crackLayer(540, 'COMFORT ZONE'))
    this.time.delayedCall(1600, () => this._crackLayer(420, 'UNKNOWN', true))
    this.time.delayedCall(3000, () => this._crackLayer(300, 'ADVENTURE', false, true))
    this.time.delayedCall(4400, () => this._crackLayer(180, 'HOLY SHIT', false, false, true))
    this.time.delayedCall(6000, () => this._breakThroughPage())

    // Grow flame during ascent
    this.tweens.add({
      targets: this,
      _flameSize: 2.5,
      duration: 5000,
      ease: 'Quad.easeIn',
    })
  }

  _crackLayer(y, labelName, foggy = false, inky = false, holyshit = false) {
    // Crack the dashed line
    for (let i = 0; i < 8; i++) {
      const startX = 90 + i * 140
      const frag = this.add.graphics()
      frag.lineStyle(1, C.INK_FADED, 0.5)
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

    // Shatter label
    const label = this._layerLabels[labelName]
    if (label) {
      this.tweens.add({
        targets: label,
        scale: 2,
        alpha: 0,
        duration: 500,
        onComplete: () => label.destroy(),
      })
    }

    // Fog clear
    if (foggy) {
      const fog = this.add.rectangle(640, 360, 1280, 720, C.PARCHMENT_DARK, 0.3)
      this.tweens.add({ targets: fog, alpha: 0, duration: 600,
        onComplete: () => fog.destroy() })
    }

    // Ink splatters
    if (inky) {
      for (let i = 0; i < 4; i++) {
        const ix = 200 + Math.random() * 880
        const iy = y + Math.random() * 100
        JournalUI.drawInkBlot(this, ix, iy, 8 + Math.random() * 10)
      }
    }

    // Holy shit exclamation marks
    if (holyshit) {
      this.cameras.main.shake(800, 0.004)
      for (let i = 0; i < 6; i++) {
        const ex = 150 + Math.random() * 980
        const ey = 100 + Math.random() * 140
        const rot = (Math.random() - 0.5) * 0.6
        const t = this.add.text(ex, ey, '!', {
          ...TEXT.title,
          fontSize: '32px',
          color: COLORS.WAX_RED,
          fontStyle: 'bold',
        }).setOrigin(0.5).setRotation(rot).setAlpha(0)
        this.tweens.add({
          targets: t,
          alpha: 1,
          duration: 300,
          yoyo: true,
          hold: 400,
          onComplete: () => t.destroy(),
        })
      }
    }
  }

  _breakThroughPage() {
    // Torn-paper edge: jagged line across the top
    const tear = this.add.graphics()
    tear.fillStyle(C.PARCHMENT_LIGHT, 1)
    tear.fillRect(0, 0, 1280, 0)
    this.tweens.add({
      targets: { h: 0 },
      h: 120,
      duration: 1000,
      onUpdate: (tw) => {
        tear.clear()
        tear.fillStyle(C.PARCHMENT_LIGHT, 1)
        const h = tw.getValue()
        // Jagged bottom edge
        tear.beginPath()
        tear.moveTo(0, 0)
        tear.lineTo(1280, 0)
        tear.lineTo(1280, h)
        // Jagged line
        for (let x = 1280; x >= 0; x -= 20) {
          const jitter = Math.sin(x * 0.3) * 6 + (Math.random() - 0.5) * 4
          tear.lineTo(x, h + jitter)
        }
        tear.lineTo(0, h)
        tear.closePath()
        tear.fillPath()
      },
    })

    // Ink stars
    this.time.delayedCall(1200, () => {
      for (let i = 0; i < 6; i++) {
        const sx = 300 + Math.random() * 680
        const sy = 200 + Math.random() * 300
        const star = this.add.text(sx, sy, '*', {
          ...TEXT.body,
          fontSize: '20px',
          color: COLORS.INK_FADED,
        }).setOrigin(0.5).setAlpha(0)
        this.tweens.add({ targets: star, alpha: 0.7, duration: 600, delay: i * 100 })
      }
    })

    // Kill flame slowly
    this.time.delayedCall(1500, () => {
      this._flameActive = false
      if (this._flameUpdate) { this._flameUpdate.remove(false); this._flameUpdate = null }
      this._flameGraphics.clear()
    })

    // Final lines
    const line1 = this.add.text(640, 380, 'Shanghai, 2014.', {
      ...TEXT.chapter, fontSize: '18px', fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0)
    const line2 = this.add.text(640, 420, 'The weekend I stopped planning my life', {
      ...TEXT.bodyItalic, fontSize: '14px',
    }).setOrigin(0.5).setAlpha(0)
    const line3 = this.add.text(640, 445, 'and started building it.', {
      ...TEXT.bodyItalic, fontSize: '14px',
    }).setOrigin(0.5).setAlpha(0)

    this.tweens.add({ targets: line1, alpha: 1, duration: 800, delay: 2000 })
    this.tweens.add({ targets: line2, alpha: 1, duration: 800, delay: 3000 })
    this.tweens.add({ targets: line3, alpha: 1, duration: 800, delay: 4000 })

    this.time.delayedCall(7000, () => {
      this.tweens.add({
        targets: [line1, line2, line3, this._rocketContainer],
        alpha: 0,
        duration: 600,
      })
      this.time.delayedCall(800, () => this._finish())
    })
  }

  // ── Closing / Score ────────────────────────────────────────────
  _finish() {
    this._phase = 'closing'

    // Calculate score
    const braveRatio = this._bravesCaught / Math.max(1, this._totalCaught)
    const catchRate = this._totalCaught / Math.max(1, this._totalSpawned)
    const elapsed = this._launchTime - this._gameStartTime
    const timeFactor = elapsed < 50000 ? 1.1 : (elapsed < 70000 ? 1.0 : 0.9)

    const braveScore = braveRatio * 50
    const catchScore = catchRate * 30
    const comboScore = this._bestStreak * 5
    const raw = (braveScore + catchScore + comboScore) * timeFactor
    const finalScore = Math.max(15, Math.min(100, Math.round(raw)))

    const curiosityGain = Math.round(finalScore / 5)
    const cur = this.registry.get(KEYS.STAT_CURIOSITY) ?? 0
    this.registry.set(KEYS.STAT_CURIOSITY, Math.min(100, cur + curiosityGain))

    completeLevel(this, KEYS.SCORE_L1, KEYS.COMPLETED_L1, finalScore)

    // Overlay
    const overlay = this.add.rectangle(640, 360, 1280, 720, C.PARCHMENT, 0).setDepth(200)
    this.tweens.add({ targets: overlay, alpha: 0.95, duration: 500 })

    const card = this.add.container(0, 0).setDepth(201).setAlpha(0)

    card.add(this.add.text(640, 160, 'ESCAPE VELOCITY', {
      ...TEXT.title, fontSize: '32px', fontStyle: 'bold',
    }).setOrigin(0.5))

    card.add(this.add.text(640, 230, `+${curiosityGain} Curiosity`, {
      ...TEXT.stamp, fontSize: '20px', color: COLORS.STAMP_GREEN,
    }).setOrigin(0.5))

    card.add(this.add.text(640, 270, `Score: ${finalScore}%`, {
      ...TEXT.body, fontSize: '16px', color: COLORS.INK_FADED,
    }).setOrigin(0.5))

    let flavor
    if (finalScore >= 90) flavor = 'Fearless. You didn\'t just leave the comfort zone — you launched through it.'
    else if (finalScore >= 70) flavor = 'Adventurous. You leaned into the unknown.'
    else if (finalScore >= 50) flavor = 'Cautious, but you got there. The rocket doesn\'t care how — it flies.'
    else flavor = 'A slow burn. But you launched. That\'s what matters.'

    card.add(this.add.text(640, 325, flavor, {
      ...TEXT.bodyItalic, fontSize: '13px', color: COLORS.INK_LIGHT,
      align: 'center', wordWrap: { width: 800 },
    }).setOrigin(0.5))

    // Stats box
    const statsG = this.add.graphics()
    statsG.lineStyle(0.5, C.INK, 0.3)
    statsG.strokeRect(440, 385, 400, 90)
    card.add(statsG)

    const statsText = [
      `Items caught: ${this._totalCaught}`,
      `Brave choices: ${this._bravesCaught}`,
      `Best streak: ${this._bestStreak}`,
      `Catch rate: ${Math.round(catchRate * 100)}%`,
    ].join('   |   ')

    card.add(this.add.text(640, 430, statsText, {
      ...TEXT.small, fontSize: '11px', color: COLORS.INK_FADED,
    }).setOrigin(0.5))

    // Wax seal
    const seal = JournalUI.drawWaxSeal(this, 640, 520, 'S', 24)
    seal.graphics.setDepth(201)
    seal.text.setDepth(202)

    // Teaser
    card.add(this.add.text(640, 580,
      '"A year later, Switzerland gets boring.\nYou buy a one-way ticket to Medellín..."',
      { ...TEXT.prompt, fontSize: '13px', fontStyle: 'italic', align: 'center', lineSpacing: 6 }
    ).setOrigin(0.5))

    card.add(this.add.text(640, 660, 'PRESS SPACE to return to the hub', {
      ...TEXT.small, color: COLORS.INK_FADED,
    }).setOrigin(0.5))

    this.tweens.add({ targets: card, alpha: 1, duration: 500, delay: 500 })

    // Return to hub
    let returned = false
    const returnToHub = () => {
      if (returned) return
      returned = true
      this.cameras.main.fadeOut(400, 0, 0, 0)
      this.time.delayedCall(420, () => this.scene.start('LevelSelectHub'))
    }
    this.input.keyboard.once('keydown-SPACE', returnToHub)
    this.time.delayedCall(8000, returnToHub)
  }
}
