import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { W, H } from '../constants';

interface ItemDef { id: string; label: string; icon: string; bin: BinId }
type BinId = 'food' | 'recycle' | 'waste';

interface ActiveItem {
  def: ItemDef;
  container: Phaser.GameObjects.Container;
  velY: number;
  grabbed: boolean;
  alive: boolean;
}

// ── Full item pool (including confusion pairs) ────────────────────────────────
const ITEMS: ItemDef[] = [
  // 🍃 Food
  { id: 'banana',    label: 'Vỏ chuối',              icon: '🍌', bin: 'food'    },
  { id: 'apple',     label: 'Lõi táo',               icon: '🍎', bin: 'food'    },
  { id: 'bread',     label: 'Mẩu bánh mì',           icon: '🍞', bin: 'food'    },
  { id: 'rice',      label: 'Cơm thừa',              icon: '🍚', bin: 'food'    },
  { id: 'fishbone',  label: 'Xương cá',              icon: '🐟', bin: 'food'    },
  { id: 'eggshell',  label: 'Vỏ trứng',              icon: '🥚', bin: 'food'    },
  { id: 'corn',      label: 'Lõi bắp',               icon: '🌽', bin: 'food'    },
  // ♻ Recycle
  { id: 'bottle',    label: 'Chai nhựa',             icon: '🍾', bin: 'recycle' },
  { id: 'water',     label: 'Chai nước',             icon: '🧴', bin: 'recycle' },
  { id: 'can',       label: 'Lon nước ngọt',         icon: '🥤', bin: 'recycle' },
  { id: 'box',       label: 'Hộp giấy',             icon: '📦', bin: 'recycle' },
  { id: 'newspaper', label: 'Báo cũ',               icon: '📰', bin: 'recycle' },
  { id: 'cardboard', label: 'Bìa carton',            icon: '📫', bin: 'recycle' },
  { id: 'glass',     label: 'Chai thủy tinh',        icon: '🍶', bin: 'recycle' },
  { id: 'cup_clean', label: 'Ly nhựa SẠCH',         icon: '🥤', bin: 'recycle' }, // ← confusion pair
  // 🗑 Waste
  { id: 'tissue',    label: 'Khăn giấy bẩn',        icon: '🧻', bin: 'waste'   },
  { id: 'cigbtt',    label: 'Tàn thuốc',             icon: '🚬', bin: 'waste'   },
  { id: 'plasticbag',label: 'Túi nilông bẩn',        icon: '🛍', bin: 'waste'   },
  { id: 'styrofoam', label: 'Hộp xốp',              icon: '🍱', bin: 'waste'   },
  { id: 'cup_dirty', label: 'Ly nhựa BẨN',          icon: '🥤', bin: 'waste'   }, // ← confusion pair
  { id: 'straw',     label: 'Ống hút',              icon: '🧃', bin: 'waste'   },
  { id: 'mask',      label: 'Khẩu trang',           icon: '😷', bin: 'waste'   },
  { id: 'wrapper',   label: 'Vỏ bánh kẹo',          icon: '🍬', bin: 'waste'   },
  { id: 'box_dirty', label: 'Hộp giấy dính thức ăn',icon: '📦', bin: 'waste'   }, // ← confusion pair
];

const BINS: { id: BinId; label: string; fill: number; edge: number; icon: string }[] = [
  { id: 'food',    label: 'Thực phẩm thừa',  fill: 0x2d5a12, edge: 0x7acc33, icon: '🍃' },
  { id: 'recycle', label: 'Rác tái chế', fill: 0x123a5a, edge: 0x33aacc, icon: '♻' },
  { id: 'waste',   label: 'Rác thải còn lại', fill: 0x2e2a1e, edge: 0x998866, icon: '🗑' },
];

const BIN_W         = 200;
const BIN_H         = 130;
const ITEM_W        = 140;
const ITEM_H        = 56;
const BIN_XS        = [160, 480, 800];
const BIN_Y         = H - 75;

const BASE_TIME     = 30;
const BASE_FALL     = 90;   // px/s
const FALL_STEP     = 20;   // +px/s per 5-sorted tier
const MAX_FALL      = 320;
const SPAWN_BASE_MS = 2200; // ms between spawns
const SPAWN_STEP_MS = 170;  // reduce per tier
const SPAWN_MIN_MS  = 700;
const MAX_ON_SCREEN = 4;

