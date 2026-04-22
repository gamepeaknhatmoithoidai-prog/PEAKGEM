/**
 * charCropFrame0 — crop a character spritesheet image to show only the
 * front-facing idle frame (top-left cell), then scale to display size.
 *
 * Known layouts (measured from actual files):
 *   thuan    1728×2304  3 cols × 4 rows → frame 0 = 576×576
 *   kbroi    2048×2048  3 cols × 3 rows → frame 0 = 682×682
 *   ama-knoi 2048×2048  3 cols (top) / 4 cols (walk) → front = 683×1024
 */
const FRAME0: Record<string, [number, number]> = {
  'thuan':    [576,  576],
  'kbroi':    [682,  682],
  'ama-knoi': [683, 1024],
};

export function charCropFrame0(
  img: Phaser.GameObjects.Image,
  textureKey: string,
  displayW: number,
  displayH: number,
): void {
  const [cw, ch] = FRAME0[textureKey] ?? [img.width, img.height];
  img.setCrop(0, 0, cw, ch);
  img.setDisplaySize(displayW, displayH);
}
