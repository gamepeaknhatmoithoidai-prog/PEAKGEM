'use strict';
// ══════════════════════════════════════════════════════════════
//  RỪNG XANH — CHƯƠNG 2  |  game.js  — Engine chính
// ══════════════════════════════════════════════════════════════

const CV = document.getElementById('c');
const CX = CV.getContext('2d');
const W = 900, H = 600;

// ── Design tokens ─────────────────────────────────────────────
const FONT_SANS = '"Be Vietnam Pro","Segoe UI",sans-serif';
const COL = {
  forestGreen: '#2D5A27',
  earthBrown:  '#6B4226',
  parchment:   '#F5F0E8',
  danger:      '#C0392B',
  bg:          '#020C04',
  thuanBlue:   '#88DDFF',
  broiGreen:   '#AAFFAA',
  narration:   '#DDD8B8',
};

// ── roundRect polyfill ────────────────────────────────────────
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r){
    r = Math.min(r, w/2, h/2);
    this.beginPath();
    this.moveTo(x+r, y); this.lineTo(x+w-r, y); this.arcTo(x+w,y, x+w,y+r, r);
    this.lineTo(x+w, y+h-r); this.arcTo(x+w,y+h, x+w-r,y+h, r);
    this.lineTo(x+r, y+h); this.arcTo(x,y+h, x,y+h-r, r);
    this.lineTo(x, y+r); this.arcTo(x,y, x+r,y, r);
    this.closePath(); return this;
  };
}

// ══════════════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════════════
const SAVE_KEY = 'rungxanh_ch2_v1';

const gameState = {
  currentScene: 'scene1',
  completedScenes: [],
  choices: { confrontHung: null, respondThang: null, finalChoice: null, hungResponse: null },
  evidence: { game1_clues: 0, game2_objects: 0, game3_caught: false, game4_photos: [], game6_categorized: false, game7_hungWitness: false },
  playerScore: 0
};

function saveState() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(gameState)); } catch(_) {}
}
function loadState() {
  try {
    const s = localStorage.getItem(SAVE_KEY);
    if (s) Object.assign(gameState, JSON.parse(s));
  } catch(_) {}
}

// ══════════════════════════════════════════════════════════════
//  SCENE MANAGER
// ══════════════════════════════════════════════════════════════
const SCENE_ORDER = [
  'scene1','game1',
  'scene2','game2','scene3','game3','scene4','game4','scene5',
  'scene6','game5','scene7_choice','scene7_thang','scene8_choice',
  'scene9','game6','scene13','game7','scene14_finalchoice','ending'
];

const SCENES = {}; // populated by scene files
let activeScene = null;

function switchScene(id) {
  if (activeScene && activeScene.destroy) activeScene.destroy();
  gameState.currentScene = id;
  saveState();
  const s = SCENES[id];
  if (!s) { showComingSoon(id); return; }
  activeScene = s;
  s.init();
}

function completeScene(id) {
  if (!gameState.completedScenes.includes(id)) gameState.completedScenes.push(id);
  const idx = SCENE_ORDER.indexOf(id);
  const next = SCENE_ORDER[idx + 1];
  saveState();
  if (next) switchScene(next);
  else showEnding();
}

// Coming-soon placeholder for unbuilt scenes
function showComingSoon(id) {
  activeScene = {
    init(){},
    update(){},
    render(){
      CX.fillStyle = '#020C04';
      CX.fillRect(0,0,W,H);
      CX.fillStyle = 'rgba(100,200,80,0.8)';
      CX.font = `bold 22px ${FONT_SANS}`;
      CX.textAlign = 'center';
      CX.fillText('Chương 2 đang được xây dựng...', W/2, H/2 - 30);
      CX.fillStyle = 'rgba(160,220,140,0.5)';
      CX.font = `14px ${FONT_SANS}`;
      CX.fillText(`Scene tiếp theo: ${id}`, W/2, H/2 + 10);
      CX.fillStyle = 'rgba(100,160,100,0.4)';
      CX.fillText('Các scene tiếp theo sẽ được bổ sung sau.', W/2, H/2 + 40);
      CX.textAlign = 'left';
    },
    destroy(){}
  };
  activeScene.init();
}

