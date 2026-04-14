import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { W, H } from '../constants';

export class CharacterSelectScene extends Phaser.Scene {
  private gs!: GS;
  private selectedGender: 'male' | 'female' = 'male';
  private playerName = '';
  private nameDisplay!: Phaser.GameObjects.Text;
  private maleBg!: Phaser.GameObjects.Rectangle;
  private femaleBg!: Phaser.GameObjects.Rectangle;
  private maleSprite!: Phaser.GameObjects.Image;
  private femaleSprite!: Phaser.GameObjects.Image;
  private cursorVisible = true;
  private cursorTimer = 0;
  private nameInputActive = false;
  private startBtn!: Phaser.GameObjects.Container;

  constructor() { super('CharacterSelectScene'); }

  create(): void {
    this.gs = new GS(this.registry);
    this.gs.reset();

    this.drawBackground();
    this.buildTitle();
    this.buildGenderSelect();
    this.buildNameInput();
    this.buildStartButton();
    this.setupKeyboard();
  }

  // ── Background ──────────────────────────────────────────────────────
  private drawBackground(): void {
    if (this.textures.exists('bg-scene')) {
      this.add.image(W / 2, H / 2, 'bg-scene')
        .setDisplaySize(W, H).setDepth(0).setAlpha(0.88);
      const g = this.add.graphics().setDepth(1);
      g.fillStyle(0x000000, 0.45);
      g.fillRect(0, 0, W, H);
    } else {
      this.add.rectangle(W / 2, H / 2, W, H, 0x0d1a07).setDepth(0);
      const g = this.add.graphics().setDepth(0);
      g.fillStyle(0x0a1505, 1);
      const silhouettes = [
        { x: 40, h: 340 }, { x: 100, h: 280 }, { x: 180, h: 360 },
        { x: 840, h: 300 }, { x: 900, h: 350 }, { x: 940, h: 260 },
      ];
      for (const s of silhouettes) {
        g.fillTriangle(s.x - 30, H, s.x + 30, H, s.x, H - s.h);
        g.fillRect(s.x - 8, H - 60, 16, 60);
      }
    }
  }

