import Phaser from "phaser";
import { BootScene }            from "./scenes/BootScene";
import { CharacterSelectScene } from "./scenes/CharacterSelectScene";
import { IntroScene }           from "./scenes/IntroScene";
import { Chapter1Scene }        from "./scenes/Chapter1Scene";
import { Chapter2Scene }        from "./scenes/Chapter2Scene";
import { UIScene }              from "./scenes/UIScene";
import { DialogScene }          from "./scenes/DialogScene";
import { EndingScene }          from "./scenes/EndingScene";
import { W, H }                  from "./constants";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: "game-container",
  backgroundColor: "#0d1a07",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },  // top-down, no gravity
      debug: false,
    },
  },
  scene: [
    BootScene,
    CharacterSelectScene,
    IntroScene,
    Chapter1Scene,
    Chapter2Scene,
    UIScene,
    DialogScene,
    EndingScene,
  ],
};

export default new Phaser.Game(config);
