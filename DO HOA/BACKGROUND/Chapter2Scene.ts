import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { Player } from '../entities/Player';
import { NPC } from '../entities/NPC';
import { W, H, MAP_W_CH2, DEPTH_BG, DEPTH_WORLD, DEPTH_FX, DEPTH_UI } from '../constants';

const MAP_H    = H;
// Ground level consistent with Chapter 1
const GROUND_Y = 420;
const FLOOR_H  = 120;

interface EvidenceZone {
  x: number; y: number; radius: number; id: string; collected: boolean;
  sprite: Phaser.GameObjects.Image | null;
}

export class Chapter2Scene extends Phaser.Scene {
  private gs!: GS;
  private player!: Player;
  private npcs: NPC[] = [];
  private colliders!: Phaser.Physics.Arcade.StaticGroup;
  private evidenceZones: EvidenceZone[] = [];
  private inDialog = false;
  private cameraMode = false;
  private cameraModeUI!: Phaser.GameObjects.Container;
  private evidenceCountText!: Phaser.GameObjects.Text;
  private cameraIcon!: Phaser.GameObjects.Image;
  private hintText!: Phaser.GameObjects.Text;

  // Jump state
  private playerBody!: Phaser.Physics.Arcade.Body;
  private jumpKey!: Phaser.Input.Keyboard.Key;
  private canJump = true;

  private _pendingNPC: NPC | null = null;

  constructor() { super('Chapter2Scene'); }

