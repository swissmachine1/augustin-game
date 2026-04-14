import * as Phaser from 'phaser'
import { KEYS } from '../systems/GameRegistry.js'
import { completeLevel } from './LevelSelectHub.js'

// Level 5 — Interview Room: Defend your CV
// Rapid-fire questions. Response options vary in nuance based on stats earned.
// High-stat unlocks the sharpest answer; low-stat players still get a complete
// (but less nuanced) answer. Ends with Recruiter Report Card + soft CTAs.

const STAT_THRESHOLD = 30  // Need at least this value to "unlock" stat-gated response

// Each question has 3 response options:
//   - basic: always available
//   - nuanced: requires one or more stats above STAT_THRESHOLD
//   - best: requires higher stats (locked if not earned)
// Score is based on which option the player picks.
const QUESTIONS = [
  {
    q: 'So, tell me your story in one sentence.',
    options: [
      {
        text: 'I went from law school in Switzerland to $1M ARR in Latin America.',
        score: 40, gate: null,
      },
      {
        text: 'I build go-to-market systems in places that don\'t yet have a playbook.',
        score: 70, gate: [KEYS.STAT_CURIOSITY, KEYS.STAT_SALES],
      },
      {
        text: 'I\'m a GTM operator who treats every new market as a product problem.',
        score: 100, gate: [KEYS.STAT_CURIOSITY, KEYS.STAT_SALES, KEYS.STAT_TECH],
      },
    ],
  },
  {
    q: 'Why do you want to work at a startup specifically?',
    options: [
      {
        text: 'I like fast-moving environments.',
        score: 30, gate: null,
      },
      {
        text: 'Startups reward initiative. I built a $1M pipeline with zero playbook.',
        score: 70, gate: [KEYS.STAT_SALES],
      },
      {
        text: 'Because I\'ve done it cold before — new market, no Spanish, no network — and I want leverage, not instructions.',
        score: 100, gate: [KEYS.STAT_SALES, KEYS.STAT_INDEPENDENCE],
      },
    ],
  },
  {
    q: 'What\'s a time you failed?',
    options: [
      {
        text: 'I\'ve had campaigns that tanked. I fixed them.',
        score: 30, gate: null,
      },
      {
        text: 'Greenland. I almost didn\'t make it. I learned where my limit is, then I raised it.',
        score: 70, gate: [KEYS.STAT_GRIT],
      },
      {
        text: 'Running the agency alone. I burned out trying to be everyone. I learned that the best work happens in teams.',
        score: 100, gate: [KEYS.STAT_GRIT, KEYS.STAT_EQ],
      },
    ],
  },
  {
    q: 'Tell me about a technical skill you\'ve built.',
    options: [
      {
        text: 'I know SQL and a few tools like Clay and n8n.',
        score: 30, gate: null,
      },
      {
        text: 'I built lead pipelines with Clay, n8n, and Instantly — enriched, filtered, sent at scale.',
        score: 70, gate: [KEYS.STAT_TECH],
      },
      {
        text: 'I can debug a campaign end-to-end: SPF, deliverability, ICP match, copy. Most GTM people can\'t.',
        score: 100, gate: [KEYS.STAT_TECH],
      },
    ],
  },
  {
    q: 'Why you? Why now?',
    options: [
      {
        text: 'I\'m a hard worker and I learn fast.',
        score: 30, gate: null,
      },
      {
        text: 'I\'ve done the hard version of this job. I know what breaks, and I know how to fix it.',
        score: 70, gate: [KEYS.STAT_SALES, KEYS.STAT_TECH],
      },
      {
        text: 'I\'ve built from zero three times. I\'m past the learning curve. You won\'t need to teach me the basics.',
        score: 100, gate: [KEYS.STAT_SALES, KEYS.STAT_TECH, KEYS.STAT_CURIOSITY, KEYS.STAT_GRIT],
      },
    ],
  },
]

export class InterviewRoomScene extends Phaser.Scene {
  constructor() {
    super('InterviewRoomScene')
  }

  create() {
    const { width, height } = this.cameras.main
    this.cameras.main.fadeIn(500, 0, 0, 0)

    this._playerName = this.registry.get(KEYS.PLAYER_NAME) ?? 'friend'
    this._currentQ = 0
    this._totalScore = 0
    this._answers = []

    // Clean office aesthetic: warm off-white with wood accent
    this.add.rectangle(width / 2, height / 2, width, height, 0xf5f1e8)

    // Subtle wood-grain strip at top (interviewer's desk edge)
    this.add.rectangle(width / 2, 180, width, 4, 0x8b6f47).setAlpha(0.4)
    this.add.rectangle(width / 2, 120, width, 120, 0xe8ddc8)

    // Interviewer silhouette (top, behind desk)
    this._drawInterviewer()

    // Question container
    this._qContainer = this.add.container(0, 0)

    // Scene title
    this.add.text(width / 2, 30, 'THE INTERVIEW ROOM', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#8b6f47',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this._drawQuestion()

    this.events.once('shutdown', () => {
      this.input.keyboard.removeAllListeners()
    }, this)
  }

  _drawInterviewer() {
    const { width } = this.cameras.main
    // Head (circle)
    this.add.circle(width / 2, 90, 22, 0x3a2e20)
    // Shoulders (trapezoid ish — two rectangles)
    this.add.rectangle(width / 2, 140, 90, 44, 0x2c3e50)
    // Desk name plate
    this.add.rectangle(width / 2, 180, 220, 20, 0x8b6f47)
    this.add.text(width / 2, 180, 'HIRING MANAGER', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#f5f1e8',
      fontStyle: 'bold',
    }).setOrigin(0.5)
  }

