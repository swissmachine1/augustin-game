import { Scene } from 'phaser'
import WebFont from 'webfontloader'
import { initRegistry } from '../systems/GameRegistry.js'
import { COLORS, C, FONT_DISPLAY, FONT_MONO } from '../config/theme.js'

export class BootScene extends Scene {
  constructor() {
    super('BootScene')
  }

  create() {
    initRegistry(this)
    const { width, height } = this.cameras.main

    this.cameras.main.setBackgroundColor(COLORS.BLACK)

    // Block-type loading
    const headline = this.add.text(width / 2, height / 2 - 40, 'THE AUGUSTIN FILES', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '52px',
      color: COLORS.BONE,
    }).setOrigin(0.5)

    const shock = this.add.text(width / 2 + 4, height / 2 - 36, 'THE AUGUSTIN FILES', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '52px',
      color: COLORS.SHOCK_RED,
    }).setOrigin(0.5).setDepth(-1)

    const loadingText = this.add.text(width / 2, height / 2 + 30, '> LOADING TYPE…', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: COLORS.BONE,
    }).setOrigin(0.5)

    WebFont.load({
      google: {
        families: [
          'Space Mono:400,700,400italic',
          'Archivo Black',
          'Caveat:400,600',
        ],
      },
      active: () => {
        // Swap to the real fonts now that they're loaded
        headline.setFontFamily(FONT_DISPLAY)
        shock.setFontFamily(FONT_DISPLAY)
        loadingText.setFontFamily(FONT_MONO)
        loadingText.setText('> READY. PRESS SPACE OR CLICK.')
        this.time.delayedCall(350, () => this.scene.start('TitleScene'))
      },
      inactive: () => {
        loadingText.setText('> FALLBACK FONTS — CONTINUING')
        this.time.delayedCall(600, () => this.scene.start('TitleScene'))
      },
      timeout: 4000,
    })

    this.events.once('shutdown', () => {}, this)
  }
}
