import * as Phaser from 'phaser'
import { LEVEL1 } from '../data/level1Data.js'
import { KEYS } from '../systems/GameRegistry.js'
import { Player } from '../sprites/Player.js'
import { StatsManager } from '../systems/StatsManager.js'
import { Coin } from '../sprites/Coin.js'
import { Book } from '../sprites/Book.js'
import { Enemy } from '../sprites/Enemy.js'
import { Boss } from '../sprites/Boss.js'

export class Level1Scene extends Phaser.Scene {
  constructor() {
    super('Level1Scene')
  }

  create() {
    // Expand world beyond viewport
    this.physics.world.setBounds(0, 0, LEVEL1.worldWidth, LEVEL1.worldHeight)

    // Fade in from black (TitleScene faded out before starting us)
    this.cameras.main.fadeIn(300, 0, 0, 0)

    // Death floor — 100px below world bottom
    this.deathFloorY = LEVEL1.worldHeight + 100

    // --- Ground ---
    const g = LEVEL1.ground
    const ground = this.add.rectangle(g.x, g.y, g.w, g.h, 0x444466)
    this.physics.add.existing(ground, true) // static body

    // --- Platforms ---
    this._platforms = this.physics.add.staticGroup()
    this._movingPlatforms = []
    this._platformRects = []  // all static platform rects for enemy colliders

    LEVEL1.platforms.forEach(p => {
      const rect = this.add.rectangle(p.x, p.y, p.w, p.h, p.color ?? 0x444466)
      this.physics.add.existing(rect, true)
      if (p.moving) {
        this._setupMovingPlatform(rect, p)
      } else {
        this._platforms.add(rect)
        this._platformRects.push(rect)
      }
    })

    // --- Player ---
    this.player = new Player(this, LEVEL1.playerSpawn.x, LEVEL1.playerSpawn.y)
    this.player.body.setCollideWorldBounds(true)

    // Collide player with ground
    this.physics.add.collider(this.player.sprite, ground)

    // Collide player with static platforms (via staticGroup)
    this.physics.add.collider(this.player.sprite, this._platforms)

    // Collide player with each moving platform individually
    this._movingPlatforms.forEach(mp => {
      this.physics.add.collider(this.player.sprite, mp)
    })

    // --- Camera ---
    this.cameras.main.setBounds(0, 0, LEVEL1.worldWidth, LEVEL1.worldHeight)
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1)

    // --- Stats system ---
    // Registry already seeded by BootScene; load persisted values into registry
    this.stats = new StatsManager()
    const allStats = this.stats.getAll()
    Object.entries(allStats).forEach(([key, val]) => {
      this.registry.set(key, val)
    })

    // Seed checkpoint position for respawn
    this.registry.set(KEYS.CHECKPOINT_X, LEVEL1.checkpoint.x)
    this.registry.set(KEYS.CHECKPOINT_Y, LEVEL1.checkpoint.y)

    // --- Particle texture (shared by coin and defeat emitters) ---
    if (!this.textures.exists('particle')) {
      const pg = this.make.graphics({ x: 0, y: 0, add: false })
      pg.fillStyle(0xffffff, 1)
      pg.fillRect(0, 0, 4, 4)
      pg.generateTexture('particle', 4, 4)
      pg.destroy()
    }

