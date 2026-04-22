import * as Phaser from 'phaser'
import { KEYS } from '../systems/GameRegistry.js'
import { completeLevel } from './LevelSelectHub.js'
import { COLORS, TEXT, C, FONT } from '../config/theme.js'
import { JournalUI } from '../ui/JournalUI.js'

// Level 2 — Latin America: CRACK THE MARKET
// A memory-match game. Match each challenge to the skill it forged.

const PAIRS = [
  {
    id: 0,
    challenge: 'No Spanish',
    skill: 'Adaptability',
    insight: `No hablaba espanol. So I learned to sell with diagrams on napkins, body language, and sheer persistence. The language came later. The deals came first.`,
    wild: false,
  },
  {
    id: 1,
    challenge: 'Zero network\nin LatAm',
    skill: 'Cold outreach\nmastery',
    insight: `I had nobody's number. So I cold-emailed every KOL I could find, showed up at conferences uninvited, and turned strangers into partners.`,
    wild: false,
  },
  {
    id: 2,
    challenge: 'Cultural differences\nacross 11 countries',
    skill: 'Cross-cultural EQ',
    insight: `What closes in Colombia offends in Chile. I learned to read the room before I opened my mouth — and to never assume two Latin countries work the same way.`,
    wild: false,
  },
  {
    id: 3,
    challenge: 'Training doctors\nremotely',
    skill: 'Consultative\nselling',
    insight: `You can't hard-sell a surgeon. I learned to teach first, prove value second, and let the product speak through results.`,
    wild: false,
  },
  {
    id: 4,
    challenge: '11 countries,\n11 regulations',
    skill: 'Navigating\ncomplexity',
    insight: `Every country had its own medical device rules, tax codes, and approval timelines. I built a spreadsheet that became my bible.`,
    wild: false,
  },
  {
    id: 5,
    challenge: 'Solo in Medellin,\nno backup',
    skill: 'Independence\n& grit',
    insight: `No team. No office. Just a laptop in a coworking space and a list of 200 doctors. Some weeks the only voice I heard was my own pitch.`,
    wild: false,
  },
  {
    id: 6,
    challenge: 'Convincing\nskeptical KOLs',
    skill: 'Stakeholder\nmanagement',
    insight: `Senior surgeons don't take meetings with 25-year-olds. I earned the first meeting through a published case study. I earned the second by remembering their daughter's name.`,
    wild: false,
  },
  {
    id: 7,
    challenge: 'No marketing\nbudget',
    skill: 'Scrappy GTM',
    insight: `Zero ad spend. I built the pipeline with WhatsApp groups, conference hallway ambushes, and a demo that fit in my backpack.`,
    wild: false,
  },
  {
    id: 8,
    challenge: 'Product-market fit\nin a new continent',
    skill: 'Market research',
    insight: `The product worked in Europe. Latin America wanted something different. I spent 3 months just listening before I pitched a single feature change.`,
    wild: false,
  },
  {
    id: 9,
    challenge: 'Hiring across\nborders',
    skill: 'Remote\nleadership',
    insight: `My first hire was in Bogota. My second in Mexico City. I managed a team across 4 time zones before I had a single direct report in the same room.`,
    wild: false,
  },
  {
    id: 10,
    challenge: '$0 → $1M ARR',
    skill: '11 Countries\nConquered',
    insight: `From a one-way ticket to Medellin to a million in recurring revenue across an entire continent. Not bad for someone who couldn't order coffee in Spanish.`,
    wild: true,
  },
  {
    id: 11,
    challenge: 'Building trust\nacross borders',
    skill: 'Relationship\nbuilding',
    insight: `Business in Latin America runs on relationships, not contracts. I learned that a 2-hour lunch matters more than a 20-page proposal.`,
    wild: false,
  },
]

const CARD_W = 150
const CARD_H = 90
const GRID_X = 20
const GRID_Y = 140
const H_GAP = 16
const V_GAP = 14
const COLS = 6
const ROWS = 4

export class LatinAmericaScene extends Phaser.Scene {
  constructor() {
    super('LatinAmericaScene')
  }

