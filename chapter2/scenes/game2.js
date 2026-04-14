'use strict';
// ══════════════════════════════════════════════════════════════
//  GAME 2: "Dấu vết trong rừng"  — Hidden Object
//  Tìm ≥ 6/8 vật thể ẩn trong cảnh rừng.
//  Trust bonus: tìm đủ 6 → +1, tìm đủ 8 → +2
// ══════════════════════════════════════════════════════════════

SCENES.game2 = (() => {

  // ── Dialogue cuối scene ──────────────────────────────────────
  const OUTRO = [
    {
      speaker: 'Thuận',  color: '#88DDFF', side: 'right',
      text: "K'Brơi! Cây này bị sơn dấu X đỏ. Cây bị đánh dấu như vầy là chuẩn bị chặt, đúng không?"
    },
    {
      speaker: "K'Brơi", color: '#AAFFAA', side: 'left',
      text: "(giọng đổi, nhẹ hơn một chút) Em biết vậy à."
    },
    {
      speaker: 'Thuận',  color: '#88DDFF', side: 'right',
      text: "Em học môn Quy hoạch đô thị. Ký hiệu này không lạ với em. Nhưng thấy nó ở đây thì — nhiều quá. K'Brơi, đây là cây gì? Có giá trị bảo tổn không?"
    },
    {
      speaker: "K'Brơi", color: '#AAFFAA', side: 'left',
      text: "Cây giáng hương. Trên 200 tuổi. Loài nguy cấp. (chỉ tay sang trái) Còn cái kia — bằng lăng nước. Tổ chim hồng hoàng đang làm tổ trong đó. Mùa này chúng đang ấp trứng."
    },
    {
      speaker: 'Thuận',  color: '#88DDFF', side: 'right',
      text: "(thì thầm, không hỏi ai — chỉ nói với chính mình) Trời ơi..."
    },
  ];

  // ── Vật thể ẩn ───────────────────────────────────────────────
  //  x, y = tâm vật; r = bán kính phát hiện; found được reset khi init()
  const ITEMS = [
    { id:'x1',      x:112, y:238, r:22, label:'Dấu X đỏ #1',    found:false },
    { id:'x2',      x:793, y:210, r:22, label:'Dấu X đỏ #2',    found:false },
    { id:'sawdust', x:285, y:468, r:20, label:'Mùn cưa tươi',   found:false },
    { id:'rope',    x:490, y:452, r:22, label:'Sợi dây thừng',  found:false },
    { id:'boot',    x:718, y:488, r:18, label:'Dấu giày da',    found:false },
    { id:'bag',     x:145, y:482, r:20, label:'Túi vải bỏ lại', found:false },
    { id:'wire',    x:558, y:264, r:18, label:'Dây điện cắt',   found:false },
    { id:'lighter', x:406, y:498, r:16, label:'Bật lửa',        found:false },
  ];

  // ── State ─────────────────────────────────────────────────────
  let found = new Set();
  let hoverIdx   = -1;
  let hintIdx    = -1, hintTimer = 0, hintsLeft = 3;
  let phase = 'hunt'; // 'hunt' | 'outro' | 'done'
  let outroLine  = 0, charCount = 0, charTimer = 0, showNext = false;
  let outroCaches = [];
  let foundFlash  = [];  // { idx, timer }
  let time = 0;

  // ── Init ──────────────────────────────────────────────────────
  function init() {
    found.clear();
    ITEMS.forEach(it => { it.found = false; });
    hoverIdx = -1; hintIdx = -1; hintTimer = 0; hintsLeft = 3;
    phase = 'hunt'; outroLine = 0; charCount = 0; charTimer = 0;
    showNext = false; outroCaches = []; foundFlash = []; time = 0;
    fadeIn();
  }

  // ── Update ────────────────────────────────────────────────────
  function update(dt) {
    time += dt;

    // Hover detection (hunt phase only)
    hoverIdx = -1;
    if (phase === 'hunt') {
      for (let i = 0; i < ITEMS.length; i++) {
        if (ITEMS[i].found) continue;
        const dx = INPUT.x - ITEMS[i].x, dy = INPUT.y - ITEMS[i].y;
        if (dx*dx + dy*dy < ITEMS[i].r * ITEMS[i].r * 3.5) { hoverIdx = i; break; }
      }
    }

    // Discovery flash timers
    foundFlash = foundFlash.filter(f => { f.timer -= dt; return f.timer > 0; });

    // Hint timer
    if (hintTimer > 0) { hintTimer -= dt; if (hintTimer <= 0) hintIdx = -1; }

    if (phase === 'hunt') {
      if (consumeClick()) handleHuntClick();
    } else if (phase === 'outro') {
      updateOutro(dt);
    }
  }

  function handleHuntClick() {
    const cx = INPUT.x, cy = INPUT.y;

    // Hint button: bottom-right [768,538]→[876,572]
    if (hintsLeft > 0 && cx >= 768 && cx <= 876 && cy >= 534 && cy <= 570) {
      useHint(); return;
    }

    // Continue button (only if ≥6 found): [310,534]→[590,570]
    if (found.size >= 6 && cx >= 310 && cx <= 590 && cy >= 534 && cy <= 570) {
      startOutro(); return;
    }

    // Item click (generous hitbox: r*√2.5 radius)
    for (let i = 0; i < ITEMS.length; i++) {
      const it = ITEMS[i];
      if (it.found) continue;
      const dx = cx - it.x, dy = cy - it.y;
      if (dx*dx + dy*dy < it.r * it.r * 2.5) {
        it.found = true;
        found.add(it.id);
        foundFlash.push({ idx: i, timer: 1.0 });
        break;
      }
    }
  }

  function useHint() {
    if (hintsLeft <= 0) return;
    // Nearest unfound item to cursor
    let best = -1, bestD = Infinity;
    for (let i = 0; i < ITEMS.length; i++) {
      if (ITEMS[i].found) continue;
      const dx = INPUT.x - ITEMS[i].x, dy = INPUT.y - ITEMS[i].y;
      const d = dx*dx + dy*dy;
      if (d < bestD) { bestD = d; best = i; }
    }
    if (best >= 0) { hintIdx = best; hintTimer = 2.5; hintsLeft--; }
  }

  function startOutro() {
    const bonus = found.size >= 8 ? 2 : 1;
    gameState.playerScore += bonus;
    gameState.evidence.game2_objects = found.size;
    // Pre-wrap dialogue lines (set correct font per line for width measure)
    outroCaches = OUTRO.map(d => {
      const isNarr = d.speaker === null;
      CX.font = isNarr
        ? `italic 14.5px ${FONT_SANS}`
        : `15px ${FONT_SANS}`;
      return getWrappedLines(d.text, 700);
    });
    outroLine = 0; charCount = 0; charTimer = 0; showNext = false;
    phase = 'outro';
  }

  function updateOutro(dt) {
    const lines = outroCaches[outroLine];
    const total = lines.reduce((s, l) => s + l.length + 1, 0);

    if (!showNext) {
      charTimer += dt;
      charCount = Math.min(charTimer / 0.028, total);
      if (charCount >= total) showNext = true;
    }

    if (consumeClick()) {
      if (!showNext) {
        charCount = total; showNext = true;
      } else {
        outroLine++;
        if (outroLine >= OUTRO.length) {
          phase = 'done';
          fadeOut(() => completeScene('game2'));
        } else {
          charCount = 0; charTimer = 0; showNext = false;
        }
      }
    }
  }

  // ── Render ────────────────────────────────────────────────────
  function render() {
    drawForestBg();
    drawItems();
    if (phase === 'hunt') drawHUD();
    else drawOutro();
  }

  // ── Forest background ─────────────────────────────────────────
  function drawForestBg() {
    // Sky gradient
    const sky = CX.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0,   '#0A1808');
    sky.addColorStop(0.4, '#0E1E0A');
    sky.addColorStop(1,   '#050D04');
    CX.fillStyle = sky;
    CX.fillRect(0, 0, W, H);

    // Dappled light patches through canopy
    [[180,140,50,55],[440,105,72,58],[690,130,58,44]].forEach(([lx,ly,lw,lh]) => {
      const lg = CX.createRadialGradient(lx, ly, 4, lx, ly + 20, lh);
      lg.addColorStop(0, 'rgba(180,220,100,0.10)');
      lg.addColorStop(1, 'rgba(0,0,0,0)');
      CX.fillStyle = lg;
      CX.fillRect(lx - lw, ly - 10, lw * 2, lh * 2);
    });

    // Far silhouette trees
    [[50,510],[195,525],[370,515],[560,505],[745,520],[875,510]].forEach(([tx,ty]) => {
      CX.fillStyle = '#060E04';
      CX.beginPath(); CX.ellipse(tx, ty - 70, 34, 85, 0, 0, Math.PI * 2); CX.fill();
    });

    // Main tree trunks (foot-anchored)
    const TRUNKS = [
      { cx: 90,  w: 40 },
      { cx: 255, w: 34 },
      { cx: 450, w: 50 },
      { cx: 628, w: 38 },
      { cx: 805, w: 42 },
    ];
    TRUNKS.forEach(t => {
      const tg = CX.createLinearGradient(t.cx - t.w / 2, 0, t.cx + t.w / 2, 0);
      tg.addColorStop(0,   '#1A0E06');
      tg.addColorStop(0.3, '#2E1A0A');
      tg.addColorStop(0.7, '#241408');
      tg.addColorStop(1,   '#130A04');
      CX.fillStyle = tg;
      CX.beginPath();
      CX.roundRect(t.cx - t.w / 2, 30, t.w, H - 30, [4, 4, 0, 0]);
      CX.fill();
      // Bark lines
      CX.strokeStyle = 'rgba(8,4,2,0.45)'; CX.lineWidth = 1.4;
      for (let yl = 80; yl < H; yl += 45) {
        CX.beginPath();
        CX.moveTo(t.cx - t.w / 2 + 4, yl);
        CX.lineTo(t.cx + t.w / 2 - 4, yl + 10);
        CX.stroke();
      }
    });

    // Roots at tree bases
    TRUNKS.forEach(t => {
      CX.fillStyle = '#1A0E06';
      [-1, 1].forEach(side => {
        CX.beginPath();
        CX.moveTo(t.cx + side * t.w / 2, H - 90);
        CX.quadraticCurveTo(
          t.cx + side * (t.w / 2 + 22), H - 28,
          t.cx + side * (t.w / 2 + 38), H
        );
        CX.lineTo(t.cx + side * (t.w / 2 + 4), H);
        CX.closePath(); CX.fill();
      });
    });

    // Canopy blobs (upper)
    [
      [90,78,82,58],[255,60,92,62],[450,38,112,72],[628,62,88,60],[805,72,82,56],
      [172,105,72,46],[360,82,88,54],[540,92,76,50],[700,88,82,52],
    ].forEach(([cx,cy,rw,rh]) => {
      const fg = CX.createRadialGradient(cx, cy, rw * 0.08, cx, cy + rh * 0.2, Math.max(rw, rh));
      fg.addColorStop(0, '#1A3010');
      fg.addColorStop(0.5, '#112008');
      fg.addColorStop(1, 'rgba(4,8,3,0)');
      CX.fillStyle = fg;
      CX.beginPath(); CX.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2); CX.fill();
    });

    // Mid-level foliage
    [
      [50,278,62,42],[165,258,72,46],[305,272,66,44],[425,252,82,52],
      [562,262,72,46],[692,268,76,50],[822,258,66,43],[910,275,56,38],
    ].forEach(([cx,cy,rw,rh]) => {
      CX.fillStyle = 'rgba(10,24,8,0.82)';
      CX.beginPath(); CX.ellipse(cx, cy, rw, rh, 0.08, 0, Math.PI * 2); CX.fill();
    });

    // Ground layer
    const grd = CX.createLinearGradient(0, 462, 0, H);
    grd.addColorStop(0,   '#1A1008');
    grd.addColorStop(0.4, '#0E0A04');
    grd.addColorStop(1,   '#080602');
    CX.fillStyle = grd;
    CX.fillRect(0, 462, W, H - 462);

    // Leaf litter / ground texture
    for (let i = 0; i < 28; i++) {
      const lx = (i * 137 + 30) % W;
      const ly = 475 + (i * 73) % 40;
      CX.fillStyle = `rgba(${22+i%5*3},${14+i%4*2},${6+i%3},0.5)`;
      CX.beginPath(); CX.ellipse(lx, ly, 6 + i % 4, 3 + i % 2, (i * 0.4), 0, Math.PI * 2); CX.fill();
    }

    // Ferns
    for (let i = 0; i < 15; i++) {
      const fx = 32 + i * 62;
      const fy = 488 + Math.sin(i * 1.8) * 7;
      CX.fillStyle = `rgba(${10+i%4*2},${20+i%3*4},${7+i%2*3},0.65)`;
      for (let j = 0; j < 5; j++) {
        const a = -Math.PI * 0.72 + j * (Math.PI * 0.36);
        CX.beginPath();
        CX.moveTo(fx, fy);
        CX.quadraticCurveTo(fx + Math.cos(a) * 18, fy + Math.sin(a) * 22,
                             fx + Math.cos(a) * 28, fy + Math.sin(a) * 14);
        CX.fill();
      }
    }
  }

  // ── Draw individual item icon ─────────────────────────────────
  function drawItemIcon(it, alpha) {
    CX.save();
    CX.globalAlpha = alpha;
    const { id, x, y } = it;
    const ph = 0.7 + 0.3 * Math.sin(time * 3.5 + ITEMS.indexOf(it));

    // Hint highlight ring
    if (hintIdx === ITEMS.indexOf(it) && hintTimer > 0) {
      CX.strokeStyle = `rgba(255,180,50,${0.6 * ph})`;
      CX.lineWidth = 2.5;
      CX.beginPath(); CX.arc(x, y, it.r + 8 + ph * 5, 0, Math.PI * 2); CX.stroke();
    }

    if (id === 'x1' || id === 'x2') {
      // Red painted X on bark
      CX.strokeStyle = 'rgba(192,42,10,0.88)'; CX.lineWidth = 5; CX.lineCap = 'round';
      CX.beginPath(); CX.moveTo(x-9,y-9); CX.lineTo(x+9,y+9); CX.stroke();
      CX.beginPath(); CX.moveTo(x+9,y-9); CX.lineTo(x-9,y+9); CX.stroke();
      // Paint drip
      CX.strokeStyle = 'rgba(140,18,5,0.55)'; CX.lineWidth = 2;
      CX.beginPath(); CX.moveTo(x+3,y+9); CX.lineTo(x+5,y+17); CX.stroke();

    } else if (id === 'sawdust') {
      // Pile of yellowish chips on ground
      for (let i = 0; i < 20; i++) {
        const dx = Math.cos(i * 0.82) * 11 * (0.25 + (i%3) * 0.22);
        const dy = Math.sin(i * 1.18) * 5  * (0.25 + (i%2) * 0.35);
        CX.fillStyle = `rgba(${168+i%4*7},${128+i%3*5},${38+i%2*9},0.78)`;
        CX.beginPath(); CX.arc(x+dx, y+dy, 1.4 + (i%3)*0.6, 0, Math.PI*2); CX.fill();
      }

    } else if (id === 'rope') {
      // Coiled rope on ground
      CX.strokeStyle = 'rgba(155,118,58,0.82)'; CX.lineWidth = 3; CX.lineCap = 'round';
      CX.beginPath();
      for (let a = 0; a < Math.PI * 4; a += 0.15) {
        const rr = 4 + a * 1.15;
        const rx = x + Math.cos(a) * rr * 0.92;
        const ry = y + Math.sin(a) * rr * 0.5;
        a < 0.01 ? CX.moveTo(rx, ry) : CX.lineTo(rx, ry);
      }
      CX.stroke();

    } else if (id === 'boot') {
      // Boot print silhouette in mud
      CX.fillStyle = 'rgba(55,33,12,0.68)';
      CX.beginPath(); CX.ellipse(x,   y+4,  8, 14, 0.22,  0, Math.PI*2); CX.fill();
      CX.beginPath(); CX.ellipse(x+7, y-10, 6,  8, 0.32,  0, Math.PI*2); CX.fill();
      CX.strokeStyle = 'rgba(38,18,6,0.5)'; CX.lineWidth = 1;
      for (let rl = -10; rl < 10; rl += 4) {
        CX.beginPath(); CX.moveTo(x-5, y+rl); CX.lineTo(x+5, y+rl); CX.stroke();
      }

    } else if (id === 'bag') {
      // Abandoned canvas bag
      CX.fillStyle = 'rgba(78,52,28,0.72)';
      CX.beginPath(); CX.roundRect(x-10, y-8, 20, 16, 3); CX.fill();
      CX.strokeStyle = 'rgba(55,38,16,0.62)'; CX.lineWidth = 1.5; CX.lineCap = 'round';
      CX.beginPath(); CX.moveTo(x-6,y-8); CX.lineTo(x-8,y-14); CX.lineTo(x+8,y-14); CX.lineTo(x+6,y-8); CX.stroke();
      CX.fillStyle = 'rgba(100,68,32,0.5)'; CX.fillRect(x-4, y-6, 8, 12);

    } else if (id === 'wire') {
      // Cut wire with frayed ends
      CX.strokeStyle = 'rgba(80,80,92,0.78)'; CX.lineWidth = 2.5; CX.lineCap = 'round';
      CX.beginPath(); CX.moveTo(x-20,y-3); CX.lineTo(x-3,y+2); CX.stroke();
      CX.beginPath(); CX.moveTo(x+3, y-2); CX.lineTo(x+20,y+5); CX.stroke();
      CX.lineWidth = 1.2;
      for (let fi = 0; fi < 3; fi++) {
        CX.beginPath(); CX.moveTo(x-3+fi, y+2); CX.lineTo(x-6+fi*2, y+7+fi); CX.stroke();
        CX.beginPath(); CX.moveTo(x+3+fi, y-2); CX.lineTo(x+6+fi,   y-6-fi); CX.stroke();
      }

    } else if (id === 'lighter') {
      // Small red lighter under leaf litter
      CX.fillStyle = 'rgba(175,38,28,0.72)';
      CX.beginPath(); CX.roundRect(x-5, y-8, 10, 14, 2); CX.fill();
      CX.fillStyle = 'rgba(200,158,48,0.62)';
      CX.beginPath(); CX.arc(x, y-8, 3.5, Math.PI, 0); CX.fill();
      CX.strokeStyle = 'rgba(138,98,18,0.68)'; CX.lineWidth = 1;
      for (let a = 0; a < Math.PI; a += Math.PI / 5) {
        CX.beginPath();
        CX.moveTo(x + Math.cos(a)*2.5, y-8 + Math.sin(a)*2.5);
        CX.lineTo(x + Math.cos(a)*4,   y-8 + Math.sin(a)*4);
        CX.stroke();
      }
    }

    CX.restore();
  }

  // ── Draw all items ────────────────────────────────────────────
  function drawItems() {
    for (let i = 0; i < ITEMS.length; i++) {
      const it   = ITEMS[i];
      const flash = foundFlash.find(f => f.idx === i);

      if (it.found) {
        // Green glow + full alpha
        CX.save(); CX.shadowColor = '#50EE30'; CX.shadowBlur = 18;
        drawItemIcon(it, 1.0);
        CX.restore();
        // Check mark above
        CX.font = `bold 12px ${FONT_SANS}`; CX.textAlign = 'center';
        CX.fillStyle = 'rgba(80,210,60,0.92)';
        CX.fillText('✓', it.x, it.y - it.r - 4);
        CX.textAlign = 'left';
      } else {
        let baseAlpha = 0.55;
        if (hoverIdx === i) baseAlpha = 0.88;
        if (hintIdx  === i && hintTimer > 0) baseAlpha = 0.95;

        if (hoverIdx === i) {
          CX.strokeStyle = 'rgba(255,200,80,0.38)'; CX.lineWidth = 1.5;
          CX.beginPath(); CX.arc(it.x, it.y, it.r + 3, 0, Math.PI * 2); CX.stroke();
        }

        drawItemIcon(it, baseAlpha);
      }

      // Discovery flash ring
      if (flash) {
        const t2 = flash.timer;
        CX.save(); CX.globalAlpha = t2;
        CX.fillStyle = `rgba(255,222,55,${t2 * 0.45})`;
        CX.beginPath(); CX.arc(it.x, it.y, it.r * (2.2 - t2), 0, Math.PI * 2); CX.fill();
        CX.restore();
      }
    }

    // Hover tooltip
    if (hoverIdx >= 0 && !ITEMS[hoverIdx].found) {
      const it = ITEMS[hoverIdx];
      CX.font = `bold 11px ${FONT_SANS}`;
      const tw = CX.measureText(it.label).width;
      const tx = Math.max(4, Math.min(W - tw - 14, it.x - tw / 2 - 7));
      const ty = it.y - it.r - 22;
      CX.fillStyle = 'rgba(8,18,6,0.88)';
      CX.beginPath(); CX.roundRect(tx, ty, tw + 14, 18, 4); CX.fill();
      CX.fillStyle = '#C8F0A8';
      CX.fillText(it.label, tx + 7, ty + 12);
    }
  }

  // ── HUD (hunt phase) ──────────────────────────────────────────
  function drawHUD() {
    // Scene label (top, below progress bar)
    CX.font = `bold 11px ${FONT_SANS}`;
    CX.fillStyle = 'rgba(160,220,130,0.55)';
    CX.textAlign = 'center';
    CX.fillText('🔍  Tìm kiếm bằng chứng trong rừng', W / 2, BAR_H + 18);
    CX.textAlign = 'left';

    // Bottom HUD bar
    const barY = H - 62;
    CX.fillStyle = 'rgba(4,12,4,0.90)';
    CX.beginPath(); CX.roundRect(12, barY, W - 24, 50, 8); CX.fill();
    CX.strokeStyle = 'rgba(48,88,38,0.70)'; CX.lineWidth = 1;
    CX.beginPath(); CX.roundRect(12, barY, W - 24, 50, 8); CX.stroke();

    // Found counter text
    CX.font = `bold 13px ${FONT_SANS}`; CX.fillStyle = '#AADDAA'; CX.textAlign = 'left';
    CX.fillText(`Đã tìm: ${found.size} / 8`, 28, barY + 20);
    CX.font = `11px ${FONT_SANS}`;
    CX.fillStyle = found.size >= 6 ? '#6DB55C' : '#7A9070';
    CX.fillText(
      found.size >= 6 ? 'Đủ điều kiện tiếp tục!' : `Cần ít nhất ${6 - found.size} vật thể nữa`,
      28, barY + 36
    );

    // Slot dots (8)
    for (let i = 0; i < 8; i++) {
      CX.beginPath(); CX.arc(210 + i * 22, barY + 25, 5.5, 0, Math.PI * 2);
      CX.fillStyle = i < found.size ? '#6DB55C' : '#243020';
      CX.fill();
    }

    // Continue button (≥6)
    if (found.size >= 6) {
      const bx = 310, by = barY + 9, bw = 200, bh = 32;
      const hov = INPUT.x >= bx && INPUT.x <= bx + bw && INPUT.y >= by && INPUT.y <= by + bh;
      CX.fillStyle = hov ? '#3D7A30' : '#2D5A27';
      CX.beginPath(); CX.roundRect(bx, by, bw, bh, 6); CX.fill();
      CX.font = `bold 13px ${FONT_SANS}`; CX.fillStyle = '#C8F0A8'; CX.textAlign = 'center';
      CX.fillText('Kết thúc điều tra  →', bx + bw / 2, by + 20);
      CX.textAlign = 'left';
    }

    // Hint button
    if (hintsLeft > 0) {
      const hx = 770, hy = barY + 9, hw = 106, hh = 32;
      const hHov = INPUT.x >= hx && INPUT.x <= hx + hw && INPUT.y >= hy && INPUT.y <= hy + hh;
      CX.fillStyle = hHov ? '#5A3E1A' : '#3A2A12';
      CX.beginPath(); CX.roundRect(hx, hy, hw, hh, 6); CX.fill();
      CX.font = `bold 12px ${FONT_SANS}`; CX.fillStyle = '#F0C878'; CX.textAlign = 'center';
      CX.fillText(`Gợi ý  (${hintsLeft})`, hx + hw / 2, hy + 20);
      CX.textAlign = 'left';
    }
  }

  // ── Outro dialogue ────────────────────────────────────────────
  function drawOutro() {
    // Dim forest
    CX.fillStyle = 'rgba(0,0,0,0.52)';
    CX.fillRect(0, 0, W, H);

    const d        = OUTRO[outroLine];
    const isNarr   = d.speaker === null;
    const thuanGlow = d.side === 'right';
    const broiGlow  = d.side === 'left';

    // Characters
    CX.save();
    if (thuanGlow) { CX.shadowColor = d.color; CX.shadowBlur = 22; }
    drawThuanChar(710, 428, 1.0, false);
    CX.restore();

    CX.save();
    if (broiGlow) { CX.shadowColor = d.color; CX.shadowBlur = 22; }
    drawKBroiChar(205, 426, 1.0, true);
    CX.restore();

    // Dialogue box
    const bx = 38, by = 446, bw = 824, bh = 132;
    CX.fillStyle = 'rgba(4,14,4,0.94)';
    CX.beginPath(); CX.roundRect(bx, by, bw, bh, 10); CX.fill();
    CX.strokeStyle = 'rgba(58,98,48,0.82)'; CX.lineWidth = 1.5;
    CX.beginPath(); CX.roundRect(bx, by, bw, bh, 10); CX.stroke();

    if (!isNarr) {
      // Speaker label + underline
      CX.font = `bold 14px ${FONT_SANS}`; CX.fillStyle = d.color; CX.textAlign = 'left';
      CX.fillText(d.speaker, bx + 16, by + 22);
      const lw = CX.measureText(d.speaker).width;
      CX.save(); CX.strokeStyle = d.color; CX.globalAlpha = 0.5; CX.lineWidth = 1;
      CX.beginPath(); CX.moveTo(bx+16,by+26); CX.lineTo(bx+16+lw,by+26); CX.stroke();
      CX.restore();
    } else {
      // Gold left bar for narration
      CX.fillStyle = 'rgba(200,160,55,0.72)';
      CX.fillRect(bx + 10, by + 12, 3, bh - 24);
    }

    // Typewriter text
    CX.font = isNarr
      ? `italic 14.5px ${FONT_SANS}`
      : `15px ${FONT_SANS}`;
    CX.fillStyle = d.color; CX.textAlign = 'left';
    drawTypewriterLines(
      outroCaches[outroLine],
      isNarr ? bx + 22 : bx + 16,
      isNarr ? by + 32 : by + 42,
      22, charCount
    );

    // Continue button
    if (showNext) {
      const isLast = outroLine >= OUTRO.length - 1;
      const label  = isLast ? '► Hoàn thành' : '► Tiếp tục';
      CX.font = `bold 13px ${FONT_SANS}`;
      const bw2 = CX.measureText(label).width + 24;
      const btnX = bx + bw - bw2 - 12, btnY = by + bh - 30;
      const hov = INPUT.x >= btnX && INPUT.x <= btnX + bw2 && INPUT.y >= btnY && INPUT.y <= btnY + 22;
      CX.fillStyle = hov ? 'rgba(60,100,50,0.92)' : 'rgba(38,68,32,0.82)';
      CX.beginPath(); CX.roundRect(btnX, btnY, bw2, 22, 5); CX.fill();
      CX.fillStyle = '#C8F0A8'; CX.textAlign = 'center';
      CX.fillText(label, btnX + bw2 / 2, btnY + 14);
      CX.textAlign = 'left';
    }
  }

  // ── Destroy ───────────────────────────────────────────────────
  function destroy() {
    ITEMS.forEach(it => { it.found = false; });
  }

  return { init, update, render, destroy };
})();
