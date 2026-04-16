/**
 * C2Scene3Photo — Chapter 2, Scene 3: Game 3 (Chụp Ảnh Bằng Chứng)
 *
 * Flow: Intro Dialogue → Gameplay → Post-Game Dialogue → C2S4Stealth
 *
 * Evidence objects (Scene 3-specific, different from Scene 1):
 *   stuff-oil    → Vết dầu tràn
 *   stuff-tracks → Dấu bánh xe cơ giới
 *   stuff-map    → Bản đồ in bị rơi
 *   stuff-idcard → Thẻ công nhân bị rơi
 *   stuff-saw    → Lưỡi cưa bị vứt lại
 *
 * Mechanic: Walk near object → press C to photograph.
 *
 * Scoring:
 *   5/5 photos → +25 pts
 *   3-4/5      → +10 pts
 *   0-2/5      → +0 pts
 */
import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { Player } from '../entities/Player';
import { W, H, DEPTH_BG, DEPTH_WORLD, DEPTH_UI } from '../constants';

// ── Layout ────────────────────────────────────────────────────────────────────
const GROUND_Y  = 420;
const FLOOR_H   = 120;
const MAP_W     = 2800;
const PHOTO_R   = 90;    // proximity radius to photograph (px)

// ── Evidence target definitions (Scene 3 — new objects, NOT Scene 1 objects) ──
interface PhotoTargetDef {
  id:         string;
  textureKey: string;
  label:      string;
  x:          number;
  scale:      number;
}

const TARGETS: PhotoTargetDef[] = [
  { id: 'oil',    textureKey: 'stuff-oil',    label: 'Vết dầu tràn',          x:  420, scale: 0.20 },
  { id: 'tracks', textureKey: 'stuff-tracks', label: 'Dấu bánh xe cơ giới',   x:  900, scale: 0.20 },
  { id: 'map',    textureKey: 'stuff-map',    label: 'Bản đồ in bị rơi',      x: 1420, scale: 0.20 },
  { id: 'idcard', textureKey: 'stuff-idcard', label: 'Thẻ công nhân bị rơi',  x: 1960, scale: 0.20 },
  { id: 'saw',    textureKey: 'stuff-saw',    label: 'Lưỡi cưa bị vứt lại',   x: 2480, scale: 0.20 },
];

interface PhotoInstance extends PhotoTargetDef {
  captured:  boolean;
  sprite:    Phaser.GameObjects.Image;
  ring:      Phaser.GameObjects.Graphics;
  camIcon:   Phaser.GameObjects.Text;
  checkText: Phaser.GameObjects.Text | null;
}

type Phase = 'intro' | 'gameplay' | 'postgame' | 'done';

export class C2Scene3Photo extends Phaser.Scene {
  private gs!: GS;
  private player!: Player;
  private colliders!: Phaser.Physics.Arcade.StaticGroup;
  private targets: PhotoInstance[] = [];
  private playerBody!: Phaser.Physics.Arcade.Body;
  private jumpKey!: Phaser.Input.Keyboard.Key;
  private canJump = true;

  // UI
  private hintText!:       Phaser.GameObjects.Text;
  private photoCountText!: Phaser.GameObjects.Text;
  private checkRows:       Phaser.GameObjects.Text[] = [];

  // State
  private phase: Phase = 'intro';
  private photoCount = 0;
  private transitionStarted = false;

  // Camera shutter VFX
  private shutterOverlay!: Phaser.GameObjects.Rectangle;

  constructor() { super('C2S3Photo'); }

  // ═══════════════════════════════════════════════════════════════════
  //  CREATE
  // ═══════════════════════════════════════════════════════════════════
  create(): void {
    this.gs = new GS(this.registry);
    this.phase = 'intro';
    this.photoCount = 0;
    this.transitionStarted = false;
    this.targets = [];
    this.checkRows = [];

    this.physics.world.gravity.y = 800;
    this.physics.world.setBounds(0, 0, MAP_W, H);

    this.buildBackground();
    this.buildGround();
    this.buildTargets();
    this.buildEndMarker();

    const gender = this.gs.get('gender') || 'male';
    this.player = new Player(this, 80, GROUND_Y - 60, gender);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(true);
    this.playerBody.setMaxVelocityY(900);

    this.jumpKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.cameras.main.setBounds(0, 0, MAP_W, H);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.fadeIn(700);

    this.physics.add.collider(this.player, this.colliders, () => { this.canJump = true; });

    this.buildPhotoUI();
    this.buildHintText();
    this.buildSceneTitle();
    this.buildShutterOverlay();

    this.events.on('dialog-done', this.onDialogDone, this);
    this.time.delayedCall(400, () => this.launchDialog('c2s3-intro'));

    try { this.sound.play('forest-ambient', { loop: true, volume: 0.11 }); } catch (_) {}
  }

