/**
 * MiniGameCrocodile — Vượt Suối (Standalone scene, in Chapter2 sequence)
 *
 * Thuận jumps across moving crocodiles to reach the right bank.
 * Slot 6 in SCENE_SEQUENCE.  On success sets c2Progress=7 and returns
 * to the Chapter2Scene router.
 */
import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { W, H, DEPTH_BG, DEPTH_WORLD, DEPTH_UI } from '../constants';
import { NPC_CHAR_SCALE } from '../utils/charSprite';

const CHARACTER_SCALE = NPC_CHAR_SCALE; // ~86px tall on 960×960 frames, matches Chapter 1 player

// ── Layout constants ──────────────────────────────────────────────────────────
const WATER_TOP    = 380;          // y where water begins
const LEFT_BANK_X  = 110;          // right edge of left bank
const RIGHT_BANK_X = W - 110;      // left edge of right bank
const GRAVITY      = 800;
const JUMP_VY      = -520;
const MOVE_VX      = 180;

// Crocodile platform dimensions
const CROC_W       = 130;
const CROC_H       = 26;           // physics hitbox height (thin flat top)
// Croc game-object center y: body top = WATER_TOP, body center = WATER_TOP + CROC_H/2
const CROC_Y = WATER_TOP - CROC_H / 2;  // = 380 - 13 = 367  ← nổi trên mặt nước

// Player physics body size
const PLAYER_W     = 22;
const PLAYER_H     = 36;

// ── Mid-air platform constants ────────────────────────────────────────────────
const PLAT_Y       = WATER_TOP - 40;   // platform surface y (above water)
const PLAT_W       = 90;               // platform width
const PLAT_H       = 28;               // platform thickness

// Alternating layout: plat → croc → plat → croc → plat → croc → right bank
const PLAT_STARTS  = [230, 370, 510] as const;
const CROC_STARTS  = [300, 440, 700] as const;
const CROC_SPEEDS  = [75, -90, 65]   as const;

export class MiniGameCrocodile extends Phaser.Scene {
  private gs!: GS;
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private crocs!: Phaser.Physics.Arcade.Group;
  private banks!: Phaser.Physics.Arcade.StaticGroup;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyLeft!:  Phaser.Input.Keyboard.Key;
  private keyRight!: Phaser.Input.Keyboard.Key;
  private keyUp!:    Phaser.Input.Keyboard.Key;
  private jumpKey!:  Phaser.Input.Keyboard.Key;
  private attempts          = 0;
  private done              = false;
  private waterResetPending = false;
  private lastSafeX = LEFT_BANK_X / 2;
  private lastSafeY = WATER_TOP - PLAYER_H /2;
  private standingCroc: Phaser.Physics.Arcade.Image | null = null;
  private notifyText!: Phaser.GameObjects.Text;
  private kbroiText!: Phaser.GameObjects.Text;

  constructor() { super('C2MiniCrocodile'); }

  preload(): void {
    if (!this.textures.exists('bg-croc'))        this.load.image('bg-croc',        'assets/dohoa/bg-croc.jpg');
    if (!this.textures.exists('thuan'))           this.load.image('thuan',           'assets/dohoa/thuan.jpg');
    if (!this.textures.exists('crocodile-sprite'))this.load.image('crocodile-sprite','assets/dohoa/crocodile.gif');
  }

  create(): void {
    this.gs   = new GS(this.registry);
    this.done = false;
    this.attempts = 0;
    this.waterResetPending = false;
    this.standingCroc = null;
    this.lastSafeX = LEFT_BANK_X / 2;
    this.lastSafeY = WATER_TOP - PLAYER_H / 2;

    this.physics.world.gravity.y = GRAVITY;
    this.physics.world.setBounds(0, 0, W, H);

    this.buildBackground();
    this.buildBanks();
    this.buildPlatforms();
    this.buildCrocs();
    this.buildPlayer();
    this.buildWaterFloor();
    this.buildUI();

    // Clear any captures left by other scenes so arrow/WASD work here
    this.input.keyboard!.clearCaptures();
    this.cursors  = this.input.keyboard!.createCursorKeys();
    this.jumpKey  = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyLeft  = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyRight = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyUp    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);

    this.input.on('pointerdown', () => this.doJump());
    this.cameras.main.fadeIn(500);

