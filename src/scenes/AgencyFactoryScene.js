import * as Phaser from 'phaser'
import { COLORS, C, TEXT, FONT, FONT_TYPED } from '../config/theme.js'
import { JournalUI } from '../ui/JournalUI.js'
import { KEYS, saveRegistry } from '../systems/GameRegistry.js'
import { completeLevel } from './LevelSelectHub.js'

const PATH_POINTS = [
  { x: -40,  y: 200 },
  { x: 200,  y: 200 },
  { x: 500,  y: 200 },
  { x: 700,  y: 200 },
  { x: 780,  y: 260 },
  { x: 780,  y: 360 },
  { x: 700,  y: 420 },
  { x: 500,  y: 420 },
  { x: 300,  y: 420 },
  { x: 230,  y: 380 },
  { x: 230,  y: 330 },
  { x: 290,  y: 300 },
  { x: 500,  y: 540 },
  { x: 700,  y: 540 },
  { x: 900,  y: 540 },
  { x: 1000, y: 500 },
  { x: 1050, y: 440 },
  { x: 1100, y: 400 },
  { x: 1320, y: 400 },
]

const TOWER_SPOTS = [
  { id: 0,  x: 340,  y: 140 },
  { id: 1,  x: 340,  y: 260 },
  { id: 2,  x: 600,  y: 140 },
  { id: 3,  x: 600,  y: 280 },
  { id: 4,  x: 460,  y: 350 },
  { id: 5,  x: 680,  y: 350 },
  { id: 6,  x: 160,  y: 380 },
  { id: 7,  x: 400,  y: 500 },
  { id: 8,  x: 600,  y: 470 },
  { id: 9,  x: 600,  y: 610 },
  { id: 10, x: 800,  y: 470 },
  { id: 11, x: 800,  y: 610 },
  { id: 12, x: 950,  y: 420 },
  { id: 13, x: 1050, y: 340 },
]

const TOWER_DEFS = {
  googleSheets: { tier: 1, label: 'Sheets',    cost: 15, damage: 8,  fireRate: 1600, range: 100, shortcut: '1' },
  mailchimp:    { tier: 1, label: 'Mailchimp', cost: 20, damage: 10, fireRate: 1200, range: 110, shortcut: '2' },
  linkedIn:     { tier: 1, label: 'LinkedIn',  cost: 25, damage: 14, fireRate: 1400, range: 120, shortcut: '3' },
  hubSpot:      { tier: 1, label: 'HubSpot',   cost: 30, damage: 6,  fireRate: 2000, range: 90,  shortcut: '4', aoe: true },

  apollo:       { tier: 2, label: 'Apollo',    cost: 50, damage: 16, fireRate: 800,  range: 120, shortcut: '5' },
  instantly:    { tier: 2, label: 'Instantly', cost: 65, damage: 22, fireRate: 600,  range: 100, shortcut: '6', burst: 3 },
  lemlist:      { tier: 2, label: 'Lemlist',   cost: 55, damage: 12, fireRate: 1000, range: 110, shortcut: '7', splash: 40, splashDmg: 6 },
  salesNav:     { tier: 2, label: 'Sales Nav', cost: 60, damage: 18, fireRate: 1200, range: 160, shortcut: '8', mark: true },

  clay:         { tier: 3, label: 'Clay',      cost: 100, damage: 45, fireRate: 2500, range: 130, shortcut: '9', enrich: true },
  n8n:          { tier: 3, label: 'n8n',       cost: 90,  damage: 20, fireRate: 1800, range: 140, shortcut: '0', chain: true },
  claudeCode:   { tier: 3, label: 'Claude',    cost: 120, damage: 55, fireRate: 2000, range: 150, shortcut: '-', adaptive: true },
  zapier:       { tier: 3, label: 'Zapier',    cost: 80,  damage: 0,  fireRate: 99999, range: 100, shortcut: '=', aura: true },
}

const ENEMY_DEFS = {
  badLeads:       { hp: 30,  speed: 70, reward: 5 },
  lowReply:       { hp: 45,  speed: 60, reward: 7 },
  spam:           { hp: 55,  speed: 80, reward: 8 },
  missedQuota:    { hp: 70,  speed: 55, reward: 10, armored: true },
  deliverability: { hp: 85,  speed: 50, reward: 12, regen: 3 },
  blacklisted:    { hp: 100, speed: 45, reward: 14, shield: 25 },
  churn:          { hp: 130, speed: 40, reward: 16, spawnOnDeath: 2 },
  boss:           { hp: 600, speed: 35, reward: 50, slowAura: true },
}

const WAVES = [
  { enemies: ['badLeads','badLeads','badLeads','badLeads','badLeads'], interval: 1200 },
  { enemies: ['badLeads','badLeads','badLeads','badLeads','badLeads','lowReply','lowReply'], interval: 1000 },
  { enemies: ['badLeads','badLeads','badLeads','lowReply','lowReply','lowReply','spam','spam'], interval: 900 },
  { enemies: ['badLeads','badLeads','missedQuota','missedQuota','missedQuota','spam','spam','deliverability','deliverability'], interval: 850 },
  { enemies: ['lowReply','lowReply','deliverability','deliverability','deliverability','blacklisted','blacklisted','blacklisted','missedQuota','missedQuota'], interval: 800 },
  { enemies: ['spam','spam','spam','spam','churn','churn','churn','blacklisted','blacklisted','blacklisted'], interval: 750 },
  { enemies: ['deliverability','deliverability','deliverability','churn','churn','blacklisted','blacklisted','boss'], interval: 800 },
  { enemies: ['spam','spam','blacklisted','blacklisted','churn','churn'], interval: 700 },
]

const TIER2_KILLS = 15
const TIER3_KILLS = 40
const START_INK = 60
const START_LIVES = 20
const INTER_WAVE_DELAY = 3500

export class AgencyFactoryScene extends Phaser.Scene {
  constructor() {
    super('AgencyFactoryScene')
  }

