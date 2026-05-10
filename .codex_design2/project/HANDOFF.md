# Gravewave — Visual Handoff (Codex iv)

**Audience.** Engineering, integrating the visual layer into `index.html`.
**Companion artifact.** Open `Gravewave Spell Codex.html` side-by-side; every spell, companion, burst, and telegraph in this doc has a live, looping demo there.
**Source files.**
  - `art-lab-v2.js` — primitives, palette, magician, enemies, T1 spells (Fireball / Chain Lightning / Frost Bolt), HUD.
  - `art-lab-v3.js` — bursts, telegraphs, all T2/T3 spells, refined Black Hole, Fireball·Hydra, Fireball·Meteor.
  - `art-lab-v4.js` — companion familiars (Sigil Linker, Decoy Effigy, Mender Wisp, War Drummer).
  - `codex-init.js` — wires the codex page to all of the above.

> Edition iv supersedes earlier handoffs. This is the canonical reference.

---

## 1. Coverage Matrix — every ability has a visual

| Tier | Ability             | Element | File         | Function                       | Modes              |
|------|---------------------|---------|--------------|--------------------------------|--------------------|
| T1   | Fireball            | fire    | v2           | `spellFireball`                | idle, cast         |
| T1   | Chain Lightning     | elec    | v2           | `spellLightning`               | impact             |
| T1   | Black Hole          | grav    | v3           | `spellBlackHole`               | idle               |
| T1   | Frost Bolt          | frost   | v2           | `spellFrost`                   | idle               |
| T2   | Snow Fort           | frost   | v3           | `spellSnowFort`                | impact (bloom+shatter) |
| T2   | Fire Shield         | fire    | v3           | `spellFireShield`              | impact (block)     |
| T2   | Gravital Anomalies  | grav    | v3           | `spellGravital`                | impact             |
| T2   | Shock Tower         | elec    | v3           | `spellShockTower`              | impact             |
| T3   | Storm Cloud         | elec    | v3           | `spellStormCloud3`             | impact             |
| T3   | Wormhole            | grav    | v3           | `spellWormhole`                | impact             |
| T3   | Meteor              | fire    | v3           | `spellMeteor`                  | telegraph or full  |
| T3   | Snow Storm          | frost   | v3           | `spellSnowStorm`               | impact             |
| Spec | Fireball·Hydra      | fire    | v3           | `spellHydra`                   | —                  |
| Spec | Fireball·Meteor     | fire    | v3           | `spellMeteorFb`                | —                  |
| PAL  | Sigil Linker        | support | v4           | `compSigilLinker`              | impact             |
| PAL  | Decoy Effigy        | taunt   | v4           | `compDecoyEffigy`              | impact (detonate)  |
| PAL  | Mender Wisp         | heal    | v4           | `compMenderWisp`               | impact (heal arc)  |
| PAL  | War Drummer         | aura    | v4           | `compWarDrummer`               | impact (cycle)     |

All v3 functions are exposed via `window.CodexV3`; v4 via `window.CodexV4`.

---

## 2. Differentiation rules (the hand each spell was given)

Every spell sits at a unique intersection of **geometry**, **physics**, and **shake**. If two designs collide on all three axes, the look-alike one is the bug.

| Family      | Geometry vocabulary   | Particle physics       | Origin    |
|-------------|-----------------------|------------------------|-----------|
| Fireball    | arc bezier            | embers, gravity-pulled | projectile |
| Fire Shield | three orbits          | embers, orbital ribbon | aura       |
| Decoy       | scarecrow + pulses    | shards on detonate     | placed     |
| Meteor      | comet drop + crater   | dust + cracks (only spell with cracks) | sky-fall  |
| Frost Bolt  | hex crystal + line    | mist circles, drift    | piercing  |
| Snow Fort   | hex wall + posts      | drift flakes (capped)  | placed    |
| Snow Storm  | radial weather field  | falling flakes + gusts | weather   |
| Chain Lt.   | jagged fork           | sparks, jitter-redraw  | roving    |
| Shock Tower | stone pillar + arc    | base sparks            | placed    |
| Storm Cloud | overhead cumulus      | branching bolt + scorch| overhead  |
| Black Hole  | pinch + accretion     | inward spiral motes    | static    |
| Gravital    | small wells + threads | leashed ink threads    | tethered  |
| Wormhole    | paired rune rings     | A-pull → B-eject stream| paired    |
| Sigil       | hexagram + threads    | travelling beads       | linked    |
| Mender      | Lissajous wisp        | trail dots + + glyphs  | orbiting  |
| Drummer     | drum + beat ring      | colored pulse rings    | following |

