import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { W, H } from '../constants';

interface LaunchData { sourceScene: string }

type Phase = 'approach' | 'cut' | 'soothe' | 'done';

export class MiniGameAnimalScene extends Phaser.Scene {
  private gs!: GS;
  private sourceScene = '';
  private phase: Phase = 'approach';
  private deerImg!: Phaser.GameObjects.Image;
  private instructText!: Phaser.GameObjects.Text;
  private actionBtn!: Phaser.GameObjects.Container;
  private progressBar!: Phaser.GameObjects.Rectangle;
  private progressFill!: Phaser.GameObjects.Rectangle;
  private holding = false;
  private holdProgress = 0;
  private cutCount = 0;
  private panel!: Phaser.GameObjects.Graphics;

  constructor() { super({ key: 'MiniGameAnimalScene', active: false }); }

  init(data: LaunchData): void {
    this.sourceScene = data.sourceScene;
    this.phase = 'approach';
    this.holdProgress = 0;
    this.cutCount = 0;
    this.holding = false;
  }

  create(): void {
    this.gs = new GS(this.registry);

    // Dark overlay
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88);

    // Panel
    this.panel = this.add.graphics();
    this.panel.fillStyle(0x0a1f05, 0.97);
    this.panel.fillRoundedRect(80, 50, W - 160, H - 100, 12);
    this.panel.lineStyle(2, 0x885522);
    this.panel.strokeRoundedRect(80, 50, W - 160, H - 100, 12);

    // Title
    this.add.text(W / 2, 80, '🦌 Cứu Con Hươu', {
      fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#cc8833',
    }).setOrigin(0.5);

    // Step indicators
    this.buildStepIndicators();

    // Deer image
    this.deerImg = this.add.image(W / 2, 220, 'deer').setScale(3.5).setDepth(3);

    // Trap visual under deer
    this.add.image(W / 2, 250, 'trap').setScale(2).setDepth(2);

    // Instruction text
    this.instructText = this.add.text(W / 2, 320, '', {
      fontSize: '15px', fontFamily: 'Arial', color: '#e8f5d8',
      wordWrap: { width: W - 200 }, align: 'center',
    }).setOrigin(0.5).setDepth(4);

    // Progress bar (for hold actions)
    const barBg = this.add.rectangle(W / 2, 365, 300, 16, 0x1a2a10)
      .setStrokeStyle(1, 0x3a5a28).setDepth(4).setVisible(false);
    this.progressBar = barBg;
    this.progressFill = this.add.rectangle(W / 2 - 148, 365, 0, 12, 0x4ab840)
      .setDepth(5).setVisible(false).setOrigin(0, 0.5);

    // Action button
    this.buildActionButton();

