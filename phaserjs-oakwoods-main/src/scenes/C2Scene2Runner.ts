/**
 * C2Scene2Runner — Chapter 2, Scene 2: Trốn Thoát (Escape Runner)
 *
 * Flow: Intro Dialogue → Gameplay → Post-Game Dialogue → C2S3Photo
 *
 * CONTROLS:
 *   SPACE / ↑  — jump over tree stumps
 *   ↓          — duck under flying birds
 *
 * PHASES:
 *   0 – 8 s  : stumps only
 *   8 – 25 s : stumps + birds (random mix)
 *
 * SCORING:
 *   0 hits  → +15 pts
 *   1-2 hits → +8 pts
 *   3 hits  → caught → +0 pts
 */
import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { W, H, DEPTH_BG, DEPTH_WORLD, DEPTH_UI } from '../constants';

// ── Layout ────────────────────────────────────────────────────────────────────
const GROUND_Y  = 420;
const PLAYER_X  = 140;

// ── Timing ───────────────────────────────────────────────────────────────────
const GAME_DURATION    = 30;   // total seconds
const BIRD_PHASE_START = 6;    // birds introduced at 6 s
const MAX_HITS         = 3;

// Speed steps every 6 seconds (5 tiers × 6 s = 30 s)
// More aggressive jumps between tiers for exponential pressure.
// [0-6s, 6-12s, 12-18s, 18-24s, 24-30s]
const SPEED_TIER = [240, 340, 460, 580, 720] as const;

// Cooldown range [min, max] seconds between obstacles, per tier.
// Late-game values are near-instant — only skilled players survive.
const COOLDOWN_TIER: [number, number][] = [
  [0.40, 0.65],  // 0-6 s  — easy
  [0.22, 0.38],  // 6-12 s — medium
  [0.10, 0.20],  // 12-18 s — hard
  [0.05, 0.12],  // 18-24 s — very hard
  [0.02, 0.07],  // 24-30 s — extreme (most players fail here)
];

// ── Bird flight height ────────────────────────────────────────────────────────
// Center of bird above ground. Duck keeps player body top > this, avoiding hit.
const BIRD_Y = GROUND_Y - 72;

type Phase = 'intro' | 'gameplay' | 'postgame' | 'done';

interface ObstacleData {
  type: 'stump' | 'bird';
  x:   number;
  y:   number;
  w:   number;
  h:   number;
  gfx: Phaser.GameObjects.Graphics;
}

export class C2Scene2Runner extends Phaser.Scene {
  private gs!: GS;
  private phase: Phase = 'intro';

  // Player
  private playerSprite!: Phaser.Physics.Arcade.Sprite;
  private groundGroup!:  Phaser.Physics.Arcade.StaticGroup;
  private jumpKey!:      Phaser.Input.Keyboard.Key;
  private upKey!:        Phaser.Input.Keyboard.Key;
  private duckKey!:      Phaser.Input.Keyboard.Key;
  private canJump  = true;
  private isDucking = false;
  private baseScaleY = 0.15;

  // Scrolling bg
  private bgTile!: Phaser.GameObjects.TileSprite;

  // Obstacles
  private obstacles:     ObstacleData[] = [];
  private spawnCooldown  = 0;   // seconds until next spawn is allowed
  private scrollSpeed: number = SPEED_TIER[0];
  // Pattern-bait sequence: repeating mix that prevents player from
  // memorising a safe rhythm. Shuffled each run in create().
  private obstacleSeq: ('stump' | 'bird')[] = [];
  private obstacleSeqIdx = 0;

  // State
  private timeLeft          = GAME_DURATION;
  private hitCount          = 0;
  private isInvincible      = false;
  private runEnded          = false;
  private transitionStarted = false;

  // UI
  private timerText!:  Phaser.GameObjects.Text;
  private healthDots:  Phaser.GameObjects.Rectangle[] = [];
  private speedFill!:  Phaser.GameObjects.Rectangle;
  private duckHint!:   Phaser.GameObjects.Text;

