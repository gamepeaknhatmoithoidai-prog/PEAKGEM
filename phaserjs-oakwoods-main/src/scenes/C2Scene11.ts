/**
 * C2Scene11 — Khoảnh Khắc Quyết Định Cuối
 *
 * Flow: farewell dialogue (c2s11-farewell) → fullscreen 3-choice popup
 *       → store finalChoice → start EndingRed / EndingBlack / EndingYellow
 *       (does NOT return to Chapter2Scene)
 */
import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { W, H, DEPTH_BG, DEPTH_WORLD, DEPTH_UI } from '../constants';

const SCENE_KEY = 'C2S11Scene';

export class C2Scene11 extends Phaser.Scene {
  private gs!: GS;
  private choiceDone = false;

  constructor() { super(SCENE_KEY); }

  create(): void {
    this.gs         = new GS(this.registry);
    this.choiceDone = false;

    this.physics.world.gravity.y = 0;

    this.buildBackground();
    this.buildCharacters();
    this.buildTitle();

    this.events.on('dialog-done', this.onDialogDone, this);

    this.cameras.main.fadeIn(700);
    this.time.delayedCall(800, () => this.startDialog('c2s11-farewell'));

    try { this.sound.play('forest-ambient', { loop: true, volume: 0.06 }); } catch (_) {}
  }

  // ── Background: golden morning, departure road ───────────────────────
  private buildBackground(): void {
    const g = this.add.graphics().setDepth(DEPTH_BG);

    // Golden dawn sky
    g.fillGradientStyle(0x2a6ab0, 0x2a6ab0, 0xf9c740, 0xf9c740);
    g.fillRect(0, 0, W, H * 0.60);

    // Horizon glow
    g.fillStyle(0xffdd66, 0.4);
    g.fillRect(0, H * 0.48, W, H * 0.18);

    // Ground / road
    g.fillStyle(0x3b2a14);
    g.fillRect(0, H * 0.70, W, H * 0.30);

    // Dirt road path
    g.fillStyle(0x7a5a38);
    g.fillTrapezoid ? g.fillTrapezoid(W / 2, H, W * 0.15, W * 0.5, H * 0.3) : null;
    // Fallback road path using polygon
    g.fillStyle(0x8a6840);
    g.fillTriangle(W / 2 - W * 0.08, H, W / 2 + W * 0.08, H, W / 2 + W * 0.25, H * 0.70);
    g.fillTriangle(W / 2 - W * 0.08, H, W / 2 - W * 0.25, H * 0.70, W / 2 + W * 0.25, H * 0.70);

    // Trees lining both sides — tall and golden
    const trees = this.add.graphics().setDepth(DEPTH_BG + 0.5);
    trees.fillStyle(0x1e3d0a);
    for (let x = 0; x < W * 0.25; x += 65) {
      const ch = 170 + (x % 50);
      trees.fillRect(x + 26, H * 0.70 - ch, 14, ch);
      trees.fillEllipse(x + 33, H * 0.70 - ch, 60, 65);
    }
    for (let x = W * 0.75; x < W; x += 65) {
      const ch = 170 + (x % 50);
      trees.fillRect(x, H * 0.70 - ch, 14, ch);
      trees.fillEllipse(x + 7, H * 0.70 - ch, 60, 65);
    }

    // Morning light rays
    const rays = this.add.graphics().setDepth(DEPTH_BG + 0.3);
    rays.fillStyle(0xfff0a0, 0.07);
    rays.fillTriangle(W * 0.40, H * 0.30, W * 0.25, H, W * 0.55, H);
    rays.fillTriangle(W * 0.60, H * 0.28, W * 0.44, H, W * 0.74, H);
  }

  private buildCharacters(): void {
    // Ama K'Nơi — gate, left side (central)
    this.drawCharacter(W * 0.28, H * 0.70 - 10, 0x8b5a2b, 'Ama K\'Nơi', true);
    // K'Brơi — behind/beside Ama
    this.drawCharacter(W * 0.40, H * 0.70 - 20, 0x4a3520, 'K\'Brơi', false);
    // Thuận — right, facing away (about to leave)
    this.drawCharacter(W * 0.65, H * 0.70 - 20, 0x2244aa, 'Thuận', false);
  }