function showEnding() {
  activeScene = {
    init(){},
    update(){},
    render(){
      CX.fillStyle = '#020C04';
      CX.fillRect(0,0,W,H);
      CX.fillStyle = 'rgba(100,200,80,0.9)';
      CX.font = `bold 26px ${FONT_SANS}`;
      CX.textAlign = 'center';
      CX.fillText('Hết Chương 2', W/2, H/2);
      CX.textAlign = 'left';
    },
    destroy(){}
  };
}

// ══════════════════════════════════════════════════════════════
//  INPUT
// ══════════════════════════════════════════════════════════════
const INPUT = { x: 0, y: 0, _pending: false };

CV.addEventListener('mousemove', e => {
  const r = CV.getBoundingClientRect();
  INPUT.x = (e.clientX - r.left) * (W / r.width);
  INPUT.y = (e.clientY - r.top)  * (H / r.height);
});
CV.addEventListener('click', () => { INPUT._pending = true; });
document.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    INPUT._pending = true;
  }
});

function consumeClick() {
  const v = INPUT._pending;
  INPUT._pending = false;
  return v;
}

// ══════════════════════════════════════════════════════════════
//  FADE
// ══════════════════════════════════════════════════════════════
let fadeAlpha = 1, fadeDir = 0, fadeCB = null;

function fadeOut(cb) { fadeDir = 1; fadeAlpha = 0; fadeCB = cb; }
function fadeIn()    { fadeDir = -1; fadeAlpha = 1; fadeCB = null; }

function updateFade(dt) {
  if (!fadeDir) return;
  const speed = 2.2;
  if (fadeDir > 0) {
    fadeAlpha = Math.min(1, fadeAlpha + dt * speed);
    if (fadeAlpha >= 1 && fadeCB) { fadeCB(); fadeCB = null; fadeIn(); }
  } else {
    fadeAlpha = Math.max(0, fadeAlpha - dt * speed);
    if (fadeAlpha <= 0) fadeDir = 0;
  }
}
function drawFade() {
  if (fadeAlpha <= 0) return;
  CX.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
  CX.fillRect(0, 0, W, H);
}

// ══════════════════════════════════════════════════════════════
//  TEXT UTILITIES
// ══════════════════════════════════════════════════════════════