    this.time.delayedCall(200, () => {
      this.kbroiText.setVisible(true);
      this.time.delayedCall(3500, () => this.kbroiText.setVisible(false));
    });
  }

  // ── Background ───────────────────────────────────────────────────────────────
  private buildBackground(): void {
    if (this.textures.exists('bg-croc')) {
      this.add.image(W / 2, WATER_TOP / 2, 'bg-croc')
        .setDisplaySize(W, WATER_TOP).setDepth(DEPTH_BG);
    } else {
      const bg = this.add.graphics().setDepth(DEPTH_BG);
      bg.fillGradientStyle(0x5599cc, 0x5599cc, 0x88bbdd, 0x88bbdd);
      bg.fillRect(0, 0, W, WATER_TOP);
      bg.fillStyle(0x1a3a0a);
      for (let x = 0; x < W; x += 55) {
        const ch = 80 + (x % 50);
        bg.fillRect(x + 20, WATER_TOP - ch, 15, ch);
        bg.fillEllipse(x + 28, WATER_TOP - ch, 46, 50);
      }
    }

    // Water — always drawn on top of bg
    const water = this.add.graphics().setDepth(DEPTH_BG + 0.5);
    water.fillStyle(0x1a5f7a);
    water.fillRect(0, WATER_TOP, W, H - WATER_TOP);
    water.fillStyle(0x2278a0, 0.5);
    for (let x = 0; x < W; x += 24) {
      water.fillRect(x, WATER_TOP + 4, 14, 3);
      water.fillRect(x + 10, WATER_TOP + 12, 10, 2);
    }
  }

  // ── Banks ────────────────────────────────────────────────────────────────────
