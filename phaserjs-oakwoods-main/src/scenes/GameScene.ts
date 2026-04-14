import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private bgLayer1!: Phaser.GameObjects.TileSprite;
  private bgLayer2!: Phaser.GameObjects.TileSprite;
  private bgLayer3!: Phaser.GameObjects.TileSprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private attackKey!: Phaser.Input.Keyboard.Key;

  // State machine flags
  private isAttacking = false;
  private onGround = false;

  // Jump config — tweak these to feel right
  private readonly JUMP_VELOCITY = -420;   // negative = upward
  private readonly MOVE_SPEED    = 160;

  // How far right we've generated tiles so far
  private generatedUpToTile = 0;
  private readonly TILE_SIZE   = 24;
  private readonly MAP_TILES_W = 500;

  private map!: Phaser.Tilemaps.Tilemap;
  private tileset!: Phaser.Tilemaps.Tileset;

  constructor() { super({ key: 'GameScene' }); }

  // ─── create ────────────────────────────────────────────────────────────────

  create() {
    const { width: W, height: H } = this.scale;
    const manifest = this.registry.get('manifest');

    // ── Parallax background (single, non-mirrored) ──────────────────────────
    // Use the full game height so there is NO gap and NO need for a flipped copy.
    this.bgLayer1 = this.add.tileSprite(0, 0, W, H, 'oakwoods-bg-layer1')
      .setOrigin(0, 0).setScrollFactor(0);
    this.bgLayer2 = this.add.tileSprite(0, 0, W, H, 'oakwoods-bg-layer2')
      .setOrigin(0, 0).setScrollFactor(0);
    this.bgLayer3 = this.add.tileSprite(0, 0, W, H, 'oakwoods-bg-layer3')
      .setOrigin(0, 0).setScrollFactor(0);

    // ── Ground tilemap ──────────────────────────────────────────────────────
    this.map = this.make.tilemap({
      tileWidth:  this.TILE_SIZE,
      tileHeight: this.TILE_SIZE,
      width:      this.MAP_TILES_W,
      height:     10,             // a few rows tall is enough
    });

    const ts = this.map.addTilesetImage('oakwoods-tileset', 'oakwoods-tileset', 24, 24, 0, 0);
    if (!ts) throw new Error('Tileset not found');
    this.tileset = ts;

    const layer = this.map.createBlankLayer('ground', this.tileset, 0, 0);
    if (!layer) throw new Error('Layer creation failed');
    this.groundLayer = layer;

    // ── Seed first chunk of tiles ───────────────────────────────────────────
    this.generateTiles(0, 60);

    // Make all filled tiles collidable
    this.groundLayer.setCollisionByExclusion([-1]);

    // ── Player ──────────────────────────────────────────────────────────────
    // Ground row sits at row 0 of the layer.
    // Layer Y is placed so the top of row 0 aligns with the visual ground line.
    // Adjust GROUND_ROW_Y to taste (pixels from top of screen).
    const GROUND_ROW_Y = H - this.TILE_SIZE * 3;   // 3 tile rows from bottom
    this.groundLayer.setY(GROUND_ROW_Y);

    // Spawn player ON TOP of the ground: feet at GROUND_ROW_Y
    const spawnX = 80;
    const spawnY = GROUND_ROW_Y - 1;                // 1 px above tile top

    this.player = this.physics.add.sprite(spawnX, spawnY, 'oakwoods-char-blue');
    this.player.setOrigin(0.5, 1);                   // origin at feet
    // Custom hitbox: 20 wide, 38 tall, centred in the 56×56 frame
    this.player.setSize(20, 38).setOffset(18, 16);

    // ── Physics setup ───────────────────────────────────────────────────────
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(0);   // world gravity (set in game config) handles falling
    // We do NOT call body.reset() or set velocityY to 0 after jump — let gravity work

    this.physics.add.collider(this.player, this.groundLayer);

    // ── Camera ──────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, this.MAP_TILES_W * this.TILE_SIZE, H);
    this.cameras.main.startFollow(this.player, true, 0.12, 1);
    this.cameras.main.setDeadzone(80, 0);

    // ── Animations ──────────────────────────────────────────────────────────
    this.setupAnimations(manifest);

    // ── Input ───────────────────────────────────────────────────────────────
    this.cursors    = this.input.keyboard!.createCursorKeys();
    this.attackKey  = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.X);

    // ── Start idle ──────────────────────────────────────────────────────────
    this.player.play('idle');
  }

  // ─── update ────────────────────────────────────────────────────────────────

  update() {
    // Scroll parallax layers relative to camera
    const camX = this.cameras.main.scrollX;
    this.bgLayer1.tilePositionX = camX * 0.1;
    this.bgLayer2.tilePositionX = camX * 0.3;
    this.bgLayer3.tilePositionX = camX * 0.5;

    // Generate more tiles as player moves right
    const tileAhead = Math.floor((this.player.x + 640) / this.TILE_SIZE);
    if (tileAhead > this.generatedUpToTile) {
      this.generateTiles(this.generatedUpToTile, tileAhead + 20);
    }

    this.handleMovement();
    this.handleAnimation();
  }

  // ─── movement & jump ───────────────────────────────────────────────────────

  private handleMovement() {
    const body   = this.player.body as Phaser.Physics.Arcade.Body;
    this.onGround = body.blocked.down;

    // Horizontal
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-this.MOVE_SPEED);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(this.MOVE_SPEED);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    // Jump — only on ground, only on JUST-pressed (no hold-to-double-jump)
    if (this.onGround && Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      // Set upward velocity; gravity (set in game config) will decelerate and
      // then accelerate downward naturally — we never touch velocityY again.
      this.player.setVelocityY(this.JUMP_VELOCITY);
      this.onGround = false;
    }

    // Attack
    if (!this.isAttacking && Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.isAttacking = true;
      this.player.play('attack', true);
      this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.isAttacking = false;
      });
    }
  }

  // ─── animation state machine ───────────────────────────────────────────────

  private handleAnimation() {
    if (this.isAttacking) return;   // attack locks until complete

    const body = this.player.body as Phaser.Physics.Arcade.Body;

    if (!this.onGround) {
      if (body.velocity.y < 0) {
        this.player.play('jump', true);
      } else {
        this.player.play('fall', true);
      }
    } else if (Math.abs(body.velocity.x) > 10) {
      this.player.play('run', true);
    } else {
      this.player.play('idle', true);
    }
  }

  // ─── tile generation ───────────────────────────────────────────────────────

  private generateTiles(fromTile: number, toTile: number) {
    const capped = Math.min(toTile, this.MAP_TILES_W - 1);
    for (let x = fromTile; x <= capped; x++) {
      // Row 0 = surface tile, rows 1+ = fill
      this.groundLayer.putTileAt(1, x, 0);   // top surface
      this.groundLayer.putTileAt(2, x, 1);   // fill
      this.groundLayer.putTileAt(2, x, 2);
    }
    this.generatedUpToTile = capped;
    this.groundLayer.setCollisionByExclusion([-1]);
  }

  // ─── animations ────────────────────────────────────────────────────────────

  private setupAnimations(manifest: any) {
    const key = 'oakwoods-char-blue';

    // Avoid re-creating if scene restarts
    if (this.anims.exists('idle')) return;

    const defs: Record<string, { start: number; end: number; frameRate?: number; repeat?: number }> = {
      idle:   { start: 0,  end: 5,  frameRate: 8,  repeat: -1 },
      attack: { start: 8,  end: 13, frameRate: 12, repeat: 0  },
      run:    { start: 16, end: 21, frameRate: 10, repeat: -1 },
      jump:   { start: 28, end: 31, frameRate: 10, repeat: 0  },
      fall:   { start: 35, end: 37, frameRate: 8,  repeat: -1 },
    };

    // If manifest carries animation defs, prefer those
    const manifestAnims: any[] = manifest?.animations ?? [];

    for (const [name, cfg] of Object.entries(defs)) {
      const fromManifest = manifestAnims.find((a: any) => a.key === name);
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(key, {
          start: fromManifest?.start ?? cfg.start,
          end:   fromManifest?.end   ?? cfg.end,
        }),
        frameRate: fromManifest?.frameRate ?? cfg.frameRate ?? 10,
        repeat:    fromManifest?.repeat    ?? cfg.repeat    ?? -1,
      });
      // Re-key with the animation name, not the texture key
      const created = this.anims.get(key);
      if (created) { created.key = name; }
      // Phaser stores by key — use addAnimation helper
      this.anims.remove(key);
      this.anims.create({
        key:       name,
        frames:    this.anims.generateFrameNumbers(key, {
          start: fromManifest?.start ?? cfg.start,
          end:   fromManifest?.end   ?? cfg.end,
        }),
        frameRate: fromManifest?.frameRate ?? cfg.frameRate ?? 10,
        repeat:    fromManifest?.repeat    ?? cfg.repeat    ?? -1,
      });
    }
  }
}
