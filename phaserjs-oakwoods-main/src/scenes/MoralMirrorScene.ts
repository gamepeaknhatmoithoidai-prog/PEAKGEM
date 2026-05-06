/**
 * MoralMirrorScene — Gương Phản Chiếu Đạo Đức
 *
 * Scene chạy TRƯỚC EndingRed / EndingYellow / EndingBlack.
 * Màn hình tối, chỉ có văn bản xuất hiện từng dòng chậm rãi.
 * Nội dung phản ánh toàn bộ lựa chọn người chơi đã thực hiện.
 *
 * Flow: C2Scene11 → MoralMirrorScene → EndingRed/Yellow/Black
 */
import Phaser from 'phaser';
import { GS } from '../data/GameState';
import { W, H } from '../constants';

/* ── MirrorData ──────────────────────────────────────────────────── */
interface MirrorData {
  playerName: string;
  endingType: 'red' | 'yellow' | 'black';
  decisions: {
    gate: 'gate_pushy' | 'gate_humble' | 'gate_stubborn';
    ch1Stay: 'ch1_stay' | 'ch1_unsure';
    thang: 'agree_thang' | 'question_thang' | 'confront_thang';
    bribe: 'bribe_accept' | 'bribe_refuse' | 'bribe_question';
    hung: 'hung_trust' | 'hung_confront';
  };
  stats: {
    score: number;
    trust: number;
    evidenceCount: number;
    animalSaved: boolean;
  };
}

/* ── Line descriptor for sequenced rendering ────────────────────── */
interface MirrorLine {
  text: string;
  small?: boolean;   // smaller + italic sub-line
  extraDelay?: number; // ms of extra pause BEFORE this line
}

export class MoralMirrorScene extends Phaser.Scene {
  private mirrorData!: MirrorData;

  constructor() { super('MoralMirrorScene'); }

  init(data: { endingType: string }): void {
    const gs = new GS(this.registry);
    const decisions = gs.get('decisions') || [];

    this.mirrorData = {
      playerName: gs.get('playerName') || 'Thuận',
      endingType: (data.endingType || 'black') as MirrorData['endingType'],
      decisions: {
        gate:    this.findDecision(decisions, ['gate_humble', 'gate_pushy', 'gate_stubborn'], 'gate_humble') as any,
        ch1Stay: this.findDecision(decisions, ['ch1_stay', 'ch1_unsure'], 'ch1_stay') as any,
        thang:   this.findDecision(decisions, ['agree_thang', 'question_thang', 'confront_thang'], 'agree_thang') as any,
        bribe:   this.findDecision(decisions, ['bribe_accept', 'bribe_refuse', 'bribe_question'], 'bribe_refuse') as any,
        hung:    this.findDecision(decisions, ['hung_trust', 'hung_confront'], 'hung_trust') as any,
      },
      stats: {
        score:         gs.get('score') || 0,
        trust:         gs.get('trust') || 0,
        evidenceCount: gs.get('evidenceCount') || 0,
        animalSaved:   gs.get('animalSaved') || false,
      },
    };
  }

  create(): void {
    // Pure black background
    this.cameras.main.setBackgroundColor('#000000');

    // Ambient forest sound, low volume
    try { this.sound.play('forest-ambient', { loop: true, volume: 0.04 }); } catch (_) {}

    const lines = this.buildLines();
    this.playLines(lines);
  }

  /** Find the first matching slug in the decisions array */
  private findDecision(decisions: string[], candidates: string[], fallback: string): string {
    for (const c of candidates) {
      if (decisions.includes(c)) return c;
    }
    return fallback;
  }

  /** Replace {playerName} with actual name */
  private sub(text: string): string {
    return text.replace(/\{playerName\}/g, this.mirrorData.playerName);
  }

  /* ═══════════════════════════════════════════════════════════════════
   *  BUILD LINES — based on endingType + decisions
   * ═══════════════════════════════════════════════════════════════════ */
  private buildLines(): MirrorLine[] {
    const { endingType } = this.mirrorData;
    if (endingType === 'red')    return this.buildRedLines();
    if (endingType === 'yellow') return this.buildYellowLines();
    return this.buildBlackLines();
  }

