import Phaser from 'phaser';

/**
 * WhiteKeyPipeline
 * ─────────────────
 * Post-FX pipeline that removes near-white pixels from JPG sprites.
 * Apply with: sprite.setPostPipeline('WhiteKey')
 *
 * Uniforms:
 *   threshold  – how close to white before cutting (0–1, default 0.82)
 *   softness   – feather width around the cut edge   (default 0.08)
 */
export class WhiteKeyPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Phaser.Game) {
    super({
      game,
      name: 'WhiteKey',
      fragShader: `
        precision mediump float;

        uniform sampler2D uMainSampler;
        uniform float     threshold;
        uniform float     softness;

        varying vec2 outTexCoord;

        void main () {
          vec4 c = texture2D(uMainSampler, outTexCoord);

          // Luminance of the pixel
          float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));

          // Also check if all channels are close together (grey / white)
          float spread = max(max(abs(c.r - c.g), abs(c.g - c.b)), abs(c.r - c.b));

          // A pixel is "background" when it is bright AND nearly grey/white
          float isBg = step(threshold - softness, lum) * step(spread, 0.18);

          // Smooth alpha: 1 = opaque (keep), 0 = transparent (cut)
          float alpha = 1.0 - smoothstep(threshold - softness, threshold + softness * 0.5, lum * isBg + (1.0 - isBg) * 0.0);

          // Keep original alpha if the pixel was already transparent
          alpha = min(alpha, c.a);

          gl_FragColor = vec4(c.rgb, alpha);
        }
      `,
    });
  }

  onBoot(): void {
    this.set1f('threshold', 0.82);
    this.set1f('softness', 0.08);
  }

  /** Convenience: adjust threshold after creation */
  setThreshold(value: number): this {
    this.set1f('threshold', value);
    return this;
  }
}