    // Coin burst emitter — JUICE-02
    this._coinEmitter = this.add.particles(0, 0, 'particle', {
      speed: { min: 80, max: 160 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      lifespan: 350,
      tint: 0xf1c40f,  // gold
      quantity: 12,
      emitting: false,
    }).setDepth(5)

    // Boss defeat emitter — JUICE-03
    this._defeatEmitter = this.add.particles(0, 0, 'particle', {
      speed: { min: 120, max: 250 },
      angle: { min: 0, max: 360 },
      scale: { start: 2, end: 0 },
      lifespan: 500,
      tint: 0xaaaacc,  // grey-purple
      quantity: 30,
      emitting: false,
    }).setDepth(5)

    // Coin collect callback — fires emitter at pickup location
    this._onCoinCollect = (x, y) => {
      this._coinEmitter.explode(12, x, y)
    }

    // --- HUD ---
    this.scene.launch('HUDScene')

    // --- Shutdown handler (ARCH-03) ---
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.stop('HUDScene')
      this.registry.events.off('changedata', this._checkBossDoor, this)
    }, this)

    // --- Collectibles (Plan 03) ---
    // Spawn coins from data
    this._coins = LEVEL1.coins.map(pos => new Coin(this, pos.x, pos.y, this._onCoinCollect))

    // Spawn book
    this._book = new Book(this, LEVEL1.book.x, LEVEL1.book.y)

    // Overlap: coin collection
    this._coins.forEach(coin => {
      this.physics.add.overlap(
        this.player.sprite,
        coin.sprite,
        () => coin.collect(),
        null,
        this
      )
    })

    // Overlap: book collection
    this.physics.add.overlap(
      this.player.sprite,
      this._book.sprite,
      () => this._book.collect(),
      null,
      this
    )

    // --- Enemies (Plan 04) ---
    // Init i-frames counter before overlap setup
    this._iFrames = 0

    // Spawn enemies from data
    this._enemies = LEVEL1.enemies.map(e =>
      new Enemy(this, e.x, e.y, e.patrolMin, e.patrolMax)
    )

    // Enemy physics: collide with ground and static platforms
    this._enemies.forEach(enemy => {
      this.physics.add.collider(enemy.sprite, ground)
      this._platformRects.forEach(r => this.physics.add.collider(enemy.sprite, r))
    })

    // Overlap: enemy contact damages player
    this._enemies.forEach(enemy => {
      this.physics.add.overlap(
        this.player.sprite,
        enemy.sprite,
        this._handlePlayerHit,
        null,
        this
      )
    })

    // --- Boss door (Plan 04) ---
    const bd = LEVEL1.bossDoor
    this._bossDoor = this.add.rectangle(bd.x, bd.y, bd.w, bd.h, bd.color ?? 0xcc3333)
    this.physics.add.existing(this._bossDoor, true)
    this.physics.add.collider(this.player.sprite, this._bossDoor)

    // Gate logic: check on any registry change
    this._checkBossDoor = () => {
      const coins = this.registry.get(KEYS.COINS_COLLECTED) ?? 0
      const book  = this.registry.get(KEYS.BOOK_COLLECTED) ?? false
      if (coins >= 5 && book) {
        // Open door: tween scale Y to 0, then destroy
        this.tweens.add({
          targets: this._bossDoor,
          scaleY: 0,
          duration: 400,
          onComplete: () => {
            this._bossDoor.destroy()
            this._bossDoor = null
            this.registry.events.off('changedata', this._checkBossDoor, this)
          }
        })
      }
    }
    this.registry.events.on('changedata', this._checkBossDoor, this)

    // --- Boss (Plan 05) ---
    // Spawn boss in arena position
    this._boss = new Boss(this, LEVEL1.bossSpawn.x, LEVEL1.bossSpawn.y)

    // Boss collides with ground (gravity keeps it grounded)
    this.physics.add.collider(this._boss.sprite, ground)

    // Boss stomp overlap — process callback filters for falling player above boss
    this.physics.add.overlap(
      this.player.sprite,
      this._boss.sprite,
      this._handleBossHit,
      // Process callback: only trigger if player is falling (velocity.y > 100)
      // AND player is above boss center (not a side collision)
      (playerSprite, bossSprite) => {
        return playerSprite.body.velocity.y > 100 &&
               playerSprite.y < bossSprite.y  // player above boss center
      },
      this
    )

    // Boss health bar UI — fixed to camera (setScrollFactor(0))
    this._bossHealthBar = this._createBossHealthBar()

    // Level complete state flag
    this._levelComplete = false
  }

  _setupMovingPlatform(rect, data) {
    // rect already has a static body added by the caller — just set up the tween
    const startX = data.x
    this.tweens.add({
      targets: rect,
      x: startX + data.rangeX,
      duration: (data.rangeX / data.speed) * 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Linear',
      onUpdate: () => rect.body.reset(rect.x, rect.y)
    })
    this._movingPlatforms.push(rect)
  }

  update(time, delta) {
    if (this.player) this.player.update(delta)
    this.handleDeath()

    // Decrement i-frames
    if (this._iFrames > 0) this._iFrames = Math.max(0, this._iFrames - delta)

    // Update enemies
    this._enemies.forEach(e => e.update())

    // Update boss
    if (this._boss && this._boss.hp > 0 && !this._levelComplete) {
      this._boss.update(this.player.x)
    }
  }

  handleDeath() {
    if (!this.player) return
    if (this.player.y > this.deathFloorY) {
      this.respawn()
    }
  }

  respawn() {
    const cx = this.registry.get(KEYS.CHECKPOINT_X)
    const cy = this.registry.get(KEYS.CHECKPOINT_Y)
    this.player.body.reset(cx, cy)
  }

  _handlePlayerHit() {
    if (this._iFrames > 0) return  // still invincible
    const health = this.registry.get(KEYS.HEALTH)
    if (health <= 0) return
    this.registry.set(KEYS.HEALTH, health - 1)
    this._iFrames = 1500  // 1.5 seconds
    // Flashing alpha tween on player sprite
    this.tweens.add({
      targets: this.player.sprite,
      alpha: 0,
      duration: 100,
      yoyo: true,
      repeat: 7,  // 8 cycles × 200ms = 1600ms covers the i-frame window
      onComplete: () => { this.player.sprite.setAlpha(1) }
    })

    // Screen shake — JUICE-01
    this.cameras.main.shake(120, 0.008)

    // Hit-pause 40ms — JUICE-04
    this.physics.pause()
    this.tweens.pauseAll()
    this.time.delayedCall(40, () => {
      this.physics.resume()
      this.tweens.resumeAll()
    })
  }

  _createBossHealthBar() {
    const barY = 680  // near bottom of screen
    const segW = 80
    const segH = 20
    const gap  = 8
    const totalW = 3 * segW + 2 * gap
    const startX = 1280 / 2 - totalW / 2

    const segments = []
    for (let i = 0; i < 3; i++) {
      const seg = this.add.rectangle(
        startX + i * (segW + gap) + segW / 2,
        barY,
        segW,
        segH,
        0xe74c3c  // red
      ).setScrollFactor(0).setDepth(15)
      segments.push(seg)
    }

    // Label above bar
    this.add.text(1280 / 2, barY - 24, 'THE COMFORT ZONE', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ff8888',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(15)

    return segments  // array of 3 segment rectangles
  }

  _handleBossHit() {
    if (this._levelComplete) return
    if (!this._boss || this._boss.hp <= 0) return

    const hitRegistered = this._boss.hit()
    if (!hitRegistered) return

    // Bounce player upward after stomp
    this.player.body.setVelocityY(-400)

    // Camera shake
    this.cameras.main.shake(150, 0.01)

    // Hit-pause 40ms on stomp — JUICE-04
    this.physics.pause()
    this.tweens.pauseAll()
    this.time.delayedCall(40, () => {
      this.physics.resume()
      this.tweens.resumeAll()
    })

    // Update health bar — dim segment matching remaining hp
    // Segments: index 2 = first to disappear (right segment first)
    const segIndex = this._boss.hp  // hp just decremented: 2→seg2, 1→seg1, 0→handled below
    if (segIndex >= 0 && segIndex < this._bossHealthBar.length) {
      this._bossHealthBar[segIndex].setFillStyle(0x333344)  // dim = dead
    }

    // All 3 stomps done
    if (this._boss.hp <= 0) {
      this._boss.defeat()
      // Particle explosion on boss defeat — JUICE-03
      this._defeatEmitter.explode(30, this._boss.sprite.x, this._boss.sprite.y)
      this.registry.set(KEYS.BOSS_DEFEATED, true)
      // Small delay then level complete
      this.time.delayedCall(600, () => this._triggerLevelComplete())
    }
  }

  _triggerLevelComplete() {
    if (this._levelComplete) return
    this._levelComplete = true

    // Freeze player input (stop movement)
    this.player.body.setVelocityX(0)
    this.player.body.setAccelerationX(0)

    // Stat reward: +10 Grit (Curiosity maps to Grit)
    this.stats.add(KEYS.STAT_GRIT, 10)
    this.registry.set(KEYS.STAT_GRIT, this.stats.get(KEYS.STAT_GRIT))

    // Overlay — fixed to camera
    const W = 1280, H = 720
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a1a, 0.85)
      .setScrollFactor(0).setDepth(30)

    this.add.text(W / 2, H / 2 - 60, 'LEVEL COMPLETE', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#f1c40f',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(31)

    this.add.text(W / 2, H / 2 + 20, '+10 Curiosity', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#3498db',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(31)

    this.add.text(W / 2, H / 2 + 80, 'PRESS SPACE to continue', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#888899',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(31)

    // Input: Space to transition (or auto after 3s)
    const doTransition = () => {
      this.cameras.main.fadeOut(300, 0, 0, 0)
      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => this.scene.start('TitleScene')
      )
    }

    this.input.keyboard.once('keydown-SPACE', doTransition)
    this.time.delayedCall(3000, doTransition)
  }
}