### 2.1 Camera shake fingerprints

```
light          amp 3   dur 0.15s   chain hop, frost pierce, gravital pop, shock tower fire
medium         amp 6   dur 0.30s   meteor-fb impact, fire shield block, storm cloud strike
heavy          amp 10  dur 0.50s   black hole collapse, decoy detonate, boss spawn (last frame)
catastrophic   amp 14  dur 0.70s   meteor full impact only
```

Telegraphs sit **outside** the world transform. Don't double-shake on boss arrival — the spawn telegraph fires `heavy` on its own last frame.

### 2.2 Palette idioms

| Color    | Hex      | Use                                                 |
|----------|----------|-----------------------------------------------------|
| paper    | `#e8dcc0` | base background                                    |
| ink      | `#1a1612` | strokes, silhouettes                               |
| vermilion| `#a83a2c` | fire, danger, taunt, decoy belt                    |
| gold     | `#c8941a` / `#e8b840` | sacred, heal, sustain, halo                |
| indigo   | `#2c4a8c` | frost, electric core, ward aura                    |
| violet   | `#6a3a8a` | gravity                                            |
| green    | `#5a7a3c` | poison/nature reserved, **unused** in current spells |

---

## 3. Hookpoints — minimum integration surface

```js
// 3.1 Fireball
Spell.fireball.cast = (wiz, target) => {
  Game.projectiles.push({
    kind:'fireball', x:wiz.x, y:wiz.y, tx:target.x, ty:target.y,
    arcT:0, dmg:20, splash:90,
    spec: wiz.fireballSpec, // 'heat'|'ignite'|'hydra'|'meteor'
  });
};
// Renderer reads p.arcT (0..1) and draws via spellFireball's primitives.

// 3.2 Chain Lightning
Spell.chain.cast = (wiz) => {
  const path = nearestN(wiz, wiz.chainCount);
  Renderer.drawLightnings(path); // 5-segment forks per hop, jitter ±2
  for (const e of path) { e.takeDamage(14, 'chain'); Camera.shake('light'); }
  if (path.length === wiz.chainCount) Camera.shake('medium'); // final crit
};

// 3.3 Black Hole
BlackHole.tick = (bh, dt) => {
  for (const e of nearby(bh.x, bh.y, bh.pullR)) {
    const d = dist(e, bh); const k = (1 - d/bh.pullR) * 80 * dt;
    e.x += (bh.x - e.x) / d * k;  e.y += (bh.y - e.y) / d * k;
  }
  bh.dmgClock += dt;
  if (bh.dmgClock >= 0.4) {
    for (const e of nearby(bh.x, bh.y, bh.pullR)) e.takeDamage(3, 'blackhole');
    bh.dmgClock = 0;
  }
};

// 3.4 Frost Bolt
FrostBolt.update = (b, dt) => {
  b.x += b.vx*dt; b.y += b.vy*dt;
  for (const e of nearby(b.x, b.y, 14)) {
    if (b.hits.has(e)) continue;
    e.takeDamage(16, 'frost');
    e.applyStatus('slow', 1.0);
    b.hits.add(e);
    Camera.shake('light');
    if (b.hits.size >= b.pierce) b.dead = true;
  }
};

// 3.5 Snow Fort — damage gating
takeDamage_pre = (target, dmg, src) => {
  for (const f of Game.snowForts) {
    if (target.team !== 'wizard' && f.contains(target)) dmg *= 0.5;
  }
  return dmg;
};

// 3.6 Fire Shield
Wizard.takeDamage = function(d, src) {
  const fs = this.fireShield;
  if (fs && fs.charges > 0 && fs.cooldown <= 0) {
    fs.charges--; fs.cooldown = 1.0; fs.blockFlashAge = 0;
    Camera.shake('medium');
    return;
  }
  // …else apply damage normally
};

// 3.7 Gravital
Gravital.tick = (g, dt) => {
  g.spawnClock += dt;
  if (g.spawnClock >= 1.6) {
    g.wells.push({ x: wiz.x + cos(a)*40, y: wiz.y + sin(a)*40, life: 1.4, pull: 60 });
    g.spawnClock = 0;
  }
  for (const w of g.wells) {
    w.life -= dt;
    if (w.life <= 0) { popAoE(w, 6, 30); Camera.shake('light'); }
  }
};

// 3.8 Shock Tower
Tower.tick = (twr, dt) => {
  twr.cd -= dt;
  if (twr.cd <= 0) {
    const tgt = nearestEnemy(twr.x, twr.y, 64);
    if (tgt) {
      tgt.takeDamage(9, 'shock-tower');
      twr.firePulseAge = 0;
      Camera.shake('light');
      twr.cd = 0.9;
    }
  }
};

// 3.9 Storm Cloud
StormCloud.tick = (cl, dt) => {
  cl.fireClock += dt;
  if (cl.fireClock >= 0.8) {
    const tgt = randomUnderCloud(cl);
    if (tgt) {
      tgt.takeDamage(22, 'storm-cloud');
      Game.particles.push({ kind:'scorch', x:tgt.x, y:tgt.y, life:1.2 });
      Camera.shake('medium');
    }
    cl.fireClock = 0;
  }
};

// 3.10 Wormhole — DO NOT SKIP THE ICD
Wormhole.tick = (wh, dt) => {
  for (const portal of [wh.A, wh.B]) {
    for (const e of nearby(portal.x, portal.y, 20)) {
      if (wh.recentlyTeleported.has(e) || e.team === 'wizard') continue;
      const dest = portal === wh.A ? wh.B : wh.A;
      e.x = dest.x; e.y = dest.y;
      e.takeDamage(14, 'wormhole');
      e.applyStatus('stretched', 0.3);
      wh.recentlyTeleported.add(e);
      setTimeout(() => wh.recentlyTeleported.delete(e), 500);
    }
  }
};

// 3.11 Meteor
Game.spawnMeteor = (x, y) => {
  Game.meteors.push({ x, y, telegraph: 0.6, fall: 0, struck: false });
};
Meteor.tick = (m, dt) => {
  if (m.telegraph > 0) { m.telegraph -= dt; return; }
  m.fall += dt;
  if (!m.struck && m.fall >= 0.4) {
    for (const e of nearby(m.x, m.y, 40)) e.takeDamage(140, 'meteor');
    spawnDust(26); spawnSparks(18); spawnCracks(8);
    Camera.shake('catastrophic');
    m.struck = true;
  }
};

// 3.12 Snow Storm — single shared flake pool
SnowStorm.tick = (s, dt) => {
  s.tickClock += dt;
  if (s.tickClock >= 0.5) {
    for (const e of inside(s)) {
      e.applyStatus('slow', 0.5);
      e.takeDamage(4, 'snow-storm');
    }
    s.tickClock = 0;
  }
};
SnowStorm.flakePool = []; // GLOBAL — capped at 80 across all storms
```

