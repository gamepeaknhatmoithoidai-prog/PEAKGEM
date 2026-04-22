/**
 * C2Scene9 — Lan Xuất Hiện
 *
 * Flow: dialogue (c2s9-lan or c2s9-lan-warned if scene8Choice=A)
 *       → advance to C2S10Scene (c2Progress = 10)
 */
import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { W, H, DEPTH_BG, DEPTH_WORLD, DEPTH_UI } from '../constants';

const SCENE_KEY = 'C2S9Scene';

export class C2Scene9 extends Phaser.Scene {
  private gs!: GS;

  constructor() { super(SCENE_KEY); }

  create(): void {
    this.gs = new GS(this.registry);

    this.physics.world.gravity.y = 0;

    this.buildBackground();
    this.buildCharacters();
    this.buildTitle();

    this.events.on('dialog-done', this.onDialogDone, this);

    this.cameras.main.fadeIn(500);

    // Choose dialogue variant based on scene 8 choice
    const choice = this.gs.get('scene8Choice') || '';
    const dialogKey = choice === 'A' ? 'c2s9-lan-warned' : 'c2s9-lan';
    this.time.delayedCall(600, () => this.startDialog(dialogKey));

    try { this.sound.play('forest-ambient', { loop: true, volume: 0.08 }); } catch (_) {}
  }

  // ── Background: early dawn at camp ───────────────────────────────────
  private buildBackground(): void {
    const g = this.add.graphics().setDepth(DEPTH_BG);

    // Dawn sky: deep blue-purple to pale gold
    g.fillGradientStyle(0x1a1a3a, 0x1a1a3a, 0xa0c0e8, 0xa0c0e8);
    g.fillRect(0, 0, W, H * 0.6);

    // Horizon glow
    g.fillStyle(0xffd080, 0.3);
    g.fillRect(0, H * 0.45, W, H * 0.2);

    // Ground
    g.fillStyle(0x1e2a0c);
    g.fillRect(0, H * 0.68, W, H * 0.32);

    // Morning mist
    g.fillStyle(0xe8f0ff, 0.12);
    g.fillRect(0, H * 0.55, W, H * 0.18);

    // Trees — misty silhouettes
    const trees = this.add.graphics().setDepth(DEPTH_BG + 0.5);
    trees.fillStyle(0x0d1a06, 0.9);
    for (let x = 0; x < W; x += 70) {
      const ch = 140 + (x % 65);
      trees.fillRect(x + 28, H * 0.68 - ch, 14, ch);
      trees.fillEllipse(x + 35, H * 0.68 - ch, 58, 62);
    }

    // Camp tent (faint)
    const camp = this.add.graphics().setDepth(DEPTH_WORLD - 0.5);
    camp.fillStyle(0x3a5a2a, 0.7);
    camp.fillTriangle(W * 0.75, H * 0.68, W * 0.60, H * 0.48, W * 0.90, H * 0.48);
  }

  private buildCharacters(): void {
    // Thuận — left
    this.drawCharacter(W * 0.30, H * 0.68 - 20, 0x2244aa, 'Thuận', false);
    // K'Brơi — center
    this.drawCharacter(W * 0.48, H * 0.68 - 20, 0x4a3520, 'K\'Brơi', false);
    // Lan — right, slightly forward
    this.drawCharacter(W * 0.65, H * 0.68 - 20, 0x1a4488, 'Lan', false);

    // USB / report visual
    const usb = this.add.graphics().setDepth(DEPTH_WORLD + 1.5);
    usb.fillStyle(0x888888);
    usb.fillRoundedRect(W * 0.65 - 8, H * 0.68 - 82, 16, 10, 2);
    usb.fillStyle(0x333333);
    usb.fillRect(W * 0.65 - 4, H * 0.68 - 92, 8, 12);
  }

  private drawCharacter(x: number, baseY: number, color: number, name: string, _sitting: boolean): void {
    const g = this.add.graphics().setDepth(DEPTH_WORLD + 1);
    g.fillStyle(color);
    g.fillRoundedRect(x - 10, baseY - 52, 20, 52, 4);
    g.fillEllipse(x, baseY - 64, 22, 22);
    this.add.text(x, baseY - 90, name, {
      fontSize: '9px', fontFamily: 'Arial', color: '#fffbe8',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(DEPTH_UI);
  }

  private buildTitle(): void {
    this.add.text(W / 2, 12, 'Chương 2 — Cảnh 9: Lan Xuất Hiện', {
      fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#ccddff', stroke: '#000', strokeThickness: 2,
      backgroundColor: '#00000066', padding: { x: 8, y: 3 },
    }).setOrigin(0.5, 0).setDepth(DEPTH_UI).setScrollFactor(0);
  }

  private startDialog(key: string): void {
    this.scene.launch('DialogScene', { dialogKey: key, sourceScene: SCENE_KEY });
    this.scene.pause();
  }

  private onDialogDone(): void {
    this.scene.resume();
    this.gs.addInventory('usb-data');
    this.gs.addScore(20);
    this.game.events.emit('notify', '💾 Nhận được: USB dữ liệu + Báo cáo khoa học! +20 điểm', '#88ff66');
    this.advanceScene();
  }

  private advanceScene(): void {
    this.gs.set('c2Progress', 10);
    try { this.sound.stopAll(); } catch (_) {}
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Chapter2Scene');
    });
  }

  shutdown(): void {
    this.events.off('dialog-done', this.onDialogDone, this);
  }
}
