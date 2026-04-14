import Phaser from 'phaser';

/** PostFX pipeline that removes near-white JPG backgrounds from sprites. */
const FRAG = `
  precision mediump float;
  uniform sampler2D uMainSampler;
  varying vec2 outTexCoord;
  void main () {
    vec4  c    = texture2D(uMainSampler, outTexCoord);
    float minC = min(c.r, min(c.g, c.b));
    float maxC = max(c.r, max(c.g, c.b));
    float sat  = maxC - minC;
    // pixels with all channels bright AND low saturation → white background
    float isWhite = step(0.87, minC) * step(sat, 0.12);
    gl_FragColor  = mix(c, vec4(0.0, 0.0, 0.0, 0.0), isWhite);
  }
`;

export class WhiteKeyPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Phaser.Game) {
    super({ game, name: 'WhiteKey', fragShader: FRAG });
  }
}
