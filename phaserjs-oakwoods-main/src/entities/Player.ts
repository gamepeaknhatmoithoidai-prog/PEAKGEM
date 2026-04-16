import Phaser from 'phaser';
import { PLAYER_SPEED } from '../constants';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private interactKey!: Phaser.Input.Keyboard.Key;
  private cameraKey!: Phaser.Input.Keyboard.Key;
  private _frozen = false;
  private _facing: 'down' | 'up' | 'left' | 'right' = 'down';
  private _textureKey = '';
  private _hasAnims = false;

  constructor(scene: Phaser.Scene, x: number, y: number, gender: 'male' | 'female') {
    const texKey = gender === 'male' ? 'player-m' : 'player-f';
    super(scene, x, y, texKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this._textureKey = texKey;
    // Detect if real spritesheet was loaded (multiple frames) or procedural (1 frame)
    this._hasAnims = (scene.textures.get(texKey)?.frameTotal ?? 1) > 1;

    this.setDepth(6);

    if (this._hasAnims) {
      // Measured frame sizes: player-m=576×576, player-f=554×624 (3-col×4-row sheets).
      // scale 0.15 → frame display ≈ 86 px tall; matches NPC scale 0.15.
      // body.setSize/Offset are in LOCAL (un-scaled) frame pixels and auto-scale.
      // Body bottom placed at character feet:
      //   male:   feet ≈ frame y=540 → offset_y=220, height=320 → body.bottom=world_y+37px
      //   female: feet ≈ frame y=564 → offset_y=244, height=320 → body.bottom=world_y+37px
      this.setScale(0.15);
      const body = this.body as Phaser.Physics.Arcade.Body;
      if (gender === 'male') {
        // player-m 576×576: character centered, feet at local y≈540
        body.setSize(140, 320);
        body.setOffset(218, 220);
      } else {
        // player-f 554×624: character centered, feet at local y≈564
        body.setSize(120, 320);
        body.setOffset(217, 244);
      }
      // Remove white JPG background via post-pipeline
      try { this.setPostPipeline('WhiteKey'); } catch (_) {}
    } else {
      // Procedural 32×48 sprite fallback
      this.setScale(1.5);
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setSize(18, 20);
      body.setOffset(7, 22);
    }
    (this.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);

    const kb = scene.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.wasd = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.interactKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.cameraKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.C);

    // Start idle pose facing down
    if (this._hasAnims) this.anims.play(`${texKey}-down`, true);
  }

  freeze(): void {
    this._frozen = true;
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
  }

  unfreeze(): void { this._frozen = false; }

  get frozen(): boolean { return this._frozen; }
  get facing(): 'down' | 'up' | 'left' | 'right' { return this._facing; }

  isInteractJustPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.interactKey);
  }

  isEKeyDown(): boolean {
    return this.interactKey.isDown;
  }

  isCameraJustPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.cameraKey);
  }

  update(_delta: number): void {
    if (this._frozen) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const goL = this.cursors.left.isDown || this.wasd.left.isDown;
    const goR = this.cursors.right.isDown || this.wasd.right.isDown;
    const goU = this.cursors.up.isDown || this.wasd.up.isDown;
    const goD = this.cursors.down.isDown || this.wasd.down.isDown;

    let vx = 0, vy = 0;
    
    // Set velocity - use else if to prevent conflicting directions
    if (goL) vx = -PLAYER_SPEED;
    else if (goR) vx = PLAYER_SPEED;
    
    if (goU) vy = -PLAYER_SPEED;
    else if (goD) vy = PLAYER_SPEED;

    // Determine facing direction - only update when moving
    if (goU) this._facing = 'up';
    else if (goD) this._facing = 'down';
    else if (goL) this._facing = 'left';
    else if (goR) this._facing = 'right';

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

    // In platformer scenes (world gravity > 0) only control X velocity so that
    // jump impulses and gravity are never zeroed out on each frame.
    const worldGravityY = (this.scene.physics as Phaser.Physics.Arcade.ArcadePhysics).world.gravity.y;
    if (worldGravityY !== 0) {
      body.setVelocityX(vx);
    } else {
      body.setVelocity(vx, vy);
    }


    // Directional walk animation — right reuses the left animation flipped
    if (this._hasAnims) {
      const moving = vx !== 0 || vy !== 0;
      const animDir = this._facing === 'right' ? 'left' : this._facing;
      const animKey = `${this._textureKey}-${animDir}`;
      this.setFlipX(this._facing === 'right');
      if (moving) {
        if (this.anims.currentAnim?.key !== animKey) this.anims.play(animKey, true);
      } else {
        this.anims.pause();
      }
    }
  }
}