  constructor() { super('C2S2Runner'); }

  // ═══════════════════════════════════════════════════════════════════
  //  CREATE
  // ═══════════════════════════════════════════════════════════════════
  create(): void {
    this.gs = new GS(this.registry);
    this.phase      = 'intro';
    this.hitCount   = 0;
    this.timeLeft   = GAME_DURATION;
    this.scrollSpeed = SPEED_TIER[0];
    this.runEnded   = false;
    this.transitionStarted = false;
    this.obstacles  = [];
    this.spawnCooldown = 0;
    this.healthDots = [];
    this.isDucking  = false;
    this.canJump    = true;
    this.obstacleSeqIdx = 0;
    // Build a shuffled bait sequence: 3 stumps + 2 birds repeated.
    // Shuffle so the pattern is never the same two runs in a row.
    const base: ('stump' | 'bird')[] = ['stump', 'stump', 'bird', 'stump', 'bird', 'bird', 'stump', 'bird'];
    for (let i = base.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [base[i], base[j]] = [base[j], base[i]];
    }
    this.obstacleSeq = base;

    this.physics.world.gravity.y = 850;
    this.physics.world.setBounds(0, 0, W, H);

    this.buildBackground();
    this.buildGround();
    this.buildPlayer();
    this.buildUI();
    this.buildKeys();

    this.cameras.main.fadeIn(600);

    this.events.on('dialog-done', this.onDialogDone, this);
    this.time.delayedCall(400, () => this.launchDialog('c2s2-intro'));

    try { this.sound.play('forest-ambient', { loop: true, volume: 0.18 }); } catch (_) {}
  }

  // ── Dialog helpers ────────────────────────────────────────────────────
  private launchDialog(key: string): void {
    this.scene.launch('DialogScene', { dialogKey: key, sourceScene: 'C2S2Runner' });
    this.scene.pause();
  }

  private onDialogDone(_result: unknown): void {
    this.scene.resume();
    if (this.phase === 'intro') {
      this.phase = 'gameplay';
      this.game.events.emit('notify', 'SPACE/↑ nhảy qua gốc cây  |  ↓ khom tránh chim', '#ffcc44');
    } else if (this.phase === 'postgame') {
      this.phase = 'done';
      this.goToScene3();
    }
  }

  // ── Background ────────────────────────────────────────────────────────
  private buildBackground(): void {
    // Prefer the dedicated Game 2 background; fall back to shared c2 bg
    const bgKey = this.textures.exists('bg-c2-game2') ? 'bg-c2-game2'
                : this.textures.exists('bg-c2-real')  ? 'bg-c2-real'
                : this.textures.exists('bg-ch2')      ? 'bg-ch2'
                : null;

    if (bgKey) {
      const tex = this.textures.get(bgKey).getSourceImage() as HTMLImageElement;
      const s   = tex.height > 0 ? H / tex.height : 1;
      this.bgTile = this.add.tileSprite(W / 2, H / 2, W, H, bgKey)
        .setDepth(DEPTH_BG).setTileScale(s, s);
    } else {
      // Minimal procedural sky — no extra shapes
      const bg = this.add.graphics().setDepth(DEPTH_BG);
      bg.fillGradientStyle(0x010204, 0x010204, 0x050e03, 0x050e03, 1);
      bg.fillRect(0, 0, W, H);
      const rng = new Phaser.Math.RandomDataGenerator(['runner-sky']);
      bg.fillStyle(0xffffff, 0.3);
      for (let i = 0; i < 70; i++) {
        bg.fillCircle(
          rng.integerInRange(0, W),
          rng.integerInRange(0, H * 0.55),
          0.5 + rng.frac() * 0.9
        );
      }
      // Use default white pixel as placeholder (invisible since alpha 0)
      this.bgTile = this.add.tileSprite(W / 2, H / 2, W, H, '__DEFAULT')
        .setAlpha(0).setDepth(DEPTH_BG + 0.01);
    }
  }

