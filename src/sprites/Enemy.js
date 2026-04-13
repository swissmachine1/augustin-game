import * as Phaser from 'phaser'

const ENEMY_SPEED = 100  // px/s horizontal

export class Enemy {
  constructor(scene, x, y, patrolMin, patrolMax) {
    this.scene = scene
    this.patrolMin = patrolMin
    this.patrolMax = patrolMax

    // Grey rectangle: 32×48 (same size as player)
    this.sprite = scene.add.rectangle(x, y, 32, 48, 0x888899)
    scene.physics.add.existing(this.sprite)

    this.body = this.sprite.body
    this.body.setCollideWorldBounds(true)
    this.body.setGravityY(0)  // no extra gravity beyond world gravity
    // Move right initially
    this.body.setVelocityX(ENEMY_SPEED)
    this._direction = 1  // 1 = right, -1 = left
  }

  update() {
    const x = this.sprite.x
    // Reverse at patrol bounds
    if (x >= this.patrolMax && this._direction === 1) {
      this._direction = -1
      this.body.setVelocityX(-ENEMY_SPEED)
    } else if (x <= this.patrolMin && this._direction === -1) {
      this._direction = 1
      this.body.setVelocityX(ENEMY_SPEED)
    }
  }

  destroy() {
    this.sprite.destroy()
  }
}
