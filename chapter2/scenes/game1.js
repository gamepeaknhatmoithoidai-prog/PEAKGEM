'use strict';
// ══════════════════════════════════════════════════════════════
//  GAME 1: "Lần theo dấu khảo sát"  (scenes/game1.js)
//  Mục tiêu: tìm 4/4 điểm khảo sát theo dấu
// ══════════════════════════════════════════════════════════════

SCENES.game1 = (() => {

  // ── Investigation points data ─────────────────────────────
  const POINTS = [
    {
      id:    'rope',
      x: 180, y: 318,
      label: 'Dây đo [A-07]',
      diary: '📓 Ngày 3, 07:42. Tuyến B — phát hiện dây đo màu vàng cam căng ngang lối mòn. Ký hiệu A-07. Không có trong bản đồ VQG. Không thấy tên đơn vị thi công. K\'Brơi nói anh biết con đường này từ nhỏ — chưa bao giờ có dây ở đây. Ghi lại tọa độ.',
      drawIcon(x, y, pulse) {
        // Survey tape stretched between two thin poles
        CX.strokeStyle = `rgba(255,170,30,${pulse})`;
        CX.lineWidth = 3; CX.setLineDash([6, 3]);
        CX.beginPath(); CX.moveTo(x - 28, y); CX.lineTo(x + 28, y); CX.stroke();
        CX.setLineDash([]);
        CX.fillStyle = '#666'; CX.fillRect(x-30, y-8, 4, 16);
        CX.fillRect(x+26, y-8, 4, 16);
        CX.fillStyle = `rgba(255,220,80,${pulse})`;
        CX.font = 'bold 8px monospace'; CX.textAlign = 'center';
        CX.fillText('[A-07]', x, y - 5);
      }
    },
    {
      id:    'gps',
      x: 358, y: 308,
      label: 'Thiết bị GPS',
      diary: '📓 07:58. Tìm thấy thiết bị GPS cầm tay bỏ lại dưới gốc cây — pin còn, màn hình tắt. Nhãn dán bị bóc một nửa, chỉ còn chữ "...NG THÀNH". Tên công ty? Dự án? Ai để quên hay cố tình để lại? Chụp ảnh lại trước khi chạm vào.',
      drawIcon(x, y, pulse) {
        // Small GPS device
        CX.fillStyle = `rgba(60,80,60,${0.7 + pulse * 0.3})`;
        CX.beginPath(); CX.roundRect(x-10, y-16, 20, 26, 3); CX.fill();
        CX.fillStyle = `rgba(80,160,180,${0.6 + pulse * 0.3})`;
        CX.fillRect(x-7, y-13, 14, 12);
        CX.fillStyle = `rgba(255,80,80,${pulse})`;
        CX.beginPath(); CX.arc(x, y-18, 3, 0, Math.PI * 2); CX.fill(); // antenna light
        CX.fillStyle = '#AAA';
        CX.fillRect(x-1, y-24, 2, 8); // antenna
      }
    },
    {
      id:    'trail',
      x: 558, y: 322,
      label: 'Đường mòn mới',
      diary: '📓 08:15. Đường mòn này không có trên bản đồ kiểm lâm bản in tháng 3. Đất đỏ hai bên còn mới — lá chưa phủ kịp, vết bánh xe hạng nặng còn rõ. Chiều rộng khoảng 4m. Đủ để xe tải nhỏ đi vào. Đây không phải đường mòn tự nhiên.',
      drawIcon(x, y, pulse) {
        // Tire tracks
        CX.fillStyle = `rgba(120,70,30,${0.5 + pulse * 0.4})`;
        CX.fillRect(x-22, y-4, 44, 8);
        CX.fillStyle = `rgba(80,40,15,${pulse * 0.8})`;
        for (let i = -20; i <= 18; i += 8) {
          CX.fillRect(x+i, y-8, 4, 6);
          CX.fillRect(x+i, y+2, 4, 6);
        }
        // Arrow indicating direction
        CX.strokeStyle = `rgba(255,200,80,${pulse})`;
        CX.lineWidth = 2; CX.lineCap = 'round';
        CX.beginPath(); CX.moveTo(x-14, y-16); CX.lineTo(x+14, y-16);
        CX.moveTo(x+8, y-21); CX.lineTo(x+14, y-16); CX.lineTo(x+8, y-11);
        CX.stroke();
      }
    },
    {
      id:    'map',
      x: 748, y: 310,
      label: 'Bản đồ cũ',
      diary: '📓 08:31. Mảnh bản đồ kẹp trong kẽ đá — in màu, khổ A3, gấp vội. Đây là bản đồ địa hình khu vực này, nhưng có vẽ thêm bằng tay: các điểm khảo sát, đường nối, và một vòng tròn lớn màu đỏ bao quanh toàn bộ khu rừng phía Bắc. Bên trong vòng tròn — chữ viết tay: "Vùng lõi — ưu tiên 1". Tôi không hiểu. Nhưng tôi sợ mình đang bắt đầu hiểu.',
      drawIcon(x, y, pulse) {
        // Folded map wedged between rocks
        CX.fillStyle = `rgba(90,80,50,${0.7 + pulse * 0.2})`;
        CX.fillRect(x-20, y+4, 14, 18); // rock L
        CX.fillRect(x+8,  y+2, 16, 20); // rock R
        // Map paper
        CX.fillStyle = `rgba(220,205,160,${0.85 + pulse * 0.1})`;
        CX.save(); CX.rotate(-0.1);
        CX.beginPath(); CX.roundRect(x-14, y-20, 28, 26, 2); CX.fill();
        // Map details
        CX.strokeStyle = `rgba(180,60,60,${pulse})`;
        CX.lineWidth = 1.5;
        CX.beginPath(); CX.arc(x-2, y-8, 9, 0, Math.PI * 2); CX.stroke();
        CX.strokeStyle = 'rgba(80,100,160,0.6)';
        CX.lineWidth = 1;
        CX.beginPath();
        CX.moveTo(x-12, y-18); CX.lineTo(x+10, y-18);
        CX.moveTo(x-12, y-13); CX.lineTo(x+10, y-13);
        CX.moveTo(x-12, y-8);  CX.lineTo(x+10, y-8);
        CX.stroke();
        CX.restore();
      }
    }
  ];

  const TRAIL_Y    = 348;  // center of trail (foot level for player)
  const TYPE_SPEED = 0.022; // seconds per char for diary popup

  // ── State ─────────────────────────────────────────────────
  let found          = new Set();
  let popup          = null;   // { point, typePos, typeTimer, done }
  let tick           = 0;
  let playerX        = 75;
  let playerTarget   = 75;
  let walkPhase      = 0;
  let outroTimer     = -1;     // counts down after all 4 found
  let stars          = [];
  let fireflies      = [];
  let popupCache     = [];     // pre-wrapped lines for diary text

  // ── Background ────────────────────────────────────────────
  function genStars() {
    stars = [];
    for (let i = 0; i < 70; i++) {
      stars.push({ x: Math.random()*W, y: Math.random()*220, r: 0.4+Math.random()*1.4, ph: Math.random()*6 });
    }
  }
  function genFireflies() {
    fireflies = [];
    for (let i = 0; i < 10; i++) {
      fireflies.push({ ox: Math.random()*W, spd: 12+Math.random()*22, ph: Math.random()*6, amp: 40+Math.random()*60 });
    }
  }

  function drawBackground() {
    // Night sky gradient
    const sky = CX.createLinearGradient(0, 0, 0, H * 0.56);
    sky.addColorStop(0, '#010507');
    sky.addColorStop(0.6, '#041008');
    sky.addColorStop(1, '#061508');
    CX.fillStyle = sky; CX.fillRect(0, 0, W, H * 0.56);

    // Stars
    stars.forEach(s => {
      const a = 0.2 + 0.7 * Math.abs(Math.sin(tick * 0.6 + s.ph));
      CX.fillStyle = `rgba(235,250,215,${a})`;
      CX.beginPath(); CX.arc(s.x, s.y, s.r, 0, Math.PI * 2); CX.fill();
    });

    // Moon (smaller, off to side)
    CX.fillStyle = 'rgba(210,235,190,0.82)';
    CX.beginPath(); CX.arc(840, 48, 26, 0, Math.PI * 2); CX.fill();
    CX.fillStyle = 'rgba(6,12,6,0.72)';
    CX.beginPath(); CX.arc(854, 44, 24, 0, Math.PI * 2); CX.fill();

    // Ground/forest floor
    CX.fillStyle = '#0B1C07';
    CX.fillRect(0, H * 0.5, W, H * 0.5);

    // Trail (dirt path through forest)
    const trail = CX.createLinearGradient(0, H * 0.52, 0, H * 0.65);
    trail.addColorStop(0, '#1A1408');
    trail.addColorStop(0.5, '#221A0A');
    trail.addColorStop(1, '#141008');
    CX.fillStyle = trail;
    CX.beginPath();
    CX.moveTo(30,  H * 0.56);
    CX.lineTo(870, H * 0.53);
    CX.lineTo(870, H * 0.64);
    CX.lineTo(30,  H * 0.68);
    CX.closePath();
    CX.fill();

    // Trail edge foliage shadow
    const leftEdge = CX.createLinearGradient(0, 0, 80, 0);
    leftEdge.addColorStop(0, 'rgba(5,14,3,0.9)');
    leftEdge.addColorStop(1, 'rgba(0,0,0,0)');
    CX.fillStyle = leftEdge;
    CX.fillRect(0, H * 0.5, 80, H * 0.5);
    const rightEdge = CX.createLinearGradient(W-80, 0, W, 0);
    rightEdge.addColorStop(0, 'rgba(0,0,0,0)');
    rightEdge.addColorStop(1, 'rgba(5,14,3,0.9)');
    CX.fillStyle = rightEdge;
    CX.fillRect(W-80, H * 0.5, 80, H * 0.5);

    // Trail texture marks (old boot prints, scattered leaves)
    CX.save(); CX.globalAlpha = 0.3;
    for (let i = 0; i < 18; i++) {
      const tx = 60 + (i * 49) % (W - 100);
      const ty = TRAIL_Y - 20 + (i * 17) % 36;
      CX.fillStyle = '#302010';
      CX.beginPath(); CX.ellipse(tx, ty, 6+i%5, 3, (i*0.4)%Math.PI, 0, Math.PI*2); CX.fill();
    }
    CX.restore();

    // Tree canopies top
    drawCanopyRow();
    // Foreground undergrowth
    drawForeground();
    // Fireflies
    drawFireflies();
    // Ground mist
    const mist = CX.createLinearGradient(0, H*0.5, 0, H*0.62);
    mist.addColorStop(0, 'rgba(18,45,12,0)');
    mist.addColorStop(0.5, 'rgba(18,45,12,0.1)');
    mist.addColorStop(1,   'rgba(8,22,5,0)');
    CX.fillStyle = mist; CX.fillRect(0, H*0.48, W, H*0.16);
  }

  function drawCanopyRow() {
    const xs = [0, 100, 210, 330, 455, 570, 690, 800, 880];
    CX.save(); CX.globalAlpha = 0.94;
    xs.forEach((x, i) => {
      const h = 115 + (i*41+x)%70;
      const w = 42  + (i*19)%30;
      const cx = x + w/2;
      const gy = H * 0.56;
      CX.fillStyle = ['#040B03','#060E04','#050C03','#070F04','#040B03'][i%5];
      CX.fillRect(cx-5, gy-h+60, 10, h-55);
      [[0,0,w*0.68],[0,-20,w*0.55],[-10,-8,w*0.44],[10,-12,w*0.40]].forEach(([ox,oy,r])=>{
        CX.beginPath(); CX.arc(cx+ox, gy-h+oy+25, r, 0, Math.PI*2); CX.fill();
      });
    });
    CX.restore();
  }

  function drawForeground() {
    // Bottom edge bushes / roots
    const bxs = [30,120,240,340,470,590,700,810];
    bxs.forEach((x,i) => {
      CX.fillStyle = ['#071507','#061406','#081606','#060F05'][i%4];
      CX.beginPath();
      CX.arc(x,   H-18+(i%2)*12, 18+(i*11)%14, 0, Math.PI*2); CX.fill();
      CX.beginPath();
      CX.arc(x+22, H-22+(i%3)*8, 14+(i*7)%12, 0, Math.PI*2); CX.fill();
    });
  }

  function drawFireflies() {
    fireflies.forEach((f, i) => {
      const fx = (f.ox + tick * f.spd) % W;
      const fy = H * 0.42 + Math.sin(tick * 0.8 + f.ph) * f.amp;
      const a  = 0.3 + 0.7 * Math.abs(Math.sin(tick * 2.2 + f.ph * 1.3));
      const sz = 1.8 + 0.8 * Math.abs(Math.sin(tick * 1.5 + f.ph));
      CX.save();
      CX.shadowColor = `rgba(120,255,80,${a * 0.8})`;
      CX.shadowBlur  = 8;
      CX.fillStyle = `rgba(140,255,100,${a})`;
      CX.beginPath(); CX.arc(fx, fy, sz, 0, Math.PI * 2); CX.fill();
      CX.restore();
    });
  }

  // ── Investigation points render ───────────────────────────
  function drawPoints() {
    POINTS.forEach(pt => {
      if (found.has(pt.id)) {
        // Collected — green check ring
        CX.save();
        CX.shadowColor = 'rgba(60,220,60,0.5)'; CX.shadowBlur = 12;
        CX.strokeStyle = 'rgba(60,220,60,0.85)'; CX.lineWidth = 2;
        CX.beginPath(); CX.arc(pt.x, pt.y, 24, 0, Math.PI * 2); CX.stroke();
        CX.fillStyle = 'rgba(40,160,40,0.2)';
        CX.beginPath(); CX.arc(pt.x, pt.y, 24, 0, Math.PI * 2); CX.fill();
        CX.restore();
        CX.fillStyle = '#70FF70';
        CX.font = 'bold 18px "Be Vietnam Pro","Segoe UI",sans-serif'; CX.textAlign = 'center';
        CX.fillText('✓', pt.x, pt.y + 6);
        CX.textAlign = 'left';
        // draw icon (dimmed)
        CX.save(); CX.globalAlpha = 0.35; pt.drawIcon(pt.x, pt.y - 28, 0.4); CX.restore();
      } else {
        // Undiscovered — pulsing amber ring + icon above
        const pulse  = 0.55 + 0.45 * Math.sin(tick * 2.4 + POINTS.indexOf(pt) * 0.8);
        const pulse2 = 0.55 + 0.45 * Math.sin(tick * 2.4 + POINTS.indexOf(pt) * 0.8 + Math.PI);

        // Outer ripple
        CX.strokeStyle = `rgba(255,180,30,${pulse2 * 0.35})`;
        CX.lineWidth = 1.5;
        CX.beginPath(); CX.arc(pt.x, pt.y, 28 + pulse * 12, 0, Math.PI*2); CX.stroke();

        // Inner ring
        CX.save();
        CX.shadowColor = `rgba(255,160,20,${pulse * 0.6})`; CX.shadowBlur = 10;
        CX.strokeStyle = `rgba(255,195,50,${0.6 + pulse * 0.4})`; CX.lineWidth = 2;
        CX.beginPath(); CX.arc(pt.x, pt.y, 24, 0, Math.PI*2); CX.stroke();
        CX.restore();

        CX.fillStyle = `rgba(255,150,20,${0.1 + pulse * 0.08})`;
        CX.beginPath(); CX.arc(pt.x, pt.y, 24, 0, Math.PI*2); CX.fill();

        // ? glyph
        CX.fillStyle = `rgba(255,210,60,${0.75 + pulse * 0.25})`;
        CX.font = 'bold 17px "Be Vietnam Pro","Segoe UI",sans-serif'; CX.textAlign = 'center';
        CX.fillText('?', pt.x, pt.y + 6);
        CX.textAlign = 'left';

        // Icon above the ring
        CX.save(); CX.globalAlpha = 0.7 + pulse * 0.3;
        pt.drawIcon(pt.x, pt.y - 32, pulse);
        CX.restore();

        // Hover tooltip
        const hovered = Math.hypot(INPUT.x - pt.x, INPUT.y - pt.y) < 32;
        if (hovered) {
          const tw = CX.measureText(pt.label).width;
          CX.fillStyle = 'rgba(255,230,110,0.96)';
          CX.beginPath(); CX.roundRect(pt.x - tw/2 - 8, pt.y - 66, tw + 16, 22, 5); CX.fill();
          CX.fillStyle = '#1A1000';
          CX.font = 'bold 11px "Be Vietnam Pro","Segoe UI",sans-serif'; CX.textAlign = 'center';
          CX.fillText(pt.label, pt.x, pt.y - 50);
          CX.textAlign = 'left';
        }
      }
    });
  }

  // ── Player (Thuận walking along trail) ───────────────────
  function drawPlayer() {
    const moving = Math.abs(playerX - playerTarget) > 2;
    if (moving) walkPhase += 0.016 * 8;
    const flipX = playerTarget < playerX; // face toward target
    drawThuanChar(playerX, TRAIL_Y, 0.78, flipX, moving ? walkPhase : 0);
  }

  // ── HUD ───────────────────────────────────────────────────
  function drawHUD() {
    const cnt = found.size;

    // Background pill
    CX.fillStyle = 'rgba(3,12,4,0.88)';
    CX.beginPath(); CX.roundRect(18, 16, 228, 52, 9); CX.fill();
    CX.strokeStyle = 'rgba(60,140,60,0.45)'; CX.lineWidth = 1.2;
    CX.beginPath(); CX.roundRect(18, 16, 228, 52, 9); CX.stroke();

    CX.fillStyle = '#88FF88';
    CX.font = 'bold 13px "Be Vietnam Pro","Segoe UI",sans-serif'; CX.textAlign = 'left';
    CX.fillText(`🔍 Manh mối: ${cnt} / 4`, 34, 37);

    // Progress dots
    for (let i = 0; i < 4; i++) {
      CX.fillStyle = i < cnt ? '#50EE50' : 'rgba(80,80,80,0.5)';
      CX.beginPath(); CX.arc(40 + i * 26, 55, 8, 0, Math.PI * 2); CX.fill();
      if (i < cnt) {
        CX.fillStyle = 'rgba(0,0,0,0.7)';
        CX.font = 'bold 9px "Be Vietnam Pro","Segoe UI",sans-serif'; CX.textAlign = 'center';
        CX.fillText('✓', 40 + i * 26, 58);
      }
    }
    CX.textAlign = 'left';

    // Instruction hint
    CX.fillStyle = 'rgba(160,210,140,0.6)';
    CX.font = '11px "Be Vietnam Pro","Segoe UI",sans-serif';
    CX.fillText('Click vào vòng sáng để điều tra', 260, 44);

    // Scene label
    CX.fillStyle = 'rgba(80,140,60,0.5)';
    CX.font = '10px "Be Vietnam Pro","Segoe UI",sans-serif';
    CX.fillText('GAME 1 — Lần theo dấu khảo sát', 260, 60);
  }

  // ── Diary popup ───────────────────────────────────────────
  const POPUP_X = 44, POPUP_Y = H - 210, POPUP_W = W - 88, POPUP_H = 198;
  const DIARY_MAX_W = POPUP_W - 100;

  function openPopup(pt) {
    CX.font = 'italic 13px "Be Vietnam Pro","Segoe UI",sans-serif';
    popupCache = getWrappedLines(pt.diary, DIARY_MAX_W);
    popup = { point: pt, typePos: 0, typeTimer: 0, done: false };
  }

  function drawPopup() {
    if (!popup) return;

    // Dim background
    CX.fillStyle = 'rgba(0,0,0,0.55)';
    CX.fillRect(0, 0, W, H);

    // Box shadow
    CX.fillStyle = 'rgba(20,80,10,0.22)';
    CX.beginPath(); CX.roundRect(POPUP_X+3, POPUP_Y+5, POPUP_W, POPUP_H, 13); CX.fill();

    // Box
    CX.fillStyle = 'rgba(2,14,4,0.97)';
    CX.beginPath(); CX.roundRect(POPUP_X, POPUP_Y, POPUP_W, POPUP_H, 12); CX.fill();
    CX.strokeStyle = 'rgba(80,180,60,0.55)'; CX.lineWidth = 1.8;
    CX.beginPath(); CX.roundRect(POPUP_X, POPUP_Y, POPUP_W, POPUP_H, 12); CX.stroke();

    // Left notebook spine
    CX.fillStyle = 'rgba(50,110,30,0.38)';
    CX.beginPath(); CX.roundRect(POPUP_X, POPUP_Y, 48, POPUP_H, [12, 0, 0, 12]); CX.fill();
    CX.strokeStyle = 'rgba(80,160,40,0.25)'; CX.lineWidth = 1;
    CX.beginPath(); CX.moveTo(POPUP_X+48, POPUP_Y+8); CX.lineTo(POPUP_X+48, POPUP_Y+POPUP_H-8); CX.stroke();
    // Spine lines
    for (let ly = POPUP_Y + 22; ly < POPUP_Y + POPUP_H - 14; ly += 18) {
      CX.fillStyle = 'rgba(90,190,50,0.18)';
      CX.fillRect(POPUP_X + 10, ly, 28, 1.5);
    }
    // Spine circle binding
    for (let cy2 = POPUP_Y + 30; cy2 < POPUP_Y + POPUP_H - 20; cy2 += 38) {
      CX.fillStyle = 'rgba(130,220,80,0.3)';
      CX.beginPath(); CX.arc(POPUP_X + 24, cy2, 6, 0, Math.PI * 2); CX.fill();
    }

    // Location badge
    const pt = popup.point;
    CX.fillStyle = 'rgba(60,140,40,0.6)';
    CX.beginPath(); CX.roundRect(POPUP_X + 58, POPUP_Y + 12, 10 + pt.label.length * 9, 22, 5); CX.fill();
    CX.fillStyle = '#CCFFAA';
    CX.font = 'bold 12px "Be Vietnam Pro","Segoe UI",sans-serif'; CX.textAlign = 'left';
    CX.fillText(`📍 ${pt.label}`, POPUP_X + 64, POPUP_Y + 28);

    // Divider
    CX.strokeStyle = 'rgba(80,160,40,0.28)'; CX.lineWidth = 1;
    CX.beginPath();
    CX.moveTo(POPUP_X + 58, POPUP_Y + 38);
    CX.lineTo(POPUP_X + POPUP_W - 16, POPUP_Y + 38);
    CX.stroke();

    // Diary text (typewriter)
    CX.fillStyle = '#D0ECC0';
    CX.font = 'italic 13px "Be Vietnam Pro","Segoe UI",sans-serif';
    drawTypewriterLines(popupCache, POPUP_X + 60, POPUP_Y + 58, 22, popup.typePos);

    // Close button after text complete
    if (popup.done) {
      const pulse  = 0.75 + 0.25 * Math.sin(tick * 4.5);
      const btnX   = POPUP_X + POPUP_W - 138;
      const btnY   = POPUP_Y + POPUP_H - 38;
      CX.fillStyle = `rgba(50,160,50,${pulse})`;
      CX.beginPath(); CX.roundRect(btnX, btnY, 122, 26, 7); CX.fill();
      CX.strokeStyle = 'rgba(100,220,80,0.35)'; CX.lineWidth = 1;
      CX.beginPath(); CX.roundRect(btnX, btnY, 122, 26, 7); CX.stroke();
      CX.fillStyle = '#D8FFD0';
      CX.font = 'bold 12px "Be Vietnam Pro","Segoe UI",sans-serif'; CX.textAlign = 'center';
      CX.fillText('► Ghi nhận & đóng', btnX + 61, btnY + 18);
      CX.textAlign = 'left';
    }
  }

  // ── Outro (all 4 found) ───────────────────────────────────
  const OUTRO_LINES = [
    { speaker: "K'Brơi", color: '#AAFFAA', text: "Mình cần quay về làng. Nhưng em giữ lại mọi thứ em thấy hôm nay." },
    { speaker: 'Thuận',  color: '#88DDFF', text: "Vâng. Em sẽ không quên." }
  ];
  let outroIdx     = 0;
  let outroTypePos = 0;
  let outroTimer2  = 0;
  let outroShowing = false;
  let outroNext    = false;
  let outroCache   = [];

  function startOutro() {
    outroShowing = true;
    outroIdx     = 0;
    outroTypePos = 0;
    outroTimer2  = 0;
    outroNext    = false;
    CX.font = '15px "Be Vietnam Pro","Segoe UI",sans-serif';
    outroCache = getWrappedLines(OUTRO_LINES[0].text, W - 150);
  }

  function drawOutro() {
    if (!outroShowing) return;
    const d = OUTRO_LINES[outroIdx];
    const pulse = 0.72 + 0.28 * Math.sin(tick * 4);

    // Small banner at bottom
    CX.fillStyle = 'rgba(3,12,4,0.93)';
    CX.beginPath(); CX.roundRect(30, H - 120, W - 60, 110, 10); CX.fill();
    CX.strokeStyle = 'rgba(60,140,60,0.4)'; CX.lineWidth = 1.2;
    CX.beginPath(); CX.roundRect(30, H - 120, W - 60, 110, 10); CX.stroke();

    // Speaker
    const lw = d.speaker.length * 11 + 26;
    CX.fillStyle = d.color;
    CX.beginPath(); CX.roundRect(40, H - 138, lw, 26, 6); CX.fill();
    CX.fillStyle = 'rgba(0,0,0,0.65)';
    CX.font = 'bold 13px "Be Vietnam Pro","Segoe UI",sans-serif';
    CX.fillText(d.speaker, 52, H - 120);

    // Text
    CX.fillStyle = '#E8F5E8';
    CX.font = '15px "Be Vietnam Pro","Segoe UI",sans-serif';
    drawTypewriterLines(outroCache, 46, H - 105, 24, outroTypePos);

    // Continue
    if (outroNext) {
      const isLast = outroIdx >= OUTRO_LINES.length - 1;
      CX.fillStyle = `rgba(40,140,40,${pulse})`;
      CX.beginPath(); CX.roundRect(W - 220, H - 48, 178, 26, 8); CX.fill();
      CX.fillStyle = '#D8FFD8';
      CX.font = 'bold 12px "Be Vietnam Pro","Segoe UI",sans-serif'; CX.textAlign = 'center';
      CX.fillText(isLast ? '► Tiếp tục hành trình' : '► Tiếp tục', W - 131, H - 29);
      CX.textAlign = 'left';
    }
  }

  // ── All-found message ─────────────────────────────────────
  function drawAllFoundBadge() {
    if (found.size < 4 || outroShowing) return;
    const pulse = 0.8 + 0.2 * Math.sin(tick * 3.5);
    CX.fillStyle = `rgba(50,200,50,${pulse})`;
    CX.font = 'bold 15px "Be Vietnam Pro","Segoe UI",sans-serif'; CX.textAlign = 'center';
    CX.fillText('✅ Đã ghi đủ 4 manh mối! K\'Brơi tiến lại...', W/2, H/2 - 14);
    CX.textAlign = 'left';
  }

  // ══════════════════════════════════════════════════════════
  //  PUBLIC SCENE OBJECT
  // ══════════════════════════════════════════════════════════
  return {
    init() {
      found         = new Set();
      popup         = null;
      popupCache    = [];
      tick          = 0;
      playerX       = 75;
      playerTarget  = 75;
      walkPhase     = 0;
      outroTimer    = -1;
      outroShowing  = false;
      outroNext     = false;
      genStars();
      genFireflies();
      CV.style.cursor = 'crosshair';
      gameState.evidence.game1_clues = 0;
    },

    update(dt) {
      tick += dt;

      // Player movement
      if (Math.abs(playerX - playerTarget) > 1.5) {
        playerX += (playerTarget - playerX) * Math.min(1, dt * 3.2);
      } else {
        playerX = playerTarget;
      }

      // Popup typewriter
      if (popup && !popup.done) {
        popup.typeTimer += dt;
        const maxChar = popupCache.join(' ').length;
        while (popup.typeTimer >= TYPE_SPEED && popup.typePos < maxChar) {
          popup.typeTimer -= TYPE_SPEED;
          popup.typePos   += 1;
        }
        if (popup.typePos >= maxChar) popup.done = true;
      }

      // Outro typewriter
      if (outroShowing && !outroNext) {
        outroTimer2 += dt;
        const maxC = outroCache.join(' ').length;
        while (outroTimer2 >= 0.025 && outroTypePos < maxC) {
          outroTimer2 -= 0.025;
          outroTypePos++;
        }
        if (outroTypePos >= maxC) outroNext = true;
      }

      // ── Click handling ──────────────────────────────────
      if (consumeClick()) {

        // Outro advance
        if (outroShowing) {
          if (!outroNext) {
            outroTypePos = outroCache.join(' ').length + 1;
            outroNext = true;
          } else {
            if (outroIdx >= OUTRO_LINES.length - 1) {
              fadeOut(() => completeScene('game1'));
            } else {
              outroIdx++;
              outroTypePos = 0;
              outroTimer2  = 0;
              outroNext    = false;
              CX.font = '15px "Be Vietnam Pro","Segoe UI",sans-serif';
              outroCache = getWrappedLines(OUTRO_LINES[outroIdx].text, W - 150);
            }
          }
          return;
        }

        // Popup interaction
        if (popup) {
          if (!popup.done) {
            popup.typePos = popupCache.join(' ').length + 1;
            popup.done = true;
          } else {
            // Add to found set
            if (!found.has(popup.point.id)) {
              found.add(popup.point.id);
              gameState.evidence.game1_clues = found.size;
              saveState();
            }
            popup = null;
            popupCache = [];

            // All found → start outro after delay
            if (found.size >= 4) {
              outroTimer = 1.8; // seconds before outro appears
            }
          }
          return;
        }

        // Click on investigation point
        if (found.size < 4) {
          for (const pt of POINTS) {
            if (found.has(pt.id)) continue;
            if (Math.hypot(INPUT.x - pt.x, INPUT.y - pt.y) < 34) {
              playerTarget = pt.x;
              openPopup(pt);
              break;
            }
          }
        }
      }

      // Countdown to outro
      if (outroTimer > 0 && !outroShowing) {
        outroTimer -= dt;
        if (outroTimer <= 0) startOutro();
      }
    },

    render() {
      drawBackground();
      drawPoints();
      drawPlayer();
      drawHUD();
      drawAllFoundBadge();
      drawPopup();
      drawOutro();
    },

    destroy() {
      CV.style.cursor = 'default';
    }
  };
})();