  create() {
    const { width, height } = this.cameras.main
    this.cameras.main.fadeIn(400, 244, 232, 208)

    // State
    this._ink = START_INK
    this._lives = START_LIVES
    this._totalKills = 0
    this._currentWaveIdx = 0
    this._wavesCleared = 0
    this._enemies = []
    this._projectiles = []
    this._placedTowers = []
    this._towersPlaced = 0
    this._occupied = new Set()
    this._tier2Unlocked = false
    this._tier3Unlocked = false
    this._killedTypes = new Set()
    this._bossKilled = false
    this._gameActive = false
    this._gameComplete = false
    this._waveActive = false
    this._waveSpawnIndex = 0
    this._placingKey = null
    this._ghostTower = null
    this._ghostRange = null
    this._selectedTower = null
    this._selectionRing = null
    this._sellBtn = null
    this._gameStartTime = 0
    this._towerButtons = {}
    this._nextWaveTimer = null
    this._spawnTimer = null
    this._interestTimer = null
    this._usedToolNames = new Set()
    this._iconTexts = []

    // Background
    JournalUI.drawParchment(this, 0, 0, width, height, { ruled: false, margin: false })

    this._drawPath()
    this._drawTowerSpots()
    this._drawHeader()
    this._drawTowerPanel()

    // Intro text
    this._introText = this.add.text(640, 340,
      'BUILDING THE GROWTH ENGINE\nFrom spreadsheets to AI.\nPlace your tools. Defend the pipeline.', {
        fontFamily: FONT_TYPED,
        fontSize: '16px',
        color: COLORS.INK,
        fontStyle: 'italic',
        align: 'center',
        lineSpacing: 8,
      }).setOrigin(0.5).setAlpha(0)

    this.tweens.add({ targets: this._introText, alpha: 1, duration: 400, delay: 200 })
    this.tweens.add({ targets: this._introText, alpha: 0.0, duration: 400, delay: 2400,
      onComplete: () => { if (this._introText) this._introText.destroy() } })

    // Input
    this._setupInput()

    // Start first wave
    this.time.delayedCall(3000, () => {
      this._gameActive = true
      this._gameStartTime = this.time.now
      this._startWave(0)

      this._interestTimer = this.time.addEvent({
        delay: 3000, loop: true,
        callback: () => {
          if (!this._gameActive) return
          this._ink += 1
          this._updateHUD()
        },
      })
    })

    JournalUI.drawPageNumber(this, 8)

    this.events.once('shutdown', () => this._cleanup(), this)
  }

  // ─── PATH & SPOTS ───────────────────────────────────────────────
  _drawPath() {
    const g = this.add.graphics()
    g.lineStyle(26, C.PARCHMENT_DARK, 0.55)
    g.beginPath()
    g.moveTo(PATH_POINTS[0].x, PATH_POINTS[0].y)
    for (let i = 1; i < PATH_POINTS.length; i++) {
      g.lineTo(PATH_POINTS[i].x, PATH_POINTS[i].y)
    }
    g.strokePath()

    g.lineStyle(1, C.INK, 0.2)
    g.beginPath()
    g.moveTo(PATH_POINTS[0].x, PATH_POINTS[0].y)
    for (let i = 1; i < PATH_POINTS.length; i++) {
      g.lineTo(PATH_POINTS[i].x, PATH_POINTS[i].y)
    }
    g.strokePath()

    this.add.text(20, 186, 'START', {
      fontFamily: FONT_TYPED, fontSize: '9px', color: COLORS.INK_LIGHT,
    }).setOrigin(0, 0.5)
    this.add.text(1230, 390, 'EXIT', {
      fontFamily: FONT_TYPED, fontSize: '9px', color: COLORS.WAX_RED,
    }).setOrigin(1, 0.5)
  }

  _drawTowerSpots() {
    TOWER_SPOTS.forEach(spot => {
      const g = this.add.graphics()
      g.lineStyle(1, C.INK_FADED, 0.35)
      for (let a = 0; a < Math.PI * 2; a += 0.4) {
        g.beginPath()
        g.arc(spot.x, spot.y, 18, a, a + 0.2)
        g.strokePath()
      }
      g.lineStyle(0.5, C.INK_FADED, 0.25)
      g.beginPath()
      g.moveTo(spot.x - 5, spot.y); g.lineTo(spot.x + 5, spot.y)
      g.moveTo(spot.x, spot.y - 5); g.lineTo(spot.x, spot.y + 5)
      g.strokePath()
    })
  }

  // ─── HEADER ─────────────────────────────────────────────────────
  _drawHeader() {
    this.add.rectangle(640, 20, 1280, 40, C.PARCHMENT_DARK, 0.35)
    const line = this.add.graphics()
    line.lineStyle(0.5, C.INK, 0.3)
    line.beginPath(); line.moveTo(0, 40); line.lineTo(1280, 40); line.strokePath()

    this.add.text(20, 4, 'Chapter 4', {
      fontFamily: FONT_TYPED, fontSize: '9px', color: COLORS.INK_LIGHT,
    })
    this.add.text(20, 18, 'AGENCY FACTORY', {
      fontFamily: FONT_TYPED, fontSize: '13px', color: COLORS.INK_BLACK, fontStyle: 'bold',
    })

    this._waveText = this.add.text(480, 20, 'Wave 1 / 8', {
      fontFamily: FONT_TYPED, fontSize: '12px', color: COLORS.INK,
    }).setOrigin(0.5)

    this._killText = this.add.text(640, 20, 'Kills: 0', {
      fontFamily: FONT_TYPED, fontSize: '12px', color: COLORS.INK,
    }).setOrigin(0.5)

    this._livesText = this.add.text(820, 20, `Lives: ${START_LIVES}`, {
      fontFamily: FONT_TYPED, fontSize: '12px', color: COLORS.WAX_RED,
    }).setOrigin(0.5)

    this._inkText = this.add.text(1020, 20, `Ink: ${START_INK}`, {
      fontFamily: FONT_TYPED, fontSize: '13px', color: COLORS.STAMP_GREEN, fontStyle: 'bold',
    }).setOrigin(0.5)

    this._messageText = this.add.text(1180, 20, '', {
      fontFamily: FONT_TYPED, fontSize: '10px', color: COLORS.INK_FADED,
    }).setOrigin(0.5)
  }

  _updateHUD() {
    if (!this._waveText) return
    const waveNum = Math.min(this._currentWaveIdx + 1, WAVES.length)
    this._waveText.setText(`Wave ${waveNum} / ${WAVES.length}`)
    this._killText.setText(`Kills: ${this._totalKills}`)
    this._livesText.setText(`Lives: ${this._lives}`)
    this._inkText.setText(`Ink: ${this._ink}`)
  }

  _setMessage(text, duration = 1800) {
    this._messageText.setText(text)
    if (this._msgTimer) this._msgTimer.remove()
    if (duration > 0) {
      this._msgTimer = this.time.delayedCall(duration, () => {
        if (this._messageText) this._messageText.setText('')
      })
    }
  }

