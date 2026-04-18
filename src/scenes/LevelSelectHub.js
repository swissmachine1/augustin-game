import * as Phaser from 'phaser'
import { KEYS, saveRegistry } from '../systems/GameRegistry.js'
import { COLORS, TEXT, C } from '../config/theme.js'
import { JournalUI } from '../ui/JournalUI.js'

const LEVELS = [
  {
    num: 1, title: 'Shanghai', subtitle: 'The Spark',
    teaser: '"Something clicked that weekend."',
    sceneKey: 'ShanghaiScene',
    scoreKey: KEYS.SCORE_L1, completedKey: KEYS.COMPLETED_L1,
    stampColor: C.STAMP_BLUE, year: 2014,
  },
  {
    num: 2, title: 'Latin America', subtitle: 'The Network',
    teaser: '"Zero to $1M, one doctor at a time."',
    sceneKey: 'LatinAmericaScene',
    scoreKey: KEYS.SCORE_L2, completedKey: KEYS.COMPLETED_L2,
    stampColor: C.STAMP_GREEN, year: 2019,
  },
  {
    num: 3, title: 'Greenland', subtitle: 'The Storm',
    teaser: '"Endurance at the edge of the world."',
    sceneKey: 'GreenlandScene',
    scoreKey: KEYS.SCORE_L3, completedKey: KEYS.COMPLETED_L3,
    stampColor: C.STAMP_BLUE, year: 2007,
  },
  {
    num: 4, title: 'Agency Factory', subtitle: 'The Machine',
    teaser: '"Build it. Break it. Fix it."',
    sceneKey: 'AgencyFactoryScene',
    scoreKey: KEYS.SCORE_L4, completedKey: KEYS.COMPLETED_L4,
    stampColor: C.STAMP_GREEN, year: 2023,
  },
  {
    num: 5, title: 'Interview Room', subtitle: 'The Proof',
    teaser: '"Everything you earned. Now defend it."',
    sceneKey: 'InterviewRoomScene',
    scoreKey: KEYS.SCORE_L5, completedKey: KEYS.COMPLETED_L5,
    stampColor: C.RED_MARGIN, year: 2026,
  },
]

export class LevelSelectHub extends Phaser.Scene {
  constructor() {
    super('LevelSelectHub')
  }

  create() {
    const { width, height } = this.cameras.main
    this.cameras.main.fadeIn(400, 244, 232, 208)

    const playerName = this.registry.get(KEYS.PLAYER_NAME) ?? 'friend'

    // Parchment background
    JournalUI.drawParchment(this, 0, 0, width, height)

    // Page header
    this.add.text(140, 40, 'Table of Contents', TEXT.title).setOrigin(0)

    const g = this.add.graphics()
    g.lineStyle(0.5, C.INK, 0.3)
    g.beginPath()
    g.moveTo(140, 72)
    g.lineTo(500, 72)
    g.strokePath()

    this.add.text(140, 82, `${playerName}'s expedition journal`, TEXT.bodyItalic)

    // Compass rose (top right)
    JournalUI.drawCompass(this, width - 80, 70, 30)

    // Page number
    JournalUI.drawPageNumber(this, 1)

    // Level entries — styled as chapter listings
    const startY = 140
    const spacing = 100

    LEVELS.forEach((level, i) => {
      this._drawChapterEntry(level, 140, startY + i * spacing, width - 200)
    })

    // Footer
    this.add.text(width / 2, height - 25, 'Click a chapter to begin. Replay to improve your score.', {
      ...TEXT.label,
      fontSize: '9px',
    }).setOrigin(0.5)

    this.events.once('shutdown', () => {}, this)
  }

  _drawChapterEntry(level, x, y, w) {
    const completed = this.registry.get(level.completedKey) === true
    const score = this.registry.get(level.scoreKey) ?? 0

    // Chapter number + title
    const chapterText = `Chapter ${level.num}. ${level.title}`
    const titleT = this.add.text(x, y, chapterText, {
      ...TEXT.heading,
      fontSize: '18px',
      color: completed ? COLORS.INK : COLORS.INK_LIGHT,
    })

    // Dotted line from title to page number
    const dots = this.add.graphics()
    dots.lineStyle(0.3, C.INK_FADED, 0.4)
    const titleEnd = x + titleT.width + 10
    const lineEnd = x + w - 50
    for (let dx = titleEnd; dx < lineEnd; dx += 6) {
      dots.fillStyle(C.INK_FADED, 0.4)
      dots.fillCircle(dx, y + 12, 0.5)
    }

    // "Page" number on right
    this.add.text(x + w - 20, y, `p. ${level.num * 2}`, TEXT.pageNum).setOrigin(1, 0)

    // Subtitle
    this.add.text(x + 20, y + 26, `— ${level.subtitle}`, TEXT.bodyItalic)

    // Teaser quote or score
    if (completed) {
      this.add.text(x + 20, y + 48, `Score: ${Math.round(score)}%`, {
        ...TEXT.body,
        color: COLORS.STAMP_GREEN,
      })

      // Small passport stamp
      JournalUI.drawPassportStamp(this, x + w - 60, y + 30, level.title, level.year, -5 + Math.random() * 10)
    } else {
      this.add.text(x + 20, y + 48, level.teaser, {
        ...TEXT.label,
        fontSize: '10px',
        fontStyle: 'italic',
      })
    }

    // Clickable hit area (invisible rect over the chapter entry)
    const hitArea = this.add.rectangle(x + w / 2, y + 32, w, 70, 0x000000, 0)
    hitArea.setInteractive({ useHandCursor: true })

    hitArea.on('pointerover', () => {
      titleT.setColor(COLORS.RED_MARGIN)
    })
    hitArea.on('pointerout', () => {
      titleT.setColor(completed ? COLORS.INK : COLORS.INK_LIGHT)
    })
    hitArea.on('pointerdown', () => this._launchLevel(level))
  }

  _launchLevel(level) {
    if (!level.sceneKey) return
    this.cameras.main.fadeOut(400, 244, 232, 208)
    this.time.delayedCall(420, () => {
      this.scene.start(level.sceneKey)
    })
  }
}

export function completeLevel(scene, scoreKey, completedKey, newScore) {
  const previous = scene.registry.get(scoreKey) ?? 0
  if (newScore > previous) {
    scene.registry.set(scoreKey, newScore)
  }
  scene.registry.set(completedKey, true)
  saveRegistry(scene)
}
