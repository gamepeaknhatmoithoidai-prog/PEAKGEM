/**
 * C2Scene1Investigation — Chapter 2, Scene 1: Thu Thập Manh Mối
 *
 * Flow: Intro Dialogue → Gameplay (walk over 4 clues) → Post-Game Dialogue → C2S2Runner
 *
 * Objects sit ON the ground at scale 0.20.
 * Pickup requires standing near object and pressing E.
 */
import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { Player } from '../entities/Player';
import { W, H, DEPTH_BG, DEPTH_WORLD, DEPTH_UI } from '../constants';

const GROUND_Y = 420;
const FLOOR_H  = 120;
const MAP_W    = 2600;

// ── Clue definitions ─────────────────────────────────────────────────────────
interface ClueData {
  id:         string;
  textureKey: string;
  label:      string;
  vname:      string;
  x:          number;
  y:          number;
  scale:      number;
}

const CLUE_DEFS: ClueData[] = [
  { id: 'tape',   textureKey: 'stuff-tape',   label: 'Thước dây',    vname: 'Thước dây đo đất',       x:  450 , y : -5 , scale: 0.05 },
  { id: 'gps',    textureKey: 'stuff-gps',    label: 'Thiết bị GPS', vname: 'Thiết bị định vị GPS',    x:  920 , y : 0 , scale: 0.05 },
  { id: 'tree',   textureKey: 'stuff-tree',   label: 'Cây đánh dấu', vname: 'Cây rừng có ký hiệu đỏ',  x: 1420,  y : 0 , scale: 0.1 },
  { id: 'gloves', textureKey: 'stuff-gloves', label: 'Găng tay',     vname: 'Găng tay bỏ lại',         x: 1960 , y : 0 , scale: 0.05 },
];

interface ClueInstance extends ClueData {
  collected:  boolean;
  sprite:     Phaser.Physics.Arcade.Image | null;
  ringGfx:    Phaser.GameObjects.Graphics | null;
  labelGfx:   Phaser.GameObjects.Text | null;
  checkText:  Phaser.GameObjects.Text | null;
}

type Phase = 'intro' | 'gameplay' | 'postgame' | 'done';

export class C2Scene1Investigation extends Phaser.Scene {
  private gs!: GS;
  private player!: Player;
  private colliders!: Phaser.Physics.Arcade.StaticGroup;
  private clueGroup!: Phaser.Physics.Arcade.StaticGroup;
  private clues: ClueInstance[] = [];
  private playerBody!: Phaser.Physics.Arcade.Body;
  private jumpKey!: Phaser.Input.Keyboard.Key;
  private canJump = true;

  private phase: Phase = 'intro';
  private eKey!:         Phaser.Input.Keyboard.Key;
  private hintText!:     Phaser.GameObjects.Text;
  private checklistRows: Phaser.GameObjects.Text[] = [];

  constructor() { super('C2S1Investigation'); }

  // ═══════════════════════════════════════════════════════════════════
  //  CREATE
  // ═══════════════════════════════════════════════════════════════════
  create(): void {
    this.gs = new GS(this.registry);
    this.phase = 'intro';
    this.clues = [];
    this.checklistRows = [];
    this.canJump = true;

    this.physics.world.gravity.y = 800;
    this.physics.world.setBounds(0, 0, MAP_W, H);

    this.buildBackground();
    this.buildGround();
    this.buildClues();
    this.buildEndMarker();

    const gender = this.gs.get('gender') || 'male';
    this.player = new Player(this, 80, GROUND_Y - 60, gender);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(true);
    this.playerBody.setMaxVelocityY(900);

    this.jumpKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.eKey    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.cameras.main.setBounds(0, 0, MAP_W, H);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.fadeIn(700);

    // Ground collider for player
    this.physics.add.collider(this.player, this.colliders, () => { this.canJump = true; });

    this.buildChecklistUI();
    this.buildHintText();
    this.buildSceneLabel();

    this.events.on('dialog-done', this.onDialogDone, this);

    this.player.freeze();
    this.time.delayedCall(500, () => this.launchDialog('c2s1-intro'));

    try { this.sound.play('forest-ambient', { loop: true, volume: 0.12 }); } catch (_) {}
  }

