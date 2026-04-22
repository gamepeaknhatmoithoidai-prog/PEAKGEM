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
// ── Chapter 2 Part 2 — Story Scenes (5–11) ──────────────────────────────
import { C2Scene5 }               from "./scenes/C2Scene5";
import { C2Scene6 }               from "./scenes/C2Scene6";
import { C2Scene7 }               from "./scenes/C2Scene7";
import { C2Scene8 }               from "./scenes/C2Scene8";
import { C2Scene9 }               from "./scenes/C2Scene9";
import { C2Scene10 }              from "./scenes/C2Scene10";
import { C2Scene11 }              from "./scenes/C2Scene11";
// ── Mini-Games ────────────────────────────────────────────────────────────
import { MiniGameTea }            from "./scenes/MiniGameTea";
import { MiniGameFlashlight }     from "./scenes/MiniGameFlashlight";
import { MiniGameCrocodile }      from "./scenes/MiniGameCrocodile";
import { MiniGameFirefly }        from "./scenes/MiniGameFirefly";
import { MiniGameDossier }        from "./scenes/MiniGameDossier";
// ── Endings ───────────────────────────────────────────────────────────────
import { EndingRed }              from "./scenes/EndingRed";
import { EndingBlack }            from "./scenes/EndingBlack";
import { EndingYellow }           from "./scenes/EndingYellow";
import { EndScreen }              from "./scenes/EndScreen";
// ── Shared overlay scenes ─────────────────────────────────────────────────
import { UIScene }                from "./scenes/UIScene";
import { DialogScene }            from "./scenes/DialogScene";
import { EndingScene }            from "./scenes/EndingScene";        // legacy fallback
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
    // ── Chapter 2 router ─────────────────────────────────────────────
    Chapter2Scene,
    // ── Chapter 2 Scenes 1–4 (complete, do not modify) ───────────────
    C2Scene1Investigation,
    C2Scene2Runner,
    C2Scene3Photo,
    C2Scene4Stealth,
    // ── Chapter 2 Scenes 5–11 ────────────────────────────────────────
    C2Scene5,               // Scene 5  — Hiên nhà Ama K'Nơi + Tea
    C2Scene6,               // Scene 6  — Hùng lộ diện + Flashlight
    C2Scene7,               // Scene 7  — Ông Thắng xuất hiện
    C2Scene8,               // Scene 8  — Bị mua chuộc A/B/C + Firefly
    C2Scene9,               // Scene 9  — Lan xuất hiện
    C2Scene10,              // Scene 10 — Hùng thú nhận + Dossier
    C2Scene11,              // Scene 11 — Lựa chọn cuối
    // ── Mini-Games ───────────────────────────────────────────────────
    MiniGameTea,            // overlay — rót trà
    MiniGameFlashlight,     // overlay — soi đèn pin
    MiniGameCrocodile,      // standalone — vượt suối
    MiniGameFirefly,        // overlay — bắt đom đóm
    MiniGameDossier,        // overlay — xếp hồ sơ
    // ── Endings ──────────────────────────────────────────────────────
    EndingRed,
    EndingBlack,
    EndingYellow,
    EndScreen,
    // ── Shared overlay scenes ─────────────────────────────────────────
    UIScene,
    DialogScene,
    EndingScene,            // legacy fallback (Chapter2Scene router can still reach it)
  ],
};

export default new Phaser.Game(config);
