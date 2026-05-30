import { Scene } from 'phaser'
import { KEYS } from '../systems/GameRegistry.js'
import { COLORS, C, FONT_DISPLAY, FONT_MONO, FONT_HAND } from '../config/theme.js'
import { BrutalUI } from '../ui/BrutalUI.js'

export class TitleScene extends Scene {
  constructor() {
    super('TitleScene')
  }

  create() {
    const { width, height } = this.cameras.main

    // Full black background
    this.cameras.main.setBackgroundColor(COLORS.BLACK)

    // Dense grid (brutalist blueprint feel)
    const g = this.add.graphics()
    g.lineStyle(1, C.GREY_900, 1)
    for (let x = 0; x < width; x += 40) {
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, height); g.strokePath()
    }
    for (let y = 0; y < height; y += 40) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(width, y); g.strokePath()
    }

    // Top bar — tag + volume
    const tag = BrutalUI.drawSticker(this, 120, 90, 'VOL. 01 / ISSUE 01', {
      fill: C.SHOCK_RED, textColor: COLORS.BLACK, rotation: -3 * Math.PI / 180,
      fontSize: '13px', paddingX: 14, paddingY: 6,
    })

    this.add.text(width - 120, 90, '2014—2026', {
      fontFamily: FONT_MONO, fontSize: '14px', fontStyle: 'bold', color: COLORS.BONE,
    }).setOrigin(1, 0.5)

    // HERO TITLE — massive block type, shocking red offset shadow
    const titleGroup = this.add.container(width / 2, 280)
    const shadowT = this.add.text(6, 6, 'THE AUGUSTIN', {
      fontFamily: FONT_DISPLAY, fontSize: '108px', color: COLORS.SHOCK_RED,
    }).setOrigin(0.5)
    const mainT = this.add.text(0, 0, 'THE AUGUSTIN', {
      fontFamily: FONT_DISPLAY, fontSize: '108px', color: COLORS.BONE,
    }).setOrigin(0.5)
    titleGroup.add([shadowT, mainT])

    const filesGroup = this.add.container(width / 2, 380)
    const shadowF = this.add.text(6, 6, 'FILES', {
      fontFamily: FONT_DISPLAY, fontSize: '108px', color: COLORS.SHOCK_RED,
    }).setOrigin(0.5)
    const mainF = this.add.text(0, 0, 'FILES', {
      fontFamily: FONT_DISPLAY, fontSize: '108px', color: COLORS.BONE,
    }).setOrigin(0.5)
    filesGroup.add([shadowF, mainF])

    // Thick divider line
    const dividerG = this.add.graphics()
    dividerG.lineStyle(4, C.BONE, 1)
    dividerG.beginPath(); dividerG.moveTo(width / 2 - 380, 450); dividerG.lineTo(width / 2 + 380, 450); dividerG.strokePath()

    // Subtitle — mono
    this.add.text(width / 2, 480, 'A PLAYABLE CV · 5 CHAPTERS · 10 MINUTES', {
      fontFamily: FONT_MONO, fontSize: '16px', fontStyle: 'bold', color: COLORS.BONE,
      letterSpacing: 4,
    }).setOrigin(0.5)

    // Name input label
    this.add.text(width / 2, 540, 'WHO\'S READING? (OPTIONAL)', {
      fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: COLORS.GREY_500,
      letterSpacing: 2,
    }).setOrigin(0.5)

    // Name input
    const urlName = this._readUrlName()
    this._createNameInput(urlName)

    // Start button — big brutalist CTA
    BrutalUI.drawButton(this, width / 2, 660, 240, 64, '▶  OPEN FILES', () => this._start(), {
      fill: C.SHOCK_RED, labelColor: COLORS.BLACK, fontSize: '22px',
      shadowOffset: 8, borderWidth: 4,
    })

    // Keyboard SPACE also works
    this.input.keyboard.once('keydown-SPACE', () => this._start())

    const inputEl = document.getElementById('name-input')
    if (inputEl) {
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); this._start() }
      })
    }

    this.events.once('shutdown', () => {
      this.input.keyboard.removeAllListeners()
      this._removeNameInput()
    }, this)

    // Subtle title breathing
    this.tweens.add({
      targets: [titleGroup, filesGroup], scale: { from: 1, to: 1.015 },
      duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })
  }

  _readUrlName() {
    try { return new URLSearchParams(window.location.search).get('name') ?? '' }
    catch (e) { return '' }
  }

  _createNameInput(prefillValue) {
    this._removeNameInput()
    const input = document.createElement('input')
    input.type = 'text'
    input.id = 'name-input'
    input.maxLength = 20
    input.placeholder = 'TYPE NAME'
    input.value = prefillValue
    input.autocomplete = 'off'

    Object.assign(input.style, {
      position: 'absolute',
      left: '50%',
      top: '80%',
      transform: 'translate(-50%, 0)',
      padding: '10px 16px',
      fontSize: '16px',
      fontFamily: "'Space Mono', monospace",
      fontWeight: '700',
      background: COLORS.BONE,
      color: COLORS.BLACK,
      border: `3px solid ${COLORS.BONE}`,
      borderRadius: '0',
      textAlign: 'center',
      width: '240px',
      outline: 'none',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      zIndex: '10',
      boxShadow: `6px 6px 0 ${COLORS.SHOCK_RED}`,
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

    this.cameras.main.fadeOut(400, 10, 10, 10)
    this.time.delayedCall(420, () => this.scene.start('OpeningCinematicScene'))
  }
}
