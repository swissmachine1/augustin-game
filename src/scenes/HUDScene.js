import * as Phaser from 'phaser'
import { KEYS } from '../systems/GameRegistry.js'

const HEART_FULL  = 0xe74c3c  // red
const HEART_EMPTY = 0x555566  // dark grey

export class HUDScene extends Phaser.Scene {
  constructor() {
    super('HUDScene')
  }

  create() {
    // Transparent camera — game world shows through
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)')

    const health    = this.registry.get(KEYS.HEALTH)
    const healthMax = this.registry.get(KEYS.HEALTH_MAX)
    const coins     = this.registry.get(KEYS.COINS)

    // --- Hearts (top-left) ---
    this._hearts = []
    for (let i = 0; i < healthMax; i++) {
      const heart = this.add.rectangle(24 + i * 36, 24, 28, 28, HEART_FULL)
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(10)
      this._hearts.push(heart)
    }
    this._updateHearts(health, healthMax)

    // --- Coin counter (top-right) ---
    this._coinText = this.add.text(1256, 24, `COINS: ${coins}`, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#f1c40f',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(10)

    // --- Reactive registry listeners ---
    this._onHealthChange = (parent, value) => {
      const max = this.registry.get(KEYS.HEALTH_MAX)
      this._updateHearts(value, max)
    }
    this._onCoinsChange = (parent, value) => {
      this._coinText.setText(`COINS: ${value}`)
    }

    this.registry.events.on(`changedata-${KEYS.HEALTH}`, this._onHealthChange, this)
    this.registry.events.on(`changedata-${KEYS.COINS}`,  this._onCoinsChange,  this)

    // Cleanup listeners on shutdown (ARCH-03 pattern)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.registry.events.off(`changedata-${KEYS.HEALTH}`, this._onHealthChange, this)
      this.registry.events.off(`changedata-${KEYS.COINS}`,  this._onCoinsChange,  this)
    }, this)

    // --- Stats Overlay (TAB key — STAT-04) ---
    const W = 1280
    const H = 720

    // Container groups all overlay objects for easy show/hide
    this._statsOverlay = this.add.container(0, 0).setDepth(20).setVisible(false)

    // Semi-transparent backdrop
    const backdrop = this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a1a, 0.88)
    this._statsOverlay.add(backdrop)

    // Title
    const title = this.add.text(W / 2, 80, 'CAREER STATS', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5)
    this._statsOverlay.add(title)

    // 7 stat rows
    const STAT_LABELS = [
      { key: 'statSales',        label: 'Sales' },
      { key: 'statTech',         label: 'Tech' },
      { key: 'statGrit',         label: 'Grit' },
      { key: 'statEQ',           label: 'EQ' },
      { key: 'statLanguages',    label: 'Languages' },
      { key: 'statIndependence', label: 'Independence' },
      { key: 'statTeamPlayer',   label: 'Team Player' },
    ]

    const BAR_X       = 400   // bar starts here
    const BAR_MAX_W   = 600   // full bar = 100
    const BAR_H       = 28
    const ROW_START_Y = 180
    const ROW_GAP     = 62

    this._statBars = {}  // key → { fill Rectangle, valueText Text }

    STAT_LABELS.forEach(({ key, label }, i) => {
      const rowY = ROW_START_Y + i * ROW_GAP

      // Label
      const labelText = this.add.text(BAR_X - 20, rowY, label, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#aaaacc',
      }).setOrigin(1, 0.5)
      this._statsOverlay.add(labelText)

      // Bar background
      const barBg = this.add.rectangle(BAR_X, rowY, BAR_MAX_W, BAR_H, 0x222244)
        .setOrigin(0, 0.5)
      this._statsOverlay.add(barBg)

      // Bar fill — width set dynamically
      const fill = this.add.rectangle(BAR_X, rowY, 1, BAR_H, 0x3498db)
        .setOrigin(0, 0.5)
      this._statsOverlay.add(fill)

      // Value percentage text (right of bar)
      const valueText = this.add.text(BAR_X + BAR_MAX_W + 12, rowY, '0%', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffffff',
      }).setOrigin(0, 0.5)
      this._statsOverlay.add(valueText)

      this._statBars[key] = { fill, valueText, maxW: BAR_MAX_W }
    })

    // TAB key toggles overlay
    this._tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB)
    this._tabKey.on('down', this._toggleStats, this)

    // Reactive stat listeners — update bars when registry changes
    this._onStatChange = (parent, key, value) => {
      if (this._statBars[key]) this._updateStatBar(key, value)
    }
    this.registry.events.on('changedata', this._onStatChange, this)

    // Update all bars to initial values (in case stats loaded from localStorage)
    Object.keys(this._statBars).forEach(key => {
      const val = this.registry.get(key) ?? 0
      this._updateStatBar(key, val)
    })

    // Cleanup stat overlay listeners on shutdown
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.registry.events.off('changedata', this._onStatChange, this)
    }, this)
  }

  _updateHearts(health, healthMax) {
    this._hearts.forEach((heart, i) => {
      heart.setFillStyle(i < health ? HEART_FULL : HEART_EMPTY)
    })
  }

  _toggleStats() {
    const visible = this._statsOverlay.visible
    this._statsOverlay.setVisible(!visible)
  }

  _updateStatBar(key, value) {
    const bar = this._statBars[key]
    if (!bar) return
    const w = Math.max(1, Math.round((value / 100) * bar.maxW))
    bar.fill.width = w
    bar.valueText.setText(`${value}%`)
  }
}
