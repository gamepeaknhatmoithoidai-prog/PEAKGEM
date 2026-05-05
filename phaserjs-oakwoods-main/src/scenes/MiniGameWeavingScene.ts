import Phaser from 'phaser';

export class MiniGameWeavingScene extends Phaser.Scene {

  // ── STATE ──
  private currentRow: number = 0;
  private totalRows: number = 4;
  private qualityTotal: number = 0;
  private qualitySamples: number = 0;
  private isWeaving: boolean = false;
  private drawnPoints: Array<{x:number; y:number; quality:number; progress:number}> = [];
  private paths: Array<Array<{x:number; y:number}>> = [];
  private ended: boolean = false;
  private rowCompleting: boolean = false;

  // ── GRAPHICS ──
  private pathGraphics!: Phaser.GameObjects.Graphics;
  private threadGraphics!: Phaser.GameObjects.Graphics;
  private completedSnapshots: Phaser.GameObjects.Graphics[] = [];
  private startMarker!: Phaser.GameObjects.Arc;

  // ── HUD ──
  private scoreText!: Phaser.GameObjects.Text;
  private rowText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;
  private qualityBarFill!: Phaser.GameObjects.Rectangle;

  // ── INPUT TRACKING ──
  private lastPointerX: number = 0;
  private lastPointerY: number = 0;
  private lastPointerTime: number = 0;

