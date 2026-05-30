import * as Phaser from 'phaser'
import { COLORS, C, FONT_MONO, FONT_DISPLAY } from '../config/theme.js'
import { KEYS, saveRegistry, recordBestTime, addPlayTime } from '../systems/GameRegistry.js'
import { BrutalUI } from '../ui/BrutalUI.js'
import { AudioCtx } from '../ui/AudioCtx.js'
import { Particles } from '../ui/Particles.js'
import { TextReveal } from '../ui/TextReveal.js'
import { completeLevel } from './LevelSelectHub.js'

// Heavy-shot towers — get shootBig SFX
const HEAVY_KEYS = new Set(['hubSpot', 'clay', 'n8n', 'claudeCode', 'salesNav'])

// ── Serpentine enemy path through play area ──
const PATH_POINTS = [
  { x: -40,  y: 180 },
  { x: 260,  y: 180 },
  { x: 260,  y: 340 },
  { x: 620,  y: 340 },
  { x: 620,  y: 180 },
  { x: 960,  y: 180 },
  { x: 960,  y: 480 },
  { x: 420,  y: 480 },
  { x: 420,  y: 600 },
  { x: 1320, y: 600 },
]

// ── Tower placement spots near the path ──
const TOWER_SPOTS = [
  { x: 160,  y: 260 }, { x: 360,  y: 260 }, { x: 180,  y: 420 },
  { x: 480,  y: 260 }, { x: 520,  y: 420 }, { x: 720,  y: 260 },
  { x: 720,  y: 420 }, { x: 860,  y: 320 }, { x: 1060, y: 320 },
  { x: 1060, y: 540 }, { x: 820,  y: 540 }, { x: 580,  y: 540 },
  { x: 300,  y: 540 }, { x: 160,  y: 620 },
]

// ── Tower definitions: 12 towers, ink-only gating ──
// `label` is the full software name shown on the tower and panel.
// `panelLabel` is the panel-fitted abbreviation when name is too long.
const TOWER_DEFS = {
  googleSheets: {
    key: 'googleSheets', tier: 1, label: 'GOOGLE SHEETS', panelLabel: 'SHEETS', cost: 15,
    damage: 8,  fireRate: 1000, range: 110, shortcut: '1',
    proj: { kind: 'dot',      color: C.BLACK,        size: 5 },
  },
  mailchimp: {
    key: 'mailchimp', tier: 1, label: 'MAILCHIMP', panelLabel: 'MAILCHIMP', cost: 25,
    damage: 10, fireRate: 667,  range: 120, shortcut: '2',
    proj: { kind: 'envelope', color: C.HAZARD_YELLOW, size: 10 },
  },
  linkedIn: {
    key: 'linkedIn', tier: 1, label: 'LINKEDIN',  panelLabel: 'LINKEDIN', cost: 30,
    damage: 12, fireRate: 833,  range: 130, shortcut: '3',
    proj: { kind: 'square',   color: C.SHOCK_BLUE,   size: 9 },
  },
  hubSpot: {
    key: 'hubSpot', tier: 2, label: 'HUBSPOT',   panelLabel: 'HUBSPOT', cost: 55,
    damage: 14, fireRate: 1250, range: 130, shortcut: '4', aoe: 50,
    proj: { kind: 'pulse',    color: C.SHOCK_PINK,   size: 12 },
  },
  apollo: {
    key: 'apollo', tier: 2, label: 'APOLLO',    panelLabel: 'APOLLO', cost: 60,
    damage: 8,  fireRate: 1000, range: 160, shortcut: '5', burst: 3,
    proj: { kind: 'dart',     color: C.WHITE,        size: 8 },
  },
  instantly: {
    key: 'instantly', tier: 2, label: 'INSTANTLY', panelLabel: 'INSTANTLY', cost: 70,
    damage: 5,  fireRate: 333,  range: 130, shortcut: '6',
    proj: { kind: 'dot',      color: C.SHOCK_RED,    size: 4 },
  },
  lemlist: {
    key: 'lemlist', tier: 2, label: 'LEMLIST',   panelLabel: 'LEMLIST', cost: 75,
    damage: 12, fireRate: 833,  range: 140, shortcut: '7', aoe: 55,
    proj: { kind: 'envelope', color: C.SHOCK_PINK,   size: 11 },
  },
  salesNav: {
    key: 'salesNav', tier: 2, label: 'SALES NAV', panelLabel: 'SALES NAV', cost: 90,
    damage: 25, fireRate: 1000, range: 240, shortcut: '8',
    proj: { kind: 'trail',    color: C.WHITE,        size: 6 },
  },
  clay: {
    key: 'clay', tier: 3, label: 'CLAY',      panelLabel: 'CLAY', cost: 130,
    damage: 28, fireRate: 2000, range: 160, shortcut: '9', aoe: 90, explosive: true,
    proj: { kind: 'shell',    color: C.HAZARD_YELLOW, size: 13 },
  },
  n8n: {
    key: 'n8n', tier: 3, label: 'N8N',       panelLabel: 'N8N', cost: 120,
    damage: 14, fireRate: 1000, range: 150, shortcut: '0', chain: 2,
    proj: { kind: 'bolt',     color: C.SHOCK_BLUE,   size: 6 },
  },
  claudeCode: {
    key: 'claudeCode', tier: 3, label: 'CLAUDE CODE', panelLabel: 'CLAUDE', cost: 150,
    damage: 22, fireRate: 900,  range: 170, shortcut: 'Q', adaptive: true,
    proj: { kind: 'plasma',   color: C.BONE,         size: 10 },
  },
  zapier: {
    key: 'zapier', tier: 3, label: 'ZAPIER',    panelLabel: 'ZAPIER', cost: 100,
    damage: 0,  fireRate: 99999, range: 0, shortcut: 'W', support: { auraRange: 130, rangeMul: 1.25, damageMul: 1.3 },
    proj: { kind: 'none', color: C.SHOCK_BLUE, size: 0 },
  },
}

const TOWER_ORDER = [
  'googleSheets','mailchimp','linkedIn','hubSpot',
  'apollo','instantly','lemlist','salesNav',
  'clay','n8n','claudeCode','zapier',
]

// ── 6 named waves (business challenges) — rebalanced for shorter run ──
const WAVES = [
  { name: 'LEADS DRIED UP',         count: 10, hp: 30,  speed: 60,  reward: 6,  type: 'bad-leads', color: C.GREY_500,
    context: 'Your prospect list is tapped. No replies from the usual sources. Time to find new accounts and dial up volume.' },
  { name: 'DOMAIN BLACKLISTED',     count: 12, hp: 55,  speed: 72,  reward: 7,  type: 'blacklist', color: C.SHOCK_RED,
    context: 'Your sender domain got flagged. Emails go straight to spam. Warm new inboxes and clean the list before reputation tanks.' },
  { name: 'DECISION-MAKER GHOSTED', count: 14, hp: 95,  speed: 85,  reward: 9,  type: 'ghost',     color: C.BONE_WARM,
    context: 'The deal champion stopped replying. They went dark mid-cycle. Re-engage with a fresh angle or escalate above them.' },
  { name: 'CAC EXPLODES',           count: 16, hp: 140, speed: 92,  reward: 11, type: 'cac',       color: C.HAZARD_YELLOW,
    context: 'Cost per customer just doubled. The funnel is leaking. Find the broken step and fix it before you bleed budget.' },
  { name: 'CAMPAIGN FATIGUE',       count: 18, hp: 180, speed: 98,  reward: 13, type: 'fatigue',   color: C.DEEP_PURPLE,
    context: 'Your top-performing copy stopped converting. Audience has seen it too many times. Need fresh angles and new creatives, fast.' },
  { name: 'COMPETITOR UNDERCUT',    count: 8,  hp: 460, speed: 65,  reward: 28, type: 'boss',      color: C.SHOCK_BLUE, boss: true,
    context: 'A rival just slashed prices. Existing customers are reconsidering. Time to defend the book and prove value beyond cost.' },
]

