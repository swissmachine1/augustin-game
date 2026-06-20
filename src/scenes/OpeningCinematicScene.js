import { Scene } from 'phaser'
import { KEYS } from '../systems/GameRegistry.js'
import { COLORS, C, FONT_DISPLAY, FONT_MONO } from '../config/theme.js'
import { BrutalUI } from '../ui/BrutalUI.js'

// Click-to-advance narrative — one beat at a time, triggered by mouse click anywhere.
export class OpeningCinematicScene extends Scene {
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
      { kind: 'intro',    title: `DEAR ${name.toUpperCase()},`,                  sub: 'LET ME TELL YOU A STORY.' },
      { kind: 'scene',    title: 'SHANGHAI, 2014.',                              sub: 'STUDYING LAW AT EAST CHINA UNIVERSITY OF POLITICAL SCIENCE AND LAW.' },
      { kind: 'beat',     title: 'I WENT TO A STARTUP WEEKEND.',                 sub: 'I HAD AN AHA MOMENT.' },
      { kind: 'reveal',   title: 'I DISCOVERED SOMETHING I PREFERRED.',          sub: 'TECH AND STARTUPS — BUILT FOR CHALLENGE AND ADVENTURE.' },
      { kind: 'promise',  title: '5 CHAPTERS.',                                  sub: 'EACH ONE TESTED A SKILL I HAD TO BUILD FROM ZERO.' },
      { kind: 'finale',   title: `FINISH ALL 5, ${name.toUpperCase()}.`,         sub: 'YOU\'LL KNOW WHY YOU SHOULD HIRE ME.' },
    ]

    // Beat accent colors per beat index
    this._beatAccents = [0x0a0a0a, 0xff2d1f, 0xff2d1f, 0xd4ff00, 0x0066ff, 0x0a0a0a]

    this._beatContainer = null
    this._currentBeat = 0

    // Progress dots — 6 dots at bottom showing current position
    this._progressDots = []
    const dotCount = this._beats.length
    const dotSpacing = 24
    const dotsStartX = width / 2 - ((dotCount - 1) * dotSpacing) / 2
    for (let i = 0; i < dotCount; i++) {
      const dot = this.add.graphics()
      dot.fillStyle(C.GREY_700 ?? 0x444444, 1)
      dot.fillRect(-5, -5, 10, 10)
      dot.setPosition(dotsStartX + i * dotSpacing, height - 30)
      dot.setDepth(100)
      this._progressDots.push(dot)
    }

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

  _updateProgressDots() {
    const accentColor = 0xff2d1f // SHOCK_RED
    const inactiveColor = C.GREY_700 ?? 0x444444
    this._progressDots.forEach((dot, i) => {
      dot.clear()
      const color = i <= this._currentBeat ? accentColor : inactiveColor
      dot.fillStyle(color, 1)
      dot.fillRect(-5, -5, 10, 10)
    })
  }

  _showBeat() {
    if (this._currentBeat >= this._beats.length) { this._finish(); return }
    const beat = this._beats[this._currentBeat]
    const { width, height } = this.cameras.main

    // Remove previous
    if (this._beatContainer) this._beatContainer.destroy()

    // Per-beat accent flash
    const accentColor = this._beatAccents[this._currentBeat] ?? 0x0a0a0a
    if (accentColor !== 0x0a0a0a) {
      BrutalUI.addScreenFlash(this, accentColor, { alpha: 0.12, duration: 200 })
    }

    // Large semi-transparent beat number in the background
    const beatNumStr = String(this._currentBeat + 1).padStart(2, '0')
    const beatNumTxt = this.add.text(width / 2, height / 2, beatNumStr, {
      fontFamily: FONT_DISPLAY, fontSize: '200px', color: '#111111',
    }).setOrigin(0.5).setAlpha(0.12).setDepth(-1)

    const container = this.add.container(width / 2, height / 2)

    // Auto-fit title font size to 90% of canvas width
    const maxWidth = width * 0.88
    let titleFontSize = 72
    let probe = this.add.text(0, 0, beat.title, {
      fontFamily: FONT_DISPLAY, fontSize: `${titleFontSize}px`,
    })
    while (probe.width > maxWidth && titleFontSize > 32) {
      titleFontSize -= 4
      probe.setFontSize(`${titleFontSize}px`)
    }
    probe.destroy()

    // Main block title with offset shadow
    const shadow = this.add.text(5, 5, beat.title, {
      fontFamily: FONT_DISPLAY, fontSize: `${titleFontSize}px`, color: COLORS.SHOCK_RED,
      align: 'center',
    }).setOrigin(0.5)
    const main = this.add.text(0, 0, beat.title, {
      fontFamily: FONT_DISPLAY, fontSize: `${titleFontSize}px`, color: COLORS.BONE,
      align: 'center',
    }).setOrigin(0.5)

    // Subtitle — auto-fit and wrap
    let subFontSize = 16
    const subMaxW = Math.min(width - 80, 1100)
    const sub = this.add.text(0, titleFontSize / 2 + 30, beat.sub, {
      fontFamily: FONT_MONO, fontSize: `${subFontSize}px`, fontStyle: 'bold', color: COLORS.BLACK,
      align: 'center',
      wordWrap: { width: subMaxW - 40 },
    }).setOrigin(0.5, 0)

    // Strip behind subtitle
    const subG = this.add.graphics()
    subG.fillStyle(C.BONE, 1)
    subG.fillRect(-(sub.width + 40) / 2, sub.y - 8, sub.width + 40, sub.height + 16)
    container.add([shadow, main, subG, sub])
    sub.setDepth(1)

    // Beat-type-aware entrance: scale from 0.92 + alpha 0 to 1
    container.setAlpha(0).setScale(0.92)
    this.tweens.add({
      targets: container,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 260,
      ease: 'Back.easeOut',
    })

    this._beatContainer = container

    // Tie beat number text lifetime to container — destroy when container does
    container.once('destroy', () => { if (beatNumTxt && beatNumTxt.active) beatNumTxt.destroy() })

    // Update progress dots
    this._updateProgressDots()

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