  // ── TIMER ──
  private gameTimer!: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'MiniGameWeavingScene', active: false });
  }

  init(): void {
    this.currentRow     = 0;
    this.qualityTotal   = 0;
    this.qualitySamples = 0;
    this.isWeaving      = false;
    this.drawnPoints    = [];
    this.paths          = [];
    this.ended          = false;
    this.rowCompleting  = false;
    this.completedSnapshots = [];
  }

  // ════════════════════════════════════════════════
  // PRELOAD
  // ════════════════════════════════════════════════
  preload() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('weave-particle', 8, 8);
    g.destroy();
  }

  // ════════════════════════════════════════════════
  // CREATE
  // ════════════════════════════════════════════════
  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;

    this.drawLoomBackground(W, H);

    const loomLeft  = W * 0.12;
    const loomRight = W * 0.88;
    const firstRowY = H * 0.38;
    const rowGap    = 44;

    for (let r = 0; r < this.totalRows; r++) {
      this.paths.push(
        this.generatePath(loomLeft, firstRowY + r * rowGap, loomRight, r)
      );
    }

    this.pathGraphics   = this.add.graphics().setDepth(3);
    this.threadGraphics = this.add.graphics().setDepth(4);
    this.drawGuidePaths();

    const start = this.paths[0][0];
    this.startMarker = this.add.circle(start.x, start.y, 9, 0xFFD700).setDepth(5);
    this.tweens.add({
      targets: this.startMarker,
      scaleX: 1.6, scaleY: 1.6,
      duration: 550, yoyo: true, repeat: -1,
    });

    this.createHUD(W, H);

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup',   this.onPointerUp,   this);

    this.gameTimer = this.time.delayedCall(90000, () => this.endGame(), [], this);
  }

  // ════════════════════════════════════════════════
  // BACKGROUND KHUNG DỆT
  // ════════════════════════════════════════════════
  private drawLoomBackground(W: number, H: number): void {
    const g = this.add.graphics().setDepth(0);

    g.fillStyle(0x1a0e05, 1);
    g.fillRect(0, 0, W, H);

    const fx = W*0.07, fy = H*0.20, fw = W*0.86, fh = H*0.62;
    g.fillStyle(0x3D2410, 1);
    g.fillRoundedRect(fx, fy, fw, fh, 10);

    const ix = W*0.11, iy = H*0.24, iw = W*0.78, ih = H*0.54;
    g.fillStyle(0x5C3318, 1);
    g.fillRect(ix, iy, iw, ih);

    g.lineStyle(1, 0x7A5230, 0.25);
    for (let x = ix; x < ix + iw; x += 11) {
      g.lineBetween(x, iy, x, iy + ih);
    }

    g.fillStyle(0x8B2500, 0.55);
    g.fillRect(ix, iy, iw, H * 0.11);

    g.fillStyle(0xFFD700, 0.75);
    for (let x = ix + 20; x < ix + iw - 10; x += 38) {
      const py = iy + H * 0.055;
      const s  = 7;
      g.fillTriangle(x, py - s, x + s, py, x, py + s);
      g.fillTriangle(x, py - s, x - s, py, x, py + s);
    }

    g.fillStyle(0x2A1508, 1);
    g.fillRect(fx, fy,       fw, 14);
    g.fillRect(fx, fy+fh-14, fw, 14);
    g.fillRect(fx,       fy, 14, fh);
    g.fillRect(fx+fw-14, fy, 14, fh);
  }

  // ════════════════════════════════════════════════
  // GENERATE PATH (sine wave)
  // ════════════════════════════════════════════════
  private generatePath(
    startX: number, y: number, endX: number, rowIndex: number
  ): Array<{x:number; y:number}> {
    const points: {x:number; y:number}[] = [];
    const segments  = 30;
    const amplitude = 14 + (rowIndex % 2) * 6;
    const frequency = 2.5 + rowIndex * 0.3;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      points.push({
        x: startX + t * (endX - startX),
        y: y + Math.sin(t * Math.PI * 2 * frequency) * amplitude,
      });
    }
    return points;
  }

  // ════════════════════════════════════════════════
  // VẼ ĐƯỜNG DẪN MỜ
  // ════════════════════════════════════════════════
  private drawGuidePaths(): void {
    this.pathGraphics.clear();

    this.paths.forEach((path, r) => {
      if (r < this.currentRow) return;

      const isActive = r === this.currentRow;
      const color    = isActive ? 0xFFD700 : 0x887755;
      const alpha    = isActive ? 0.45     : 0.18;

      this.pathGraphics.lineStyle(2, color, alpha);
      this.pathGraphics.beginPath();
      this.pathGraphics.moveTo(path[0].x, path[0].y);
      path.slice(1).forEach(p => this.pathGraphics.lineTo(p.x, p.y));
      this.pathGraphics.strokePath();

      if (isActive) {
        this.pathGraphics.fillStyle(0xFFD700, 0.85);
        this.pathGraphics.fillCircle(path[0].x, path[0].y, 5);
      }
    });
  }

  // ════════════════════════════════════════════════
  // HUD
  // ════════════════════════════════════════════════
  private createHUD(W: number, H: number): void {
    this.add.text(W/2, 14, '🧵 PHỤ DỆT THỔ CẨM', {
      fontSize: '16px', color: '#FFD700', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(10);

    this.scoreText = this.add.text(W - 16, 14, '★ 0', {
      fontSize: '16px', color: '#FFD700', stroke: '#000', strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(10);

    this.rowText = this.add.text(16, 14, `Hàng 1 / ${this.totalRows}`, {
      fontSize: '14px', color: '#FFE4B5', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0, 0).setDepth(10);

    this.add.text(W/2, H - 46, 'Chất lượng chỉ:', {
      fontSize: '12px', color: '#CCC',
    }).setOrigin(0.5, 1).setDepth(10);

    const barW = 200, barH = 10;
    this.add.rectangle(W/2, H - 30, barW, barH, 0x333333).setDepth(10);
    this.qualityBarFill = this.add.rectangle(W/2 - barW/2, H - 30, 0, barH, 0xCC2200)
      .setOrigin(0, 0.5).setDepth(11);

    this.hintText = this.add.text(W/2, H - 14,
      '💡 Giữ chuột và rê theo đường vàng — đều tay, đừng vội', {
        fontSize: '12px', color: '#EEE', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5, 1).setDepth(10);

    this.feedbackText = this.add.text(0, 0, '', {
      fontSize: '12px', color: '#FFF',
      backgroundColor: '#00000088',
      padding: { x: 4, y: 2 },
    }).setDepth(20).setVisible(false);
  }

  // ════════════════════════════════════════════════
  // POINTER EVENTS
  // ════════════════════════════════════════════════
  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    const start = this.paths[this.currentRow][0];
    const distToStart = Phaser.Math.Distance.Between(
      pointer.x, pointer.y, start.x, start.y
    );
    if (distToStart > 32) return;

    this.isWeaving       = true;
    this.drawnPoints     = [{ x: start.x, y: start.y, quality: 1, progress: 0 }];
    this.lastPointerX    = pointer.x;
    this.lastPointerY    = pointer.y;
    this.lastPointerTime = this.time.now;
    this.startMarker.setVisible(false);
    this.hintText.setText('🧵 Rê đều tay theo đường vàng...');
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isWeaving) return;

    const now = this.time.now;
    const dt  = now - this.lastPointerTime;
    if (dt < 14) return;

    const pixelsMoved = Phaser.Math.Distance.Between(
      pointer.x, pointer.y, this.lastPointerX, this.lastPointerY
    );
    const speed = pixelsMoved / Math.max(dt / 16, 0.1);

    const { dist: deviation, progress } = this.getClosestOnPath(
      pointer.x, pointer.y, this.paths[this.currentRow]
    );

    let quality = 1.0;
    if (deviation > 35)      quality -= 0.70;
    else if (deviation > 15) quality -= (deviation - 15) / 20 * 0.50;
    if (speed > 12)          quality -= 0.60;
    else if (speed > 6)      quality -= (speed - 6) / 6 * 0.40;
    quality = Phaser.Math.Clamp(quality, 0, 1);

    const lastProgress = this.drawnPoints.length > 0
      ? this.drawnPoints[this.drawnPoints.length - 1].progress
      : 0;

    if (progress >= lastProgress - 0.015) {
      this.drawnPoints.push({ x: pointer.x, y: pointer.y, quality, progress });
      this.qualityTotal   += quality;
      this.qualitySamples++;
      this.updateQualityBar();
    }

    this.redrawThread();
    this.showRealtimeFeedback(pointer.x, pointer.y, speed, deviation);

    if (progress >= 0.96) this.completeCurrentRow();

    this.lastPointerX    = pointer.x;
    this.lastPointerY    = pointer.y;
    this.lastPointerTime = now;
  }

  private onPointerUp(_pointer: Phaser.Input.Pointer): void {
    if (!this.isWeaving) return;
    this.isWeaving = false;

    const last = this.drawnPoints[this.drawnPoints.length - 1];
    if (!last || last.progress < 0.94) {
      this.hintText.setText('✂️ Chỉ đứt! Bắt đầu lại hàng này...');
      this.feedbackText.setVisible(false);
      this.time.delayedCall(1100, () => this.resetCurrentRow());
    }
  }

  // ════════════════════════════════════════════════
  // CLOSEST POINT ON PATH
  // ════════════════════════════════════════════════
  private getClosestOnPath(
    mx: number, my: number, path: {x:number; y:number}[]
  ): { dist: number; progress: number } {
    let minDist    = Infinity;
    let closestIdx = 0;

    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], b = path[i+1];
      const dx = b.x - a.x, dy = b.y - a.y;
      const lenSq = dx*dx + dy*dy;
      let t = lenSq > 0 ? ((mx-a.x)*dx + (my-a.y)*dy) / lenSq : 0;
      t = Phaser.Math.Clamp(t, 0, 1);
      const px = a.x + t*dx, py = a.y + t*dy;
      const dist = Phaser.Math.Distance.Between(mx, my, px, py);
      if (dist < minDist) { minDist = dist; closestIdx = i + t; }
    }
    return { dist: minDist, progress: closestIdx / (path.length - 1) };
  }

  // ════════════════════════════════════════════════
  // VẼ ĐƯỜNG CHỈ MÀU THEO QUALITY
  // ════════════════════════════════════════════════
  private redrawThread(): void {
    this.threadGraphics.clear();
    if (this.drawnPoints.length < 2) return;

    for (let i = 1; i < this.drawnPoints.length; i++) {
      const a = this.drawnPoints[i-1];
      const b = this.drawnPoints[i];
      const q = (a.quality + b.quality) / 2;
      this.threadGraphics.lineStyle(1.5 + q * 2.5, this.qualityToColor(q), 0.92);
      this.threadGraphics.lineBetween(a.x, a.y, b.x, b.y);
    }

    const last = this.drawnPoints[this.drawnPoints.length - 1];
    if (last) {
      this.threadGraphics.fillStyle(this.qualityToColor(last.quality), 1);
      this.threadGraphics.fillCircle(last.x, last.y, 3.5);
    }
  }

  // quality 0→1 : xám → vàng → đỏ thổ cẩm
  private qualityToColor(q: number): number {
    if (q >= 0.5) {
      const t = (q - 0.5) * 2;
      const r  = 0xCC;
      const g2 = Math.floor(0xAA * (1 - t));
      return (r << 16) | (g2 << 8);
    } else {
      const t  = q * 2;
      const r  = Math.floor(0x55 + t * (0xCC - 0x55));
      const g2 = Math.floor(0x55 + t * (0xAA - 0x55));
      return (r << 16) | (g2 << 8);
    }
  }

  // ════════════════════════════════════════════════
  // FEEDBACK + QUALITY BAR
  // ════════════════════════════════════════════════
  private showRealtimeFeedback(x: number, y: number, speed: number, deviation: number): void {
    let msg = '', color = '#FFFFFF';

    if (speed > 11)         { msg = '⚡ Quá nhanh!';  color = '#FF4444'; }
    else if (speed > 6)     { msg = '↗ Nhanh quá';    color = '#FF8800'; }
    else if (deviation > 30){ msg = '↙ Lệch nhiều!';  color = '#FF6600'; }
    else if (deviation > 15){ msg = '~ Hơi lệch';     color = '#FFCC00'; }
    else                    { msg = '✓';               color = '#44FF88'; }

    this.feedbackText
      .setText(msg)
      .setStyle({ color })
      .setPosition(x + 18, y - 22)
      .setVisible(true);
  }

  private updateQualityBar(): void {
    const avg = this.qualitySamples > 0
      ? this.qualityTotal / this.qualitySamples : 0;
    const barMaxW = 200;
    this.qualityBarFill.setDisplaySize(avg * barMaxW, 10);
    const color = avg > 0.7 ? 0x44CC44 : avg > 0.4 ? 0xCCAA00 : 0xCC2200;
    this.qualityBarFill.setFillStyle(color);
    this.scoreText.setText(`★ ${Math.round(avg * 20)}`);
  }

  // ════════════════════════════════════════════════
  // HOÀN THÀNH / RESET HÀNG
  // ════════════════════════════════════════════════
  private completeCurrentRow(): void {
    if (this.rowCompleting) return;
    this.rowCompleting = true;
    this.isWeaving     = false;
    this.feedbackText.setVisible(false);

    const snap = this.add.graphics().setDepth(4);
    for (let i = 1; i < this.drawnPoints.length; i++) {
      const a = this.drawnPoints[i-1];
      const b = this.drawnPoints[i];
      const q = (a.quality + b.quality) / 2;
      snap.lineStyle(1.5 + q*2.5, this.qualityToColor(q), 0.9);
      snap.lineBetween(a.x, a.y, b.x, b.y);
    }
    this.completedSnapshots.push(snap);

    this.cameras.main.flash(180, 255, 220, 150);

    this.currentRow++;
    this.drawnPoints   = [];
    this.rowCompleting = false;
    this.threadGraphics.clear();

    if (this.currentRow >= this.totalRows) {
      this.time.delayedCall(350, () => this.endGame());
    } else {
      this.rowText.setText(`Hàng ${this.currentRow + 1} / ${this.totalRows}`);
      this.drawGuidePaths();

      const newStart = this.paths[this.currentRow][0];
      this.startMarker.setPosition(newStart.x, newStart.y).setVisible(true);
      this.hintText.setText('💡 Bắt đầu từ điểm vàng...');
    }
  }

  private resetCurrentRow(): void {
    this.drawnPoints = [];
    this.threadGraphics.clear();
    const start = this.paths[this.currentRow][0];
    this.startMarker.setPosition(start.x, start.y).setVisible(true);
    this.hintText.setText('💡 Rê chuột theo đường vàng — đều tay, đừng vội');
  }

  // ════════════════════════════════════════════════
  // KẾT THÚC GAME
  // ════════════════════════════════════════════════
  private endGame(): void {
    if (this.ended) return;
    this.ended = true;
    this.gameTimer.remove(false);
    this.feedbackText.setVisible(false);

    const avgQuality = this.qualitySamples > 0
      ? this.qualityTotal / this.qualitySamples : 0;
    const rows = this.currentRow;

    let points: number, result: string;
    if      (rows >= 4 && avgQuality >= 0.75) { points = 20; result = 'perfect'; }
    else if (rows >= 4 && avgQuality >= 0.45) { points = 14; result = 'good';    }
    else if (rows >= 3)                        { points = 10; result = 'ok';      }
    else if (rows >= 2)                        { points = 6;  result = 'partial'; }
    else                                       { points = 3;  result = 'poor';    }

    const prev = (this.registry.get('totalScore') as number) || 0;
    this.registry.set('totalScore',     prev + points);
    this.registry.set('weavingResult',  result);
    this.registry.set('weavingQuality', Math.round(avgQuality * 100));

    this.showEndScreen(points, result, rows, Math.round(avgQuality * 100));
  }

  private showEndScreen(points: number, result: string, rows: number, qualityPct: number): void {
    const W = this.scale.width, H = this.scale.height;

    this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.72).setDepth(30);

    const messages: Record<string, string> = {
      perfect: `🎨 Tuyệt vời!\n${rows}/4 hàng  ·  Chất lượng ${qualityPct}%\n+${points} điểm`,
      good:    `🧵 Khá đấy!\n${rows}/4 hàng  ·  Chất lượng ${qualityPct}%\n+${points} điểm`,
      ok:      `🧵 Được rồi\n${rows}/4 hàng  ·  Chất lượng ${qualityPct}%\n+${points} điểm`,
      partial: `💪 Cần luyện thêm\n${rows}/4 hàng\n+${points} điểm`,
      poor:    `😮 Khó thật!\n${rows}/4 hàng\n+${points} điểm`,
    };

    this.add.text(W/2, H/2 - 20, messages[result] ?? messages['ok'], {
      fontSize: '22px', color: '#FFD700',
      align: 'center', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(31);

    this.time.delayedCall(2200, () => {
      const ch1 = this.scene.get('Chapter1Scene');
      if (ch1) ch1.events.emit('weaving-game-done', { result, quality: qualityPct });
      this.scene.stop();
    });
  }
}
