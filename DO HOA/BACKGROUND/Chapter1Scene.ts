import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { Player } from '../entities/Player';
import { NPC } from '../entities/NPC';
import {
  MAP_W_CH1, DEPTH_BG, DEPTH_WORLD, DEPTH_FX, DEPTH_UI,
  COLOR_FOREST_MID,
} from '../constants';

const MAP_H    = 540;
// Ground level: player walks on this Y (bottom ~20% of screen)
const GROUND_Y = 420;
// Playable floor height (invisible ground platform)
const FLOOR_H  = 120;

interface CrocSpot { x: number; y: number; hit: boolean; img: Phaser.GameObjects.Graphics }

export class Chapter1Scene extends Phaser.Scene {
  private gs!: GS;
  private player!: Player;
  private npcs: NPC[] = [];
  private colliders!: Phaser.Physics.Arcade.StaticGroup;

  private ch2PortalFired = false;
  private inDialog = false;
  private _pendingNPC: NPC | null = null;

  private crocs: CrocSpot[] = [];
  private deerX = 980; private deerY = 390;
  private deerRescued = false;
  private deerRescuing = false;
  private deerProgress = 0;
  private deerImg!: Phaser.GameObjects.Image;
  private deerProgressBg!: Phaser.GameObjects.Rectangle;
  private deerProgressFill!: Phaser.GameObjects.Rectangle;

  private evidenceZoneActive = false;
  private evidenceCount = 0;
  private maxEvidence = 3;

  private hintText!: Phaser.GameObjects.Text;

  // Jump state (used when Player entity doesn't expose jump directly)
  private playerBody!: Phaser.Physics.Arcade.Body;
  private jumpKey!: Phaser.Input.Keyboard.Key;
  private canJump = true;

  constructor() { super('Chapter1Scene'); }

  // ═══════════════════════════════════════════════════════════════════
  //  CREATE
  // ═══════════════════════════════════════════════════════════════════
  create(): void {
    this.gs = new GS(this.registry);
    this.gs.set('chapter', 1);

    // Enable gravity for platformer feel
    this.physics.world.gravity.y = 800;
    this.physics.world.setBounds(0, 0, MAP_W_CH1, MAP_H);

    this.buildWorld();
    this.buildCrocs();
    this.buildDeer();
    this.buildNPCs();

    const gender = this.gs.get('gender') || 'male';
    this.player = new Player(this, 80, GROUND_Y - 60, gender);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(true);
    this.playerBody.setMaxVelocityY(900);

    // Jump key: Space (also works via Player entity if it supports jump)
    this.jumpKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.cameras.main.setBounds(0, 0, MAP_W_CH1, MAP_H);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.fadeIn(800);

    this.physics.add.collider(this.player, this.colliders, () => {
      this.canJump = true;
    });

    // Hint text
    this.hintText = this.add.text(0, 0, '', {
      fontSize: '13px', fontFamily: 'Arial', color: '#ffffaa',
      backgroundColor: '#00000099', padding: { x: 7, y: 4 },
    }).setDepth(DEPTH_UI + 5).setScrollFactor(0).setVisible(false);

    this.events.on('dialog-done', this.onDialogDone, this);

    this.time.delayedCall(1200, () => {
      this.game.events.emit('notify', 'WASD/←→ di chuyển  •  SPACE nhảy  •  E tương tác  •  C chụp ảnh', '#88ff66');
    });

    try { this.sound.play('forest-ambient', { loop: true, volume: 0.12 }); } catch (_) {}
  }

