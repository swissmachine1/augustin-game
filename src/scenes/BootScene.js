import * as Phaser from 'phaser'
import WebFont from 'webfontloader'
import { initRegistry } from '../systems/GameRegistry.js'
import { COLORS, FONT } from '../config/theme.js'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  create() {
    initRegistry(this)

    const { width, height } = this.cameras.main

    // Show loading text in fallback font (Lora not loaded yet)
    const loadingText = this.add.text(width / 2, height / 2, 'Opening journal...', {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      color: COLORS.INK_FADED,
      fontStyle: 'italic',
    }).setOrigin(0.5)

    // Load Google Font
    WebFont.load({
      google: { families: ['Lora:400,400i,700'] },
      active: () => {
        loadingText.setText('Journal ready.')
        this.time.delayedCall(400, () => {
          this.scene.start('TitleScene')
        })
      },
      inactive: () => {
        // Font failed — continue anyway with fallback
        loadingText.setText('(fonts unavailable — continuing)')
        this.time.delayedCall(800, () => {
          this.scene.start('TitleScene')
        })
      },
    })

    this.events.once('shutdown', () => {}, this)
  }
}
