import * as Phaser from 'phaser'

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene')
  }

  create() {
    const { width, height } = this.cameras.main

    // Title
    this.add.text(width / 2, height / 2 - 60, 'THE AUGUSTIN FILES', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#00ff88',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // Subtitle
    this.add.text(width / 2, height / 2 + 10, 'A Career in 5 Levels', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#8888aa',
    }).setOrigin(0.5)

    // Prompt — blink it
    const prompt = this.add.text(width / 2, height / 2 + 80, 'PRESS SPACE TO START', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5)

    this.tweens.add({
      targets: prompt,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
    })

    // Listen for space — fade to black then start GameScene
    this.input.keyboard.once('keydown-SPACE', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0)
      this.time.delayedCall(320, () => {
        this.scene.start('Level1Scene')
      })
    })

    // Shutdown cleanup — remove keyboard listeners on scene stop
    this.events.once('shutdown', () => {
      // Remove any lingering keyboard listeners (Phaser clears .once automatically,
      // but explicit removal guards against edge cases)
      this.input.keyboard.removeAllListeners()
    }, this)
  }
}
