import * as Phaser from 'phaser'
import { KEYS, saveRegistry } from '../systems/GameRegistry.js'
import { completeLevel } from './LevelSelectHub.js'

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

    // Night sky gradient background (simulated with layered rectangles)
    this._drawBackground()

    // Shanghai skyline silhouette (pixelated rectangles)
    this._drawSkyline()

    // Beat container — all text and choices render here
    this._beatContainer = this.add.container(0, 0)

    // Beat index — start at 0 (morning)
    this._currentBeat = 0
    this._playBeat()

    this.events.once('shutdown', () => {
      this.input.keyboard.removeAllListeners()
    }, this)
  }

  _drawBackground() {
    const { width, height } = this.cameras.main
    // Deep purple-black night
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0618)

    // Neon glow bands (distant city light)
    this.add.rectangle(width / 2, height - 200, width, 200, 0x2a0b3a).setAlpha(0.5)
    this.add.rectangle(width / 2, height - 100, width, 100, 0x4a1a5a).setAlpha(0.4)
  }

  _drawSkyline() {
    const { width, height } = this.cameras.main
    const baseY = height - 60

    // Pixelated building silhouettes — neon edges
    const buildings = [
      { x: 100, w: 60, h: 280, color: 0x1a0a2a, edge: 0xff00ff },
      { x: 180, w: 40, h: 200, color: 0x1a0a2a, edge: 0x00ffff },
      { x: 240, w: 80, h: 340, color: 0x1a0a2a, edge: 0xff00aa },
      { x: 340, w: 50, h: 180, color: 0x1a0a2a, edge: 0x00ff88 },
      { x: 410, w: 70, h: 260, color: 0x1a0a2a, edge: 0xff6600 },
      { x: 950, w: 60, h: 220, color: 0x1a0a2a, edge: 0x00ffff },
      { x: 1030, w: 90, h: 360, color: 0x1a0a2a, edge: 0xff00ff },
      { x: 1140, w: 50, h: 200, color: 0x1a0a2a, edge: 0x00ff88 },
      { x: 1210, w: 60, h: 280, color: 0x1a0a2a, edge: 0xffff00 },
    ]

    buildings.forEach(b => {
      this.add.rectangle(b.x, baseY - b.h / 2, b.w, b.h, b.color)
      // Neon edge line at the top
      this.add.rectangle(b.x, baseY - b.h, b.w, 2, b.edge)
      // Windows — tiny dots of light
      for (let y = 20; y < b.h - 20; y += 18) {
        for (let x = -b.w / 2 + 8; x < b.w / 2 - 4; x += 12) {
          if (Math.random() > 0.4) {
            this.add.rectangle(b.x + x, baseY - b.h + y, 3, 3, b.edge).setAlpha(0.6)
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

    this._showBeatLabel('MORNING — Jiao Tong University', '#ff00aa')

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

    this._showBeatLabel('AFTERNOON — Xintiandi Startup Weekend', '#00ffff')

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

    this._showBeatLabel('EVENING — 2am, Your dorm', '#00ff88')

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

  _showBeatLabel(text, color) {
    const { width } = this.cameras.main
    const label = this.add.text(width / 2, 80, text, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color,
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0)
    this._beatContainer.add(label)

    this.tweens.add({ targets: label, alpha: 1, duration: 400 })
  }

  _showNarration(text, x, y) {
    const narration = this.add.text(x, y, text, {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#e8e8f0',
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
      const bg = this.add.rectangle(width / 2, y, 720, 40, 0x1a1a2a, 0.85)
        .setStrokeStyle(1, 0x444466)
        .setInteractive({ useHandCursor: true })
        .setAlpha(0)

      const txt = this.add.text(width / 2, y, choice.text, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#aaaacc',
      }).setOrigin(0.5).setAlpha(0)

      this._beatContainer.add([bg, txt])

      // Fade in staggered
      this.tweens.add({ targets: [bg, txt], alpha: 1, duration: 400, delay: 700 + i * 150 })

      bg.on('pointerover', () => {
        bg.setStrokeStyle(2, 0x00ff88)
        txt.setColor('#ffffff')
      })
      bg.on('pointerout', () => {
        bg.setStrokeStyle(1, 0x444466)
        txt.setColor('#aaaacc')
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
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#00ff88',
      align: 'center',
      fontStyle: 'italic',
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

    // Show pivot reveal screen
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85)

    this.add.text(width / 2, 200, 'THE PIVOT', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#00ff88',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, 280,
      `Six months later, ${this._playerName},\nAugustin walked out of the law program.\nHe never looked back.`,
      {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 10,
      }
    ).setOrigin(0.5)

    this.add.text(width / 2, 430, `+${gain} Curiosity`, {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#f1c40f',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, 480, `Score: ${finalScore}%`, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#888899',
    }).setOrigin(0.5)

    // Vignette teaser
    this.add.text(width / 2, 560,
      `"A year later, Switzerland gets boring.\nYou buy a one-way ticket to Medellín..."`,
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
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#444455',
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
