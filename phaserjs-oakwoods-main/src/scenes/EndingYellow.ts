/**
 * EndingYellow — Thương Lượng
 * +30 điểm thưởng.  Text cutscene.  → EndScreen
 */
import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { W, H } from '../constants';

const LINES = [
  { text: 'Ông Thắng đồng ý thuê chuyên gia độc lập.',        delay: 0    },
  { text: 'Dự án điều chỉnh — diện tích rừng\nbị ảnh hưởng giảm 60%.', delay: 1800 },
  { text: 'Bản người Mạ được giữ lại.',                        delay: 3600 },
  { text: '',                                                   delay: 5000 },
  { text: 'K\'Brơi hoài nghi. Nhưng chấp nhận.',              delay: 5600 },
  { text: '',                                                   delay: 7000 },
  { text: 'Thuận không biết đây là kết quả tốt nhất có thể,', delay: 7600 },
  { text: 'hay chỉ là thỏa hiệp tốt nhất trong hoàn cảnh tệ.', delay: 9400 },
  { text: '',                                                   delay: 11000 },
  { text: 'Câu hỏi đó theo cậu mãi.',                          delay: 11600 },
  { text: '',                                                   delay: 13000 },
  { text: '🟡 Không có câu trả lời hoàn hảo.',                 delay: 13600 },
  { text: '🟡 Đôi khi bảo tồn là nghệ thuật của những điều có thể.', delay: 15400 },
];

export class EndingYellow extends Phaser.Scene {
  private gs!: GS;

  constructor() { super('EndingYellow'); }

  create(): void {
    this.gs = new GS(this.registry);
    this.gs.addScore(30);

    this.buildBackground();
    this.buildHeader();
    this.playLines();
  }

  private buildBackground(): void {
    const g = this.add.graphics();
    // Amber compromise palette
    g.fillGradientStyle(0x0a0c08, 0x0a0c08, 0x1c1606, 0x1c1606);
    g.fillRect(0, 0, W, H);

    // Ground — forest still standing
    g.fillStyle(0x1c2a08);
    g.fillRect(0, H * 0.56, W, H * 0.44);

    // Tree silhouettes — full forest
    g.fillStyle(0x0d1a04);
    for (let x = 0; x < W; x += 58) {
      const ch = 150 + (x % 70);
      g.fillRect(x + 21, H * 0.56 - ch, 16, ch);
      g.fillEllipse(x + 29, H * 0.56 - ch, 62, 68);
    }

    // Golden horizon glow
    g.fillStyle(0xddaa22, 0.14);
    g.fillRect(0, H * 0.30, W, H * 0.30);

    // A few cleared patches (compromise)
    g.fillStyle(0x3a2a10, 0.6);
    g.fillEllipse(W * 0.25, H * 0.60, 100, 40);
    g.fillEllipse(W * 0.72, H * 0.58, 80, 32);
  }

  private buildHeader(): void {
    this.add.text(W / 2, 22, '🟡 THƯƠNG LƯỢNG', {
      fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#f5c518', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5, 0);

    this.add.text(W / 2, 54, '+30 điểm', {
      fontSize: '14px', fontFamily: 'Arial', color: '#f5c518',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 0);
  }

  private playLines(): void {
    let lineY = 110;
    let lastTime = 0;

    for (const line of LINES) {
      if (!line.text) { lineY += 12; continue; }
      const t = this.add.text(W / 2, lineY, line.text, {
        fontSize: '15px', fontFamily: 'Arial', color: '#d8cca8',
        align: 'center', stroke: '#000', strokeThickness: 2,
        wordWrap: { width: W - 120 },
      }).setOrigin(0.5, 0).setAlpha(0);

      this.time.delayedCall(line.delay, () => {
        this.tweens.add({ targets: t, alpha: 1, duration: 700 });
      });

      lineY += t.height + 16;
      lastTime = Math.max(lastTime, line.delay);
    }

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
    this.input.keyboard!.once('keydown', () => this.goToEndScreen());
  }

  private goToEndScreen(): void {
    this.cameras.main.fadeOut(600);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('EndScreen');
    });
  }
}
