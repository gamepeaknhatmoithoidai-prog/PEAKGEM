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
import { charCropFrame0 } from '../utils/charSprite';

// ── Layout constants ──────────────────────────────────────────────────────────
const WATER_TOP    = 360;          // y where water begins
const LEFT_BANK_X  = 110;          // right edge of left bank
const RIGHT_BANK_X = W - 110;      // left edge of right bank
const GRAVITY      = 650;
const JUMP_VY      = -460;
const MOVE_VX      = 180;

// Crocodile platform dimensions
const CROC_W       = 130;
const CROC_H       = 26;           // physics hitbox height (thin flat top)
// Croc game-object center y: body top = WATER_TOP, body center = WATER_TOP + CROC_H/2
const CROC_Y       = WATER_TOP + CROC_H / 2;

// Player physics body size
const PLAYER_W     = 22;
const PLAYER_H     = 36;

export class MiniGameCrocodile extends Phaser.Scene {
  private gs!: GS;
  private player!: Phaser.Physics.Arcade.Image;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private crocs!: Phaser.Physics.Arcade.Group;
  private banks!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyLeft!:  Phaser.Input.Keyboard.Key;
  private keyRight!: Phaser.Input.Keyboard.Key;
  private keyUp!:    Phaser.Input.Keyboard.Key;
  private jumpKey!:  Phaser.Input.Keyboard.Key;
  private attempts  = 0;
  private done      = false;
  private lastSafeX = LEFT_BANK_X / 2;
  private lastSafeY = WATER_TOP - 40;
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
    this.standingCroc = null;
    this.lastSafeX = LEFT_BANK_X / 2;
    this.lastSafeY = WATER_TOP - 40;

    this.physics.world.gravity.y = GRAVITY;
    this.physics.world.setBounds(0, 0, W, H + 200);

    this.buildBackground();
    this.buildBanks();
    this.buildCrocs();
    this.buildPlayer();
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

    // Bank bodies span from just below WATER_TOP down to bottom
    const bankH  = H - WATER_TOP + 20;
    const bankTopY = WATER_TOP + bankH / 2;

    const lb = this.banks.create(LEFT_BANK_X / 2, bankTopY, '__DEFAULT') as Phaser.Physics.Arcade.Image;
    lb.setDisplaySize(LEFT_BANK_X, bankH).setVisible(false).refreshBody();

    const rb = this.banks.create(RIGHT_BANK_X + (W - RIGHT_BANK_X) / 2, bankTopY, '__DEFAULT') as Phaser.Physics.Arcade.Image;
    rb.setDisplaySize(W - RIGHT_BANK_X, bankH).setVisible(false).refreshBody();

    // Visuals
    const gfx = this.add.graphics().setDepth(DEPTH_WORLD);
    // Left bank
    gfx.fillStyle(0x3d6b1e);
    gfx.fillRect(0, WATER_TOP, LEFT_BANK_X, H - WATER_TOP + 10);
    gfx.fillStyle(0x55921a);
    gfx.fillRect(0, WATER_TOP - 10, LEFT_BANK_X, 12);
    // Right bank
    gfx.fillStyle(0x3d6b1e);
    gfx.fillRect(RIGHT_BANK_X, WATER_TOP, W - RIGHT_BANK_X, H - WATER_TOP + 10);
    gfx.fillStyle(0x55921a);
    gfx.fillRect(RIGHT_BANK_X, WATER_TOP - 10, W - RIGHT_BANK_X, 12);

