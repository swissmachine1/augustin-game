import * as Phaser from 'phaser'
import { KEYS, recordBestTime, addPlayTime } from '../systems/GameRegistry.js'
import { completeLevel } from './LevelSelectHub.js'
import { COLORS, C, TEXT, FONT_DISPLAY, FONT_MONO, LEVEL_COLORS } from '../config/theme.js'
import { BrutalUI } from '../ui/BrutalUI.js'
import { AudioCtx } from '../ui/AudioCtx.js'
import { Particles } from '../ui/Particles.js'
import { TextReveal } from '../ui/TextReveal.js'

// Level 2 — Latin America: brutalist memory match.
// Match two cards with the SAME text. Deck mixes challenge labels and skill labels,
// each appearing twice. Plus a $1M ARR wild card.

const LABELS = [
  { text: 'NO SPANISH',            wild: false, insight: 'LEARNED TO SELL WITH DIAGRAMS AND PERSISTENCE.' },
  { text: 'ZERO NETWORK',          wild: false, insight: 'COLD EMAILS. CONFERENCE AMBUSHES. STRANGERS TURNED PARTNERS.' },
  { text: '11 COUNTRIES',          wild: false, insight: '11 REGULATORY FRAMEWORKS. 11 NETWORKS BUILT FROM ZERO.' },
  { text: 'SOLO IN MEDELLÍN',      wild: false, insight: 'NO TEAM. NO OFFICE. JUST A LAPTOP AND A LIST OF 200 DOCTORS.' },
  { text: 'CONSULTATIVE SALES',    wild: false, insight: 'STOPPED SELLING PRODUCT. STARTED SELLING OUTCOMES.' },
  { text: 'SCRAPPY GTM',           wild: false, insight: 'PIPELINE BUILT ON DUCT TAPE AND CONVICTION.' },
  { text: 'TRUST BUILDING',        wild: false, insight: 'A 2-HOUR LUNCH BEATS A 20-PAGE PROPOSAL.' },
  { text: '$1M ARR',               wild: true,  insight: '12 MONTHS. 11 COUNTRIES. ONE MILLION DOLLARS.' },
]

const INTRO_BEATS = [
  'I LANDED IN MEDELLÍN WITH NO SPANISH, NO NETWORK, AND A PITCH DECK THAT NEEDED TO WORK.',
  'THE MARKET: 11 COUNTRIES. THE ASSIGNMENT: BUILD FROM ZERO.',
  'MATCH THE PAIRS. EACH LABEL APPEARS TWICE. FIND THE $1M ARR WILD CARD.',
]

const COLS = 4
// 16 cards / 4 cols → 4 rows (full 4×4 square)

// Grid geometry — left-aligned block, right side reserved for INSIGHTS panel.
const CARD_W = 200
const CARD_H = 125
const H_GAP = 10
const V_GAP = 10
const GRID_X = 40
const GRID_Y = 180

export class LatinAmericaScene extends Phaser.Scene {
  constructor() {
    super('LatinAmericaScene')
  }

