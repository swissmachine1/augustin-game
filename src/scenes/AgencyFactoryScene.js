import * as Phaser from 'phaser'
import { KEYS } from '../systems/GameRegistry.js'
import { completeLevel } from './LevelSelectHub.js'
import { COLORS, TEXT, C, FONT } from '../config/theme.js'
import { JournalUI } from '../ui/JournalUI.js'

// Level 4 — Agency Factory: n8n node routing + debug
// Stage 1: click nodes in correct order to build a lead pipeline
//   Lead Source → Enrich → Filter → Personalize → Send
// Stage 2: broken pipeline — click the buggy node from a list of diagnoses
// Visual: "engineering notebook" — graph paper grid, ink-colored nodes

const NODE_W = 160
const NODE_H = 70

// Correct pipeline order — node IDs
const PIPELINE_ORDER = ['leadSource', 'enrich', 'filter', 'personalize', 'send']

const NODES = {
  leadSource:  { label: 'Lead Source',   sub: 'Apollo CSV',       x: 200, y: 280 },
  enrich:      { label: 'Enrich',        sub: 'Clay API',         x: 400, y: 280 },
  filter:      { label: 'Filter',        sub: 'ICP match',        x: 600, y: 280 },
  personalize: { label: 'Personalize',   sub: 'AI Snippet',       x: 800, y: 280 },
  send:        { label: 'Send',          sub: 'Instantly SMTP',   x: 1000, y: 280 },
}

// Stage 2 — the broken campaign. Bug options presented to player.
const BUG_OPTIONS = [
  { id: 'sending', text: 'Sending volume too high — domain burn',     correct: false },
  { id: 'copy',    text: 'Copy mentions wrong competitor name',        correct: false },
  { id: 'filter',  text: 'Filter skipped — sending to non-ICP leads',  correct: true },
  { id: 'timing',  text: 'Send window crosses timezone boundaries',    correct: false },
  { id: 'deliv',   text: 'SPF record missing on sender domain',        correct: false },
]

export class AgencyFactoryScene extends Phaser.Scene {
  constructor() {
    super('AgencyFactoryScene')
  }