// ── Tower tooltips: what it does + why Augustin used it at his agency ──
const TOWER_TOOLTIPS = {
  googleSheets: { what: 'Spreadsheets that ran our ops.', why: 'I tracked every pipeline stage and KPI in Sheets before scaling to a real CRM.' },
  mailchimp:    { what: 'Newsletter + nurture flows.', why: 'The bread-and-butter of email marketing — my first warm-audience engine.' },
  linkedIn:     { what: 'The professional graph.', why: 'Where I sourced ICP accounts and warmed up DMs before any cold email.' },
  hubSpot:      { what: 'CRM + marketing automation.', why: 'Single source of truth for every deal, sequence, and report I owned.' },
  apollo:       { what: '200M+ contact database.', why: 'Where every prospect list I built started.' },
  instantly:    { what: 'Cold email at scale with deliverability built-in.', why: 'Powered every outbound campaign I ran — millions of sends, zero burnt domains.' },
  lemlist:      { what: 'Personalized cold email with images + video.', why: 'My weapon for breaking into stubborn accounts with custom creatives.' },
  salesNav:     { what: 'LinkedIn premium prospecting.', why: 'Sniped buying signals — job changes, hires, intent — for my best campaigns.' },
  clay:         { what: 'Enriches leads with 100+ signals.', why: 'I found perfect-fit accounts before anyone else did — Clay was my edge.' },
  n8n:          { what: 'Open-source automation between any apps.', why: 'Chained 30+ tools together without writing code. Saved hours per week.' },
  claudeCode:   { what: 'AI that writes code for you.', why: 'Shipped client deliverables 5x faster — built tools I could never build alone.' },
  zapier:       { what: 'No-code integration glue.', why: 'Connected stack pieces fast — the duct tape of every GTM motion I ran.' },
}

const ENEMY_LABELS = {
  'bad-leads':'BAD LEADS','blacklist':'BLACKLIST','churn':'CHURN',
  'ghost':'GHOSTED','cac':'CAC SPIKE','fatigue':'FATIGUE',
  'boss':'COMPETITOR','market':'NEW MARKET',
}

export class AgencyFactoryScene extends Phaser.Scene {
  constructor() {
    super('AgencyFactoryScene')
  }

  create() {
    const { width, height } = this.cameras.main
    this.cameras.main.fadeIn(300, 10, 10, 10)
    this.cameras.main.setBackgroundColor(COLORS.BLACK)

    // State
    this.ink = 120
    this.lives = 20
    this.kills = 0
    this.score = 0
    this.waveIndex = 0
    this.waveActive = false
    this.towers = []
    this.enemies = []
    this.projectiles = []
    this.fx = []
    this.selectedKey = null
    this.occupiedSpots = new Set()
    this._timers = []
    this._tweens = []
    this._keyHandlers = []

    // Background
    this._drawBackground(width, height)
    this._drawPath()
    this._drawTowerSpots()

    // HUD
    this._drawHUD(width, height)
    BrutalUI.drawHomeButton(this)

    // Tower selection panel
    this._drawTowerPanel(width, height)

    // Range indicator (created lazily in _selectTower)
    this.rangeIndicator = null

    // Scanlines overlay
    BrutalUI.drawScanlines(this, width, height)

    // Streak / combo state
    this.streakCount = 0
    this.streakMultiplier = 1
    this.lastKillTime = 0
    this.streakText = this.add.text(150, 58, '', {
      fontFamily: FONT_DISPLAY, fontSize: '16px', color: COLORS.SHOCK_RED,
      stroke: '#0a0a0a', strokeThickness: 3,
    }).setOrigin(0, 0.5).setDepth(100).setVisible(false)

    // Best-time tracking
    this.runStartMs = null
    this.runElapsedMs = 0

    // Audio throttle counters
    this._shootTick = 0
    this._killTick = 0
    this._bossHitCount = 0

    // Inputs
    this._setupInput()

    // Resume audio on first pointer
    this.input.once('pointerdown', () => AudioCtx.resume())

    // Scene-start audio
    AudioCtx.fx('open')

    // Start with wave intro
    this._showWaveIntro()

    // Update loop
    this._lastUpdate = 0
    this.events.on('update', this._tick, this)

    // Cleanup
    this.events.once('shutdown', this._cleanup, this)
  }

  // ── Background: black + faint grid ──
  _drawBackground(width, height) {
    const g = this.add.graphics()
    g.fillStyle(C.BLACK, 1)
    g.fillRect(0, 0, width, height)
    g.lineStyle(1, C.GREY_900, 0.8)
    for (let x = 0; x < width; x += 40) { g.beginPath(); g.moveTo(x, 80); g.lineTo(x, height - 120); g.strokePath() }
    for (let y = 80; y < height - 120; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(width, y); g.strokePath() }
  }

  // ── Path: thick bone line with black outline ──
  _drawPath() {
    const outline = this.add.graphics()
    outline.lineStyle(36, C.BLACK, 1)
    this._strokePath(outline)

    const inner = this.add.graphics()
    inner.lineStyle(26, C.BONE, 1)
    this._strokePath(inner)

    // Dashed centerline
    const dash = this.add.graphics()
    dash.lineStyle(2, C.BLACK, 1)
    for (let i = 0; i < PATH_POINTS.length - 1; i++) {
      const a = PATH_POINTS[i], b = PATH_POINTS[i + 1]
      const dx = b.x - a.x, dy = b.y - a.y
      const len = Math.hypot(dx, dy)
      const nx = dx / len, ny = dy / len
      const step = 14
      for (let d = 0; d < len; d += step * 2) {
        dash.beginPath()
        dash.moveTo(a.x + nx * d, a.y + ny * d)
        dash.lineTo(a.x + nx * (d + step), a.y + ny * (d + step))
        dash.strokePath()
      }
    }
  }

  _strokePath(g) {
    g.beginPath()
    g.moveTo(PATH_POINTS[0].x, PATH_POINTS[0].y)
    for (let i = 1; i < PATH_POINTS.length; i++) g.lineTo(PATH_POINTS[i].x, PATH_POINTS[i].y)
    g.strokePath()
  }

  // ── Tower placement circles ──
  _drawTowerSpots() {
    TOWER_SPOTS.forEach((spot, idx) => {
      const g = this.add.graphics()
      g.fillStyle(C.BLACK, 1)
      g.fillCircle(spot.x + 3, spot.y + 3, 18)
      g.fillStyle(C.BONE, 1)
      g.fillCircle(spot.x, spot.y, 18)
      g.lineStyle(3, C.BLACK, 1)
      g.strokeCircle(spot.x, spot.y, 18)
      g.lineStyle(2, C.GREY_500, 1)
      g.strokeCircle(spot.x, spot.y, 10)

      const hit = this.add.circle(spot.x, spot.y, 22, 0x000000, 0).setInteractive({ useHandCursor: true })
      hit.on('pointerdown', () => this._tryPlaceTower(idx))
      spot._graphic = g
      spot._hit = hit
    })
  }

  // ── HUD ──
  _drawHUD(width) {
    const barG = this.add.graphics()
    barG.fillStyle(C.BONE, 1)
    barG.fillRect(0, 0, width, 66)
    barG.fillStyle(C.SHOCK_BLUE, 1)
    barG.fillRect(0, 62, width, 4)

    // INK counter (left, but past the home button which sits ~24..134)
    this.inkText = this.add.text(150, 33, 'INK: 120', {
      fontFamily: FONT_DISPLAY, fontSize: '22px', color: COLORS.BLACK,
    }).setOrigin(0, 0.5)

    // Wave tag (center)
    this.waveTag = this.add.text(width / 2, 33, `WAVE 1/${WAVES.length}`, {
      fontFamily: FONT_DISPLAY, fontSize: '22px', color: COLORS.BLACK,
    }).setOrigin(0.5)

    // Lives hearts (right of center). Anchor wider so we have room for kills/score on the right.
    this.livesContainer = this.add.container(width - 380, 33)
    this._redrawLives()

    // Kills + Score (right) — compact, 2 lines
    this.killsText = this.add.text(width - 20, 22, 'KILLS 0', {
      fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: COLORS.GREY_700,
    }).setOrigin(1, 0.5)
    this.scoreText = this.add.text(width - 20, 44, 'SCORE 0', {
      fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: COLORS.BLACK,
    }).setOrigin(1, 0.5)
  }

  _redrawLives() {
    this.livesContainer.removeAll(true)
    const shown = Math.min(this.lives, 10)
    for (let i = 0; i < shown; i++) {
      const g = this.add.graphics()
      const cx = i * 16
      g.fillStyle(C.SHOCK_BLUE, 1)
      g.fillCircle(cx - 3, -2, 4)
      g.fillCircle(cx + 3, -2, 4)
      g.fillTriangle(cx - 7, 0, cx + 7, 0, cx, 8)
      this.livesContainer.add(g)
    }
    if (this.lives > 10) {
      const t = this.add.text(shown * 16 + 6, 0, `+${this.lives - 10}`, {
        fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: COLORS.BLACK,
      }).setOrigin(0, 0.5)
      this.livesContainer.add(t)
    }
  }

