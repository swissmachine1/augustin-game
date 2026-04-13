import Phaser from 'phaser'

const BOSS_SPEED = 60  // px/s — slow but menacing
const BOSS_HP    = 3

export class Boss {
  constructor(scene, x, y) {
    this.scene = scene
    this.hp = BOSS_HP

    // Large grey rectangle: 80×80
    this.sprite = scene.add.rectangle(x, y, 80, 80, 0x667788)
    scene.physics.add.existing(this.sprite)

    this.body = this.sprite.body
    this.body.setCollideWorldBounds(true)
    this.body.setImmovable(false)
    // Boss does not jump — keep it grounded
  }

  update(playerX) {
    if (this.hp <= 0) return
    // Move toward player horizontally
    const dx = playerX - this.sprite.x
    const dir = dx > 0 ? 1 : -1
    this.body.setVelocityX(dir * BOSS_SPEED)
  }

  hit() {
    if (this.hp <= 0) return false
    this.hp -= 1
    // Flash white
    this.sprite.setFillStyle(0xffffff)
    this.scene.time.delayedCall(150, () => {
      if (this.sprite.active) this.sprite.setFillStyle(0x667788)
    })
    return true  // hit registered
  }

  defeat() {
    this.body.setVelocityX(0)
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 500,
      onComplete: () => this.sprite.destroy()
    })
  }

  destroy() {
    this.sprite.destroy()
  }
}