  create() {
    const { width, height } = this.cameras.main
    this.cameras.main.fadeIn(400, 0, 0, 0)

    this._playerName = this.registry.get(KEYS.PLAYER_NAME) ?? 'friend'
    this._stage = 1
    this._stage1Start = this.time.now
    this._stage1Errors = 0  // wrong clicks
    this._stage1NextIndex = 0
    this._stage1Nodes = {}

    // --- Parchment background ---
    JournalUI.drawParchment(this, 0, 0, 1280, 720)

    // Graph paper grid (engineering notebook style)
    const gridG = this.add.graphics()
    gridG.lineStyle(0.3, C.INK_FADED, 0.15)
    for (let x = 0; x < width; x += 40) {
      gridG.beginPath()
      gridG.moveTo(x, 0)
      gridG.lineTo(x, height)
      gridG.strokePath()
    }
    for (let y = 0; y < height; y += 40) {
      gridG.beginPath()
      gridG.moveTo(0, y)
      gridG.lineTo(width, y)
      gridG.strokePath()
    }

    // Header
    this.add.text(width / 2, 40, 'AGENCY FACTORY v2.0', {
      ...TEXT.title,
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this._stageText = this.add.text(width / 2, 75, '', {
      ...TEXT.heading,
      fontSize: '14px',
      color: COLORS.INK_LIGHT,
    }).setOrigin(0.5)

    this._instructionText = this.add.text(width / 2, 110, '', {
      ...TEXT.body,
      color: COLORS.INK_LIGHT,
      align: 'center',
    }).setOrigin(0.5)

    // Page number
    JournalUI.drawPageNumber(this, 8)

    // Start with Stage 1
    this._startStage1()

    this.events.once('shutdown', () => {
      this.input.keyboard.removeAllListeners()
    }, this)
  }

  // ========================================================================
  // STAGE 1 — Build the pipeline
  // ========================================================================

  _startStage1() {
    this._stage = 1
    this._stageText.setText('> STAGE 1: BUILD THE PIPELINE')
    this._instructionText.setText(
      'Click the nodes IN THE RIGHT ORDER to wire the campaign.\nStart with the lead source, end with send.'
    )

    // Draw all node boxes
    Object.entries(NODES).forEach(([id, def]) => {
      this._createNode(id, def)
    })

    // Draw empty connection slots (lines drawn as filled in)
    this._stage1Connections = []
  }

  _createNode(id, def) {
    const bg = this.add.rectangle(def.x, def.y, NODE_W, NODE_H, C.PARCHMENT_DARK, 0.5)
    bg.setStrokeStyle(1, C.INK, 0.4)
    bg.setInteractive({ useHandCursor: true })

    const label = this.add.text(def.x, def.y - 12, def.label, {
      ...TEXT.heading,
      fontSize: '14px',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    const sub = this.add.text(def.x, def.y + 14, def.sub, {
      ...TEXT.label,
    }).setOrigin(0.5)

    bg.on('pointerover', () => {
      if (this._stage1Nodes[id]?.wired) return
      bg.setFillStyle(C.PARCHMENT_DARK, 0.8)
    })
    bg.on('pointerout', () => {
      if (this._stage1Nodes[id]?.wired) return
      bg.setFillStyle(C.PARCHMENT_DARK, 0.5)
    })
    bg.on('pointerdown', () => this._clickNode(id, def))

    this._stage1Nodes[id] = { bg, label, sub, def, wired: false }
  }

  _clickNode(id, def) {
    const expected = PIPELINE_ORDER[this._stage1NextIndex]

    if (id !== expected) {
      // Wrong click — red flash
      this._stage1Errors++
      this.cameras.main.shake(120, 0.006)
      this._stage1Nodes[id].bg.setFillStyle(C.WAX_RED, 0.3)
      this.time.delayedCall(300, () => {
        if (!this._stage1Nodes[id].wired) this._stage1Nodes[id].bg.setFillStyle(C.PARCHMENT_DARK, 0.5)
      })
      return
    }

    // Correct click — mark wired, draw connection
    const node = this._stage1Nodes[id]
    node.wired = true
    node.bg.setFillStyle(C.PARCHMENT_DARK, 0.8)
    node.bg.setStrokeStyle(2, C.STAMP_GREEN, 0.7)
    node.bg.disableInteractive()

    // Draw connection from previous node
    if (this._stage1NextIndex > 0) {
      const prevId = PIPELINE_ORDER[this._stage1NextIndex - 1]
      const prev = this._stage1Nodes[prevId]
      const line = this.add.line(
        0, 0,
        prev.def.x + NODE_W / 2, prev.def.y,
        def.x - NODE_W / 2, def.y,
        C.INK
      ).setOrigin(0, 0).setLineWidth(1.5)
      // Arrow tip
      const arrow = this.add.text(def.x - NODE_W / 2 - 6, def.y, '\u25B6', {
        fontFamily: FONT, fontSize: '14px', color: COLORS.INK,
      }).setOrigin(0.5)
      this._stage1Connections.push(line, arrow)
    }

    this._stage1NextIndex++

    // Check completion
    if (this._stage1NextIndex >= PIPELINE_ORDER.length) {
      this.time.delayedCall(600, () => this._endStage1())
    }
  }

  _endStage1() {
    this._stage1Duration = (this.time.now - this._stage1Start) / 1000

    // Celebrate
    const flash = this.add.rectangle(640, 280, 900, 100, C.STAMP_GREEN, 0.1)
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 600,
      onComplete: () => flash.destroy(),
    })

    const complete = this.add.text(640, 420, '\u2713 PIPELINE WIRED', {
      ...TEXT.stamp,
      fontSize: '20px',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0)

    this.tweens.add({ targets: complete, alpha: 1, duration: 400 })

    this.time.delayedCall(2000, () => this._startStage2())
  }

  // ========================================================================
  // STAGE 2 — Debug the broken campaign
  // ========================================================================

  _startStage2() {
    // Clear stage 1 elements
    Object.values(this._stage1Nodes).forEach(n => {
      n.bg.destroy()
      n.label.destroy()
      n.sub.destroy()
    })
    this._stage1Connections.forEach(c => c.destroy())
    this.children.list.filter(c => c.text === '\u2713 PIPELINE WIRED').forEach(c => c.destroy())

    this._stage = 2
    this._stage2Start = this.time.now
    this._stage2Errors = 0
    this._stageText.setText('> STAGE 2: DEBUG THE CAMPAIGN')
    this._instructionText.setText(
      'Reply rate tanked from 12% to 0.3%.\nThe campaign has ONE bug. Find it.'
    )

    // Campaign metrics (visual context)
    const metricsY = 190
    this._drawMetricRow(200, metricsY, 'OPEN RATE',     '41%',  false)
    this._drawMetricRow(200, metricsY + 40, 'CLICK RATE', '3.2%', false)
    this._drawMetricRow(200, metricsY + 80, 'REPLY RATE', '0.3%', true)
    this._drawMetricRow(200, metricsY + 120, 'BOUNCE',    '1.1%', false)
    this._drawMetricRow(200, metricsY + 160, 'SPAM',      '0.4%', false)

    // Context hint
    this.add.text(540, metricsY + 80,
      '\u2191 Replies collapsed.\n   Not deliverability.\n   Not volume.\n   Look at who you\'re sending to.',
      {
        ...TEXT.bodyItalic,
        color: COLORS.WAX_RED,
        lineSpacing: 4,
      }
    )

    // Bug options
    const startY = 440
    BUG_OPTIONS.forEach((opt, i) => {
      this._drawBugOption(opt, 640, startY + i * 46)
    })
  }

  _drawMetricRow(x, y, label, value, isAlert) {
    this.add.text(x, y, label, {
      ...TEXT.body,
      color: COLORS.INK_LIGHT,
    })
    this.add.text(x + 160, y, value, {
      ...TEXT.heading,
      fontSize: '15px',
      color: isAlert ? COLORS.WAX_RED : COLORS.STAMP_GREEN,
      fontStyle: 'bold',
    })
  }

  _drawBugOption(opt, x, y) {
    const bg = this.add.rectangle(x, y, 720, 36, C.PARCHMENT_DARK, 0.4).setStrokeStyle(0.5, C.INK, 0.3)
    bg.setInteractive({ useHandCursor: true })

    const txt = this.add.text(x - 340, y, opt.text, {
      ...TEXT.body,
      color: COLORS.INK_LIGHT,
    }).setOrigin(0, 0.5)

    bg.on('pointerover', () => {
      bg.setFillStyle(C.PARCHMENT_DARK, 0.7)
      bg.setStrokeStyle(1, C.INK, 0.5)
      txt.setColor(COLORS.INK)
    })
    bg.on('pointerout', () => {
      if (bg._locked) return
      bg.setFillStyle(C.PARCHMENT_DARK, 0.4)
      bg.setStrokeStyle(0.5, C.INK, 0.3)
      txt.setColor(COLORS.INK_LIGHT)
    })
    bg.on('pointerdown', () => this._clickBug(opt, bg, txt))
  }

  _clickBug(opt, bg, txt) {
    if (bg._locked) return
    if (!opt.correct) {
      this._stage2Errors++
      this.cameras.main.shake(120, 0.006)
      bg.setFillStyle(C.WAX_RED, 0.15)
      bg.setStrokeStyle(1, C.WAX_RED, 0.5)
      txt.setColor(COLORS.WAX_RED)
      bg._locked = true
      // Cross it out effect
      this.add.text(bg.x - 340, bg.y, '\u2717 ' + opt.text, {
        fontFamily: FONT, fontSize: '13px', color: COLORS.WAX_RED,
      }).setOrigin(0, 0.5)
      return
    }

    // Correct!
    bg.setFillStyle(C.PARCHMENT_DARK, 0.8)
    bg.setStrokeStyle(2, C.STAMP_GREEN, 0.7)
    txt.setColor(COLORS.STAMP_GREEN)
    bg._locked = true

    this.time.delayedCall(800, () => this._finish())
  }

  // ========================================================================
  // FINISH
  // ========================================================================

  _finish() {
    const { width, height } = this.cameras.main

    // Scoring: stage 1 speed + error penalty, stage 2 first-try bonus
    const stage1Fast = this._stage1Duration < 15
    const stage1Base = stage1Fast ? 50 : Math.max(20, 50 - (this._stage1Duration - 15) * 1.5)
    const stage1Score = Math.round(stage1Base - this._stage1Errors * 5)

    const stage2Score = this._stage2Errors === 0 ? 50 : Math.max(20, 50 - this._stage2Errors * 10)

    const score = Math.max(0, Math.min(100, Math.round(stage1Score + stage2Score)))

    const curTech = this.registry.get(KEYS.STAT_TECH) ?? 0
    const techGain = Math.round(score / 4)
    this.registry.set(KEYS.STAT_TECH, Math.min(100, curTech + techGain))

    completeLevel(this, KEYS.SCORE_L4, KEYS.COMPLETED_L4, score)

    this.add.rectangle(width / 2, height / 2, width, height, C.PARCHMENT, 0.92)

    this.add.text(width / 2, 180, 'CAMPAIGN FIXED.', {
      ...TEXT.title,
      fontSize: '30px',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, 260,
      `Build it. Break it. Fix it.\nThat's what the agency years taught you.`,
      {
        ...TEXT.chapter,
        fontSize: '17px',
        align: 'center',
        lineSpacing: 8,
      }
    ).setOrigin(0.5)

    this.add.text(width / 2, 380, `Score: ${score}%`, {
      ...TEXT.body,
      fontSize: '18px',
      color: COLORS.INK_FADED,
    }).setOrigin(0.5)

    this.add.text(width / 2, 420, `+${techGain} Tech`, {
      ...TEXT.stamp,
      fontSize: '16px',
    }).setOrigin(0.5)

    this.add.text(width / 2, 540,
      `"You could keep running the agency.\nBut you want to build, not manage..."`,
      {
        ...TEXT.prompt,
        align: 'center',
        lineSpacing: 6,
      }
    ).setOrigin(0.5)

    this.add.text(width / 2, 650, 'PRESS SPACE to return to the hub', {
      ...TEXT.small,
      color: COLORS.INK_FADED,
    }).setOrigin(0.5)

    const returnToHub = () => {
      this.cameras.main.fadeOut(400, 0, 0, 0)
      this.time.delayedCall(420, () => this.scene.start('LevelSelectHub'))
    }
    this.input.keyboard.once('keydown-SPACE', returnToHub)
    this.time.delayedCall(8000, returnToHub)
  }
}
