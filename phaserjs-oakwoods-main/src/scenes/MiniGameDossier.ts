/**
 * MiniGameDossier — Xếp Hồ Sơ (Overlay mini-game)
 *
 * Launched from C2Scene10.  Player drag-and-drops 9 paper items into
 * 3 labelled folders in 45 seconds.  +5 per correct drop.
 * Emits 'minigame-done' { score } then stops.
 */
import Phaser from 'phaser';
import { W, H } from '../constants';

const TIME_LIMIT = 45000;

interface PaperItem {
  label: string;
  category: number;  // 0=field, 1=science, 2=testimony
  obj: Phaser.GameObjects.Container;
  dropped: boolean;
}

interface Folder {
  x: number;
  y: number;
  label: string;
  shortLabel: string;
  color: number;
  zone: Phaser.GameObjects.Zone;
}

export class MiniGameDossier extends Phaser.Scene {
  private sourceScene = '';
  private papers: PaperItem[] = [];
  private folders: Folder[] = [];
  private score        = 0;
  private timeLeft     = TIME_LIMIT;
  private done         = false;
  private timerText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;

  constructor() { super({ key: 'MiniGameDossier', active: false }); }

  init(data: { sourceScene: string }): void {
    this.sourceScene = data.sourceScene || '';
    this.score       = 0;
    this.timeLeft    = TIME_LIMIT;
    this.done        = false;
    this.papers      = [];
    this.folders     = [];
  }

  create(): void {
    // Background: desk surface
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a0d05).setDepth(0);
    const desk = this.add.graphics().setDepth(1);
    desk.fillStyle(0x6b3a1f);
    desk.fillRect(30, 60, W - 60, H - 80);
    desk.lineStyle(3, 0x3b1a05);
    desk.strokeRect(30, 60, W - 60, H - 80);

    // Header
    this.add.text(W / 2, 18, '📦  Xếp hồ sơ  —  Xe xuất phát sau 45 giây!', {
      fontSize: '13px', fontFamily: 'Arial', color: '#f5e6c8',
      stroke: '#000', strokeThickness: 2,
      backgroundColor: '#00000099', padding: { x: 8, y: 4 },
    }).setOrigin(0.5, 0).setDepth(10);

