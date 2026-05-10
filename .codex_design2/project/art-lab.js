/* =====================================================================
   GRAVEWAVE ART LAB
   Three art directions ("ash", "ink", "neon"), each providing the same
   set of draw* functions that match Renderer.* signatures in the game.
   All canvases are HiDPI-aware and animate via shared rAF loop.
   ===================================================================== */

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);

/* -------- HiDPI canvas setup ---------- */
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
   PALETTES
   ===================================================================== */
const PAL = {
  ash: {
    bg1: '#1a0f0a', bg2: '#0a0604',
    fog: 'rgba(255,180,120,0.04)',
    stone: '#241812',
    flagstone: '#1f140e',
    ink: '#ece6d8', inkDim: '#9a8a78',
    skin: '#d4b896',
    robe: '#2a1810', robeTrim: '#7a3a1c',
    hat: '#1a0d08',
    metal: '#c9923a',
    fire: '#ff7a3a', fireHot: '#ffe28a', fireDark: '#a83118',
    elec: '#e8d04c', elecHot: '#fff7c0',
    grav: '#a07cff', gravDark: '#3a1f78',
    frost: '#9af0e6', frostDark: '#3c8a96',
    blood: '#a83018',
    enemyDark: '#1a0a08', enemyMid: '#3a1f18', enemyTrim: '#8a4a2c',
    bossEye: '#ff4830',
  },
  ink: {
    bg1: '#e8dcc0', bg2: '#d4c8a8',
    paper: '#e8dcc0', paperDark: '#a89878',
    ink: '#1a1612', inkSoft: '#3a322a',
    accentRed: '#a83a2c',
    accentBlue: '#2c4a8c',
    accentGold: '#f0b840',
    accentGreen: '#5a7a3c',
    skin: '#c8a878',
  },
  neon: {
    bg1: '#04030a', bg2: '#0a0824',
    grid: 'rgba(70,90,200,0.18)',
    ink: '#e8e8ff',
    pink: '#ff2e88', pinkSoft: '#ff6ab0',
    cyan: '#5ae5ff', cyanSoft: '#a8f0ff',
    lime: '#c8ff5a',
    violet: '#a07cff',
    orange: '#ff7a3a',
    yellow: '#ffe066',
  },
};

/* =====================================================================
   SHARED DRAW HELPERS
   ===================================================================== */
function drawStar(ctx, cx, cy, outer, inner, points, rotation = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * TAU + rotation;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function hatch(ctx, x, y, w, h, spacing, angle, color, lineW = 0.6) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineW;
  const len = Math.hypot(w, h) * 1.2;
  for (let i = -len; i <= len; i += spacing) {
    ctx.beginPath();
    ctx.moveTo(i, -len); ctx.lineTo(i, len);
    ctx.stroke();
  }
  ctx.restore();
}

/* =====================================================================
   BACKGROUNDS — per direction
   ===================================================================== */
function drawBg(ctx, w, h, dir, t) {
  const p = PAL[dir];
  if (dir === 'ash') {
    // Painterly warm dusk
    const g = ctx.createRadialGradient(w/2, h*0.55, 10, w/2, h*0.55, Math.max(w,h)*0.9);
    g.addColorStop(0, '#3a1f12');
    g.addColorStop(0.4, '#1a0f0a');
    g.addColorStop(1, '#04020a');
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    // Flagstone tiles (subtle)
    ctx.save();
    ctx.globalAlpha = 0.25;
    const tile = 38;
    for (let y = 0; y < h + tile; y += tile) {
      for (let x = 0; x < w + tile; x += tile) {
        const ox = (Math.sin(x*0.7+y*1.3)*4)|0;
        ctx.strokeStyle = '#3a1f12';
        ctx.lineWidth = 1;
        ctx.strokeRect(x+ox, y, tile-1, tile-1);
      }
    }
    ctx.restore();
    // Fog wash
    const fg = ctx.createLinearGradient(0,0,0,h);
    fg.addColorStop(0,'rgba(255,180,120,0.07)');
    fg.addColorStop(0.6,'rgba(255,180,120,0.02)');
    fg.addColorStop(1,'rgba(0,0,0,0.3)');
    ctx.fillStyle = fg; ctx.fillRect(0,0,w,h);
    // Drifting embers
    for (let i = 0; i < 30; i++) {
      const ex = (i * 53 + t * 12) % (w + 40) - 20;
      const ey = h - ((i * 71 + t * 28) % (h + 40));
      const a = 0.3 + 0.3*Math.sin(t*2+i);
      ctx.fillStyle = `rgba(255,180,80,${a})`;
      ctx.beginPath(); ctx.arc(ex, ey, 1.1, 0, TAU); ctx.fill();
    }
  } else if (dir === 'ink') {
    // Aged paper
    ctx.fillStyle = p.paper;
    ctx.fillRect(0,0,w,h);
    // Paper texture: random speckles (deterministic)
    ctx.save();
    for (let i = 0; i < 200; i++) {
      const x = (i * 7919) % w, y = (i * 6151) % h;
      ctx.fillStyle = `rgba(60,40,20,${0.04 + (i%5)*0.02})`;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.restore();
    // Faint grid hatching at edges
    ctx.save();
    ctx.globalAlpha = 0.06;
    for (let x = 0; x < w; x += 6) {
      ctx.strokeStyle = p.ink;
      ctx.lineWidth = 0.4;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x+h*0.3, h); ctx.stroke();
    }
    ctx.restore();
    // Burned vignette
    const vg = ctx.createRadialGradient(w/2,h/2,0, w/2,h/2,Math.max(w,h)*0.7);
    vg.addColorStop(0,'rgba(0,0,0,0)');
    vg.addColorStop(1,'rgba(80,40,10,0.3)');
    ctx.fillStyle = vg; ctx.fillRect(0,0,w,h);
  } else if (dir === 'neon') {
    // Deep void with grid
    ctx.fillStyle = p.bg1; ctx.fillRect(0,0,w,h);
    // Perspective-ish grid lines pulsing
    ctx.save();
    const pulse = 0.6 + 0.4*Math.sin(t*1.5);
    ctx.strokeStyle = `rgba(70,90,200,${0.15*pulse})`;
    ctx.lineWidth = 1;
    const grid = 30;
    for (let x = 0; x < w; x += grid) {
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke();
    }
    for (let y = 0; y < h; y += grid) {
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();
    }
    ctx.restore();
    // Vignette
    const vg = ctx.createRadialGradient(w/2,h/2,10, w/2,h/2,Math.max(w,h)*0.7);
    vg.addColorStop(0,'rgba(0,0,0,0)');
    vg.addColorStop(1,'rgba(0,0,0,0.7)');
    ctx.fillStyle = vg; ctx.fillRect(0,0,w,h);
  }
}

/* =====================================================================
   PLAYER (MAGICIAN) — three takes
   Signature mirrors Renderer.drawPlayer(ctx, p, t)
   ===================================================================== */
function drawPlayerAsh(ctx, p, t) {
  const x = p.x, y = p.y + Math.sin(t*1.5)*1.5;
  const flash = p.castFlash || 0;
  const iframe = p.iframes && Math.floor(t*30)%2===0;
  ctx.save();
  ctx.translate(x,y);

  // Cast halo
  if (flash > 0) {
    const g = ctx.createRadialGradient(0,0,0,0,0,70);
    g.addColorStop(0,`rgba(255,200,100,${0.5*flash})`);
    g.addColorStop(1,'rgba(255,200,100,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0,0,70,0,TAU); ctx.fill();
  }

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath(); ctx.ellipse(0, 24, 18, 5, 0, 0, TAU); ctx.fill();

  // Robe (painterly layered)
  const robe = iframe ? '#5a3a28' : '#2a1810';
  ctx.fillStyle = robe;
  ctx.beginPath();
  ctx.moveTo(-2, -10);
  ctx.bezierCurveTo(-26, -6, -28, 24, -2, 24);
  ctx.bezierCurveTo(28, 24, 26, -6, 2, -10);
  ctx.fill();
  // Highlight
  ctx.fillStyle = 'rgba(255,180,100,0.12)';
  ctx.beginPath();
  ctx.moveTo(-22, 4);
  ctx.bezierCurveTo(-18,18,-8,22,-4,22);
  ctx.lineTo(-4,8);
  ctx.bezierCurveTo(-12,4,-18,2,-22,4);
  ctx.fill();
  // Trim ember stitches
  ctx.strokeStyle = '#7a3a1c';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-20,12); ctx.bezierCurveTo(-10,22,10,22,20,12); ctx.stroke();
  ctx.fillStyle = '#c25a2c';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath(); ctx.arc(i*7, 18, 0.9, 0, TAU); ctx.fill();
  }

  // Head — soft
  ctx.fillStyle = '#d4b896';
  ctx.beginPath(); ctx.arc(0,-18,7.5,0,TAU); ctx.fill();
  ctx.fillStyle = 'rgba(60,30,10,0.4)';
  ctx.beginPath(); ctx.arc(2,-17,6,0,TAU); ctx.fill();

  // Hat — slumped wide brim
  ctx.fillStyle = '#1a0d08';
  ctx.beginPath();
  ctx.moveTo(-12,-22);
  ctx.quadraticCurveTo(-3, -46, 8, -42);
  ctx.quadraticCurveTo(11, -28, 12, -22);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0a0604';
  ctx.beginPath(); ctx.ellipse(-1,-22,15,3.5,0,0,TAU); ctx.fill();

  // Glowing brand on chest (ember)
  const eb = 0.7 + 0.3*Math.sin(t*4);
  ctx.fillStyle = `rgba(255,140,60,${eb})`;
  ctx.shadowColor = '#ff7a3a';
  ctx.shadowBlur = 12;
  drawStar(ctx, 0, -2, 3.5, 1.6, 5);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Staff
  ctx.strokeStyle = '#3a1f12';
  ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(16,-12); ctx.lineTo(22, 26); ctx.stroke();
  ctx.strokeStyle = '#7a4a2c';
  ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(17,-8); ctx.lineTo(21,24); ctx.stroke();

  // Orb — burning ember
  const orbT = t*2;
  ctx.shadowColor = '#ff7a3a';
  ctx.shadowBlur = 16 + Math.sin(orbT)*4;
  const og = ctx.createRadialGradient(16,-18,0, 16,-18,7);
  og.addColorStop(0,'#ffe28a');
  og.addColorStop(0.5,'#ff7a3a');
  og.addColorStop(1,'#a83118');
  ctx.fillStyle = og;
  ctx.beginPath(); ctx.arc(16,-18,5,0,TAU); ctx.fill();
  ctx.shadowBlur = 0;

  // Orb sparks
  for (let i = 0; i < 4; i++) {
    const a = t*3 + i*TAU/4;
    ctx.fillStyle = `rgba(255,200,100,${0.3+0.3*Math.sin(t*5+i)})`;
    ctx.beginPath(); ctx.arc(16+Math.cos(a)*9, -18+Math.sin(a)*9, 0.8, 0, TAU); ctx.fill();
  }

  ctx.restore();
}

