import Phaser from 'phaser'
import { LEVEL1 } from '../data/level1Data.js'
import { KEYS } from '../systems/GameRegistry.js'
import { Player } from '../sprites/Player.js'
import { StatsManager } from '../systems/StatsManager.js'

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

    LEVEL1.platforms.forEach(p => {
      const rect = this.add.rectangle(p.x, p.y, p.w, p.h, p.color ?? 0x444466)
      this.physics.add.existing(rect, true)
      if (p.moving) {
        this._setupMovingPlatform(rect, p)
      } else {
        this._platforms.add(rect)
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
    }, this)

    // --- Placeholder arrays for Plans 03–05 ---
    this._coins = []
    this._book = null
    this._enemies = []
    this._boss = null
    this._bossDoor = null
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
}