  // ── Helpers ──────────────────────────────────────────────────────────
  private launchDialog(key: string): void {
    this.player.freeze();
    this.scene.launch('DialogScene', { dialogKey: key, sourceScene: 'C2S3Photo' });
    this.scene.pause();
  }

  private onDialogDone(_result: unknown): void {
    this.scene.resume();
    this.player.unfreeze();
    if (this.phase === 'intro') {
      this.phase = 'gameplay';
      this.game.events.emit('notify', 'Đến gần đối tượng và nhấn C để chụp ảnh bằng chứng', '#88ccff');
    } else if (this.phase === 'postgame') {
      this.phase = 'done';
      this.goToScene4();
    }
  }

  // ── Background ──────────────────────────────────────────────────────
  private buildBackground(): void {
    if (this.textures.exists('bg-c2-real')) {
      const s = H / 414;
      this.add.tileSprite(MAP_W / 2, H / 2, MAP_W, H, 'bg-c2-real')
        .setDepth(DEPTH_BG).setTileScale(s, s);
    } else if (this.textures.exists('bg-ch2')) {
      const s = H / 414;
      this.add.tileSprite(MAP_W / 2, H / 2, MAP_W, H, 'bg-ch2')
        .setDepth(DEPTH_BG).setTileScale(s, s);
    } else {
      const bg = this.add.graphics().setDepth(DEPTH_BG);
      bg.fillStyle(0x020407); bg.fillRect(0, 0, MAP_W, H);
      bg.fillStyle(0x050d03);
      for (let x = 0; x < MAP_W; x += 75) {
        const ch = 110 + (x % 90);
        bg.fillCircle(x + 38, GROUND_Y - ch, 34 + (x % 22));
        bg.fillRect(x + 32, GROUND_Y - 52, 12, 52);
      }
    }
    // Night activity tint
    const dangerG = this.add.graphics().setDepth(DEPTH_BG + 0.4);
    dangerG.fillStyle(0x0a0020, 0.22);
    dangerG.fillRect(0, 0, MAP_W, H);
  }

  // ── Ground ──────────────────────────────────────────────────────────
  private buildGround(): void {
    this.colliders = this.physics.add.staticGroup();
    const floor = this.colliders.create(MAP_W / 2, GROUND_Y + FLOOR_H / 2, '__DEFAULT') as Phaser.Physics.Arcade.Image;
    floor.setDisplaySize(MAP_W, FLOOR_H).setVisible(false).refreshBody();

    const gfx = this.add.graphics().setDepth(DEPTH_WORLD - 0.5);
    gfx.fillStyle(0x1a3a10); gfx.fillRect(0, GROUND_Y, MAP_W, FLOOR_H);
    gfx.fillStyle(0x2d5a1a); gfx.fillRect(0, GROUND_Y, MAP_W, 8);
    gfx.fillStyle(0x3a7822);
    for (let x = 0; x < MAP_W; x += 8) {
      const gh = 5 + (x % 7);
      gfx.fillTriangle(x, GROUND_Y, x + 5, GROUND_Y, x + 2, GROUND_Y - gh);
    }
  }

  // ── Evidence targets (Scene 3 objects, placed on ground) ─────────────
  private buildTargets(): void {
    for (let i = 0; i < TARGETS.length; i++) {
      const d = TARGETS[i];
      const itemY = GROUND_Y;          // bottom of sprite sits on ground
      const ringY = GROUND_Y - 22;     // ring centre (middle of object)
      const iconY = GROUND_Y - 80;     // floating camera icon

      const hasTexture = this.textures.exists(d.textureKey);

      // Sprite: origin (0.5, 1) so image bottom aligns to GROUND_Y
      let sprite: Phaser.GameObjects.Image;
      if (hasTexture) {
        sprite = this.add.image(d.x, itemY, d.textureKey)
          .setScale(d.scale).setOrigin(0.5, 1).setDepth(DEPTH_WORLD + 1);
        try { sprite.setPostPipeline('WhiteKey'); } catch (_) {}
      } else {
        // Fallback: gold square sitting on ground
        const fallback = this.add.graphics().setDepth(DEPTH_WORLD + 1);
        fallback.fillStyle(0xddaa44, 0.9);
        fallback.fillRect(d.x - 20, GROUND_Y - 40, 40, 40);
        fallback.fillStyle(0xffcc66);
        fallback.fillRect(d.x - 18, GROUND_Y - 38, 36, 36);
        sprite = this.add.image(d.x, itemY, '__DEFAULT').setAlpha(0);
      }

      // Glow targeting ring around the item
      const ring = this.add.graphics().setDepth(DEPTH_WORLD + 1.5);
      ring.lineStyle(2.5, 0xffcc00, 0.85);
      ring.strokeCircle(d.x, ringY, 34);
      ring.lineStyle(1, 0xffcc00, 0.3);
      ring.strokeCircle(d.x, ringY, 44);

      // Floating camera icon above item
      const camIcon = this.add.text(d.x, iconY, '📷', {
        fontSize: '16px', fontFamily: 'Arial',
      }).setOrigin(0.5).setDepth(DEPTH_WORLD + 2);

      this.tweens.add({ targets: camIcon, y: iconY - 8, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: ring, alpha: 0.2, duration: 850, yoyo: true, repeat: -1 });

      this.targets.push({ ...d, captured: false, sprite, ring, camIcon, checkText: null });
    }
  }

