import Phaser from 'phaser';
import { INTERACT_RADIUS } from '../constants';
import { NPC_CHAR_SCALE, CHAR_IMG_SIZE } from '../utils/charSprite';

export interface NPCConfig {
  textureKey: string;
  x: number;
  y: number;
  name: string;
  dialogKey?: string;
  interactRadius?: number;
}

// char-*.png are 3×3 spritesheets (960×960 px per frame). Frame 0 = idle south.
// NPC_CHAR_SCALE = 86/960 ≈ 0.090 → display height ≈ 86 px (matches player scale).
// Sprite uses setOrigin(0.5, 1) so its bottom (feet) sits at the container's (0,0).
// Place the container at y = GROUND_Y so feet land exactly on the ground.
//
// Text offsets (relative to container centre = feet position):
//   displayH = CHAR_IMG_SIZE * NPC_CHAR_SCALE ≈ 86 px
//   name tag  → y = -(displayH + 8)  ≈ -94
//   hint      → y = -(displayH + 22) ≈ -108
//   exclaim   → y = -(displayH + 35) ≈ -121

const DISPLAY_H = Math.round(CHAR_IMG_SIZE * NPC_CHAR_SCALE); // ≈ 101

export class NPC extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Sprite;
  private nameTag: Phaser.GameObjects.Text;
  private hint: Phaser.GameObjects.Text;
  private exclaim: Phaser.GameObjects.Text;
  private _dialogKey: string;
  readonly npcName: string;
  private _radius: number;
  private _done = false;
  private _nearPlayer = false;
  private floatTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, cfg: NPCConfig) {
    super(scene, cfg.x, cfg.y);
    this._dialogKey = cfg.dialogKey ?? '';
    this.npcName = cfg.name;
    this._radius = cfg.interactRadius ?? INTERACT_RADIUS;

    // ── Sprite ─────────────────────────────────────────────────────────────
    const texKey = scene.textures.exists(cfg.textureKey) ? cfg.textureKey : 'char-kbroi';
    this.sprite = scene.add.sprite(0, 0, texKey, 0)
      .setOrigin(0.5, 1)
      .setScale(NPC_CHAR_SCALE);

    // ── Text labels ────────────────────────────────────────────────────────
    this.nameTag = scene.add.text(0, -(DISPLAY_H + 8), cfg.name, {
      fontSize: '11px', color: '#ffeebb',
      stroke: '#000', strokeThickness: 3, fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(6);

    this.hint = scene.add.text(0, -(DISPLAY_H + 22), 'E — Nói chuyện', {
      fontSize: '10px', color: '#fff',
      backgroundColor: '#00000099', padding: { x: 5, y: 2 }, fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(7).setVisible(false);

    this.exclaim = scene.add.text(0, -(DISPLAY_H + 35), '!', {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#ffcc00', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(8);

    scene.add.existing(this);
    this.add([this.sprite, this.nameTag, this.hint, this.exclaim]);

    this.floatTween = scene.tweens.add({
      targets: this.exclaim,
      y: -(DISPLAY_H + 43),
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  checkProximity(px: number, py: number): boolean {
    const dx = px - this.x;
    const dy = py - this.y;
    this._nearPlayer = Math.sqrt(dx * dx + dy * dy) < this._radius;
    this.hint.setVisible(this._nearPlayer && !this._done);
    this.exclaim.setVisible(!this._done);
    return this._nearPlayer;
  }

  get isNear(): boolean { return this._nearPlayer; }
  get dialogKey(): string { return this._dialogKey; }
  get isDone(): boolean { return this._done; }

  hide(): void {
    this.setVisible(false);
  }

  show(x?: number, y?: number): void {
    if (x !== undefined) this.x = x;
    if (y !== undefined) this.y = y;
    this.setVisible(true);
  }

  setDialogKey(key: string): void {
    this._dialogKey = key;
    this._done = false;
    this.exclaim.setVisible(true);
  }

  markDone(): void {
    this._done = true;
    this.exclaim.setVisible(false);
    this.hint.setVisible(false);
    this.floatTween?.stop();
  }

  /** Walk horizontally to a target x via tween, then stop. */
  walkTo(targetX: number, speed = 60, onArrive?: () => void): void {
    const dx = targetX - this.x;
    if (Math.abs(dx) < 1) { onArrive?.(); return; }
    const goingRight = dx > 0;
    const duration = Math.abs(dx) / speed * 600;
    this.scene.tweens.add({
      targets: this,
      x: targetX,
      duration,
      ease: 'Linear',
      onComplete: () => {
        this.sprite.setFlipX(goingRight);
        onArrive?.();
      },
    });
  }

  /** Gentle idle sway */
  startIdleAnim(): void {
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.sprite.scaleX * 0.97,
      duration: 1200 + Math.random() * 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