  create() {
    this.cameras.main.fadeIn(500, 0, 0, 0)

    // State
    this._cards = []
    this._firstPick = null
    this._inputLocked = true
    this._gameActive = false
    this._timerStarted = false
    this._gameStartTime = 0
    this._moves = 0
    this._pairsFound = 0
    this._ended = false
    this._insightText = null
    this._matchLabel = null
    this._shutdownHandlers = []

    // Background
    JournalUI.drawParchment(this, 0, 0, 1280, 720)
    this._drawLatAmOutlines()

    // Scattered passport stamps in margins
    JournalUI.drawPassportStamp(this, 60, 670, 'COLOMBIA', 2019, -12)
    JournalUI.drawPassportStamp(this, 1120, 90, 'BRASIL', 2020, 8)

    // Header
    this._drawHeader()

    // Right panel
    this._drawRightPanel()

    // Intro narration (above grid)
    this._intro = this.add.text(500, 110,
      'No Spanish. No network. No experience.\nMatch each challenge to the skill it forged.',
      {
        ...TEXT.bodyItalic,
        fontSize: '13px',
        color: COLORS.INK_LIGHT,
        align: 'center',
        lineSpacing: 3,
      }
    ).setOrigin(0.5).setAlpha(0)

    this.tweens.add({ targets: this._intro, alpha: 1, duration: 400, delay: 600 })

    // Build & place cards
    this._buildAndPlaceCards()

    // Prompt below grid
    this._prompt = this.add.text(500, 570, 'Click any card to begin', {
      ...TEXT.small,
      fontSize: '12px',
    }).setOrigin(0.5).setAlpha(0)

    // Page number
    JournalUI.drawPageNumber(this, 4)

    // Kick off opening sequence
    this.time.delayedCall(1000, () => this._startOpening())

    // Shutdown cleanup
    this.events.once('shutdown', () => {
      this.input.keyboard.removeAllListeners()
      this._shutdownHandlers.forEach(fn => fn())
      this._shutdownHandlers = []
    }, this)
  }

  update(time, delta) {
    if (!this._timerStarted || this._ended) return
    const elapsed = Math.floor((time - this._gameStartTime) / 1000)
    const min = Math.floor(elapsed / 60)
    const sec = elapsed % 60
    if (this._timerText) {
      this._timerText.setText(`${min}:${sec.toString().padStart(2, '0')}`)
    }
  }

  // ─── Drawing ────────────────────────────────────────────────────

  _drawLatAmOutlines() {
    const g = this.add.graphics()
    g.fillStyle(C.PARCHMENT_DARK, 0.08)
    g.lineStyle(1, C.INK, 0.05)
    g.beginPath()
    g.moveTo(350, 120)
    g.lineTo(280, 200)
    g.lineTo(250, 320)
    g.lineTo(300, 380)
    g.lineTo(200, 500)
    g.lineTo(250, 600)
    g.lineTo(350, 650)
    g.lineTo(500, 600)
    g.lineTo(650, 450)
    g.lineTo(550, 300)
    g.lineTo(400, 200)
    g.closePath()
    g.fillPath()
    g.strokePath()
  }

  _drawHeader() {
    this.add.text(30, 30, 'Chapter 2', TEXT.label)
    this.add.text(30, 50, 'CRACK THE MARKET', {
      ...TEXT.title,
      fontSize: '24px',
      fontStyle: 'bold',
    })
    this.add.text(30, 85, 'Latin America, 2017-2020', TEXT.bodyItalic)
  }

