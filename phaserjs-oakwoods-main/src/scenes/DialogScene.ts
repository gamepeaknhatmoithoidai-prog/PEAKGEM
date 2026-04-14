import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { DIALOGS, Dialog, Line, formatText } from '../data/dialogue';
import { W, H } from '../constants';

interface DialogLaunchData {
  dialogKey: string;
  sourceScene: string;
}

export class DialogScene extends Phaser.Scene {
  private gs!: GS;
  private lines: Line[] = [];
  private lineIdx = 0;
  private charIdx = 0;
  private displayText = '';
  private phase: 'typing' | 'waiting' | 'choice' = 'typing';
  private sourceScene = '';

  // UI elements
  private box!: Phaser.GameObjects.Graphics;
  private speakerText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private portrait!: Phaser.GameObjects.Image;
  private portraitFrame!: Phaser.GameObjects.Image;
  private continueHint!: Phaser.GameObjects.Text;
  private choiceContainer!: Phaser.GameObjects.Container;
  private choiceBtns: Phaser.GameObjects.Container[] = [];

  private typeTimer = 0;
  private waitTimer = 0;

  constructor() { super({ key: 'DialogScene', active: false }); }

  init(data: DialogLaunchData): void {
    this.sourceScene = data.sourceScene;
    const dialog: Dialog | undefined = DIALOGS[data.dialogKey];
    if (!dialog) {
      this.closeDialog(null);
      return;
    }
    this.lines = dialog;
    this.lineIdx = 0;
    this.charIdx = 0;
    this.displayText = '';
    this.phase = 'typing';
  }

  create(): void {
    this.gs = new GS(this.registry);
    const name = this.gs.get('playerName') || 'Thuận';

    // Semi-transparent overlay
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.35).setDepth(0);

    // Dialog box  (bottom of screen)
    const BOX_Y = H - 115;
    const BOX_H = 130;
    this.box = this.add.graphics().setDepth(1);
    this.box.fillStyle(0x0a1a05, 0.92);
    this.box.fillRoundedRect(20, BOX_Y - BOX_H / 2, W - 40, BOX_H, 8);
    this.box.lineStyle(1.5, 0x3a7a28, 1);
    this.box.strokeRoundedRect(20, BOX_Y - BOX_H / 2, W - 40, BOX_H, 8);

    // Portrait frame (kept on the left)
    this.portraitFrame = this.add.image(78, BOX_Y - 10, 'portrait-frame')
      .setScale(0.9).setDepth(2);
    // Large character portrait behind the dialog box (depth 0.5 = above overlay, below box)
    this.portrait = this.add.image(W / 2, BOX_Y - BOX_H / 2, 'portrait-frame')
      .setOrigin(0.5, 1)
      .setScale(0.5).setDepth(0.5).setVisible(false);

    // Speaker name badge
    this.speakerText = this.add.text(148, BOX_Y - BOX_H / 2 + 12, '', {
      fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#88ff66', stroke: '#000', strokeThickness: 2,
      backgroundColor: '#0a1a0599', padding: { x: 8, y: 3 },
    }).setDepth(4);

    // Dialog body text
    this.bodyText = this.add.text(148, BOX_Y - BOX_H / 2 + 34, '', {
      fontSize: '13px', fontFamily: 'Arial', color: '#e8f5d8',
      wordWrap: { width: W - 200 }, lineSpacing: 6,
    }).setDepth(4);

    // Continue hint
    this.continueHint = this.add.text(W - 36, H - 24, '▼', {
      fontSize: '14px', fontFamily: 'Arial', color: '#88cc66',
    }).setOrigin(0.5).setDepth(4).setVisible(false);
    this.tweens.add({
      targets: this.continueHint, y: H - 20, duration: 500, yoyo: true, repeat: -1,
    });

    // Choice container (populated when needed)
    this.choiceContainer = this.add.container(0, 0).setDepth(10);

    // Input: advance dialog
    this.input.keyboard!.on('keydown-SPACE', () => this.handleInput());
    this.input.keyboard!.on('keydown-ENTER', () => this.handleInput());
    this.input.on('pointerdown', () => this.handleInput());

    // Start first line
    this.showLine(this.gs.get('playerName') || 'Thuận');

