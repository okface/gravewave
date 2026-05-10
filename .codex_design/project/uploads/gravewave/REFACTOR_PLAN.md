# Gravewave — Refactor Plan

The codebase grew organically through many design pivots. It's mostly fine, but four cross-cutting concerns have accumulated debt that's blocking new content. This document describes them and provides concrete fix plans.

**Recommended order: A → B → C → D.** A and B unlock the most. C/D follow naturally.

---

## Refactor A — Unified damage pipeline

### Why

Damage application is duplicated across **11 sites** (see ARCHITECTURE.md → "Damage pipeline"). Each does its own crit roll, ignite check, status apply, damage number, particles, totalDamageDealt accounting, kill detection.

Symptoms this causes:
- Adding a new status (e.g., "vulnerable") requires editing 11 places.
- Ignite's `critOnHit` was missed on chain lightning, fireball splash, pyroclasm, gravity well — three patches across multiple sessions to catch them all.
- Hard to add cross-cutting effects like "ignite spreads to nearby enemies on each tick" — would need 11 more modifications.
- Bugs where some spells respect a status and some don't (e.g., shock-amp working on projectiles but not on `applyAura`).

### What it should look like

A single `Game.dealDamage(enemy, source)` helper that all damage sites go through.

```js
/*
 * source = {
 *   spellId:      'fireball',                       // for logging + status source
 *   baseDmg:      18,                               // raw damage before crit/shock/etc.
 *   crit:         { chance, mult },                 // optional — defaults to spell defaults
 *   applyStatus:  { ignite: { duration, ... } },    // optional
 *   isAoe:        false,                            // for damage-number visual scale
 *   isDot:        false,                            // skip particles/numbers if true
 *   onKill:       (enemy) => {...},                 // optional callback
 * }
 */
dealDamage(enemy, source) {
  if (!enemy.alive) return 0;

  // 1. Compute final damage with crit & status amps
  const ignited = enemy.statuses?.ignite?.critOnHit;
  const isCrit = ignited || Math.random() < (source.crit?.chance ?? 0);
  let dmg = isCrit ? source.baseDmg * (source.crit?.mult ?? 2) : source.baseDmg;

  // 2. Apply (Enemy.takeDamage handles shock consumption internally)
  const actual = enemy.takeDamage(dmg, { spell: source.spellId });
  this.totalDamageDealt += actual;

  // 3. Apply status payload to the victim
  if (source.applyStatus) {
    this.applyStatusesToEnemy(enemy, source.applyStatus, source.baseDmg);
  }

  // 4. Visuals — skip for DoTs to avoid visual spam
  if (!source.isDot) {
    this.spawnHitParticles(enemy.x, enemy.y, this._spellColor(source.spellId), isCrit ? 12 : 5);
    this.spawnDamageNumber(enemy.x, enemy.y - enemy.radius - 6, actual, isCrit);
    this.addShake(isCrit ? 0.18 : 0.06);
  }

  // 5. Kill callback
  if (!enemy.alive && source.onKill) source.onKill(enemy);

  return actual;
}
```

### Migration

Replace each of the 11 sites. Examples of before / after:

**Projectile collision** (line ~3782, currently in `tickProjectiles`):
```js
// Before:
const ignited = e.statuses?.ignite?.critOnHit;
const isCrit = ignited || Math.random() < (p.crit?.chance || 0);
let dmg = isCrit ? p.damage * (p.crit?.mult || 2) : p.damage;
if (p.execBelow && e.hp <= e.maxHp * p.execBelow) dmg = e.hp + 1;
const actual = e.takeDamage(dmg, { spell: p.spell });
this.totalDamageDealt += actual;
this.spawnHitParticles(p.x, p.y, p.color, isCrit ? 12 : 5);
this.spawnDamageNumber(e.x, e.y - e.radius - 6, actual, isCrit);
this.addShake(isCrit ? 0.18 : 0.06);
if (p.applyStatus) this.applyStatusesToEnemy(e, p.applyStatus, p.spellBaseDmg ?? p.damage);

// After:
this.dealDamage(e, {
  spellId: p.spell,
  baseDmg: p.execBelow && e.hp <= e.maxHp * p.execBelow ? e.hp + 1 : p.damage,
  crit: p.crit,
  applyStatus: p.applyStatus,
});
```

**Chain lightning hop** (line ~3452, in `spawnChainLightning`):
```js
// Before: 5 lines of crit + takeDamage + accounting + status + particles
// After:
this.dealDamage(target, {
  spellId: spell,
  baseDmg: dmg,
  crit,
  applyStatus,
});
```

