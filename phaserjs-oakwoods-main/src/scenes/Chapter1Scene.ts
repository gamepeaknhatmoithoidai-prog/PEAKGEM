import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { Player } from '../entities/Player';
import { NPC } from '../entities/NPC';
import {
  MAP_W_CH1, DEPTH_BG, DEPTH_WORLD, DEPTH_FX, DEPTH_UI,
} from '../constants';

const MAP_H    = 540;
// Ground level: player walks on this Y (bottom ~20% of screen)
const GROUND_Y = 420;
// Playable floor height (invisible ground platform)
const FLOOR_H  = 120;

export class Chapter1Scene extends Phaser.Scene {
  private gs!: GS;
  private player!: Player;
  private npcs: NPC[] = [];
  private colliders!: Phaser.Physics.Arcade.StaticGroup;

  private ch2PortalFired = false;
  private inDialog = false;
  private _pendingNPC: NPC | null = null;
  private _lastDialogKey = '';

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

  // ── Audio ──────────────────────────────────────────────────────────────────
  // Hold a reference so we can stop / restart cleanly without calling stopAll()
  private ambientSound: Phaser.Sound.BaseSound | null = null;

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
    // this.buildDeer();
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

    this.startAmbient();
  }

  // ═══════════════════════════════════════════════════════════════════
  //  AUDIO HELPERS
  // ═══════════════════════════════════════════════════════════════════
  private startAmbient(): void {
    if (!this.cache.audio.has('forest-ambient')) return;
    // Prevent stacking: destroy any previously running instance
    if (this.ambientSound?.isPlaying) return;
    this.ambientSound = this.sound.add('forest-ambient', { loop: true, volume: 0.18 });
    this.ambientSound.play();
  }

  private stopAmbient(): void {
    if (this.ambientSound?.isPlaying) {
      this.ambientSound.stop();
    }
    this.ambientSound = null;
  }

  private playSfx(key: string, volume = 0.5): void {
    if (!this.cache.audio.has(key)) return;
    this.sound.play(key, { volume });
  }

  // ═══════════════════════════════════════════════════════════════════
  //  WORLD — Background fills the full map, no path strip
  // ═══════════════════════════════════════════════════════════════════
  private buildWorld(): void {
    this.colliders = this.physics.add.staticGroup();

    // ── Layer 0: Full background image (or procedural forest) ──────────
    if (this.textures.exists('bg-ch1')) {
      // bg-ch1.jpg is 736×414.  Use setTileScale so the tile fills the game
      // height (540 px) without leaving a gap or showing a repeated sky at
      // the bottom.  tileScale ≈ 540/414 ≈ 1.304 also widens each tile to
      // ≈ 959 px, so the pattern repeats naturally across the 3 400 px map.
      const bgScale = MAP_H / 414;
      this.add.tileSprite(MAP_W_CH1 / 2, MAP_H / 2, MAP_W_CH1, MAP_H, 'bg-ch1')
        .setDepth(DEPTH_BG)
        .setTileScale(bgScale, bgScale);
    } else {
      // Procedural full-scene forest background (fallback)
      this.buildProceduralBackground();
    }

    // ── Ground platform: invisible floor the player walks on ───────────
    this.addBlock(MAP_W_CH1 / 2, GROUND_Y + FLOOR_H / 2, MAP_W_CH1, FLOOR_H);

    // ── Mid-level platforms — physics only, no visible green boxes ──────
    // The background art already provides the visual ground; we only add
    // invisible collision blocks for the optional raised platforms.
    const platforms: { x: number; y: number; w: number }[] = [
      { x: 520,  y: GROUND_Y - 90,  w: 100 },
      { x: 900,  y: GROUND_Y - 70,  w: 80  },
      { x: 1300, y: GROUND_Y - 100, w: 120 },
      { x: 1800, y: GROUND_Y - 80,  w: 100 },
      { x: 2300, y: GROUND_Y - 90,  w: 90  },
      { x: 2700, y: GROUND_Y - 70,  w: 80  },
    ];
    for (const p of platforms) {
      this.addBlock(p.x, p.y, p.w, 14);
    }

    // ── World objects ───────────────────────────────────────────────────
    // Gate at entrance — visual only, no physics block (avoids player riding invisible box)
    if (this.textures.exists('gate'))
      this.add.image(440, GROUND_Y - 30, 'gate').setScale(1.4).setDepth(DEPTH_WORLD + 1);
    if (this.textures.exists('sign'))
      this.add.image(120, GROUND_Y - 28, 'sign').setScale(1.2).setDepth(DEPTH_WORLD);
    if (this.textures.exists('caycamlai')) {
      const cay = this.add.image(920, GROUND_Y - 80, 'caycamlai').setScale(0.2).setDepth(DEPTH_WORLD);
      try { cay.setPostPipeline('WhiteKey'); } catch (_) {}
    }

    // Village huts — visual only, no physics blocks
    if (this.textures.exists('hut')) {
      this.add.image(1320, GROUND_Y - 35, 'hut').setScale(1.3).setDepth(DEPTH_WORLD + 1);
      this.add.image(1620, GROUND_Y - 25, 'hut').setScale(1.0).setDepth(DEPTH_WORLD + 1);
    }
    if (this.textures.exists('fire-pit'))
      this.add.image(1460, GROUND_Y - 10, 'fire-pit').setScale(1.3).setDepth(DEPTH_WORLD);

    // Trees along the ground (decorative)
    this.placeGroundTrees();

    // Evidence zone: survey stakes
    if (this.textures.exists('stake')) {
      [2250, 2450, 2650].forEach((sx, i) => {
        const sy = GROUND_Y - [55, 45, 60][i];
        this.add.image(sx, sy, 'stake').setScale(1.5).setDepth(DEPTH_WORLD);
      });
    }
    if (this.textures.exists('spray-mark')) {
      this.add.image(2200, GROUND_Y - 70, 'spray-mark').setScale(1.2).setDepth(DEPTH_WORLD + 2);
      this.add.image(2700, GROUND_Y - 75, 'spray-mark').setScale(1.2).setDepth(DEPTH_WORLD + 2);
    }

    // Evidence zone warm glow overlay
    const evG = this.add.graphics().setDepth(DEPTH_BG + 1);
    evG.fillStyle(0xff8800, 0.06);
    evG.fillRect(2100, 0, 700, MAP_H);

    // Dark deep-forest overlay (from x 2100 onward)
    const deepG = this.add.graphics().setDepth(DEPTH_BG + 0.8);
    deepG.fillStyle(0x000000, 0.22);
    deepG.fillRect(2100, 0, MAP_W_CH1 - 2100, MAP_H);

    // Chapter-2 portal sign
    const portal = this.add.text(7900, GROUND_Y - 80, '➜ Khu vực điều tra\n[Nhấn E để tiếp tục]', {
      fontSize: '13px', fontFamily: 'Arial', color: '#88ccff',
      backgroundColor: '#00000099', padding: { x: 8, y: 5 },
    }).setOrigin(0.5).setDepth(DEPTH_UI);
    this.tweens.add({ targets: portal, alpha: 0.5, duration: 1000, yoyo: true, repeat: -1 });

    // Zone labels
    [
      { x: 120,  text: 'Cổng vào' },
      { x: 890,  text: 'Cây cẩm lai' },
      { x: 1450, text: 'Làng Mạ' },
      { x: 2400, text: 'Vùng lõi — Hạn chế ra vào' },
    ].forEach(l => {
      this.add.text(l.x, GROUND_Y - 140, l.text, {
        fontSize: '10px', fontFamily: 'Arial', color: '#88aa66',
        stroke: '#000', strokeThickness: 2,
      }).setDepth(DEPTH_UI);
    });

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
    const hasLg = this.textures.exists('tree-lg');
    const hasSm = this.textures.exists('tree-sm');
    if (!hasLg && !hasSm) { return; }  // skip entirely if no tree textures
    const treePositions = [
      250, 350, 600, 720, 1050, 1200, 1750, 1900, 2100, 2300, 2500, 2800, 3050,
    ];
    treePositions.forEach(tx => {
      const key = tx % 140 < 70 ? 'tree-lg' : 'tree-sm';
      if (!this.textures.exists(key)) return;
      const scale = 0.9 + (tx % 5) * 0.1;
      this.add.image(tx, GROUND_Y - 2, key)
        .setScale(scale)
        .setOrigin(0.5, 1)
        .setDepth(DEPTH_WORLD - 0.2)
        .setAlpha(0.92);
    });

    // Bushes at ground level
    if (this.textures.exists('bush')) {
      [180, 480, 680, 1100, 1550, 2050, 2400, 2900].forEach(bx => {
        this.add.image(bx, GROUND_Y, 'bush')
          .setScale(1.2 + (bx % 3) * 0.2)
          .setOrigin(0.5, 1)
          .setDepth(DEPTH_WORLD - 0.1);
      });
    }
  }

  private addBlock(x: number, y: number, w: number, h: number): void {
    const b = this.colliders.create(x, y, '__DEFAULT') as Phaser.Physics.Arcade.Image;
    b.setDisplaySize(w, h).setVisible(false).refreshBody();
  }

  // ═══════════════════════════════════════════════════════════════════
  //  DEER — moved to ./build_deer.ts
  //  To re-enable: import { buildDeer } from './build_deer';
  //  then in create():
  //    const d = buildDeer(this, this.deerX, this.deerY);
  //    this.deerImg = d.deerImg;
  //    this.deerProgressBg = d.deerProgressBg;
  //    this.deerProgressFill = d.deerProgressFill;
  // ═══════════════════════════════════════════════════════════════════
  //  NPCs
  // ═══════════════════════════════════════════════════════════════════
  private buildNPCs(): void {
    // NPC spritesheets — frame 0 = front/idle pose.
    // 3×3 sheets (kbroi, yakben): frame 682×682 px, scale 0.15 → displayed ~102 px.
    //   feet at 90 % of frame → world offset 682*0.9/2*0.15 ≈ 46 px → y = GROUND_Y - 46.
    // 4×2 sheet (amaknoi):    frame 512×1024 px, scale 0.11 → displayed ~113 px tall.
    //   feet at 90 % of frame → world offset 1024*0.9/2*0.11 ≈ 51 px → y = GROUND_Y - 51.
    const defs = [
      { key: 'npc-kbroi',   x: 460,  y: GROUND_Y - 46, name: "K'Brơi",      dialog: 'gate-kbroi',    scale: 0.15 },
      { key: 'npc-amaknoi', x: 1800, y: GROUND_Y - 46, name: "Ama K'Nơi",   dialog: 'amaknoi-first', scale: 0.15 },
      { key: 'npc-yakben',  x: 1340, y: GROUND_Y - 46, name: "Bà Yă K'Ben", dialog: 'yakben-first',  scale: 0.15 },
    ];
    for (const d of defs) {
      const npc = new NPC(this, { textureKey: d.key, x: d.x, y: d.y, name: d.name, dialogKey: d.dialog, scale: d.scale });
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

    // Deer rescue — only active when buildDeer() has been called
    const deerEnabled = !!this.deerImg;
    const nearDeer = deerEnabled && !this.deerRescued &&
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
    else if (nearNPC && !nearNPC.isDone)  hint = `💬 E — Nói chuyện với ${nearNPC.npcName}`;
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
    if (deerEnabled) {
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
        this.deerRescuing = false;
      }
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
      this.playSfx('jump', 0.35);
      // Visual hop feedback — use relative scale so real sprites (scale ~0.083)
      // don't explode to 85% of screen height
      this.tweens.add({
        targets: this.player,
        scaleY: this.player.scaleY * 0.85,
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
    this.playSfx('collect', 0.45);  // item received in inventory
    this.time.delayedCall(300, () => this.playSfx('success', 0.5)); // task complete fanfare
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
    this.playSfx('camera', 0.5);   // shutter click on photo
    this.time.delayedCall(200, () => this.playSfx('collect', 0.35)); // evidence item added

    if (this.evidenceCount >= this.maxEvidence) {
      this.time.delayedCall(800, () => {
        this.game.events.emit('notify', '✅ Đủ bằng chứng! Tiếp tục về phía khu điều tra.', '#88ff66');
        this.playSfx('success', 0.5); // all evidence collected — mission step done
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  DIALOG
  // ═══════════════════════════════════════════════════════════════════
  // Start dialog (conversation) 
  private startDialog(dialogKey: string, npc: NPC | null): void {
    this.inDialog = true;
    this.player.freeze();
    this._pendingNPC = npc;
    this._lastDialogKey = dialogKey;
    this.scene.launch('DialogScene', { dialogKey, sourceScene: 'Chapter1Scene' });
    this.scene.pause();
  }

  private showConclusion(text: string): void {
    const cam = this.cameras.main;
    const cx = cam.width / 2;
    const cy = cam.height / 2;

    const overlay = this.add.rectangle(cx, cy, cam.width, cam.height, 0x000000, 0.55)
      .setDepth(DEPTH_UI + 20).setScrollFactor(0).setInteractive();

    const box = this.add.rectangle(cx, cy, 560, 220, 0x1a1a1a, 0.95)
      .setStrokeStyle(2, 0xf5c518)
      .setDepth(DEPTH_UI + 21).setScrollFactor(0);

    const label = this.add.text(cx, cy, text, {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffeebb',
      align: 'center', wordWrap: { width: 520 },
      lineSpacing: 4,
    }).setOrigin(0.5).setDepth(DEPTH_UI + 22).setScrollFactor(0);

    const hint = this.add.text(cx, cy + 95, '[Nhấn bất kỳ phím nào để tiếp tục]', {
      fontSize: '11px', fontFamily: 'Arial', color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(DEPTH_UI + 22).setScrollFactor(0);

    const close = () => {
      overlay.destroy(); box.destroy(); label.destroy(); hint.destroy();
      this.input.keyboard?.off('keydown', close);
    };
    overlay.on('pointerdown', close);
    this.input.keyboard?.once('keydown', close);
  }

  private onDialogDone(result: any): void {
    this.scene.resume();
    this.inDialog = false;
    this.player.unfreeze();

    if (this._pendingNPC) {
      const npc = this._pendingNPC;
      const finishedKey = this._lastDialogKey;
      this._pendingNPC = null;
      npc.markDone();

      if (npc.npcName === "K'Brơi") {
        if (finishedKey === 'gate-kbroi') {
          npc.walkTo(920);
          this.time.delayedCall(5000, () => {
            npc.setDialogKey('plant-intro');   // bật lại "!" với dialog mới
          });
        } else if (finishedKey === 'plant-intro') {
          npc.walkTo(1300, 60, () => {
            const yakben = this.npcs.find(n => n.npcName === "Bà Yă K'Ben");
            if (yakben) yakben.setDialogKey('scene_1_2');
          });
        }
      }

      if (finishedKey === 'scene_1_2') {
        this.time.delayedCall(300, () => {
          this.showConclusion(
            '📖 KẾT LUẬN — Rừng trong sợi vải — Người Mạ\n\n' +
            'Với người Mạ, thổ cẩm không phải đồ thủ công — đó là ngôn ngữ. ' +
            'Mỗi hoa văn là một ký ức sinh thái. Khi một loài cây mất đi, màu nhuộm mất — ' +
            'và một phần ngôn ngữ cộng đồng cũng biến mất.'
          );
        });
      }
    }
    if (result?.scoreChange > 0) {
      this.game.events.emit('notify', `+${result.scoreChange} điểm!`, '#f5c518');
    }

  }

  // ═══════════════════════════════════════════════════════════════════
  //  CHAPTER TRANSITION
  // ═══════════════════════════════════════════════════════════════════
  private goToChapter2(): void {
    this.gs.set('ch1Done', true);
    this.stopAmbient();
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('UIScene');
      this.scene.start('Chapter2Scene');
      this.scene.launch('UIScene');
    });
  }

  shutdown(): void {
    this.stopAmbient();
  }


  
}