  // ── Ground ──────────────────────────────────────────────────────────
  private buildGround(): void {
    const gfx = this.add.graphics().setDepth(DEPTH_WORLD - 0.5);
    gfx.fillStyle(0x1a3a10); gfx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    gfx.fillStyle(0x2d5a1a); gfx.fillRect(0, GROUND_Y, W, 10);
    gfx.fillStyle(0x3a7a22); gfx.fillRect(0, GROUND_Y - 2, W, 4);

    this.groundGroup = this.physics.add.staticGroup();
    const floor = this.groundGroup.create(W / 2, GROUND_Y + 40, '__DEFAULT') as Phaser.Physics.Arcade.Image;
    floor.setDisplaySize(W, 80).setVisible(false).refreshBody();
  }

  // ── Player ────────────────────────────────────────────────────────────
  private buildPlayer(): void {
    const gender = this.gs.get('gender') || 'male';
    const texKey = gender === 'male' ? 'player-m' : 'player-f';
    const hasAnims = (this.textures.get(texKey)?.frameTotal ?? 1) > 1;

    this.playerSprite = this.physics.add.sprite(PLAYER_X, GROUND_Y - 70, texKey)
      .setDepth(DEPTH_WORLD + 2);

    if (hasAnims) {
      this.baseScaleY = 0.15;
      this.playerSprite.setScale(0.15, this.baseScaleY);
      const body = this.playerSprite.body as Phaser.Physics.Arcade.Body;
      if (gender === 'male') { body.setSize(140, 320); body.setOffset(218, 220); }
      else                   { body.setSize(120, 320); body.setOffset(217, 244); }
      try { this.playerSprite.setPostPipeline('WhiteKey'); } catch (_) {}
      this.playerSprite.setFlipX(true);
      this.playerSprite.play(`${texKey}-left`, true);
    } else {
      this.baseScaleY = 1.5;
      this.playerSprite.setScale(1.5);
      const body = this.playerSprite.body as Phaser.Physics.Arcade.Body;
      body.setSize(18, 20); body.setOffset(7, 22);
    }

    this.playerSprite.setCollideWorldBounds(true);
    (this.playerSprite.body as Phaser.Physics.Arcade.Body).setMaxVelocityY(950);

    this.physics.add.collider(this.playerSprite, this.groundGroup, () => {
      this.canJump = true;
    });
  }