  _drawQuestion() {
    this._qContainer.removeAll(true)
    const { width, height } = this.cameras.main

    if (this._currentQ >= QUESTIONS.length) {
      this._showReportCard()
      return
    }

    const question = QUESTIONS[this._currentQ]

    // Progress indicator
    const progress = this.add.text(width / 2, 230,
      `Question ${this._currentQ + 1} of ${QUESTIONS.length}`,
      {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#aaa',
      }
    ).setOrigin(0.5).setAlpha(0)
    this._qContainer.add(progress)
    this.tweens.add({ targets: progress, alpha: 1, duration: 300 })

    // Speech bubble pointer (small triangle)
    const triangle = this.add.triangle(width / 2, 210, 0, 0, -10, -12, 10, -12, 0xffffff)
    triangle.setStrokeStyle(1, 0xc9b79a)
    this._qContainer.add(triangle)

    // Question bubble
    const bubble = this.add.rectangle(width / 2, 280, width - 200, 80, 0xffffff)
    bubble.setStrokeStyle(2, 0xc9b79a)
    this._qContainer.add(bubble)

    // Interviewer addresses by name on Q1
    const prefix = this._currentQ === 0 ? `So ${this._playerName}, ` : ''
    const qText = this.add.text(width / 2, 280, prefix + question.q, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#2c3e50',
      align: 'center',
      wordWrap: { width: width - 240 },
    }).setOrigin(0.5).setAlpha(0)
    this._qContainer.add(qText)
    this.tweens.add({ targets: qText, alpha: 1, duration: 500, delay: 200 })