    this.showPhase();
  }

  private buildStepIndicators(): void {
    const steps = ['1. Tiếp cận', '2. Gỡ bẫy', '3. Xoa dịu'];
    const colors = ['#cc8833', '#aaaaaa', '#aaaaaa'];
    steps.forEach((s, i) => {
      this.add.text(W / 2 - 180 + i * 180, 115, s, {
        fontSize: '12px', fontFamily: 'Arial', color: colors[i],
      }).setOrigin(0.5).setDepth(3).setName(`step-${i}`);
    });
    // Arrows between steps
    this.add.text(W / 2 - 50, 115, '→', { fontSize: '14px', color: '#555544' }).setOrigin(0.5);
    this.add.text(W / 2 + 110, 115, '→', { fontSize: '14px', color: '#555544' }).setOrigin(0.5);
  }

  private buildActionButton(): void {
    const bg = this.add.rectangle(0, 0, 220, 46, 0x2a5a14)
      .setStrokeStyle(2, 0x4ab840);
    const label = this.add.text(0, 0, '', {
      fontSize: '15px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);

    this.actionBtn = this.add.container(W / 2, 420, [bg, label])
      .setSize(220, 46).setDepth(6).setInteractive({ useHandCursor: true });

    this.actionBtn.on('pointerover', () => (bg as Phaser.GameObjects.Rectangle).setFillStyle(0x3a7a1a));
    this.actionBtn.on('pointerout', () => {
      if (!this.holding) (bg as Phaser.GameObjects.Rectangle).setFillStyle(0x2a5a14);
    });
    this.actionBtn.on('pointerdown', () => this.onButtonDown());
    this.actionBtn.on('pointerup', () => this.onButtonUp());
    this.actionBtn.on('pointerout', () => this.onButtonUp());

    // Also keyboard
    this.input.keyboard!.on('keydown-SPACE', () => this.onButtonDown());
    this.input.keyboard!.on('keyup-SPACE', () => this.onButtonUp());
  }

  private getLabel(ph: Phase): string {
    const labels: Record<Phase, string> = {
      approach: '🚶 Tiếp cận từ từ (Giữ SPACE/Click)',
      cut: '✂ Cắt dây bẫy (Nhấn 5 lần)',
      soothe: '🤲 Xoa dịu hươu (Giữ SPACE/Click)',
      done: '✅ Hoàn thành!',
    };
    return labels[ph];
  }

  private showPhase(): void {
    const label = this.actionBtn.list[1] as Phaser.GameObjects.Text;
    const bg = this.actionBtn.list[0] as Phaser.GameObjects.Rectangle;

    label.setText(this.getLabel(this.phase));
    this.holdProgress = 0;
    this.cutCount = 0;

    const phaseInstructions: Record<Phase, string> = {
      approach: 'Con hươu đang hoảng loạn.\nDi chuyển từ từ, đừng gây tiếng động mạnh.\nGiữ nút hoặc phím SPACE cho đến khi hươu bình tĩnh.',
      cut: 'Hươu đã yên hơn một chút.\nBây giờ gỡ dây bẫy cẩn thận.\nNhấn nút hoặc SPACE 5 lần để cắt từng đoạn dây.',
      soothe: 'Bẫy đã được gỡ!\nNhưng hươu vẫn còn sợ hãi và đau.\nGiữ tay nhẹ nhàng và xoa dịu cho đến khi nó bình tĩnh.',
      done: '',
    };

    this.instructText.setText(phaseInstructions[this.phase]);

    const needsProgress = this.phase === 'approach' || this.phase === 'soothe';
    this.progressBar.setVisible(needsProgress);
    this.progressFill.setVisible(needsProgress);
    if (needsProgress) {
      this.progressFill.setSize(0, 12);
    }

    // Color feedback
    if (this.phase === 'cut') bg.setFillStyle(0x5a3a10);
    else bg.setFillStyle(0x2a5a14);

    // Deer visual state
    if (this.phase === 'soothe') this.deerImg.setTint(0xccffcc);
    else if (this.phase === 'done') this.deerImg.setTint(0x88ff88);
    else this.deerImg.clearTint();
  }

  private onButtonDown(): void {
    if (this.phase === 'done') return;
    this.holding = true;

    if (this.phase === 'cut') {
      // Increment cut count each press
      this.cutCount++;
      this.updateCutUI();
      if (this.cutCount >= 5) {
        this.time.delayedCall(300, () => this.nextPhase());
      }
    }
  }

  private onButtonUp(): void {
    this.holding = false;
  }

  private updateCutUI(): void {
    const label = this.actionBtn.list[1] as Phaser.GameObjects.Text;
    label.setText(`✂ Cắt dây bẫy (${this.cutCount}/5)`);
    // Visual shake
    this.tweens.add({ targets: this.deerImg, x: W / 2 + 4, duration: 50, yoyo: true });
    try { this.sound.play('click', { volume: 0.2 }); } catch (_) {}
  }

  update(_t: number, delta: number): void {
    if (!this.holding) {
      // Drain progress slowly
      if ((this.phase === 'approach' || this.phase === 'soothe') && this.holdProgress > 0) {
        this.holdProgress = Math.max(0, this.holdProgress - delta * 0.0003);
        this.updateProgressBar();
      }
      return;
    }

    if (this.phase === 'approach' || this.phase === 'soothe') {
      this.holdProgress += delta * 0.00055;
      this.updateProgressBar();
      if (this.holdProgress >= 1) {
        this.holdProgress = 1;
        this.nextPhase();
      }
    }
  }

  private updateProgressBar(): void {
    const maxW = 296;
    const fill = this.holdProgress * maxW;
    this.progressFill.setSize(fill, 12);
    this.progressFill.setPosition(W / 2 - 148 + fill / 2, 365);
    const color = this.holdProgress < 0.5 ? 0xcc8833 : 0x4ab840;
    this.progressFill.setFillStyle(color);
  }

  private nextPhase(): void {
    this.holding = false;

    switch (this.phase) {
      case 'approach': this.phase = 'cut'; break;
      case 'cut':      this.phase = 'soothe'; break;
      case 'soothe':   this.phase = 'done'; this.onSuccess(); return;
    }

    // Update step indicators
    const phaseOrder: Phase[] = ['approach', 'cut', 'soothe'];
    const idx = phaseOrder.indexOf(this.phase);
    for (let i = 0; i <= idx; i++) {
      const el = this.children.getByName(`step-${i}`) as Phaser.GameObjects.Text | null;
      if (el) el.setColor('#88ff66');
    }

    this.showPhase();
    try { this.sound.play('success', { volume: 0.3 }); } catch (_) {}
  }

  private onSuccess(): void {
    this.phase = 'done';

    // Success animation
    this.tweens.add({
      targets: this.deerImg,
      y: this.deerImg.y - 20,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        this.add.text(W / 2, 220, '🦌 Hươu đã được cứu!', {
          fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: '#88ff66',
          stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(8);

        this.add.text(W / 2, 260, 'Sau này, chú hươu sẽ nhớ ơn bạn...', {
          fontSize: '14px', fontFamily: 'Arial', color: '#cceeaa',
        }).setOrigin(0.5).setDepth(8);

        this.add.text(W / 2, 295, `+120 điểm  •  Niềm tin K'Brơi +15  •  Nhận được: 📷 Máy ảnh`, {
          fontSize: '12px', fontFamily: 'Arial', color: '#f5c518',
        }).setOrigin(0.5).setDepth(8);
      },
    });

    // Continue button
    this.time.delayedCall(1200, () => {
      const contBg = this.add.rectangle(W / 2, 360, 180, 40, 0x2a6a18)
        .setStrokeStyle(2, 0x4ab840).setDepth(10).setInteractive({ useHandCursor: true });
      this.add.text(W / 2, 360, 'Tiếp tục hành trình →', {
        fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold', color: '#fff',
      }).setOrigin(0.5).setDepth(11);

      contBg.on('pointerdown', () => this.finish(true));
      contBg.on('pointerover', () => contBg.setFillStyle(0x3a8a28));
      contBg.on('pointerout', () => contBg.setFillStyle(0x2a6a18));
    });

    try { this.sound.play('success', { volume: 0.5 }); } catch (_) {}
  }

  private finish(success: boolean): void {
    const src = this.scene.get(this.sourceScene);
    if (src) src.events.emit('dialog-done', null);
    this.game.events.emit('minigame-done', { type: 'animal', score: 120, success });
    this.scene.stop();
  }
}