---

## 4. Companions

Companions are picked once at run start and persist the entire run. Their visual budget is lighter than spells: a distinct silhouette + one signature ability moment.

### 4.1 Sigil Linker — `compSigilLinker`
- **Hexagram** sigil hovers ahead of the wizard, rotating slowly.
- Three curved ink filaments → three nearest enemies.
- A vermilion bead travels each thread on a 1.5s shared cadence (offset 0.18s per thread).
- On a threaded foe taking damage: bead becomes a cascade and the *other* two enemies take 30% of the damage.

```js
function onEnemyDamaged(e, d) {
  if (!e.threadedBy) return;
  for (const o of e.threadedBy.others) o.takeDamage(d * 0.3, 'sigil');
}
```

### 4.2 Decoy Effigy — `compDecoyEffigy`
- Burlap scarecrow on a stake, X-eyes, vermilion twine belt, twigs for arms.
- Pulsing red dashed bands mark the **70px taunt radius**.
- Below 30% HP → strain phase: wobble, vermilion cracks, leaking embers.
- On death: 14-shard straw shatter + 60px AoE blast (40 dmg) + ink puff. `Camera.shake('heavy')`. 5s respawn.

### 4.3 Mender Wisp — `compMenderWisp`
- Pale-gold wisp orbits the wizard on a **Lissajous** path (intentionally not metronomic).
- Cadence pip ring around wisp fills clockwise; on full → gold ribbon arcs to wizard, +glyphs rise.
- 4 HP per heal, 2.0s cadence.
- No camera shake.

