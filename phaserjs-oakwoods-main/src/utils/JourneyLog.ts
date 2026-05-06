/**
 * JourneyLog — Trang Nhật Ký Hành Trình (offline HTML export)
 *
 * Generates a self-contained HTML file and triggers download.
 * The HTML works fully offline with no external dependencies.
 */

export interface JourneyLogData {
  playerName: string;
  endingType: 'red' | 'yellow' | 'black';
  endingLabel: string;
  score: number;
  trust: number;
  decisions: {
    gate: string;
    ch1Stay: string;
    thang: string;
    bribe: string;
    hung: string;
  };
  quizResults: {
    correct: number;
    total: number;
  };
  miniGameScores: {
    trash: number;
    weaving: number;
    tea: number;
    flashlight: number;
    crocodile: number;
    firefly: number;
    dossier: number;
  };
  animalSaved: boolean;
  generatedAt: string;
}

const DECISION_LABELS: Record<string, string> = {
  gate_humble:    'Thừa nhận thẳng thắn, xin được học',
  gate_pushy:     'Yêu cầu được vào bằng giấy tờ',
  gate_stubborn:  'Thử tự đi rồi chấp nhận cần hướng dẫn',
  ch1_stay:       'Ở lại ngay không cần suy nghĩ',
  ch1_unsure:     'Do dự, nhưng cuối cùng vẫn ở lại',
  agree_thang:    'Đồng ý với quan điểm của ông Thắng',
  question_thang: 'Đặt câu hỏi về hậu quả lâu dài',
  confront_thang: 'Đối đầu trực tiếp bằng bằng chứng',
  bribe_accept:   'Chấp nhận đề nghị im lặng',
  bribe_refuse:   'Từ chối ngay lập tức',
  bribe_question: 'Hỏi ngược lại: nếu hợp lệ thì sợ gì?',
  hung_trust:     'Cho Hùng cơ hội nói hết',
  hung_confront:  'Nói thẳng rằng Hùng biết mình sai',
};

const MINI_GAME_NAMES: Record<string, string> = {
  trash:      'Phân Loại Rác',
  weaving:    'Dệt Thổ Cẩm',
  tea:        'Rót Trà',
  flashlight: 'Soi Đèn Pin',
  crocodile:  'Vượt Suối',
  firefly:    'Bắt Đom Đóm',
  dossier:    'Xếp Hồ Sơ',
};

const DECISION_SITUATION_NAMES: Record<string, string> = {
  gate:    'Tại cổng rừng',
  ch1Stay: 'Ở lại hay đi',
  thang:   'Trước ông Thắng',
  bribe:   'Khi bị mua chuộc',
  hung:    'Với Hùng',
};