function drawPlayerInk(ctx, p, t) {
  const x = p.x, y = p.y + Math.sin(t*1.5)*1.5;
  const flash = p.castFlash || 0;
  const iframe = p.iframes && Math.floor(t*30)%2===0;
  ctx.save();
  ctx.translate(x,y);

  // Sigil ring around player
  if (flash > 0) {
    ctx.strokeStyle = `rgba(168,58,44,${0.7*flash})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(0,0,40,0,TAU); ctx.stroke();
    ctx.setLineDash([4,3]);
    ctx.beginPath(); ctx.arc(0,0,46,0,TAU); ctx.stroke();
    ctx.setLineDash([]);
  }

  // Shadow as cross-hatch
  ctx.save();
  ctx.translate(0, 22);
  ctx.scale(1, 0.3);
  hatch(ctx, 0, 0, 36, 12, 1.6, 0, 'rgba(26,22,18,0.5)', 0.5);
  ctx.restore();

  // Robe — flat black with hatched shadow side
  const inkColor = iframe ? '#3a322a' : '#1a1612';
  ctx.fillStyle = inkColor;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.bezierCurveTo(-22, -4, -22, 22, 0, 22);
  ctx.bezierCurveTo(22, 22, 22, -4, 0, -10);
  ctx.fill();
  // Hatching on right side for shading
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.bezierCurveTo(22, -4, 22, 22, 0, 22);
  ctx.lineTo(0, -10);
  ctx.clip();
  hatch(ctx, 4, 6, 30, 30, 2.2, Math.PI/3.5, 'rgba(232,220,192,0.18)', 0.5);
  ctx.restore();

  // Robe outline
  ctx.strokeStyle = '#1a1612';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.bezierCurveTo(-22, -4, -22, 22, 0, 22);
  ctx.bezierCurveTo(22, 22, 22, -4, 0, -10);
  ctx.stroke();

  // Robe trim — block printed red
  ctx.strokeStyle = '#a83a2c';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-19, 14); ctx.bezierCurveTo(-10, 23, 10, 23, 19, 14); ctx.stroke();

  // Head — pale with single ink line
  ctx.fillStyle = '#e8dcc0';
  ctx.beginPath(); ctx.arc(0, -16, 7.5, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#1a1612';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(0, -16, 7.5, 0, TAU); ctx.stroke();

  // Hat — sharp triangular ink
  ctx.fillStyle = '#1a1612';
  ctx.beginPath();
  ctx.moveTo(-11, -22); ctx.lineTo(0, -44); ctx.lineTo(11, -22);
  ctx.closePath(); ctx.fill();
  // brim
  ctx.beginPath(); ctx.ellipse(0, -22, 14, 3, 0, 0, TAU); ctx.fill();

  // Star on hat — gold mark
  ctx.fillStyle = '#f0b840';
  drawStar(ctx, 0, -34, 3.5, 1.6, 5);
  ctx.fill();
  ctx.strokeStyle = '#1a1612';
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // Staff
  ctx.strokeStyle = '#1a1612';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(15, -10); ctx.lineTo(20, 24); ctx.stroke();

  // Orb — flat red with hatched gleam
  ctx.fillStyle = '#a83a2c';
  ctx.beginPath(); ctx.arc(15, -16, 4.5, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#1a1612';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.fillStyle = '#f0b840';
  ctx.beginPath(); ctx.arc(13.5, -17, 1.4, 0, TAU); ctx.fill();

  ctx.restore();
}

function drawPlayerNeon(ctx, p, t) {
  const x = p.x, y = p.y + Math.sin(t*1.5)*1.5;
  const flash = p.castFlash || 0;
  const iframe = p.iframes && Math.floor(t*30)%2===0;
  ctx.save();
  ctx.translate(x, y);

  // Hover ring
  ctx.strokeStyle = `rgba(255,46,136,${iframe?0.9:0.5})`;
  ctx.lineWidth = 2;
  ctx.shadowColor = '#ff2e88';
  ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.ellipse(0, 22, 22, 6, 0, 0, TAU); ctx.stroke();

  if (flash > 0) {
    ctx.strokeStyle = `rgba(90,229,255,${flash})`;
    ctx.shadowColor = '#5ae5ff';
    ctx.shadowBlur = 20;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0,0,30+12*flash,0,TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(0,0,42+12*flash,0,TAU); ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // Robe = wireframe diamond stack
  const robeColor = iframe ? '#ff2e88' : '#5ae5ff';
  ctx.strokeStyle = robeColor;
  ctx.lineWidth = 1.6;
  ctx.shadowColor = robeColor;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(-20, 8);
  ctx.lineTo(-12, 22);
  ctx.lineTo(12, 22);
  ctx.lineTo(20, 8);
  ctx.closePath();
  ctx.stroke();
  // Inner ribs
  ctx.beginPath();
  ctx.moveTo(-16, 14); ctx.lineTo(16, 14);
  ctx.moveTo(0, -10); ctx.lineTo(0, 22);
  ctx.stroke();

  // Head — neon disk
  ctx.shadowColor = '#a07cff';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#a07cff';
  ctx.beginPath(); ctx.arc(0, -16, 6, 0, TAU); ctx.fill();
  ctx.shadowBlur = 0;

  // Hat — single bold triangle in pink
  ctx.strokeStyle = '#ff2e88';
  ctx.shadowColor = '#ff2e88';
  ctx.shadowBlur = 10;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-12, -22);
  ctx.lineTo(0, -44);
  ctx.lineTo(12, -22);
  ctx.closePath();
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Hat star
  ctx.fillStyle = '#c8ff5a';
  ctx.shadowColor = '#c8ff5a';
  ctx.shadowBlur = 8;
  drawStar(ctx, 0, -32, 3, 1.4, 5);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Staff — thick neon line
  ctx.strokeStyle = '#5ae5ff';
  ctx.shadowColor = '#5ae5ff';
  ctx.shadowBlur = 10;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(16, -8); ctx.lineTo(22, 24); ctx.stroke();

  // Orb — pulsing
  const pulse = 4 + Math.sin(t*4)*1.5;
  ctx.fillStyle = '#fff';
  ctx.shadowColor = '#5ae5ff';
  ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.arc(16, -14, pulse, 0, TAU); ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();
}

const drawPlayer = { ash: drawPlayerAsh, ink: drawPlayerInk, neon: drawPlayerNeon };

/* =====================================================================
   ENEMIES — six shapes × three directions
   ===================================================================== */
function drawShade(ctx, e, dir, t) {
  const r = e.radius;
  if (dir === 'ash') {
    // Painterly hooded silhouette with ember eyes and trailing wisps
    // Trailing smoke
    for (let i = 0; i < 5; i++) {
      const ti = (t*0.8 + i*0.2) % 1;
      const sy = e.radius + ti*14;
      ctx.fillStyle = `rgba(40,20,15,${(1-ti)*0.4})`;
      ctx.beginPath(); ctx.arc((Math.sin(t*2+i)*3), sy, r*0.5*(1-ti*0.5), 0, TAU); ctx.fill();
    }
    // Body — painted blob
    const bg = ctx.createRadialGradient(-2, -2, 0, 0, 0, r*1.1);
    bg.addColorStop(0, '#5a2a1a');
    bg.addColorStop(1, '#1a0a08');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.ellipse(0, 2, r*0.85, r, 0, 0, TAU);
    ctx.fill();
    // Hood
    ctx.fillStyle = '#0a0604';
    ctx.beginPath(); ctx.arc(0, -r*0.4, r*0.6, 0, TAU); ctx.fill();
    // Ember eyes
    const eb = 0.7 + 0.3*Math.sin(t*6);
    ctx.fillStyle = `rgba(255,80,40,${eb})`;
    ctx.shadowColor = '#ff5b2c'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(-3, -r*0.4, 1.6, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(3, -r*0.4, 1.6, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
  } else if (dir === 'ink') {
    // Woodcut hooded shade — flat black with white eye dots and hatched body
    ctx.fillStyle = '#1a1612';
    ctx.beginPath();
    ctx.moveTo(0, -r*1.2);
    ctx.quadraticCurveTo(-r*0.9, -r*0.4, -r*0.7, r);
    ctx.quadraticCurveTo(0, r*1.05, r*0.7, r);
    ctx.quadraticCurveTo(r*0.9, -r*0.4, 0, -r*1.2);
    ctx.fill();
    // Inner hatching for fabric
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, -r*1.2);
    ctx.quadraticCurveTo(-r*0.9, -r*0.4, -r*0.7, r);
    ctx.quadraticCurveTo(0, r*1.05, r*0.7, r);
    ctx.quadraticCurveTo(r*0.9, -r*0.4, 0, -r*1.2);
    ctx.clip();
    hatch(ctx, 0, 0, r*2, r*2, 1.6, Math.PI/4, 'rgba(232,220,192,0.16)', 0.4);
    ctx.restore();
    // White eye glow
    ctx.fillStyle = '#e8dcc0';
    ctx.beginPath(); ctx.arc(-3, -r*0.4, 1.4, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(3, -r*0.4, 1.4, 0, TAU); ctx.fill();
  } else {
    // Neon vector — wireframe with floating eye dots
    ctx.strokeStyle = '#a07cff';
    ctx.shadowColor = '#a07cff'; ctx.shadowBlur = 10;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.bezierCurveTo(-r*0.9, -r*0.5, -r*0.8, r*0.9, 0, r*0.95);
    ctx.bezierCurveTo(r*0.8, r*0.9, r*0.9, -r*0.5, 0, -r);
    ctx.stroke();
    // Inner segment
    ctx.beginPath();
    ctx.moveTo(-r*0.5, 0); ctx.lineTo(r*0.5, 0);
    ctx.stroke();
    // Pink eyes
    ctx.fillStyle = '#ff2e88';
    ctx.shadowColor = '#ff2e88'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(-3, -r*0.4, 1.6, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(3, -r*0.4, 1.6, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function drawHusk(ctx, e, dir, t) {
  const r = e.radius;
  if (dir === 'ash') {
    // Lumpy hex stone with cracked glowing core
    const g = ctx.createRadialGradient(0,0,0,0,0,r);
    g.addColorStop(0,'#3a2418'); g.addColorStop(1,'#0a0604');
    ctx.fillStyle = g;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i/6*TAU;
      const rr = r * (0.92 + Math.sin(i*2)*0.05);
      const x = Math.cos(a)*rr, y = Math.sin(a)*rr;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.fill();
    // Cracks
    ctx.strokeStyle = `rgba(255,90,40,${0.6+0.3*Math.sin(t*3)})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-r*0.5, -r*0.3); ctx.lineTo(0, 0); ctx.lineTo(r*0.4, r*0.5);
    ctx.moveTo(0, 0); ctx.lineTo(-r*0.2, r*0.6);
    ctx.stroke();
    // Core
    ctx.fillStyle = '#ff7a3a';
    ctx.shadowColor = '#ff7a3a'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(0,0,r*0.18, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
  } else if (dir === 'ink') {
    // Heavy block-printed hexagon with diagonal hatching
    ctx.fillStyle = '#e8dcc0';
    ctx.strokeStyle = '#1a1612'; ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i/6*TAU;
      const x = Math.cos(a)*r, y = Math.sin(a)*r;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Inner hex
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i/6*TAU;
      const x = Math.cos(a)*r*0.55, y = Math.sin(a)*r*0.55;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.stroke();
    // Cross-hatch on outer ring
    ctx.save(); ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i/6*TAU;
      const x = Math.cos(a)*r, y = Math.sin(a)*r;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.clip();
    hatch(ctx, 0,0, r*2, r*2, 2.2, Math.PI/3, '#1a1612', 0.5);
    ctx.restore();
    // Red core dot
    ctx.fillStyle = '#a83a2c';
    ctx.beginPath(); ctx.arc(0,0,r*0.18,0,TAU); ctx.fill();
  } else {
    // Neon hex wireframe with throbbing core
    ctx.strokeStyle = '#5ae5ff';
    ctx.shadowColor = '#5ae5ff'; ctx.shadowBlur = 12;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i/6*TAU;
      const x = Math.cos(a)*r, y = Math.sin(a)*r;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.stroke();
    // Cross spokes
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = i/6*TAU;
      ctx.beginPath();
      ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    // Core
    const pulse = 0.6+0.4*Math.sin(t*4);
    ctx.fillStyle = `rgba(255,46,136,${pulse})`;
    ctx.shadowColor = '#ff2e88'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(0,0,r*0.25, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function drawWisp(ctx, e, dir, t) {
  const r = e.radius;
  if (dir === 'ash') {
    // Soft glowing mote with painterly trail
    const g = ctx.createRadialGradient(0,0,0,0,0,r*1.6);
    g.addColorStop(0,'rgba(255,200,150,0.9)');
    g.addColorStop(0.4,'rgba(255,140,80,0.5)');
    g.addColorStop(1,'rgba(255,120,50,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0,0,r*1.6, 0, TAU); ctx.fill();
    // Core diamond
    ctx.fillStyle = '#ffe28a';
    ctx.beginPath();
    ctx.moveTo(0,-r*0.7); ctx.lineTo(r*0.5,0); ctx.lineTo(0,r*0.7); ctx.lineTo(-r*0.5,0);
    ctx.closePath(); ctx.fill();
  } else if (dir === 'ink') {
    // Single bold diamond with concentric ink rings (woodcut star)
    ctx.fillStyle = '#1a1612';
    ctx.beginPath();
    ctx.moveTo(0,-r); ctx.lineTo(r*0.7,0); ctx.lineTo(0,r); ctx.lineTo(-r*0.7,0);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#1a1612'; ctx.lineWidth = 0.8;
    for (let k = 1; k <= 3; k++) {
      const f = 1+k*0.35;
      ctx.beginPath();
      ctx.moveTo(0,-r*f); ctx.lineTo(r*0.7*f,0); ctx.lineTo(0,r*f); ctx.lineTo(-r*0.7*f,0);
      ctx.closePath(); ctx.stroke();
    }
    // Gold center
    ctx.fillStyle = '#f0b840';
    ctx.beginPath(); ctx.arc(0,0,r*0.25,0,TAU); ctx.fill();
  } else {
    // Pulsing neon diamond with trailing shadows
    const pulse = 0.7+0.3*Math.sin(t*8);
    ctx.strokeStyle = '#c8ff5a';
    ctx.shadowColor = '#c8ff5a'; ctx.shadowBlur = 14*pulse;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0,-r); ctx.lineTo(r*0.7,0); ctx.lineTo(0,r); ctx.lineTo(-r*0.7,0);
    ctx.closePath(); ctx.stroke();
    // Inner
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0,-r*0.5); ctx.lineTo(r*0.35,0); ctx.lineTo(0,r*0.5); ctx.lineTo(-r*0.35,0);
    ctx.closePath(); ctx.stroke();
    ctx.shadowBlur = 0;
    // Center dot
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0,0,1.6,0,TAU); ctx.fill();
  }
}

function drawSwarmling(ctx, e, dir, t) {
  const r = e.radius;
  const scuttleY = Math.sin(t*9)*1.2;
  ctx.translate(0, scuttleY);
  if (dir === 'ash') {
    // Tiny scuttling beetle/bat
    ctx.fillStyle = '#3a1f12';
    ctx.beginPath();
    ctx.moveTo(0,-r*1.1);
    ctx.bezierCurveTo(r*1.1, -r*0.3, r*0.9, r*0.7, 0, r*0.7);
    ctx.bezierCurveTo(-r*0.9, r*0.7, -r*1.1, -r*0.3, 0, -r*1.1);
    ctx.fill();
    // Wing flap
    const flap = Math.sin(t*16);
    ctx.fillStyle = '#1a0d08';
    ctx.beginPath();
    ctx.moveTo(0,-r*0.4);
    ctx.quadraticCurveTo(-r*1.5, -r*0.5+flap*2, -r*1.6, -r*0.1+flap*2);
    ctx.quadraticCurveTo(-r*0.6, -r*0.2, 0, -r*0.4);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0,-r*0.4);
    ctx.quadraticCurveTo(r*1.5, -r*0.5-flap*2, r*1.6, -r*0.1-flap*2);
    ctx.quadraticCurveTo(r*0.6, -r*0.2, 0, -r*0.4);
    ctx.fill();
    // Glowing eye
    ctx.fillStyle = '#ff7a3a';
    ctx.beginPath(); ctx.arc(0, -r*0.5, 0.9, 0, TAU); ctx.fill();
  } else if (dir === 'ink') {
    // Triangle ink mark
    ctx.fillStyle = '#1a1612';
    ctx.beginPath();
    ctx.moveTo(0,-r*1.1); ctx.lineTo(r*0.85,r*0.7); ctx.lineTo(-r*0.85,r*0.7);
    ctx.closePath(); ctx.fill();
    // Eye
    ctx.fillStyle = '#a83a2c';
    ctx.beginPath(); ctx.arc(0, -r*0.2, 1, 0, TAU); ctx.fill();
  } else {
    // Vector arrow with pink trail
    ctx.strokeStyle = '#ff6ab0';
    ctx.shadowColor = '#ff2e88'; ctx.shadowBlur = 8;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0,-r*1.1); ctx.lineTo(r*0.85,r*0.7); ctx.lineTo(-r*0.85,r*0.7);
    ctx.closePath(); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, -r*0.2, 1, 0, TAU); ctx.fill();
  }
}