  // ── Tower selection panel ──
  _drawTowerPanel(width, height) {
    const panelY = height - 88
    const panelG = this.add.graphics()
    panelG.fillStyle(C.OFF_BLACK, 1)
    panelG.fillRect(0, panelY - 10, width, 98)
    panelG.fillStyle(C.SHOCK_BLUE, 1)
    panelG.fillRect(0, panelY - 10, width, 3)

    // 12 slots fitting in 1280: 12 * 100 = 1200, 40px margins
    const slotW = 100
    const slotInner = 92  // visual box width
    const slotH = 70
    const totalW = slotW * TOWER_ORDER.length
    const startX = (width - totalW) / 2 + slotW / 2

    this.panelSlots = {}

    TOWER_ORDER.forEach((key, i) => {
      const def = TOWER_DEFS[key]
      const x = startX + i * slotW
      const y = panelY + 35

      const slot = this.add.container(x, y)

      const shadow = this.add.graphics()
      shadow.fillStyle(C.BLACK, 1)
      shadow.fillRect(-slotInner / 2 + 3, -slotH / 2 + 3, slotInner, slotH)

      const bg = this.add.graphics()
      bg.fillStyle(C.BONE, 1)
      bg.fillRect(-slotInner / 2, -slotH / 2, slotInner, slotH)
      bg.lineStyle(3, C.BLACK, 1)
      bg.strokeRect(-slotInner / 2, -slotH / 2, slotInner, slotH)

      // Tier strip on top
      const tierColor = def.tier === 1 ? C.GREY_500 : def.tier === 2 ? C.SHOCK_BLUE : C.HAZARD_YELLOW
      const tierStrip = this.add.graphics()
      tierStrip.fillStyle(tierColor, 1)
      tierStrip.fillRect(-slotInner / 2, -slotH / 2, slotInner, 4)

      // Tool icon (left side)
      const iconG = this.add.graphics()
      this._drawToolIcon(iconG, key, -slotInner / 2 + 20, -2, 0.9)

      // Auto-shrink label to fit remaining slot width (right of icon)
      const labelX = 8
      const maxNameW = slotInner - 44
      let nameSize = 10
      const nameTxt = this.add.text(labelX, -18, def.panelLabel, {
        fontFamily: FONT_MONO, fontSize: `${nameSize}px`, fontStyle: 'bold', color: COLORS.BLACK,
      }).setOrigin(0, 0.5)
      while (nameTxt.width > maxNameW && nameSize > 7) {
        nameSize -= 1
        nameTxt.setFontSize(nameSize)
      }

      const cost = this.add.text(labelX, 2, `$${def.cost}`, {
        fontFamily: FONT_DISPLAY, fontSize: '15px', color: COLORS.BLACK,
      }).setOrigin(0, 0.5)

      const key2 = this.add.text(labelX, 22, `[${def.shortcut}]`, {
        fontFamily: FONT_MONO, fontSize: '9px', color: COLORS.GREY_700,
      }).setOrigin(0, 0.5)

      slot.add([shadow, bg, tierStrip, iconG, nameTxt, cost, key2])

      const dim = this.add.graphics()
      dim.fillStyle(C.BLACK, 0.55)
      dim.fillRect(-slotInner / 2, -slotH / 2, slotInner, slotH)
      dim.setVisible(false)
      slot.add(dim)

      const sel = this.add.graphics()
      sel.lineStyle(4, C.SHOCK_BLUE, 1)
      sel.strokeRect(-slotInner / 2 - 2, -slotH / 2 - 2, slotInner + 4, slotH + 4)
      sel.setVisible(false)
      slot.add(sel)

      const hit = this.add.rectangle(x, y, slotInner, slotH, 0x000000, 0).setInteractive({ useHandCursor: true })
      hit.on('pointerdown', () => this._selectTower(key))
      hit.on('pointerover', (pointer) => this._showTooltip(key, pointer))
      hit.on('pointermove', (pointer) => this._moveTooltip(pointer))
      hit.on('pointerout', () => this._hideTooltip())

      this.panelSlots[key] = { slot, dim, sel, cost }
    })

    this._updatePanelAffordability()
  }

  _updatePanelAffordability() {
    TOWER_ORDER.forEach((key) => {
      const def = TOWER_DEFS[key]
      const slot = this.panelSlots[key]
      if (!slot) return
      slot.dim.setVisible(this.ink < def.cost)
    })
  }

  _selectTower(key) {
    const def = TOWER_DEFS[key]
    if (!def) return
    if (this.ink < def.cost) return
    this.selectedKey = key
    Object.entries(this.panelSlots).forEach(([k, s]) => s.sel.setVisible(k === key))
    this._showRangeIndicator(def)
  }

  _clearSelection() {
    this.selectedKey = null
    Object.values(this.panelSlots).forEach(s => s.sel.setVisible(false))
    this._hideRangeIndicator()
  }

  // ── Range indicator (follows cursor while selecting) ──
  _showRangeIndicator(def) {
    this._hideRangeIndicator()
    const isSupport = !!def.support
    const radius = isSupport ? def.support.auraRange : def.range
    if (!radius || radius <= 0) return

    const outlineColor = isSupport ? C.HAZARD_YELLOW : C.BONE
    const fillColor = isSupport ? C.HAZARD_YELLOW : C.SHOCK_BLUE

    const g = this.add.graphics()
    g.fillStyle(fillColor, 0.15)
    g.fillCircle(0, 0, radius)
    g.lineStyle(4, outlineColor, 1)
    g.strokeCircle(0, 0, radius)
    g.lineStyle(2, C.BLACK, 0.6)
    g.strokeCircle(0, 0, radius)
    g.setDepth(50)

    // Position at current pointer
    const p = this.input.activePointer
    g.setPosition(p.worldX || p.x, p.worldY || p.y)
    this.rangeIndicator = g
  }

  _hideRangeIndicator() {
    if (this.rangeIndicator) {
      this.rangeIndicator.destroy()
      this.rangeIndicator = null
    }
  }

  // ── Input ──
  _setupInput() {
    const shortcuts = {}
    TOWER_ORDER.forEach(k => { shortcuts[TOWER_DEFS[k].shortcut] = k })

    const kb = this.input.keyboard
    Object.entries(shortcuts).forEach(([short, key]) => {
      const code = short === '0' ? 'ZERO' :
                    short === 'Q' ? 'Q' :
                    short === 'W' ? 'W' :
                    'ONE,TWO,THREE,FOUR,FIVE,SIX,SEVEN,EIGHT,NINE'.split(',')[Number(short) - 1]
      if (!code) return
      const handler = () => this._selectTower(key)
      kb.on('keydown-' + code, handler)
      this._keyHandlers.push(['keydown-' + code, handler])
    })
    const escHandler = () => this._clearSelection()
    kb.on('keydown-ESC', escHandler)
    this._keyHandlers.push(['keydown-ESC', escHandler])

    // Pointer move — update range indicator position
    this.input.on('pointermove', (pointer) => {
      if (this.rangeIndicator) {
        this.rangeIndicator.setPosition(pointer.worldX || pointer.x, pointer.worldY || pointer.y)
      }
    })
  }

  // ── Tower placement ──
  _tryPlaceTower(spotIdx) {
    if (!this.selectedKey) return
    if (this.occupiedSpots.has(spotIdx)) return
    const def = TOWER_DEFS[this.selectedKey]
    if (this.ink < def.cost) return

    this.ink -= def.cost
    this._updateInk()
    this.occupiedSpots.add(spotIdx)

    const spot = TOWER_SPOTS[spotIdx]
    this._placeTower(def, spot.x, spot.y)
    AudioCtx.fx('place')
    Particles.ring(this, spot.x, spot.y, C.SHOCK_BLUE, { maxRadius: 80 })
    this._clearSelection()
    this._updatePanelAffordability()
  }

  _placeTower(def, x, y) {
    const container = this.add.container(x, y)

    const shadow = this.add.graphics()
    shadow.fillStyle(C.BLACK, 1)
    shadow.fillRect(-22 + 3, -22 + 3, 44, 44)

    const bg = this.add.graphics()
    bg.fillStyle(C.BONE, 1)
    bg.fillRect(-22, -22, 44, 44)
    bg.lineStyle(3, C.BLACK, 1)
    bg.strokeRect(-22, -22, 44, 44)

    // Tier strip on top
    const tierColor = def.tier === 1 ? C.GREY_500 : def.tier === 2 ? C.SHOCK_BLUE : C.HAZARD_YELLOW
    const tierStrip = this.add.graphics()
    tierStrip.fillStyle(tierColor, 1)
    tierStrip.fillRect(-22, -22, 44, 4)

    container.add([shadow, bg, tierStrip])

    // Tool icon — distinctive mini-illustration per tool
    const iconG = this.add.graphics()
    this._drawToolIcon(iconG, def.key, 0, 2, 1.0)
    container.add(iconG)

    // Software name label below the tower icon — black sticker for legibility
    const nameStr = def.label
    const nameLbl = this.add.text(0, 32, nameStr, {
      fontFamily: FONT_MONO, fontSize: '10px', fontStyle: 'bold',
      color: COLORS.BONE,
      backgroundColor: COLORS.BLACK,
      padding: { left: 4, right: 4, top: 2, bottom: 2 },
    }).setOrigin(0.5)
    container.add(nameLbl)

    const tower = {
      def, x, y, container,
      lastFire: 0,
      rangeMul: 1, damageMul: 1,
    }
    this.towers.push(tower)

    // Support aura ring for zapier
    if (def.support) {
      const ring = this.add.graphics()
      ring.lineStyle(2, C.HAZARD_YELLOW, 0.4)
      ring.strokeCircle(x, y, def.support.auraRange)
      tower._ring = ring
    }

    // Recalculate support buffs whenever towers change
    this._recalculateSupport()
  }