  // ── Background ──────────────────────────────────────────────────────
  private buildBackground(): void {
    const bgKey = this.textures.exists('bg-c2-real') ? 'bg-c2-real'
                : this.textures.exists('bg-ch2')     ? 'bg-ch2'
                : null;

    if (bgKey) {
      const tex = this.textures.get(bgKey).getSourceImage() as HTMLImageElement;
      const s   = tex.height > 0 ? H / tex.height : 1;
      this.add.tileSprite(MAP_W / 2, H / 2, MAP_W, H, bgKey)
        .setDepth(DEPTH_BG).setTileScale(s, s);
    } else {
      // Simple procedural night sky — NO tree silhouettes to avoid visual artifacts
      const bg = this.add.graphics().setDepth(DEPTH_BG);
      bg.fillGradientStyle(0x010306, 0x010306, 0x0a1505, 0x0a1505, 1);
      bg.fillRect(0, 0, MAP_W, H);
      // Stars
      const rng = new Phaser.Math.RandomDataGenerator(['c2s1']);
      bg.fillStyle(0xffffff, 0.35);
      for (let s = 0; s < 120; s++) {
        bg.fillCircle(
          rng.integerInRange(0, MAP_W),
          rng.integerInRange(0, H * 0.55),
          0.6 + rng.frac() * 0.8
        );
      }
    }
  }

  // ── Ground ──────────────────────────────────────────────────────────
  private buildGround(): void {
    // Physics ground
    this.colliders = this.physics.add.staticGroup();
    const floor = this.colliders.create(MAP_W / 2, GROUND_Y + FLOOR_H / 2, '__DEFAULT') as Phaser.Physics.Arcade.Image;
    floor.setDisplaySize(MAP_W, FLOOR_H).setVisible(false).refreshBody();

    // Visual ground
    const gfx = this.add.graphics().setDepth(DEPTH_WORLD - 0.5);
    gfx.fillStyle(0x1a3a10); gfx.fillRect(0, GROUND_Y, MAP_W, FLOOR_H);
    gfx.fillStyle(0x2a5a1a); gfx.fillRect(0, GROUND_Y, MAP_W, 10);
    gfx.fillStyle(0x3a7a22);
    for (let x = 0; x < MAP_W; x += 8) {
      const gh = 6 + (x % 7);
      gfx.fillTriangle(x, GROUND_Y, x + 5, GROUND_Y, x + 2, GROUND_Y - gh);
    }
  }

