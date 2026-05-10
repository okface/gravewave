# Gravewave — Architecture

Last reviewed against the codebase: complete walkthrough of `index.html` as it currently exists. If this doc and the code disagree, the code wins — please update this doc.

## TL;DR

- **Single file**: everything in `index.html`. CSS in `<style>`, JS in one `<script>`, HTML overlays for UI.
- **Data-driven**: content lives in 7 registries. Engine reads them. Adding spells / nodes / items / enemies = new registry entry.
- **State machine**: `Game.state ∈ { 'menu', 'playing', 'upgrade', 'item', 'gameover' }`. Tick loop only runs in `'playing'`.
- **Two-currency progression**: TP earned every wave, SP earned every boss wave. Spells unlock with SP, talents rank up with TP.
- **Auto-cast spells**: player is immobile, spells fire on cooldown at chosen targets. Vampire-Survivors style.
- **Kamikaze enemies**: every enemy detonates and dies on player contact. One decisive hit, then gone.

## File layout (sections of `index.html`)

The script is sectioned with banner comments. Approximate line ranges:

| Section | Lines | What's there |
|---|---|---|
| `<style>` | ~5–1180 | All CSS |
| `<body>` overlays | ~1180–1215 | DOM overlays (menu, tree, item, game-over) and HUD |
| `1. CONFIG` | 1242–1294 | All balance numbers |
| `2. LOGGER` | ~1295–1335 | Telemetry stub |
| `3. Vec/util` | ~1335–1376 | Math helpers |
| **`4. Registries`** | 1377–2451 | Data: characters, spells, skill trees, items, fusions, enemies |
| `5. Entities` | 2455–2710 | Player, Enemy, Projectile, Particle, GravityWell, PullField, FlamePatch, FlameWall, StormCloud, DamageNumber |
| `6. Systems` | 2713–3247 | Helpers (`computeSpellMods`, `nodeBlockedReason`, `formatTalentEffect`, ...), `ChoiceEngine`, `WaveManager` |
| `7. Game` | 3252–4154 | Top-level state machine. Owns all entity arrays, ticks them, dispatches damage. |
| `8. Renderer` | 4156–4972 | All `draw*` methods. Pure — never mutates game state. |
| `9. UI` | 4975–5728 | All DOM overlay logic. `UI.showSkillTree()`, modal handling, etc. |
| `10. main()` | ~5730–5752 | Boot |

When in doubt about where something lives, search for `/* ====` to find section banners.

## Data flow / lifecycle

### Run start

1. Player picks character (`UI.showCharacterSelect`)
2. Player picks elemental path (`UI.showPathSelect`) → grants tier-1 spell of that tree free
3. Player picks starter item (`UI.showStarterSelect`) → goes into `playerState.items[0]`
4. `Game.startRun(charId, pathTreeId, starterItemId)`:
   - Creates fresh `playerState` (see schema below)
   - Creates fresh `Player` entity
   - Resets all entity arrays (`enemies`, `projectiles`, `wells`, ...)
   - **Resets `WaveManager`** — important: regression-prone, see KNOWN_ISSUES
   - Opens the skill tree at `wave 0` so the player can spend the 2 starter TP
   - Player clicks "Begin Wave 1" → `Game.afterChoice()` → `WaveManager.startWave(1)`

### Per-wave loop

1. `WaveManager.startWave(n)` → seeds `toSpawn` count, `spawnInterval`
2. Game loop ticks at requestAnimationFrame:
   - `Player.update(dt)` — iframes decay
   - `WaveManager.update(dt)` — periodic `spawnEnemy()` until `toSpawn === 0`
   - `Game.tickSpells(dt)` — every active spell ticks its cooldown; when ready, calls `spell.cast(game, player, mods)` with computed mods
   - `Game.tickEnemies(dt)` — movement, status processing (slow/ignite), kamikaze contact damage
   - `Game.tickProjectiles(dt)` — collision detection, damage application
   - `Game.tickWells / tickPullFields / tickFlamePatches / tickFlameWalls / tickStormClouds` — per-entity-type damage application
   - `Game.tickLightnings / tickExplosions / tickDamageNumbers / tickParticles` — visual decay
   - `Renderer.draw(game)` — all visuals, no mutation