  // ── HUD ──────────────────────────────────────────────────────────────
  private buildUI(): void {
    // Title
    this.add.text(W / 2, 10, 'Chương 2 — Cảnh 2: Trốn Thoát!', {
      fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#ffcc66', stroke: '#000', strokeThickness: 2,
      backgroundColor: '#00000066', padding: { x: 8, y: 3 },
    }).setOrigin(0.5, 0).setDepth(DEPTH_UI).setScrollFactor(0);

    // Timer
    this.timerText = this.add.text(W / 2, 36, `⏱ ${GAME_DURATION}s`, {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#ffffff', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(DEPTH_UI).setScrollFactor(0);

    // Lives
    this.add.text(14, 38, '❤ Mạng:', {
      fontSize: '12px', fontFamily: 'Arial', color: '#ff8888',
    }).setDepth(DEPTH_UI).setScrollFactor(0);
    for (let i = 0; i < MAX_HITS; i++) {
      const dot = this.add.rectangle(100 + i * 24, 46, 18, 12, 0xff3333)
        .setStrokeStyle(1, 0xff7777).setDepth(DEPTH_UI).setScrollFactor(0);
      this.healthDots.push(dot);
    }

    // Speed bar
    this.add.text(W - 130, 36, 'Tốc độ:', {
      fontSize: '10px', fontFamily: 'Arial', color: '#aaffaa',
    }).setDepth(DEPTH_UI).setScrollFactor(0);
    this.add.rectangle(W - 55, 45, 100, 10, 0x1a3010)
      .setStrokeStyle(1, 0x3a6020).setDepth(DEPTH_UI).setScrollFactor(0);
    this.speedFill = this.add.rectangle(W - 105, 45, 0, 8, 0x44cc44)
      .setOrigin(0, 0.5).setDepth(DEPTH_UI + 1).setScrollFactor(0);

    // Controls hint (bottom)
    this.add.text(W / 2, H - 18, 'SPACE / ↑  nhảy qua gốc cây   |   ↓  khom người tránh chim', {
      fontSize: '11px', fontFamily: 'Arial', color: '#aabbaa',
    }).setOrigin(0.5).setDepth(DEPTH_UI).setScrollFactor(0);

    // Duck status indicator (shows when ↓ pressed)
    this.duckHint = this.add.text(PLAYER_X, GROUND_Y - 10, 'KHOM', {
      fontSize: '10px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#88ffcc', backgroundColor: '#00000088', padding: { x: 3, y: 2 },
    }).setOrigin(0.5, 1).setDepth(DEPTH_UI + 2).setVisible(false).setScrollFactor(0);
  }

  // ── Keys ─────────────────────────────────────────────────────────────
  private buildKeys(): void {
    this.jumpKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.upKey   = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.duckKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  UPDATE
  // ═══════════════════════════════════════════════════════════════════
  update(_t: number, delta: number): void {
    if (this.phase !== 'gameplay') return;

    const dt = delta / 1000;
    if (!this.runEnded) {
      this.updateTimer(dt);
      this.updateSpeed(dt);
      this.scrollBg(dt);
      this.updateDuck();
      this.handleJump();
      this.updateObstacles(dt);
      this.checkCollisions();
      this.updateSpeedBar();
    }
  }

  private updateTimer(dt: number): void {
    this.timeLeft -= dt;
    const secs = Math.max(0, Math.ceil(this.timeLeft));
    this.timerText.setText(`⏱ ${secs}s`);
    if (secs <= 8)  this.timerText.setColor('#ff8844');
    if (this.timeLeft <= 0) this.endRun(false);
  }

  private updateSpeed(_dt: number): void {
    const elapsed = GAME_DURATION - this.timeLeft;
    // Smoothly interpolate within the current 6-second tier so the player
    // feels gradual acceleration rather than a sudden jump.
    const tierIdx     = Math.min(Math.floor(elapsed / 6), SPEED_TIER.length - 1);
    const tierElapsed = elapsed % 6;                 // 0..6 within current tier
    const tierPct     = tierElapsed / 6;             // 0..1 within current tier
    const fromSpeed   = SPEED_TIER[tierIdx];
    const toSpeed     = tierIdx + 1 < SPEED_TIER.length ? SPEED_TIER[tierIdx + 1] : SPEED_TIER[tierIdx];
    this.scrollSpeed  = fromSpeed + (toSpeed - fromSpeed) * tierPct;
  }

  private scrollBg(dt: number): void {
    if (this.bgTile?.alpha > 0) this.bgTile.tilePositionX += this.scrollSpeed * dt * 0.4;
  }

  // ── Duck (↓ hold) ────────────────────────────────────────────────────
  // Anti-flicker rule: grounded check ONLY on duck-entry, never while held.
  // If we re-check body.blocked.down each frame, the gravity-cancel causes
  // blocked.down → false → stand-up → gravity restored → fall → blocked.down
  // → true → duck again … = rapid flicker. Checking only on transition fixes it.
  private updateDuck(): void {
    const body    = this.playerSprite.body as Phaser.Physics.Arcade.Body;
    const keyDown = this.duckKey.isDown;

    if (keyDown && !this.isDucking) {
      // Enter duck only when grounded
      if (body.blocked.down || body.touching.down) {
        this.isDucking = true;
        this.playerSprite.setScale(this.playerSprite.scaleX, this.baseScaleY * 0.6);
        body.setGravityY(-this.physics.world.gravity.y); // cancel gravity
        body.setVelocityY(0);
      }
    } else if (!keyDown && this.isDucking) {
      // Stand up only when key is released
      this.isDucking = false;
      this.playerSprite.setScale(this.playerSprite.scaleX, this.baseScaleY);
      body.setGravityY(0); // restore gravity
    }

    // Pin velocity every frame while ducking (prevents micro-drift)
    if (this.isDucking) body.setVelocityY(0);

    this.duckHint.setVisible(this.isDucking);
  }

  // ── Jump (SPACE / ↑) ─────────────────────────────────────────────────
  private handleJump(): void {
    const body = this.playerSprite.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down || body.touching.down) this.canJump = true;

    // Can't jump while ducking
    if (this.isDucking) return;

    const wantsJump = Phaser.Input.Keyboard.JustDown(this.jumpKey)
                   || Phaser.Input.Keyboard.JustDown(this.upKey);
    if (this.canJump && wantsJump) {
      body.setVelocityY(-560);
      this.canJump = false;
      try { this.sound.play('jump', { volume: 0.32 }); } catch (_) {}
      // Brief alpha flash for jump feedback — do NOT tween scaleY as it
      // resizes the arcade physics body and can break ground collision.
      this.tweens.add({
        targets: this.playerSprite, alpha: 0.6,
        duration: 70, yoyo: true, ease: 'Sine.easeOut',
      });
    }

    // Fix X position
    body.setVelocityX(0);
    this.playerSprite.x = PLAYER_X;
  }

  // ── Obstacle spawn + movement ────────────────────────────────────────
  // RULE: only ONE obstacle on screen at a time.
  // Spawn gate: previous obstacle must have passed the player AND the
  // random cooldown between obstacles must have expired.
  //
  // Phase 1 (0–10 s) : stumps only
  // Phase 2 (10–30 s): stump OR bird — never both simultaneously
  private updateObstacles(dt: number): void {
    const elapsed = GAME_DURATION - this.timeLeft;

    // ── Move existing obstacles leftward; remove off-screen ones ─────────
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      o.x -= this.scrollSpeed * dt;
      o.gfx.setPosition(o.x, o.y);
      if (o.x < -90) {
        o.gfx.destroy();
        this.obstacles.splice(i, 1);
      }
    }

    // ── Cooldown countdown ────────────────────────────────────────────────
    if (this.spawnCooldown > 0) {
      this.spawnCooldown -= dt;
      return;
    }

    // ── Spawn gate: obstacle must be well behind player ───────────────────
    const screenClear = this.obstacles.every(o => o.x < PLAYER_X - 5);
    if (!screenClear) return;

    // ── Choose ONE obstacle type ──────────────────────────────────────────
    if (elapsed < BIRD_PHASE_START) {
      this.spawnStump();                              // Phase 1: stumps only
    } else {
      // Pattern bait: advance a cycling sequence that mixes types
      // unpredictably so players cannot memorise a safe rhythm.
      const seq = this.obstacleSeq;
      const type = seq[this.obstacleSeqIdx % seq.length];
      this.obstacleSeqIdx++;
      if (type === 'bird') this.spawnBird(); else this.spawnStump();
    }

    // ── Random cooldown before next spawn (tier-based) ───────────────────
    const cooldownTierIdx = Math.min(Math.floor(elapsed / 6), COOLDOWN_TIER.length - 1);
    const [minC, maxC] = COOLDOWN_TIER[cooldownTierIdx];
    this.spawnCooldown = minC + Math.random() * (maxC - minC);
  }

  // ── Spawn: tree stump (player must jump) ─────────────────────────────
  private spawnStump(): void {
    const w = 28 + Math.floor(Math.random() * 22);
    const h = 44 + Math.floor(Math.random() * 36);
    const x = W + Phaser.Math.Between(20, 50);
    const y = GROUND_Y - h / 2;

    const gfx = this.add.graphics().setDepth(DEPTH_WORLD + 1);
    // Stump body
    gfx.fillStyle(0x4a2208);
    gfx.fillRect(-w / 2, -h / 2, w, h);
    // Lighter face grain
    gfx.fillStyle(0x6a3210);
    gfx.fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4);
    // Cut-top ring
    gfx.fillStyle(0x8a4820);
    gfx.fillEllipse(0, -h / 2, w, 10);
    gfx.fillStyle(0x5a3010);
    gfx.fillEllipse(0, -h / 2, w * 0.55, 6);
    // Root bumps (triangles — not rectangles)
    gfx.fillStyle(0x3a1a08);
    gfx.fillTriangle(-w / 2 - 8, h / 2, -w / 2, h / 2 - 10, -w / 2 + 6, h / 2);
    gfx.fillTriangle(w / 2 - 6, h / 2, w / 2, h / 2 - 10, w / 2 + 8, h / 2);
    // Moss patches (small circles)
    gfx.fillStyle(0x2a5a18, 0.7);
    gfx.fillCircle(-w / 4, -h / 2 + 3, 4);
    gfx.fillCircle(w / 4, -h / 2 + 2, 3);

    gfx.setPosition(x, y);
    this.obstacles.push({ type: 'stump', x, y, w, h, gfx });
  }