  // ── Clue objects: sit on ground, E-key proximity pickup ──────────────
  private buildClues(): void {
    this.clueGroup = this.physics.add.staticGroup();

    for (let i = 0; i < CLUE_DEFS.length; i++) {
      const d = CLUE_DEFS[i];

      const clueY = GROUND_Y - d.y;

      // ── Physics sprite: bottom of image sits on clue-specific height ──
      const spr = this.clueGroup.create(d.x, clueY, d.textureKey) as Phaser.Physics.Arcade.Image;
      spr.setScale(d.scale).setOrigin(0.5, 1).setDepth(DEPTH_WORLD + 1);
      spr.refreshBody();   // recompute body for new scale + origin
      try { spr.setPostPipeline('WhiteKey'); } catch (_) {}

      // ── Ground shadow (flat ellipse under the item) ──
      const ringGfx = this.add.graphics().setDepth(DEPTH_WORLD + 0.5);
      ringGfx.fillStyle(0x000000, 0.22);
      ringGfx.fillEllipse(d.x, clueY - 4, 52, 14);
      ringGfx.lineStyle(2, 0xffcc44, 0.75);
      ringGfx.strokeEllipse(d.x, clueY - 4, 54, 16);
      this.tweens.add({ targets: ringGfx, alpha: 0.25, duration: 900, yoyo: true, repeat: -1 });

      // ── Floating label above item ──
      const labelGfx = this.add.text(d.x, clueY - 78, d.label, {
        fontSize: '10px', fontFamily: 'Arial', fontStyle: 'bold',
        color: '#ffcc44', stroke: '#000', strokeThickness: 2,
        backgroundColor: '#00000099', padding: { x: 4, y: 2 },
      }).setOrigin(0.5).setDepth(DEPTH_WORLD + 2);
      this.tweens.add({ targets: labelGfx, y: clueY - 84, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

      this.clues.push({ ...d, collected: false, sprite: spr, ringGfx, labelGfx, checkText: null });
    }
  }

  // ── End portal (hidden until all clues collected) ────────────────────
  private buildEndMarker(): void {
    const g = this.add.graphics().setAlpha(0).setDepth(DEPTH_WORLD + 2);
    g.lineStyle(3, 0x88ccff, 0.9);
    g.strokeCircle(MAP_W - 100, GROUND_Y - 65, 36);
    g.fillStyle(0x88ccff, 0.22);
    g.fillCircle(MAP_W - 100, GROUND_Y - 65, 36);
    (this as any)._endGfx = g;

    const arrow = this.add.text(MAP_W - 100, GROUND_Y - 65, '→', {
      fontSize: '26px', fontFamily: 'Arial', color: '#88ccff',
    }).setOrigin(0.5).setAlpha(0).setDepth(DEPTH_WORLD + 3);
    (this as any)._endArrow = arrow;
    this.tweens.add({ targets: arrow, y: GROUND_Y - 72, duration: 750, yoyo: true, repeat: -1 });

    const hint = this.add.text(MAP_W - 100, GROUND_Y - 112, 'Tiếp tục\n[E]', {
      fontSize: '11px', fontFamily: 'Arial', color: '#88ccff', align: 'center',
      backgroundColor: '#00000099', padding: { x: 5, y: 3 },
    }).setOrigin(0.5).setAlpha(0).setDepth(DEPTH_UI);
    this.tweens.add({ targets: hint, alpha: 0.5, duration: 900, yoyo: true, repeat: -1 });
    (this as any)._endHint = hint;
  }

  private revealEndPortal(): void {
    this.tweens.add({
      targets: [(this as any)._endGfx, (this as any)._endArrow, (this as any)._endHint],
      alpha: 1, duration: 600,
    });
  }

  // ── Checklist UI (top-right) ─────────────────────────────────────────
  private buildChecklistUI(): void {
    const px = W - 202, py = 38, pw = 192, ph = 112;
    this.add.rectangle(px + pw / 2, py + ph / 2, pw, ph, 0x000000, 0.78)
      .setStrokeStyle(1.5, 0x88ccff).setDepth(DEPTH_UI).setScrollFactor(0);
    this.add.text(px + 8, py + 6, '🔍 MANH MỐI', {
      fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold', color: '#88ccff',
    }).setDepth(DEPTH_UI).setScrollFactor(0);

    CLUE_DEFS.forEach((d, i) => {
      const t = this.add.text(px + 8, py + 26 + i * 22, `□  ${d.label}`, {
        fontSize: '11px', fontFamily: 'Arial', color: '#999999',
      }).setDepth(DEPTH_UI).setScrollFactor(0);
      this.checklistRows.push(t);
      this.clues[i].checkText = t;
    });
  }

  private buildHintText(): void {
    this.hintText = this.add.text(0, 0, '', {
      fontSize: '13px', fontFamily: 'Arial', color: '#ffffaa',
      backgroundColor: '#00000099', padding: { x: 7, y: 4 },
    }).setDepth(DEPTH_UI + 5).setScrollFactor(0).setVisible(false);
  }

  private buildSceneLabel(): void {
    this.add.text(W / 2, 10, 'Chương 2 — Cảnh 1: Thu Thập Manh Mối', {
      fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#ccddff', stroke: '#000', strokeThickness: 2,
      backgroundColor: '#00000066', padding: { x: 8, y: 3 },
    }).setOrigin(0.5, 0).setDepth(DEPTH_UI).setScrollFactor(0);

    // Pickup instruction
    this.add.text(W / 2, H - 18, 'Đứng gần vật phẩm → Nhấn E để nhặt  |  E  tiếp tục', {
      fontSize: '11px', fontFamily: 'Arial', color: '#aabbaa',
    }).setOrigin(0.5).setDepth(DEPTH_UI).setScrollFactor(0);
  }

  // ── Dialog helpers ────────────────────────────────────────────────────
  private launchDialog(key: string): void {
    this.scene.launch('DialogScene', { dialogKey: key, sourceScene: 'C2S1Investigation' });
    this.scene.pause();
  }

  private onDialogDone(_result: unknown): void {
    this.scene.resume();
    if (this.phase === 'intro') {
      this.phase = 'gameplay';
      this.player.unfreeze();
      this.game.events.emit('notify', 'Đi qua vật phẩm để nhặt 4 manh mối!', '#88ccff');
    } else if (this.phase === 'postgame') {
      this.phase = 'done';
      this.goToScene2();
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  UPDATE
  // ═══════════════════════════════════════════════════════════════════
  update(_t: number, delta: number): void {
    if (this.phase !== 'gameplay') return;

    this.player.update(delta);
    this.handleJump();

    const px = this.player.x;
    const py = this.player.y;
    this.player.setDepth(2 + (py / H) * 3);

    const allDone = this.clues.every(c => c.collected);
    const nearEnd = allDone && px > MAP_W - 200;

    // --- Proximity + E-key pickup ---
    let nearClue: ClueInstance | null = null;
    if (!allDone) {
      for (const c of this.clues) {
        if (!c.collected && Phaser.Math.Distance.Between(px, py, c.x, GROUND_Y - c.y) < 80) {
          nearClue = c;
          break;
        }
      }
    }

    // Collect on E press when standing next to a clue
    const ePressed = Phaser.Input.Keyboard.JustDown(this.eKey);
    if (nearClue && ePressed) {
      this.collectClue(nearClue);
      nearClue = null;
    }

    // Build hint text
    let hint = '';
    if (nearClue) {
      hint = `E — Nhặt: ${nearClue.label}`;
    } else if (nearEnd) {
      hint = '→  E — Tiếp tục sang Cảnh 2';
    }

    if (hint) {
      const cam = this.cameras.main;
      const sx  = (px - cam.scrollX) * cam.zoom;
      const sy  = (py - cam.scrollY) * cam.zoom - 60;
      this.hintText.setText(hint).setVisible(true)
        .setPosition(sx - this.hintText.width / 2, sy);
    } else {
      this.hintText.setVisible(false);
    }

    // E key: end portal
    if (ePressed && nearEnd) {
      this.beginPostGame();
    }
  }

  // ── E-key pickup ─────────────────────────────────────────────────────
  private collectClue(clue: ClueInstance): void {
    clue.collected = true;

    // Disable physics body so no second pickup triggers
    if (clue.sprite?.body) {
      (clue.sprite.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    }

    // Pop-and-fade animation, then destroy
    if (clue.sprite) {
      this.tweens.add({
        targets: clue.sprite,
        scaleX: clue.sprite.scaleX * 1.25,
        scaleY: clue.sprite.scaleY * 1.25,
        alpha: 0,
        duration: 260,
        onComplete: () => { clue.sprite?.destroy(); clue.sprite = null; },
      });
    }

    // Remove ring & label
    if (clue.ringGfx) { this.tweens.killTweensOf(clue.ringGfx); clue.ringGfx.destroy(); clue.ringGfx = null; }
    if (clue.labelGfx) { this.tweens.killTweensOf(clue.labelGfx); clue.labelGfx.destroy(); clue.labelGfx = null; }

    // Collect flash
    const flash = this.add.rectangle(clue.x, GROUND_Y - clue.y - 24, 64, 48, 0xffffff, 0.75).setDepth(20);
    this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });

    // Update checklist
    if (clue.checkText) clue.checkText.setText(`✓  ${clue.label}`).setColor('#88ff66');
    this.gs.addInventory(clue.id);

    this.game.events.emit('notify', `🔍 Thu thập: ${clue.vname}`, '#f5c518');
    try { this.sound.play('collect', { volume: 0.45 }); } catch (_) {}

    // All 4 collected → award +15 and reveal portal
    if (this.clues.every(c => c.collected)) {
      this.gs.addScore(15);
      this.time.delayedCall(350, () => {
        this.game.events.emit('notify', '✅ Thu thập đủ 4 manh mối! +15 điểm — Tiếp tục →', '#88ff66');
        try { this.sound.play('success', { volume: 0.45 }); } catch (_) {}
        this.revealEndPortal();
      });
    }
  }

  // ── Begin post-game dialogue ──────────────────────────────────────────
  private beginPostGame(): void {
    this.phase = 'postgame';
    this.hintText.setVisible(false);
    this.player.freeze();
    this.time.delayedCall(300, () => this.launchDialog('c2s1-postgame'));
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

  // ── Scene transition ─────────────────────────────────────────────────
  private goToScene2(): void {
    this.gs.set('c2Progress', 1);
    try { this.sound.stopAll(); } catch (_) {}
    this.cameras.main.fadeOut(700, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('C2S2Runner');
    });
  }

  shutdown(): void {
    this.events.off('dialog-done', this.onDialogDone, this);
  }
}
