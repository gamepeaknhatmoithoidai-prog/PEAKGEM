import Phaser from "phaser";
import { BootScene }              from "./scenes/BootScene";
import { CharacterSelectScene }   from "./scenes/CharacterSelectScene";
import { IntroScene }             from "./scenes/IntroScene";
import { Chapter1Scene }          from "./scenes/Chapter1Scene";
import { Chapter2Scene }          from "./scenes/Chapter2Scene";      // router
import { C2Scene1Investigation }  from "./scenes/C2Scene1Investigation";
import { C2Scene2Runner }         from "./scenes/C2Scene2Runner";
import { C2Scene3Photo }          from "./scenes/C2Scene3Photo";
import { C2Scene4Stealth }        from "./scenes/C2Scene4Stealth";
import { UIScene }                from "./scenes/UIScene";
import { DialogScene }            from "./scenes/DialogScene";
import { EndingScene }            from "./scenes/EndingScene";
import { W, H }                   from "./constants";

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
      gravity: { x: 0, y: 0 },  // each scene sets its own gravity in create()
      debug: false,
    },
  },
  scene: [
    BootScene,
    CharacterSelectScene,
    IntroScene,
    // ── Chapter 1 (complete, do not modify) ──────────────────────────
    Chapter1Scene,
    // ── Chapter 2 router + sub-scenes ────────────────────────────────
    Chapter2Scene,           // entry point (started by Chapter1Scene)
    C2Scene1Investigation,   // Scene 1 — collect clues (Game 1)
    C2Scene2Runner,          // Scene 2 — escape runner (Game 2)
    C2Scene3Photo,           // Scene 3 — photo evidence (Game 3)
    C2Scene4Stealth,         // Scene 4 — stealth + dialogue
    // ── Shared overlay scenes ─────────────────────────────────────────
    UIScene,
    DialogScene,
    EndingScene,
  ],
};

export default new Phaser.Game(config);