  _drawRightPanel() {
    const g = this.add.graphics()
    g.fillStyle(C.PARCHMENT_DARK, 0.4)
    g.fillRect(1010, 20, 250, 680)
    g.lineStyle(0.5, C.INK, 0.3)
    g.strokeRect(1010, 20, 250, 680)

    const cx = 1135

    // Counters
    this.add.text(cx, 60, 'PAIRS FOUND', TEXT.label).setOrigin(0.5)
    this._pairsText = this.add.text(cx, 85, '0 / 12', {
      ...TEXT.stat,
      fontSize: '20px',
    }).setOrigin(0.5)

    this.add.text(cx, 130, 'MOVES', TEXT.label).setOrigin(0.5)
    this._movesText = this.add.text(cx, 155, '0', {
      ...TEXT.stat,
      fontSize: '20px',
    }).setOrigin(0.5)

    this.add.text(cx, 200, 'TIME', TEXT.label).setOrigin(0.5)
    this._timerText = this.add.text(cx, 225, '0:00', {
      ...TEXT.stat,
      fontSize: '18px',
    }).setOrigin(0.5)

    // Field notes box
    this.add.text(cx, 268, 'FIELD NOTES', TEXT.label).setOrigin(0.5)
    const box = this.add.graphics()
    box.lineStyle(0.5, C.INK, 0.2)
    box.strokeRect(1020, 280, 230, 220)

    // Last matched pair label placeholder
    this._matchLabelY = 515

    // Legend
    const legendY = 600
    const legendG = this.add.graphics()
    legendG.fillStyle(C.RED_MARGIN, 0.6)
    legendG.fillRect(1030, legendY, 10, 14)
    this.add.text(1050, legendY + 1, '= Challenge', {
      ...TEXT.label,
      fontSize: '9px',
    })

    legendG.fillStyle(C.STAMP_GREEN, 0.5)
    legendG.fillRect(1030, legendY + 24, 10, 14)
    this.add.text(1050, legendY + 25, '= Skill earned', {
      ...TEXT.label,
      fontSize: '9px',
    })
  }

  // ─── Card construction ──────────────────────────────────────────

  _buildAndPlaceCards() {
    const cardData = []
    PAIRS.forEach(pair => {
      cardData.push({ pairId: pair.id, type: 'challenge', text: pair.challenge, wild: pair.wild })
      cardData.push({ pairId: pair.id, type: 'skill', text: pair.skill, wild: pair.wild })
    })

    // Fisher-Yates shuffle
    for (let i = cardData.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[cardData[i], cardData[j]] = [cardData[j], cardData[i]]
    }

    cardData.forEach((data, idx) => {
      const col = idx % COLS
      const row = Math.floor(idx / COLS)
      const x = GRID_X + col * (CARD_W + H_GAP)
      const y = GRID_Y + row * (CARD_H + V_GAP)
      const card = this._createCard(x, y, data)
      card.container.setAlpha(0)
      this._cards.push(card)

      // Staggered fade-in
      this.tweens.add({
        targets: card.container,
        alpha: 1,
        duration: 300,
        delay: 1000 + idx * 40,
      })
    })
  }

  _createCard(x, y, data) {
    const container = this.add.container(x + CARD_W / 2, y + CARD_H / 2)

    const faceDownGroup = this.add.container(0, 0)
    const faceUpGroup = this.add.container(0, 0)

    this._drawFaceDown(faceDownGroup, data.wild)
    if (data.type === 'challenge') {
      this._drawChallengeFace(faceUpGroup, data.text, data.wild)
    } else {
      this._drawSkillFace(faceUpGroup, data.text, data.wild)
    }

    faceUpGroup.setVisible(false)

    container.add(faceDownGroup)
    container.add(faceUpGroup)

    // Hit area — rectangle
    const hit = this.add.rectangle(0, 0, CARD_W, CARD_H, 0x000000, 0)
    hit.setInteractive({ useHandCursor: true })
    container.add(hit)

    const card = {
      container,
      faceDownGroup,
      faceUpGroup,
      hit,
      type: data.type,
      pairId: data.pairId,
      text: data.text,
      wild: data.wild,
      isFlipped: false,
      isMatched: false,
    }

    hit.on('pointerdown', () => this._onCardClick(card))
    hit.on('pointerover', () => {
      if (card.isFlipped || card.isMatched || !this._gameActive) return
      card.container.setScale(1.03)
    })
    hit.on('pointerout', () => {
      if (card.isMatched) return
      card.container.setScale(1)
    })

    return card
  }

