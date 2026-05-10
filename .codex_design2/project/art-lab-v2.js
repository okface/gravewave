/* =====================================================================
   GRAVEWAVE — INK & VELLUM v2
   Single-direction art lab with proper particle systems and motion.
   Every spell maintains its own particle pool driven by elapsed time.
   ===================================================================== */

const TAU = Math.PI * 2;
const PAL = {
  paper:    '#e8dcc0',
  paper2:   '#ddcfae',
  paper3:   '#c8b88c',
  ink:      '#1a1612',
  inkSoft:  '#3a322a',
  inkMid:   '#6a604f',
  inkDim:   '#8a7e68',
  red:      '#a83a2c',
  redDeep:  '#7a2820',
  redLight: '#d8624c',
  blue:     '#2c4a8c',
  blueLight:'#4c6cac',
  gold:     '#c8941a',
  goldLight:'#e8b840',
  green:    '#5a7a3c',
};

/* HiDPI canvas */
function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width  = Math.max(1, Math.floor(rect.width  * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: rect.width, h: rect.height, dpr };
}

/* =====================================================================
   PRIMITIVES
   ===================================================================== */
function drawStar(ctx, cx, cy, outer, inner, points, rot = -Math.PI/2) {
  ctx.beginPath();
  for (let i = 0; i < points*2; i++) {
    const r = i%2 === 0 ? outer : inner;
    const a = (i/(points*2))*TAU + rot;
    const x = cx + Math.cos(a)*r, y = cy + Math.sin(a)*r;
    if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.closePath();
}

function hatch(ctx, cx, cy, w, h, spacing, angle, color, lineW = 0.5) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineW;
  const len = Math.hypot(w,h)*1.2;
  for (let i = -len; i <= len; i += spacing) {
    ctx.beginPath();
    ctx.moveTo(i,-len); ctx.lineTo(i,len);
    ctx.stroke();
  }
  ctx.restore();
}

/* Paper background — speckled vellum + faint hatching at corners */
function drawPaper(ctx, w, h, t, opts = {}) {
  const seed = opts.seed || 0;
  ctx.fillStyle = PAL.paper;
  ctx.fillRect(0,0,w,h);
  // Speckles (deterministic)
  for (let i = 0; i < Math.floor(w*h/220); i++) {
    const x = ((i*7919 + seed*131) % 9973) / 9973 * w;
    const y = ((i*6151 + seed*317) % 8807) / 8807 * h;
    const a = 0.04 + ((i%7)*0.012);
    ctx.fillStyle = `rgba(60,40,20,${a})`;
    ctx.fillRect(x|0, y|0, 1, 1);
  }
  // Vignette
  const vg = ctx.createRadialGradient(w/2,h/2,0, w/2,h/2,Math.max(w,h)*0.7);
  vg.addColorStop(0,'rgba(0,0,0,0)');
  vg.addColorStop(1,'rgba(80,40,10,0.18)');
  ctx.fillStyle = vg;
  ctx.fillRect(0,0,w,h);
}

/* =====================================================================
   PARTICLE SYSTEM
   Pools per canvas, keyed by canvas id.
   ===================================================================== */
const particlePools = new Map();
function getPool(key) {
  if (!particlePools.has(key)) particlePools.set(key, []);
  return particlePools.get(key);
}
function tickPool(pool, dt) {
  for (let i = pool.length - 1; i >= 0; i--) {
    const p = pool[i];
    p.life -= dt;
    if (p.life <= 0) { pool.splice(i,1); continue; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.gravity) p.vy += p.gravity * dt;
    if (p.drag)    { p.vx *= Math.pow(p.drag, dt*60); p.vy *= Math.pow(p.drag, dt*60); }
    p.age = (p.age||0) + dt;
  }
}

/* =====================================================================
   PLAYER (MAGICIAN)
   ===================================================================== */
function drawMagician(ctx, x, y, t, state /* idle | cast | hit */) {
  const bob = Math.sin(t*1.5)*1.5;
  const cx = x, cy = y + bob;
  const cast = state === 'cast';
  const hit = state === 'hit';
  const blink = hit && Math.floor(t*12)%2===0;

  // Cast sigil ring (the "cast flash" replacement)
  if (cast) {
    const phase = (t*1.6)%1;
    const a = Math.max(0, 1 - phase);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = `rgba(168,58,44,${a*0.85})`;
    ctx.lineWidth = 1.4;
    const r = 32 + phase*14;
    ctx.beginPath(); ctx.arc(0,0,r,0,TAU); ctx.stroke();
    ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.arc(0,0,r+5,0,TAU); ctx.stroke();
    ctx.setLineDash([]);
    // 6 small star marks rotating
    ctx.fillStyle = `rgba(168,58,44,${a})`;
    for (let i = 0; i < 6; i++) {
      const ang = i/6*TAU + t*0.8;
      drawStar(ctx, Math.cos(ang)*(r+10), Math.sin(ang)*(r+10), 2.4, 1.0, 5);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.translate(cx, cy);

  // Shadow as hatch pad
  ctx.save();
  ctx.translate(0, 22);
  ctx.scale(1, 0.32);
  hatch(ctx, 0, 0, 30, 12, 1.4, 0, 'rgba(26,22,18,0.55)', 0.5);
  ctx.restore();

  // Robe silhouette
  const robeFill = blink ? PAL.paper2 : PAL.ink;
  ctx.fillStyle = robeFill;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.bezierCurveTo(-22, -4, -22, 22, 0, 22);
  ctx.bezierCurveTo(22, 22, 22, -4, 0, -10);
  ctx.fill();

  // Hatching shadow side (right) for volume
  if (!blink) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.bezierCurveTo(22, -4, 22, 22, 0, 22);
    ctx.lineTo(0, -10);
    ctx.clip();
    hatch(ctx, 6, 4, 30, 30, 2, Math.PI/3.4, 'rgba(232,220,192,0.16)', 0.5);
    ctx.restore();
  }

  // Robe outline + crisp hem
  ctx.strokeStyle = PAL.ink;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.bezierCurveTo(-22, -4, -22, 22, 0, 22);
  ctx.bezierCurveTo(22, 22, 22, -4, 0, -10);
  ctx.stroke();

  // Vermilion trim along hem
  ctx.strokeStyle = PAL.red;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-19, 14);
  ctx.bezierCurveTo(-10, 23, 10, 23, 19, 14);
  ctx.stroke();

  // Head — pale paper disc
  ctx.fillStyle = PAL.paper;
  ctx.beginPath(); ctx.arc(0, -16, 7.5, 0, TAU); ctx.fill();
  ctx.strokeStyle = PAL.ink;
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(0, -16, 7.5, 0, TAU); ctx.stroke();

  // Hat — sharp triangular ink + brim
  ctx.fillStyle = PAL.ink;
  ctx.beginPath();
  ctx.moveTo(-11, -22); ctx.lineTo(0, -44); ctx.lineTo(11, -22);
  ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, -22, 14, 3, 0, 0, TAU); ctx.fill();

  // Hat star — vermilion when casting, gold otherwise
  ctx.fillStyle = cast ? PAL.red : PAL.gold;
  drawStar(ctx, 0, -34, 3.5, 1.6, 5);
  ctx.fill();
  ctx.strokeStyle = PAL.ink;
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // Staff
  ctx.strokeStyle = PAL.ink;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(15, -10); ctx.lineTo(20, 24); ctx.stroke();

  // Orb — vermilion with gleam, scales when casting
  const orbR = cast ? 5 + Math.sin(t*8)*0.8 : 4.5;
  ctx.fillStyle = PAL.red;
  ctx.beginPath(); ctx.arc(15, -16, orbR, 0, TAU); ctx.fill();
  ctx.strokeStyle = PAL.ink;
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.fillStyle = PAL.gold;
  ctx.beginPath(); ctx.arc(13.5, -17, 1.4, 0, TAU); ctx.fill();

  ctx.restore();
}

/* Reusable hit impact splash — call when an enemy is in 'hit' state.
   Returns true if it drew something (so caller can chain effects).
   Phase is 0..1 over a short window; caller computes their own. */
function drawHitImpact(ctx, x, y, phase, opts={}) {
  if (phase <= 0 || phase >= 1) return false;
  const a = 1 - phase;
  const r0 = opts.r0 ?? 6;
  const r1 = opts.r1 ?? 18;
  const color = opts.color || 'rgba(168,58,44,';
  // Expanding ring
  ctx.strokeStyle = `${color}${a})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(x, y, r0 + phase*(r1-r0), 0, TAU); ctx.stroke();
  // Inner ink ring
  ctx.strokeStyle = `rgba(26,22,18,${a*0.55})`;
  ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.arc(x, y, (r0-2) + phase*(r1-r0)*0.7, 0, TAU); ctx.stroke();
  // Spark rays
  const rays = opts.rays ?? 7;
  for (let i = 0; i < rays; i++) {
    const ang = i/rays*TAU + phase*0.4 + (opts.angOff||0);
    const ra = r0 + phase*4;
    const rb = r1*0.85 + phase*4;
    ctx.strokeStyle = `rgba(200,148,26,${a*0.95})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(ang)*ra, y + Math.sin(ang)*ra);
    ctx.lineTo(x + Math.cos(ang)*rb, y + Math.sin(ang)*rb);
    ctx.stroke();
  }
  // Damage number
  if (opts.dmg) {
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillStyle = `rgba(168,58,44,${a})`;
    ctx.textAlign = 'center';
    ctx.fillText(opts.dmg, x, y - 14 - phase*12);
    ctx.textAlign = 'start';
  }
  return true;
}

/* =====================================================================
   ENEMIES
   Each takes (ctx, x, y, t, state) where state is idle | walk | hit
   ===================================================================== */

// Soft hit pulse: subtle alpha dip, ~2hz
function hitPulse(t, state) {
  if (state !== 'hit') return 1;
  return 0.82 + 0.18 * (0.5 + 0.5*Math.sin(t*5));
}