  // ═══════════════════════════════════════════════════════════════════
  //  WORLD — Background fills the full map, no path strip
  // ═══════════════════════════════════════════════════════════════════
  private buildWorld(): void {
    this.colliders = this.physics.add.staticGroup();

    // ── Layer 0: Full background image (or procedural forest) ──────────
    if (this.textures.exists('bg-ch1')) {
      // Tile the real forest background art across the full map width
      this.add.tileSprite(MAP_W_CH1 / 2, MAP_H / 2, MAP_W_CH1, MAP_H, 'bg-ch1')
        .setDepth(DEPTH_BG)
        .setOrigin(0.5, 0.5);
    } else {
      // Procedural full-scene forest background
      this.buildProceduralBackground();
    }

    // ── Layer 1: Subtle depth gradient at ground level ─────────────────
    const depthGrad = this.add.graphics().setDepth(DEPTH_BG + 0.5);
    depthGrad.fillStyle(0x000000, 0.25);
    depthGrad.fillRect(0, GROUND_Y, MAP_W_CH1, FLOOR_H);

    // ── Ground platform: invisible floor the player walks on ───────────
    // Spans entire map width
    this.addBlock(MAP_W_CH1 / 2, GROUND_Y + FLOOR_H / 2, MAP_W_CH1, FLOOR_H);

    // ── Mid-level platforms (optional — for jumping variety) ────────────
    const platforms: { x: number; y: number; w: number }[] = [
      { x: 520,  y: GROUND_Y - 90,  w: 100 },
      { x: 900,  y: GROUND_Y - 70,  w: 80  },
      { x: 1300, y: GROUND_Y - 100, w: 120 },
      { x: 1800, y: GROUND_Y - 80,  w: 100 },
      { x: 2300, y: GROUND_Y - 90,  w: 90  },
      { x: 2700, y: GROUND_Y - 70,  w: 80  },
    ];

    const platG = this.add.graphics().setDepth(DEPTH_WORLD - 0.5);
    for (const p of platforms) {
      // Visual: mossy log / rock
      platG.fillStyle(0x3a6a1a, 0.85);
      platG.fillRoundedRect(p.x - p.w / 2, p.y - 10, p.w, 14, 5);
      platG.fillStyle(0x4a8a2a, 0.6);
      platG.fillRoundedRect(p.x - p.w / 2 + 4, p.y - 13, p.w - 8, 6, 3);
      // Invisible physics block
      this.addBlock(p.x, p.y, p.w, 14);
    }

    // ── World objects ───────────────────────────────────────────────────
    // Gate at entrance
    this.add.image(440, GROUND_Y - 30, 'gate').setScale(1.4).setDepth(DEPTH_WORLD + 1);
    this.addBlock(440, GROUND_Y - 30, 80, 60);
    this.add.image(120, GROUND_Y - 28, 'sign').setScale(1.2).setDepth(DEPTH_WORLD);

    // Village huts
    this.add.image(1320, GROUND_Y - 35, 'hut').setScale(1.3).setDepth(DEPTH_WORLD + 1);
    this.addBlock(1320, GROUND_Y - 35, 90, 60);
    this.add.image(1620, GROUND_Y - 25, 'hut').setScale(1.0).setDepth(DEPTH_WORLD + 1);
    this.addBlock(1620, GROUND_Y - 25, 80, 55);
    this.add.image(1460, GROUND_Y - 10, 'fire-pit').setScale(1.3).setDepth(DEPTH_WORLD);

    // Trees along the ground (decorative — slightly above player ground level)
    this.placeGroundTrees();

    // Evidence zone: survey stakes
    [2250, 2450, 2650].forEach((sx, i) => {
      const sy = GROUND_Y - [55, 45, 60][i];
      this.add.image(sx, sy, 'stake').setScale(1.5).setDepth(DEPTH_WORLD);
    });
    this.add.image(2200, GROUND_Y - 70, 'spray-mark').setScale(1.2).setDepth(DEPTH_WORLD + 2);
    this.add.image(2700, GROUND_Y - 75, 'spray-mark').setScale(1.2).setDepth(DEPTH_WORLD + 2);

    // Evidence zone warm glow overlay
    const evG = this.add.graphics().setDepth(DEPTH_BG + 1);
    evG.fillStyle(0xff8800, 0.06);
    evG.fillRect(2100, 0, 700, MAP_H);

    // Dark deep-forest overlay (from x 2100 onward)
    const deepG = this.add.graphics().setDepth(DEPTH_BG + 0.8);
    deepG.fillStyle(0x000000, 0.22);
    deepG.fillRect(2100, 0, MAP_W_CH1 - 2100, MAP_H);

    // Chapter-2 portal sign
    const portal = this.add.text(3100, GROUND_Y - 80, '➜ Khu vực điều tra\n[Nhấn E để tiếp tục]', {
      fontSize: '13px', fontFamily: 'Arial', color: '#88ccff',
      backgroundColor: '#00000099', padding: { x: 8, y: 5 },
    }).setOrigin(0.5).setDepth(DEPTH_UI);
    this.tweens.add({ targets: portal, alpha: 0.5, duration: 1000, yoyo: true, repeat: -1 });

    // Zone labels
    [
      { x: 120,  text: 'Cổng vào' },
      { x: 640,  text: 'Con đường rừng' },
      { x: 1450, text: 'Làng Mạ' },
      { x: 2400, text: 'Vùng lõi — Hạn chế ra vào' },
    ].forEach(l => {
      this.add.text(l.x, GROUND_Y - 140, l.text, {
        fontSize: '10px', fontFamily: 'Arial', color: '#88aa66',
        stroke: '#000', strokeThickness: 2,
      }).setDepth(DEPTH_UI);
    });

    // Stream crossing (x 790-855): visual water strip
    const waterG = this.add.graphics().setDepth(DEPTH_WORLD - 0.3);
    waterG.fillStyle(0x2a6b8a, 0.9);
    waterG.fillRect(790, 0, 65, MAP_H);
    waterG.fillStyle(0x55aacc, 0.3);
    for (let y = 0; y < MAP_H; y += 20) waterG.fillRect(800, y, 44, 8);
    this.add.text(822, GROUND_Y - 150, 'Suối', {
      fontSize: '9px', fontFamily: 'Arial', color: '#aaddee',
    }).setOrigin(0.5, 0).setDepth(DEPTH_UI);
  }

