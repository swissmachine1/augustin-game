import * as Phaser from 'phaser'
import { KEYS } from '../systems/GameRegistry.js'

// Gritty text-reveal cinematic. Personalized with PLAYER_NAME.
// Sequence of beats, each fades in, holds, fades out. Space/click skips.
export class OpeningCinematicScene extends Phaser.Scene {
  constructor() {
    super('OpeningCinematicScene')
  }

  create() {
    const { width, height } = this.cameras.main
    const name = this.registry.get(KEYS.PLAYER_NAME) ?? 'friend'

    this.cameras.main.fadeIn(500, 0, 0, 0)

    // Narrative beats — personalized with name
    this._beats = [
      `Hey ${name}.`,
      `2014. Shanghai.`,
      `20 years old. Finishing a law degree I no longer want.`,
      `Don't speak Mandarin. Don't know anyone.`,
      `One bag. Three months. One ticket home.`,
      ``,
      `What you're about to play is 10 years\nof my career compressed into 5 mini-games.`,
      `Each one tests a skill I had to build from zero.`,
      ``,
      `Beat level 5, ${name},\nand you'll know why you should hire me.`,
    ]

    this._currentBeat = 0
    this._beatText = this.add.text(width / 2, height / 2, '', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#e8e8f0',
      align: 'center',
      lineSpacing: 12,
      wordWrap: { width: width - 120 },
    }).setOrigin(0.5).setAlpha(0)

    // Skip prompt (bottom)
    this.add.text(width / 2, height - 30, 'press SPACE to skip', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#444455',
    }).setOrigin(0.5)

    // Skip on any space press
    this.input.keyboard.once('keydown-SPACE', () => this._finish())

    // Start the sequence
    this._playNextBeat()

    this.events.once('shutdown', () => {
      this.input.keyboard.removeAllListeners()
      if (this._beatTimer) this._beatTimer.remove()
    }, this)
  }

  _playNextBeat() {
    if (this._currentBeat >= this._beats.length) {
      this._finish()
      return
    }

    const text = this._beats[this._currentBeat]
    this._currentBeat++

    // Empty string = pause beat (just wait, no text)
    if (text === '') {
      this._beatTimer = this.time.delayedCall(800, () => this._playNextBeat())
      return
    }

    this._beatText.setText(text).setAlpha(0)

    // Fade in
    this.tweens.add({
      targets: this._beatText,
      alpha: 1,
      duration: 600,
      onComplete: () => {
        // Hold based on length (longer text = longer hold)
        const holdMs = Math.max(1400, text.length * 40)
        this._beatTimer = this.time.delayedCall(holdMs, () => {
          // Fade out
          this.tweens.add({
            targets: this._beatText,
            alpha: 0,
            duration: 500,
            onComplete: () => this._playNextBeat(),
          })
        })
      },
    })
  }

  _finish() {
    if (this._finishing) return
    this._finishing = true
    this.cameras.main.fadeOut(500, 0, 0, 0)
    this.time.delayedCall(520, () => {
      this.scene.start('LevelSelectHub')
    })
  }
}