  _drawFaceDown(group, wild) {
    const g = this.add.graphics()
    const w = CARD_W, h = CARD_H
    const hx = -w / 2, hy = -h / 2

    g.fillStyle(C.LEATHER, 1)
    g.fillRoundedRect(hx, hy, w, h, 6)

    g.lineStyle(1, C.INK, 0.5)
    g.strokeRoundedRect(hx + 4, hy + 4, w - 8, h - 8, 4)

    if (wild) {
      g.lineStyle(1.5, C.GOLD_LEAF, 0.9)
      g.strokeRoundedRect(hx, hy, w, h, 6)
    }

    // Center wax seal
    g.fillStyle(C.WAX_RED, 0.8)
    g.fillCircle(0, 0, 16)
    g.fillStyle(C.WAX_RED_LIGHT, 1)
    g.fillCircle(0, 0, 11)

    group.add(g)

    const q = this.add.text(0, 0, '?', {
      fontFamily: FONT,
      fontSize: '14px',
      color: COLORS.PARCHMENT,
      fontStyle: 'bold',
    }).setOrigin(0.5)
    group.add(q)
  }

  _drawChallengeFace(group, textStr, wild) {
    const g = this.add.graphics()
    const w = CARD_W, h = CARD_H
    const hx = -w / 2, hy = -h / 2

    g.fillStyle(C.PARCHMENT, 1)
    g.fillRoundedRect(hx, hy, w, h, 6)

    const stripeColor = wild ? C.WAX_RED : C.RED_MARGIN
    g.fillStyle(stripeColor, 0.6)
    g.fillRect(hx, hy, 6, h)

    const borderColor = wild ? C.GOLD_LEAF : C.INK
    g.lineStyle(1, borderColor, wild ? 0.8 : 0.4)
    g.strokeRoundedRect(hx, hy, w, h, 6)

    group.add(g)

    const label = this.add.text(hx + 14, hy + 8, 'CHALLENGE', {
      ...TEXT.label,
      fontSize: '7px',
      color: COLORS.RED_MARGIN,
    })
    group.add(label)

    const t = this.add.text(0, 4, textStr, {
      ...TEXT.body,
      fontSize: wild ? '13px' : '11px',
      color: wild ? COLORS.WAX_RED : COLORS.INK,
      fontStyle: wild ? 'bold' : 'normal',
      align: 'center',
      wordWrap: { width: w - 24 },
    }).setOrigin(0.5)
    group.add(t)
  }