function drawShade(ctx, x, y, t, state, radius = 14) {
  const r = radius;
  const pulse = hitPulse(t, state);
  const driftY = Math.sin(t*1.6)*1.2;
  const lean = state === 'walk' ? Math.sin(t*4)*0.06 : 0;
  ctx.save();
  ctx.translate(x, y + driftY);
  ctx.rotate(lean);

  // Hatch shadow
  ctx.save();
  ctx.translate(0, r*0.95);
  ctx.scale(1, 0.3);
  hatch(ctx, 0, 0, r*1.6, r*0.6, 1.4, 0, 'rgba(26,22,18,0.45)', 0.4);
  ctx.restore();

  // Body silhouette
  ctx.globalAlpha = pulse;
  ctx.fillStyle = PAL.ink;
  ctx.beginPath();
  ctx.moveTo(0, -r*1.2);
  ctx.quadraticCurveTo(-r*0.95, -r*0.4, -r*0.7, r);
  ctx.quadraticCurveTo(0, r*1.05, r*0.7, r);
  ctx.quadraticCurveTo(r*0.95, -r*0.4, 0, -r*1.2);
  ctx.fill();
  ctx.globalAlpha = 1;

  {
    // Inner hatch
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, -r*1.2);
    ctx.quadraticCurveTo(-r*0.95, -r*0.4, -r*0.7, r);
    ctx.quadraticCurveTo(0, r*1.05, r*0.7, r);
    ctx.quadraticCurveTo(r*0.95, -r*0.4, 0, -r*1.2);
    ctx.clip();
    hatch(ctx, 0, 0, r*2, r*2, 1.6, Math.PI/4, 'rgba(232,220,192,0.18)', 0.4);
    ctx.restore();
  }

  // Hem outline accent
  ctx.strokeStyle = PAL.red;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-r*0.7, r);
  ctx.quadraticCurveTo(0, r*1.05, r*0.7, r);
  ctx.stroke();

  // Eyes — pale pinpricks
  ctx.fillStyle = PAL.paper;
  ctx.beginPath(); ctx.arc(-3, -r*0.4, 1.4, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(3, -r*0.4, 1.4, 0, TAU); ctx.fill();
  // Pupils
  ctx.fillStyle = PAL.ink;
  ctx.beginPath(); ctx.arc(-3, -r*0.4, 0.6, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(3, -r*0.4, 0.6, 0, TAU); ctx.fill();

  ctx.restore();
}

function drawHusk(ctx, x, y, t, state, radius = 18) {
  const r = radius;
  const pulse = hitPulse(t, state);
  const breathe = 1 + Math.sin(t*1.2)*0.02;
  const crack = state === 'hit' ? Math.min(1, ((t*2)%1)*1.2) : 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(breathe, breathe);

  // Shadow
  ctx.save();
  ctx.translate(0, r*0.95);
  ctx.scale(1, 0.3);
  hatch(ctx, 0, 0, r*2, r*0.7, 1.6, 0, 'rgba(26,22,18,0.45)', 0.4);
  ctx.restore();

  // Hex body
  ctx.globalAlpha = pulse;
  ctx.fillStyle = PAL.paper;
  ctx.strokeStyle = PAL.ink;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = i/6*TAU;
    const px = Math.cos(a)*r, py = Math.sin(a)*r;
    if (i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.globalAlpha = 1;

  // Inner hex
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = i/6*TAU;
    const px = Math.cos(a)*r*0.6, py = Math.sin(a)*r*0.6;
    if (i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  ctx.closePath(); ctx.stroke();

  // Hatch fill on outer ring
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = i/6*TAU;
    if (i===0) ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r);
    else ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
  }
  ctx.closePath();
  ctx.clip();
  hatch(ctx, 0, 0, r*2, r*2, 2.2, Math.PI/3, 'rgba(26,22,18,0.45)', 0.45);
  ctx.restore();

  // Cracks (always faint, vermilion when struck)
  const crackAlpha = state === 'hit' ? 0.55 : 0.35;
  ctx.strokeStyle = `rgba(168,58,44,${crackAlpha})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-r*0.55, -r*0.25); ctx.lineTo(0, 0); ctx.lineTo(r*0.4, r*0.5);
  ctx.moveTo(0, 0); ctx.lineTo(-r*0.2, r*0.6);
  ctx.stroke();

  // Core dot
  ctx.fillStyle = PAL.red;
  ctx.beginPath(); ctx.arc(0,0,r*0.16,0,TAU); ctx.fill();
  ctx.strokeStyle = PAL.ink; ctx.lineWidth = 0.8;
  ctx.stroke();

  ctx.restore();
}

function drawWisp(ctx, x, y, t, state, radius = 11) {
  const r = radius;
  const pulse = hitPulse(t, state);
  // Erratic dart
  const dx = state === 'walk' ? Math.sin(t*4.2)*4 : Math.sin(t*1.4)*1;
  const dy = state === 'walk' ? Math.cos(t*5.1)*3 : Math.cos(t*1.6)*1;
  ctx.save();
  ctx.translate(x + dx, y + dy);

  // Shadow
  ctx.fillStyle = 'rgba(26,22,18,0.35)';
  ctx.beginPath(); ctx.ellipse(0, r*1.1, r*0.6, r*0.18, 0, 0, TAU); ctx.fill();

  // Concentric ink halos
  ctx.globalAlpha = pulse;
  const baseColor = PAL.ink;
  ctx.strokeStyle = baseColor;
  ctx.lineWidth = 0.8;
  for (let k = 1; k <= 3; k++) {
    const f = 1 + k*0.4;
    ctx.beginPath();
    ctx.moveTo(0, -r*f); ctx.lineTo(r*0.7*f, 0);
    ctx.lineTo(0, r*f); ctx.lineTo(-r*0.7*f, 0);
    ctx.closePath();
    ctx.stroke();
  }
  // Core diamond
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.moveTo(0,-r); ctx.lineTo(r*0.7,0); ctx.lineTo(0,r); ctx.lineTo(-r*0.7,0);
  ctx.closePath(); ctx.fill();
  // Gold center
  ctx.fillStyle = PAL.gold;
  ctx.beginPath(); ctx.arc(0,0,r*0.28,0,TAU); ctx.fill();
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawSwarmling(ctx, x, y, t, state, radius = 8) {
  const r = radius;
  const pulse = hitPulse(t, state);
  const scuttle = state === 'walk' ? Math.sin(t*9 + x*0.05)*1.3 : 0;
  ctx.save();
  ctx.translate(x, y + scuttle);

  // Shadow
  ctx.fillStyle = 'rgba(26,22,18,0.4)';
  ctx.beginPath(); ctx.ellipse(0, r*1.1, r*0.7, r*0.2, 0, 0, TAU); ctx.fill();

  // Triangle body
  ctx.globalAlpha = pulse;
  ctx.fillStyle = PAL.ink;
  ctx.beginPath();
  ctx.moveTo(0,-r*1.1); ctx.lineTo(r*0.85, r*0.7); ctx.lineTo(-r*0.85, r*0.7);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = PAL.ink; ctx.lineWidth = 0.8;
  ctx.stroke();
  // Eye
  ctx.fillStyle = PAL.red;
  ctx.beginPath(); ctx.arc(0, -r*0.2, 1, 0, TAU); ctx.fill();
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawBulwark(ctx, x, y, t, state, radius = 22) {
  const r = radius;
  const pulse = hitPulse(t, state);
  const recoil = state === 'hit' ? Math.sin(t*5)*0.8 : 0;
  ctx.save();
  ctx.translate(x + recoil, y);

  // Shadow
  ctx.save();
  ctx.translate(0, r*0.95);
  ctx.scale(1, 0.3);
  hatch(ctx, 0,0, r*2, r*0.7, 1.6, 0, 'rgba(26,22,18,0.5)', 0.4);
  ctx.restore();

  // Octagonal shield
  ctx.globalAlpha = pulse;
  ctx.fillStyle = PAL.paper;
  ctx.strokeStyle = PAL.ink;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = i/8*TAU + Math.PI/8;
    const px = Math.cos(a)*r, py = Math.sin(a)*r;
    if (i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.globalAlpha = 1;

  // Quartered cross
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0,-r*1.1); ctx.lineTo(0,r*1.1);
  ctx.moveTo(-r*1.1,0); ctx.lineTo(r*1.1,0);
  ctx.stroke();

  // Hatch alternating quadrants (top-right, bottom-left)
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = i/8*TAU + Math.PI/8;
    if (i===0) ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r);
    else ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
  }
  ctx.closePath();
  ctx.clip();
  ctx.beginPath();
  ctx.rect(0, -r*1.2, r*1.2, r*1.2);
  ctx.rect(-r*1.2, 0, r*1.2, r*1.2);
  ctx.clip();
  hatch(ctx, 0,0, r*2, r*2, 2.2, Math.PI/3.5, 'rgba(26,22,18,0.5)', 0.5);
  ctx.restore();

  // Center vermilion boss
  ctx.fillStyle = PAL.red;
  ctx.strokeStyle = PAL.ink;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0,0,r*0.22,0,TAU); ctx.fill(); ctx.stroke();
  // Boss star
  ctx.fillStyle = PAL.gold;
  drawStar(ctx, 0, 0, r*0.16, r*0.07, 5);
  ctx.fill();

  ctx.restore();
}

function drawGoliath(ctx, x, y, t, state, radius = 32) {
  const r = radius;
  const pulse = hitPulse(t, state);
  const breathe = 1 + Math.sin(t*1.2)*0.04;
  const arrival = state === 'walk' ? (1 - Math.min(1, ((t*0.6)%2)/0.4)) : 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(breathe, breathe);

  // Halo rays
  ctx.strokeStyle = PAL.ink; ctx.lineWidth = 1;
  for (let i = 0; i < 24; i++) {
    const a = i/24*TAU + t*0.1;
    const inner = r*1.18, outer = r*1.45 + (i%2 ? -3 : 0);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a)*inner, Math.sin(a)*inner);
    ctx.lineTo(Math.cos(a)*outer, Math.sin(a)*outer);
    ctx.stroke();
  }

  // Arrival shockwave ring
  if (arrival > 0) {
    ctx.strokeStyle = `rgba(168,58,44,${arrival})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0,0, r*1.6 + (1-arrival)*40, 0, TAU); ctx.stroke();
  }

  // Outer 9-point star
  ctx.globalAlpha = pulse;
  ctx.fillStyle = PAL.ink;
  drawStar(ctx, 0,0, r, r*0.55, 9);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Inner pale star
  ctx.fillStyle = PAL.paper;
  drawStar(ctx, 0,0, r*0.65, r*0.36, 9);
  ctx.fill();
  ctx.strokeStyle = PAL.ink;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Hatch the outer ring
  ctx.save();
  drawStar(ctx, 0,0, r, r*0.55, 9);
  ctx.clip();
  drawStar(ctx, 0,0, r*0.65, r*0.36, 9);
  ctx.clip('evenodd');
  hatch(ctx, 0,0, r*2.2, r*2.2, 2, Math.PI/4, 'rgba(232,220,192,0.32)', 0.4);
  ctx.restore();

  // Eye — vermilion + ink pupil
  ctx.fillStyle = PAL.red;
  ctx.beginPath(); ctx.arc(0,0, r*0.2, 0, TAU); ctx.fill();
  ctx.fillStyle = PAL.ink;
  ctx.beginPath();
  ctx.ellipse(Math.sin(t*0.6)*r*0.06, 0, r*0.08, r*0.05, 0, 0, TAU);
  ctx.fill();

  ctx.restore();
}

const enemyDraw = {
  shade: drawShade, husk: drawHusk, wisp: drawWisp,
  swarmling: drawSwarmling, bulwark: drawBulwark, goliath: drawGoliath,
};

/* HP bar in ink style */
function drawHpBar(ctx, x, y, w, hp, maxHp) {
  const ratio = hp/maxHp;
  ctx.fillStyle = PAL.paper;
  ctx.fillRect(x, y, w, 3);
  ctx.fillStyle = PAL.red;
  ctx.fillRect(x, y, w*ratio, 3);
  ctx.strokeStyle = PAL.ink; ctx.lineWidth = 0.8;
  ctx.strokeRect(x, y, w, 3);
}

