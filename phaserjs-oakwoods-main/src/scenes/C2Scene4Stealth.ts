/**
 * C2Scene4Stealth — Chapter 2, Scene 4: Ẩn Náu & Đối Chất
 *
 * Flow: Intro Dialogue → Slow walk through forest → Talk to 3 NPCs → EndingScene
 *
 * Design spec:
 *  - Movement capped at ~80 px/s (stealth pace — no guard, no detection)
 *  - Talk to Lan, Hùng, Nguyễn Văn Thắng
 *  - After 2+ dialogues the exit portal unlocks → EndingScene
 */
import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { Player } from '../entities/Player';
import { NPC } from '../entities/NPC';
import { W, H, DEPTH_BG, DEPTH_WORLD, DEPTH_UI } from '../constants';

// ── Layout ────────────────────────────────────────────────────────────────────
const GROUND_Y = 420;
const FLOOR_H  = 120;
const MAP_W    = 3200;

// ── Stealth walk speed cap ────────────────────────────────────────────────────
const STEALTH_MAX_VX = 80;   // px/s — enforced after player.update()

// ── NPC positions ─────────────────────────────────────────────────────────────
const NPC_DEFS = [
  { key: 'npc-lan',   x:  460, y: GROUND_Y - 46, name: 'Lan',              dialog: 'ch2-lan',   scale: 0.15 },
  { key: 'npc-hung',  x: 1700, y: GROUND_Y - 46, name: 'Hùng',             dialog: 'ch2-hung',  scale: 0.15 },
  { key: 'npc-thang', x: 2600, y: GROUND_Y - 46, name: 'Nguyễn Văn Thắng', dialog: 'ch2-thang', scale: 0.15 },
] as const;

export class C2Scene4Stealth extends Phaser.Scene {
  private gs!: GS;
  private player!: Player;
  private colliders!: Phaser.Physics.Arcade.StaticGroup;
  private npcs: NPC[] = [];
  private playerBody!: Phaser.Physics.Arcade.Body;
  private jumpKey!: Phaser.Input.Keyboard.Key;
  private canJump = true;

  // UI
  private hintText!:      Phaser.GameObjects.Text;
  private progressLabel!: Phaser.GameObjects.Text;

  // State
  private introShown       = false;
  private inDialog         = false;
  private dialogsDone: Set<string> = new Set();
  private portalUnlocked   = false;
  private transitionStarted = false;
  private _pendingNPC: NPC | null = null;

  constructor() { super('C2S4Stealth'); }

