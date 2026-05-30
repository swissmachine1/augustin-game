import { Scene } from 'phaser'
import { KEYS } from '../systems/GameRegistry.js'
import { COLORS, C, FONT_DISPLAY, FONT_MONO, LEVEL_COLORS } from '../config/theme.js'
import { BrutalUI } from '../ui/BrutalUI.js'
import { AudioCtx } from '../ui/AudioCtx.js'
import { Particles } from '../ui/Particles.js'
import { TextReveal } from '../ui/TextReveal.js'

const LEVELS = [
  { num: 1, label: 'SHANGHAI',      scoreKey: KEYS.SCORE_L1, completedKey: KEYS.COMPLETED_L1 },
  { num: 2, label: 'LATIN AMERICA', scoreKey: KEYS.SCORE_L2, completedKey: KEYS.COMPLETED_L2 },
  { num: 3, label: 'THE RIDE',      scoreKey: KEYS.SCORE_L3, completedKey: KEYS.COMPLETED_L3 },
  { num: 4, label: 'AGENCY',        scoreKey: KEYS.SCORE_L4, completedKey: KEYS.COMPLETED_L4 },
  { num: 5, label: 'RECALL',        scoreKey: KEYS.SCORE_L5, completedKey: KEYS.COMPLETED_L5 },
]

const STATS = [
  { key: KEYS.STAT_CURIOSITY,    label: 'CURIOSITY' },
  { key: KEYS.STAT_SALES,        label: 'SALES' },
  { key: KEYS.STAT_EQ,           label: 'EQ' },
  { key: KEYS.STAT_GRIT,         label: 'GRIT' },
  { key: KEYS.STAT_INDEPENDENCE, label: 'INDEPENDENCE' },
  { key: KEYS.STAT_TECH,         label: 'TECH' },
]

export class FinalReportScene extends Scene {
  constructor() {
    super('FinalReportScene')
  }

  create() {
    const { width, height } = this.cameras.main
    this.cameras.main.setBackgroundColor(COLORS.BLACK)
    this.cameras.main.fadeIn(500, 10, 10, 10)

    const name = (this.registry.get(KEYS.PLAYER_NAME) ?? 'friend').toUpperCase()
    const company = (this.registry.get(KEYS.TARGET_COMPANY) ?? '').toUpperCase()
    const playMs = this.registry.get(KEYS.PLAY_TIME_MS) ?? 0
    const playMin = Math.floor(playMs / 60000)
    const playSec = Math.floor((playMs % 60000) / 1000).toString().padStart(2, '0')

    // Grid bg
    const g = this.add.graphics(); g.lineStyle(1, C.GREY_900, 1)
    for (let x = 0; x < width; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, height); g.strokePath() }
    for (let y = 0; y < height; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(width, y); g.strokePath() }

    // Scanlines
    BrutalUI.drawScanlines(this, width, height, { alpha: 0.04, spacing: 3 })

    // Top tag
    BrutalUI.drawSticker(this, 130, 50, 'FILE COMPLETE', {
      fill: C.SHOCK_ACID, fontSize: '13px', rotation: -3 * Math.PI / 180,
    })

    // HERO TITLE
    const titleShadow = this.add.text(width / 2 + 5, 110 + 5, 'AUGUSTIN FILES', {
      fontFamily: FONT_DISPLAY, fontSize: '64px', color: COLORS.SHOCK_RED,
    }).setOrigin(0.5)
    this.add.text(width / 2, 110, 'AUGUSTIN FILES', {
      fontFamily: FONT_DISPLAY, fontSize: '64px', color: COLORS.BONE,
    }).setOrigin(0.5)
    const subShadow = this.add.text(width / 2 + 4, 168 + 4, 'COMPLETE', {
      fontFamily: FONT_DISPLAY, fontSize: '64px', color: COLORS.SHOCK_ACID,
    }).setOrigin(0.5)
    this.add.text(width / 2, 168, 'COMPLETE', {
      fontFamily: FONT_DISPLAY, fontSize: '64px', color: COLORS.BONE,
    }).setOrigin(0.5)

    // Personalized line
    const personalText = company
      ? `${name}, FROM ${company} — YOU NOW KNOW MY STORY.`
      : `${name}, YOU NOW KNOW MY STORY.`
    this.add.text(width / 2, 230, personalText, {
      fontFamily: FONT_MONO, fontSize: '15px', fontStyle: 'bold', color: COLORS.GREY_300,
      align: 'center', wordWrap: { width: width - 120 },
    }).setOrigin(0.5)

