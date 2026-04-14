import Phaser from 'phaser';
import { INTERACT_RADIUS } from '../constants';

export interface NPCConfig {
  textureKey: string;
  x: number;
  y: number;
  name: string;
  dialogKey: string;
  interactRadius?: number;
  scale?: number;
}

// NPC container is centred on the sprite's mid-point.
// At scale 0.18 and 576×576 frames (npc-kbroi):
//   sprite half-height = 576*0.18/2 = 51.8 px
//   character feet ≈ frame y=540 → world offset = (540-288)*0.18 = +45.4 px below center
//   character head ≈ frame y=50  → world offset = (50-288)*0.18  = -42.8 px above center
// Place the container so feet land at GROUND_Y:  y = GROUND_Y - 45
//
// Text offsets below are measured from the container centre (y=0).

export class NPC extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Sprite;
  private nameTag: Phaser.GameObjects.Text;
  private hint: Phaser.GameObjects.Text;
  private exclaim: Phaser.GameObjects.Text;   // '!' text (no external asset needed)
  private _dialogKey: string;
  readonly npcName: string;
  private _radius: number;
  private _done = false;
  private _nearPlayer = false;
  private floatTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, cfg: NPCConfig) {
    super(scene, cfg.x, cfg.y);
    this._dialogKey = cfg.dialogKey;
    this.npcName = cfg.name;
    this._radius = cfg.interactRadius ?? INTERACT_RADIUS;

    const scale = cfg.scale ?? 0.15;

    // ── Sprite ─────────────────────────────────────────────────────────────
    // Use Sprite (not Image) so Phaser can play frame-based animations.
    // Fall back to npc-kbroi when the requested texture isn't loaded.
    const texKey = scene.textures.exists(cfg.textureKey) ? cfg.textureKey : 'npc-kbroi';
    // Frame 0 = front/idle pose for every NPC spritesheet
    this.sprite = scene.add.sprite(0, 0, texKey, 0).setScale(scale);
    // Remove white JPG background via post-FX pipeline
    try { this.sprite.setPostPipeline('WhiteKey'); } catch (_) {}
    // Play idle animation if one was registered in BootScene
    const idleKey = `${texKey}-idle`;
    if (scene.anims.exists(idleKey)) {
      this.sprite.play(idleKey);
    }

    // ── Text labels ────────────────────────────────────────────────────────
    // Positions are relative to the container centre.
    // At scale 0.4 the character head is ≈ 45 px above centre → labels at -55 .. -80
    this.nameTag = scene.add.text(0, -55, cfg.name, {
      fontSize: '11px', color: '#ffeebb',
      stroke: '#000', strokeThickness: 3, fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(6);

    this.hint = scene.add.text(0, -69, 'E — Nói chuyện', {
      fontSize: '10px', color: '#fff',
      backgroundColor: '#00000099', padding: { x: 5, y: 2 }, fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(7).setVisible(false);

    // '!' quest marker — implemented as Text so no external image is needed
    this.exclaim = scene.add.text(0, -81, '!', {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#ffcc00', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(8);

    scene.add.existing(this);
    this.add([this.sprite, this.nameTag, this.hint, this.exclaim]);

    // Float animation on the '!' marker
    this.floatTween = scene.tweens.add({
      targets: this.exclaim,
      y: -88,
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