3. When `WaveManager` runs out of spawns AND no enemies left: `Game.onWaveCleared(wave)`
   - Award TP (+1) and SP (+1 if boss wave)
   - Heal player (`waveHealPct` of max HP)
   - Open skill tree (`UI.showSkillTree`)
   - If wave % itemEvery === 0: defer item screen

### State machine transitions

```
menu → playing  (after path+starter select)
playing → upgrade  (wave clear)
upgrade → item  (if pending item drop)
upgrade → playing  (continue button → next wave)
item → playing  (item picked or skipped)
playing → gameover  (player.hp <= 0, no revive)
gameover → menu  (restart button)
```

## `playerState` schema

The single source of truth for run state. Held on `Game.playerState`:

```js
{
  charDef,              // CHARACTERS[charId] — frozen reference
  spells: [],           // [spellId, ...]  — derived also lives in Game.activeSpells
  takenNodes: {},       // { nodeId: rank }  — map, NOT array. rank starts at 1.
  items: [null, null],  // 2 slots; null = empty
  craftedFusions: [],   // [fusionId, ...]  — to dedupe fusion offers
  talentPoints: 0,      // TP. +1 per wave. Spent on talents.
  skillPoints: 0,       // SP. +1 per boss wave. Spent on spell unlocks.
  pendingItem: false,   // true after a wave clears that should drop an item
}
```

`takenNodes[nodeId]` is the rank. A multi-rank talent like "Heat" (maxRank: 3) progresses 0 → 1 → 2 → 3.

`Player` (the entity) is separate from `playerState`. The entity holds `hp`, `maxHp`, `iframes`, position. `playerState` holds progression. They sync via `Game.refreshPlayerStats()` which reads tree + items, computes derived stats, applies them to the entity.

## Spell system

A spell is a config + a `cast(game, caster, mods)` function. Cast spawns world effects (entities), it doesn't return damage.

### `mods` passed to `cast()`

Computed by `computeSpellMods(playerState, spellId)` (line ~2824):

```js
{
  dmgMult,        // multiplier on base damage (1.0 = no change, 1.6 = +60%)
  critChance,     // 0.0–1.0
  critMult,       // crit damage multiplier (default 2.0)
  radiusMult,     // for AOE/pull radius
  sizeMult,       // for projectile hitbox
  pierceBonus,    // additional pierce
  chainBonus,     // additional chain targets
  burnDmgMult,    // additive bonus to lingering flame DPS (Conflagration)
  applyStatus,    // status payload to attach to projectiles/well damage
  behavior,       // arbitrary flag bag — see Behavior flags below
}
```

Cooldown is recomputed separately by `computeSpellCooldown` (read by tickSpells per cast).

### Mod aggregation rules (currently)

- **Talent rank scales the contribution.** `dmgMult: 0.20` × rank 3 = +0.60.
- **Talent mods are additive** (1.0 + 0.20 + 0.20 + 0.20 = 1.60).
- **Item `globalDmgMult` is multiplicative** (stacks separately, applied to `dmgMult` after additive talent stack).
- **Keystone `modAdjust` values are multiplicative**, applied last after additives.
- **Tree CDR (`gravityCdrMult`, etc.) is multiplicative per rank** (0.92^rank).
- **Per-spell `cdMult` is additive bonus per rank, multiplicatively stacked**: `cd *= (1 + cdMult)` per rank.

Yeah, the rules are inconsistent. See REFACTOR_PLAN.md.

### Behavior flags (current set)

Read from `mods.behavior` inside spell `cast()` functions. Set by keystone nodes (and one `behaviorOverride` on Execute talent).

