import Phaser from 'phaser';

// All char-*.png files are 2880×2880 spritesheets arranged in a 3×3 grid.
// Each cell (frame) is 960×960 px.  Frame 0 = idle facing south.
export const CHAR_IMG_SIZE       = 960;   // frame size (kept for NPC.ts import compat)
export const CHAR_FRAME          = 0;     // idle south frame index
export const CHAR_DISPLAY_H      = 185;   // cutscene display height (px)
export const CHAR_CUTSCENE_SCALE = CHAR_DISPLAY_H / CHAR_IMG_SIZE;  // ≈ 0.193
export const NPC_CHAR_SCALE      = 86 / CHAR_IMG_SIZE;              // ≈ 0.090, matches player ≈ 86 px tall
export const CHAR_PORTRAIT_SCALE = 330 / CHAR_IMG_SIZE;             // ≈ 0.344, dialog portrait ≈ 330 px tall
export const CHAR_SELECT_SCALE   = 160 / CHAR_IMG_SIZE;             // ≈ 0.167, character select ≈ 160 px tall

/**
 * Place a character (frame 0 of 960×960 spritesheet) with feet at groundY.
 * Uses unified CHAR_CUTSCENE_SCALE for all cutscene characters.
 */
export function placeCharSprite(
  scene: Phaser.Scene,
  x: number,
  groundY: number,
  textureKey: string,
  depth: number,
): Phaser.GameObjects.Sprite {
  return scene.add.sprite(x, groundY, textureKey, CHAR_FRAME)
    .setOrigin(0.5, 1)
    .setScale(CHAR_CUTSCENE_SCALE)
    .setDepth(depth);
}
