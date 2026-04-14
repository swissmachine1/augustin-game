import * as Phaser from 'phaser'

// v2 placeholder — HUD will be re-implemented per-mini-game in their respective phases.
// Each mini-game has different HUD needs (warmth bar for Greenland, score counter for
// LatAm network, stat bars for Interview Room, etc.) so a single shared HUD is wrong.
export class HUDScene extends Phaser.Scene {
  constructor() {
    super('HUDScene')
  }

  create() {
    // Transparent camera — game world shows through
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)')

    // Intentionally empty — mini-game scenes add their own HUD elements.
    this.events.once('shutdown', () => {}, this)
  }
}
