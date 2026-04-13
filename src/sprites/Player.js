import Phaser from 'phaser'

export const PLAYER_CONSTANTS = {
  ACCEL_X: 1200,         // px/s^2 — acceleration when key held
  DRAG_X: 1000,          // px/s^2 — deceleration when no key
  MAX_VEL_X: 300,        // px/s — horizontal speed cap
  JUMP_VEL: -600,        // px/s — jump initial velocity, negative = upward
  GRAVITY_MULT_FALL: 2.0, // multiplier on descent — Plan 02
  COYOTE_MS: 120,        // ms — coyote time window — Plan 02
  JUMP_BUFFER_MS: 150,   // ms — jump buffer window — Plan 02
  DOUBLE_JUMP_VEL: -480  // px/s — second jump at 80% — Plan 02
}

export class Player {
  constructor(scene, x, y) {
    this.scene = scene

    // Colored rectangle placeholder — swap for sprite in Phase 2
    this.sprite = scene.add.rectangle(x, y, 32, 48, 0x00ff88)
    scene.physics.add.existing(this.sprite)
    this.sprite.body.setCollideWorldBounds(true)

    // Expose body for collision setup in GameScene
    this.body = this.sprite.body

    // Physics constants applied once in constructor
    this.body.setDragX(PLAYER_CONSTANTS.DRAG_X)
    this.body.setMaxVelocityX(PLAYER_CONSTANTS.MAX_VEL_X)

    // Input — cursor keys + WASD
    this.keys = scene.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      w: Phaser.Input.Keyboard.KeyCodes.W
    })

    // Facing direction — true = right
    this._facingRight = true
  }

  // Expose position for checkpoint reads
  get x() { return this.sprite.x }
  get y() { return this.sprite.y }

  update(delta) {
    this._handleHorizontal()
  }

  _handleHorizontal() {
    const goRight = this.keys.right.isDown || this.keys.d.isDown
    const goLeft = this.keys.left.isDown || this.keys.a.isDown

    if (goRight) {
      this.body.setAccelerationX(PLAYER_CONSTANTS.ACCEL_X)
      this._facingRight = true
    } else if (goLeft) {
      this.body.setAccelerationX(-PLAYER_CONSTANTS.ACCEL_X)
      this._facingRight = false
    } else {
      this.body.setAccelerationX(0)
      // No direction update when idle — keep last facing
    }

    // Flip sprite to face movement direction
    this.sprite.setFlipX(!this._facingRight)
  }

  destroy() {
    this.sprite.destroy()
  }
}