  // Procedural background when bg-ch1 asset is missing
  private buildProceduralBackground(): void {
    const bg = this.add.graphics().setDepth(DEPTH_BG);

    // Sky gradient (top 60%)
    const skyColors = [0x2e6b3a, 0x3a8a4a, 0x4aaa5a, 0x5ab86a, 0x6aca7a];
    skyColors.forEach((c, i) => {
      const bh = Math.ceil((MAP_H * 0.75) / skyColors.length);
      bg.fillStyle(c);
      bg.fillRect(0, i * bh, MAP_W_CH1, bh + 2);
    });

    // Ground layer
    bg.fillStyle(0x2d5a1b);
    bg.fillRect(0, GROUND_Y - 20, MAP_W_CH1, MAP_H - GROUND_Y + 20);

    // Canopy tree silhouettes scattered across full width
    bg.fillStyle(0x1a3a0a);
    for (let x = 0; x < MAP_W_CH1; x += 70 + (x % 50)) {
      const h = 120 + (x % 80);
      const cx = x + 35;
      bg.fillCircle(cx, GROUND_Y - h, 35 + (x % 25));
      bg.fillCircle(cx + 20, GROUND_Y - h + 20, 28 + (x % 15));
      bg.fillRect(cx - 6, GROUND_Y - 60, 12, 60);
    }

    // Ground grass
    bg.fillStyle(0x3d7a2a);
    for (let x = 0; x < MAP_W_CH1; x += 6) {
      const gh = 8 + (x % 10);
      bg.fillTriangle(x, GROUND_Y - 5, x + 4, GROUND_Y - 5, x + 2, GROUND_Y - 5 - gh);
    }

    // Light rays through canopy
    const rayG = this.add.graphics().setDepth(DEPTH_BG + 0.3);
    rayG.fillStyle(0xfff8dd, 0.04);
    for (let rx = 100; rx < MAP_W_CH1; rx += 250) {
      rayG.fillTriangle(rx, 0, rx + 60, GROUND_Y, rx - 60, GROUND_Y);
    }
  }

