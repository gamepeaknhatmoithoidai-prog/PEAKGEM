/**
 * MiniGameFirefly — Bắt Đom Đóm (Overlay mini-game)
 *
 * Launched from C2Scene8.  Fireflies blink randomly across a dark forest
 * background.  Player clicks to catch them.  Ends after ~18 s or 10 caught.
 * Emits 'minigame-done' { score, count } then stops.
 */
import Phaser from 'phaser';
import { W, H } from '../constants';

const MAX_TIME    = 18000;  // ms
const MAX_CATCH   = 10;
const NUM_FLIES   = 28;
const SCORE_EACH  = 2;

interface Firefly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;   // phase in blink cycle 0→2π
  blinkRate: number;
  alive: boolean;
}

export class MiniGameFirefly extends Phaser.Scene {
  private sourceScene = '';
  private flies: Firefly[] = [];
  private caught  = 0;
  private elapsed = 0;
  private done    = false;
  private fxGfx!: Phaser.GameObjects.Graphics;
  private countText!: Phaser.GameObjects.Text;
  private endingTriggered = false;

  constructor() { super({ key: 'MiniGameFirefly', active: false }); }

  init(data: { sourceScene: string }): void {
    this.sourceScene = data.sourceScene || '';
    this.caught      = 0;
    this.elapsed     = 0;
    this.done        = false;
    this.endingTriggered = false;
    this.flies       = [];
  }

  create(): void {
    // Dark forest overlay
    const bg = this.add.graphics().setDepth(0);
    bg.fillStyle(0x010408);
    bg.fillRect(0, 0, W, H);
    bg.fillStyle(0x040c02);
    for (let x = 0; x < W; x += 64) {
      const ch = 100 + (x % 60);
      bg.fillRect(x + 24, H - ch, 16, ch);
      bg.fillEllipse(x + 32, H - ch, 52, 55);
    }

    // Spawn fireflies
    for (let i = 0; i < NUM_FLIES; i++) {
      this.flies.push({
        x: Phaser.Math.Between(40, W - 40),
        y: Phaser.Math.Between(60, H - 100),
        vx: Phaser.Math.FloatBetween(-22, 22),
        vy: Phaser.Math.FloatBetween(-14, 14),
        phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
        blinkRate: Phaser.Math.FloatBetween(1.8, 3.5),
        alive: true,
      });
    }

    this.fxGfx = this.add.graphics().setDepth(3);

    this.add.text(W / 2, 18, 'Bắt đom đóm...', {
      fontSize: '14px', fontFamily: 'Arial', fontStyle: 'italic',
      color: '#c8e8ff', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(5);

    this.countText = this.add.text(W / 2, H - 22, 'Bắt được: 0', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffffaa',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(5);

    // Thuận monologue text — appears at end
    const monoText = this.add.text(W / 2, H / 2 + 60,
      'Ngày mai mình phải quyết định.\nThật sự quyết định.', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'italic',
      color: '#f5e6c8', stroke: '#000000', strokeThickness: 3,
      align: 'center', backgroundColor: '#00000099',
      padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setDepth(6).setAlpha(0);
    (this as any)._monoText = monoText;

    // Click to catch
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (this.done) return;
      this.tryCatch(ptr.x, ptr.y);
    });

    // Skip button after 5 s
    const skipBtn = this.add.text(W - 16, H - 16, '[ Bỏ qua ]', {
      fontSize: '12px', fontFamily: 'Arial', color: '#888888',
      backgroundColor: '#00000066', padding: { x: 6, y: 3 },
    }).setOrigin(1, 1).setDepth(5).setAlpha(0).setInteractive();
    skipBtn.on('pointerdown', () => this.triggerEnding());
    this.time.delayedCall(5000, () => {
      this.tweens.add({ targets: skipBtn, alpha: 1, duration: 400 });
    });
  }

  private tryCatch(px: number, py: number): void {
    for (const fly of this.flies) {
      if (!fly.alive) continue;
      const dx = fly.x - px;
      const dy = fly.y - py;
      if (dx * dx + dy * dy < 22 * 22) {
        fly.alive = false;
        this.caught++;
        this.countText.setText(`Bắt được: ${this.caught}`);

        const spark = this.add.text(px, py - 14, '+', {
          fontSize: '18px', color: '#ffff88', stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(4);
        this.tweens.add({
          targets: spark, y: py - 40, alpha: 0, duration: 800,
          onComplete: () => spark.destroy(),
        });

        if (this.caught >= MAX_CATCH) { this.triggerEnding(); return; }
        break;
      }
    }
  }

  update(_t: number, delta: number): void {
    if (this.done) return;

    this.elapsed += delta;
    if (this.elapsed >= MAX_TIME && !this.endingTriggered) {
      this.triggerEnding();
      return;
    }

    const dt = delta / 1000;
    this.fxGfx.clear();

    for (const fly of this.flies) {
      if (!fly.alive) continue;

      // Move
      fly.x += fly.vx * dt;
      fly.y += fly.vy * dt;
      // Soft boundary bounce
      if (fly.x < 20 || fly.x > W - 20) fly.vx = -fly.vx;
      if (fly.y < 40 || fly.y > H - 80) fly.vy = -fly.vy;
      // Slight random drift
      fly.vx += Phaser.Math.FloatBetween(-5, 5) * dt;
      fly.vy += Phaser.Math.FloatBetween(-5, 5) * dt;
      fly.vx = Phaser.Math.Clamp(fly.vx, -30, 30);
      fly.vy = Phaser.Math.Clamp(fly.vy, -20, 20);

      fly.phase += fly.blinkRate * dt;
      const blink = (Math.sin(fly.phase) + 1) / 2;

      if (blink > 0.3) {
        // Outer glow
        this.fxGfx.fillStyle(0x99ff44, blink * 0.18);
        this.fxGfx.fillCircle(fly.x, fly.y, 10);
        // Core
        this.fxGfx.fillStyle(0xddff88, blink * 0.85);
        this.fxGfx.fillCircle(fly.x, fly.y, 3.5);
      }
    }
  }

  private triggerEnding(): void {
    if (this.endingTriggered) return;
    this.endingTriggered = true;
    this.done = true;

    const mono = (this as any)._monoText as Phaser.GameObjects.Text;
    this.tweens.add({ targets: mono, alpha: 1, duration: 1000 });
    this.time.delayedCall(2800, () => this.finish());
  }

  private finish(): void {
    const score = this.caught * SCORE_EACH;
    const src   = this.scene.get(this.sourceScene);
    src?.events.emit('minigame-done', { score, type: 'firefly', count: this.caught });
    this.scene.stop();
  }

  shutdown(): void {
    this.input.off('pointerdown');
  }
}
