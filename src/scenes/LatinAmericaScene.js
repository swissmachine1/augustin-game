import * as Phaser from 'phaser'
import { KEYS } from '../systems/GameRegistry.js'
import { completeLevel } from './LevelSelectHub.js'
import { COLORS, TEXT, C, FONT } from '../config/theme.js'
import { JournalUI } from '../ui/JournalUI.js'

// Level 2 — Latin America: Network Builder
// Player clicks doctors on a stylized LatAm map. Each trained doctor connects to
// 3-5 others (compound growth). "Influential" doctors (visually larger/starred)
// unlock entire countries. Level ends when all 11 countries are lit + $1M ARR hit.

const COUNTRIES = [
  // Positions are game-canvas relative (1280x720), loosely approximating LatAm geography
  { id: 'mx', name: 'Mexico',      x: 180, y: 180, target: 3 },
  { id: 'gt', name: 'Guatemala',   x: 200, y: 270, target: 2 },
  { id: 'co', name: 'Colombia',    x: 340, y: 380, target: 4 },
  { id: 've', name: 'Venezuela',   x: 440, y: 320, target: 3 },
  { id: 'ec', name: 'Ecuador',     x: 290, y: 460, target: 2 },
  { id: 'pe', name: 'Peru',        x: 340, y: 540, target: 3 },
  { id: 'bo', name: 'Bolivia',     x: 460, y: 560, target: 2 },
  { id: 'br', name: 'Brazil',      x: 600, y: 480, target: 5 },
  { id: 'cl', name: 'Chile',       x: 420, y: 660, target: 2 },
  { id: 'ar', name: 'Argentina',   x: 530, y: 660, target: 3 },
  { id: 'uy', name: 'Uruguay',     x: 620, y: 640, target: 2 },
]

const TARGET_ARR = 1_000_000  // $1M

export class LatinAmericaScene extends Phaser.Scene {
  constructor() {
    super('LatinAmericaScene')
  }

  create() {
    const { width, height } = this.cameras.main
    this.cameras.main.fadeIn(400, 0, 0, 0)

    // Parchment background
    JournalUI.drawParchment(this, 0, 0, 1280, 720)

    this._playerName = this.registry.get(KEYS.PLAYER_NAME) ?? 'friend'
    this._startTime = this.time.now
    this._doctorsTrained = 0
    this._doctors = []  // all doctor nodes (ref objects)
    this._connections = []
    this._arr = 0
    this._countriesLit = new Set()
    this._ended = false

    // Right panel — Info UI
    this._drawInfoPanel()

    // Left area — the LatAm "map" with countries
    this._drawMap()
    this._spawnInitialDoctors()
    this._drawIntro()

    // Page number
    JournalUI.drawPageNumber(this, 4)

    this.events.once('shutdown', () => {
      this.input.keyboard.removeAllListeners()
    }, this)
  }

