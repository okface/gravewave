# Gravewave — Tuning

Every balance dial in the codebase. Find a knob without grepping.

If you change a value here, also update the explanation column where it diverges from default.

## Player

| Dial | Value | Where | What it does |
|---|---|---|---|
| `radius` | 22 | `CONFIG.player.radius` | Player hitbox radius. Affects contact detection vs enemies. |
| `maxHp` | 100 | `CONFIG.player.maxHp` AND `CHARACTERS.magician.stats.maxHp` | Base HP. Vigil's Hardened adds +25 per rank. Items can also add. |
| `iframes` | 0.85 | `CONFIG.player.iframes` | Seconds invulnerable after a hit. Was 0.6; raised because kamikaze model means each hit is bigger so longer recovery prevents back-to-back deaths. |

## Camera / world scale

| Dial | Value | Where | What it does |
|---|---|---|---|
| `zoom` | 0.72 | `CONFIG.camera.zoom` | World units = canvas / zoom. Lower zoom = larger world = more space between player and spawn edge. Used for the "impending doom" feel where enemies march from off-screen. |

## Wave scaling

| Dial | Value | Where | What it does |
|---|---|---|---|
| `baseEnemies` | 10 | `CONFIG.waves.baseEnemies` | Wave 1 enemy count |
| `perWaveEnemies` | 5 | `CONFIG.waves.perWaveEnemies` | Added per wave (linear). Wave N count = `baseEnemies + perWaveEnemies * (N - 1)`. |
| `baseSpawnInterval` | 1.05 | `CONFIG.waves.baseSpawnInterval` | Seconds between spawns at wave 1 |
| `minSpawnInterval` | 0.22 | `CONFIG.waves.minSpawnInterval` | Floor — spawns can't be faster than this |
| `spawnIntervalDecay` | 0.04 | `CONFIG.waves.spawnIntervalDecay` | Spawn interval decreases by this each wave (clamped to min). Wave N interval = `max(min, base - decay * (N-1))`. |
| `healthScale` | 0.08 | `CONFIG.waves.healthScale` | Enemy HP multiplier per wave (additive). Wave N hpMult = `1 + healthScale * (N-1)`. Was 0.16, then 0.11; lowered because kamikaze + flatter HP curve = clearer mid-game. |
| `speedScale` | 0.035 | `CONFIG.waves.speedScale` | Enemy speed multiplier per wave (additive, capped) |
| `speedCap` | 1.7 | `CONFIG.waves.speedCap` | Hard cap on speed multiplier so late-game wisps don't teleport |
| `bossEvery` | 4 | `CONFIG.waves.bossEvery` | One goliath spawns every Nth wave. Also gates SP awards (boss waves give +1 SP). |
| `itemEvery` | 5 | `CONFIG.waves.itemEvery` | Item drop every Nth wave. Choosing 5 (not 4) so it doesn't always coincide with boss waves. |
| `clusterSpread` | 38 | `CONFIG.waves.clusterSpread` | Group spawn (swarmlings) clustering radius |

### Math reference

At wave N, the player faces:
- `10 + 5(N-1)` enemies
- HP multiplier `1 + 0.08(N-1)`
- Speed multiplier `min(1.7, 1 + 0.035(N-1))`
- Spawn interval `max(0.22, 1.05 - 0.04(N-1))` — so wave 21+ is at the floor

Boss waves (4, 8, 12, 16, 20, ...) include exactly 1 goliath.

## Currency rates

These are not in CONFIG — they're hardcoded in `Game.onWaveCleared` (line ~3818).

| Wave clear yields | Wave 1–3 | Wave 4 (boss) | Wave 5–7 | Wave 8 (boss) |
|---|---|---|---|---|
| TP | +1 | +1 | +1 | +1 |
| SP | +0 | +1 | +0 | +1 |
| HP heal | 35% maxHp + Vigil bonus | 35% + Vigil | 35% + Vigil | 35% + Vigil |

**Starting bank**: 2 TP + 0 SP at run start (path-select also grants tier-1 spell free).

To change: `Game.onWaveCleared` — `tpAwarded`, `spAwarded`, the `playerState.skillPoints += 0` initial value at line ~3192, and the `+2` starter TP at line ~3193.