| Flag | Set by | Read in | Effect |
|---|---|---|---|
| `noPull` | Annihilation keystone | `gravity_bolt.cast` | Skip pull, sharper burst |
| `explodeOnHit` | Collapse keystone | `gravity_bolt.cast` | Wider area, slower per-tick |
| `noChain` | Pinpoint keystone | `lightning_bolt.cast` | Force chain count to 0 |
| `noSplash` | Detonation keystone | `fireball.cast` | No AOE blast |
| `lingeringFlame` | Conflagration keystone | `fireball.cast` (onHit) | Spawn FlamePatch on impact |
| `projectileBoost` | Detonation keystone | `fireball.cast` | Multiplier on projectile speed |
| `executeBelow` | Execute follow-up talent | All projectile hits | Instakill below HP threshold |

### Spell registry — current contents

| ID | Name | Tree | Mechanic | Targeting | Base stats |
|---|---|---|---|---|---|
| `arcane_missile` | Arcane Missile | (generic) | Projectile | Nearest | 8 dmg, 1.4s CD, 360 speed, 1.4s life |
| `gravity_bolt` | Gravity Bolt | gravity | Placed well | Densest cluster | 28 dps × 1.4s, 80r, 1.6s CD |
| `gravity_well` | Gravity Well | gravity | Placed well (larger) | Densest cluster | 14 dps × 3s, 130r, 5s CD |
| `lightning_bolt` | Lightning Bolt | electricity | Instant chain | Nearest | 16 dmg + 1 arc @ 70%, 0.8s CD |
| `chain_lightning` | Chain Lightning | electricity | Instant chain (heavy) | Nearest | 22 dmg, 3 chains, 0.85 falloff, 2.6s CD — **unreachable from current tree, kept for compat** |
| `storm_cloud` | Storm Cloud | electricity | Hovering area, periodic strikes | Densest cluster | 14 dmg/strike every 0.65s, 5.5s life, applies Shock |
| `static_field` | Static Field | electricity | Aura around player | Self | ~5 dmg/tick, 100r, 0.5s CD |
| `fireball` | Fireball | fire | Projectile + AOE on hit | Nearest | 18 dmg + 11 splash, 80r, 1.5s CD, 340 speed, 3s life |
| `wall_of_flame` | Wall of Flame | fire | Horizontal band | Player Y | 7 dmg/tick, 8s life, 7s CD |
| `pyroclasm` | Pyroclasm | fire | Massive instant AOE | Densest cluster | 80 dmg, 150r, 6.5s CD |
| `frost_spike` | Frost Spike | frost | Piercing projectile | **Farthest** | 12 dmg, 2 pierce, slows 35%/1.5s, 0.85s CD |
| (fusions) | various | — | granted only via fusion recipes | — | — |

### Adding a new spell

1. Add entry to `SPELLS` registry. Required: `id`, `name`, `tree`, `cooldown`, `cast()`.
2. Add unlock node in the relevant tree (`SKILL_TREES[tree].nodes`): `type: 'unlock_spell'`, `spellId`, `cost` (1/2/3 SP for tier 1/2/3), `tier`.
3. Optional: add `spell_mod` talent nodes referencing the spellId.
4. If the spell needs a new entity type, add the class, the `spawn*` factory on `Game`, the `tick*` method, and the `draw*` renderer method. Hook all three into the appropriate places.
5. Add the spell's icon to `UI.SPELL_ICONS`.

## Skill tree system

Each tree in `SKILL_TREES` has `nodes: [...]`. A node:

