import { Scene } from 'phaser'
import { KEYS, saveRegistry } from '../systems/GameRegistry.js'
import { COLORS, C, FONT_DISPLAY, FONT_MONO } from '../config/theme.js'
import { BrutalUI } from './BrutalUI.js'
import { AudioCtx } from './AudioCtx.js'

// Scenes that should NOT respond to ESC pause (already have their own UI/flow)
const NON_PAUSEABLE = new Set([
  'BootScene',
  'TitleScene',
  'OpeningCinematicScene',
  'PauseScene',
])

export class PauseScene extends Scene {
  constructor() {
    super('PauseScene')
  }

  init(data) {
    this._parentKey = data?.parentKey ?? null
  }

  create() {
    const { width, height } = this.cameras.main

    // Black 80% bg
    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.82)
    overlay.fillRect(0, 0, width, height)

    // PAUSED title
    const shadow = this.add.text(width / 2 + 6, height / 2 - 140 + 6, 'PAUSED', {
      fontFamily: FONT_DISPLAY, fontSize: '96px', color: COLORS.SHOCK_RED,
    }).setOrigin(0.5)
    const main = this.add.text(width / 2, height / 2 - 140, 'PAUSED', {
      fontFamily: FONT_DISPLAY, fontSize: '96px', color: COLORS.BONE,
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 - 60, '◆ ESC OR RESUME TO CONTINUE ◆', {
      fontFamily: FONT_MONO, fontSize: '13px', fontStyle: 'bold', color: COLORS.GREY_300,
      letterSpacing: 3,
    }).setOrigin(0.5)

    // Mute toggle
    let muted = this.registry.get(KEYS.MUTED) === true
    AudioCtx.setMuted(muted)
    const muteBtn = BrutalUI.drawButton(
      this, width / 2, height / 2 + 20, 260, 52,
      muted ? '🔇 SOUND: OFF' : '🔊 SOUND: ON',
      () => {
        muted = !muted
        AudioCtx.setMuted(muted)
        this.registry.set(KEYS.MUTED, muted)
        saveRegistry(this)
        muteBtn.text.setText(muted ? '🔇 SOUND: OFF' : '🔊 SOUND: ON')
      },
      { fill: C.GREY_700, labelColor: COLORS.BONE, fontSize: '15px', shadowOffset: 6 },
    )

    // RESUME
    BrutalUI.drawButton(
      this, width / 2, height / 2 + 90, 260, 56, '▶ RESUME',
      () => this._resume(),
      { fill: C.SHOCK_ACID, labelColor: COLORS.BLACK, fontSize: '18px', shadowOffset: 6 },
    )

    // RETURN TO INDEX
    BrutalUI.drawButton(
      this, width / 2, height / 2 + 165, 260, 52, '← RETURN TO INDEX',
      () => this._returnToIndex(),
      { fill: C.BONE, labelColor: COLORS.BLACK, fontSize: '14px', shadowOffset: 6 },
    )

    // ESC resumes
    this.input.keyboard.on('keydown-ESC', () => this._resume())

    this.events.once('shutdown', () => {
      this.input.keyboard.removeAllListeners()
    }, this)
  }

  _resume() {
    if (this._closing) return
    this._closing = true
    const parentKey = this._parentKey
    this.scene.stop('PauseScene')
    if (parentKey) {
      this.scene.resume(parentKey)
    }
  }

  _returnToIndex() {
    if (this._closing) return
    this._closing = true
    const parentKey = this._parentKey
    this.scene.stop('PauseScene')
    if (parentKey) {
      this.scene.stop(parentKey)
    }
    this.scene.start('LevelSelectHub')
  }
}

// Attach a global ESC listener that pauses whichever pauseable scene is active
// and launches PauseScene as a parallel overlay.
export function installPauseHook(game) {
  const handler = (e) => {
    if (e.key !== 'Escape' && e.code !== 'Escape') return

    // Find topmost active, visible scene that isn't blocklisted
    const active = game.scene.getScenes(true) || []
    if (active.some(s => s.scene.key === 'PauseScene')) return // already paused

    const target = active.find(s => !NON_PAUSEABLE.has(s.scene.key))
    if (!target) return

    e.preventDefault()
    target.scene.pause()
    game.scene.run('PauseScene', { parentKey: target.scene.key })
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}
