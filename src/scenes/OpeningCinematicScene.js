import * as Phaser from 'phaser'
import { KEYS } from '../systems/GameRegistry.js'
import { COLORS, TEXT, C } from '../config/theme.js'
import { JournalUI } from '../ui/JournalUI.js'

// Opening cinematic — handwritten journal entries appearing on parchment.
// Each beat is a line of ink appearing on the page. Personal, intimate.
export class OpeningCinematicScene extends Phaser.Scene {
  constructor() {
    super('OpeningCinematicScene')
  }

  create() {
    const { width, height } = this.cameras.main
    this.cameras.main.fadeIn(600, 58, 34, 16)

    const name = this.registry.get(KEYS.PLAYER_NAME) ?? 'friend'

    // Parchment page
    JournalUI.drawParchment(this, 0, 0, width, height)
    JournalUI.drawPageNumber(this, 0)

    // Beats — each appears as a handwritten line on the page
    this._beats = [
      { text: `Dear ${name},`,                                          y: 120, style: 'bodyItalic' },
      { text: '2014. Shanghai.',                                        y: 170, style: 'heading' },
      { text: 'I am twenty years old and finishing a law degree',        y: 220, style: 'body' },
      { text: 'I no longer want.',                                      y: 250, style: 'bodyItalic' },
      { text: '',                                                       y: 280 },
      { text: 'What follows are five chapters',                         y: 310, style: 'body' },
      { text: 'from a decade of expeditions.',                          y: 340, style: 'body' },
      { text: '',                                                       y: 370 },
      { text: 'Each one tested a skill',                                y: 400, style: 'body' },
      { text: 'I had to build from zero.',                              y: 430, style: 'bodyItalic' },
      { text: '',                                                       y: 460 },
      { text: `Finish all five, ${name},`,                              y: 510, style: 'body' },
      { text: 'and you will know why you should hire me.',              y: 540, style: 'bodyItalic' },
    ]

    this._currentBeat = 0
    this._marginX = 140  // text starts after the red margin line

    // Skip prompt
    this.add.text(width - 40, height - 20, 'SPACE to skip', {
      ...TEXT.label,
      fontSize: '8px',
    }).setOrigin(1, 1)

    this.input.keyboard.once('keydown-SPACE', () => this._finish())
    this._playNextBeat()

    this.events.once('shutdown', () => {
      this.input.keyboard.removeAllListeners()
      if (this._beatTimer) this._beatTimer.remove()
    }, this)
  }

  _playNextBeat() {
    if (this._currentBeat >= this._beats.length) {
      this.time.delayedCall(1500, () => this._finish())
      return
    }

    const beat = this._beats[this._currentBeat]
    this._currentBeat++

    if (beat.text === '') {
      this._beatTimer = this.time.delayedCall(400, () => this._playNextBeat())
      return
    }

    const style = beat.style ? TEXT[beat.style] : TEXT.body
    const t = this.add.text(this._marginX, beat.y, beat.text, style).setAlpha(0)

    this.tweens.add({
      targets: t,
      alpha: 1,
      duration: 500,
      onComplete: () => {
        const holdMs = Math.max(800, beat.text.length * 30)
        this._beatTimer = this.time.delayedCall(holdMs, () => this._playNextBeat())
      },
    })
  }

  _finish() {
    if (this._finishing) return
    this._finishing = true
    this.cameras.main.fadeOut(500, 244, 232, 208)  // fade to parchment
    this.time.delayedCall(520, () => {
      this.scene.start('LevelSelectHub')
    })
  }
}
