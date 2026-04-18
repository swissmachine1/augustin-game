import * as Phaser from 'phaser'
import { KEYS } from '../systems/GameRegistry.js'
import { completeLevel } from './LevelSelectHub.js'
import { COLORS, TEXT, C, FONT } from '../config/theme.js'
import { JournalUI } from '../ui/JournalUI.js'

// Level 3 — Greenland: Storm Survival (Storm Journal Entry)
// Auto-scrolling ice path. Wind gusts push player left/right. Warmth bar depletes.
// Reach checkpoints (every 2000px) to refill warmth. Finish line at 8000px.
// Visual: parchment background with ink storm effects — splatters instead of blue,
// wind shown as ink scratches. Warmth bar styled as "ink well level."

const PATH_LENGTH     = 8000
const SCROLL_SPEED    = 120    // px/s baseline
const WARMTH_MAX      = 100
const WARMTH_DRAIN    = 6      // per second
const WARMTH_DRAIN_STORM = 14  // extra drain when in storm zone
const CHECKPOINT_INTERVAL = 2000

export class GreenlandScene extends Phaser.Scene {
  constructor() {
    super('GreenlandScene')
  }

  create() {
    const { width, height } = this.cameras.main
    this.cameras.main.fadeIn(500, 0, 0, 0)

    this._playerName = this.registry.get(KEYS.PLAYER_NAME) ?? 'friend'
    this._distance = 0
    this._warmth = WARMTH_MAX
    this._ended = false
    this._gusts = []
    this._nextGustTime = 1500
    this._gustsSurvived = 0
    this._gustsHit = 0
    this._nextCheckpoint = CHECKPOINT_INTERVAL
    this._storm = false

    // --- Parchment background ---
    JournalUI.drawParchment(this, 0, 0, 1280, 720)

    // Ink splatters (storm atmosphere — dark ink blots scattered)
    this._inkSplatters = []
    for (let i = 0; i < 5; i++) {
      const splat = JournalUI.drawInkBlot(
        this,
        100 + Math.random() * 1080,
        80 + Math.random() * 200,
        8 + Math.random() * 12
      )
      splat.setAlpha(0.08)
      this._inkSplatters.push(splat)
    }

    // Ink scratch lines across top (wind effect)
    const windG = this.add.graphics()
    windG.lineStyle(0.3, C.INK, 0.1)
    for (let i = 0; i < 12; i++) {
      const sy = 60 + Math.random() * 120
      const sx = Math.random() * 400
      windG.beginPath()
      windG.moveTo(sx, sy)
      windG.lineTo(sx + 200 + Math.random() * 300, sy + (Math.random() - 0.5) * 20)
      windG.strokePath()
    }

    // Ground — ink-wash terrain line
    const groundG = this.add.graphics()
    groundG.fillStyle(C.INK, 0.08)
    groundG.fillRect(0, height - 120, width, 120)
    groundG.lineStyle(1, C.INK, 0.25)
    groundG.beginPath()
    groundG.moveTo(0, height - 120)
    for (let x = 0; x <= width; x += 20) {
      groundG.lineTo(x, height - 120 + (Math.random() - 0.5) * 8)
    }
    groundG.strokePath()

    // Ink speckle dots (snow-like but in ink)
    this._snowDots = []
    for (let i = 0; i < 40; i++) {
      const dot = this.add.rectangle(
        Math.random() * width,
        height - 120 + Math.random() * 60,
        2, 2,
        C.INK
      ).setAlpha(0.15)
      this._snowDots.push(dot)
    }

    // Vignette — ink wash around edges
    this._drawVignette()

    // Falling ink particles (instead of snow)
    this._spawnSnowParticles()

    // --- Player (ink-sketch walker) ---
    this._player = this.add.rectangle(width / 2, height - 150, 14, 26, C.INK)
    this._player.setStrokeStyle(0.5, C.INK_LIGHT)
    this._playerVX = 0

    // Head
    this._playerHead = this.add.rectangle(width / 2, height - 170, 10, 10, C.LEATHER)

    // --- UI ---
    // Ink Well level (warmth bar) — top-left
    this.add.text(30, 22, 'INK WELL', {
      ...TEXT.heading,
      fontSize: '14px',
      fontStyle: 'bold',
    })
    this.add.rectangle(30 + 150, 56, 300, 20, C.PARCHMENT_DARK).setOrigin(0, 0.5).setStrokeStyle(0.5, C.INK, 0.4)
    this._warmthBar = this.add.rectangle(30 + 150, 56, 300, 16, C.INK).setOrigin(0, 0.5)

    // Distance (top-right)
    this.add.text(1260, 22, 'DISTANCE', {
      ...TEXT.heading,
      fontSize: '14px',
      fontStyle: 'bold',
    }).setOrigin(1, 0)
    this._distanceText = this.add.text(1260, 46, '0 / 8000 m', {
      ...TEXT.stat,
      fontSize: '18px',
    }).setOrigin(1, 0)

    // Instructions
    this._instructionText = this.add.text(width / 2, 140,
      'Use \u2190 \u2192 (or A D) to dodge wind gusts\nReach checkpoints to refill ink\nSurvive to the end',
      {
        ...TEXT.bodyItalic,
        color: COLORS.INK_LIGHT,
        align: 'center',
        lineSpacing: 6,
      }
    ).setOrigin(0.5)

    // Fade out instructions after 4s
    this.time.delayedCall(4000, () => {
      if (this._instructionText) {
        this.tweens.add({
          targets: this._instructionText,
          alpha: 0,
          duration: 800,
          onComplete: () => { this._instructionText?.destroy(); this._instructionText = null },
        })
      }
    })

    // Storm warning text (hidden until storm zone)
    this._stormText = this.add.text(width / 2, 200, '-- STORM --', {
      ...TEXT.title,
      fontSize: '30px',
      color: COLORS.WAX_RED,
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0)

    // Keys
    this._keys = this.input.keyboard.addKeys({
      left:  37,
      right: 39,
      a: 65,
      d: 68,
    })

    // Page number
    JournalUI.drawPageNumber(this, 6)

    this.events.once('shutdown', () => {
      this.input.keyboard.removeAllListeners()
    }, this)
  }

  _drawVignette() {
    const { width, height } = this.cameras.main
    const g = this.add.graphics()
    const thickness = 180
    // Ink-wash vignette — subtle darkening at edges
    g.fillStyle(C.INK, 0.06)
    g.fillRect(0, 0, width, thickness)
    g.fillRect(0, height - thickness, width, thickness)
    g.fillRect(0, 0, thickness, height)
    g.fillRect(width - thickness, 0, thickness, height)
  }

  _spawnSnowParticles() {
    // Falling ink particles (instead of white snow)
    this._snow = []
    for (let i = 0; i < 60; i++) {
      const d = this.add.rectangle(
        Math.random() * 1280,
        Math.random() * 720,
        2, 3,
        C.INK
      ).setAlpha(0.15)
      d.vy = 50 + Math.random() * 100
      d.vx = -20 - Math.random() * 40
      this._snow.push(d)
    }
  }

  update(time, delta) {
    if (this._ended) return
    const dt = delta / 1000

    // Progress
    this._distance += SCROLL_SPEED * dt
    this._distanceText.setText(`${Math.round(this._distance)} / ${PATH_LENGTH} m`)

    // Warmth drain
    let drain = WARMTH_DRAIN
    if (this._storm) drain += WARMTH_DRAIN_STORM
    this._warmth = Math.max(0, this._warmth - drain * dt)
    this._warmthBar.width = 300 * (this._warmth / WARMTH_MAX)
    // Ink well color: dark ink normally, red-margin when low
    if (this._warmth < 30) {
      this._warmthBar.setFillStyle(C.WAX_RED)
    } else if (this._warmth < 60) {
      this._warmthBar.setFillStyle(C.RED_MARGIN)
    } else {
      this._warmthBar.setFillStyle(C.INK)
    }

    // Storm zone: 40% - 70% of path
    const stormZone = this._distance > PATH_LENGTH * 0.4 && this._distance < PATH_LENGTH * 0.7
    if (stormZone && !this._storm) {
      this._storm = true
      this._stormText.setAlpha(1)
      this.tweens.add({ targets: this._stormText, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 })
    } else if (!stormZone && this._storm) {
      this._storm = false
      this.tweens.killTweensOf(this._stormText)
      this._stormText.setAlpha(0)
    }

    // Player input — move left/right
    const speed = 220
    let inputX = 0
    if (this._keys.left.isDown || this._keys.a.isDown) inputX = -1
    else if (this._keys.right.isDown || this._keys.d.isDown) inputX = 1

    // Apply input + gust velocity
    const moveX = inputX * speed * dt + this._playerVX * dt
    this._player.x = Phaser.Math.Clamp(this._player.x + moveX, 200, 1080)
    this._playerHead.x = this._player.x

    // Damp gust velocity (friction)
    this._playerVX *= 0.95

    // Walking animation — slight bob
    const bob = Math.sin(time / 120) * 1.5
    this._player.y = 570 + bob
    this._playerHead.y = 550 + bob

    // Spawn wind gusts
    this._nextGustTime -= delta
    if (this._nextGustTime <= 0) {
      this._spawnGust()
      const intervalMs = this._storm ? 600 + Math.random() * 500 : 1200 + Math.random() * 1000
      this._nextGustTime = intervalMs
    }

    // Update existing gusts
    this._gusts.forEach(g => {
      g.rect.x += g.vx * dt
      // Check if gust overlaps player
      if (!g.hit && Math.abs(g.rect.x - this._player.x) < 80 && Math.abs(g.rect.y - this._player.y) < 50) {
        g.hit = true
        this._playerVX = g.vx * 0.6  // get pushed
        this.cameras.main.shake(150, 0.006)
        this._gustsHit++
        // Extra warmth drain on gust hit
        this._warmth = Math.max(0, this._warmth - 5)
      }
      // Despawn if off-screen
      if (g.rect.x < -100 || g.rect.x > 1380) {
        g.rect.destroy()
        g.line.destroy()
        if (!g.hit) this._gustsSurvived++
      }
    })
    this._gusts = this._gusts.filter(g => g.rect.active)

    // Checkpoint
    if (this._distance >= this._nextCheckpoint && this._nextCheckpoint <= PATH_LENGTH) {
      this._triggerCheckpoint()
      this._nextCheckpoint += CHECKPOINT_INTERVAL
    }

    // Move ink particles
    this._snow.forEach(d => {
      d.y += d.vy * dt
      d.x += d.vx * dt
      if (d.y > 720 || d.x < -10) {
        d.y = -5
        d.x = Math.random() * 1400
      }
    })

    // Loss condition
    if (this._warmth <= 0) {
      this._fail()
      return
    }

    // Win condition
    if (this._distance >= PATH_LENGTH) {
      this._finish()
    }
  }

  _spawnGust() {
    const fromLeft = Math.random() > 0.5
    const y = 500 + Math.random() * 80
    const vx = fromLeft ? 400 + Math.random() * 200 : -(400 + Math.random() * 200)
    const x = fromLeft ? -50 : 1330
    // Gust visual: ink scratch clusters (wind streaks)
    const rect = this.add.rectangle(x, y, 60, 30, C.INK, 0.12)
    const line = this.add.rectangle(x, y - 10, 80, 1, C.INK, 0.35)
    this._gusts.push({ rect, line, vx, hit: false })

    // Line moves with rect
    this.tweens.add({
      targets: line,
      x: fromLeft ? line.x + 1500 : line.x - 1500,
      duration: 1500 + Math.random() * 1000,
      onUpdate: () => { line.x = rect.x },
    })
  }

  _triggerCheckpoint() {
    // Warmth refill animation
    const refillAmount = 35
    this._warmth = Math.min(WARMTH_MAX, this._warmth + refillAmount)

    const { width } = this.cameras.main
    const flash = this.add.text(width / 2, 400, `+${refillAmount} INK`, {
      ...TEXT.stamp,
      fontSize: '24px',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0)

    this.tweens.add({
      targets: flash,
      alpha: 1,
      y: 360,
      duration: 500,
      yoyo: true,
      hold: 800,
      onComplete: () => flash.destroy(),
    })
  }

  _fail() {
    this._ended = true
    const { width, height } = this.cameras.main

    this.add.rectangle(width / 2, height / 2, width, height, C.PARCHMENT, 0.92)

    this.add.text(width / 2, 260, 'YOU DIDN\'T MAKE IT', {
      ...TEXT.title,
      fontSize: '30px',
      color: COLORS.WAX_RED,
      fontStyle: 'bold',
    }).setOrigin(0.5)

    const pct = Math.round((this._distance / PATH_LENGTH) * 100)
    this.add.text(width / 2, 330, `You got ${pct}% of the way.`, {
      ...TEXT.chapter,
      fontSize: '17px',
    }).setOrigin(0.5)

    this.add.text(width / 2, 400, 'Try again. The storm won\'t get easier.', {
      ...TEXT.prompt,
    }).setOrigin(0.5)

    this.add.text(width / 2, 500, 'PRESS SPACE to return to the hub', {
      ...TEXT.small,
      color: COLORS.INK_FADED,
    }).setOrigin(0.5)

    // Partial score based on distance
    const score = Math.round((this._distance / PATH_LENGTH) * 50)  // max 50% on fail
    const prevScore = this.registry.get(KEYS.SCORE_L3) ?? 0
    if (score > prevScore) {
      this.registry.set(KEYS.SCORE_L3, score)
    }

    const returnToHub = () => {
      this.cameras.main.fadeOut(400, 0, 0, 0)
      this.time.delayedCall(420, () => this.scene.start('LevelSelectHub'))
    }
    this.input.keyboard.once('keydown-SPACE', returnToHub)
  }

  _finish() {
    if (this._ended) return
    this._ended = true

    const { width, height } = this.cameras.main

    // Score: warmth remaining + gusts dodged
    const warmthScore = Math.round(this._warmth * 0.6)        // up to 60
    const gustScore = Math.min(40, this._gustsSurvived * 4)   // up to 40
    const score = Math.min(100, warmthScore + gustScore)

    const curGrit = this.registry.get(KEYS.STAT_GRIT) ?? 0
    const curIndep = this.registry.get(KEYS.STAT_INDEPENDENCE) ?? 0
    const gritGain = Math.round(score / 4)
    const indepGain = Math.round(score / 5)
    this.registry.set(KEYS.STAT_GRIT, Math.min(100, curGrit + gritGain))
    this.registry.set(KEYS.STAT_INDEPENDENCE, Math.min(100, curIndep + indepGain))

    completeLevel(this, KEYS.SCORE_L3, KEYS.COMPLETED_L3, score)

    this.add.rectangle(width / 2, height / 2, width, height, C.PARCHMENT, 0.92)

    this.add.text(width / 2, 180, 'YOU MADE IT.', {
      ...TEXT.title,
      fontSize: '36px',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, 260,
      `The storm is silent now.\nYou are too.`,
      {
        ...TEXT.chapter,
        fontSize: '17px',
        align: 'center',
        lineSpacing: 8,
      }
    ).setOrigin(0.5)

    this.add.text(width / 2, 380, `Score: ${score}%`, {
      ...TEXT.body,
      fontSize: '18px',
      color: COLORS.INK_FADED,
    }).setOrigin(0.5)

    this.add.text(width / 2, 420, `+${gritGain} Grit   +${indepGain} Independence`, {
      ...TEXT.stamp,
      fontSize: '16px',
    }).setOrigin(0.5)

    this.add.text(width / 2, 540,
      `"Back to civilization.\nTime to build things that scale..."`,
      {
        ...TEXT.prompt,
        align: 'center',
        lineSpacing: 6,
      }
    ).setOrigin(0.5)

    this.add.text(width / 2, 650, 'PRESS SPACE to return to the hub', {
      ...TEXT.small,
      color: COLORS.INK_FADED,
    }).setOrigin(0.5)

    const returnToHub = () => {
      this.cameras.main.fadeOut(400, 0, 0, 0)
      this.time.delayedCall(420, () => this.scene.start('LevelSelectHub'))
    }
    this.input.keyboard.once('keydown-SPACE', returnToHub)
    this.time.delayedCall(8000, returnToHub)
  }
}