  // ── Hover tooltip for tower panel slots ──
  _showTooltip(key, pointer) {
    this._hideTooltip()
    const def = TOWER_DEFS[key]
    const tip = TOWER_TOOLTIPS[key]
    if (!def || !tip) return

    const container = this.add.container(0, 0).setDepth(200)

    const w = 280
    const padding = 12
    const nameTxt = this.add.text(padding, padding, def.label, {
      fontFamily: FONT_DISPLAY, fontSize: '16px', color: COLORS.BLACK,
    }).setOrigin(0, 0)
    const whatTxt = this.add.text(padding, padding + 26, tip.what, {
      fontFamily: FONT_MONO, fontSize: '12px', fontStyle: 'bold', color: COLORS.BLACK,
      wordWrap: { width: w - padding * 2 }, lineSpacing: 3,
    }).setOrigin(0, 0)
    const whyTxt = this.add.text(padding, padding + 28 + whatTxt.height + 8, tip.why, {
      fontFamily: FONT_MONO, fontSize: '11px', color: COLORS.GREY_700, fontStyle: 'italic',
      wordWrap: { width: w - padding * 2 }, lineSpacing: 3,
    }).setOrigin(0, 0)

    const h = padding + 26 + whatTxt.height + 8 + whyTxt.height + padding

    const shadow = this.add.graphics()
    shadow.fillStyle(C.BLACK, 1)
    shadow.fillRect(4, 4, w, h)

    const bg = this.add.graphics()
    bg.fillStyle(C.BONE, 1)
    bg.fillRect(0, 0, w, h)
    bg.lineStyle(3, C.BLACK, 1)
    bg.strokeRect(0, 0, w, h)
    // Accent strip
    const tierColor = def.tier === 1 ? C.GREY_500 : def.tier === 2 ? C.SHOCK_BLUE : C.HAZARD_YELLOW
    bg.fillStyle(tierColor, 1)
    bg.fillRect(0, 0, w, 4)

    container.add([shadow, bg, nameTxt, whatTxt, whyTxt])
    this._tooltip = { container, w, h }
    this._moveTooltip(pointer)
  }

  _moveTooltip(pointer) {
    if (!this._tooltip) return
    const { container, w, h } = this._tooltip
    const { width, height } = this.cameras.main
    const px = pointer.worldX || pointer.x
    const py = pointer.worldY || pointer.y
    // Position above-right of cursor; flip if off-screen
    let tx = px + 16
    let ty = py - h - 16
    if (tx + w > width - 8) tx = px - w - 16
    if (ty < 8) ty = py + 24
    container.setPosition(tx, ty)
  }

  _hideTooltip() {
    if (this._tooltip) {
      this._tooltip.container.destroy()
      this._tooltip = null
    }
  }

