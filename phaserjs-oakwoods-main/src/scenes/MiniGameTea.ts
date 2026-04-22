/**
 * MiniGameTea — Rót Trà (Overlay mini-game)
 *
 * Launched from C2Scene5.  Player must stop the pour at the right level
 * for each of 3 cups.  +5 per perfect cup.
 * Emits 'minigame-done' { score } on the source scene, then stops itself.
 */
import Phaser from 'phaser';
import { W, H } from '../constants';

const POUR_SPEED  = 0.55;   // fill per second (0→1 in ~1.8 s)
const GREEN_LO   = 0.65;
const GREEN_HI   = 0.92;
const CUP_SCORE  = 5;

interface Cup { x: number; fill: number; locked: boolean; result: 'ok' | 'miss' | 'pending' }

export class MiniGameTea extends Phaser.Scene {
  private sourceScene = '';
  private cups: Cup[] = [];
  private currentCup  = 0;
  private totalScore  = 0;
  private phase: 'pouring' | 'pause' | 'done' = 'pouring';
  private pauseTimer  = 0;
  private skipBtn!: Phaser.GameObjects.Text;

  // Graphics
  private teapotGfx!: Phaser.GameObjects.Graphics;
  private streamGfx!: Phaser.GameObjects.Graphics;
  private cupsGfx!: Phaser.GameObjects.Graphics;
  private resultText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;

  constructor() { super({ key: 'MiniGameTea', active: false }); }

  preload(): void {
    if (!this.textures.exists('bg-tea')) {
      this.load.image('bg-tea', 'assets/dohoa/bg-tea.jpg');
    }
    if (!this.textures.exists('ama-knoi')) {
      this.load.image('ama-knoi', 'assets/dohoa/ama-knoi.jpg');
    }
  }

  init(data: { sourceScene: string }): void {
    this.sourceScene = data.sourceScene || '';
    this.cups = [
      { x: W / 2 - 130, fill: 0, locked: false, result: 'pending' },
      { x: W / 2,       fill: 0, locked: false, result: 'pending' },
      { x: W / 2 + 130, fill: 0, locked: false, result: 'pending' },
    ];
    this.currentCup = 0;
    this.totalScore = 0;
    this.phase      = 'pouring';
    this.pauseTimer = 0;
  }

