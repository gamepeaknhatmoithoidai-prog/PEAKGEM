'use strict';
// ══════════════════════════════════════════════════════════════
//  SCENE 1: "Cái gì đó sai sai"  (scenes/scene1.js)
// ══════════════════════════════════════════════════════════════

SCENES.scene1 = (() => {

  // ── Dialogue data ─────────────────────────────────────────
  const LINES = [
    {
      speaker: 'Thuận',
      color:   '#88DDFF',
      text:    "K'Brơi, hôm nay mình đi tuyến nào? Em cần ghi vào nhật ký thực địa — giáo viên hướng dẫn yêu cầu có tọa độ cụ thể.",
      side:    'right'   // glowing character highlight side
    },
    {
      speaker: "K'Brơi",
      color:   '#AAFFAA',
      text:    'Đứng lại.',
      side:    'left'
    },
    {
      speaker: null,     // narration — no speaker box
      color:   '#DDD8B8',
      text:    'Một cuộn dây đo màu vàng cam căng ngang lối mòn. Đầu dây cắm vào thân cây bằng một chiếc đinh thép. Trên thân dây, ký hiệu viết tay bằng bút dầu đen: [A-07]. Không có bảng hiệu. Không có tên đơn vị. Chỉ có con số.',
      side:    null
    },
    {
      speaker: 'Thuận',
      color:   '#88DDFF',
      text:    "Dây đo khảo sát? Ai đo gì ở đây vậy? Em không thấy dự án nào trong hồ sơ VQG mà anh K'Nơi đưa...",
      side:    'right'
    },
    {
      speaker: "K'Brơi",
      color:   '#AAFFAA',
      text:    'Câu hỏi đúng rồi đó.',
      side:    'left'
    }
  ];

  const TYPE_SPEED  = 0.028; // seconds per character (normal dialogue)
  const TYPE_NARR   = 0.018; // faster for long narration
  const GROUND_Y    = 430;   // foot-level y for characters
  const BOX_Y       = H - 188;
  const BOX_H       = 178;
  const BOX_PAD_X   = 55;
  const BOX_W       = W - 90;
  const TEXT_MAX_W  = BOX_W - 30;

  // ── State ─────────────────────────────────────────────────
  let lineIdx   = 0;
  let typePos   = 0;
  let typeTimer = 0;
  let showNext  = false;
  let tick      = 0;
  let stars     = [];
  let cachedLines = []; // pre-wrapped text lines for current dialogue

  // ── Background helpers ────────────────────────────────────
  function genStars() {
    stars = [];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * 260,
        r: 0.4 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function drawBackground() {
    // Night sky
    const sky = CX.createLinearGradient(0, 0, 0, H * 0.62);
    sky.addColorStop(0,   '#010608');
    sky.addColorStop(0.5, '#030D08');
    sky.addColorStop(1,   '#061408');
    CX.fillStyle = sky; CX.fillRect(0, 0, W, H * 0.62);

    // Ground / jungle floor
    const gnd = CX.createLinearGradient(0, H * 0.56, 0, H);
    gnd.addColorStop(0, '#0A1E08');
    gnd.addColorStop(1, '#040A03');
    CX.fillStyle = gnd; CX.fillRect(0, H * 0.56, W, H);

    // Moon
    CX.fillStyle = 'rgba(225,245,205,0.90)';
    CX.beginPath(); CX.arc(780, 62, 34, 0, Math.PI * 2); CX.fill();
    CX.fillStyle = 'rgba(8,16,6,0.72)';
    CX.beginPath(); CX.arc(796, 57, 31, 0, Math.PI * 2); CX.fill();

    // Moonlight shaft
    CX.save();
    const beam = CX.createLinearGradient(0, 0, 0, H * 0.6);
    beam.addColorStop(0,   'rgba(190,240,160,0.055)');
    beam.addColorStop(0.7, 'rgba(190,240,160,0.02)');
    beam.addColorStop(1,   'rgba(0,0,0,0)');
    CX.fillStyle = beam;
    CX.beginPath();
    CX.moveTo(730, 0); CX.lineTo(900, 0);
    CX.lineTo(700, H * 0.62); CX.lineTo(560, H * 0.62);
    CX.fill();
    CX.restore();

    // Stars
    CX.save();
    stars.forEach(s => {
      const a = 0.25 + 0.65 * Math.abs(Math.sin(tick * 0.7 + s.phase));
      CX.fillStyle = `rgba(240,250,220,${a})`;
      CX.beginPath(); CX.arc(s.x, s.y, s.r, 0, Math.PI * 2); CX.fill();
    });
    CX.restore();

    // Tree silhouettes — far row
    drawTreeRow(0.55, [30, 130, 260, 390, 520, 650, 780, 880], -20, 100, 50);
    // Tree silhouettes — near row
    drawTreeRow(0.88, [0, 80, 210, 360, 490, 630, 770, 870], 30,  140, 60);

    // Ground mist
    const mist = CX.createLinearGradient(0, H * 0.54, 0, H * 0.68);
    mist.addColorStop(0, 'rgba(20,50,15,0)');
    mist.addColorStop(0.4, 'rgba(20,50,15,0.12)');
    mist.addColorStop(1, 'rgba(10,30,8,0)');
    CX.fillStyle = mist; CX.fillRect(0, H * 0.52, W, H * 0.2);

    // Forest trail dirt path
    CX.fillStyle = 'rgba(55,38,18,0.55)';
    CX.beginPath();
    CX.ellipse(W / 2, GROUND_Y + 18, 280, 18, 0, 0, Math.PI * 2);
    CX.fill();

    // Survey tape [A-07] — appears from line 2 onward
    if (lineIdx >= 2) drawSurveyTape();
  }

  function drawTreeRow(alpha, xs, baseOffset, minH, hRange) {
    const colors = ['#040C04','#060E05','#051005','#070D05','#040B03'];
    CX.save(); CX.globalAlpha = alpha;
    xs.forEach((x, i) => {
      const h   = minH + (i * 43 + x) % hRange;
      const w   = 38  + (i * 17)      % 28;
      const cx  = x + w / 2;
      const gy  = H * 0.58 + baseOffset;
      CX.fillStyle = colors[i % colors.length];
      // Trunk
      CX.fillRect(cx - 5, gy - h + 50, 10, h - 50);
      // Canopy blobs
      [[0, 0, w*0.72], [0, -22, w*0.58], [-8, -10, w*0.45], [8, -14, w*0.42]].forEach(([ox,oy,r]) => {
        CX.beginPath(); CX.arc(cx+ox, gy-h+oy+25, r, 0, Math.PI*2); CX.fill();
      });
    });
    CX.restore();
  }

  function drawSurveyTape() {
    const ty   = H * 0.505;
    const pulse = 0.65 + 0.35 * Math.sin(tick * 2.8);

    // Tree stump left anchor
    CX.fillStyle = '#5A3818';
    CX.beginPath(); CX.roundRect(235, ty - 10, 14, 36, 3); CX.fill();
    CX.fillStyle = '#888';
    CX.fillRect(239, ty - 4, 6, 5); // nail

    // Tree stump right anchor
    CX.fillStyle = '#5A3818';
    CX.beginPath(); CX.roundRect(630, ty - 10, 14, 36, 3); CX.fill();
    CX.fillStyle = '#888';
    CX.fillRect(634, ty - 4, 6, 5);

    // Tape line
    CX.save();
    CX.strokeStyle = `rgba(255,165,30,${pulse})`;
    CX.lineWidth = 3.5;
    CX.setLineDash([10, 5]);
    CX.shadowColor = `rgba(255,140,0,${pulse * 0.7})`;
    CX.shadowBlur  = 8;
    CX.beginPath(); CX.moveTo(249, ty + 2); CX.lineTo(630, ty + 2); CX.stroke();
    CX.setLineDash([]);
    CX.shadowBlur = 0;
    CX.restore();

    // Label tag [A-07]
    CX.fillStyle = 'rgba(255,220,80,0.92)';
    CX.beginPath(); CX.roundRect(403, ty - 15, 74, 20, 4); CX.fill();
    CX.strokeStyle = 'rgba(200,120,0,0.6)'; CX.lineWidth = 1;
    CX.beginPath(); CX.roundRect(403, ty - 15, 74, 20, 4); CX.stroke();
    CX.fillStyle = '#1A0A00';
    CX.font = 'bold 12px monospace'; CX.textAlign = 'center';
    CX.fillText('[A-07]', 440, ty - 1);
    CX.textAlign = 'left';
  }

  // ── Dialogue box ──────────────────────────────────────────
  function setDialogueFont(isNarration) {
    CX.font = isNarration
      ? 'italic 14.5px "Be Vietnam Pro","Segoe UI",sans-serif'
      : '15px "Be Vietnam Pro","Segoe UI",sans-serif';
  }

  function refreshCache() {
    const d = LINES[lineIdx];
    setDialogueFont(d.speaker === null);
    cachedLines = getWrappedLines(d.text, TEXT_MAX_W);
  }

  function drawDialogueBox() {
    const d = LINES[lineIdx];
    const isNarr = d.speaker === null;

    // Box shadow
    CX.fillStyle = 'rgba(20,80,20,0.18)';
    CX.beginPath(); CX.roundRect(28, BOX_Y + 4, BOX_W + 4, BOX_H, 12); CX.fill();

    // Box body
    CX.fillStyle = 'rgba(3,12,4,0.94)';
    CX.beginPath(); CX.roundRect(30, BOX_Y, BOX_W, BOX_H, 10); CX.fill();
    CX.strokeStyle = 'rgba(60,140,60,0.45)'; CX.lineWidth = 1.5;
    CX.beginPath(); CX.roundRect(30, BOX_Y, BOX_W, BOX_H, 10); CX.stroke();

    // Speaker label
    let textStartY = BOX_Y + 22;
    if (!isNarr) {
      const labelW = d.speaker.length * 11 + 28;
      CX.fillStyle = d.color;
      CX.beginPath(); CX.roundRect(40, BOX_Y - 20, labelW, 28, 6); CX.fill();
      CX.fillStyle = 'rgba(0,0,0,0.65)';
      CX.font = 'bold 14px "Be Vietnam Pro","Segoe UI",sans-serif'; CX.textAlign = 'left';
      CX.fillText(d.speaker, 54, BOX_Y - 1);
      textStartY = BOX_Y + 24;
    } else {
      // Narration ornament
      CX.fillStyle = 'rgba(180,160,80,0.35)';
      CX.fillRect(40, BOX_Y + 12, 4, BOX_H - 24);
      textStartY = BOX_Y + 18;
    }

    // Text (typewriter)
    setDialogueFont(isNarr);
    CX.fillStyle = isNarr ? '#DDD8B8' : '#E8F5E8';
    CX.textAlign = 'left';
    drawTypewriterLines(cachedLines, BOX_PAD_X, textStartY, 24, typePos);

    // Continue / next button
    if (showNext) {
      const isLast  = lineIdx >= LINES.length - 1;
      const btnTxt  = isLast ? '► Bắt đầu điều tra' : '► Tiếp tục';
      const pulse   = 0.72 + 0.28 * Math.sin(tick * 4.2);
      const btnX    = W - 240, btnY = BOX_Y + BOX_H - 42, btnW = 196, btnH = 30;

      CX.fillStyle = isLast
        ? `rgba(50,180,50,${pulse})`
        : `rgba(40,110,40,${pulse})`;
      CX.beginPath(); CX.roundRect(btnX, btnY, btnW, btnH, 8); CX.fill();
      CX.strokeStyle = 'rgba(100,220,100,0.4)'; CX.lineWidth = 1;
      CX.beginPath(); CX.roundRect(btnX, btnY, btnW, btnH, 8); CX.stroke();

      CX.fillStyle = '#D8FFD8';
      CX.font = 'bold 13px "Be Vietnam Pro","Segoe UI",sans-serif';
      CX.textAlign = 'center';
      CX.fillText(btnTxt, btnX + btnW / 2, btnY + 20);
      CX.textAlign = 'left';
    }
  }

  // ── Character rendering ───────────────────────────────────
  function drawCharacters() {
    const d = LINES[lineIdx];

    // Highlight the active speaker with a glow bloom
    CX.save();
    if (d.side === 'left') {
      CX.shadowColor = '#AAFFAA'; CX.shadowBlur = 24;
    }
    // K'Brơi — left side, facing right
    drawKBroiChar(195, GROUND_Y, 1.15, false, 0);
    CX.restore();

    CX.save();
    if (d.side === 'right') {
      CX.shadowColor = '#88DDFF'; CX.shadowBlur = 24;
    }
    // Thuận — right side, facing left (flipX=true)
    drawThuanChar(700, GROUND_Y, 1.15, true, 0);
    CX.restore();

    // Non-active character dimmed
    // (Already handled by the shadow only being on active side)
  }

  // ── Public scene object ───────────────────────────────────
  return {
    init() {
      lineIdx   = 0;
      typePos   = 0;
      typeTimer = 0;
      showNext  = false;
      tick      = 0;
      genStars();
      refreshCache();
      CV.style.cursor = 'pointer';
    },

    update(dt) {
      tick += dt;

      const d       = LINES[lineIdx];
      const speed   = d.speaker === null ? TYPE_NARR : TYPE_SPEED;
      const maxChar = cachedLines.join(' ').length;

      if (!showNext) {
        typeTimer += dt;
        while (typeTimer >= speed && typePos < maxChar) {
          typeTimer -= speed;
          typePos   += 1;
        }
        if (typePos >= maxChar) showNext = true;
      }

      if (consumeClick()) {
        if (!showNext) {
          // Skip to end of current line
          typePos  = maxChar + 1;
          showNext = true;
        } else {
          // Advance
          if (lineIdx >= LINES.length - 1) {
            fadeOut(() => completeScene('scene1'));
          } else {
            lineIdx   += 1;
            typePos    = 0;
            typeTimer  = 0;
            showNext   = false;
            refreshCache();
          }
        }
      }
    },

    render() {
      drawBackground();
      drawCharacters();
      drawDialogueBox();

      // Chapter title (top-left, fades out after first click)
      if (lineIdx === 0) {
        const a = Math.max(0, 1 - tick * 0.3);
        if (a > 0) {
          CX.globalAlpha = a;
          CX.fillStyle = 'rgba(80,160,80,0.7)';
          CX.font = 'bold 11px "Be Vietnam Pro","Segoe UI",sans-serif';
          CX.textAlign = 'left';
          CX.fillText('CHƯƠNG 2  ·  "SỰ THẬT & LỰA CHỌN"', 20, 26);
          CX.fillStyle = 'rgba(160,220,140,0.5)';
          CX.font = '10px "Be Vietnam Pro","Segoe UI",sans-serif';
          CX.fillText('SCENE 1 — Cái gì đó sai sai', 20, 44);
          CX.globalAlpha = 1;
        }
      }
    },

    destroy() {
      CV.style.cursor = 'default';
    }
  };
})();
