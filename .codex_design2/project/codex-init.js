/* =====================================================================
   GRAVEWAVE — CODEX INIT
   Wires the Spell Codex page up to v2/v3/v4 visual primitives.
   Uses the global `register` and shared `scenes` from v2; the v3 spells,
   bursts and telegraphs come through window.CodexV3; companions through
   window.CodexV4.
   ===================================================================== */
(function(){
  'use strict';
  const TT = Math.PI * 2;

  // ── HERO ──
  // A montage: blackhole + storm cloud + frost bolt + meteor crater
  // afterglow, tiled at thirds across the wide canvas.
  function renderCodexHero(ctx, w, h, t, dt, key) {
    drawPaper(ctx, w, h, t, { seed: 31 });

    // Background dust band
    ctx.fillStyle = 'rgba(168,58,44,0.04)';
    ctx.fillRect(0, h*0.55, w, h*0.4);

    const cellW = w/4;

    // Cell 1 — Black Hole
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, cellW, h); ctx.clip();
    window.CodexV3.spellBlackHole(ctx, cellW*2, h*1.2, t, dt, key+'-bh');
    ctx.restore();

    // Cell 2 — Storm cloud, smaller frame
    ctx.save();
    ctx.translate(cellW, 0);
    ctx.beginPath(); ctx.rect(0, 0, cellW, h); ctx.clip();
    window.CodexV3.spellStormCloud3(ctx, cellW*1.6, h, t, dt, key+'-sc', { impact: true });
    ctx.restore();

    // Cell 3 — Frost bolt loop
    ctx.save();
    ctx.translate(cellW*2, 0);
    ctx.beginPath(); ctx.rect(0, 0, cellW, h); ctx.clip();
    spellFrost(ctx, cellW, h, t, dt, key+'-fb', {});
    ctx.restore();

    // Cell 4 — Meteor crater post
    ctx.save();
    ctx.translate(cellW*3, 0);
    ctx.beginPath(); ctx.rect(0, 0, cellW, h); ctx.clip();
    window.CodexV3.spellMeteor(ctx, cellW, h, t, dt, key+'-mt', {});
    ctx.restore();

    // Vertical dividers
    ctx.strokeStyle = 'rgba(26,22,18,0.12)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(cellW*i, 12); ctx.lineTo(cellW*i, h-12); ctx.stroke();
    }
    // Cell labels
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#3a322a';
    ctx.textAlign = 'left';
    ['BLACK HOLE · GRAV','STORM CLOUD · ELEC','FROST BOLT · FROST','METEOR · FIRE'].forEach((txt,i) => {
      ctx.fillText(txt, cellW*i + 12, h - 14);
    });
  }

  // ── COMPANION dispatcher ──
  const companions = {
    'comp-sigil':   window.CodexV4.compSigilLinker,
    'comp-decoy':   window.CodexV4.compDecoyEffigy,
    'comp-mender':  window.CodexV4.compMenderWisp,
    'comp-drummer': window.CodexV4.compWarDrummer,
  };

  // ── V2 T1 dispatcher ──
  const t1 = {
    fireball:  spellFireball,
    lightning: spellLightning,
    frost:     spellFrost,
  };

  // ── V3 dispatcher ──
  const v3 = {
    snowfort:    window.CodexV3.spellSnowFort,
    fireshield:  window.CodexV3.spellFireShield,
    shocktower:  window.CodexV3.spellShockTower,
    gravital:    window.CodexV3.spellGravital,
    meteor:      window.CodexV3.spellMeteor,
    snowstorm:   window.CodexV3.spellSnowStorm,
    wormhole:    window.CodexV3.spellWormhole,
    stormcloud3: window.CodexV3.spellStormCloud3,
    blackhole:   window.CodexV3.spellBlackHole,
    hydra:       window.CodexV3.spellHydra,
    'meteor-fb': window.CodexV3.spellMeteorFb,
  };

  // Light paper background w/ frame
  function bg(ctx, w, h, t, seed) {
    drawPaper(ctx, w, h, t, { seed: seed || 0 });
  }
  function frame(ctx, w, h) {
    ctx.strokeStyle = 'rgba(26,22,18,0.30)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w-1, h-1);
  }

  // ── BURST DEMO ──
  function burstAt(ctx, w, h, t, dt, key, kind) {
    const map = {
      hit:    window.CodexV3.burstHit,
      crit:   window.CodexV3.burstCrit,
      resist: window.CodexV3.burstResist,
      vuln:   window.CodexV3.burstVuln,
      death:  window.CodexV3.burstDeath,
    };
    drawHusk(ctx, w/2, h/2, t, kind === 'death' ? 'hit' : 'walk', 18);
    const period = 1.4;
    const phase = (t % period) / period;
    if (phase < 0.6) {
      map[kind](ctx, w/2, h/2, phase / 0.6);
    }
  }

  // ── TELE DEMO ──
  function teleAt(ctx, w, h, t, dt, key, kind) {
    const map = {
      boss:   window.CodexV3.teleBoss,
      spawn:  window.CodexV3.teleSpawn,
      target: window.CodexV3.teleTarget,
      banner: window.CodexV3.teleBanner,
    };
    map[kind](ctx, w, h, t, dt, key);
  }

  function init() {
    // HERO
    document.querySelectorAll('canvas[data-codex-hero]').forEach(c => {
      register(c, renderCodexHero);
    });

    // SPELL/COMPANION/BURST/TELE canvases
    document.querySelectorAll('canvas[data-codex]').forEach(c => {
      const k = c.dataset.codex;
      const mode = c.dataset.mode;
      const burst = c.dataset.burst;
      const tele  = c.dataset.tele;

      let fn = null;
      if (k === 'burst' && burst) {
        fn = (ctx, w, h, t, dt, key) => {
          bg(ctx, w, h, t, 200 + burst.charCodeAt(0));
          burstAt(ctx, w, h, t, dt, key, burst);
          frame(ctx, w, h);
        };
      } else if (k === 'tele' && tele) {
        fn = (ctx, w, h, t, dt, key) => {
          bg(ctx, w, h, t, 300 + tele.charCodeAt(0));
          teleAt(ctx, w, h, t, dt, key, tele);
          frame(ctx, w, h);
        };
      } else if (companions[k]) {
        const cf = companions[k];
        fn = (ctx, w, h, t, dt, key) => {
          bg(ctx, w, h, t, k.charCodeAt(0));
          cf(ctx, w, h, t, dt, key, { impact: mode === 'impact' });
          frame(ctx, w, h);
        };
      } else if (t1[k]) {
        const tf = t1[k];
        fn = (ctx, w, h, t, dt, key) => {
          bg(ctx, w, h, t, k.charCodeAt(0));
          tf(ctx, w, h, t, dt, key, {});
          frame(ctx, w, h);
        };
      } else if (v3[k]) {
        const vf = v3[k];
        fn = (ctx, w, h, t, dt, key) => {
          bg(ctx, w, h, t, k.charCodeAt(0));
          vf(ctx, w, h, t, dt, key, { impact: mode === 'impact' });
          frame(ctx, w, h);
        };
      }
      if (fn) register(c, fn);
    });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 0);
  } else {
    window.addEventListener('load', init);
  }
})();
