import * as Phaser from 'phaser'
import { KEYS } from '../systems/GameRegistry.js'
import { completeLevel } from './LevelSelectHub.js'
import { COLORS, TEXT, C } from '../config/theme.js'
import { JournalUI } from '../ui/JournalUI.js'

// Level 3 — Adventures: THE RIDE
// Bike side-scroller across Turkey, SE Asia, Eastern Europe, Greenland, Bulgaria.
// All obstacles are real experiences from Augustin's travels.
// Scene key stays 'GreenlandScene' for legacy compatibility.

const GROUND_Y = 530
const RIDER_X = 200
const JUMP_VELOCITY = -420
const GRAVITY = 1200

const OBSTACLE_SPAWNS = [
  { offset: 1200,  type: 'dogs',     location: 'turkey' },
  { offset: 2700,  type: 'tire' },
  { offset: 4400,  type: 'dengue',   location: 'southeast asia' },
  { offset: 5900,  type: 'language' },
  { offset: 7500,  type: 'credit',   location: 'eastern europe' },
  { offset: 9000,  type: 'border' },
  { offset: 10600, type: 'icebergs', location: 'greenland' },
  { offset: 12300, type: 'village',  location: 'bulgaria' },
  { offset: 14000, type: 'storm' },
]

const STORIES = {
  dogs:     'Istanbul suburbs. Camping alone. 3am. Six dogs circling the tent.\nI didn\'t sleep. They didn\'t bite.',
  tire:     'Third flat in two days. No pump.\nFound a gas station 6km later. Walked.',
  dengue:   '40-degree fever on a bus in Southeast Asia.\nCouldn\'t stop. The next town was 8 hours away.',
  language: 'No shared language. Drew what I needed on a napkin.\nGot a meal. Made a friend.',
  credit:   'Card blocked. Zero cash. Three countries from home.\nSlept in a park. Found a Western Union at dawn.',
  border:   'Three hours at the border. Wrong form. Wrong line.\nWrong language. Got through on the fourth try.',
  icebergs: 'Greenland. The boat couldn\'t get through.\nWalked 2 days. 20kg on my back. No trail. Just ice.',
  village:  'Bulgaria. No food for two days. Ghost village.\nKnocked on every door. An old woman answered the last one. Fed me soup.',
  storm:    'The storm hit at noon. Couldn\'t see 10 meters ahead.\nKept pedaling. What else was there to do?',
}

const OBSTACLE_NAMES = {
  dogs: 'WILD DOGS',
  tire: 'FLAT TIRE',
  dengue: 'DENGUE FEVER',
  language: 'LANGUAGE BARRIER',
  credit: 'CARD BLOCKED',
  border: 'BORDER HASSLE',
  icebergs: 'ICEBERGS',
  village: 'EMPTY VILLAGE',
  storm: 'STORM',
}

const WASHES = {
  'turkey':         { color: C.WAX_RED,     alpha: 0.03 },
  'southeast asia': { color: C.STAMP_GREEN, alpha: 0.03 },
  'eastern europe': { color: C.INK_FADED,   alpha: 0.04 },
  'greenland':      { color: C.STAMP_BLUE,  alpha: 0.04 },
  'bulgaria':       { color: C.LEATHER,     alpha: 0.03 },
}

export class GreenlandScene extends Phaser.Scene {
  constructor() {
    super('GreenlandScene')
  }

  create() {
    // State
    this._totalObstacles = OBSTACLE_SPAWNS.length
    this._obstaclesDodged = 0
    this._obstaclesHit = 0
    this._livesRemaining = 3
    this._knockCount = 0
    this._nearMisses = 0
    this._scrollSpeed = 160
    this._targetSpeed = 160
    this._worldOffset = 0
    this._invincible = false
    this._isJumping = false
    this._isDucking = false
    this._riderY = GROUND_Y
    this._riderVY = 0
    this._gameActive = false
    this._ended = false
    this._knockActive = false
    this._fumesShown = false
    this._returning = false
    this._activeObstacles = []
    this._bgElements = []
    this._introObjects = []
    this._spawns = OBSTACLE_SPAWNS.map(s => ({ ...s, triggered: false }))
    this._finishLineSpawned = false
    this._finishLine = null

    const { width, height } = this.cameras.main
    this.cameras.main.fadeIn(500, 0, 0, 0)

    // Parchment
    JournalUI.drawParchment(this, 0, 0, width, height)
    this._bgWash = this.add.rectangle(width / 2, height / 2, width, height, C.WAX_RED, 0.02)

    // Intro
    this._drawIntro()

    // Space to start
    this._onIntroSpace = () => {
      if (!this._gameActive && !this._introDone) this._startRide()
    }
    this.input.keyboard.on('keydown-SPACE', this._onIntroSpace)

    // Auto-advance intro
    this._introAutoTimer = this.time.delayedCall(6500, () => {
      if (!this._introDone) this._startRide()
    })

    JournalUI.drawPageNumber(this, 6)

    this.events.once('shutdown', () => {
      this.input.keyboard.removeAllListeners()
      this.input.removeAllListeners()
      this.tweens.killAll()
      this.time.removeAllEvents()
    }, this)
  }

