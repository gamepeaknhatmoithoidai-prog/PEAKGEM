/**
 * EndingBlack — Giữ Im Lặng
 * +0 điểm thưởng.  Text cutscene.  → EndScreen
 */
import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { W, H } from '../constants';

const LINES = [
  { text: 'Dự án tiến hành.',                       delay: 0    },
  { text: 'Hai năm sau — rừng bị ngập.',             delay: 1600 },
  { text: 'Bản người Mạ tái định cư bắt buộc.',     delay: 3200 },
  { text: '',                                        delay: 4600 },
  { text: 'Ama K\'Nơi mất trong năm ngập đó.',      delay: 5200 },
  { text: 'Ông không rời làng.',                     delay: 6800 },
  { text: '',                                        delay: 8000 },
  { text: 'K\'Brơi không liên lạc với Thuận nữa.',  delay: 8600 },
  { text: '',                                        delay: 9800 },
  { text: 'Luận văn được điểm A.',                  delay: 10400 },
  { text: 'Thuận không bao giờ đọc lại nó.',        delay: 12000 },
  { text: '',                                        delay: 13200 },
  { text: '⚫ Đôi khi im lặng cũng là một lựa chọn.', delay: 14000 },
  { text: '⚫ Và cũng là một trách nhiệm.',          delay: 15800 },
];

export class EndingBlack extends Phaser.Scene {
  private gs!: GS;

  constructor() { super('EndingBlack'); }

  create(): void {
    this.gs = new GS(this.registry);
    // +0 bonus score

    this.buildBackground();
    this.buildHeader();
    this.playLines();
  }

  private buildBackground(): void {
    const g = this.add.graphics();
    // Flooded dark palette
    g.fillStyle(0x060810);
    g.fillRect(0, 0, W, H);

    // Water reflections
    g.fillStyle(0x0a1525, 0.8);
    g.fillRect(0, H * 0.50, W, H * 0.50);
    g.fillStyle(0x0e1e36, 0.5);
    for (let x = 0; x < W; x += 28) {
      g.fillRect(x, H * 0.52, 14, 2);
      g.fillRect(x + 8, H * 0.60, 10, 2);
      g.fillRect(x + 4, H * 0.70, 16, 2);
    }

    // Submerged tree tops
    g.fillStyle(0x060c04);
    for (let x = 0; x < W; x += 80) {
      const top = H * 0.46 - (x % 40) * 0.5;
      g.fillEllipse(x + 40, top, 70, 50);
    }

    // Single house top poking out
    g.fillStyle(0x1a1208);
    g.fillTriangle(W * 0.35, H * 0.42, W * 0.26, H * 0.55, W * 0.44, H * 0.55);
  }

  private buildHeader(): void {
    this.add.text(W / 2, 22, '⚫ GIỮ IM LẶNG', {
      fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#aaaaaa', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5, 0);

    this.add.text(W / 2, 54, '+0 điểm', {
      fontSize: '14px', fontFamily: 'Arial', color: '#888888',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 0);
  }

  private playLines(): void {
    let lineY = 110;
    let lastTime = 0;

    for (const line of LINES) {
      if (!line.text) { lineY += 12; continue; }
      const t = this.add.text(W / 2, lineY, line.text, {
        fontSize: '15px', fontFamily: 'Arial', color: '#c0c8cc',
        align: 'center', stroke: '#000', strokeThickness: 2,
        wordWrap: { width: W - 120 },
      }).setOrigin(0.5, 0).setAlpha(0);

      this.time.delayedCall(line.delay, () => {
        this.tweens.add({ targets: t, alpha: 1, duration: 800 });
      });

      lineY += t.height + 16;
      lastTime = Math.max(lastTime, line.delay);
    }

    this.time.delayedCall(lastTime + 2200, () => this.showContinue());
  }

  private showContinue(): void {
    const btn = this.add.text(W / 2, H - 40, '[ Tiếp tục → ]', {
      fontSize: '16px', fontFamily: 'Arial', color: '#888888',
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
