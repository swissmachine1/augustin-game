import Phaser from 'phaser'
import { KEYS } from '../systems/GameRegistry.js'

const HEART_FULL  = 0xe74c3c  // red
const HEART_EMPTY = 0x555566  // dark grey

export class HUDScene extends Phaser.Scene {
  constructor() {
    super('HUDScene')
  }

  create() {
    // Transparent camera — game world shows through
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)')

    const health    = this.registry.get(KEYS.HEALTH)
    const healthMax = this.registry.get(KEYS.HEALTH_MAX)
    const coins     = this.registry.get(KEYS.COINS)

    // --- Hearts (top-left) ---
    this._hearts = []
    for (let i = 0; i < healthMax; i++) {
      const heart = this.add.rectangle(24 + i * 36, 24, 28, 28, HEART_FULL)
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(10)
      this._hearts.push(heart)
    }
    this._updateHearts(health, healthMax)

    // --- Coin counter (top-right) ---
    this._coinText = this.add.text(1256, 24, `COINS: ${coins}`, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#f1c40f',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(10)

    // --- Reactive registry listeners ---
    this._onHealthChange = (parent, value) => {
      const max = this.registry.get(KEYS.HEALTH_MAX)
      this._updateHearts(value, max)
    }
    this._onCoinsChange = (parent, value) => {
      this._coinText.setText(`COINS: ${value}`)
    }

    this.registry.events.on(`changedata-${KEYS.HEALTH}`, this._onHealthChange, this)
    this.registry.events.on(`changedata-${KEYS.COINS}`,  this._onCoinsChange,  this)

    // Cleanup listeners on shutdown (ARCH-03 pattern)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.registry.events.off(`changedata-${KEYS.HEALTH}`, this._onHealthChange, this)
      this.registry.events.off(`changedata-${KEYS.COINS}`,  this._onCoinsChange,  this)
    }, this)
  }

  _updateHearts(health, healthMax) {
    this._hearts.forEach((heart, i) => {
      heart.setFillStyle(i < health ? HEART_FULL : HEART_EMPTY)
    })
  }
}