**StormCloud strike** (line ~3953):
```js
// Before: ~10 lines
// After:
this.dealDamage(target, {
  spellId: 'storm_cloud',
  baseDmg: c.damage,
  crit: c.crit,
  applyStatus: { shock: { duration: 4.0, multiplier: 1.5 } },
});
```

**FlamePatch / FlameWall / Aura / Ignite tick** — pass `isDot: true` to skip per-tick particles/numbers.

### Sites to change

Each of these has the inline pattern; replace with `dealDamage()`:

1. `tickProjectiles` — line ~3782
2. `tickWells` — line ~3818 (well dps)
3. `tickFlamePatches` — line ~3892 (DoT)
4. `tickFlameWalls` — line ~3914 (DoT)
5. `tickStormClouds` — line ~3953 (strike)
6. `tickEnemies` ignite tick — line ~3693 (DoT)
7. `spawnChainLightning` hop loop — line ~3452
8. `applyAura` — line ~3486
9. Fireball `cast()` splash loop — line ~1818 (inline)
10. Pyroclasm `cast()` AOE loop — line ~1882 (inline)
11. Black Bolt AOE loop — line ~1762 (inline)

### Estimated scope

~250 lines net deletion. ~80 lines added (the helper). Probably 2–3 hours of focused work, mostly mechanical.

### Test points

