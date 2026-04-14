import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { W, H } from '../constants';

export class UIScene extends Phaser.Scene {
  private gs!: GS;
  private scoreText!: Phaser.GameObjects.Text;
  private trustBar!: Phaser.GameObjects.Rectangle;
  private trustFill!: Phaser.GameObjects.Rectangle;
  private chapterText!: Phaser.GameObjects.Text;
  private inventoryText!: Phaser.GameObjects.Text;
  private notifText!: Phaser.GameObjects.Text;
  private notifTween: Phaser.Tweens.Tween | null = null;
  private muteBtn!: Phaser.GameObjects.Text;
  private muted = false;

  constructor() { super({ key: 'UIScene', active: false }); }

  create(): void {
    this.gs = new GS(this.registry);

    // ── Top bar background ──────────────────────────────────────────
    const barBg = this.add.graphics();
    barBg.fillStyle(0x000000, 0.55);
    barBg.fillRect(0, 0, W, 34);
    barBg.fillStyle(0x2a4a18, 0.6);
    barBg.fillRect(0, 33, W, 1.5);

    // ── Score ───────────────────────────────────────────────────────
    this.add.text(12, 8, '⭐ Điểm:', { fontSize: '12px', fontFamily: 'Arial', color: '#f5c518' });
    this.scoreText = this.add.text(68, 8, '0', {
      fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold', color: '#f5c518',
    });

    // ── Trust meter ─────────────────────────────────────────────────
    this.add.text(W / 2 - 90, 8, 'Tin tưởng K\'Brơi:', {
      fontSize: '11px', fontFamily: 'Arial', color: '#cceeaa',
    });
    this.trustBar = this.add.rectangle(W / 2 + 60, 17, 130, 10, 0x1a2a10)
      .setStrokeStyle(1, 0x3a5a28);
    this.trustFill = this.add.rectangle(W / 2 - 5, 17, 0, 8, 0x4ab840);

    // ── Chapter label ───────────────────────────────────────────────
    this.chapterText = this.add.text(W - 120, 8, 'Chương 1', {
      fontSize: '12px', fontFamily: 'Arial', color: '#88ccff',
    });

    // ── Mute button ─────────────────────────────────────────────────
    this.muteBtn = this.add.text(W - 28, 8, '🔊', {
      fontSize: '14px', fontFamily: 'Arial',
    }).setInteractive({ useHandCursor: true });
    this.muteBtn.on('pointerdown', () => this.toggleMute());

    // ── Bottom inventory ────────────────────────────────────────────
    const invBg = this.add.graphics();
    invBg.fillStyle(0x000000, 0.45);
    invBg.fillRect(0, H - 26, W, 26);

    this.add.text(10, H - 18, '🎒 Hành trang:', {
      fontSize: '11px', fontFamily: 'Arial', color: '#cceeaa',
    }).setOrigin(0, 0.5);

    this.inventoryText = this.add.text(100, H - 18, 'Trống', {
      fontSize: '11px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0, 0.5);

    // Controls hint
    this.add.text(W / 2, H - 18, 'WASD/↑↓←→ di chuyển  •  E tương tác  •  C chụp ảnh', {
      fontSize: '10px', fontFamily: 'Arial', color: '#556644',
    }).setOrigin(0.5, 0.5);

    // ── Notification area ───────────────────────────────────────────
    this.notifText = this.add.text(W / 2, 60, '', {
      fontSize: '15px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#ffffff', stroke: '#000', strokeThickness: 3,
      backgroundColor: '#00000088',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setVisible(false).setDepth(20);

    // ── Listen to registry events ────────────────────────────────────
    this.registry.events.on('score-change', this.refreshScore, this);
    this.registry.events.on('trust-change', this.refreshTrust, this);
    this.registry.events.on('inventory-change', this.refreshInventory, this);
    this.registry.events.on('chapter-change', (_v: number) => {
      this.chapterText.setText(`Chương ${this.gs.get('chapter')}`);
    }, this);

    // Refresh initial state
    this.refreshScore();
    this.refreshTrust();
    this.refreshInventory();

    // Listen for global notifications
    this.game.events.on('notify', this.showNotif, this);
  }

  private refreshScore(): void {
    const s = this.gs.get('score') || 0;
    this.scoreText.setText(s.toString());
    // Pop animation
    this.tweens.add({ targets: this.scoreText, scaleX: 1.4, scaleY: 1.4, duration: 120, yoyo: true });
  }

  private refreshTrust(): void {
    const t = this.gs.get('trust') || 0;
    const maxW = 120;
    const fill = (t / 100) * maxW;
    // Reposition fill: left edge = W/2 - 5 - 60 + fill/2
    const startX = W / 2 - 5;
    this.trustFill.setPosition(startX - maxW / 2 + fill / 2, 17);
    this.trustFill.setSize(fill, 8);

    // Color: red→yellow→green
    const color = t < 30 ? 0xcc4422 : t < 60 ? 0xddaa22 : 0x4ab840;
    this.trustFill.setFillStyle(color);
  }

  private refreshInventory(): void {
    const inv: string[] = this.gs.get('inventory') || [];
    if (inv.length === 0) {
      this.inventoryText.setText('Trống');
    } else {
      const labels: Record<string, string> = {
        camera: '📷 Máy ảnh',
        evidence1: '📋 Bằng chứng 1',
        evidence2: '📋 Bằng chứng 2',
        evidence3: '📋 Bằng chứng 3',
        evidence4: '📋 Bằng chứng 4',
        evidence5: '📋 Bằng chứng 5',
        'evidence-ch1-1': '📋 Bằng chứng phá rừng 1',
        'evidence-ch1-2': '📋 Bằng chứng phá rừng 2',
        'evidence-ch1-3': '📋 Bằng chứng phá rừng 3',
        'plant-Rau Bép': '🌿 Ảnh: Rau Bép',
        'plant-Cần Dại': '🌿 Ảnh: Cần Dại',
        'plant-Mặt Cắt': '🌿 Ảnh: Mặt Cắt',
        report: '📄 Báo cáo giả',
      };
      this.inventoryText.setText(inv.map(k => labels[k] || k).join('  '));
    }
  }

  showNotif(msg: string, color = '#ffffff'): void {
    this.notifText.setText(msg).setColor(color).setVisible(true).setAlpha(1);
    if (this.notifTween) this.notifTween.stop();
    this.notifTween = this.tweens.add({
      targets: this.notifText,
      alpha: 0,
      delay: 2200,
      duration: 600,
      onComplete: () => this.notifText.setVisible(false),
    });
  }

  private toggleMute(): void {
    this.muted = !this.muted;
    this.muteBtn.setText(this.muted ? '🔇' : '🔊');
    try {
      if (this.muted) this.sound.setVolume(0);
      else this.sound.setVolume(1);
    } catch (_) {}
  }

  shutdown(): void {
    this.game.events.off('notify', this.showNotif, this);
  }
}