export class MiniGameTrash extends Phaser.Scene {
  private gs!: GS;
  private pool: ItemDef[]      = [];
  private activeItems: ActiveItem[] = [];
  private binZones: { id: BinId; x: number; y: number }[] = [];

  private combo       = 0;
  private maxCombo    = 0;
  private correct     = 0;
  private wrong       = 0;
  private timeLeft    = BASE_TIME;
  private totalSorted = 0;
  private fallSpeed   = BASE_FALL;
  private spawnMs     = SPAWN_BASE_MS;
  private done        = false;

  private dragging: ActiveItem | null = null;
  private dragOX = 0;
  private dragOY = 0;

  private timerTxt!: Phaser.GameObjects.Text;
  private scoreTxt!: Phaser.GameObjects.Text;
  private comboTxt!: Phaser.GameObjects.Text;
  private timerEvent!: Phaser.Time.TimerEvent;

  constructor() { super('MiniGameTrash'); }

  // ── lifecycle ────────────────────────────────────────────────────────────
  create(): void {
    this.gs          = new GS(this.registry);
    this.done        = false;
    this.combo       = 0;
    this.maxCombo    = 0;
    this.correct     = 0;
    this.wrong       = 0;
    this.timeLeft    = BASE_TIME;
    this.totalSorted = 0;
    this.fallSpeed   = BASE_FALL;
    this.spawnMs     = SPAWN_BASE_MS;
    this.activeItems = [];
    this.binZones    = [];
    this.dragging    = null;

    this.refillPool();
    this.buildBackground();
    this.buildBins();
    this.buildHUD();
    this.startTimer();
    this.setupPointer();
    this.scheduleSpawn();
    this.spawnItem(); // spawn one immediately so screen isn't empty
  }

  // ── pool ─────────────────────────────────────────────────────────────────
  private refillPool(): void {
    this.pool = Phaser.Utils.Array.Shuffle([...ITEMS]) as ItemDef[];
  }

  private nextItemDef(): ItemDef {
    if (this.pool.length === 0) this.refillPool();
    return this.pool.pop()!;
  }

