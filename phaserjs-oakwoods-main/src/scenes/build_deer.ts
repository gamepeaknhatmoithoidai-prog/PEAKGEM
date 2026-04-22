import Phaser from 'phaser';
import { DEPTH_WORLD, DEPTH_UI } from '../constants';

export interface DeerRefs {
  deerImg: Phaser.GameObjects.Image;
  deerProgressBg: Phaser.GameObjects.Rectangle;
  deerProgressFill: Phaser.GameObjects.Rectangle;
}

export function buildDeer(scene: Phaser.Scene, deerX: number, deerY: number): DeerRefs {
  if (scene.textures.exists('trap'))
    scene.add.image(deerX, deerY + 18, 'trap').setScale(1.6).setDepth(DEPTH_WORLD);

  const deerImg = scene.textures.exists('deer')
    ? scene.add.image(deerX, deerY, 'deer').setScale(0.15).setDepth(DEPTH_WORLD + 1)
    : scene.add.image(deerX, deerY, '__DEFAULT').setDisplaySize(4, 4).setVisible(false);

  const deerProgressBg = scene.add.rectangle(deerX, deerY - 40, 80, 10, 0x223311)
    .setStrokeStyle(1, 0x44aa22).setDepth(DEPTH_UI).setVisible(false);
  const deerProgressFill = scene.add.rectangle(deerX - 38, deerY - 40, 0, 6, 0x44ff44)
    .setDepth(DEPTH_UI + 1).setOrigin(0, 0.5).setVisible(false);

  return { deerImg, deerProgressBg, deerProgressFill };
}