    // K'Brơi silhouette on right bank
    const kb = this.add.graphics().setDepth(DEPTH_WORLD + 1);
    kb.fillStyle(0x1a1a1a);
    kb.fillRect(RIGHT_BANK_X + 20, WATER_TOP - 60, 16, 50);
    kb.fillEllipse(RIGHT_BANK_X + 28, WATER_TOP - 68, 20, 20);
  }

  // ── Crocodiles ───────────────────────────────────────────────────────────────
  private buildCrocs(): void {
    this.crocs = this.physics.add.group();

    const speeds = [75, -95, 65, -85];
    const startX = [210, 370, 530, 670];

    for (let i = 0; i < 4; i++) {
      const useSprite = this.textures.exists('crocodile-sprite');
      const croc = this.crocs.create(
        startX[i], CROC_Y,
        useSprite ? 'crocodile-sprite' : '__DEFAULT',
      ) as Phaser.Physics.Arcade.Image;

      if (useSprite) {
        // Display taller than hitbox so the croc body shows in the water
        croc.setDisplaySize(CROC_W, CROC_H * 3).setDepth(DEPTH_WORLD + 0.5);
      } else {
        croc.setDisplaySize(CROC_W, CROC_H).setDepth(DEPTH_WORLD + 0.5);
        const g = this.add.graphics().setDepth(DEPTH_WORLD + 0.4);
        (croc as any)._gfx = g;
        this.drawCrocGfx(g, startX[i], CROC_Y);
      }

      const body = croc.body as Phaser.Physics.Arcade.Body;
      body.setImmovable(true);
      body.allowGravity = false;
      body.setVelocityX(speeds[i]);
      body.setCollideWorldBounds(false);

      // Flat thin hitbox at the TOP of the sprite (the croc's back)
      // setSize with center=false, then manually offset to top
      body.setSize(CROC_W, CROC_H, false);
      body.setOffset(0, 0);  // body top = sprite top = CROC_Y - displayH/2
      // Adjust so body top aligns with WATER_TOP regardless of display height:
      // sprite top = CROC_Y - displayH/2; we want body top = WATER_TOP
      // offset.y = WATER_TOP - (CROC_Y - displayH/2)
      const dispH = useSprite ? CROC_H * 3 : CROC_H;
      const spriteTop = CROC_Y - dispH / 2;
      body.setOffset(0, WATER_TOP - spriteTop);
    }
  }

  private drawCrocGfx(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
    g.clear();
    const top = WATER_TOP;
    g.fillStyle(0x2a7a2a);
    g.fillRoundedRect(cx - CROC_W / 2, top - 2, CROC_W, CROC_H + 4, 6);
    g.fillStyle(0x1a5a1a);
    g.fillEllipse(cx + CROC_W / 2 - 12, top + 2, 20, 12);  // head
    g.fillStyle(0xffcc00);
    g.fillEllipse(cx + CROC_W / 2 - 16, top + 2, 6, 6);    // eye
    void cy;
  }

  // ── Player ───────────────────────────────────────────────────────────────────
  private buildPlayer(): void {
    const startX = LEFT_BANK_X / 2;
    const startY = WATER_TOP - PLAYER_H;

    if (this.textures.exists('thuan')) {
      this.player = this.physics.add.image(startX, startY, 'thuan');
      this.player.setDepth(DEPTH_WORLD + 2);
      charCropFrame0(this.player as unknown as Phaser.GameObjects.Image, 'thuan', 40, 40);
    } else {
      this.player = this.physics.add.image(startX, startY, '__DEFAULT');
      this.player.setDisplaySize(22, 38).setDepth(DEPTH_WORLD + 2);
      const pg = this.add.graphics().setDepth(DEPTH_WORLD + 2);
      (this.player as any)._gfx = pg;
    }

    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    // Narrow hitbox, do not center (set offset manually to center horizontally)
    this.playerBody.setSize(PLAYER_W, PLAYER_H, false);
    this.playerBody.setOffset(
      (this.player.displayWidth - PLAYER_W) / 2,
      (this.player.displayHeight - PLAYER_H) / 2,
    );
    this.playerBody.setCollideWorldBounds(false);
    this.playerBody.setMaxVelocityY(600);

    // Bank collider — solid
    this.physics.add.collider(this.player, this.banks, () => {
      this.lastSafeX = this.player.x;
      this.lastSafeY = this.player.y;
    });

    // Croc collider — one-way (land from above only)
    this.physics.add.collider(
      this.player,
      this.crocs,
      (_p, c) => {
        this.standingCroc = c as Phaser.Physics.Arcade.Image;
        this.lastSafeX = this.player.x;
        this.lastSafeY = this.player.y;
      },
      (_p, _c) => {
        // Only resolve collision when player is falling or stationary (not jumping upward)
        return this.playerBody.velocity.y >= -30;
      },
      this,
    );
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
    if (this.playerBody.blocked.down) {
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

    // ── Fallback player graphic ──────────────────────────────────────────────
    const pg = (this.player as any)._gfx as Phaser.GameObjects.Graphics | undefined;
    if (pg) {
      pg.clear();
      pg.fillStyle(0x4488ff);
      pg.fillRect(this.player.x - 8, this.player.y - 14, 16, 28);
      pg.fillEllipse(this.player.x, this.player.y - 22, 18, 18);
    }

    // ── Fell in water ────────────────────────────────────────────────────────
    const inWater =
      this.player.x > LEFT_BANK_X &&
      this.player.x < RIGHT_BANK_X &&
      this.playerBody.top > WATER_TOP + 8;

    if (inWater || this.player.y > H + 50) {
      this.attempts++;
      this.notify('💦 Rơi xuống nước! Thử lại...', '#88ccff');
      this.player.setPosition(this.lastSafeX, this.lastSafeY);
      this.playerBody.setVelocity(0, 0);
    }

    // ── Reached right bank ───────────────────────────────────────────────────
    if (this.player.x >= RIGHT_BANK_X - 8) {
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
