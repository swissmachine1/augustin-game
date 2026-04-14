import * as Phaser from 'phaser'
import { BootScene } from '../scenes/BootScene.js'
import { TitleScene } from '../scenes/TitleScene.js'
import { LevelSelectHub } from '../scenes/LevelSelectHub.js'
import { HUDScene } from '../scenes/HUDScene.js'

export const GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game',
  backgroundColor: '#0a0a14',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, TitleScene, LevelSelectHub, HUDScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
}
