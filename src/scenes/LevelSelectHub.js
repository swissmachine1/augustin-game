import * as Phaser from 'phaser'
import { KEYS, saveRegistry } from '../systems/GameRegistry.js'
import { COLORS, C, FONT_DISPLAY, FONT_MONO, LEVEL_COLORS } from '../config/theme.js'
import { BrutalUI } from '../ui/BrutalUI.js'

const LEVELS = [
  {
    num: 1, title: 'SHANGHAI',       subtitle: 'THE SPARK',
    teaser: 'STARTUP WEEKEND.  AHA MOMENT.',
    sceneKey: 'ShanghaiScene', scoreKey: KEYS.SCORE_L1, completedKey: KEYS.COMPLETED_L1,
  },
  {
    num: 2, title: 'LATIN AMERICA',  subtitle: 'THE SCALE',
    teaser: '$0 → $1M ARR.  11 COUNTRIES.',
    sceneKey: 'LatinAmericaScene', scoreKey: KEYS.SCORE_L2, completedKey: KEYS.COMPLETED_L2,
  },
  {
    num: 3, title: 'THE RIDE',       subtitle: 'THE ADVENTURE',
    teaser: 'REAL OBSTACLES. NO DETOURS.',
    sceneKey: 'GreenlandScene', scoreKey: KEYS.SCORE_L3, completedKey: KEYS.COMPLETED_L3,
  },
  {
    num: 4, title: 'AGENCY',         subtitle: 'THE STACK',
    teaser: 'CLAY. N8N. CLAUDE CODE.',
    sceneKey: 'AgencyFactoryScene', scoreKey: KEYS.SCORE_L4, completedKey: KEYS.COMPLETED_L4,
  },
  {
    num: 5, title: 'RECALL',         subtitle: 'THE FINALE',
    teaser: 'EVERYTHING YOU LEARNED. NOW PROVE IT.',
    sceneKey: 'InterviewRoomScene', scoreKey: KEYS.SCORE_L5, completedKey: KEYS.COMPLETED_L5,
  },
]

export class LevelSelectHub extends Phaser.Scene {
  constructor() {
    super('LevelSelectHub')
  }

  create() {
    const { width, height } = this.cameras.main
    this.cameras.main.fadeIn(400, 10, 10, 10)
    this.cameras.main.setBackgroundColor(COLORS.BLACK)

    const playerName = this.registry.get(KEYS.PLAYER_NAME) ?? 'friend'

    // Grid background
    const g = this.add.graphics()
    g.lineStyle(1, C.GREY_900, 1)
    for (let x = 0; x < width; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, height); g.strokePath() }
    for (let y = 0; y < height; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(width, y); g.strokePath() }

    // Top bar — brutalist header
    const headerG = this.add.graphics()
    headerG.fillStyle(C.BONE, 1)
    headerG.fillRect(0, 0, width, 110)
    headerG.fillStyle(C.SHOCK_RED, 1)
    headerG.fillRect(0, 100, width, 10)

    this.add.text(60, 40, 'INDEX', {
      fontFamily: FONT_DISPLAY, fontSize: '44px', color: COLORS.BLACK,
    }).setOrigin(0, 0.5)

    this.add.text(60, 78, `${playerName.toUpperCase()}'S EXPEDITION — 5 CHAPTERS`, {
      fontFamily: FONT_MONO, fontSize: '12px', fontStyle: 'bold', color: COLORS.GREY_700,
      letterSpacing: 2,
    }).setOrigin(0, 0.5)

    // Progress tracker (top right)
    const completedCount = LEVELS.filter(l => this.registry.get(l.completedKey)).length
    this.add.text(width - 60, 40, `${completedCount}/${LEVELS.length}`, {
      fontFamily: FONT_DISPLAY, fontSize: '44px', color: COLORS.BLACK,
    }).setOrigin(1, 0.5)
    this.add.text(width - 60, 78, 'CHAPTERS COMPLETED', {
      fontFamily: FONT_MONO, fontSize: '12px', fontStyle: 'bold', color: COLORS.GREY_700,
      letterSpacing: 2,
    }).setOrigin(1, 0.5)

    // Level cards — horizontal row, each with its shock color
    const cardW = 220, cardH = 480
    const gap = 20
    const totalW = cardW * 5 + gap * 4
    const startX = (width - totalW) / 2 + cardW / 2
    const cardY = 390

    LEVELS.forEach((level, i) => {
      this._drawLevelCard(level, startX + (cardW + gap) * i, cardY, cardW, cardH)
    })

    // Footer
    this.add.text(width / 2, height - 20, '▶ CLICK A CHAPTER TO BEGIN · REPLAY TO IMPROVE YOUR SCORE', {
      fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: COLORS.GREY_500,
      letterSpacing: 2,
    }).setOrigin(0.5, 1)