  /* ── ENDING RED ──────────────────────────────────────────────────── */
  private buildRedLines(): MirrorLine[] {
    const { gate, ch1Stay, thang, bribe, hung } = this.mirrorData.decisions;
    const lines: MirrorLine[] = [];

    // Dòng 1
    if (gate === 'gate_humble') {
      lines.push({ text: '{playerName} đến cổng rừng với tờ giấy giới thiệu và câu thừa nhận đầu tiên: tôi không hứa mình sẽ khác.' });
    } else if (gate === 'gate_pushy') {
      lines.push({ text: '{playerName} đến cổng rừng với tờ giấy giới thiệu và yêu cầu được vào.' });
    } else {
      lines.push({ text: '{playerName} đến cổng rừng, mở GPS, rồi chịu nhận rằng GPS không có tín hiệu ở đây.' });
    }

    // Dòng 2
    if (ch1Stay === 'ch1_stay') {
      lines.push({ text: 'Khi K\'Brơi hỏi có ở lại không, {playerName} không cần suy nghĩ lâu.' });
    } else {
      lines.push({ text: 'Khi K\'Brơi hỏi có ở lại không, {playerName} nói cần nghĩ thêm. Rồi vẫn ở lại.' });
    }

    // Dòng 3
    if (thang === 'agree_thang') {
      lines.push({ text: 'Khi ông Thắng nói về văn minh và điện năng, {playerName} đã gật đầu.' });
    } else if (thang === 'question_thang') {
      lines.push({ text: 'Khi ông Thắng nói về văn minh và điện năng, {playerName} hỏi lại: hậu quả lâu dài ra sao?' });
    } else {
      lines.push({ text: 'Khi ông Thắng nói về văn minh và điện năng, {playerName} đặt bằng chứng lên bàn.' });
    }

    // Dòng 4
    if (bribe === 'bribe_accept') {
      lines.push({ text: 'Khi ông Thắng đề nghị tài trợ luận văn để đổi lấy sự im lặng, {playerName} đồng ý.' });
      lines.push({ text: 'Rồi bước tiếp.', small: true, extraDelay: 2000 });
    } else if (bribe === 'bribe_refuse') {
      lines.push({ text: 'Khi ông Thắng đề nghị tài trợ luận văn để đổi lấy sự im lặng, {playerName} nói: ông nhầm người rồi.' });
    } else {
      lines.push({ text: 'Khi ông Thắng đề nghị tài trợ luận văn để đổi lấy sự im lặng, {playerName} hỏi ngược lại: nếu hợp lệ thì sợ gì?' });
    }

    // Dòng 5
    if (hung === 'hung_trust') {
      lines.push({ text: 'Khi Hùng gục xuống và nói không biết làm gì nữa, {playerName} nói: anh có thể tin tôi.' });
    } else {
      lines.push({ text: 'Khi Hùng gục xuống và nói không biết làm gì nữa, {playerName} nói: anh biết mình sai, thì làm điều đúng đi.' });
    }

    // Dòng 6
    lines.push({ text: 'Hành trình này không bắt đầu từ ý chí bảo vệ rừng. Nó bắt đầu từ một tờ giấy giới thiệu và một đề tài luận văn.' });
    lines.push({ text: 'Và kết thúc bằng sự thật được nói ra.', small: true });

    return lines;
  }

