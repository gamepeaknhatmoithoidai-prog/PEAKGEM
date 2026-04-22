/**
 * EndingRed — Công Bố Sự Thật
 * +50 điểm thưởng.  Text cutscene.  → EndScreen
 */
import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { W, H } from '../constants';

const LINES = [
  { text: 'Dự án bị điều tra.',         delay: 0    },
  { text: 'Rừng tạm dừng.',             delay: 1400 },
  { text: 'Hùng ra làm nhân chứng — và mất việc.', delay: 2800 },
  { text: 'Cộng đồng chia rẽ.\nMột số người Mạ không tha thứ cho ông.', delay: 4400 },
  { text: 'K\'Brơi đứng cạnh Thuận đến cùng.',   delay: 6200 },
  { text: '',                            delay: 7600 },
  { text: 'Luận văn được bảo vệ xuất sắc.',       delay: 8400 },
  { text: 'Một số giáo sư gọi đó là\n"thiếu tính trung lập học thuật".', delay: 10000 },
  { text: 'Thuận không đồng ý.\nVà lần đầu tiên — cậu tự hào về điều đó.', delay: 12000 },
  { text: '',                            delay: 14000 },
  { text: '★ Rừng còn đó. Người Mạ còn ở đó.',   delay: 14800 },
  { text: '★ Đây là lựa chọn khó nhất — và đúng nhất.', delay: 16400 },
];

export class EndingRed extends Phaser.Scene {
  private gs!: GS;

  constructor() { super('EndingRed'); }

  create(): void {
    this.gs = new GS(this.registry);
    this.gs.addScore(50);

    this.buildBackground();
    this.buildHeader();
    this.playLines();
  }

  private buildBackground(): void {
    const g = this.add.graphics();
    // Forest silhouette at sunset (red/orange)
    g.fillGradientStyle(0x0a0a10, 0x0a0a10, 0x220808, 0x220808);
    g.fillRect(0, 0, W, H);
    g.fillStyle(0x5a1010, 0.4);
    g.fillRect(0, H * 0.55, W, H * 0.45);

    // Tree silhouettes
    g.fillStyle(0x0d0808);
    for (let x = 0; x < W; x += 60) {
      const ch = 130 + (x % 80);
      g.fillRect(x + 22, H - ch, 16, ch);
      g.fillEllipse(x + 30, H - ch, 55, 60);
    }

    // Subtle red glow at horizon
    g.fillStyle(0xdd3333, 0.12);
    g.fillRect(0, H * 0.48, W, H * 0.15);
  }

  private buildHeader(): void {
    this.add.text(W / 2, 22, '🔴 CÔNG BỐ SỰ THẬT', {
      fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#ff6666', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5, 0);

    this.add.text(W / 2, 54, '+50 điểm', {
      fontSize: '14px', fontFamily: 'Arial', color: '#f5c518',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 0);
  }

  private playLines(): void {
    let lineY = 110;
    let lastTime = 0;

    for (const line of LINES) {
      if (!line.text) { lineY += 14; continue; }
      const t    = this.add.text(W / 2, lineY, line.text, {
        fontSize: '15px', fontFamily: 'Arial', color: '#e8ddd0',
        align: 'center', stroke: '#000', strokeThickness: 2,
        wordWrap: { width: W - 120 },
      }).setOrigin(0.5, 0).setAlpha(0);

      this.time.delayedCall(line.delay, () => {
        this.tweens.add({ targets: t, alpha: 1, duration: 700 });
      });

      lineY += t.height + 18;
      lastTime = Math.max(lastTime, line.delay);
    }

    // Proceed button / auto-advance
    this.time.delayedCall(lastTime + 2000, () => this.showContinue());
  }

  private showContinue(): void {
    const btn = this.add.text(W / 2, H - 40, '[ Tiếp tục → ]', {
      fontSize: '16px', fontFamily: 'Arial', color: '#f5c518',
      stroke: '#000', strokeThickness: 2,
      backgroundColor: '#00000099', padding: { x: 16, y: 8 },
    }).setOrigin(0.5, 1).setAlpha(0).setInteractive();
    this.tweens.add({ targets: btn, alpha: 1, duration: 600 });
    btn.on('pointerdown', () => this.goToEndScreen());
    // Also allow any key
    this.input.keyboard!.once('keydown', () => this.goToEndScreen());
  }

  private goToEndScreen(): void {
    this.cameras.main.fadeOut(600);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('EndScreen');
    });
  }
}