  // ─── TOWER PANEL ────────────────────────────────────────────────
  _drawTowerPanel() {
    this.add.rectangle(640, 670, 1260, 90, C.PARCHMENT_DARK, 0.4)
    const frame = this.add.graphics()
    frame.lineStyle(0.5, C.INK, 0.3)
    frame.strokeRect(10, 625, 1260, 90)

    this.add.text(70, 628, 'BASIC', {
      fontFamily: FONT_TYPED, fontSize: '8px', color: COLORS.INK_LIGHT,
    })
    this.add.text(470, 628, 'INTERMEDIATE', {
      fontFamily: FONT_TYPED, fontSize: '8px', color: COLORS.INK_LIGHT,
    })
    this.add.text(870, 628, 'ADVANCED', {
      fontFamily: FONT_TYPED, fontSize: '8px', color: COLORS.INK_LIGHT,
    })

    const tier1 = ['googleSheets', 'mailchimp', 'linkedIn', 'hubSpot']
    const tier2 = ['apollo', 'instantly', 'lemlist', 'salesNav']
    const tier3 = ['clay', 'n8n', 'claudeCode', 'zapier']

    tier1.forEach((k, i) => this._drawTowerButton(k, 70 + i * 100, 670, true))
    tier2.forEach((k, i) => this._drawTowerButton(k, 470 + i * 100, 670, false))
    tier3.forEach((k, i) => this._drawTowerButton(k, 870 + i * 100, 670, false))
  }

  _drawTowerButton(key, x, y, unlocked) {
    const def = TOWER_DEFS[key]
    const w = 86, h = 70

    const bg = this.add.rectangle(x, y, w, h, C.PARCHMENT, unlocked ? 0.6 : 0.2)
    bg.setStrokeStyle(0.5, C.INK, unlocked ? 0.4 : 0.15)

    const iconG = this.add.graphics()
    this._drawTowerIcon(iconG, key, x, y - 14)
    if (!unlocked) iconG.setAlpha(0.25)

    const labelT = this.add.text(x, y + 10, def.label, {
      fontFamily: FONT_TYPED, fontSize: '9px',
      color: unlocked ? COLORS.INK : COLORS.INK_FADED,
    }).setOrigin(0.5)

    const costT = this.add.text(x, y + 22, `${def.cost} ink`, {
      fontFamily: FONT_TYPED, fontSize: '9px',
      color: unlocked ? COLORS.STAMP_GREEN : COLORS.INK_FADED,
    }).setOrigin(0.5)

    this.add.text(x + w / 2 - 5, y - h / 2 + 4, def.shortcut, {
      fontFamily: FONT_TYPED, fontSize: '8px', color: COLORS.INK_FADED,
    }).setOrigin(1, 0)

    let lockT = null
    if (!unlocked) {
      lockT = this.add.text(x, y - 14, '[LOCKED]', {
        fontFamily: FONT_TYPED, fontSize: '8px', color: COLORS.INK_FADED,
      }).setOrigin(0.5)
    }

    bg.setInteractive({ useHandCursor: true })
    bg.on('pointerdown', () => {
      if (this._towerButtons[key].unlocked) this._startPlacing(key)
    })
    bg.on('pointerover', () => {
      if (this._towerButtons[key].unlocked) bg.setFillStyle(C.PARCHMENT_DARK, 0.7)
    })
    bg.on('pointerout', () => {
      if (this._towerButtons[key].unlocked) bg.setFillStyle(C.PARCHMENT, 0.6)
    })

    this._towerButtons[key] = { bg, iconG, labelT, costT, lockT, unlocked, def }
  }

  _unlockTier(tier) {
    Object.keys(TOWER_DEFS).forEach(key => {
      const btn = this._towerButtons[key]
      if (!btn) return
      if (TOWER_DEFS[key].tier === tier) {
        btn.unlocked = true
        btn.iconG.setAlpha(1)
        btn.bg.setFillStyle(C.PARCHMENT, 0.6)
        btn.bg.setStrokeStyle(0.5, C.INK, 0.4)
        btn.labelT.setColor(COLORS.INK)
        btn.costT.setColor(COLORS.STAMP_GREEN)
        if (btn.lockT) { btn.lockT.destroy(); btn.lockT = null }
        this.tweens.add({
          targets: btn.bg, alpha: { from: 0.2, to: 1 },
          duration: 300, yoyo: true, repeat: 2,
        })
      }
    })
    this._showUnlockBanner(tier)
  }