  // ── Spawn: flying bird (player must duck) ────────────────────────────
  private spawnBird(): void {
    const bw = 46, bh = 24;
    const x  = W + Phaser.Math.Between(20, 50);
    const y  = BIRD_Y;

    const gfx = this.add.graphics().setDepth(DEPTH_WORLD + 1);

    // Wing-spread silhouette — dark brown, no rectangles
    gfx.fillStyle(0x1c1008);

    // Left wing: swept-back triangle
    gfx.fillTriangle(-bw / 2, 8, -5, -bh / 2, 0, 8);
    // Right wing
    gfx.fillTriangle(0, 8, 5, -bh / 2, bw / 2, 8);
    // Body ellipse
    gfx.fillEllipse(0, 10, 18, 10);
    // Head
    gfx.fillCircle(9, 3, 5);
    // Beak
    gfx.fillTriangle(13, 1, 20, 3, 13, 5);
    // Tail feathers
    gfx.fillTriangle(-7, 10, 7, 10, 0, 18);

    gfx.setPosition(x, y);
    this.obstacles.push({ type: 'bird', x, y, w: bw, h: bh + 12, gfx });
  }

  // ── Collision detection ───────────────────────────────────────────────
  private checkCollisions(): void {
    if (this.isInvincible || this.runEnded) return;

    const body  = this.playerSprite.body as Phaser.Physics.Arcade.Body;
    const inset = 5;
    const pLeft  = body.left  + inset;
    const pRight = body.right - inset;
    const pTop   = body.top   + inset;
    const pBot   = body.bottom;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];