  // ── Tool icons — distinctive recognizable mini-illustrations ──
  // Draws into provided graphics object centered at (cx, cy), scaled by s (1.0 = 32px footprint).
  _drawToolIcon(g, key, cx, cy, s) {
    const S = (n) => n * s
    switch (key) {
      case 'googleSheets': {
        // Green spreadsheet grid 3x3
        const w = S(22), h = S(24)
        g.fillStyle(0x0F9D58, 1)
        g.fillRect(cx - w / 2, cy - h / 2, w, h)
        g.fillStyle(C.WHITE, 1)
        // Header strip
        g.fillRect(cx - w / 2 + S(2), cy - h / 2 + S(4), w - S(4), S(4))
        // 3x3 grid cells
        for (let r = 0; r < 3; r++) {
          for (let col = 0; col < 3; col++) {
            g.fillRect(cx - w / 2 + S(2) + col * S(6.5), cy - h / 2 + S(10) + r * S(4), S(5.5), S(3))
          }
        }
        g.lineStyle(S(1), C.BLACK, 1)
        g.strokeRect(cx - w / 2, cy - h / 2, w, h)
        break
      }
      case 'mailchimp': {
        // Yellow square with stylized M (chimp face hint)
        const w = S(24), h = S(22)
        g.fillStyle(0xFFE01B, 1)
        g.fillRect(cx - w / 2, cy - h / 2, w, h)
        g.lineStyle(S(1), C.BLACK, 1)
        g.strokeRect(cx - w / 2, cy - h / 2, w, h)
        // Stylized M: two arches
        g.lineStyle(S(2.5), C.BLACK, 1)
        g.beginPath()
        g.moveTo(cx - S(7), cy + S(6))
        g.lineTo(cx - S(7), cy - S(5))
        g.lineTo(cx, cy + S(2))
        g.lineTo(cx + S(7), cy - S(5))
        g.lineTo(cx + S(7), cy + S(6))
        g.strokePath()
        break
      }
      case 'linkedIn': {
        // Blue rounded square with "in"
        const w = S(22), h = S(22)
        g.fillStyle(0x0A66C2, 1)
        g.fillRect(cx - w / 2, cy - h / 2, w, h)
        g.lineStyle(S(1), C.BLACK, 1)
        g.strokeRect(cx - w / 2, cy - h / 2, w, h)
        // 'i' dot
        g.fillStyle(C.WHITE, 1)
        g.fillRect(cx - S(7), cy - S(7), S(3), S(3))
        // 'i' stem
        g.fillRect(cx - S(7), cy - S(2), S(3), S(8))
        // 'n' bars
        g.fillRect(cx - S(2), cy - S(2), S(3), S(8))
        g.fillRect(cx + S(4), cy - S(2), S(3), S(8))
        g.fillRect(cx - S(2), cy - S(2), S(9), S(3))
        break
      }
      case 'hubSpot': {
        // Orange sprocket/gear with center dot
        g.fillStyle(0xFF7A59, 1)
        g.fillCircle(cx, cy, S(11))
        // Spokes (4 small bumps)
        for (let i = 0; i < 4; i++) {
          const a = i * Math.PI / 2
          g.fillCircle(cx + Math.cos(a) * S(11), cy + Math.sin(a) * S(11), S(3))
        }
        g.lineStyle(S(1), C.BLACK, 1)
        g.strokeCircle(cx, cy, S(11))
        g.fillStyle(C.WHITE, 1)
        g.fillCircle(cx, cy, S(3.5))
        g.fillStyle(0xFF7A59, 1)
        g.fillCircle(cx, cy, S(1.5))
        break
      }
      case 'apollo': {
        // Dark cosmos sphere with star
        g.fillStyle(0x1B2A4E, 1)
        g.fillCircle(cx, cy, S(12))
        g.lineStyle(S(1), C.BLACK, 1)
        g.strokeCircle(cx, cy, S(12))
        // Small stars
        g.fillStyle(C.WHITE, 1)
        g.fillCircle(cx - S(5), cy - S(4), S(1.2))
        g.fillCircle(cx + S(4), cy + S(2), S(1))
        g.fillCircle(cx - S(2), cy + S(5), S(0.8))
        // Big star center
        g.fillStyle(C.HAZARD_YELLOW, 1)
        const star = (px, py, r) => {
          g.fillTriangle(px, py - r, px - r * 0.4, py - r * 0.4, px + r * 0.4, py - r * 0.4)
          g.fillTriangle(px, py + r, px - r * 0.4, py + r * 0.4, px + r * 0.4, py + r * 0.4)
          g.fillTriangle(px - r, py, px - r * 0.4, py - r * 0.4, px - r * 0.4, py + r * 0.4)
          g.fillTriangle(px + r, py, px + r * 0.4, py - r * 0.4, px + r * 0.4, py + r * 0.4)
        }
        star(cx + S(2), cy - S(1), S(4))
        break
      }
      case 'instantly': {
        // Lightning bolt on red square
        const w = S(22), h = S(22)
        g.fillStyle(0xE63946, 1)
        g.fillRect(cx - w / 2, cy - h / 2, w, h)
        g.lineStyle(S(1), C.BLACK, 1)
        g.strokeRect(cx - w / 2, cy - h / 2, w, h)
        // Bolt
        g.fillStyle(C.WHITE, 1)
        g.beginPath()
        g.moveTo(cx + S(2), cy - S(9))
        g.lineTo(cx - S(5), cy + S(1))
        g.lineTo(cx - S(1), cy + S(1))
        g.lineTo(cx - S(3), cy + S(9))
        g.lineTo(cx + S(5), cy - S(2))
        g.lineTo(cx + S(1), cy - S(2))
        g.closePath()
        g.fillPath()
        break
      }
      case 'lemlist': {
        // Pink envelope with sparkle
        const w = S(22), h = S(16)
        g.fillStyle(0xFB78A0, 1)
        g.fillRect(cx - w / 2, cy - h / 2, w, h)
        g.lineStyle(S(1.5), C.BLACK, 1)
        g.strokeRect(cx - w / 2, cy - h / 2, w, h)
        // Envelope flap
        g.beginPath()
        g.moveTo(cx - w / 2, cy - h / 2)
        g.lineTo(cx, cy + S(2))
        g.lineTo(cx + w / 2, cy - h / 2)
        g.strokePath()
        // Sparkle
        g.fillStyle(C.HAZARD_YELLOW, 1)
        g.fillTriangle(cx + S(7), cy - S(10), cx + S(8), cy - S(7), cx + S(6), cy - S(7))
        g.fillTriangle(cx + S(7), cy - S(4), cx + S(8), cy - S(7), cx + S(6), cy - S(7))
        g.fillTriangle(cx + S(4), cy - S(7), cx + S(7), cy - S(8), cx + S(7), cy - S(6))
        g.fillTriangle(cx + S(10), cy - S(7), cx + S(7), cy - S(8), cx + S(7), cy - S(6))
        break
      }
      case 'salesNav': {
        // Radar circle with pulse rings
        g.fillStyle(0x004182, 1)
        g.fillCircle(cx, cy, S(12))
        g.lineStyle(S(1), C.BLACK, 1)
        g.strokeCircle(cx, cy, S(12))
        // Pulse rings
        g.lineStyle(S(1), 0x70B5F9, 0.9)
        g.strokeCircle(cx, cy, S(8))
        g.strokeCircle(cx, cy, S(5))
        // Sweep line
        g.lineStyle(S(1.5), 0x70B5F9, 1)
        g.beginPath()
        g.moveTo(cx, cy)
        g.lineTo(cx + S(9), cy - S(7))
        g.strokePath()
        // Center
        g.fillStyle(C.WHITE, 1)
        g.fillCircle(cx, cy, S(1.5))
        break
      }
      case 'clay': {
        // Orange clay-pot 3D shape
        g.fillStyle(0xF95228, 1)
        // pot body (trapezoid)
        g.fillTriangle(cx - S(10), cy - S(2), cx + S(10), cy - S(2), cx - S(7), cy + S(10))
        g.fillTriangle(cx + S(10), cy - S(2), cx + S(7), cy + S(10), cx - S(7), cy + S(10))
        // rim
        g.fillStyle(0xC73E1D, 1)
        g.fillRect(cx - S(12), cy - S(5), S(24), S(4))
        g.lineStyle(S(1), C.BLACK, 1)
        g.strokeRect(cx - S(12), cy - S(5), S(24), S(4))
        // pot outline
        g.beginPath()
        g.moveTo(cx - S(10), cy - S(2))
        g.lineTo(cx - S(7), cy + S(10))
        g.lineTo(cx + S(7), cy + S(10))
        g.lineTo(cx + S(10), cy - S(2))
        g.strokePath()
        // highlight
        g.lineStyle(S(1), 0xFFB199, 0.8)
        g.beginPath()
        g.moveTo(cx - S(7), cy + S(1))
        g.lineTo(cx - S(5), cy + S(8))
        g.strokePath()
        break
      }
      case 'n8n': {
        // Pink + purple connected nodes
        g.lineStyle(S(2), C.WHITE, 1)
        g.beginPath()
        g.moveTo(cx - S(8), cy - S(6))
        g.lineTo(cx, cy + S(2))
        g.lineTo(cx + S(8), cy - S(6))
        g.moveTo(cx, cy + S(2))
        g.lineTo(cx, cy + S(10))
        g.strokePath()
        // nodes
        g.fillStyle(0xEA4B71, 1)  // pink
        g.fillCircle(cx - S(8), cy - S(6), S(4))
        g.fillStyle(0xEA4B71, 1)
        g.fillCircle(cx + S(8), cy - S(6), S(4))
        g.fillStyle(0x6233E0, 1)  // purple
        g.fillCircle(cx, cy + S(2), S(4.5))
        g.fillStyle(0xEA4B71, 1)
        g.fillCircle(cx, cy + S(10), S(3.5))
        g.lineStyle(S(1), C.BLACK, 1)
        g.strokeCircle(cx - S(8), cy - S(6), S(4))
        g.strokeCircle(cx + S(8), cy - S(6), S(4))
        g.strokeCircle(cx, cy + S(2), S(4.5))
        g.strokeCircle(cx, cy + S(10), S(3.5))
        break
      }
      case 'claudeCode': {
        // Anthropic-style sparkle + C
        // Background tile
        const w = S(22), h = S(22)
        g.fillStyle(0x1a1a1a, 1)
        g.fillRect(cx - w / 2, cy - h / 2, w, h)
        g.lineStyle(S(1), C.BLACK, 1)
        g.strokeRect(cx - w / 2, cy - h / 2, w, h)
        // Sparkle 4-point star (Anthropic mark)
        g.fillStyle(0xDA7756, 1)
        g.fillTriangle(cx, cy - S(9), cx - S(3), cy, cx + S(3), cy)
        g.fillTriangle(cx, cy + S(9), cx - S(3), cy, cx + S(3), cy)
        g.fillTriangle(cx - S(9), cy, cx, cy - S(3), cx, cy + S(3))
        g.fillTriangle(cx + S(9), cy, cx, cy - S(3), cx, cy + S(3))
        g.fillStyle(C.WHITE, 1)
        g.fillCircle(cx, cy, S(1.5))
        break
      }
      case 'zapier': {
        // Orange Z-bolt shape
        const w = S(22), h = S(22)
        g.fillStyle(0xFF4F00, 1)
        g.fillRect(cx - w / 2, cy - h / 2, w, h)
        g.lineStyle(S(1), C.BLACK, 1)
        g.strokeRect(cx - w / 2, cy - h / 2, w, h)
        // Z
        g.fillStyle(C.WHITE, 1)
        g.beginPath()
        g.moveTo(cx - S(8), cy - S(8))
        g.lineTo(cx + S(8), cy - S(8))
        g.lineTo(cx + S(8), cy - S(4))
        g.lineTo(cx - S(2), cy + S(4))
        g.lineTo(cx + S(8), cy + S(4))
        g.lineTo(cx + S(8), cy + S(8))
        g.lineTo(cx - S(8), cy + S(8))
        g.lineTo(cx - S(8), cy + S(4))
        g.lineTo(cx + S(2), cy - S(4))
        g.lineTo(cx - S(8), cy - S(4))
        g.closePath()
        g.fillPath()
        break
      }
      default: {
        g.fillStyle(C.BONE, 1)
        g.fillCircle(cx, cy, S(8))
      }
    }
  }

  _recalculateSupport() {
    this.towers.forEach(t => { t.rangeMul = 1; t.damageMul = 1 })
    this.towers.forEach(src => {
      if (!src.def.support) return
      this.towers.forEach(dst => {
        if (dst === src) return
        const d = Math.hypot(dst.x - src.x, dst.y - src.y)
        if (d <= src.def.support.auraRange) {
          dst.rangeMul = Math.max(dst.rangeMul, src.def.support.rangeMul)
          dst.damageMul = Math.max(dst.damageMul, src.def.support.damageMul)
        }
      })
    })
  }

  _updateInk() {
    this.inkText.setText(`INK: ${this.ink}`)
    this._updatePanelAffordability()
  }