  // Decorative trees placed along the ground edge
  private placeGroundTrees(): void {
    const treePositions = [
      250, 350, 600, 720, 1050, 1200, 1750, 1900, 2100, 2300, 2500, 2800, 3050,
    ];
    treePositions.forEach(tx => {
      // Alternate tree sizes; place just behind the ground (slightly above)
      const key = tx % 140 < 70 ? 'tree-lg' : 'tree-sm';
      const scale = 0.9 + (tx % 5) * 0.1;
      this.add.image(tx, GROUND_Y - 2, key)
        .setScale(scale)
        .setOrigin(0.5, 1)
        .setDepth(DEPTH_WORLD - 0.2)
        .setAlpha(0.92);
    });

    // Bushes at ground level
    const bushXs = [180, 480, 680, 1100, 1550, 2050, 2400, 2900];
    bushXs.forEach(bx => {
      this.add.image(bx, GROUND_Y, 'bush')
        .setScale(1.2 + (bx % 3) * 0.2)
        .setOrigin(0.5, 1)
        .setDepth(DEPTH_WORLD - 0.1);
    });
  }

  private addBlock(x: number, y: number, w: number, h: number): void {
    const b = this.colliders.create(x, y, '__DEFAULT') as Phaser.Physics.Arcade.Image;
    b.setDisplaySize(w, h).setVisible(false).refreshBody();
  }