  // ── background ───────────────────────────────────────────────────────────
  private buildBackground(): void {
    this.add.rectangle(W / 2, H / 2, W, H, 0x060e03, 0.88).setDepth(0);

    const g = this.add.graphics().setDepth(1);
    g.fillStyle(0x0e1e06);
    for (const t of [
      { x: 80, r: 55 }, { x: 220, r: 45 }, { x: 350, r: 60 },
      { x: 640, r: 50 }, { x: 760, r: 42 }, { x: 880, r: 58 },
    ]) {
      g.fillCircle(t.x, 24, t.r);
      g.fillRect(t.x - 7, 24, 14, 40);
    }
    g.fillStyle(0x1a2e0a);
    g.fillRect(0, H - 20, W, 20);

    this.add.rectangle(W / 2, 36, W, 54, 0x0a1a05, 0.96)
      .setStrokeStyle(1, 0x4a9a22).setDepth(2);
    this.add.text(W / 2, 36, '♻  PHÂN LOẠI RÁC  ♻', {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#7eee44', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);
  }

  // ── bins ─────────────────────────────────────────────────────────────────
  private buildBins(): void {
    BINS.forEach((bd, i) => {
      const cx = BIN_XS[i];
      const cy = BIN_Y;
      this.binZones.push({ id: bd.id, x: cx, y: cy });

      const g = this.add.graphics().setDepth(2);
      g.fillStyle(bd.fill);
      g.fillRect(cx - BIN_W / 2, cy - BIN_H / 2, BIN_W, BIN_H);
      g.lineStyle(3, bd.edge, 1.0);
      g.strokeRect(cx - BIN_W / 2, cy - BIN_H / 2, BIN_W, BIN_H);
      g.lineStyle(1, bd.edge, 0.3);
      g.strokeRect(cx - BIN_W / 2 + 4, cy - BIN_H / 2 + 4, BIN_W - 8, BIN_H - 8);
      g.lineStyle(1, 0xffffff, 0.06);
      for (let yi = 1; yi < 4; yi++) {
        const ly = cy - BIN_H / 2 + yi * (BIN_H / 4);
        g.lineBetween(cx - BIN_W / 2 + 10, ly, cx + BIN_W / 2 - 10, ly);
      }

      this.add.text(cx, cy - BIN_H / 2 + 20, bd.label, {
        fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold',
        color: '#ffffff', stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(3);
      this.add.text(cx, cy + 22, bd.icon, { fontSize: '30px' })
        .setOrigin(0.5).setDepth(3);
    });
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  private buildHUD(): void {
    this.timerTxt = this.add.text(W - 16, 16, `⏱ ${this.timeLeft}s`, {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#ffcc44', stroke: '#000', strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(10);

    this.scoreTxt = this.add.text(16, 16, `✓ ${this.correct}  ✗ ${this.wrong}`, {
      fontSize: '15px', fontFamily: 'Arial',
      color: '#88ff66', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0, 0).setDepth(10);

    this.comboTxt = this.add.text(W / 2, 68, '', {
      fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#ffee00', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(11).setAlpha(0);

    this.add.text(W / 2, BIN_Y - BIN_H / 2 - 16,
      'Kéo rác vào đúng thùng  ·  Đúng +1s  ·  Sai −2s', {
        fontSize: '11px', fontFamily: 'Arial',
        color: '#99bb88', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(10);
  }

  // ── timer ─────────────────────────────────────────────────────────────────
  private startTimer(): void {
    this.timerEvent = this.time.addEvent({
      delay: 1000, loop: true,
      callback: () => {
        if (this.done) return;
        this.timeLeft--;
        this.refreshTimerText();
        if (this.timeLeft <= 0) this.endGame();
      },
    });
  }

  private refreshTimerText(): void {
    this.timerTxt.setText(`⏱ ${this.timeLeft}s`);
    this.timerTxt.setColor(this.timeLeft <= 10 ? '#ff4444' : '#ffcc44');
  }

  // ── spawn ─────────────────────────────────────────────────────────────────
  private scheduleSpawn(): void {
    this.time.delayedCall(this.spawnMs, () => {
      if (this.done) return;
      const onScreen = this.activeItems.filter(a => a.alive).length;
      if (onScreen < MAX_ON_SCREEN) this.spawnItem();
      if (this.totalSorted >= 15 && onScreen < MAX_ON_SCREEN - 1) this.spawnItem();
      this.scheduleSpawn();
    });
  }

  private spawnItem(): void {
    const def    = this.nextItemDef();
    const spawnX = Phaser.Math.Between(ITEM_W / 2 + 20, W - ITEM_W / 2 - 20);

    const bg  = this.add.rectangle(0, 0, ITEM_W, ITEM_H, 0xd6c898).setStrokeStyle(2, 0x7a5e28);
    const sh  = this.add.rectangle(-ITEM_W / 2 + 3, 0, 4, ITEM_H - 6, 0x9a7a38, 0.35).setOrigin(0, 0.5);
    const ico = this.add.text(-44, 1, def.icon, { fontSize: '22px' }).setOrigin(0.5);
    const lbl = this.add.text(-24, 0, def.label, {
      fontSize: '11px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#2a1500', stroke: '#e8d8b0', strokeThickness: 1,
      wordWrap: { width: 80 },
    }).setOrigin(0, 0.5);

    const ctr = this.add.container(spawnX, -ITEM_H / 2 - 4, [bg, sh, ico, lbl])
      .setDepth(5).setSize(ITEM_W, ITEM_H)
      .setInteractive({ useHandCursor: true });

    this.activeItems.push({ def, container: ctr, velY: this.fallSpeed, grabbed: false, alive: true });
  }

  // ── update ────────────────────────────────────────────────────────────────
  update(_t: number, dt: number): void {
    if (this.done) return;
    const dtSec = dt / 1000;

    for (let i = this.activeItems.length - 1; i >= 0; i--) {
      const item = this.activeItems[i];
      if (!item.alive) { this.activeItems.splice(i, 1); continue; }
      if (item.grabbed) continue;

      item.container.y += item.velY * dtSec;

      if (item.container.y > H + 60) {
        item.container.destroy();
        item.alive = false;
        this.activeItems.splice(i, 1);
      }
    }
  }

  // ── pointer ───────────────────────────────────────────────────────────────
  private setupPointer(): void {
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (this.done) return;
      for (let i = this.activeItems.length - 1; i >= 0; i--) {
        const item = this.activeItems[i];
        if (!item.alive || item.grabbed) continue;
        if (item.container.getBounds().contains(ptr.x, ptr.y)) {
          this.dragging = item;
          item.grabbed  = true;
          this.dragOX   = item.container.x - ptr.x;
          this.dragOY   = item.container.y - ptr.y;
          item.container.setDepth(8);
          break;
        }
      }
    });

    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      this.dragging.container.setPosition(ptr.x + this.dragOX, ptr.y + this.dragOY);
    });

    this.input.on('pointerup', () => {
      if (!this.dragging || this.done) return;
      const item    = this.dragging;
      this.dragging = null;

      const hit = this.hitBin(item);
      if (!hit) {
        item.grabbed = false;
        item.container.setDepth(5);
        return; // resume falling
      }
      if (hit === item.def.bin) this.onCorrect(item);
      else                      this.onWrong(item);
    });
  }

  private hitBin(item: ActiveItem): BinId | null {
    for (const z of this.binZones) {
      if (
        Math.abs(item.container.x - z.x) < BIN_W / 2 + 20 &&
        Math.abs(item.container.y - z.y) < BIN_H / 2 + 16
      ) return z.id;
    }
    return null;
  }

  // ── feedback ──────────────────────────────────────────────────────────────
  private onCorrect(item: ActiveItem): void {
    item.alive = false;
    this.correct++;
    this.totalSorted++;
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    this.timeLeft = Math.min(this.timeLeft + 1, 99);
    this.refreshTimerText();
    this.scoreTxt.setText(`✓ ${this.correct}  ✗ ${this.wrong}`);
    this.updateComboUI();
    this.checkDifficulty();

    const gain = 5 * this.combo;
    const fx   = this.add.rectangle(item.container.x, item.container.y, ITEM_W + 28, ITEM_H + 28, 0x44ee44, 0.7).setDepth(9);
    this.tweens.add({ targets: fx, alpha: 0, scaleX: 2.4, scaleY: 2.4, duration: 450, onComplete: () => fx.destroy() });
    this.tweens.add({ targets: item.container, alpha: 0, scaleX: 0.3, scaleY: 0.3, duration: 300, onComplete: () => item.container.destroy() });

    const label = this.combo >= 2 ? `+${gain} ×${this.combo}!` : `+${gain}`;
    this.floatText(label, item.container.x, item.container.y - 28, '#66ff44');
  }

  private onWrong(item: ActiveItem): void {
    item.alive = false;
    this.wrong++;
    this.totalSorted++;
    this.combo = 0;
    this.timeLeft = Math.max(0, this.timeLeft - 2);
    this.refreshTimerText();
    this.scoreTxt.setText(`✓ ${this.correct}  ✗ ${this.wrong}`);
    this.updateComboUI();
    this.checkDifficulty();

    this.cameras.main.shake(140, 0.009);

    const fx = this.add.rectangle(item.container.x, item.container.y, ITEM_W + 28, ITEM_H + 28, 0xee4444, 0.7).setDepth(9);
    this.tweens.add({ targets: fx, alpha: 0, duration: 340, onComplete: () => fx.destroy() });
    this.tweens.add({ targets: item.container, alpha: 0, scaleX: 0.3, scaleY: 0.3, duration: 300, onComplete: () => item.container.destroy() });
    this.tweens.add({ targets: this.timerTxt, scaleX: 1.35, scaleY: 1.35, duration: 110, yoyo: true });

    this.floatText('−2s', item.container.x, item.container.y - 28, '#ff5533');

    if (this.timeLeft <= 0) this.endGame();
  }

  private updateComboUI(): void {
    if (this.combo < 2) {
      this.tweens.add({ targets: this.comboTxt, alpha: 0, duration: 220 });
      return;
    }
    const color = this.combo >= 10 ? '#ff6600' : this.combo >= 5 ? '#ffaa00' : '#ffee00';
    this.comboTxt.setText(`COMBO ×${this.combo} 🔥`).setColor(color).setAlpha(1).setScale(1);
    this.tweens.add({
      targets: this.comboTxt, scaleX: 1.45, scaleY: 1.45, duration: 80, ease: 'Back.Out',
      onComplete: () => {
        this.tweens.add({ targets: this.comboTxt, scaleX: 1, scaleY: 1, duration: 130, ease: 'Sine.Out' });
      },
    });
  }

  private checkDifficulty(): void {
    const tier     = Math.floor(this.totalSorted / 5);
    this.fallSpeed = Math.min(BASE_FALL + tier * FALL_STEP, MAX_FALL);
    this.spawnMs   = Math.max(SPAWN_MIN_MS, SPAWN_BASE_MS - tier * SPAWN_STEP_MS);
    for (const a of this.activeItems) {
      if (a.alive && !a.grabbed) a.velY = this.fallSpeed;
    }
  }

  private floatText(txt: string, x: number, y: number, color: string): void {
    const t = this.add.text(x, y, txt, {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold',
      color, stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(12);
    this.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 760, onComplete: () => t.destroy() });
  }

  // ── end game ─────────────────────────────────────────────────────────────
  private endGame(): void {
    if (this.done) return;
    this.done = true;
    this.timerEvent?.remove(false);
    this.dragging = null;

    for (const a of this.activeItems) {
      if (a.alive) a.container.destroy();
    }
    this.activeItems = [];

    const total  = this.correct + this.wrong;
    const acc    = total > 0 ? this.correct / total : 0;

    let rank: 'S' | 'A' | 'B' | 'C';
    let score: number;
    if (this.correct >= 10 && this.maxCombo >= 5) { rank = 'S'; score = 30; }
    else if (acc >= 0.8)                           { rank = 'A'; score = 20; }
    else if (acc >= 0.6)                           { rank = 'B'; score = 10; }
    else                                           { rank = 'C'; score = 5;  }

    this.gs.addScore(score);
    this.gs.set('trashSortScore',   score);
    this.gs.set('trashSortCorrect', this.correct);

    this.showResult(rank, score, acc);
  }

  // ── result screen ─────────────────────────────────────────────────────────
  private showResult(rank: 'S' | 'A' | 'B' | 'C', score: number, acc: number): void {
    const RANK_COLOR: Record<string, string> = {
      S: '#ffe400', A: '#7dff44', B: '#44ccff', C: '#ff8844',
    };
    const RANK_LABEL: Record<string, string> = {
      S: '🌟 XUẤT SẮC!', A: '✓ GIỎI', B: '~ KHÁ', C: 'Cần cố gắng hơn',
    };

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.70).setDepth(20);
    this.add.rectangle(W / 2, H / 2, 500, 270, 0x0d1e06, 0.97)
      .setStrokeStyle(2, 0x5aaa28).setDepth(21);

    // Rank letter
    this.add.text(W / 2 - 185, H / 2 - 38, rank, {
      fontSize: '76px', fontFamily: 'Arial', fontStyle: 'bold',
      color: RANK_COLOR[rank], stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(22);

    // Grade label
    this.add.text(W / 2 + 40, H / 2 - 72, RANK_LABEL[rank], {
      fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold',
      color: RANK_COLOR[rank], stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(22);

    // Stats
    const accPct = Math.round(acc * 100);
    this.add.text(W / 2 + 40, H / 2 - 28, [
      `Đúng: ${this.correct}   Sai: ${this.wrong}   Độ chính xác: ${accPct}%`,
      `Max combo: ×${this.maxCombo}   +${score} điểm`,
    ].join('\n'), {
      fontSize: '14px', fontFamily: 'Arial',
      color: '#ffeebb', stroke: '#000', strokeThickness: 2,
      align: 'center',
    }).setOrigin(0.5).setDepth(22);

    // Rank criteria hint
    this.add.text(W / 2, H / 2 + 42, 'S: ≥10 đúng + combo ≥5   A: ≥80%   B: ≥60%', {
      fontSize: '10px', fontFamily: 'Arial', fontStyle: 'italic',
      color: '#778877', stroke: '#000', strokeThickness: 1,
    }).setOrigin(0.5).setDepth(22);

    // Tip or quote
    const tip = rank === 'C' || rank === 'B'
      ? 'Nhựa, lon sạch → Tái chế  ·  Thức ăn → Hữu cơ  ·  Còn lại → Rác thải'
      : '"Rừng nhớ những ai không để lại dấu vết."';
    this.add.text(W / 2, H / 2 + 70, tip, {
      fontSize: '11px', fontFamily: 'Arial', fontStyle: 'italic',
      color: '#aabbaa', stroke: '#000', strokeThickness: 2,
      wordWrap: { width: 460 }, align: 'center',
    }).setOrigin(0.5).setDepth(22);

    this.add.text(W / 2, H / 2 + 104, '[Nhấn phím bất kỳ để tiếp tục]', {
      fontSize: '11px', fontFamily: 'Arial', color: '#666666',
    }).setOrigin(0.5).setDepth(22);

    const advance = () => {
      this.input.keyboard?.off('keydown', advance);
      this.input.off('pointerdown', advance);
      this.finalize(score);
    };
    this.time.delayedCall(800, () => {
      this.input.keyboard?.once('keydown', advance);
      this.input.once('pointerdown', advance);
    });
  }

  private finalize(score: number): void {
    const ch1 = this.scene.get('Chapter1Scene');
    if (ch1) ch1.events.emit('trash-game-done', score);
    this.scene.stop();
  }
}
