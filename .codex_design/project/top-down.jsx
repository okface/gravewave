// Top-down vertical (phone) variants of CRYPT.GB, Sumi & Grave, NecroTerm.
// All draw with the same Canvas2D ops the existing Renderer uses — feasible
// to drop into index.html under `const Renderer = { ... }` per-spell methods.

const { useEffect: tdUseEffect, useRef: tdUseRef } = React;

function tdCanvas({ w, h, pixel = false, scale = 4 }, draw) {
  const ref = tdUseRef(null);
  tdUseEffect(() => {
    const c = ref.current; if (!c) return;
    if (pixel) {
      c.width = w; c.height = h;
      c.style.width = (w * scale) + 'px'; c.style.height = (h * scale) + 'px';
      c.style.imageRendering = 'pixelated';
      const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
      let raf, t0 = performance.now();
      const loop = (now) => { draw(ctx, w, h, (now - t0) / 1000); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
    }
    const dpr = window.devicePixelRatio || 1;
    c.width = w * dpr; c.height = h * dpr;
    c.style.width = w + 'px'; c.style.height = h + 'px';
    const ctx = c.getContext('2d');
    let raf, t0 = performance.now();
    const loop = (now) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(ctx, w, h, (now - t0) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, []);
  return ref;
}

// Phone frame (portrait) — black bezel, status bar, home indicator
function Phone({ children, screenBg = '#000', label, sub, statusFg = '#fff' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 16 }}>
      <div style={{
        width: 410, height: 820, padding: 12, borderRadius: 48,
        background: 'linear-gradient(180deg,#1a1a1a,#0a0a0a)',
        boxShadow: '0 30px 80px rgba(0,0,0,.55), inset 0 0 0 1.5px rgba(255,255,255,.05)',
        position: 'relative',
      }}>
        <div style={{
          width: '100%', height: '100%', borderRadius: 36, overflow: 'hidden',
          position: 'relative', background: screenBg,
        }}>
          {/* dynamic island */}
          <div style={{
            position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
            width: 110, height: 32, background: '#000', borderRadius: 18, zIndex: 30,
          }} />
          {/* status bar */}
          <div style={{
            position: 'absolute', top: 16, left: 28, right: 28,
            display: 'flex', justifyContent: 'space-between',
            color: statusFg, fontSize: 14, fontWeight: 600,
            fontFamily: 'ui-rounded, -apple-system, "SF Pro", sans-serif',
            zIndex: 25, letterSpacing: '0.02em',
          }}>
            <span>23:14</span>
            <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11 }}>●●●</span>
              <span style={{ fontSize: 11 }}>5G</span>
              <span>▮</span>
            </span>
          </div>
          {children}
          <div style={{
            position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
            width: 130, height: 5, borderRadius: 3, background: statusFg, opacity: 0.5, zIndex: 25,
          }} />
        </div>
      </div>
      <div style={{ textAlign: 'center', color: '#cdb', fontFamily: 'ui-sans-serif, system-ui', fontSize: 12, opacity: 0.85 }}>
        <div style={{ fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ opacity: 0.6, marginTop: 3 }}>{sub}</div>
      </div>
    </div>
  );
}

// ===================================================================
// 1. CRYPT.GB — top-down pixel (auto-attacking wizard, swarm of zombies)
// ===================================================================
const TPX = {
  bg0: '#1a1334', bg1: '#2a1844', floor: '#3b2358', floor2: '#4a2a68',
  ink: '#0a0420', rose: '#d8528a', peach: '#f1bc8a', cream: '#fff5d1',
  mint: '#7be0c8', lime: '#9af04a',
};

function tdPxWizard(ctx, x, y, t) {
  // top-down: hat cone visible from above + robe shoulders
  // brim outer ring (12 wide, 10 tall ellipse-ish in pixels)
  ctx.fillStyle = TPX.ink;
  ctx.fillRect(x - 5, y - 4, 10, 1);
  ctx.fillRect(x - 6, y - 3, 12, 2);
  ctx.fillRect(x - 5, y - 1, 10, 1);
  // robe shoulders (a bit wider than brim, behind body)
  ctx.fillStyle = TPX.rose;
  ctx.fillRect(x - 7, y, 14, 5);
  ctx.fillRect(x - 6, y + 5, 12, 1);
  // robe inner shadow
  ctx.fillStyle = TPX.ink;
  ctx.fillRect(x - 4, y + 1, 8, 3);
  // hat tip (highlight)
  ctx.fillStyle = TPX.peach;
  ctx.fillRect(x - 1, y - 3, 2, 2);
  // staff hand emanating
  ctx.fillStyle = TPX.peach; ctx.fillRect(x + 6, y + 2, 1, 1);
  ctx.fillStyle = TPX.mint; ctx.fillRect(x + 7, y + 1, 1, 2);
  // cast flash
  if (Math.sin(t * 6) > 0.85) {
    ctx.fillStyle = TPX.cream;
    ctx.fillRect(x - 8, y - 5, 16, 1); ctx.fillRect(x - 8, y + 6, 16, 1);
    ctx.fillRect(x - 9, y, 1, 6); ctx.fillRect(x + 8, y, 1, 6);
  }
}

