import * as Phaser from 'phaser'
import { KEYS, saveRegistry } from '../systems/GameRegistry.js'
import { completeLevel } from './LevelSelectHub.js'
import { COLORS, TEXT, C } from '../config/theme.js'
import { JournalUI } from '../ui/JournalUI.js'

// Level 1 — Shanghai: Day-in-the-Life Pivot
// 3 beats: Morning law class → Afternoon startup weekend → Evening decision.
// Player makes small choices in each beat. Score based on curiosity shown.
export class ShanghaiScene extends Phaser.Scene {
  constructor() {
    super('ShanghaiScene')
  }

  create() {
    const { width, height } = this.cameras.main
    this.cameras.main.fadeIn(500, 0, 0, 0)

    this._score = 0  // 0-100% based on "curious" choices
    this._playerName = this.registry.get(KEYS.PLAYER_NAME) ?? 'friend'

    // Parchment background
    JournalUI.drawParchment(this, 0, 0, 1280, 720)

    // Shanghai skyline silhouette (ink sketch style)
    this._drawSkyline()

    // Beat container — all text and choices render here
    this._beatContainer = this.add.container(0, 0)

    // Beat index — start at 0 (morning)
    this._currentBeat = 0
    this._playBeat()

    // Page number
    JournalUI.drawPageNumber(this, 2)

    this.events.once('shutdown', () => {
      this.input.keyboard.removeAllListeners()
    }, this)
  }

  _drawSkyline() {
    const { width, height } = this.cameras.main
    const baseY = height - 60

    // Ink-sketch building silhouettes
    const buildings = [
      { x: 100, w: 60, h: 280 },
      { x: 180, w: 40, h: 200 },
      { x: 240, w: 80, h: 340 },
      { x: 340, w: 50, h: 180 },
      { x: 410, w: 70, h: 260 },
      { x: 950, w: 60, h: 220 },
      { x: 1030, w: 90, h: 360 },
      { x: 1140, w: 50, h: 200 },
      { x: 1210, w: 60, h: 280 },
    ]

    const g = this.add.graphics()
    buildings.forEach(b => {
      // Faded ink silhouette
      g.fillStyle(C.INK, 0.06)
      g.fillRect(b.x - b.w / 2, baseY - b.h, b.w, b.h)
      // Ink outline at top
      g.lineStyle(0.5, C.INK, 0.15)
      g.strokeRect(b.x - b.w / 2, baseY - b.h, b.w, b.h)
      // Window dots — tiny ink marks
      for (let y = 20; y < b.h - 20; y += 18) {
        for (let x = -b.w / 2 + 8; x < b.w / 2 - 4; x += 12) {
          if (Math.random() > 0.4) {
            g.fillStyle(C.INK, 0.12)
            g.fillRect(b.x + x, baseY - b.h + y, 2, 2)
          }
        }
      }
    })
  }

  _playBeat() {
    this._beatContainer.removeAll(true)

    if (this._currentBeat === 0) this._beatMorning()
    else if (this._currentBeat === 1) this._beatAfternoon()
    else if (this._currentBeat === 2) this._beatEvening()
    else this._finish()
  }

  _beatMorning() {
    const { width, height } = this.cameras.main

    this._showBeatLabel('MORNING — Jiao Tong University')

    this._showNarration(
      `You're in a lecture hall.\nInternational commercial law.\nRow 4. Back left. Exit in sight.`,
      width / 2, 240
    )

    this._showChoices(240 + 180, [
      {
        text: '→ Take notes diligently',
        score: 10,
        feedback: 'You try. But the arbitration clauses blur together.',
      },
      {
        text: '→ Sketch your next startup idea in the margin',
        score: 25,
        feedback: 'The professor is mid-sentence. You draw a wireframe.',
      },
      {
        text: '→ Open your laptop. Browse Product Hunt.',
        score: 25,
        feedback: 'Someone just launched a Shanghai food app. You read every comment.',
      },
    ])
  }

  _beatAfternoon() {
    const { width, height } = this.cameras.main

    this._showBeatLabel('AFTERNOON — Xintiandi Startup Weekend')

    this._showNarration(
      `A friend dragged you here.\n54 hours. Strangers. An idea.\nThe pitch round starts in 20 minutes.`,
      width / 2, 240
    )

    this._showChoices(240 + 180, [
      {
        text: '→ Hang back. Watch the pitches.',
        score: 10,
        feedback: 'You listen. Something stirs.',
      },
      {
        text: '→ Introduce yourself to the designer in the corner',
        score: 25,
        feedback: `"I don't know anything about code," you say. She smiles: "Me neither. Yet."`,
      },
      {
        text: `→ Grab the mic. Pitch an idea you've never said out loud.`,
        score: 30,
        feedback: 'Your voice shakes. Three people raise their hand to join your team.',
      },
    ])
  }

  _beatEvening() {
    const { width, height } = this.cameras.main

    this._showBeatLabel('EVENING — 2am, Your dorm')

    this._showNarration(
      `The weekend ended four hours ago.\nYour team didn't win. Didn't come close.\nBut something clicked.`,
      width / 2, 240
    )

    this._showChoices(240 + 200, [
      {
        text: '→ Finish the law thesis. Play it safe.',
        score: 5,
        feedback: `You tell yourself you'll circle back to "the tech thing" later. You never will.`,
      },
      {
        text: `→ Email the dean. "I need to talk about my career."`,
        score: 30,
        feedback: `Subject: "A change of direction." You hit send before you can second-guess it.`,
      },
    ])
  }

