import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import GameScene from './scenes/GameScene';

// ─── Game Config ─────────────────────────────────────────────────────────────
//
// GRAVITY: The world gravity is set here once, at 900 px/s².
// DO NOT also call body.setGravityY() inside scenes — that adds on top of this
// value and can cause the "falls instantly" bug.
//
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  width: 320,
  height: 180,
  backgroundColor: '#1a3a12',
  pixelArt: true,
  roundPixels: true,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 900 },  // ← single source of gravity
      debug: false,               // set true temporarily to see hitboxes
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, GameScene],
};

new Phaser.Game(config);
