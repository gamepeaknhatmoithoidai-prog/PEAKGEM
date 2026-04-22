/**
 * MiniGameFlashlight — Soi Đèn Pin (Overlay mini-game)
 *
 * Launched from C2Scene6.  Player moves the flashlight (mouse/pointer) to
 * find 5 hidden objects in the dark forest.  Battery drains over 40 s.
 * +10 per object found.  Emits 'minigame-done' { score } then stops.
 */
import Phaser from 'phaser';
import { W, H } from '../constants';

const BATTERY_DURATION = 40000;  // ms
const BEAM_RADIUS      = 110;

interface HiddenObject {
  id: number;
  x: number;
  y: number;
  label: string;
  icon: string;
  found: boolean;
  gfx: Phaser.GameObjects.Container;
}

export class MiniGameFlashlight extends Phaser.Scene {
  private sourceScene = '';
  private objects: HiddenObject[] = [];
  private batteryElapsed = 0;
  private totalFound     = 0;
  private done           = false;

  private darkOverlay!: Phaser.GameObjects.Graphics;
  private beamGfx!: Phaser.GameObjects.Graphics;
  private batteryBar!: Phaser.GameObjects.Graphics;
  private foundText!: Phaser.GameObjects.Text;

  constructor() { super({ key: 'MiniGameFlashlight', active: false }); }

  init(data: { sourceScene: string }): void {
    this.sourceScene    = data.sourceScene || '';
    this.batteryElapsed = 0;
    this.totalFound     = 0;
    this.done           = false;
    this.objects        = [];
  }