  // ── Waves ──
  _showWaveIntro() {
    if (this.waveIndex >= WAVES.length) {
      this._onVictory()
      return
    }
    const wave = WAVES[this.waveIndex]
    const { width, height } = this.cameras.main

    const card = this.add.container(width / 2, height / 2)
    const w = 760, h = 340

    const shadow = this.add.graphics()
    shadow.fillStyle(C.BLACK, 1)
    shadow.fillRect(-w / 2 + 8, -h / 2 + 8, w, h)

    const bg = this.add.graphics()
    bg.fillStyle(C.BONE, 1)
    bg.fillRect(-w / 2, -h / 2, w, h)
    bg.lineStyle(5, C.BLACK, 1)
    bg.strokeRect(-w / 2, -h / 2, w, h)

    const accent = this.add.graphics()
    accent.fillStyle(C.SHOCK_BLUE, 1)
    accent.fillRect(-w / 2, -h / 2, w, 12)

    const waveLbl = this.add.text(0, -h / 2 + 36, `WAVE ${this.waveIndex + 1} / ${WAVES.length}`, {
      fontFamily: FONT_MONO, fontSize: '14px', fontStyle: 'bold', color: COLORS.GREY_700,
    }).setOrigin(0.5)

    // Auto-shrink wave name to fit — measured first with full text, then typewritten in place
    let nameSize = 40
    const name = this.add.text(0, -h / 2 + 84, wave.name, {
      fontFamily: FONT_DISPLAY, fontSize: `${nameSize}px`, color: COLORS.BLACK,
    }).setOrigin(0.5)
    while (name.width > w - 60 && nameSize > 22) {
      nameSize -= 2
      name.setFontSize(nameSize)
    }
    const fullName = wave.name
    name.setText('')
    let revealI = 0
    const revealEv = this.time.addEvent({
      delay: 32,
      repeat: fullName.length - 1,
      callback: () => {
        revealI++
        name.setText(fullName.slice(0, revealI))
      },
    })
    this._timers.push(revealEv)

    // Divider under name
    const div = this.add.graphics()
    div.lineStyle(2, C.BLACK, 1)
    div.beginPath()
    div.moveTo(-w / 2 + 40, -h / 2 + 120)
    div.lineTo(w / 2 - 40, -h / 2 + 120)
    div.strokePath()

    // Plain-English context paragraph (Space Mono)
    const ctx = this.add.text(0, -h / 2 + 158, wave.context || '', {
      fontFamily: FONT_MONO, fontSize: '15px', color: COLORS.BLACK,
      align: 'center', wordWrap: { width: w - 80 }, lineSpacing: 6,
    }).setOrigin(0.5, 0)

    const subt = this.add.text(0, h / 2 - 56, wave.boss ? '⚠ BOSS WAVE ⚠' : `${wave.count} INCOMING`, {
      fontFamily: FONT_MONO, fontSize: '13px', fontStyle: 'bold',
      color: wave.boss ? COLORS.SHOCK_RED : COLORS.BLACK,
    }).setOrigin(0.5)

    const hint = this.add.text(0, h / 2 - 26, '▶ CLICK TO ENGAGE', {
      fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: COLORS.GREY_500,
    }).setOrigin(0.5).setAlpha(0)

    card.add([shadow, bg, accent, waveLbl, name, div, ctx, subt, hint])

    const tw = this.tweens.add({ targets: hint, alpha: 1, duration: 300, delay: 300 })
    const blink = this.tweens.add({
      targets: hint, alpha: 0.3, duration: 500, yoyo: true, repeat: -1, delay: 700,
    })
    this._tweens.push(tw, blink)

    const handler = () => {
      this.input.off('pointerdown', handler)
      blink.stop()
      const fade = this.tweens.add({
        targets: card, alpha: 0, duration: 180,
        onComplete: () => { card.destroy(); this._startWave() },
      })
      this._tweens.push(fade)
    }
    this.input.once('pointerdown', handler)
  }

  _startWave() {
    const wave = WAVES[this.waveIndex]
    this.waveActive = true
    this.waveTag.setText(`WAVE ${this.waveIndex + 1}/${WAVES.length}`)

    // Start best-time timer on first wave
    if (this.runStartMs == null) this.runStartMs = this.time.now

    // Wave-start audio + shake
    AudioCtx.fx('waveStart')
    if (wave.boss) {
      AudioCtx.fx('boss')
      this.cameras.main.shake(280, 0.012)
    } else {
      this.cameras.main.shake(200, 0.008)
    }

    let spawned = 0
    const interval = wave.boss ? 1400 : 900
    const spawnTimer = this.time.addEvent({
      delay: interval,
      repeat: wave.count - 1,
      callback: () => {
        this._spawnEnemy(wave)
        spawned++
      },
    })
    this._timers.push(spawnTimer)
  }

  _spawnEnemy(wave) {
    const p0 = PATH_POINTS[0]
    const container = this.add.container(p0.x, p0.y)

    const w = wave.boss ? 70 : 52, h = wave.boss ? 40 : 28
    const shadow = this.add.graphics()
    shadow.fillStyle(C.BLACK, 1)
    shadow.fillRect(-w / 2 + 3, -h / 2 + 3, w, h)

    const bg = this.add.graphics()
    bg.fillStyle(C.BLACK, 1)
    bg.fillRect(-w / 2, -h / 2, w, h)
    bg.lineStyle(3, wave.color, 1)
    bg.strokeRect(-w / 2, -h / 2, w, h)

    const lbl = this.add.text(0, 0, ENEMY_LABELS[wave.type] || wave.type.toUpperCase(), {
      fontFamily: FONT_MONO, fontSize: wave.boss ? '11px' : '9px', fontStyle: 'bold',
      color: COLORS.BONE,
    }).setOrigin(0.5)

    container.add([shadow, bg, lbl])

    const enemy = {
      container,
      x: p0.x, y: p0.y,
      segIdx: 0, segProgress: 0,
      hp: wave.hp, maxHp: wave.hp,
      speed: wave.speed,
      reward: wave.reward,
      type: wave.type,
      boss: !!wave.boss,
      alive: true,
    }
    // HP bar
    const hpbar = this.add.graphics()
    enemy._hpbar = hpbar
    this.enemies.push(enemy)
  }

  // ── Main tick ──
  _tick(time, deltaTime) {
    const dt = (deltaTime || 16) / 1000
    this._updateEnemies(dt)
    this._updateTowers(time)
    this._updateProjectiles(dt)
    this._updateFX(dt)

    // Streak decay
    if (this.streakMultiplier > 1 && this.time.now - this.lastKillTime > 1500) {
      this.streakMultiplier = 1
      this.streakCount = 0
      this.streakText.setVisible(false)
    }

    // End-of-wave check
    if (this.waveActive && this.enemies.length === 0) {
      // Ensure spawner has finished
      const spawnDone = !this._timers.some(t => t && !t.getProgress || (t && t.getProgress() < 1))
      if (spawnDone) {
        this.waveActive = false
        // Wave complete bonus
        this.ink += 10
        this._updateInk()
        const { width } = this.cameras.main
        Particles.popup(this, width / 2, 130, 'WAVE COMPLETE +10 INK', '#0066ff', { fontSize: '28px', dy: -60, duration: 1100 })
        this.waveIndex++
        this.time.delayedCall(900, () => this._showWaveIntro())
      }
    }
  }

