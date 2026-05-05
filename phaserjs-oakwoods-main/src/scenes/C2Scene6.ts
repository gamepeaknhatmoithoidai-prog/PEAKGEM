/**
 * C2Scene6 — Twist: Hùng Là Ai?
 *
 * Flow: short intro dialogue (c2s6-pre-flashlight)
 *       → MiniGameFlashlight overlay (K'Brơi's flashback memory)
 *       → post-flashlight dialogue (c2s6-post-flashlight) revealing Hùng
 *       → advance to C2MiniCrocodile (c2Progress = 6)
 */
import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { W, H, DEPTH_BG, DEPTH_WORLD, DEPTH_UI } from '../constants';
import { placeCharSprite, CHAR_DISPLAY_H } from '../utils/charSprite';

const SCENE_KEY = 'C2S6Scene';

export class C2Scene6 extends Phaser.Scene {
  private gs!: GS;
  private step = 0;

  constructor() { super(SCENE_KEY); }

  preload(): void {
    if (!this.textures.exists('bg-scene6')) this.load.image('bg-scene6', 'assets/dohoa/bg-scene6.jpg');
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

    this.cameras.main.fadeIn(500);
    this.time.delayedCall(600, () => this.startDialog('c2s6-pre-flashlight'));

    try { this.sound.play('forest-ambient', { loop: true, volume: 0.07 }); } catch (_) {}
  }

  // ── Background ───────────────────────────────────────────────────────
  private buildBackground(): void {
    if (this.textures.exists('bg-scene6')) {
      this.add.image(W / 2, H / 2, 'bg-scene6').setDisplaySize(W, H).setDepth(DEPTH_BG);
      // Tension overlay on top of image
      this.add.graphics().setDepth(DEPTH_BG + 0.2)
        .fillStyle(0x000010, 0.15)
        .fillRect(0, 0, W, H);
    } else {
      const g = this.add.graphics().setDepth(DEPTH_BG);
      g.fillGradientStyle(0x3a6a9a, 0x3a6a9a, 0xd4a030, 0xd4a030);
      g.fillRect(0, 0, W, H * 0.55);
      g.fillStyle(0x3b2508);
      g.fillRect(0, H * 0.72, W, H * 0.28);
      const deck = this.add.graphics().setDepth(DEPTH_WORLD - 0.5);
      deck.fillStyle(0x5c3215);
      deck.fillRect(0, H * 0.72, W, H * 0.1);
      const trees = this.add.graphics().setDepth(DEPTH_BG + 0.5);
      trees.fillStyle(0x162c08);
      for (let x = 20; x < W - 20; x += 75) {
        const ch = 160 + (x % 60);
        trees.fillRect(x + 30, H * 0.72 - ch, 15, ch);
        trees.fillEllipse(x + 38, H * 0.72 - ch, 65, 70);
      }
    }
  }

  private buildCharacters(): void {
    const groundY  = H * 0.72;
    const gender   = (this.gs.get('gender') as string) || 'male';
    const thuanKey = gender === 'female' ? 'char-player-f' : 'char-player-m';

    placeCharSprite(this, 160,        groundY, 'char-amaknoi', DEPTH_WORLD + 1);
    placeCharSprite(this, W / 2 - 60, groundY, 'char-kbroi',   DEPTH_WORLD + 1);
    placeCharSprite(this, W - 220,    groundY, thuanKey,        DEPTH_WORLD + 1);

    [
      { x: 160,        name: "Ama K'Nơi" },
      { x: W / 2 - 60, name: "K'Brơi"    },
      { x: W - 220,    name: 'Thuận'      },
    ].forEach(({ x, name }) => {
      this.add.text(x, groundY - CHAR_DISPLAY_H - 8, name, {
        fontSize: '10px', fontFamily: 'Arial', color: '#fffbe8',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5, 1).setDepth(DEPTH_UI);
    });

    // Low table
    const table = this.add.graphics().setDepth(DEPTH_WORLD);
    table.fillStyle(0x7a4520);
    table.fillRoundedRect(80, groundY - 30, 160, 24, 4);

    // Envelope on table (initially hidden, shown after flashlight)
    const env = this.add.graphics().setDepth(DEPTH_WORLD + 0.5).setAlpha(0);
    env.fillStyle(0xfff5cc);
    env.fillRoundedRect(140, groundY - 50, 40, 26, 2);
    env.lineStyle(1, 0xaaa080);
    env.strokeRoundedRect(140, groundY - 50, 40, 26, 2);
    env.lineBetween(140, groundY - 50, 160, groundY - 37);
    env.lineBetween(180, groundY - 50, 160, groundY - 37);
    (this as any)._envelope = env;
  }

  private buildTitle(): void {
    this.add.text(W / 2, 12, 'Chương 2 — Cảnh 6: Sự Thật Được Phơi Bày', {
      fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#ddeeff', stroke: '#000', strokeThickness: 2,
      backgroundColor: '#00000066', padding: { x: 8, y: 3 },
    }).setOrigin(0.5, 0).setDepth(DEPTH_UI).setScrollFactor(0);
  }

  // ── Flow ─────────────────────────────────────────────────────────────
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
      // pre-flashlight dialogue done → launch flashlight
      this.time.delayedCall(200, () => this.launchMiniGame('MiniGameFlashlight'));
    } else if (this.step === 2) {
      // post-flashlight dialogue done → advance to Crocodile mini-game
      this.advanceScene();
    }
  }

  private onMiniGameDone(data: { score: number; type: string; found?: number }): void {
    this.scene.resume();
    if (data.type === 'flashlight') {
      this.gs.set('flashlightScore', data.score);
      this.gs.addScore(data.score);
      if ((data.found ?? 0) > 0) {
        this.game.events.emit('notify', `🔦 Tìm thấy ${data.found}/5 bằng chứng! +${data.score} điểm`, '#88ccff');
      }
      // Reveal envelope on table
      const env = (this as any)._envelope as Phaser.GameObjects.Graphics;
      if (env) this.tweens.add({ targets: env, alpha: 1, duration: 600 });
      this.time.delayedCall(600, () => this.startDialog('c2s6-post-flashlight'));
    }
  }

  private advanceScene(): void {
    this.gs.set('c2Progress', 7);  // Chapter2Scene will start C2MiniCrocodile
    try { this.sound.stopAll(); } catch (_) {}
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Chapter2Scene');
    });
  }

  shutdown(): void {
    this.events.off('dialog-done',   this.onDialogDone,   this);
    this.events.off('minigame-done', this.onMiniGameDone, this);
  }
}
