/**
 * C2Scene10 — Hùng Xuất Hiện & Xếp Hồ Sơ
 *
 * Flow: Hùng confession dialogue (c2s10-hung)
 *       → MiniGameDossier overlay (45 s sorting)
 *       → monologue text → advance to C2S11Scene (c2Progress = 11)
 */
import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { W, H, DEPTH_BG, DEPTH_WORLD, DEPTH_UI } from '../constants';
import { placeCharSprite, CHAR_DISPLAY_H } from '../utils/charSprite';

const SCENE_KEY = 'C2S10Scene';

export class C2Scene10 extends Phaser.Scene {
  private gs!: GS;
  private step = 0;

  constructor() { super(SCENE_KEY); }

  create(): void {
    this.gs   = new GS(this.registry);
    this.step = 0;

    this.physics.world.gravity.y = 0;

    this.buildBackground();
    this.buildCharacters();
    this.buildTitle();

    this.events.on('dialog-done',   this.onDialogDone,   this);
    this.events.on('minigame-done', this.onMiniGameDone, this);

    this.cameras.main.fadeIn(500);

    // Check if bribe_accept: show echo before Hùng dialog
    const decisions = this.gs.get('decisions') || [];
    if (decisions.includes('bribe_accept')) {
      this.time.delayedCall(600, () => this.startDialog('c2s10-echo-before-hung'));
    } else {
      this.step = 1; // skip echo step
      this.time.delayedCall(600, () => this.startDialog('c2s10-hung'));
    }

    try { this.sound.play('forest-ambient', { loop: true, volume: 0.07 }); } catch (_) {}
  }

  // ── Background: camp, daytime ─────────────────────────────────────────
  private buildBackground(): void {
    const g = this.add.graphics().setDepth(DEPTH_BG);

    // Overcast daytime sky
    g.fillGradientStyle(0x7baaca, 0x7baaca, 0x9fc4d8, 0x9fc4d8);
    g.fillRect(0, 0, W, H * 0.58);

    g.fillStyle(0x2a3a10);
    g.fillRect(0, H * 0.68, W, H * 0.32);
    g.fillStyle(0x3a5218);
    g.fillRect(0, H * 0.68, W, 8);

    const camp = this.add.graphics().setDepth(DEPTH_WORLD - 0.5);
    camp.fillStyle(0x4a7a3a);
    camp.fillTriangle(W * 0.75, H * 0.68, W * 0.60, H * 0.46, W * 0.90, H * 0.46);

    // Backpack visual
    camp.fillStyle(0x885522);
    camp.fillRoundedRect(W * 0.25, H * 0.60, 36, 46, 8);
    camp.lineStyle(2, 0x553311);
    camp.strokeRoundedRect(W * 0.25, H * 0.60, 36, 46, 8);

    const trees = this.add.graphics().setDepth(DEPTH_BG + 0.5);
    trees.fillStyle(0x1e3d0a);
    for (let x = 0; x < W; x += 68) {
      const ch = 140 + (x % 65);
      trees.fillRect(x + 26, H * 0.68 - ch, 16, ch);
      trees.fillEllipse(x + 34, H * 0.68 - ch, 62, 67);
    }
  }

  private buildCharacters(): void {
    const groundY  = H * 0.68;
    const gender   = (this.gs.get('gender') as string) || 'male';
    const thuanKey = gender === 'female' ? 'char-player-f' : 'char-player-m';

    placeCharSprite(this, W * 0.68, groundY, thuanKey,    DEPTH_WORLD + 1);
    placeCharSprite(this, W * 0.34, groundY, 'char-hung', DEPTH_WORLD + 1);

    [
      { x: W * 0.68, name: 'Thuận' },
      { x: W * 0.34, name: 'Hùng'  },
    ].forEach(({ x, name }) => {
      this.add.text(x, groundY - CHAR_DISPLAY_H - 8, name, {
        fontSize: '10px', fontFamily: 'Arial', color: '#fffbe8',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5, 1).setDepth(DEPTH_UI);
    });
  }

  private buildTitle(): void {
    this.add.text(W / 2, 12, 'Chương 2 — Cảnh 10: Hùng Tìm Đến', {
      fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#ddeeff', stroke: '#000', strokeThickness: 2,
      backgroundColor: '#00000066', padding: { x: 8, y: 3 },
    }).setOrigin(0.5, 0).setDepth(DEPTH_UI).setScrollFactor(0);
  }

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
      // Echo done → now launch Hùng dialog
      this.time.delayedCall(400, () => this.startDialog('c2s10-hung'));
    } else if (this.step === 2) {
      // Hùng confessed → launch dossier mini-game
      this.time.delayedCall(400, () => this.launchMiniGame('MiniGameDossier'));
    }
  }

  private onMiniGameDone(data: { score: number; type: string }): void {
    this.scene.resume();
    if (data.type === 'dossier') {
      this.gs.set('dossierScore', data.score);
      this.gs.addScore(data.score);
      if (data.score > 0) {
        this.game.events.emit('notify', `📦 Xếp hồ sơ: +${data.score} điểm`, '#f5c518');
      }
      this.showMonologue();
    }
  }

  private showMonologue(): void {
    // Thuận's internal monologue after packing
    const mono = this.add.text(W / 2, H * 0.45,
      'Mình có gì?\nBằng chứng của mình.\nKhoa học của Lan.\nLời Hùng.\nVà... ký ức của Ama K\'Nơi.', {
      fontSize: '15px', fontFamily: 'Arial', fontStyle: 'italic',
      color: '#f5e6c8', stroke: '#000000', strokeThickness: 3,
      align: 'center', backgroundColor: '#000000aa',
      padding: { x: 14, y: 10 },
    }).setOrigin(0.5).setDepth(DEPTH_UI + 2).setAlpha(0);

    this.tweens.add({ targets: mono, alpha: 1, duration: 800 });
    this.time.delayedCall(3200, () => {
      this.tweens.add({
        targets: mono, alpha: 0, duration: 600,
        onComplete: () => this.advanceScene(),
      });
    });
  }

  private advanceScene(): void {
    this.gs.set('c2Progress', 11);
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
