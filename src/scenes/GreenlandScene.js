import * as Phaser from 'phaser'
import { KEYS } from '../systems/GameRegistry.js'
import { completeLevel } from './LevelSelectHub.js'

// Level 3 — Greenland: Storm Survival
// Auto-scrolling ice path. Wind gusts push player left/right. Warmth bar depletes.
// Reach checkpoints (every 2000px) to refill warmth. Finish line at 8000px.

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

    // --- Background ---
    // Dark blue sky with aurora bands
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a1628)

    // Aurora bands (animated)
    this._aurora = []
    for (let i = 0; i < 3; i++) {
      const band = this.add.rectangle(
        width / 2,
        80 + i * 40,
        width + 200,
        30,
        i % 2 === 0 ? 0x2ecc71 : 0x5dade2
      ).setAlpha(0.15)
      this._aurora.push(band)
      this.tweens.add({
        targets: band,
        x: band.x + 100 * (i % 2 === 0 ? 1 : -1),
        alpha: 0.25,
        duration: 4000 + i * 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }

    // Ice ground — layered for parallax feel
    this.add.rectangle(width / 2, height - 60, width, 120, 0xeaf4ff)
    this.add.rectangle(width / 2, height - 30, width, 60, 0xb8d8ee)
    // Snow texture dots
    this._snowDots = []
    for (let i = 0; i < 40; i++) {
      const dot = this.add.rectangle(
        Math.random() * width,
        height - 120 + Math.random() * 60,
        2,
        2,
        0xffffff
      )
      this._snowDots.push(dot)
    }

    // Vignette around edges (storm feel)
    this._drawVignette()

    // Falling snow particles
    this._spawnSnowParticles()

    // --- Player (small ice-walker figure) ---
    this._player = this.add.rectangle(width / 2, height - 150, 14, 26, 0x2c3e50)
    this._player.setStrokeStyle(1, 0x34495e)
    this._playerVX = 0   // horizontal velocity from gusts

    // Hood detail (head)
    this._playerHead = this.add.rectangle(width / 2, height - 170, 10, 10, 0x5d4037)

    // --- UI ---
    // Warmth bar (top-left)
    this.add.text(30, 22, 'WARMTH', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#5dade2',
      fontStyle: 'bold',
    })
    this.add.rectangle(30 + 150, 56, 300, 20, 0x1a2a3a).setOrigin(0, 0.5).setStrokeStyle(1, 0x5dade2)
    this._warmthBar = this.add.rectangle(30 + 150, 56, 300, 16, 0x5dade2).setOrigin(0, 0.5)

    // Distance (top-right)
    this.add.text(1260, 22, 'DISTANCE', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#5dade2',
      fontStyle: 'bold',
    }).setOrigin(1, 0)
    this._distanceText = this.add.text(1260, 46, '0 / 8000 m', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ecf0f1',
    }).setOrigin(1, 0)

    // Instructions
    this._instructionText = this.add.text(width / 2, 140,
      'Use ← → (or A D) to dodge wind gusts\nReach checkpoints to refill warmth\nSurvive to the end',
      {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#aaccee',
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
    this._stormText = this.add.text(width / 2, 200, '⚠ STORM ⚠', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#ff4444',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0)

    // Keys
    this._keys = this.input.keyboard.addKeys({
      left:  37,
      right: 39,
      a: 65,
      d: 68,
    })

    this.events.once('shutdown', () => {
      this.input.keyboard.removeAllListeners()
    }, this)
  }

  _drawVignette() {
    const { width, height } = this.cameras.main
    const thickness = 180
    // Top
    this.add.rectangle(width / 2, thickness / 2, width, thickness, 0x000000).setAlpha(0.4)
    // Bottom
    this.add.rectangle(width / 2, height - thickness / 2, width, thickness, 0x000000).setAlpha(0.3)
    // Left
    this.add.rectangle(thickness / 2, height / 2, thickness, height, 0x000000).setAlpha(0.4)
    // Right
    this.add.rectangle(width - thickness / 2, height / 2, thickness, height, 0x000000).setAlpha(0.4)
  }

  _spawnSnowParticles() {
    // Falling snow — simulate with moving dots
    this._snow = []
    for (let i = 0; i < 60; i++) {
      const d = this.add.rectangle(
        Math.random() * 1280,
        Math.random() * 720,
        2,
        3,
        0xffffff
      ).setAlpha(0.6)
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
    // Warmth color shifts red when low
    if (this._warmth < 30) {
      this._warmthBar.setFillStyle(0xe74c3c)
    } else if (this._warmth < 60) {
      this._warmthBar.setFillStyle(0xf39c12)
    } else {
      this._warmthBar.setFillStyle(0x5dade2)
    }

    // Storm zone: 40% - 70% of path
    const stormZone = this._distance > PATH_LENGTH * 0.4 && this._distance < PATH_LENGTH * 0.7
    if (stormZone && !this._storm) {
      this._storm = true
      this._stormText.setAlpha(1)
      this.tweens.add({ targets: this._stormText, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 })
      // Darken the scene
      this.cameras.main.setBackgroundColor(0x06101a)
    } else if (!stormZone && this._storm) {
      this._storm = false
      this.tweens.killTweensOf(this._stormText)
      this._stormText.setAlpha(0)
      this.cameras.main.setBackgroundColor(0x0a1628)
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

    // Move snow
    this._snow.forEach(d => {
      d.y += d.vy * dt
      d.x += d.vx * dt
      if (d.y > 720 || d.x < -10) {
        d.y = -5
        d.x = Math.random() * 1400
      }
    })

    // Aurora band position update  (managed by tweens, no per-frame needed)

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
    // Gust visual: horizontal line cluster (wind streaks)
    const rect = this.add.rectangle(x, y, 60, 30, 0xaaccee, 0.4)
    const line = this.add.rectangle(x, y - 10, 80, 2, 0xffffff, 0.8)
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
    const flash = this.add.text(width / 2, 400, `+${refillAmount} WARMTH`, {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#5dade2',
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

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85)

    this.add.text(width / 2, 260, 'YOU DIDN\'T MAKE IT', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#e74c3c',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    const pct = Math.round((this._distance / PATH_LENGTH) * 100)
    this.add.text(width / 2, 330, `You got ${pct}% of the way.`, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5)

    this.add.text(width / 2, 400, 'Try again. The storm won\'t get easier.', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#888899',
      fontStyle: 'italic',
    }).setOrigin(0.5)

    this.add.text(width / 2, 500, 'PRESS SPACE to return to the hub', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#444455',
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

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85)

    this.add.text(width / 2, 180, 'YOU MADE IT.', {
      fontFamily: 'monospace',
      fontSize: '40px',
      color: '#5dade2',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, 260,
      `The aurora is silent now.\nYou are too.`,
      {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 8,
        fontStyle: 'italic',
      }
    ).setOrigin(0.5)

    this.add.text(width / 2, 380, `Score: ${score}%`, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#888899',
    }).setOrigin(0.5)

    this.add.text(width / 2, 420, `+${gritGain} Grit   +${indepGain} Independence`, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#00ff88',
    }).setOrigin(0.5)

    this.add.text(width / 2, 540,
      `"Back to civilization.\nTime to build things that scale..."`,
      {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#666677',
        align: 'center',
        fontStyle: 'italic',
        lineSpacing: 6,
      }
    ).setOrigin(0.5)

    this.add.text(width / 2, 650, 'PRESS SPACE to return to the hub', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#444455',
    }).setOrigin(0.5)

    const returnToHub = () => {
      this.cameras.main.fadeOut(400, 0, 0, 0)
      this.time.delayedCall(420, () => this.scene.start('LevelSelectHub'))
    }
    this.input.keyboard.once('keydown-SPACE', returnToHub)
    this.time.delayedCall(8000, returnToHub)
  }
}