  _drawIntro() {
    const { width } = this.cameras.main
    this._introDone = false

    const header1 = this.add.text(40, 30, 'Chapter 3', { ...TEXT.label }).setAlpha(0)
    const header2 = this.add.text(40, 50, 'Adventures', { ...TEXT.heading }).setAlpha(0)
    const title = this.add.text(width / 2, 200, 'THE RIDE', {
      ...TEXT.title, fontSize: '48px', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0)
    const subtitle = this.add.text(width / 2, 260, 'Istanbul to Greenland to Bulgaria and beyond.', {
      ...TEXT.bodyItalic, fontSize: '16px', color: COLORS.INK_LIGHT,
    }).setOrigin(0.5).setAlpha(0)

    // Disclaimer box
    const boxG = this.add.graphics()
    boxG.fillStyle(C.PARCHMENT_DARK, 0.3)
    boxG.fillRoundedRect(width / 2 - 220, 310, 440, 80, 4)
    boxG.lineStyle(0.8, C.INK, 0.4)
    boxG.strokeRoundedRect(width / 2 - 220, 310, 440, 80, 4)
    boxG.setAlpha(0)
    const disclaimer1 = this.add.text(width / 2, 335, 'Every obstacle in this ride actually happened.', {
      ...TEXT.body, fontSize: '14px', color: COLORS.INK,
    }).setOrigin(0.5).setAlpha(0)
    const disclaimer2 = this.add.text(width / 2, 365, 'Names changed. Stories not.', {
      ...TEXT.label, fontSize: '12px', color: COLORS.INK_FADED,
    }).setOrigin(0.5).setAlpha(0)

    const previews = [
      '-  Wild dogs in Istanbul',
      '-  Dengue fever',
      '-  Icebergs in Greenland',
      '-  Empty village in Bulgaria',
      '-  ...and more',
    ]
    const previewTexts = previews.map((p, i) => {
      return this.add.text(width / 2, 440 + i * 22, p, {
        ...TEXT.small, fontSize: '12px', color: COLORS.INK_LIGHT,
      }).setOrigin(0.5).setAlpha(0)
    })

    const prompt = this.add.text(width / 2, 620, 'PRESS SPACE to start riding', {
      ...TEXT.prompt, color: COLORS.INK_FADED,
    }).setOrigin(0.5).setAlpha(0)

    this._introObjects = [header1, header2, title, subtitle, boxG, disclaimer1, disclaimer2, ...previewTexts, prompt]

    this.tweens.add({ targets: [header1, header2], alpha: 1, duration: 400, delay: 200 })
    this.tweens.add({ targets: title, alpha: 1, duration: 500, delay: 400 })
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 500, delay: 800 })
    this.tweens.add({ targets: [boxG, disclaimer1, disclaimer2], alpha: 1, duration: 500, delay: 1300 })
    previewTexts.forEach((t, i) => {
      this.tweens.add({ targets: t, alpha: 0.8, duration: 400, delay: 2200 + i * 180 })
    })
    this.tweens.add({
      targets: prompt,
      alpha: { from: 0.3, to: 0.7 },
      duration: 800, delay: 3800, yoyo: true, repeat: -1,
    })
  }

  _startRide() {
    this._introDone = true
    if (this._introAutoTimer) this._introAutoTimer.remove()

    this._introObjects.forEach(o => {
      this.tweens.killTweensOf(o)
      this.tweens.add({ targets: o, alpha: 0, duration: 400, onComplete: () => { if (o && o.destroy) o.destroy() } })
    })
    this.cameras.main.shake(200, 0.003)

    this.time.delayedCall(500, () => this._buildGameWorld())
  }

  _buildGameWorld() {
    const { width } = this.cameras.main

    // Road
    this._roadG = this.add.graphics()
    this._drawRoad()

    // Parallax background elements
    for (let i = 0; i < 12; i++) {
      const el = this.add.circle(
        100 + i * 120,
        120 + Math.random() * 180,
        2 + Math.random() * 3,
        C.INK_FADED,
        0.15,
      )
      el._parallax = 0.3
      this._bgElements.push(el)
    }
    for (let i = 0; i < 20; i++) {
      const el = this.add.rectangle(
        60 + i * 80,
        565 + Math.random() * 8,
        2 + Math.random() * 3,
        1,
        C.INK_FADED,
        0.25,
      )
      el._parallax = 0.7
      this._bgElements.push(el)
    }

    this._createRider()

    // Location header
    this._locationLabel = this.add.text(width / 2, 90, 'TURKEY', {
      ...TEXT.chapter, fontSize: '22px', fontStyle: 'italic', color: COLORS.INK_LIGHT,
    }).setOrigin(0.5).setAlpha(0)
    this.tweens.add({ targets: this._locationLabel, alpha: 0.45, duration: 500 })

    // Hearts
    this._hearts = []
    for (let i = 0; i < 3; i++) {
      const hx = 44 + i * 28
      const hy = 36
      this._hearts.push(this._drawInkHeart(hx, hy))
    }

    // Score
    this._scoreText = this.add.text(1240, 30, '0', {
      ...TEXT.stat, fontSize: '20px',
    }).setOrigin(1, 0)

    // Control prompt
    this._controlPrompt = this.add.text(width / 2, 150, 'UP to jump.  DOWN to duck.  TAP to knock.', {
      ...TEXT.prompt, fontSize: '13px',
    }).setOrigin(0.5).setAlpha(1)
    this.tweens.add({
      targets: this._controlPrompt, alpha: 0.2, duration: 800, delay: 2500,
    })

    // Input keys
    this._keyUp = this.input.keyboard.addKey(38)
    this._keyDown = this.input.keyboard.addKey(40)
    this._keyW = this.input.keyboard.addKey(87)
    this._keyS = this.input.keyboard.addKey(83)

    // Switch SPACE handler
    this.input.keyboard.removeListener('keydown-SPACE', this._onIntroSpace)
    this._onGameSpace = () => this._tryKnock()
    this.input.keyboard.on('keydown-SPACE', this._onGameSpace)
    this._onPointerDown = () => this._tryKnock()
    this.input.on('pointerdown', this._onPointerDown)

    this._gameActive = true
  }

  _drawRoad() {
    const { width } = this.cameras.main
    this._roadG.clear()
    this._roadG.lineStyle(1.2, C.INK, 0.35)
    this._roadG.beginPath()
    this._roadG.moveTo(0, 560)
    for (let x = 0; x <= width; x += 20) {
      this._roadG.lineTo(x, 560 + Math.sin(x * 0.05) * 1.5)
    }
    this._roadG.strokePath()
    this._roadG.fillStyle(C.INK, 0.05)
    this._roadG.fillRect(0, 560, width, 160)
  }

  _createRider() {
    this._riderContainer = this.add.container(RIDER_X, GROUND_Y)
    const g = this.add.graphics()

    const wheelR = 14
    const wheelY = -wheelR
    const rearX = -18
    const frontX = 18

    // Wheels
    g.lineStyle(1.2, C.INK, 0.8)
    g.strokeCircle(rearX, wheelY, wheelR)
    g.strokeCircle(frontX, wheelY, wheelR)

    // Spokes
    g.lineStyle(0.4, C.INK_FADED, 0.5)
    for (let a = 0; a < Math.PI; a += Math.PI / 4) {
      g.beginPath()
      g.moveTo(rearX + Math.cos(a) * wheelR * 0.9, wheelY + Math.sin(a) * wheelR * 0.9)
      g.lineTo(rearX - Math.cos(a) * wheelR * 0.9, wheelY - Math.sin(a) * wheelR * 0.9)
      g.strokePath()
      g.beginPath()
      g.moveTo(frontX + Math.cos(a) * wheelR * 0.9, wheelY + Math.sin(a) * wheelR * 0.9)
      g.lineTo(frontX - Math.cos(a) * wheelR * 0.9, wheelY - Math.sin(a) * wheelR * 0.9)
      g.strokePath()
    }

    // Frame
    g.lineStyle(1.5, C.INK, 0.85)
    const seatX = rearX + 4, seatY = wheelY - 26
    const handleX = frontX - 2, handleY = wheelY - 22
    g.beginPath(); g.moveTo(rearX, wheelY); g.lineTo(seatX, seatY); g.strokePath()
    g.beginPath(); g.moveTo(seatX, seatY); g.lineTo(frontX, wheelY); g.strokePath()
    g.beginPath(); g.moveTo(seatX, seatY); g.lineTo(handleX, handleY); g.strokePath()
    g.beginPath(); g.moveTo(handleX, handleY); g.lineTo(frontX, wheelY); g.strokePath()

    // Rider torso
    const rSeatY = seatY - 4
    g.lineStyle(2, C.INK, 0.9)
    g.beginPath(); g.moveTo(rearX + 4, rSeatY); g.lineTo(rearX + 10, rSeatY - 22); g.strokePath()
    // Head
    g.lineStyle(1.2, C.INK, 0.85)
    g.strokeCircle(rearX + 12, rSeatY - 30, 6)
    g.fillStyle(C.PARCHMENT_DARK, 0.7)
    g.fillCircle(rearX + 12, rSeatY - 30, 5)
    // Arm
    g.lineStyle(1.5, C.INK, 0.7)
    g.beginPath(); g.moveTo(rearX + 10, rSeatY - 18); g.lineTo(handleX + 2, handleY - 2); g.strokePath()
    // Leg
    g.beginPath(); g.moveTo(rearX + 4, rSeatY); g.lineTo(0, rSeatY + 14); g.strokePath()
    g.beginPath(); g.moveTo(0, rSeatY + 14); g.lineTo(-4, rSeatY + 22); g.strokePath()

    this._riderContainer.add(g)
  }

  _drawInkHeart(x, y) {
    const g = this.add.graphics()
    g.lineStyle(1.2, C.WAX_RED, 0.8)
    g.fillStyle(C.WAX_RED, 0.5)
    g.beginPath()
    g.moveTo(x, y + 8)
    g.lineTo(x - 8, y + 2)
    g.arc(x - 4, y - 1, 5, Math.PI, 0, false)
    g.arc(x + 4, y - 1, 5, Math.PI, 0, false)
    g.lineTo(x + 8, y + 2)
    g.closePath()
    g.strokePath()
    g.fillPath()
    return g
  }

  _loseHeart() {
    if (this._livesRemaining <= 0) return
    this._livesRemaining--
    const heart = this._hearts[this._livesRemaining]
    if (heart) {
      this.tweens.add({
        targets: heart, alpha: 0, scale: 1.5, duration: 400, ease: 'Quad.easeOut',
      })
    }
    this.cameras.main.shake(200, 0.008)

    if (this._livesRemaining <= 0 && !this._fumesShown) {
      this._fumesShown = true
      if (this._riderContainer) this._riderContainer.alpha = 0.5
      const fumes = this.add.text(RIDER_X, GROUND_Y - 80, '...keep going', {
        ...TEXT.label, color: COLORS.INK_FADED,
      }).setOrigin(0.5).setAlpha(0.5)
      this.tweens.add({
        targets: fumes, y: fumes.y - 10, alpha: 0, duration: 2500,
        onComplete: () => fumes.destroy(),
      })
    }

    this._invincible = true
    this.time.delayedCall(800, () => { this._invincible = false })
  }

  _tryKnock() {
    if (!this._knockActive) return
    if (!this._doors) return
    const door = this._doors.find(d => !d.knocked && Math.abs(d.worldX - RIDER_X) < 50)
    if (door) {
      door.knocked = true
      this._knockCount++
      const isLast = door.index === 3
      const mark = this.add.text(door.worldX, GROUND_Y - 80, isLast ? '!' : '...', {
        ...TEXT.heading, fontSize: isLast ? '22px' : '16px',
        color: isLast ? COLORS.STAMP_GREEN : COLORS.INK_LIGHT, fontStyle: 'bold',
      }).setOrigin(0.5)
      this.tweens.add({
        targets: mark, y: mark.y - 15, alpha: 0, duration: 900,
        onComplete: () => mark.destroy(),
      })
      if (door.graphic) {
        this.tweens.add({
          targets: door.graphic, scaleX: 1.08, scaleY: 0.94, duration: 80, yoyo: true,
        })
      }
    }
  }

  update(time, delta) {
    if (!this._gameActive) return
    const dt = Math.min(delta / 1000, 0.05)

    this._scrollSpeed += (this._targetSpeed - this._scrollSpeed) * 0.03
    this._worldOffset += this._scrollSpeed * dt

    // Jump input
    if ((this._keyUp.isDown || this._keyW.isDown) && !this._isJumping) {
      if (this._isDucking) {
        this._isDucking = false
        this._riderContainer.scaleY = 1
      }
      this._isJumping = true
      this._riderVY = JUMP_VELOCITY
    }

    // Duck input
    const duckHeld = (this._keyDown.isDown || this._keyS.isDown) && !this._isJumping
    if (duckHeld && !this._isDucking) {
      this._isDucking = true
      this._riderContainer.scaleY = 0.6
    } else if (!duckHeld && this._isDucking) {
      this._isDucking = false
      this._riderContainer.scaleY = 1
    }

    // Jump physics
    if (this._isJumping) {
      this._riderVY += GRAVITY * dt
      this._riderY += this._riderVY * dt
      if (this._riderY >= GROUND_Y) {
        this._riderY = GROUND_Y
        this._isJumping = false
        this._riderVY = 0
      }
      this._riderContainer.y = this._riderY
    } else {
      this._riderContainer.y = GROUND_Y
    }

    // Parallax
    this._bgElements.forEach(el => {
      el.x -= this._scrollSpeed * el._parallax * dt
      if (el.x < -20) el.x = 1320
    })

    // Spawn check
    this._spawns.forEach(spawn => {
      if (!spawn.triggered && this._worldOffset >= spawn.offset) {
        spawn.triggered = true
        if (spawn.location) this._transitionLocation(spawn.location)
        this._spawnObstacle(spawn.type)
      }
    })

    // Obstacles
    for (let i = this._activeObstacles.length - 1; i >= 0; i--) {
      const ob = this._activeObstacles[i]
      ob.container.x -= this._scrollSpeed * dt

      // Update village door world positions
      if (ob.type === 'village' && this._doors) {
        this._doors.forEach(d => { d.worldX = ob.container.x + d.offset })
      }

      // Storm duck tracking
      if (ob.type === 'storm' && !ob.resolved) {
        if (ob.container.x < RIDER_X + 120 && ob.container.x > RIDER_X - 150) {
          if (this._isDucking) ob.duckedTime += dt
        }
      }

      // Collision
      if (!ob.resolved && !ob.hitRegistered && this._checkCollision(ob)) {
        ob.hitRegistered = true
        this._onObstacleHit(ob)
      }

      // Resolve when passed
      const passX = (ob.type === 'dengue' || ob.type === 'storm') ? -150 : -60
      if (!ob.resolved && ob.container.x < RIDER_X + passX) {
        ob.resolved = true
        if (ob.type === 'village') {
          this._knockActive = false
          if (this._knockCount >= 3) this._onObstacleDodged(ob)
          else this._onObstacleHit(ob, true)
        } else if (ob.type === 'storm') {
          if (ob.duckedTime >= 0.9) this._onObstacleDodged(ob)
          else this._onObstacleHit(ob, true)
        } else if (!ob.hitRegistered) {
          this._onObstacleDodged(ob)
        }
      }

      if (ob.container.x < -400) {
        ob.container.destroy()
        if (ob.type === 'village') this._doors = null
        this._activeObstacles.splice(i, 1)
      }
    }

    // Final sprint trigger
    const allTriggered = this._spawns.every(s => s.triggered)
    const allResolved = this._activeObstacles.every(o => o.resolved)
    if (allTriggered && allResolved && !this._finishLineSpawned) {
      this._finishLineSpawned = true
      this._targetSpeed += 60
      this._spawnFinishLine()
    }

    // Finish line movement
    if (this._finishLine) {
      this._finishLine.container.x -= this._scrollSpeed * dt
      if (this._finishLine.container.x < RIDER_X && !this._ended) {
        this._ended = true
        this._finish()
      }
    }

    // Update score display
    if (this._scoreText) {
      this._scoreText.setText(String(this._calculateScore()))
    }
  }

  _checkCollision(ob) {
    if (this._invincible) return false
    if (ob.type === 'village' || ob.type === 'storm') return false

    const riderTop = this._isDucking
      ? GROUND_Y - 20
      : (this._isJumping ? this._riderY - 50 : GROUND_Y - 50)
    const riderBottom = this._isJumping ? this._riderY : GROUND_Y
    const rx1 = RIDER_X - 18
    const rx2 = RIDER_X + 18

    const ox1 = ob.container.x + ob.hit.x
    const ox2 = ox1 + ob.hit.w
    const oy1 = ob.hit.y
    const oy2 = oy1 + ob.hit.h

    return (rx1 < ox2 && rx2 > ox1 && riderTop < oy2 && riderBottom > oy1)
  }

  _onObstacleDodged(ob) {
    this._obstaclesDodged++
    this._targetSpeed = Math.min(320, this._targetSpeed + 15)
    this._showStoryLine(ob.type)

    const check = this.add.text(RIDER_X, GROUND_Y - 70, 'v', {
      ...TEXT.stamp, fontSize: '16px',
    }).setOrigin(0.5).setAlpha(0)
    this.tweens.add({
      targets: check, alpha: 0.8, y: check.y - 10, duration: 400, yoyo: true,
      onComplete: () => check.destroy(),
    })
  }

  _onObstacleHit(ob, silentSpeedSkip = false) {
    if (this._invincible) return
    this._obstaclesHit++
    this._loseHeart()
    this.cameras.main.shake(200, ob.shake || 0.008)

    if (!silentSpeedSkip) {
      const saved = this._targetSpeed
      this._scrollSpeed *= 0.5
      this.time.delayedCall(300, () => { this._targetSpeed = saved })
    }

    const flash = this.add.rectangle(RIDER_X, GROUND_Y - 25, 60, 60, C.WAX_RED, 0.3)
    this.tweens.add({
      targets: flash, alpha: 0, duration: 400,
      onComplete: () => flash.destroy(),
    })
  }

  _showStoryLine(key) {
    if (this._storyText) {
      this.tweens.killTweensOf(this._storyText)
      this._storyText.destroy()
      this._storyText = null
    }
    this._storyText = this.add.text(640, 670, STORIES[key], {
      ...TEXT.bodyItalic, fontSize: '12px', color: COLORS.INK_LIGHT,
      align: 'center', lineSpacing: 4,
    }).setOrigin(0.5, 1).setAlpha(0)
    const s = this._storyText
    this.tweens.add({
      targets: s, alpha: 0.85, duration: 400, hold: 2400,
      onComplete: () => {
        this.tweens.add({
          targets: s, alpha: 0, duration: 500,
          onComplete: () => {
            if (s) s.destroy()
            if (this._storyText === s) this._storyText = null
          },
        })
      },
    })
  }

  _transitionLocation(loc) {
    if (this._locationLabel) {
      this.tweens.add({ targets: this._locationLabel, alpha: 0, duration: 300 })
    }
    const divider = this.add.rectangle(1320, 360, 3, 720, C.INK, 0.2)
    this.tweens.add({
      targets: divider, x: -20, duration: 700, ease: 'Quad.easeInOut',
      onComplete: () => divider.destroy(),
    })
    this.time.delayedCall(400, () => {
      if (!this._locationLabel) return
      this._locationLabel.setText(loc.toUpperCase())
      this.tweens.add({ targets: this._locationLabel, alpha: 0.45, duration: 500 })

      const wash = WASHES[loc]
      if (wash && this._bgWash) {
        this.tweens.add({
          targets: this._bgWash, alpha: 0, duration: 300,
          onComplete: () => {
            if (!this._bgWash) return
            this._bgWash.setFillStyle(wash.color, wash.alpha)
            this._bgWash.setAlpha(0)
            this.tweens.add({ targets: this._bgWash, alpha: 1, duration: 500 })
          },
        })
      }
    })
  }

  _spawnObstacle(type) {
    const container = this.add.container(1320, 0)
    const ob = {
      type, container, resolved: false, hitRegistered: false,
      hit: { x: -25, y: GROUND_Y - 30, w: 50, h: 30 },
      shake: 0.008,
      duckedTime: 0,
    }

    const g = this.add.graphics()
    container.add(g)

    if (type === 'dogs') {
      for (let i = 0; i < 3; i++) {
        const dx = -60 + i * 40
        g.fillStyle(C.INK, 0.85)
        g.fillRect(dx - 15, GROUND_Y - 18, 30, 15)
        g.fillTriangle(dx - 12, GROUND_Y - 18, dx - 8, GROUND_Y - 24, dx - 4, GROUND_Y - 18)
        g.fillTriangle(dx + 4, GROUND_Y - 18, dx + 8, GROUND_Y - 24, dx + 12, GROUND_Y - 18)
        const bark = this.add.text(dx, GROUND_Y - 40, 'BARK!', {
          ...TEXT.label, fontSize: '9px', color: COLORS.WAX_RED, fontStyle: 'bold',
        }).setOrigin(0.5)
        container.add(bark)
        this.tweens.add({ targets: bark, y: bark.y - 4, duration: 200, yoyo: true, repeat: -1 })
      }
      ob.hit = { x: -75, y: GROUND_Y - 24, w: 150, h: 26 }
      ob.shake = 0.006
    } else if (type === 'tire') {
      g.lineStyle(1.5, C.INK, 0.9)
      g.strokeEllipse(0, GROUND_Y - 12, 40, 22)
      g.lineStyle(1, C.INK, 0.6)
      g.beginPath(); g.moveTo(-6, GROUND_Y - 18); g.lineTo(6, GROUND_Y - 6); g.strokePath()
      g.beginPath(); g.moveTo(6, GROUND_Y - 18); g.lineTo(-6, GROUND_Y - 6); g.strokePath()
      ob.hit = { x: -20, y: GROUND_Y - 22, w: 40, h: 22 }
    } else if (type === 'dengue') {
      g.fillStyle(C.WAX_RED, 0.18)
      g.fillRect(-130, 0, 260, 430)
      g.lineStyle(1, C.WAX_RED, 0.3)
      g.beginPath()
      g.moveTo(-130, 430)
      for (let x = -130; x <= 130; x += 10) {
        g.lineTo(x, 430 + Math.sin(x * 0.1) * 5)
      }
      g.strokePath()
      const feverText = this.add.text(0, 180, 'FEVER', {
        ...TEXT.title, fontSize: '40px', color: COLORS.WAX_RED, fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(0.3)
      container.add(feverText)
      this.tweens.add({ targets: feverText, scale: 1.1, duration: 1000, yoyo: true, repeat: -1 })
      g.lineStyle(2, C.WAX_RED, 0.7)
      g.beginPath(); g.moveTo(110, 100); g.lineTo(110, 200); g.strokePath()
      g.fillStyle(C.WAX_RED, 0.7)
      g.fillCircle(110, 210, 8)
      ob.hit = { x: -130, y: 0, w: 260, h: 430 }
      ob.shake = 0.005
    } else if (type === 'language') {
      const chars = ['???', '#@!', '??!?', '@%#', '?!?', '##@']
      chars.forEach((c, i) => {
        const t = this.add.text((i % 2 === 0 ? -18 : 18), GROUND_Y - 90 + i * 14, c, {
          ...TEXT.body, fontSize: '14px', color: COLORS.INK, fontStyle: 'bold',
        }).setOrigin(0.5).setAlpha(0.65)
        t.rotation = (Math.random() - 0.5) * 0.3
        container.add(t)
      })
      g.lineStyle(1, C.INK, 0.4)
      g.strokeRect(-30, GROUND_Y - 100, 60, 100)
      ob.hit = { x: -30, y: GROUND_Y - 100, w: 60, h: 100 }
    } else if (type === 'credit') {
      for (let i = 0; i < 3; i++) {
        const cx = -5 + i * 4
        const cy = GROUND_Y - 25 + i * 3
        g.fillStyle(C.PARCHMENT_DARK, 0.9)
        g.fillRect(cx - 30, cy - 18, 60, 35)
        g.lineStyle(1, C.INK, 0.7)
        g.strokeRect(cx - 30, cy - 18, 60, 35)
      }
      g.lineStyle(2.5, C.WAX_RED, 0.9)
      g.beginPath(); g.moveTo(-30, GROUND_Y - 40); g.lineTo(30, GROUND_Y + 5); g.strokePath()
      g.beginPath(); g.moveTo(30, GROUND_Y - 40); g.lineTo(-30, GROUND_Y + 5); g.strokePath()
      const decl = this.add.text(0, GROUND_Y - 15, 'DECLINED', {
        ...TEXT.label, fontSize: '8px', color: COLORS.WAX_RED, fontStyle: 'bold',
      }).setOrigin(0.5)
      decl.rotation = -0.1
      container.add(decl)
      ob.hit = { x: -30, y: GROUND_Y - 45, w: 60, h: 55 }
    } else if (type === 'border') {
      g.lineStyle(3, C.LEATHER, 0.85)
      g.beginPath(); g.moveTo(-60, 400); g.lineTo(60, 400); g.strokePath()
      for (let i = -50; i < 60; i += 15) {
        g.lineStyle(2, C.WAX_RED, 0.5)
        g.beginPath(); g.moveTo(i, 400); g.lineTo(i, 425); g.strokePath()
      }
      g.lineStyle(3, C.LEATHER, 0.9)
      g.beginPath(); g.moveTo(-60, 360); g.lineTo(-60, 425); g.strokePath()
      g.beginPath(); g.moveTo(60, 360); g.lineTo(60, 425); g.strokePath()
      const stopText = this.add.text(0, 370, 'STOP', {
        ...TEXT.heading, fontSize: '18px', color: COLORS.WAX_RED, fontStyle: 'bold',
      }).setOrigin(0.5)
      container.add(stopText)
      ob.hit = { x: -60, y: 0, w: 120, h: 425 }
      ob.shake = 0.007
    } else if (type === 'icebergs') {
      g.fillStyle(0x8899aa, 0.12)
      g.fillRect(-50, GROUND_Y - 120, 100, 120)
      g.lineStyle(1.4, C.INK_FADED, 0.8)
      g.fillStyle(C.PARCHMENT_LIGHT, 0.95)
      g.beginPath()
      g.moveTo(-40, GROUND_Y)
      g.lineTo(-40, GROUND_Y - 80)
      g.lineTo(-25, GROUND_Y - 115)
      g.lineTo(-10, GROUND_Y - 90)
      g.lineTo(5, GROUND_Y - 120)
      g.lineTo(20, GROUND_Y - 95)
      g.lineTo(35, GROUND_Y - 110)
      g.lineTo(40, GROUND_Y - 75)
      g.lineTo(40, GROUND_Y)
      g.closePath()
      g.fillPath()
      g.strokePath()
      ob.hit = { x: -40, y: GROUND_Y - 115, w: 80, h: 115 }
      ob.shake = 0.012
    } else if (type === 'village') {
      this._doors = []
      for (let i = 0; i < 4; i++) {
        const dx = i * 110
        const doorG = this.add.graphics()
        doorG.fillStyle(C.INK, 0.5)
        doorG.fillTriangle(dx - 25, GROUND_Y - 60, dx, GROUND_Y - 88, dx + 25, GROUND_Y - 60)
        doorG.fillStyle(C.LEATHER, 0.75)
        doorG.fillRect(dx - 18, GROUND_Y - 60, 36, 57)
        doorG.lineStyle(1, C.INK, 0.8)
        doorG.strokeRect(dx - 18, GROUND_Y - 60, 36, 57)
        doorG.fillStyle(C.INK, 0.7)
        doorG.fillCircle(dx + 12, GROUND_Y - 32, 2)
        doorG.alpha = 0.75
        container.add(doorG)
        this._doors.push({ worldX: 1320 + dx, knocked: false, index: i, graphic: doorG, offset: dx })
      }
      this._knockActive = true
      ob.hit = { x: 0, y: 0, w: 0, h: 0 }
    } else if (type === 'storm') {
      g.fillStyle(C.INK, 0.12)
      g.fillRect(-150, 0, 300, 560)
      g.lineStyle(1, C.INK, 0.3)
      for (let i = 0; i < 35; i++) {
        const sx = -150 + Math.random() * 300
        const sy = Math.random() * 520
        g.beginPath()
        g.moveTo(sx, sy)
        g.lineTo(sx - 12, sy + 22)
        g.strokePath()
      }
      const stormText = this.add.text(0, 260, 'STORM', {
        ...TEXT.title, fontSize: '34px', color: COLORS.INK, fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(0.2)
      container.add(stormText)
      ob.hit = { x: -150, y: 0, w: 300, h: 560 }
      ob.shake = 0.01
    }

    // Obstacle label
    const labelY = (type === 'dengue' || type === 'border' || type === 'storm')
      ? 50
      : GROUND_Y + 28
    const labelColor = (type === 'dengue' || type === 'storm')
      ? COLORS.WAX_RED
      : COLORS.INK_LIGHT
    const label = this.add.text(0, labelY, OBSTACLE_NAMES[type], {
      ...TEXT.label, fontSize: '10px', color: labelColor, fontStyle: 'italic',
    }).setOrigin(0.5)
    container.add(label)

    this._showWarning(OBSTACLE_NAMES[type])
    this._activeObstacles.push(ob)
  }

  _showWarning(name) {
    const warning = this.add.text(640, 170, name, {
      ...TEXT.label, fontSize: '11px', color: COLORS.WAX_RED, fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0)
    this.tweens.add({
      targets: warning, alpha: 0.7, duration: 300, hold: 700, yoyo: true,
      onComplete: () => warning.destroy(),
    })
  }

  _spawnFinishLine() {
    const container = this.add.container(1800, 0)
    const g = this.add.graphics()
    g.lineStyle(2, C.INK, 0.7)
    for (let y = 100; y < 560; y += 16) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(0, y + 8); g.strokePath()
    }
    container.add(g)
    const homeText = this.add.text(0, 80, 'HOME', {
      ...TEXT.chapter, fontSize: '24px', color: COLORS.INK_BLACK, fontStyle: 'italic',
    }).setOrigin(0.5)
    container.add(homeText)
    this._finishLine = { container }
  }

  _finish() {
    this._gameActive = false
    this.tweens.add({
      targets: this,
      _scrollSpeed: 0,
      _targetSpeed: 0,
      duration: 1500,
      ease: 'Quad.easeOut',
      onComplete: () => this._showCompletionScreen(),
    })
  }

  _calculateScore() {
    const dodgeRate = this._obstaclesDodged / this._totalObstacles
    const dodgeScore = dodgeRate * 60
    const heartScore = Math.max(0, this._livesRemaining) * 10
    const knockBonus = this._knockCount >= 4 ? 5 : (this._knockCount >= 3 ? 3 : 0)
    const raw = dodgeScore + heartScore + knockBonus
    return Math.max(15, Math.min(100, Math.round(raw)))
  }

  _showCompletionScreen() {
    const { width, height } = this.cameras.main
    const score = this._calculateScore()
    const gritGain = Math.round(score / 4)
    const indepGain = Math.round(score / 5)

    const curGrit = this.registry.get(KEYS.STAT_GRIT) ?? 0
    const curIndep = this.registry.get(KEYS.STAT_INDEPENDENCE) ?? 0
    this.registry.set(KEYS.STAT_GRIT, Math.min(100, curGrit + gritGain))
    this.registry.set(KEYS.STAT_INDEPENDENCE, Math.min(100, curIndep + indepGain))
    completeLevel(this, KEYS.SCORE_L3, KEYS.COMPLETED_L3, score)

    this.add.rectangle(width / 2, height / 2, width, height, C.PARCHMENT, 0.92)

    this.add.text(width / 2, 130, 'THE RIDE', {
      ...TEXT.title, fontSize: '40px', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, 190, 'You made it. Every obstacle was real.', {
      ...TEXT.bodyItalic, fontSize: '15px', color: COLORS.INK_LIGHT,
    }).setOrigin(0.5)

    this.add.text(width / 2, 250, `${this._obstaclesDodged} / ${this._totalObstacles} obstacles dodged`, {
      ...TEXT.body, fontSize: '16px',
    }).setOrigin(0.5)

    this.add.text(width / 2, 300, `+${gritGain} Grit   +${indepGain} Independence`, {
      ...TEXT.stamp, fontSize: '18px',
    }).setOrigin(0.5)

    this.add.text(width / 2, 350, `Score: ${score}%`, {
      ...TEXT.body, fontSize: '16px', color: COLORS.INK_FADED,
    }).setOrigin(0.5)

    let flavor
    if (score >= 90) flavor = "Untouchable. You've clearly done this before. Oh wait — you have."
    else if (score >= 70) flavor = 'Seasoned traveler. The road left marks, but you kept going.'
    else if (score >= 50) flavor = "Scrappy. You got hit, got up, kept pedaling. That's the whole point."
    else if (score >= 30) flavor = "Bruised but here. The road doesn't care about style."
    else flavor = "You survived. That's all that matters out there."

    this.add.text(width / 2, 410, flavor, {
      ...TEXT.bodyItalic, fontSize: '13px', color: COLORS.INK_FADED,
      wordWrap: { width: 720 }, align: 'center',
    }).setOrigin(0.5)

    JournalUI.drawWaxSeal(this, width / 2, 530, 'A', 28)

    this.add.text(width / 2, 640, 'PRESS SPACE to return to the hub', {
      ...TEXT.small, color: COLORS.INK_FADED,
    }).setOrigin(0.5)

    const returnToHub = () => {
      if (this._returning) return
      this._returning = true
      this.cameras.main.fadeOut(400, 0, 0, 0)
      this.time.delayedCall(420, () => this.scene.start('LevelSelectHub'))
    }
    this.input.keyboard.removeAllListeners()
    this.input.keyboard.once('keydown-SPACE', returnToHub)
    this.time.delayedCall(10000, returnToHub)
  }
}