function tdPxZombie(ctx, x, y, t, seed = 0) {
  const sway = Math.floor((t * 3 + seed) % 2);
  // shoulders
  ctx.fillStyle = '#5a8b3a';
  ctx.fillRect(x - 4, y - 1, 8, 4);
  ctx.fillRect(x - 5, y, 10, 2);
  // head from above (skull-ish)
  ctx.fillStyle = '#7eb05a';
  ctx.fillRect(x - 2, y - 2, 4, 3);
  ctx.fillStyle = TPX.rose;
  ctx.fillRect(x - 1, y - 1, 1, 1); ctx.fillRect(x + 1, y - 1, 1, 1);
  // arms reaching out (sway)
  ctx.fillStyle = '#5a8b3a';
  if (sway) { ctx.fillRect(x - 6, y, 1, 2); ctx.fillRect(x + 5, y + 1, 1, 2); }
  else      { ctx.fillRect(x - 6, y + 1, 1, 2); ctx.fillRect(x + 5, y, 1, 2); }
  // shadow under
  ctx.fillStyle = TPX.ink; ctx.fillRect(x - 4, y + 3, 8, 1);
}

function CryptGBTopDown() {
  // internal canvas 100w × 180h, scale 4 → 400×720 visible
  const W = 100, H = 180;
  const ref = tdCanvas({ w: W, h: H, pixel: true, scale: 4 }, (ctx, w, h, t) => {
    // checkerboard floor
    for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 8) {
      ctx.fillStyle = ((x + y) / 8) % 2 ? TPX.floor : TPX.floor2;
      ctx.fillRect(x, y, 8, 8);
    }
    // pebble noise
    for (let i = 0; i < 80; i++) {
      const px = (i * 13) % w, py = (i * 23) % h;
      ctx.fillStyle = i % 5 ? TPX.bg1 : TPX.bg0;
      ctx.fillRect(px, py, 1, 1);
    }
    // tombstones
    [[18, 28], [82, 38], [12, 110], [88, 130], [50, 22]].forEach(([gx, gy]) => {
      ctx.fillStyle = TPX.ink; ctx.fillRect(gx - 2, gy - 1, 5, 5);
      ctx.fillStyle = '#5a4a72'; ctx.fillRect(gx - 2, gy - 1, 5, 1); ctx.fillRect(gx - 2, gy + 3, 5, 1);
    });

    // player center
    const px = 50, py = 110;

    // ENEMIES — orbital pool spawning from edges, walking toward player
    const enemies = [];
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 + t * 0.3;
      const r0 = 70 + ((i * 11 + t * 14) % 30);
      const r = r0 - ((t * 6 + i * 4) % 70);
      const ex = px + Math.cos(a) * r, ey = py + Math.sin(a) * r;
      if (ex > 6 && ex < w - 6 && ey > 14 && ey < h - 18 && r > 16) enemies.push({ x: ex, y: ey, i });
    }
    enemies.forEach((e) => tdPxZombie(ctx, Math.round(e.x), Math.round(e.y), t, e.i));

    // FIREBALL — auto-cast every 1.0s at nearest enemy
    const phase = (t % 1.0) / 1.0;
    if (enemies.length) {
      const seed = Math.floor(t / 1.0) % enemies.length;
      const tgt = enemies[seed] || enemies[0];
      if (phase < 0.65) {
        const u = phase / 0.65;
        const fx = px + (tgt.x - px) * u, fy = py + (tgt.y - py) * u;
        for (let k = 0; k < 6; k++) {
          const u2 = Math.max(0, u - k * 0.06);
          const tx = px + (tgt.x - px) * u2, ty = py + (tgt.y - py) * u2;
          ctx.fillStyle = k < 1 ? TPX.cream : k < 3 ? TPX.peach : k < 5 ? TPX.rose : TPX.bg1;
          ctx.fillRect(Math.round(tx) - 1, Math.round(ty) - 1, 2, 2);
        }
        ctx.fillStyle = TPX.cream; ctx.fillRect(Math.round(fx), Math.round(fy), 1, 1);
      } else {
        const u = (phase - 0.65) / 0.35;
        const r = Math.round(2 + u * 5);
        ctx.fillStyle = TPX.peach; ctx.fillRect(tgt.x - r, tgt.y - r, r * 2, r * 2);
        ctx.fillStyle = TPX.cream; ctx.fillRect(tgt.x - r + 1, tgt.y - r + 1, r * 2 - 2, r * 2 - 2);
      }
    }

    // CHAIN LIGHTNING — every 1.6s, hits 3 nearest in chain
    const lphase = ((t + 0.4) % 1.6) / 1.6;
    if (lphase < 0.18 && enemies.length >= 2) {
      const sorted = [...enemies].sort((a, b) => Math.hypot(a.x - px, a.y - py) - Math.hypot(b.x - px, b.y - py));
      const chain = [{ x: px, y: py }, sorted[0], sorted[1] || sorted[0]];
      for (let i = 0; i < chain.length - 1; i++) {
        const a = chain[i], b = chain[i + 1];
        ctx.fillStyle = (Math.floor(t * 60) % 2) ? TPX.cream : TPX.mint;
        const steps = 6;
        for (let s = 0; s <= steps; s++) {
          const u = s / steps;
          const jx = a.x + (b.x - a.x) * u + ((s * 13) % 5 - 2);
          const jy = a.y + (b.y - a.y) * u + ((s * 17) % 5 - 2);
          ctx.fillRect(Math.round(jx), Math.round(jy), 1, 1);
        }
      }
    }

    // PLAYER on top
    tdPxWizard(ctx, px, py, t);

    // HUD top — heart pips + xp
    ctx.fillStyle = TPX.ink; ctx.fillRect(0, 0, w, 12);
    for (let i = 0; i < 5; i++) {
      const hx = 4 + i * 7;
      ctx.fillStyle = i < 4 ? TPX.rose : TPX.bg1;
      ctx.fillRect(hx, 4, 4, 3); ctx.fillRect(hx + 1, 3, 1, 1); ctx.fillRect(hx + 2, 3, 1, 1); ctx.fillRect(hx + 1, 7, 2, 1);
    }
    ctx.fillStyle = TPX.bg1; ctx.fillRect(40, 4, 30, 3);
    ctx.fillStyle = TPX.lime; ctx.fillRect(40, 4, 18, 3);
    ctx.fillStyle = TPX.cream; drawTPxText(ctx, 'WAVE 03', 76, 4);

    // HUD bottom — ability slots
    ctx.fillStyle = TPX.ink; ctx.fillRect(0, h - 16, w, 16);
    [[6, TPX.peach, 'F'], [22, TPX.mint, 'C'], [38, TPX.bg1, '?']].forEach(([sx, col, ch]) => {
      ctx.fillStyle = col; ctx.fillRect(sx, h - 13, 12, 12);
      ctx.fillStyle = TPX.ink; ctx.fillRect(sx + 1, h - 12, 10, 10);
      ctx.fillStyle = col; drawTPxText(ctx, ch, sx + 5, h - 9);
    });
    ctx.fillStyle = TPX.cream; drawTPxText(ctx, 'PTS 2', 76, h - 9);

    // scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let yy = 0; yy < h; yy += 2) ctx.fillRect(0, yy, w, 1);
  });
  return <canvas ref={ref} style={{ display: 'block' }} />;
}

