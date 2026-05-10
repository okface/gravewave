/* =====================================================================
   GRAVEWAVE — CODEX v4
   Builds on v2 primitives (PAL, TAU, drawStar, hatch, drawPaper,
   getPool/tickPool, drawMagician, drawEnemy) and v3 IIFE bursts.
   Adds: 4 companion visuals, refreshed T1 sigils, codex-only helpers.
   ===================================================================== */
(function(){
  'use strict';
  const T2 = Math.PI * 2;

  /* ===================================================================
     SHARED COMPANION CHASSIS
     Every companion has the same skeleton: idle bob, signature shape,
     ink shadow, hp/charge dot.  Differentiation is in the ornament,
     particles, and the ability moment.
     =================================================================== */
  function inkShadow(ctx, x, y, w) {
    ctx.fillStyle = 'rgba(26,22,18,0.42)';
    ctx.beginPath(); ctx.ellipse(x, y, w, w*0.32, 0, 0, T2); ctx.fill();
  }

  /* ===================================================================
     COMPANION — SIGIL LINKER
     A levitating heraldic sigil that threads 3 nearest foes with
     ink filaments.  When any threaded foe is struck, a vermilion
     pulse cascades along the threads to the others (overkill bleeds).
     Visual signature: HEXAGRAM + TRAVELING PULSES + INK WEFT
     =================================================================== */
  function compSigilLinker(ctx, w, h, t, dt, key, opts={}) {
    const pool = getPool(key);
    const wizX = w*0.30, wizY = h*0.62;
    drawMagician(ctx, wizX, wizY, t, 'idle');

    // Sigil hovers slightly above + ahead of wizard
    const sx = wizX + 28 + Math.sin(t*1.1)*1.5;
    const sy = wizY - 10 + Math.cos(t*1.4)*1.2;
    inkShadow(ctx, sx, sy + 22, 9);

    // Three target enemies with HP rings
    const targets = [
      { x: w*0.62, y: h*0.36, hp: 0.62, shape:'shade'  },
      { x: w*0.78, y: h*0.58, hp: 0.32, shape:'goon'   },
      { x: w*0.55, y: h*0.78, hp: 0.84, shape:'shade'  },
    ];
    targets.forEach((e,i) => {
      drawEnemy(ctx, { x:e.x, y:e.y, radius:13, hp:e.hp*20, maxHp:20, shape:e.shape,
        state: opts.impact && i === 0 && (((t*0.85)%1) < 0.18) ? 'hit' : 'walk',
        statuses: null }, t);
    });

    // Ink filaments — slightly curved, drifting, with travelling beads
    const period = 1.5;
    const phase = (t % period) / period;
    targets.forEach((e,i) => {
      const mx = (sx + e.x)/2 + Math.sin(t*0.7 + i)*6;
      const my = (sy + e.y)/2 - 14 - Math.cos(t*0.9 + i)*5;
      // Thread
      ctx.strokeStyle = 'rgba(26,22,18,0.55)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(mx, my, e.x, e.y - 4);
      ctx.stroke();
      // Subtle vermilion glow underneath when active
      ctx.strokeStyle = 'rgba(168,58,44,0.18)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(mx, my, e.x, e.y - 4);
      ctx.stroke();
      // Cascade pulse: bead travels from sigil to target on impact mode
      if (opts.impact) {
        const off = (phase + i*0.18) % 1;
        const u = off;
        const px = (1-u)*(1-u)*sx + 2*(1-u)*u*mx + u*u*e.x;
        const py = (1-u)*(1-u)*sy + 2*(1-u)*u*my + u*u*(e.y-4);
        ctx.fillStyle = 'rgba(216,98,76,0.95)';
        ctx.beginPath(); ctx.arc(px, py, 2.2, 0, T2); ctx.fill();
        ctx.fillStyle = 'rgba(232,184,64,0.85)';
        ctx.beginPath(); ctx.arc(px, py, 1.0, 0, T2); ctx.fill();
        // Sparks at impact tail
        if (u > 0.92 && Math.random() < dt*30) {
          pool.push({ kind:'spark', x:e.x, y:e.y-4,
            vx:(Math.random()-0.5)*30, vy:-10-Math.random()*20,
            life:0.35, age:0, drag:0.92 });
        }
      }
    });

    // Sigil body — hexagram + circle, ink with vermilion fill
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(t*0.3);
    // Halo
    ctx.strokeStyle = 'rgba(168,58,44,0.25)';
    ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(0,0,11,0,T2); ctx.stroke();
    // Ring
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.arc(0,0,8,0,T2); ctx.stroke();
    // Hexagram — two triangles
    ctx.fillStyle = PAL.paper;
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = 1.1;
    for (let s = 0; s < 2; s++) {
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = i/3*T2 + (s ? Math.PI/3 : 0) - Math.PI/2;
        const x = Math.cos(a)*7, y = Math.sin(a)*7;
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    // Center vermilion pip
    ctx.fillStyle = PAL.red;
    ctx.beginPath(); ctx.arc(0,0,1.6,0,T2); ctx.fill();
    ctx.restore();

    // Ticks of pool
    tickPool(pool, dt);
    for (const p of pool) {
      if (p.kind === 'spark') {
        const a = p.life / 0.35;
        ctx.strokeStyle = `rgba(168,58,44,${a})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx*0.02, p.y - p.vy*0.02);
        ctx.stroke();
      }
    }
  }

  /* ===================================================================
     COMPANION — DECOY EFFIGY
     A straw‑and‑twine effigy nailed to ground, taunts enemies inside
     radius, detonates on death.  Has its own HP bar.
     Visual signature: STRAW MANNEQUIN + AGGRO BANDS + DETONATE FRAME
     =================================================================== */
  function compDecoyEffigy(ctx, w, h, t, dt, key, opts={}) {
    const pool = getPool(key);
    const cx = w*0.5, cy = h*0.62;
    inkShadow(ctx, cx, cy + 22, 18);

    // Lifecycle: 0–0.7 alive, 0.7–0.85 strain (cracks), 0.85–1.0 detonate
    const life = opts.impact ? ((t*0.45) % 1) : 0.4;
    const dying  = life > 0.85;
    const strain = life > 0.7 && life <= 0.85;
    const detonatePhase = dying ? (life - 0.85)/0.15 : 0;

    // Aggro radius — pulsating concentric red bands while alive
    if (!dying) {
      const r = 70;
      for (let i = 0; i < 3; i++) {
        const ph = ((t*0.6 + i*0.33) % 1);
        const rr = r * (0.4 + ph*0.6);
        ctx.strokeStyle = `rgba(168,58,44,${(1-ph)*0.42})`;
        ctx.lineWidth = 1.2 - ph*0.6;
        ctx.setLineDash([3,4]);
        ctx.beginPath(); ctx.arc(cx, cy+10, rr, 0, T2); ctx.stroke();
      }
      ctx.setLineDash([]);
      // Faint floor stain
      ctx.fillStyle = 'rgba(168,58,44,0.06)';
      ctx.beginPath(); ctx.arc(cx, cy+10, r, 0, T2); ctx.fill();
    }

    // Two enemies pulled toward effigy from sides
    if (opts.impact && !dying) {
      const drift = Math.sin(t*1.4)*4;
      drawEnemy(ctx, { x: cx-46+drift*0.4, y: cy-6, radius:13, hp:14, maxHp:18, shape:'shade',
        state:'walk', statuses:null }, t);
      drawEnemy(ctx, { x: cx+44-drift*0.4, y: cy+8, radius:14, hp:9, maxHp:18, shape:'goon',
        state:'walk', statuses:null }, t);
    }

    if (!dying) {
      // Effigy body — straw bundle
      ctx.save();
      ctx.translate(cx, cy);
      // Strain wobble
      const wob = strain ? Math.sin(t*40)*1.2 : 0;
      ctx.rotate(wob*0.04);
      // Stake (the "nailed to ground")
      ctx.strokeStyle = PAL.inkSoft;
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(0, 22); ctx.lineTo(0, 30); ctx.stroke();
      // Body — burlap rectangle with stitches
      ctx.fillStyle = '#c8a56e';
      ctx.strokeStyle = PAL.ink;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-12, -4); ctx.lineTo(12, -4);
      ctx.lineTo(10, 22); ctx.lineTo(-10, 22);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Cross stitches
      ctx.strokeStyle = PAL.inkSoft;
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 3; i++) {
        const yy = -1 + i*7;
        ctx.beginPath(); ctx.moveTo(-10, yy); ctx.lineTo(10, yy); ctx.stroke();
      }
      // Twine belt — vermilion
      ctx.strokeStyle = PAL.red;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-11, 12); ctx.lineTo(11, 12); ctx.stroke();
      // Arms — twigs
      ctx.strokeStyle = PAL.ink;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-12, 0); ctx.lineTo(-22, 5); ctx.moveTo(-22, 5); ctx.lineTo(-21, 11);
      ctx.moveTo(12, 0); ctx.lineTo(22, 5); ctx.moveTo(22, 5); ctx.lineTo(21, 11);
      ctx.stroke();
      // Head — burlap sack with X eyes
      ctx.fillStyle = '#d6b07a';
      ctx.beginPath(); ctx.arc(0, -12, 9, 0, T2); ctx.fill();
      ctx.strokeStyle = PAL.ink; ctx.lineWidth = 1.2;
      ctx.stroke();
      // X eyes
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-4, -14); ctx.lineTo(-2, -12);
      ctx.moveTo(-2, -14); ctx.lineTo(-4, -12);
      ctx.moveTo( 2, -14); ctx.lineTo( 4, -12);
      ctx.moveTo( 4, -14); ctx.lineTo( 2, -12);
      ctx.stroke();
      // Stitched mouth
      ctx.strokeStyle = PAL.red;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      for (let i = -3; i <= 3; i++) {
        ctx.moveTo(i, -8); ctx.lineTo(i+0.5, -8 + ((i%2)?1:-1));
      }
      ctx.stroke();
      // Crown of thorns — small horns top
      ctx.strokeStyle = PAL.ink;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-6, -19); ctx.lineTo(-7, -23);
      ctx.moveTo( 0, -20); ctx.lineTo( 0, -25);
      ctx.moveTo( 6, -19); ctx.lineTo( 7, -23);
      ctx.stroke();
      // Strain cracks
      if (strain) {
        ctx.strokeStyle = PAL.red;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(-6, 4); ctx.lineTo(-2, 8); ctx.lineTo(-4, 14);
        ctx.moveTo( 5, 0); ctx.lineTo( 7, 8); ctx.lineTo( 4, 16);
        ctx.stroke();
        // Tiny embers leaking
        if (Math.random() < dt*40) {
          pool.push({ kind:'em', x:cx + (Math.random()-0.5)*16, y:cy + (Math.random()-0.5)*16,
            vx:(Math.random()-0.5)*8, vy:-15-Math.random()*10,
            life:0.5, age:0, drag:0.94 });
        }
      }
      ctx.restore();

      // HP bar above
      const hp = 1 - life/0.85;
      const bw = 30, bh = 3;
      ctx.fillStyle = 'rgba(26,22,18,0.4)';
      ctx.fillRect(cx - bw/2, cy - 36, bw, bh);
      ctx.fillStyle = PAL.red;
      ctx.fillRect(cx - bw/2, cy - 36, bw*hp, bh);
      ctx.strokeStyle = PAL.ink; ctx.lineWidth = 0.8;
      ctx.strokeRect(cx - bw/2, cy - 36, bw, bh);
    }

    // Detonate
    if (dying) {
      const dp = detonatePhase;
      const a = 1 - dp;
      // Big vermilion ring + outer ink
      ctx.strokeStyle = `rgba(168,58,44,${a})`;
      ctx.lineWidth = 3 - dp*2;
      ctx.beginPath(); ctx.arc(cx, cy+6, 12 + dp*70, 0, T2); ctx.stroke();
      ctx.strokeStyle = `rgba(26,22,18,${a*0.7})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy+6, 18 + dp*78, 0, T2); ctx.stroke();
      // Fill flash
      ctx.fillStyle = `rgba(168,58,44,${a*0.35})`;
      ctx.beginPath(); ctx.arc(cx, cy+6, 12 + dp*70, 0, T2); ctx.fill();
      // 14 straw shards flying outward
      for (let i = 0; i < 14; i++) {
        const ang = i/14*T2 + 0.2;
        const dist = dp * (50 + (i%3)*20);
        const sxp = cx + Math.cos(ang)*dist;
        const syp = cy + Math.sin(ang)*dist;
        ctx.save();
        ctx.translate(sxp, syp);
        ctx.rotate(ang + dp*2);
        ctx.strokeStyle = `rgba(168,140,80,${a})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.stroke();
        ctx.restore();
      }
      // Black ink puff
      ctx.fillStyle = `rgba(26,22,18,${a*0.55})`;
      ctx.beginPath(); ctx.arc(cx, cy+6, 8 + dp*22, 0, T2); ctx.fill();
    }

    tickPool(pool, dt);
    for (const p of pool) {
      if (p.kind === 'em') {
        const a = p.life / 0.5;
        ctx.fillStyle = `rgba(168,58,44,${a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.2, 0, T2); ctx.fill();
      }
    }
  }

  /* ===================================================================
     COMPANION — MENDER WISP
     A pale gold wisp that orbits the wizard and drifts a healing
     ribbon to them every cadence.  Plus signs rise from impact.
     Visual signature: WANDERING WISP + GOLD RIBBON + + GLYPHS
     =================================================================== */
  function compMenderWisp(ctx, w, h, t, dt, key, opts={}) {
    const pool = getPool(key);
    const wizX = w*0.5, wizY = h*0.62;
    drawMagician(ctx, wizX, wizY, t, 'idle');

    // Wisp orbits with drift — Lissajous so it doesn't feel like a clock
    const period = opts.impact ? 2.0 : 3.0;
    const phase  = (t % period) / period;
    const ang = t*0.9;
    const orx = 36 + Math.sin(t*0.6)*8;
    const ory = 22 + Math.cos(t*0.7)*5;
    const wx = wizX + Math.cos(ang)*orx;
    const wy = wizY - 6 + Math.sin(ang*1.5)*ory*0.4;

    // Trail dots — analytic past positions
    for (let k = 1; k <= 7; k++) {
      const back = k * 0.06;
      const a2 = ang - back*0.9;
      const tx = wizX + Math.cos(a2)*orx;
      const ty = wizY - 6 + Math.sin(a2*1.5)*ory*0.4;
      const fade = (1 - k/8) * 0.7;
      ctx.fillStyle = `rgba(232,184,64,${fade*0.6})`;
      ctx.beginPath(); ctx.arc(tx, ty, 1.6 - k*0.15, 0, T2); ctx.fill();
    }

    // HEAL CADENCE: in last 0.35 of period, send a ribbon of light to wizard
    const heal = phase > 0.65;
    if (heal && opts.impact) {
      const hp = (phase - 0.65) / 0.35;
      // Ribbon: bezier from wisp to wizard, multi-stroke for thickness fade
      const mx = (wx + wizX)/2;
      const my = (wy + wizY)/2 - 24 - hp*10;
      for (let s = 0; s < 4; s++) {
        ctx.strokeStyle = `rgba(232,184,64,${(1-hp)*(0.55 - s*0.13)})`;
        ctx.lineWidth = 5 - s*1.1;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.quadraticCurveTo(mx, my, wizX, wizY - 8);
        ctx.stroke();
      }
      // Plus glyphs rising at wizard
      if (hp > 0 && hp < 0.05) {
        for (let i = 0; i < 3; i++) {
          pool.push({ kind:'plus', x:wizX + (Math.random()-0.5)*14, y:wizY - 18,
            vx:(Math.random()-0.5)*5, vy:-22-Math.random()*8,
            life:1.0, age:0, drag:0.99 });
        }
      }
      // Health pulse on wizard — gold concentric
      const a = 1 - hp;
      ctx.strokeStyle = `rgba(232,184,64,${a*0.8})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(wizX, wizY - 6, 18 + hp*22, 0, T2); ctx.stroke();
    }

    inkShadow(ctx, wx, wy + 8, 4);

    // Wisp body — paper core with gold halo + tiny cross
    // Outer halo
    ctx.fillStyle = 'rgba(232,184,64,0.32)';
    ctx.beginPath(); ctx.arc(wx, wy, 8, 0, T2); ctx.fill();
    ctx.fillStyle = 'rgba(232,184,64,0.55)';
    ctx.beginPath(); ctx.arc(wx, wy, 5.4, 0, T2); ctx.fill();
    // Paper core
    ctx.fillStyle = PAL.paper;
    ctx.beginPath(); ctx.arc(wx, wy, 3.4, 0, T2); ctx.fill();
    ctx.strokeStyle = PAL.ink; ctx.lineWidth = 0.9;
    ctx.stroke();
    // Cross glyph inside
    ctx.strokeStyle = PAL.gold;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(wx - 1.6, wy); ctx.lineTo(wx + 1.6, wy);
    ctx.moveTo(wx, wy - 1.6); ctx.lineTo(wx, wy + 1.6);
    ctx.stroke();

    // Cadence pip — small ring filling around wisp
    const pipR = 11;
    ctx.strokeStyle = 'rgba(26,22,18,0.4)';
    ctx.lineWidth = 0.8;
    ctx.setLineDash([2,3]);
    ctx.beginPath(); ctx.arc(wx, wy, pipR, 0, T2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = PAL.gold;
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(wx, wy, pipR, -Math.PI/2, -Math.PI/2 + phase*T2); ctx.stroke();

    tickPool(pool, dt);
    for (const p of pool) {
      if (p.kind === 'plus') {
        const a = p.life / 1.0;
        ctx.strokeStyle = `rgba(200,148,26,${a})`;
        ctx.lineWidth = 1.4;
        const s = 3;
        ctx.beginPath();
        ctx.moveTo(p.x - s, p.y); ctx.lineTo(p.x + s, p.y);
        ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x, p.y + s);
        ctx.stroke();
      }
    }
  }

  /* ===================================================================
     COMPANION — WAR DRUMMER
     A standing drum that follows the wizard, cycles 3 auras
     (Vigor=red, Ward=blue, Haste=gold).  Stick strikes drum on cadence
     and a colored ring expands on the beat.
     Visual signature: DRUM + STICK STRIKE + AURA RING + GLYPH BANNER
     =================================================================== */
  function compWarDrummer(ctx, w, h, t, dt, key, opts={}) {
    const pool = getPool(key);
    const wizX = w*0.34, wizY = h*0.62;
    drawMagician(ctx, wizX, wizY, t, 'idle');

    const dx = wizX + 44;
    const dy = wizY + 4;
    inkShadow(ctx, dx, dy + 22, 16);

    // Aura cycle — 3 phases, 4s each (compressed for lab)
    const cyclePeriod = 6.0;
    const cyclePhase  = (t % cyclePeriod) / cyclePeriod;
    const auraIdx     = Math.floor(cyclePhase * 3) % 3;
    const auras = [
      { id:'vigor', name:'VIGOR', color: PAL.red,    glyph:'sword'  },
      { id:'ward',  name:'WARD',  color: PAL.blue,   glyph:'shield' },
      { id:'haste', name:'HASTE', color: PAL.gold,   glyph:'wing'   },
    ];
    const aura = auras[auraIdx];

    // Aura field — large soft ring of current color around wizard
    ctx.fillStyle = aura.color + '22';
    ctx.beginPath(); ctx.arc(wizX, wizY, 60, 0, T2); ctx.fill();
    ctx.strokeStyle = aura.color + '55';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.beginPath(); ctx.arc(wizX, wizY, 60, 0, T2); ctx.stroke();
    ctx.setLineDash([]);

    // Beat — every 0.6s a strike → ring pulse
    const beatPeriod = 0.6;
    const beatPhase = (t % beatPeriod) / beatPeriod;
    const struck = beatPhase < 0.18;

    // Strike pulse rings (last 3 beats)
    for (let i = 0; i < 3; i++) {
      const b = ((t - i*beatPeriod) % beatPeriod) / beatPeriod;
      if (b > 0.7) continue;
      const tt = (t - i*beatPeriod);
      const idx = Math.floor((tt % cyclePeriod) / cyclePeriod * 3) % 3;
      const c = auras[idx].color;
      const a = (1 - b/0.7) * 0.55;
      const r = 4 + b*72;
      ctx.strokeStyle = c + Math.floor(a*255).toString(16).padStart(2,'0');
      ctx.lineWidth = 1.6 - b*1.2;
      ctx.beginPath(); ctx.arc(dx, dy - 6, r, 0, T2); ctx.stroke();
    }

    // Drum body
    ctx.save();
    ctx.translate(dx, dy + (struck?1:0));
    // Legs
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-9, 12); ctx.lineTo(-12, 22);
    ctx.moveTo( 9, 12); ctx.lineTo( 12, 22);
    ctx.stroke();
    // Cylinder back (ellipse top)
    ctx.fillStyle = PAL.paper2;
    ctx.strokeStyle = PAL.ink;
    ctx.lineWidth = 1.4;
    // body rect
    ctx.beginPath();
    ctx.moveTo(-13, -8); ctx.lineTo(13, -8); ctx.lineTo(13, 12); ctx.lineTo(-13, 12);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Skin top — paper, with active aura glyph
    ctx.fillStyle = PAL.paper;
    ctx.beginPath(); ctx.ellipse(0, -8, 13, 5, 0, 0, T2); ctx.fill();
    ctx.stroke();
    // Glyph stamp on skin — simple aura mark
    ctx.fillStyle = aura.color;
    ctx.strokeStyle = aura.color;
    ctx.lineWidth = 1.4;
    if (aura.glyph === 'sword') {
      ctx.beginPath();
      ctx.moveTo(-3, -11); ctx.lineTo(3, -5);
      ctx.moveTo(-1, -8);  ctx.lineTo(-3, -7);
      ctx.stroke();
    } else if (aura.glyph === 'shield') {
      ctx.beginPath();
      ctx.moveTo(0, -11); ctx.lineTo(4, -10); ctx.lineTo(3, -6);
      ctx.lineTo(0, -4); ctx.lineTo(-3, -6); ctx.lineTo(-4, -10);
      ctx.closePath();
      ctx.stroke();
    } else if (aura.glyph === 'wing') {
      ctx.beginPath();
      ctx.moveTo(-5, -8); ctx.quadraticCurveTo(-1, -12, 5, -8);
      ctx.moveTo(-3, -7); ctx.quadraticCurveTo( 0, -10, 4, -7);
      ctx.stroke();
    }
    // Vermilion / blue / gold rope tightening cords (X laces)
    ctx.strokeStyle = aura.color;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const lx = -13 + i*7;
      ctx.moveTo(lx, -6); ctx.lineTo(lx + 5, 10);
    }
    ctx.stroke();
    // Drumstick — animated strike
    const stickAng = struck ? -0.3 + (beatPhase/0.18)*1.0 : 1.0;
    ctx.save();
    ctx.translate(-2, -10);
    ctx.rotate(-stickAng);
    ctx.strokeStyle = PAL.inkSoft;
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -16); ctx.stroke();
    ctx.fillStyle = PAL.ink;
    ctx.beginPath(); ctx.arc(0, -17, 1.8, 0, T2); ctx.fill();
    ctx.restore();
    ctx.restore();

    // Aura banner above wizard
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    const sub = (cyclePhase * 3) % 1;
    const slide = sub < 0.1 ? (1 - sub/0.1)*-6 : (sub > 0.9 ? (sub - 0.9)/0.1 * 6 : 0);
    ctx.fillStyle = aura.color;
    ctx.fillText(aura.name, wizX + slide, wizY - 38);
    // Underline
    ctx.strokeStyle = aura.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(wizX - 14 + slide, wizY - 34);
    ctx.lineTo(wizX + 14 + slide, wizY - 34);
    ctx.stroke();
    ctx.textAlign = 'start';

    tickPool(pool, dt);
  }

  /* ===================================================================
     EXPORT
     =================================================================== */
  window.CodexV4 = {
    compSigilLinker, compDecoyEffigy, compMenderWisp, compWarDrummer,
  };
})();
