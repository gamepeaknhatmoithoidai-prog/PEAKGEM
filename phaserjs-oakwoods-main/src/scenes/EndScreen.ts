/**
 * EndScreen — Màn Hình Kết Thúc Chung
 *
 * Displays:
 *  1. Total score
 *  2. Mini-game stats (fireflies, flashlight objects, dossier, tea cups)
 *  3. Real-world facts about Đồng Nai 6 & 6A project
 *  4. Leaderboard (localStorage top-10)
 *  5. Buttons: Play again | Leaderboard toggle | More info
 */
import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { W, H } from '../constants';

interface LeaderEntry { name: string; score: number; choice: string }

const REAL_FACTS = [
  '📋 SỰ THẬT VỀ DỰ ÁN THỦY ĐIỆN ĐỒNG NAI 6 & 6A:',
  '',
  '• Chủ đầu tư: Tập đoàn Đức Long Gia Lai (2011)',
  '• Diện tích rừng VQG Cát Tiên bị ảnh hưởng:',
  '  137,5 ha trực tiếp + 281 ha bị ngập',
  '• Cam kết trồng bù 370 ha — thực tế chưa đến 3% được thực hiện',
  '• Năm 2013: Thủ tướng Chính phủ quyết định DỪNG dự án',
  '• Lý do: Tác động quá nghiêm trọng đến',
  '  hệ sinh thái rừng đặc dụng',
];

export class EndScreen extends Phaser.Scene {
  private gs!: GS;
  private showingLeaderboard = false;

  constructor() { super('EndScreen'); }

  create(): void {
    this.gs = new GS(this.registry);

    // Save to leaderboard
    this.saveLeaderboard();

    this.buildBackground();
    this.buildScoreSection();
    this.buildStatsSection();
    this.buildFactsSection();
    this.buildButtons();

    this.cameras.main.fadeIn(700);
  }

  // ── Background ────────────────────────────────────────────────────────
  private buildBackground(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x061008, 0x061008, 0x0a1810, 0x0a1810);
    g.fillRect(0, 0, W, H);

    // Decorative border
    g.lineStyle(2, 0x336622, 0.6);
    g.strokeRect(14, 14, W - 28, H - 28);
    g.lineStyle(1, 0x224416, 0.4);
    g.strokeRect(20, 20, W - 40, H - 40);