## Cost ladder

| Node type | Currency | Cost | Where set |
|---|---|---|---|
| Tier-1 spell unlock | SP | 1 | `cost: 1` on the unlock node |
| Tier-2 spell unlock | SP | 2 | `cost: 2` on the unlock node |
| Tier-3 spell unlock | SP | 3 | `cost: 3` on the unlock node |
| Talent (any) | TP | 1 | default — no `cost` field needed |
| Keystone | TP | 1 | currently |
| Passive | TP | 1 | currently |

Tiers and costs are decoupled — `tier` is metadata. If you wanted a tier-2 spell to cost 4 SP, just bump the cost field on its unlock node.

## Wave-end heal

| Dial | Value | Where | What it does |
|---|---|---|---|
| `waveHealPct` (base) | 0.35 | `computePlayerStats` (`Systems` section) | Heal at end of each wave, as fraction of maxHp. |
| Vigil "Recover" rank | +0.10 per rank, max 3 ranks (+0.30) | `SKILL_TREES.vigil` | Stacks additively |
| Vigil "Vital Surge" | (removed in current build) | — | — |

So a maxed Recover gives 65% wave heal.

## Crit

| Dial | Value | Where | What it does |
|---|---|---|---|
| `baseCritChance` | 0.05 | `CONFIG.spell.baseCritChance` | Default crit chance |
| `baseCritMult` | 2.0 | `CONFIG.spell.baseCritMult` | Default crit damage multiplier |

Per-spell overrides are computed via `mods.critChance` / `mods.critMult` which start at base and stack additive bonuses (talents, items).

**Special case**: ignited enemies are auto-critted by all spells (currently in 4 places — see ARCHITECTURE → Damage pipeline).

## Enemy stats

| ID | HP | Speed | Damage | Weight | minWave | Group | Boss |
|---|---|---|---|---|---|---|---|
| shade | 18 | 70 | 11 | 1.0 | 1 | — | — |
| husk | 48 | 50 | 17 | 0.6 | 2 | — | — |
| swarmling | 8 | 90 | 5 | 0.9 | 2 | 4–6 | — |
| wisp | 14 | 130 | 8 | 0.4 | 3 | — | — |
| bulwark | 240 | 26 | 24 | 0.18 | 4 | — | — |
| goliath | 320 | 24 | 30 | 0.15 | 5 | — | yes |

`hp` and `speed` are scaled per wave by `healthScale` and `speedScale` (see above).

`damage` is the contact-detonation damage (kamikaze: enemy hits once, dies). NOT scaled per wave — same damage at wave 1 and wave 20. The threat scaling is in HP (harder to kill before reaching) and count (more attempts to reach).

## Spell base stats

These are hardcoded inside each spell's `cast()` function. Search for the spell ID in `SPELLS = { ... }`.

(Refactor B will pull these out into `baseStats` metadata. See REFACTOR_PLAN.md.)

### Gravity tree

| Spell | Damage | Cooldown | Radius | Other |
|---|---|---|---|---|
| Gravity Bolt | 28 dps | 1.6s | 80 | 1.4s well duration, 220 pull |
| Gravity Well | 14 dps | 5.0s | 130 | 3.0s well duration, 200 pull |

### Storm tree

| Spell | Damage | Cooldown | Other |
|---|---|---|---|
| Lightning Bolt | 16 + 1 chain @ 70% | 0.8s | 180 chain range, 0.7 falloff |
| Storm Cloud | 14 per strike | 7.0s | 100r area, 0.65s strike interval, 5.5s life, applies Shock |
| Static Field | ~5 per tick | 0.5s | 100r aura |
| Chain Lightning (unreachable) | 22, 3 chains | 2.6s | 160 range, 0.85 falloff |

### Fire tree

| Spell | Damage | Cooldown | Radius | Other |
|---|---|---|---|---|
| Fireball | 18 + 11 splash | 1.5s | 80 | 340 projectile speed, 3s life |
| Wall of Flame | 7 dps | 7.0s | full width, 80 height | 8s life |
| Pyroclasm | 80 burst | 6.5s | 150 | 0.5 falloff per distance |