```js
{
  id: 'unique_id',
  name: 'Display Name',
  tier: 1..3,                 // metadata; only meaningful on unlock_spell nodes (sorts in UI, sets cost convention)
  requires: ['other_id'],     // prereqs (all must be taken at rank ≥ 1)
  desc: 'Description shown in modal',
  cost: 1,                    // optional — defaults to 1. Spell unlocks: 1/2/3 (tier 1/2/3) in SP. Talents: 1 in TP.
  maxRank: 1,                 // optional — defaults to 1. Multi-rank talents typically 3.
  // One of these `type` shapes:
  type: 'unlock_spell',  spellId: 'foo',
  type: 'spell_mod',     spellId: 'foo', mods: { dmgMult: 0.20, ... },
  type: 'global_mod',    mods: { hpBonus: 25, ... },
  type: 'keystone',
    // Either:
    affects: 'foo',     modAdjust: { dmgMult: 2.0, ... },     behavior: { noChain: true },
    // Or for multi-spell keystones:
    targets: [{ spell: 'foo', modAdjust: {...}, behavior: {...} }, ...],
    lockedBy: ['mutex_id'],   // mutex with another keystone
    keystone: true,           // marks for distinct UI treatment
}
```

### Tree structure

```
gravity:
  Gravity Bolt (1 SP)
    ├ Crushing Force (3 ranks dmg)
    ├ Wider Pull (3 ranks radius)
    ├ Glacial Pull (slow status talent)
    ├ Annihilation ◆ keystone (mutex w/ Collapse)
    │   ├ Execute (instakill below 18%)
    │   └ Concentrated Force (3 ranks dmg)
    └ Collapse ◆ keystone (mutex w/ Annihilation)
        └ Wider Blast (3 ranks radius)
  Gravity Well (2 SP)
    ├ Event Horizon (3 ranks dps)
    └ Spacetime Bend (3 ranks radius)
  Quickened Mind passive (3 ranks gravity CDR)

electricity:
  Lightning Bolt (1 SP)
    ├ Voltage (3 ranks dmg)
    ├ Forking (3 ranks chain count)
    ├ Shock (status talent)
    ├ Pinpoint ◆ keystone (mutex w/ Storm Saturation)
    │   ├ Convergent Strike (3 ranks dmg)
    │   └ Hairtrigger (3 ranks crit chance)
    └ Storm Saturation ◆ keystone (mutex w/ Pinpoint, multi-spell: bolt + static_field)
  Storm Cloud (2 SP)
    ├ Voltage Discharge (3 ranks dmg)
    └ Stormfront (3 ranks radius)
  Static Field (2 SP)
    └ Saturation (3 ranks radius+dmg)
  Quick Reflex passive (3 ranks storm CDR)

fire:
  Fireball (1 SP)
    ├ Heat (3 ranks dmg)
    ├ Spread (3 ranks radius)
    ├ Quick Cast (3 ranks CDR)
    ├ Ignite (status talent)
    ├ Conflagration ◆ keystone (mutex w/ Detonation)
    │   ├ Spreading Inferno (3 ranks radius)
    │   └ Embers Linger (3 ranks burn dps)
    └ Detonation ◆ keystone (mutex w/ Conflagration)
        └ Compressed Charge (3 ranks dmg)
  Wall of Flame (2 SP)
    └ Hotter Flame (3 ranks dmg)
  Pyroclasm (3 SP)
    └ Fissure (3 ranks dmg)
  Kindled Mind passive (3 ranks fire CDR)

frost:
  Frost Spike (1 SP)
    ├ Sharpened (3 ranks dmg)
    ├ Pierce (3 ranks pierce)
    └ Lasting Chill (better slow status)

vigil:
  Recover (3 ranks wave-heal)
    ├ Phase Shift ◆ keystone (mutex w/ Bulwark) — 12% dodge
    ├ Bulwark ◆ keystone (mutex w/ Phase Shift) — 18% damage reduction
    ├ Hardened (3 ranks +HP)
    ├ Reflective Aura — 20% reflect
    ├ Battle Meditation — 1.5 HP/kill
    └ Eternal Vigil — revive once at 40% HP
```

### Eligibility

`nodeBlockedReason(node, playerState)` returns one of:
- `'taken'` — fully ranked
- `'Locked by Annihilation'` — a mutex partner has been taken
- `'Requires Fireball'` — prerequisite not yet taken
- `'Need 2 more SP'` / `'Need 1 more TP'` — can't afford right now
- `null` — eligible (currently buyable)