After each site change, smoke test:
- Wave 1: spells visibly do damage, numbers pop up
- Wave 4 boss: goliath takes damage from all sources, dies
- Take Ignite talent → wave 4: every spell crits ignited targets (you'll see the gold damage numbers cluster)
- Take Shock talent → wave 4: shock visibly amps next hit (one big damage number)
- Take Vigil → Reflective Aura → wave 4: enemies take damage when they hit you
- Run for 10 waves, check damage totals add up vaguely

### What this unblocks

- Adding new statuses becomes a one-place change
- Centralized hooks for "all damage" effects (e.g. lifesteal, vampiric items)
- Easier to make ignite spread, shock chain, etc.
- Refactor B becomes much easier

---

## Refactor B — Spell base stats as data

### Why

Spell base damage / cooldown / radius are hardcoded inside each spell's `cast()` function:

```js
fireball: {
  cast(game, caster, mods) {
    const baseDmg = 18 * mods.dmgMult;
    const splashDmg = 11 * mods.dmgMult;
    const radius = 80 * (mods.radiusMult || 1);
    // ...
  }
}
```

So:
- The modal can't show "your Fireball: 28 dmg, 1.6s CD, 113 radius" without parsing source.
- Tuning a spell means editing inline numbers in the body of cast().
- The TUNING.md "spell base stats" section is hand-maintained and drifts.

### What it should look like

Each spell entry exposes its base stats as data. The cast function reads from `this.baseStats`:

```js
fireball: {
  id: 'fireball',
  name: 'Fireball',
  tree: 'fire',
  cooldown: 1.5,
  baseStats: {
    damage: 18,
    splashDamage: 11,
    radius: 80,
    projectileSpeed: 340,
    projectileLife: 3.0,
  },
  cast(game, caster, mods) {
    const s = this.baseStats;
    const baseDmg = s.damage * mods.dmgMult;
    const splashDmg = s.splashDamage * mods.dmgMult;
    const radius = s.radius * (mods.radiusMult || 1);
    // ...
  },
  // Optional: customize how stats render in the modal.
  // Default render below uses generic damage + cd + radius.
  describeStats(playerState) {
    const mods = computeSpellMods(playerState, 'fireball');
    const cd = computeSpellCooldown(playerState, 'fireball');
    const s = this.baseStats;
    return [
      `${(s.damage * mods.dmgMult).toFixed(0)} dmg + ${(s.splashDamage * mods.dmgMult).toFixed(0)} splash`,
      `${(s.radius * (mods.radiusMult || 1)).toFixed(0)} radius`,
      `${cd.toFixed(2)}s CD`,
    ].join(' · ');
  },
}
```

### Migration

For each spell in `SPELLS`:
1. Identify hardcoded numbers in cast()
2. Extract into `baseStats` object
3. Replace inline references with `this.baseStats.X`
4. Add an optional `describeStats(playerState)` for spells where the generic preview would be wrong (Frost Spike has pierce; Storm Cloud has strike interval; etc.)

In `UI._buildSpellUnlockCard` and `UI._openNodeModal`, when rendering an owned spell, call `spell.describeStats(playerState)` and show the result in a "Your version: ..." line.

Default describeStats (for spells that don't override):
```js
function defaultDescribeStats(spell, playerState) {
  const s = spell.baseStats || {};
  const mods = computeSpellMods(playerState, spell.id);
  const cd = computeSpellCooldown(playerState, spell.id);
  const parts = [];
  if (s.damage)  parts.push(`${(s.damage * mods.dmgMult).toFixed(0)} dmg`);
  if (s.radius)  parts.push(`${(s.radius * (mods.radiusMult || 1)).toFixed(0)} radius`);
  parts.push(`${cd.toFixed(2)}s CD`);
  return parts.join(' · ');
}
```

### Estimated scope

~12 spells × ~5 minutes each = 1 hour. Plus modal integration ~30 minutes.

### Test points

- Open tree screen → click each owned spell → modal shows "Your version: ..." with current effective stats
- Take a damage talent rank → reopen modal → numbers update
- Take Conflagration keystone → Fireball stats show modified values

### What this unblocks

- Modal stat preview gets dramatically better
- TUNING.md can auto-generate (or stay hand-maintained but be much easier to keep in sync)
- Future spells can copy a template instead of hand-coding everything

---

## Refactor C — Standardized status effect format

### Why

Each status has its own bespoke payload shape:

```js
slow:    { expires, factor }
ignite:  { expires, dps, dpsRatio, critOnHit, tickAcc }
shock:   { expires, multiplier }
freeze:  { expires } // unused
```

Adding a new status means:
- Designing a payload shape
- Adding a tick handler in `tickEnemies` (slow/ignite/freeze) or `takeDamage` (shock)
- Writing the merge-on-refresh rules in `Enemy.applyStatus`

There's no clear extension point. "Add a Vulnerable status (+25% damage taken from all sources)" requires editing 4 files / sections.

### What it should look like

A registry of status effect handlers. Each status is data + an attach/tick/expire interface:

```js
const STATUS_EFFECTS = {
  slow: {
    name: 'slow',
    // How to combine with an existing instance of the same status
    merge: (existing, incoming) => ({
      expires: Math.max(existing.expires, incoming.expires),
      factor:  Math.min(existing.factor, incoming.factor),  // lower factor wins
    }),
    // Per-frame effect — return a partial { speedFactorMult, dmgPerTick } etc.
    // dt is passed for time-based effects.
    tick: (enemy, status, dt, runElapsed) => ({
      speedFactorMult: status.factor,
    }),
    // What to do when damage is dealt to an enemy with this status.
    // Return modified damage, or perform side effects.
    onTakeDamage: null,
    // What to do when the spell that applies this hits.
    // (e.g. ignite's critOnHit)
    onHitContribution: null,
    // Visual ring color
    visualColor: 'rgba(154, 240, 230, 0.8)',
    visualDash:  [4, 3],
  },

  ignite: {
    name: 'ignite',
    merge: (existing, incoming) => ({
      expires: Math.max(existing.expires, incoming.expires),
      dps:     Math.max(existing.dps, incoming.dps),
      critOnHit: existing.critOnHit || incoming.critOnHit,
    }),
    tick: (enemy, status, dt, runElapsed) => {
      status.tickAcc = (status.tickAcc || 0) + dt;
      let dmg = 0;
      while (status.tickAcc >= 0.25) {
        status.tickAcc -= 0.25;
        dmg += (status.dps || 0) * 0.25;
      }
      return { dmgPerTick: dmg };
    },
    onHitContribution: (status) => ({ guaranteedCrit: !!status.critOnHit }),
    visualColor: 'rgba(255, 122, 58, 0.8)',
  },

  shock: {
    name: 'shock',
    merge: (existing, incoming) => ({
      expires: Math.max(existing.expires, incoming.expires),
      multiplier: Math.max(existing.multiplier, incoming.multiplier),
    }),
    tick: null,
    onTakeDamage: (enemy, status, baseDmg) => ({
      dmgMult: status.multiplier,
      consume: true,    // remove the status after this hit
    }),
    visualColor: 'rgba(255, 245, 160, 0.9)',
  },
};
```

`Enemy.applyStatus` becomes:
```js
applyStatus(name, opts, runElapsed) {
  const def = STATUS_EFFECTS[name];
  if (!def) return;
  const expires = runElapsed + (opts.duration || 1);
  const newStatus = { ...opts, expires };
  if (this.statuses[name]) {
    this.statuses[name] = def.merge(this.statuses[name], newStatus);
  } else {
    this.statuses[name] = newStatus;
  }
}
```

`tickEnemies` status processing becomes a generic walk:
```js
let speedFactor = 1;
let igniteDmg = 0;
for (const name in e.statuses) {
  const status = e.statuses[name];
  const def = STATUS_EFFECTS[name];
  if (runElapsed > status.expires) { delete e.statuses[name]; continue; }
  if (def?.tick) {
    const result = def.tick(e, status, dt, runElapsed) || {};
    if (result.speedFactorMult !== undefined) speedFactor *= result.speedFactorMult;
    if (result.dmgPerTick) igniteDmg += result.dmgPerTick;
  }
}
if (igniteDmg > 0) game.dealDamage(e, { spellId: 'ignite', baseDmg: igniteDmg, isDot: true });
```

The visualization in `drawEnemies` walks `STATUS_EFFECTS` for visual color/dash.

### Migration

After Refactor A is done (because shock consumption moves cleanly to `dealDamage`):

1. Create `STATUS_EFFECTS` registry near the top of section 6 (Systems)
2. Convert `Enemy.applyStatus` to use the registry
3. Replace status processing in `tickEnemies` with the generic walk
4. Move shock consumption out of `Enemy.takeDamage` into `dealDamage` (using `onTakeDamage` hook)
5. Move ignite-crit-amp out of the 3+ inline checks into `dealDamage` (using `onHitContribution`)
6. Update `drawEnemies` to walk the registry for status ring rendering

### Estimated scope

~3 hours. Depends on Refactor A being done first.

### Test points

- All current statuses work the same as before (slow, ignite, shock)
- Add a new status experimentally (e.g., `vulnerable: +25% damage taken`) and verify it just works with one registry entry

### What this unblocks

- New statuses are one-line additions
- Status interactions (e.g., "ignite + shock = explode") become possible cleanly
- Items can grant statuses on hit (e.g., "10% chance to slow on hit") trivially

---

## Refactor D — Targeting strategies

### Why

Every spell hardcodes its target acquisition:
```js
const target = game.findNearestEnemy(caster);
const target = game.findEnemyCluster(caster) || game.findNearestEnemy(caster);
const target = game.findFarthestEnemy(caster);
```

There's no way to express:
- "Prefer ignited enemies if any, else nearest"
- "Prefer the highest-HP enemy in range"
- "Prefer enemies not recently hit by another spell this frame"

This is why Fire + Storm doesn't synergize — Lightning Bolt has no way to know which enemies were ignited by Fireball, so it auto-targets the nearest fresh enemy and the synergy never fires.

### What it should look like

A target-priority system. Each spell declares its preferences:

```js
fireball: {
  ...
  targeting: {
    mode: 'nearest',
    // Optional preferences — a sorted list of "soft prefs" applied within mode results
    prefer: [],
  },
},

lightning_bolt: {
  ...
  targeting: {
    mode: 'nearest',
    prefer: ['ignited', 'shocked'],   // tier-2 preference: among nearest candidates, pick ignited first
  },
},

frost_spike: {
  ...
  targeting: { mode: 'farthest', prefer: ['highest_hp'] },
},

gravity_bolt: {
  ...
  targeting: { mode: 'cluster_center' },
},
```

A target resolver:
```js
function pickTarget(game, caster, targeting) {
  if (!targeting) return game.findNearestEnemy(caster);

  // Phase 1: get a candidate set based on mode
  let candidates;
  switch (targeting.mode) {
    case 'nearest':
      candidates = game.enemies.filter(e => e.alive)
        .sort((a, b) => Vec.dist(caster, a) - Vec.dist(caster, b));
      break;
    case 'farthest':
      candidates = game.enemies.filter(e => e.alive)
        .sort((a, b) => Vec.dist(caster, b) - Vec.dist(caster, a));
      break;
    case 'cluster_center':
      const clusterCenter = game.findEnemyCluster(caster);
      return clusterCenter || game.findNearestEnemy(caster);
    case 'highest_hp':
      candidates = game.enemies.filter(e => e.alive)
        .sort((a, b) => b.hp - a.hp);
      break;
    default: return null;
  }
  if (!candidates.length) return null;

  // Phase 2: apply soft preferences. Take the first candidate matching ANY preference,
  // or fall back to the first overall candidate.
  for (const pref of (targeting.prefer || [])) {
    const matched = candidates.find(c => matchesPreference(c, pref));
    if (matched) return matched;
  }
  return candidates[0];
}

function matchesPreference(enemy, pref) {
  switch (pref) {
    case 'ignited':  return !!enemy.statuses.ignite;
    case 'shocked':  return !!enemy.statuses.shock;
    case 'slowed':   return !!enemy.statuses.slow;
    case 'highest_hp': return true; // already sorted
    case 'low_hp':   return enemy.hp / enemy.maxHp < 0.3;
    default: return false;
  }
}
```

### Migration

1. Add `pickTarget` helper near the existing `findNearestEnemy` etc.
2. Add a `targeting` config to each spell's registry entry
3. Replace `findNearestEnemy(caster)` calls in cast functions with `pickTarget(game, caster, this.targeting)`
4. Keep `findNearestEnemy` etc. as primitives — the new system is built on them

### Estimated scope

~1.5 hours. Mostly mechanical replacement.

### Test points

- Fire + Storm synergy: take Fireball + Ignite + Lightning Bolt. Verify lightning bolt visibly prioritizes ignited targets (you'll see chain origins jump to fireball-tagged enemies)
- Frost Spike still pierces toward farthest (back-of-wave targeting)
- Gravity Bolt still places at clusters

### What this unblocks

- Real synergy between elements (the original Fire+Storm dream)
- "Mark"-style talents (e.g., a talent that marks one enemy per cast for prioritization)
- Per-character targeting flavor (a future Sniper character could prefer lowest_hp; a Hunter could prefer highest_threat)
- Items that change targeting (e.g., "Targeting Lens: spells prefer the highest-HP target")

---

## Refactor E (optional / lower priority) — File split

The single 5750-line file is fine for a dev wanting to scan everything in one buffer, but it's getting harder to navigate and edit-collisions happen during refactors.

A reasonable split:

```
gravewave/
├── index.html              ← shell HTML + style + <script src="game.js">
├── styles.css              ← all CSS
├── data/
│   ├── characters.js       ← CHARACTERS
│   ├── spells.js           ← SPELLS
│   ├── trees.js            ← SKILL_TREES
│   ├── items.js            ← ITEMS
│   ├── fusions.js          ← FUSIONS
│   └── enemies.js          ← ENEMIES
├── engine/
│   ├── config.js           ← CONFIG
│   ├── entities.js         ← Player, Enemy, Projectile, etc.
│   ├── helpers.js          ← computeSpellMods, nodeBlockedReason, etc.
│   ├── game.js             ← Game class
│   ├── wave_manager.js     ← WaveManager
│   ├── choice_engine.js    ← ChoiceEngine
│   ├── status_effects.js   ← STATUS_EFFECTS registry (after Refactor C)
│   └── damage.js           ← dealDamage etc. (after Refactor A)
├── render/
│   └── renderer.js         ← Renderer
└── ui/
    ├── ui.js               ← UI overlay logic
    └── tree_view.js        ← skill tree rendering specifically
```

Use ES modules (`import`/`export`). Browsers support modules natively, no bundler needed:

```html
<script type="module" src="engine/game.js"></script>
```

This would also make Claude Code agent edits much faster — the agent edits one file at a time and doesn't have to reload the whole 5750-line context.

**Don't do this until after Refactors A + B at minimum.** Splitting before then means doing the work twice.

### Estimated scope

~3 hours. Mostly mechanical move + import statements.

### Test points

- Game loads and runs identically
- Hot-reload across files works (any module bundler watch script, or just hard refresh)

---

## Suggested execution order

If a Claude Code agent picks this up:

1. **Refactor A** (damage pipeline). Foundation for everything else.
2. **Smoke test thoroughly** — each spell, each status, each enemy contact.
3. **Refactor B** (spell base stats data). Quick win, makes the modal much better.
4. **Refactor C** (status registry). Naturally easier after A.
5. **Refactor D** (targeting). Synergy unlock.
6. *Optional:* **Refactor E** (file split). Quality of life for further work.
7. *Then:* return to feature work.

If only one of A–D gets done, **do A**. The other three become straightforward after that, and most current bugs/inconsistencies trace back to A.

---

## Things explicitly NOT in scope

These are nice-to-haves that the user has not yet asked for. Don't speculatively add them:

- TypeScript / type system
- Build pipeline (webpack, vite, etc.)
- Test framework
- Server-side anything
- Multiplayer
- Save game persistence beyond a single run
- Asset pipeline (sprites, audio)

Adding any of these is a bigger commitment than the user's current iteration loop calls for. If you find yourself wanting one of these, propose it explicitly first.
