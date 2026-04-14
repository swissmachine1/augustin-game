import * as Phaser from 'phaser'
import { KEYS, saveRegistry } from '../systems/GameRegistry.js'

// Level definitions — scene keys will be added in later phases.
// For now only tiles render; "Coming soon" placeholder scenes don't exist yet.
const LEVELS = [
  {
    num: 1,
    title: 'Shanghai',
    subtitle: 'Day-in-the-life pivot',
    teaser: 'A law student has an aha moment',
    sceneKey: 'ShanghaiScene',
    scoreKey: KEYS.SCORE_L1,
    completedKey: KEYS.COMPLETED_L1,
    color: 0xe74c3c,      // neon red (pixel Shanghai)
    teaserColor: '#ff6677',
  },
  {
    num: 2,
    title: 'Latin America',
    subtitle: 'Network builder',
    teaser: 'Zero to $1M ARR across 11 countries',
    sceneKey: null,  // Phase 4
    scoreKey: KEYS.SCORE_L2,
    completedKey: KEYS.COMPLETED_L2,
    color: 0xe67e22,      // warm orange (vector LatAm)
    teaserColor: '#ffaa66',
  },
  {
    num: 3,
    title: 'Greenland',
    subtitle: 'Storm survival',
    teaser: 'Endurance at the edge of the world',
    sceneKey: null,  // Phase 5
    scoreKey: KEYS.SCORE_L3,
    completedKey: KEYS.COMPLETED_L3,
    color: 0x5dade2,      // ice blue (white/blue Greenland)
    teaserColor: '#aaccee',
  },
  {
    num: 4,
    title: 'Agency Factory',
    subtitle: 'n8n routing + debug',
    teaser: 'Build it. Break it. Fix it.',
    sceneKey: null,  // Phase 6
    scoreKey: KEYS.SCORE_L4,
    completedKey: KEYS.COMPLETED_L4,
    color: 0x2ecc71,      // terminal green (Agency)
    teaserColor: '#66ffaa',
  },
  {
    num: 5,
    title: 'Interview Room',
    subtitle: 'Defend your CV',
    teaser: 'Everything you earned. Now use it.',
    sceneKey: null,  // Phase 7
    scoreKey: KEYS.SCORE_L5,
    completedKey: KEYS.COMPLETED_L5,
    color: 0xecf0f1,      // clean white (office)
    teaserColor: '#ffffff',
  },
]

export class LevelSelectHub extends Phaser.Scene {
  constructor() {
    super('LevelSelectHub')
  }

  create() {
    const { width, height } = this.cameras.main

    this.cameras.main.fadeIn(400, 0, 0, 0)

    const playerName = this.registry.get(KEYS.PLAYER_NAME) ?? 'friend'

    // Header
    this.add.text(width / 2, 60, `Welcome, ${playerName}.`, {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#00ff88',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, 98, 'Choose a chapter. Each level is a different game.', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#8888aa',
    }).setOrigin(0.5)

    // Tile grid — 5 tiles, centered
    const tileW = 220
    const tileH = 320
    const gap = 16
    const totalW = 5 * tileW + 4 * gap
    const startX = (width - totalW) / 2 + tileW / 2
    const tileY = height / 2 + 20

    LEVELS.forEach((level, i) => {
      const x = startX + i * (tileW + gap)
      this._createTile(x, tileY, tileW, tileH, level)
    })

    // Footer
    this.add.text(width / 2, height - 30, 'replay unlocked levels to improve your score', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#444455',
      fontStyle: 'italic',
    }).setOrigin(0.5)

    this.events.once('shutdown', () => {}, this)
  }

  _createTile(x, y, w, h, level) {
    const completed = this.registry.get(level.completedKey) === true
    const score = this.registry.get(level.scoreKey) ?? 0
    const playable = level.sceneKey !== null

    // Tile background
    const bg = this.add.rectangle(x, y, w, h, completed ? 0x1a2a1a : 0x16161e)
    bg.setStrokeStyle(2, completed ? level.color : 0x333344)
    bg.setInteractive({ useHandCursor: playable })

    // Tile number
    this.add.text(x, y - h / 2 + 28, `LEVEL ${level.num}`, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#666677',
    }).setOrigin(0.5)

    // Color accent strip (top)
    this.add.rectangle(x, y - h / 2 + 52, w - 40, 3, level.color).setOrigin(0.5)

    // Title
    this.add.text(x, y - 60, level.title, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: completed ? '#ffffff' : level.teaserColor,
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // Subtitle
    this.add.text(x, y - 30, level.subtitle, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#888899',
    }).setOrigin(0.5)

    // Cryptic teaser (dim if not completed, bright if completed)
    this.add.text(x, y + 10, level.teaser, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: completed ? '#aaaaaa' : '#555566',
      fontStyle: 'italic',
      align: 'center',
      wordWrap: { width: w - 30 },
    }).setOrigin(0.5)

    // Silhouette or score display
    if (completed) {
      this.add.text(x, y + 80, `SCORE: ${Math.round(score)}%`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#f1c40f',
        fontStyle: 'bold',
      }).setOrigin(0.5)

      this.add.text(x, y + h / 2 - 40, playable ? 'CLICK TO REPLAY' : 'COMING SOON', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: playable ? '#00ff88' : '#444455',
      }).setOrigin(0.5)
    } else {
      // Silhouette ? marker
      this.add.text(x, y + 80, '?', {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: '#333344',
      }).setOrigin(0.5)

      this.add.text(x, y + h / 2 - 40, playable ? 'CLICK TO PLAY' : 'COMING SOON', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: playable ? '#00ff88' : '#444455',
      }).setOrigin(0.5)
    }

    // Hover / click handlers
    if (playable) {
      bg.on('pointerover', () => {
        bg.setStrokeStyle(3, level.color)
        bg.setFillStyle(completed ? 0x2a3a2a : 0x1e1e28)
      })
      bg.on('pointerout', () => {
        bg.setStrokeStyle(2, completed ? level.color : 0x333344)
        bg.setFillStyle(completed ? 0x1a2a1a : 0x16161e)
      })
      bg.on('pointerdown', () => this._launchLevel(level))
    }
  }

  _launchLevel(level) {
    if (!level.sceneKey) return
    this.cameras.main.fadeOut(400, 0, 0, 0)
    this.time.delayedCall(420, () => {
      this.scene.start(level.sceneKey)
    })
  }
}

// Helper for level scenes to call when they complete — writes score,
// marks completed, saves to localStorage, returns to hub.
export function completeLevel(scene, scoreKey, completedKey, newScore) {
  const previous = scene.registry.get(scoreKey) ?? 0
  // Keep higher score (replay policy)
  if (newScore > previous) {
    scene.registry.set(scoreKey, newScore)
  }
  scene.registry.set(completedKey, true)
  saveRegistry(scene)
}