  _drawSkillFace(group, textStr, wild) {
    const g = this.add.graphics()
    const w = CARD_W, h = CARD_H
    const hx = -w / 2, hy = -h / 2

    g.fillStyle(C.PARCHMENT, 1)
    g.fillRoundedRect(hx, hy, w, h, 6)

    const stripeColor = wild ? C.WAX_RED : C.STAMP_GREEN
    g.fillStyle(stripeColor, 0.5)
    g.fillRect(hx + w - 6, hy, 6, h)

    const borderColor = wild ? C.GOLD_LEAF : C.STAMP_GREEN
    g.lineStyle(1, borderColor, wild ? 0.8 : 0.4)
    g.strokeRoundedRect(hx, hy, w, h, 6)

    group.add(g)

    const label = this.add.text(hx + w - 14, hy + 8, 'SKILL EARNED', {
      ...TEXT.label,
      fontSize: '7px',
      color: COLORS.STAMP_GREEN,
    }).setOrigin(1, 0)
    group.add(label)

    const t = this.add.text(0, 4, textStr, {
      ...TEXT.body,
      fontSize: wild ? '13px' : '11px',
      color: wild ? COLORS.WAX_RED : COLORS.STAMP_GREEN,
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: w - 24 },
    }).setOrigin(0.5)
    group.add(t)
  }

  // ─── Opening sequence ───────────────────────────────────────────

  _startOpening() {
    // Preview peek — all cards face-up at ~2.5s mark (after fade-in wave done ~2s)
    const peekStart = 1500
    this.time.delayedCall(peekStart, () => {
      this._cards.forEach((card, i) => {
        this.time.delayedCall(i * 30, () => {
          card.faceDownGroup.setVisible(false)
          card.faceUpGroup.setVisible(true)
        })
      })
    })

    // Flip back after 2500ms peek
    this.time.delayedCall(peekStart + 2500, () => {
      this._cards.forEach((card, i) => {
        this.time.delayedCall(i * 20, () => {
          card.faceDownGroup.setVisible(true)
          card.faceUpGroup.setVisible(false)
        })
      })

      // Fade intro to dim
      this.tweens.add({ targets: this._intro, alpha: 0.15, duration: 500 })

      // Show prompt and enable input
      this.time.delayedCall(this._cards.length * 20 + 100, () => {
        this._gameActive = true
        this._inputLocked = false
        this._timerStarted = true
        this._gameStartTime = this.time.now
        this.tweens.add({ targets: this._prompt, alpha: 0.6, duration: 400 })
      })
    })
  }

  // ─── Input ──────────────────────────────────────────────────────

  _onCardClick(card) {
    if (!this._gameActive) return
    if (this._inputLocked) return
    if (card.isFlipped || card.isMatched) return

    // Hide prompt on first click
    if (this._prompt && this._prompt.alpha > 0) {
      this.tweens.add({ targets: this._prompt, alpha: 0, duration: 300 })
    }

    this._flipToFaceUp(card)
  }

  _flipToFaceUp(card) {
    card.isFlipped = true
    const wasSecondPick = this._firstPick !== null
    if (wasSecondPick) this._inputLocked = true

    this.tweens.add({
      targets: card.container,
      scaleX: 0,
      duration: 125,
      ease: 'Quad.easeIn',
      onComplete: () => {
        card.faceDownGroup.setVisible(false)
        card.faceUpGroup.setVisible(true)
        this.tweens.add({
          targets: card.container,
          scaleX: 1,
          duration: 125,
          ease: 'Quad.easeOut',
          onComplete: () => {
            if (this._firstPick === null) {
              this._firstPick = card
            } else {
              this._checkMatch(this._firstPick, card)
            }
          },
        })
      },
    })
  }

  _flipToFaceDown(card) {
    this.tweens.add({
      targets: card.container,
      scaleX: 0,
      duration: 125,
      ease: 'Quad.easeIn',
      onComplete: () => {
        card.faceDownGroup.setVisible(true)
        card.faceUpGroup.setVisible(false)
        card.isFlipped = false
        this.tweens.add({
          targets: card.container,
          scaleX: 1,
          duration: 125,
          ease: 'Quad.easeOut',
        })
      },
    })
  }

  // ─── Match resolution ───────────────────────────────────────────

  _checkMatch(cardA, cardB) {
    this._moves++
    this._movesText.setText(String(this._moves))

    if (cardA.pairId === cardB.pairId) {
      cardA.isMatched = true
      cardB.isMatched = true
      this._pairsFound++
      this._pairsText.setText(`${this._pairsFound} / 12`)

      const pair = PAIRS.find(p => p.id === cardA.pairId)

      this.time.delayedCall(200, () => {
        this._showMatchEffect(cardA, cardB)
        this._showInsight(pair.insight)
        this._showMatchLabel(pair)

        if (pair.wild) {
          this._playCelebration()
        }

        this.time.delayedCall(500, () => {
          this._firstPick = null
          this._inputLocked = false

          if (this._pairsFound >= 12) {
            this._gameActive = false
            this.time.delayedCall(1500, () => this._finish())
          }
        })
      })
    } else {
      this.time.delayedCall(1200, () => {
        // Red flash
        const flashA = this.add.rectangle(cardA.container.x, cardA.container.y, CARD_W, CARD_H, C.RED_MARGIN, 0.2)
        const flashB = this.add.rectangle(cardB.container.x, cardB.container.y, CARD_W, CARD_H, C.RED_MARGIN, 0.2)
        this.tweens.add({
          targets: [flashA, flashB],
          alpha: 0,
          duration: 300,
          onComplete: () => { flashA.destroy(); flashB.destroy() },
        })

        this._flipToFaceDown(cardA)
        this._flipToFaceDown(cardB)

        this.time.delayedCall(300, () => {
          this._firstPick = null
          this._inputLocked = false
        })
      })
    }
  }

  _showMatchEffect(cardA, cardB) {
    // Pulse scale
    ;[cardA, cardB].forEach(card => {
      this.tweens.add({
        targets: card.container,
        scale: 1.08,
        duration: 150,
        yoyo: true,
        ease: 'Sine.easeInOut',
      })

      // Stamp
      const stamp = JournalUI.drawPassportStamp(
        this,
        card.container.x,
        card.container.y,
        'MATCHED',
        2019,
        -10 + Math.random() * 20
      )
      stamp.setAlpha(0).setScale(1.5)
      this.tweens.add({
        targets: stamp,
        alpha: 0.7,
        scale: 0.6,
        duration: 300,
        ease: 'Back.easeOut',
      })

      // Fade matched cards
      this.tweens.add({
        targets: card.container,
        alpha: 0.65,
        duration: 300,
        delay: 150,
      })
    })

    // Connection line
    const line = this.add.line(
      0, 0,
      cardA.container.x, cardA.container.y,
      cardB.container.x, cardB.container.y,
      C.STAMP_GREEN, 0.3
    )
    line.setOrigin(0, 0).setLineWidth(1).setAlpha(0)
    this.tweens.add({ targets: line, alpha: 0.3, duration: 200 })
  }

  _showInsight(text) {
    if (this._insightText) {
      this.tweens.killTweensOf(this._insightText)
      this._insightText.destroy()
    }

    this._insightText = this.add.text(1135, 390, text, {
      ...TEXT.bodyItalic,
      fontSize: '10px',
      color: COLORS.INK_LIGHT,
      align: 'center',
      wordWrap: { width: 210 },
      lineSpacing: 4,
    }).setOrigin(0.5).setAlpha(0)

    this.tweens.add({
      targets: this._insightText,
      alpha: 1,
      duration: 400,
      onComplete: () => {
        this.time.delayedCall(3600, () => {
          if (this._insightText) {
            this.tweens.add({ targets: this._insightText, alpha: 0.3, duration: 500 })
          }
        })
      },
    })
  }

  _showMatchLabel(pair) {
    if (this._matchLabel) this._matchLabel.destroy()
    const challenge = pair.challenge.replace(/\n/g, ' ')
    const skill = pair.skill.replace(/\n/g, ' ')
    this._matchLabel = this.add.text(1135, this._matchLabelY,
      `${challenge} → ${skill}`,
      {
        ...TEXT.small,
        fontSize: '10px',
        color: COLORS.STAMP_GREEN,
        align: 'center',
        wordWrap: { width: 220 },
      }
    ).setOrigin(0.5).setAlpha(0)

    this.tweens.add({ targets: this._matchLabel, alpha: 1, duration: 400 })
  }

  _playCelebration() {
    // Banner
    const bannerBg = this.add.rectangle(500, -30, 1000, 60, C.PARCHMENT_DARK, 0.95)
    bannerBg.setStrokeStyle(1, C.GOLD_LEAF, 0.8)
    const bannerText = this.add.text(500, -30, '$1,000,000 ARR', {
      ...TEXT.title,
      fontSize: '36px',
      color: COLORS.WAX_RED,
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.tweens.add({
      targets: [bannerBg, bannerText],
      y: 80,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(1600, () => {
          this.tweens.add({
            targets: [bannerBg, bannerText],
            y: -80,
            alpha: 0,
            duration: 400,
            ease: 'Quad.easeIn',
            onComplete: () => { bannerBg.destroy(); bannerText.destroy() },
          })
        })
      },
    })

    // Confetti
    const colors = [C.STAMP_GREEN, C.WAX_RED, C.LEATHER, C.INK_LIGHT]
    for (let i = 0; i < 30; i++) {
      const c = this.add.rectangle(
        200 + Math.random() * 680,
        -10,
        4, 8,
        colors[Math.floor(Math.random() * colors.length)]
      ).setRotation(Math.random() * Math.PI)

      this.tweens.add({
        targets: c,
        y: 740,
        x: c.x + (Math.random() - 0.5) * 200,
        rotation: c.rotation + Math.random() * 4,
        alpha: 0,
        duration: 1500 + Math.random() * 500,
        ease: 'Quad.easeIn',
        onComplete: () => c.destroy(),
      })
    }
  }

  // ─── Finish ─────────────────────────────────────────────────────

  _finish() {
    if (this._ended) return
    this._ended = true
    this._gameActive = false
    this._timerStarted = false

    const elapsedSec = (this.time.now - this._gameStartTime) / 1000

    // Score
    const BASE = 100
    const PENALTY = 3
    const PERFECT = 12
    const WILD_BONUS = 15
    const extra = Math.max(0, this._moves - PERFECT)
    const movePenalty = extra * PENALTY
    const timeBonus = elapsedSec < 60 ? 10 : 0
    const rawScore = BASE - movePenalty + timeBonus + WILD_BONUS
    const score = Math.max(10, Math.min(100, Math.round(rawScore)))

    const curSales = this.registry.get(KEYS.STAT_SALES) ?? 0
    const curEQ = this.registry.get(KEYS.STAT_EQ) ?? 0
    const curGrit = this.registry.get(KEYS.STAT_GRIT) ?? 0
    const salesGain = Math.round(score / 5)
    const eqGain = Math.round(score / 8)
    const gritGain = Math.round(score / 10)

    this.registry.set(KEYS.STAT_SALES, Math.min(100, curSales + salesGain))
    this.registry.set(KEYS.STAT_EQ, Math.min(100, curEQ + eqGain))
    this.registry.set(KEYS.STAT_GRIT, Math.min(100, curGrit + gritGain))

    completeLevel(this, KEYS.SCORE_L2, KEYS.COMPLETED_L2, score)

    // Grid fade out
    this._cards.forEach(card => {
      this.tweens.add({ targets: card.container, alpha: 0, duration: 800 })
    })

    // Overlay
    this.time.delayedCall(900, () => this._drawCompletion(score, salesGain, eqGain, gritGain))
  }

  _drawCompletion(score, salesGain, eqGain, gritGain) {
    const { width, height } = this.cameras.main
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, C.PARCHMENT, 0.92).setAlpha(0)
    this.tweens.add({ targets: overlay, alpha: 0.92, duration: 500 })

    const elems = []

    elems.push(this.add.text(width / 2, 140, 'MARKET CRACKED', {
      ...TEXT.title,
      fontSize: '32px',
      fontStyle: 'bold',
    }).setOrigin(0.5))

    elems.push(this.add.text(width / 2, 210,
      'From zero to $1M ARR across 11 countries.',
      {
        ...TEXT.chapter,
        fontSize: '18px',
      }
    ).setOrigin(0.5))

    elems.push(this.add.text(width / 2, 260,
      'Every challenge became a skill.\nEvery setback became a story.',
      {
        ...TEXT.body,
        fontSize: '14px',
        color: COLORS.INK_LIGHT,
        align: 'center',
        lineSpacing: 8,
      }
    ).setOrigin(0.5))

    elems.push(this.add.text(width / 2, 340, `Score: ${score}%`, {
      ...TEXT.body,
      fontSize: '18px',
      color: COLORS.INK_FADED,
    }).setOrigin(0.5))

    elems.push(this.add.text(width / 2, 380,
      `+${salesGain} Sales   +${eqGain} EQ   +${gritGain} Grit`,
      { ...TEXT.stamp, fontSize: '16px' }
    ).setOrigin(0.5))

    let perfLine = 'The long road. But you got there. That\'s the whole point.'
    if (this._moves <= 15) perfLine = "Near-perfect recall. You'd make a great sales closer."
    else if (this._moves <= 22) perfLine = 'Solid memory. You connected the dots efficiently.'
    else if (this._moves <= 30) perfLine = 'Persistent. You found every match — just like Augustin.'

    elems.push(this.add.text(width / 2, 420, perfLine, {
      ...TEXT.bodyItalic,
      fontSize: '12px',
      color: COLORS.INK_FADED,
    }).setOrigin(0.5))

    elems.push(this.add.text(width / 2, 500,
      'Success in Latin America felt hollow.\nSomething was missing. Something harder.\nYou book a flight to the edge of the world...',
      {
        ...TEXT.prompt,
        fontSize: '14px',
        align: 'center',
        lineSpacing: 6,
      }
    ).setOrigin(0.5))

    elems.push(this.add.text(width / 2, 650, 'PRESS SPACE to return to the hub', {
      ...TEXT.small,
      color: COLORS.INK_FADED,
    }).setOrigin(0.5))

    elems.forEach(e => e.setAlpha(0))
    this.tweens.add({ targets: elems, alpha: 1, duration: 600, delay: 400 })

    const returnToHub = () => {
      this.cameras.main.fadeOut(400, 0, 0, 0)
      this.time.delayedCall(420, () => this.scene.start('LevelSelectHub'))
    }
    this.input.keyboard.once('keydown-SPACE', returnToHub)
    this.time.delayedCall(8000, returnToHub)
  }
}