  private drawCharacter(x: number, baseY: number, color: number, name: string, sitting: boolean): void {
    const g = this.add.graphics().setDepth(DEPTH_WORLD + 1);
    const h = sitting ? 34 : 52;
    g.fillStyle(color);
    g.fillRoundedRect(x - 10, baseY - h, 20, h, 4);
    g.fillEllipse(x, baseY - h - 12, 22, 22);
    this.add.text(x, baseY - h - 28, name, {
      fontSize: '10px', fontFamily: 'Arial', color: '#fffbe8',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(DEPTH_UI);
  }

  private buildTitle(): void {
    this.add.text(W / 2, 12, 'Chương 2 — Cảnh 11: Khoảnh Khắc Quyết Định', {
      fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#fff5cc', stroke: '#000', strokeThickness: 2,
      backgroundColor: '#00000066', padding: { x: 8, y: 3 },
    }).setOrigin(0.5, 0).setDepth(DEPTH_UI).setScrollFactor(0);
  }

  private startDialog(key: string): void {
    this.scene.launch('DialogScene', { dialogKey: key, sourceScene: SCENE_KEY });
    this.scene.pause();
  }

  private onDialogDone(): void {
    this.scene.resume();
    if (!this.choiceDone) {
      this.time.delayedCall(600, () => this.showFinalChoice());
    }
  }

  // ── Final choice popup ────────────────────────────────────────────────
  private showFinalChoice(): void {
    // Full-screen dark overlay
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.80).setDepth(20);
    this.tweens.add({ targets: overlay, alpha: 0.80, duration: 600 });

    // Title
    this.add.text(W / 2, 55, 'Thuận sẽ làm gì?', {
      fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#f5e6c8', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(21);

    // Warning
    this.add.text(W / 2, H - 28, 'Lựa chọn này không thể thay đổi.', {
      fontSize: '11px', fontFamily: 'Arial', color: '#888888',
      stroke: '#000', strokeThickness: 1,
    }).setOrigin(0.5, 1).setDepth(21);

    // The three choices
    this.buildChoiceBtn(
      W / 2, 180,
      '🔴  CÔNG BỐ SỰ THẬT',
      'Gửi toàn bộ hồ sơ cho báo môi trường\n+ cơ quan chức năng + mạng xã hội ngay hôm nay.',
      0xcc2222, 'red',
    );
    this.buildChoiceBtn(
      W / 2, 310,
      '⚫  GIỮ IM LẶNG',
      'Về TPHCM, nộp luận văn.\nKhông làm gì thêm.',
      0x333333, 'black',
    );
    this.buildChoiceBtn(
      W / 2, 430,
      '🟡  THƯƠNG LƯỢNG',
      'Gặp lại ông Thắng: đề xuất đánh giá môi trường độc lập\n+ tái định cư có điều kiện + giảm diện tích dự án.',
      0xaa8800, 'yellow',
    );
  }

  private buildChoiceBtn(
    cx: number, cy: number,
    titleTxt: string, descTxt: string,
    bgColor: number, choice: string,
  ): void {
    const BTN_W = 560, BTN_H = 100;
    const bg = this.add.graphics().setDepth(22);
    bg.fillStyle(bgColor, 0.85);
    bg.fillRoundedRect(cx - BTN_W / 2, cy - BTN_H / 2, BTN_W, BTN_H, 10);
    bg.lineStyle(2, 0xffffff, 0.35);
    bg.strokeRoundedRect(cx - BTN_W / 2, cy - BTN_H / 2, BTN_W, BTN_H, 10);

    this.add.text(cx, cy - 22, titleTxt, {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(23);

    this.add.text(cx, cy + 20, descTxt, {
      fontSize: '10px', fontFamily: 'Arial', color: '#eeeeee',
      align: 'center', wordWrap: { width: BTN_W - 30 },
    }).setOrigin(0.5).setDepth(23);

    // Hit zone
    const zone = this.add.zone(cx, cy, BTN_W, BTN_H).setDepth(24).setInteractive();
    zone.on('pointerover', () => { bg.clear();
      bg.fillStyle(bgColor, 1.0);
      bg.fillRoundedRect(cx - BTN_W / 2, cy - BTN_H / 2, BTN_W, BTN_H, 10);
      bg.lineStyle(3, 0xffffff, 0.7);
      bg.strokeRoundedRect(cx - BTN_W / 2, cy - BTN_H / 2, BTN_W, BTN_H, 10);
    });
    zone.on('pointerout', () => { bg.clear();
      bg.fillStyle(bgColor, 0.85);
      bg.fillRoundedRect(cx - BTN_W / 2, cy - BTN_H / 2, BTN_W, BTN_H, 10);
      bg.lineStyle(2, 0xffffff, 0.35);
      bg.strokeRoundedRect(cx - BTN_W / 2, cy - BTN_H / 2, BTN_W, BTN_H, 10);
    });
    zone.on('pointerdown', () => this.makeChoice(choice));
  }

  private makeChoice(choice: string): void {
    if (this.choiceDone) return;
    this.choiceDone = true;
    this.gs.set('finalChoice', choice);

    const endingKey = { red: 'EndingRed', black: 'EndingBlack', yellow: 'EndingYellow' }[choice];
    if (!endingKey) return;

    try { this.sound.stopAll(); } catch (_) {}
    this.cameras.main.fadeOut(800);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('UIScene');
      this.scene.start(endingKey);
    });
  }

  shutdown(): void {
    this.events.off('dialog-done', this.onDialogDone, this);
  }
}