    // Corner leaves
    g.fillStyle(0x224416, 0.6);
    g.fillEllipse(14, 14, 40, 40);
    g.fillEllipse(W - 14, 14, 40, 40);
    g.fillEllipse(14, H - 14, 40, 40);
    g.fillEllipse(W - 14, H - 14, 40, 40);
  }

  // ── Score ─────────────────────────────────────────────────────────────
  private buildScoreSection(): void {
    const score = this.gs.get('score') || 0;
    const choice = this.gs.get('finalChoice') || 'black';
    const choiceLabel: Record<string, string> = {
      red: '🔴 Công Bố Sự Thật',
      black: '⚫ Giữ Im Lặng',
      yellow: '🟡 Thương Lượng',
    };

    this.add.text(W / 2, 34, '🌿 RừNG CÁT TIÊN — Hành Trình Bảo Vệ', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#88cc44', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 0);

    this.add.text(W / 2, 62, `TỔNG ĐIỂM: ${score}`, {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#f5c518', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5, 0);

    this.add.text(W / 2, 100, `Lựa chọn cuối: ${choiceLabel[choice] || '—'}`, {
      fontSize: '13px', fontFamily: 'Arial', color: '#e8ddd0',
      stroke: '#000', strokeThickness: 1,
    }).setOrigin(0.5, 0);
  }

  // ── Stats ─────────────────────────────────────────────────────────────
  private buildStatsSection(): void {
    const fireflies = this.gs.get('firefliesCount') || 0;
    const flashObj  = Math.round((this.gs.get('flashlightScore') || 0) / 10);
    const dossier   = Math.round((this.gs.get('dossierScore') || 0) / 5);
    const tea       = Math.round((this.gs.get('teaScore') || 0) / 5);

    const stats = [
      { icon: '✨', label: 'Đom đóm bắt được', val: `${fireflies}` },
      { icon: '🔦', label: 'Bằng chứng tìm thấy', val: `${flashObj}/5` },
      { icon: '📦', label: 'Hồ sơ xếp đúng', val: `${dossier}/9` },
      { icon: '🍵', label: 'Chén trà rót đúng', val: `${tea}/3` },
    ];

    const panelX = 34, panelY = 124, panelW = W / 2 - 50, panelH = 90;
    const pg = this.add.graphics();
    pg.fillStyle(0x0d2210, 0.8);
    pg.fillRoundedRect(panelX, panelY, panelW, panelH, 8);
    pg.lineStyle(1, 0x336622, 0.5);
    pg.strokeRoundedRect(panelX, panelY, panelW, panelH, 8);

    this.add.text(panelX + 12, panelY + 8, '📊 Thống Kê Mini-Game', {
      fontSize: '11px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#88cc44', stroke: '#000', strokeThickness: 1,
    });

    stats.forEach((s, i) => {
      const sx = panelX + 12 + (i % 2) * (panelW / 2);
      const sy = panelY + 28 + Math.floor(i / 2) * 24;
      this.add.text(sx, sy, `${s.icon} ${s.label}: ${s.val}`, {
        fontSize: '10px', fontFamily: 'Arial', color: '#c8d8aa',
      });
    });
  }

  // ── Facts ─────────────────────────────────────────────────────────────
  private buildFactsSection(): void {
    const fx = W / 2 + 10, fy = 124, fw = W / 2 - 44, fh = 90;
    const fg = this.add.graphics();
    fg.fillStyle(0x0a1c1a, 0.85);
    fg.fillRoundedRect(fx, fy, fw, fh, 8);
    fg.lineStyle(1, 0x2a6644, 0.5);
    fg.strokeRoundedRect(fx, fy, fw, fh, 8);

    REAL_FACTS.forEach((line, i) => {
      const color = i === 0 ? '#88cc44' : (line === '' ? '#000' : '#b8cca8');
      const size  = i === 0 ? '10px' : '9px';
      if (line === '') return;
      this.add.text(fx + 8, fy + 8 + i * 10, line, {
        fontSize: size, fontFamily: 'Arial', color,
        fontStyle: i === 0 ? 'bold' : 'normal',
      }).setWordWrapWidth(fw - 16, true);
    });
  }

  // ── Buttons ───────────────────────────────────────────────────────────
  private buildButtons(): void {
    const btnY = H - 46;
    this.makeBtn(W * 0.20, btnY, '🔄 Chơi lại', 0x224416, () => this.restartGame());
    this.makeBtn(W * 0.50, btnY, '🏆 Bảng xếp hạng', 0x1a3a5a, () => this.toggleLeaderboard());
    this.makeBtn(W * 0.80, btnY, '🌿 Tìm hiểu thêm', 0x2a4410, () => {
      // In-game info panel
      this.showExtraInfo();
    });
  }

  private makeBtn(x: number, y: number, label: string, color: number, cb: () => void): void {
    const W_BTN = 150, H_BTN = 32;
    const bg = this.add.graphics().setDepth(5);
    bg.fillStyle(color, 0.9);
    bg.fillRoundedRect(x - W_BTN / 2, y - H_BTN / 2, W_BTN, H_BTN, 6);
    bg.lineStyle(1, 0x88aa44, 0.5);
    bg.strokeRoundedRect(x - W_BTN / 2, y - H_BTN / 2, W_BTN, H_BTN, 6);

    const txt = this.add.text(x, y, label, {
      fontSize: '12px', fontFamily: 'Arial', color: '#f0f0f0',
      stroke: '#000', strokeThickness: 1,
    }).setOrigin(0.5).setDepth(6);

    const zone = this.add.zone(x, y, W_BTN, H_BTN).setInteractive().setDepth(7);
    zone.on('pointerover', () => { bg.clear(); bg.fillStyle(color, 1.0); bg.fillRoundedRect(x - W_BTN / 2, y - H_BTN / 2, W_BTN, H_BTN, 6); });
    zone.on('pointerout',  () => { bg.clear(); bg.fillStyle(color, 0.9); bg.fillRoundedRect(x - W_BTN / 2, y - H_BTN / 2, W_BTN, H_BTN, 6); });
    zone.on('pointerdown', cb);

    void txt;
  }

  // ── Leaderboard ───────────────────────────────────────────────────────
  private toggleLeaderboard(): void {
    this.showingLeaderboard = !this.showingLeaderboard;
    const key = 'leaderboard-overlay';
    const existing = this.children.getByName(key);
    if (existing) { existing.destroy(); return; }

    const entries = this.getLeaderboard();
    const pw = 340, ph = Math.min(300, 60 + entries.length * 26 + 40);
    const px = W / 2 - pw / 2, py = H / 2 - ph / 2;

    const panel = this.add.container(0, 0).setName(key).setDepth(50);

    const bg = this.add.graphics();
    bg.fillStyle(0x080e04, 0.96);
    bg.fillRoundedRect(px, py, pw, ph, 10);
    bg.lineStyle(2, 0x44aa22, 0.8);
    bg.strokeRoundedRect(px, py, pw, ph, 10);
    panel.add(bg);

    const title = this.add.text(W / 2, py + 14, '🏆 Top 10 Điểm Cao Nhất', {
      fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: '#f5c518',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 0);
    panel.add(title);

    entries.slice(0, 10).forEach((e, i) => {
      const medal = ['🥇', '🥈', '🥉'][i] || `${i + 1}.`;
      const row = this.add.text(px + 16, py + 40 + i * 24,
        `${medal}  ${e.name.substring(0, 12).padEnd(12)} — ${e.score} điểm  ${e.choice === 'red' ? '🔴' : e.choice === 'yellow' ? '🟡' : '⚫'}`, {
        fontSize: '12px', fontFamily: 'Arial', color: i === 0 ? '#f5c518' : '#d0d8c8',
        fontStyle: i === 0 ? 'bold' : 'normal',
      });
      panel.add(row);
    });

    if (entries.length === 0) {
      const empty = this.add.text(W / 2, py + 50, 'Chưa có điểm nào được lưu.', {
        fontSize: '12px', fontFamily: 'Arial', color: '#888888',
      }).setOrigin(0.5);
      panel.add(empty);
    }

    const closeBtn = this.add.text(W / 2, py + ph - 22, '[ Đóng ]', {
      fontSize: '12px', fontFamily: 'Arial', color: '#aaaaaa',
      backgroundColor: '#00000066', padding: { x: 8, y: 4 },
    }).setOrigin(0.5, 1).setInteractive();
    closeBtn.on('pointerdown', () => { panel.destroy(); this.showingLeaderboard = false; });
    panel.add(closeBtn);
  }

  private saveLeaderboard(): void {
    const name  = (this.gs.get('playerName') || 'Thuận') as string;
    const score = this.gs.get('score') || 0;
    const choice = this.gs.get('finalChoice') || 'black';
    const raw   = localStorage.getItem('leaderboard') || '[]';
    let entries: LeaderEntry[] = [];
    try { entries = JSON.parse(raw); } catch (_) { entries = []; }
    entries.push({ name, score, choice });
    entries.sort((a, b) => b.score - a.score);
    entries = entries.slice(0, 50); // keep top 50
    localStorage.setItem('leaderboard', JSON.stringify(entries));
  }

  private getLeaderboard(): LeaderEntry[] {
    try {
      return JSON.parse(localStorage.getItem('leaderboard') || '[]') as LeaderEntry[];
    } catch (_) {
      return [];
    }
  }

  // ── Extra info overlay ────────────────────────────────────────────────
  private showExtraInfo(): void {
    const pw = 520, ph = 320;
    const px = W / 2 - pw / 2, py = H / 2 - ph / 2;

    const panel = this.add.container(0, 0).setDepth(60);

    const bg = this.add.graphics();
    bg.fillStyle(0x060c04, 0.97);
    bg.fillRoundedRect(px, py, pw, ph, 10);
    bg.lineStyle(2, 0x336622, 0.8);
    bg.strokeRoundedRect(px, py, pw, ph, 10);
    panel.add(bg);

    const lines = [
      { t: '🌿 VQG Cát Tiên — Khu Ramsar thứ 5 của Việt Nam', c: '#88cc44', size: '13px' },
      { t: '', c: '#000', size: '8px' },
      { t: 'Vườn Quốc gia Cát Tiên được công nhận là Khu dự trữ sinh quyển thế giới', c: '#c8d8a8', size: '11px' },
      { t: 'của UNESCO năm 2001, và là Khu Ramsar (đất ngập nước quốc tế) năm 2005.', c: '#c8d8a8', size: '11px' },
      { t: '', c: '#000', size: '8px' },
      { t: 'Đây là nơi sinh sống của gần 1.600 loài thực vật và 600+ loài động vật,', c: '#c8d8a8', size: '11px' },
      { t: 'trong đó có tê giác một sừng Java (Rhinoceros sondaicus annamiticus),', c: '#c8d8a8', size: '11px' },
      { t: 'nhưng đã tuyệt chủng tại đây vào năm 2011.', c: '#ffaa44', size: '11px' },
      { t: '', c: '#000', size: '8px' },
      { t: 'Người Mạ và S\'tiêng đã sinh sống trong vùng này hàng nghìn năm.', c: '#c8d8a8', size: '11px' },
      { t: 'Tri thức bản địa của họ là di sản văn hóa phi vật thể vô giá.', c: '#c8d8a8', size: '11px' },
    ];

    let ly = py + 18;
    for (const l of lines) {
      if (!l.t) { ly += 6; continue; }
      const row = this.add.text(px + 16, ly, l.t, {
        fontSize: l.size, fontFamily: 'Arial', color: l.c,
        fontStyle: l.size === '13px' ? 'bold' : 'normal',
        wordWrap: { width: pw - 32 },
      });
      panel.add(row);
      ly += row.height + 4;
    }

    const closeBtn = this.add.text(W / 2, py + ph - 20, '[ Đóng ]', {
      fontSize: '12px', fontFamily: 'Arial', color: '#aaaaaa',
      backgroundColor: '#00000066', padding: { x: 8, y: 4 },
    }).setOrigin(0.5, 1).setInteractive();
    closeBtn.on('pointerdown', () => panel.destroy());
    panel.add(closeBtn);
  }

  // ── Restart ───────────────────────────────────────────────────────────
  private restartGame(): void {
    this.gs.reset();
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('CharacterSelectScene');
    });
  }
}