// Pre-compute word-wrapped lines for a given style (set font on CX first)
function getWrappedLines(text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const t = line + w + ' ';
    if (CX.measureText(t).width > maxW && line) { lines.push(line.trim()); line = w + ' '; }
    else line = t;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

// Draw up to `charCount` characters across pre-wrapped lines
function drawTypewriterLines(lines, x, y, lineH, charCount) {
  let remaining = Math.floor(charCount);
  let cy = y;
  for (const line of lines) {
    if (remaining <= 0) break;
    CX.fillText(line.substring(0, remaining), x, cy);
    remaining -= line.length + 1; // +1 for the space that was trimmed
    cy += lineH;
  }
  return cy;
}

// ══════════════════════════════════════════════════════════════
//  PROGRESS BAR  (4-phase skeleton, drawn over every scene)
// ══════════════════════════════════════════════════════════════
const PHASES = [
  { label: '1. Phát hiện', range: [0,  3]  },
  { label: '2. Điều tra',  range: [4,  8]  },
  { label: '3. Đối mặt',  range: [9,  13] },
  { label: '4. Kết thúc', range: [14, 19] },
];
const BAR_H = 24;
const PHASE_W = W / 4;

function drawProgressBar() {
  const si = SCENE_ORDER.indexOf(gameState.currentScene);

  // Strip background
  CX.fillStyle = 'rgba(0,10,2,0.88)';
  CX.fillRect(0, 0, W, BAR_H);

  PHASES.forEach((ph, pi) => {
    const px = pi * PHASE_W;
    const [s, e] = ph.range;
    const done    = si > e;
    const current = si >= s && si <= e;

    // Phase bg
    CX.fillStyle = done ? 'rgba(45,90,39,0.65)' : current ? 'rgba(28,55,22,0.65)' : 'rgba(8,16,6,0.5)';
    CX.fillRect(px + 1, 0, PHASE_W - 2, BAR_H);

    // Label
    CX.font = `bold 9px ${FONT_SANS}`;
    CX.textAlign = 'left';
    CX.fillStyle = done ? '#6DB55C' : current ? '#C8F0B0' : '#374830';
    CX.fillText(ph.label, px + 6, BAR_H / 2 + 3);

    // Per-scene dots for current phase
    if (current) {
      const total = e - s + 1;
      for (let i = 0; i < total; i++) {
        const dx = px + PHASE_W - 12 - (total - 1 - i) * 11;
        CX.beginPath();
        CX.arc(dx, BAR_H / 2, 3, 0, Math.PI * 2);
        CX.fillStyle = i < si - s ? '#6DB55C' : i === si - s ? '#B0EE90' : '#2A3E24';
        CX.fill();
      }
    } else if (done) {
      // Checkmark
      CX.strokeStyle = '#6DB55C'; CX.lineWidth = 1.8; CX.lineCap = 'round';
      const cx2 = px + PHASE_W - 10;
      CX.beginPath();
      CX.moveTo(cx2 - 5, BAR_H / 2);
      CX.lineTo(cx2 - 2, BAR_H / 2 + 4);
      CX.lineTo(cx2 + 5, BAR_H / 2 - 4);
      CX.stroke();
    }

    // Divider
    if (pi < 3) {
      CX.strokeStyle = 'rgba(50,90,40,0.55)'; CX.lineWidth = 1;
      CX.beginPath(); CX.moveTo(px + PHASE_W, 0); CX.lineTo(px + PHASE_W, BAR_H); CX.stroke();
    }
  });

  // Bottom border
  CX.strokeStyle = 'rgba(45,80,38,0.7)'; CX.lineWidth = 1;
  CX.beginPath(); CX.moveTo(0, BAR_H); CX.lineTo(W, BAR_H); CX.stroke();
  CX.textAlign = 'left';
}

// ══════════════════════════════════════════════════════════════
//  SHARED CHARACTER DRAWING
//  Origin (x,y) = foot-level centre of character
// ══════════════════════════════════════════════════════════════

function drawThuanChar(x, y, sc = 1, flipX = false, walkPhase = 0) {
  CX.save();
  CX.translate(x, y);
  CX.scale(flipX ? -sc : sc, sc);

  const bob  = Math.abs(Math.sin(walkPhase)) * 3;
  const legL = Math.sin(walkPhase) * 15;
  const legR = -legL;
  const armL = -legL * 0.6;
  const armR = -legR * 0.6;

  // Shadow
  CX.fillStyle = 'rgba(0,0,0,0.22)';
  CX.beginPath(); CX.ellipse(0, 2, 17, 5, 0, 0, Math.PI * 2); CX.fill();

  // --- Backpack (behind body) ---
  CX.fillStyle = '#3A4A18';
  CX.beginPath(); CX.roundRect(-24, -72 + bob, 13, 40, 4); CX.fill();

  // --- Legs ---
  const legGrad = CX.createLinearGradient(0, -35, 0, 2);
  legGrad.addColorStop(0, '#4A3020'); legGrad.addColorStop(1, '#2A1800');
  CX.fillStyle = legGrad;

  CX.save();
  CX.translate(-7, -34 + bob); CX.rotate(legL * Math.PI / 180);
  CX.beginPath(); CX.roundRect(-4, 0, 9, 38, 4); CX.fill();
  CX.fillStyle = '#1E1008'; CX.beginPath(); CX.roundRect(-5, 34, 11, 9, 3); CX.fill();
  CX.restore();

  CX.save();
  CX.translate(7, -34 + bob); CX.rotate(legR * Math.PI / 180);
  CX.fillStyle = legGrad;
  CX.beginPath(); CX.roundRect(-4, 0, 9, 38, 4); CX.fill();
  CX.fillStyle = '#1E1008'; CX.beginPath(); CX.roundRect(-5, 34, 11, 9, 3); CX.fill();
  CX.restore();

  // --- Body (vest) ---
  const vestGrad = CX.createLinearGradient(-14, -72, 14, -34);
  vestGrad.addColorStop(0, '#506624'); vestGrad.addColorStop(1, '#304010');
  CX.fillStyle = vestGrad;
  CX.beginPath(); CX.roundRect(-14, -72 + bob, 28, 40, 6); CX.fill();

  // Shirt (middle strip)
  CX.fillStyle = '#5A88B8';
  CX.beginPath(); CX.roundRect(-6, -68 + bob, 12, 34, 3); CX.fill();

  // Belt
  CX.fillStyle = '#2E1A0A'; CX.fillRect(-14, -35 + bob, 28, 5);
  CX.fillStyle = '#C09040';
  CX.beginPath(); CX.arc(0, -32.5 + bob, 4.5, 0, Math.PI * 2); CX.fill();

  // --- Arms ---
  const armGrad = CX.createLinearGradient(0, 0, 0, 26);
  armGrad.addColorStop(0, '#506624'); armGrad.addColorStop(1, '#304010');

  CX.save();
  CX.translate(-18, -64 + bob); CX.rotate(armL * Math.PI / 180);
  CX.fillStyle = armGrad; CX.beginPath(); CX.roundRect(-4, 0, 8, 26, 4); CX.fill();
  CX.fillStyle = '#EDAA78'; CX.beginPath(); CX.arc(0, 28, 6, 0, Math.PI * 2); CX.fill();
  CX.restore();

  CX.save();
  CX.translate(18, -64 + bob); CX.rotate(armR * Math.PI / 180);
  CX.fillStyle = armGrad; CX.beginPath(); CX.roundRect(-4, 0, 8, 26, 4); CX.fill();
  CX.fillStyle = '#EDAA78'; CX.beginPath(); CX.arc(0, 28, 6, 0, Math.PI * 2); CX.fill();
  CX.restore();

  // --- Neck ---
  CX.fillStyle = '#EDAA78'; CX.beginPath(); CX.roundRect(-5, -77 + bob, 10, 8, 3); CX.fill();

  // --- Head ---
  const headY = -92 + bob;
  const hg = CX.createRadialGradient(-2, headY - 2, 3, 0, headY, 19);
  hg.addColorStop(0, '#FFCAA0'); hg.addColorStop(1, '#E09870');
  CX.fillStyle = hg; CX.beginPath(); CX.arc(0, headY, 19, 0, Math.PI * 2); CX.fill();

  // Hair (dark top half)
  CX.fillStyle = '#180600';
  CX.beginPath(); CX.arc(0, headY, 19, Math.PI, 0); CX.fill();
  CX.beginPath(); CX.arc(0, headY, 19, Math.PI * 1.08, Math.PI * 1.92); CX.fill();

  // Glasses
  CX.strokeStyle = '#333388'; CX.lineWidth = 2.2;
  CX.beginPath(); CX.roundRect(-13, headY - 8, 10, 7, 3); CX.stroke();
  CX.beginPath(); CX.roundRect(3,  headY - 8, 10, 7, 3); CX.stroke();
  CX.beginPath(); CX.moveTo(-3, headY - 4); CX.lineTo(3, headY - 4); CX.stroke();
  CX.fillStyle = 'rgba(160,210,255,0.18)';
  CX.beginPath(); CX.roundRect(-13, headY - 8, 10, 7, 3); CX.fill();
  CX.beginPath(); CX.roundRect(3,  headY - 8, 10, 7, 3); CX.fill();

  // Eyes
  CX.fillStyle = '#1A0800';
  CX.beginPath(); CX.arc(-7, headY - 3, 3,   0, Math.PI * 2); CX.fill();
  CX.beginPath(); CX.arc( 7, headY - 3, 3,   0, Math.PI * 2); CX.fill();
  CX.fillStyle = '#fff';
  CX.beginPath(); CX.arc(-6, headY - 4, 1.1, 0, Math.PI * 2); CX.fill();
  CX.beginPath(); CX.arc( 8, headY - 4, 1.1, 0, Math.PI * 2); CX.fill();

  // Mouth
  CX.strokeStyle = '#C07060'; CX.lineWidth = 1.8; CX.lineCap = 'round';
  CX.beginPath(); CX.arc(0, headY + 7, 5, 0.3, Math.PI - 0.3); CX.stroke();

  CX.restore();
}

function drawKBroiChar(x, y, sc = 1, flipX = false, walkPhase = 0) {
  CX.save();
  CX.translate(x, y);
  CX.scale(flipX ? -sc : sc, sc);

  const bob  = Math.abs(Math.sin(walkPhase)) * 3;
  const legL = Math.sin(walkPhase) * 14;
  const legR = -legL;
  const armL = -legL * 0.6;
  const armR = -legR * 0.6;

  // Shadow
  CX.fillStyle = 'rgba(0,0,0,0.22)';
  CX.beginPath(); CX.ellipse(0, 2, 17, 5, 0, 0, Math.PI * 2); CX.fill();

  // --- Legs (traditional woven pattern) ---
  CX.fillStyle = '#2A2010';
  CX.save(); CX.translate(-7, -34 + bob); CX.rotate(legL * Math.PI / 180);
  CX.beginPath(); CX.roundRect(-4, 0, 9, 38, 3); CX.fill();
  // Woven checkers
  for (let i=0; i<4; i++) for (let j=0; j<4; j++) {
    CX.fillStyle = (i+j)%2 ? '#282018':'#484030';
    CX.fillRect(-4+i*4, 6+j*4, 4, 4);
  }
  // Fringe
  for (let i=-4; i<=4; i+=2) { CX.fillStyle='#9A7040'; CX.fillRect(i,35,2,8); }
  CX.restore();

  CX.save(); CX.translate(7, -34 + bob); CX.rotate(legR * Math.PI / 180);
  CX.fillStyle = '#2A2010'; CX.beginPath(); CX.roundRect(-4, 0, 9, 38, 3); CX.fill();
  for (let i=0; i<4; i++) for (let j=0; j<4; j++) {
    CX.fillStyle = (i+j)%2 ? '#282018':'#484030';
    CX.fillRect(-4+i*4, 6+j*4, 4, 4);
  }
  for (let i=-4; i<=4; i+=2) { CX.fillStyle='#9A7040'; CX.fillRect(i,35,2,8); }
  CX.restore();

  // --- Body (traditional cloth) ---
  const bodyGrad = CX.createLinearGradient(-14,-72,14,-34);
  bodyGrad.addColorStop(0,'#F0E0B0'); bodyGrad.addColorStop(1,'#C8B880');
  CX.fillStyle = bodyGrad;
  CX.beginPath(); CX.roundRect(-14, -72+bob, 28, 40, 6); CX.fill();

  // Red horizontal stripes
  CX.fillStyle = '#CC1800';
  CX.fillRect(-14, -62+bob, 28, 4);
  CX.fillRect(-14, -50+bob, 28, 4);

  // Blue chevrons
  CX.fillStyle = '#3366AA';
  for (let i=-10; i<12; i+=7) {
    CX.beginPath();
    CX.moveTo(i, -58+bob); CX.lineTo(i+3.5, -53+bob); CX.lineTo(i+7, -58+bob);
    CX.fill();
  }

  // Belt fringe
  for (let i=-10; i<=8; i+=4) {
    CX.fillStyle='#D4C090'; CX.fillRect(i, -34+bob, 2, 8);
  }

  // --- Arms ---
  CX.fillStyle = '#C88040';
  CX.save(); CX.translate(-18,-62+bob); CX.rotate(armL*Math.PI/180);
  CX.beginPath(); CX.roundRect(-4,0,8,26,4); CX.fill();
  CX.beginPath(); CX.arc(0,28,6,0,Math.PI*2); CX.fill();
  CX.restore();

  CX.save(); CX.translate(18,-62+bob); CX.rotate(armR*Math.PI/180);
  CX.fillStyle='#C88040'; CX.beginPath(); CX.roundRect(-4,0,8,26,4); CX.fill();
  CX.beginPath(); CX.arc(0,28,6,0,Math.PI*2); CX.fill();
  CX.restore();

  // --- Neck ---
  CX.fillStyle='#C88040'; CX.beginPath(); CX.roundRect(-5,-77+bob,10,8,3); CX.fill();

  // --- Head ---
  const headY = -93 + bob;
  const hg = CX.createRadialGradient(-2, headY-2, 3, 0, headY, 20);
  hg.addColorStop(0,'#DA9045'); hg.addColorStop(1,'#B06820');
  CX.fillStyle = hg; CX.beginPath(); CX.arc(0,headY,20,0,Math.PI*2); CX.fill();

  // Hair (dark lower half)
  CX.fillStyle='#140500';
  CX.beginPath(); CX.arc(0,headY,20,Math.PI,0); CX.fill();

  // Red headband
  CX.fillStyle='#CC1800'; CX.beginPath(); CX.roundRect(-20,headY-12,40,11,4); CX.fill();
  CX.fillStyle='#EE2200'; CX.beginPath(); CX.roundRect(-18,headY-11,36,9,3); CX.fill();
  // Side flap
  CX.fillStyle='#CC1800'; CX.fillRect(20,headY-11,6,22);
  // Headband stitching
  CX.strokeStyle='#8B5020'; CX.lineWidth=1.5; CX.lineCap='round';
  CX.beginPath(); CX.moveTo(-10,headY-11); CX.lineTo(-4,headY-8); CX.stroke();
  CX.beginPath(); CX.moveTo(10,headY-11); CX.lineTo(4,headY-8); CX.stroke();

  // Eyes
  CX.fillStyle='#1A0800';
  CX.beginPath(); CX.arc(-7,headY-2,3.5,0,Math.PI*2); CX.fill();
  CX.beginPath(); CX.arc( 7,headY-2,3.5,0,Math.PI*2); CX.fill();
  CX.fillStyle='#fff';
  CX.beginPath(); CX.arc(-6,headY-3,1.2,0,Math.PI*2); CX.fill();
  CX.beginPath(); CX.arc( 8,headY-3,1.2,0,Math.PI*2); CX.fill();

  // Mouth (neutral/serious)
  CX.strokeStyle='#8B4820'; CX.lineWidth=2; CX.lineCap='round';
  CX.beginPath(); CX.moveTo(-5,headY+8); CX.lineTo(5,headY+8); CX.stroke();

  CX.restore();
}

// ══════════════════════════════════════════════════════════════
//  MAIN LOOP
// ══════════════════════════════════════════════════════════════
let lastTS = 0;
function loop(ts) {
  const dt = Math.min((ts - lastTS) / 1000, 0.05);
  lastTS = ts;

  CX.clearRect(0, 0, W, H);

  if (activeScene) {
    activeScene.update(dt);
    activeScene.render();
  }

  drawProgressBar();
  updateFade(dt);
  drawFade();

  requestAnimationFrame(loop);
}

// ── Boot ─────────────────────────────────────────────────────
window.addEventListener('load', () => {
  loadState();
  requestAnimationFrame(ts => {
    lastTS = ts;
    requestAnimationFrame(loop);
  });
  // Start with fade-in into the current scene
  fadeOut(() => switchScene(gameState.currentScene));
});
