/**
 * Chapter2Scene — Scene Router
 *
 * Chapter 1 hard-codes "this.scene.start('Chapter2Scene')" so this key must
 * remain.  This scene acts only as a one-frame router: it reads c2Progress
 * from GameState and immediately launches the correct Chapter-2 sub-scene.
 *
 * Chapter 2 full sequence (Scenes 1–11 + mini-games):
 *   0  C2S1Investigation  — Scene 1: collect clues
 *   1  C2S2Runner         — Scene 2: runner mini-game
 *   2  C2S3Photo          — Scene 3: photo evidence
 *   3  C2S4Stealth        — Scene 4: stealth + dialogue
 *   4  C2S5Scene          — Scene 5: Ama K'Nơi morning (Tea mini-game embedded)
 *   5  C2S6Scene          — Scene 6: Hùng revealed (Flashlight mini-game embedded)
 *   6  C2MiniCrocodile    — Mini-game: Vượt Suối (transition)
 *   7  C2S7Scene          — Scene 7: Ông Thắng xuất hiện
 *   8  C2S8Scene          — Scene 8: Bị mua chuộc + A/B/C (Firefly embedded)
 *   9  C2S9Scene          — Scene 9: Lan xuất hiện
 *   10 C2S10Scene         — Scene 10: Hùng thú nhận (Dossier mini-game embedded)
 *   11 C2S11Scene         — Scene 11: Lựa chọn cuối → direct to EndingX
 *
 * DO NOT add gameplay here — this file must stay minimal.
 */
import Phaser from 'phaser';
import { GS } from '../data/GameState';

const SCENE_SEQUENCE = [
  'C2S1Investigation',  // 0
  'C2S2Runner',         // 1
  'C2S3Photo',          // 2
  'C2S4Stealth',        // 3
  'C2S5Scene',          // 4
  'C2S6Scene',          // 5
  'C2MiniCrocodile',    // 6
  'C2S7Scene',          // 7
  'C2S8Scene',          // 8
  'C2S9Scene',          // 9
  'C2S10Scene',         // 10
  'C2S11Scene',         // 11 — handles endings directly, never returns here
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
      // Should not reach here (C2S11Scene starts endings directly)
      // Fallback: show the legacy ending
      this.scene.stop('UIScene');
      this.scene.start('EndingScene');
    } else {
      this.scene.start(SCENE_SEQUENCE[progress]);
    }
  }
}
