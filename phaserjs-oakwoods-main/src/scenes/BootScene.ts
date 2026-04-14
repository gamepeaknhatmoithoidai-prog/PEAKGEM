import Phaser from 'phaser';
import { WhiteKeyPipeline } from '../pipelines/WhiteKeyPipeline';

// ─── Spritesheet layout ─────────────────────────────────────────────────────
//
// Player sheets — 3 cols × 4 rows (AI-generated to match existing layout):
//   player-m.jpg  1728×2304  → frameWidth=576,  frameHeight=576
//   player-f.jpg  1664×2496  → frameWidth=554,  frameHeight=624
//
// NPC sheets — all 2048×2048, two layouts:
//   3-col × 3-row  (kbroi, yakben, lan, thang):
//     floor(2048/3) = 682 px per frame
//   4-col × 2-row  (amaknoi, hung):
//     2048/4 = 512 wide × 2048/2 = 1024 tall per frame
//     Row 0: FRONT(0) SIDE(1) BACK(2) [empty(3)]
//     Row 1: WALK1(4) WALK2(5) WALK3(6) WALK4(7)
//
// Idle frame for every NPC is frame index 0 (front/idle pose).

const SPRITESHEETS: { key: string; path: string; fw: number; fh: number }[] = [
  // ── Player (3-col × 4-row walk sheets) ──
  { key: 'player-m',   path: 'assets/game/player-m.jpg',   fw: 576, fh: 576  },
  { key: 'player-f',   path: 'assets/game/player-f.jpg',   fw: 554, fh: 624  },
  // ── NPC 3×3 sheets (682×682 per frame) ──
  { key: 'npc-kbroi',  path: 'assets/game/npc-kbroi.jpg',  fw: 682, fh: 682  },
  { key: 'npc-yakben', path: 'assets/game/npc-yakben.jpg', fw: 682, fh: 682  },
  { key: 'npc-lan',    path: 'assets/game/npc-lan.jpg',    fw: 682, fh: 682  },
  { key: 'npc-thang',  path: 'assets/game/npc-thang.jpg',  fw: 682, fh: 682  },
  // ── NPC 4×2 sheets (512×1024 per frame) ──
  { key: 'npc-amaknoi',path: 'assets/game/npc-amaknoi.jpg',fw: 512, fh: 1024 },
  { key: 'npc-hung',   path: 'assets/game/npc-hung.jpg',   fw: 512, fh: 1024 },
];

const IMAGES: { key: string; path: string }[] = [
  { key: 'bg-ch1',    path: 'assets/game/bg-ch1.jpg'    },
  { key: 'bg-ch2',    path: 'assets/game/bg-ch2.jpg'    },
  { key: 'bg-forest', path: 'assets/game/bg-forest.jpg' },
  { key: 'bg-scene',  path: 'assets/game/bg-scene.jpg'  },
];

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload(): void {
    // ── Register WhiteKey post-FX pipeline (removes white JPG backgrounds) ──
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
  }

  create(): void {
    // ── Player walk animations (3-col × 4-row sheets) ──────────────────────
    this.makeWalkAnims('player-m');
    this.makeWalkAnims('player-f');

    // ── NPC idle animations — one frame (front/idle pose = frame 0) ─────────
    // All NPCs use frame 0 as their resting pose.
    // For 4-col × 2-row NPCs (amaknoi, hung) walk frames are 4-7.
    const npcIdleFrames: Record<string, { start: number; end: number }> = {
      'npc-kbroi':   { start: 0, end: 0 },
      'npc-yakben':  { start: 0, end: 0 },
      'npc-lan':     { start: 0, end: 0 },
      'npc-thang':   { start: 0, end: 0 },
      'npc-amaknoi': { start: 0, end: 0 },
      'npc-hung':    { start: 0, end: 0 },
    };
    for (const [key, f] of Object.entries(npcIdleFrames)) {
      const animKey = `${key}-idle`;
      if (!this.anims.exists(animKey)) {
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(key, { start: f.start, end: f.end }),
          frameRate: 5,
          repeat: -1,
        });
      }
    }

    this.scene.start('CharacterSelectScene');
  }

  /**
   * Creates 4 directional animations for a 3×4 walk spritesheet.
   * Row 0 = down/front (frames 0-2)
   * Row 1 = right      (frames 3-5)
   * Row 2 = left       (frames 6-8)
   * Row 3 = up/back    (frames 9-11)
   */
  private makeWalkAnims(key: string): void {
    const dirs = [
      { name: 'down',  start: 0,  end: 2  },
      { name: 'left',  start: 3,  end: 5  },   // row 1 = facing left
      { name: 'right', start: 6,  end: 8  },   // row 2 = facing right
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