    this.timerText = this.add.text(W / 2, H - 18, '45s', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffcc44',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(10);

    this.scoreText = this.add.text(W - 16, 48, 'Điểm: 0', {
      fontSize: '13px', fontFamily: 'Arial', color: '#f5c518',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(10);

    this.feedbackText = this.add.text(W / 2, H / 2 - 30, '', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10).setAlpha(0);

    // Folders
    const folderDefs = [
      { x: 150, y: H - 90,  label: '📁 Bằng chứng\nthực địa',      shortLabel: 'Thực địa',   color: 0xdd6600 },
      { x: W / 2, y: H - 90, label: '🔬 Dữ liệu\nkhoa học',         shortLabel: 'Khoa học',   color: 0x2266dd },
      { x: W - 150, y: H - 90, label: '🗣 Lời khai\nnhân chứng',    shortLabel: 'Nhân chứng', color: 0x228844 },
    ];

    for (let i = 0; i < 3; i++) {
      const fd = folderDefs[i];
      const g  = this.add.graphics().setDepth(2);
      g.fillStyle(fd.color, 0.85);
      g.fillRoundedRect(fd.x - 72, fd.y - 46, 144, 92, 8);
      g.lineStyle(2, 0xffffff, 0.5);
      g.strokeRoundedRect(fd.x - 72, fd.y - 46, 144, 92, 8);

      this.add.text(fd.x, fd.y, fd.label, {
        fontSize: '11px', fontFamily: 'Arial', color: '#ffffff',
        align: 'center', stroke: '#000', strokeThickness: 1,
      }).setOrigin(0.5).setDepth(3);

      const zone = this.add.zone(fd.x, fd.y, 144, 92).setDepth(2);
      this.input.setDropZone(zone);

      this.folders.push({ ...fd, zone });
    }

    // Papers (3 per category)
    const paperDefs = [
      // Category 0 — field evidence
      { label: '📸 Ảnh cọc\nkhảo sát', category: 0 },
      { label: '🎥 Video\nphá rừng',   category: 0 },
      { label: '📍 GPS tọa\nđộ thực địa', category: 0 },
      // Category 1 — science
      { label: '📊 Báo cáo\nsinh thái', category: 1 },
      { label: '🧪 Số liệu\nnước ngầm', category: 1 },
      { label: '🌿 Danh lục\nloài quý', category: 1 },
      // Category 2 — testimony
      { label: '📝 Lời khai\nanh Hùng',  category: 2 },
      { label: '👁 Nhân chứng\ncộng đồng', category: 2 },
      { label: '📞 Ghi âm\ncuộc gọi',   category: 2 },
    ];

    // Shuffle and position across top area
    const shuffled = Phaser.Utils.Array.Shuffle([...paperDefs]);
    const cols = 3, rows = 3;
    const startX = 130, startY = 110;
    const padX   = (W - 260) / (cols - 1);
    const padY   = 70;

    shuffled.forEach((pd, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const px  = startX + col * padX;
      const py  = startY + row * padY;

      const container = this.add.container(px, py).setDepth(5);
      const bg  = this.add.graphics();
      bg.fillStyle(0xf5f0e8);
      bg.fillRoundedRect(-44, -24, 88, 48, 5);
      bg.lineStyle(2, 0x8a7055);
      bg.strokeRoundedRect(-44, -24, 88, 48, 5);
      container.add(bg);

      const txt = this.add.text(0, 0, pd.label, {
        fontSize: '9px', fontFamily: 'Arial', color: '#1a1a1a',
        align: 'center',
      }).setOrigin(0.5);
      container.add(txt);

      container.setInteractive(new Phaser.Geom.Rectangle(-44, -24, 88, 48), Phaser.Geom.Rectangle.Contains);
      this.input.setDraggable(container);

      const item: PaperItem = { ...pd, obj: container, dropped: false };
      this.papers.push(item);

      container.on('drag', (_ptr: unknown, dx: number, dy: number) => {
        container.x = dx;
        container.y = dy;
      });

      container.on('dragend', () => {
        if (!item.dropped) {
          // Snap back
          this.tweens.add({ targets: container, x: px, y: py, duration: 200, ease: 'Back.Out' });
        }
      });

      container.on('drop', (_ptr: unknown, zone: Phaser.GameObjects.Zone) => {
        const folderIdx = this.folders.findIndex(f => f.zone === zone);
        if (folderIdx < 0) return;
        const correct = folderIdx === item.category;
        item.dropped = true;
        container.disableInteractive();
        container.x = zone.x + Phaser.Math.Between(-30, 30);
        container.y = zone.y + Phaser.Math.Between(-14, 14);
        container.setDepth(4);

        if (correct) {
          this.score += 5;
          this.scoreText.setText(`Điểm: ${this.score}`);
          this.showFeedback('✓ Đúng! +5', '#88ff66');
          const bg2 = container.list[0] as Phaser.GameObjects.Graphics;
          bg2.clear();
          bg2.fillStyle(0xaaffaa);
          bg2.fillRoundedRect(-44, -24, 88, 48, 5);
          bg2.lineStyle(2, 0x44aa44);
          bg2.strokeRoundedRect(-44, -24, 88, 48, 5);
        } else {
          this.showFeedback('✗ Sai rồi!', '#ff6666');
          const bg2 = container.list[0] as Phaser.GameObjects.Graphics;
          bg2.clear();
          bg2.fillStyle(0xffaaaa);
          bg2.fillRoundedRect(-44, -24, 88, 48, 5);
          bg2.lineStyle(2, 0xaa4444);
          bg2.strokeRoundedRect(-44, -24, 88, 48, 5);
          // Bounce out of zone
          this.tweens.add({ targets: container, x: container.x + 60, y: container.y - 20,
            duration: 300, ease: 'Back.Out',
            onComplete: () => { item.dropped = false; container.setInteractive(
              new Phaser.Geom.Rectangle(-44, -24, 88, 48), Phaser.Geom.Rectangle.Contains);
            },
          });
        }

        if (this.papers.every(p => p.dropped) && this.papers.filter(p => p.dropped).length >= 9) {
          this.triggerEnd();
        }
      });
    });

    // Skip button after 5 s
    const skipBtn = this.add.text(W - 16, H - 16, '[ Bỏ qua ]', {
      fontSize: '12px', fontFamily: 'Arial', color: '#888888',
      backgroundColor: '#00000066', padding: { x: 6, y: 3 },
    }).setOrigin(1, 1).setDepth(10).setAlpha(0).setInteractive();
    skipBtn.on('pointerdown', () => this.triggerEnd());
    this.time.delayedCall(5000, () => {
      this.tweens.add({ targets: skipBtn, alpha: 1, duration: 400 });
    });
  }

  private showFeedback(msg: string, color: string): void {
    this.feedbackText.setText(msg).setColor(color).setAlpha(1);
    this.tweens.killTweensOf(this.feedbackText);
    this.tweens.add({ targets: this.feedbackText, alpha: 0, duration: 900, delay: 500 });
  }

  update(_t: number, delta: number): void {
    if (this.done) return;
    this.timeLeft -= delta;
    if (this.timeLeft <= 0) { this.triggerEnd(); return; }

    const secs = Math.ceil(this.timeLeft / 1000);
    this.timerText.setText(`${secs}s`);
    if (secs <= 10) this.timerText.setColor('#ff4444');
  }

  private triggerEnd(): void {
    if (this.done) return;
    this.done = true;
    this.time.delayedCall(600, () => this.finish());
  }

  private finish(): void {
    const src = this.scene.get(this.sourceScene);
    src?.events.emit('minigame-done', { score: this.score, type: 'dossier' });
    this.scene.stop();
  }

  shutdown(): void { /* nothing extra needed */ }
}