  create() {
    const { width, height } = this.cameras.main
    this.cameras.main.fadeIn(400, 10, 10, 10)
    this.cameras.main.setBackgroundColor(COLORS.BLACK)

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
    this._foundWild = false
    this._insightEntries = []
    this._shutdownHandlers = []
    this._streak = 0
    this._bestStreak = 0
    this._streakSticker = null
    this._isNewBest = false

    // Resume audio context on first pointer down (browser autoplay rules)
    this.input.once('pointerdown', () => AudioCtx.resume())

    // Scene-start sound
    AudioCtx.fx('open')

    // Grid background
    this._drawBackground(width, height)

    // Header
    BrutalUI.drawBlockType(this, 40, 70, '02', {
      fontSize: '96px',
      color: COLORS.BONE,
      shadowColor: COLORS.SHOCK_LIME,
      shadowOffset: 6,
      origin: 0,
    })
    this.add.text(170, 50, 'LATIN AMERICA', {
      fontFamily: FONT_DISPLAY, fontSize: '34px', color: COLORS.BONE,
    }).setOrigin(0, 0)
    this.add.text(170, 95, 'THE SCALE — $0 → $1M ARR', {
      fontFamily: FONT_MONO, fontSize: '12px', fontStyle: 'bold', color: COLORS.SHOCK_LIME,
      letterSpacing: 2,
    }).setOrigin(0, 0)

    // Rule under header
    const rule = this.add.graphics()
    rule.fillStyle(C.SHOCK_LIME, 1)
    rule.fillRect(0, 150, width, 4)

    // Timer / moves tags (top right)
    this._timerTag = BrutalUI.drawTag(this, width - 90, 40, '0:00', {
      fill: C.BONE, textColor: COLORS.BLACK, paddingX: 16, paddingY: 8,
    })
    this._timerLabel = this.add.text(width - 90, 65, 'TIME', {
      fontFamily: FONT_MONO, fontSize: '9px', fontStyle: 'bold', color: COLORS.GREY_300,
      letterSpacing: 2,
    }).setOrigin(0.5)

    this._movesTag = BrutalUI.drawTag(this, width - 210, 40, '00', {
      fill: C.SHOCK_LIME, textColor: COLORS.BLACK, paddingX: 16, paddingY: 8,
    })
    this._movesLabel = this.add.text(width - 210, 65, 'MOVES', {
      fontFamily: FONT_MONO, fontSize: '9px', fontStyle: 'bold', color: COLORS.GREY_300,
      letterSpacing: 2,
    }).setOrigin(0.5)

    this._pairsTag = BrutalUI.drawTag(this, width - 330, 40, `0/${LABELS.length}`, {
      fill: C.BONE, textColor: COLORS.BLACK, paddingX: 16, paddingY: 8,
    })
    this.add.text(width - 330, 65, 'PAIRS', {
      fontFamily: FONT_MONO, fontSize: '9px', fontStyle: 'bold', color: COLORS.GREY_300,
      letterSpacing: 2,
    }).setOrigin(0.5)

    // Insights panel (right side)
    this._drawInsightsPanel(width, height)

    // Build deck & cards (initially hidden; shown after narrative)
    this._buildDeck()
    this._cards.forEach(c => c.container.setAlpha(0))

    // Home button (persistent top-left — but header covers 0-150, so draw above)
    BrutalUI.drawHomeButton(this, {
      onClick: () => {
        AudioCtx.fx('click')
        BrutalUI.pageTurn(this, () => this.scene.start('LevelSelectHub'))
      },
    })

    // Scanline atmosphere
    BrutalUI.drawScanlines(this, 1280, 720)

    // Kick off intro narrative
    this._showIntroBeat(0)

    // Shutdown cleanup
    this.events.once('shutdown', () => {
      if (this.input && this.input.keyboard) this.input.keyboard.removeAllListeners()
      this._shutdownHandlers.forEach(fn => { try { fn() } catch (e) {} })
      this._shutdownHandlers = []
    }, this)
  }

  update(time) {
    if (!this._timerStarted || this._ended) return
    const elapsed = Math.floor((time - this._gameStartTime) / 1000)
    const min = Math.floor(elapsed / 60)
    const sec = elapsed % 60
    const str = `${min}:${sec.toString().padStart(2, '0')}`
    const txt = this._timerTag.list[1]
    if (txt && txt.setText) txt.setText(str)
  }

  // ─── Background ──────────────────────────────────────────────────

