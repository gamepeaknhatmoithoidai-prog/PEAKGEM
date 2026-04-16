/**
 * Chapter2Scene — Scene Router
 *
 * Chapter 1 hard-codes "this.scene.start('Chapter2Scene')" so this key must
 * remain.  This scene acts only as a one-frame router: it reads c2Progress
 * from GameState and immediately launches the correct Chapter-2 sub-scene.
 *
 * Chapter 2 sub-scene keys:
 *   C2S1Investigation  → Scene 1 + Game 1 (Collect clues)
 *   C2S2Runner         → Scene 2 + Game 2 (Dino-style runner)
 *   C2S3Photo          → Scene 3 + Game 3 (Photo evidence)
 *   C2S4Stealth        → Scene 4  (Stealth + Dialogue + Decisions)
 *
 * DO NOT add gameplay here — this file must stay minimal.
 */
import Phaser from 'phaser';
import { GS } from '../data/GameState';

const SCENE_SEQUENCE = [
  'C2S1Investigation',
  'C2S2Runner',
  'C2S3Photo',
  'C2S4Stealth',
] as const;

export class Chapter2Scene extends Phaser.Scene {
  constructor() { super('Chapter2Scene'); }

  create(): void {
    const gs = new GS(this.registry);
    gs.set('chapter', 2);

    // Ensure the HUD is running (Chapter 1 relaunches it, but guard anyway)
    if (!this.scene.isActive('UIScene')) {
      this.scene.launch('UIScene');
    }

    const progress = (gs.get('c2Progress') as number) || 0;

    if (progress >= SCENE_SEQUENCE.length) {
      // All Chapter-2 scenes complete — go to ending
      this.scene.stop('UIScene');
      this.scene.start('EndingScene');
    } else {
      this.scene.start(SCENE_SEQUENCE[progress]);
    }
  }
}