  // ── End portal ───────────────────────────────────────────────────────
  private buildEndMarker(): void {
    const g = this.add.graphics().setDepth(DEPTH_WORLD + 2);
    g.lineStyle(3, 0x88ccff, 0.85);
    g.strokeCircle(MAP_W - 100, GROUND_Y - 60, 36);
    g.fillStyle(0x88ccff, 0.2);
    g.fillCircle(MAP_W - 100, GROUND_Y - 60, 36);

    const lbl = this.add.text(MAP_W - 100, GROUND_Y - 60, '→', {
      fontSize: '26px', fontFamily: 'Arial', color: '#88ccff',
    }).setOrigin(0.5).setDepth(DEPTH_WORLD + 3);
    this.tweens.add({ targets: lbl, y: GROUND_Y - 67, duration: 750, yoyo: true, repeat: -1 });

    const hint = this.add.text(MAP_W - 100, GROUND_Y - 108, 'Tiếp tục\n[E]', {
      fontSize: '11px', fontFamily: 'Arial', color: '#88ccff', align: 'center',
      backgroundColor: '#00000088', padding: { x: 5, y: 3 },
    }).setOrigin(0.5).setDepth(DEPTH_UI);
    this.tweens.add({ targets: hint, alpha: 0.45, duration: 900, yoyo: true, repeat: -1 });
  }

  // ── Photo count UI (top-right checklist) ─────────────────────────────
  private buildPhotoUI(): void {
    const total = TARGETS.length;
    const px = W - 202, py = 38;
    const ph = 34 + total * 20;

    this.add.rectangle(px + 96, py + ph / 2, 192, ph, 0x000000, 0.78)
      .setStrokeStyle(1.5, 0x88ccff).setDepth(DEPTH_UI).setScrollFactor(0);

    this.add.text(px + 8, py + 6, '📷 BẰNG CHỨNG ẢNH', {
      fontSize: '11px', fontFamily: 'Arial', fontStyle: 'bold', color: '#88ccff',
    }).setDepth(DEPTH_UI).setScrollFactor(0);

    this.photoCountText = this.add.text(px + 8, py + 22, `0 / ${total} ảnh`, {
      fontSize: '11px', fontFamily: 'Arial', color: '#aaaaaa',
    }).setDepth(DEPTH_UI).setScrollFactor(0);

    TARGETS.forEach((d, i) => {
      const t = this.add.text(px + 8, py + 40 + i * 20, `□  ${d.label}`, {
        fontSize: '10px', fontFamily: 'Arial', color: '#888888',
      }).setDepth(DEPTH_UI).setScrollFactor(0);
      this.checkRows.push(t);
      this.targets[i].checkText = t;
    });
  }

  private buildHintText(): void {
    this.hintText = this.add.text(0, 0, '', {
      fontSize: '13px', fontFamily: 'Arial', color: '#ffffaa',
      backgroundColor: '#00000099', padding: { x: 7, y: 4 },
    }).setDepth(DEPTH_UI + 5).setScrollFactor(0).setVisible(false);
  }

  private buildSceneTitle(): void {
    this.add.text(W / 2, 10, 'Chương 2 — Cảnh 3: Chụp Ảnh Bằng Chứng', {
      fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#ccddff', stroke: '#000', strokeThickness: 2,
      backgroundColor: '#00000066', padding: { x: 8, y: 3 },
    }).setOrigin(0.5, 0).setDepth(DEPTH_UI).setScrollFactor(0);
  }