    // LEFT — chapter scores
    this.add.text(80, 280, 'CHAPTERS', {
      fontFamily: FONT_MONO, fontSize: '12px', fontStyle: 'bold', color: COLORS.GREY_500,
      letterSpacing: 3,
    }).setOrigin(0, 0)
    BrutalUI.drawRule(this, 80, 302, 580, 302, 2, C.BONE)

    const totalScore = LEVELS.reduce((sum, l) => sum + (this.registry.get(l.scoreKey) ?? 0), 0)
    const avg = Math.round(totalScore / LEVELS.length)

    LEVELS.forEach((lvl, i) => {
      const y = 320 + i * 44
      const score = Math.round(this.registry.get(lvl.scoreKey) ?? 0)
      const accent = LEVEL_COLORS[lvl.num]

      // Chapter number badge
      const badge = this.add.graphics()
      badge.fillStyle(accent.num, 1); badge.fillRect(80, y, 36, 28)
      badge.lineStyle(2, C.BLACK, 1); badge.strokeRect(80, y, 36, 28)
      this.add.text(98, y + 14, `0${lvl.num}`, {
        fontFamily: FONT_DISPLAY, fontSize: '14px', color: COLORS.BLACK,
      }).setOrigin(0.5)

      // Label
      this.add.text(130, y + 14, lvl.label, {
        fontFamily: FONT_MONO, fontSize: '14px', fontStyle: 'bold', color: COLORS.BONE,
      }).setOrigin(0, 0.5)

      // Bar
      const barW = 220, barX = 320, barY = y + 8
      const bg = this.add.graphics()
      bg.fillStyle(C.GREY_900, 1); bg.fillRect(barX, barY, barW, 12)
      const fill = this.add.graphics()
      fill.fillStyle(accent.num, 1); fill.fillRect(barX, barY, 0, 12)
      this.tweens.add({
        targets: { v: 0 }, v: barW * (score / 100), duration: 800, delay: 400 + i * 100, ease: 'Cubic.easeOut',
        onUpdate: (t) => {
          fill.clear(); fill.fillStyle(accent.num, 1); fill.fillRect(barX, barY, t.targets[0].v, 12)
        },
      })

      // Score
      this.add.text(580, y + 14, `${score}%`, {
        fontFamily: FONT_DISPLAY, fontSize: '20px', color: COLORS.BONE,
      }).setOrigin(1, 0.5)
    })

    // RIGHT — stats
    this.add.text(660, 280, 'STATS EARNED', {
      fontFamily: FONT_MONO, fontSize: '12px', fontStyle: 'bold', color: COLORS.GREY_500,
      letterSpacing: 3,
    }).setOrigin(0, 0)
    BrutalUI.drawRule(this, 660, 302, 1200, 302, 2, C.BONE)

    STATS.forEach((s, i) => {
      const y = 320 + i * 36
      const value = Math.round(this.registry.get(s.key) ?? 0)
      this.add.text(660, y + 12, s.label, {
        fontFamily: FONT_MONO, fontSize: '13px', fontStyle: 'bold', color: COLORS.BONE,
      }).setOrigin(0, 0.5)

      const barX = 850, barW = 280, barY = y + 6
      const bg = this.add.graphics()
      bg.fillStyle(C.GREY_900, 1); bg.fillRect(barX, barY, barW, 12)
      const fill = this.add.graphics()
      this.tweens.add({
        targets: { v: 0 }, v: barW * (value / 100), duration: 800, delay: 500 + i * 80, ease: 'Cubic.easeOut',
        onUpdate: (t) => {
          fill.clear(); fill.fillStyle(C.SHOCK_ACID, 1); fill.fillRect(barX, barY, t.targets[0].v, 12)
        },
      })

      this.add.text(1200, y + 12, `${value}`, {
        fontFamily: FONT_DISPLAY, fontSize: '18px', color: COLORS.BONE,
      }).setOrigin(1, 0.5)
    })

    // Summary strip — avg + total time
    const stripY = 560
    BrutalUI.drawRule(this, 80, stripY, 1200, stripY, 3, C.SHOCK_RED)