### 4.4 War Drummer — `compWarDrummer`
- Standing drum on twig-legs follows the wizard.
- Drumstick strikes on **0.6s beat**. Each strike → colored ring pulse (**vermilion · indigo · gold**).
- Aura cycles **Vigor → Ward → Haste**, 2.0s each, total cycle 6.0s.
  - Vigor: +12% damage, vermilion, sword glyph
  - Ward:  −12% damage taken, indigo, shield glyph
  - Haste: −12% cooldown, gold, wing glyph
- Aura banner above the wizard slides −6 → 0 → +6 px between auras.
- Light shake every 4th beat only.

```js
const idx = Math.floor(((t % 6.0) / 6.0) * 3) % 3;
wiz.activeAura = AURAS[idx]; // {id, dmgMod, takenMod, cdMod, color, glyph}
```

---

## 5. Hit bursts & telegraphs

### 5.1 Hit bursts (`burstHit/Crit/Resist/Vuln/Death`)
- **Hit** — vermilion ring + 7 gold rays, 0.4s
- **Crit** — gold star + double rings + bouncing damage label, 0.5s
- **Resist** — pearlescent concentrics + `RESIST` tag, 0.4s
- **Vuln** — red wash + 12 dark-red rays + `VULN!`, 0.45s
- **Death** — 8 ink shards + ink puff + vermilion ring, 0.6s

> **Throttle resist/vuln tags.** Bosses tank thousands of HP — don't paint the screen with `RESIST` on every 3-damage tick. Suggested: 1 tag per enemy per 0.5s.

### 5.2 Telegraphs (`teleBoss/Spawn/Target/Banner`)
- **Boss spawn** — full-screen rune circle + reticle, 1.4s. Heavy shake on last frame *only*.
- **Wave dust** — soft brown dust puff at spawn point, 0.7s.
- **Meteor target** — 3 concentric red ground pulses + reticle, 0.6s. Same primitive used as the windup of `spellMeteor`.
- **Wave banner** — slides in with overshoot, settles 1.2s, fades 0.5s.

---

## 6. Render order (top → bottom = front → back)

```
1. HUD                      (post-effects, never shaken)
2. Banners / wave text      (post-effects)
3. Hit bursts               (world space, shaken)
4. Projectiles              (world space, shaken)
5. Enemies + Companions     (world space, shaken)
6. Wizard                   (world space, shaken)
7. Persistent spells        (snow fort, shock tower, gravital wells, wormhole portals, storm cloud GROUND, decoy effigy)
8. Telegraphs (ground side) (meteor target, scorch stains)
9. Paper background         (never shaken)
```

The wizard is drawn **after** persistent spells so the Fire Shield orbs and Mender Wisp can occlude them at the legs. The Storm Cloud overhead bolt should draw above the wizard — render the cloud body separately at layer 0 (top).

---

## 7. Risks & gotchas

- **Wormhole infinite loop** — without `recentlyTeleported` ICD, enemies ping-pong and instantly cook.
- **Snow Storm flakes** — must share a single global pool capped at ~80, else stacked storms compound to 200+ particles.
- **Meteor telegraph length** — 0.6s is the player's only dodge window. Don't shorten it for "snappiness" — that's a difficulty change, not a polish change.
- **Decoy on respawn** — clear the `recentlyTeleported`-style aggro state when a new effigy spawns; orphaned target pointers freeze enemies.
- **Resist/Vuln tag spam** — see throttle note in §5.1.
- **Static structures inside Snow Fort** — `contains()` test the structure's center, not the projectile, or shock tower arcs from inside the fort take half damage on themselves.
- **Sigil thread stretching** — read the wizard's *current* position each frame; cached endpoints lag.

---

## 8. Files at a glance

```
art-lab-v2.js          ── PAL, primitives, magician, enemies, T1 (fireball/lightning/frost), HUD
art-lab-v3.js          ── bursts, telegraphs, all T2/T3, refined T1 (blackhole), specs (hydra, meteor-fb)
art-lab-v4.js          ── companions (sigil, decoy, mender, drummer)  → window.CodexV4
codex-init.js          ── wires Gravewave Spell Codex.html
Gravewave Spell Codex.html  ── canonical visual reference, 16 entries + bursts + telegraphs
DESIGN.md              ── canonical mechanics
HANDOFF.md             ── this file
```

— end of handoff —
