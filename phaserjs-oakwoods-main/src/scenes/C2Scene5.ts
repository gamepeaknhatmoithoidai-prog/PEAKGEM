/**
 * C2Scene5 — Ghế Bản Đồ Ký Ức
 *
 * Flow: intro dialogue → MiniGameTea (overlay) → post-tea dialogue
 *       → advance to C2S6Scene (c2Progress = 5)
 */
import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { W, H, DEPTH_BG, DEPTH_WORLD, DEPTH_UI } from '../constants';
import { charCropFrame0 } from '../utils/charSprite';

const SCENE_KEY = 'C2S5Scene';

export class C2Scene5 extends Phaser.Scene {
  private gs!: GS;
  private step = 0;  // 0=intro dialog, 1=tea minigame done → post dialog, 2=end

  constructor() { super(SCENE_KEY); }

  preload(): void {
    if (!this.textures.exists('bg-tea'))   this.load.image('bg-tea',   'assets/dohoa/bg-tea.jpg');
    if (!this.textures.exists('ama-knoi')) this.load.image('ama-knoi', 'assets/dohoa/ama-knoi.jpg');
    if (!this.textures.exists('kbroi'))    this.load.image('kbroi',    'assets/dohoa/kbroi.jpg');
    if (!this.textures.exists('thuan'))    this.load.image('thuan',    'assets/dohoa/thuan.jpg');
  }

  create(): void {
    this.gs   = new GS(this.registry);
    this.step = 0;

    this.physics.world.gravity.y = 0;

    this.buildBackground();
    this.buildCharacters();
    this.buildTitle();

    this.events.on('dialog-done',   this.onDialogDone,   this);
    this.events.on('minigame-done', this.onMiniGameDone, this);

    this.cameras.main.fadeIn(600);
    this.time.delayedCall(700, () => this.startDialog('c2s5-intro'));

    try { this.sound.play('forest-ambient', { loop: true, volume: 0.08 }); } catch (_) {}
  }

  // ── Background ────────────────────────────────────────────────────────
  private buildBackground(): void {
    if (this.textures.exists('bg-tea')) {
      this.add.image(W / 2, H / 2, 'bg-tea').setDisplaySize(W, H).setDepth(DEPTH_BG);
    } else {
      // Fallback gradient
      const g = this.add.graphics().setDepth(DEPTH_BG);
      g.fillGradientStyle(0x5ba3d4, 0x5ba3d4, 0xf5c842, 0xf5c842);
      g.fillRect(0, 0, W, H * 0.55);
      g.fillStyle(0x3b2508);
      g.fillRect(0, H * 0.72, W, H * 0.28);

      const deck = this.add.graphics().setDepth(DEPTH_WORLD - 0.5);
      deck.fillStyle(0x6b3a1e);
      deck.fillRect(0, H * 0.72, W, H * 0.1);

      const trees = this.add.graphics().setDepth(DEPTH_BG + 0.5);
      trees.fillStyle(0x1e3d0a);
      for (let x = 20; x < W - 20; x += 75) {
        const ch = 160 + (x % 60);
        trees.fillRect(x + 30, H * 0.72 - ch, 15, ch);
        trees.fillEllipse(x + 38, H * 0.72 - ch, 65, 70);
      }
    }

    this.addSmoke(W * 0.5, H * 0.45);
  }

  private addSmoke(x: number, y: number): void {
    for (let i = 0; i < 5; i++) {
      const smoke = this.add.graphics().setDepth(DEPTH_BG + 1).setAlpha(0.12 - i * 0.02);
      smoke.fillStyle(0xe8e8e8);
      smoke.fillCircle(x + i * 3, y - i * 14, 6 + i * 2);
      this.tweens.add({
        targets: smoke, y: -20, alpha: 0, duration: 3000 + i * 600,
        repeat: -1, delay: i * 700, ease: 'Sine.easeIn',
      });
    }
  }