function formatDate(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const yy = d.getFullYear();
    return `${hh}:${mm} ${dd}/${mo}/${yy}`;
  } catch (_) {
    return isoStr;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHTML(data: JourneyLogData): string {
  const endingColors: Record<string, string> = {
    red:    '#e74c3c',
    yellow: '#f39c12',
    black:  '#888888',
  };
  const endingTexts: Record<string, string> = {
    red:    'Kết Thúc: Phơi Bày Sự Thật',
    yellow: 'Kết Thúc: Thỏa Hiệp',
    black:  'Kết Thúc: Im Lặng',
  };

  const endColor = endingColors[data.endingType] || '#888';
  const endText  = endingTexts[data.endingType] || 'Kết Thúc';
  const dateStr  = formatDate(data.generatedAt);

  // Build decisions section
  const decisionKeys = ['gate', 'ch1Stay', 'thang', 'bribe', 'hung'] as const;
  const decisionsHTML = decisionKeys.map(key => {
    const situation = DECISION_SITUATION_NAMES[key];
    const value = (data.decisions as any)[key] as string;
    const label = DECISION_LABELS[value] || value;
    return `
      <div class="decision-item">
        <div class="decision-situation">${escapeHtml(situation)}</div>
        <div class="decision-label">${escapeHtml(label)}</div>
      </div>`;
  }).join('');

  // Build mini-games section
  const mgKeys = ['trash', 'weaving', 'tea', 'flashlight', 'crocodile', 'firefly', 'dossier'] as const;
  const miniGamesHTML = mgKeys.map(key => {
    const name = MINI_GAME_NAMES[key];
    const score = (data.miniGameScores as any)[key] as number;
    const display = key === 'weaving' && score === 0 ? 'Hoàn thành' : String(score);
    return `
      <div class="mg-item">
        <span class="mg-name">${escapeHtml(name)}</span>
        <span class="mg-score">${escapeHtml(display)}</span>
      </div>`;
  }).join('');

  const deerHTML = data.animalSaved
    ? `<div class="deer-saved">Con hươu được cứu 🌿</div>`
    : '';

  // Quiz progress
  const quizPct = data.quizResults.total > 0
    ? Math.round(data.quizResults.correct / data.quizResults.total * 100)
    : 0;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nhật Ký Hành Trình | ${escapeHtml(data.playerName)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{
  background:#0d1a07;color:#d4e8c2;
  font-family:'Segoe UI','Be Vietnam Pro',Arial,sans-serif;
  line-height:1.6;padding:20px;
  min-height:100vh;
}
.container{max-width:640px;margin:0 auto;padding:10px}

/* Header */
.header{text-align:center;margin-bottom:32px;padding-bottom:20px;border-bottom:1px solid #2a4a1a}
.header h1{font-size:28px;color:#4caf50;margin-bottom:4px;font-weight:700}
.header .sub{font-size:14px;color:#7a9a6a;margin-bottom:12px}
.header .player{font-size:18px;color:#c8d4b8;margin-bottom:4px}
.header .date{font-size:12px;color:#5a7a4a}

/* Section */
.section{margin-bottom:28px}
.section-title{font-size:16px;color:#4caf50;font-weight:700;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #1a3a10}

/* Ending */
.ending-label{font-size:22px;font-weight:700;text-align:center;margin-bottom:16px}
.stats-row{display:flex;gap:12px;margin-bottom:16px}
.stat-box{
  flex:1;background:#0a1505;border:1px solid #1a3a10;border-radius:8px;
  padding:14px;text-align:center;
}
.stat-box .stat-num{font-size:26px;font-weight:700;color:#c8a84b}
.stat-box .stat-label{font-size:12px;color:#7a9a6a;margin-top:2px}

/* Decisions */
.decision-item{margin-bottom:14px}
.decision-situation{font-size:11px;color:#5a7a4a;text-transform:uppercase;letter-spacing:1px}
.decision-label{font-size:15px;color:#d4e8c2;margin-top:2px}

/* Mini-games */
.mg-item{
  display:flex;justify-content:space-between;align-items:center;
  padding:8px 0;border-bottom:1px solid #1a2a10;
}
.mg-name{color:#a0b890;font-size:14px}
.mg-score{color:#c8a84b;font-size:14px;font-weight:600}
.deer-saved{
  margin-top:10px;padding:10px;background:#0a1a05;border-radius:6px;
  color:#4caf50;font-size:14px;text-align:center;
}

/* Quiz */
.quiz-text{font-size:15px;color:#d4e8c2;margin-bottom:8px}
.progress-bar{
  background:#1a2a10;border-radius:4px;height:12px;overflow:hidden;
}
.progress-fill{
  height:100%;background:#4caf50;border-radius:4px;
  transition:width 0.3s;
}

/* Message */
.message p{font-size:14px;color:#a0b890;margin-bottom:12px;line-height:1.7}
.actions{list-style:none;padding:0}
.actions li{
  font-size:13px;color:#7a9a6a;padding:6px 0;padding-left:16px;
  position:relative;
}
.actions li::before{content:'•';position:absolute;left:0;color:#4caf50}
.link{
  display:inline-block;margin-top:12px;color:#4caf50;font-size:13px;
  text-decoration:underline;
}

/* Footer */
.footer{
  text-align:center;padding-top:20px;margin-top:32px;
  border-top:1px solid #1a3a10;color:#3a5a2a;font-size:11px;
}
</style>
</head>
<body>
<div class="container">

<!-- HEADER -->
<div class="header">
  <h1>Nhật Ký Hành Trình</h1>
  <div class="sub">Vườn Quốc Gia Nam Cát Tiên</div>
  <div class="player">${escapeHtml(data.playerName)}</div>
  <div class="date">${escapeHtml(dateStr)}</div>
</div>

<!-- KẾT CỤC -->
<div class="section">
  <div class="ending-label" style="color:${endColor}">${escapeHtml(endText)}</div>
  <div class="stats-row">
    <div class="stat-box">
      <div class="stat-num">${data.score}</div>
      <div class="stat-label">Điểm số</div>
    </div>
    <div class="stat-box">
      <div class="stat-num">${data.trust}</div>
      <div class="stat-label">Lòng tin</div>
    </div>
  </div>
</div>

<!-- LỰA CHỌN -->
<div class="section">
  <div class="section-title">Những khoảnh khắc bạn đã chọn</div>
  ${decisionsHTML}
</div>

<!-- MINI-GAMES -->
<div class="section">
  <div class="section-title">Hành trình trong từng thử thách</div>
  ${miniGamesHTML}
  ${deerHTML}
</div>

<!-- QUIZ -->
<div class="section">
  <div class="section-title">Kiến thức về Cát Tiên</div>
  <div class="quiz-text">${data.quizResults.correct}/${data.quizResults.total} câu trả lời đúng</div>
  <div class="progress-bar">
    <div class="progress-fill" style="width:${quizPct}%"></div>
  </div>
</div>

<!-- THÔNG ĐIỆP CUỐI -->
<div class="section message">
  <div class="section-title">Về câu chuyện này</div>
  <p>Vườn Quốc Gia Cát Tiên có thật. Câu chuyện này lấy cảm hứng từ dự án thủy điện Đồng Nai 6 và 6A, bị dừng năm 2013 vì tác động quá nghiêm trọng đến hệ sinh thái. Hành trình trong game là hư cấu, nhưng những gì đang xảy ra với các khu rừng nhiệt đới là thật.</p>
  <ul class="actions">
    <li>Không để lại rác khi đến bất kỳ khu rừng nào</li>
    <li>Không mua động vật hoang dã hoặc sản phẩm từ động vật hoang dã</li>
    <li>Tôn trọng không gian và văn hóa của cộng đồng bản địa</li>
    <li>Chia sẻ thông tin đúng về bảo tồn thiên nhiên</li>
  </ul>
  <a class="link" href="https://vuonquocgiacattien.vn" target="_blank">Tìm hiểu thêm về Vườn Quốc Gia Cát Tiên</a>
</div>

<!-- FOOTER -->
<div class="footer">
  <div>Được tạo từ trò chơi Rừng Cát Tiên</div>
  <div>${escapeHtml(dateStr)}</div>
</div>

</div>
</body>
</html>`;
}

export function generateAndDownloadJourneyLog(data: JourneyLogData): void {
  const html = buildHTML(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);

  const safeName = data.playerName.toLowerCase().replace(/\s+/g, '-');
  const filename = `nhat-ky-cat-tien-${safeName}.html`;

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(anchor);
  }, 1000);
}