  _showBeatLabel(text) {
    const { width } = this.cameras.main
    const label = this.add.text(width / 2, 80, text, {
      ...TEXT.heading,
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0)
    this._beatContainer.add(label)

    this.tweens.add({ targets: label, alpha: 1, duration: 400 })
  }

  _showNarration(text, x, y) {
    const narration = this.add.text(x, y, text, {
      ...TEXT.chapter,
      fontSize: '20px',
      align: 'center',
      lineSpacing: 10,
    }).setOrigin(0.5).setAlpha(0)
    this._beatContainer.add(narration)

    this.tweens.add({ targets: narration, alpha: 1, duration: 600, delay: 300 })
  }

  _showChoices(startY, choices) {
    const { width } = this.cameras.main
    const spacing = 48

    choices.forEach((choice, i) => {
      const y = startY + i * spacing
      const bg = this.add.rectangle(width / 2, y, 720, 40, C.PARCHMENT_DARK, 0.6)
        .setStrokeStyle(0.5, C.INK, 0.3)
        .setInteractive({ useHandCursor: true })
        .setAlpha(0)

      const txt = this.add.text(width / 2, y, choice.text, {
        ...TEXT.body,
        fontSize: '15px',
      }).setOrigin(0.5).setAlpha(0)

      this._beatContainer.add([bg, txt])

      // Fade in staggered
      this.tweens.add({ targets: [bg, txt], alpha: 1, duration: 400, delay: 700 + i * 150 })

      bg.on('pointerover', () => {
        bg.setStrokeStyle(1.5, C.INK, 0.6)
        txt.setColor(COLORS.INK)
        txt.setFontStyle('bold')
      })
      bg.on('pointerout', () => {
        bg.setStrokeStyle(0.5, C.INK, 0.3)
        txt.setColor(COLORS.INK)
        txt.setFontStyle('')
      })
      bg.on('pointerdown', () => this._handleChoice(choice))
    })
  }

  _handleChoice(choice) {
    this._score += choice.score

    // Disable further clicks by destroying the beat container contents
    this._beatContainer.each(child => {
      if (child.disableInteractive) child.disableInteractive()
    })

    const { width, height } = this.cameras.main

    // Show feedback text
    const feedback = this.add.text(width / 2, height - 120, choice.feedback, {
      ...TEXT.bodyItalic,
      fontSize: '15px',
      color: COLORS.INK_LIGHT,
      align: 'center',
      wordWrap: { width: width - 100 },
    }).setOrigin(0.5).setAlpha(0)
    this._beatContainer.add(feedback)

    this.tweens.add({
      targets: feedback,
      alpha: 1,
      duration: 500,
      onComplete: () => {
        this.time.delayedCall(2400, () => {
          this._currentBeat++
          this.cameras.main.fadeOut(400, 0, 0, 0)
          this.time.delayedCall(420, () => {
            this.cameras.main.fadeIn(400, 0, 0, 0)
            this._playBeat()
          })
        })
      },
    })
  }

  _finish() {
    const { width, height } = this.cameras.main

    // Cap score at 100
    const finalScore = Math.min(100, this._score)

    // Award Curiosity stat (score/5 = 0-20 points added)
    const currentCuriosity = this.registry.get(KEYS.STAT_CURIOSITY) ?? 0
    const gain = Math.round(finalScore / 5)
    this.registry.set(KEYS.STAT_CURIOSITY, Math.min(100, currentCuriosity + gain))

    // Mark level complete + save
    completeLevel(this, KEYS.SCORE_L1, KEYS.COMPLETED_L1, finalScore)

    // Show pivot reveal screen — parchment overlay
    this.add.rectangle(width / 2, height / 2, width, height, C.PARCHMENT, 0.92)

    this.add.text(width / 2, 200, 'THE PIVOT', {
      ...TEXT.title,
      fontSize: '36px',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, 280,
      `Six months later, ${this._playerName},\nAugustin walked out of the law program.\nHe never looked back.`,
      {
        ...TEXT.chapter,
        fontSize: '20px',
        align: 'center',
        lineSpacing: 10,
      }
    ).setOrigin(0.5)

    this.add.text(width / 2, 430, `+${gain} Curiosity`, {
      ...TEXT.stamp,
      fontSize: '22px',
      color: COLORS.STAMP_GREEN,
    }).setOrigin(0.5)

    this.add.text(width / 2, 480, `Score: ${finalScore}%`, {
      ...TEXT.body,
      fontSize: '16px',
      color: COLORS.INK_FADED,
    }).setOrigin(0.5)

    // Vignette teaser
    this.add.text(width / 2, 560,
      `"A year later, Switzerland gets boring.\nYou buy a one-way ticket to Medellín..."`,
      {
        ...TEXT.prompt,
        fontSize: '14px',
        align: 'center',
        lineSpacing: 6,
      }
    ).setOrigin(0.5)

    this.add.text(width / 2, 650, 'PRESS SPACE to return to the hub', {
      ...TEXT.small,
      color: COLORS.INK_FADED,
    }).setOrigin(0.5)

    // Auto-advance after 8s, or SPACE to skip
    const returnToHub = () => {
      this.cameras.main.fadeOut(400, 0, 0, 0)
      this.time.delayedCall(420, () => this.scene.start('LevelSelectHub'))
    }

    this.input.keyboard.once('keydown-SPACE', returnToHub)
    this.time.delayedCall(8000, returnToHub)
  }
}
