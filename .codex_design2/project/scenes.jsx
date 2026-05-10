// 5 design directions for Gravewave.
// Each scene draws a tiny game moment: wizard + spell + enemy.
// All exported on window so design-canvas slots can use them.

const { useEffect, useRef, useState } = React;

// ===================================================================
// Shared canvas hook — handles dpr or pixel-art scaling
// ===================================================================
function useCanvas({ w, h, pixel = false, scale = 3 }, draw) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    if (pixel) {
      c.width = w; c.height = h;
      c.style.width = (w * scale) + 'px';
      c.style.height = (h * scale) + 'px';
      c.style.imageRendering = 'pixelated';
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      let raf, t0 = performance.now();
      const loop = (now) => { draw(ctx, w, h, (now - t0) / 1000); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(raf);
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
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return ref;
}

// Re-usable card frame for each style
function StyleCard({ palette, accent, fontFamily, name, tagline, children, swatches, typeSample }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: palette.bg, color: palette.fg,
      fontFamily,
    }}>
      <div style={{
        padding: '18px 22px 10px',
        borderBottom: `1px solid ${palette.divider}`,
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: name.spacing || '0.02em' }}>{name.title}</div>
          <div style={{ fontSize: 11, marginTop: 4, opacity: 0.6, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{tagline}</div>
        </div>
        <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: '0.12em' }}>WAVE 03 · LV.04</div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
        {children}
      </div>

      <div style={{ padding: '12px 22px 16px', borderTop: `1px solid ${palette.divider}`, display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {swatches.map((sw, i) => (
            <div key={i} title={sw} style={{ width: 22, height: 22, borderRadius: 4, background: sw, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.12)' }} />
          ))}
        </div>
        <div style={{ flex: 1, fontSize: 11, opacity: 0.7, letterSpacing: '0.05em' }}>{typeSample}</div>
      </div>
    </div>
  );
}

// ===================================================================
// 1. CRYPT.GB — chunky pixel demake, 6-color twilight palette
// ===================================================================
const PX = {
  bg: '#1a1334', mid: '#3b1f50', ink: '#0a0420',
  rose: '#d8528a', peach: '#f1bc8a', cream: '#fff5d1', mint: '#7be0c8',
};

function pxWizard(ctx, x, y, t) {
  const bob = Math.round(Math.sin(t * 3) * 1); y += bob;
  // hat
  ctx.fillStyle = PX.ink;
  ctx.fillRect(x + 5, y, 4, 1);
  ctx.fillRect(x + 4, y + 1, 6, 1);
  ctx.fillRect(x + 3, y + 2, 8, 2);
  ctx.fillRect(x + 1, y + 4, 12, 1);
  ctx.fillStyle = PX.peach; ctx.fillRect(x + 6, y + 2, 1, 1);
  // face
  ctx.fillStyle = PX.peach; ctx.fillRect(x + 5, y + 5, 4, 2);
  ctx.fillStyle = PX.ink; ctx.fillRect(x + 5, y + 6, 1, 1); ctx.fillRect(x + 8, y + 6, 1, 1);
  // beard
  ctx.fillStyle = PX.cream; ctx.fillRect(x + 4, y + 7, 6, 2); ctx.fillRect(x + 5, y + 9, 4, 1);
  // robe
  ctx.fillStyle = PX.rose; ctx.fillRect(x + 2, y + 9, 10, 6); ctx.fillRect(x + 3, y + 15, 8, 1);
  ctx.fillStyle = PX.ink; ctx.fillRect(x + 6, y + 10, 2, 4);
  // sleeves
  ctx.fillStyle = PX.rose; ctx.fillRect(x, y + 10, 2, 3); ctx.fillRect(x + 12, y + 10, 2, 3);
  // staff
  ctx.fillStyle = PX.peach; ctx.fillRect(x + 14, y + 7, 1, 8);
  ctx.fillStyle = PX.mint; ctx.fillRect(x + 13, y + 6, 3, 1); ctx.fillRect(x + 14, y + 5, 1, 1);
}

function pxZombie(ctx, x, y, t) {
  const step = Math.floor(t * 4) % 2;
  // robe shadow
  ctx.fillStyle = PX.ink; ctx.fillRect(x + 1, y + 13, 8, 1);
  // head
  ctx.fillStyle = '#7eb05a'; ctx.fillRect(x + 2, y, 6, 4);
  ctx.fillStyle = '#5a8b3a'; ctx.fillRect(x + 2, y + 3, 6, 1);
  // eyes
  ctx.fillStyle = PX.rose; ctx.fillRect(x + 3, y + 2, 1, 1); ctx.fillRect(x + 6, y + 2, 1, 1);
  ctx.fillStyle = PX.ink; ctx.fillRect(x + 4, y + 1, 1, 1);
  // body
  ctx.fillStyle = '#5a8b3a'; ctx.fillRect(x + 2, y + 4, 6, 7);
  ctx.fillStyle = '#7eb05a'; ctx.fillRect(x + 3, y + 5, 1, 5);
  // arms outstretched
  ctx.fillStyle = '#7eb05a'; ctx.fillRect(x - 1, y + 4, 3, 3); ctx.fillRect(x + 8, y + 4, 3, 3);
  // legs
  ctx.fillStyle = PX.ink;
  if (step) { ctx.fillRect(x + 3, y + 11, 1, 2); ctx.fillRect(x + 6, y + 11, 2, 2); }
  else { ctx.fillRect(x + 3, y + 11, 2, 2); ctx.fillRect(x + 6, y + 11, 1, 2); }
}

function CryptGB() {
  const W = 240, H = 150;
  const ref = useCanvas({ w: W, h: H, pixel: true, scale: 3 }, (ctx, w, h, t) => {
    // sky gradient bands
    const bands = [PX.bg, '#251447', '#3b1f50', '#552a55'];
    bands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, i * 18, w, 18); });
    // moon
    ctx.fillStyle = PX.cream; ctx.beginPath(); ctx.arc(195, 28, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3b1f50'; ctx.beginPath(); ctx.arc(192, 25, 8, 0, Math.PI * 2); ctx.fill();
    // gravestones (parallax)
    ctx.fillStyle = '#2b1840';
    for (let i = 0; i < 10; i++) {
      const gx = ((i * 27 + Math.floor(t * 6)) % 280) - 20;
      ctx.fillRect(gx, 92 - (i % 3), 6, 8);
      ctx.fillRect(gx - 1, 91 - (i % 3), 8, 1);
    }
    // ground
    ctx.fillStyle = '#1c0e2e'; ctx.fillRect(0, 110, w, 40);
    ctx.fillStyle = PX.ink;
    for (let i = 0; i < 80; i++) {
      const gx = (i * 7 + (i * 13 % 11)) % w;
      const gy = 112 + (i * 5) % 36;
      ctx.fillRect(gx, gy, 1, 1);
    }
    // entities
    pxWizard(ctx, 50, 96, t);
    // 2 zombies advancing
    const zx1 = 200 - ((t * 8) % 100);
    const zx2 = 220 - ((t * 8 + 60) % 140);
    pxZombie(ctx, zx1, 100, t);
    pxZombie(ctx, zx2, 102, t + 0.3);

    // fireball arc — every 1.4s
    const phase = (t % 1.4) / 1.4;
    if (phase < 0.7) {
      const u = phase / 0.7;
      const sx = 64, sy = 102, ex = zx1 + 4, ey = 104;
      const fx = sx + (ex - sx) * u;
      const fy = sy + (ey - sy) * u - 22 * Math.sin(u * Math.PI);
      // trail
      for (let k = 0; k < 5; k++) {
        const u2 = Math.max(0, u - k * 0.04);
        const tx = sx + (ex - sx) * u2;
        const ty = sy + (ey - sy) * u2 - 22 * Math.sin(u2 * Math.PI);
        ctx.fillStyle = k < 2 ? PX.peach : k < 4 ? PX.rose : PX.mid;
        ctx.fillRect(Math.round(tx), Math.round(ty), 2, 2);
      }
      ctx.fillStyle = PX.cream; ctx.fillRect(Math.round(fx), Math.round(fy), 2, 2);
      ctx.fillStyle = PX.peach; ctx.fillRect(Math.round(fx) - 1, Math.round(fy), 1, 1); ctx.fillRect(Math.round(fx) + 2, Math.round(fy), 1, 1);
      ctx.fillRect(Math.round(fx), Math.round(fy) - 1, 1, 1); ctx.fillRect(Math.round(fx), Math.round(fy) + 2, 1, 1);
    } else {
      // explosion
      const u = (phase - 0.7) / 0.3;
      const r = Math.round(2 + u * 6);
      const ex = zx1 + 4, ey = 104;
      ctx.fillStyle = PX.cream; ctx.fillRect(ex - r, ey - r, r * 2, r * 2);
      ctx.fillStyle = PX.peach; ctx.fillRect(ex - r + 1, ey - r + 1, r * 2 - 2, r * 2 - 2);
      ctx.fillStyle = PX.rose; ctx.fillRect(ex - r + 2, ey - r + 2, r * 2 - 4, r * 2 - 4);
    }

    // chain lightning every 2.1s onto zombie 2
    const lphase = ((t + 0.7) % 2.1) / 2.1;
    if (lphase < 0.18) {
      ctx.fillStyle = (Math.floor(t * 60) % 2) ? PX.cream : PX.mint;
      let lx = 64, ly = 100;
      const tx = zx2 + 4, ty = 102;
      for (let i = 0; i < 8; i++) {
        const u = i / 8;
        const nx = lx + (tx - lx) * u + ((i * 13) % 7 - 3);
        const ny = ly + (ty - ly) * u + ((i * 17) % 5 - 2);
        ctx.fillRect(Math.round(nx), Math.round(ny), 2, 2);
      }
    }

    // HUD: heart pips + xp bar
    ctx.fillStyle = PX.ink; ctx.fillRect(0, 0, w, 10);
    for (let i = 0; i < 5; i++) {
      const hx = 6 + i * 9; const lit = i < 4;
      ctx.fillStyle = lit ? PX.rose : PX.mid;
      ctx.fillRect(hx, 3, 5, 4);
      ctx.fillRect(hx + 1, 2, 1, 1); ctx.fillRect(hx + 3, 2, 1, 1);
      ctx.fillRect(hx + 2, 6, 1, 1);
    }
    ctx.fillStyle = PX.mid; ctx.fillRect(60, 3, 60, 4);
    ctx.fillStyle = PX.mint; ctx.fillRect(60, 3, 36, 4);
    // wave label
    ctx.fillStyle = PX.cream;
    drawPxText(ctx, 'WAVE.03', 130, 2);

    // scanline overlay
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let yy = 0; yy < h; yy += 2) ctx.fillRect(0, yy, w, 1);
  });
  return <canvas ref={ref} style={{ borderRadius: 2, boxShadow: '0 0 0 4px #0a0420, 0 12px 30px rgba(0,0,0,.4)' }} />;
}