function drawBulwark(ctx, e, dir, t) {
  const r = e.radius;
  if (dir === 'ash') {
    // Heavy iron carapace with rivets and red eye
    ctx.fillStyle = '#1a0f0a';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i/8*TAU + Math.PI/8;
      const x = Math.cos(a)*r, y = Math.sin(a)*r;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.fill();
    // Plates
    ctx.fillStyle = '#3a2418';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i/8*TAU + Math.PI/8;
      const x = Math.cos(a)*r*0.7, y = Math.sin(a)*r*0.7;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.fill();
    // Rivets
    for (let i = 0; i < 8; i++) {
      const a = i/8*TAU + Math.PI/8;
      ctx.fillStyle = '#c9923a';
      ctx.beginPath(); ctx.arc(Math.cos(a)*r*0.85, Math.sin(a)*r*0.85, 1.4, 0, TAU); ctx.fill();
    }
    // Eye
    const eb = 0.7+0.3*Math.sin(t*4);
    ctx.fillStyle = `rgba(255,72,48,${eb})`;
    ctx.shadowColor = '#ff4830'; ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(0, 0, r*0.3, r*0.12, 0, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
  } else if (dir === 'ink') {
    // Octagonal heraldic shield
    ctx.fillStyle = '#e8dcc0';
    ctx.strokeStyle = '#1a1612'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i/8*TAU + Math.PI/8;
      const x = Math.cos(a)*r, y = Math.sin(a)*r;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Quartered with cross-hatching in two opposing quadrants
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i/8*TAU + Math.PI/8;
      const x = Math.cos(a)*r, y = Math.sin(a)*r;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.clip();
    // Vertical line
    ctx.strokeStyle = '#1a1612'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(0,-r*1.2); ctx.lineTo(0,r*1.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r*1.2,0); ctx.lineTo(r*1.2,0); ctx.stroke();
    // Hatch upper-right and lower-left
    ctx.beginPath();
    ctx.rect(0, -r*1.2, r*1.2, r*1.2); ctx.rect(-r*1.2, 0, r*1.2, r*1.2);
    ctx.clip();
    hatch(ctx, 0,0, r*2, r*2, 2.4, Math.PI/3.5, '#1a1612', 0.5);
    ctx.restore();
    // Center boss — red rivet
    ctx.fillStyle = '#a83a2c';
    ctx.strokeStyle = '#1a1612'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(0,0,r*0.18,0,TAU); ctx.fill(); ctx.stroke();
  } else {
    // Wireframe octagon with shield bars and pulsing core
    ctx.strokeStyle = '#a07cff';
    ctx.shadowColor = '#a07cff'; ctx.shadowBlur = 12;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i/8*TAU + Math.PI/8;
      const x = Math.cos(a)*r, y = Math.sin(a)*r;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.stroke();
    // Inner octagon
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i/8*TAU + Math.PI/8;
      const x = Math.cos(a)*r*0.6, y = Math.sin(a)*r*0.6;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.stroke();
    // Spokes
    for (let i = 0; i < 4; i++) {
      const a = i/4*TAU + Math.PI/8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a)*r*0.6, Math.sin(a)*r*0.6);
      ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    // Core
    const pulse = 0.7+0.3*Math.sin(t*3);
    ctx.fillStyle = `rgba(255,46,136,${pulse})`;
    ctx.shadowColor = '#ff2e88'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(0,0,r*0.22,0,TAU); ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function drawGoliath(ctx, e, dir, t) {
  const r = e.radius;
  // Subtle breathing
  const breathe = 1 + Math.sin(t*1.5)*0.04;
  ctx.scale(breathe, breathe);
  if (dir === 'ash') {
    // Massive smoldering golem-star with eye
    // Outer halo
    const halo = ctx.createRadialGradient(0,0,r*0.6, 0,0,r*1.8);
    halo.addColorStop(0, 'rgba(255,90,40,0.4)');
    halo.addColorStop(1, 'rgba(255,90,40,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(0,0,r*1.8,0,TAU); ctx.fill();
    // Body — irregular star
    ctx.fillStyle = '#0a0604';
    drawStar(ctx, 0,0, r, r*0.55, 9);
    ctx.fill();
    ctx.fillStyle = '#3a1f12';
    drawStar(ctx, 0,0, r*0.85, r*0.45, 9);
    ctx.fill();
    // Cracks
    ctx.strokeStyle = `rgba(255,90,40,${0.6+0.3*Math.sin(t*2)})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = i/5*TAU + 0.3;
      ctx.moveTo(0,0);
      ctx.lineTo(Math.cos(a)*r*0.6, Math.sin(a)*r*0.6);
    }
    ctx.stroke();
    // Eye
    ctx.fillStyle = '#ffe28a';
    ctx.shadowColor = '#ff7a3a'; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.arc(0,0,r*0.22,0,TAU); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#1a0a08';
    ctx.beginPath(); ctx.ellipse(0, 0, r*0.16, r*0.06, 0, 0, TAU); ctx.fill();
  } else if (dir === 'ink') {
    // Heraldic woodcut beast — bold star with halo of rays
    // Halo rays
    ctx.strokeStyle = '#1a1612'; ctx.lineWidth = 1;
    for (let i = 0; i < 16; i++) {
      const a = i/16*TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a)*r*1.2, Math.sin(a)*r*1.2);
      ctx.lineTo(Math.cos(a)*r*1.45, Math.sin(a)*r*1.45);
      ctx.stroke();
    }
    // Body
    ctx.fillStyle = '#1a1612';
    drawStar(ctx, 0,0, r, r*0.55, 9);
    ctx.fill();
    ctx.fillStyle = '#e8dcc0';
    drawStar(ctx, 0,0, r*0.65, r*0.36, 9);
    ctx.fill();
    ctx.strokeStyle = '#1a1612'; ctx.lineWidth = 1;
    drawStar(ctx, 0,0, r*0.65, r*0.36, 9);
    ctx.stroke();
    // Hatched outer
    ctx.save();
    drawStar(ctx, 0,0, r, r*0.55, 9);
    ctx.clip();
    drawStar(ctx, 0,0, r*0.65, r*0.36, 9);
    ctx.clip('evenodd');
    hatch(ctx, 0,0, r*2.2, r*2.2, 2, Math.PI/4, 'rgba(232,220,192,0.3)', 0.4);
    ctx.restore();
    // Eye
    ctx.fillStyle = '#a83a2c';
    ctx.beginPath(); ctx.arc(0,0,r*0.18,0,TAU); ctx.fill();
    ctx.fillStyle = '#1a1612';
    ctx.beginPath(); ctx.arc(0,0,r*0.07,0,TAU); ctx.fill();
  } else {
    // Vector boss — multiple rotating wireframe stars
    ctx.strokeStyle = '#ff2e88';
    ctx.shadowColor = '#ff2e88'; ctx.shadowBlur = 16;
    ctx.lineWidth = 2;
    // Outer rotating star
    ctx.save();
    ctx.rotate(t*0.3);
    drawStar(ctx, 0,0, r, r*0.55, 9);
    ctx.stroke();
    ctx.restore();
    // Middle counter-rotating
    ctx.save();
    ctx.rotate(-t*0.5);
    ctx.strokeStyle = '#5ae5ff';
    ctx.shadowColor = '#5ae5ff';
    drawStar(ctx, 0,0, r*0.7, r*0.36, 9);
    ctx.stroke();
    ctx.restore();
    // Inner triangle
    ctx.strokeStyle = '#c8ff5a';
    ctx.shadowColor = '#c8ff5a';
    ctx.lineWidth = 1.4;
    ctx.save();
    ctx.rotate(t);
    ctx.beginPath();
    ctx.moveTo(0, -r*0.4);
    ctx.lineTo(r*0.35, r*0.25);
    ctx.lineTo(-r*0.35, r*0.25);
    ctx.closePath(); ctx.stroke();
    ctx.restore();
    // Core
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0,0, r*0.12, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
  }
}

const enemyShapes = {
  shade: drawShade,
  husk: drawHusk,
  wisp: drawWisp,
  swarmling: drawSwarmling,
  bulwark: drawBulwark,
  goliath: drawGoliath,
};

/* Composite: shadow + body + status rings + HP bar — like Renderer.drawEnemies */
function drawEnemy(ctx, e, dir, t) {
  ctx.save();
  ctx.translate(e.x, e.y);
  // Shadow
  if (dir !== 'ink') {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(0, e.radius*0.85, e.radius*0.8, e.radius*0.25, 0, 0, TAU);
    ctx.fill();
  }
  // Flash override
  if (e.flash > 0 && dir !== 'ink') {
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(255,255,255,${e.flash})`;
    ctx.beginPath(); ctx.arc(0,0,e.radius*1.2,0,TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  // Body
  ctx.save();
  enemyShapes[e.shape](ctx, e, dir, t);
  ctx.restore();

  // Status rings
  if (e.statuses) {
    let off = 4;
    for (const name of e.statuses) {
      const ring = statusRing[dir][name];
      if (ring) ring(ctx, e.radius + off, t);
      off += dir === 'neon' ? 4 : 3;
    }
  }
  // HP bar
  if (e.hp < e.maxHp) {
    const bw = e.radius*2, bh = 3, by = -e.radius - 8;
    if (dir === 'ink') {
      ctx.strokeStyle = '#1a1612'; ctx.lineWidth = 0.8;
      ctx.fillStyle = '#e8dcc0';
      ctx.fillRect(-bw/2, by, bw, bh); ctx.strokeRect(-bw/2, by, bw, bh);
      ctx.fillStyle = '#a83a2c';
      ctx.fillRect(-bw/2, by, bw*(e.hp/e.maxHp), bh);
    } else if (dir === 'neon') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-bw/2, by, bw, bh);
      ctx.fillStyle = '#c8ff5a';
      ctx.shadowColor = '#c8ff5a'; ctx.shadowBlur = 6;
      ctx.fillRect(-bw/2, by, bw*(e.hp/e.maxHp), bh);
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-bw/2, by, bw, bh);
      ctx.fillStyle = '#ff5b6e';
      ctx.fillRect(-bw/2, by, bw*(e.hp/e.maxHp), bh);
    }
  }
  ctx.restore();
}

/* =====================================================================
   STATUS RINGS — three readings
   ===================================================================== */
const statusRing = {
  ash: {
    slow:   (ctx, r, t) => {
      // Frost crystals around target
      ctx.strokeStyle = `rgba(154,240,230,0.85)`;
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 6; i++) {
        const a = i/6*TAU + t*0.5;
        const px = Math.cos(a)*r, py = Math.sin(a)*r;
        ctx.beginPath();
        ctx.moveTo(px-2, py-2); ctx.lineTo(px+2, py+2);
        ctx.moveTo(px-2, py+2); ctx.lineTo(px+2, py-2);
        ctx.stroke();
      }
    },
    ignite: (ctx, r, t) => {
      // Flickering flame licks
      const flick = 0.6 + 0.4*Math.sin(t*12);
      ctx.fillStyle = `rgba(255,122,58,${flick})`;
      ctx.shadowColor = '#ff7a3a'; ctx.shadowBlur = 8;
      for (let i = 0; i < 8; i++) {
        const a = i/8*TAU + t;
        const fr = r + 2 + Math.sin(t*8+i)*1.5;
        ctx.beginPath();
        ctx.arc(Math.cos(a)*fr, Math.sin(a)*fr, 1.4, 0, TAU);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    },
    shock:  (ctx, r, t) => {
      // Static crackle dots
      for (let i = 0; i < 3; i++) {
        const a = (t*4 + i*TAU/3) % TAU;
        ctx.fillStyle = '#fff7c0';
        ctx.shadowColor = '#fff7c0'; ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(Math.cos(a)*r, Math.sin(a)*r, 1.6, 0, TAU);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    },
  },
  ink: {
    slow: (ctx, r, t) => {
      // Hexagonal frost rune
      ctx.strokeStyle = '#2c4a8c'; ctx.lineWidth = 1.2;
      ctx.save();
      ctx.rotate(t*0.3);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i/6*TAU;
        if (i===0) ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r);
        else ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
      }
      ctx.closePath(); ctx.stroke();
      ctx.restore();
    },
    ignite: (ctx, r, t) => {
      // Triangle rune (flame mark)
      ctx.strokeStyle = '#a83a2c'; ctx.lineWidth = 1.4;
      ctx.save();
      ctx.rotate(-t*0.4);
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r*0.866, r*0.5);
      ctx.lineTo(-r*0.866, r*0.5);
      ctx.closePath(); ctx.stroke();
      ctx.restore();
    },
    shock: (ctx, r, t) => {
      // Bolt cross rune
      ctx.strokeStyle = '#f0b840'; ctx.lineWidth = 1.4;
      ctx.save();
      ctx.rotate(t*0.6);
      ctx.beginPath();
      ctx.moveTo(-r, -r*0.3); ctx.lineTo(r*0.3, r*0.3);
      ctx.moveTo(r, -r*0.3); ctx.lineTo(-r*0.3, r*0.3);
      ctx.stroke();
      ctx.restore();
    },
  },
  neon: {
    slow: (ctx, r, t) => {
      ctx.strokeStyle = '#5ae5ff';
      ctx.shadowColor = '#5ae5ff'; ctx.shadowBlur = 8;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4,3]);
      ctx.beginPath(); ctx.arc(0,0,r,0,TAU); ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
    },
    ignite: (ctx, r, t) => {
      ctx.strokeStyle = '#ff7a3a';
      ctx.shadowColor = '#ff7a3a'; ctx.shadowBlur = 12;
      ctx.lineWidth = 1.4;
      const pulse = 1 + 0.06*Math.sin(t*10);
      ctx.beginPath(); ctx.arc(0,0,r*pulse,0,TAU); ctx.stroke();
      ctx.shadowBlur = 0;
    },
    shock: (ctx, r, t) => {
      ctx.strokeStyle = '#ffe066';
      ctx.shadowColor = '#ffe066'; ctx.shadowBlur = 10;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([2,2]);
      ctx.beginPath(); ctx.arc(0,0,r,0,TAU); ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
    },
  },
};

