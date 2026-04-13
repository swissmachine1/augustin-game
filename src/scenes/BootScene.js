import Phaser from 'phaser'
import { initRegistry } from '../systems/GameRegistry.js'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload() {
    // Generate a placeholder texture (16x16 white square)
    const g = this.make.graphics({ x: 0, y: 0, add: false })
    g.fillStyle(0xffffff)
    g.fillRect(0, 0, 16, 16)
    g.generateTexture('placeholder', 16, 16)
    g.destroy()

    // Loading bar
    const { width, height } = this.cameras.main
    const barW = 300
    const barH = 20
    const barX = (width - barW) / 2
    const barY = height / 2

    const bg = this.add.rectangle(width / 2, barY, barW, barH, 0x333333)
    const fill = this.add.rectangle(barX + 2, barY, 0, barH - 4, 0x00ff88)
    fill.setOrigin(0, 0.5)

    this.load.on('progress', (v) => {
      fill.width = (barW - 4) * v
    })

    // Nothing heavy to load yet — future asset loading goes here
  }

  create() {
    initRegistry(this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      // No cleanup needed for BootScene
    }, this)
    this.scene.start('TitleScene')
  }
}