  // ═══════════════════════════════════════════════════════════════════
  //  CROCS — stream crossing (now vertical, standing in water)
  // ═══════════════════════════════════════════════════════════════════
  private buildCrocs(): void {
    const crocYs = [GROUND_Y - 80, GROUND_Y - 40, GROUND_Y + 10];
    crocYs.forEach((cy, i) => {
      const cx = 808 + i * 4;
      const g = this.add.graphics().setDepth(DEPTH_WORLD + 2);
      this.drawCroc(g, cx, cy);
      this.crocs.push({ x: cx, y: cy, hit: false, img: g });
    });

    this.add.text(822, GROUND_Y - 170, '🐊 Vượt qua cá sấu!', {
      fontSize: '10px', fontFamily: 'Arial', color: '#ffcc44',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(DEPTH_UI);
  }

  private drawCroc(g: Phaser.GameObjects.Graphics, cx: number, cy: number, lit = false): void {
    g.clear();
    g.fillStyle(lit ? 0x88cc44 : 0x4a7a28);
    g.fillEllipse(cx, cy, 36, 14);
    g.fillStyle(lit ? 0xaaea66 : 0x5a8a38);
    g.fillCircle(cx + 16, cy - 2, 7);
    g.fillStyle(0xcc2200);
    g.fillRect(cx + 16, cy + 2, 10, 3);
    g.fillStyle(0xffffff);
    g.fillCircle(cx + 14, cy - 4, 2);
    g.fillStyle(0x111100);
    g.fillCircle(cx + 14, cy - 4, 1);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  DEER
  // ═══════════════════════════════════════════════════════════════════
  private buildDeer(): void {
    this.add.image(this.deerX, this.deerY + 18, 'trap').setScale(1.6).setDepth(DEPTH_WORLD);
    this.deerImg = this.add.image(this.deerX, this.deerY, 'deer').setScale(1.4).setDepth(DEPTH_WORLD + 1);

    this.deerProgressBg = this.add.rectangle(this.deerX, this.deerY - 40, 80, 10, 0x223311)
      .setStrokeStyle(1, 0x44aa22).setDepth(DEPTH_UI).setVisible(false);
    this.deerProgressFill = this.add.rectangle(this.deerX - 38, this.deerY - 40, 0, 6, 0x44ff44)
      .setDepth(DEPTH_UI + 1).setOrigin(0, 0.5).setVisible(false);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  NPCs
  // ═══════════════════════════════════════════════════════════════════
  private buildNPCs(): void {
    const defs = [
      { key: 'npc-kbroi',   x: 460,  y: GROUND_Y - 24, name: "K'Brơi",      dialog: 'gate-kbroi'    },
      { key: 'npc-amaknoi', x: 1340, y: GROUND_Y - 24, name: "Ama K'Nơi",   dialog: 'amaknoi-first' },
      { key: 'npc-yakben',  x: 1640, y: GROUND_Y - 24, name: "Bà Yă K'Ben", dialog: 'yakben-first'  },
    ];
    for (const d of defs) {
      const npc = new NPC(this, { textureKey: d.key, x: d.x, y: d.y, name: d.name, dialogKey: d.dialog });
      npc.startIdleAnim();
      this.npcs.push(npc);
    }
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

    // Y-depth sort (player/NPCs in front of ground objects)
    const depthForY = (y: number) => 2 + (y / MAP_H) * 3;
    this.player.setDepth(depthForY(py));
    for (const npc of this.npcs) { npc.setDepth(depthForY(npc.y)); }

    // Croc step
    for (const c of this.crocs) {
      if (c.hit) continue;
      if (Phaser.Math.Distance.Between(px, py, c.x, c.y) < 24) {
        c.hit = true;
        this.drawCroc(c.img, c.x, c.y, true);
        this.gs.addScore(30);
        this.tweens.add({ targets: c.img, y: c.y + 6, duration: 200, yoyo: true });
        this.burstParticles(c.x, c.y, 0x44ccff, 8);
        this.game.events.emit('notify', '+30 điểm — Nhảy qua cá sấu!', '#88ff66');
        try { this.sound.play('click', { volume: 0.3 }); } catch (_) {}
      }
    }

    // Deer rescue
    const nearDeer = !this.deerRescued &&
      Phaser.Math.Distance.Between(px, py, this.deerX, this.deerY) < 70;

    // NPC proximity
    let nearNPC: NPC | null = null;
    for (const npc of this.npcs) {
      if (npc.checkProximity(px, py)) { nearNPC = npc; break; }
    }

    // Evidence zone
    this.evidenceZoneActive = px > 2100 && px < 2800 && this.evidenceCount < this.maxEvidence;

    // Chapter-2 portal
    const nearPortal = !this.ch2PortalFired && px > 3050 && px < 3210;

    // Hint
    let hint = '';
    if (nearDeer)                         hint = this.deerRescuing ? '' : '🦌 Giữ E để gỡ bẫy cho hươu';
    else if (nearNPC && !nearNPC.isDone)  hint = `💬 E — Nói chuyện với ${nearNPC.name}`;
    else if (this.evidenceZoneActive)     hint = `📷 C — Chụp bằng chứng (${this.evidenceCount}/${this.maxEvidence})`;
    else if (nearPortal)                  hint = '➜ E — Tiếp tục sang Khu điều tra';

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
      if (nearNPC && !nearNPC.isDone) { this.startDialog(nearNPC.dialogKey, nearNPC); return; }
      if (nearPortal) { this.ch2PortalFired = true; this.goToChapter2(); return; }
    }

    // C key: photo
    if (this.player.isCameraJustPressed() && this.evidenceZoneActive) {
      this.collectEvidence(px, py);
    }

    // Deer rescue hold
    if (nearDeer) {
      this.deerProgressBg.setVisible(true);
      this.deerProgressFill.setVisible(true);
      if (this.player.isEKeyDown()) {
        this.deerRescuing = true;
        this.deerProgress += delta * 0.0006;
        if (this.deerProgress >= 1) { this.deerProgress = 1; this.rescueDeer(); }
      } else {
        this.deerRescuing = false;
        this.deerProgress = Math.max(0, this.deerProgress - delta * 0.0003);
      }
      const fill = Math.max(0, this.deerProgress) * 76;
      this.deerProgressFill.setSize(fill, 6);
    } else {
      this.deerProgressBg.setVisible(false);
      this.deerProgressFill.setVisible(false);
      if (!nearDeer) { this.deerRescuing = false; }
    }
  }

  // ─── Jump mechanic ────────────────────────────────────────────────
  private handleJump(): void {
    const body = this.playerBody;
    // Detect if on ground: touching bottom of world bounds or standing on collider
    const onGround = body.blocked.down || body.touching.down;

    if (onGround) { this.canJump = true; }

    if (this.canJump && Phaser.Input.Keyboard.JustDown(this.jumpKey)) {
      body.setVelocityY(-520);
      this.canJump = false;
      // Visual hop feedback
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
  //  EFFECTS
  // ═══════════════════════════════════════════════════════════════════
  private burstParticles(x: number, y: number, tint: number, count = 12): void {
    if (!this.textures.exists('particle-dot')) return;
    const em = this.add.particles(x, y, 'particle-dot', {
      lifespan: 700,
      speed: { min: 60, max: 160 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      tint,
      quantity: count,
      stopAfter: count,
    }).setDepth(DEPTH_FX);
    this.time.delayedCall(800, () => em.destroy());
  }

  // ═══════════════════════════════════════════════════════════════════
  //  INTERACTIONS
  // ═══════════════════════════════════════════════════════════════════
  private rescueDeer(): void {
    this.deerRescued = true;
    this.deerProgressBg.setVisible(false);
    this.deerProgressFill.setVisible(false);
    this.gs.addScore(120);
    this.gs.addTrust(15);
    this.gs.set('animalSaved', true);
    this.gs.addInventory('camera');

    this.tweens.add({
      targets: this.deerImg,
      x: this.deerX + 80, y: this.deerY - 20, alpha: 0,
      duration: 900, ease: 'Power2',
      onComplete: () => {
        this.add.text(this.deerX, this.deerY - 10, '🦌 Hươu được cứu!', {
          fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold',
          color: '#88ff66', stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(DEPTH_UI + 4);
      },
    });

    this.burstParticles(this.deerX, this.deerY, 0x88ff66, 20);
    this.burstParticles(this.deerX + 20, this.deerY - 15, 0xffd700, 12);
    this.game.events.emit('notify', '🦌 Đã cứu hươu! +120 điểm • Nhận máy ảnh', '#88ff66');
    try { this.sound.play('success', { volume: 0.5 }); } catch (_) {}
    this.time.delayedCall(3000, () => {
      this.game.events.emit('notify', 'Con hươu quay lại… dẫn đường vào rừng sâu!', '#aaccff');
    });
  }

  private collectEvidence(px: number, _py: number): void {
    const evidenceXs = [2250, 2450, 2650];
    const nearest = evidenceXs.find(ex => Math.abs(ex - px) < 80);
    if (nearest === undefined) {
      this.game.events.emit('notify', 'Di gần đến dấu vết hơn để chụp ảnh', '#ffcc44');
      return;
    }

    this.evidenceCount++;
    this.gs.set('evidenceCount', this.evidenceCount);
    this.gs.addScore(150);
    this.gs.addInventory(`evidence-ch1-${this.evidenceCount}`);

    const flash = this.add.rectangle(nearest, GROUND_Y - 60, 80, 120, 0xffffff, 0.6)
      .setDepth(DEPTH_UI + 3);
    this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });

    this.game.events.emit('notify', `📷 Bằng chứng ${this.evidenceCount}/${this.maxEvidence} — +150 điểm`, '#f5c518');
    try { this.sound.play('collect', { volume: 0.4 }); } catch (_) {}

    if (this.evidenceCount >= this.maxEvidence) {
      this.time.delayedCall(800, () => {
        this.game.events.emit('notify', '✅ Đủ bằng chứng! Tiếp tục về phía khu điều tra.', '#88ff66');
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  DIALOG
  // ═══════════════════════════════════════════════════════════════════
  private startDialog(dialogKey: string, npc: NPC | null): void {
    this.inDialog = true;
    this.player.freeze();
    this._pendingNPC = npc;
    this.scene.launch('DialogScene', { dialogKey, sourceScene: 'Chapter1Scene' });
    this.scene.pause();
  }

  private onDialogDone(result: any): void {
    this.scene.resume();
    this.inDialog = false;
    this.player.unfreeze();
    if (this._pendingNPC) { this._pendingNPC.markDone(); this._pendingNPC = null; }
    if (result?.scoreChange > 0) {
      this.game.events.emit('notify', `+${result.scoreChange} điểm!`, '#f5c518');
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  CHAPTER TRANSITION
  // ═══════════════════════════════════════════════════════════════════
  private goToChapter2(): void {
    this.gs.set('ch1Done', true);
    try { this.sound.stopAll(); } catch (_) {}
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('UIScene');
      this.scene.start('Chapter2Scene');
      this.scene.launch('UIScene');
    });
  }

  shutdown(): void {}
}
