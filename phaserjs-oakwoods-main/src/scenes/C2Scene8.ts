/**
 * C2Scene8 — Bị Mua Chuộc + Lựa Chọn A/B/C + Bắt Đom Đóm
 *
 * Flow: bribe dialogue (c2s8-bribe) with 3-way choice
 *       → consequence notification → MiniGameFirefly overlay
 *       → advance to C2S9Scene (c2Progress = 9)
 */
import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { W, H, DEPTH_BG, DEPTH_WORLD, DEPTH_UI } from '../constants';

const SCENE_KEY = 'C2S8Scene';

const BRIBE_CONSEQUENCES: Record<string, string> = {
  bribe_accept:   'Ông Thắng gật đầu hài lòng. Nhưng K\'Brơi đứng xa hơn một chút tối hôm đó.',
  bribe_refuse:   'Ông Thắng khẽ cười. Ánh mắt ông lạnh hơn một chút khi bước ra.',
  bribe_question: 'Ông Thắng dừng lại. Lần đầu tiên trong cuộc trò chuyện, ông thực sự nhìn Thuận.',
};

const CHOICE_MAP: Record<string, string> = {
  bribe_accept:   'A',
  bribe_refuse:   'B',
  bribe_question: 'C',
};

export class C2Scene8 extends Phaser.Scene {
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

    this.events.on('dialog-done', this.onDialogDone, this);
    this.events.on('choice-made', this.onChoiceMade, this);
    this.events.on('minigame-done', this.onMiniGameDone, this);

    this.cameras.main.fadeIn(600);
    this.time.delayedCall(700, () => this.startDialog('c2s8-bribe'));
  }

  // ── Background: camp at night ─────────────────────────────────────────
  private buildBackground(): void {
    const g = this.add.graphics().setDepth(DEPTH_BG);

    // Night sky
    g.fillStyle(0x06091a);
    g.fillRect(0, 0, W, H);

    // Stars
    g.fillStyle(0xffffff);
    for (let i = 0; i < 80; i++) {
      const sx = Phaser.Math.Between(0, W);
      const sy = Phaser.Math.Between(0, H * 0.55);
      const sr = Phaser.Math.FloatBetween(0.5, 1.5);
      g.fillCircle(sx, sy, sr);
    }

    // Ground
    g.fillStyle(0x161a08);
    g.fillRect(0, H * 0.68, W, H * 0.32);

    // Campfire
    const fire = this.add.graphics().setDepth(DEPTH_WORLD + 0.5);
    fire.fillStyle(0x333300);
    fire.fillEllipse(W * 0.5, H * 0.72, 40, 8);
    fire.fillStyle(0xff6600, 0.9);
    fire.fillTriangle(W * 0.5 - 10, H * 0.72, W * 0.5 + 10, H * 0.72, W * 0.5, H * 0.52);
    fire.fillStyle(0xffaa00, 0.8);
    fire.fillTriangle(W * 0.5 - 6, H * 0.72, W * 0.5 + 6, H * 0.72, W * 0.5, H * 0.56);
    fire.fillStyle(0xffff88, 0.7);
    fire.fillTriangle(W * 0.5 - 3, H * 0.72, W * 0.5 + 3, H * 0.72, W * 0.5, H * 0.60);
    this.tweens.add({ targets: fire, alpha: 0.7, duration: 400, yoyo: true, repeat: -1 });

    // Fire glow
    const glow = this.add.graphics().setDepth(DEPTH_WORLD);
    glow.fillStyle(0xff8800, 0.07);
    glow.fillCircle(W * 0.5, H * 0.65, 130);
    this.tweens.add({ targets: glow, alpha: 0.03, duration: 600, yoyo: true, repeat: -1 });

    // Trees silhouette
    const trees = this.add.graphics().setDepth(DEPTH_BG + 0.5);
    trees.fillStyle(0x050d03);
    for (let x = 0; x < W; x += 65) {
      const ch = 130 + (x % 70);
      trees.fillRect(x + 25, H * 0.68 - ch, 15, ch);
      trees.fillEllipse(x + 33, H * 0.68 - ch, 60, 65);
    }
  }

  private buildCharacters(): void {
    // Thuận alone initially — Thắng departs after dialogue
    this.drawCharacter(W * 0.4, H * 0.68 - 20, 0x2244aa, 'Thuận', false);
    this.drawCharacter(W * 0.6, H * 0.68 - 20, 0x2a2a2a, 'Nguyễn Văn Thắng', false);
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
    this.add.text(W / 2, 12, 'Chương 2 — Cảnh 8: Đêm Trại', {
      fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#aaccff', stroke: '#000', strokeThickness: 2,
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

  private onChoiceMade(data: { decision: string; scoreChange: number }): void {
    const choiceKey = CHOICE_MAP[data.decision];
    if (choiceKey) {
      this.gs.set('scene8Choice', choiceKey);
      const msg = BRIBE_CONSEQUENCES[data.decision];
      if (msg) this.game.events.emit('notify', msg, '#ddccaa');
    }
  }

  private onDialogDone(): void {
    this.scene.resume();
    this.step++;
    if (this.step === 1) {
      // bribe dialogue done → firefly mini-game
      this.time.delayedCall(800, () => this.launchMiniGame('MiniGameFirefly'));
    } else if (this.step === 2) {
      // shouldn't happen — firefly ends scene, no further dialog
      this.advanceScene();
    }
  }

  private onMiniGameDone(data: { score: number; type: string; count?: number }): void {
    this.scene.resume();
    if (data.type === 'firefly') {
      const count = data.count ?? 0;
      this.gs.set('firefliesCount', count);
      this.gs.addScore(data.score);
      if (count > 0) {
        this.game.events.emit('notify', `✨ Bắt được ${count} đom đóm! +${data.score} điểm`, '#ffffaa');
      }
      this.time.delayedCall(400, () => this.advanceScene());
    }
  }

  private advanceScene(): void {
    this.gs.set('c2Progress', 9);
    this.cameras.main.fadeOut(600);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Chapter2Scene');
    });
  }

  shutdown(): void {
    this.events.off('dialog-done',   this.onDialogDone,   this);
    this.events.off('choice-made',   this.onChoiceMade,   this);
    this.events.off('minigame-done', this.onMiniGameDone, this);
  }
}
