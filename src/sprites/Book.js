import { KEYS } from '../systems/GameRegistry.js'

export class Book {
  constructor(scene, x, y) {
    this.scene = scene
    // Blue rectangle: 28×36 (taller than wide — book shape)
    this.sprite = scene.add.rectangle(x, y, 28, 36, 0x3498db)
    scene.physics.add.existing(this.sprite, true)

    // Label above book for clarity
    this._label = scene.add.text(x, y - 30, 'BOOK', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#aaddff',
    }).setOrigin(0.5)
  }

  collect() {
    if (this._collected) return
    this._collected = true

    this.scene.tweens.add({
      targets: [this.sprite, this._label],
      alpha: 0,
      duration: 250,
      onComplete: () => {
        this.sprite.destroy()
        this._label.destroy()
      }
    })

    this.scene.registry.set(KEYS.BOOK_COLLECTED, true)
  }
}