  create(): void {
    // Background image (replaces plain black overlay)
    if (this.textures.exists('bg-tea')) {
      this.add.image(W / 2, H / 2, 'bg-tea').setDisplaySize(W, H).setDepth(0);
    } else {
      this.add.rectangle(W / 2, H / 2, W, H, 0x1a0e05).setDepth(0);
    }

    // Wooden table
    const table = this.add.graphics().setDepth(1);
    table.fillStyle(0x5c3b1e);
    table.fillRoundedRect(W / 2 - 280, H / 2 - 20, 560, 200, 10);
    table.lineStyle(2, 0x3b2610);
    table.strokeRoundedRect(W / 2 - 280, H / 2 - 20, 560, 200, 10);

    // Ama K'Noi character — positioned to the left of the teapot
    if (this.textures.exists('ama-knoi')) {
      this.add.image(W / 2 - 210, H / 2 - 80, 'ama-knoi')
        .setDisplaySize(130, 130)
        .setDepth(2);
    }

    this.teapotGfx = this.add.graphics().setDepth(3);
    this.streamGfx = this.add.graphics().setDepth(4);
    this.cupsGfx   = this.add.graphics().setDepth(5);

    this.add.text(W / 2, H / 2 - 90, 'Nhấn SPACE hoặc click để dừng rót', {
      fontSize: '15px', fontFamily: 'Arial', color: '#f5e6c8',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(6);

    this.resultText = this.add.text(W / 2, H / 2 - 65, '', {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6);

    this.scoreText = this.add.text(W / 2, H / 2 - 45, 'Điểm: 0', {
      fontSize: '13px', fontFamily: 'Arial', color: '#f5c518',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(6);

    this.drawTeapot();
    this.drawCups();

    // Input
    this.input.on('pointerdown', () => this.tryStop());
    this.input.keyboard!.on('keydown-SPACE', () => this.tryStop());

    // Skip button appears after 5 s
    this.skipBtn = this.add.text(W - 16, 16, '[ Bỏ qua ]', {
      fontSize: '12px', fontFamily: 'Arial', color: '#aaaaaa',
      stroke: '#000', strokeThickness: 1,
      backgroundColor: '#00000066', padding: { x: 6, y: 3 },
    }).setOrigin(1, 0).setDepth(10).setAlpha(0).setInteractive();
    this.skipBtn.on('pointerdown', () => this.finish());
    this.time.delayedCall(5000, () => {
      this.tweens.add({ targets: this.skipBtn, alpha: 1, duration: 400 });
    });
  }

  private drawTeapot(): void {
    const g = this.teapotGfx;
    const tx = W / 2, ty = H / 2 - 130;
    g.clear();
    g.fillStyle(0x7a3b0e);
    g.fillEllipse(tx, ty, 60, 44);
    g.fillRect(tx - 8, ty + 18, 16, 20);   // spout base
    g.fillStyle(0x5c2a08);
    g.fillEllipse(tx, ty - 4, 26, 14);      // lid
    g.lineStyle(3, 0x3b1a05);
    g.strokeEllipse(tx, ty, 60, 44);
    // handle
    g.lineStyle(4, 0x5c2a08);
    g.beginPath();
    g.arc(tx + 42, ty, 14, -0.5, 0.5);
    g.strokePath();
  }

  private drawCups(): void {
    const g = this.cupsGfx;
    g.clear();
    const CUP_W = 50, CUP_H = 38;
    const baseY = H / 2 + 50;

    for (let i = 0; i < this.cups.length; i++) {
      const cup = this.cups[i];
      const cx  = cup.x;
      const isActive = i === this.currentCup && !cup.locked;

      // cup body
      g.fillStyle(0xf0e6d0);
      g.fillRoundedRect(cx - CUP_W / 2, baseY - CUP_H, CUP_W, CUP_H, 4);

      // green zone indicator
      const gzY1 = baseY - CUP_H + CUP_H * (1 - GREEN_HI);
      const gzH  = CUP_H * (GREEN_HI - GREEN_LO);
      g.fillStyle(0x44aa44, 0.35);
      g.fillRect(cx - CUP_W / 2 + 2, gzY1, CUP_W - 4, gzH);

      // liquid fill
      if (cup.fill > 0) {
        const liqH = Math.min(CUP_H - 4, cup.fill * (CUP_H - 4));
        const liqY = baseY - 2 - liqH;
        const col  = cup.result === 'ok' ? 0x88cc44 : cup.result === 'miss' ? 0xcc4444 : 0xc8860e;
        g.fillStyle(col, 0.85);
        g.fillRoundedRect(cx - CUP_W / 2 + 2, liqY, CUP_W - 4, liqH, 2);
      }

      // outline
      const stroke = isActive ? 0xffdd44 : 0x8a7055;
      g.lineStyle(isActive ? 2 : 1, stroke);
      g.strokeRoundedRect(cx - CUP_W / 2, baseY - CUP_H, CUP_W, CUP_H, 4);
    }
  }

  private drawStream(): void {
    const g = this.streamGfx;
    g.clear();
    if (this.phase !== 'pouring') return;
    const cup = this.cups[this.currentCup];
    if (!cup) return;

    const tx   = W / 2;
    const ty   = H / 2 - 110;
    const cx   = cup.x;
    const baseY = H / 2 + 50;
    const fillTop = baseY - 2 - cup.fill * 36;

    g.lineStyle(4, 0xc8860e, 0.9);
    g.beginPath();
    g.moveTo(tx, ty + 18);
    g.lineTo(cx, fillTop);
    g.strokePath();

    // drip at bottom
    g.fillStyle(0xc8860e, 0.9);
    g.fillEllipse(cx, fillTop, 8, 6);
  }

  private tryStop(): void {
    if (this.phase !== 'pouring') return;
    const cup = this.cups[this.currentCup];
    if (!cup || cup.locked) return;

    cup.locked = true;
    const perfect = cup.fill >= GREEN_LO && cup.fill <= GREEN_HI;
    cup.result = perfect ? 'ok' : 'miss';
    if (perfect) {
      this.totalScore += CUP_SCORE;
      this.resultText.setText('✓ Vừa đủ! +5 điểm').setColor('#88ff66');
    } else {
      this.resultText.setText(cup.fill > GREEN_HI ? '✗ Tràn rồi!' : '✗ Chưa đủ!').setColor('#ff6666');
    }
    this.scoreText.setText(`Điểm: ${this.totalScore}`);
    this.phase = 'pause';
    this.pauseTimer = 0;
  }

  update(_t: number, delta: number): void {
    if (this.phase === 'done') return;

    if (this.phase === 'pouring') {
      const cup = this.cups[this.currentCup];
      if (!cup || cup.locked) return;
      cup.fill = Math.min(1.1, cup.fill + (POUR_SPEED * delta) / 1000);
      // Auto-stop if overflowing
      if (cup.fill >= 1.1) this.tryStop();
      this.drawStream();
      this.drawCups();
    }

    if (this.phase === 'pause') {
      this.pauseTimer += delta;
      if (this.pauseTimer > 900) {
        this.resultText.setText('');
        this.currentCup++;
        if (this.currentCup >= this.cups.length) {
          this.phase = 'done';
          this.time.delayedCall(400, () => this.finish());
        } else {
          this.phase = 'pouring';
        }
      }
    }

    this.drawCups();
  }

  private finish(): void {
    if (this.phase === 'done' && !this.scene.isActive()) return;
    this.phase = 'done';
    const src = this.scene.get(this.sourceScene);
    src?.events.emit('minigame-done', { score: this.totalScore, type: 'tea' });
    this.scene.stop();
  }

  shutdown(): void {
    this.input.off('pointerdown');
    this.input.keyboard!.off('keydown-SPACE');
  }
}
