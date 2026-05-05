import Phaser from 'phaser';
import { WhiteKeyPipeline } from '../pipelines/WhiteKeyPipeline';

// ─── Spritesheet layout ─────────────────────────────────────────────────────
//
// Player sheets — 3 cols × 4 rows (for gameplay walk animation):
//   player-m.jpg  1728×2304  → frameWidth=576,  frameHeight=576
//   player-f.jpg  1664×2496  → frameWidth=554,  frameHeight=624
//
// Character PNGs (2880×2880, transparent background):
//   char-player-m / char-player-f / char-kbroi / char-yakben / char-lan
//   char-thang / char-amaknoi / char-hung
//   All loaded as regular images — no frame data needed.

const SPRITESHEETS: { key: string; path: string; fw: number; fh: number }[] = [
  // Gameplay walk sheets (JPG, 3-col × 4-row)
  { key: 'player-m', path: 'assets/game/player-m.jpg', fw: 576, fh: 576 },
  { key: 'player-f', path: 'assets/game/player-f.jpg', fw: 554, fh: 624 },
  // Character sheets (PNG, 3-col × 3-row, 960×960 per frame)
  { key: 'char-player-m', path: 'assets/game/char-player-m.png', fw: 960, fh: 960 },
  { key: 'char-player-f', path: 'assets/game/char-player-f.png', fw: 960, fh: 960 },
  { key: 'char-kbroi',    path: 'assets/game/char-kbroi.png',    fw: 960, fh: 960 },
  { key: 'char-yakben',   path: 'assets/game/char-yakben.png',   fw: 960, fh: 960 },
  { key: 'char-lan',      path: 'assets/game/char-lan.png',      fw: 960, fh: 960 },
  { key: 'char-thang',    path: 'assets/game/char-thang.png',    fw: 960, fh: 960 },
  { key: 'char-amaknoi',  path: 'assets/game/char-amaknoi.png',  fw: 960, fh: 960 },
  { key: 'char-hung',     path: 'assets/game/char-hung.png',     fw: 960, fh: 960 },
];

const IMAGES: { key: string; path: string }[] = [
  { key: 'bg-ch1',    path: 'assets/game/bg-ch1.jpg'    },
  { key: 'bg-ch2',    path: 'assets/game/bg-ch2.jpg'    },
  { key: 'bg-forest', path: 'assets/game/bg-forest.jpg' },
  { key: 'bg-scene',  path: 'assets/game/bg-scene.jpg'  },
  { key: 'caycamlai', path: 'assets/game/Caycamlai.jpg' },
  { key: 'deer',      path: 'assets/game/HUƠU.png'      },
  { key: 'bo-tot',    path: 'assets/game/bo_tot.png'    },
  // ── Chapter 2 backgrounds ─────────────────────────────────────────
  { key: 'bg-c2-real',  path: 'assets/game/bg-c2-real.jpg'  },
  { key: 'bg-c2-game2', path: 'assets/game/bg-c2-game2.jpg' },
  // ── Chapter 2 collectible / evidence objects ──────────────────────
  { key: 'stuff-tape',   path: 'assets/game/stuff/stuff-tape.png'   },
  { key: 'stuff-gps',    path: 'assets/game/stuff/stuff-gps.png'    },
  { key: 'stuff-tree',   path: 'assets/game/stuff/stuff-tree.png'   },
  { key: 'stuff-gloves', path: 'assets/game/stuff/stuff-gloves.png' },
  { key: 'stuff-oil',    path: 'assets/game/stuff/stuff-oil.png'    },
  { key: 'stuff-tracks', path: 'assets/game/stuff/stuff-tracks.png' },
  { key: 'stuff-map',    path: 'assets/game/stuff/stuff-map.png'    },
  { key: 'stuff-idcard', path: 'assets/game/stuff/stuff-idcard.png' },
  { key: 'stuff-saw',    path: 'assets/game/stuff/stuff-saw.png'    },
];

// ─── Audio ──────────────────────────────────────────────────────────────────
const AUDIO: { key: string; path: string }[] = [
  { key: 'forest-ambient', path: 'assets/audio/forest-ambient.mp3'  },
  { key: 'jump',    path: 'assets/audio/jump sound.mp3'    },
  { key: 'success', path: 'assets/audio/success sound.mp3' },
  { key: 'camera',  path: 'assets/audio/camera sound.mp3'  },
  { key: 'collect', path: 'assets/audio/collect sound.wav' },
];

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload(): void {
    // ── Register WhiteKey pipeline (removes white JPG backgrounds on player sprites) ──
    if (this.game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
      try {
        this.game.renderer.pipelines.addPostPipeline(
          'WhiteKey',
          WhiteKeyPipeline as unknown as typeof Phaser.Renderer.WebGL.Pipelines.PostFXPipeline,
        );
      } catch (_) {}
    }

    // ── Progress bar ─────────────────────────────────────────────────────────
    const { width: W, height: H } = this.scale;
    this.add.rectangle(W / 2, H / 2, W, H, 0x0d1a07);
    this.add.text(W / 2, H / 2 - 40, 'Đang tải...', {
      fontSize: '16px', fontFamily: 'Arial', color: '#88cc66',
    }).setOrigin(0.5);
    this.add.rectangle(W / 2, H / 2, 320, 22, 0x1a3a10).setStrokeStyle(1.5, 0x4ab840);
    const bar = this.add.rectangle(W / 2 - 158, H / 2, 0, 18, 0x4ab840).setOrigin(0, 0.5);
    this.load.on('progress', (v: number) => { bar.setSize(316 * v, 18); });

    // ── Load assets ───────────────────────────────────────────────────────────
    for (const ss of SPRITESHEETS) {
      this.load.spritesheet(ss.key, ss.path, { frameWidth: ss.fw, frameHeight: ss.fh });
    }
    for (const img of IMAGES) {
      this.load.image(img.key, img.path);
    }
    for (const aud of AUDIO) {
      this.load.audio(aud.key, aud.path);
    }
  }

  create(): void {
    // ── Player walk animations (3-col × 4-row sheets) ──────────────────────
    this.makeWalkAnims('player-m');
    this.makeWalkAnims('player-f');

    this.scene.start('CharacterSelectScene');
  }

  /**
   * Creates directional animations for a 3×4 walk spritesheet.
   * Row 0 = down, Row 1 = left, Row 3 = up. Right is produced by flipping left.
   */
  private makeWalkAnims(key: string): void {
    const dirs = [
      { name: 'down',  start: 0,  end: 2  },
      { name: 'left',  start: 3,  end: 5  },
      { name: 'up',    start: 9,  end: 11 },
    ] as const;

    for (const d of dirs) {
      const animKey = `${key}-${d.name}`;
      if (!this.anims.exists(animKey)) {
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(key, { start: d.start, end: d.end }),
          frameRate: 8,
          repeat: -1,
        });
      }
    }
  }
}