Used by both UI rendering and `spendSkillPoint` validation.

### Currency: which is which

`nodeCurrency(node)` returns `'sp'` if it's an `unlock_spell`, `'tp'` otherwise. Spell unlocks gate the horizontal axis (build breadth); everything else gates depth.

## Status effect system

Status effects are stored on each enemy as `enemy.statuses` — an object map of `name → payload`. Currently 3 statuses are wired up.

### Current statuses

```js
slow: {
  expires: <runElapsed>,    // when this expires
  factor: 0.55,             // speed multiplier (lower = slower)
}

ignite: {
  expires: <runElapsed>,
  dps: 0,                   // ticks every 0.25s in tickEnemies
  dpsRatio: 0,              // converted to dps using applyStatusesToEnemy's baseDmg
  critOnHit: true,          // every spell hit on this enemy is auto-crit
  tickAcc: 0,               // internal tick accumulator
}

shock: {
  expires: <runElapsed>,
  multiplier: 1.5,          // applied to NEXT damage instance, then status removed
}

freeze: {
  expires: <runElapsed>,
  // Sets speedFactor = 0 in tickEnemies. Currently unused — no spell applies freeze.
}
```

### Application flow

1. Spell cast functions pass `applyStatus` payload through to `spawnProjectile` / `spawnGravityWell` / `spawnChainLightning` / etc.
2. When damage lands (varies by entity type — see Damage Pipeline below), `Game.applyStatusesToEnemy(enemy, statusObj, baseDmg)` is called.
3. That converts `dpsRatio` → `dps` (using baseDmg as reference) and calls `enemy.applyStatus(name, opts, runElapsed)`.
4. `enemy.applyStatus` merges into `enemy.statuses` — refreshing duration if longer, taking stronger value where it matters (lower slow factor wins, higher dps wins).

### Tick processing

In `Game.tickEnemies`, per enemy per frame:
- Walk `enemy.statuses`, expire stale ones
- Sum `speedFactor` from active slows (multiplied), set 0 if frozen
- Sum `igniteDmg` from ignite ticks (every 0.25s)
- Apply ignite damage via `enemy.takeDamage(igniteDmg, ...)`
- Apply movement using `speedFactor`

`shock` is **not processed in tickEnemies** — it's consumed inside `enemy.takeDamage` (multiplies the incoming damage and self-deletes).

### Per-status irregularities (debt)

- **Each status has its own bespoke payload shape.** Generalizing would be cleaner. See REFACTOR_PLAN.md → Refactor C.
- **`shock` consumption logic is inside `Enemy.takeDamage`**, not in tickEnemies. Inconsistent with how slow/ignite are processed.
- **`ignite.critOnHit` is checked in 3 separate damage sites** (projectile collision, chain lightning, fireball splash, pyroclasm). Easy to forget when adding a new damage source. See REFACTOR_PLAN.md → Refactor A.
- **`freeze` exists in code but isn't applied anywhere.** No spell or talent grants it.

## Damage pipeline (the big one)

This is the biggest piece of debt in the codebase. Damage application is **duplicated across 11 sites**, each doing its own crit roll, ignite check, status apply, damage number, particles, accounting.

### Damage sites (current)

1. `Projectile` collision in `Game.tickProjectiles` (line ~3782)
2. `GravityWell` damage tick in `Game.tickWells` (line ~3818)
3. `FlamePatch` damage tick in `Game.tickFlamePatches` (line ~3892)
4. `FlameWall` damage tick in `Game.tickFlameWalls` (line ~3914)
5. `StormCloud` strike in `Game.tickStormClouds` (line ~3953)
6. Chain lightning hop in `Game.spawnChainLightning` (line ~3452)
7. Aura tick in `Game.applyAura` (line ~3486)
8. Ignite DoT in `Game.tickEnemies` (line ~3693)
9. Fireball onHit splash (inline in fireball cast, line ~1818)
10. Pyroclasm onCast AOE (inline in pyroclasm cast, line ~1882)
11. Black Bolt AOE (inline in black_bolt cast, line ~1762)