  create(): void {
    // Night forest background
    const bg = this.add.graphics().setDepth(0);
    bg.fillStyle(0x020810);
    bg.fillRect(0, 0, W, H);
    // Faint tree silhouettes
    bg.fillStyle(0x050d03);
    for (let x = 0; x < W; x += 70) {
      const h = 120 + (x % 80);
      bg.fillRect(x + 28, H - h, 14, h);
      bg.fillEllipse(x + 35, H - h, 55, 60);
    }

    // Title overlay text
    this.add.text(W / 2, 22, '🔦  Soi đèn pin — tìm bằng chứng trong rừng đêm', {
      fontSize: '13px', fontFamily: 'Arial', color: '#ccddff',
      stroke: '#000000', strokeThickness: 2,
      backgroundColor: '#00000099', padding: { x: 8, y: 4 },
    }).setOrigin(0.5, 0).setDepth(10);

    // Hidden objects data
    const defs = [
      { id: 0, x: 180, y: 320, label: 'Cọc đo đạc',       icon: '🔴' },
      { id: 1, x: 480, y: 260, label: 'Dấu sơn đỏ trên cây', icon: '🎨' },
      { id: 2, x: 640, y: 370, label: 'Dấu giày trên bùn', icon: '👟' },
      { id: 3, x: 140, y: 390, label: 'Phong bì tiền',     icon: '💰' },
      { id: 4, x: 750, y: 300, label: 'Thẻ kiểm lâm',      icon: '🪪' },
    ];

    for (const d of defs) {
      const container = this.add.container(d.x, d.y).setDepth(3).setAlpha(0);

      const gfx = this.add.graphics();
      gfx.fillStyle(0x334411, 0.9);
      gfx.fillRoundedRect(-36, -20, 72, 40, 6);
      gfx.lineStyle(2, 0x88ff44, 0.7);
      gfx.strokeRoundedRect(-36, -20, 72, 40, 6);
      container.add(gfx);

      const icon = this.add.text(0, -6, d.icon, { fontSize: '20px' }).setOrigin(0.5);
      const lbl  = this.add.text(0, 12, d.label, {
        fontSize: '9px', fontFamily: 'Arial', color: '#ddffaa',
      }).setOrigin(0.5);
      container.add([icon, lbl]);

      const obj: HiddenObject = { ...d, found: false, gfx: container };
      this.objects.push(obj);
    }

    // Global click: only collect objects that are currently illuminated
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (this.done) return;
      for (const obj of this.objects) {
        if (obj.found) continue;
        const distToPtr  = Phaser.Math.Distance.Between(ptr.x, ptr.y, obj.x, obj.y);
        const effectiveR = BEAM_RADIUS * (1 - this.batteryElapsed / BATTERY_DURATION);
        const objInBeam  = Phaser.Math.Distance.Between(ptr.x, ptr.y, obj.x, obj.y) < effectiveR;
        if (distToPtr < 44 && objInBeam) {
          this.collectObject(obj);
          break;
        }
      }
    });

    // Dark overlay on top of objects (punched by beam in update)
    this.darkOverlay = this.add.graphics().setDepth(5);

    // Beam glow layer
    this.beamGfx = this.add.graphics().setDepth(6);

    // Battery bar
    this.add.rectangle(W - 90, 14, 80, 10, 0x333333).setDepth(10).setOrigin(0, 0);
    this.batteryBar = this.add.graphics().setDepth(11);
    this.add.text(W - 90, 10, '🔋', { fontSize: '10px' }).setDepth(10).setOrigin(0, 0);

    this.foundText = this.add.text(W / 2, H - 22, '0 / 5 bằng chứng tìm thấy', {
      fontSize: '13px', fontFamily: 'Arial', color: '#f5c518',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(10);

    // Skip button after 5 s
    const skipBtn = this.add.text(W - 16, H - 16, '[ Bỏ qua ]', {
      fontSize: '12px', fontFamily: 'Arial', color: '#aaaaaa',
      backgroundColor: '#00000066', padding: { x: 6, y: 3 },
    }).setOrigin(1, 1).setDepth(10).setAlpha(0).setInteractive();
    skipBtn.on('pointerdown', () => this.finish());
    this.time.delayedCall(5000, () => {
      this.tweens.add({ targets: skipBtn, alpha: 1, duration: 400 });
    });
  }

  update(_t: number, delta: number): void {
    if (this.done) return;

    this.batteryElapsed += delta;
    if (this.batteryElapsed >= BATTERY_DURATION) {
      this.finish();
      return;
    }

    const ptr    = this.input.activePointer;
    const px     = ptr.x;
    const py     = ptr.y;
    const charge = 1 - this.batteryElapsed / BATTERY_DURATION;

    // Update battery bar
    this.batteryBar.clear();
    const bCol = charge > 0.5 ? 0x44ff44 : charge > 0.25 ? 0xffcc00 : 0xff4400;
    this.batteryBar.fillStyle(bCol);
    this.batteryBar.fillRect(W - 90, 14, 80 * charge, 10);

    // Draw dark overlay with soft light circle
    this.darkOverlay.clear();
    this.darkOverlay.fillStyle(0x000814, 0.92);
    this.darkOverlay.fillRect(0, 0, W, H);

    // Reveal objects near beam
    for (const obj of this.objects) {
      if (obj.found) continue;
      const dist = Phaser.Math.Distance.Between(px, py, obj.x, obj.y);
      obj.gfx.setAlpha(dist < BEAM_RADIUS ? 1 : 0);
    }

    // Draw beam glow
    this.beamGfx.clear();
    const effectiveRadius = BEAM_RADIUS * charge;
    for (let r = effectiveRadius; r > 0; r -= 15) {
      const a = (1 - r / effectiveRadius) * 0.10;
      this.beamGfx.fillStyle(0xfff8e0, a);
      this.beamGfx.fillCircle(px, py, r);
    }
    this.beamGfx.fillStyle(0xfff8e0, 0.08);
    this.beamGfx.fillCircle(px, py, effectiveRadius);
  }

  private collectObject(obj: HiddenObject): void {
    if (obj.found || this.done) return;
    obj.found = true;
    this.totalFound++;
    obj.gfx.setAlpha(0.4);

    // Checkmark flash
    const flash = this.add.text(obj.x, obj.y - 28, '✓ +10', {
      fontSize: '16px', fontFamily: 'Arial', color: '#88ff44',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(8);
    this.tweens.add({
      targets: flash, y: obj.y - 58, alpha: 0, duration: 1000,
      onComplete: () => flash.destroy(),
    });

    this.foundText.setText(`${this.totalFound} / 5 bằng chứng tìm thấy`);
    if (this.totalFound >= this.objects.length) this.finish();
  }

  private finish(): void {
    if (this.done) return;
    this.done = true;
    const score = this.totalFound * 10;
    const src   = this.scene.get(this.sourceScene);
    src?.events.emit('minigame-done', { score, type: 'flashlight', found: this.totalFound });
    this.time.delayedCall(300, () => this.scene.stop());
  }

  shutdown(): void { /* cleanup handled by Phaser */ }
}