/* =====================================================================
   SPELL EFFECTS
   ===================================================================== */
const spellFx = {
  fireball(ctx, dir, t, w, h) {
    const px = w*0.2 + (t*120 % (w*0.7));
    const py = h*0.5 + Math.sin(t*3)*8;
    if (dir === 'ash') {
      // Painted comet
      // Trail
      for (let i = 0; i < 12; i++) {
        const a = 1 - i/12;
        const tx = px - i*8;
        const ty = py + Math.sin(t*3 - i*0.4)*8;
        ctx.fillStyle = `rgba(255,${120+a*100},${40+a*60},${a*0.6})`;
        ctx.beginPath(); ctx.arc(tx, ty, 5*a + 1, 0, TAU); ctx.fill();
      }
      // Core
      const g = ctx.createRadialGradient(px,py,0, px,py,12);
      g.addColorStop(0,'#fff7c0'); g.addColorStop(0.4,'#ff7a3a'); g.addColorStop(1,'#a83118');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(px,py,9,0,TAU); ctx.fill();
      // Embers
      for (let i = 0; i < 6; i++) {
        const ex = px + Math.cos(t*5+i)*16;
        const ey = py + Math.sin(t*5+i)*12;
        ctx.fillStyle = `rgba(255,200,80,${0.3+0.3*Math.sin(t*6+i)})`;
        ctx.beginPath(); ctx.arc(ex, ey, 1.2, 0, TAU); ctx.fill();
      }
    } else if (dir === 'ink') {
      // Stylized arrow/flame mark
      ctx.fillStyle = '#a83a2c';
      ctx.strokeStyle = '#1a1612'; ctx.lineWidth = 1;
      ctx.save();
      ctx.translate(px, py);
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.bezierCurveTo(8, -4, 8, 4, 0, 8);
      ctx.bezierCurveTo(-14, 6, -14, -6, 0, -8);
      ctx.fill(); ctx.stroke();
      // Flame tongues
      ctx.strokeStyle = '#a83a2c'; ctx.lineWidth = 1.4;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(-12 - i*4, -4 + i*3);
        ctx.lineTo(-22 - i*4, -2 + i*2);
        ctx.stroke();
      }
      ctx.restore();
    } else {
      // Neon trail with hot core
      ctx.shadowColor = '#ff7a3a'; ctx.shadowBlur = 18;
      ctx.strokeStyle = '#ff7a3a'; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(px - 60, py + Math.sin(t*3-0.7)*10);
      ctx.bezierCurveTo(px-40, py+5, px-20, py-3, px, py);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#ffe066'; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(px,py,5,0,TAU); ctx.fill();
      ctx.shadowBlur = 0;
    }
  },

  lightning(ctx, dir, t, w, h) {
    const startX = w*0.18, startY = h*0.5;
    const endX = w*0.82, endY = h*0.5;
    const flash = (Math.sin(t*4) + 1) / 2;
    // 3-point chain through 2 enemies
    const stops = [
      { x: startX, y: startY },
      { x: w*0.4 + Math.sin(t*1.2)*10, y: h*0.35 },
      { x: w*0.65 + Math.sin(t*1.5)*10, y: h*0.65 },
      { x: endX, y: endY },
    ];
    if (dir === 'ash') {
      for (let s = 0; s < stops.length - 1; s++) {
        const a = stops[s], b = stops[s+1];
        // Jagged segments
        ctx.strokeStyle = `rgba(232,208,76,${0.6+0.4*flash})`;
        ctx.shadowColor = '#fff7c0'; ctx.shadowBlur = 14;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        const segs = 8;
        ctx.moveTo(a.x, a.y);
        for (let i = 1; i < segs; i++) {
          const k = i/segs;
          const lx = a.x + (b.x-a.x)*k + (Math.sin(t*30+s*7+i)*8);
          const ly = a.y + (b.y-a.y)*k + (Math.cos(t*25+s*5+i)*8);
          ctx.lineTo(lx, ly);
        }
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.lineWidth = 1; ctx.strokeStyle = '#fff7c0';
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      // Endpoint flash
      ctx.fillStyle = `rgba(255,247,192,${flash*0.4})`;
      for (const s of stops) {
        ctx.beginPath(); ctx.arc(s.x, s.y, 14*flash, 0, TAU); ctx.fill();
      }
    } else if (dir === 'ink') {
      // Heraldic zigzag — bold ink line, no shadow
      ctx.strokeStyle = '#1a1612';
      ctx.lineWidth = 2.2;
      ctx.lineJoin = 'miter';
      for (let s = 0; s < stops.length - 1; s++) {
        const a = stops[s], b = stops[s+1];
        ctx.beginPath();
        const segs = 6;
        ctx.moveTo(a.x, a.y);
        for (let i = 1; i < segs; i++) {
          const k = i/segs;
          const lx = a.x + (b.x-a.x)*k + (i%2===0?6:-6);
          const ly = a.y + (b.y-a.y)*k + (i%2===0?-6:6);
          ctx.lineTo(lx, ly);
        }
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      // Yellow accent overlay
      if (flash > 0.5) {
        ctx.strokeStyle = '#f0b840'; ctx.lineWidth = 0.8;
        for (let s = 0; s < stops.length - 1; s++) {
          const a = stops[s], b = stops[s+1];
          ctx.beginPath();
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    } else {
      // Neon — clean cyan with halo
      ctx.shadowColor = '#5ae5ff'; ctx.shadowBlur = 18;
      ctx.strokeStyle = '#5ae5ff';
      ctx.lineWidth = 2.4;
      for (let s = 0; s < stops.length - 1; s++) {
        const a = stops[s], b = stops[s+1];
        ctx.beginPath();
        const segs = 10;
        ctx.moveTo(a.x, a.y);
        for (let i = 1; i < segs; i++) {
          const k = i/segs;
          const lx = a.x + (b.x-a.x)*k + Math.sin(t*40+s*9+i)*6;
          const ly = a.y + (b.y-a.y)*k + Math.cos(t*36+s*7+i)*6;
          ctx.lineTo(lx, ly);
        }
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.lineWidth = 1.2; ctx.strokeStyle = '#fff';
      for (let s = 0; s < stops.length - 1; s++) {
        const a = stops[s], b = stops[s+1];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      // Endpoints
      for (const s of stops) {
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#5ae5ff'; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(s.x,s.y,3+flash*2,0,TAU); ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  },

  gravity(ctx, dir, t, w, h) {
    const cx = w/2, cy = h/2;
    const r = 50 + Math.sin(t*1.5)*4;
    if (dir === 'ash') {
      // Painterly singularity — dark center, swirling motes pulled in
      const g = ctx.createRadialGradient(cx,cy,0, cx,cy,r);
      g.addColorStop(0, '#000');
      g.addColorStop(0.5, '#1a0a1f');
      g.addColorStop(0.8, 'rgba(160,124,255,0.6)');
      g.addColorStop(1, 'rgba(160,124,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx,cy,r,0,TAU); ctx.fill();
      // Swirling particles
      for (let i = 0; i < 24; i++) {
        const a = i*0.6 + t*1.5;
        const rr = (r*0.95) - ((i*5 + t*40) % (r*0.7));
        const px = cx + Math.cos(a)*rr;
        const py = cy + Math.sin(a)*rr;
        ctx.fillStyle = `rgba(200,170,255,${0.7 - rr/r*0.7})`;
        ctx.beginPath(); ctx.arc(px,py,1.4,0,TAU); ctx.fill();
      }
      // Event horizon ring
      ctx.strokeStyle = 'rgba(160,124,255,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx,cy,r*0.55,0,TAU); ctx.stroke();
    } else if (dir === 'ink') {
      // Concentric ink rings spiraling
      ctx.strokeStyle = '#1a1612';
      for (let i = 1; i <= 5; i++) {
        ctx.lineWidth = 0.6 + (5-i)*0.2;
        ctx.beginPath(); ctx.arc(cx, cy, r*(i/5), 0, TAU); ctx.stroke();
      }
      // Spiral
      ctx.strokeStyle = '#2c4a8c'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let a = 0; a < TAU*4; a += 0.1) {
        const rr = r * (1 - a / (TAU*4));
        const px = cx + Math.cos(a + t*2) * rr;
        const py = cy + Math.sin(a + t*2) * rr;
        if (a===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
      }
      ctx.stroke();
      // Black core
      ctx.fillStyle = '#1a1612';
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, TAU); ctx.fill();
    } else {
      // Neon — stacked rotating wireframe rings
      for (let i = 0; i < 4; i++) {
        const rr = r * (0.4 + i*0.2);
        ctx.strokeStyle = i%2 ? '#a07cff' : '#5ae5ff';
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 1.4;
        ctx.save();
        ctx.translate(cx,cy);
        ctx.rotate(t*(i%2?-1:1)*0.6);
        ctx.beginPath();
        ctx.ellipse(0,0,rr,rr*0.4, i*0.4, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
      ctx.shadowBlur = 0;
      // Core
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#a07cff'; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(cx,cy,5,0,TAU); ctx.fill();
      ctx.shadowBlur = 0;
    }
  },

  frost(ctx, dir, t, w, h) {
    // Piercing spike traveling left to right
    const px = w*0.15 + (t*180 % (w*0.7));
    const py = h*0.5;
    if (dir === 'ash') {
      // Long crystal shard with cool glow
      ctx.save();
      ctx.translate(px, py);
      const grad = ctx.createLinearGradient(-30,0, 14, 0);
      grad.addColorStop(0, 'rgba(154,240,230,0)');
      grad.addColorStop(0.6, 'rgba(154,240,230,0.7)');
      grad.addColorStop(1, '#e8fdfb');
      ctx.fillStyle = grad;
      ctx.shadowColor = '#9af0e6'; ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(0, -5);
      ctx.lineTo(-30, -1.5);
      ctx.lineTo(-30, 1.5);
      ctx.lineTo(0, 5);
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
      // Frost sparkles trailing
      for (let i = 0; i < 8; i++) {
        const tx = px - 30 - i*6;
        const ty = py + Math.sin(t*8+i)*3;
        ctx.fillStyle = `rgba(232,253,251,${1-i/8})`;
        ctx.fillRect(tx, ty, 1.5, 1.5);
      }
    } else if (dir === 'ink') {
      // Sharp triangular shard
      ctx.save();
      ctx.translate(px, py);
      ctx.fillStyle = '#2c4a8c';
      ctx.strokeStyle = '#1a1612'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-2, -5);
      ctx.lineTo(-30, 0);
      ctx.lineTo(-2, 5);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8dcc0';
      ctx.beginPath();
      ctx.moveTo(8, 0); ctx.lineTo(-2, -2); ctx.lineTo(-2, 2); ctx.closePath(); ctx.fill();
      ctx.restore();
    } else {
      // Neon arrow with cyan trail
      ctx.save();
      ctx.translate(px, py);
      ctx.shadowColor = '#5ae5ff'; ctx.shadowBlur = 14;
      ctx.strokeStyle = '#5ae5ff'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-2, -5);
      ctx.lineTo(-30, 0);
      ctx.lineTo(-2, 5);
      ctx.closePath(); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(8, 0, 2, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  },

  wall(ctx, dir, t, w, h) {
    const wallY = h*0.5;
    const wallH = 36;
    if (dir === 'ash') {
      // Painterly fire band
      const g = ctx.createLinearGradient(0, wallY-wallH/2, 0, wallY+wallH/2);
      g.addColorStop(0,'rgba(255,200,80,0)');
      g.addColorStop(0.5,'rgba(255,120,60,0.85)');
      g.addColorStop(1,'rgba(255,200,80,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, wallY - wallH/2, w, wallH);
      // Flame tongues
      for (let x = 0; x < w; x += 8) {
        const f = Math.sin(t*6 + x*0.1) * 6;
        ctx.fillStyle = `rgba(255,200,80,${0.4+0.3*Math.sin(t*4+x*0.05)})`;
        ctx.beginPath();
        ctx.moveTo(x, wallY - wallH/2 + f);
        ctx.quadraticCurveTo(x+4, wallY - wallH/2 + f - 8, x+8, wallY - wallH/2 + f);
        ctx.lineTo(x+8, wallY - wallH/2);
        ctx.lineTo(x, wallY - wallH/2);
        ctx.fill();
      }
      // Drifting sparks
      for (let i = 0; i < 14; i++) {
        const sx = (i*47 + t*60) % w;
        const sy = wallY - 20 - ((i*30 + t*120) % 40);
        ctx.fillStyle = `rgba(255,200,80,${1 - (wallY-sy)/40})`;
        ctx.beginPath(); ctx.arc(sx, sy, 1.2, 0, TAU); ctx.fill();
      }
    } else if (dir === 'ink') {
      // Hatched band of flames
      ctx.save();
      ctx.fillStyle = '#a83a2c';
      ctx.fillRect(0, wallY - wallH/2 + 8, w, wallH - 16);
      // Flame outlines on top edge
      ctx.strokeStyle = '#1a1612'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let x = 0; x < w; x += 6) {
        const peak = wallY - wallH/2 + 6 + Math.sin(t*4 + x*0.2)*4;
        ctx.moveTo(x, wallY - wallH/2 + 8);
        ctx.quadraticCurveTo(x+3, peak - 6, x+6, wallY - wallH/2 + 8);
      }
      ctx.stroke();
      // Hatch interior
      ctx.beginPath();
      ctx.rect(0, wallY-wallH/2+8, w, wallH-16);
      ctx.clip();
      hatch(ctx, w/2, wallY, w, wallH, 2.4, Math.PI/4, 'rgba(232,220,192,0.4)', 0.5);
      ctx.restore();
    } else {
      // Neon scanline beam
      ctx.fillStyle = 'rgba(255,46,136,0.15)';
      ctx.fillRect(0, wallY-wallH/2, w, wallH);
      ctx.strokeStyle = '#ff2e88';
      ctx.shadowColor = '#ff2e88'; ctx.shadowBlur = 18;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, wallY-wallH/2); ctx.lineTo(w, wallY-wallH/2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, wallY+wallH/2); ctx.lineTo(w, wallY+wallH/2); ctx.stroke();
      ctx.shadowBlur = 0;
      // Scan line
      const scan = wallY - wallH/2 + ((t*60) % wallH);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(0, scan, w, 1);
    }
  },

  pyroclasm(ctx, dir, t, w, h) {
    // Big AOE burst centered, expanding/contracting
    const cx = w/2, cy = h/2;
    const phase = (t % 1.5) / 1.5;
    const R = 80 * Math.min(1, phase * 2);
    const fade = 1 - Math.max(0, (phase - 0.5) * 2);
    if (dir === 'ash') {
      const g = ctx.createRadialGradient(cx,cy,0, cx,cy,R);
      g.addColorStop(0, `rgba(255,247,192,${fade})`);
      g.addColorStop(0.4, `rgba(255,122,58,${fade*0.85})`);
      g.addColorStop(1, 'rgba(168,49,24,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx,cy,R,0,TAU); ctx.fill();
      // Shockwave
      ctx.strokeStyle = `rgba(255,247,192,${fade*0.7})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx,cy,R*1.05, 0, TAU); ctx.stroke();
      // Embers radiating
      for (let i = 0; i < 16; i++) {
        const a = i/16*TAU;
        const er = R + 10 + Math.sin(t*8+i)*4;
        ctx.fillStyle = `rgba(255,200,80,${fade})`;
        ctx.beginPath(); ctx.arc(cx+Math.cos(a)*er, cy+Math.sin(a)*er, 2, 0, TAU); ctx.fill();
      }
    } else if (dir === 'ink') {
      // Sun rays radiating from center
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = '#a83a2c';
      ctx.beginPath();
      const points = 24;
      for (let i = 0; i < points*2; i++) {
        const isOuter = i%2 === 0;
        const rr = isOuter ? R : R*0.6;
        const a = (i/(points*2))*TAU + t*0.2;
        const x = Math.cos(a)*rr, y = Math.sin(a)*rr;
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#1a1612'; ctx.lineWidth = 1;
      ctx.stroke();
      // Center disc
      ctx.fillStyle = '#f0b840';
      ctx.beginPath(); ctx.arc(0,0,R*0.4,0,TAU); ctx.fill();
      ctx.strokeStyle = '#1a1612'; ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    } else {
      // Concentric expanding rings
      for (let i = 0; i < 3; i++) {
        const rr = R*(0.5+i*0.25);
        ctx.strokeStyle = i===0?'#fff':(i===1?'#ffe066':'#ff2e88');
        ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 14;
        ctx.lineWidth = 2 - i*0.4;
        ctx.beginPath(); ctx.arc(cx,cy,rr,0,TAU); ctx.stroke();
      }
      ctx.shadowBlur = 0;
      // Hot core
      ctx.fillStyle = `rgba(255,255,255,${fade})`;
      ctx.shadowColor = '#fff'; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(cx,cy,12*fade,0,TAU); ctx.fill();
      ctx.shadowBlur = 0;
    }
  },

  stormcloud(ctx, dir, t, w, h) {
    const cx = w/2, cy = h*0.45;
    const R = 50;
    if (dir === 'ash') {
      // Roiling dark cloud with strikes
      ctx.fillStyle = 'rgba(20,20,40,0.7)';
      for (let i = 0; i < 8; i++) {
        const a = i/8*TAU + t*0.4;
        const r = R + Math.sin(t*2+i)*6;
        ctx.beginPath(); ctx.arc(cx+Math.cos(a)*R*0.3, cy+Math.sin(a)*R*0.3, r*0.5, 0, TAU); ctx.fill();
      }
      // Lightning flash
      const strike = Math.sin(t*4)*Math.sin(t*4) > 0.7;
      if (strike) {
        ctx.strokeStyle = '#fff7c0';
        ctx.shadowColor = '#fff7c0'; ctx.shadowBlur = 14;
        ctx.lineWidth = 2;
        const tx = cx + (Math.sin(t*9)*30);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(tx-4, cy+30);
        ctx.lineTo(tx+2, cy+50);
        ctx.lineTo(tx, cy+70);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    } else if (dir === 'ink') {
      // Cloud as scalloped shape, ink-bordered
      ctx.fillStyle = '#1a1612';
      ctx.beginPath();
      const lobes = 7;
      for (let i = 0; i < lobes; i++) {
        const a = i/lobes*TAU;
        const x = cx+Math.cos(a)*R, y = cy+Math.sin(a)*R*0.6;
        ctx.arc(x, y, R*0.35, 0, TAU);
      }
      ctx.fill();
      // Bolt
      ctx.strokeStyle = '#f0b840'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx-4, cy+20);
      ctx.lineTo(cx+6, cy+35);
      ctx.lineTo(cx-2, cy+45);
      ctx.lineTo(cx+8, cy+65);
      ctx.stroke();
      ctx.strokeStyle = '#1a1612'; ctx.lineWidth = 1; ctx.stroke();
    } else {
      // Wireframe orb with crackling tendrils
      ctx.strokeStyle = '#5ae5ff';
      ctx.shadowColor = '#5ae5ff'; ctx.shadowBlur = 14;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        ctx.save(); ctx.translate(cx,cy); ctx.rotate(t*0.7 + i*TAU/3);
        ctx.beginPath();
        ctx.ellipse(0,0,R, R*0.5, 0, 0, TAU); ctx.stroke();
        ctx.restore();
      }
      ctx.shadowBlur = 0;
      // Periodic strikes
      for (let s = 0; s < 3; s++) {
        const phase = ((t*1.5 + s/3) % 1);
        if (phase < 0.5) {
          ctx.strokeStyle = '#ffe066';
          ctx.shadowColor = '#ffe066'; ctx.shadowBlur = 12;
          ctx.lineWidth = 1.6;
          const tx = cx + (s-1)*30;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(tx + Math.sin(t*30+s)*4, cy + 30);
          ctx.lineTo(tx, cy + 60);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }
    }
  },
};

/* =====================================================================
   PARTICLES — three vocabularies
   ===================================================================== */
function drawParticle(ctx, p, dir) {
  if (dir === 'ash') {
    // Painterly ember
    ctx.fillStyle = `rgba(${p.r||255},${p.g||180},${p.b||80},${p.a})`;
    ctx.shadowColor = `rgba(${p.r||255},${p.g||180},${p.b||80},${p.a})`;
    ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
  } else if (dir === 'ink') {
    // Hatch mark fragment
    ctx.strokeStyle = `rgba(26,22,18,${p.a})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x - p.s, p.y);
    ctx.lineTo(p.x + p.s, p.y);
    ctx.stroke();
  } else {
    // Voxel — square pixel
    ctx.fillStyle = `rgba(${p.r||90},${p.g||229},${p.b||255},${p.a})`;
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8;
    ctx.fillRect(p.x - p.s, p.y - p.s, p.s*2, p.s*2);
    ctx.shadowBlur = 0;
  }
}

/* =====================================================================
   HUD STYLES — three takes on the same widgets
   ===================================================================== */
function drawHud(ctx, dir, t, w, h) {
  drawBg(ctx, w, h, dir, t);

  // Layout: top bar with HP, wave; bottom slots
  const padX = 18, padY = 14;
  const hp = 0.7 + 0.05*Math.sin(t*2);

  if (dir === 'ash') {
    // HP plaque (left)
    ctx.fillStyle = 'rgba(20,12,8,0.85)';
    ctx.strokeStyle = 'rgba(255,180,80,0.4)';
    ctx.lineWidth = 1;
    roundRect(ctx, padX, padY, 130, 38, 2, true, true);
    // Label
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#9a8a78';
    ctx.fillText('HP', padX+10, padY+14);
    // Bar
    ctx.fillStyle = 'rgba(40,20,15,0.6)';
    ctx.fillRect(padX+10, padY+19, 110, 10);
    const bg = ctx.createLinearGradient(padX+10, 0, padX+10+110*hp, 0);
    bg.addColorStop(0, '#a83118'); bg.addColorStop(1, '#ff7a3a');
    ctx.fillStyle = bg;
    ctx.fillRect(padX+10, padY+19, 110*hp, 10);
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ece6d8';
    ctx.fillText(`${Math.round(hp*100)} / 100`, padX+76, padY+28);

    // Wave indicator (right)
    const wx = w - 130 - padX;
    ctx.fillStyle = 'rgba(20,12,8,0.85)';
    ctx.strokeStyle = 'rgba(255,180,80,0.4)';
    roundRect(ctx, wx, padY, 130, 38, 2, true, true);
    ctx.font = '500 9px "Cinzel", serif';
    ctx.fillStyle = '#9a8a78';
    ctx.fillText('WAVE', wx+10, padY+14);
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ece6d8';
    ctx.fillText('07 / —', wx+10, padY+30);
    // TP/SP pills
    ctx.fillStyle = '#f0c674';
    ctx.beginPath(); ctx.arc(wx+88, padY+24, 4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#a07cff';
    ctx.beginPath(); ctx.arc(wx+108, padY+24, 4, 0, TAU); ctx.fill();
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ece6d8';
    ctx.fillText('3', wx+95, padY+27);
    ctx.fillText('1', wx+115, padY+27);

    // Equipment slots (bottom)
    const slotY = h - 70;
    for (let i = 0; i < 4; i++) {
      const sx = w/2 + (i-1.5)*60;
      ctx.fillStyle = 'rgba(20,12,8,0.85)';
      ctx.strokeStyle = i < 2 ? '#c9923a' : 'rgba(255,180,80,0.2)';
      ctx.lineWidth = i < 2 ? 1.4 : 1;
      roundRect(ctx, sx-22, slotY, 44, 44, 2, true, true);
      if (i < 2) {
        // Item icon — ember orb
        const og = ctx.createRadialGradient(sx, slotY+22, 0, sx, slotY+22, 14);
        og.addColorStop(0, '#ffe28a'); og.addColorStop(1, '#a83118');
        ctx.fillStyle = og;
        ctx.beginPath(); ctx.arc(sx, slotY+22, 9, 0, TAU); ctx.fill();
      }
    }
  } else if (dir === 'ink') {
    // Stamped paper UI
    ctx.fillStyle = '#e8dcc0';
    ctx.strokeStyle = '#1a1612'; ctx.lineWidth = 1.2;
    ctx.fillRect(padX, padY, 130, 38);
    ctx.strokeRect(padX, padY, 130, 38);
    ctx.font = '700 10px "Cinzel", serif';
    ctx.fillStyle = '#1a1612';
    ctx.fillText('VITA', padX+10, padY+14);
    // Bar — black w/ red fill
    ctx.fillStyle = '#e8dcc0';
    ctx.strokeRect(padX+10, padY+19, 110, 10);
    ctx.fillStyle = '#a83a2c';
    ctx.fillRect(padX+10, padY+19, 110*hp, 10);
    // Hatching unfilled
    ctx.save();
    ctx.beginPath(); ctx.rect(padX+10+110*hp, padY+19, 110-110*hp, 10);
    ctx.clip();
    hatch(ctx, padX+50, padY+24, 110, 10, 2, Math.PI/3, '#1a1612', 0.5);
    ctx.restore();

    // Wave
    const wx = w - 130 - padX;
    ctx.fillStyle = '#1a1612';
    ctx.fillRect(wx, padY, 130, 38);
    ctx.strokeStyle = '#1a1612';
    ctx.font = '500 9px "Cinzel", serif';
    ctx.fillStyle = '#e8dcc0';
    ctx.fillText('UNDA', wx+10, padY+14);
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillText('VII', wx+10, padY+30);
    // Currency stamps
    ctx.fillStyle = '#f0b840';
    drawStar(ctx, wx+95, padY+24, 4, 1.8, 5);
    ctx.fill();
    ctx.fillStyle = '#2c4a8c';
    drawStar(ctx, wx+115, padY+24, 4, 1.8, 5);
    ctx.fill();

    // Slots — sealed wax
    const slotY = h - 70;
    for (let i = 0; i < 4; i++) {
      const sx = w/2 + (i-1.5)*60;
      ctx.fillStyle = '#e8dcc0';
      ctx.strokeStyle = '#1a1612'; ctx.lineWidth = 1.2;
      ctx.fillRect(sx-22, slotY, 44, 44);
      ctx.strokeRect(sx-22, slotY, 44, 44);
      // Hatched corners
      ctx.save();
      ctx.beginPath(); ctx.rect(sx-22, slotY, 44, 44); ctx.clip();
      hatch(ctx, sx, slotY+22, 44, 44, 4, Math.PI/4, 'rgba(26,22,18,0.15)', 0.5);
      ctx.restore();
      if (i < 2) {
        // Wax seal
        ctx.fillStyle = '#a83a2c';
        ctx.beginPath();
        for (let p = 0; p < 8; p++) {
          const a = p/8*TAU;
          const rr = 11 + (p%2?-1.5:1.5);
          const x = sx + Math.cos(a)*rr;
          const y = slotY+22 + Math.sin(a)*rr;
          if (p===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#1a1612'; ctx.lineWidth = 0.8; ctx.stroke();
        ctx.fillStyle = '#1a1612';
        drawStar(ctx, sx, slotY+22, 3.5, 1.4, 5);
        ctx.fill();
      }
    }
  } else {
    // Neon HUD
    ctx.strokeStyle = '#5ae5ff';
    ctx.shadowColor = '#5ae5ff'; ctx.shadowBlur = 8;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(padX, padY, 130, 38);
    ctx.shadowBlur = 0;
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#5ae5ff';
    ctx.fillText('HP', padX+10, padY+14);
    ctx.fillStyle = 'rgba(255,46,136,0.18)';
    ctx.fillRect(padX+10, padY+19, 110, 10);
    ctx.fillStyle = '#ff2e88';
    ctx.shadowColor = '#ff2e88'; ctx.shadowBlur = 10;
    ctx.fillRect(padX+10, padY+19, 110*hp, 10);
    ctx.shadowBlur = 0;
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${Math.round(hp*100)}`, padX+85, padY+28);

    // Wave
    const wx = w - 130 - padX;
    ctx.strokeStyle = '#c8ff5a';
    ctx.shadowColor = '#c8ff5a'; ctx.shadowBlur = 8;
    ctx.strokeRect(wx, padY, 130, 38);
    ctx.shadowBlur = 0;
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#c8ff5a';
    ctx.fillText('WAVE', wx+10, padY+14);
    ctx.font = '600 14px "JetBrains Mono", monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('07', wx+10, padY+32);
    // Currency markers
    ctx.fillStyle = '#ffe066';
    ctx.shadowColor = '#ffe066'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(wx+92, padY+24, 4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#a07cff';
    ctx.shadowColor = '#a07cff';
    ctx.beginPath(); ctx.arc(wx+114, padY+24, 4, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('3', wx+99, padY+27);
    ctx.fillText('1', wx+121, padY+27);

    // Slots
    const slotY = h - 70;
    for (let i = 0; i < 4; i++) {
      const sx = w/2 + (i-1.5)*60;
      ctx.strokeStyle = i < 2 ? '#c8ff5a' : 'rgba(90,229,255,0.3)';
      ctx.shadowColor = i < 2 ? '#c8ff5a' : '#5ae5ff';
      ctx.shadowBlur = i < 2 ? 10 : 0;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(sx-22, slotY, 44, 44);
      if (i < 2) {
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#c8ff5a'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(sx, slotY+22, 6, 0, TAU); ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }
}
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
  ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
  ctx.lineTo(x+r, y+h); ctx.arcTo(x, y+h, x, y+h-r, r);
  ctx.lineTo(x, y+r); ctx.arcTo(x, y, x+r, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

/* =====================================================================
   PER-CANVAS SCENES
   ===================================================================== */

/* Hero panels — full atmosphere shot for direction picker */
function renderHero(ctx, w, h, dir, t) {
  drawBg(ctx, w, h, dir, t);

  // Three enemies converging
  const enemies = [
    { x: w*0.3, y: h*0.25 + Math.sin(t)*4, radius: 14, hp: 18, maxHp: 18, shape: 'shade', flash: 0, statuses: ['ignite'] },
    { x: w*0.7, y: h*0.3 + Math.cos(t*1.2)*3, radius: 13, hp: 14, maxHp: 14, shape: 'wisp', flash: 0, statuses: ['shock'] },
    { x: w*0.5, y: h*0.18, radius: 18, hp: 28, maxHp: 48, shape: 'husk', flash: 0, statuses: ['slow'] },
  ];
  for (const e of enemies) drawEnemy(ctx, e, dir, t);

  // Spell mid-cast
  spellFx.fireball(ctx, dir, t, w, h);
  // Player
  const p = { x: w/2, y: h*0.7, castFlash: 0.5+0.3*Math.sin(t*2), iframes: 0 };
  drawPlayer[dir](ctx, p, t);
}

/* Character isolation panels */
function renderCharScene(ctx, w, h, dir, t) {
  drawBg(ctx, w, h, dir, t);
  const cycle = (t % 4);
  const flash = cycle < 0.3 ? (1 - cycle/0.3) * 0.7 : 0;
  const iframe = cycle > 2 && cycle < 2.6 ? 1 : 0;
  const p = { x: w/2, y: h/2, castFlash: flash, iframes: iframe };
  drawPlayer[dir](ctx, p, t);
}

/* Enemy specimen panels */
function renderEnemyScene(ctx, w, h, dir, kind, t) {
  drawBg(ctx, w, h, dir, t);
  if (kind === 'swarmling') {
    const pack = 4;
    for (let i = 0; i < pack; i++) {
      const ox = (i-1.5)*22 + Math.sin(t*2 + i)*3;
      const oy = Math.sin(t*3 + i*1.5)*4;
      const e = {
        x: w/2 + ox, y: h/2 + oy,
        radius: 8, hp: 8, maxHp: 8, shape: 'swarmling',
        flash: 0, statuses: i===0 ? ['shock'] : null,
      };
      drawEnemy(ctx, e, dir, t);
    }
  } else if (kind === 'wisp') {
    // Erratic dart
    const e = {
      x: w/2 + Math.sin(t*4)*40, y: h/2 + Math.cos(t*5)*15,
      radius: 12, hp: 14, maxHp: 14, shape: 'wisp',
      flash: 0, statuses: ['ignite'],
    };
    drawEnemy(ctx, e, dir, t);
  } else if (kind === 'goliath') {
    // Big, with intro shockwave ring
    const phase = (t % 3) / 3;
    if (phase < 0.5) {
      ctx.strokeStyle = dir==='ash'?`rgba(255,90,40,${(1-phase*2)})`:dir==='ink'?`rgba(168,58,44,${(1-phase*2)})`:`rgba(255,46,136,${(1-phase*2)})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(w/2, h/2, phase*120, 0, TAU); ctx.stroke();
    }
    const e = {
      x: w/2, y: h/2,
      radius: 30, hp: 280, maxHp: 320, shape: 'goliath',
      flash: 0, statuses: null,
    };
    drawEnemy(ctx, e, dir, t);
  } else {
    // Single, with status cycling
    const phase = (t % 6) / 6;
    let statuses = null;
    if (phase < 0.33) statuses = ['slow'];
    else if (phase < 0.66) statuses = ['ignite'];
    else statuses = ['shock'];

    const radii = { shade: 14, husk: 18, bulwark: 22 };
    const e = {
      x: w/2 + Math.sin(t*1.5)*8,
      y: h/2,
      radius: radii[kind] || 14,
      hp: 18 - phase*8, maxHp: 18,
      shape: kind, flash: 0, statuses,
    };
    if (kind === 'husk') { e.hp = 36; e.maxHp = 48; }
    if (kind === 'bulwark') { e.hp = 180; e.maxHp = 240; }
    drawEnemy(ctx, e, dir, t);
  }
}

function renderSpellScene(ctx, w, h, dir, kind, t) {
  drawBg(ctx, w, h, dir, t);
  // Background enemies for context
  if (kind !== 'pyroclasm' && kind !== 'gravity' && kind !== 'stormcloud') {
    for (let i = 0; i < 3; i++) {
      const e = {
        x: w*0.55 + i*22, y: h*0.5 + (i-1)*8,
        radius: 11, hp: 6, maxHp: 18, shape: 'shade', flash: 0, statuses: null,
      };
      drawEnemy(ctx, e, dir, t);
    }
  } else {
    // Pyroclasm: surrounding enemies in burst
    for (let i = 0; i < 5; i++) {
      const a = i/5*TAU + t*0.2;
      const r = 70;
      const e = {
        x: w/2 + Math.cos(a)*r, y: h/2 + Math.sin(a)*r,
        radius: 10, hp: 6, maxHp: 18, shape: i%2?'shade':'wisp', flash: 0, statuses: kind==='stormcloud'?['shock']:null,
      };
      drawEnemy(ctx, e, dir, t);
    }
  }
  spellFx[kind](ctx, dir, t, w, h);
}

function renderStatusScene(ctx, w, h, dir, kind, t) {
  drawBg(ctx, w, h, dir, t);
  const statuses = kind === 'all' ? ['slow','ignite','shock'] : [kind];
  const e = {
    x: w/2, y: h/2, radius: 18,
    hp: 24, maxHp: 48, shape: 'husk', flash: 0, statuses,
  };
  drawEnemy(ctx, e, dir, t);
}

/* Full combat stage — multiple enemies + spells */
function renderStage(ctx, w, h, dir, t) {
  drawBg(ctx, w, h, dir, t);

  // Spawn-zone chevrons (top & bottom)
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = dir==='ash'?'#c25a2c':dir==='ink'?'#1a1612':'#ff2e88';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const yT = 12 + i*8 + Math.sin(t*2+i)*2;
    const yB = h - 12 - i*8 - Math.sin(t*2+i)*2;
    ctx.beginPath();
    ctx.moveTo(w/2-10, yT); ctx.lineTo(w/2, yT+5); ctx.lineTo(w/2+10, yT);
    ctx.moveTo(w/2-10, yB); ctx.lineTo(w/2, yB-5); ctx.lineTo(w/2+10, yB);
    ctx.stroke();
  }
  ctx.restore();

  // Enemies marching from top and bottom
  const enemies = [];
  // Top wave
  for (let i = 0; i < 4; i++) {
    const phase = ((t*0.4 + i*0.25) % 1);
    const y = phase * h*0.5;
    const x = w*0.25 + (i%2)*w*0.5 + Math.sin(t+i)*6;
    enemies.push({
      x, y, radius: i===0?10:12, hp: 14-phase*6, maxHp: 18, shape: i===0?'wisp':'shade',
      flash: 0, statuses: phase > 0.5 ? ['ignite'] : null,
    });
  }
  // Bottom wave with husk + swarmling
  for (let i = 0; i < 3; i++) {
    const phase = ((t*0.35 + i*0.3 + 0.5) % 1);
    const y = h - phase * h*0.5;
    const x = w*0.3 + i*w*0.2 + Math.sin(t*1.2+i)*5;
    enemies.push({
      x, y, radius: i===1?18:8, hp: 30-phase*10, maxHp: 48, shape: i===1?'husk':'swarmling',
      flash: 0, statuses: i===1 ? ['slow'] : null,
    });
  }
  // Boss sometimes
  const bossPhase = (t*0.15) % 1;
  if (bossPhase > 0.4) {
    enemies.push({
      x: w*0.7, y: 50 + bossPhase*40, radius: 26,
      hp: 200, maxHp: 320, shape: 'goliath', flash: 0, statuses: null,
    });
  }

  // Wall of flame (sometimes)
  const wallPhase = (t*0.4) % 4;
  if (wallPhase < 1.5) {
    const wallY = h*0.65;
    ctx.save();
    ctx.translate(0, wallY - h*0.5);
    spellFx.wall(ctx, dir, t, w, h);
    ctx.restore();
  }

  // Draw enemies
  for (const e of enemies) drawEnemy(ctx, e, dir, t);

  // Player middle
  const cx = w/2, cy = h*0.55;
  const p = {
    x: cx, y: cy,
    castFlash: 0.4 + 0.4*Math.sin(t*2.5),
    iframes: 0,
  };

  // Ongoing spells anchored at player
  // Lightning bolt to nearest top enemy
  const lflash = (Math.sin(t*4)+1)/2;
  if (lflash > 0.4) {
    const nearest = enemies.filter(e => e.y < cy).sort((a,b)=>Math.hypot(a.x-cx,a.y-cy)-Math.hypot(b.x-cx,b.y-cy))[0];
    if (nearest) {
      const stops = [{x:cx,y:cy}, nearest];
      if (dir === 'ash') {
        ctx.shadowColor='#fff7c0'; ctx.shadowBlur=14;
        ctx.strokeStyle=`rgba(232,208,76,${lflash})`; ctx.lineWidth=2.4;
        ctx.beginPath();
        ctx.moveTo(stops[0].x, stops[0].y);
        const segs = 6;
        for (let i = 1; i < segs; i++) {
          const k = i/segs;
          ctx.lineTo(cx + (nearest.x-cx)*k + Math.sin(t*30+i)*7, cy + (nearest.y-cy)*k + Math.cos(t*25+i)*7);
        }
        ctx.lineTo(nearest.x, nearest.y); ctx.stroke();
        ctx.shadowBlur=0;
      } else if (dir === 'ink') {
        ctx.strokeStyle = '#1a1612'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        for (let i = 1; i < 5; i++) {
          const k = i/5;
          ctx.lineTo(cx + (nearest.x-cx)*k + (i%2?6:-6), cy + (nearest.y-cy)*k + (i%2?-6:6));
        }
        ctx.lineTo(nearest.x, nearest.y); ctx.stroke();
      } else {
        ctx.shadowColor='#5ae5ff'; ctx.shadowBlur=16;
        ctx.strokeStyle='#5ae5ff'; ctx.lineWidth=2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        for (let i = 1; i < 8; i++) {
          const k = i/8;
          ctx.lineTo(cx + (nearest.x-cx)*k + Math.sin(t*40+i)*5, cy + (nearest.y-cy)*k + Math.cos(t*36+i)*5);
        }
        ctx.lineTo(nearest.x, nearest.y); ctx.stroke();
        ctx.shadowBlur=0;
      }
    }
  }

  // Draw player on top
  drawPlayer[dir](ctx, p, t);

  // Floating damage numbers
  for (let i = 0; i < 3; i++) {
    const phase = ((t*0.7 + i*0.4) % 1);
    if (phase > 0.7) continue;
    const dnX = w*0.3 + (i*w*0.2);
    const dnY = h*0.4 - phase*30;
    const a = 1 - phase/0.7;
    if (dir === 'ash') {
      ctx.font = 'bold 14px "Cinzel", serif';
      ctx.fillStyle = `rgba(255,200,80,${a})`;
      ctx.fillText(['16','24','38'][i], dnX, dnY);
    } else if (dir === 'ink') {
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillStyle = `rgba(168,58,44,${a})`;
      ctx.fillText(['16','24','38'][i], dnX, dnY);
    } else {
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.shadowColor = '#5ae5ff'; ctx.shadowBlur = 8;
      ctx.fillText(['16','24','38'][i], dnX, dnY);
      ctx.shadowBlur = 0;
    }
  }

  // HUD strip
  drawHudStrip(ctx, w, h, dir, t);
}

function drawHudStrip(ctx, w, h, dir, t) {
  const hp = 0.78;
  if (dir === 'ash') {
    ctx.fillStyle = 'rgba(20,12,8,0.78)';
    ctx.strokeStyle = 'rgba(255,180,80,0.3)'; ctx.lineWidth = 1;
    roundRect(ctx, 8, 8, w-16, 22, 2, true, true);
    ctx.fillStyle = '#a83118';
    ctx.fillRect(12, 14, (w-24)*hp, 4);
    ctx.fillStyle = '#ff7a3a';
    ctx.fillRect(12, 14, (w-24)*hp, 1);
    ctx.font = '600 8px "JetBrains Mono", monospace';
    ctx.fillStyle = '#9a8a78';
    ctx.fillText('WAVE 07', 12, 28);
    ctx.fillText(`${Math.round(hp*100)}/100`, w-50, 28);
  } else if (dir === 'ink') {
    ctx.fillStyle = '#e8dcc0';
    ctx.strokeStyle = '#1a1612'; ctx.lineWidth = 1;
    ctx.fillRect(8, 8, w-16, 22);
    ctx.strokeRect(8, 8, w-16, 22);
    ctx.fillStyle = '#a83a2c';
    ctx.fillRect(12, 14, (w-24)*hp, 4);
    ctx.strokeRect(12, 14, w-24, 4);
    ctx.font = '700 9px "Cinzel", serif';
    ctx.fillStyle = '#1a1612';
    ctx.fillText('UNDA VII', 12, 28);
    ctx.font = '600 8px "JetBrains Mono", monospace';
    ctx.fillText(`${Math.round(hp*100)}/100`, w-50, 28);
  } else {
    ctx.strokeStyle = '#5ae5ff'; ctx.shadowColor='#5ae5ff'; ctx.shadowBlur=4;
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, w-16, 22);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff2e88';
    ctx.shadowColor='#ff2e88'; ctx.shadowBlur=8;
    ctx.fillRect(12, 14, (w-24)*hp, 4);
    ctx.shadowBlur = 0;
    ctx.font = '600 8px "JetBrains Mono", monospace';
    ctx.fillStyle = '#c8ff5a';
    ctx.fillText('WAVE 07', 12, 28);
    ctx.fillStyle = '#fff';
    ctx.fillText(`${Math.round(hp*100)}`, w-50, 28);
  }
}

/* =====================================================================
   ANIMATION LOOP — register every canvas
   ===================================================================== */
const scenes = [];
function register(canvas, fn) {
  const c = setupCanvas(canvas);
  scenes.push({ canvas, ctx: c.ctx, w: c.w, h: c.h, fn });
}

function init() {
  // Direction picker — scrolls to a section (or just visually emphasises)
  const picker = document.getElementById('picker');
  picker.addEventListener('click', e => {
    const btn = e.target.closest('.pick');
    if (!btn) return;
    [...picker.children].forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    // Scroll to character section to focus
    const dir = btn.dataset.dir;
    const target = document.querySelector(`canvas[data-char="${dir}"]`);
    if (target) target.closest('.stage').scrollIntoView({behavior:'smooth', block:'center'});
  });

  // Heroes
  document.querySelectorAll('canvas[data-hero]').forEach(c => {
    const dir = c.dataset.hero;
    register(c, (ctx,w,h,t) => renderHero(ctx,w,h,dir,t));
  });

  // Characters
  document.querySelectorAll('canvas[data-char]').forEach(c => {
    const dir = c.dataset.char;
    register(c, (ctx,w,h,t) => renderCharScene(ctx,w,h,dir,t));
  });

  // Enemies
  document.querySelectorAll('canvas[data-enemy]').forEach(c => {
    const dir = c.dataset.dir, kind = c.dataset.enemy;
    register(c, (ctx,w,h,t) => renderEnemyScene(ctx,w,h,dir,kind,t));
  });

  // Spells
  document.querySelectorAll('canvas[data-spell]').forEach(c => {
    const dir = c.dataset.dir, kind = c.dataset.spell;
    register(c, (ctx,w,h,t) => renderSpellScene(ctx,w,h,dir,kind,t));
  });

  // Statuses
  document.querySelectorAll('canvas[data-status]').forEach(c => {
    const dir = c.dataset.dir, kind = c.dataset.status;
    register(c, (ctx,w,h,t) => renderStatusScene(ctx,w,h,dir,kind,t));
  });

  // Stages
  document.querySelectorAll('canvas[data-stage]').forEach(c => {
    const dir = c.dataset.stage;
    register(c, (ctx,w,h,t) => renderStage(ctx,w,h,dir,t));
  });

  // HUD
  document.querySelectorAll('canvas[data-hud]').forEach(c => {
    const dir = c.dataset.hud;
    register(c, (ctx,w,h,t) => drawHud(ctx,dir,t,w,h));
  });

  // Resize observer to keep canvases sharp
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
  function loop() {
    const t = (performance.now() - start) / 1000;
    for (const s of scenes) {
      // Skip offscreen panels for perf
      const r = s.canvas.getBoundingClientRect();
      if (r.bottom < -50 || r.top > window.innerHeight + 50) continue;
      s.ctx.clearRect(0, 0, s.w, s.h);
      s.fn(s.ctx, s.w, s.h, t);
    }
    requestAnimationFrame(loop);
  }
  loop();
}

window.addEventListener('load', init);