  _drawInfoPanel() {
    const panelX = 900
    // Panel background — parchment-dark inset
    const g = this.add.graphics()
    g.fillStyle(C.PARCHMENT_DARK, 0.5)
    g.fillRect(panelX, 20, 350, 680)
    g.lineStyle(0.5, C.INK, 0.3)
    g.strokeRect(panelX, 20, 350, 680)

    // Title
    this.add.text(panelX + 175, 60, 'LATAM EXPANSION', {
      ...TEXT.title,
      color: COLORS.INK,
    }).setOrigin(0.5)

    this.add.text(panelX + 175, 90, 'Train Key Opinion Leaders', {
      ...TEXT.label,
    }).setOrigin(0.5)

    // ARR ticker
    this.add.text(panelX + 175, 150, 'ARR', {
      ...TEXT.body,
      color: COLORS.INK_LIGHT,
    }).setOrigin(0.5)

    this._arrText = this.add.text(panelX + 175, 180, '$0', {
      ...TEXT.stat,
      fontSize: '28px',
      color: COLORS.LEATHER,
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(panelX + 175, 220, `Target: $1,000,000`, {
      ...TEXT.label,
    }).setOrigin(0.5)

    // Progress bar
    this.add.rectangle(panelX + 175, 250, 260, 8, C.PARCHMENT_DARK).setStrokeStyle(0.5, C.INK, 0.3)
    this._arrBar = this.add.rectangle(panelX + 45, 250, 0, 6, C.LEATHER).setOrigin(0, 0.5)

    // Countries counter
    this.add.text(panelX + 175, 300, 'COUNTRIES LIT', {
      ...TEXT.label,
    }).setOrigin(0.5)

    this._countriesText = this.add.text(panelX + 175, 330, '0 / 11', {
      ...TEXT.stat,
      color: COLORS.INK,
    }).setOrigin(0.5)

    // Doctors counter
    this.add.text(panelX + 175, 390, 'DOCTORS TRAINED', {
      ...TEXT.label,
    }).setOrigin(0.5)

    this._doctorText = this.add.text(panelX + 175, 420, '0', {
      ...TEXT.stat,
      color: COLORS.INK,
    }).setOrigin(0.5)

    // Instructions
    this.add.text(panelX + 175, 500,
      'Click a pulsing doctor\nto train them.\n\nEach doctor trained\nconnects to 3-5 more.\n\nStar doctors (★) unlock\nentire countries.',
      {
        ...TEXT.body,
        color: COLORS.INK_LIGHT,
        align: 'center',
        lineSpacing: 8,
      }
    ).setOrigin(0.5)
  }

  _drawMap() {
    // Dim country labels and hit zones
    this._countryLabels = {}
    COUNTRIES.forEach(c => {
      const bg = this.add.circle(c.x, c.y, 60, C.INK_FADED, 0.06)
      const label = this.add.text(c.x, c.y, c.name, {
        ...TEXT.label,
        color: COLORS.INK_FADED,
      }).setOrigin(0.5)
      this._countryLabels[c.id] = { bg, label }
    })
  }

  _drawIntro() {
    const { width } = this.cameras.main
    const intro = this.add.text(420, 40,
      `No Spanish. No network. No experience.\nClick doctors. Grow the network. Reach $1M.`,
      {
        ...TEXT.bodyItalic,
        color: COLORS.INK_LIGHT,
        align: 'center',
        lineSpacing: 4,
      }
    ).setOrigin(0.5).setAlpha(0)

    this.tweens.add({ targets: intro, alpha: 1, duration: 800 })
  }

  _spawnInitialDoctors() {
    // Start with 2 "entry point" doctors — one in Mexico, one in Argentina
    // These are the KOLs Augustin would have approached first
    this._spawnDoctor(COUNTRIES[0].x + 20, COUNTRIES[0].y + 10, COUNTRIES[0].id, true)
    this._spawnDoctor(COUNTRIES[9].x - 20, COUNTRIES[9].y + 10, COUNTRIES[9].id, true)
  }

  _spawnDoctor(x, y, countryId, influential) {
    const radius = influential ? 14 : 8
    const color = influential ? C.LEATHER : C.INK
    const node = this.add.circle(x, y, radius, color)
    node.setStrokeStyle(2, C.RED_MARGIN)
    node.setInteractive({ useHandCursor: true })

    // Pulsing effect
    const pulseTween = this.tweens.add({
      targets: node,
      scale: 1.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    // Star marker for influential
    let starLabel = null
    if (influential) {
      starLabel = this.add.text(x, y, '★', {
        fontFamily: FONT,
        fontSize: '14px',
        color: COLORS.LEATHER_DARK,
      }).setOrigin(0.5)
    }

    const doctor = {
      node,
      starLabel,
      x, y,
      countryId,
      influential,
      trained: false,
      pulseTween,
    }

    node.on('pointerdown', () => this._trainDoctor(doctor))
    this._doctors.push(doctor)
    return doctor
  }

  _trainDoctor(doctor) {
    if (doctor.trained || this._ended) return
    doctor.trained = true

    // Stop pulse, change appearance — trained doctors are solid
    doctor.pulseTween.stop()
    doctor.node.setScale(1)
    doctor.node.setFillStyle(C.STAMP_GREEN)  // green = trained
    doctor.node.setStrokeStyle(2, C.STAMP_GREEN)
    doctor.node.disableInteractive()

    this._doctorsTrained++
    this._doctorText.setText(String(this._doctorsTrained))

    // ARR gain — influential adds more
    const gain = doctor.influential ? 120_000 : 18_000
    this._arr = Math.min(TARGET_ARR, this._arr + gain)
    this._updateArr()

    // Country lighting — influential doctors light the country immediately
    if (doctor.influential) {
      this._lightCountry(doctor.countryId)
    } else {
      // Regular doctor: contributes fractionally to country target
      this._contributeToCountry(doctor.countryId)
    }

    // Spawn 3-5 new connected doctors (compound growth)
    const connectionCount = 3 + Math.floor(Math.random() * 3)
    for (let i = 0; i < connectionCount; i++) {
      this._spawnConnectedDoctor(doctor)
    }

    // Check win condition
    if (this._countriesLit.size >= COUNTRIES.length && this._arr >= TARGET_ARR) {
      this.time.delayedCall(800, () => this._finish())
    }
  }

  _spawnConnectedDoctor(fromDoctor) {
    // Pick random country — weighted toward same country or neighbors
    const useSameCountry = Math.random() > 0.4
    const country = useSameCountry
      ? COUNTRIES.find(c => c.id === fromDoctor.countryId)
      : COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)]

    // Random offset within country zone
    const angle = Math.random() * Math.PI * 2
    const dist = 20 + Math.random() * 40
    const x = country.x + Math.cos(angle) * dist
    const y = country.y + Math.sin(angle) * dist

    // 1-in-8 chance of being influential
    const influential = Math.random() < 0.125

    const newDoctor = this._spawnDoctor(x, y, country.id, influential)
    newDoctor.node.setAlpha(0)

    // Draw connection line (ink style)
    const line = this.add.line(0, 0, fromDoctor.x, fromDoctor.y, x, y, C.INK_FADED, 0.3)
    line.setOrigin(0, 0).setLineWidth(0.5)
    this._connections.push(line)

    // Fade in new doctor with delay
    this.tweens.add({
      targets: newDoctor.node,
      alpha: 1,
      duration: 300,
      delay: 100 + Math.random() * 200,
    })
    if (newDoctor.starLabel) {
      newDoctor.starLabel.setAlpha(0)
      this.tweens.add({
        targets: newDoctor.starLabel,
        alpha: 1,
        duration: 300,
        delay: 100 + Math.random() * 200,
      })
    }
  }

  _contributeToCountry(countryId) {
    const country = COUNTRIES.find(c => c.id === countryId)
    if (!country) return
    country.progress = (country.progress ?? 0) + 1
    if (country.progress >= country.target && !this._countriesLit.has(countryId)) {
      this._lightCountry(countryId)
    }
  }

  _lightCountry(countryId) {
    if (this._countriesLit.has(countryId)) return
    this._countriesLit.add(countryId)

    const country = COUNTRIES.find(c => c.id === countryId)
    const ui = this._countryLabels[countryId]
    if (ui) {
      ui.bg.setFillStyle(C.RED_MARGIN, 0.2)
      ui.bg.setRadius(70)
      ui.label.setColor(COLORS.LEATHER)
      ui.label.setFontStyle('bold')
      // Small flash
      const flash = this.add.circle(country.x, country.y, 80, C.RED_MARGIN, 0.3)
      this.tweens.add({
        targets: flash,
        alpha: 0,
        scale: 2,
        duration: 600,
        onComplete: () => flash.destroy(),
      })
    }

    // Big ARR boost per country lit
    this._arr = Math.min(TARGET_ARR, this._arr + 50_000)
    this._updateArr()

    this._countriesText.setText(`${this._countriesLit.size} / 11`)
  }

  _updateArr() {
    const displayValue = Math.round(this._arr)
    this._arrText.setText(`$${displayValue.toLocaleString()}`)
    const pct = Math.min(1, this._arr / TARGET_ARR)
    this._arrBar.width = 260 * pct
  }

  _finish() {
    if (this._ended) return
    this._ended = true

    const { width, height } = this.cameras.main

    // Score: based on time-to-completion (faster = higher, capped)
    const elapsedSec = (this.time.now - this._startTime) / 1000
    let score = 100
    if (elapsedSec > 60) score = 80
    if (elapsedSec > 90) score = 60
    if (elapsedSec > 120) score = 40
    if (elapsedSec > 180) score = 20

    // Stat awards
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

    // Overlay — parchment
    this.add.rectangle(width / 2, height / 2, width, height, C.PARCHMENT, 0.92)

    this.add.text(width / 2, 180, '$1M ARR. 11 COUNTRIES.', {
      ...TEXT.title,
      fontSize: '30px',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, 260,
      `From zero Spanish to a full-scale LatAm operation.\nOne trained doctor became a thousand.`,
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

    this.add.text(width / 2, 420,
      `+${salesGain} Sales   +${eqGain} EQ   +${gritGain} Grit`,
      {
        ...TEXT.stamp,
        fontSize: '16px',
      }
    ).setOrigin(0.5)

    // Vignette
    this.add.text(width / 2, 540,
      `"Success feels hollow. You need something\nthat actually hurts. You buy a plane ticket north..."`,
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
