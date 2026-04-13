import Phaser from 'phaser'
import { KEYS } from '../systems/GameRegistry.js'
import { Player } from '../sprites/Player.js'

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

    // Collide player sprite with platforms
    this.physics.add.collider(this.player.sprite, ground)
    this.physics.add.collider(this.player.sprite, plat1)
    this.physics.add.collider(this.player.sprite, plat2)
    this.physics.add.collider(this.player.sprite, plat3)

    // World bounds
    this.physics.world.setBounds(0, 0, width, height)

    // Death floor — 100px below the screen bottom
    this.deathFloorY = height + 100

    // Shutdown handler (ARCH-03 — no audio yet, no-op cleanup wired for consistency)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      // No audio in this scene yet — cleanup is a no-op but wired per ARCH-03
    }, this)

    // Scene label
    this.add.text(width / 2, 30, 'GAME SCENE — Registry wired, respawn active', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#8888aa',
    }).setOrigin(0.5)
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
