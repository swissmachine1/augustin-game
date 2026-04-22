import * as Phaser from 'phaser'
import { KEYS } from '../systems/GameRegistry.js'
import { COLORS, C, FONT_DISPLAY, FONT_MONO } from '../config/theme.js'
import { BrutalUI } from '../ui/BrutalUI.js'

// Click-to-advance narrative — one beat at a time, triggered by mouse click anywhere.
export class OpeningCinematicScene extends Phaser.Scene {
  constructor() {
    super('OpeningCinematicScene')
  }

  create() {
    const { width, height } = this.cameras.main
    this.cameras.main.fadeIn(400, 10, 10, 10)
    this.cameras.main.setBackgroundColor(COLORS.BLACK)

    const name = this.registry.get(KEYS.PLAYER_NAME) ?? 'friend'

    // Background grid
    const g = this.add.graphics()
    g.lineStyle(1, C.GREY_900, 1)
    for (let x = 0; x < width; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, height); g.strokePath() }
    for (let y = 0; y < height; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(width, y); g.strokePath() }

    // Top tag
    BrutalUI.drawSticker(this, 120, 60, 'INTRO', {
      fill: C.SHOCK_RED, rotation: -3 * Math.PI / 180, fontSize: '12px',
    })

    this.add.text(width - 40, 60, 'CLICK ANYWHERE TO ADVANCE', {
      fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: COLORS.GREY_500,
      letterSpacing: 1.5,
    }).setOrigin(1, 0.5)

    // The beats — each shown as a brutalist card, one at a time
    this._beats = [
      { kind: 'intro',    title: `DEAR ${name.toUpperCase()},`,           sub: 'LET ME TELL YOU A STORY.' },
      { kind: 'scene',    title: 'SHANGHAI, 2014.',                       sub: 'I WAS FINISHING A LAW DEGREE I NO LONGER WANTED.' },
      { kind: 'beat',     title: 'THEN I WENT TO A STARTUP WEEKEND.',     sub: 'AND EVERYTHING CHANGED.' },
      { kind: 'promise',  title: '5 CHAPTERS.',                           sub: 'EACH ONE TESTED A SKILL I HAD TO BUILD FROM ZERO.' },
      { kind: 'finale',   title: `FINISH ALL 5, ${name.toUpperCase()}.`,  sub: 'YOU\'LL KNOW WHY YOU SHOULD HIRE ME.' },
    ]

    this._beatContainer = null
    this._currentBeat = 0

    // Skip button top-right
    BrutalUI.drawButton(this, width - 80, 640, 120, 40, 'SKIP →', () => this._finish(), {
      fill: C.BLACK, labelColor: COLORS.BONE, fontSize: '12px', shadowOffset: 4,
    })

    this._showBeat()
    this.input.keyboard.once('keydown-ESC', () => this._finish())

    this.events.once('shutdown', () => {
      this.input.keyboard.removeAllListeners()
      this.input.removeAllListeners()
    }, this)
  }

  _showBeat() {
    if (this._currentBeat >= this._beats.length) { this._finish(); return }
    const beat = this._beats[this._currentBeat]
    const { width, height } = this.cameras.main

    // Remove previous
    if (this._beatContainer) this._beatContainer.destroy()

    const container = this.add.container(width / 2, height / 2)

    // Main block title
    const shadow = this.add.text(5, 5, beat.title, {
      fontFamily: FONT_DISPLAY, fontSize: '72px', color: COLORS.SHOCK_RED,
      align: 'center',
    }).setOrigin(0.5)
    const main = this.add.text(0, 0, beat.title, {
      fontFamily: FONT_DISPLAY, fontSize: '72px', color: COLORS.BONE,
      align: 'center',
    }).setOrigin(0.5)

    // Subtitle strip — high contrast
    const subG = this.add.graphics()
    subG.fillStyle(C.BONE, 1)
    const subProbe = this.add.text(0, 0, beat.sub, {
      fontFamily: FONT_MONO, fontSize: '16px', fontStyle: 'bold', color: COLORS.BLACK,
      align: 'center',
    }).setOrigin(0.5)
    const subW = subProbe.width + 40
    const subH = subProbe.height + 18
    subProbe.destroy()
    subG.fillRect(-subW / 2, 60, subW, subH)
    const sub = this.add.text(0, 60 + subH / 2, beat.sub, {
      fontFamily: FONT_MONO, fontSize: '16px', fontStyle: 'bold', color: COLORS.BLACK,
    }).setOrigin(0.5)

    container.add([shadow, main, subG, sub])
    container.setAlpha(0)
    this.tweens.add({ targets: container, alpha: 1, duration: 220 })

    this._beatContainer = container

    // Advance on click anywhere
    this.input.once('pointerdown', () => {
      this._currentBeat++
      this._showBeat()
    })
  }

  _finish() {
    if (this._finishing) return
    this._finishing = true
    this.cameras.main.fadeOut(400, 10, 10, 10)
    this.time.delayedCall(420, () => this.scene.start('LevelSelectHub'))
  }
}
