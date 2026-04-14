import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { DIALOGS, formatText } from '../data/dialogue';
import { W, H } from '../constants';

export class EndingScene extends Phaser.Scene {
  private gs!: GS;
  private lineIdx = 0;
  private lines: Array<{ speaker: string; text: string; portrait?: string }> = [];
  private charIdx = 0;
  private displayText = '';
  private phase: 'epilogue' | 'score' = 'epilogue';
  private bodyText!: Phaser.GameObjects.Text;
  private speakerText!: Phaser.GameObjects.Text;
  private portrait!: Phaser.GameObjects.Image;
  private typeTimer = 0;
  private typing = true;

  constructor() { super('EndingScene'); }

  create(): void {
    this.gs = new GS(this.registry);
    const ending = this.gs.getEnding();
    const name = this.gs.get('playerName') || 'Thuận';

    // Build epilogue lines from dialog data
    const dialogKey = `ending-${ending}`;
    const dialog = DIALOGS[dialogKey] || DIALOGS['ending-neutral'];
    this.lines = dialog.map(l => ({
      speaker: formatText(l.speaker, name),
      text: formatText(l.text, name),
      portrait: l.portrait,
    }));

    // Background
    this.add.rectangle(W / 2, H / 2, W, H, 0x030a02);
    this.buildForestBg(ending);

    // Epilogue UI
    this.buildEpilogueUI();

    // Input
    this.input.keyboard!.on('keydown-SPACE', () => this.handleInput());
    this.input.keyboard!.on('keydown-ENTER', () => this.handleInput());
    this.input.on('pointerdown', () => this.handleInput());

    this.showLine(0);
  }

