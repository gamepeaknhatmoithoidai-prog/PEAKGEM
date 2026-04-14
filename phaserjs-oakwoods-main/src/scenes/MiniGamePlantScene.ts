import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { PLANTS } from '../data/plants';
import { W, H } from '../constants';

interface LaunchData { sourceScene: string }

export class MiniGamePlantScene extends Phaser.Scene {
  private gs!: GS;
  private sourceScene = '';
  private currentPlant = 0;
  private score = 0;
  private correctCount = 0;
  private totalPlants = PLANTS.length;

  // UI
  private titleText!: Phaser.GameObjects.Text;
  private plantImg!: Phaser.GameObjects.Image;
  private plantName!: Phaser.GameObjects.Text;
  private plantDesc!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private choiceBtns: Phaser.GameObjects.Container[] = [];
  private overlay!: Phaser.GameObjects.Rectangle;

  constructor() { super({ key: 'MiniGamePlantScene', active: false }); }

  init(data: LaunchData): void {
    this.sourceScene = data.sourceScene;
    this.currentPlant = 0;
    this.score = 0;
    this.correctCount = 0;
  }

  create(): void {
    this.gs = new GS(this.registry);

    // ── Background overlay ───────────────────────────────────────────
    this.overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85);

    // Panel
    const panel = this.add.graphics();
    panel.fillStyle(0x0a2208, 0.97);
    panel.fillRoundedRect(60, 40, W - 120, H - 80, 12);
    panel.lineStyle(2, 0x3a7a28);
    panel.strokeRoundedRect(60, 40, W - 120, H - 80, 12);

    // Title
    this.add.text(W / 2, 66, '🌿 Nhận Diện Cây Rừng', {
      fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#4ab840',
    }).setOrigin(0.5);

    this.add.text(W / 2, 90, 'Chọn đúng công dụng của từng loài cây trong rừng Cát Tiên', {
      fontSize: '12px', fontFamily: 'Arial', color: '#99bb77',
    }).setOrigin(0.5);

    // Progress
    this.progressText = this.add.text(W / 2, 112, '', {
      fontSize: '12px', fontFamily: 'Arial', color: '#cceeaa',
    }).setOrigin(0.5);

    // Plant image area
    this.plantImg = this.add.image(W / 2 - 180, H / 2 - 30, 'plant-bep')
      .setScale(3.5).setDepth(2);

    // Plant name & description
    this.plantName = this.add.text(W / 2 + 20, 145, '', {
      fontSize: '18px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#88ff66',
    }).setOrigin(0, 0.5);

    this.plantDesc = this.add.text(W / 2 + 20, 185, '', {
      fontSize: '12px', fontFamily: 'Arial', color: '#cceeaa',
      wordWrap: { width: 340 }, lineSpacing: 5,
    }).setOrigin(0, 0);