  // ═══════════════════════════════════════════════════════════════════
  //  CREATE
  // ═══════════════════════════════════════════════════════════════════
  create(): void {
    this.gs = new GS(this.registry);
    this.introShown = false;
    this.inDialog = false;
    this.dialogsDone = new Set();
    this.portalUnlocked = false;
    this.transitionStarted = false;
    this._pendingNPC = null;
    this.npcs = [];

    this.physics.world.gravity.y = 800;
    this.physics.world.setBounds(0, 0, MAP_W, H);

    this.buildBackground();
    this.buildGround();
    this.buildDecor();
    this.buildNPCs();
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

    this.buildHintText();
    this.buildProgressUI();
    this.buildSceneTitle();

    this.events.on('dialog-done', this.onDialogDone, this);
    this.events.on('choice-made', this.onChoiceMade, this);

    this.time.delayedCall(400, () => this.startIntroDialog());

    try { this.sound.play('forest-ambient', { loop: true, volume: 0.10 }); } catch (_) {}
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
      bg.fillStyle(0x010204); bg.fillRect(0, 0, MAP_W, H);
      bg.fillStyle(0x080f03); bg.fillRect(0, GROUND_Y - 20, MAP_W, H);
      bg.fillStyle(0x040a02);
      for (let x = 0; x < MAP_W; x += 80) {
        const ch = 120 + (x % 80);
        bg.fillCircle(x + 40, GROUND_Y - ch, 36 + (x % 24));
        bg.fillRect(x + 34, GROUND_Y - 55, 12, 55);
      }
    }
    // Night overlay
    const night = this.add.graphics().setDepth(DEPTH_BG + 0.3);
    night.fillStyle(0x00001a, 0.30);
    night.fillRect(0, 0, MAP_W, H);
  }

  // ── Ground ──────────────────────────────────────────────────────────
  private buildGround(): void {
    this.colliders = this.physics.add.staticGroup();
    const floor = this.colliders.create(MAP_W / 2, GROUND_Y + FLOOR_H / 2, '__DEFAULT') as Phaser.Physics.Arcade.Image;
    floor.setDisplaySize(MAP_W, FLOOR_H).setVisible(false).refreshBody();

    const gfx = this.add.graphics().setDepth(DEPTH_WORLD - 0.5);
    gfx.fillStyle(0x111e0a); gfx.fillRect(0, GROUND_Y, MAP_W, FLOOR_H);
    gfx.fillStyle(0x1e3510); gfx.fillRect(0, GROUND_Y, MAP_W, 8);
    gfx.fillStyle(0x2a4a18);
    for (let x = 0; x < MAP_W; x += 9) {
      const gh = 5 + (x % 6);
      gfx.fillTriangle(x, GROUND_Y, x + 6, GROUND_Y, x + 3, GROUND_Y - gh);
    }
  }

  // ── Decorative scene elements ────────────────────────────────────────
  private buildDecor(): void {
    const gfx = this.add.graphics().setDepth(DEPTH_WORLD - 0.1);

    // Heavy machinery silhouette (right side)
    gfx.fillStyle(0x1a1a10);
    gfx.fillRect(2400, GROUND_Y - 110, 180, 100);
    gfx.fillRect(2460, GROUND_Y - 140, 50, 32);
    gfx.fillStyle(0x282820);
    gfx.fillRect(2406, GROUND_Y - 106, 168, 94);

    // Blinking red light
    const redLight = this.add.graphics().setDepth(DEPTH_WORLD + 0.5);
    redLight.fillStyle(0xff2200, 0.8);
    redLight.fillCircle(2570, GROUND_Y - 115, 6);
    this.tweens.add({ targets: redLight, alpha: 0.1, duration: 600, yoyo: true, repeat: -1 });

    // Warning tape
    gfx.fillStyle(0xffcc00, 0.7); gfx.fillRect(700, GROUND_Y - 12, MAP_W - 700, 5);
    gfx.fillStyle(0x000000, 0.5);
    for (let x = 700; x < MAP_W; x += 20) {
      gfx.fillRect(x, GROUND_Y - 12, 10, 5);
    }

    // Bush clusters for atmosphere
    [320, 660, 1100, 1560, 2050, 2450, 2900].forEach(bx => {
      const bush = this.add.graphics().setDepth(DEPTH_WORLD + 0.2);
      bush.fillStyle(0x0d2a08, 0.95);
      bush.fillEllipse(bx, GROUND_Y - 22, 70, 40);
      bush.fillEllipse(bx + 20, GROUND_Y - 30, 50, 38);
    });
  }

  // ── NPCs ─────────────────────────────────────────────────────────────
  private buildNPCs(): void {
    for (const d of NPC_DEFS) {
      const npc = new NPC(this, {
        textureKey: d.key, x: d.x, y: d.y,
        name: d.name, dialogKey: d.dialog, scale: d.scale,
      });
      npc.startIdleAnim();
      this.npcs.push(npc);
    }
  }

  // ── End portal ───────────────────────────────────────────────────────
  private buildEndMarker(): void {
    const g = this.add.graphics().setDepth(DEPTH_WORLD + 2).setAlpha(0);
    g.lineStyle(3, 0xffcc44, 0.9);
    g.strokeCircle(MAP_W - 100, GROUND_Y - 60, 36);
    g.fillStyle(0xffcc44, 0.2);
    g.fillCircle(MAP_W - 100, GROUND_Y - 60, 36);
    (this as any)._endGfx = g;

    const lbl = this.add.text(MAP_W - 100, GROUND_Y - 60, '⭐', {
      fontSize: '24px', fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(DEPTH_WORLD + 3).setAlpha(0);
    (this as any)._endLbl = lbl;

    const hint = this.add.text(MAP_W - 100, GROUND_Y - 110, 'Kết thúc\n[E]', {
      fontSize: '11px', fontFamily: 'Arial', color: '#ffcc44', align: 'center',
      backgroundColor: '#00000088', padding: { x: 5, y: 3 },
    }).setOrigin(0.5).setDepth(DEPTH_UI).setAlpha(0);
    this.tweens.add({ targets: hint, alpha: 0.5, duration: 900, yoyo: true, repeat: -1 });
    (this as any)._endHint = hint;
  }

  private revealEndPortal(): void {
    const g    = (this as any)._endGfx as Phaser.GameObjects.Graphics;
    const lbl  = (this as any)._endLbl as Phaser.GameObjects.Text;
    const hint = (this as any)._endHint as Phaser.GameObjects.Text;
    this.tweens.add({ targets: [g, lbl, hint], alpha: 1, duration: 600 });
    this.tweens.add({ targets: lbl, y: GROUND_Y - 68, duration: 700, yoyo: true, repeat: -1 });
    this.portalUnlocked = true;
  }

  // ── UI ────────────────────────────────────────────────────────────────
  private buildHintText(): void {
    this.hintText = this.add.text(0, 0, '', {
      fontSize: '13px', fontFamily: 'Arial', color: '#ffffaa',
      backgroundColor: '#00000099', padding: { x: 7, y: 4 },
    }).setDepth(DEPTH_UI + 5).setScrollFactor(0).setVisible(false);
  }

  private buildProgressUI(): void {
    this.progressLabel = this.add.text(W - 14, 38, '', {
      fontSize: '11px', fontFamily: 'Arial', color: '#cceeaa',
      align: 'right', backgroundColor: '#00000066', padding: { x: 6, y: 3 },
    }).setOrigin(1, 0).setDepth(DEPTH_UI).setScrollFactor(0);
    this.refreshProgressLabel();
  }

  private buildSceneTitle(): void {
    this.add.text(W / 2, 10, 'Chương 2 — Cảnh 4: Ẩn Náu & Đối Chất', {
      fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#ccddff', stroke: '#000', strokeThickness: 2,
      backgroundColor: '#00000066', padding: { x: 8, y: 3 },
    }).setOrigin(0.5, 0).setDepth(DEPTH_UI).setScrollFactor(0);
  }

  private refreshProgressLabel(): void {
    const count = this.dialogsDone.size;
    const total = NPC_DEFS.length;
    this.progressLabel.setText(`Đã gặp: ${count}/${total} nhân vật`);
    if (count >= 2 && !this.portalUnlocked) {
      this.revealEndPortal();
      this.game.events.emit('notify', '✅ Đủ thông tin! Tiếp tục ra cổng thoát →', '#88ff66');
    }
  }

  // ── Intro dialog ─────────────────────────────────────────────────────
  private startIntroDialog(): void {
    this.inDialog = true;
    this.player.freeze();
    this.scene.launch('DialogScene', { dialogKey: 'c2s4-intro', sourceScene: 'C2S4Stealth' });
    this.scene.pause();
  }

  // ── Dialog events ────────────────────────────────────────────────────
  private onDialogDone(_result: unknown): void {
    this.scene.resume();
    this.inDialog = false;
    this.player.unfreeze();

    if (!this.introShown) {
      this.introShown = true;
      this.game.events.emit('notify', 'Di chuyển chậm rãi. Tìm và nói chuyện với các nhân vật [E]', '#88ccff');
      return;
    }

    if (this._pendingNPC) {
      this.dialogsDone.add(this._pendingNPC.npcName);
      this._pendingNPC.markDone();
      this._pendingNPC = null;
      this.refreshProgressLabel();
    }
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
  //  UPDATE
  // ═══════════════════════════════════════════════════════════════════
  update(_t: number, delta: number): void {
    if (this.inDialog || this.transitionStarted) return;

    this.player.update(delta);
    this.handleJump();

    // Stealth pace: cap horizontal velocity
    const vx = this.playerBody.velocity.x;
    if (Math.abs(vx) > STEALTH_MAX_VX) {
      this.playerBody.setVelocityX(Math.sign(vx) * STEALTH_MAX_VX);
    }

    const px = this.player.x;
    const py = this.player.y;
    this.player.setDepth(2 + (py / H) * 3);
    for (const npc of this.npcs) { npc.setDepth(2 + (npc.y / H) * 3); }

    // NPC proximity check
    let nearNPC: NPC | null = null;
    for (const npc of this.npcs) {
      if (npc.checkProximity(px, py)) { nearNPC = npc; break; }
    }

    const nearPortal = this.portalUnlocked && px > MAP_W - 200;

    // Hint text
    let hint = '';
    if (nearNPC && !nearNPC.isDone) hint = `💬 E — Nói chuyện với ${nearNPC.npcName}`;
    else if (nearPortal)            hint = '⭐ E — Kết thúc & xem kết quả';
    else                            hint = '→ Tìm và nói chuyện với các nhân vật';

    if (hint) {
      const cam = this.cameras.main;
      const sx = (px - cam.scrollX) * cam.zoom;
      const sy = (py - cam.scrollY) * cam.zoom - 58;
      this.hintText.setText(hint).setVisible(true)
        .setPosition(sx - this.hintText.width / 2, sy);
    } else {
      this.hintText.setVisible(false);
    }

    // E key interactions
    if (this.player.isInteractJustPressed()) {
      if (nearNPC && !nearNPC.isDone) {
        this.startNPCDialog(nearNPC.dialogKey, nearNPC);
      } else if (nearPortal) {
        this.goToEnding();
      }
    }
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

  // ── NPC dialog ────────────────────────────────────────────────────────
  private startNPCDialog(dialogKey: string, npc: NPC): void {
    this.inDialog = true;
    this.player.freeze();
    this._pendingNPC = npc;
    this.scene.launch('DialogScene', { dialogKey, sourceScene: 'C2S4Stealth' });
    this.scene.pause();
  }

  // ── End game ──────────────────────────────────────────────────────────
  private goToEnding(): void {
    if (this.transitionStarted) return;
    this.transitionStarted = true;
    this.gs.set('c2Progress', 4);
    try { this.sound.stopAll(); } catch (_) {}
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('UIScene');
      this.scene.start('EndingScene');
    });
  }

  // ── Cleanup ──────────────────────────────────────────────────────────
  shutdown(): void {
    this.events.off('dialog-done', this.onDialogDone, this);
    this.events.off('choice-made', this.onChoiceMade, this);
  }
}