  _drawBackground(width, height) {
    const g = this.add.graphics()
    g.fillStyle(C.BLACK, 1)
    g.fillRect(0, 0, width, height)
    g.lineStyle(1, C.GREY_900, 1)
    for (let x = 0; x < width; x += 40) {
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, height); g.strokePath()
    }
    for (let y = 0; y < height; y += 40) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(width, y); g.strokePath()
    }
  }

  // ─── Intro narrative ─────────────────────────────────────────────

  _showIntroBeat(idx) {
    if (idx >= INTRO_BEATS.length) {
      this._startGame()
      return
    }
    BrutalUI.showNarrative(this, 640, 380, 720, 180, INTRO_BEATS[idx], () => {
      this._showIntroBeat(idx + 1)
    }, {
      fill: C.BONE,
      border: C.BLACK,
      accentColor: C.SHOCK_LIME,
      fontSize: '18px',
    })
  }

  _startGame() {
    const PREVIEW_MS = 2000

    // Reveal all cards face-up immediately (preview peek)
    this._cards.forEach((card, i) => {
      card.faceDown.setVisible(false)
      card.faceUp.setVisible(true)
      this.tweens.add({
        targets: card.container,
        alpha: 1,
        duration: 220,
        delay: i * 18,
      })
    })

    // Preview countdown sticker
    const previewSticker = BrutalUI.drawSticker(this, 640, 130, 'MEMORIZE — 2 SEC', {
      fill: C.SHOCK_LIME, textColor: COLORS.BLACK, rotation: -2 * Math.PI / 180,
      fontSize: '16px', paddingX: 18, paddingY: 8,
    })
    this.tweens.add({
      targets: previewSticker, scale: { from: 1, to: 1.08 },
      duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })

    // After preview, flip all back to face-down
    const fadeInTotal = this._cards.length * 18 + 220
    this.time.delayedCall(Math.max(fadeInTotal, 200) + PREVIEW_MS, () => {
      AudioCtx.fx('flip')
      previewSticker.destroy()
      this._cards.forEach((card, i) => {
        this.time.delayedCall(i * 18, () => {
          this.tweens.add({
            targets: card.container, scaleX: { from: 1, to: 0 },
            duration: 110, ease: 'Quad.easeIn',
            onComplete: () => {
              card.faceUp.setVisible(false)
              card.faceDown.setVisible(true)
              this.tweens.add({
                targets: card.container, scaleX: { from: 0, to: 1 },
                duration: 110, ease: 'Quad.easeOut',
              })
            },
          })
        })
      })

      // Start the actual game after the flip-back animation completes
      this.time.delayedCall(this._cards.length * 18 + 250, () => {
        this._gameActive = true
        this._inputLocked = false
        this._timerStarted = true
        this._gameStartTime = this.time.now
      })
    })
  }

  // ─── Insights panel ──────────────────────────────────────────────

  _drawInsightsPanel(width, height) {
    const x = 900
    const y = 160
    const w = 360
    const h = 546

    const shadow = this.add.graphics()
    shadow.fillStyle(C.BLACK, 1)
    shadow.fillRect(x + 6, y + 6, w, h)

    const bg = this.add.graphics()
    bg.fillStyle(C.OFF_BLACK, 1)
    bg.fillRect(x, y, w, h)
    bg.lineStyle(3, C.BONE, 1)
    bg.strokeRect(x, y, w, h)

    // Header stripe
    const stripe = this.add.graphics()
    stripe.fillStyle(C.SHOCK_LIME, 1)
    stripe.fillRect(x, y, w, 36)

    this.add.text(x + 16, y + 18, 'INSIGHTS', {
      fontFamily: FONT_DISPLAY, fontSize: '20px', color: COLORS.BLACK,
    }).setOrigin(0, 0.5)

    this.add.text(x + w - 16, y + 18, 'JOURNAL // L2', {
      fontFamily: FONT_MONO, fontSize: '10px', fontStyle: 'bold', color: COLORS.BLACK,
      letterSpacing: 2,
    }).setOrigin(1, 0.5)

    this._insightsPanel = { x, y: y + 44, w, h: h - 44 }
    this._insightsContainer = this.add.container(0, 0)
  }

  _addInsight(label, text, wild) {
    const { x, y, w, h } = this._insightsPanel
    const pad = 8
    const gap = 3
    const cardW = w - pad * 2

    // Measure required height by probing the wrapped insight text
    const probe = this.add.text(0, 0, text, {
      fontFamily: FONT_MONO, fontSize: '8px', color: COLORS.GREY_700,
      wordWrap: { width: cardW - 18 },
    })
    const insightH = probe.height
    probe.destroy()
    const entryH = Math.max(28, 4 + 10 + insightH + 3) // top pad + label line + insight + bottom pad

    // Compute ey based on running offset (entries are variable height)
    if (this._insightsCursorY === undefined) this._insightsCursorY = y + pad
    const ex = x + pad
    const ey = this._insightsCursorY

    if (ey + entryH > y + h - pad) return // overflow guard

    const entry = this.add.container(0, 0)

    const shadow = this.add.graphics()
    shadow.fillStyle(C.BLACK, 1)
    shadow.fillRect(ex + 3, ey + 3, cardW, entryH)

    const card = this.add.graphics()
    card.fillStyle(wild ? C.HAZARD_YELLOW : C.BONE, 1)
    card.fillRect(ex, ey, cardW, entryH)
    card.lineStyle(2, C.BLACK, 1)
    card.strokeRect(ex, ey, cardW, entryH)

    // left stripe
    const stripe = this.add.graphics()
    stripe.fillStyle(wild ? C.BLACK : C.SHOCK_LIME, 1)
    stripe.fillRect(ex, ey, 6, entryH)

    const labelTxt = this.add.text(ex + 12, ey + 3, label, {
      fontFamily: FONT_MONO, fontSize: '9px', fontStyle: 'bold', color: COLORS.BLACK,
      letterSpacing: 1,
      wordWrap: { width: cardW - 18 },
    })

    // Typewriter the insight text in
    const insightTxt = TextReveal.typewrite(this, text, {
      x: ex + 12, y: ey + 14,
      origin: 0,
      stepMs: 18,
      style: {
        fontFamily: FONT_MONO, fontSize: '8px', color: COLORS.GREY_700,
        wordWrap: { width: cardW - 18 },
      },
    })

    entry.add([shadow, card, stripe, labelTxt, insightTxt])
    entry.setAlpha(0)
    this.tweens.add({ targets: entry, alpha: 1, duration: 260 })

    // "+1 INSIGHT" popup at insight position
    Particles.popup(this, ex + cardW / 2, ey + entryH / 2, '+1 INSIGHT', '#d4ff00')

    this._insightEntries.push(entry)
    this._insightsCursorY = ey + entryH + gap
  }

  // ─── Deck & cards ────────────────────────────────────────────────

  _buildDeck() {
    const deck = []
    LABELS.forEach(l => {
      deck.push({ text: l.text, wild: l.wild, insight: l.insight })
      deck.push({ text: l.text, wild: l.wild, insight: l.insight })
    })

    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[deck[i], deck[j]] = [deck[j], deck[i]]
    }

    deck.forEach((data, idx) => {
      const col = idx % COLS
      const row = Math.floor(idx / COLS)
      const x = GRID_X + col * (CARD_W + H_GAP) + CARD_W / 2
      const y = GRID_Y + row * (CARD_H + V_GAP) + CARD_H / 2
      const card = this._createCard(x, y, data)
      this._cards.push(card)
    })
  }

  _createCard(x, y, data) {
    const container = this.add.container(x, y)

    const faceDown = this.add.container(0, 0)
    const faceUp = this.add.container(0, 0)

    this._drawFaceDown(faceDown, data.wild)
    this._drawFaceUp(faceUp, data.text, data.wild)
    faceUp.setVisible(false)

    container.add([faceDown, faceUp])

    const hit = this.add.rectangle(x, y, CARD_W, CARD_H, 0x000000, 0)
    hit.setInteractive({ useHandCursor: true })

    const card = {
      container,
      faceDown,
      faceUp,
      hit,
      text: data.text,
      wild: data.wild,
      insight: data.insight,
      isFlipped: false,
      isMatched: false,
    }

    hit.on('pointerdown', () => this._onCardClick(card))
    hit.on('pointerover', () => {
      if (card.isFlipped || card.isMatched || !this._gameActive) return
      container.setScale(1.04)
    })
    hit.on('pointerout', () => {
      if (card.isMatched) return
      container.setScale(1)
    })

    return card
  }

  _drawFaceDown(group, wild) {
    const w = CARD_W, h = CARD_H

    const shadow = this.add.graphics()
    shadow.fillStyle(C.SHOCK_LIME, 1)
    shadow.fillRect(-w / 2 + 5, -h / 2 + 5, w, h)

    const bg = this.add.graphics()
    bg.fillStyle(C.BLACK, 1)
    bg.fillRect(-w / 2, -h / 2, w, h)
    bg.lineStyle(3, C.BONE, 1)
    bg.strokeRect(-w / 2, -h / 2, w, h)

    const q = this.add.text(0, 0, '?', {
      fontFamily: FONT_DISPLAY, fontSize: '64px', color: COLORS.BONE,
    }).setOrigin(0.5)

    group.add([shadow, bg, q])

    if (wild) {
      // Gold corners for wild (hidden on face-down is fine — they add intrigue, but gameplay-wise
      // we avoid telegraphing. Keep face-down identical; only face-up shows wild styling.)
    }
  }

  _drawFaceUp(group, text, wild) {
    const w = CARD_W, h = CARD_H

    const shadow = this.add.graphics()
    shadow.fillStyle(C.BLACK, 1)
    shadow.fillRect(-w / 2 + 5, -h / 2 + 5, w, h)

    const bg = this.add.graphics()
    bg.fillStyle(C.BONE, 1)
    bg.fillRect(-w / 2, -h / 2, w, h)
    bg.lineStyle(3, C.BLACK, 1)
    bg.strokeRect(-w / 2, -h / 2, w, h)

    // Top stripe — shock lime (or hazard yellow for wild)
    const stripe = this.add.graphics()
    stripe.fillStyle(wild ? C.HAZARD_YELLOW : C.SHOCK_LIME, 1)
    stripe.fillRect(-w / 2, -h / 2, w, 10)

    group.add([shadow, bg, stripe])

    if (wild) {
      // Gold-yellow corner markers
      const corners = this.add.graphics()
      corners.fillStyle(C.HAZARD_YELLOW, 1)
      const s = 10
      corners.fillRect(-w / 2, -h / 2, s, s)
      corners.fillRect(w / 2 - s, -h / 2, s, s)
      corners.fillRect(-w / 2, h / 2 - s, s, s)
      corners.fillRect(w / 2 - s, h / 2 - s, s, s)
      group.add(corners)
    }

    const fontSize = text.length > 18 ? '16px' : text.length > 12 ? '20px' : '24px'
    const t = this.add.text(0, 8, text, {
      fontFamily: FONT_MONO, fontSize, fontStyle: 'bold', color: COLORS.BLACK,
      align: 'center',
      wordWrap: { width: w - 24 },
    }).setOrigin(0.5)
    group.add(t)
  }

  // ─── Input / flip ────────────────────────────────────────────────

  _onCardClick(card) {
    if (!this._gameActive || this._inputLocked) return
    if (card.isFlipped || card.isMatched) return
    this._flipUp(card)
  }

  _flipUp(card) {
    card.isFlipped = true
    AudioCtx.fx('flip')
    const isSecond = this._firstPick !== null
    if (isSecond) this._inputLocked = true

    this.tweens.add({
      targets: card.container,
      scaleX: 0,
      duration: 110,
      ease: 'Quad.easeIn',
      onComplete: () => {
        card.faceDown.setVisible(false)
        card.faceUp.setVisible(true)
        this.tweens.add({
          targets: card.container,
          scaleX: 1,
          duration: 110,
          ease: 'Quad.easeOut',
          onComplete: () => {
            if (this._firstPick === null) {
              this._firstPick = card
            } else {
              this._resolveMatch(this._firstPick, card)
            }
          },
        })
      },
    })
  }

  _flipDown(card) {
    this.tweens.add({
      targets: card.container,
      scaleX: 0,
      duration: 110,
      ease: 'Quad.easeIn',
      onComplete: () => {
        card.faceDown.setVisible(true)
        card.faceUp.setVisible(false)
        card.isFlipped = false
        this.tweens.add({
          targets: card.container,
          scaleX: 1,
          duration: 110,
          ease: 'Quad.easeOut',
        })
      },
    })
  }

  _resolveMatch(a, b) {
    this._moves++
    const mtxt = this._movesTag.list[1]
    if (mtxt && mtxt.setText) mtxt.setText(String(this._moves).padStart(2, '0'))

    const isMatch = a.text === b.text
    if (isMatch) {
      a.isMatched = true
      b.isMatched = true
      this._pairsFound++
      const ptxt = this._pairsTag.list[1]
      if (ptxt && ptxt.setText) ptxt.setText(`${this._pairsFound}/${LABELS.length}`)

      if (a.wild) this._foundWild = true

      // Streak tracking
      this._streak++
      if (this._streak > this._bestStreak) this._bestStreak = this._streak
      this._updateStreakSticker()

      // Audio
      if (a.wild) {
        AudioCtx.fx('wild')
        this.cameras.main.shake(400, 0.02)
      } else {
        AudioCtx.fx('match')
        if (this._streak >= 5) this.cameras.main.shake(200, 0.008)
      }

      // Burst at midpoint
      const midX = (a.container.x + b.container.x) / 2
      const midY = (a.container.y + b.container.y) / 2
      Particles.burst(this, midX, midY, C.SHOCK_LIME, 12)

      this.time.delayedCall(180, () => {
        this._matchEffect(a, b)
        this._addInsight(a.text, a.insight, a.wild)
        if (a.wild) {
          Particles.confetti(this, 640, 360, 80)
          Particles.ring(this, 640, 360, C.HAZARD_YELLOW, { maxRadius: 400 })
          this._celebrate()
        }

        this.time.delayedCall(400, () => {
          this._firstPick = null
          this._inputLocked = false
          if (this._pairsFound >= LABELS.length) {
            this._gameActive = false
            this.time.delayedCall(1400, () => this._finish())
          }
        })
      })
    } else {
      // Streak break
      this._streak = 0
      this._updateStreakSticker()
      AudioCtx.fx('mismatch')
      // Red burst on each mismatched card
      ;[a, b].forEach(card => {
        Particles.burst(this, card.container.x, card.container.y, C.SHOCK_RED, 4)
      })
      this.time.delayedCall(1000, () => {
        // Red shake
        ;[a, b].forEach(card => {
          this.tweens.add({
            targets: card.container,
            x: card.container.x + 4,
            duration: 60,
            yoyo: true,
            repeat: 2,
          })
        })
        this.time.delayedCall(400, () => {
          this._flipDown(a)
          this._flipDown(b)
          this.time.delayedCall(260, () => {
            this._firstPick = null
            this._inputLocked = false
          })
        })
      })
    }
  }

  _updateStreakSticker() {
    if (this._streakSticker) {
      if (this._streakPulse) { this._streakPulse.stop(); this._streakPulse = null }
      this._streakSticker.destroy()
      this._streakSticker = null
    }
    if (this._streak >= 3) {
      this._streakSticker = BrutalUI.drawSticker(
        this, 640, 110, `ON FIRE x${this._streak}`,
        { fill: C.SHOCK_LIME }
      )
      this._streakPulse = this.tweens.add({
        targets: this._streakSticker,
        scale: { from: 1, to: 1.08 },
        duration: 360,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }
  }

  _matchEffect(a, b) {
    ;[a, b].forEach(card => {
      // Pulse
      this.tweens.add({
        targets: card.container,
        scale: 1.08,
        duration: 140,
        yoyo: true,
        ease: 'Sine.easeInOut',
      })
      // Sticker
      const sticker = BrutalUI.drawSticker(this, card.container.x, card.container.y + 18, 'MATCHED', {
        fill: C.SHOCK_LIME,
        textColor: COLORS.BLACK,
        rotation: (-8 + Math.random() * 16) * Math.PI / 180,
        fontSize: '12px',
        paddingX: 10, paddingY: 4,
      })
      sticker.setScale(0).setAlpha(0)
      this.tweens.add({
        targets: sticker,
        scale: 1, alpha: 1,
        duration: 260,
        ease: 'Back.easeOut',
      })
      // Fade card
      this.tweens.add({
        targets: card.container,
        alpha: 0.7,
        duration: 300,
        delay: 200,
      })
    })
  }

  _celebrate() {
    const { width } = this.cameras.main

    // Big lime flash
    const flash = this.add.rectangle(width / 2, 360, width, 720, C.SHOCK_LIME, 0.9)
    flash.setAlpha(0)
    this.tweens.add({
      targets: flash,
      alpha: 0.8,
      duration: 100,
      yoyo: true,
      onComplete: () => flash.destroy(),
    })

    // Banner drop
    const banner = this.add.container(width / 2, -60)
    const bShadow = this.add.graphics()
    bShadow.fillStyle(C.BLACK, 1)
    bShadow.fillRect(-340 + 6, -40 + 6, 680, 80)
    const bBg = this.add.graphics()
    bBg.fillStyle(C.SHOCK_LIME, 1)
    bBg.fillRect(-340, -40, 680, 80)
    bBg.lineStyle(4, C.BLACK, 1)
    bBg.strokeRect(-340, -40, 680, 80)
    const bTxt = this.add.text(0, 0, '$1,000,000 ARR — LOCKED IN', {
      fontFamily: FONT_DISPLAY, fontSize: '30px', color: COLORS.BLACK,
    }).setOrigin(0.5)
    banner.add([bShadow, bBg, bTxt])

    this.tweens.add({
      targets: banner,
      y: 380,
      duration: 420,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(1400, () => {
          this.tweens.add({
            targets: banner,
            y: -120,
            alpha: 0,
            duration: 400,
            ease: 'Quad.easeIn',
            onComplete: () => banner.destroy(),
          })
        })
      },
    })

    // Confetti
    const colors = [C.SHOCK_LIME, C.HAZARD_YELLOW, C.BONE, C.SHOCK_PINK]
    for (let i = 0; i < 60; i++) {
      const c = this.add.rectangle(
        100 + Math.random() * (width - 200),
        -10,
        6, 14,
        colors[Math.floor(Math.random() * colors.length)]
      ).setRotation(Math.random() * Math.PI)

      this.tweens.add({
        targets: c,
        y: 740,
        x: c.x + (Math.random() - 0.5) * 300,
        rotation: c.rotation + Math.random() * 6,
        alpha: 0,
        duration: 1600 + Math.random() * 700,
        ease: 'Quad.easeIn',
        onComplete: () => c.destroy(),
      })
    }
  }

  // ─── Finish ──────────────────────────────────────────────────────

  _finish() {
    if (this._ended) return
    this._ended = true
    this._gameActive = false
    this._timerStarted = false

    const elapsedMs = this.time.now - this._gameStartTime
    const elapsedSec = elapsedMs / 1000
    this._elapsedMs = elapsedMs

    // Persist best time and play time
    this._isNewBest = recordBestTime(this, KEYS.BEST_T2, elapsedMs)
    addPlayTime(this, elapsedMs)

    const BASE = 100
    const PENALTY = 3
    const PERFECT = LABELS.length
    const extra = Math.max(0, this._moves - PERFECT)
    const movePenalty = extra * PENALTY
    const timeBonus = elapsedSec < 60 ? 10 : 0
    const wildBonus = this._foundWild ? 15 : 0
    const streakBonus = this._bestStreak // +1 per best streak
    const raw = BASE - movePenalty + timeBonus + wildBonus + streakBonus
    const score = Math.max(10, Math.min(100, Math.round(raw)))

    AudioCtx.fx('success')

    const salesGain = Math.round(score / 5)
    const eqGain = Math.round(score / 8)
    const gritGain = Math.round(score / 10)

    const curSales = this.registry.get(KEYS.STAT_SALES) ?? 0
    const curEQ = this.registry.get(KEYS.STAT_EQ) ?? 0
    const curGrit = this.registry.get(KEYS.STAT_GRIT) ?? 0
    this.registry.set(KEYS.STAT_SALES, Math.min(100, curSales + salesGain))
    this.registry.set(KEYS.STAT_EQ, Math.min(100, curEQ + eqGain))
    this.registry.set(KEYS.STAT_GRIT, Math.min(100, curGrit + gritGain))

    completeLevel(this, KEYS.SCORE_L2, KEYS.COMPLETED_L2, score)

    // Fade cards
    this._cards.forEach(card => {
      this.tweens.add({ targets: card.container, alpha: 0, duration: 500 })
    })

    this.time.delayedCall(700, () => this._drawCompletion(score, salesGain, eqGain, gritGain))
  }

  _drawCompletion(score, salesGain, eqGain, gritGain) {
    const { width, height } = this.cameras.main

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, C.BLACK, 0.9).setAlpha(0)
    this.tweens.add({ targets: overlay, alpha: 0.92, duration: 400 })

    const elems = []

    elems.push(BrutalUI.drawBlockType(this, width / 2, 140, 'MARKET CRACKED', {
      fontSize: '56px',
      color: COLORS.BONE,
      shadowColor: COLORS.SHOCK_LIME,
      shadowOffset: 6,
    }).container)

    const sub = this.add.text(width / 2, 210, '$0 → $1M ARR · 11 COUNTRIES · 12 MONTHS', {
      fontFamily: FONT_MONO, fontSize: '14px', fontStyle: 'bold', color: COLORS.SHOCK_LIME,
      letterSpacing: 2,
    }).setOrigin(0.5)
    elems.push(sub)

    // Score big number
    const scoreNum = this.add.text(width / 2, 300, `${score}%`, {
      fontFamily: FONT_DISPLAY, fontSize: '96px', color: COLORS.BONE,
    }).setOrigin(0.5)
    elems.push(scoreNum)

    const scoreLbl = this.add.text(width / 2, 370, 'SCORE', {
      fontFamily: FONT_MONO, fontSize: '12px', fontStyle: 'bold', color: COLORS.GREY_300,
      letterSpacing: 3,
    }).setOrigin(0.5)
    elems.push(scoreLbl)

    // TIME display
    const totalSec = Math.floor((this._elapsedMs || 0) / 1000)
    const tMin = Math.floor(totalSec / 60)
    const tSec = totalSec % 60
    const timeStr = `TIME: ${tMin}:${tSec.toString().padStart(2, '0')}`
    const timeTxt = this.add.text(width / 2, 400, timeStr, {
      fontFamily: FONT_MONO, fontSize: '14px', fontStyle: 'bold', color: COLORS.BONE,
      letterSpacing: 2,
    }).setOrigin(0.5)
    elems.push(timeTxt)

    if (this._isNewBest) {
      const newBest = BrutalUI.drawSticker(this, width / 2 + 140, 400, 'NEW BEST!', {
        fill: C.HAZARD_YELLOW,
        textColor: COLORS.BLACK,
        fontSize: '12px',
      })
      elems.push(newBest)
    }

    // Stat badges
    const sales = BrutalUI.drawStatBadge(this, width / 2 - 140, 470, salesGain, '+SALES', { accent: C.SHOCK_LIME })
    const eq = BrutalUI.drawStatBadge(this, width / 2, 470, eqGain, '+EQ', { accent: C.SHOCK_LIME })
    const grit = BrutalUI.drawStatBadge(this, width / 2 + 140, 470, gritGain, '+GRIT', { accent: C.SHOCK_LIME })
    elems.push(sales, eq, grit)

    // Return button
    BrutalUI.drawButton(this, width / 2, 620, 280, 56, 'RETURN TO INDEX →', () => {
      AudioCtx.fx('click')
      BrutalUI.pageTurn(this, () => this.scene.start('LevelSelectHub'))
    }, {
      fill: C.SHOCK_LIME,
      labelColor: COLORS.BLACK,
      fontSize: '18px',
      shadowOffset: 6,
    })

    elems.forEach(e => { if (e.setAlpha) e.setAlpha(0) })
    elems.forEach(e => {
      if (e && this.tweens) this.tweens.add({ targets: e, alpha: 1, duration: 500, delay: 300 })
    })

    const returnToHub = () => {
      AudioCtx.fx('click')
      BrutalUI.pageTurn(this, () => this.scene.start('LevelSelectHub'))
    }
    this.input.keyboard.once('keydown-SPACE', returnToHub)
  }
}
