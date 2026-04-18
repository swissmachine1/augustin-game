import * as Phaser from 'phaser'
import { KEYS } from '../systems/GameRegistry.js'
import { COLORS, TEXT, C } from '../config/theme.js'
import { JournalUI } from '../ui/JournalUI.js'

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene')
  }

  create() {
    const { width, height } = this.cameras.main

    // Leather book cover
    JournalUI.drawLeatherCover(this, 0, 0, width, height)

    // Title
    this.add.text(width / 2, 180, 'The Augustin Files', {
      ...TEXT.title,
      fontSize: '36px',
      color: COLORS.PARCHMENT,
    }).setOrigin(0.5)

    // Decorative line beneath title
    const g = this.add.graphics()
    g.lineStyle(0.5, C.PARCHMENT_DARK, 0.6)
    g.beginPath()
    g.moveTo(width / 2 - 140, 210)
    // Slight curve
    g.lineTo(width / 2 - 40, 212)
    g.lineTo(width / 2, 208)
    g.lineTo(width / 2 + 40, 212)
    g.lineTo(width / 2 + 140, 210)
    g.strokePath()

    // Subtitle
    this.add.text(width / 2, 240, 'Field journal of a go-to-market expedition', {
      ...TEXT.bodyItalic,
      fontSize: '14px',
      color: COLORS.PARCHMENT_DARK,
    }).setOrigin(0.5)

    // Volume
    this.add.text(width / 2, 270, 'Vol. I — 2014–2026', {
      ...TEXT.small,
      color: COLORS.INK_FADED,
    }).setOrigin(0.5)

    // Passport stamps (scattered)
    JournalUI.drawPassportStamp(this, 320, 420, 'Shanghai', 2014, -8)
    JournalUI.drawPassportStamp(this, 640, 380, 'Colombia', 2019, 5)
    JournalUI.drawPassportStamp(this, 960, 430, 'Greenland', 2007, -3)

    // Wax seal
    JournalUI.drawWaxSeal(this, width / 2, 530, 'A', 30)

    // Name input
    const urlName = this._readUrlName()
    this._createNameInput(urlName)

    this.add.text(width / 2, 570, 'Your name (optional):', {
      ...TEXT.label,
      fontSize: '10px',
      color: COLORS.PARCHMENT_DARK,
    }).setOrigin(0.5)

    // Blinking prompt
    const prompt = this.add.text(width / 2, 660, 'Press SPACE to open journal', {
      ...TEXT.prompt,
      color: COLORS.PARCHMENT_DARK,
    }).setOrigin(0.5)

    this.tweens.add({
      targets: prompt,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    })

    // Input handlers
    this.input.keyboard.once('keydown-SPACE', () => this._start())

    const inputEl = document.getElementById('name-input')
    if (inputEl) {
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          this._start()
        }
      })
    }

    this.events.once('shutdown', () => {
      this.input.keyboard.removeAllListeners()
      this._removeNameInput()
    }, this)
  }

  _readUrlName() {
    try {
      return new URLSearchParams(window.location.search).get('name') ?? ''
    } catch (e) { return '' }
  }

  _createNameInput(prefillValue) {
    this._removeNameInput()
    const input = document.createElement('input')
    input.type = 'text'
    input.id = 'name-input'
    input.maxLength = 20
    input.placeholder = 'friend'
    input.value = prefillValue
    input.autocomplete = 'off'

    Object.assign(input.style, {
      position: 'absolute',
      left: '50%',
      top: '82%',
      transform: 'translate(-50%, 0)',
      padding: '8px 14px',
      fontSize: '16px',
      fontFamily: "'Lora', Georgia, serif",
      background: COLORS.LEATHER,
      color: COLORS.PARCHMENT,
      border: `1px solid ${COLORS.INK_FADED}`,
      borderRadius: '2px',
      textAlign: 'center',
      width: '220px',
      outline: 'none',
      zIndex: '10',
    })

    const gameDiv = document.getElementById('game')
    if (gameDiv) {
      gameDiv.appendChild(input)
      if (!prefillValue) input.focus()
    }
  }

  _removeNameInput() {
    const el = document.getElementById('name-input')
    if (el && el.parentNode) el.parentNode.removeChild(el)
  }

  _start() {
    const inputEl = document.getElementById('name-input')
    let name = inputEl ? inputEl.value.trim() : ''
    if (!name) name = 'friend'
    this.registry.set(KEYS.PLAYER_NAME, name)
    this._removeNameInput()

    this.cameras.main.fadeOut(500, 58, 34, 16)  // fade to leather color
    this.time.delayedCall(520, () => {
      this.scene.start('OpeningCinematicScene')
    })
  }
}
