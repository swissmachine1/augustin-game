import { KEYS } from '../systems/GameRegistry.js'

export class Coin {
  constructor(scene, x, y, onCollect) {
    this.scene = scene
    this._onCollect = onCollect ?? null
    // Gold rectangle: 20×20
    this.sprite = scene.add.rectangle(x, y, 20, 20, 0xf1c40f)
    scene.physics.add.existing(this.sprite, true) // static body — player overlaps
  }

  collect() {
    if (this._collected) return
    this._collected = true

    // Particle burst callback — JUICE-02
    if (this._onCollect) this._onCollect(this.sprite.x, this.sprite.y)

    // Flash: briefly white then disappear
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      duration: 200,
      onComplete: () => this.sprite.destroy()
    })

    // Registry: increment COINS (HUD reacts) and COINS_COLLECTED (gate)
    const coins = (this.scene.registry.get(KEYS.COINS) ?? 0) + 1
    this.scene.registry.set(KEYS.COINS, coins)

    const collected = (this.scene.registry.get(KEYS.COINS_COLLECTED) ?? 0) + 1
    this.scene.registry.set(KEYS.COINS_COLLECTED, collected)
  }
}