    this.events.once('shutdown', () => {}, this)
  }

  _drawLevelCard(level, x, y, w, h) {
    const completed = this.registry.get(level.completedKey) === true
    const score = this.registry.get(level.scoreKey) ?? 0
    const accent = LEVEL_COLORS[level.num]

    const container = this.add.container(x, y)

    // Drop shadow
    const shadow = this.add.graphics()
    shadow.fillStyle(C.BLACK, 1)
    shadow.fillRect(-w / 2 + 8, -h / 2 + 8, w, h)

    // Card body
    const bg = this.add.graphics()
    bg.fillStyle(C.BONE, 1)
    bg.fillRect(-w / 2, -h / 2, w, h)
    bg.lineStyle(4, C.BLACK, 1)
    bg.strokeRect(-w / 2, -h / 2, w, h)

    // Shock color top band
    const topBand = this.add.graphics()
    topBand.fillStyle(accent.num, 1)
    topBand.fillRect(-w / 2, -h / 2, w, 90)

    // Chapter number (big)
    const num = this.add.text(-w / 2 + 20, -h / 2 + 55, `0${level.num}`, {
      fontFamily: FONT_DISPLAY, fontSize: '64px', color: COLORS.BLACK,
    }).setOrigin(0, 0.5)

    // Completed stamp (top right)
    if (completed) {
      const stamp = BrutalUI.drawSticker(this, w / 2 - 40, -h / 2 + 45, '✓', {
        fill: C.BLACK, textColor: COLORS.BONE, rotation: 8 * Math.PI / 180,
        fontSize: '22px', paddingX: 10, paddingY: 6,
      })
      container.add(stamp)
    }

    // Title
    const title = this.add.text(-w / 2 + 20, -h / 2 + 130, level.title, {
      fontFamily: FONT_DISPLAY, fontSize: '24px', color: COLORS.BLACK,
    }).setOrigin(0, 0.5)

    // Subtitle
    const sub = this.add.text(-w / 2 + 20, -h / 2 + 160, level.subtitle, {
      fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: COLORS.GREY_700,
      letterSpacing: 2,
    }).setOrigin(0, 0.5)

    // Divider rule
    const rule = this.add.graphics()
    rule.lineStyle(2, C.BLACK, 1)
    rule.beginPath(); rule.moveTo(-w / 2 + 20, -h / 2 + 185); rule.lineTo(w / 2 - 20, -h / 2 + 185); rule.strokePath()

    // Teaser / score
    if (completed) {
      const scoreLabel = this.add.text(-w / 2 + 20, -h / 2 + 215, 'SCORE', {
        fontFamily: FONT_MONO, fontSize: '11px', fontStyle: 'bold', color: COLORS.GREY_700,
        letterSpacing: 2,
      }).setOrigin(0, 0.5)
      const scoreValue = this.add.text(-w / 2 + 20, -h / 2 + 255, `${Math.round(score)}%`, {
        fontFamily: FONT_DISPLAY, fontSize: '48px', color: COLORS.BLACK,
      }).setOrigin(0, 0.5)
      container.add([scoreLabel, scoreValue])
    } else {
      const teaser = this.add.text(0, -h / 2 + 235, level.teaser, {
        fontFamily: FONT_MONO, fontSize: '12px', fontStyle: 'bold', color: COLORS.BLACK,
        wordWrap: { width: w - 40 }, align: 'center', lineSpacing: 6,
      }).setOrigin(0.5, 0.5)
      container.add(teaser)
    }

    // PLAY button at bottom
    const btnY = h / 2 - 50
    const btnShadow = this.add.graphics()
    btnShadow.fillStyle(C.BLACK, 1)
    btnShadow.fillRect(-w / 2 + 24, btnY - 22 + 4, w - 48, 44)
    const btnBg = this.add.graphics()
    btnBg.fillStyle(accent.num, 1)
    btnBg.fillRect(-w / 2 + 20, btnY - 22, w - 40, 44)
    btnBg.lineStyle(3, C.BLACK, 1)
    btnBg.strokeRect(-w / 2 + 20, btnY - 22, w - 40, 44)
    const btnText = this.add.text(0, btnY, completed ? 'REPLAY' : 'PLAY ▶', {
      fontFamily: FONT_DISPLAY, fontSize: '18px', color: COLORS.BLACK,
    }).setOrigin(0.5)

    container.add([shadow, bg, topBand, num, title, sub, rule, btnShadow, btnBg, btnText])

    // Click handler on entire card
    const hit = this.add.rectangle(x, y, w, h, 0x000000, 0)
    hit.setInteractive({ useHandCursor: true })
    hit.on('pointerover', () => {
      container.setScale(1.03)
    })
    hit.on('pointerout', () => {
      container.setScale(1)
    })
    hit.on('pointerdown', () => {
      container.setScale(0.97)
      this.time.delayedCall(80, () => this._launchLevel(level))
    })
  }

  _launchLevel(level) {
    if (!level.sceneKey) return
    this.cameras.main.fadeOut(400, 10, 10, 10)
    this.time.delayedCall(420, () => this.scene.start(level.sceneKey))
  }
}

export function completeLevel(scene, scoreKey, completedKey, newScore) {
  const previous = scene.registry.get(scoreKey) ?? 0
  if (newScore > previous) scene.registry.set(scoreKey, newScore)
  scene.registry.set(completedKey, true)
  saveRegistry(scene)
}
