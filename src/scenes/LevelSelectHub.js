import * as Phaser from 'phaser'
import { KEYS } from '../systems/GameRegistry.js'

export class LevelSelectHub extends Phaser.Scene {
  constructor() {
    super('LevelSelectHub')
  }

  create() {
    const { width, height } = this.cameras.main

    // Fade in
    this.cameras.main.fadeIn(300, 0, 0, 0)

    const playerName = this.registry.get(KEYS.PLAYER_NAME) ?? 'friend'

    // Header
    this.add.text(width / 2, 80, `Welcome, ${playerName}.`, {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#00ff88',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, 130, 'Level Select Hub', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#8888aa',
    }).setOrigin(0.5)

    // Placeholder — 5 level slots as dim rectangles
    const slotY = 340
    const slotW = 200
    const slotH = 260
    const gap = 20
    const totalW = 5 * slotW + 4 * gap
    const startX = (width - totalW) / 2 + slotW / 2

    const labels = ['Shanghai', 'Latin America', 'Greenland', 'Agency Factory', 'Interview Room']

    labels.forEach((label, i) => {
      const x = startX + i * (slotW + gap)
      const rect = this.add.rectangle(x, slotY, slotW, slotH, 0x222233)
      rect.setStrokeStyle(2, 0x444466)
      this.add.text(x, slotY - 10, `Level ${i + 1}`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#666677',
      }).setOrigin(0.5)
      this.add.text(x, slotY + 20, label, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#8888aa',
      }).setOrigin(0.5)
      this.add.text(x, slotY + 100, 'Coming soon', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#555566',
        fontStyle: 'italic',
      }).setOrigin(0.5)
    })

    // Footer
    this.add.text(width / 2, height - 40, 'Phase 2 will add the opening cinematic and clickable tiles', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#444455',
      fontStyle: 'italic',
    }).setOrigin(0.5)

    // Shutdown cleanup
    this.events.once('shutdown', () => {
      // No listeners to clean yet — placeholder
    }, this)
  }
}