  _updateEnemies(dt) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i]
      if (!e.alive) { this._removeEnemy(i); continue }

      const a = PATH_POINTS[e.segIdx]
      const b = PATH_POINTS[e.segIdx + 1]
      if (!b) { this._leakEnemy(i); continue }
      const dx = b.x - a.x, dy = b.y - a.y
      const segLen = Math.hypot(dx, dy)
      e.segProgress += e.speed * dt
      while (e.segProgress >= segLen) {
        e.segProgress -= segLen
        e.segIdx++
        const na = PATH_POINTS[e.segIdx]
        const nb = PATH_POINTS[e.segIdx + 1]
        if (!nb) { this._leakEnemy(i); e._leaked = true; break }
      }
      if (e._leaked) continue
      const a2 = PATH_POINTS[e.segIdx]
      const b2 = PATH_POINTS[e.segIdx + 1]
      const segLen2 = Math.hypot(b2.x - a2.x, b2.y - a2.y)
      const t = e.segProgress / segLen2
      e.x = a2.x + (b2.x - a2.x) * t
      e.y = a2.y + (b2.y - a2.y) * t
      e.container.setPosition(e.x, e.y)

      // HP bar
      e._hpbar.clear()
      const bw = e.boss ? 60 : 44, bh = 4
      e._hpbar.fillStyle(C.BLACK, 1)
      e._hpbar.fillRect(e.x - bw / 2 - 1, e.y - (e.boss ? 28 : 22) - 1, bw + 2, bh + 2)
      e._hpbar.fillStyle(C.SHOCK_RED, 1)
      e._hpbar.fillRect(e.x - bw / 2, e.y - (e.boss ? 28 : 22), bw * (e.hp / e.maxHp), bh)
    }
  }

  _leakEnemy(idx) {
    const e = this.enemies[idx]
    this.lives -= e.boss ? 3 : 1
    if (this.lives < 0) this.lives = 0
    this._redrawLives()
    this._removeEnemy(idx)
    if (this.lives <= 0) this._onDefeat()
  }

  _removeEnemy(idx) {
    const e = this.enemies[idx]
    if (e) {
      e.container.destroy()
      if (e._hpbar) e._hpbar.destroy()
    }
    this.enemies.splice(idx, 1)
  }

  _killEnemy(e) {
    if (!e.alive) return
    e.alive = false
    this.kills++

    // Streak / combo logic — multiplier if kills within 1s of each other
    const now = this.time.now
    if (now - this.lastKillTime < 1000) {
      this.streakCount++
      this.streakMultiplier = Math.min(3, 1 + Math.floor(this.streakCount / 2))
    } else {
      this.streakCount = 1
      this.streakMultiplier = 1
    }
    this.lastKillTime = now
    if (this.streakMultiplier > 1) {
      this.streakText.setText(`x${this.streakMultiplier} INK`).setVisible(true)
      this.streakText.setScale(1.25)
      this.tweens.add({ targets: this.streakText, scale: 1, duration: 180, ease: 'Cubic.easeOut' })
    }

    const bonusInk = Math.round(e.reward * this.streakMultiplier)
    this.ink += bonusInk
    this.score += e.boss ? 100 : 10
    this.killsText.setText(`KILLS ${this.kills}`)
    this.scoreText.setText(`SCORE ${this.score}`)
    this._updateInk()

    // Particles + audio
    Particles.burst(this, e.x, e.y, C.BONE, 6, { shape: 'sticker' })
    this._killTick++
    if (this._killTick % 3 === 0 || e.boss) AudioCtx.fx('kill')

    if (e.boss) {
      Particles.confetti(this, e.x, e.y, 80)
      this.cameras.main.shake(800, 0.025)
    }
  }

  // ── Towers firing ──
  _updateTowers(time) {
    for (const t of this.towers) {
      if (t.def.support) continue
      const range = t.def.range * t.rangeMul
      const fireRate = t.def.fireRate
      if (time - t.lastFire < fireRate) continue

      // Find target
      let best = null, bestDist = Infinity
      for (const e of this.enemies) {
        if (!e.alive) continue
        const d = Math.hypot(e.x - t.x, e.y - t.y)
        if (d <= range && d < bestDist) { best = e; bestDist = d }
      }
      if (!best) continue
      t.lastFire = time

      if (t.def.burst) {
        for (let i = 0; i < t.def.burst; i++) {
          this.time.delayedCall(i * 80, () => {
            if (best.alive) this._fireProjectile(t, best)
          })
        }
      } else {
        this._fireProjectile(t, best)
      }
    }
  }

  _fireProjectile(tower, target) {
    const def = tower.def
    let projDef = def.proj

    // Claude Code adaptive: vary color based on target type
    if (def.adaptive) {
      const colors = {
        'bad-leads': C.GREY_500, 'blacklist': C.SHOCK_RED, 'churn': C.SHOCK_PINK,
        'ghost': C.BONE, 'cac': C.HAZARD_YELLOW, 'fatigue': C.DEEP_PURPLE,
        'boss': C.SHOCK_BLUE, 'market': C.SHOCK_LIME,
      }
      projDef = { ...projDef, color: colors[target.type] || C.BONE }
    }

    const proj = {
      tower, target,
      x: tower.x, y: tower.y,
      speed: def.proj.kind === 'trail' ? 520 : def.proj.kind === 'dart' ? 540 : 380,
      damage: def.damage * tower.damageMul,
      aoe: def.aoe || 0,
      explosive: !!def.explosive,
      chain: def.chain || 0,
      chainedHits: [],
      kind: projDef.kind,
      color: projDef.color,
      size: projDef.size,
      alive: true,
    }

    proj.g = this.add.graphics()
    this._drawProjectile(proj)

    // Throttled shoot SFX — only ~1 in 3-4 shots to keep audio rhythmic
    this._shootTick = (this._shootTick + 1) % 100
    if (HEAVY_KEYS.has(def.key)) {
      if (Math.random() < 0.45) AudioCtx.fx('shootBig')
    } else {
      if (Math.random() < 0.28) AudioCtx.fx('shoot')
    }
    // Trail for sales nav
    if (proj.kind === 'trail') {
      proj.trailPts = []
    }
    this.projectiles.push(proj)
  }

  _drawProjectile(p) {
    p.g.clear()
    const { kind, color, size } = p
    if (kind === 'dot') {
      p.g.fillStyle(C.BLACK, 1)
      p.g.fillCircle(p.x + 2, p.y + 2, size)
      p.g.fillStyle(color, 1)
      p.g.fillCircle(p.x, p.y, size)
    } else if (kind === 'envelope') {
      p.g.fillStyle(C.BLACK, 1)
      p.g.fillRect(p.x - size + 2, p.y - size * 0.6 + 2, size * 2, size * 1.2)
      p.g.fillStyle(color, 1)
      p.g.fillRect(p.x - size, p.y - size * 0.6, size * 2, size * 1.2)
      p.g.lineStyle(2, C.BLACK, 1)
      p.g.strokeRect(p.x - size, p.y - size * 0.6, size * 2, size * 1.2)
      p.g.beginPath()
      p.g.moveTo(p.x - size, p.y - size * 0.6)
      p.g.lineTo(p.x, p.y + 2)
      p.g.lineTo(p.x + size, p.y - size * 0.6)
      p.g.strokePath()
    } else if (kind === 'square') {
      p.g.fillStyle(C.BLACK, 1)
      p.g.fillRect(p.x - size + 2, p.y - size + 2, size * 2, size * 2)
      p.g.fillStyle(color, 1)
      p.g.fillRect(p.x - size, p.y - size, size * 2, size * 2)
      p.g.lineStyle(2, C.BLACK, 1)
      p.g.strokeRect(p.x - size, p.y - size, size * 2, size * 2)
    } else if (kind === 'pulse') {
      p.g.fillStyle(color, 0.4)
      p.g.fillCircle(p.x, p.y, size + 4)
      p.g.fillStyle(color, 1)
      p.g.fillCircle(p.x, p.y, size)
      p.g.lineStyle(2, C.BLACK, 1)
      p.g.strokeCircle(p.x, p.y, size)
    } else if (kind === 'dart') {
      const angle = Math.atan2(p.target.y - p.y, p.target.x - p.x)
      const len = size * 2
      const ex = p.x + Math.cos(angle) * len, ey = p.y + Math.sin(angle) * len
      p.g.lineStyle(3, C.BLACK, 1)
      p.g.beginPath(); p.g.moveTo(p.x, p.y); p.g.lineTo(ex, ey); p.g.strokePath()
      p.g.lineStyle(2, color, 1)
      p.g.beginPath(); p.g.moveTo(p.x, p.y); p.g.lineTo(ex, ey); p.g.strokePath()
    } else if (kind === 'trail') {
      if (p.trailPts) {
        for (let i = 0; i < p.trailPts.length - 1; i++) {
          const alpha = i / p.trailPts.length
          p.g.lineStyle(3, color, alpha)
          p.g.beginPath()
          p.g.moveTo(p.trailPts[i].x, p.trailPts[i].y)
          p.g.lineTo(p.trailPts[i + 1].x, p.trailPts[i + 1].y)
          p.g.strokePath()
        }
      }
      p.g.fillStyle(color, 1)
      p.g.fillCircle(p.x, p.y, size)
      p.g.lineStyle(2, C.BLACK, 1)
      p.g.strokeCircle(p.x, p.y, size)
    } else if (kind === 'shell') {
      p.g.fillStyle(C.BLACK, 1)
      p.g.fillCircle(p.x + 2, p.y + 2, size)
      p.g.fillStyle(color, 1)
      p.g.fillCircle(p.x, p.y, size)
      p.g.lineStyle(3, C.BLACK, 1)
      p.g.strokeCircle(p.x, p.y, size)
      p.g.fillStyle(C.SHOCK_RED, 1)
      p.g.fillCircle(p.x - 2, p.y - 2, size * 0.4)
    } else if (kind === 'bolt') {
      p.g.fillStyle(color, 1)
      p.g.fillCircle(p.x, p.y, size)
      p.g.lineStyle(2, C.WHITE, 1)
      p.g.strokeCircle(p.x, p.y, size)
    } else if (kind === 'plasma') {
      p.g.fillStyle(C.HAZARD_YELLOW, 0.5)
      p.g.fillCircle(p.x, p.y, size + 4)
      p.g.fillStyle(color, 1)
      p.g.fillCircle(p.x, p.y, size)
      p.g.lineStyle(2, C.BLACK, 1)
      p.g.strokeCircle(p.x, p.y, size)
    }
  }

  _updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i]
      if (!p.alive) { p.g.destroy(); this.projectiles.splice(i, 1); continue }
      const tgt = p.target
      if (!tgt || !tgt.alive) {
        // Find a new nearby enemy or die
        let best = null, bd = 200
        for (const e of this.enemies) {
          if (!e.alive) continue
          const d = Math.hypot(e.x - p.x, e.y - p.y)
          if (d < bd) { best = e; bd = d }
        }
        if (!best) { p.g.destroy(); this.projectiles.splice(i, 1); continue }
        p.target = best
      }

      const dx = p.target.x - p.x, dy = p.target.y - p.y
      const d = Math.hypot(dx, dy) || 1
      const step = p.speed * dt
      if (p.kind === 'trail') {
        p.trailPts.push({ x: p.x, y: p.y })
        if (p.trailPts.length > 8) p.trailPts.shift()
      }
      if (d <= step) {
        this._onProjectileHit(p)
        p.g.destroy()
        this.projectiles.splice(i, 1)
        continue
      }
      p.x += (dx / d) * step
      p.y += (dy / d) * step
      this._drawProjectile(p)
    }
  }

  _onProjectileHit(p) {
    const target = p.target
    if (!target || !target.alive) return

    if (p.explosive) {
      this._spawnExplosion(target.x, target.y, p.aoe, true)
      AudioCtx.fx('explode')
      this.cameras.main.shake(280, 0.018)
      Particles.ring(this, target.x, target.y, C.HAZARD_YELLOW, { maxRadius: 120, thickness: 6 })
      Particles.burst(this, target.x, target.y, C.HAZARD_YELLOW, 14)
      for (const e of this.enemies) {
        if (!e.alive) continue
        const d = Math.hypot(e.x - target.x, e.y - target.y)
        if (d <= p.aoe) {
          e.hp -= p.damage * (1 - d / (p.aoe * 1.5))
          if (e.hp <= 0) this._killEnemy(e)
        }
      }
    } else if (p.aoe) {
      this._spawnExplosion(target.x, target.y, p.aoe, false)
      for (const e of this.enemies) {
        if (!e.alive) continue
        const d = Math.hypot(e.x - target.x, e.y - target.y)
        if (d <= p.aoe) {
          e.hp -= p.damage
          if (e.hp <= 0) this._killEnemy(e)
        }
      }
    } else if (p.chain) {
      target.hp -= p.damage
      Particles.burst(this, target.x, target.y, C.SHOCK_BLUE, 4)
      this._maybeBossDamageShake(target)
      if (target.hp <= 0) this._killEnemy(target)
      p.chainedHits.push(target)
      let prev = target
      let remaining = p.chain
      while (remaining > 0) {
        let next = null, nd = 130
        for (const e of this.enemies) {
          if (!e.alive || p.chainedHits.includes(e)) continue
          const d = Math.hypot(e.x - prev.x, e.y - prev.y)
          if (d < nd) { next = e; nd = d }
        }
        if (!next) break
        this._spawnChainLightning(prev.x, prev.y, next.x, next.y)
        next.hp -= p.damage * 0.75
        Particles.burst(this, next.x, next.y, C.SHOCK_BLUE, 4)
        this._maybeBossDamageShake(next)
        if (next.hp <= 0) this._killEnemy(next)
        p.chainedHits.push(next)
        prev = next
        remaining--
      }
    } else {
      target.hp -= p.damage
      this._maybeBossDamageShake(target)
      if (target.hp <= 0) this._killEnemy(target)
    }
  }

  _maybeBossDamageShake(e) {
    if (!e || !e.boss || !e.alive) return
    this._bossHitCount++
    if (this._bossHitCount % 6 === 0) {
      this.cameras.main.shake(120, 0.006)
    }
  }

  // ── FX ──
  _spawnExplosion(x, y, radius, big) {
    const g = this.add.graphics()
    const fx = { g, x, y, radius, age: 0, life: big ? 0.45 : 0.28, big }
    this.fx.push(fx)
    if (big) {
      // flash
      const flash = this.add.graphics()
      flash.fillStyle(C.BONE, 0.6)
      flash.fillCircle(x, y, radius * 1.3)
      this.fx.push({ g: flash, x, y, radius: radius * 1.3, age: 0, life: 0.18, flash: true })
    }
  }

  _spawnChainLightning(x1, y1, x2, y2) {
    const g = this.add.graphics()
    g.lineStyle(3, C.SHOCK_BLUE, 1)
    const segs = 6
    g.beginPath()
    g.moveTo(x1, y1)
    for (let i = 1; i < segs; i++) {
      const t = i / segs
      const mx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 18
      const my = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 18
      g.lineTo(mx, my)
    }
    g.lineTo(x2, y2)
    g.strokePath()
    this.fx.push({ g, age: 0, life: 0.18, static: true })
  }

  _updateFX(dt) {
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i]
      f.age += dt
      if (f.age >= f.life) { f.g.destroy(); this.fx.splice(i, 1); continue }
      if (f.static) continue
      const t = f.age / f.life
      f.g.clear()
      if (f.flash) {
        f.g.fillStyle(C.BONE, 0.6 * (1 - t))
        f.g.fillCircle(f.x, f.y, f.radius)
      } else if (f.big) {
        f.g.lineStyle(6, C.BONE, 1 - t)
        f.g.strokeCircle(f.x, f.y, f.radius * (0.4 + t * 1.2))
        f.g.lineStyle(3, C.HAZARD_YELLOW, 1 - t)
        f.g.strokeCircle(f.x, f.y, f.radius * (0.2 + t * 0.9))
      } else {
        f.g.lineStyle(3, C.SHOCK_PINK, 1 - t)
        f.g.strokeCircle(f.x, f.y, f.radius * (0.5 + t))
      }
    }
  }

  // ── End states ──
  _onVictory() {
    const score = Math.max(50, Math.min(100, Math.round(60 + (this.lives / 20) * 40)))
    completeLevel(this, KEYS.SCORE_L4, KEYS.COMPLETED_L4, score)
    const prevTech = this.registry.get(KEYS.STAT_TECH) ?? 0
    this.registry.set(KEYS.STAT_TECH, Math.max(prevTech, score))

    // Best-time tracking
    const elapsedMs = this.runStartMs != null ? (this.time.now - this.runStartMs) : 0
    this.runElapsedMs = elapsedMs
    const newBest = recordBestTime(this, KEYS.BEST_T4, elapsedMs)
    addPlayTime(this, elapsedMs)
    saveRegistry(this)

    AudioCtx.fx('success')

    const secs = Math.floor(elapsedMs / 1000)
    const mm = String(Math.floor(secs / 60)).padStart(2, '0')
    const ss = String(secs % 60).padStart(2, '0')
    const timeStr = `${mm}:${ss}`
    const bestTag = newBest ? '\n★ NEW BEST! ★' : ''

    const { width, height } = this.cameras.main
    const overlay = this.add.graphics()
    overlay.fillStyle(C.BLACK, 0.7)
    overlay.fillRect(0, 0, width, height)

    BrutalUI.showNarrative(this, width / 2, height / 2, 640, 260,
      `CHAPTER 4 COMPLETE.\n\nTHE STACK HELD. ${this.kills} THREATS NEUTRALIZED.\nSCORE: ${score}%   TIME: ${timeStr}${bestTag}`,
      () => {
        BrutalUI.pageTurn(this, () => this.scene.start('LevelSelectHub'))
      },
      { fill: C.BONE, accentColor: C.SHOCK_BLUE, fontSize: '16px' })
  }

  _onDefeat() {
    if (this._defeated) return
    this._defeated = true
    const { width, height } = this.cameras.main
    const overlay = this.add.graphics()
    overlay.fillStyle(C.BLACK, 0.7)
    overlay.fillRect(0, 0, width, height)

    BrutalUI.showNarrative(this, width / 2, height / 2, 620, 200,
      `PIPELINE COLLAPSED.\n\n${this.kills} KILLS. WAVE ${this.waveIndex + 1}/${WAVES.length}.\nREBUILD THE STACK.`,
      () => {
        BrutalUI.pageTurn(this, () => this.scene.start('LevelSelectHub'))
      },
      { fill: C.BONE, accentColor: C.SHOCK_RED, fontSize: '16px' })
  }

  // ── Cleanup ──
  _cleanup() {
    this.events.off('update', this._tick, this)
    this._timers.forEach(t => { try { t.remove(false) } catch (e) {} })
    this._timers = []
    this._tweens.forEach(tw => { try { tw.stop() } catch (e) {} })
    this._tweens = []
    if (this.input && this.input.keyboard) {
      this._keyHandlers.forEach(([ev, fn]) => { try { this.input.keyboard.off(ev, fn) } catch (e) {} })
    }
    this._keyHandlers = []
    this._hideRangeIndicator()
    this._hideTooltip()
  }
}