  /* ── ENDING YELLOW ───────────────────────────────────────────────── */
  private buildYellowLines(): MirrorLine[] {
    const { gate, ch1Stay, thang, bribe, hung } = this.mirrorData.decisions;
    const lines: MirrorLine[] = [];

    // Dòng 1
    if (gate === 'gate_humble') {
      lines.push({ text: '{playerName} đến cổng rừng với câu thừa nhận đầu tiên: tôi không hứa mình sẽ khác.' });
    } else if (gate === 'gate_pushy') {
      lines.push({ text: '{playerName} đến cổng rừng với giấy tờ và sự tự tin của người thành phố.' });
    } else {
      lines.push({ text: '{playerName} đến cổng rừng, thử GPS, rồi chấp nhận đi theo người khác.' });
    }

    // Dòng 2
    if (ch1Stay === 'ch1_stay') {
      lines.push({ text: 'Khi K\'Brơi hỏi có ở lại không, {playerName} nói có ngay.' });
    } else {
      lines.push({ text: 'Khi K\'Brơi hỏi có ở lại không, {playerName} do dự. Nhưng vẫn ở lại.' });
    }

    // Dòng 3
    if (thang === 'agree_thang') {
      lines.push({ text: 'Trước ông Thắng, {playerName} đã đồng ý rằng phát triển kinh tế là quan trọng nhất.' });
    } else if (thang === 'question_thang') {
      lines.push({ text: 'Trước ông Thắng, {playerName} đặt câu hỏi về hậu quả lâu dài.' });
    } else {
      lines.push({ text: 'Trước ông Thắng, {playerName} chọn đối đầu thẳng.' });
    }

    // Dòng 4
    if (bribe === 'bribe_accept') {
      lines.push({ text: 'Khi ông Thắng đề nghị im lặng để đổi lấy tương lai, {playerName} đã chọn tương lai.' });
      lines.push({ text: 'Rồi thay đổi ý kiến.', small: true, extraDelay: 1500 });
    } else if (bribe === 'bribe_refuse') {
      lines.push({ text: 'Khi ông Thắng đề nghị im lặng để đổi lấy tương lai, {playerName} từ chối.' });
    } else {
      lines.push({ text: 'Khi ông Thắng đề nghị im lặng để đổi lấy tương lai, {playerName} hỏi lại câu hỏi khiến ông ta dừng lại.' });
    }

    // Dòng 5
    if (hung === 'hung_trust') {
      lines.push({ text: 'Hùng được nghe câu: anh có thể tin tôi. Không phải lời phán xét.' });
    } else {
      lines.push({ text: 'Hùng được nghe câu: anh biết mình sai. Đúng nhưng nặng.' });
    }

    // Dòng 6
    lines.push({ text: 'Không có câu trả lời hoàn hảo nào ở đây.' });
    lines.push({ text: 'Nhưng rừng vẫn còn đứng. Và {playerName} biết tại sao.', small: true });

    return lines;
  }

  /* ── ENDING BLACK ────────────────────────────────────────────────── */
  private buildBlackLines(): MirrorLine[] {
    const { gate, ch1Stay, thang, bribe } = this.mirrorData.decisions;
    const lines: MirrorLine[] = [];

    // Dòng 1
    if (gate === 'gate_humble') {
      lines.push({ text: '{playerName} đến cổng rừng và nói: tôi không hứa mình sẽ khác.' });
    } else if (gate === 'gate_pushy') {
      lines.push({ text: '{playerName} đến cổng rừng với giấy tờ và sự tự tin.' });
    } else {
      lines.push({ text: '{playerName} đến cổng rừng và thử đi một mình. Không được.' });
    }

    // Dòng 2
    if (ch1Stay === 'ch1_stay') {
      lines.push({ text: 'K\'Brơi hỏi có ở lại không. {playerName} nói có.' });
    } else {
      lines.push({ text: 'K\'Brơi hỏi có ở lại không. {playerName} do dự. Rồi ở lại.' });
    }

    // Dòng 3 (không variant — khoảnh khắc đẹp nhất)
    lines.push({ text: 'Con hươu bị bẫy được thả ra. Nó dừng lại ở mép bụi, nhìn lại một lần, rồi biến vào rừng.' });

    // Dòng 4 (trọng tâm)
    if (thang === 'agree_thang') {
      lines.push({ text: 'Ông Thắng nói về văn minh. {playerName} đồng ý.' });
    } else {
      lines.push({ text: 'Ông Thắng nói về văn minh. {playerName} đặt câu hỏi.' });
    }

    // 3 dòng luôn luôn thêm, mỗi dòng cách 1.8s
    lines.push({ text: '{playerName} đã thấy dấu khảo sát.', extraDelay: 600 });
    lines.push({ text: '{playerName} đã nghe Ama K\'Nơi nói về dòng sông.', extraDelay: 600 });
    lines.push({ text: '{playerName} đã nhìn K\'Brơi lần cuối khi rời làng.', extraDelay: 600 });

    lines.push({ text: 'Mỗi lần đều có lựa chọn.', extraDelay: 700 });

    // Dòng 5
    if (bribe === 'bribe_accept') {
      lines.push({ text: 'Khi ông Thắng đề nghị im lặng, {playerName} chọn tương lai của mình.' });
    }
    // bribe_refuse / bribe_question → bỏ qua dòng này

    // Dòng 6
    lines.push({ text: 'Hai năm sau, dự án hoàn thành. Rừng bị ngập.' });
    lines.push({ text: 'Ama K\'Nơi mất trong đợt di dời.', extraDelay: 2000 });
    lines.push({ text: 'K\'Brơi không liên lạc lại.', extraDelay: 2000 });

    // Khoảng lặng dài nhất
    lines.push({ text: 'Im lặng cũng là một lựa chọn.', small: true, extraDelay: 3000 });

    return lines;
  }