private buildBanks(): void {
  this.banks = this.physics.add.staticGroup();

  // ── Bờ TRÁI — ngang mặt nước ─────────────────────────────────────────
  const leftBankH    = H - WATER_TOP + 20;
  const leftBankTopY = WATER_TOP + leftBankH / 2;
  const lb = this.banks.create(LEFT_BANK_X / 2, leftBankTopY, '__DEFAULT') as Phaser.Physics.Arcade.Image;
  lb.setDisplaySize(LEFT_BANK_X, leftBankH).setVisible(false).refreshBody();

  // ── Bờ PHẢI — cao hơn bờ trái 50px ──────────────────────────────────
  const RIGHT_SURFACE_Y = WATER_TOP - 50;
  const rightBankH      = H - RIGHT_SURFACE_Y + 20;
  const rightBankTopY   = RIGHT_SURFACE_Y + rightBankH / 2;
  const rb = this.banks.create(
    RIGHT_BANK_X + (W - RIGHT_BANK_X) / 2,
    rightBankTopY,
    '__DEFAULT',
  ) as Phaser.Physics.Arcade.Image;
  rb.setDisplaySize(W - RIGHT_BANK_X, rightBankH).setVisible(false).refreshBody();

  // ── Visuals ───────────────────────────────────────────────────────────
  const gfx = this.add.graphics().setDepth(DEPTH_WORLD);

  // Bờ trái
  gfx.fillStyle(0x3d6b1e);
  gfx.fillRect(0, WATER_TOP, LEFT_BANK_X, H - WATER_TOP + 10);
  gfx.fillStyle(0x55921a);
  gfx.fillRect(0, WATER_TOP - 10, LEFT_BANK_X, 12);

  // Bờ phải — vẽ cao hơn
  gfx.fillStyle(0x3d6b1e);
  gfx.fillRect(RIGHT_BANK_X, RIGHT_SURFACE_Y, W - RIGHT_BANK_X, H - RIGHT_SURFACE_Y + 10);
  gfx.fillStyle(0x55921a);
  gfx.fillRect(RIGHT_BANK_X, RIGHT_SURFACE_Y - 10, W - RIGHT_BANK_X, 12);

  // Bậc đá nối (visual hint)
  gfx.fillStyle(0x7a6a50);
  gfx.fillRect(RIGHT_BANK_X - 20, RIGHT_SURFACE_Y, 20, WATER_TOP - RIGHT_SURFACE_Y);

  // K'Brơi silhouette đứng trên bờ cao
  const kb = this.add.graphics().setDepth(DEPTH_WORLD + 1);
  kb.fillStyle(0x1a1a1a);
  kb.fillRect(RIGHT_BANK_X + 20, RIGHT_SURFACE_Y - 60, 16, 50);
  kb.fillEllipse(RIGHT_BANK_X + 28, RIGHT_SURFACE_Y - 68, 20, 20);
}

  // ── Crocodiles ───────────────────────────────────────────────────────────────
  private buildCrocs(): void {
    this.crocs = this.physics.add.group();

    for (let i = 0; i < CROC_STARTS.length; i++) {
      const useSprite = this.textures.exists('crocodile-sprite');
      const croc = this.crocs.create(
        CROC_STARTS[i], CROC_Y,
        useSprite ? 'crocodile-sprite' : '__DEFAULT',
      ) as Phaser.Physics.Arcade.Image;

      if (useSprite) {
        croc.setDisplaySize(CROC_W, CROC_H * 3).setDepth(DEPTH_WORLD + 0.5);
      } else {
        croc.setDisplaySize(CROC_W, CROC_H).setDepth(DEPTH_WORLD + 0.5);
        const g = this.add.graphics().setDepth(DEPTH_WORLD + 0.4);
        (croc as any)._gfx = g;
        this.drawCrocGfx(g, CROC_STARTS[i], CROC_Y);
      }

      const body = croc.body as Phaser.Physics.Arcade.Body;
      body.setImmovable(true);
      body.allowGravity = false;
      body.setVelocityX(CROC_SPEEDS[i]);
      body.setCollideWorldBounds(false);

      const dispH = useSprite ? CROC_H * 3 : CROC_H;
      body.setSize(CROC_W, dispH * 0.25, false);
      body.setOffset(0, dispH * 0.75);
    }
  }

  // Rect-only croc fallback — no circles or ellipses
  private drawCrocGfx(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
    g.clear();
    const top = WATER_TOP - 2;
    g.fillStyle(0x2a7a2a);
    g.fillRect(cx - CROC_W / 2, top, CROC_W, CROC_H + 4);
    g.fillStyle(0x1a5a1a);
    g.fillRect(cx + CROC_W / 2 - 22, top, 22, CROC_H + 4);  // head
    g.fillStyle(0xffcc00);
    g.fillRect(cx + CROC_W / 2 - 20, top + 4, 5, 5);         // eye
    void cy;
  }

  // ── Mid-air platforms ─────────────────────────────────────────────────────────
  private buildPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();

    for (const px of PLAT_STARTS) {
      const plat = this.platforms.create(px, PLAT_Y, '__DEFAULT') as Phaser.Physics.Arcade.Image;
      plat.setDisplaySize(PLAT_W, PLAT_H).setVisible(false).refreshBody();
      const platBody = plat.body as Phaser.Physics.Arcade.StaticBody;
      platBody.setSize(PLAT_W, PLAT_H * 0.5);
      platBody.setOffset(0, PLAT_H * 0.25);
      platBody.updateFromGameObject();

      // Wood-plank visual — rectangles only, pixel art style
      const g = this.add.graphics().setDepth(DEPTH_WORLD + 0.45);
      g.fillStyle(0x6b3a1a);
      g.fillRect(px - PLAT_W / 2, PLAT_Y - PLAT_H / 2, PLAT_W, PLAT_H);
      g.fillStyle(0x9a5a30);
      g.fillRect(px - PLAT_W / 2 + 2, PLAT_Y - PLAT_H / 2 + 2, PLAT_W - 4, 4);
      g.fillRect(px - PLAT_W / 2 + 2, PLAT_Y + PLAT_H / 2 - 6, PLAT_W - 4, 4);
      g.fillStyle(0x4a2510);
      g.fillRect(px - PLAT_W / 2, PLAT_Y - PLAT_H / 2, PLAT_W, 2);
      g.fillRect(px - PLAT_W / 2, PLAT_Y + PLAT_H / 2 - 2, PLAT_W, 2);
    }
  }

  // ── Player ───────────────────────────────────────────────────────────────────
  private buildPlayer(): void {
    const startX = LEFT_BANK_X / 2;

    const gender = (this.gs.get('gender') as string) || 'male';
    const charKey = gender === 'female' ? 'char-player-f' : 'char-player-m';
    if (this.textures.exists(charKey)) {
      this.player = this.physics.add.sprite(startX, 0, charKey, 0);
      this.player.setScale(CHARACTER_SCALE).setDepth(DEPTH_WORLD + 2);
    } else {
      this.player = this.physics.add.sprite(startX, 0, '__DEFAULT', 0);
      this.player.setDisplaySize(22, 38).setDepth(DEPTH_WORLD + 2);
      const pg = this.add.graphics().setDepth(DEPTH_WORLD + 2);
      (this.player as any)._gfx = pg;
    }

    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    // Narrow hitbox aligned to feet: offset pushes it to the bottom of the sprite
    this.playerBody.setSize(PLAYER_W, PLAYER_H, false);
    this.playerBody.setOffset(
      (this.player.displayWidth - PLAYER_W) / 2,
      this.player.displayHeight - PLAYER_H,
    );
    this.playerBody.setCollideWorldBounds(true);
    this.playerBody.setMaxVelocityY(600);

    // Correct spawn: hitbox bottom = player.y + displayHeight/2, place feet 2px above bank top
    const startY = WATER_TOP - this.player.displayHeight / 2 - 2;
    this.player.setPosition(startX, startY);
    this.lastSafeX = startX;
    this.lastSafeY = startY;

    // Bank collider — one-way from above
    this.physics.add.collider(
      this.player,
      this.banks,
      () => {
        this.lastSafeX = this.player.x;
        this.lastSafeY = this.player.y;
      },
      (_p, _b) => this.playerBody.velocity.y >= 0,
      this,
    );

    // Croc collider — one-way (land from above only)
    // Do NOT update lastSafe here: crocs move, so that position is never stable
    this.physics.add.collider(
      this.player,
      this.crocs,
      (_p, c) => { this.standingCroc = c as Phaser.Physics.Arcade.Image; },
      (_p, _c) => this.playerBody.velocity.y >= 0,
      this,
    );

    // Platform collider — one-way (land from above only), updates safe position
    this.physics.add.collider(
      this.player,
      this.platforms,
      () => {
        this.lastSafeX = this.player.x;
        this.lastSafeY = this.player.y;
      },
      (_p, _plat) => this.playerBody.velocity.y >= 0,
      this,
    );
  }

  // ── Invisible water floor (safety net: prevents infinite fall) ───────────────
  private buildWaterFloor(): void {
    const wf = this.physics.add.staticImage(W / 2, WATER_TOP + 40, '__DEFAULT') as Phaser.Physics.Arcade.Image;
    wf.setDisplaySize(W, 20).setVisible(false).refreshBody();
    this.physics.add.collider(this.player, wf, () => this.doWaterReset());
  }

  // ── Water reset (guarded to prevent multi-fire within same frame burst) ──────
  private doWaterReset(): void {
    if (this.done || this.waterResetPending) return;
    this.waterResetPending = true;
    this.attempts++;
    this.notify('💦 Rơi xuống nước! Thử lại...', '#88ccff');
    this.player.setPosition(this.lastSafeX, this.lastSafeY);
    this.playerBody.setVelocity(0, 0);
    this.time.delayedCall(200, () => { this.waterResetPending = false; });
  }

  // ── UI ───────────────────────────────────────────────────────────────────────
  private buildUI(): void {
    this.add.text(W / 2, 14, 'Chương 2 — Vượt Suối', {
      fontSize: '12px', fontFamily: 'Arial', color: '#ccddff',
      stroke: '#000', strokeThickness: 2,
      backgroundColor: '#00000066', padding: { x: 8, y: 3 },
    }).setOrigin(0.5, 0).setDepth(DEPTH_UI);

    this.kbroiText = this.add.text(W / 2, H / 2 - 60,
      '"Nhảy. Tôi làm được thì anh cũng làm được."', {
        fontSize: '15px', fontFamily: 'Arial', fontStyle: 'italic',
        color: '#f5e6c8', stroke: '#000', strokeThickness: 2,
        backgroundColor: '#00000088', padding: { x: 10, y: 6 },
      }).setOrigin(0.5).setDepth(DEPTH_UI).setVisible(false);

    this.notifyText = this.add.text(W / 2, 50, '', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffcc44',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(DEPTH_UI);

    this.add.text(W / 2, H - 22,
      '← → / A D di chuyển   •   SPACE / ↑ / W để nhảy', {
        fontSize: '11px', fontFamily: 'Arial', color: '#aabbcc',
        stroke: '#000', strokeThickness: 1,
      }).setOrigin(0.5, 1).setDepth(DEPTH_UI);
  }

  // ── Jump ─────────────────────────────────────────────────────────────────────
  private doJump(): void {
    if (this.done) return;
    const isGrounded = this.playerBody.blocked.down || this.playerBody.touching.down;
    if (isGrounded) {
      this.playerBody.setVelocityY(JUMP_VY);
    }
  }

  // ── Update ───────────────────────────────────────────────────────────────────
  update(_t: number, delta: number): void {
    if (this.done) return;

    // Reset croc tracking — collider re-sets it each frame while touching
    const prevCroc = this.standingCroc;
    this.standingCroc = null;

    // ── Horizontal movement ──────────────────────────────────────────────────
    const goLeft  = this.cursors.left.isDown  || this.keyLeft.isDown;
    const goRight = this.cursors.right.isDown || this.keyRight.isDown;
    if (goLeft) {
      this.playerBody.setVelocityX(-MOVE_VX);
      this.player.setFlipX(true);
    } else if (goRight) {
      this.playerBody.setVelocityX(MOVE_VX);
      this.player.setFlipX(false);
    } else {
      this.playerBody.setVelocityX(0);
    }

    // ── Jump (keyboard) ──────────────────────────────────────────────────────
    if (Phaser.Input.Keyboard.JustDown(this.jumpKey) ||
        Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
        Phaser.Input.Keyboard.JustDown(this.keyUp)) {
      this.doJump();
    }

    // ── Carry player with croc ───────────────────────────────────────────────
    // Use prevCroc (last frame's croc) so we drift even the frame we leave
    const carryFrom = this.standingCroc ?? (this.playerBody.blocked.down ? prevCroc : null);
    if (carryFrom && this.playerBody.blocked.down) {
      const cb = carryFrom.body as Phaser.Physics.Arcade.Body;
      this.player.x += cb.velocity.x * (delta / 1000);
    }

    // ── Update croc positions (wrap + fallback graphics) ─────────────────────
    for (const child of this.crocs.getChildren()) {
      const croc = child as Phaser.Physics.Arcade.Image;
      const body = croc.body as Phaser.Physics.Arcade.Body;

      // Wrap: use body.reset() to keep game-object and body in sync
      if (body.x + CROC_W > RIGHT_BANK_X) {
        body.reset(LEFT_BANK_X + CROC_W / 2, croc.y);
      } else if (body.x < LEFT_BANK_X) {
        body.reset(RIGHT_BANK_X - CROC_W / 2, croc.y);
      }

      // Fallback graphics
      const g = (croc as any)._gfx as Phaser.GameObjects.Graphics | undefined;
      if (g) this.drawCrocGfx(g, croc.x, croc.y);
    }

    // ── Fallback player graphic (rect-only, no ellipses) ────────────────────
    const pg = (this.player as any)._gfx as Phaser.GameObjects.Graphics | undefined;
    if (pg) {
      pg.clear();
      pg.fillStyle(0x4488ff);
      pg.fillRect(this.player.x - 8, this.player.y - 14, 16, 28);  // body
      pg.fillRect(this.player.x - 7, this.player.y - 30, 14, 16);  // head
    }

    // Hard fail-safe: player fell below safe threshold regardless of bank x bounds
    if (this.player.y > WATER_TOP + 60) {
      this.doWaterReset();
    }

    // ── Fell in water ────────────────────────────────────────────────────────
    const inWater =
      this.player.x > LEFT_BANK_X &&
      this.player.x < RIGHT_BANK_X &&
      this.playerBody.bottom > WATER_TOP + 8;

    if (inWater) {
      this.doWaterReset();
    }

    // Debug ground state (open browser console to verify collision is working)
    // console.log('ground:', this.playerBody.blocked.down, this.playerBody.touching.down);

    // ── Reached right bank ───────────────────────────────────────────────────
    if (this.player.x >= RIGHT_BANK_X - 8 &&
    this.playerBody.bottom <= WATER_TOP - 40) {
  this.reachRightBank();
}
  }

  private notify(msg: string, color: string): void {
    this.notifyText.setText(msg).setColor(color).setAlpha(1);
    this.tweens.add({ targets: this.notifyText, alpha: 0, duration: 1800, delay: 800 });
  }

  private reachRightBank(): void {
    if (this.done) return;
    this.done = true;
    const score = this.attempts === 0 ? 30 : 15;
    this.gs.set('crocodileScore', score);
    this.gs.addScore(score);
    this.notify(
      this.attempts === 0 ? '🏆 Qua được ngay lần đầu! +30 điểm' : `✓ Qua rồi! +${score} điểm`,
      '#88ff66',
    );
    this.time.delayedCall(1200, () => this.advanceScene());
  }

  private advanceScene(): void {
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.gs.set('c2Progress', 7);
      this.scene.start('Chapter2Scene');
    });
  }

  shutdown(): void {
    this.input.off('pointerdown');
  }
}