  // ── Characters ────────────────────────────────────────────────────────
  private buildCharacters(): void {
    const baseY = H * 0.72;

    // Ama K'Nơi — sitting left; crop 683×1024 → display 57×85
    this.placeCharacter(160, baseY - 10, 'ama-knoi', "Ama K'Nơi", 57, 85);
    // K'Brơi — standing center; crop 682×682 → display 85×85
    this.placeCharacter(W / 2, baseY - 20, 'kbroi', "K'Brơi", 85, 85);
    // Thuận — standing right; crop 576×576 → display 85×85
    this.placeCharacter(W - 220, baseY - 20, 'thuan', 'Thuận', 85, 85);

    // Low table in front of Ama
    const table = this.add.graphics().setDepth(DEPTH_WORLD);
    table.fillStyle(0x7a4520);
    table.fillRoundedRect(80, baseY - 30, 160, 24, 4);
    table.fillStyle(0x5a2810);
    table.fillEllipse(160, baseY - 38, 28, 20);
  }

  private placeCharacter(x: number, baseY: number, textureKey: string, name: string, dw: number, dh: number): void {
    if (this.textures.exists(textureKey)) {
      const img = this.add.image(x, baseY - dh / 2, textureKey)
        .setDepth(DEPTH_WORLD + 1);
      charCropFrame0(img, textureKey, dw, dh);
    } else {
      const g = this.add.graphics().setDepth(DEPTH_WORLD + 1);
      g.fillStyle(0x888888);
      g.fillRoundedRect(x - dw / 4, baseY - dh, dw / 2, dh, 4);
      g.fillEllipse(x, baseY - dh - 12, 22, 22);
    }
    this.add.text(x, baseY - dh - 14, name, {
      fontSize: '10px', fontFamily: 'Arial', color: '#fffbe8',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(DEPTH_UI);
  }

  // ── Title ─────────────────────────────────────────────────────────────
  private buildTitle(): void {
    this.add.text(W / 2, 12, 'Chương 2 — Cảnh 5: Hiên Nhà Ama K\'Nơi', {
      fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#fff5cc', stroke: '#000', strokeThickness: 2,
      backgroundColor: '#00000066', padding: { x: 8, y: 3 },
    }).setOrigin(0.5, 0).setDepth(DEPTH_UI).setScrollFactor(0);
  }

  // ── Dialogue & mini-game flow ─────────────────────────────────────────
  private startDialog(key: string): void {
    this.scene.launch('DialogScene', { dialogKey: key, sourceScene: SCENE_KEY });
    this.scene.pause();
  }

  private launchMiniGame(key: string): void {
    this.scene.launch(key, { sourceScene: SCENE_KEY });
    this.scene.pause();
  }

  private onDialogDone(): void {
    this.scene.resume();
    this.step++;
    if (this.step === 1) {
      // intro dialogue done → launch tea mini-game
      this.time.delayedCall(300, () => this.launchMiniGame('MiniGameTea'));
    } else if (this.step === 2) {
      // post-tea dialogue done → advance
      this.advanceScene();
    }
  }

  private onMiniGameDone(data: { score: number; type: string }): void {
    this.scene.resume();
    if (data.type === 'tea') {
      this.gs.set('teaScore', data.score);
      this.gs.addScore(data.score);
      if (data.score > 0) {
        this.game.events.emit('notify', `🍵 Rót trà tốt! +${data.score} điểm`, '#f5c518');
      }
      this.time.delayedCall(400, () => this.startDialog('c2s5-post-tea'));
    }
  }

  private advanceScene(): void {
    this.gs.set('c2Progress', 5);
    try { this.sound.stopAll(); } catch (_) {}
    this.cameras.main.fadeOut(600);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Chapter2Scene');
    });
  }

  shutdown(): void {
    this.events.off('dialog-done',   this.onDialogDone,   this);
    this.events.off('minigame-done', this.onMiniGameDone, this);
  }
}