  private buildForestBg(ending: 'good' | 'neutral' | 'bad'): void {
    const g = this.add.graphics().setDepth(0);
    const colors: Record<string, number> = { good: 0x1a3a10, neutral: 0x1a2a18, bad: 0x0a1208 };
    g.fillStyle(colors[ending] || 0x0f1f0a);
    g.fillRect(0, 0, W, H);

    // Stars / atmosphere
    g.fillStyle(0xffffff, 0.5);
    for (let i = 0; i < 35; i++) {
      g.fillCircle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H * 0.4), 0.8 + Math.random());
    }
    if (ending === 'good') {
      // Sun rising effect
      g.fillStyle(0xffcc44, 0.3);
      g.fillCircle(W / 2, H * 0.3, 120);
    }

    // Tree silhouettes
    g.fillStyle(0x050f03);
    const treeDefs = [
      { x: 30, h: 280 }, { x: 110, h: 240 }, { x: 800, h: 260 }, { x: 900, h: 300 }, { x: 960, h: 220 },
    ];
    for (const t of treeDefs) {
      g.fillTriangle(t.x - 30, H, t.x + 30, H, t.x, H - t.h);
      g.fillRect(t.x - 8, H - 50, 16, 50);
    }
  }

  private buildEpilogueUI(): void {
    const BOX_Y = H - 120;
    // Dialog box
    const box = this.add.graphics().setDepth(5);
    box.fillStyle(0x000000, 0.88);
    box.fillRoundedRect(20, BOX_Y - 70, W - 40, 145, 8);
    box.lineStyle(1.5, 0x3a7a28);
    box.strokeRoundedRect(20, BOX_Y - 70, W - 40, 145, 8);

    // Portrait
    this.portrait = this.add.image(78, BOX_Y - 10, 'portrait-frame')
      .setScale(0.85).setDepth(6).setVisible(false);

    // Speaker
    this.speakerText = this.add.text(145, BOX_Y - 60, '', {
      fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#88ff66', stroke: '#000', strokeThickness: 2,
    }).setDepth(7);

    // Body
    this.bodyText = this.add.text(145, BOX_Y - 38, '', {
      fontSize: '13px', fontFamily: 'Arial', color: '#e8f5d8',
      wordWrap: { width: W - 190 }, lineSpacing: 6,
    }).setDepth(7);

    // Continue hint
    const hint = this.add.text(W - 36, H - 18, '▼', {
      fontSize: '14px', fontFamily: 'Arial', color: '#88cc66',
    }).setOrigin(0.5).setDepth(7);
    this.tweens.add({ targets: hint, y: H - 14, duration: 600, yoyo: true, repeat: -1 });
  }

  private showLine(idx: number): void {
    if (idx >= this.lines.length) { this.phase = 'score'; this.showScoreScreen(); return; }
    const line = this.lines[idx];
    this.lineIdx = idx;
    this.charIdx = 0;
    this.displayText = '';
    this.typing = true;
    this.typeTimer = 0;
    this.speakerText.setText(line.speaker);

    if (line.portrait && this.textures.exists(line.portrait)) {
      this.portrait.setTexture(line.portrait).setVisible(true).setScale(2.2);
    } else {
      this.portrait.setVisible(false);
    }
  }

  update(_t: number, delta: number): void {
    if (this.phase === 'score') return;
    if (!this.typing) return;

    const fullText = this.lines[this.lineIdx]?.text || '';
    this.typeTimer += delta;
    if (this.typeTimer > 22) {
      this.typeTimer = 0;
      if (this.charIdx < fullText.length) {
        this.charIdx = Math.min(fullText.length, this.charIdx + 2);
        this.displayText = fullText.slice(0, this.charIdx);
        this.bodyText.setText(this.displayText);
      } else {
        this.typing = false;
      }
    }
  }

  private handleInput(): void {
    if (this.phase === 'score') return;
    const fullText = this.lines[this.lineIdx]?.text || '';
    if (this.typing) {
      this.charIdx = fullText.length;
      this.displayText = fullText;
      this.bodyText.setText(this.displayText);
      this.typing = false;
    } else {
      this.showLine(this.lineIdx + 1);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  SCORE SCREEN
  // ═══════════════════════════════════════════════════════════════════
  private showScoreScreen(): void {
    const gs = this.gs;
    const name = gs.get('playerName') || 'Thuận';
    const score = gs.get('score') || 0;
    const trust = gs.get('trust') || 0;
    const evidence = gs.get('evidenceCount') || 0;
    const animal = gs.get('animalSaved') || false;
    const decisions = (gs.get('decisions') || []) as string[];
    const ending = gs.getEnding();

    // Clear UI
    this.bodyText.setVisible(false);
    this.speakerText.setVisible(false);
    this.portrait.setVisible(false);

    // New content
    const endingColors = { good: '#88ff66', neutral: '#f5c518', bad: '#ff6644' };
    const endingLabels = {
      good: '🌿 KẾT THÚC TỐT — Rừng được bảo vệ!',
      neutral: '⚖ KẾT THÚC TRUNG BÌNH — Cuộc chiến chưa kết thúc',
      bad: '🌧 KẾT THÚC BAD — Dự án được thông qua...',
    };

    // Score card
    const card = this.add.graphics().setDepth(5);
    card.fillStyle(0x0a1a05, 0.97);
    card.fillRoundedRect(W / 2 - 320, 30, 640, H - 60, 10);
    card.lineStyle(2, 0x3a7a28);
    card.strokeRoundedRect(W / 2 - 320, 30, 640, H - 60, 10);

    this.add.text(W / 2, 65, endingLabels[ending], {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold',
      color: endingColors[ending],
    }).setOrigin(0.5).setDepth(6);

    this.add.text(W / 2, 100, `Nhân vật: ${name}`, {
      fontSize: '14px', fontFamily: 'Arial', color: '#cceeaa',
    }).setOrigin(0.5).setDepth(6);

    // Divider
    const dg = this.add.graphics().setDepth(6);
    dg.lineStyle(1, 0x3a7a28, 0.6);
    dg.lineBetween(W / 2 - 260, 120, W / 2 + 260, 120);

    // Stats
    const stats = [
      { label: '⭐ Tổng điểm:', value: `${score}`, color: '#f5c518' },
      { label: '🤝 Niềm tin K\'Brơi:', value: `${trust}/100`, color: trust >= 60 ? '#88ff66' : '#f5c518' },
      { label: '📷 Bằng chứng thu thập:', value: `${evidence}/5`, color: evidence >= 4 ? '#88ff66' : '#ff6644' },
      { label: '🦌 Cứu hươu:', value: animal ? 'Có ✅' : 'Không ❌', color: animal ? '#88ff66' : '#ff6644' },
    ];

    stats.forEach((s, i) => {
      this.add.text(W / 2 - 240, 142 + i * 38, s.label, {
        fontSize: '14px', fontFamily: 'Arial', color: '#cceeaa',
      }).setDepth(6);
      this.add.text(W / 2 + 220, 142 + i * 38, s.value, {
        fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: s.color,
      }).setOrigin(1, 0).setDepth(6);
    });

    // Decision summary
    dg.lineBetween(W / 2 - 260, 302, W / 2 + 260, 302);
    this.add.text(W / 2, 316, 'Các quyết định của bạn:', {
      fontSize: '12px', fontFamily: 'Arial', color: '#88cc66',
    }).setOrigin(0.5).setDepth(6);

    const decisionLabels: Record<string, string> = {
      gate_patient: '✅ Kiên nhẫn tại cổng vào',
      gate_eager: '→ Thể hiện nhiệt tình tại cổng',
      gate_pushy: '❌ Dùng giấy phép để ép vào',
      collect_evidence: '✅ Chụp bằng chứng quan trọng',
      skip_evidence: '❌ Bỏ qua bằng chứng',
      agree_thang: '❌ Đồng ý với dự án thủy điện',
      question_thang: '→ Chất vấn tác động môi trường',
      confront_thang: '✅ Đối chất trực tiếp với Thắng',
      hung_trust: '✅ Tin tưởng và chờ Hùng nói thật',
      hung_confront: '→ Đối chất trực tiếp với Hùng',
    };

    const shown = decisions.slice(0, 5);
    shown.forEach((d, i) => {
      const label = decisionLabels[d] || d;
      const color = label.startsWith('✅') ? '#88ff66' : label.startsWith('❌') ? '#ff6644' : '#cceeaa';
      this.add.text(W / 2 - 240, 336 + i * 22, label, {
        fontSize: '12px', fontFamily: 'Arial', color,
      }).setDepth(6);
    });

    // Educational message
    dg.lineBetween(W / 2 - 260, H - 125, W / 2 + 260, H - 125);
    const msgByEnding = {
      good: 'Cảm ơn bạn đã đứng về phía thiên nhiên. Hãy tiếp tục bảo vệ môi trường trong cuộc sống thực!',
      neutral: 'Hành trình bảo vệ rừng cần nhiều người tham gia hơn. Tìm hiểu về VQG Cát Tiên nhé!',
      bad: 'Đôi khi chúng ta đến quá muộn. Nhưng nhận thức là bước đầu tiên của thay đổi.',
    };
    this.add.text(W / 2, H - 100, msgByEnding[ending], {
      fontSize: '12px', fontFamily: 'Arial', color: '#aaccaa',
      wordWrap: { width: 560 }, align: 'center',
    }).setOrigin(0.5).setDepth(6);

    // Buttons
    const replayBg = this.add.rectangle(W / 2 - 100, H - 50, 160, 36, 0x1a4a10)
      .setStrokeStyle(1.5, 0x3a7a28).setDepth(6).setInteractive({ useHandCursor: true });
    this.add.text(W / 2 - 100, H - 50, '🔄 Chơi lại', {
      fontSize: '13px', fontFamily: 'Arial', color: '#fff',
    }).setOrigin(0.5).setDepth(7);
    replayBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.gs.reset();
        this.scene.start('CharacterSelectScene');
      });
    });
    replayBg.on('pointerover', () => replayBg.setFillStyle(0x2a6a18));
    replayBg.on('pointerout', () => replayBg.setFillStyle(0x1a4a10));

    // Animate score counter
    let displayed = 0;
    const scoreDisplay = this.add.text(W / 2 + 220, 142, '0', {
      fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: '#f5c518',
    }).setOrigin(1, 0).setDepth(8).setVisible(false); // Overwritten by stats above

    this.cameras.main.fadeIn(600);
  }
}
