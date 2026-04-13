import Phaser from 'phaser'

export class Player {
  constructor(scene, x, y) {
    this.scene = scene

    // Colored rectangle placeholder — swap for sprite in Phase 2
    this.sprite = scene.add.rectangle(x, y, 32, 48, 0x00ff88)
    scene.physics.add.existing(this.sprite)
    this.sprite.body.setCollideWorldBounds(true)

    // Expose body for collision setup in GameScene
    this.body = this.sprite.body
  }

  // Expose position for checkpoint reads
  get x() { return this.sprite.x }
  get y() { return this.sprite.y }

  destroy() {
    this.sprite.destroy()
  }
}