### Frost tree

| Spell | Damage | Cooldown | Other |
|---|---|---|---|
| Frost Spike | 12 | 0.85s | 480 speed, 2.2s life, 2 pierce, applies slow 35%/1.5s |

### Generic / fusion-grant spells

| Spell | Damage | Cooldown | Other |
|---|---|---|---|
| Arcane Missile | 8 | 1.4s | 360 speed, 1.4s life — placeholder/fallback |
| Magnetar Pulse | 28 + AOE | 6.5s | gravity well + chain on impact |
| Storm Singularity | (well + periodic chain emission) | 6.5s | scaled fusion of well + storm |
| Tidal Sphere | (gravity comet) | 4.0s | hits + persistent field |
| Tempest | (rapid chain) | varies | evolution of storm_cloud |
| Black Bolt | 35 + AOE | 5.0s | gravity_bolt evolution |

## Status effect parameters

### Slow
- Default duration: 1.5s (Frost Spike)
- Default factor: 0.65 (35% slow)
- Talent override (Lasting Chill): 3.0s, factor 0.5
- Talent override (Glacial Pull on Gravity Bolt): 2.0s, factor 0.55

### Ignite
- Default duration: 3.0s (Fireball with Ignite talent)
- Default dps: 0 (in the current build, Ignite's primary effect is `critOnHit`, not DoT)
- `critOnHit: true` makes every spell hit on the target an auto-crit

### Shock
- Default duration: 4.0s (Lightning Bolt with Shock talent, Storm Cloud strikes)
- Multiplier: 1.5 (next hit deals +50%)
- **Consumed on first damage hit** — single-use buff for the attacker

### Freeze
- Sets `speedFactor = 0` in tickEnemies — fully stops the enemy
- **Currently not applied by anything.** Reserved for future use.

## Talent stacking — common mod values

| Mod | Per rank | Max ranks | Total | Example talent |
|---|---|---|---|---|
| `dmgMult` | +0.20 | 3 | +60% | Heat (Fireball), Voltage (Lightning Bolt), etc. |
| `radiusMult` | +0.15 to +0.20 | 3 | +45% to +60% | Spread (Fireball), Wider Pull (Gravity Bolt) |
| `cdMult` | -0.10 | 3 | ~-27% (multiplicative stack) | Quick Cast (Fireball) |
| `pierceBonus` | +1 | 3 | +3 | Pierce (Frost Spike) |
| `chainBonus` | +1 | 3 | +3 | Forking (Lightning Bolt) |
| `hpBonus` | +25 | 3 | +75 | Hardened (Vigil) |
| `waveHealBonus` | +0.10 | 3 | +0.30 | Recover (Vigil) |
| `gravityCdrMult` | 0.92 | 3 | ~-22% (0.92³) | Quickened Mind |

## Notes on tuning the difficulty curve

The current curve was tuned for the kamikaze-contact + two-currency economy. **Don't tune blindly.** Key relationships:

- **Wave clear time**: a wave with N enemies and S spawn interval lasts `~N × S + max_kill_time`. Currently wave 5 = 25 enemies × 0.89s ≈ 22s + clear time.
- **Player DPS scales with TP**, but only on the spell(s) you spec into. Single-spell builds at +60% damage from talents are roughly 1.6× a fresh-tier-1 spell.
- **Damage taken per wave** depends on how many enemies reach you. With 0.85s iframes, max ~5 hits per wave even if many enemies arrive simultaneously.
- **Heal between waves** is 35% (+ Vigil), so even a wave that drained you to 30% recovers to ~65%+.

If wave 8 feels too hard:
- Drop `healthScale` 0.08 → 0.07 (gentler HP curve)
- Or reduce `perWaveEnemies` 5 → 4 (fewer adds)
- Or bump `iframes` 0.85 → 1.0 (more recovery space)
- Or bump starter TP 2 → 3

If wave 8 feels too easy:
- Bump `healthScale` 0.08 → 0.10
- Or `perWaveEnemies` 5 → 6
- Or shorten `iframes` 0.85 → 0.7

Best practice: change ONE knob, play 3 runs to wave 10ish, decide.