// 3x5 pixel font for tiny HUD text
const PX_GLYPHS = {
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  'A': ['111', '101', '111', '101', '101'],
  'V': ['101', '101', '101', '101', '010'],
  'E': ['111', '100', '110', '100', '111'],
  'W': ['101', '101', '101', '111', '101'],
  'L': ['100', '100', '100', '100', '111'],
  '.': ['000', '000', '000', '000', '010'],
  ' ': ['000', '000', '000', '000', '000'],
};
function drawPxText(ctx, s, x, y) {
  for (let i = 0; i < s.length; i++) {
    const g = PX_GLYPHS[s[i]] || PX_GLYPHS[' '];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++)
      if (g[r][c] === '1') ctx.fillRect(x + i * 4 + c, y + r, 1, 1);
  }
}

window.CryptGBCard = function () {
  return (
    <StyleCard
      palette={{ bg: '#0a0420', fg: '#fff5d1', divider: 'rgba(255,245,209,.12)' }}
      fontFamily='"Press Start 2P", monospace'
      name={{ title: 'CRYPT.GB', spacing: '0.18em' }}
      tagline='4-bit twilight · pixel demake'
      swatches={[PX.bg, PX.mid, PX.rose, PX.peach, PX.cream, PX.mint]}
      typeSample='Press Start 2P · pixel HUD · 8px scale'
    >
      <CryptGB />
    </StyleCard>
  );
};