  _showUnlockBanner(tier) {
    const names = { 2: 'INTERMEDIATE TOOLS', 3: 'ADVANCED TOOLS' }
    const color = tier === 2 ? COLORS.STAMP_GREEN : COLORS.WAX_RED
    const cHex = tier === 2 ? C.STAMP_GREEN : C.WAX_RED

    const banner = this.add.rectangle(1400, 70, 320, 36, cHex, 0.2)
    banner.setStrokeStyle(1, cHex, 0.6)
    const t = this.add.text(1400, 70, `TIER ${tier} UNLOCKED — ${names[tier]}`, {
      fontFamily: FONT_TYPED, fontSize: '11px', color, fontStyle: 'bold',
    }).setOrigin(0.5)

    this.tweens.add({
      targets: [banner, t], x: '-=280',
      duration: 450, ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(2200, () => {
          this.tweens.add({
            targets: [banner, t], alpha: 0, duration: 400,
            onComplete: () => { banner.destroy(); t.destroy() },
          })
        })
      },
    })
  }

  // ─── TOWER ICONS ────────────────────────────────────────────────
  _drawTowerIcon(g, key, x, y) {
    switch (key) {
      case 'googleSheets':
        g.lineStyle(1.3, C.STAMP_GREEN, 0.9)
        for (let i = 0; i < 4; i++) {
          g.beginPath()
          g.moveTo(x - 9 + i * 6, y - 9); g.lineTo(x - 9 + i * 6, y + 9); g.strokePath()
          g.beginPath()
          g.moveTo(x - 9, y - 9 + i * 6); g.lineTo(x + 9, y - 9 + i * 6); g.strokePath()
        }
        break
      case 'mailchimp':
        g.lineStyle(1.3, C.INK, 0.8)
        g.strokeRect(x - 10, y - 6, 20, 12)
        g.beginPath()
        g.moveTo(x - 10, y - 6); g.lineTo(x, y + 2); g.lineTo(x + 10, y - 6); g.strokePath()
        break
      case 'linkedIn':
        g.lineStyle(1.3, C.STAMP_BLUE, 0.9)
        g.strokeRoundedRect(x - 11, y - 10, 22, 20, 3)
        break
      case 'hubSpot':
        g.lineStyle(1.3, C.RED_MARGIN, 0.8)
        g.strokeCircle(x, y, 7)
        for (let a = 0; a < 6; a++) {
          const ang = (a / 6) * Math.PI * 2
          const tx = x + Math.cos(ang) * 10
          const ty = y + Math.sin(ang) * 10
          g.fillStyle(C.RED_MARGIN, 0.65)
          g.fillRect(tx - 2, ty - 2, 3, 3)
        }
        break
      case 'apollo':
        g.lineStyle(1.3, C.INK, 0.85)
        g.beginPath()
        g.moveTo(x, y - 11); g.lineTo(x + 5, y - 3); g.lineTo(x + 5, y + 5)
        g.lineTo(x - 5, y + 5); g.lineTo(x - 5, y - 3); g.closePath(); g.strokePath()
        g.fillStyle(C.RED_MARGIN, 0.5)
        g.fillTriangle(x - 3, y + 5, x + 3, y + 5, x, y + 11)
        break
      case 'instantly':
        g.lineStyle(2, C.WAX_RED, 0.85)
        g.beginPath()
        g.moveTo(x + 2, y - 11); g.lineTo(x - 4, y); g.lineTo(x + 2, y); g.lineTo(x - 3, y + 11)
        g.strokePath()
        break
      case 'lemlist':
        g.lineStyle(1.3, C.STAMP_GREEN, 0.85)
        g.beginPath()
        g.moveTo(x - 8, y + 8); g.lineTo(x + 6, y - 6); g.lineTo(x + 9, y - 3)
        g.lineTo(x - 5, y + 11); g.closePath(); g.strokePath()
        break
      case 'salesNav':
        g.lineStyle(1.3, C.STAMP_BLUE, 0.8)
        g.strokeCircle(x, y, 9); g.strokeCircle(x, y, 3)
        g.beginPath()
        g.moveTo(x, y - 12); g.lineTo(x, y - 5)
        g.moveTo(x, y + 5); g.lineTo(x, y + 12)
        g.moveTo(x - 12, y); g.lineTo(x - 5, y)
        g.moveTo(x + 5, y); g.lineTo(x + 12, y)
        g.strokePath()
        break
      case 'clay':
        g.lineStyle(1.5, C.INK, 0.9)
        g.beginPath()
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2 - Math.PI / 6
          const px = x + Math.cos(ang) * 11
          const py = y + Math.sin(ang) * 11
          if (i === 0) g.moveTo(px, py); else g.lineTo(px, py)
        }
        g.closePath(); g.strokePath()
        break
      case 'n8n':
        g.lineStyle(1, C.INK, 0.6)
        g.beginPath()
        g.moveTo(x - 8, y - 8); g.lineTo(x + 8, y)
        g.moveTo(x + 8, y); g.lineTo(x - 8, y + 8); g.strokePath()
        g.fillStyle(C.INK, 0.85)
        g.fillCircle(x - 8, y - 8, 3.5); g.fillCircle(x - 8, y + 8, 3.5)
        g.fillStyle(C.RED_MARGIN, 0.7); g.fillCircle(x + 8, y, 3.5)
        break
      case 'claudeCode':
        g.lineStyle(1.8, C.INK, 0.9)
        g.beginPath()
        g.moveTo(x - 9, y - 7); g.lineTo(x - 2, y); g.lineTo(x - 9, y + 7); g.strokePath()
        g.beginPath(); g.moveTo(x + 2, y + 7); g.lineTo(x + 9, y + 7); g.strokePath()
        g.fillStyle(C.WAX_RED, 0.85); g.fillCircle(x + 7, y - 5, 2)
        break
      case 'zapier':
        g.lineStyle(1.3, C.RED_MARGIN, 0.75)
        g.strokeCircle(x - 4, y, 7); g.strokeCircle(x + 4, y, 7)
        break
    }
  }

  // ─── ENEMY DRAWING ──────────────────────────────────────────────
  _drawEnemyVisual(type, container) {
    const g = this.add.graphics()
    switch (type) {
      case 'badLeads':
        g.fillStyle(C.INK, 0.85); this._fillBlob(g, 8, 8); break
      case 'lowReply':
        g.fillStyle(C.INK, 0.8); this._fillBlob(g, 10, 8)
        g.lineStyle(1, C.WAX_RED, 0.6)
        g.beginPath(); g.moveTo(-4, 2); g.lineTo(4, 2); g.strokePath()
        break
      case 'spam':
        g.fillStyle(C.WAX_RED, 0.75)
        g.beginPath()
        for (let i = 0; i <= 10; i++) {
          const a = (i / 10) * Math.PI * 2
          const r = (i % 2 === 0) ? 11 : 6
          const px = Math.cos(a) * r, py = Math.sin(a) * r
          if (i === 0) g.moveTo(px, py); else g.lineTo(px, py)
        }
        g.closePath(); g.fillPath()
        break
      case 'missedQuota':
        g.fillStyle(C.INK, 0.85)
        g.fillRect(-8, -4, 6, 8)
        g.fillRect(-1, -8, 6, 12)
        g.fillRect(6, -2, 4, 6)
        break
      case 'deliverability':
        g.fillStyle(C.INK_LIGHT, 0.7); this._fillBlob(g, 11, 10)
        container._pulse = true
        break
      case 'blacklisted':
        g.fillStyle(C.INK_BLACK, 0.85); this._fillBlob(g, 12, 10)
        g.lineStyle(1.2, C.WAX_RED, 0.8)
        g.strokeCircle(0, 0, 7)
        g.beginPath(); g.moveTo(-5, 5); g.lineTo(5, -5); g.strokePath()
        break
      case 'churn':
        g.fillStyle(C.INK, 0.85); this._fillBlob(g, 14, 10)
        g.fillStyle(C.INK, 0.6)
        g.fillCircle(-10, 10, 3); g.fillCircle(12, -8, 2.5)
        break
      case 'boss':
        g.fillStyle(C.INK_BLACK, 0.9); this._fillBlob(g, 22, 14)
        g.lineStyle(2.5, C.WAX_RED, 0.9)
        g.beginPath()
        g.moveTo(-12, -12); g.lineTo(12, 12)
        g.moveTo(12, -12); g.lineTo(-12, 12)
        g.strokePath()
        break
    }
    container.add(g)
  }

  _fillBlob(g, rBase, points) {
    g.beginPath()
    for (let i = 0; i <= points; i++) {
      const a = (i / points) * Math.PI * 2
      const r = rBase * (0.75 + ((i * 37) % 100) / 300)
      const px = Math.cos(a) * r, py = Math.sin(a) * r
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py)
    }
    g.closePath(); g.fillPath()
  }

  // ─── INPUT ──────────────────────────────────────────────────────
  _setupInput() {
    const shortcutMap = {
      ONE: 'googleSheets', TWO: 'mailchimp', THREE: 'linkedIn', FOUR: 'hubSpot',
      FIVE: 'apollo', SIX: 'instantly', SEVEN: 'lemlist', EIGHT: 'salesNav',
      NINE: 'clay', ZERO: 'n8n', MINUS: 'claudeCode', PLUS: 'zapier',
    }
    Object.entries(shortcutMap).forEach(([k, key]) => {
      this.input.keyboard.on(`keydown-${k}`, () => {
        if (this._towerButtons[key] && this._towerButtons[key].unlocked) {
          this._startPlacing(key)
        }
      })
    })

    this.input.keyboard.on('keydown-ESC', () => {
      this._cancelPlacing()
      this._deselectTower()
    })

    this.input.keyboard.on('keydown-SPACE', () => {
      if (this._gameActive && !this._waveActive && this._currentWaveIdx + 1 < WAVES.length) {
        if (this._nextWaveTimer) {
          this._nextWaveTimer.remove()
          this._nextWaveTimer = null
        }
        this._startWave(this._currentWaveIdx + 1)
      }
    })

    this.input.keyboard.on('keydown-S', () => {
      if (this._selectedTower) this._sellTower(this._selectedTower)
    })

    this.input.on('pointermove', (p) => {
      if (this._placingKey && this._ghostTower) {
        const nearest = this._findNearestEmptySpot(p.x, p.y, 40)
        const tx = nearest ? nearest.x : p.x
        const ty = nearest ? nearest.y : p.y
        this._ghostTower.setPosition(tx, ty)
        this._ghostTower.setAlpha(nearest ? 0.85 : 0.35)
        if (this._ghostRange) this._ghostRange.setPosition(tx, ty)
      }
    })

    this.input.on('pointerdown', (p) => {
      if (p.rightButtonDown && p.rightButtonDown()) {
        this._cancelPlacing()
        return
      }
      if (p.y > 625) return  // panel clicks handled by buttons
      if (this._placingKey) {
        const nearest = this._findNearestEmptySpot(p.x, p.y, 40)
        if (nearest) this._placeTower(this._placingKey, nearest)
        else this._cancelPlacing()
        return
      }
      const clicked = this._findTowerAt(p.x, p.y, 22)
      if (clicked) this._selectTower(clicked)
      else this._deselectTower()
    })

    if (this.input.mouse && this.input.mouse.disableContextMenu) {
      this.input.mouse.disableContextMenu()
    }
  }

  _findNearestEmptySpot(x, y, maxDist) {
    let best = null, bestD = maxDist
    TOWER_SPOTS.forEach(spot => {
      if (this._occupied.has(spot.id)) return
      const d = Phaser.Math.Distance.Between(x, y, spot.x, spot.y)
      if (d < bestD) { best = spot; bestD = d }
    })
    return best
  }

  _findTowerAt(x, y, r) {
    for (const t of this._placedTowers) {
      if (Phaser.Math.Distance.Between(x, y, t.x, t.y) < r) return t
    }
    return null
  }

  // ─── PLACEMENT ──────────────────────────────────────────────────
  _startPlacing(key) {
    const def = TOWER_DEFS[key]
    if (this._ink < def.cost) {
      this._setMessage(`Need ${def.cost} ink`, 1200)
      return
    }
    this._cancelPlacing()
    this._deselectTower()
    this._placingKey = key
    this._ghostTower = this.add.graphics()
    this._drawTowerIcon(this._ghostTower, key, 0, 0)
    this._ghostTower.setAlpha(0.5)
    this._ghostTower.setPosition(this.input.x, this.input.y)
    this._ghostRange = this.add.circle(this.input.x, this.input.y, def.range, C.STAMP_GREEN, 0.08)
    this._ghostRange.setStrokeStyle(1, C.STAMP_GREEN, 0.5)
  }

  _cancelPlacing() {
    this._placingKey = null
    if (this._ghostTower) { this._ghostTower.destroy(); this._ghostTower = null }
    if (this._ghostRange) { this._ghostRange.destroy(); this._ghostRange = null }
  }

  _placeTower(key, spot) {
    const def = TOWER_DEFS[key]
    if (this._ink < def.cost) { this._cancelPlacing(); return }
    this._ink -= def.cost

    const g = this.add.graphics()
    this._drawTowerIcon(g, key, spot.x, spot.y)

    const label = this.add.text(spot.x, spot.y + 18, def.label, {
      fontFamily: FONT_TYPED, fontSize: '8px', color: COLORS.INK,
    }).setOrigin(0.5)

    const tower = {
      key, def,
      tier: def.tier,
      x: spot.x, y: spot.y,
      spotId: spot.id,
      cost: def.cost,
      damage: def.damage,
      fireRate: def.fireRate,
      range: def.range,
      lastFired: 0,
      killCount: 0,
      graphics: g,
      label,
    }

    this._placedTowers.push(tower)
    this._occupied.add(spot.id)
    this._towersPlaced++
    this._usedToolNames.add(def.label)
    this._updateHUD()
    this._cancelPlacing()
  }

  _selectTower(tower) {
    this._deselectTower()
    this._selectedTower = tower
    this._selectionRing = this.add.circle(tower.x, tower.y, tower.range, C.STAMP_GREEN, 0.1)
    this._selectionRing.setStrokeStyle(1, C.STAMP_GREEN, 0.6)

    const sellValue = Math.floor(tower.cost * 0.6)
    this._sellBtn = this.add.container(tower.x, tower.y - 34)
    const bg = this.add.rectangle(0, 0, 76, 20, C.WAX_RED, 0.85)
    bg.setStrokeStyle(0.5, C.INK, 0.5)
    const t = this.add.text(0, 0, `SELL ${sellValue}`, {
      fontFamily: FONT_TYPED, fontSize: '9px', color: '#fbf5e6', fontStyle: 'bold',
    }).setOrigin(0.5)
    this._sellBtn.add([bg, t])
    bg.setInteractive({ useHandCursor: true })
    bg.on('pointerdown', (pointer, lx, ly, ev) => {
      if (ev && ev.stopPropagation) ev.stopPropagation()
      this._sellTower(tower)
    })
  }

  _deselectTower() {
    this._selectedTower = null
    if (this._selectionRing) { this._selectionRing.destroy(); this._selectionRing = null }
    if (this._sellBtn) { this._sellBtn.destroy(); this._sellBtn = null }
  }

  _sellTower(tower) {
    const refund = Math.floor(tower.cost * 0.6)
    this._ink += refund
    this._occupied.delete(tower.spotId)
    tower.graphics.destroy()
    tower.label.destroy()
    this._placedTowers = this._placedTowers.filter(t => t !== tower)
    this._deselectTower()
    this._updateHUD()
    this._setMessage(`+${refund} ink (sold)`, 900)
  }

  // ─── WAVES ──────────────────────────────────────────────────────
  _startWave(idx) {
    if (idx >= WAVES.length) return
    this._currentWaveIdx = idx
    this._waveActive = true
    this._waveSpawnIndex = 0
    const wave = WAVES[idx]
    this._updateHUD()
    this._setMessage(`Wave ${idx + 1} incoming`, 1400)

    if (this._spawnTimer) this._spawnTimer.remove()
    this._spawnTimer = this.time.addEvent({
      delay: wave.interval, loop: true,
      callback: () => this._spawnNext(),
    })
    this._spawnNext()
  }

  _spawnNext() {
    const wave = WAVES[this._currentWaveIdx]
    if (!wave) return
    if (this._waveSpawnIndex >= wave.enemies.length) {
      if (this._spawnTimer) { this._spawnTimer.remove(); this._spawnTimer = null }
      return
    }
    const type = wave.enemies[this._waveSpawnIndex]
    this._spawnEnemy(type)
    this._waveSpawnIndex++
  }

  _spawnEnemy(type, atIndex = 0) {
    const def = ENEMY_DEFS[type]
    if (!def) return
    const container = this.add.container(PATH_POINTS[atIndex].x, PATH_POINTS[atIndex].y)
    this._drawEnemyVisual(type, container)

    const hpBg = this.add.rectangle(0, -18, 22, 3, 0x3a1e0a, 0.3)
    const hpFill = this.add.rectangle(-11, -18, 22, 3, C.WAX_RED, 0.8)
    hpFill.setOrigin(0, 0.5)
    container.add([hpBg, hpFill])

    const enemy = {
      type, def, container,
      hp: def.hp, maxHp: def.hp,
      speed: def.speed,
      pathIndex: atIndex,
      x: PATH_POINTS[atIndex].x, y: PATH_POINTS[atIndex].y,
      reward: def.reward,
      armored: !!def.armored,
      regen: def.regen || 0,
      shield: def.shield || 0,
      spawnOnDeath: def.spawnOnDeath || 0,
      slowAura: !!def.slowAura,
      isBoss: type === 'boss',
      hpFill,
      marked: 0,
      enrichStacks: 0,
      alive: true,
      lastDamagedAt: 0,
    }
    this._enemies.push(enemy)
  }

  // ─── UPDATE LOOP ────────────────────────────────────────────────
  update(time, delta) {
    if (!this._gameActive) return
    const dt = Math.min(0.05, delta / 1000)

    this._updateEnemies(dt, time)
    this._updateTowers(time)
    this._updateProjectiles(dt)
    this._checkWaveComplete()
  }

  _updateEnemies(dt, time) {
    for (let i = this._enemies.length - 1; i >= 0; i--) {
      const e = this._enemies[i]
      if (!e.alive) continue

      if (e.regen > 0 && (time - e.lastDamagedAt) > 1200 && e.hp < e.maxHp) {
        e.hp = Math.min(e.maxHp, e.hp + e.regen * dt)
        this._updateEnemyHpBar(e)
      }

      if (e.marked > 0) e.marked -= dt

      if (e.container._pulse) {
        e.container.alpha = 0.65 + Math.sin(time / 200) * 0.2
      }

      const target = PATH_POINTS[e.pathIndex + 1]
      if (!target) {
        this._enemyReachedEnd(e)
        this._enemies.splice(i, 1)
        continue
      }
      const dx = target.x - e.x
      const dy = target.y - e.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const move = e.speed * dt
      if (dist === 0 || move >= dist) {
        e.x = target.x; e.y = target.y
        e.pathIndex++
      } else {
        e.x += (dx / dist) * move
        e.y += (dy / dist) * move
      }
      e.container.setPosition(e.x, e.y)
    }
  }

  _updateEnemyHpBar(e) {
    if (!e.hpFill) return
    const pct = Math.max(0, e.hp / e.maxHp)
    e.hpFill.width = 22 * pct
  }

  _enemyReachedEnd(e) {
    this._lives = Math.max(0, this._lives - 1)
    e.container.destroy()
    this._updateHUD()
    if (this._lives <= 0 && !this._gameComplete) {
      this._onLoss()
    }
  }

  _updateTowers(time) {
    const zapierBuffs = new Map()
    this._placedTowers.forEach(t => {
      if (t.def.aura) {
        this._placedTowers.forEach(other => {
          if (other === t) return
          const d = Phaser.Math.Distance.Between(t.x, t.y, other.x, other.y)
          if (d <= t.range) {
            const cur = zapierBuffs.get(other) || { fireMul: 1, rangeMul: 1 }
            cur.fireMul *= 0.7
            cur.rangeMul *= 1.1
            zapierBuffs.set(other, cur)
          }
        })
      }
    })

    let bossSlow = null
    for (const e of this._enemies) {
      if (e.slowAura && e.alive) { bossSlow = e; break }
    }

    this._placedTowers.forEach(t => {
      if (t.def.aura) return

      const buff = zapierBuffs.get(t) || { fireMul: 1, rangeMul: 1 }
      let effFireRate = t.fireRate * buff.fireMul
      let effRange = t.range * buff.rangeMul

      if (bossSlow) {
        const d = Phaser.Math.Distance.Between(t.x, t.y, bossSlow.x, bossSlow.y)
        if (d < 80) effFireRate *= 1.3
      }

      if (time - t.lastFired < effFireRate) return

      const target = this._findTarget(t, effRange)
      if (!target) return

      t.lastFired = time
      this._fireTower(t, target, effRange)
    })
  }

  _findTarget(tower, range) {
    let best = null
    let bestScore = -Infinity
    this._enemies.forEach(e => {
      if (!e.alive) return
      const d = Phaser.Math.Distance.Between(tower.x, tower.y, e.x, e.y)
      if (d > range) return
      let score = e.pathIndex * 10000 + (e.x + e.y)
      if (tower.def.adaptive || tower.key === 'linkedIn') {
        score = e.hp
      }
      if (score > bestScore) { bestScore = score; best = e }
    })
    return best
  }

  _fireTower(tower, target, effRange) {
    const def = tower.def
    if (def.aoe) {
      this._fireHubSpotVisual(tower, effRange)
      this._enemies.forEach(e => {
        if (!e.alive) return
        const d = Phaser.Math.Distance.Between(tower.x, tower.y, e.x, e.y)
        if (d <= effRange) this._damageEnemy(e, tower.damage, tower)
      })
      return
    }
    if (def.burst) {
      for (let i = 0; i < def.burst; i++) {
        this.time.delayedCall(i * 100, () => {
          if (!target || !target.alive) return
          this._spawnProjectile(tower, target, tower.damage)
        })
      }
      return
    }
    if (def.mark) {
      target.marked = 3
    }
    this._spawnProjectile(tower, target, tower.damage)
  }

  _spawnProjectile(tower, target, damage) {
    const def = tower.def
    let visual
    let speed = 400
    switch (tower.key) {
      case 'googleSheets':
        visual = this.add.rectangle(tower.x, tower.y, 5, 5, C.STAMP_GREEN, 0.85); speed = 320; break
      case 'mailchimp':
        visual = this.add.rectangle(tower.x, tower.y, 7, 5, C.INK, 0.8); speed = 360; break
      case 'linkedIn':
        visual = this.add.circle(tower.x, tower.y, 3.5, C.STAMP_BLUE, 0.9); speed = 340; break
      case 'apollo':
        visual = this.add.triangle(tower.x, tower.y, 0, -6, -4, 4, 4, 4, C.RED_MARGIN); speed = 470; break
      case 'instantly':
        visual = this.add.rectangle(tower.x, tower.y, 3, 8, C.WAX_RED, 0.9); speed = 560; break
      case 'lemlist':
        visual = this.add.circle(tower.x, tower.y, 3.5, C.STAMP_GREEN, 0.75); speed = 360; break
      case 'salesNav':
        this._fireBeam(tower, target)
        this._damageEnemy(target, damage, tower)
        return
      case 'clay':
        visual = this.add.circle(tower.x, tower.y, 4, C.GOLD_LEAF, 0.9); speed = 380; break
      case 'n8n':
        visual = this.add.circle(tower.x, tower.y, 3, C.RED_MARGIN, 0.9); speed = 420; break
      case 'claudeCode':
        visual = this.add.star(tower.x, tower.y, 4, 3, 6, C.WAX_RED); speed = 460; break
      default:
        visual = this.add.circle(tower.x, tower.y, 3, C.INK, 0.8); break
    }

    const proj = {
      visual, target, damage, speed,
      tower, alive: true, onHit: null,
    }

    if (def.splash) {
      proj.onHit = () => this._applySplash(target, def.splashDmg, def.splash, tower)
    }
    if (def.chain) {
      proj.onHit = () => this._applyChain(target, damage, tower)
    }

    this._projectiles.push(proj)
  }

  _fireBeam(tower, target) {
    const line = this.add.line(0, 0, tower.x, tower.y, target.x, target.y, C.STAMP_BLUE, 0.6)
    line.setOrigin(0, 0)
    line.setLineWidth(1.5)
    this.tweens.add({
      targets: line, alpha: 0, duration: 250,
      onComplete: () => line.destroy(),
    })
  }

  _fireHubSpotVisual(tower, effRange) {
    const ring = this.add.circle(tower.x, tower.y, 6, 0, 0)
    ring.setStrokeStyle(1.5, C.RED_MARGIN, 0.7)
    this.tweens.add({
      targets: ring,
      scale: effRange / 6,
      alpha: 0,
      duration: 450,
      onComplete: () => ring.destroy(),
    })
  }

  _updateProjectiles(dt) {
    for (let i = this._projectiles.length - 1; i >= 0; i--) {
      const p = this._projectiles[i]
      if (!p.target || !p.target.alive) {
        if (p.visual) p.visual.destroy()
        this._projectiles.splice(i, 1)
        continue
      }
      const dx = p.target.x - p.visual.x
      const dy = p.target.y - p.visual.y
      const d = Math.sqrt(dx * dx + dy * dy)
      const move = p.speed * dt
      if (d === 0 || move >= d) {
        this._damageEnemy(p.target, p.damage, p.tower)
        if (p.onHit) p.onHit()
        p.visual.destroy()
        this._projectiles.splice(i, 1)
      } else {
        p.visual.x += (dx / d) * move
        p.visual.y += (dy / d) * move
      }
    }
  }

  _applySplash(centerEnemy, dmg, radius, tower) {
    const splash = this.add.circle(centerEnemy.x, centerEnemy.y, 6, C.STAMP_GREEN, 0.3)
    this.tweens.add({
      targets: splash, scale: radius / 6, alpha: 0,
      duration: 300, onComplete: () => splash.destroy(),
    })
    this._enemies.forEach(e => {
      if (!e.alive || e === centerEnemy) return
      const d = Phaser.Math.Distance.Between(centerEnemy.x, centerEnemy.y, e.x, e.y)
      if (d <= radius) this._damageEnemy(e, dmg, tower)
    })
  }

  _applyChain(firstEnemy, baseDmg, tower) {
    let current = firstEnemy
    let dmg = baseDmg
    const hit = new Set([firstEnemy])
    for (let i = 0; i < 3; i++) {
      dmg *= 0.6
      let next = null, bestD = 60
      this._enemies.forEach(e => {
        if (!e.alive || hit.has(e)) return
        const d = Phaser.Math.Distance.Between(current.x, current.y, e.x, e.y)
        if (d < bestD) { next = e; bestD = d }
      })
      if (!next) break
      const line = this.add.line(0, 0, current.x, current.y, next.x, next.y, C.GOLD_LEAF, 0.8)
      line.setOrigin(0, 0); line.setLineWidth(1.5)
      this.tweens.add({
        targets: line, alpha: 0, duration: 300,
        onComplete: () => line.destroy(),
      })
      this._damageEnemy(next, dmg, tower)
      hit.add(next)
      current = next
    }
  }

  _damageEnemy(e, damage, tower) {
    if (!e.alive) return
    let dmg = damage

    if (e.armored && tower && tower.tier === 1) dmg *= 0.8
    if (e.marked > 0) dmg *= 1.25

    if (tower && tower.def.enrich) {
      e.enrichStacks = (e.enrichStacks || 0) + 1
      dmg *= (1 + 0.1 * (e.enrichStacks - 1))
    }

    if (tower && tower.def.adaptive) {
      dmg *= (1 + 0.05 * this._killedTypes.size)
    }

    if (e.shield > 0) {
      const absorb = Math.min(e.shield, dmg)
      e.shield -= absorb
      dmg -= absorb
    }

    e.hp -= dmg
    e.lastDamagedAt = this.time.now
    this._updateEnemyHpBar(e)

    if (e.hp <= 0) this._killEnemy(e, tower)
  }

  _killEnemy(e, tower) {
    if (!e.alive) return
    e.alive = false
    this._ink += e.reward
    this._totalKills++
    this._killedTypes.add(e.type)
    if (tower) tower.killCount++
    if (e.isBoss) this._bossKilled = true

    const puff = this.add.circle(e.x, e.y, 4, C.INK, 0.5)
    this.tweens.add({
      targets: puff, scale: 3, alpha: 0,
      duration: 400, onComplete: () => puff.destroy(),
    })

    e.container.destroy()
    this._enemies = this._enemies.filter(en => en !== e)

    if (e.spawnOnDeath > 0) {
      for (let i = 0; i < e.spawnOnDeath; i++) {
        const pIdx = Math.max(0, e.pathIndex)
        this.time.delayedCall(100 * i, () => {
          if (this._gameActive) this._spawnEnemy('badLeads', pIdx)
        })
      }
    }

    if (!this._tier2Unlocked && this._totalKills >= TIER2_KILLS) {
      this._tier2Unlocked = true
      this._unlockTier(2)
    }
    if (!this._tier3Unlocked && this._totalKills >= TIER3_KILLS) {
      this._tier3Unlocked = true
      this._unlockTier(3)
    }

    this._updateHUD()
  }

  _checkWaveComplete() {
    if (!this._waveActive) return
    const wave = WAVES[this._currentWaveIdx]
    if (!wave) return
    if (this._waveSpawnIndex < wave.enemies.length) return
    if (this._enemies.length > 0) return

    this._waveActive = false
    this._wavesCleared++
    this._ink += 10
    this._updateHUD()
    this._setMessage(`Wave ${this._currentWaveIdx + 1} cleared (+10)`, 1800)

    if (this._currentWaveIdx + 1 >= WAVES.length) {
      this.time.delayedCall(1500, () => this._onWin())
      return
    }

    this._nextWaveTimer = this.time.delayedCall(INTER_WAVE_DELAY, () => {
      this._startWave(this._currentWaveIdx + 1)
    })
  }

  // ─── END GAME ───────────────────────────────────────────────────
  _calculateScore() {
    const livesPct = this._lives / START_LIVES
    const livesScore = livesPct * 40
    const efficiency = this._totalKills / Math.max(1, this._towersPlaced)
    const efficiencyScore = Math.min(20, efficiency * 2)
    const tiersUsed = new Set(this._placedTowers.map(t => t.tier)).size
    const diversityScore = tiersUsed * 7
    const elapsed = (this.time.now - this._gameStartTime) / 1000
    const speedScore = elapsed < 100 ? 10 : (elapsed < 130 ? 5 : 0)
    const bossBonus = this._bossKilled ? 9 : 0
    const raw = livesScore + efficiencyScore + diversityScore + speedScore + bossBonus
    return Math.max(10, Math.min(100, Math.round(raw)))
  }

  _performanceLine(score) {
    if (score >= 90) return 'Full-stack GTM operator. You\'d automate your own breakfast.'
    if (score >= 70) return 'Strong arsenal. The pipeline held.'
    if (score >= 50) return 'Some leaks, but you learned. That\'s the agency life.'
    if (score >= 30) return 'Rough start. But every agency founder starts somewhere.'
    return 'The tools are there. Mastery takes reps.'
  }

  _onWin() {
    if (this._gameComplete) return
    this._gameComplete = true
    this._gameActive = false
    const score = this._calculateScore()
    this._showCompletionOverlay(score, false)
  }

  _onLoss() {
    if (this._gameComplete) return
    this._gameComplete = true
    this._gameActive = false
    const partial = Math.max(10, Math.round((this._wavesCleared / WAVES.length) * 50))
    this._showCompletionOverlay(partial, true)
  }

  _showCompletionOverlay(score, isLoss) {
    if (this._spawnTimer) this._spawnTimer.remove()
    if (this._nextWaveTimer) this._nextWaveTimer.remove()
    if (this._interestTimer) this._interestTimer.remove()

    const techGain = Math.round(score / 4)
    const curTech = this.registry.get(KEYS.STAT_TECH) ?? 0
    this.registry.set(KEYS.STAT_TECH, Math.min(100, curTech + techGain))

    const overlay = this.add.rectangle(640, 360, 1280, 720, C.PARCHMENT, 0.94)
    overlay.setDepth(100)

    const title = isLoss ? 'THE PIPELINE BROKE.' : 'PIPELINE MASTERED.'
    this.add.text(640, 140, title, {
      fontFamily: FONT_TYPED, fontSize: '30px', color: COLORS.INK_BLACK, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(101)

    const sub = isLoss
      ? 'But that\'s how you learn.\nAugustin\'s first campaigns bombed too.'
      : 'From Google Sheets to Claude Code.\nFrom manual tracking to AI-powered automation.\nEvery tool earned. Every skill battle-tested.'
    this.add.text(640, 230, sub, {
      fontFamily: FONT, fontSize: '15px', color: COLORS.INK, fontStyle: 'italic',
      align: 'center', lineSpacing: 8,
    }).setOrigin(0.5).setDepth(101)

    this.add.text(640, 340, `Score: ${score}%`, {
      fontFamily: FONT_TYPED, fontSize: '22px', color: COLORS.INK_BLACK, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(101)

    this.add.text(640, 380, `+${techGain} Tech`, {
      fontFamily: FONT_TYPED, fontSize: '16px', color: COLORS.STAMP_GREEN, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(101)

    this.add.text(640, 420, this._performanceLine(score), {
      fontFamily: FONT, fontSize: '13px', color: COLORS.INK_FADED, fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(101)

    const toolsList = Array.from(this._usedToolNames).join(', ') || 'none'
    this.add.text(640, 470, `Tools deployed: ${toolsList}`, {
      fontFamily: FONT_TYPED, fontSize: '10px', color: COLORS.INK_FADED,
      align: 'center', wordWrap: { width: 900 },
    }).setOrigin(0.5).setDepth(101)

    this.add.text(640, 540,
      'The agency scaled. The tools sharpened.\nBut one question remained:\nCould you do it for someone else\'s dream?', {
        fontFamily: FONT, fontSize: '13px', color: COLORS.INK, fontStyle: 'italic',
        align: 'center', lineSpacing: 6,
      }).setOrigin(0.5).setDepth(101)

    this.add.text(640, 650, isLoss
      ? 'PRESS R to retry    |    PRESS SPACE to return to the hub'
      : 'PRESS SPACE to return to the hub', {
        fontFamily: FONT_TYPED, fontSize: '11px', color: COLORS.INK_FADED,
    }).setOrigin(0.5).setDepth(101)

    completeLevel(this, KEYS.SCORE_L4, KEYS.COMPLETED_L4, score)
    saveRegistry(this)

    this.input.keyboard.once('keydown-SPACE', () => this._returnToHub())
    if (isLoss) {
      this.input.keyboard.once('keydown-R', () => {
        this.cameras.main.fadeOut(300, 0, 0, 0)
        this.time.delayedCall(320, () => this.scene.restart())
      })
    }

    this.time.delayedCall(12000, () => {
      if (!this._returned) this._returnToHub()
    })
  }

  _returnToHub() {
    if (this._returned) return
    this._returned = true
    this.cameras.main.fadeOut(400, 244, 232, 208)
    this.time.delayedCall(420, () => this.scene.start('LevelSelectHub'))
  }

  _cleanup() {
    if (this._spawnTimer) this._spawnTimer.remove()
    if (this._nextWaveTimer) this._nextWaveTimer.remove()
    if (this._interestTimer) this._interestTimer.remove()
    if (this._msgTimer) this._msgTimer.remove()
    if (this.input && this.input.keyboard) this.input.keyboard.removeAllListeners()
    if (this.input) this.input.removeAllListeners()
    this.tweens.killAll()
  }
}
