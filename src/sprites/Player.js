import * as Phaser from 'phaser'

export const PLAYER_CONSTANTS = Object.freeze({
  ACCEL_X: 1200,         // px/s^2 — acceleration when key held
  DRAG_X: 1000,          // px/s^2 — deceleration when no key
  MAX_VEL_X: 300,        // px/s — horizontal speed cap
  JUMP_VEL: -600,        // px/s — jump initial velocity, negative = upward
  GRAVITY_MULT_FALL: 2.0, // multiplier on descent — Plan 02
  COYOTE_MS: 120,        // ms — coyote time window — Plan 02
  JUMP_BUFFER_MS: 150,   // ms — jump buffer window — Plan 02
  DOUBLE_JUMP_VEL: -480  // px/s — second jump at 80% — Plan 02
})

const ANIM_STATE = Object.freeze({
  IDLE: 'idle',
  RUN:  'run',
  JUMP: 'jump',
  FALL: 'fall',
})

const ANIM_COLORS = Object.freeze({
  [ANIM_STATE.IDLE]: 0x00ff88,  // green — standing still
  [ANIM_STATE.RUN]:  0x00ccff,  // cyan — running
  [ANIM_STATE.JUMP]: 0xffff00,  // yellow — airborne (rising)
  [ANIM_STATE.FALL]: 0xff8800,  // orange — airborne (falling)
})

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

    // Jump state — Plan 02
    this._doubleJumpAvailable = true
    this._coyoteTimeLeft = 0
    this._jumpBufferTimeLeft = 0
    this._wasOnGround = false

    // Animation state — Plan 03
    this._currentState = ANIM_STATE.IDLE
  }

  // Expose position for checkpoint reads
  get x() { return this.sprite.x }
  get y() { return this.sprite.y }

  update(delta) {
    this._handleHorizontal()
    this._handleJump(delta)
    this._applyAsymmetricGravity()
    this._updateAnimState()
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

  _handleJump(delta) {
    const onGround = this.body.blocked.down
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.keys.space)
                     || Phaser.Input.Keyboard.JustDown(this.keys.up)
                     || Phaser.Input.Keyboard.JustDown(this.keys.w)

    // Buffer: record jump intent before processing so buffered landing works
    if (jumpPressed) this._jumpBufferTimeLeft = PLAYER_CONSTANTS.JUMP_BUFFER_MS

    // Coyote time: reset when grounded, count down when airborne
    if (onGround) {
      this._coyoteTimeLeft = PLAYER_CONSTANTS.COYOTE_MS
      this._doubleJumpAvailable = true
      // Consume buffered jump on landing
      if (!this._wasOnGround && this._jumpBufferTimeLeft > 0) {
        this._doJump()
      }
    } else {
      this._coyoteTimeLeft = Math.max(0, this._coyoteTimeLeft - delta)
    }
    this._jumpBufferTimeLeft = Math.max(0, this._jumpBufferTimeLeft - delta)
    this._wasOnGround = onGround

    // Jump execution
    const canJump = onGround || this._coyoteTimeLeft > 0
    if (jumpPressed && canJump) {
      this._doJump()
    } else if (jumpPressed && this._doubleJumpAvailable && !canJump) {
      this._doDoubleJump()
    }

    // Variable height: cut jump on early release
    const jumpHeld = this.keys.space.isDown || this.keys.up.isDown || this.keys.w.isDown
    if (!jumpHeld && this.body.velocity.y < -200) {
      this.body.setVelocityY(this.body.velocity.y * 0.85)
    }
  }

  _doJump() {
    this.body.setVelocityY(PLAYER_CONSTANTS.JUMP_VEL)
    this._coyoteTimeLeft = 0
    this._jumpBufferTimeLeft = 0
  }

  _doDoubleJump() {
    this.body.setVelocityY(PLAYER_CONSTANTS.DOUBLE_JUMP_VEL)
    this._doubleJumpAvailable = false
  }

  _applyAsymmetricGravity() {
    const worldGravity = this.scene.physics.world.gravity.y
    if (this.body.velocity.y > 0) {
      // Falling: add extra gravity so total = worldGravity * GRAVITY_MULT_FALL
      this.body.setGravityY(worldGravity * (PLAYER_CONSTANTS.GRAVITY_MULT_FALL - 1))
    } else {
      this.body.setGravityY(0)
    }
  }

  _updateAnimState() {
    const onGround = this.body.blocked.down
    const moving   = Math.abs(this.body.velocity.x) > 10
    const rising   = this.body.velocity.y < -50
    const falling  = this.body.velocity.y > 50

    let newState
    if (!onGround && rising)       newState = ANIM_STATE.JUMP
    else if (!onGround && falling) newState = ANIM_STATE.FALL
    else if (onGround && moving)   newState = ANIM_STATE.RUN
    else                           newState = ANIM_STATE.IDLE

    if (newState !== this._currentState) {
      this._currentState = newState
      // Swap setFillStyle() for sprite.setTexture() / sprite.play() when real sprites are ready (ANIM-02)
      this.sprite.setFillStyle(ANIM_COLORS[newState])
    }
  }

  destroy() {
    this.sprite.destroy()
  }
}