// ===================================================================
// 2. SUMI & GRAVE — sumi-e ink wash on parchment, vermillion seal
// ===================================================================
function brushStroke(ctx, pts, color, base = 6) {
  ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let layer = 0; layer < 4; layer++) {
    ctx.globalAlpha = 0.18 + layer * 0.18;
    ctx.lineWidth = base * (1 - layer * 0.18);
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) (i ? ctx.lineTo : ctx.moveTo).call(ctx, pts[i][0], pts[i][1]);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function inkSplatter(ctx, x, y, r, color, count = 14, seed = 0) {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const a = (i * 137.5 + seed) * Math.PI / 180;
    const d = (((i * 13 + seed * 7) % 100) / 100) * r;
    const sz = 0.5 + ((i * 19 + seed) % 7) / 4;
    ctx.globalAlpha = 0.35 + ((i * 23) % 50) / 100;
    ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, sz, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function SumiGrave() {
  const W = 720, H = 440;
  const ref = useCanvas({ w: W, h: H }, (ctx, w, h, t) => {
    // parchment base
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
    g.addColorStop(0, '#f5ecd2'); g.addColorStop(1, '#d9c89c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // paper grain (deterministic)
    for (let i = 0; i < 1200; i++) {
      const x = (i * 73) % w, y = (i * 131) % h;
      ctx.fillStyle = `rgba(70,50,30,${(i % 7) / 100 + 0.02})`;
      ctx.fillRect(x, y, 1, 1);
    }
    // ink wash mountains (background)
    ctx.fillStyle = 'rgba(20,15,10,0.15)';
    ctx.beginPath(); ctx.moveTo(0, 280); ctx.bezierCurveTo(120, 200, 240, 260, 360, 220);
    ctx.bezierCurveTo(480, 180, 600, 250, 720, 210); ctx.lineTo(720, 320); ctx.lineTo(0, 320); ctx.fill();
    ctx.fillStyle = 'rgba(20,15,10,0.22)';
    ctx.beginPath(); ctx.moveTo(0, 320); ctx.bezierCurveTo(140, 290, 280, 310, 420, 290);
    ctx.bezierCurveTo(540, 280, 660, 320, 720, 300); ctx.lineTo(720, 360); ctx.lineTo(0, 360); ctx.fill();

    // ground brush stroke
    brushStroke(ctx, [[0, 360], [180, 358], [360, 362], [540, 359], [720, 363]], '#1a120a', 10);

    // ghost enemy — wavy translucent shape
    const gx = 540 - ((t * 50) % 320);
    const gh = Math.sin(t * 2) * 10;
    ctx.fillStyle = 'rgba(20,15,10,0.55)';
    ctx.beginPath();
    ctx.moveTo(gx - 28, 250 + gh);
    ctx.quadraticCurveTo(gx - 35, 200 + gh, gx, 195 + gh);
    ctx.quadraticCurveTo(gx + 35, 200 + gh, gx + 28, 250 + gh);
    ctx.quadraticCurveTo(gx + 18, 280 + gh + Math.sin(t * 6) * 4, gx, 268 + gh);
    ctx.quadraticCurveTo(gx - 18, 280 + gh + Math.cos(t * 6) * 4, gx - 28, 250 + gh);
    ctx.fill();
    // ghost eyes
    ctx.fillStyle = '#f5ecd2';
    ctx.beginPath(); ctx.arc(gx - 8, 222 + gh, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(gx + 8, 222 + gh, 3, 0, Math.PI * 2); ctx.fill();

    // wizard — silhouette under conical hat
    const wx = 200, wy = 360;
    const sway = Math.sin(t * 1.5) * 2;
    // hat
    ctx.fillStyle = '#0e0a05';
    ctx.beginPath(); ctx.moveTo(wx + sway, wy - 150); ctx.lineTo(wx - 32, wy - 100); ctx.lineTo(wx + 32, wy - 100); ctx.fill();
    // body / robe
    ctx.beginPath();
    ctx.moveTo(wx - 36, wy - 100);
    ctx.quadraticCurveTo(wx - 50, wy - 40, wx - 42, wy);
    ctx.lineTo(wx + 42, wy);
    ctx.quadraticCurveTo(wx + 50, wy - 40, wx + 36, wy - 100);
    ctx.quadraticCurveTo(wx, wy - 86, wx - 36, wy - 100);
    ctx.fill();
    // staff
    brushStroke(ctx, [[wx + 36, wy - 90], [wx + 48, wy - 30], [wx + 50, wy + 20]], '#1a120a', 4);
    ctx.fillStyle = '#c2402a'; ctx.beginPath(); ctx.arc(wx + 36, wy - 95, 6, 0, Math.PI * 2); ctx.fill();

    // fireball — enso ring projectile arc, every 2.4s
    const phase = (t % 2.4) / 2.4;
    if (phase < 0.7) {
      const u = phase / 0.7;
      const sx = wx + 36, sy = wy - 95;
      const ex = gx, ey = 230 + gh;
      const fx = sx + (ex - sx) * u, fy = sy + (ey - sy) * u - 60 * Math.sin(u * Math.PI);
      // trailing splatter
      for (let k = 0; k < 6; k++) {
        const u2 = Math.max(0, u - k * 0.05);
        const tx = sx + (ex - sx) * u2, ty = sy + (ey - sy) * u2 - 60 * Math.sin(u2 * Math.PI);
        ctx.globalAlpha = 0.9 - k * 0.14;
        ctx.fillStyle = k < 2 ? '#c2402a' : '#1a120a';
        ctx.beginPath(); ctx.arc(tx, ty, 3 + k * 0.6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // enso ring head
      ctx.strokeStyle = '#c2402a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(fx, fy, 8, 0.3, Math.PI * 1.8); ctx.stroke();
    } else {
      // splash on impact
      const u = (phase - 0.7) / 0.3;
      inkSplatter(ctx, gx, 230 + gh, 30 + u * 30, '#c2402a', 30, Math.floor(t));
      inkSplatter(ctx, gx, 230 + gh, 18 + u * 22, '#1a120a', 24, Math.floor(t * 2));
    }

    // calligraphic title (top-left)
    ctx.fillStyle = '#1a120a';
    ctx.font = '700 26px "Cormorant Garamond", serif';
    ctx.fillText('墓 · GRAVEWAVE', 24, 50);
    ctx.font = '300 italic 13px "Cormorant Garamond", serif';
    ctx.fillStyle = 'rgba(26,18,10,0.65)';
    ctx.fillText('the ink remembers what we forget', 24, 70);
    // vermillion seal
    ctx.fillStyle = '#c2402a';
    ctx.fillRect(648, 32, 44, 44);
    ctx.fillStyle = '#f5ecd2';
    ctx.font = 'bold 16px "Cormorant Garamond", serif';
    ctx.textAlign = 'center';
    ctx.fillText('巫', 670, 56);
    ctx.fillText('術', 670, 72);
    ctx.textAlign = 'left';

    // HP bar (ink wash)
    ctx.fillStyle = 'rgba(26,18,10,0.25)'; ctx.fillRect(24, 400, 220, 6);
    ctx.fillStyle = '#1a120a'; ctx.fillRect(24, 400, 160, 6);
    ctx.fillStyle = '#c2402a'; ctx.fillRect(24, 400, 80, 6);
    ctx.font = '12px "Cormorant Garamond", serif'; ctx.fillStyle = 'rgba(26,18,10,0.7)';
    ctx.fillText('血 · 64 / 100', 24, 394);
  });
  return <canvas ref={ref} />;
}

window.SumiGraveCard = function () {
  return (
    <StyleCard
      palette={{ bg: '#e9dcb6', fg: '#1a120a', divider: 'rgba(26,18,10,.18)' }}
      fontFamily='"Cormorant Garamond", "EB Garamond", serif'
      name={{ title: 'Sumi & Grave', spacing: '0.04em' }}
      tagline='Sumi-e wash · vermillion seal · brush'
      swatches={['#e9dcb6', '#d9c89c', '#1a120a', '#c2402a', '#f5ecd2']}
      typeSample='Cormorant Garamond · brush primitive · paper grain'
    >
      <SumiGrave />
    </StyleCard>
  );
};

// ===================================================================
// 3. HEX ARCADE — neon vector wireframe, perspective grid
// ===================================================================
function HexArcade() {
  const W = 720, H = 440;
  const ref = useCanvas({ w: W, h: H }, (ctx, w, h, t) => {
    // void
    ctx.fillStyle = '#05011a'; ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h * 0.7, 0, w / 2, h * 0.7, w * 0.7);
    g.addColorStop(0, 'rgba(255,43,214,0.18)'); g.addColorStop(1, 'rgba(5,1,26,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    // perspective grid floor
    ctx.strokeStyle = '#ff2bd6'; ctx.lineWidth = 1;
    ctx.shadowColor = '#ff2bd6'; ctx.shadowBlur = 8;
    const horizon = 220;
    // horizontal scrolling lines
    for (let i = 0; i < 14; i++) {
      const u = ((i + (t * 0.6) % 1) / 14);
      const yy = horizon + Math.pow(u, 2) * (h - horizon);
      const span = Math.pow(u, 2) * w * 0.9;
      ctx.beginPath(); ctx.moveTo(w / 2 - span, yy); ctx.lineTo(w / 2 + span, yy); ctx.stroke();
    }
    // verticals (vanishing)
    for (let i = -8; i <= 8; i++) {
      const x0 = w / 2 + i * 8;
      const x1 = w / 2 + i * w * 0.13;
      ctx.beginPath(); ctx.moveTo(x0, horizon); ctx.lineTo(x1, h); ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // distant sun bands
    ctx.strokeStyle = '#ffb14a'; ctx.lineWidth = 2;
    ctx.shadowColor = '#ffb14a'; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(w / 2, 180, 70, Math.PI, 0); ctx.stroke();
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(w / 2 - 70, 180 - 12 - i * 14);
      ctx.lineTo(w / 2 + 70, 180 - 12 - i * 14);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // wizard — glowing geometric figure at left
    const wx = 180, wy = 300;
    const bob = Math.sin(t * 2) * 4;
    drawHexFigure(ctx, wx, wy + bob, '#00f0ff');

    // enemy — rotating wireframe octahedron, drifting in
    const ex = 560 - ((t * 40) % 120);
    const ey = 260 + Math.sin(t * 1.5) * 12;
    drawWireOctahedron(ctx, ex, ey, 36, t * 1.4, '#ff2bd6');
    // enemy hp bar
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,43,214,0.2)'; ctx.fillRect(ex - 30, ey - 50, 60, 4);
    ctx.fillStyle = '#ff2bd6'; ctx.fillRect(ex - 30, ey - 50, 38, 4);

    // fireball arc
    const phase = (t % 1.8) / 1.8;
    ctx.shadowColor = '#ffb14a'; ctx.shadowBlur = 16;
    if (phase < 0.75) {
      const u = phase / 0.75;
      const sx = wx + 14, sy = wy - 12 + bob;
      const tx = ex, ty = ey;
      // trail dots
      for (let k = 0; k < 14; k++) {
        const u2 = Math.max(0, u - k * 0.025);
        const fx = sx + (tx - sx) * u2;
        const fy = sy + (ty - sy) * u2 - 90 * Math.sin(u2 * Math.PI);
        ctx.fillStyle = `rgba(255, ${177 - k * 6}, ${74 - k * 4}, ${1 - k * 0.07})`;
        ctx.beginPath(); ctx.arc(fx, fy, 5 - k * 0.25, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      // burst
      const u = (phase - 0.75) / 0.25;
      ctx.strokeStyle = '#ffb14a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ex, ey, 10 + u * 40, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(ex, ey, 4 + u * 22, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // chain lightning — every 2.6s
    const lphase = ((t + 0.6) % 2.6) / 2.6;
    if (lphase < 0.22) {
      drawNeonLightning(ctx, wx + 14, wy + bob - 18, ex - 28, ey - 6, t);
    }

    // HUD frame (corner brackets)
    ctx.strokeStyle = '#00f0ff'; ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 8;
    [[16, 16], [w - 16, 16], [16, h - 16], [w - 16, h - 16]].forEach(([x, y], i) => {
      const dx = i % 2 ? -1 : 1; const dy = i < 2 ? 1 : -1;
      ctx.beginPath(); ctx.moveTo(x, y + 16 * dy); ctx.lineTo(x, y); ctx.lineTo(x + 16 * dx, y); ctx.stroke();
    });
    ctx.shadowBlur = 0;

    // text labels
    ctx.fillStyle = '#00f0ff'; ctx.font = '10px "Space Mono", monospace';
    ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 4;
    ctx.fillText('// WIZARD.HEX', 28, 32);
    ctx.fillText('LV.04 · PTS 2', 28, 46);
    ctx.fillStyle = '#ff2bd6';
    ctx.fillText('REVENANT.OCTA', w - 130, 32);
    ctx.fillText('HP 38/60', w - 130, 46);
    ctx.shadowBlur = 0;
  });
  return <canvas ref={ref} style={{ borderRadius: 4 }} />;
}

function drawHexFigure(ctx, x, y, color) {
  ctx.strokeStyle = color; ctx.lineWidth = 1.6;
  ctx.shadowColor = color; ctx.shadowBlur = 12;
  // pentagon torso
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
    const px = x + Math.cos(a) * 24, py = y + Math.sin(a) * 24;
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
  }
  ctx.closePath(); ctx.stroke();
  // hat triangle
  ctx.beginPath();
  ctx.moveTo(x, y - 60); ctx.lineTo(x - 16, y - 30); ctx.lineTo(x + 16, y - 30); ctx.closePath(); ctx.stroke();
  // head dot
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y - 22, 3, 0, Math.PI * 2); ctx.fill();
  // staff
  ctx.beginPath(); ctx.moveTo(x + 18, y - 40); ctx.lineTo(x + 28, y + 40); ctx.stroke();
  ctx.fillStyle = '#ffb14a'; ctx.beginPath(); ctx.arc(x + 18, y - 40, 5, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

function drawWireOctahedron(ctx, x, y, r, ang, color) {
  ctx.strokeStyle = color; ctx.lineWidth = 1.6;
  ctx.shadowColor = color; ctx.shadowBlur = 14;
  // vertices: top, bottom, 4 around equator
  const top = [x, y - r], bot = [x, y + r];
  const eq = [];
  for (let i = 0; i < 4; i++) {
    const a = ang + i * Math.PI / 2;
    eq.push([x + Math.cos(a) * r, y + Math.sin(a) * r * 0.4]);
  }
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    ctx.moveTo(top[0], top[1]); ctx.lineTo(eq[i][0], eq[i][1]);
    ctx.moveTo(bot[0], bot[1]); ctx.lineTo(eq[i][0], eq[i][1]);
    ctx.moveTo(eq[i][0], eq[i][1]); ctx.lineTo(eq[(i + 1) % 4][0], eq[(i + 1) % 4][1]);
  }
  ctx.stroke();
  // core
  ctx.fillStyle = '#ff2bd6';
  ctx.beginPath(); ctx.arc(x, y, 3 + Math.sin(ang * 4) * 1, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

function drawNeonLightning(ctx, x1, y1, x2, y2, t) {
  ctx.strokeStyle = '#00f0ff'; ctx.lineWidth = 3;
  ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let i = 1; i < 12; i++) {
    const u = i / 12;
    const seed = i * 91 + Math.floor(t * 30);
    const jx = x1 + (x2 - x1) * u + ((seed * 17) % 32 - 16);
    const jy = y1 + (y2 - y1) * u + ((seed * 31) % 24 - 12);
    ctx.lineTo(jx, jy);
  }
  ctx.lineTo(x2, y2); ctx.stroke();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

window.HexArcadeCard = function () {
  return (
    <StyleCard
      palette={{ bg: '#05011a', fg: '#e6f7ff', divider: 'rgba(0,240,255,.2)' }}
      fontFamily='"Space Mono", "JetBrains Mono", monospace'
      name={{ title: 'HEX.ARCADE', spacing: '0.22em' }}
      tagline='Neon vector · synthwave grid · glow'
      swatches={['#05011a', '#00f0ff', '#ff2bd6', '#ffb14a', '#e6f7ff']}
      typeSample='Space Mono · CRT bloom · 1.6px wires'
    >
      <HexArcade />
    </StyleCard>
  );
};

// ===================================================================
// 4. NECROTERM — ASCII brutalist terminal
// ===================================================================
function NecroTerm() {
  const W = 720, H = 440;
  const COLS = 60, ROWS = 22;
  const CW = 12, CH = 18; // cell size
  const padX = (W - COLS * CW) / 2;
  const padY = (H - ROWS * CH) / 2;
  const ref = useCanvas({ w: W, h: H }, (ctx, w, h, t) => {
    // bg
    ctx.fillStyle = '#0a0d10'; ctx.fillRect(0, 0, w, h);
    // scanlines
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);

    // grid frame
    const cell = (col, row) => [padX + col * CW, padY + row * CH];

    ctx.font = '14px "JetBrains Mono", "IBM Plex Mono", monospace';
    ctx.textBaseline = 'top';

    // helper to write text
    const put = (col, row, s, color = '#e8e4d8') => {
      ctx.fillStyle = color;
      const [x, y] = cell(col, row);
      ctx.fillText(s, x, y);
    };

    // top bar
    put(0, 0, '┌' + '─'.repeat(COLS - 2) + '┐', '#3b4046');
    put(0, ROWS - 1, '└' + '─'.repeat(COLS - 2) + '┘', '#3b4046');
    for (let r = 1; r < ROWS - 1; r++) {
      put(0, r, '│', '#3b4046');
      put(COLS - 1, r, '│', '#3b4046');
    }
    // header
    put(2, 1, 'gravewave://wizard.run · WAVE 03 · LV.04', '#9aa0a6');
    put(COLS - 12, 1, '[ PAUSE: ␣ ]', '#5a6068');
    put(1, 2, '─'.repeat(COLS - 2), '#3b4046');

    // map: 56 wide x 14 tall starts at col 2 row 3
    const MAP_C = 56, MAP_R = 14;
    // grass dots
    ctx.fillStyle = '#1c2128';
    for (let r = 0; r < MAP_R; r++) for (let c = 0; c < MAP_C; c++) {
      const seed = (r * 31 + c * 17) % 11;
      if (seed === 0) put(2 + c, 3 + r, '·', '#22272e');
      else if (seed === 3) put(2 + c, 3 + r, ',', '#1c2128');
    }
    // gravestones
    [[8, 5, 't'], [22, 4, 'T'], [40, 6, 't'], [50, 5, 'T']].forEach(([c, r, ch]) => put(c + 2, r + 3, ch, '#4a525a'));

    // wizard at (12, 8)
    const wx = 12, wy = 8;
    put(wx, 3 + wy, '@', '#fce96a');

    // enemy zombie shambling
    const ezx = Math.floor(40 - ((t * 4) % 18));
    put(2 + ezx, 3 + 8, 'Z', '#7eb05a');
    const ezx2 = Math.floor(48 - ((t * 4 + 9) % 22));
    put(2 + ezx2, 3 + 9, 'z', '#5a8b3a');

    // fireball travels (every 1.2s) wizard -> ezx
    const phase = (t % 1.2) / 1.2;
    if (phase < 0.85) {
      const u = phase / 0.85;
      const fx = Math.round(wx + 1 + (ezx - wx - 1) * u);
      const ch = ['~', '*', '◆', '*', '~'][Math.floor(t * 14) % 5];
      put(2 + fx, 3 + 8, ch, '#ff8844');
      // trail
      for (let k = 1; k < 4; k++) {
        const u2 = Math.max(0, u - k * 0.07);
        const tx = Math.round(wx + 1 + (ezx - wx - 1) * u2);
        if (tx !== fx) put(2 + tx, 3 + 8, '.', '#cc5522');
      }
    } else {
      const burst = Math.floor((phase - 0.85) * 30) % 2;
      put(2 + ezx - 1, 3 + 7, burst ? '\\' : '/', '#ff8844');
      put(2 + ezx + 1, 3 + 7, burst ? '/' : '\\', '#ff8844');
      put(2 + ezx, 3 + 8, '*', '#ffcc66');
      put(2 + ezx - 1, 3 + 9, burst ? '/' : '\\', '#ff8844');
      put(2 + ezx + 1, 3 + 9, burst ? '\\' : '/', '#ff8844');
    }

    // chain lightning every 2.0s
    const lphase = ((t + 0.5) % 2.0) / 2.0;
    if (lphase < 0.18) {
      const dx = ezx2 - wx - 1, dy = 1;
      for (let i = 1; i < Math.abs(dx); i++) {
        const u = i / Math.abs(dx);
        const off = Math.round(((i * 7) % 5 - 2) * 0.5);
        const yy = 3 + wy + Math.round(dy * u) + off;
        const ch = i % 2 ? '/' : '\\';
        put(2 + wx + 1 + i, yy, ch, '#9af0ff');
      }
      put(2 + ezx2, 3 + 9, '⚡', '#9af0ff');
    }

    // separator
    put(1, 3 + MAP_R, '─'.repeat(COLS - 2), '#3b4046');

    // status panel
    const sr = 3 + MAP_R + 1;
    const hp = 64, mhp = 100;
    const hpFill = Math.round((hp / mhp) * 22);
    let bar = '█'.repeat(hpFill) + '░'.repeat(22 - hpFill);
    put(2, sr, 'HP [', '#9aa0a6'); put(6, sr, bar, '#ff6644'); put(28, sr, '] 64/100', '#9aa0a6');
    const xpFill = Math.round((Math.sin(t * 0.5) * 0.3 + 0.5) * 22);
    bar = '█'.repeat(xpFill) + '░'.repeat(22 - xpFill);
    put(2, sr + 1, 'XP [', '#9aa0a6'); put(6, sr + 1, bar, '#6cd4a4'); put(28, sr + 1, '] PTS·2', '#9aa0a6');
    // ability slots
    put(40, sr, '╳ FIREBALL  ●●●○○', '#fce96a');
    put(40, sr + 1, '⚡ CHAIN_LT  ●○○○○', '#9af0ff');

    // blinking caret
    if (Math.floor(t * 2) % 2) put(COLS - 4, ROWS - 2, '▌', '#e8e4d8');
    put(2, ROWS - 2, '> ', '#5a6068');
    put(4, ROWS - 2, 'awaiting wave', '#9aa0a6');

    // CRT vignette
    const v = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
  });
  return <canvas ref={ref} style={{ borderRadius: 4, boxShadow: 'inset 0 0 80px rgba(0,0,0,.6)' }} />;
}

window.NecroTermCard = function () {
  return (
    <StyleCard
      palette={{ bg: '#0a0d10', fg: '#e8e4d8', divider: 'rgba(232,228,216,.12)' }}
      fontFamily='"JetBrains Mono", "IBM Plex Mono", monospace'
      name={{ title: 'NECROTERM', spacing: '0.32em' }}
      tagline='Brutalist terminal · ASCII entities'
      swatches={['#0a0d10', '#e8e4d8', '#fce96a', '#ff6644', '#9af0ff', '#6cd4a4']}
      typeSample='JetBrains Mono · @ Z * ~ ⚡ as living sprites'
    >
      <NecroTerm />
    </StyleCard>
  );
};

// ===================================================================
// 5. RELIQUARY — tarot-card watercolor with gold filigree
// ===================================================================
function watercolorBlob(ctx, x, y, r, color, count = 6, seed = 0) {
  for (let i = 0; i < count; i++) {
    ctx.globalAlpha = 0.10 + (i % 3) * 0.06;
    const dx = Math.cos((i + seed) * 1.3) * r * 0.2;
    const dy = Math.sin((i + seed) * 1.7) * r * 0.2;
    const rr = r * (1 - i * 0.08);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x + dx, y + dy, rr * (1 + Math.sin(i) * 0.1), rr * (1 + Math.cos(i) * 0.12), i * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function Reliquary() {
  const W = 720, H = 440;
  const ref = useCanvas({ w: W, h: H }, (ctx, w, h, t) => {
    // outer night
    ctx.fillStyle = '#0e1a24'; ctx.fillRect(0, 0, w, h);

    // card frame parchment
    const px = 30, py = 24, pw = w - 60, ph = h - 48;
    const inner = ctx.createLinearGradient(0, py, 0, py + ph);
    inner.addColorStop(0, '#0e2a3a'); inner.addColorStop(1, '#06141d');
    ctx.fillStyle = inner; ctx.fillRect(px, py, pw, ph);

    // painted overlay textures
    watercolorBlob(ctx, 200, 280, 140, '#1c4a4a', 8, 1);
    watercolorBlob(ctx, 540, 200, 160, '#3a2a4a', 8, 2);
    watercolorBlob(ctx, 360, 360, 200, '#0a2030', 6, 3);
    // moon
    ctx.fillStyle = '#f3e3b8';
    ctx.beginPath(); ctx.arc(540, 130, 38, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.45; ctx.fillStyle = '#0e2a3a';
    ctx.beginPath(); ctx.arc(556, 122, 36, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    // moon halo
    const halo = ctx.createRadialGradient(540, 130, 30, 540, 130, 100);
    halo.addColorStop(0, 'rgba(243,227,184,0.35)'); halo.addColorStop(1, 'rgba(243,227,184,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(540, 130, 110, 0, Math.PI * 2); ctx.fill();

    // gold filigree frame
    ctx.strokeStyle = '#d4a14a'; ctx.lineWidth = 1.2;
    ctx.strokeRect(px + 6, py + 6, pw - 12, ph - 12);
    ctx.strokeRect(px + 12, py + 12, pw - 24, ph - 24);
    drawFiligreeCorner(ctx, px + 12, py + 12, 0);
    drawFiligreeCorner(ctx, px + pw - 12, py + 12, Math.PI / 2);
    drawFiligreeCorner(ctx, px + pw - 12, py + ph - 12, Math.PI);
    drawFiligreeCorner(ctx, px + 12, py + ph - 12, -Math.PI / 2);

    // wraith enemy — drifting watercolor specter
    const ex = 470 - ((t * 30) % 200);
    const ey = 260 + Math.sin(t * 1.6) * 10;
    watercolorBlob(ctx, ex, ey + 30, 36, '#0a1a22', 7, 4);
    watercolorBlob(ctx, ex, ey, 36, '#cfd9dd', 7, 5);
    // skull face
    ctx.fillStyle = '#0e1a24';
    ctx.beginPath(); ctx.arc(ex - 8, ey - 4, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ex + 8, ey - 4, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(ex - 6, ey + 6, 3, 2); ctx.fillRect(ex - 1, ey + 6, 3, 2); ctx.fillRect(ex + 4, ey + 6, 3, 2);
    // tattered edge
    ctx.strokeStyle = 'rgba(207,217,221,0.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const ax = ex - 30 + i * 6;
      const ay = ey + 30 + Math.sin(i + t * 4) * 6;
      i ? ctx.lineTo(ax, ay) : ctx.moveTo(ax, ay);
    }
    ctx.stroke();

    // wizard — robed figure
    const wx = 200, wy = 320;
    const sway = Math.sin(t * 1.2) * 3;
    // robe wash
    watercolorBlob(ctx, wx + sway, wy - 30, 60, '#3a2415', 8, 7);
    // hood
    ctx.fillStyle = '#1a0e08';
    ctx.beginPath();
    ctx.moveTo(wx + sway, wy - 110);
    ctx.bezierCurveTo(wx - 30 + sway, wy - 100, wx - 38 + sway, wy - 60, wx - 32 + sway, wy - 40);
    ctx.lineTo(wx + 32 + sway, wy - 40);
    ctx.bezierCurveTo(wx + 38 + sway, wy - 60, wx + 30 + sway, wy - 100, wx + sway, wy - 110);
    ctx.fill();
    // face shadow
    ctx.fillStyle = '#0a0a08';
    ctx.beginPath(); ctx.ellipse(wx + sway, wy - 70, 14, 20, 0, 0, Math.PI * 2); ctx.fill();
    // glowing eyes
    ctx.fillStyle = '#d4a14a';
    ctx.shadowColor = '#d4a14a'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(wx - 5 + sway, wy - 75, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(wx + 5 + sway, wy - 75, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // robe lower
    ctx.fillStyle = '#1a0e08';
    ctx.beginPath();
    ctx.moveTo(wx - 32 + sway, wy - 40);
    ctx.bezierCurveTo(wx - 50 + sway, wy - 10, wx - 50 + sway, wy + 20, wx - 40 + sway, wy + 20);
    ctx.lineTo(wx + 40 + sway, wy + 20);
    ctx.bezierCurveTo(wx + 50 + sway, wy + 20, wx + 50 + sway, wy - 10, wx + 32 + sway, wy - 40);
    ctx.fill();
    // staff
    ctx.strokeStyle = '#6a4520'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(wx + 36 + sway, wy - 100); ctx.lineTo(wx + 44 + sway, wy + 30); ctx.stroke();
    // staff orb
    const pulse = 1 + Math.sin(t * 4) * 0.15;
    ctx.fillStyle = '#e8763a';
    ctx.shadowColor = '#e8763a'; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.arc(wx + 36 + sway, wy - 105, 7 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // fireball arc
    const phase = (t % 2.2) / 2.2;
    if (phase < 0.7) {
      const u = phase / 0.7;
      const sx = wx + 36 + sway, sy = wy - 105;
      const tx = ex, ty = ey;
      const fx = sx + (tx - sx) * u, fy = sy + (ty - sy) * u - 80 * Math.sin(u * Math.PI);
      // watercolor trail
      for (let k = 0; k < 8; k++) {
        const u2 = Math.max(0, u - k * 0.04);
        const ttx = sx + (tx - sx) * u2, tty = sy + (ty - sy) * u2 - 80 * Math.sin(u2 * Math.PI);
        ctx.globalAlpha = 0.45 - k * 0.05;
        ctx.fillStyle = k < 3 ? '#e8763a' : '#7a3a20';
        ctx.beginPath(); ctx.arc(ttx, tty, 9 - k * 0.8, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#f3e3b8'; ctx.shadowColor = '#e8763a'; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(fx, fy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      const u = (phase - 0.7) / 0.3;
      watercolorBlob(ctx, ex, ey, 30 + u * 30, '#e8763a', 8, Math.floor(t));
      watercolorBlob(ctx, ex, ey, 12 + u * 18, '#f3e3b8', 4, Math.floor(t * 2));
    }

    // title in gilt
    ctx.fillStyle = '#d4a14a';
    ctx.font = '22px "Cinzel", "Cormorant Garamond", serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE WIZARD · IV', w / 2, py + 38);
    ctx.font = 'italic 11px "Cormorant Garamond", serif';
    ctx.fillStyle = 'rgba(212,161,74,0.7)';
    ctx.fillText('— ardent bone, kind embers —', w / 2, py + 56);

    // bottom roman label + HP
    ctx.font = '12px "Cinzel", serif'; ctx.fillStyle = '#d4a14a';
    ctx.textAlign = 'left';
    ctx.fillText('VITA', px + 24, py + ph - 32);
    ctx.fillText('LXIV / C', px + 24, py + ph - 18);
    // hp bar with gold rule
    ctx.strokeStyle = '#d4a14a'; ctx.lineWidth = 1;
    ctx.strokeRect(px + 80, py + ph - 28, 200, 6);
    ctx.fillStyle = '#e8763a'; ctx.fillRect(px + 81, py + ph - 27, 128, 4);
    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(212,161,74,0.7)';
    ctx.fillText('WAVE · III', px + pw - 24, py + ph - 18);
    ctx.textAlign = 'left';
  });
  return <canvas ref={ref} />;
}

function drawFiligreeCorner(ctx, x, y, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.strokeStyle = '#d4a14a'; ctx.lineWidth = 1.2; ctx.fillStyle = '#d4a14a';
  ctx.beginPath();
  ctx.moveTo(2, 2); ctx.bezierCurveTo(14, 4, 18, 12, 22, 22);
  ctx.moveTo(2, 2); ctx.bezierCurveTo(4, 14, 12, 18, 22, 22);
  ctx.stroke();
  ctx.beginPath(); ctx.arc(8, 8, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(20, 20, 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

window.ReliquaryCard = function () {
  return (
    <StyleCard
      palette={{ bg: '#0e1a24', fg: '#e6dec5', divider: 'rgba(212,161,74,.25)' }}
      fontFamily='"Cinzel", "Cormorant Garamond", serif'
      name={{ title: 'Reliquary', spacing: '0.08em' }}
      tagline='Tarot card · gilt filigree · watercolor'
      swatches={['#0e1a24', '#3a2415', '#d4a14a', '#e8763a', '#f3e3b8', '#cfd9dd']}
      typeSample='Cinzel + Cormorant · arcana numerals · gold rules'
    >
      <Reliquary />
    </StyleCard>
  );
};