/* Status FX — animated effects on the body itself, not just rings */
function drawStatusRunes(ctx, cx, cy, r, statuses, t) {
  if (!statuses) return;
  let ringR = r + 5;
  for (const s of statuses) {
    ctx.save();
    ctx.translate(cx, cy);
    if (s === 'slow') {
      // Frost crust — crystal points hugging the silhouette + slow snowflakes drifting down
      ctx.strokeStyle = PAL.blue; ctx.lineWidth = 1.2;
      const points = 8;
      for (let i = 0; i < points; i++) {
        const a = i/points*TAU + t*0.25;
        const len = 4 + Math.sin(t*1.5 + i*1.3)*1.5;
        const ix = Math.cos(a)*ringR, iy = Math.sin(a)*ringR;
        // Diamond point
        ctx.fillStyle = PAL.blue;
        ctx.beginPath();
        ctx.moveTo(ix, iy);
        ctx.lineTo(ix + Math.cos(a)*len, iy + Math.sin(a)*len);
        ctx.lineTo(ix + Math.cos(a+0.3)*len*0.4, iy + Math.sin(a+0.3)*len*0.4);
        ctx.closePath();
        ctx.fill();
      }
      // Drifting snowflakes (3, falling slowly, looping)
      for (let i = 0; i < 3; i++) {
        const phase = ((t*0.5 + i*0.33) % 1);
        const fx = (i-1) * ringR*0.55 + Math.sin(t + i*2)*1.5;
        const fy = -ringR*1.1 + phase * ringR*2.4;
        const a = phase < 0.15 ? phase/0.15 : phase > 0.85 ? (1-phase)/0.15 : 1;
        ctx.strokeStyle = `rgba(44,74,140,${a*0.9})`;
        ctx.lineWidth = 0.9;
        for (let k = 0; k < 3; k++) {
          const ang = k/3*Math.PI;
          ctx.beginPath();
          ctx.moveTo(fx + Math.cos(ang)*-2, fy + Math.sin(ang)*-2);
          ctx.lineTo(fx + Math.cos(ang)*2, fy + Math.sin(ang)*2);
          ctx.stroke();
        }
      }
    } else if (s === 'ignite') {
      // Flames licking off the silhouette — multiple tongues rising
      const tongues = 7;
      for (let i = 0; i < tongues; i++) {
        const a = i/tongues*TAU - Math.PI/2 + Math.sin(t*1.7 + i)*0.15;
        const flick = 0.7 + Math.sin(t*8 + i*1.7)*0.3;
        const baseR = ringR - 1;
        const tipR = ringR + 6 + flick*4;
        const bx = Math.cos(a)*baseR, by = Math.sin(a)*baseR;
        const tx = Math.cos(a)*tipR, ty = Math.sin(a)*tipR;
        // Outer tongue
        ctx.fillStyle = `rgba(168,58,44,${0.65 + flick*0.3})`;
        ctx.beginPath();
        ctx.moveTo(bx + Math.cos(a+Math.PI/2)*2, by + Math.sin(a+Math.PI/2)*2);
        ctx.quadraticCurveTo(
          (bx+tx)/2 + Math.cos(a+Math.PI/2)*3, (by+ty)/2 + Math.sin(a+Math.PI/2)*3,
          tx, ty
        );
        ctx.quadraticCurveTo(
          (bx+tx)/2 - Math.cos(a+Math.PI/2)*3, (by+ty)/2 - Math.sin(a+Math.PI/2)*3,
          bx - Math.cos(a+Math.PI/2)*2, by - Math.sin(a+Math.PI/2)*2
        );
        ctx.closePath();
        ctx.fill();
        // Gold inner highlight on hot ones
        if (flick > 0.85) {
          ctx.fillStyle = `rgba(232,184,64,${(flick-0.85)*4})`;
          ctx.beginPath();
          ctx.arc(bx + (tx-bx)*0.4, by + (ty-by)*0.4, 1.2, 0, TAU);
          ctx.fill();
        }
      }
      // Floating embers (deterministic per status, time-driven)
      for (let i = 0; i < 4; i++) {
        const phase = ((t*0.8 + i*0.25) % 1);
        const a = i/4*TAU + t*0.5;
        const ex = Math.cos(a)*ringR*0.9 + Math.sin(t*2 + i)*2;
        const ey = Math.sin(a)*ringR*0.9 - phase*ringR*1.5;
        const alpha = 1 - phase;
        ctx.fillStyle = `rgba(168,58,44,${alpha})`;
        ctx.beginPath(); ctx.arc(ex, ey, 1.2, 0, TAU); ctx.fill();
      }
    } else if (s === 'shock') {
      // Sparking arcs around the body, irregular and decisive
      const beat = (t*4) % 1;
      const flash = beat < 0.18;
      // Arcs that snap between random points on the perimeter
      const arcSeed = Math.floor(t*4);
      const sR = (n) => {
        const x = Math.sin(arcSeed*9301 + n*7919) * 10000;
        return x - Math.floor(x);
      };
      ctx.strokeStyle = flash ? PAL.gold : `rgba(200,148,26,${0.4 - beat*0.4})`;
      ctx.lineWidth = flash ? 1.6 : 1;
      const arcs = flash ? 3 : 1;
      for (let i = 0; i < arcs; i++) {
        const a1 = sR(i*2)*TAU;
        const a2 = sR(i*2+1)*TAU;
        const x1 = Math.cos(a1)*ringR, y1 = Math.sin(a1)*ringR;
        const x2 = Math.cos(a2)*ringR, y2 = Math.sin(a2)*ringR;
        // Jagged path
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        const segs = 4;
        for (let k = 1; k < segs; k++) {
          const tt = k/segs;
          const mx = x1 + (x2-x1)*tt;
          const my = y1 + (y2-y1)*tt;
          const j = (sR(i*10 + k) - 0.5) * 6;
          ctx.lineTo(mx + j, my + j);
        }
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      // Crackle dots that orbit
      ctx.fillStyle = PAL.gold;
      for (let i = 0; i < 5; i++) {
        const a = i/5*TAU + t*1.8;
        const wobble = Math.sin(t*12 + i)*1.5;
        ctx.globalAlpha = 0.6 + Math.sin(t*9 + i*1.7)*0.4;
        ctx.beginPath();
        ctx.arc(Math.cos(a)*(ringR + wobble), Math.sin(a)*(ringR + wobble), 1.1, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    ringR += 5;
  }
}

/* Composite enemy with HP + statuses */
function drawEnemy(ctx, e, t) {
  const drawFn = enemyDraw[e.shape];
  if (!drawFn) return;
  drawFn(ctx, e.x, e.y, t, e.state || 'idle', e.radius);
  if (e.statuses && e.statuses.length) {
    drawStatusRunes(ctx, e.x, e.y, e.radius * 1.05, e.statuses, t);
  }
  if (e.hp != null && e.hp < e.maxHp) {
    drawHpBar(ctx, e.x - e.radius, e.y - e.radius - 8, e.radius*2, e.hp, e.maxHp);
  }
}

/* =====================================================================
   SPELL EFFECTS — PROPER PARTICLES
   Each takes (ctx, w, h, t, dt, key) so they can maintain per-canvas pools
   ===================================================================== */

function spellFireball(ctx, w, h, t, dt, key, opts={}) {
  const pool = getPool(key);
  // Loop the comet across the screen
  const period = 1.8;
  const phase = (t % period) / period;
  const px = -20 + phase * (w + 40);
  const py = h*0.5 + Math.sin(t*1.5)*8;

  // Spawn embers and smoke each frame
  if (Math.random() < dt*60) {
    pool.push({
      kind: 'ember', x: px - 2, y: py + (Math.random()-0.5)*4,
      vx: -40 - Math.random()*30, vy: -10 + (Math.random()-0.5)*30,
      life: 0.5 + Math.random()*0.4, age: 0,
      drag: 0.96, gravity: -20,
    });
  }
  for (let i = 0; i < 2; i++) {
    pool.push({
      kind: 'smoke', x: px - 4, y: py + (Math.random()-0.5)*3,
      vx: -15 - Math.random()*15, vy: -5 + (Math.random()-0.5)*15,
      life: 0.6 + Math.random()*0.4, age: 0,
      drag: 0.98, gravity: -10,
      size: 2 + Math.random()*2,
    });
  }
  if (Math.random() < dt*30) {
    pool.push({
      kind: 'spark', x: px, y: py,
      vx: -60 - Math.random()*60, vy: (Math.random()-0.5)*80,
      life: 0.3 + Math.random()*0.2, age: 0,
      drag: 0.95,
    });
  }

  // Reset pool if comet wraps
  if (phase < 0.05) {
    for (let i = pool.length-1; i >= 0; i--) if (pool[i].x < -30) pool.splice(i,1);
  }

  tickPool(pool, dt);

  // Draw smoke first (behind)
  for (const p of pool) {
    if (p.kind !== 'smoke') continue;
    const a = Math.max(0, p.life / 0.9);
    ctx.fillStyle = `rgba(26,22,18,${a*0.35})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (1 + p.age*1.5), 0, TAU);
    ctx.fill();
  }
  // Embers
  for (const p of pool) {
    if (p.kind !== 'ember') continue;
    const a = Math.max(0, p.life / 0.9);
    ctx.fillStyle = `rgba(168,58,44,${a})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, 1.2, 0, TAU); ctx.fill();
    if (a > 0.5) {
      ctx.fillStyle = `rgba(232,184,64,${a-0.5})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 0.6, 0, TAU); ctx.fill();
    }
  }
  // Sparks (hatch lines)
  for (const p of pool) {
    if (p.kind !== 'spark') continue;
    const a = Math.max(0, p.life / 0.5);
    ctx.strokeStyle = `rgba(200,148,26,${a})`;
    ctx.lineWidth = 0.8;
    const len = 4 + p.age*8;
    const ang = Math.atan2(p.vy, p.vx);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(ang)*len, p.y + Math.sin(ang)*len);
    ctx.stroke();
  }

  // Comet body — vermilion outer, ink core
  // Outer halo
  ctx.fillStyle = 'rgba(168,58,44,0.25)';
  ctx.beginPath(); ctx.arc(px, py, 12, 0, TAU); ctx.fill();
  // Petal flame
  ctx.save();
  ctx.translate(px, py);
  ctx.fillStyle = PAL.red;
  ctx.strokeStyle = PAL.ink; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.bezierCurveTo(8, -6, -4, -6, -10, -3);
  ctx.bezierCurveTo(-14, -1, -14, 1, -10, 3);
  ctx.bezierCurveTo(-4, 6, 8, 6, 8, 0);
  ctx.fill(); ctx.stroke();
  // Ink core
  ctx.fillStyle = PAL.ink;
  ctx.beginPath(); ctx.arc(2, 0, 3.5, 0, TAU); ctx.fill();
  // Gold spark inside
  ctx.fillStyle = PAL.gold;
  ctx.beginPath(); ctx.arc(2 + Math.sin(t*15)*0.8, 0, 1.2, 0, TAU); ctx.fill();
  ctx.restore();

  // Annot mode — labels
  if (opts.annot) {
    annotLabel(ctx, px - 45, py - 24, 'EMBERS');
    annotLine(ctx, px - 18, py - 12, px - 38, py - 22);
    annotLabel(ctx, px - 50, py + 22, 'SMOKE TRAIL');
    annotLine(ctx, px - 22, py + 8, px - 40, py + 20);
  }
}

function spellLightning(ctx, w, h, t, dt, key, opts={}) {
  const pool = getPool(key);
  // Beat: every ~0.9s, cast a new bolt with N-2 chains
  const period = 1.0;
  const phase = (t % period) / period;
  const beatId = Math.floor(t / period);

  // Stops: source -> 2 enemies (positions semi-static seeded by beat)
  const seed = (beatId * 9301 + 49297) % 233280;
  const r = (n) => ((seed + n*1103) % 233280) / 233280;
  const stops = [
    { x: w*0.12, y: h*0.5 + Math.sin(beatId)*4 },
    { x: w*0.4 + r(1)*w*0.1, y: h*0.5 + (r(2)-0.5)*h*0.5 },
    { x: w*0.65 + r(3)*w*0.1, y: h*0.5 + (r(4)-0.5)*h*0.5 },
    { x: w*0.88, y: h*0.5 + (r(5)-0.5)*h*0.4 },
  ];

  // Lightning lifetime: sharp flash 0–0.18, decay 0.18–0.38, gone after
  const flashOn = phase < 0.4;
  const flashStrength = flashOn ? Math.max(0, 1 - (phase / 0.4)) : 0;

  // Spawn endpoint sparks at flash start
  if (phase < 0.04) {
    for (const s of stops) {
      for (let i = 0; i < 6; i++) {
        const ang = Math.random()*TAU;
        pool.push({
          kind: 'spark', x: s.x, y: s.y,
          vx: Math.cos(ang)*60, vy: Math.sin(ang)*60,
          life: 0.3, age: 0, drag: 0.92,
        });
      }
    }
  }
  tickPool(pool, dt);

  // Background flash on hit
  if (flashStrength > 0) {
    ctx.fillStyle = `rgba(200,148,26,${flashStrength*0.08})`;
    ctx.fillRect(0,0,w,h);
  }

  // Build the bolt path with deterministic jitter
  function drawBolt(a, b, segs, jitter, color, width, branchProb) {
    const points = [{x:a.x, y:a.y}];
    for (let i = 1; i < segs; i++) {
      const k = i/segs;
      const baseX = a.x + (b.x-a.x)*k;
      const baseY = a.y + (b.y-a.y)*k;
      // Perpendicular jitter
      const dx = b.y - a.y, dy = -(b.x - a.x);
      const len = Math.hypot(dx,dy) || 1;
      const j = (((seed + i*7919) % 1000)/1000 - 0.5) * jitter;
      points.push({ x: baseX + dx/len*j, y: baseY + dy/len*j });
    }
    points.push({x:b.x, y:b.y});
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = 'miter';
    ctx.lineCap = 'square';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();

    // Forks
    if (branchProb > 0) {
      for (let i = 1; i < points.length-1; i++) {
        const r2 = ((seed + i*1097) % 1000)/1000;
        if (r2 < branchProb) {
          const dx2 = points[i+1].x - points[i-1].x;
          const dy2 = points[i+1].y - points[i-1].y;
          const len2 = Math.hypot(dx2, dy2) || 1;
          const side = ((seed + i*131) % 2 ? 1 : -1);
          const px = points[i].x + (-dy2/len2) * 12 * side;
          const py = points[i].y + (dx2/len2) * 12 * side;
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(px, py);
          ctx.stroke();
        }
      }
    }
  }

  if (flashOn) {
    // Three segments — sharp ink, vermilion accent layer when fully on
    for (let s = 0; s < stops.length-1; s++) {
      drawBolt(stops[s], stops[s+1], 7, 12, PAL.ink, 2.4, flashStrength*0.4);
    }
    if (flashStrength > 0.5) {
      for (let s = 0; s < stops.length-1; s++) {
        drawBolt(stops[s], stops[s+1], 7, 12, PAL.gold, 1.0, 0);
      }
    }
  }

  // Endpoint markers — concentric circles, fading
  for (const s of stops) {
    const a = flashStrength;
    if (a <= 0) continue;
    ctx.strokeStyle = PAL.ink; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(s.x, s.y, 6, 0, TAU); ctx.stroke();
    ctx.strokeStyle = `rgba(200,148,26,${a})`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(s.x, s.y, 10 + (1-a)*8, 0, TAU); ctx.stroke();
    if (a > 0.5) {
      ctx.fillStyle = PAL.gold;
      drawStar(ctx, s.x, s.y, 3, 1.2, 5);
      ctx.fill();
    }
  }

  // Sparks
  for (const p of pool) {
    if (p.kind !== 'spark') continue;
    const a = Math.max(0, p.life / 0.3);
    ctx.strokeStyle = `rgba(26,22,18,${a})`;
    ctx.lineWidth = 1;
    const len = 3 + p.age*8;
    const ang = Math.atan2(p.vy, p.vx);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(ang)*len, p.y + Math.sin(ang)*len);
    ctx.stroke();
  }

  if (opts.annot) {
    annotLabel(ctx, stops[0].x, stops[0].y - 14, 'SOURCE');
    annotLabel(ctx, stops[2].x - 20, stops[2].y - 14, 'CHAIN');
    annotLabel(ctx, stops[3].x - 30, stops[3].y + 14, 'TERMINUS');
  }
}

function spellGravity(ctx, w, h, t, dt, key, opts={}) {
  const pool = getPool(key);
  const cx = w/2, cy = h/2;
  const baseR = Math.min(w,h) * 0.32;

  // Spawn motes around perimeter, drag toward center
  if (Math.random() < dt*30) {
    const ang = Math.random()*TAU;
    const dist = baseR * (1.2 + Math.random()*0.4);
    pool.push({
      kind: 'mote', x: cx + Math.cos(ang)*dist, y: cy + Math.sin(ang)*dist,
      angle: ang, dist,
      life: 1.2 + Math.random()*0.6, age: 0,
      // Encode angular velocity so they spiral inward
      omega: 1.5 + Math.random()*0.8,
      pullSpeed: 30 + Math.random()*30,
    });
  }

  // Update motes (custom physics — spiral)
  for (let i = pool.length-1; i >= 0; i--) {
    const p = pool[i];
    p.life -= dt; p.age = (p.age||0) + dt;
    if (p.life <= 0 || p.dist < 3) { pool.splice(i,1); continue; }
    p.angle += p.omega * dt;
    p.dist -= p.pullSpeed * dt * (1 + (1 - p.dist/baseR)*0.5);
    p.x = cx + Math.cos(p.angle)*p.dist;
    p.y = cy + Math.sin(p.angle)*p.dist;
  }

  // Concentric ink rings, slightly drifting
  ctx.strokeStyle = PAL.ink;
  for (let i = 1; i <= 5; i++) {
    ctx.lineWidth = 0.4 + (5-i)*0.18;
    ctx.beginPath();
    ctx.arc(cx, cy, baseR*(i/5) + Math.sin(t*1.5 + i)*0.6, 0, TAU);
    ctx.stroke();
  }

  // Indigo spiral (the pull lines)
  ctx.strokeStyle = PAL.blue;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let a = 0; a < TAU*4; a += 0.06) {
    const rr = baseR * (1 - a/(TAU*4));
    const px = cx + Math.cos(a + t*1.5)*rr;
    const py = cy + Math.sin(a + t*1.5)*rr;
    if (a===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  ctx.stroke();
  // Counter spiral, lighter
  ctx.strokeStyle = 'rgba(44,74,140,0.5)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let a = 0; a < TAU*4; a += 0.06) {
    const rr = baseR * (1 - a/(TAU*4));
    const px = cx + Math.cos(-a + t*1.5)*rr;
    const py = cy + Math.sin(-a + t*1.5)*rr;
    if (a===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  ctx.stroke();

  // Motes
  for (const p of pool) {
    const a = Math.min(1, 1 - (p.dist / (baseR*1.3)));
    ctx.fillStyle = `rgba(26,22,18,${0.4 + a*0.6})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, 1.4, 0, TAU); ctx.fill();
  }

  // Black core with hatched event horizon
  ctx.fillStyle = PAL.ink;
  ctx.beginPath(); ctx.arc(cx, cy, 7, 0, TAU); ctx.fill();
  // Vermilion ring at horizon
  ctx.strokeStyle = PAL.red;
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(cx, cy, 11, 0, TAU); ctx.stroke();

  if (opts.annot) {
    annotLabel(ctx, cx + baseR*0.85, cy - baseR*0.85, 'PERIMETER');
    annotLabel(ctx, cx - 40, cy - 10, 'SINGULARITY');
    annotLine(ctx, cx - 8, cy, cx - 20, cy - 6);
  }
}

function spellFrost(ctx, w, h, t, dt, key, opts={}) {
  const pool = getPool(key);
  const period = 1.4;
  const phase = (t % period) / period;
  const px = -10 + phase * (w + 20);
  const py = h*0.5;

  // Spawn ice flakes behind the spike
  if (Math.random() < dt*40) {
    pool.push({
      kind: 'flake', x: px - 6, y: py + (Math.random()-0.5)*4,
      vx: -10 - Math.random()*15, vy: (Math.random()-0.5)*20,
      life: 0.7 + Math.random()*0.5, age: 0,
      drag: 0.96, settled: false,
      rot: Math.random()*TAU, omega: (Math.random()-0.5)*4,
    });
  }
  // Trail line markers
  if (Math.random() < dt*60) {
    pool.push({
      kind: 'trail', x: px - 4, y: py + (Math.random()-0.5)*3,
      vx: 0, vy: 0,
      life: 0.5, age: 0, drag: 1,
    });
  }

  tickPool(pool, dt);
  // Update flakes rotation
  for (const p of pool) if (p.kind === 'flake') p.rot += p.omega * dt;

  // Reset pool if wraps
  if (phase < 0.04) {
    for (let i = pool.length-1; i >= 0; i--) if (pool[i].x < -20) pool.splice(i,1);
  }

  // Draw faint frost trail line behind
  ctx.strokeStyle = 'rgba(44,74,140,0.18)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, py); ctx.lineTo(Math.max(0, px - 4), py);
  ctx.stroke();

  // Trail tick marks
  for (const p of pool) {
    if (p.kind !== 'trail') continue;
    const a = Math.max(0, p.life / 0.5);
    ctx.strokeStyle = `rgba(44,74,140,${a*0.6})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 2); ctx.lineTo(p.x, p.y + 2);
    ctx.stroke();
  }

  // Flakes — small crystal stars
  for (const p of pool) {
    if (p.kind !== 'flake') continue;
    const a = Math.max(0, p.life / 1.2);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.strokeStyle = `rgba(44,74,140,${a*0.8})`;
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 3; i++) {
      const ang = i/3*Math.PI;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang)*-2, Math.sin(ang)*-2);
      ctx.lineTo(Math.cos(ang)*2, Math.sin(ang)*2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Spike body — sharp triangular shard, indigo with white inner gleam
  ctx.save();
  ctx.translate(px, py);
  ctx.fillStyle = PAL.blue;
  ctx.strokeStyle = PAL.ink; ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-2, -5);
  ctx.lineTo(-30, 0);
  ctx.lineTo(-2, 5);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  // Inner pale crystal
  ctx.fillStyle = PAL.paper;
  ctx.beginPath();
  ctx.moveTo(8, 0); ctx.lineTo(-2, -2); ctx.lineTo(-2, 2); ctx.closePath();
  ctx.fill();
  // Tip highlight
  ctx.fillStyle = PAL.ink;
  ctx.beginPath(); ctx.arc(13, 0, 1, 0, TAU); ctx.fill();
  ctx.restore();

  if (opts.annot) {
    annotLabel(ctx, px - 50, py - 18, 'PIERCES');
    annotLabel(ctx, 20, py + 16, 'CHILL TRAIL');
    annotLine(ctx, 30, py + 6, 30, py + 12);
  }
}

function spellWall(ctx, w, h, t, dt, key, opts={}) {
  const pool = getPool(key);
  // Top-down: a horizontal lane that runs left-to-right across the screen
  const laneY = h*0.55;
  const laneH = 22;
  const laneTop = laneY - laneH/2;
  const laneBot = laneY + laneH/2;

  // Scorched ground beneath (wider hatched zone)
  ctx.save();
  ctx.fillStyle = 'rgba(26,22,18,0.18)';
  ctx.fillRect(0, laneTop - 6, w, laneH + 12);
  // Hatch the scorch
  ctx.beginPath();
  ctx.rect(0, laneTop - 6, w, laneH + 12);
  ctx.clip();
  hatch(ctx, w/2, laneY, w*1.2, laneH+12, 3.5, Math.PI/3.4, 'rgba(26,22,18,0.22)', 0.5);
  ctx.restore();

  // Ink lane edges (the burning footprint)
  ctx.strokeStyle = PAL.ink;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, laneTop); ctx.lineTo(w, laneTop);
  ctx.moveTo(0, laneBot); ctx.lineTo(w, laneBot);
  ctx.stroke();

  // Vermilion lane fill (the hot ground)
  const grd = ctx.createLinearGradient(0, laneTop, 0, laneBot);
  grd.addColorStop(0, 'rgba(168,58,44,0.05)');
  grd.addColorStop(0.5, 'rgba(168,58,44,0.6)');
  grd.addColorStop(1, 'rgba(168,58,44,0.05)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, laneTop, w, laneH);

  // Spawn upward flame tongues + embers continuously across the lane
  const spawns = Math.floor(dt * 80);
  for (let i = 0; i < spawns; i++) {
    const sx = Math.random() * w;
    pool.push({
      kind: 'tongue', x: sx, y: laneY + (Math.random()-0.5)*laneH*0.5,
      vx: (Math.random()-0.5)*8, vy: -(8 + Math.random()*14),
      life: 0.4 + Math.random()*0.3, age: 0,
      drag: 0.95, gravity: -8,
      maxLife: 0,
    });
    pool[pool.length-1].maxLife = pool[pool.length-1].life;
  }
  if (Math.random() < dt*60) {
    pool.push({
      kind: 'ember', x: Math.random()*w, y: laneY + (Math.random()-0.5)*laneH*0.4,
      vx: (Math.random()-0.5)*15, vy: -(10 + Math.random()*30),
      life: 0.7 + Math.random()*0.5, age: 0,
      drag: 0.97, gravity: -12,
    });
  }

  tickPool(pool, dt);

  // Heat haze: subtle horizontal warp lines above lane
  ctx.strokeStyle = 'rgba(168,58,44,0.10)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 4; i++) {
    const y = laneTop - 4 - i*4;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 6) {
      const wy = y + Math.sin(x*0.1 + t*4 + i)*0.8;
      if (x===0) ctx.moveTo(x, wy); else ctx.lineTo(x, wy);
    }
    ctx.stroke();
  }

  // Flame tongues — upward licks above the lane, ink-rendered with vermilion fill
  for (const p of pool) {
    if (p.kind !== 'tongue') continue;
    const a = Math.max(0, p.life / p.maxLife);
    const size = 4 + (1-a)*4;
    ctx.fillStyle = `rgba(168,58,44,${a})`;
    ctx.strokeStyle = `rgba(26,22,18,${a*0.7})`;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.bezierCurveTo(p.x + size*0.6, p.y - size, p.x - size*0.4, p.y - size*1.2, p.x, p.y - size*1.6);
    ctx.bezierCurveTo(p.x - size*0.4, p.y - size*1.2, p.x - size*0.6, p.y - size, p.x, p.y);
    ctx.fill(); ctx.stroke();
    // Gold inner highlight on hottest tongues
    if (a > 0.7) {
      ctx.fillStyle = `rgba(200,148,26,${(a-0.7)*2})`;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - size*0.5, size*0.2, size*0.5, 0, 0, TAU);
      ctx.fill();
    }
  }

  // Embers
  for (const p of pool) {
    if (p.kind !== 'ember') continue;
    const a = Math.max(0, p.life / 1.2);
    ctx.fillStyle = `rgba(168,58,44,${a})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, 1.2, 0, TAU); ctx.fill();
    if (a > 0.6) {
      ctx.fillStyle = `rgba(232,184,64,${(a-0.6)*2})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 0.6, 0, TAU); ctx.fill();
    }
  }

  // Ink top-down marker — small skull-mark corners showing the band is live
  for (let i = 0; i < 2; i++) {
    const cx = i === 0 ? 14 : w - 14;
    ctx.fillStyle = PAL.ink;
    drawStar(ctx, cx, laneY, 4, 1.8, 5);
    ctx.fill();
  }

  if (opts.annot) {
    annotLabel(ctx, 8, laneTop - 18, 'BURNING LANE (top-down)');
    annotLabel(ctx, w - 100, laneBot + 14, 'TONGUES UP');
    annotLine(ctx, w - 70, laneBot + 8, w - 50, laneBot + 2);
  }
}

function spellPyroclasm(ctx, w, h, t, dt, key, opts={}) {
  const pool = getPool(key);
  const cx = w/2, cy = h/2;
  const period = 2.0;
  const phase = (t % period) / period;
  const beatId = Math.floor(t / period);
  const beatKey = `pyro-${key}-${beatId}`;

  // Trigger at start of beat
  if (!pool._beatId || pool._beatId !== beatId) {
    pool._beatId = beatId;
    // Spawn radial cinder lines
    for (let i = 0; i < 18; i++) {
      const a = i/18*TAU + Math.random()*0.1;
      pool.push({
        kind: 'cinder', x: cx, y: cy,
        vx: Math.cos(a)*120, vy: Math.sin(a)*120,
        life: 0.7, age: 0, drag: 0.94,
        ang: a,
      });
    }
    // Sparks
    for (let i = 0; i < 24; i++) {
      const a = Math.random()*TAU;
      const v = 60 + Math.random()*100;
      pool.push({
        kind: 'spark', x: cx, y: cy,
        vx: Math.cos(a)*v, vy: Math.sin(a)*v,
        life: 0.5 + Math.random()*0.4, age: 0, drag: 0.94,
      });
    }
  }
  tickPool(pool, dt);

  // Scorched ground spreading
  const burnR = Math.min(1, phase * 3) * 90;
  if (burnR > 0) {
    ctx.fillStyle = 'rgba(26,22,18,0.10)';
    ctx.beginPath(); ctx.arc(cx, cy, burnR, 0, TAU); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, burnR, 0, TAU); ctx.clip();
    hatch(ctx, cx, cy, burnR*2, burnR*2, 2.4, Math.PI/3.2, 'rgba(26,22,18,0.30)', 0.4);
    ctx.restore();
  }

  // Shockwave ring (expanding, 0–0.6) — softer, paler
  const shockPhase = Math.min(1, phase / 0.6);
  if (shockPhase < 1) {
    const shockR = shockPhase * Math.min(w,h) * 0.45;
    const shockA = (1 - shockPhase) * 0.65;
    ctx.strokeStyle = `rgba(26,22,18,${shockA*0.7})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(cx, cy, shockR, 0, TAU); ctx.stroke();
    // Inner secondary ring — pale ember dust
    ctx.strokeStyle = `rgba(180,110,80,${shockA*0.55})`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, shockR * 0.86, 0, TAU); ctx.stroke();
  }

  // Sun-burst core — softer warm tones, less saturation
  const corePhase = Math.min(1, phase / 0.5);
  const coreA = 1 - corePhase;
  if (coreA > 0) {
    const R = 28 + corePhase*20;
    ctx.save();
    ctx.translate(cx, cy);
    // Outer halo — pale dusty rose
    ctx.fillStyle = `rgba(210,150,130,${coreA*0.55})`;
    drawStar(ctx, 0, 0, R, R*0.55, 12);
    ctx.fill();
    ctx.strokeStyle = `rgba(60,40,32,${coreA*0.7})`;
    ctx.lineWidth = 0.9;
    ctx.stroke();
    // Mid — warm ochre wash
    ctx.fillStyle = `rgba(220,180,120,${coreA*0.7})`;
    ctx.beginPath(); ctx.arc(0, 0, R*0.45, 0, TAU); ctx.fill();
    // Center — paper-cream, not white-hot
    ctx.fillStyle = `rgba(240,230,200,${coreA*0.85})`;
    ctx.beginPath(); ctx.arc(0, 0, R*0.22, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // Cinders — tip embers in muted vermilion
  for (const p of pool) {
    if (p.kind !== 'cinder') continue;
    const a = Math.max(0, p.life / 0.7);
    ctx.strokeStyle = `rgba(60,40,32,${a*0.7})`;
    ctx.lineWidth = 1;
    const len = 4 + p.age*15;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(p.ang)*len, p.y + Math.sin(p.ang)*len);
    ctx.stroke();
    ctx.fillStyle = `rgba(180,90,70,${a*0.85})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, 1.1, 0, TAU); ctx.fill();
  }
  // Sparks — warm cream rather than gold
  for (const p of pool) {
    if (p.kind !== 'spark') continue;
    const a = Math.max(0, p.life / 0.9);
    ctx.fillStyle = `rgba(220,180,130,${a*0.85})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, 1.3, 0, TAU); ctx.fill();
  }

  if (opts.annot) {
    annotLabel(ctx, cx + 30, cy - 60, 'SUNBURST CORE');
    annotLine(ctx, cx + 4, cy - 24, cx + 26, cy - 50);
    annotLabel(ctx, 8, cy + 70, 'SHOCKWAVE');
  }
}

function spellStormcloud(ctx, w, h, t, dt, key, opts={}) {
  const pool = getPool(key);
  // Top-down: small puddle-shaped AOE on the ground that flickers with internal shocks
  const cx = w/2, cy = h/2;
  const aoeR = Math.min(w,h)*0.18; // small footprint
  const tickInterval = 0.45;
  const tickId = Math.floor(t / tickInterval);

  // Spawn internal strikes on each tick — random points inside the AOE
  if (!pool._tickId || pool._tickId !== tickId) {
    pool._tickId = tickId;
    const seed = tickId * 9301 + 49297;
    const sR = (n) => {
      const x = Math.sin(seed + n*7919) * 10000;
      return x - Math.floor(x);
    };
    const strikes = 2 + Math.floor(sR(0)*2); // 2-3 internal strikes
    for (let s = 0; s < strikes; s++) {
      const a1 = sR(s*2)*TAU;
      const r1 = sR(s*2+1)*aoeR*0.85;
      const a2 = sR(s*3+5)*TAU;
      const r2 = sR(s*3+7)*aoeR*0.85;
      pool.push({
        kind: 'strike',
        sx: cx + Math.cos(a1)*r1, sy: cy + Math.sin(a1)*r1,
        ex: cx + Math.cos(a2)*r2, ey: cy + Math.sin(a2)*r2,
        life: 0.25, age: 0,
        seed: sR(s*11)*9999,
      });
      // Small scorch at endpoints
      pool.push({ kind: 'scorch', x: cx + Math.cos(a2)*r2, y: cy + Math.sin(a2)*r2, life: 0.8, age: 0 });
    }
    // Crackle sparks at random points
    for (let i = 0; i < 10; i++) {
      const a = sR(i*13)*TAU;
      const r = sR(i*17)*aoeR*0.9;
      const ang2 = sR(i*19)*TAU;
      pool.push({
        kind: 'spark', x: cx + Math.cos(a)*r, y: cy + Math.sin(a)*r,
        vx: Math.cos(ang2)*30, vy: Math.sin(ang2)*30,
        life: 0.4, age: 0, drag: 0.92,
      });
    }
  }
  tickPool(pool, dt);

  // AOE puddle — translucent indigo wash with hatched ground
  ctx.fillStyle = 'rgba(44,74,140,0.18)';
  ctx.beginPath();
  // Slightly wobbly perimeter for organic feel
  const lobes = 14;
  for (let i = 0; i <= lobes; i++) {
    const a = i/lobes*TAU;
    const wobble = Math.sin(t*1.5 + i*0.7)*1.5;
    const px = cx + Math.cos(a)*(aoeR + wobble);
    const py = cy + Math.sin(a)*(aoeR + wobble);
    if (i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  ctx.closePath();
  ctx.fill();
  // Hatched fill inside
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= lobes; i++) {
    const a = i/lobes*TAU;
    const wobble = Math.sin(t*1.5 + i*0.7)*1.5;
    const px = cx + Math.cos(a)*(aoeR + wobble);
    const py = cy + Math.sin(a)*(aoeR + wobble);
    if (i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  ctx.closePath();
  ctx.clip();
  hatch(ctx, cx, cy, aoeR*2.2, aoeR*2.2, 3, Math.PI/3.5, 'rgba(44,74,140,0.25)', 0.5);
  ctx.restore();
  // Dashed perimeter
  ctx.strokeStyle = 'rgba(44,74,140,0.65)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4,3]);
  ctx.beginPath();
  for (let i = 0; i <= lobes; i++) {
    const a = i/lobes*TAU;
    const wobble = Math.sin(t*1.5 + i*0.7)*1.5;
    const px = cx + Math.cos(a)*(aoeR + wobble);
    const py = cy + Math.sin(a)*(aoeR + wobble);
    if (i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);

  // Scorch marks
  for (const p of pool) {
    if (p.kind !== 'scorch') continue;
    const a = Math.max(0, p.life / 0.8);
    ctx.fillStyle = `rgba(26,22,18,${a*0.55})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, TAU); ctx.fill();
    ctx.strokeStyle = `rgba(200,148,26,${a*0.7})`;
    ctx.lineWidth = 0.6;
    drawStar(ctx, p.x, p.y, 4, 1.5, 6);
    ctx.stroke();
  }

  // Internal strikes — short jagged ink arcs inside the puddle
  for (const p of pool) {
    if (p.kind !== 'strike') continue;
    const a = Math.max(0, p.life / 0.25);
    if (a <= 0) continue;
    const segs = 5;
    const r = (n) => {
      const x = Math.sin(p.seed + n*7919) * 10000;
      return (x - Math.floor(x));
    };
    const dx = p.ex - p.sx, dy = p.ey - p.sy;
    const len = Math.hypot(dx, dy) || 1;
    const perpX = -dy/len, perpY = dx/len;
    const points = [{x: p.sx, y: p.sy}];
    for (let i = 1; i < segs; i++) {
      const k = i/segs;
      const j = (r(i) - 0.5) * 8;
      points.push({ x: p.sx + dx*k + perpX*j, y: p.sy + dy*k + perpY*j });
    }
    points.push({x: p.ex, y: p.ey});
    // Endpoint flash
    if (a > 0.5) {
      ctx.fillStyle = `rgba(200,148,26,${(a-0.5)*0.3})`;
      ctx.beginPath(); ctx.arc(p.ex, p.ey, 6*a, 0, TAU); ctx.fill();
    }
    ctx.strokeStyle = `rgba(26,22,18,${a*0.95})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    if (a > 0.6) {
      ctx.strokeStyle = `rgba(200,148,26,${(a-0.6)*1.5})`;
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }
  }

  // Sparks
  for (const p of pool) {
    if (p.kind !== 'spark') continue;
    const a = Math.max(0, p.life / 0.4);
    ctx.fillStyle = `rgba(200,148,26,${a*0.85})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, 1.1, 0, TAU); ctx.fill();
  }

  // Center sigil — small storm rune anchoring the AOE
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t*0.3);
  ctx.strokeStyle = 'rgba(44,74,140,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.stroke();
  ctx.strokeStyle = PAL.gold;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-3, -2); ctx.lineTo(0, 0); ctx.lineTo(2, 1);
  ctx.moveTo(0, -4); ctx.lineTo(0, 4);
  ctx.stroke();
  ctx.restore();

  if (opts.annot) {
    annotLabel(ctx, cx + aoeR*1.05, cy - aoeR*0.2, 'AOE PUDDLE');
    annotLine(ctx, cx + aoeR*0.95, cy - aoeR*0.05, cx + aoeR*1.05, cy - aoeR*0.15);
    annotLabel(ctx, cx - aoeR - 30, cy + aoeR*0.95, 'INTERNAL ARCS');
  }
}

const spellFx = {
  fireball: spellFireball,
  lightning: spellLightning,
  gravity: spellGravity,
  frost: spellFrost,
  wall: spellWall,
  pyroclasm: spellPyroclasm,
  stormcloud: spellStormcloud,
};

/* Annotation helpers */
function annotLabel(ctx, x, y, text) {
  ctx.font = '600 9px "JetBrains Mono", monospace';
  ctx.fillStyle = PAL.ink;
  const metrics = ctx.measureText(text);
  const pad = 4;
  ctx.fillStyle = 'rgba(232,220,192,0.85)';
  ctx.fillRect(x - pad, y - 8, metrics.width + pad*2, 12);
  ctx.strokeStyle = PAL.ink; ctx.lineWidth = 0.6;
  ctx.strokeRect(x - pad, y - 8, metrics.width + pad*2, 12);
  ctx.fillStyle = PAL.ink;
  ctx.fillText(text, x, y);
}
function annotLine(ctx, x1, y1, x2, y2) {
  ctx.strokeStyle = PAL.ink;
  ctx.lineWidth = 0.6;
  ctx.setLineDash([2,2]);
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  ctx.setLineDash([]);
  // Tip dot
  ctx.fillStyle = PAL.ink;
  ctx.beginPath(); ctx.arc(x1, y1, 1.4, 0, TAU); ctx.fill();
}

/* =====================================================================
   HUD
   ===================================================================== */
function drawHud(ctx, w, h, t) {
  // Paper background
  ctx.fillStyle = PAL.paper;
  ctx.fillRect(0,0,w,h);

  const padX = 24, padY = 18;
  const hp = 0.78;

  // Top-left HP plate
  ctx.fillStyle = PAL.ink;
  ctx.fillRect(padX, padY, 200, 56);
  ctx.font = '700 11px "Cinzel", serif';
  ctx.fillStyle = PAL.paper;
  ctx.fillText('VITA', padX + 14, padY + 22);
  // Bar
  ctx.fillStyle = PAL.paper;
  ctx.fillRect(padX + 14, padY + 32, 172, 12);
  ctx.fillStyle = PAL.red;
  ctx.fillRect(padX + 14, padY + 32, 172*hp, 12);
  ctx.strokeStyle = PAL.paper; ctx.lineWidth = 1;
  ctx.strokeRect(padX + 14, padY + 32, 172, 12);
  // HP text
  ctx.font = '600 10px "JetBrains Mono", monospace';
  ctx.fillStyle = PAL.paper;
  ctx.fillText(`${Math.round(hp*100)} / 100`, padX + 130, padY + 22);

  // Wave plate (right of HP)
  const wx = padX + 220;
  ctx.fillStyle = PAL.paper2;
  ctx.fillRect(wx, padY, 130, 56);
  ctx.strokeStyle = PAL.ink; ctx.lineWidth = 1.4;
  ctx.strokeRect(wx, padY, 130, 56);
  ctx.font = '700 10px "Cinzel", serif';
  ctx.fillStyle = PAL.ink;
  ctx.fillText('UNDA', wx + 12, padY + 18);
  ctx.font = '500 26px "Cinzel", serif';
  ctx.fillText('VII', wx + 12, padY + 44);
  // Wave dots showing remaining
  for (let i = 0; i < 8; i++) {
    const dotX = wx + 70 + (i%4)*12;
    const dotY = padY + 28 + Math.floor(i/4)*10;
    ctx.fillStyle = i < 6 ? PAL.ink : PAL.paper3;
    ctx.beginPath(); ctx.arc(dotX, dotY, 2.6, 0, TAU); ctx.fill();
  }

  // Currency strip (top-right)
  const cx2 = w - padX - 180;
  // Gold
  ctx.fillStyle = PAL.gold;
  drawStar(ctx, cx2 + 10, padY + 14, 7, 3, 5);
  ctx.fill();
  ctx.strokeStyle = PAL.ink; ctx.lineWidth = 1;
  ctx.stroke();
  ctx.font = '700 14px "JetBrains Mono", monospace';
  ctx.fillStyle = PAL.ink;
  ctx.fillText('  248', cx2 + 14, padY + 19);
  // Soul
  ctx.fillStyle = PAL.blue;
  drawStar(ctx, cx2 + 90, padY + 14, 7, 3, 5);
  ctx.fill();
  ctx.strokeStyle = PAL.ink;
  ctx.stroke();
  ctx.fillStyle = PAL.ink;
  ctx.fillText('  12', cx2 + 94, padY + 19);

  // Equipment slots — wax seal style, bottom strip
  const slotY = h - 64;
  const slotW = 50, slotH = 50;
  const totalSlots = 6;
  const startX = (w - totalSlots*slotW - (totalSlots-1)*8) / 2;
  for (let i = 0; i < totalSlots; i++) {
    const sx = startX + i*(slotW + 8);
    // Frame
    ctx.fillStyle = PAL.paper2;
    ctx.fillRect(sx, slotY, slotW, slotH);
    ctx.strokeStyle = PAL.ink; ctx.lineWidth = 1.4;
    ctx.strokeRect(sx, slotY, slotW, slotH);
    // Hatched corners
    ctx.save();
    ctx.beginPath(); ctx.rect(sx, slotY, slotW, slotH); ctx.clip();
    hatch(ctx, sx + slotW/2, slotY + slotH/2, slotW, slotH, 5, Math.PI/4, 'rgba(26,22,18,0.10)', 0.4);
    ctx.restore();
    // Slot number
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.fillStyle = PAL.inkMid;
    ctx.fillText(`${i+1}`, sx + 4, slotY + 11);
    // Wax seal item in first 4
    if (i < 4) {
      const wcx = sx + slotW/2, wcy = slotY + slotH/2 + 2;
      ctx.fillStyle = i === 0 ? PAL.red : (i === 1 ? PAL.blue : (i === 2 ? PAL.gold : PAL.green));
      ctx.beginPath();
      const points = 12;
      for (let p = 0; p < points; p++) {
        const a = p/points*TAU;
        const rr = 14 + (p%2 ? -1.5 : 1.5);
        const x = wcx + Math.cos(a)*rr;
        const y = wcy + Math.sin(a)*rr;
        if (p===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = PAL.ink; ctx.lineWidth = 1;
      ctx.stroke();
      // Sigil mark
      ctx.fillStyle = PAL.paper;
      const sigils = ['★', '❄', '⚡', '☘'];
      drawStar(ctx, wcx, wcy, 4, 1.8, 5);
      ctx.fill();
    }
  }
}

/* =====================================================================
   STAGE SCENES — three combat moments
   ===================================================================== */
function renderStage(ctx, w, h, t, kind) {
  drawPaper(ctx, w, h, t, { seed: kind === 'open' ? 1 : kind === 'mid' ? 2 : 3 });

  // Top-down arena marks
  // Center spawn line + spawn chevrons top/bottom
  ctx.strokeStyle = PAL.ink;
  ctx.lineWidth = 0.8;
  ctx.setLineDash([4,6]);
  ctx.beginPath();
  ctx.moveTo(w*0.5, 12); ctx.lineTo(w*0.5, h - 12);
  ctx.stroke();
  ctx.setLineDash([]);
  // Chevrons
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    const yT = 18 + i*7 + Math.sin(t*2+i)*1.5;
    const yB = h - 18 - i*7 - Math.sin(t*2+i)*1.5;
    ctx.beginPath();
    ctx.moveTo(w/2-9, yT); ctx.lineTo(w/2, yT+5); ctx.lineTo(w/2+9, yT);
    ctx.moveTo(w/2-9, yB); ctx.lineTo(w/2, yB-5); ctx.lineTo(w/2+9, yB);
    ctx.stroke();
  }

  // Player center
  const px = w/2, py = h*0.55;

  // Per-stage configuration
  if (kind === 'open') {
    // Sparse — pick a target shade and fire a fireball that arcs to it
    const enemies = [];
    for (let i = 0; i < 3; i++) {
      const ePhase = ((t*0.35 + i*0.33) % 1);
      const x = w*0.22 + i*w*0.28;
      const y = 20 + ePhase * (py - 60);
      enemies.push({ x, y, radius: 12, hp: 18, maxHp: 18, shape: 'shade', state: 'walk', _phase: ePhase, _i: i });
    }
    enemies.push({
      x: w*0.78 + Math.sin(t*4)*6, y: h*0.22 + Math.cos(t*5)*3,
      radius: 11, hp: 14, maxHp: 14, shape: 'wisp', state: 'walk',
    });

    // Fireball animation — clear trajectory from player to target enemy
    const fbPeriod = 1.4;
    const fbPhase = (t % fbPeriod) / fbPeriod;
    const targetIdx = Math.floor(t / fbPeriod) % 3;
    const target = enemies[targetIdx];
    const bob = Math.sin(t*1.5)*1.5;
    const sx = px + 15, sy = py - 16 + bob; // staff orb (matches drawMagician)
    const tx = target.x, ty = target.y;
    // Quadratic arc midpoint above the line
    const midX = (sx + tx) / 2;
    const midY = Math.min(sy, ty) - 30;
    const fbActive = fbPhase < 0.7;
    let fx, fy;
    if (fbActive) {
      const u = fbPhase / 0.7;
      const omu = 1 - u;
      fx = omu*omu*sx + 2*omu*u*midX + u*u*tx;
      fy = omu*omu*sy + 2*omu*u*midY + u*u*ty;
      // Trail — sample previous positions along curve
      for (let i = 1; i <= 8; i++) {
        const u2 = Math.max(0, u - i*0.04);
        const omu2 = 1 - u2;
        const trx = omu2*omu2*sx + 2*omu2*u2*midX + u2*u2*tx;
        const try_ = omu2*omu2*sy + 2*omu2*u2*midY + u2*u2*ty;
        const a = 1 - i/8;
        ctx.fillStyle = `rgba(168,58,44,${a*0.6})`;
        ctx.beginPath(); ctx.arc(trx, try_, 1 + a*1.8, 0, TAU); ctx.fill();
        if (i > 3) {
          ctx.fillStyle = `rgba(60,40,32,${a*0.25})`;
          ctx.beginPath(); ctx.arc(trx + (Math.sin(t*8+i)*1), try_ + 1, 2 + i*0.3, 0, TAU); ctx.fill();
        }
      }
      // Comet body
      ctx.fillStyle = 'rgba(168,58,44,0.3)';
      ctx.beginPath(); ctx.arc(fx, fy, 7, 0, TAU); ctx.fill();
      ctx.fillStyle = PAL.red;
      ctx.strokeStyle = PAL.ink; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(fx, fy, 4, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = PAL.ink;
      ctx.beginPath(); ctx.arc(fx, fy, 1.8, 0, TAU); ctx.fill();
    }
    // Mark target as 'hit' during impact window
    if (fbPhase >= 0.65 && fbPhase < 0.95) {
      target.state = 'hit';
      const ip = (fbPhase - 0.65) / 0.3;
      drawHitImpact(ctx, tx, ty, ip, { r0: 6, r1: 22, dmg: '14', rays: 8 });
    }

    for (const e of enemies) drawEnemy(ctx, e, t);

    drawMagician(ctx, px, py, t, fbActive ? 'cast' : 'idle');
  } else if (kind === 'mid') {
    // Crowded — multiple types, lightning chain to top, wall on bottom
    // Top-down wall of flame strip in lower third
    const laneY = h*0.78;
    const laneH = 18;
    ctx.fillStyle = 'rgba(168,58,44,0.45)';
    ctx.fillRect(0, laneY - laneH/2, w, laneH);
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(0, laneY - laneH/2, w, laneH);
    // Quick tongues
    for (let x = 6; x < w; x += 9) {
      const f = Math.sin(t*6 + x*0.3);
      const fy = laneY - laneH/2 + f*1.5;
      ctx.fillStyle = `rgba(168,58,44,${0.6 + Math.sin(t*4+x*0.1)*0.3})`;
      ctx.beginPath();
      ctx.moveTo(x-2, laneY - laneH/2);
      ctx.bezierCurveTo(x-2, fy - 5, x+2, fy - 6, x+2, laneY - laneH/2);
      ctx.fill();
    }

    // Enemies
    const enemies = [];
    for (let i = 0; i < 4; i++) {
      const phase = ((t*0.35 + i*0.2) % 1);
      const x = w*0.18 + i*w*0.2 + Math.sin(t+i)*4;
      const y = phase*h*0.45;
      enemies.push({
        x, y,
        radius: i===2?16:12,
        hp: 20-phase*8, maxHp: 30,
        shape: i===2?'husk':(i===0?'wisp':'shade'),
        state: 'walk',
        statuses: i===0 ? ['ignite'] : (i===2 ? ['slow'] : null),
      });
    }
    // Swarmlings cluster
    for (let i = 0; i < 4; i++) {
      enemies.push({
        x: w*0.5 + (i-1.5)*14, y: h*0.18 + Math.sin(t*3+i)*2,
        radius: 7, hp: 8, maxHp: 8, shape: 'swarmling', state: 'walk',
      });
    }
    for (const e of enemies) drawEnemy(ctx, e, t);

    // Lightning chain — source -> 3 targets in sequence (forks!)
    const lPeriod = 1.4;
    const lPhase = (t % lPeriod) / lPeriod;
    if (lPhase < 0.35) {
      const a = 1 - lPhase/0.35;
      const chain = [
        { x: px, y: py - 18 },
        enemies[0],
        enemies[2],
        enemies[5],
      ];
      for (let s = 0; s < chain.length-1; s++) {
        const aa = chain[s], bb = chain[s+1];
        ctx.strokeStyle = `rgba(26,22,18,${a})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(aa.x, aa.y);
        const segs = 6;
        for (let i = 1; i < segs; i++) {
          const k = i/segs;
          const lx = aa.x + (bb.x-aa.x)*k + (i%2?5:-5);
          const ly = aa.y + (bb.y-aa.y)*k + (i%2?-4:4);
          ctx.lineTo(lx, ly);
        }
        ctx.lineTo(bb.x, bb.y); ctx.stroke();
        ctx.strokeStyle = `rgba(200,148,26,${a*0.7})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        // Impact pop at each target
        if (a > 0.5) {
          ctx.strokeStyle = `rgba(200,148,26,${(a-0.5)*2})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(bb.x, bb.y, 6 + (1-a)*10, 0, TAU); ctx.stroke();
          ctx.fillStyle = PAL.gold;
          drawStar(ctx, bb.x, bb.y, 3, 1.2, 5); ctx.fill();
        }
      }
      // Mark targets hit
      enemies[0].state = enemies[2].state = enemies[5].state = 'hit';
    }
    // Lingering hit impacts at chain targets — outlive the bolt
    const targetsForImpact = [enemies[0], enemies[2], enemies[5]];
    for (let s = 0; s < targetsForImpact.length; s++) {
      const target = targetsForImpact[s];
      // Each target's impact starts as bolt arrives + 50ms*chain index
      const arrive = 0.05 + s*0.05;
      const ph = (lPhase - arrive) / 0.4;
      if (ph > 0 && ph < 1) {
        const dmg = ['12', '8', '5'][s];
        drawHitImpact(ctx, target.x, target.y, ph, { r0: 4, r1: 16, dmg, rays: 6, color: 'rgba(200,148,26,', angOff: s });
      }
    }

    drawMagician(ctx, px, py, t, 'cast');

    // Floating damage numbers
    for (let i = 0; i < 3; i++) {
      const phase = ((t*0.7 + i*0.3) % 1);
      if (phase > 0.7) continue;
      const dnX = w*0.25 + i*w*0.25;
      const dnY = h*0.35 - phase*30;
      const a = 1 - phase/0.7;
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillStyle = `rgba(168,58,44,${a})`;
      ctx.fillText(['16','24','38'][i], dnX, dnY);
    }
  } else if (kind === 'boss') {
    // Boss arrival — Goliath enters from top, gravity well below
    const bossPhase = Math.min(1, ((t*0.4)%2));
    const bossY = h*0.25 + Math.sin(t*0.8)*4;

    // Gravity well between player and boss
    const gx = w/2, gy = h*0.4;
    // Concentric rings
    ctx.strokeStyle = PAL.ink;
    for (let i = 1; i <= 4; i++) {
      ctx.lineWidth = 0.5 + (4-i)*0.2;
      ctx.beginPath(); ctx.arc(gx, gy, 18*i*0.6 + Math.sin(t+i)*0.5, 0, TAU); ctx.stroke();
    }
    // Spiral
    ctx.strokeStyle = PAL.blue;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let a = 0; a < TAU*3; a += 0.1) {
      const rr = 32 * (1 - a/(TAU*3));
      const px2 = gx + Math.cos(a + t*1.5)*rr;
      const py2 = gy + Math.sin(a + t*1.5)*rr;
      if (a===0) ctx.moveTo(px2,py2); else ctx.lineTo(px2,py2);
    }
    ctx.stroke();
    ctx.fillStyle = PAL.ink;
    ctx.beginPath(); ctx.arc(gx, gy, 4, 0, TAU); ctx.fill();
    ctx.strokeStyle = PAL.red; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(gx, gy, 7, 0, TAU); ctx.stroke();

    // Bulwark guards on either side
    const bulwL = { x: w*0.22, y: h*0.3 + Math.sin(t*1.2)*3, radius: 18,
      hp: 180, maxHp: 240, shape: 'bulwark', state: 'idle', statuses: ['shock'] };
    const bulwR = { x: w*0.78, y: h*0.32 + Math.cos(t*1.4)*3, radius: 18,
      hp: 220, maxHp: 240, shape: 'bulwark', state: 'idle' };

    // Periodic strike on the boss + a guard (shows the gravity well chewing them)
    const bossPeriod = 1.6;
    const bossStrikePhase = (t % bossPeriod) / bossPeriod;
    if (bossStrikePhase < 0.4) {
      const ph = bossStrikePhase / 0.4;
      drawHitImpact(ctx, w/2, bossY, ph, { r0: 14, r1: 36, dmg: '24', rays: 10 });
      // Boss takes the hit
      // (drawn below)
    }
    const guardPeriod = 1.1;
    const guardPhase = (t % guardPeriod) / guardPeriod;
    if (guardPhase < 0.35) {
      const ph = guardPhase / 0.35;
      const target = (Math.floor(t/guardPeriod) % 2 === 0) ? bulwL : bulwR;
      drawHitImpact(ctx, target.x, target.y, ph, { r0: 8, r1: 22, dmg: '6', rays: 6, color: 'rgba(200,148,26,' });
      target.state = 'hit';
    }

    // Boss
    drawEnemy(ctx, {
      x: w/2, y: bossY, radius: 30,
      hp: 240, maxHp: 320, shape: 'goliath',
      state: bossStrikePhase < 0.4 ? 'hit' : 'walk',
    }, t);

    drawEnemy(ctx, bulwL, t);
    drawEnemy(ctx, bulwR, t);

    drawMagician(ctx, px, py, t, 'cast');

    // Boss banner
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(w/2 - 80, 10, 160, 20);
    ctx.font = '600 11px "Cinzel", serif';
    ctx.fillStyle = PAL.paper;
    ctx.textAlign = 'center';
    ctx.fillText('GOLIATH · WAVE VII', w/2, 24);
    ctx.textAlign = 'start';
    // Boss HP
    const bhp = 240/320;
    ctx.fillStyle = PAL.paper;
    ctx.fillRect(w/2 - 78, 32, 156, 4);
    ctx.fillStyle = PAL.red;
    ctx.fillRect(w/2 - 78, 32, 156*bhp, 4);
    ctx.strokeStyle = PAL.ink; ctx.lineWidth = 0.8;
    ctx.strokeRect(w/2 - 78, 32, 156, 4);
  }

  // Stage HUD strip at top (compact)
  ctx.fillStyle = PAL.ink;
  ctx.fillRect(8, h - 32, w - 16, 24);
  ctx.fillStyle = PAL.paper;
  ctx.fillRect(12, h - 26, w - 24, 4);
  ctx.fillStyle = PAL.red;
  ctx.fillRect(12, h - 26, (w - 24) * 0.78, 4);
  ctx.font = '600 8px "JetBrains Mono", monospace';
  ctx.fillStyle = PAL.paper;
  ctx.fillText('VITA  78/100', 12, h - 14);
  ctx.fillText('UNDA VII', w - 60, h - 14);
}

/* =====================================================================
   PER-CANVAS RENDERERS
   ===================================================================== */

function renderHero(ctx, w, h, t, dt, key) {
  drawPaper(ctx, w, h, t, { seed: 11 });

  // Top-down arena guides
  ctx.strokeStyle = PAL.ink;
  ctx.lineWidth = 0.6;
  ctx.setLineDash([3,5]);
  ctx.beginPath();
  ctx.moveTo(w*0.5, 12); ctx.lineTo(w*0.5, h - 12);
  ctx.moveTo(12, h*0.5); ctx.lineTo(w - 12, h*0.5);
  ctx.stroke();
  ctx.setLineDash([]);

  // Multiple enemies
  const enemies = [
    { x: w*0.22, y: h*0.28, radius: 14, hp: 12, maxHp: 18, shape: 'shade', state: 'walk', statuses: ['ignite'] },
    { x: w*0.72, y: h*0.22, radius: 11, hp: 14, maxHp: 14, shape: 'wisp', state: 'walk', statuses: ['shock'] },
    { x: w*0.5, y: h*0.16, radius: 18, hp: 28, maxHp: 48, shape: 'husk', state: 'walk', statuses: ['slow'] },
    { x: w*0.85, y: h*0.55, radius: 22, hp: 200, maxHp: 240, shape: 'bulwark', state: 'idle' },
  ];
  // Background swarm trail
  for (let i = 0; i < 5; i++) {
    drawEnemy(ctx, {
      x: w*0.15 + i*8, y: h*0.6 + Math.sin(t*2+i)*2,
      radius: 6, hp: 8, maxHp: 8, shape: 'swarmling', state: 'walk',
    }, t);
  }
  for (const e of enemies) drawEnemy(ctx, e, t);

  // Active fireball mid-flight
  spellFireball(ctx, w, h, t, dt, key + '-fb');

  // Player
  drawMagician(ctx, w*0.5, h*0.7, t, 'cast');

  // Vignette frame border (paper edge)
  ctx.strokeStyle = PAL.ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(0,0,w,h);
}

function renderActor(ctx, w, h, t, kind, state) {
  drawPaper(ctx, w, h, t, { seed: kind.charCodeAt(0) + state.charCodeAt(0) });
  if (kind === 'player') {
    drawMagician(ctx, w/2, h/2, t, state === 'idle' ? 'idle' : state === 'cast' ? 'cast' : 'hit');
  } else {
    const radii = { shade: 14, husk: 18, wisp: 11, swarmling: 8, bulwark: 22, goliath: 30 };
    if (kind === 'swarmling' && state !== 'hit') {
      // Pack of 4
      for (let i = 0; i < 4; i++) {
        const ox = (i-1.5)*16 + Math.sin(t*1.5+i)*2;
        const oy = Math.cos(t*1.7+i*0.7)*5;
        drawEnemy(ctx, {
          x: w/2 + ox, y: h/2 + oy,
          radius: 8, hp: 8, maxHp: 8, shape: 'swarmling', state,
        }, t);
      }
    } else if (kind === 'swarmling') {
      // Hit - scattered
      for (let i = 0; i < 4; i++) {
        const ang = i/4*TAU;
        const dist = 14 + Math.sin(t*4+i)*2;
        drawEnemy(ctx, {
          x: w/2 + Math.cos(ang)*dist, y: h/2 + Math.sin(ang)*dist,
          radius: 8, hp: i===0?2:8, maxHp: 8, shape: 'swarmling', state: i===0?'hit':'idle',
        }, t);
      }
    } else {
      const e = {
        x: w/2, y: h/2 + (kind==='goliath'?-2:0),
        radius: radii[kind] || 14,
        hp: state === 'hit' ? 8 : 14,
        maxHp: kind === 'bulwark' ? 240 : (kind === 'goliath' ? 320 : (kind === 'husk' ? 48 : 18)),
        shape: kind, state,
      };
      drawEnemy(ctx, e, t);
    }
  }
}

function renderSpell(ctx, w, h, t, dt, kind, key, mode) {
  drawPaper(ctx, w, h, t, { seed: kind.charCodeAt(0) });
  spellFx[kind](ctx, w, h, t, dt, key, { annot: mode === 'annot' });
}

function renderStatus(ctx, w, h, t, kind) {
  drawPaper(ctx, w, h, t, { seed: kind.charCodeAt(0) + 50 });
  const statuses = kind === 'all' ? ['slow','ignite','shock'] : [kind];
  drawEnemy(ctx, {
    x: w/2, y: h/2, radius: 18,
    hp: 24, maxHp: 48, shape: 'husk', state: 'idle',
    statuses,
  }, t);
}

/* =====================================================================
   ANIMATION LOOP
   ===================================================================== */
const scenes = [];
function register(canvas, fn) {
  const c = setupCanvas(canvas);
  // Stable key for particle pool per canvas
  const key = canvas.dataset._key || (canvas.dataset._key = Math.random().toString(36).slice(2));
  scenes.push({ canvas, ctx: c.ctx, w: c.w, h: c.h, fn, key, lastT: 0 });
}

function init() {
  // Hero
  document.querySelectorAll('canvas[data-hero]').forEach(c => {
    register(c, (ctx, w, h, t, dt, key) => renderHero(ctx, w, h, t, dt, key));
  });
  // Actors (player + enemies in cast row)
  document.querySelectorAll('canvas[data-actor]').forEach(c => {
    const kind = c.dataset.actor, state = c.dataset.state;
    register(c, (ctx, w, h, t) => renderActor(ctx, w, h, t, kind, state));
  });
  document.querySelectorAll('canvas[data-enemy]').forEach(c => {
    const kind = c.dataset.enemy, state = c.dataset.state;
    register(c, (ctx, w, h, t) => renderActor(ctx, w, h, t, kind, state));
  });
  // Spells
  document.querySelectorAll('canvas[data-spell]').forEach(c => {
    const kind = c.dataset.spell, mode = c.dataset.mode;
    register(c, (ctx, w, h, t, dt, key) => renderSpell(ctx, w, h, t, dt, kind, key, mode));
  });
  // Status
  document.querySelectorAll('canvas[data-status]').forEach(c => {
    const kind = c.dataset.status;
    register(c, (ctx, w, h, t) => renderStatus(ctx, w, h, t, kind));
  });
  // Stages
  document.querySelectorAll('canvas[data-stage]').forEach(c => {
    const kind = c.dataset.stage;
    register(c, (ctx, w, h, t, dt, key) => renderStage(ctx, w, h, t, kind));
  });
  // HUD
  document.querySelectorAll('canvas[data-hud]').forEach(c => {
    register(c, (ctx, w, h, t) => drawHud(ctx, w, h, t));
  });

  // Resize handler
  const resizeAll = () => {
    for (const s of scenes) {
      const rect = s.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      s.canvas.width  = Math.max(1, Math.floor(rect.width  * dpr));
      s.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      s.ctx = s.canvas.getContext('2d');
      s.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      s.w = rect.width; s.h = rect.height;
    }
  };
  window.addEventListener('resize', resizeAll);

  const start = performance.now();
  let lastFrame = start;
  function loop(now) {
    const t = (now - start) / 1000;
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    for (const s of scenes) {
      const r = s.canvas.getBoundingClientRect();
      // Skip offscreen
      if (r.bottom < -50 || r.top > window.innerHeight + 50) continue;
      s.ctx.clearRect(0, 0, s.w, s.h);
      s.fn(s.ctx, s.w, s.h, t, dt, s.key);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

window.addEventListener('load', init);