const T_GLYPHS = {
  '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'], '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'], '9': ['111', '101', '111', '001', '111'],
  'A': ['111', '101', '111', '101', '101'], 'V': ['101', '101', '101', '101', '010'],
  'E': ['111', '100', '110', '100', '111'], 'W': ['101', '101', '101', '111', '101'],
  'L': ['100', '100', '100', '100', '111'], 'P': ['111', '101', '111', '100', '100'],
  'T': ['111', '010', '010', '010', '010'], 'S': ['111', '100', '111', '001', '111'],
  'F': ['111', '100', '110', '100', '100'], 'C': ['111', '100', '100', '100', '111'],
  '?': ['111', '001', '010', '000', '010'], '.': ['000', '000', '000', '000', '010'],
  ' ': ['000', '000', '000', '000', '000'],
};
function drawTPxText(ctx, s, x, y) {
  for (let i = 0; i < s.length; i++) {
    const g = T_GLYPHS[s[i]] || T_GLYPHS[' '];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++)
      if (g[r][c] === '1') ctx.fillRect(x + i * 4 + c, y + r, 1, 1);
  }
}

window.CryptGBTopDownCard = function () {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at top, #2a1844 0%, #0a0420 70%)' }}>
      <Phone screenBg="#0a0420" statusFg="#fff5d1"
        label="CRYPT.GB · top-down" sub="auto-attack · 4-bit twilight · 100×180 px buffer">
        <div style={{ position: 'absolute', inset: 0, top: 56, bottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CryptGBTopDown />
        </div>
      </Phone>
    </div>
  );
};

// ===================================================================
// 2. SUMI & GRAVE — top-down ink-wash
// ===================================================================
function SumiTopDown() {
  const W = 380, H = 740;
  const ref = tdCanvas({ w: W, h: H }, (ctx, w, h, t) => {
    // parchment
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, h * 0.7);
    g.addColorStop(0, '#f5ecd2'); g.addColorStop(1, '#d9c89c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // grain
    for (let i = 0; i < 1400; i++) {
      const x = (i * 73) % w, y = (i * 131) % h;
      ctx.fillStyle = `rgba(70,50,30,${(i % 7) / 100 + 0.02})`;
      ctx.fillRect(x, y, 1, 1);
    }

    // player center
    const px = w / 2, py = h / 2;

    // ink-blot floor patches
    [[80, 200, 60, 0.08], [300, 150, 70, 0.06], [120, 580, 90, 0.07], [280, 620, 50, 0.05], [200, 380, 110, 0.04]]
      .forEach(([cx, cy, r, a]) => {
        ctx.fillStyle = `rgba(20,15,10,${a})`;
        ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
      });

    // ENEMIES — ghost wisps from above. circle around then drift in.
    const ghosts = [];
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3 + t * 0.25;
      const r = 280 - ((t * 22 + i * 30) % 240);
      const ex = px + Math.cos(a) * r, ey = py + Math.sin(a) * r;
      const wob = Math.sin(t * 3 + i) * 4;
      if (r > 50) ghosts.push({ x: ex + wob, y: ey, i, r });
    }
    ghosts.forEach((g) => {
      ctx.fillStyle = 'rgba(20,15,10,0.5)';
      ctx.beginPath(); ctx.ellipse(g.x, g.y + 6, 18, 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(g.x, g.y, 22, 22, 0, 0, Math.PI * 2); ctx.fill();
      // wispy tail
      ctx.fillStyle = 'rgba(20,15,10,0.25)';
      ctx.beginPath(); ctx.ellipse(g.x, g.y + 18, 10, 10, 0, 0, Math.PI * 2); ctx.fill();
      // eyes
      ctx.fillStyle = '#f5ecd2';
      ctx.beginPath(); ctx.arc(g.x - 6, g.y - 2, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(g.x + 6, g.y - 2, 2, 0, Math.PI * 2); ctx.fill();
    });

    // FIREBALL — every 1.6s at nearest ghost
    const phase = (t % 1.6) / 1.6;
    if (ghosts.length) {
      const seed = Math.floor(t / 1.6);
      const target = ghosts.sort((a, b) => Math.hypot(a.x - px, a.y - py) - Math.hypot(b.x - px, b.y - py))[seed % Math.min(2, ghosts.length)];
      if (phase < 0.7) {
        const u = phase / 0.7;
        const fx = px + (target.x - px) * u, fy = py + (target.y - py) * u;
        // trail
        for (let k = 0; k < 8; k++) {
          const u2 = Math.max(0, u - k * 0.05);
          const tx = px + (target.x - px) * u2, ty = py + (target.y - py) * u2;
          ctx.globalAlpha = 0.85 - k * 0.10;
          ctx.fillStyle = k < 2 ? '#c2402a' : '#1a120a';
          ctx.beginPath(); ctx.arc(tx, ty, 4 + k * 0.4, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        // enso ring head
        ctx.strokeStyle = '#c2402a'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(fx, fy, 9, 0.3, Math.PI * 1.8); ctx.stroke();
      } else {
        const u = (phase - 0.7) / 0.3;
        // splatter
        for (let k = 0; k < 24; k++) {
          const a = (k * 137.5 + Math.floor(t)) * Math.PI / 180;
          const d = ((k * 7 + Math.floor(t * 3)) % 100) / 100 * (20 + u * 28);
          ctx.globalAlpha = 0.5 + (k % 5) / 10;
          ctx.fillStyle = k % 3 ? '#c2402a' : '#1a120a';
          ctx.beginPath(); ctx.arc(target.x + Math.cos(a) * d, target.y + Math.sin(a) * d, 1 + (k % 4) * 0.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }

    // CHAIN LIGHTNING — every 2.4s, dry-brush jagged
    const lphase = ((t + 0.7) % 2.4) / 2.4;
    if (lphase < 0.22 && ghosts.length >= 2) {
      const sorted = [...ghosts].sort((a, b) => Math.hypot(a.x - px, a.y - py) - Math.hypot(b.x - px, b.y - py));
      const chain = [{ x: px, y: py }, sorted[0], sorted[1] || sorted[0], sorted[2] || sorted[0]];
      ctx.strokeStyle = '#1a120a';
      for (let i = 0; i < chain.length - 1; i++) {
        const a = chain[i], b = chain[i + 1];
        for (let layer = 0; layer < 3; layer++) {
          ctx.globalAlpha = 0.4 + layer * 0.18; ctx.lineWidth = 4 - layer * 1.1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          for (let s = 1; s < 8; s++) {
            const u = s / 8;
            const jx = a.x + (b.x - a.x) * u + ((s * 13 + i * 7 + Math.floor(t * 30)) % 19 - 9);
            const jy = a.y + (b.y - a.y) * u + ((s * 17 + i * 11 + Math.floor(t * 30)) % 19 - 9);
            ctx.lineTo(jx, jy);
          }
          ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    }

    // PLAYER — top-down brush mark
    const sway = Math.sin(t * 1.5) * 2;
    // robe shoulders (translucent ink)
    ctx.fillStyle = 'rgba(26,18,10,0.85)';
    ctx.beginPath(); ctx.ellipse(px + sway, py, 26, 22, 0, 0, Math.PI * 2); ctx.fill();
    // hat brim (dense)
    ctx.fillStyle = '#0e0a05';
    ctx.beginPath(); ctx.arc(px + sway, py - 2, 16, 0, Math.PI * 2); ctx.fill();
    // hat tip dot
    ctx.fillStyle = '#1a120a';
    ctx.beginPath(); ctx.arc(px + sway + 1, py - 5, 5, 0, Math.PI * 2); ctx.fill();
    // staff hand emerging
    ctx.strokeStyle = '#1a120a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(px + sway + 14, py + 4); ctx.lineTo(px + sway + 30, py + 16); ctx.stroke();
    // staff orb (vermillion)
    ctx.fillStyle = '#c2402a';
    ctx.beginPath(); ctx.arc(px + sway + 32, py + 18, 5 + Math.sin(t * 5), 0, Math.PI * 2); ctx.fill();
    // ground shadow
    ctx.fillStyle = 'rgba(20,15,10,0.18)';
    ctx.beginPath(); ctx.ellipse(px, py + 22, 28, 6, 0, 0, Math.PI * 2); ctx.fill();

    // calligraphic title top + seal
    ctx.fillStyle = '#1a120a';
    ctx.font = '700 22px "Cormorant Garamond", serif';
    ctx.fillText('墓 · GRAVEWAVE', 24, 78);
    ctx.font = 'italic 12px "Cormorant Garamond", serif';
    ctx.fillStyle = 'rgba(26,18,10,0.6)';
    ctx.fillText('the ink remembers', 24, 96);

    // vermillion seal
    ctx.fillStyle = '#c2402a'; ctx.fillRect(w - 56, 64, 36, 36);
    ctx.fillStyle = '#f5ecd2';
    ctx.font = 'bold 14px "Cormorant Garamond", serif';
    ctx.textAlign = 'center';
    ctx.fillText('巫', w - 38, 82); ctx.fillText('術', w - 38, 96);
    ctx.textAlign = 'left';

    // HP bar (ink wash)
    ctx.fillStyle = 'rgba(26,18,10,0.18)'; ctx.fillRect(24, 110, 200, 4);
    ctx.fillStyle = '#1a120a'; ctx.fillRect(24, 110, 140, 4);
    ctx.fillStyle = '#c2402a'; ctx.fillRect(24, 110, 70, 4);
    ctx.font = '11px "Cormorant Garamond", serif'; ctx.fillStyle = 'rgba(26,18,10,0.7)';
    ctx.fillText('血 · 64 / 100', 24, 128);

    // bottom HUD: ability marks
    ['火', '雷', '?'].forEach((ch, i) => {
      const sx = 24 + i * 64, sy = h - 70;
      ctx.fillStyle = i === 2 ? 'rgba(26,18,10,0.15)' : '#1a120a';
      ctx.fillRect(sx, sy, 50, 50);
      ctx.fillStyle = '#f5ecd2';
      ctx.font = '700 22px "Cormorant Garamond", serif';
      ctx.textAlign = 'center';
      ctx.fillText(ch, sx + 25, sy + 32);
    });
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(26,18,10,0.65)';
    ctx.font = 'italic 12px "Cormorant Garamond", serif';
    ctx.fillText('波 · WAVE 03 · LV.04', 200, h - 40);
  });
  return <canvas ref={ref} style={{ display: 'block' }} />;
}

window.SumiGraveTopDownCard = function () {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at top, #d9c89c 0%, #8a7a52 70%)' }}>
      <Phone screenBg="#e9dcb6" statusFg="#1a120a"
        label="Sumi & Grave · top-down" sub="brush + ink wash · vermillion seal · paper grain">
        <div style={{ position: 'absolute', inset: 0, top: 56, bottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SumiTopDown />
        </div>
      </Phone>
    </div>
  );
};

// ===================================================================
// 4. NECROTERM — top-down ASCII roguelike
// ===================================================================
function NecroTermTopDown() {
  const W = 380, H = 740;
  const COLS = 22, CW = 16;
  const TOP = 80, BOT = 100;
  const ROWS = Math.floor((H - TOP - BOT) / CW);
  const ref = tdCanvas({ w: W, h: H }, (ctx, w, h, t) => {
    ctx.fillStyle = '#0a0d10'; ctx.fillRect(0, 0, w, h);
    // scanlines
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);

    ctx.font = '14px "JetBrains Mono", "IBM Plex Mono", monospace';
    ctx.textBaseline = 'top';

    const padX = (w - COLS * CW) / 2;
    const cell = (col, row) => [padX + col * CW, TOP + row * CW];
    const put = (col, row, s, color = '#e8e4d8') => {
      if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
      ctx.fillStyle = color;
      const [x, y] = cell(col, row);
      ctx.fillText(s, x, y);
    };

    // top header
    ctx.fillStyle = '#9aa0a6'; ctx.font = '13px "JetBrains Mono", monospace';
    ctx.fillText('gravewave://run · WAVE 03', padX, 56);
    ctx.fillText('LV.04 · PTS 2', w - padX - 100, 56);
    ctx.font = '14px "JetBrains Mono", monospace';

    // floor: dots and commas
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const seed = (r * 31 + c * 17) % 13;
      if (seed === 0) put(c, r, '·', '#22272e');
      else if (seed === 4) put(c, r, ',', '#1c2128');
    }
    // tombstones decoration (deterministic positions)
    [[3, 4, 't'], [16, 6, 'T'], [5, 22, 't'], [18, 24, 'T'], [10, 30, 't'], [2, 14, 'T']].forEach(([c, r, ch]) => {
      if (r < ROWS) put(c, r, ch, '#4a525a');
    });

    // PLAYER center
    const pc = Math.floor(COLS / 2), pr = Math.floor(ROWS / 2);

    // ENEMIES: spawn around edges, walk inward
    const enemies = [];
    for (let i = 0; i < 7; i++) {
      const a = i * (Math.PI * 2 / 7) + t * 0.18;
      const r0 = 14 - ((t * 0.9 + i * 1.7) % 12);
      if (r0 < 1.4) continue;
      const ec = pc + Math.cos(a) * r0;
      const er = pr + Math.sin(a) * r0;
      enemies.push({ c: Math.round(ec), r: Math.round(er), i });
    }
    enemies.forEach(({ c, r, i }) => {
      const ch = i % 2 ? 'Z' : 'z';
      const col = i % 2 ? '#7eb05a' : '#5a8b3a';
      put(c, r, ch, col);
    });

    // FIREBALL toward nearest, every 1.0s
    const phase = (t % 1.0) / 1.0;
    if (enemies.length) {
      const sorted = [...enemies].sort((a, b) => Math.hypot(a.c - pc, a.r - pr) - Math.hypot(b.c - pc, b.r - pr));
      const tgt = sorted[0];
      if (phase < 0.85) {
        const u = phase / 0.85;
        const fc = pc + (tgt.c - pc) * u;
        const fr = pr + (tgt.r - pr) * u;
        const cci = Math.floor(t * 14) % 5;
        put(Math.round(fc), Math.round(fr), ['~', '*', '◆', '*', '~'][cci], '#ff8844');
        // trail
        for (let k = 1; k < 3; k++) {
          const u2 = Math.max(0, u - k * 0.08);
          const tc = pc + (tgt.c - pc) * u2;
          const tr = pr + (tgt.r - pr) * u2;
          put(Math.round(tc), Math.round(tr), '.', '#cc5522');
        }
      } else {
        const burst = Math.floor((phase - 0.85) * 30) % 2;
        put(tgt.c - 1, tgt.r - 1, burst ? '\\' : '/', '#ff8844');
        put(tgt.c + 1, tgt.r - 1, burst ? '/' : '\\', '#ff8844');
        put(tgt.c, tgt.r, '*', '#ffcc66');
        put(tgt.c - 1, tgt.r + 1, burst ? '/' : '\\', '#ff8844');
        put(tgt.c + 1, tgt.r + 1, burst ? '\\' : '/', '#ff8844');
      }
    }

    // CHAIN LIGHTNING every 2.0s
    const lphase = ((t + 0.5) % 2.0) / 2.0;
    if (lphase < 0.22 && enemies.length >= 2) {
      const sorted = [...enemies].sort((a, b) => Math.hypot(a.c - pc, a.r - pr) - Math.hypot(b.c - pc, b.r - pr));
      const chain = [{ c: pc, r: pr }, sorted[0], sorted[1] || sorted[0]];
      for (let i = 0; i < chain.length - 1; i++) {
        const a = chain[i], b = chain[i + 1];
        const dist = Math.max(Math.abs(b.c - a.c), Math.abs(b.r - a.r));
        for (let s = 1; s < dist; s++) {
          const u = s / dist;
          const cc = Math.round(a.c + (b.c - a.c) * u);
          const rr = Math.round(a.r + (b.r - a.r) * u);
          const dx = b.c - a.c, dy = b.r - a.r;
          const ch = Math.abs(dx) > Math.abs(dy) ? '─' : (dx * dy > 0 ? '\\' : '/');
          put(cc, rr, ch, '#9af0ff');
        }
      }
      put(sorted[0].c, sorted[0].r, '⚡', '#9af0ff');
      if (sorted[1]) put(sorted[1].c, sorted[1].r, '⚡', '#9af0ff');
    }

    // PLAYER on top
    put(pc, pr, '@', '#fce96a');
    // cast flash
    if (Math.sin(t * 8) > 0.85) {
      put(pc - 1, pr, '·', '#fce96a'); put(pc + 1, pr, '·', '#fce96a');
      put(pc, pr - 1, '·', '#fce96a'); put(pc, pr + 1, '·', '#fce96a');
    }

    // bottom HUD
    ctx.font = '13px "JetBrains Mono", monospace';
    const baseY = h - BOT + 8;
    ctx.fillStyle = '#9aa0a6';
    ctx.fillText('HP', padX, baseY);
    ctx.fillStyle = '#3b4046'; ctx.fillRect(padX + 28, baseY + 3, 220, 8);
    ctx.fillStyle = '#ff6644'; ctx.fillRect(padX + 28, baseY + 3, 140, 8);
    ctx.fillStyle = '#9aa0a6'; ctx.fillText('64/100', padX + 256, baseY);
    ctx.fillStyle = '#9aa0a6'; ctx.fillText('XP', padX, baseY + 18);
    const xpFill = Math.round((Math.sin(t * 0.5) * 0.3 + 0.5) * 220);
    ctx.fillStyle = '#3b4046'; ctx.fillRect(padX + 28, baseY + 21, 220, 8);
    ctx.fillStyle = '#6cd4a4'; ctx.fillRect(padX + 28, baseY + 21, xpFill, 8);
    ctx.fillStyle = '#9aa0a6'; ctx.fillText('PTS·2', padX + 256, baseY + 18);

    // ability slots
    const slY = baseY + 42;
    [['╳', 'FIREBALL', '#fce96a', '●●●○○'],
     ['⚡', 'CHAIN_LT', '#9af0ff', '●○○○○'],
     ['◇', '——————', '#5a6068', '○○○○○']].forEach(([icon, name, col, pips], i) => {
      const sx = padX + i * 110;
      ctx.fillStyle = col; ctx.fillText(icon, sx, slY);
      ctx.fillStyle = col; ctx.font = '11px "JetBrains Mono", monospace'; ctx.fillText(name, sx + 14, slY + 2);
      ctx.fillStyle = col; ctx.fillText(pips, sx + 14, slY + 16);
      ctx.font = '13px "JetBrains Mono", monospace';
    });

    // CRT vignette
    const v = ctx.createRadialGradient(w / 2, h / 2, w * 0.4, w / 2, h / 2, w);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
  });
  return <canvas ref={ref} style={{ display: 'block' }} />;
}

window.NecroTermTopDownCard = function () {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at top, #1a2028 0%, #050709 70%)' }}>
      <Phone screenBg="#0a0d10" statusFg="#e8e4d8"
        label="NECROTERM · top-down" sub="ASCII roguelike · @ centred · monospace 14px">
        <div style={{ position: 'absolute', inset: 0, top: 56, bottom: 8 }}>
          <NecroTermTopDown />
        </div>
      </Phone>
    </div>
  );
};

// ===================================================================
// Feasibility note artboard (text)
// ===================================================================
window.FeasibilityCard = function () {
  return (
    <div style={{
      width: '100%', height: '100%', padding: '40px 48px', boxSizing: 'border-box',
      background: '#1a1714', color: '#cfc8b8',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      fontSize: 15, lineHeight: 1.55, overflow: 'auto',
    }}>
      <div style={{ fontSize: 11, letterSpacing: '0.3em', opacity: 0.5, textTransform: 'uppercase' }}>Read me</div>
      <h1 style={{ fontSize: 28, margin: '6px 0 18px', fontWeight: 600, letterSpacing: '-0.01em' }}>Will it look like this on my phone?</h1>

      <p><b style={{ color: '#fce96a' }}>Yes — all three are feasible</b> in your current single-file engine. They use only Canvas2D primitives that <code style={mono}>Renderer</code> already calls (<code style={mono}>fillRect</code>, <code style={mono}>arc</code>, <code style={mono}>bezierCurveTo</code>, <code style={mono}>fillText</code>). No WebGL, no extra deps.</p>

      <h3 style={h3}>CRYPT.GB</h3>
      <p>Easiest port. Render once into a tiny offscreen canvas (~100×180), then <code style={mono}>drawImage</code> it scaled with <code style={mono}>imageSmoothingEnabled = false</code>. Sprites are pure <code style={mono}>fillRect</code> arrays. Fastest of the three on phones.</p>

      <h3 style={h3}>Sumi & Grave</h3>
      <p>Mid cost. Brush strokes are layered translucent strokes; ink splatters are deterministic <code style={mono}>arc</code> calls. Splatter count scales with on-screen events — keep budget ≤ 30 dots/frame. Cache the parchment grain into an offscreen canvas once.</p>

      <h3 style={h3}>NECROTERM</h3>
      <p>Cheap. <code style={mono}>fillText</code> per cell, ~22×35 grid = ~770 chars/frame. Modern phones handle this comfortably; worst case batch by color to reduce <code style={mono}>fillStyle</code> changes.</p>

      <h3 style={h3}>What I’d actually drop into <code style={mono}>index.html</code></h3>
      <ul style={{ paddingLeft: 18 }}>
        <li>One <code style={mono}>StyleTheme</code> object (palette + font + tile size).</li>
        <li>Replace <code style={mono}>drawBackground</code>, <code style={mono}>drawWizard</code>, <code style={mono}>drawEnemy</code>, <code style={mono}>drawFireball</code>, <code style={mono}>drawLightnings</code> per theme — same signatures.</li>
        <li>HUD/CSS overlay swappable via a <code style={mono}>data-theme</code> attribute on <code style={mono}>&lt;body&gt;</code>.</li>
      </ul>

      <p style={{ marginTop: 22, opacity: 0.7, fontStyle: 'italic' }}>Pick one and I’ll wire it into the actual <code style={mono}>Renderer</code> — Tier 2 / Tier 3 ability visuals included from the VISUALS.md backlog.</p>
    </div>
  );
};
const mono = { fontFamily: '"JetBrains Mono", monospace', fontSize: 13, background: 'rgba(255,255,255,.06)', padding: '1px 5px', borderRadius: 3 };
const h3 = { fontSize: 16, fontWeight: 600, margin: '20px 0 6px', color: '#fce96a', letterSpacing: '0.04em' };
