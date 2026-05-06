/**
 * C2Scene11 — Khoảnh Khắc Quyết Định Cuối
 *
 * Flow: fullscreen 3-choice popup → store finalChoice
 *       → farewell dialogue variant → MoralMirrorScene → Ending
 */
import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { W, H, DEPTH_BG, DEPTH_WORLD, DEPTH_UI } from '../constants';
import { placeCharSprite, CHAR_DISPLAY_H } from '../utils/charSprite';

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
    // Show final choice popup first (farewell comes AFTER choice is made)
    this.time.delayedCall(800, () => this.showFinalChoice());

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
    g.fillStyle(0x8a6840);
    g.fillTriangle(W / 2 - W * 0.08, H, W / 2 + W * 0.08, H, W / 2 + W * 0.25, H * 0.70);
    g.fillTriangle(W / 2 - W * 0.08, H, W / 2 - W * 0.25, H * 0.70, W / 2 + W * 0.25, H * 0.70);

    // Trees lining both sides
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
    const groundY  = H * 0.70;
    const gender   = (this.gs.get('gender') as string) || 'male';
    const thuanKey = gender === 'female' ? 'char-player-f' : 'char-player-m';

    placeCharSprite(this, W * 0.28, groundY, 'char-amaknoi', DEPTH_WORLD + 1);
    placeCharSprite(this, W * 0.40, groundY, 'char-kbroi',   DEPTH_WORLD + 1);
    placeCharSprite(this, W * 0.65, groundY, thuanKey,        DEPTH_WORLD + 1);

    [
      { x: W * 0.28, name: "Ama K'Nơi" },
      { x: W * 0.40, name: "K'Brơi"    },
      { x: W * 0.65, name: 'Thuận'      },
    ].forEach(({ x, name }) => {
      this.add.text(x, groundY - CHAR_DISPLAY_H - 8, name, {
        fontSize: '10px', fontFamily: 'Arial', color: '#fffbe8',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5, 1).setDepth(DEPTH_UI);
    });
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
    // Farewell dialog done → transition to MoralMirrorScene
    const choice = this.gs.get('finalChoice') || 'black';
    try { this.sound.stopAll(); } catch (_) {}
    this.cameras.main.fadeOut(800);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('UIScene');
      this.scene.start('MoralMirrorScene', { endingType: choice });
    });
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

    // Clear the popup overlay (destroy all depth >= 20)
    this.children.each((child: Phaser.GameObjects.GameObject) => {
      if ((child as any).depth >= 20) child.destroy();
    });

    // Determine farewell dialogue variant
    const decisions = this.gs.get('decisions') || [];
    const hasBribe = decisions.includes('bribe_accept');

    let farewellKey: string;
    if (!hasBribe) {
      farewellKey = 'c2s11-farewell-honest';
    } else if (choice === 'red' || choice === 'yellow') {
      farewellKey = 'c2s11-farewell-bribed';
    } else {
      farewellKey = 'c2s11-farewell-silent';
    }

    this.time.delayedCall(600, () => this.startDialog(farewellKey));
  }

  shutdown(): void {
    this.events.off('dialog-done', this.onDialogDone, this);
  }
}
