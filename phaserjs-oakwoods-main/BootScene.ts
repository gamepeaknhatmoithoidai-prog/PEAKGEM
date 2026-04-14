import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    // Load the manifest first so we can queue the rest dynamically
    this.load.json('manifest', 'assets/oakwoods/assets.json');
  }

  create() {
    const manifest = this.cache.json.get('manifest');
    this.registry.set('manifest', manifest);

    // ── Spritesheets ──────────────────────────────────────────────────────
    for (const ss of manifest.spritesheets ?? []) {
      this.load.spritesheet(ss.key, `assets/oakwoods/${ss.path}`, {
        frameWidth:  ss.frameWidth,
        frameHeight: ss.frameHeight,
      });
    }

    // ── Images ────────────────────────────────────────────────────────────
    for (const img of manifest.images ?? []) {
      this.load.image(img.key, `assets/oakwoods/${img.path}`);
    }

    // ── Tilesets ──────────────────────────────────────────────────────────
    for (const ts of manifest.tilesets ?? []) {
      this.load.image(ts.key, `assets/oakwoods/${ts.path}`);
    }

    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.scene.start('GameScene');
    });

    this.load.start();
  }
}
