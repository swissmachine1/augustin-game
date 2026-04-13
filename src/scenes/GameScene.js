import * as Phaser from 'phaser'
import { KEYS } from '../systems/GameRegistry.js'
import { Player } from '../sprites/Player.js'
import { StatsManager } from '../systems/StatsManager.js'

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
  }

  create() {
    const { width, height } = this.cameras.main

    // Fade in from black (TitleScene faded out before starting us)
    this.cameras.main.fadeIn(300, 0, 0, 0)

    // Ground platform
    const ground = this.add.rectangle(width / 2, height - 32, width, 64, 0x444466)
    this.physics.add.existing(ground, true) // true = static body

    // A couple of floating platforms
    const plat1 = this.add.rectangle(300, 500, 200, 20, 0x444466)
    this.physics.add.existing(plat1, true)

    const plat2 = this.add.rectangle(700, 400, 200, 20, 0x444466)
    this.physics.add.existing(plat2, true)

    const plat3 = this.add.rectangle(1050, 480, 200, 20, 0x444466)
    this.physics.add.existing(plat3, true)

    // Player — module-based, rectangle placeholder
    this.player = new Player(this, 200, height - 120)

    // Stats system — loads persisted values from localStorage (STAT-01, STAT-02)
    this.stats = new StatsManager()

    // Seed registry with persisted stat values so HUDScene bars initialise correctly
    const allStats = this.stats.getAll()
    Object.entries(allStats).forEach(([key, val]) => {
      this.registry.set(key, val)
    })

    // Debug: E key simulates coin pickup (+10 Sales stat, +1 coin)
    // Remove in Phase 4 when real collectibles are wired
    this._debugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)

    // Collide player sprite with platforms
    this.physics.add.collider(this.player.sprite, ground)
    this.physics.add.collider(this.player.sprite, plat1)
    this.physics.add.collider(this.player.sprite, plat2)
    this.physics.add.collider(this.player.sprite, plat3)

    // World bounds
    this.physics.world.setBounds(0, 0, width, height)

    // Death floor — 100px below the screen bottom
    this.deathFloorY = height + 100

    // Launch HUD as parallel overlay scene (HUD-01)
    this.scene.launch('HUDScene')

    // Shutdown handler (ARCH-03 — stop HUDScene when GameScene stops)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.stop('HUDScene')
    }, this)

    // Scene label
    this.add.text(width / 2, 30, 'GAME SCENE — [E] collect coin | [TAB] stats overlay', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#8888aa',
    }).setOrigin(0.5)
  }

  update(time, delta) {
    if (this.player) this.player.update(delta)
    this.handleDeath()

    // Debug stat/coin pickup (E key) — proof of pipeline before Phase 4 collectibles
    if (this._debugKey && Phaser.Input.Keyboard.JustDown(this._debugKey)) {
      this.stats.add(KEYS.STAT_SALES, 10)
      this.registry.set(KEYS.STAT_SALES, this.stats.get(KEYS.STAT_SALES))
      const coins = (this.registry.get(KEYS.COINS) ?? 0) + 1
      this.registry.set(KEYS.COINS, coins)
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
}
