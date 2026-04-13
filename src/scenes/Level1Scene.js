import Phaser from 'phaser'
import { LEVEL1 } from '../data/level1Data.js'
import { KEYS } from '../systems/GameRegistry.js'
import { Player } from '../sprites/Player.js'
import { StatsManager } from '../systems/StatsManager.js'
import { Coin } from '../sprites/Coin.js'
import { Book } from '../sprites/Book.js'
import { Enemy } from '../sprites/Enemy.js'

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

    // --- HUD ---
    this.scene.launch('HUDScene')

    // --- Shutdown handler (ARCH-03) ---
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.stop('HUDScene')
      this.registry.events.off('changedata', this._checkBossDoor, this)
    }, this)

    // --- Collectibles (Plan 03) ---
    // Spawn coins from data
    this._coins = LEVEL1.coins.map(pos => new Coin(this, pos.x, pos.y))

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

    // --- Placeholder for Plan 05 ---
    this._boss = null
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
  }
}