  // ── Title ───────────────────────────────────────────────────────────
  private buildTitle(): void {
    this.add.text(W / 2, 40, 'RỪNG CÁT TIÊN', {
      fontSize: '32px', fontFamily: 'Georgia, serif',
      color: '#4ab840', stroke: '#0d1a07', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(2);

    this.add.text(W / 2, 76, 'Hành Trình Bảo Vệ', {
      fontSize: '16px', fontFamily: 'Arial',
      color: '#88cc66', stroke: '#0d1a07', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(2);

    const dg = this.add.graphics().setDepth(2);
    dg.lineStyle(1.5, 0x4ab840, 0.6);
    dg.lineBetween(W / 2 - 160, 90, W / 2 + 160, 90);
  }

  // ── Gender selection ────────────────────────────────────────────────
  private buildGenderSelect(): void {
    this.add.text(W / 2, 112, 'Chọn nhân vật của bạn:', {
      fontSize: '15px', fontFamily: 'Arial', color: '#cceeaa',
    }).setOrigin(0.5).setDepth(2);

    // Use same scale (0.18) as actual player character in gameplay
    const playerScale = 0.18;

    // ── Male card ──────────────────────────────────────────────────
    this.maleBg = this.add.rectangle(W / 2 - 90, 210, 130, 180, 0x1a3a10)
      .setDepth(1).setInteractive({ useHandCursor: true });

    this.maleSprite = this.add.image(W / 2 - 90, 200, 'player-m', this.idleFrame('player-m'))
      .setScale(playerScale).setDepth(3);
    // FIX: remove white JPG background
    this.removeWhiteBg(this.maleSprite, 'player-m');

    this.add.text(W / 2 - 90, 298, 'Nam', {
      fontSize: '14px', fontFamily: 'Arial', color: '#cceeaa',
    }).setOrigin(0.5).setDepth(3);

    // ── Female card ────────────────────────────────────────────────
    this.femaleBg = this.add.rectangle(W / 2 + 90, 210, 130, 180, 0x1a3a10)
      .setDepth(1).setInteractive({ useHandCursor: true });

    this.femaleSprite = this.add.image(W / 2 + 90, 200, 'player-f', this.idleFrame('player-f'))
      .setScale(playerScale).setDepth(3);
    // FIX: remove white JPG background
    this.removeWhiteBg(this.femaleSprite, 'player-f');

    this.add.text(W / 2 + 90, 298, 'Nữ', {
      fontSize: '14px', fontFamily: 'Arial', color: '#cceeaa',
    }).setOrigin(0.5).setDepth(3);

    this.maleBg.on('pointerdown', () => this.selectGender('male'));
    this.femaleBg.on('pointerdown', () => this.selectGender('female'));
    this.maleBg.on('pointerover',  () => { if (this.selectedGender !== 'male')   this.maleBg.setFillStyle(0x223a15); });
    this.maleBg.on('pointerout',   () => { if (this.selectedGender !== 'male')   this.maleBg.setFillStyle(0x1a3a10); });
    this.femaleBg.on('pointerover',() => { if (this.selectedGender !== 'female') this.femaleBg.setFillStyle(0x223a15); });
    this.femaleBg.on('pointerout', () => { if (this.selectedGender !== 'female') this.femaleBg.setFillStyle(0x1a3a10); });

    this.selectGender('male');
  }

  /**
   * removeWhiteBg
   * ─────────────
   * Two-strategy approach:
   *
   * Strategy A (WebGL — best quality):
   *   Apply the WhiteKey post-FX pipeline that was registered in BootScene.
   *   This runs a GLSL shader that cuts near-white pixels smoothly.
   *
   * Strategy B (Canvas fallback):
   *   Read the image pixels via an off-screen canvas, set near-white pixels
   *   to transparent, and replace the texture in the Phaser cache.
   *   Works when WebGL pipelines are unavailable (Canvas renderer).
   */
  private removeWhiteBg(sprite: Phaser.GameObjects.Image, textureKey: string): void {
    // Only needed for real photo/JPG assets — procedural textures are already clean
    const tex = this.textures.get(textureKey);
    if (!tex || tex.frameTotal <= 1) return; // procedural 32×48 sprite — skip

    // ── Strategy A: WebGL post-pipeline ────────────────────────────
    if (this.game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
      try {
        sprite.setPostPipeline('WhiteKey');
        return; // done
      } catch (e) {
        console.warn('WhiteKey pipeline not registered, falling back to canvas method', e);
      }
    }

    // ── Strategy B: Canvas pixel manipulation ──────────────────────
    this.removeWhiteBgCanvas(sprite, textureKey);
  }

  /**
   * Canvas-based white-background removal.
   * Reads every pixel; if it is "near white" (all channels > threshold)
   * it sets alpha = 0.  Replaces the cached Phaser texture so all
   * instances of this key also benefit.
   */
  private removeWhiteBgCanvas(sprite: Phaser.GameObjects.Image, textureKey: string): void {
    const tex = this.textures.get(textureKey);
    const src = tex.getSourceImage() as HTMLImageElement;
    if (!src || !src.width) return;

    try {
      const canvas  = document.createElement('canvas');
      canvas.width  = src.naturalWidth  || src.width;
      canvas.height = src.naturalHeight || src.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(src, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Threshold: R, G, B all above this value → treat as background
      const WHITE_THRESH = 210;
      // Max colour spread allowed (so we don't erase bright saturated colours)
      const MAX_SPREAD   = 40;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const spread = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));

        if (r > WHITE_THRESH && g > WHITE_THRESH && b > WHITE_THRESH && spread < MAX_SPREAD) {
          // Fade alpha proportionally to how white the pixel is
          const whiteness = Math.min(r, g, b) / 255;
          const fade = Math.max(0, (whiteness - (WHITE_THRESH / 255)) / (1 - WHITE_THRESH / 255));
          data[i + 3] = Math.round(data[i + 3] * (1 - fade));
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Replace texture in Phaser's cache
      const cleanKey = `${textureKey}-nobg`;
      if (!this.textures.exists(cleanKey)) {
        this.textures.addCanvas(cleanKey, canvas);
      }
      sprite.setTexture(cleanKey, this.idleFrame(cleanKey));

    } catch (e) {
      // Cross-origin or other canvas error — silently skip
      console.warn('Canvas white-removal failed for', textureKey, e);
    }
  }

  private idleFrame(key: string): number | undefined {
    const tex = this.textures.get(key);
    return tex && tex.frameTotal > 1 ? 0 : undefined;
  }

  private spriteScale(key: string, targetH: number): number {
    const tex = this.textures.get(key);
    const isSheet = tex.frameTotal > 1;
    const frameH = isSheet
      ? tex.get(0).realHeight
      : (tex.getSourceImage() as HTMLImageElement).height;
    return frameH > 0 ? targetH / frameH : (isSheet ? 0.22 : 2.5);
  }

  private selectGender(g: 'male' | 'female'): void {
    this.selectedGender = g;
    this.maleBg.setStrokeStyle(g === 'male'   ? 2 : 0, 0x4ab840);
    this.femaleBg.setStrokeStyle(g === 'female' ? 2 : 0, 0x4ab840);
    this.maleSprite.setAlpha(g === 'male'   ? 1 : 0.5);
    this.femaleSprite.setAlpha(g === 'female' ? 1 : 0.5);
    this.playClick();
  }

  // ── Name input ──────────────────────────────────────────────────────
  private buildNameInput(): void {
    this.add.text(W / 2, 320, 'Tên nhân vật (tối đa 16 ký tự):', {
      fontSize: '13px', fontFamily: 'Arial', color: '#cceeaa',
    }).setOrigin(0.5).setDepth(2);

    const inputBg = this.add.rectangle(W / 2, 350, 280, 36, 0x0a1a05)
      .setStrokeStyle(1.5, 0x4ab840).setDepth(2).setInteractive({ useHandCursor: true });

    this.nameDisplay = this.add.text(W / 2, 350, '', {
      fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5).setDepth(3);

    this.add.text(W / 2, 372, '← Nhập bàn phím để gõ tên (hỗ trợ tiếng Việt)', {
      fontSize: '10px', fontFamily: 'Arial', color: '#778866',
    }).setOrigin(0.5).setDepth(2);

    inputBg.on('pointerdown', () => {
      this.nameInputActive = true;
      inputBg.setStrokeStyle(2, 0x88ff44);
    });

    this.input.on('pointerdown', (_p: Phaser.Input.Pointer, objs: Phaser.GameObjects.GameObject[]) => {
      if (!objs.includes(inputBg)) {
        this.nameInputActive = false;
        inputBg.setStrokeStyle(1.5, 0x4ab840);
      }
    });
  }

  // ── Start button ────────────────────────────────────────────────────
  private buildStartButton(): void {
    const bg = this.add.rectangle(0, 0, 200, 44, 0x2a6a18)
      .setStrokeStyle(2, 0x4ab840);
    const label = this.add.text(0, 0, 'BẮT ĐẦU HÀNH TRÌNH ▶', {
      fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);

    this.startBtn = this.add.container(W / 2, 436, [bg, label])
      .setDepth(5).setSize(200, 44).setInteractive({ useHandCursor: true });

    this.startBtn.on('pointerover', () => bg.setFillStyle(0x3a8a28));
    this.startBtn.on('pointerout',  () => bg.setFillStyle(0x2a6a18));
    this.startBtn.on('pointerdown', () => this.startGame());

    this.input.keyboard!.on('keydown-ENTER', () => this.startGame());
  }

  // ── Keyboard input ──────────────────────────────────────────────────
  private setupKeyboard(): void {
    this.input.keyboard!.on('keydown', (ev: KeyboardEvent) => {
      if (!this.nameInputActive) return;
      if (ev.key === 'Backspace') {
        this.playerName = [...this.playerName].slice(0, -1).join('');
      } else if (ev.key === 'Enter') {
        this.startGame();
      } else if (ev.key.length === 1 && this.playerName.length < 16) {
        this.playerName += ev.key;
      }
      this.updateNameDisplay();
    });

    this.nameInputActive = true;
  }

  private updateNameDisplay(): void {
    const cursor = this.nameInputActive && this.cursorVisible ? '|' : '';
    this.nameDisplay.setText(this.playerName + cursor);
  }

  update(_time: number, delta: number): void {
    this.cursorTimer += delta;
    if (this.cursorTimer > 500) {
      this.cursorVisible = !this.cursorVisible;
      this.cursorTimer = 0;
      this.updateNameDisplay();
    }
  }

  // ── Start game ──────────────────────────────────────────────────────
  private startGame(): void {
    const name = this.playerName.trim() || (this.selectedGender === 'male' ? 'Thuận' : 'Lan');
    this.gs.set('playerName', name);
    this.gs.set('gender', this.selectedGender);

    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('IntroScene');
      // this.scene.launch('UIScene');
    });

    this.playClick();
  }

  private playClick(): void {
    try { this.sound.play('click', { volume: 0.3 }); } catch (_) {}
  }
}