    const avgBlock = this.add.text(80, stripY + 18, 'OVERALL', {
      fontFamily: FONT_MONO, fontSize: '12px', fontStyle: 'bold', color: COLORS.GREY_500,
      letterSpacing: 3,
    })
    this.add.text(80, stripY + 40, `${avg}%`, {
      fontFamily: FONT_DISPLAY, fontSize: '46px', color: COLORS.BONE,
    })

    this.add.text(400, stripY + 18, 'TIME PLAYED', {
      fontFamily: FONT_MONO, fontSize: '12px', fontStyle: 'bold', color: COLORS.GREY_500,
      letterSpacing: 3,
    })
    this.add.text(400, stripY + 40, `${playMin}:${playSec}`, {
      fontFamily: FONT_DISPLAY, fontSize: '46px', color: COLORS.BONE,
    })

    const rating = avg >= 90 ? 'PERFECT' : avg >= 75 ? 'STRONG' : avg >= 60 ? 'SOLID' : 'OK'
    this.add.text(720, stripY + 18, 'RATING', {
      fontFamily: FONT_MONO, fontSize: '12px', fontStyle: 'bold', color: COLORS.GREY_500,
      letterSpacing: 3,
    })
    this.add.text(720, stripY + 40, rating, {
      fontFamily: FONT_DISPLAY, fontSize: '46px', color: COLORS.SHOCK_ACID,
    })

    // CTAs — book / linkedin / cv
    const ctaY = 670
    BrutalUI.drawButton(this, 280, ctaY, 280, 56, '📅 BOOK A CALL', () => {
      AudioCtx.fx('success')
      window.open('https://cal.com/augustinr/30min', '_blank')
    }, { fill: C.SHOCK_ACID, labelColor: COLORS.BLACK, fontSize: '17px', shadowOffset: 6 })

    BrutalUI.drawButton(this, 640, ctaY, 280, 56, 'LINKEDIN', () => {
      AudioCtx.fx('click')
      window.open('https://www.linkedin.com/in/augustinr/', '_blank')
    }, { fill: C.BONE, labelColor: COLORS.BLACK, fontSize: '17px', shadowOffset: 6 })

    BrutalUI.drawButton(this, 1000, ctaY, 280, 56, 'DOWNLOAD CV', () => {
      AudioCtx.fx('click')
      window.open('/cv.pdf', '_blank')
    }, { fill: C.BLACK, labelColor: COLORS.BONE, fontSize: '17px', shadowOffset: 6 })

    // Home button — also bottom-right "REPLAY"
    BrutalUI.drawHomeButton(this)

    BrutalUI.drawButton(this, width - 80, 50, 130, 36, '↺ REPLAY', () => {
      AudioCtx.fx('snap')
      this.scene.start('LevelSelectHub')
    }, { fill: C.GREY_700, labelColor: COLORS.BONE, fontSize: '11px', shadowOffset: 4 })

    // Shareable link — copies URL with score baked in
    const shareBtn = BrutalUI.drawButton(this, width - 220, 50, 160, 36, '📤 SHARE SCORE', () => {
      AudioCtx.fx('click')
      const url = new URL(window.location.href)
      url.searchParams.set('score', String(avg))
      url.searchParams.set('rating', rating)
      if (name && name !== 'FRIEND') url.searchParams.set('name', name.toLowerCase())
      const text = url.toString()
      const copyAndFeedback = () => {
        Particles.popup(this, width - 220, 90, 'LINK COPIED', '#00ff6a', { fontSize: '14px' })
        shareBtn.text.setText('COPIED ✓')
        this.time.delayedCall(1600, () => shareBtn.text.setText('📤 SHARE SCORE'))
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(copyAndFeedback).catch(() => {})
      } else {
        const ta = document.createElement('textarea')
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'
        document.body.appendChild(ta); ta.select()
        try { document.execCommand('copy'); copyAndFeedback() }
        catch (e) { /* ignore */ }
        document.body.removeChild(ta)
      }
    }, { fill: C.SHOCK_BLUE, labelColor: COLORS.BONE, fontSize: '11px', shadowOffset: 4 })

    // Confetti for completion drama
    this.time.delayedCall(300, () => {
      Particles.confetti(this, width / 2, 60, 50)
      AudioCtx.fx('perfect')
    })
    this.time.delayedCall(1500, () => {
      Particles.confetti(this, width / 2, 60, 30)
    })

    this.events.once('shutdown', () => {
      this.input.keyboard.removeAllListeners()
    }, this)
  }
}