Each site approximately:
- Rolls crit (`Math.random() < critChance`) — sometimes considering ignite, sometimes not
- Multiplies damage by crit if rolled
- Calls `enemy.takeDamage(dmg, source)` (which internally consumes shock if present)
- Adds to `Game.totalDamageDealt`
- Spawns hit particles (varies by site)
- Spawns damage numbers (varies)
- Adds shake (varies)
- Maybe applies status if `applyStatus` was passed

This is why ignite-on-storm-cloud worked but ignite-on-conflagration-DoT didn't (different sites, easy to forget). And why we couldn't add "ignite chains to nearby enemies" cleanly.

**The refactor is in REFACTOR_PLAN.md → Refactor A.**

## Item system

Items go in 2 slots on `playerState.items`. Each item has an `effect` config:

```js
{
  hpBonus: 30,                  // applied on pickup, raises maxHp + heals
  globalDmgMult: 1.10,          // multiplied into final dmgMult (multiplicative w/ talents)
  critChanceBonus: 0.05,        // additive flat
  critMultBonus: 0.5,           // additive flat to critMult
  globalCdrMult: 0.92,          // multiplier (lower = faster)
  echoSpellId: 'lightning_bolt',// glyph_of_echo: re-cast a chosen spell after a delay
  echoDelay: 0.4,
  echoDmgMult: 0.4,
  proc: { spellId, chance },    // stormcaller: random extra cast on spell trigger
}
```

Item effects are read in `computeSpellMods` and `applyItemPassive`. `refreshPlayerStats` aggregates HP-bonus contributions.

### Item drop flow

- Every `CONFIG.waves.itemEvery` waves (currently 5), `pendingItem = true`
- After tree screen, `afterChoice` checks `pendingItem` and shows item screen
- Item screen shows current 2 slots + "Will replace" indicator + 3 random new items + Skip button
- Pick → `applyChoice({ kind: 'item', item })` puts new item in first empty slot, or overwrites slot 0 if both full
- Skip → `afterChoice()` → next wave starts immediately

## Fusion system

`FUSIONS` is a recipe registry. Each recipe specifies `requires.spells`, `requires.items`, `requires.nodes`. When all met, the fusion appears in the tree screen footer.

### Current recipes

| Fusion | Type | Requires | Consumes | Grants |
|---|---|---|---|---|
| Magnetar Pulse | true_fusion | gravity_bolt + lightning_bolt | both | magnetar_pulse |
| Storm Singularity | true_fusion | gravity_well + storm_cloud | both | storm_singularity |
| Tidal Sphere | true_fusion | gravity_bolt + static_field | both | tidal_sphere |
| Tempest | evolution | storm_cloud + stormcaller (item) | spell only | tempest |
| Black Bolt | evolution | gravity_bolt + voidstone (item) | spell only | black_bolt |

`evolution` flavor keeps the catalyst item; `true_fusion` consumes both ingredients.

`Game._applyFusionInline(fusion)` does the consume + grant. Called from the tree screen's fusion card click — does not advance to the next wave so the player can keep spending TP/SP.

## Enemy system

```js
{
  id, name, radius, hp, speed, damage,    // base stats (scaled per wave)
  color, shape,                            // render hints
  weight,                                  // sampling weight (excluded from boss waves)
  minWave,                                 // earliest wave this enemy appears
  group: { min, max },                     // optional — pack spawn
  boss: true,                              // optional — flagged for boss-wave spawn
}
```

`WaveManager.pickEnemyType` weighted-samples the eligible (`minWave <= wave`) non-boss pool. On boss waves, exactly one boss spawns at a specific `toSpawn` count.

`WaveManager.spawnEnemy` creates one Enemy (or a group, for swarmlings) at a top/bottom edge position with current wave's hpMult/speedMult applied.

### Kamikaze contact damage

Set in `Game.tickEnemies`:

```js
if (d < player.radius + e.radius) {
  player.takeDamage(e.damage, e, this);
  e.alive = false;
  game.spawnExplosion(...);
  game.addShake(...);
}
```

Each enemy = one decisive hit. Player iframes (0.85s) gate further damage in the same window.

## Renderer pipeline

`Renderer.draw(game)` is one big method. Order:

1. Save canvas, apply DPR transform
2. Apply screen shake offset (random within shake magnitude)
3. Draw cached background tiles (flagstones)
4. Draw spawn-zone gradients + chevrons (impending-doom UI)
5. Draw world layers IN ORDER:
   - flame patches → flame walls → pull fields → wells (under enemies)
   - aura → enemies → projectiles → storm clouds → lightnings → explosions → particles → damage numbers
6. Draw player on top
7. Restore canvas
8. HUD updates via DOM mutation (HP bar, wave indicator)

The renderer is **pure** — never reads from or writes to game state except to read positions/state for drawing. This is intentional so a sprite library can be swapped in by replacing draw methods.

## UI overlay system

DOM overlays are pre-defined in HTML and toggled via `.active` class. Each overlay has a JS render method:

| Overlay | Method | Purpose |
|---|---|---|
| `overlay-start` | `UI.showCharacterSelect` | Initial character pick |
| `overlay-path` | `UI.showPathSelect` | Element path pick (sets free tier-1) |
| `overlay-starter` | `UI.showStarterSelect` | Starter item pick |
| `overlay-upgrade` | `UI.showSkillTree` | Post-wave skill tree |
| `overlay-item` | `UI.showItemChoices` | Periodic item drop |
| `overlay-gameover` | `UI.showGameOver` | Run-end stats |

Tree screen complexity:
- Top: wave summary, TP/SP currency pills
- Middle: tab bar (5 tab icons), then tab content (spell groups with talent chips)
- Bottom: fusion offers, "Begin Wave N" button
- Modal layer: tap any node → modal popup with desc + live "Currently / Next rank" stats + Learn button

## Known sources of irregularity

These all have entries in REFACTOR_PLAN.md, but worth flagging here too:

- **Damage sites duplicated** (11 places). See "Damage pipeline" section.
- **Status payloads have bespoke shapes.** Slow uses `factor`, ignite uses `dps`, shock uses `multiplier`. No common interface.
- **Targeting logic is dumb.** No "prefer ignited", no "skip recently-hit". Spells dogpile nearest target.
- **Spell base stats are hardcoded inside cast() functions.** No way to compute "current effective damage" for the modal without parsing source.
- **Mod stacking rules are inconsistent.** Talents additive, items multiplicative, keystones multiplicative-after, CDR multiplicative-per-rank, per-spell cdMult special-cased. Documented above; still confusing.
- **`chain_lightning` is in the SPELLS registry but not reachable from the tree.** Kept for future use; if you remove it, also remove from Magnetar Pulse fallback paths (none exist currently).

## Where things commonly go wrong

When something breaks, check in order:

1. **`takenNodes` is now a `{ nodeId: rank }` map, not an array.** Anything iterating with `for...of` on it will fail. Use `for (const id in obj)` or `Object.keys(obj)`. (Was an array in earlier versions.)
2. **`spendSkillPoint` deducts from the right currency.** If you add a new currency type, update `nodeCurrency()` and the deduct branch in `spendSkillPoint`.
3. **`applyStatus` payload shape matters.** Putting `applyStatus: { foo: { duration: 1 } }` will silently do nothing unless `foo` is a known status name in tickEnemies / takeDamage.
4. **`refreshPlayerStats` must run after any `playerState` mutation that affects max HP / dodge / reduction / reflect.** Currently called after run start, after `spendSkillPoint`, after item pickup. Forgetting it = stale stats.
5. **`Game.afterChoice` is the universal "advance the run" path.** Anywhere that wants to leave the upgrade overlay should call `afterChoice`, not `WaveManager.startWave` directly.
