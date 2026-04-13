import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene.js';
import { TitleScene } from '../scenes/TitleScene.js';
import { GameScene } from '../scenes/GameScene.js';
import { HUDScene } from '../scenes/HUDScene.js';

export const GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game',
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false,
    },
  },
  scene: [BootScene, TitleScene, GameScene, HUDScene],
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};