    // Play dialogue sound
    try { this.sound.play('dialogue', { volume: 0.2 }); } catch (_) {}
  }

  private showLine(name: string): void {
    if (this.lineIdx >= this.lines.length) { this.closeDialog(null); return; }
    const line = this.lines[this.lineIdx];

    // Format text
    const text = formatText(line.text, name);
    const speaker = formatText(line.speaker, name);

    this.speakerText.setText(speaker);

    // Portrait
    if (line.portrait && this.textures.exists(line.portrait)) {
      this.portrait.setTexture(line.portrait).setVisible(true).setScale(0.5);
      try { this.portrait.setPostPipeline('WhiteKey'); } catch (_) {}
    } else {
      this.portrait.setVisible(false);
      try { this.portrait.removePostPipeline('WhiteKey'); } catch (_) {}
    }

    // Start typewriter
    this.displayText = '';
    this.charIdx = 0;
    this.phase = 'typing';
    this.typeTimer = 0;
    this.continueHint.setVisible(false);

    // Store formatted text for typing
    (this as any)._currentText = text;
    (this as any)._hasChoices = !!(line.choices && line.choices.length);
  }

  update(_t: number, delta: number): void {
    const name = this.gs.get('playerName') || 'Thuận';
    const fullText: string = (this as any)._currentText || '';

    if (this.phase === 'typing') {
      this.typeTimer += delta;
      if (this.typeTimer > 22) {
        this.typeTimer = 0;
        if (this.charIdx < fullText.length) {
          this.charIdx = Math.min(fullText.length, this.charIdx + 2);
          this.displayText = fullText.slice(0, this.charIdx);
          this.bodyText.setText(this.displayText);
        } else {
          // Typing complete
          const line = this.lines[this.lineIdx];
          if (line.choices && line.choices.length) {
            this.phase = 'choice';
            this.showChoices(line, name);
          } else {
            this.phase = 'waiting';
            this.continueHint.setVisible(true);
          }
        }
      }
    }
  }

  private showChoices(line: Line, playerName: string): void {
    this.choiceContainer.removeAll(true);
    this.choiceBtns = [];
    this.continueHint.setVisible(false);

    const choices = line.choices!;
    const startY = H - 145 - (choices.length * 38);

    choices.forEach((ch, i) => {
      const bg = this.add.rectangle(0, 0, W - 80, 32, 0x0d2508, 0.9)
        .setStrokeStyle(1, 0x3a7a28);
      const label = this.add.text(-(W - 80) / 2 + 12, 0, ch.text, {
        fontSize: '12px', fontFamily: 'Arial', color: '#cceeaa',
        wordWrap: { width: W - 120 },
      }).setOrigin(0, 0.5);

      const btn = this.add.container(W / 2, startY + i * 38, [bg, label])
        .setSize(W - 80, 32).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => { bg.setFillStyle(0x1a4a10); label.setColor('#ffffff'); });
      btn.on('pointerout', () => { bg.setFillStyle(0x0d2508); label.setColor('#cceeaa'); });
      btn.on('pointerdown', () => this.selectChoice(line, i, playerName));

      this.choiceContainer.add(btn);
      this.choiceBtns.push(btn);
    });
  }

  private selectChoice(line: Line, idx: number, playerName: string): void {
    const ch = line.choices![idx];
    this.choiceContainer.removeAll(true);
    this.choiceBtns = [];

    // Apply effects
    const result = {
      choiceIdx: idx,
      trustChange: ch.trust ?? 0,
      scoreChange: ch.score ?? 0,
      decision: ch.decision ?? '',
    };

    if (ch.trust) this.gs.addTrust(ch.trust);
    if (ch.score) this.gs.addScore(ch.score);
    if (ch.decision) this.gs.decide(ch.decision);

    // Notify source scene
    const src = this.scene.get(this.sourceScene);
    if (src) src.events.emit('choice-made', result);

    // Continue to next dialog or close
    if (ch.next && DIALOGS[ch.next]) {
      this.lines = DIALOGS[ch.next];
      this.lineIdx = 0;
      this.showLine(playerName);
    } else {
      this.closeDialog(result);
    }

    try { this.sound.play('click', { volume: 0.3 }); } catch (_) {}
  }

  private handleInput(): void {
    if (this.phase === 'choice') return; // choices need mouse click
    const name = this.gs.get('playerName') || 'Thuận';
    const fullText: string = (this as any)._currentText || '';
    const hasChoices: boolean = (this as any)._hasChoices || false;

    if (this.phase === 'typing') {
      // Complete current line instantly
      this.displayText = fullText;
      this.charIdx = fullText.length;
      this.bodyText.setText(this.displayText);
      const line = this.lines[this.lineIdx];
      if (hasChoices && line.choices?.length) {
        this.phase = 'choice';
        this.showChoices(line, name);
      } else {
        this.phase = 'waiting';
        this.continueHint.setVisible(true);
      }
    } else if (this.phase === 'waiting') {
      this.lineIdx++;
      this.showLine(name);
    }
  }

  private closeDialog(result: object | null): void {
    // Notify source scene
    const src = this.scene.get(this.sourceScene);
    if (src) src.events.emit('dialog-done', result);
    this.scene.stop();
  }
}