    // Feedback text
    this.feedbackText = this.add.text(W / 2, H - 90, '', {
      fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#ffffff', stroke: '#000', strokeThickness: 2,
      backgroundColor: '#00000088', padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setDepth(5).setVisible(false);

    // Skip button
    const skipBg = this.add.rectangle(W - 100, 66, 80, 28, 0x333322)
      .setStrokeStyle(1, 0x666644).setInteractive({ useHandCursor: true });
    this.add.text(W - 100, 66, 'Bỏ qua', {
      fontSize: '11px', fontFamily: 'Arial', color: '#999977',
    }).setOrigin(0.5);
    skipBg.on('pointerdown', () => this.finishGame());

    this.showPlant(0);
  }

  private showPlant(idx: number): void {
    const plant = PLANTS[idx];
    const total = this.totalPlants;

    this.progressText.setText(`Cây ${idx + 1} / ${total}`);

    // Update plant texture
    const texKey = `plant-${plant.id}`;
    if (this.textures.exists(texKey)) {
      this.plantImg.setTexture(texKey);
    }

    this.plantName.setText(`${plant.name}\n(${plant.scientific})`);
    this.plantDesc.setText(plant.description);

    // Clear old buttons
    for (const b of this.choiceBtns) b.destroy();
    this.choiceBtns = [];

    // Build choice buttons
    const startY = 300;
    plant.choices.forEach((ch, i) => {
      const bg = this.add.rectangle(0, 0, W - 180, 38, 0x0d2508, 0.95)
        .setStrokeStyle(1.5, 0x3a7a28);
      const label = this.add.text(-(W - 180) / 2 + 14, 0, ch.text, {
        fontSize: '13px', fontFamily: 'Arial', color: '#cceeaa',
        wordWrap: { width: W - 220 },
      }).setOrigin(0, 0.5);

      const btn = this.add.container(W / 2 + 40, startY + i * 50, [bg, label])
        .setSize(W - 180, 38).setInteractive({ useHandCursor: true }).setDepth(3);

      btn.on('pointerover', () => { bg.setFillStyle(0x1a4a10); label.setColor('#ffffff'); });
      btn.on('pointerout', () => { bg.setFillStyle(0x0d2508); label.setColor('#cceeaa'); });
      btn.on('pointerdown', () => this.selectChoice(plant, i));

      this.choiceBtns.push(btn);
    });

    this.feedbackText.setVisible(false);
  }

  private selectChoice(plant: typeof PLANTS[0], idx: number): void {
    // Disable all buttons
    for (const b of this.choiceBtns) b.disableInteractive();

    const correct = idx === plant.correct;

    if (correct) {
      this.correctCount++;
      this.score += 80;
      this.gs.addScore(80);
      this.feedbackText
        .setText(`✅ Đúng! ${plant.fact}`)
        .setColor('#88ff66')
        .setVisible(true);
      try { this.sound.play('success', { volume: 0.4 }); } catch (_) {}
    } else {
      const wrongText = plant.choices[idx].wrong || 'Không đúng. Hãy học lại về loài cây này!';
      this.score -= 20;
      this.gs.addScore(-20);
      this.feedbackText
        .setText(`❌ ${wrongText}`)
        .setColor('#ff6644')
        .setVisible(true);
    }

    // Highlight correct answer
    const correctBtn = this.choiceBtns[plant.correct];
    const correctBg = correctBtn.list[0] as Phaser.GameObjects.Rectangle;
    correctBg.setFillStyle(0x1a5a10).setStrokeStyle(2, 0x88ff44);

    // Next plant after delay
    this.time.delayedCall(2500, () => {
      if (this.currentPlant < this.totalPlants - 1) {
        this.currentPlant++;
        this.showPlant(this.currentPlant);
      } else {
        this.finishGame();
      }
    });
  }

  private finishGame(): void {
    // Summary panel
    for (const b of this.choiceBtns) b.destroy();
    this.choiceBtns = [];

    const pct = Math.round((this.correctCount / this.totalPlants) * 100);
    const grade = pct >= 80 ? '🌿 Xuất sắc!' : pct >= 50 ? '👍 Khá tốt' : '📖 Cần học thêm';

    // Clear screen and show summary
    this.add.graphics()
      .fillStyle(0x000000, 0.7)
      .fillRect(0, 0, W, H);

    const panel = this.add.graphics();
    panel.fillStyle(0x0a2208, 0.98);
    panel.fillRoundedRect(W / 2 - 220, H / 2 - 130, 440, 260, 10);
    panel.lineStyle(2, 0x3a7a28);
    panel.strokeRoundedRect(W / 2 - 220, H / 2 - 130, 440, 260, 10);

    this.add.text(W / 2, H / 2 - 100, 'Kết quả Nhận diện Cây', {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#4ab840',
    }).setOrigin(0.5).setDepth(10);

    this.add.text(W / 2, H / 2 - 60, grade, {
      fontSize: '22px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5).setDepth(10);

    this.add.text(W / 2, H / 2 - 20, `Trả lời đúng: ${this.correctCount}/${this.totalPlants}`, {
      fontSize: '16px', fontFamily: 'Arial', color: '#cceeaa',
    }).setOrigin(0.5).setDepth(10);

    this.add.text(W / 2, H / 2 + 15, `Điểm nhận được: ${Math.max(0, this.score)}`, {
      fontSize: '14px', fontFamily: 'Arial', color: '#f5c518',
    }).setOrigin(0.5).setDepth(10);

    if (this.correctCount === this.totalPlants) {
      this.gs.addTrust(10);
      this.add.text(W / 2, H / 2 + 45, `Niềm tin K'Brơi +10 ✨`, {
        fontSize: '13px', fontFamily: 'Arial', color: '#88ff66',
      }).setOrigin(0.5).setDepth(10);
    }

    // Continue button
    const contBg = this.add.rectangle(W / 2, H / 2 + 95, 180, 38, 0x2a6a18)
      .setStrokeStyle(2, 0x4ab840).setDepth(10).setInteractive({ useHandCursor: true });
    this.add.text(W / 2, H / 2 + 95, 'Tiếp tục →', {
      fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: '#fff',
    }).setOrigin(0.5).setDepth(11);

    contBg.on('pointerdown', () => {
      const src = this.scene.get(this.sourceScene);
      if (src) {
        src.events.emit('dialog-done', null);
      }
      this.game.events.emit('minigame-done', {
        type: 'plant',
        score: this.correctCount,
        success: this.correctCount >= 2,
      });
      this.scene.stop();
    });

    contBg.on('pointerover', () => contBg.setFillStyle(0x3a8a28));
    contBg.on('pointerout', () => contBg.setFillStyle(0x2a6a18));
  }
}