  /* ═══════════════════════════════════════════════════════════════════
   *  PLAY LINES — sequential fade-in with timed delays
   * ═══════════════════════════════════════════════════════════════════ */
  private playLines(lines: MirrorLine[]): void {
    const FADE_IN   = 600;   // ms to fade in each line
    const HOLD      = 1200;  // ms to hold before next line
    const BASE_GAP  = FADE_IN + HOLD; // 1800ms base per line
    const MAIN_SIZE = 18;
    const SUB_SIZE  = 14;
    const LINE_H    = 36;    // vertical spacing between main lines
    const SUB_LINE_H = 26;   // vertical spacing for sub-lines

    // Calculate total block height to center vertically
    let totalH = 0;
    for (const l of lines) {
      totalH += l.small ? SUB_LINE_H : LINE_H;
    }
    let currentY = Math.max(60, (H - totalH) / 2);

    let cumulativeDelay = 800; // initial delay

    for (const line of lines) {
      const extra = line.extraDelay || 0;
      cumulativeDelay += extra;

      const fontSize = line.small ? `${SUB_SIZE}px` : `${MAIN_SIZE}px`;
      const fontStyle = line.small ? 'italic' : 'normal';
      const color = line.small ? '#8a9a7a' : '#d4dcc8';
      const y = currentY;

      const t = this.add.text(W / 2, y, this.sub(line.text), {
        fontSize,
        fontFamily: '"Be Vietnam Pro", "Segoe UI", sans-serif',
        fontStyle,
        color,
        align: 'center',
        wordWrap: { width: W - 140 },
        lineSpacing: 6,
      }).setOrigin(0.5, 0).setAlpha(0);

      const delay = cumulativeDelay;
      this.time.delayedCall(delay, () => {
        this.tweens.add({ targets: t, alpha: 1, duration: FADE_IN });
      });

      cumulativeDelay += BASE_GAP;
      currentY += line.small ? SUB_LINE_H : LINE_H;
    }

    // After last line + 3 seconds, show continue button
    this.time.delayedCall(cumulativeDelay + 3000, () => this.showContinueButton());
  }

  /* ── Continue button ─────────────────────────────────────────────── */
  private showContinueButton(): void {
    const btnText = this.add.text(W / 2, H - 50, 'Tiếp tục', {
      fontSize: '15px',
      fontFamily: '"Be Vietnam Pro", "Segoe UI", sans-serif',
      color: '#6a7a5a',
      padding: { x: 24, y: 10 },
    }).setOrigin(0.5, 1).setAlpha(0).setInteractive({ useHandCursor: true });

    // Subtle border via graphics
    const bw = btnText.width + 48;
    const bh = btnText.height + 20;
    const bx = W / 2 - bw / 2;
    const by = H - 50 - bh;
    const border = this.add.graphics().setAlpha(0);
    border.lineStyle(1, 0x6a7a5a, 0.5);
    border.strokeRoundedRect(bx, by, bw, bh, 4);

    this.tweens.add({ targets: [btnText, border], alpha: 1, duration: 600 });

    btnText.on('pointerover', () => btnText.setColor('#9aaa8a'));
    btnText.on('pointerout',  () => btnText.setColor('#6a7a5a'));

    btnText.on('pointerdown', () => {
      try { this.sound.stopAll(); } catch (_) {}
      const endingType = this.mirrorData.endingType;
      const endingScene = endingType === 'red' ? 'EndingRed'
                        : endingType === 'yellow' ? 'EndingYellow'
                        : 'EndingBlack';
      this.cameras.main.fadeOut(600);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(endingScene);
        this.scene.stop('MoralMirrorScene');
      });
    });
  }
}
