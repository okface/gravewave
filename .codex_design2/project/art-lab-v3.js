/* =====================================================================
   GRAVEWAVE — SHOCK & PULSE v3
   Builds on v2 primitives (PAL, TAU, drawStar, hatch, drawPaper,
   getPool/tickPool, drawMagician, drawEnemy, drawHitImpact).
   Adds: T2/T3 spell visuals, camera shake, impact bursts, telegraphs.
   ===================================================================== */

(function(){
  'use strict';

  /* small alias guard so we don't blow up if loaded before v2 */
  const P = (typeof PAL !== 'undefined') ? PAL : {
    paper:'#e8dcc0', paper2:'#ddcfae', paper3:'#c8b88c',
    ink:'#1a1612', inkSoft:'#3a322a', inkMid:'#6a604f', inkDim:'#8a7e68',
    red:'#a83a2c', redDeep:'#7a2820', redLight:'#d8624c',
    blue:'#2c4a8c', blueLight:'#4c6cac',
    gold:'#c8941a', goldLight:'#e8b840',
    green:'#5a7a3c',
  };
  const T2 = Math.PI * 2;

  /* ===================================================================
     CAMERA SHAKE — per scene
     =================================================================== */
  const shakeState = new Map();   // key -> { events: [{amp,dur,t0}] }
  function addShake(key, amp, dur, now) {
    let s = shakeState.get(key);
    if (!s) { s = { events: [] }; shakeState.set(key, s); }
    s.events.push({ amp, dur, t0: now });
  }
  function applyShake(ctx, key, now) {
    const s = shakeState.get(key);
    if (!s || !s.events.length) return { x: 0, y: 0 };
    let x = 0, y = 0;
    for (let i = s.events.length - 1; i >= 0; i--) {
      const e = s.events[i];
      const age = now - e.t0;
      if (age >= e.dur) { s.events.splice(i, 1); continue; }
      const k = 1 - age / e.dur;
      const ang = (Math.sin((age + i*0.13) * 73) + Math.cos((age+i*0.31)*97)) * 50;
      x += Math.cos(ang) * e.amp * k * k;
      y += Math.sin(ang) * e.amp * k * k;
    }
    ctx.translate(x, y);
    return { x, y };
  }

  /* ===================================================================
     HIT BURSTS
     =================================================================== */
  function burstHit(ctx, x, y, phase) {
    if (phase <= 0 || phase >= 1) return;
    const a = 1 - phase;
    ctx.strokeStyle = `rgba(168,58,44,${a})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(x, y, 5 + phase*14, 0, T2); ctx.stroke();
    ctx.strokeStyle = `rgba(26,22,18,${a*0.6})`;
    ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.arc(x, y, 3 + phase*10, 0, T2); ctx.stroke();
    for (let i = 0; i < 7; i++) {
      const ang = i/7*T2 + phase*0.3;
      const ra = 4 + phase*4;
      const rb = 14 + phase*4;
      ctx.strokeStyle = `rgba(200,148,26,${a*0.9})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x+Math.cos(ang)*ra, y+Math.sin(ang)*ra);
      ctx.lineTo(x+Math.cos(ang)*rb, y+Math.sin(ang)*rb);
      ctx.stroke();
    }
  }
  function burstCrit(ctx, x, y, phase) {
    if (phase <= 0 || phase >= 1) return;
    const a = 1 - phase;
    // big gold star burst
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(phase * 0.6);
    ctx.fillStyle = `rgba(232,184,64,${a*0.6})`;
    drawStar(ctx, 0, 0, 8 + phase*22, 3 + phase*8, 8);
    ctx.fill();
    ctx.strokeStyle = `rgba(168,58,44,${a})`;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
    // double ring
    ctx.strokeStyle = `rgba(200,148,26,${a})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(x, y, 6 + phase*18, 0, T2); ctx.stroke();
    ctx.strokeStyle = `rgba(26,22,18,${a*0.7})`;
    ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.arc(x, y, 10 + phase*22, 0, T2); ctx.stroke();
    // damage number — pop scale 1.0 → 1.4 → 1.0 in first 0.25
    const np = Math.min(1, phase / 0.25);
    const scale = np < 0.5 ? (1 + np*0.8) : (1.4 - (np-0.5)*0.8);
    ctx.save();
    ctx.translate(x, y - 18 - phase*14);
    ctx.scale(scale, scale);
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = `rgba(200,148,26,${a})`;
    ctx.strokeText('48!', 0, 0);
    ctx.fillStyle = `rgba(168,58,44,${a})`;
    ctx.fillText('48!', 0, 0);
    ctx.textAlign = 'start';
    ctx.restore();
  }
  function burstResist(ctx, x, y, phase) {
    if (phase <= 0 || phase >= 1) return;
    const a = 1 - phase;
    // pearlescent shimmer — concentric rings of varying hues
    for (let i = 0; i < 4; i++) {
      const k = phase + i*0.06;
      if (k >= 1) continue;
      const r = 6 + k*16;
      const hues = ['rgba(232,220,192,', 'rgba(200,148,26,', 'rgba(44,74,140,', 'rgba(232,220,192,'];
      ctx.strokeStyle = `${hues[i]}${(1-k)*0.9})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(x, y, r, 0, T2); ctx.stroke();
    }
    // RESIST tag
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.fillStyle = `rgba(60,60,80,${a})`;
    ctx.textAlign = 'center';
    ctx.fillText('RESIST', x, y - 18 - phase*8);
    ctx.textAlign = 'start';
  }
  function burstVuln(ctx, x, y, phase) {
    if (phase <= 0 || phase >= 1) return;
    const a = 1 - phase;
    // red wash overlay rings
    ctx.fillStyle = `rgba(168,58,44,${a*0.45})`;
    ctx.beginPath(); ctx.arc(x, y, 8 + phase*20, 0, T2); ctx.fill();
    ctx.strokeStyle = `rgba(168,58,44,${a})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(x, y, 5 + phase*16, 0, T2); ctx.stroke();
    // Red rays
    for (let i = 0; i < 12; i++) {
      const ang = i/12*T2;
      const ra = 6 + phase*6;
      const rb = 18 + phase*8;
      ctx.strokeStyle = `rgba(122,40,32,${a*0.8})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x+Math.cos(ang)*ra, y+Math.sin(ang)*ra);
      ctx.lineTo(x+Math.cos(ang)*rb, y+Math.sin(ang)*rb);
      ctx.stroke();
    }
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.fillStyle = `rgba(168,58,44,${a})`;
    ctx.textAlign = 'center';
    ctx.fillText('VULN', x, y - 20 - phase*8);
    ctx.textAlign = 'start';
  }
  function burstDeath(ctx, x, y, phase) {
    if (phase <= 0 || phase >= 1) return;
    const a = 1 - phase;
    // 8-piece radial shatter — ink shards flying outward
    for (let i = 0; i < 8; i++) {
      const ang = i/8*T2 + 0.3;
      const dist = 4 + phase*32;
      const sx = x + Math.cos(ang)*dist;
      const sy = y + Math.sin(ang)*dist;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(ang + phase*1.6);
      ctx.fillStyle = `rgba(26,22,18,${a})`;
      ctx.beginPath();
      ctx.moveTo(-3, -2); ctx.lineTo(4, 0); ctx.lineTo(-2, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // Ink puff at center
    ctx.fillStyle = `rgba(26,22,18,${a*0.8})`;
    ctx.beginPath(); ctx.arc(x, y, 3 + phase*4, 0, T2); ctx.fill();
    // Vermilion ring
    ctx.strokeStyle = `rgba(168,58,44,${a*0.8})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(x, y, 8 + phase*22, 0, T2); ctx.stroke();
  }

  /* ===================================================================
     T2 — SNOW FORT  (hex ice wall, frost crystals, drift, shatter)
     =================================================================== */
  function spellSnowFort(ctx, w, h, t, dt, key, opts={}) {
    const pool = getPool(key);
    const cx = w/2, cy = h/2 + 6;
    const period = opts.impact ? 4.0 : 6.0;
    const phase = (t % period) / period;
    // Lifecycle: 0–0.05 spawn, 0.05–0.85 sustain, 0.85–1 shatter (impact mode)
    const radius = Math.min(w, h) * 0.34;
    const bloom = Math.min(1, phase / 0.08);
    const dying = opts.impact && phase > 0.85;
    const shatterPhase = dying ? (phase - 0.85) / 0.15 : 0;

    // Player inside (cute reference)
    if (!dying && bloom > 0.3) drawMagician(ctx, cx, cy + 4, t, 'idle');

    // Hex points
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = i/6*T2 - Math.PI/2;
      pts.push({ x: cx + Math.cos(a)*radius, y: cy + Math.sin(a)*radius, ang: a });
    }

    // Pale interior fill — protected zone
    if (!dying) {
      ctx.fillStyle = `rgba(44,74,140,${0.10 * bloom})`;
      ctx.beginPath();
      pts.forEach((p,i) => i===0 ? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y));
      ctx.closePath();
      ctx.fill();
      // Frost overlay hatch
      ctx.save();
      ctx.beginPath();
      pts.forEach((p,i) => i===0 ? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y));
      ctx.closePath();
      ctx.clip();
      hatch(ctx, cx, cy, radius*2.4, radius*2.4, 4, Math.PI/3.5, `rgba(44,74,140,${0.25*bloom})`, 0.5);
      ctx.restore();
    }

    // Spawn drifting flakes inside
    if (!dying && Math.random() < dt*30) {
      const a = Math.random()*T2;
      const r = Math.random() * radius * 0.85;
      pool.push({
        kind: 'flake', x: cx + Math.cos(a)*r, y: cy + Math.sin(a)*r - radius*0.3,
        vx: (Math.random()-0.5)*4, vy: 5 + Math.random()*8,
        life: 1.4 + Math.random()*0.6, age: 0,
        rot: Math.random()*T2, omega: (Math.random()-0.5)*1.5,
        drag: 1,
      });
    }
    tickPool(pool, dt);
    for (const p of pool) if (p.kind === 'flake') p.rot += p.omega * dt;

    // Draw flakes
    for (const p of pool) {
      if (p.kind !== 'flake') continue;
      const a = Math.max(0, Math.min(1, p.life / 1.6));
      const dx = p.x - cx, dy = p.y - cy;
      const inside = Math.abs(dx) + Math.abs(dy) < radius * 1.2;
      if (!inside) continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.strokeStyle = `rgba(44,74,140,${a*0.85})`;
      ctx.lineWidth = 0.9;
      for (let i = 0; i < 3; i++) {
        const ang = i/3*Math.PI;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang)*-2.2, Math.sin(ang)*-2.2);
        ctx.lineTo(Math.cos(ang)*2.2, Math.sin(ang)*2.2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Hex wall — bloom-grow over 0.3s
    if (!dying) {
      // Outline
      ctx.strokeStyle = P.ink;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i/6*T2 - Math.PI/2;
        const r = radius * bloom;
        const px = cx + Math.cos(a)*r, py = cy + Math.sin(a)*r;
        if (i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
      }
      ctx.closePath();
      ctx.stroke();
      // Inner indigo wall
      ctx.strokeStyle = P.blue;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6,4]);
      ctx.lineDashOffset = -t*8;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i/6*T2 - Math.PI/2;
        const r = radius * 0.92 * bloom;
        const px = cx + Math.cos(a)*r, py = cy + Math.sin(a)*r;
        if (i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);

      // Crystal posts at each vertex — bloom up
      for (const p of pts) {
        const wob = 1 + Math.sin(t*1.5 + p.ang*3)*0.08;
        const sz = 6 * bloom * wob;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.ang + Math.PI/2);
        // Crystal diamond
        ctx.fillStyle = P.paper;
        ctx.strokeStyle = P.ink;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, -sz*1.6);
        ctx.lineTo(sz*0.7, 0);
        ctx.lineTo(0, sz);
        ctx.lineTo(-sz*0.7, 0);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        // Inner indigo
        ctx.fillStyle = P.blue;
        ctx.beginPath();
        ctx.moveTo(0, -sz*1.0);
        ctx.lineTo(sz*0.4, -0.2);
        ctx.lineTo(0, sz*0.6);
        ctx.lineTo(-sz*0.4, -0.2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    // Shatter death — 6 chunks fly outward
    if (dying) {
      for (let i = 0; i < 6; i++) {
        const a = i/6*T2 - Math.PI/2;
        const off = shatterPhase * 30;
        const px = cx + Math.cos(a)*(radius + off);
        const py = cy + Math.sin(a)*(radius + off);
        const fade = 1 - shatterPhase;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(a + shatterPhase*1.4);
        ctx.fillStyle = `rgba(232,220,192,${fade*0.9})`;
        ctx.strokeStyle = `rgba(26,22,18,${fade})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, -10); ctx.lineTo(7, 4); ctx.lineTo(-2, 8); ctx.lineTo(-7, -2);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        // Frost crystal core
        ctx.fillStyle = `rgba(44,74,140,${fade*0.8})`;
        ctx.beginPath();
        ctx.moveTo(0, -5); ctx.lineTo(3, 0); ctx.lineTo(0, 4); ctx.lineTo(-3, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      // Mist puff at center
      ctx.fillStyle = `rgba(232,220,192,${(1-shatterPhase)*0.5})`;
      ctx.beginPath(); ctx.arc(cx, cy, radius*0.4 * (1+shatterPhase*0.5), 0, T2); ctx.fill();
    }
  }

  /* ===================================================================
     T2 — FIRE SHIELD (3 orbs, flame ribbons, block flash)
     =================================================================== */
  function spellFireShield(ctx, w, h, t, dt, key, opts={}) {
    const pool = getPool(key);
    const cx = w/2, cy = h*0.62;

    // Player base
    drawMagician(ctx, cx, cy, t, opts.impact ? 'cast' : 'idle');

    // Block flash on impact mode — periodic
    const blockPhase = opts.impact ? ((t * 0.7) % 1) : -1;
    if (blockPhase > 0 && blockPhase < 0.4) {
      const bp = blockPhase / 0.4;
      const a = 1 - bp;
      // Gold concentric pulse
      for (let i = 0; i < 3; i++) {
        const r = 24 + bp*22 + i*8;
        ctx.strokeStyle = `rgba(200,148,26,${a*(1-i*0.3)})`;
        ctx.lineWidth = 1.6 - i*0.4;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, T2); ctx.stroke();
      }
    }

    const orbR = 26;
    // Three orbs orbit
    for (let i = 0; i < 3; i++) {
      const ang = t*1.4 + i/3*T2;
      const ox = cx + Math.cos(ang)*orbR;
      const oy = cy + Math.sin(ang)*orbR*0.55 - 4;
      // Flame ribbon trail — sample 8 past positions analytically
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const back = k * 0.06;
        const a = (t - back)*1.4 + i/3*T2;
        const tx = cx + Math.cos(a)*orbR;
        const ty = cy + Math.sin(a)*orbR*0.55 - 4;
        const fade = 1 - k/8;
        ctx.fillStyle = `rgba(168,58,44,${fade*0.6})`;
        ctx.beginPath();
        ctx.arc(tx, ty, 3.5 * fade, 0, T2);
        ctx.fill();
      }
      // Spawn ember occasionally
      if (Math.random() < dt*8) {
        pool.push({
          kind: 'em', x: ox, y: oy,
          vx: (Math.random()-0.5)*15, vy: -10 - Math.random()*15,
          life: 0.5, age: 0, drag: 0.96,
        });
      }
      // On impact mode — micro spark burst per orb every cycle
      if (opts.impact) {
        const sp = ((t + i*0.3) % 1.2) / 1.2;
        if (sp < 0.15) {
          const a2 = 1 - sp/0.15;
          for (let s = 0; s < 5; s++) {
            const sang = s/5*T2;
            ctx.strokeStyle = `rgba(200,148,26,${a2})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(ox, oy);
            ctx.lineTo(ox + Math.cos(sang)*8, oy + Math.sin(sang)*8);
            ctx.stroke();
          }
        }
      }

      // Orb body — vermilion with ink core, gold highlight
      ctx.fillStyle = P.red;
      ctx.beginPath(); ctx.arc(ox, oy, 5, 0, T2); ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 0.9;
      ctx.stroke();
      ctx.fillStyle = P.ink;
      ctx.beginPath(); ctx.arc(ox+0.5, oy+0.3, 1.6, 0, T2); ctx.fill();
      ctx.fillStyle = P.gold;
      ctx.beginPath(); ctx.arc(ox - 1.3, oy - 1.6, 1.0, 0, T2); ctx.fill();
    }
    tickPool(pool, dt);
    // Embers
    for (const p of pool) {
      if (p.kind !== 'em') continue;
      const a = Math.max(0, p.life / 0.5);
      ctx.fillStyle = `rgba(168,58,44,${a})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.1, 0, T2); ctx.fill();
      if (a > 0.6) {
        ctx.fillStyle = `rgba(232,184,64,${(a-0.6)*2})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 0.5, 0, T2); ctx.fill();
      }
    }

    // Shield "charges" indicator — 3 small marks above
    for (let i = 0; i < 3; i++) {
      const x = cx - 18 + i*18;
      const y = cy - 56;
      const lit = !opts.impact || (Math.floor(t*0.7) % 2 === 0) || i !== 0;
      ctx.strokeStyle = P.ink; ctx.lineWidth = 1;
      ctx.fillStyle = lit ? P.red : 'transparent';
      ctx.beginPath();
      ctx.moveTo(x, y - 4); ctx.lineTo(x + 3.5, y); ctx.lineTo(x, y + 4); ctx.lineTo(x - 3.5, y);
      ctx.closePath();
      if (lit) ctx.fill();
      ctx.stroke();
    }
  }

  /* ===================================================================
     T2 — SHOCK TOWER (sentry + arc + halo pulse)
     =================================================================== */
  function spellShockTower(ctx, w, h, t, dt, key, opts={}) {
    const pool = getPool(key);
    const cx = w*0.36, cy = h*0.62;
    const tx = w*0.78, ty = h*0.42;

    // Range halo — pulses on each cast
    const period = 0.9;
    const phase = (t % period) / period;
    const haloPhase = Math.min(1, phase / 0.5);
    const haloR = 64 + haloPhase*8;
    const haloA = (1 - haloPhase) * 0.5;
    ctx.strokeStyle = `rgba(200,148,26,${haloA})`;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.arc(cx, cy, haloR, 0, T2); ctx.stroke();
    ctx.setLineDash([]);

    // Target enemy (in impact/right side)
    if (opts.impact) {
      drawEnemy(ctx, {
        x: tx, y: ty, radius: 14,
        hp: 8, maxHp: 18, shape: 'shade',
        state: phase < 0.18 ? 'hit' : 'walk',
        statuses: phase < 0.4 ? ['shock'] : null,
      }, t);
    }

    // Tower base — stone pillar (paper rect with hatch)
    const baseW = 20, baseH = 28;
    const jit = phase < 0.18 ? (Math.random()-0.5)*1.4 : 0;
    ctx.save();
    ctx.translate(cx + jit, cy);
    // Shadow
    ctx.fillStyle = 'rgba(26,22,18,0.4)';
    ctx.beginPath(); ctx.ellipse(0, 16, 14, 4, 0, 0, T2); ctx.fill();
    // Pillar
    ctx.fillStyle = P.paper;
    ctx.strokeStyle = P.ink; ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-baseW/2, 12);
    ctx.lineTo(-baseW/2 + 2, -baseH);
    ctx.lineTo(baseW/2 - 2, -baseH);
    ctx.lineTo(baseW/2, 12);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Hatch
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-baseW/2, 12);
    ctx.lineTo(-baseW/2 + 2, -baseH);
    ctx.lineTo(baseW/2 - 2, -baseH);
    ctx.lineTo(baseW/2, 12);
    ctx.closePath();
    ctx.clip();
    hatch(ctx, 0, 0, baseW, baseH, 2.2, Math.PI/3, 'rgba(26,22,18,0.4)', 0.5);
    ctx.restore();
    // Coil head
    ctx.fillStyle = P.ink;
    ctx.beginPath(); ctx.ellipse(0, -baseH - 4, 9, 6, 0, 0, T2); ctx.fill();
    // Yellow flicker eye
    const flick = phase < 0.2 ? P.goldLight : P.gold;
    ctx.fillStyle = flick;
    ctx.beginPath(); ctx.arc(0, -baseH - 4, 3 + (phase<0.2?1:0), 0, T2); ctx.fill();
    ctx.strokeStyle = P.ink; ctx.lineWidth = 0.6;
    ctx.stroke();
    // Antenna rods
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-5, -baseH-4); ctx.lineTo(-9, -baseH-12);
    ctx.moveTo(5, -baseH-4); ctx.lineTo(9, -baseH-12);
    ctx.stroke();
    // Crackle dot at top during fire
    if (phase < 0.2) {
      ctx.fillStyle = P.gold;
      ctx.beginPath(); ctx.arc(0, -baseH-12, 1.4, 0, T2); ctx.fill();
    }
    ctx.restore();

    // Arc to target — flash 0–0.18
    if (opts.impact && phase < 0.22) {
      const a = Math.max(0, 1 - phase/0.22);
      const sx = cx + jit, sy = cy - baseH - 4;
      const seed = Math.floor(t/period)*9301 + 1;
      const segs = 8;
      const points = [{x:sx, y:sy}];
      for (let i = 1; i < segs; i++) {
        const k = i/segs;
        const baseX = sx + (tx-sx)*k;
        const baseY = sy + (ty-sy)*k;
        const dx = ty - sy, dy = -(tx - sx);
        const len = Math.hypot(dx,dy) || 1;
        const r = (Math.sin(seed + i*7919) * 10000);
        const j = ((r - Math.floor(r)) - 0.5) * 14;
        points.push({ x: baseX + dx/len*j, y: baseY + dy/len*j });
      }
      points.push({x:tx, y:ty});
      ctx.lineCap = 'square';
      ctx.strokeStyle = `rgba(26,22,18,${a*0.95})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();
      // Gold inner
      ctx.strokeStyle = `rgba(232,184,64,${a})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      // Endpoint flash
      ctx.fillStyle = `rgba(232,184,64,${a*0.4})`;
      ctx.beginPath(); ctx.arc(tx, ty, 10*a, 0, T2); ctx.fill();
      // Spawn ground sparks at base
      if (phase < 0.04) {
        for (let i = 0; i < 4; i++) {
          const ang = (Math.random()-0.5) * Math.PI - Math.PI/2;
          pool.push({
            kind: 'sp', x: cx + jit, y: cy + 10,
            vx: Math.cos(ang)*40, vy: Math.sin(ang)*40,
            life: 0.4, age: 0, drag: 0.92, gravity: 80,
          });
        }
      }
    }
    tickPool(pool, dt);
    for (const p of pool) {
      if (p.kind !== 'sp') continue;
      const a = Math.max(0, p.life / 0.4);
      ctx.strokeStyle = `rgba(200,148,26,${a})`;
      ctx.lineWidth = 1;
      const len = 3 + p.age*15;
      const ang = Math.atan2(p.vy, p.vx);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + Math.cos(ang)*len, p.y + Math.sin(ang)*len);
      ctx.stroke();
    }
  }

  /* ===================================================================
     T2 — GRAVITAL ANOMALY (small wells with player threads)
     =================================================================== */
  function spellGravital(ctx, w, h, t, dt, key, opts={}) {
    const pool = getPool(key);
    const cx = w/2, cy = h*0.62;
    drawMagician(ctx, cx, cy, t, 'idle');

    const period = 1.6;
    const tickId = Math.floor(t / period);

    // Spawn a new well per period
    if (!pool._tickId || pool._tickId !== tickId) {
      pool._tickId = tickId;
      const a = (tickId * 1.7) % T2;
      const dist = 50 + ((tickId*13)%20);
      pool.push({
        kind: 'well',
        x: cx + Math.cos(a)*dist, y: cy + Math.sin(a)*dist,
        life: 1.4, age: 0, maxLife: 1.4,
      });
    }
    tickPool(pool, dt);

    // Draw threads first
    for (const p of pool) {
      if (p.kind !== 'well') continue;
      const a = Math.max(0, p.life / p.maxLife);
      // Thread to player — dashed ink
      ctx.strokeStyle = `rgba(26,22,18,${a*0.5})`;
      ctx.lineWidth = 0.9;
      ctx.setLineDash([3, 3]);
      ctx.lineDashOffset = -t * 12;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      // Slight curve — bezier midpoint
      const mx = (cx + p.x)/2 + Math.sin(t + p.x*0.01)*4;
      const my = (cy + p.y)/2 + Math.cos(t + p.y*0.01)*4;
      ctx.quadraticCurveTo(mx, my, p.x, p.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw wells
    for (const p of pool) {
      if (p.kind !== 'well') continue;
      const a = Math.max(0, p.life / p.maxLife);
      const dying = p.life < 0.25;
      const popPhase = dying ? (1 - p.life/0.25) : 0;
      // Pull ring
      const pullR = 18 * (1 + (1-a)*0.2);
      ctx.strokeStyle = `rgba(44,74,140,${a*0.7})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(p.x, p.y, pullR, 0, T2); ctx.stroke();
      // Inner spiral ticks
      for (let i = 0; i < 5; i++) {
        const ang = i/5*T2 + t*1.5;
        const r1 = pullR*0.55, r2 = pullR*0.85;
        ctx.strokeStyle = `rgba(44,74,140,${a*0.6})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(p.x + Math.cos(ang)*r1, p.y + Math.sin(ang)*r1);
        ctx.lineTo(p.x + Math.cos(ang+0.3)*r2, p.y + Math.sin(ang+0.3)*r2);
        ctx.stroke();
      }
      // Black core
      ctx.fillStyle = P.ink;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, T2); ctx.fill();
      // Pop on expire
      if (popPhase > 0) {
        const pa = 1 - popPhase;
        ctx.strokeStyle = `rgba(168,58,44,${pa})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(p.x, p.y, 4 + popPhase*22, 0, T2); ctx.stroke();
        // Vermilion sparks
        for (let i = 0; i < 6; i++) {
          const ang = i/6*T2;
          const dist = 4 + popPhase*16;
          ctx.fillStyle = `rgba(168,58,44,${pa})`;
          ctx.beginPath();
          ctx.arc(p.x + Math.cos(ang)*dist, p.y + Math.sin(ang)*dist, 1.2, 0, T2);
          ctx.fill();
        }
      }
    }
  }

  /* ===================================================================
     T3 — METEOR (telegraph + impact + shake)
     =================================================================== */
  function spellMeteor(ctx, w, h, t, dt, key, opts={}) {
    const pool = getPool(key);
    const cx = w/2, cy = h*0.6;
    const period = 3.0;
    const phase = (t % period) / period;
    const beatId = Math.floor(t / period);

    // Phase mapping:
    //  0.00–0.30 telegraph (shadow grows + comet appears falling)
    //  0.30–0.35 impact   (flash, dust, shake fired once)
    //  0.35–1.00 burning crater (cracks, embers, scorch)
    const tele = Math.min(1, phase / 0.30);
    const impactNow = phase >= 0.30 && phase < 0.34;
    const post = phase > 0.30 ? (phase - 0.30) / 0.70 : 0;

    if (opts.mode === 'telegraph') {
      // Pin telegraph cycle — never resolve
      const tt = ((t * 0.6) % 1);
      const teleLoop = Math.min(1, tt / 0.7);
      drawMeteorTelegraph(ctx, cx, cy, teleLoop, t);
      // Hold a faint comet aloft
      drawMeteorComet(ctx, cx, cy, teleLoop, t);
      return;
    }

    // Trigger impact once per beat
    if (!pool._beat || pool._beat !== beatId) {
      pool._beat = beatId;
      pool._impactDone = false;
    }
    if (!pool._impactDone && impactNow) {
      pool._impactDone = true;
      addShake(key, 14, 0.7, t);
      // Spawn dust plume + cracks
      for (let i = 0; i < 26; i++) {
        const a = i/26*T2 + Math.random()*0.2;
        pool.push({
          kind: 'dust', x: cx, y: cy,
          vx: Math.cos(a)*(40+Math.random()*60),
          vy: Math.sin(a)*(40+Math.random()*60) - 20,
          life: 0.9 + Math.random()*0.4, age: 0, drag: 0.94, gravity: 30,
          size: 3 + Math.random()*4,
        });
      }
      for (let i = 0; i < 18; i++) {
        const a = i/18*T2;
        pool.push({
          kind: 'spark', x: cx, y: cy,
          vx: Math.cos(a)*(140+Math.random()*80),
          vy: Math.sin(a)*(140+Math.random()*80),
          life: 0.5, age: 0, drag: 0.93,
        });
      }
      // Cracks — radial seed
      for (let i = 0; i < 8; i++) {
        const a = i/8*T2 + Math.random()*0.2;
        pool.push({
          kind: 'crack', x: cx, y: cy, ang: a,
          maxLen: 50 + Math.random()*30, life: 1.5, age: 0,
        });
      }
    }
    tickPool(pool, dt);

    // Telegraph ground shadow (pulsing growing circle, ~0.6s)
    if (phase < 0.30) {
      drawMeteorTelegraph(ctx, cx, cy, tele, t);
    }
    // Comet descent
    if (phase < 0.32) {
      drawMeteorComet(ctx, cx, cy, tele, t);
    }
    // Impact flash
    if (impactNow) {
      const f = 1 - (phase - 0.30)/0.04;
      ctx.fillStyle = `rgba(232,220,192,${f*0.7})`;
      ctx.fillRect(0,0,w,h);
      // Sun-burst at center
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = `rgba(232,184,64,${f*0.85})`;
      drawStar(ctx, 0, 0, 50*f, 18*f, 14);
      ctx.fill();
      ctx.restore();
    }
    // Crater + cracks (lasting)
    if (post > 0) {
      const fade = Math.max(0, 1 - post);
      // Scorched crater
      ctx.fillStyle = `rgba(26,22,18,${0.25*fade})`;
      ctx.beginPath(); ctx.arc(cx, cy, 38, 0, T2); ctx.fill();
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, 38, 0, T2); ctx.clip();
      hatch(ctx, cx, cy, 80, 80, 2.2, Math.PI/3, `rgba(26,22,18,${0.45*fade})`, 0.5);
      ctx.restore();
      // Ring
      ctx.strokeStyle = `rgba(26,22,18,${fade*0.7})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(cx, cy, 38, 0, T2); ctx.stroke();
      // Embers smoldering
      if (Math.random() < dt*30) {
        pool.push({
          kind: 'em', x: cx + (Math.random()-0.5)*60, y: cy + (Math.random()-0.5)*30,
          vx: (Math.random()-0.5)*5, vy: -10 - Math.random()*15,
          life: 0.8, age: 0, drag: 0.97, gravity: -10,
        });
      }
    }
    // Cracks
    for (const p of pool) {
      if (p.kind !== 'crack') continue;
      const a = Math.max(0, p.life / 1.5);
      const grow = Math.min(1, p.age / 0.2);
      const len = p.maxLen * grow;
      ctx.strokeStyle = `rgba(168,58,44,${a*0.85})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      // Jagged path
      const segs = 4;
      for (let i = 1; i <= segs; i++) {
        const k = i/segs;
        const ox = Math.cos(p.ang)*len*k;
        const oy = Math.sin(p.ang)*len*k;
        const j = (Math.sin(i*7919 + p.ang*10) * 10000);
        const jit = ((j - Math.floor(j)) - 0.5) * 8 * k;
        const perp = p.ang + Math.PI/2;
        ctx.lineTo(p.x + ox + Math.cos(perp)*jit, p.y + oy + Math.sin(perp)*jit);
      }
      ctx.stroke();
    }
    // Dust
    for (const p of pool) {
      if (p.kind !== 'dust') continue;
      const a = Math.max(0, p.life / 1.3);
      ctx.fillStyle = `rgba(120,90,60,${a*0.45})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 + p.age*0.8), 0, T2); ctx.fill();
    }
    // Sparks
    for (const p of pool) {
      if (p.kind !== 'spark') continue;
      const a = Math.max(0, p.life / 0.5);
      ctx.strokeStyle = `rgba(200,148,26,${a})`;
      ctx.lineWidth = 1;
      const len = 4 + p.age*10;
      const ang = Math.atan2(p.vy, p.vx);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + Math.cos(ang)*len, p.y + Math.sin(ang)*len);
      ctx.stroke();
    }
    // Embers
    for (const p of pool) {
      if (p.kind !== 'em') continue;
      const a = Math.max(0, p.life / 0.8);
      ctx.fillStyle = `rgba(168,58,44,${a})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.2, 0, T2); ctx.fill();
    }
  }
  function drawMeteorTelegraph(ctx, cx, cy, tele, t) {
    // Growing target shadow — 3 concentric pulses
    const r = 12 + tele*32;
    ctx.fillStyle = `rgba(26,22,18,${0.18 + tele*0.25})`;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, T2); ctx.fill();
    // Vermilion warning rings
    for (let i = 0; i < 3; i++) {
      const phase = ((t*1.2 + i*0.33) % 1);
      const a = (1 - phase) * tele;
      ctx.strokeStyle = `rgba(168,58,44,${a*0.9})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(cx, cy, 8 + phase*r*0.9, 0, T2); ctx.stroke();
    }
    // Crosshair
    ctx.strokeStyle = `rgba(168,58,44,${tele*0.85})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - r - 4, cy); ctx.lineTo(cx - r + 4, cy);
    ctx.moveTo(cx + r - 4, cy); ctx.lineTo(cx + r + 4, cy);
    ctx.moveTo(cx, cy - r - 4); ctx.lineTo(cx, cy - r + 4);
    ctx.moveTo(cx, cy + r - 4); ctx.lineTo(cx, cy + r + 4);
    ctx.stroke();
  }
  function drawMeteorComet(ctx, cx, cy, tele, t) {
    // Comet falling from upper-right toward cx,cy
    const startX = cx + 80, startY = cy - 120;
    const k = tele;
    const px = startX + (cx - startX) * k;
    const py = startY + (cy - startY) * k;
    // Trail (sample 10 back positions)
    for (let i = 0; i < 12; i++) {
      const back = i * 0.04;
      const k2 = Math.max(0, k - back);
      const tx = startX + (cx - startX) * k2;
      const ty = startY + (cy - startY) * k2;
      const fade = 1 - i/12;
      ctx.fillStyle = `rgba(168,58,44,${fade*0.65})`;
      ctx.beginPath(); ctx.arc(tx, ty, 5*fade + 1, 0, T2); ctx.fill();
      if (i % 2 === 0) {
        ctx.fillStyle = `rgba(26,22,18,${fade*0.55})`;
        ctx.beginPath(); ctx.arc(tx-2, ty-2, 3*fade, 0, T2); ctx.fill();
      }
    }
    // Body — vermilion w/ gold core, ink rim
    if (k < 1) {
      ctx.fillStyle = P.red;
      ctx.beginPath(); ctx.arc(px, py, 7, 0, T2); ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = P.gold;
      ctx.beginPath(); ctx.arc(px - 1, py - 1, 3, 0, T2); ctx.fill();
      // Sparks streaming back
      for (let s = 0; s < 4; s++) {
        const sa = Math.atan2(startY-cy, startX-cx) + (Math.random()-0.5)*0.6;
        const sd = 8 + Math.random()*10;
        ctx.strokeStyle = `rgba(200,148,26,${0.7})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(sa)*sd, py + Math.sin(sa)*sd);
        ctx.stroke();
      }
    }
  }

  /* ===================================================================
     T3 — SNOW STORM (arena-wide blizzard)
     =================================================================== */
  function spellSnowStorm(ctx, w, h, t, dt, key, opts={}) {
    const pool = getPool(key);
    const cx = w/2, cy = h/2;
    const radius = Math.min(w, h) * 0.46;
    const period = 6.0;
    const phase = (t % period) / period;

    const opening = opts.mode === 'cast';
    const stormA = opening ? Math.min(1, phase/0.25) : 1;

    // Frost ground overlay — accumulate
    const frostFill = stormA * 0.16;
    ctx.fillStyle = `rgba(180,200,232,${frostFill})`;
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, T2); ctx.fill();
    // Inside, bluish hatch
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, T2); ctx.clip();
    hatch(ctx, cx, cy, radius*2, radius*2, 5, Math.PI/3.5, `rgba(44,74,140,${stormA*0.18})`, 0.5);
    hatch(ctx, cx, cy, radius*2, radius*2, 7, -Math.PI/4.5, `rgba(44,74,140,${stormA*0.10})`, 0.4);
    ctx.restore();
    // Perimeter
    ctx.strokeStyle = `rgba(44,74,140,${stormA*0.7})`;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 4]);
    ctx.lineDashOffset = -t*10;
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, T2); ctx.stroke();
    ctx.setLineDash([]);

    // Spawn falling snowflakes (target ~50 alive)
    const target = 50;
    const alive = pool.filter(p => p.kind === 'flake').length;
    if (alive < target && Math.random() < dt*100) {
      const a = Math.random()*T2;
      const r = Math.random()*radius;
      pool.push({
        kind: 'flake',
        x: cx + Math.cos(a)*r + (Math.random()-0.5)*20,
        y: cy + Math.sin(a)*r - radius - Math.random()*30,
        vx: -8 - Math.random()*10, vy: 18 + Math.random()*22,
        life: 3.0, age: 0, drag: 1,
        rot: Math.random()*T2, omega: (Math.random()-0.5)*2,
        size: 2 + Math.random()*2,
      });
    }
    // Gust lines — every ~1.6s
    const gustId = Math.floor(t / 1.4);
    if (!pool._gust || pool._gust !== gustId) {
      pool._gust = gustId;
      for (let i = 0; i < 3; i++) {
        const yOff = (Math.random()-0.5)*radius*1.4;
        pool.push({
          kind: 'gust',
          x: cx - radius - 30, y: cy + yOff,
          vx: 220 + Math.random()*80, vy: 0,
          life: 0.8, age: 0, drag: 1,
          length: 60 + Math.random()*40,
        });
      }
    }
    tickPool(pool, dt);
    for (const p of pool) if (p.kind === 'flake') p.rot += p.omega * dt;
    // Cull flakes off-screen
    for (let i = pool.length-1; i >= 0; i--) {
      const p = pool[i];
      if (p.kind === 'flake' && (p.y > cy + radius + 20 || p.x < cx - radius - 20)) pool.splice(i, 1);
    }

    // Draw flakes
    for (const p of pool) {
      if (p.kind !== 'flake') continue;
      const dx = p.x - cx, dy = p.y - cy;
      if (dx*dx + dy*dy > radius*radius*1.05) continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.strokeStyle = `rgba(44,74,140,0.85)`;
      ctx.lineWidth = 0.9;
      const sz = p.size;
      for (let i = 0; i < 3; i++) {
        const ang = i/3*Math.PI;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang)*-sz, Math.sin(ang)*-sz);
        ctx.lineTo(Math.cos(ang)*sz, Math.sin(ang)*sz);
        ctx.stroke();
      }
      ctx.restore();
    }
    // Draw gusts
    for (const p of pool) {
      if (p.kind !== 'gust') continue;
      const a = Math.max(0, p.life / 0.8);
      ctx.strokeStyle = `rgba(180,200,232,${a*0.6})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.length, p.y - 4);
      ctx.stroke();
      ctx.strokeStyle = `rgba(44,74,140,${a*0.5})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(p.x + 8, p.y + 2);
      ctx.lineTo(p.x + p.length - 4, p.y - 1);
      ctx.stroke();
    }
    // Iced enemies — show two rimmed shades
    if (!opening) {
      drawEnemy(ctx, { x: cx - radius*0.3, y: cy + radius*0.2, radius: 14, hp:9, maxHp:18, shape:'shade', state:'walk', statuses:['slow'] }, t);
      drawEnemy(ctx, { x: cx + radius*0.4, y: cy - radius*0.15, radius: 11, hp:7, maxHp:14, shape:'wisp', state:'walk', statuses:['slow'] }, t);
    }
  }

  /* ===================================================================
     T3 — WORMHOLE (twin portals)
     =================================================================== */
  function spellWormhole(ctx, w, h, t, dt, key, opts={}) {
    const pool = getPool(key);
    const ax = w*0.28, ay = h*0.5;
    const bx = w*0.72, by = h*0.5;
    const portalR = 22;

    // Background pinch — radial gradient at each
    for (const p of [{x:ax,y:ay},{x:bx,y:by}]) {
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, portalR*2.2);
      grd.addColorStop(0, 'rgba(26,22,18,0.5)');
      grd.addColorStop(0.5, 'rgba(44,74,140,0.18)');
      grd.addColorStop(1, 'rgba(26,22,18,0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(p.x, p.y, portalR*2.2, 0, T2); ctx.fill();
    }

    // Connection seam — dashed wavy ink
    ctx.strokeStyle = `rgba(26,22,18,0.55)`;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 5]);
    ctx.lineDashOffset = -t*16;
    ctx.beginPath();
    ctx.moveTo(ax + portalR, ay);
    for (let x = ax + portalR; x <= bx - portalR; x += 5) {
      const k = (x - ax) / (bx - ax);
      const y = ay + Math.sin(k*Math.PI*4 + t*3)*5;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Spawn motes near A pulled in (constant)
    if (Math.random() < dt*40) {
      const ang = Math.random()*T2;
      const dist = portalR*1.2 + Math.random()*portalR;
      pool.push({
        kind: 'in', x: ax + Math.cos(ang)*dist, y: ay + Math.sin(ang)*dist,
        ax, ay, life: 0.6 + Math.random()*0.3, age: 0, drag: 1,
      });
    }
    // Spawn motes ejecting from B
    if (Math.random() < dt*40) {
      const ang = Math.random()*T2;
      pool.push({
        kind: 'out', x: bx, y: by, ang, life: 0.7, age: 0, drag: 1,
      });
    }

    // Transit enemy on impact mode — shoots from A to B with stretch
    if (opts.impact) {
      const period = 1.6;
      const phase = (t % period) / period;
      if (phase < 0.4) {
        const k = phase / 0.4;
        const tx = ax + (bx - ax)*k;
        const stretch = 1 + Math.sin(k*Math.PI)*1.5;
        ctx.save();
        ctx.translate(tx, ay);
        ctx.scale(stretch, 1/Math.max(1, stretch*0.7));
        drawShade(ctx, 0, 0, t, 'walk', 14);
        ctx.restore();
      }
    }

    // Update + draw motes
    for (let i = pool.length-1; i >= 0; i--) {
      const p = pool[i];
      p.life -= dt; p.age = (p.age||0) + dt;
      if (p.life <= 0) { pool.splice(i,1); continue; }
      if (p.kind === 'in') {
        // Pull toward ax,ay
        const dx = p.ax - p.x, dy = p.ay - p.y;
        const d = Math.hypot(dx,dy) || 1;
        const speed = 60 + (1-p.life/0.9)*120;
        p.x += dx/d * speed * dt;
        p.y += dy/d * speed * dt;
      } else if (p.kind === 'out') {
        p.x += Math.cos(p.ang) * 80 * dt;
        p.y += Math.sin(p.ang) * 80 * dt;
      }
    }
    for (const p of pool) {
      if (p.kind === 'in') {
        const a = Math.max(0, p.life / 0.9);
        ctx.fillStyle = `rgba(26,22,18,${a*0.85})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.4, 0, T2); ctx.fill();
      } else if (p.kind === 'out') {
        const a = Math.max(0, p.life / 0.7);
        ctx.fillStyle = `rgba(44,74,140,${a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, T2); ctx.fill();
      }
    }

    // Portals — draw last so they sit on top
    for (let i = 0; i < 2; i++) {
      const p = i===0 ? {x:ax,y:ay,sign:1} : {x:bx,y:by,sign:-1};
      ctx.save();
      ctx.translate(p.x, p.y);
      // Outer ink ring
      ctx.strokeStyle = P.ink;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, portalR, 0, T2); ctx.stroke();
      // Inner spinning swirl
      ctx.rotate(t * p.sign * 1.4);
      ctx.strokeStyle = P.blue;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let a = 0; a < T2*2; a += 0.1) {
        const r = portalR*0.85 * (1 - a/(T2*2));
        const px = Math.cos(a)*r, py = Math.sin(a)*r;
        if (a===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
      }
      ctx.stroke();
      // Center dot
      ctx.fillStyle = P.ink;
      ctx.beginPath(); ctx.arc(0, 0, 3, 0, T2); ctx.fill();
      // Vermilion mark — A is red, B is gold
      if (i === 0) {
        ctx.fillStyle = P.red;
        drawStar(ctx, 0, -portalR-6, 3, 1.2, 5);
        ctx.fill();
      } else {
        ctx.fillStyle = P.gold;
        drawStar(ctx, 0, -portalR-6, 3, 1.2, 5);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  /* ===================================================================
     T3 — STORM CLOUD (overhead cloud, fork strikes)
     =================================================================== */
  function spellStormCloud3(ctx, w, h, t, dt, key, opts={}) {
    const pool = getPool(key);
    const cx = w/2, cy = h*0.32;
    const cloudW = w*0.55, cloudH = 32;

    // AoE radius on ground
    const aoeR = w*0.32;
    const aoeY = h*0.78;

    // Faint AoE indicator on ground
    ctx.strokeStyle = `rgba(44,74,140,0.45)`;
    ctx.lineWidth = 1;
    ctx.setLineDash([3,4]);
    ctx.beginPath(); ctx.ellipse(cx, aoeY, aoeR, aoeR*0.25, 0, 0, T2); ctx.stroke();
    ctx.setLineDash([]);

    // Strike cadence
    const period = opts.impact ? 1.0 : 1.6;
    const tickId = Math.floor(t / period);
    if (!pool._tickId || pool._tickId !== tickId) {
      pool._tickId = tickId;
      // Pick target under cloud
      const seed = tickId * 9301 + 49297;
      const sR = (n) => { const x = Math.sin(seed + n*7919)*10000; return x - Math.floor(x); };
      const tx = cx + (sR(0) - 0.5) * aoeR * 1.2;
      const ty = aoeY + (sR(1) - 0.5) * aoeR * 0.3;
      pool.push({
        kind: 'strike',
        sx: cx + (sR(2)-0.5)*cloudW*0.5, sy: cy + 6,
        ex: tx, ey: ty,
        seed, life: 0.35, age: 0,
      });
      // Scorch mark
      pool.push({ kind: 'scorch', x: tx, y: ty, life: 1.2, age: 0 });
      // Sparks
      for (let i = 0; i < 6; i++) {
        const a = Math.random()*T2;
        pool.push({
          kind: 'sp', x: tx, y: ty,
          vx: Math.cos(a)*60, vy: Math.sin(a)*60,
          life: 0.4, age: 0, drag: 0.93,
        });
      }
    }
    tickPool(pool, dt);

    // Cloud silhouette — overlapping ink puffs with slow drift
    const drift = Math.sin(t*0.4)*8;
    ctx.fillStyle = P.ink;
    const puffs = [
      { x: cx - cloudW*0.35 + drift, y: cy + 6, r: 16 },
      { x: cx - cloudW*0.18 + drift, y: cy - 4, r: 22 },
      { x: cx + drift, y: cy, r: 26 },
      { x: cx + cloudW*0.20 + drift, y: cy - 2, r: 20 },
      { x: cx + cloudW*0.36 + drift, y: cy + 4, r: 16 },
    ];
    ctx.beginPath();
    for (const p of puffs) {
      ctx.moveTo(p.x + p.r, p.y);
      ctx.arc(p.x, p.y, p.r, 0, T2);
    }
    ctx.fill();
    // Hatch on bottom edge for shadow
    ctx.save();
    ctx.beginPath();
    for (const p of puffs) {
      ctx.moveTo(p.x + p.r, p.y);
      ctx.arc(p.x, p.y, p.r, 0, T2);
    }
    ctx.clip();
    hatch(ctx, cx + drift, cy + 8, cloudW, 30, 2.4, Math.PI/3.5, 'rgba(232,220,192,0.18)', 0.5);
    ctx.restore();

    // Internal lightning shimmer
    if (Math.sin(t*8) > 0.7) {
      ctx.fillStyle = `rgba(232,184,64,0.16)`;
      ctx.beginPath();
      for (const p of puffs) {
        ctx.moveTo(p.x + p.r, p.y);
        ctx.arc(p.x, p.y, p.r, 0, T2);
      }
      ctx.fill();
    }

    // Scorch marks
    for (const p of pool) {
      if (p.kind !== 'scorch') continue;
      const a = Math.max(0, p.life / 1.2);
      ctx.fillStyle = `rgba(26,22,18,${a*0.55})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, T2); ctx.fill();
      ctx.strokeStyle = `rgba(200,148,26,${a*0.7})`;
      ctx.lineWidth = 0.6;
      drawStar(ctx, p.x, p.y, 5, 1.8, 6);
      ctx.stroke();
    }

    // Strikes — full forking bolt cloud→ground
    for (const p of pool) {
      if (p.kind !== 'strike') continue;
      const a = Math.max(0, p.life / 0.35);
      if (a <= 0) continue;
      const sR = (n) => { const x = Math.sin(p.seed + n*7919)*10000; return x - Math.floor(x); };
      const segs = 9;
      const dx = p.ex - p.sx, dy = p.ey - p.sy;
      const len = Math.hypot(dx,dy) || 1;
      const perpX = -dy/len, perpY = dx/len;
      const points = [{x:p.sx, y:p.sy}];
      for (let i = 1; i < segs; i++) {
        const k = i/segs;
        const j = (sR(i) - 0.5) * 18;
        points.push({ x: p.sx + dx*k + perpX*j, y: p.sy + dy*k + perpY*j });
      }
      points.push({x:p.ex, y:p.ey});
      ctx.lineCap = 'square';
      ctx.strokeStyle = `rgba(26,22,18,${a*0.95})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();
      ctx.strokeStyle = `rgba(232,184,64,${a})`;
      ctx.lineWidth = 0.9;
      ctx.stroke();
      // Forks
      for (let i = 2; i < points.length-1; i++) {
        if (sR(i*1097) < 0.3) {
          const dx2 = points[i+1].x - points[i-1].x;
          const dy2 = points[i+1].y - points[i-1].y;
          const len2 = Math.hypot(dx2,dy2) || 1;
          const side = sR(i*131) < 0.5 ? 1 : -1;
          const px = points[i].x + (-dy2/len2)*14*side;
          const py = points[i].y + (dx2/len2)*14*side;
          ctx.strokeStyle = `rgba(26,22,18,${a*0.7})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(px, py);
          ctx.stroke();
        }
      }
      // Endpoint flash
      ctx.fillStyle = `rgba(232,184,64,${a*0.45})`;
      ctx.beginPath(); ctx.arc(p.ex, p.ey, 12*a, 0, T2); ctx.fill();
    }
    // Sparks
    for (const p of pool) {
      if (p.kind !== 'sp') continue;
      const a = Math.max(0, p.life / 0.4);
      ctx.strokeStyle = `rgba(200,148,26,${a})`;
      ctx.lineWidth = 1;
      const len = 3 + p.age*12;
      const ang = Math.atan2(p.vy, p.vx);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + Math.cos(ang)*len, p.y + Math.sin(ang)*len);
      ctx.stroke();
    }

    // Target enemy in impact mode
    if (opts.impact) {
      drawEnemy(ctx, {
        x: cx, y: aoeY + 6, radius: 18, hp: 22, maxHp: 48, shape: 'husk',
        state: ((t/period)%1) < 0.2 ? 'hit' : 'walk',
        statuses: ['shock'],
      }, t);
    }
  }

  /* ===================================================================
     T1 DISTINCT
     =================================================================== */
  function spellBlackHole(ctx, w, h, t, dt, key) {
    const pool = getPool(key);
    const cx = w/2, cy = h/2;
    const eventR = Math.min(w,h)*0.13;
    const accretionR = eventR * 1.55;
    const pullR = Math.min(w,h)*0.4;

    // Outer faint pull halo
    const grd = ctx.createRadialGradient(cx, cy, eventR, cx, cy, pullR);
    grd.addColorStop(0, 'rgba(26,22,18,0.35)');
    grd.addColorStop(0.5, 'rgba(44,74,140,0.10)');
    grd.addColorStop(1, 'rgba(26,22,18,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(cx, cy, pullR, 0, T2); ctx.fill();

    // Light bend streaks — curved arcs around the hole
    for (let i = 0; i < 8; i++) {
      const ang = i/8*T2 + t*0.4;
      const r = pullR * 0.75;
      const startA = ang - 0.3;
      const endA = ang + 0.3;
      ctx.strokeStyle = `rgba(232,220,192,${0.45})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, startA, endA);
      ctx.stroke();
    }

    // Accretion disk — spinning ink ring with fragments
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 1.6);
    // Disk outline (vermilion + gold)
    for (let i = 0; i < 64; i++) {
      const ang = i/64*T2;
      const sweep = 0.06;
      const a = (Math.sin(ang*3 + t*5) + 1) * 0.5;
      ctx.strokeStyle = i % 8 === 0 ? `rgba(200,148,26,${0.5+a*0.4})` : `rgba(168,58,44,${0.3+a*0.5})`;
      ctx.lineWidth = i % 8 === 0 ? 1.6 : 1.0;
      ctx.beginPath();
      ctx.arc(0, 0, accretionR, ang, ang + sweep);
      ctx.stroke();
    }
    // Inner accretion edge — bright
    ctx.strokeStyle = `rgba(232,184,64,0.8)`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, accretionR*0.92, 0, T2);
    ctx.stroke();
    ctx.restore();

    // Spawn motes in spiral
    if (Math.random() < dt*30) {
      const a = Math.random()*T2;
      pool.push({
        kind: 'm', angle: a, dist: pullR*(0.6 + Math.random()*0.4),
        omega: 1.6 + Math.random()*0.8,
        pull: 30 + Math.random()*40,
        life: 1.5, age: 0,
      });
    }
    for (let i = pool.length-1; i >= 0; i--) {
      const p = pool[i];
      p.life -= dt; p.age = (p.age||0) + dt;
      if (p.life <= 0 || p.dist < eventR) { pool.splice(i,1); continue; }
      p.angle += p.omega * dt;
      p.dist -= p.pull * dt * (1 + (1 - p.dist/pullR)*0.5);
      const a = Math.min(1, 1 - p.dist/pullR);
      ctx.fillStyle = `rgba(168,58,44,${0.3 + a*0.6})`;
      const px = cx + Math.cos(p.angle)*p.dist;
      const py = cy + Math.sin(p.angle)*p.dist;
      ctx.beginPath(); ctx.arc(px, py, 1.4, 0, T2); ctx.fill();
    }

    // Event horizon — pure black with vermilion glow rim
    ctx.fillStyle = P.ink;
    ctx.beginPath(); ctx.arc(cx, cy, eventR, 0, T2); ctx.fill();
    // Bright photon ring
    ctx.strokeStyle = `rgba(232,184,64,0.95)`;
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(cx, cy, eventR, 0, T2); ctx.stroke();
    ctx.strokeStyle = `rgba(168,58,44,0.7)`;
    ctx.lineWidth = 1.0;
    ctx.beginPath(); ctx.arc(cx, cy, eventR + 2, 0, T2); ctx.stroke();
  }

  /* Fireball spec — Hydra (spawns a small head sprite that lasts) */
  function spellHydra(ctx, w, h, t, dt, key) {
    const pool = getPool(key);
    const cx = w/2, cy = h*0.65;

    // Fireball flying L→R that occasionally spawns hydras
    const period = 2.2;
    const phase = (t % period) / period;
    const fbX = -10 + phase * (w + 20);
    const fbY = h*0.4 + Math.sin(t*2)*4;

    // Spawn a hydra head when fireball passes 30% mark
    const beat = Math.floor(t / period);
    if (!pool._beat || pool._beat !== beat) {
      pool._beat = beat;
      pool._spawned = false;
    }
    if (!pool._spawned && phase > 0.35) {
      pool._spawned = true;
      const hx = w*0.5 + (Math.random()-0.5)*40;
      const hy = h*0.7;
      pool.push({ kind: 'hydra', x: hx, y: hy, life: 6, age: 0, fireT: 0 });
    }
    tickPool(pool, dt);

    // Existing hydra heads spit fireballs every 0.8s
    for (const p of pool) {
      if (p.kind !== 'hydra') continue;
      p.fireT = (p.fireT||0) + dt;
      if (p.fireT > 0.8) {
        p.fireT = 0;
        const ang = -Math.PI/2 + (Math.random()-0.5)*0.8;
        pool.push({
          kind: 'tiny', x: p.x, y: p.y - 6,
          vx: Math.cos(ang)*40, vy: Math.sin(ang)*40,
          life: 0.7, age: 0, drag: 1, gravity: -10,
        });
      }
    }

    // Draw fireball (live)
    ctx.fillStyle = 'rgba(168,58,44,0.3)';
    ctx.beginPath(); ctx.arc(fbX, fbY, 10, 0, T2); ctx.fill();
    ctx.fillStyle = P.red;
    ctx.beginPath(); ctx.arc(fbX, fbY, 6, 0, T2); ctx.fill();
    ctx.strokeStyle = P.ink; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = P.gold;
    ctx.beginPath(); ctx.arc(fbX-1, fbY-1, 2, 0, T2); ctx.fill();

    // Draw hydra heads
    for (const p of pool) {
      if (p.kind !== 'hydra') continue;
      const a = Math.max(0, p.life / 6);
      const fade = a < 0.2 ? a/0.2 : 1;
      const bob = Math.sin(p.age*4)*1.5;
      ctx.save();
      ctx.translate(p.x, p.y + bob);
      // Body — orange triangle with eye
      ctx.globalAlpha = fade;
      ctx.fillStyle = P.red;
      ctx.strokeStyle = P.ink;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(-7, 4);
      ctx.lineTo(7, 4);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Inner ember
      ctx.fillStyle = P.gold;
      ctx.beginPath(); ctx.arc(0, -2, 2, 0, T2); ctx.fill();
      // Eye
      ctx.fillStyle = P.ink;
      ctx.beginPath(); ctx.arc(0, -2, 0.8, 0, T2); ctx.fill();
      // Hatched neck
      ctx.strokeStyle = P.ink;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(-3, 4); ctx.lineTo(-2, 10);
      ctx.moveTo(3, 4); ctx.lineTo(2, 10);
      ctx.stroke();
      ctx.globalAlpha = 1;
      // Charge ring
      ctx.strokeStyle = `rgba(168,58,44,${fade*0.6})`;
      ctx.lineWidth = 0.8;
      ctx.setLineDash([2,2]);
      ctx.beginPath(); ctx.arc(0, -2, 8 + Math.sin(p.age*5)*1, 0, T2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
    // Tiny fireballs
    for (const p of pool) {
      if (p.kind !== 'tiny') continue;
      const a = Math.max(0, p.life / 0.7);
      ctx.fillStyle = `rgba(168,58,44,${a})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, T2); ctx.fill();
      ctx.fillStyle = `rgba(200,148,26,${a*0.8})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.2, 0, T2); ctx.fill();
    }
  }

  /* Fireball spec — Meteor (the spell falls from above instead of arc) */
  function spellMeteorFb(ctx, w, h, t, dt, key) {
    const pool = getPool(key);
    const period = 2.5;
    const phase = (t % period) / period;
    const beatId = Math.floor(t / period);

    // Pick a random target X per beat
    if (!pool._beat || pool._beat !== beatId) {
      pool._beat = beatId;
      const r = Math.sin(beatId*9301)*10000;
      pool._targetX = w*0.25 + ((r - Math.floor(r))) * w*0.5;
      pool._impacted = false;
    }
    const tx = pool._targetX;
    const ty = h*0.7;
    const tele = Math.min(1, phase / 0.45);

    // Telegraph
    if (phase < 0.45) {
      const r = 8 + tele*22;
      ctx.fillStyle = `rgba(26,22,18,${0.18 + tele*0.25})`;
      ctx.beginPath(); ctx.arc(tx, ty, r, 0, T2); ctx.fill();
      ctx.strokeStyle = `rgba(168,58,44,${tele*0.85})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(tx, ty, r, 0, T2); ctx.stroke();
    }
    // Comet falling 0.45–0.55
    if (phase >= 0.45 && phase < 0.6) {
      const k = (phase - 0.45) / 0.15;
      const sx = tx + 30, sy = ty - 110;
      const cx = sx + (tx-sx)*k, cy = sy + (ty-sy)*k;
      // Trail
      for (let i = 0; i < 10; i++) {
        const back = i*0.04;
        const k2 = Math.max(0, k - back);
        const px = sx + (tx-sx)*k2;
        const py = sy + (ty-sy)*k2;
        const fade = 1 - i/10;
        ctx.fillStyle = `rgba(168,58,44,${fade*0.7})`;
        ctx.beginPath(); ctx.arc(px, py, 4*fade+1, 0, T2); ctx.fill();
      }
      ctx.fillStyle = P.red;
      ctx.beginPath(); ctx.arc(cx, cy, 6, 0, T2); ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = P.gold;
      ctx.beginPath(); ctx.arc(cx-1, cy-1, 2.5, 0, T2); ctx.fill();
    }
    // Impact 0.6–0.65
    if (!pool._impacted && phase >= 0.6) {
      pool._impacted = true;
      for (let i = 0; i < 14; i++) {
        const a = i/14*T2;
        pool.push({
          kind: 'sp', x: tx, y: ty,
          vx: Math.cos(a)*100, vy: Math.sin(a)*100,
          life: 0.5, age: 0, drag: 0.93,
        });
      }
    }
    if (phase >= 0.6) {
      const fade = 1 - (phase - 0.6) / 0.4;
      ctx.fillStyle = `rgba(232,184,64,${fade*0.5})`;
      ctx.beginPath(); ctx.arc(tx, ty, 18 + (1-fade)*14, 0, T2); ctx.fill();
      ctx.strokeStyle = `rgba(168,58,44,${fade})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(tx, ty, 22 + (1-fade)*22, 0, T2); ctx.stroke();
    }
    tickPool(pool, dt);
    for (const p of pool) {
      if (p.kind !== 'sp') continue;
      const a = Math.max(0, p.life / 0.5);
      ctx.strokeStyle = `rgba(200,148,26,${a})`;
      ctx.lineWidth = 1;
      const len = 3 + p.age*16;
      const ang = Math.atan2(p.vy, p.vx);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + Math.cos(ang)*len, p.y + Math.sin(ang)*len);
      ctx.stroke();
    }
  }

  /* ===================================================================
     TELEGRAPHS
     =================================================================== */
  function teleBoss(ctx, w, h, t, dt, key) {
    const cx = w/2, cy = h/2;
    const period = 3.5;
    const phase = (t % period) / period;
    // 0–0.6 ground crack expansion, 0.6–0.9 dark mist, 0.9–1.0 boss appears
    const grow = Math.min(1, phase/0.6);
    // Cracks radiating
    ctx.strokeStyle = `rgba(168,58,44,${grow*0.85})`;
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 9; i++) {
      const a = i/9*T2;
      const len = 50 * grow;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      const segs = 4;
      for (let k = 1; k <= segs; k++) {
        const r = (len) * (k/segs);
        const j = (Math.sin(i*7919 + k*1097)*10000);
        const jit = ((j - Math.floor(j)) - 0.5) * 12 * (k/segs);
        const perp = a + Math.PI/2;
        ctx.lineTo(cx + Math.cos(a)*r + Math.cos(perp)*jit, cy + Math.sin(a)*r + Math.sin(perp)*jit);
      }
      ctx.stroke();
    }
    // Dark center
    ctx.fillStyle = `rgba(26,22,18,${grow*0.6})`;
    ctx.beginPath(); ctx.arc(cx, cy, 16*grow, 0, T2); ctx.fill();
    // Mist puffs
    if (phase > 0.5) {
      const mist = (phase - 0.5)/0.5;
      for (let i = 0; i < 6; i++) {
        const a = i/6*T2 + t;
        const r = 25 + mist*15;
        const px = cx + Math.cos(a)*r;
        const py = cy + Math.sin(a)*r;
        ctx.fillStyle = `rgba(26,22,18,${(1-mist)*0.45})`;
        ctx.beginPath(); ctx.arc(px, py, 6, 0, T2); ctx.fill();
      }
    }
    // Boss emerging at end
    if (phase > 0.85) {
      const e = (phase - 0.85)/0.15;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(e, e);
      drawGoliath(ctx, 0, 0, t, 'walk', 26);
      ctx.restore();
    }
    // Tag
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.fillStyle = `rgba(168,58,44,${0.8})`;
    ctx.textAlign = 'center';
    ctx.fillText('— BOSS APPROACHES —', cx, h - 12);
    ctx.textAlign = 'start';
  }
  function teleSpawn(ctx, w, h, t, dt, key) {
    const pool = getPool(key);
    const period = 2.2;
    const phase = (t % period) / period;
    const beat = Math.floor(t/period);
    const sites = [
      { x: w*0.25, y: h*0.4 },
      { x: w*0.55, y: h*0.3 },
      { x: w*0.78, y: h*0.55 },
    ];
    if (!pool._beat || pool._beat !== beat) {
      pool._beat = beat;
      // Kick dust at each site at start
      for (const s of sites) {
        for (let i = 0; i < 14; i++) {
          const a = -Math.PI + Math.random()*Math.PI; // upward spray
          pool.push({
            kind: 'd', x: s.x, y: s.y,
            vx: Math.cos(a)*(20+Math.random()*40),
            vy: Math.sin(a)*(20+Math.random()*40),
            life: 0.6 + Math.random()*0.3, age: 0,
            drag: 0.94, gravity: 60,
          });
        }
      }
    }
    tickPool(pool, dt);
    // Chevrons at sites
    for (const s of sites) {
      const pulse = Math.sin(t*4) * 0.5 + 0.5;
      ctx.strokeStyle = `rgba(168,58,44,${0.5 + pulse*0.4})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(s.x - 6, s.y - 8 + pulse*2);
      ctx.lineTo(s.x, s.y - 14 + pulse*2);
      ctx.lineTo(s.x + 6, s.y - 8 + pulse*2);
      ctx.stroke();
    }
    // Dust
    for (const p of pool) {
      if (p.kind !== 'd') continue;
      const a = Math.max(0, p.life / 0.9);
      ctx.fillStyle = `rgba(120,90,60,${a*0.55})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.6 + p.age*2, 0, T2); ctx.fill();
    }
    // Enemy emerges at site 0
    if (phase > 0.5) {
      const e = Math.min(1, (phase - 0.5)/0.4);
      ctx.save();
      ctx.translate(sites[0].x, sites[0].y);
      ctx.scale(e, e);
      drawShade(ctx, 0, 0, t, 'walk', 14);
      ctx.restore();
    }
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.fillStyle = `rgba(168,58,44,${0.8})`;
    ctx.textAlign = 'center';
    ctx.fillText('— WAVE INCOMING —', w/2, h - 12);
    ctx.textAlign = 'start';
  }
  function teleTarget(ctx, w, h, t, dt, key) {
    const cx = w/2, cy = h/2;
    drawMeteorTelegraph(ctx, cx, cy, ((t*0.7)%1 < 0.7) ? Math.min(1, ((t*0.7)%1)/0.7) : 1, t);
    // Player/enemy reference
    drawShade(ctx, cx - 8, cy + 6, t, 'walk', 12);
    drawSwarmling(ctx, cx + 12, cy - 4, t, 'walk', 8);
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.fillStyle = `rgba(168,58,44,${0.8})`;
    ctx.textAlign = 'center';
    ctx.fillText('— TARGET LOCK —', cx, h - 12);
    ctx.textAlign = 'start';
  }
  function teleBanner(ctx, w, h, t, dt, key) {
    // Wave banner sliding in with overshoot, settling, fading
    const period = 4.0;
    const phase = (t % period) / period;
    let y;
    if (phase < 0.3) {
      // slide in 0→0.25 with overshoot (cubic-bezier-ish)
      const k = phase / 0.3;
      // ease-out-back
      const c1 = 1.70158, c3 = c1 + 1;
      const e = 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
      y = -40 + e * (h*0.4 + 40);
    } else if (phase < 0.7) {
      y = h*0.4;
    } else {
      const k = (phase - 0.7)/0.3;
      y = h*0.4 - k*30;
    }
    const alpha = phase < 0.7 ? 1 : (1 - (phase-0.7)/0.3);
    // Banner — black ink ribbon with vermilion stripe
    ctx.globalAlpha = alpha;
    ctx.fillStyle = P.ink;
    ctx.fillRect(w*0.08, y - 18, w*0.84, 36);
    ctx.fillStyle = P.red;
    ctx.fillRect(w*0.08, y - 18, w*0.84, 3);
    ctx.fillRect(w*0.08, y + 15, w*0.84, 3);
    ctx.font = 'bold 14px "Cinzel", serif';
    ctx.fillStyle = P.paper;
    ctx.textAlign = 'center';
    ctx.fillText('WAVE  VII', w/2, y + 5);
    ctx.font = '600 8px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(232,220,192,0.5)';
    ctx.fillText('— THE FORTRESS HOLDS —', w/2, y + 16);
    ctx.textAlign = 'start';
    ctx.globalAlpha = 1;
  }

  /* ===================================================================
     CAMERA SHAKE DEMO RENDER
     =================================================================== */
  function shakeDemo(ctx, w, h, t, dt, key, level) {
    // Period = trigger every 1.6s
    const period = 1.6;
    const phase = (t % period) / period;
    const beat = Math.floor(t/period);
    if (!shakeDemo._beats) shakeDemo._beats = new Map();
    const last = shakeDemo._beats.get(key);
    if (last !== beat) {
      shakeDemo._beats.set(key, beat);
      const presets = [
        { amp: 2, dur: 0.12 },
        { amp: 5, dur: 0.22 },
        { amp: 9, dur: 0.4 },
        { amp: 14, dur: 0.7 },
      ];
      const preset = presets[level];
      addShake(key, preset.amp, preset.dur, t);
    }
    ctx.save();
    applyShake(ctx, key, t);
    // Simple combat tableau — magician + 2 enemies
    drawMagician(ctx, w*0.3, h*0.55, t, phase < 0.1 ? 'cast' : 'idle');
    drawHusk(ctx, w*0.7, h*0.55, t, phase < 0.2 ? 'hit' : 'idle', 18);
    // Hit burst on impact
    if (phase < 0.2) {
      const ph = phase / 0.2;
      const colors = ['rgba(168,58,44,', 'rgba(200,148,26,', 'rgba(168,58,44,', 'rgba(168,58,44,'];
      drawHitImpact(ctx, w*0.7, h*0.55, ph, { r0: 6, r1: 24, dmg: ['12','38!','120!','340!'][level], rays: 8, color: colors[level] });
    }
    ctx.restore();
  }

  /* ===================================================================
     IMPACT BURST DEMO
     =================================================================== */
  function burstDemo(ctx, w, h, t, dt, key, kind) {
    drawHusk(ctx, w/2, h/2, t, 'hit', 18);
    const period = 1.2;
    const phase = (t % period) / period;
    if (phase < 0.6) {
      const ph = phase / 0.6;
      const fns = { hit: burstHit, crit: burstCrit, resist: burstResist, vuln: burstVuln, death: burstDeath };
      fns[kind](ctx, w/2, h/2, ph);
    }
  }

  /* ===================================================================
     HERO METEOR SCENE
     =================================================================== */
  function heroMeteor(ctx, w, h, t, dt, key) {
    drawPaper(ctx, w, h, t, { seed: 42 });

    ctx.save();
    applyShake(ctx, key, t);

    // Player
    const px = w*0.25, py = h*0.7;
    drawMagician(ctx, px, py, t, 'cast');

    // Some enemies
    const enemies = [
      { x: w*0.5,  y: h*0.5,  radius: 14, hp: 6, maxHp: 18, shape: 'shade', state: 'walk', statuses: ['ignite'] },
      { x: w*0.62, y: h*0.55, radius: 11, hp: 8, maxHp: 14, shape: 'wisp',  state: 'walk', statuses: ['shock'] },
      { x: w*0.45, y: h*0.62, radius: 14, hp: 10, maxHp: 18, shape: 'shade', state: 'walk' },
      { x: w*0.7, y: h*0.4, radius: 22, hp: 80, maxHp: 240, shape: 'bulwark', state: 'idle' },
      { x: w*0.85, y: h*0.66, radius: 18, hp: 28, maxHp: 48, shape: 'husk', state: 'walk', statuses: ['slow'] },
    ];

    // Storm cloud upper-left zapping
    spellStormCloud3.call({}, ctx, w, h, t, dt, key + '-sc', { impact: true });

    // Snow Fort behind player
    spellSnowFort(ctx, w, h, t, dt, key + '-sf', { impact: false });

    // Meteor in center
    spellMeteor(ctx, w, h, t, dt, key + '-mt', {});

    // Enemies (drawn after spells so they sit on top of ground effects)
    for (const e of enemies) {
      // Push enemies away on meteor impact
      const meteorPhase = (t % 3.0) / 3.0;
      let ox = 0, oy = 0;
      if (meteorPhase > 0.30 && meteorPhase < 0.6) {
        const k = 1 - (meteorPhase - 0.30)/0.3;
        const dx = e.x - w/2, dy = e.y - h*0.6;
        const d = Math.hypot(dx,dy) || 1;
        if (d < 80) {
          const push = (1 - d/80) * 12 * k;
          ox = dx/d * push;
          oy = dy/d * push;
          e.state = 'hit';
        }
      }
      drawEnemy(ctx, { ...e, x: e.x + ox, y: e.y + oy }, t);
    }

    ctx.restore();

    // Vignette frame
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 2;
    ctx.strokeRect(0,0,w,h);
  }

  /* ===================================================================
     SCENE WIRING
     =================================================================== */
  const scenes = [];
  function register(canvas, fn) {
    const c = setupCanvas(canvas);
    const key = canvas.dataset._key3 || (canvas.dataset._key3 = Math.random().toString(36).slice(2));
    scenes.push({ canvas, ctx: c.ctx, w: c.w, h: c.h, fn, key });
  }
  function bg(ctx, w, h, t, seed) { drawPaper(ctx, w, h, t, { seed }); }
  function frame(ctx, w, h) {
    ctx.strokeStyle = 'rgba(26,22,18,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w-1, h-1);
  }

  function init() {
    // Hero
    document.querySelectorAll('canvas[data-v3-hero]').forEach(c => {
      register(c, (ctx, w, h, t, dt, key) => heroMeteor(ctx, w, h, t, dt, key));
    });

    // Spells
    const spellMap = {
      snowfort: spellSnowFort,
      fireshield: spellFireShield,
      shocktower: spellShockTower,
      gravital: spellGravital,
      meteor: spellMeteor,
      snowstorm: spellSnowStorm,
      wormhole: spellWormhole,
      stormcloud3: spellStormCloud3,
      blackhole: spellBlackHole,
      hydra: spellHydra,
      'meteor-fb': spellMeteorFb,
    };
    document.querySelectorAll('canvas[data-v3-spell]').forEach(c => {
      const k = c.dataset.v3Spell;
      const mode = c.dataset.mode;
      const fn = spellMap[k];
      if (!fn) return;
      register(c, (ctx, w, h, t, dt, key) => {
        bg(ctx, w, h, t, k.charCodeAt(0));
        fn(ctx, w, h, t, dt, key, { impact: mode === 'impact', mode });
        frame(ctx, w, h);
      });
    });

    // Camera shake
    document.querySelectorAll('canvas[data-v3-shake]').forEach(c => {
      const lvl = parseInt(c.dataset.v3Shake, 10);
      register(c, (ctx, w, h, t, dt, key) => {
        bg(ctx, w, h, t, 100 + lvl);
        shakeDemo(ctx, w, h, t, dt, key, lvl);
        frame(ctx, w, h);
      });
    });

    // Hit bursts
    document.querySelectorAll('canvas[data-v3-burst]').forEach(c => {
      const k = c.dataset.v3Burst;
      register(c, (ctx, w, h, t, dt, key) => {
        bg(ctx, w, h, t, 200 + k.charCodeAt(0));
        burstDemo(ctx, w, h, t, dt, key, k);
        frame(ctx, w, h);
      });
    });

    // Telegraphs
    document.querySelectorAll('canvas[data-v3-tele]').forEach(c => {
      const k = c.dataset.v3Tele;
      const map = { boss: teleBoss, spawn: teleSpawn, target: teleTarget, banner: teleBanner };
      const fn = map[k];
      if (!fn) return;
      register(c, (ctx, w, h, t, dt, key) => {
        bg(ctx, w, h, t, 300 + k.charCodeAt(0));
        fn(ctx, w, h, t, dt, key);
        frame(ctx, w, h);
      });
    });

    // Resize
    window.addEventListener('resize', () => {
      for (const s of scenes) {
        const rect = s.canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        s.canvas.width  = Math.max(1, Math.floor(rect.width  * dpr));
        s.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
        s.ctx = s.canvas.getContext('2d');
        s.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        s.w = rect.width; s.h = rect.height;
      }
    });

    // Loop
    const start = performance.now();
    let lastFrame = start;
    function loop(now) {
      const t = (now - start)/1000;
      const dt = Math.min(0.05, (now - lastFrame)/1000);
      lastFrame = now;
      for (const s of scenes) {
        const r = s.canvas.getBoundingClientRect();
        if (r.bottom < -50 || r.top > window.innerHeight + 50) continue;
        s.ctx.clearRect(0, 0, s.w, s.h);
        s.fn(s.ctx, s.w, s.h, t, dt, s.key);
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  // Expose for the codex
  window.CodexV3 = {
    spellSnowFort, spellFireShield, spellShockTower, spellGravital,
    spellMeteor, spellSnowStorm, spellWormhole, spellStormCloud3,
    spellBlackHole, spellHydra, spellMeteorFb,
    burstHit, burstCrit, burstResist, burstVuln, burstDeath, burstDemo,
    teleBoss, teleSpawn, teleTarget, teleBanner,
    drawMeteorTelegraph,
  };

  // Wait for v2 to set up its globals & the DOM to be ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 0);
  } else {
    window.addEventListener('load', init);
  }

})();
