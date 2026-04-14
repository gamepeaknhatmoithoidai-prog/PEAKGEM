import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { W, H } from '../constants';

const INTRO_LINES = [
  { text: 'Năm 2024.', delay: 800 },
  { text: 'Vườn Quốc gia Nam Cát Tiên — một trong những khu rừng nhiệt đới nguyên sinh cuối cùng của Việt Nam.', delay: 1200 },
  { text: 'Nơi đây là nhà của hơn 1.600 loài thực vật, 400 loài chim, và cộng đồng người Mạ đã sống gắn bó với rừng qua nhiều thế hệ.', delay: 1500 },
  { text: 'Nhưng có một kế hoạch đang được triển khai bí mật trong vùng lõi bảo vệ nghiêm ngặt nhất...', delay: 1200 },
  { text: 'Và bạn — một sinh viên du lịch năm 3 từ TP.HCM — đã đặt chân đến đây để viết luận văn.', delay: 1200 },
  { text: 'Bạn không biết rằng chuyến đi này sẽ thay đổi mọi thứ.', delay: 1000 },
];

export class IntroScene extends Phaser.Scene {
  private gs!: GS;
  private lineIndex = 0;
  private charIndex = 0;
  private displayText = '';
  private textObj!: Phaser.GameObjects.Text;
  private nameText!: Phaser.GameObjects.Text;
  private skipHint!: Phaser.GameObjects.Text;
  private waitTimer = 0;
  private waitDuration = 0;
  private phase: 'typing' | 'waiting' | 'done' = 'typing';
  private canSkip = false;

  constructor() { super('IntroScene'); }

  create(): void {
    this.gs = new GS(this.registry);
    const name = this.gs.get('playerName') || 'Thuận';

    // Background — use real pixel-art forest if loaded, else procedural night scene
    if (this.textures.exists('bg-forest')) {
      // Real forest art tinted to night-time
      this.add.image(W / 2, H / 2, 'bg-forest')
        .setDisplaySize(W, H).setDepth(0).setTint(0x223344).setAlpha(0.9);
      // Dark overlay for readability + night mood
      const ov = this.add.graphics().setDepth(1);
      ov.fillStyle(0x000008, 0.55);
      ov.fillRect(0, 0, W, H);
      // Moon + stars on top
      ov.fillStyle(0xfff8e0, 0.85);
      ov.fillCircle(W - 100, 65, 30);
      ov.fillStyle(0xffffff, 0.6);
      for (let i = 0; i < 35; i++) {
        ov.fillCircle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H * 0.45),
          0.7 + Math.random() * 1.2);
      }
    } else {
      // Procedural night scene fallback
      this.add.rectangle(W / 2, H / 2, W, H, 0x000000);
      const bg = this.add.graphics();
      bg.fillStyle(0x050f03);
      bg.fillRect(0, 0, W, H);
      bg.fillStyle(0xfff8e0, 0.8);
      bg.fillCircle(W - 100, 70, 35);
      bg.fillStyle(0xffffff, 0.6);
      for (let i = 0; i < 40; i++) {
        const sx = Phaser.Math.Between(0, W);
        const sy = Phaser.Math.Between(0, H * 0.5);
        bg.fillCircle(sx, sy, 0.8 + Math.random());
      }
      bg.fillStyle(0x020802);
      const trees = [
        { x: 0, h: 300 }, { x: 60, h: 260 }, { x: 130, h: 340 }, { x: 200, h: 290 },
        { x: 720, h: 310 }, { x: 800, h: 270 }, { x: 860, h: 350 }, { x: 920, h: 300 }, { x: 960, h: 260 },
      ];
      for (const t of trees) {
        bg.fillTriangle(t.x - 35, H, t.x + 35, H, t.x, H - t.h);
        bg.fillRect(t.x - 10, H - 60, 20, 60);
      }
      bg.fillStyle(0x1a3a10, 0.15);
      bg.fillRect(0, H * 0.7, W, H * 0.3);
    }

    // Player name & greeting
    const nameLabel = name;
    this.nameText = this.add.text(W / 2, 60, `Nhân vật: ${nameLabel}`, {
      fontSize: '14px', fontFamily: 'Arial', color: '#88cc66',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: this.nameText, alpha: 1, duration: 1000, delay: 200 });

    // Main text box
    this.add.rectangle(W / 2, H * 0.62, W * 0.82, 130, 0x000000, 0.75)
      .setStrokeStyle(1, 0x3a6a28);

    this.textObj = this.add.text(W / 2 - W * 0.38, H * 0.62 - 50,
      '', {
        fontSize: '14px', fontFamily: 'Arial', color: '#e8f5d8',
        wordWrap: { width: W * 0.76 }, lineSpacing: 8,
      }).setDepth(5);

    // Skip hint
    this.skipHint = this.add.text(W / 2, H - 28, 'Nhấn SPACE hoặc ENTER để bỏ qua / tiếp tục', {
      fontSize: '11px', fontFamily: 'Arial', color: '#667755',
    }).setOrigin(0.5).setDepth(5);

    // Flashing skip hint
    this.tweens.add({ targets: this.skipHint, alpha: 0.3, duration: 900, yoyo: true, repeat: -1 });

    // Input
    this.input.keyboard!.on('keydown-SPACE', () => this.handleSkip());
    this.input.keyboard!.on('keydown-ENTER', () => this.handleSkip());
    this.input.on('pointerdown', () => this.handleSkip());

    // Delay start slightly
    this.time.delayedCall(600, () => { this.canSkip = true; });

    // Try ambient sound
    try { this.sound.play('forest-ambient', { loop: true, volume: 0.15 }); } catch (_) {}
  }

  private handleSkip(): void {
    if (!this.canSkip) return;
    if (this.phase === 'typing') {
      // Complete current line instantly
      this.displayText = INTRO_LINES[this.lineIndex].text;
      this.textObj.setText(this.displayText);
      this.charIndex = this.displayText.length;
      this.phase = 'waiting';
      this.waitDuration = 400;
      this.waitTimer = 0;
    } else if (this.phase === 'waiting') {
      this.advanceLine();
    } else if (this.phase === 'done') {
      this.goToGame();
    }
  }

  update(_time: number, delta: number): void {
    if (this.lineIndex >= INTRO_LINES.length) return;

    if (this.phase === 'typing') {
      // Typewriter effect — 2 chars per frame at 60fps
      this.waitTimer += delta;
      if (this.waitTimer > 30) {
        this.waitTimer = 0;
        const line = INTRO_LINES[this.lineIndex].text;
        if (this.charIndex < line.length) {
          this.charIndex += 2;
          this.displayText = line.slice(0, this.charIndex);
          this.textObj.setText(this.displayText);
        } else {
          this.phase = 'waiting';
          this.waitDuration = INTRO_LINES[this.lineIndex].delay;
          this.waitTimer = 0;
        }
      }
    } else if (this.phase === 'waiting') {
      this.waitTimer += delta;
      if (this.waitTimer >= this.waitDuration) {
        this.advanceLine();
      }
    }
  }

  private advanceLine(): void {
    this.lineIndex++;
    if (this.lineIndex >= INTRO_LINES.length) {
      this.phase = 'done';
      this.skipHint.setText('Nhấn phím bất kỳ để bắt đầu...');
    } else {
      this.charIndex = 0;
      this.displayText = '';
      this.phase = 'typing';
      this.waitTimer = 0;
    }
  }

  private goToGame(): void {
    try { this.sound.stopAll(); } catch (_) {}
    this.cameras.main.fadeOut(700, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Chapter1Scene');
      this.scene.launch('UIScene');
    });
  }
}