  private buildShutterOverlay(): void {
    this.shutterOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0)
      .setDepth(40).setScrollFactor(0);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  UPDATE
  // ═══════════════════════════════════════════════════════════════════
  update(_t: number, delta: number): void {
    if (this.phase !== 'gameplay' || this.transitionStarted) return;

    this.player.update(delta);
    this.handleJump();

    const px = this.player.x;
    const py = this.player.y;
    this.player.setDepth(2 + (py / H) * 3);

    // Nearest un-captured target
    let nearTarget: PhotoInstance | null = null;
    for (const t of this.targets) {
      if (!t.captured && Math.abs(px - t.x) < PHOTO_R) {
        nearTarget = t;
        break;
      }
    }

    const nearPortal = px > MAP_W - 200;

    // Hint text
    let hint = '';
    if (nearTarget)   hint = `📷 C — Chụp ảnh: ${nearTarget.label}`;
    else if (nearPortal) hint = '→  E — Tiếp tục sang Cảnh 4';

    if (hint) {
      const cam = this.cameras.main;
      const sx = (px - cam.scrollX) * cam.zoom;
      const sy = (py - cam.scrollY) * cam.zoom - 58;
      this.hintText.setText(hint).setVisible(true)
        .setPosition(sx - this.hintText.width / 2, sy);
    } else {
      this.hintText.setVisible(false);
    }

    // C key — photograph
    if (this.player.isCameraJustPressed() && nearTarget) {
      this.capturePhoto(nearTarget);
    }

    // E key — end portal → trigger post-game dialogue
    if (this.player.isInteractJustPressed() && nearPortal) {
      this.beginPostGame();
    }
  }

  // ── Capture a photo ──────────────────────────────────────────────────
  private capturePhoto(target: PhotoInstance): void {
    target.captured = true;
    this.photoCount++;

    // Camera shutter flash
    this.shutterOverlay.setAlpha(0.75);
    this.tweens.add({ targets: this.shutterOverlay, alpha: 0, duration: 280 });

    // Dim the target sprite
    this.tweens.add({ targets: target.sprite, alpha: 0.3, duration: 400 });
    this.tweens.add({ targets: target.ring,   alpha: 0,   duration: 400 });

    // Replace camera icon with checkmark
    target.camIcon.setText('✓').setColor('#88ff66').setFontSize('20px');
    this.tweens.killTweensOf(target.camIcon);

    // Update checklist
    if (target.checkText) {
      target.checkText.setText(`✓  ${target.label}`).setColor('#88ff66');
    }
    this.photoCountText.setText(`${this.photoCount} / ${TARGETS.length} ảnh`).setColor('#88ff66');

    this.gs.addInventory(`photo-${target.id}`);
    this.gs.set('evidenceCount', this.photoCount);

    this.game.events.emit('notify', `📷 Chụp được: ${target.label}`, '#f5c518');
    try { this.sound.play('camera', { volume: 0.55 }); } catch (_) {}
    this.time.delayedCall(180, () => {
      try { this.sound.play('collect', { volume: 0.3 }); } catch (_) {}
    });

    if (this.photoCount >= TARGETS.length) {
      this.time.delayedCall(600, () => {
        this.game.events.emit('notify', '✅ Chụp đủ bằng chứng! Đi đến cổng thoát →', '#88ff66');
        try { this.sound.play('success', { volume: 0.45 }); } catch (_) {}
      });
    }
  }

  // ── Begin post-game: award score then show post-game dialogue ─────────
  private beginPostGame(): void {
    if (this.transitionStarted || this.phase !== 'gameplay') return;
    this.phase = 'postgame';

    // Award score
    let pts = 0;
    if (this.photoCount >= 5)      { pts = 25; }
    else if (this.photoCount >= 3) { pts = 10; }
    else                           { pts = 0;  }

    this.gs.addScore(pts);
    this.gs.set('photosTaken', this.photoCount);

    const msg = pts > 0
      ? `📷 ${this.photoCount}/${TARGETS.length} ảnh — +${pts} điểm`
      : `📷 ${this.photoCount}/${TARGETS.length} ảnh — Quá ít bằng chứng`;
    this.game.events.emit('notify', msg, pts > 0 ? '#88ff66' : '#ff8844');

    this.launchDialog('c2s3-postgame');
  }

  // ── Jump ─────────────────────────────────────────────────────────────
  private handleJump(): void {
    const body = this.playerBody;
    if (body.blocked.down || body.touching.down) this.canJump = true;
    if (this.canJump && Phaser.Input.Keyboard.JustDown(this.jumpKey)) {
      body.setVelocityY(-520);
      this.canJump = false;
      this.tweens.add({
        targets: this.player, scaleY: this.player.scaleY * 0.85,
        duration: 80, yoyo: true, ease: 'Sine.easeOut',
      });
    }
  }

  // ── Transition to Scene 4 ─────────────────────────────────────────────
  private goToScene4(): void {
    if (this.transitionStarted) return;
    this.transitionStarted = true;
    this.gs.set('c2Progress', 3);
    try { this.sound.stopAll(); } catch (_) {}
    this.cameras.main.fadeOut(700, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('C2S4Stealth');
    });
  }

  // ── Cleanup ──────────────────────────────────────────────────────────
  shutdown(): void {
    this.events.off('dialog-done', this.onDialogDone, this);
  }
}