  // ═══════════════════════════════════════════════════════════════════
  //  CREATE
  // ═══════════════════════════════════════════════════════════════════
  create(): void {
    this.gs = new GS(this.registry);
    this.gs.set('chapter', 2);

    // Enable gravity — same as Chapter 1
    this.physics.world.gravity.y = 800;
    this.physics.world.setBounds(0, 0, MAP_W_CH2, MAP_H);

    this.buildWorld();
    this.buildNPCs();
    this.buildEvidenceZones();

    const gender = this.gs.get('gender') || 'male';
    this.player = new Player(this, 80, GROUND_Y - 60, gender);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(true);
    this.playerBody.setMaxVelocityY(900);

    this.jumpKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.cameras.main.setBounds(0, 0, MAP_W_CH2, MAP_H);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.fadeIn(800);

    this.physics.add.collider(this.player, this.colliders, () => {
      this.canJump = true;
    });

    this.buildFireflies();
    this.buildCameraUI();
    this.buildHintText();

    this.events.on('dialog-done', this.onDialogDone, this);
    this.events.on('choice-made', this.onChoiceMade, this);

    // Click-to-collect evidence in camera mode
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (this.cameraMode && !this.inDialog) {
        this.tryCollectEvidence(ptr.worldX, ptr.worldY);
      }
    });

    this.time.delayedCall(800, () => {
      this.game.events.emit('notify', 'Chương 2: Thu thập bằng chứng — C = chế độ chụp ảnh • SPACE nhảy', '#88ccff');
    });

    try { this.sound.play('forest-ambient', { loop: true, volume: 0.1 }); } catch (_) {}
  }

  // ═══════════════════════════════════════════════════════════════════
  //  WORLD — Night forest, full-screen background
  // ═══════════════════════════════════════════════════════════════════
  private buildWorld(): void {
    this.colliders = this.physics.add.staticGroup();

    // ── Layer 0: Full background image (or procedural night forest) ────
    if (this.textures.exists('bg-ch2')) {
      this.add.tileSprite(MAP_W_CH2 / 2, MAP_H / 2, MAP_W_CH2, MAP_H, 'bg-ch2')
        .setDepth(DEPTH_BG)
        .setOrigin(0.5, 0.5);
    } else {
      this.buildProceduralNightBackground();
    }

    // ── Dark ground overlay for depth ────────────────────────────────
    const groundShade = this.add.graphics().setDepth(DEPTH_BG + 0.5);
    groundShade.fillStyle(0x000000, 0.35);
    groundShade.fillRect(0, GROUND_Y, MAP_W_CH2, FLOOR_H);

    // ── Ground platform ───────────────────────────────────────────────
    this.addBlock(MAP_W_CH2 / 2, GROUND_Y + FLOOR_H / 2, MAP_W_CH2, FLOOR_H);

    // ── Mid-level platforms (rocks / fallen logs) ─────────────────────
    const platforms: { x: number; y: number; w: number }[] = [
      { x: 420,  y: GROUND_Y - 85,  w: 90  },
      { x: 780,  y: GROUND_Y - 70,  w: 80  },
      { x: 1150, y: GROUND_Y - 95,  w: 100 },
      { x: 1550, y: GROUND_Y - 75,  w: 85  },
      { x: 1950, y: GROUND_Y - 90,  w: 100 },
      { x: 2300, y: GROUND_Y - 65,  w: 80  },
    ];

    const platG = this.add.graphics().setDepth(DEPTH_WORLD - 0.5);
    for (const p of platforms) {
      // Dark mossy stone / log visual
      platG.fillStyle(0x1a3010, 0.9);
      platG.fillRoundedRect(p.x - p.w / 2, p.y - 10, p.w, 14, 5);
      platG.fillStyle(0x2a4a18, 0.6);
      platG.fillRoundedRect(p.x - p.w / 2 + 4, p.y - 13, p.w - 8, 6, 3);
      this.addBlock(p.x, p.y, p.w, 14);
    }

    // ── Danger zone red tint (x 1800+) ────────────────────────────────
    const dangerG = this.add.graphics().setDepth(DEPTH_BG + 0.8);
    dangerG.fillStyle(0x300500, 0.22);
    dangerG.fillRect(1800, 0, MAP_W_CH2 - 1800, MAP_H);

    const warningText = this.add.text(1840, GROUND_Y - 150, '⚠ VÙNG CẤM — Không được vào', {
      fontSize: '11px', fontFamily: 'Arial', color: '#ff4444',
      stroke: '#000', strokeThickness: 2,
    }).setDepth(DEPTH_UI);
    this.tweens.add({ targets: warningText, alpha: 0.5, duration: 800, yoyo: true, repeat: -1 });

    // ── World objects ─────────────────────────────────────────────────
    // Hut at start
    this.add.image(400, GROUND_Y - 35, 'hut').setScale(1.2).setDepth(DEPTH_WORLD + 1);
    this.addBlock(400, GROUND_Y - 35, 85, 55);

    // Heavy machinery silhouette (deep forest zone)
    const mach = this.add.graphics().setDepth(DEPTH_WORLD);
    mach.fillStyle(0x1a1a10);
    mach.fillRect(2000, GROUND_Y - 100, 160, 90);
    mach.fillRect(2060, GROUND_Y - 130, 40, 32);
    mach.fillStyle(0x282820);
    mach.fillRect(2005, GROUND_Y - 95, 150, 82);
    // Red warning light on machinery
    mach.fillStyle(0xff2200, 0.7);
    mach.fillCircle(2155, GROUND_Y - 105, 5);
    this.tweens.add({
      targets: { get v() { return mach.alpha; }, set v(val) { mach.setAlpha(val); } },
      v: 0.5, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.addBlock(2080, GROUND_Y - 55, 160, 90);

    // Pipeline / cable across the ground
    const pipeG = this.add.graphics().setDepth(DEPTH_WORLD - 0.2);
    pipeG.fillStyle(0x444433, 0.8);
    pipeG.fillRect(1900, GROUND_Y - 8, MAP_W_CH2 - 1900, 4);

    // Decorative trees along ground
    this.placeGroundTrees();

    // End portal
    const portalText = this.add.text(MAP_W_CH2 - 80, GROUND_Y - 90, '📋 Nộp báo cáo\n[Nhấn E]', {
      fontSize: '12px', fontFamily: 'Arial', color: '#88ccff',
      backgroundColor: '#00000088', padding: { x: 6, y: 4 }, align: 'center',
    }).setOrigin(0.5).setDepth(DEPTH_UI);
    this.tweens.add({ targets: portalText, alpha: 0.4, duration: 1000, yoyo: true, repeat: -1 });

    // Zone labels
    this.add.text(80, GROUND_Y - 140, '← Điểm xuất phát Chương 2', {
      fontSize: '10px', color: '#88aa66', fontFamily: 'Arial', stroke: '#000', strokeThickness: 2,
    }).setDepth(DEPTH_UI);
    this.add.text(900, GROUND_Y - 140, 'Khu vực điều tra', {
      fontSize: '10px', color: '#88aa66', fontFamily: 'Arial', stroke: '#000', strokeThickness: 2,
    }).setDepth(DEPTH_UI);
  }

  // Procedural night forest when bg-ch2 is missing
  private buildProceduralNightBackground(): void {
    const bg = this.add.graphics().setDepth(DEPTH_BG);

    // Deep night sky (top ~75%)
    const nightColors = [0x010306, 0x020509, 0x03080e, 0x050d14, 0x081520, 0x0a1a28];
    nightColors.forEach((c, i) => {
      const bh = Math.ceil((MAP_H * 0.78) / nightColors.length);
      bg.fillStyle(c);
      bg.fillRect(0, i * bh, MAP_W_CH2, bh + 2);
    });

    // Moon
    bg.fillStyle(0xddeebb, 0.12);
    bg.fillCircle(MAP_W_CH2 - 200, 55, 55);
    bg.fillStyle(0xeef8cc, 0.9);
    bg.fillCircle(MAP_W_CH2 - 200, 55, 30);

    // Stars
    const rng = new Phaser.Math.RandomDataGenerator(['ch2-stars']);
    for (let s = 0; s < 100; s++) {
      bg.fillStyle(0xffffff, 0.3 + rng.frac() * 0.6);
      bg.fillCircle(rng.integerInRange(0, MAP_W_CH2), rng.integerInRange(0, MAP_H * 0.55), 0.6 + rng.frac() * 1.2);
    }

    // Ground
    bg.fillStyle(0x0a1505);
    bg.fillRect(0, GROUND_Y - 20, MAP_W_CH2, MAP_H - GROUND_Y + 20);

    // Dark canopy silhouettes
    bg.fillStyle(0x050d03);
    for (let x = 0; x < MAP_W_CH2; x += 65 + (x % 45)) {
      const h = 130 + (x % 90);
      const cx = x + 30;
      bg.fillCircle(cx, GROUND_Y - h, 32 + (x % 22));
      bg.fillCircle(cx + 18, GROUND_Y - h + 18, 26 + (x % 15));
      bg.fillRect(cx - 5, GROUND_Y - 55, 10, 55);
    }

    // Ground grass (dark)
    bg.fillStyle(0x1a3a10);
    for (let x = 0; x < MAP_W_CH2; x += 6) {
      const gh = 6 + (x % 8);
      bg.fillTriangle(x, GROUND_Y - 4, x + 4, GROUND_Y - 4, x + 2, GROUND_Y - 4 - gh);
    }

    // Dim moonlight rays
    const rayG = this.add.graphics().setDepth(DEPTH_BG + 0.3);
    rayG.fillStyle(0xeef8cc, 0.025);
    for (let rx = 80; rx < MAP_W_CH2; rx += 300) {
      rayG.fillTriangle(rx, 0, rx + 50, GROUND_Y, rx - 50, GROUND_Y);
    }
  }

  // Trees along the ground
  private placeGroundTrees(): void {
    const positions = [200, 330, 570, 710, 980, 1120, 1380, 1600, 1850, 2080, 2350, 2500];
    positions.forEach(tx => {
      const key = tx % 130 < 65 ? 'tree-lg' : 'tree-sm';
      this.add.image(tx, GROUND_Y, key)
        .setScale(0.85 + (tx % 4) * 0.08)
        .setOrigin(0.5, 1)
        .setDepth(DEPTH_WORLD - 0.2)
        .setAlpha(0.82)
        .setTint(0x8899aa); // cool night tint on trees
    });

    // Bushes
    [160, 450, 680, 1050, 1450, 2050, 2400].forEach(bx => {
      this.add.image(bx, GROUND_Y, 'bush')
        .setScale(1.1 + (bx % 3) * 0.15)
        .setOrigin(0.5, 1)
        .setDepth(DEPTH_WORLD - 0.1)
        .setTint(0x7788aa);
    });
  }

  private addBlock(x: number, y: number, w: number, h: number): void {
    const b = this.colliders.create(x, y, '__DEFAULT') as Phaser.Physics.Arcade.Image;
    b.setDisplaySize(w, h).setVisible(false).refreshBody();
  }

  // ═══════════════════════════════════════════════════════════════════
  //  NPCs
  // ═══════════════════════════════════════════════════════════════════
  private buildNPCs(): void {
    const defs = [
      { key: 'npc-lan',   x: 360,  y: GROUND_Y - 24, name: 'Lan',              dialog: 'ch2-lan'   },
      { key: 'npc-hung',  x: 1400, y: GROUND_Y - 24, name: 'Hùng',             dialog: 'ch2-hung'  },
      { key: 'npc-thang', x: 2050, y: GROUND_Y - 24, name: 'Nguyễn Văn Thắng', dialog: 'ch2-thang' },
    ];
    for (const d of defs) {
      const npc = new NPC(this, { textureKey: d.key, x: d.x, y: d.y, name: d.name, dialogKey: d.dialog });
      npc.startIdleAnim();
      this.npcs.push(npc);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  EVIDENCE ZONES — placed at ground level
  // ═══════════════════════════════════════════════════════════════════
  private buildEvidenceZones(): void {
    const positions = [
      { x: 650,  y: GROUND_Y - 50, id: 'evidence1' },
      { x: 900,  y: GROUND_Y - 40, id: 'evidence2' },
      { x: 1200, y: GROUND_Y - 55, id: 'evidence3' },
      { x: 1700, y: GROUND_Y - 45, id: 'evidence4' },
      { x: 2200, y: GROUND_Y - 50, id: 'evidence5' },
    ];

    const evGroup = this.add.graphics().setDepth(DEPTH_WORLD + 1);
    evGroup.lineStyle(2, 0xffaa00, 0.8);

    for (const p of positions) {
      evGroup.strokeCircle(p.x, p.y, 22);

      const hint = this.add.text(p.x, p.y - 36, '?', {
        fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold',
        color: '#ffaa00', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(DEPTH_WORLD + 2);
      this.tweens.add({ targets: hint, y: p.y - 42, duration: 600, yoyo: true, repeat: -1 });

      const sprite = this.add.image(p.x, p.y, 'stake').setScale(1.4).setDepth(DEPTH_WORLD);
      this.evidenceZones.push({ ...p, radius: 55, collected: false, sprite });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  FIREFLIES — ambient night particles across full height
  // ═══════════════════════════════════════════════════════════════════
  private buildFireflies(): void {
    if (!this.textures.exists('particle-dot')) return;

    // Mid-air fireflies (float freely across full scene)
    this.add.particles(0, 0, 'particle-dot', {
      x: { min: 0, max: MAP_W_CH2 },
      y: { min: 10, max: GROUND_Y - 20 },
      lifespan: { min: 2500, max: 5000 },
      speed: { min: 4, max: 16 },
      scale: { start: 0.35, end: 0 },
      alpha: { start: 0.85, end: 0 },
      tint: [0x88ff44, 0xaaff66, 0x44ffaa, 0xccff66],
      quantity: 1,
      frequency: 200,
    }).setDepth(DEPTH_FX);

    // Ground-level glow sparks
    this.add.particles(0, 0, 'particle-dot', {
      x: { min: 0, max: MAP_W_CH2 },
      y: { min: GROUND_Y - 30, max: GROUND_Y + 10 },
      lifespan: { min: 1500, max: 3000 },
      speed: { min: 2, max: 8 },
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: [0x88ff44, 0x66dd44],
      quantity: 1,
      frequency: 280,
    }).setDepth(DEPTH_FX - 0.5);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  HINT TEXT
  // ═══════════════════════════════════════════════════════════════════
  private buildHintText(): void {
    this.hintText = this.add.text(0, 0, '', {
      fontSize: '13px', fontFamily: 'Arial', color: '#ffffaa',
      backgroundColor: '#00000099', padding: { x: 7, y: 4 },
    }).setDepth(DEPTH_UI + 5).setScrollFactor(0).setVisible(false);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  CAMERA MODE UI
  // ═══════════════════════════════════════════════════════════════════
  private buildCameraUI(): void {
    const camBg = this.add.rectangle(0, 0, 240, 36, 0x000000, 0.8)
      .setStrokeStyle(1.5, 0x88ccff);
    const camLabel = this.add.text(-100, 0, '📷 CHẾ ĐỘ CHỤP ẢNH', {
      fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold', color: '#88ccff',
    }).setOrigin(0, 0.5);

    this.evidenceCountText = this.add.text(60, 0, '0/5 bằng chứng', {
      fontSize: '11px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0, 0.5);

    this.cameraModeUI = this.add.container(W / 2, 55, [camBg, camLabel, this.evidenceCountText])
      .setDepth(DEPTH_UI).setScrollFactor(0).setVisible(false);

    this.cameraIcon = this.add.image(this.player.x + 18, this.player.y - 24, 'camera-item')
      .setScale(1.3).setDepth(DEPTH_WORLD + 3).setVisible(false).setScrollFactor(1);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  UPDATE
  // ═══════════════════════════════════════════════════════════════════
  update(_t: number, delta: number): void {
    if (this.inDialog) return;

    this.player.update(delta);
    this.handleJump();

    const px = this.player.x;
    const py = this.player.y;

    // Y-depth sorting
    const depthForY = (y: number) => 2 + (y / MAP_H) * 3;
    this.player.setDepth(depthForY(py));
    for (const npc of this.npcs) { npc.setDepth(depthForY(npc.y)); }

    // Camera mode toggle
    const cKeyPressed = this.player.isCameraJustPressed();
    const wasInCameraMode = this.cameraMode;
    if (cKeyPressed) this.toggleCameraMode();

    // Camera icon follows player
    if (this.cameraMode) {
      this.cameraIcon.setPosition(px + 18, py - 24);
    }

    // NPC proximity
    let nearNPC: NPC | null = null;
    for (const npc of this.npcs) {
      if (npc.checkProximity(px, py)) { nearNPC = npc; break; }
    }

    // Nearest uncollected evidence zone (only in camera mode)
    const nearEvidence = this.cameraMode
      ? this.evidenceZones.find(ev =>
          !ev.collected && Phaser.Math.Distance.Between(px, py, ev.x, ev.y) < ev.radius)
      : undefined;

    const nearPortal = px > MAP_W_CH2 - 160;

    // Hint
    let hint = '';
    if (!this.cameraMode && nearNPC && !nearNPC.isDone) hint = `💬 E — Nói chuyện với ${nearNPC.name}`;
    else if (!this.cameraMode)                          hint = '📷 C — Bật chế độ chụp ảnh';
    else if (nearEvidence)                              hint = '📷 C hoặc Click — Chụp bằng chứng!';
    else if (nearPortal)                                hint = '📋 E — Nộp báo cáo & kết thúc';

    if (hint) {
      this.hintText.setText(hint).setVisible(true);
      const cam = this.cameras.main;
      const sx = (px - cam.scrollX) * cam.zoom;
      const sy = (py - cam.scrollY) * cam.zoom - 55;
      this.hintText.setPosition(sx - this.hintText.width / 2, sy);
    } else {
      this.hintText.setVisible(false);
    }

    // E key actions
    if (this.player.isInteractJustPressed()) {
      if (nearNPC && !nearNPC.isDone && !this.cameraMode) {
        this.startDialog(nearNPC.dialogKey, nearNPC);
        return;
      }
      if (nearPortal) { this.goToEnding(); return; }
    }

    // C key: collect evidence when already in camera mode + near zone
    if (cKeyPressed && wasInCameraMode && nearEvidence) {
      this.tryCollectEvidence(px, py);
    }

    void delta;
  }

  // ─── Jump ─────────────────────────────────────────────────────────
  private handleJump(): void {
    const body = this.playerBody;
    const onGround = body.blocked.down || body.touching.down;
    if (onGround) { this.canJump = true; }

    if (this.canJump && Phaser.Input.Keyboard.JustDown(this.jumpKey)) {
      body.setVelocityY(-520);
      this.canJump = false;
      this.tweens.add({
        targets: this.player,
        scaleY: 0.85,
        duration: 80,
        yoyo: true,
        ease: 'Sine.easeOut',
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  EVIDENCE COLLECTION
  // ═══════════════════════════════════════════════════════════════════
  private tryCollectEvidence(cx: number, cy: number): void {
    for (const ev of this.evidenceZones) {
      if (ev.collected) continue;
      if (Phaser.Math.Distance.Between(cx, cy, ev.x, ev.y) < ev.radius) {
        this.collectEvidence(ev);
        break;
      }
    }
  }

  private collectEvidence(ev: EvidenceZone): void {
    ev.collected = true;
    ev.sprite?.destroy();

    const count = (this.gs.get('evidenceCount') || 0) + 1;
    this.gs.set('evidenceCount', count);
    this.gs.addInventory(ev.id);
    this.gs.addScore(150);

    // Flash
    const flash = this.add.rectangle(ev.x, ev.y, 50, 50, 0xffffff, 0.8).setDepth(20);
    this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });

    this.evidenceCountText.setText(`${count}/5 bằng chứng`);
    this.game.events.emit('notify', `📷 Bằng chứng ${count} đã chụp! +150 điểm`, '#f5c518');

    if (count >= 4) {
      this.time.delayedCall(500, () => {
        this.game.events.emit('notify', 'Đủ bằng chứng! Đối chất với Thắng hoặc nộp cho Lan.', '#88ff66');
      });
    }

    try { this.sound.play('collect', { volume: 0.4 }); } catch (_) {}
  }

  private toggleCameraMode(): void {
    this.cameraMode = !this.cameraMode;
    this.cameraModeUI.setVisible(this.cameraMode);
    this.cameraIcon.setVisible(this.cameraMode);

    const cam = this.cameras.main as unknown as { setTint(c: number): void; clearTint(): void };
    if (this.cameraMode) {
      cam.setTint(0xddeeff);
      this.game.events.emit('notify', '📷 Chế độ chụp ảnh BẬT — C hoặc Click để chụp bằng chứng', '#88ccff');
    } else {
      cam.clearTint();
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  DIALOG
  // ═══════════════════════════════════════════════════════════════════
  private startDialog(dialogKey: string, npc: NPC | null): void {
    this.inDialog = true;
    this.player.freeze();
    this._pendingNPC = npc;
    this.scene.launch('DialogScene', { dialogKey, sourceScene: 'Chapter2Scene' });
    this.scene.pause();
  }

  private onDialogDone(_result: any): void {
    this.scene.resume();
    this.inDialog = false;
    this.player.unfreeze();
    if (this._pendingNPC) { this._pendingNPC.markDone(); this._pendingNPC = null; }
  }

  private onChoiceMade(data: { decision: string; scoreChange: number; trustChange: number }): void {
    if (data.scoreChange > 0) {
      this.game.events.emit('notify', `+${data.scoreChange} điểm!`, '#f5c518');
    }
    if (data.decision === 'hung_confess' || data.decision === 'hung_trust') {
      this.gs.addInventory('report');
      this.gs.addScore(100);
      this.game.events.emit('notify', '📄 Nhận được: Bản sao báo cáo thật! +100 điểm', '#88ff66');
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  TRANSITION
  // ═══════════════════════════════════════════════════════════════════
  private goToEnding(): void {
    try { this.sound.stopAll(); } catch (_) {}
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('UIScene');
      this.scene.start('EndingScene');
    });
  }

  shutdown(): void {
    this.events.off('dialog-done', this.onDialogDone, this);
    this.events.off('choice-made', this.onChoiceMade, this);
  }