    // Options (render each as a clickable card)
    const startY = 400
    const spacing = 90
    question.options.forEach((opt, i) => {
      const unlocked = this._isUnlocked(opt)
      this._drawOption(opt, width / 2, startY + i * spacing, unlocked, i)
    })
  }

  _isUnlocked(opt) {
    if (!opt.gate) return true
    return opt.gate.every(statKey => {
      const val = this.registry.get(statKey) ?? 0
      return val >= STAT_THRESHOLD
    })
  }

  _drawOption(opt, x, y, unlocked, index) {
    const { width } = this.cameras.main
    const cardW = width - 240

    // Option card background
    const bg = this.add.rectangle(x, y, cardW, 72,
      unlocked ? 0xffffff : 0xeeeae0
    )
    bg.setStrokeStyle(2, unlocked ? 0xc9b79a : 0xd4cdbd)
    this._qContainer.add(bg)

    // Text
    const textColor = unlocked ? '#2c3e50' : '#aaa098'
    const txt = this.add.text(x, y, opt.text, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: textColor,
      align: 'center',
      wordWrap: { width: cardW - 40 },
    }).setOrigin(0.5)
    this._qContainer.add(txt)

    // Lock badge if gated
    if (!unlocked) {
      const lock = this.add.text(x - cardW / 2 + 24, y, '🔒', {
        fontFamily: 'monospace',
        fontSize: '16px',
      }).setOrigin(0.5)
      this._qContainer.add(lock)

      const statList = opt.gate.map(k => this._statLabel(k)).join(', ')
      const reqText = this.add.text(x + cardW / 2 - 16, y, `needs ${statList}`, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#b8a890',
        fontStyle: 'italic',
      }).setOrigin(1, 0.5)
      this._qContainer.add(reqText)
    }

    // Fade in
    bg.setAlpha(0); txt.setAlpha(0)
    this.tweens.add({ targets: [bg, txt], alpha: 1, duration: 400, delay: 500 + index * 200 })

    if (unlocked) {
      bg.setInteractive({ useHandCursor: true })
      bg.on('pointerover', () => {
        bg.setStrokeStyle(3, 0x8b6f47)
        bg.setFillStyle(0xfffaef)
      })
      bg.on('pointerout', () => {
        bg.setStrokeStyle(2, 0xc9b79a)
        bg.setFillStyle(0xffffff)
      })
      bg.on('pointerdown', () => this._pickOption(opt))
    }
  }

  _statLabel(key) {
    const map = {
      [KEYS.STAT_CURIOSITY]:    'Curiosity',
      [KEYS.STAT_SALES]:        'Sales',
      [KEYS.STAT_EQ]:           'EQ',
      [KEYS.STAT_GRIT]:         'Grit',
      [KEYS.STAT_INDEPENDENCE]: 'Independence',
      [KEYS.STAT_TECH]:         'Tech',
    }
    return map[key] ?? key
  }

  _pickOption(opt) {
    this._answers.push(opt.score)
    this._totalScore += opt.score

    // Disable all clicks
    this._qContainer.each(c => c.disableInteractive && c.disableInteractive())

    this._currentQ++
    this.cameras.main.fadeOut(300, 245, 241, 232)  // fade to the cream bg color
    this.time.delayedCall(320, () => {
      this.cameras.main.fadeIn(300, 245, 241, 232)
      this._drawQuestion()
    })
  }

  _showReportCard() {
    const { width, height } = this.cameras.main
    this._qContainer.removeAll(true)

    // Final score as percentage (max possible = 5 questions * 100 = 500)
    const maxPossible = QUESTIONS.length * 100
    const scorePct = Math.round((this._totalScore / maxPossible) * 100)

    // Mark level complete
    completeLevel(this, KEYS.SCORE_L5, KEYS.COMPLETED_L5, scorePct)

    // Report card overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0xf5f1e8)

    this.add.text(width / 2, 60, 'RECRUITER REPORT CARD', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#2c3e50',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, 100, this._playerName + '\'s assessment', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#8b6f47',
    }).setOrigin(0.5)

    // Draw all stats as horizontal bars
    const statOrder = [
      [KEYS.STAT_CURIOSITY,    'Curiosity',    0x00ff88],
      [KEYS.STAT_SALES,        'Sales',        0xe67e22],
      [KEYS.STAT_EQ,           'EQ',           0xe91e63],
      [KEYS.STAT_GRIT,         'Grit',         0x5dade2],
      [KEYS.STAT_INDEPENDENCE, 'Independence', 0x8b6f47],
      [KEYS.STAT_TECH,         'Tech',         0x2ecc71],
    ]

    const barStartY = 160
    const barSpacing = 34
    statOrder.forEach(([key, label, color], i) => {
      const value = Math.min(100, this.registry.get(key) ?? 0)
      const y = barStartY + i * barSpacing

      this.add.text(280, y, label, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#2c3e50',
      }).setOrigin(0, 0.5)

      // Bar background
      this.add.rectangle(460, y, 480, 16, 0xe0d6c5).setOrigin(0, 0.5).setStrokeStyle(1, 0xc9b79a)

      // Fill
      this.add.rectangle(462, y, 476 * (value / 100), 12, color).setOrigin(0, 0.5)

      // Value
      this.add.text(960, y, `${Math.round(value)}`, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#8b6f47',
      }).setOrigin(0, 0.5)
    })

    // Interview score
    this.add.text(width / 2, 380, `Interview Score: ${scorePct}%`, {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#2c3e50',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // Verdict
    let verdict = 'Solid candidate.'
    if (scorePct >= 80) verdict = 'Strong hire. When can you start?'
    else if (scorePct >= 60) verdict = 'Sharp interview. Let\'s schedule a follow-up.'
    else if (scorePct >= 40) verdict = 'Good fundamentals. Play more levels to unlock deeper answers.'
    else verdict = 'Replay earlier levels to earn stats that unlock better responses.'

    this.add.text(width / 2, 420, verdict, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#8b6f47',
      fontStyle: 'italic',
      align: 'center',
      wordWrap: { width: width - 200 },
    }).setOrigin(0.5)

    // Soft CTAs
    this.add.text(width / 2, 490, `Thanks for playing, ${this._playerName}.`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#2c3e50',
    }).setOrigin(0.5)

    this.add.text(width / 2, 520, 'If you want to chat:', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#8b6f47',
    }).setOrigin(0.5)

    // 3 CTA buttons
    this._drawCTA(width / 2 - 220, 580, '📞 Book a call',
      'https://calendly.com/augustinromaneschi')
    this._drawCTA(width / 2, 580, '💼 LinkedIn',
      'https://linkedin.com/in/augustinr')
    this._drawCTA(width / 2 + 220, 580, '📄 Download CV',
      null)  // null = scroll-to-top placeholder; replace with real CV link when uploaded

    // Return to hub
    this.add.text(width / 2, 680, 'PRESS SPACE or ESC to return to the hub', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#aaa098',
    }).setOrigin(0.5)

    const returnToHub = () => {
      this.cameras.main.fadeOut(400, 245, 241, 232)
      this.time.delayedCall(420, () => this.scene.start('LevelSelectHub'))
    }
    this.input.keyboard.once('keydown-SPACE', returnToHub)
    this.input.keyboard.once('keydown-ESC', returnToHub)
  }

  _drawCTA(x, y, label, url) {
    const bg = this.add.rectangle(x, y, 200, 50, 0x2c3e50)
    bg.setStrokeStyle(2, 0x8b6f47)
    bg.setInteractive({ useHandCursor: true })

    this.add.text(x, y, label, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#f5f1e8',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    bg.on('pointerover', () => {
      bg.setFillStyle(0x34495e)
      bg.setStrokeStyle(3, 0xf1c40f)
    })
    bg.on('pointerout', () => {
      bg.setFillStyle(0x2c3e50)
      bg.setStrokeStyle(2, 0x8b6f47)
    })
    bg.on('pointerdown', () => {
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    })
  }
}
