import * as Phaser from 'phaser'
import { KEYS } from '../systems/GameRegistry.js'
import { completeLevel } from './LevelSelectHub.js'

// Level 4 — Agency Factory: n8n node routing + debug
// Stage 1: click nodes in correct order to build a lead pipeline
//   Lead Source → Enrich → Filter → Personalize → Send
// Stage 2: broken pipeline — click the buggy node from a list of diagnoses

const NODE_W = 160
const NODE_H = 70

// Correct pipeline order — node IDs
const PIPELINE_ORDER = ['leadSource', 'enrich', 'filter', 'personalize', 'send']

const NODES = {
  leadSource:  { label: 'Lead Source',   sub: 'Apollo CSV',       x: 200, y: 280, color: 0x3498db },
  enrich:      { label: 'Enrich',        sub: 'Clay API',         x: 400, y: 280, color: 0x9b59b6 },
  filter:      { label: 'Filter',        sub: 'ICP match',        x: 600, y: 280, color: 0xe67e22 },
  personalize: { label: 'Personalize',   sub: 'AI Snippet',       x: 800, y: 280, color: 0xe91e63 },
  send:        { label: 'Send',          sub: 'Instantly SMTP',   x: 1000, y: 280, color: 0x27ae60 },
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

    // --- Terminal-green background ---
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a1a10)

    // Grid backdrop
    const gridColor = 0x1a3a22
    for (let x = 0; x < width; x += 40) {
      this.add.rectangle(x, height / 2, 1, height, gridColor).setAlpha(0.3)
    }
    for (let y = 0; y < height; y += 40) {
      this.add.rectangle(width / 2, y, width, 1, gridColor).setAlpha(0.3)
    }

    // CRT-style scanlines overlay
    for (let y = 0; y < height; y += 4) {
      this.add.rectangle(width / 2, y, width, 1, 0x000000).setAlpha(0.12)
    }

    // Header
    this.add.text(width / 2, 40, 'AGENCY FACTORY v2.0', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#2ecc71',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this._stageText = this.add.text(width / 2, 75, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#66ffaa',
    }).setOrigin(0.5)

    this._instructionText = this.add.text(width / 2, 110, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#aaccaa',
      align: 'center',
    }).setOrigin(0.5)

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

    // Draw all node boxes (in scrambled visual order initially — actual x/y from NODES config)
    Object.entries(NODES).forEach(([id, def]) => {
      this._createNode(id, def)
    })

    // Draw empty connection slots (lines drawn as filled in)
    this._stage1Connections = []
  }

  _createNode(id, def) {
    const bg = this.add.rectangle(def.x, def.y, NODE_W, NODE_H, 0x16211a)
    bg.setStrokeStyle(2, def.color)
    bg.setInteractive({ useHandCursor: true })

    const label = this.add.text(def.x, def.y - 12, def.label, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: `#${def.color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0.5)

    const sub = this.add.text(def.x, def.y + 14, def.sub, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#88aa88',
    }).setOrigin(0.5)

    bg.on('pointerover', () => {
      if (this._stage1Nodes[id]?.wired) return
      bg.setFillStyle(0x1e2e22)
    })
    bg.on('pointerout', () => {
      if (this._stage1Nodes[id]?.wired) return
      bg.setFillStyle(0x16211a)
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
      this._stage1Nodes[id].bg.setFillStyle(0x4a1a1a)
      this.time.delayedCall(300, () => {
        if (!this._stage1Nodes[id].wired) this._stage1Nodes[id].bg.setFillStyle(0x16211a)
      })
      return
    }

    // Correct click — mark wired, draw connection
    const node = this._stage1Nodes[id]
    node.wired = true
    node.bg.setFillStyle(0x1a3a22)
    node.bg.setStrokeStyle(3, 0x2ecc71)
    node.bg.disableInteractive()

    // Draw connection from previous node
    if (this._stage1NextIndex > 0) {
      const prevId = PIPELINE_ORDER[this._stage1NextIndex - 1]
      const prev = this._stage1Nodes[prevId]
      const line = this.add.line(
        0, 0,
        prev.def.x + NODE_W / 2, prev.def.y,
        def.x - NODE_W / 2, def.y,
        0x2ecc71
      ).setOrigin(0, 0).setLineWidth(3)
      // Arrow tip
      const arrow = this.add.text(def.x - NODE_W / 2 - 6, def.y, '▶', {
        fontFamily: 'monospace', fontSize: '14px', color: '#2ecc71',
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
    const flash = this.add.rectangle(640, 280, 900, 100, 0x2ecc71, 0.2)
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 600,
      onComplete: () => flash.destroy(),
    })

    const complete = this.add.text(640, 420, '✓ PIPELINE WIRED', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#2ecc71',
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
    this.children.list.filter(c => c.text === '✓ PIPELINE WIRED').forEach(c => c.destroy())

    this._stage = 2
    this._stage2Start = this.time.now
    this._stage2Errors = 0
    this._stageText.setText('> STAGE 2: DEBUG THE CAMPAIGN')
    this._instructionText.setText(
      'Reply rate tanked from 12% to 0.3%.\nThe campaign has ONE bug. Find it.'
    )

    // Campaign metrics (visual context)
    const metricsY = 190
    this._drawMetricRow(200, metricsY, 'OPEN RATE',     '41%',  0x2ecc71)
    this._drawMetricRow(200, metricsY + 40, 'CLICK RATE', '3.2%', 0x2ecc71)
    this._drawMetricRow(200, metricsY + 80, 'REPLY RATE', '0.3%', 0xe74c3c)
    this._drawMetricRow(200, metricsY + 120, 'BOUNCE',    '1.1%', 0x2ecc71)
    this._drawMetricRow(200, metricsY + 160, 'SPAM',      '0.4%', 0x2ecc71)

    // Context hint
    this.add.text(540, metricsY + 80,
      '↑ Replies collapsed.\n   Not deliverability.\n   Not volume.\n   Look at who you\'re sending to.',
      {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ff8888',
        lineSpacing: 4,
      }
    )

    // Bug options
    const startY = 440
    BUG_OPTIONS.forEach((opt, i) => {
      this._drawBugOption(opt, 640, startY + i * 46)
    })
  }

  _drawMetricRow(x, y, label, value, color) {
    this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '13px', color: '#66aa88',
    })
    this.add.text(x + 160, y, value, {
      fontFamily: 'monospace', fontSize: '16px',
      color: `#${color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    })
  }

  _drawBugOption(opt, x, y) {
    const bg = this.add.rectangle(x, y, 720, 36, 0x16211a).setStrokeStyle(1, 0x2ecc71)
    bg.setInteractive({ useHandCursor: true })

    const txt = this.add.text(x - 340, y, opt.text, {
      fontFamily: 'monospace', fontSize: '13px', color: '#aaccaa',
    }).setOrigin(0, 0.5)

    bg.on('pointerover', () => {
      bg.setFillStyle(0x1e2e22)
      bg.setStrokeStyle(2, 0x66ffaa)
      txt.setColor('#ffffff')
    })
    bg.on('pointerout', () => {
      if (bg._locked) return
      bg.setFillStyle(0x16211a)
      bg.setStrokeStyle(1, 0x2ecc71)
      txt.setColor('#aaccaa')
    })
    bg.on('pointerdown', () => this._clickBug(opt, bg, txt))
  }

  _clickBug(opt, bg, txt) {
    if (bg._locked) return
    if (!opt.correct) {
      this._stage2Errors++
      this.cameras.main.shake(120, 0.006)
      bg.setFillStyle(0x4a1a1a)
      bg.setStrokeStyle(2, 0xe74c3c)
      txt.setColor('#ff6666')
      bg._locked = true
      // Cross it out effect
      this.add.text(bg.x - 340, bg.y, '✗ ' + opt.text, {
        fontFamily: 'monospace', fontSize: '13px', color: '#ff6666',
      }).setOrigin(0, 0.5)
      return
    }

    // Correct!
    bg.setFillStyle(0x1a3a22)
    bg.setStrokeStyle(3, 0x2ecc71)
    txt.setColor('#2ecc71')
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

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.88)

    this.add.text(width / 2, 180, 'CAMPAIGN FIXED.', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#2ecc71',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, 260,
      `Build it. Break it. Fix it.\nThat's what the agency years taught you.`,
      {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 8,
      }
    ).setOrigin(0.5)

    this.add.text(width / 2, 380, `Score: ${score}%`, {
      fontFamily: 'monospace', fontSize: '20px', color: '#888899',
    }).setOrigin(0.5)

    this.add.text(width / 2, 420, `+${techGain} Tech`, {
      fontFamily: 'monospace', fontSize: '18px', color: '#00ff88',
    }).setOrigin(0.5)

    this.add.text(width / 2, 540,
      `"You could keep running the agency.\nBut you want to build, not manage..."`,
      {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#666677',
        align: 'center',
        fontStyle: 'italic',
        lineSpacing: 6,
      }
    ).setOrigin(0.5)

    this.add.text(width / 2, 650, 'PRESS SPACE to return to the hub', {
      fontFamily: 'monospace', fontSize: '12px', color: '#444455',
    }).setOrigin(0.5)

    const returnToHub = () => {
      this.cameras.main.fadeOut(400, 0, 0, 0)
      this.time.delayedCall(420, () => this.scene.start('LevelSelectHub'))
    }
    this.input.keyboard.once('keydown-SPACE', returnToHub)
    this.time.delayedCall(8000, returnToHub)
  }
}
