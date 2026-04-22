/**
 * C2Scene7 — Ông Thắng Xuất Hiện
 *
 * Flow: dialogue (c2s7-thang) → advance to C2S8Scene (c2Progress = 8)
 */
import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { W, H, DEPTH_BG, DEPTH_WORLD, DEPTH_UI } from '../constants';

const SCENE_KEY = 'C2S7Scene';

export class C2Scene7 extends Phaser.Scene {
  private gs!: GS;

  constructor() { super(SCENE_KEY); }

  create(): void {
    this.gs = new GS(this.registry);

    this.physics.world.gravity.y = 0;

    this.buildBackground();
    this.buildCharacters();
    this.buildTitle();

    this.events.on('dialog-done', this.onDialogDone, this);

    this.cameras.main.fadeIn(600);
    this.time.delayedCall(700, () => this.startDialog('c2s7-thang'));

    try { this.sound.play('forest-ambient', { loop: true, volume: 0.09 }); } catch (_) {}
  }

  // ── Background: camp, afternoon ───────────────────────────────────────
  private buildBackground(): void {
    const g = this.add.graphics().setDepth(DEPTH_BG);

    // Afternoon sky
    g.fillGradientStyle(0x4a90d9, 0x4a90d9, 0x7ac0f5, 0x7ac0f5);
    g.fillRect(0, 0, W, H * 0.55);

    // Ground
    g.fillStyle(0x2a3a10);
    g.fillRect(0, H * 0.68, W, H * 0.32);
    g.fillStyle(0x3a5218);
    g.fillRect(0, H * 0.68, W, 10);

    // Camp elements
    const camp = this.add.graphics().setDepth(DEPTH_WORLD - 0.5);

    // Tent
    camp.fillStyle(0x4a7a3a);
    camp.fillTriangle(W * 0.7, H * 0.68, W * 0.55, H * 0.45, W * 0.85, H * 0.45);
    camp.lineStyle(2, 0x2a4a20);
    camp.strokeTriangle(W * 0.7, H * 0.68, W * 0.55, H * 0.45, W * 0.85, H * 0.45);

    // Camp table
    camp.fillStyle(0x8a5a2a);
    camp.fillRect(W * 0.35, H * 0.62, 120, 10);
    camp.fillRect(W * 0.36, H * 0.62, 8, 28);
    camp.fillRect(W * 0.44, H * 0.62, 8, 28);

    // Trees
    const trees = this.add.graphics().setDepth(DEPTH_BG + 0.5);
    trees.fillStyle(0x1e3d0a);
    for (let x = 0; x < W; x += 65) {
      const ch = 130 + (x % 70);
      trees.fillRect(x + 25, H * 0.68 - ch, 15, ch);
      trees.fillEllipse(x + 33, H * 0.68 - ch, 60, 65);
    }

    // Afternoon light
    g.fillStyle(0xffee88, 0.06);
    g.fillRect(0, 0, W, H);
  }

  private buildCharacters(): void {
    // Thuận — center-left
    this.drawCharacter(W * 0.32, H * 0.68 - 20, 0x2244aa, 'Thuận', false);
    // Ông Thắng — center, authoritative posture, darker suit
    this.drawCharacter(W * 0.55, H * 0.68 - 20, 0x2a2a2a, 'Nguyễn Văn Thắng', false);
    // Dress details for Thắng
    const thang = this.add.graphics().setDepth(DEPTH_WORLD + 1.5);
    thang.fillStyle(0x555555);
    thang.fillRect(W * 0.55 - 4, H * 0.68 - 30, 8, 12);  // collar
  }

  private drawCharacter(x: number, baseY: number, color: number, name: string, sitting: boolean): void {
    const g = this.add.graphics().setDepth(DEPTH_WORLD + 1);
    const h = sitting ? 34 : 52;
    g.fillStyle(color);
    g.fillRoundedRect(x - 10, baseY - h, 20, h, 4);
    g.fillEllipse(x, baseY - h - 12, 22, 22);

    this.add.text(x, baseY - h - 28, name, {
      fontSize: '9px', fontFamily: 'Arial', color: '#fffbe8',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(DEPTH_UI);
  }

  private buildTitle(): void {
    this.add.text(W / 2, 12, 'Chương 2 — Cảnh 7: Ông Thắng Xuất Hiện', {
      fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#ddeeff', stroke: '#000', strokeThickness: 2,
      backgroundColor: '#00000066', padding: { x: 8, y: 3 },
    }).setOrigin(0.5, 0).setDepth(DEPTH_UI).setScrollFactor(0);
  }

  private startDialog(key: string): void {
    this.scene.launch('DialogScene', { dialogKey: key, sourceScene: SCENE_KEY });
    this.scene.pause();
  }

  private onDialogDone(): void {
    this.scene.resume();
    this.advanceScene();
  }

  private advanceScene(): void {
    this.gs.set('c2Progress', 8);
    try { this.sound.stopAll(); } catch (_) {}
    this.cameras.main.fadeOut(600);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Chapter2Scene');
    });
  }

  shutdown(): void {
    this.events.off('dialog-done', this.onDialogDone, this);
  }
}