      if (o.type === 'stump') {
        // Full AABB for stumps
        const sL = o.x - o.w / 2 + 4;
        const sR = o.x + o.w / 2 - 4;
        const sT = o.y - o.h / 2;
        const sB = o.y + o.h / 2;

        if (pLeft < sR && pRight > sL && pTop < sB && pBot > sT) {
          o.gfx.destroy();
          this.obstacles.splice(i, 1);
          this.onHit();
          break;
        }

      } else {
        // Bird: only collides when NOT ducking (horizontal check only)
        if (!this.isDucking) {
          const bL = o.x - o.w / 2 + 6;
          const bR = o.x + o.w / 2 - 6;

          if (pLeft < bR && pRight > bL) {
            o.gfx.destroy();
            this.obstacles.splice(i, 1);
            this.onHit();
            break;
          }
        }
      }
    }
  }

  // ── Hit handler ───────────────────────────────────────────────────────
  private onHit(): void {
    this.hitCount++;

    if (this.healthDots.length > 0) {
      const dot = this.healthDots.pop()!;
      this.tweens.add({ targets: dot, alpha: 0, scaleX: 2, scaleY: 2, duration: 300 });
    }

    this.cameras.main.shake(180, 0.012);
    this.playerSprite.setTint(0xff4444);
    this.isInvincible = true;
    this.time.delayedCall(900, () => {
      this.isInvincible = false;
      this.playerSprite.clearTint();
    });

    try { this.sound.play('collect', { volume: 0.3 }); } catch (_) {}

    if (this.hitCount >= MAX_HITS) {
      this.endRun(true);
    } else {
      this.game.events.emit('notify', `💥 Va chạm! Còn ${MAX_HITS - this.hitCount} lần`, '#ff8844');
    }
  }

  // ── Run ends → brief overlay → post-game dialog ────────────────────
  private endRun(caught: boolean): void {
    if (this.runEnded) return;
    this.runEnded = true;

    try { this.playerSprite.anims.stop(); } catch (_) {}
    for (const o of this.obstacles) o.gfx.destroy();
    this.obstacles = [];

    let pts = 0;
    let headline = '';
    let color    = '#ffffff';

    if (caught) {
      pts = 0; headline = '⚠ BỊ BẮT!'; color = '#ff4444';
    } else if (this.hitCount === 0) {
      pts = 15; headline = '🏆 THOÁT! Không va chạm!'; color = '#ffdd44';
    } else {
      pts = 8;  headline = `✅ THOÁT! (${this.hitCount} va chạm)`; color = '#88ff88';
    }

    this.gs.addScore(pts);
    this.gs.set('runnerHits', this.hitCount);

    // Result card
    this.add.rectangle(W / 2, H / 2, 430, 130, 0x000000, 0.90)
      .setStrokeStyle(2.5, caught ? 0xff3333 : 0x44cc88)
      .setDepth(30).setScrollFactor(0);
    this.add.text(W / 2, H / 2 - 36, headline, {
      fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color,
    }).setOrigin(0.5).setDepth(31).setScrollFactor(0);
    this.add.text(W / 2, H / 2 + 8, pts > 0 ? `+${pts} điểm` : '+0 điểm', {
      fontSize: '18px', fontFamily: 'Arial', color: '#f5c518',
    }).setOrigin(0.5).setDepth(31).setScrollFactor(0);

    this.game.events.emit('notify', pts > 0 ? `${headline} +${pts} điểm` : headline, color);

    // Show post-game dialogue after brief pause
    this.time.delayedCall(1800, () => {
      this.phase = 'postgame';
      this.launchDialog('c2s2-postgame');
    });
  }

  // ── Speed bar ─────────────────────────────────────────────────────────
  private updateSpeedBar(): void {
    const pct = (this.scrollSpeed - SPEED_TIER[0]) / (SPEED_TIER[SPEED_TIER.length - 1] - SPEED_TIER[0]);
    this.speedFill.setSize(100 * Math.min(pct, 1), 8);
    this.speedFill.setFillStyle(pct < 0.5 ? 0x44cc44 : pct < 0.8 ? 0xddaa22 : 0xff4422);
  }

  // ── Transition ────────────────────────────────────────────────────────
  private goToScene3(): void {
    if (this.transitionStarted) return;
    this.transitionStarted = true;
    this.gs.set('c2Progress', 2);
    try { this.sound.stopAll(); } catch (_) {}
    this.cameras.main.fadeOut(700, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('C2S3Photo');
    });
  }

  shutdown(): void {
    this.events.off('dialog-done', this.onDialogDone, this);
    for (const o of this.obstacles) o.gfx.destroy();
    this.obstacles = [];
  }
}
