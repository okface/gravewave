# Gravewave — Design

> **Canonical doc.** Forget any prior docs (build_map, fusion notes,
> atlas, rank-picker, constellation, etc.) — this is the new ground.

## Core loop

1. Pick a **class** at run start (currently: **Wizard**).
2. Pick a **Tier 1 ability** (1 of 4). You start with this and only this.
3. Pick a **Companion** (1 of 4 minions). Stays with you the whole run.
4. Fight wave 1.
5. Wave clear → **+1 level → +1 unspent point**. Every 2 cleared waves
   also award **+1 unspent companion point**.
6. Levels **1 / 4 / 9** open a **tier picker** — pick 1 of 4 from the
   next tier. So by level 9 you have exactly **3 abilities**
   (one per tier).
7. Spend points freely on any owned ability or on your companion.
   Points carry over.
8. Run continues until you die.

Result: every run has clean, predictable structure. No items, no
fusions, no random card offers, no synergy hubs.

## Per-ability shape

Every ability — across every class, every tier — has the **same skeleton**:

```
Ability
├── base stats (damage, cooldown, radius, etc.)
├── 3 point-dumps                ← 5 points each, 15 max
│   ├── small +stat per point    (e.g. +6% damage / pt, max +30%)
│   └── max 5 points
└── 3 specializations            ← pick 1 once total invested ≥ 6
    └── transformative behavior  (e.g. "Fireball spawns a Hydra")
```

So **every ability has exactly 6 design slots** (3 dumps + 3 specs)
plus its base cast function. Adding a new class = filling 12 slots
the same way — 4 T1 abilities, 4 T2, 4 T3, each with 3+3 sub-options.

## Class skeleton

```
Class
├── id, name, base HP, sprite
├── Tier 1 (start)        ← 4 attack abilities
├── Tier 2 (lvl 4)        ← 4 defensive abilities
└── Tier 3 (lvl 9)        ← 4 ultimate abilities
```

Each tier-pick is **mutually exclusive within that tier** — once you
pick Fireball, you can't pick Chain Lightning this run.

## Wizard

### Tier 1 — Attack (pick 1, level 1)

| ability | core idea |
|---|---|
| **Fireball** | Lobbed projectile, explodes on impact. Splash damage. |
| **Chain Lightning** | Instant strike on nearest enemy + arcs to nearby foes. |
| **Black Hole** | Stationary singularity at densest cluster. DPS + pulls. |
| **Frost Bolt** | Piercing slow projectile. Snares enemies in a line. |

### Tier 2 — Defensive (pick 1, level 4)

| ability | core idea |
|---|---|
| **Snow Fort** | Drop a circular zone. You inside = -50% damage taken; enemies inside = slowed + chipped. |
| **Fire Shield** | 3 flame orbs orbit you, damage on contact, blocks one hit on cooldown. |
| **Gravital Anomalies** | Periodically spawns small pull wells around you for area control. |
| **Shock Tower** | Stationary sentry that auto-shocks the nearest enemy on cadence. |

### Tier 3 — Ultimate (pick 1, level 9)

| ability | core idea |
|---|---|
| **Storm Cloud** | Hovering cloud, periodically zaps random enemies under it. |
| **Wormhole** | Place 2 portals; enemies entering one teleport across, take damage, get confused. |
| **Meteor** | Single massive falling rock. Big single-target damage + AoE crater. |
| **Snow Storm** | Massive radius blizzard. Stacking slow + tick damage on everything inside. |

## Per-ability dump + spec design

Each ability in the registry follows this schema:

```js
ABILITIES.fireball = {
  id: 'fireball', name: 'Fireball', tier: 1, classId: 'wizard',
  damageType: 'elemental',
  damage: 20, cooldown: 1.5, radius: 90,
  cast(game, caster, mods) { /* uses mods.dmgMult etc. */ },
  dumps: [
    { id: 'heat',   name: 'Heat',     desc: '+6% damage per point.',   stat: 'dmgMult',    perPoint: 0.06 },
    { id: 'spread', name: 'Spread',   desc: '+5% radius per point.',   stat: 'radiusMult', perPoint: 0.05 },
    { id: 'quick',  name: 'Quick Cast', desc: '-3% cooldown per point.', stat: 'cdMult',   perPoint: -0.03 },
  ],
  specs: [
    { id: 'ignite', name: 'Ignite', desc: 'Targets burn for 50% of impact damage over 3s.',
      behavior: { ignite: { ratio: 0.50, duration: 3 } } },
    { id: 'hydra',  name: 'Hydra',  desc: '20% chance on hit to spawn a fireball-spitting head for 6s.',
      behavior: { hydra: 0.20 } },
    { id: 'meteor', name: 'Meteor', desc: 'Fireball falls from above with +50% damage and ×1.5 radius.',
      behavior: { meteor: true } },
  ],
};
```

Stats supported by the per-pick `mods`:
- `dmgMult` — additive damage bonus
- `radiusMult` — additive radius bonus
- `cdMult` — additive cooldown shift (negative = faster)
- `durationMult` — additive duration bonus
- `pierceBonus` — added pierce
- `chainBonus` — added chain count
- `slowMult` — slow strength multiplier
- `shieldMult` — shield strength multiplier (defensive abilities)
- `attackRateMult` — sentry attack rate (defensive abilities)

Specs are **behavior flags** read by the ability's cast(). At most one
spec per ability — picking one locks the others.

## Player state

```js
playerState = {
  charDef,                       // wizard, etc.
  level: 0,                      // ticks up per wave clear
  unspentPoints: 0,              // free points to allocate
  tiers: { 1: 'fireball', 2: null, 3: null },  // chosen ability per tier
  points: {                      // per-ability point allocation
    fireball: { dumps: [3, 1, 0], spec: null },
  },
};
```

`points[id].dumps[i]` stores how many points the player has put into
the *i*th dump. Sum determines spec eligibility (≥ 6 → spec slot opens).

## Files of interest

- `index.html` — single-file game. All registries live in the inline
  script. Edit there, run via any static server.
- `DESIGN.md` (this file) — canonical design reference.

## Adding a new class — checklist

1. Add `CHARACTERS.<class>` definition.
2. Define **12 abilities** under `ABILITIES`:
   - 4 with `tier: 1, classId: '<class>'`
   - 4 with `tier: 2, classId: '<class>'`
   - 4 with `tier: 3, classId: '<class>'`
3. Each ability needs:
   - `cast(game, caster, mods)` function
   - 3 dumps (id, name, desc, stat, perPoint)
   - 3 specs (id, name, desc, behavior flags)
4. Implement any new entity classes if the ability needs new world state.

That's it. No rebalancing of card pools. No editing of UI. The level
flow + tier picker + level-up screen all read from `ABILITIES` and
work for any class.

## Companions (minions)

Picked once at run start, after the Tier 1 ability. Lighter shape
than abilities so you don't have to micro-manage another full panel:

```
Companion
├── 2 dumps × 3 points each       (max 6 invested)
└── 2 specializations             (pick 1 once total invested ≥ 4)
```

Companion points are **separate from ability points** — earned at
**+1 per 2 cleared waves**, so by wave 10 you have ~5 companion points.

### Wizard companions

| companion | role |
|---|---|
| **Sigil Linker** | Threads 3 nearby enemies. Damage on one bleeds to the others; overkill cascades. |
| **Decoy Effigy** | Taunts enemies in range. Detonates on death and respawns after a cooldown. |
| **Mender Wisp** | Heals you on a steady cadence. |
| **War Drummer** | Cycles aura: Vigor (+damage), Ward (-damage taken), Haste (-cooldowns). |

Same checklist as abilities — to add a new companion: 1 entry in
`MINIONS`, a `kind` discriminator, a `_tickXxx` and `_drawXxx`
behavior pair, and you're done. Mods come from `computeMinionMods()`.

## What's deprecated

The following systems were removed in this rebuild — preserved in
git history if anything needs to be salvaged later:

- `CARDS` registry (the 100+ card pool)
- `SPELL_TREES` (per-spell rank-picker registry with rank4Specs / rank8Specs)
- `CONSTELLATIONS` (2-branch atlas with capstones)
- `FUSIONS` (spell-fusion recipes)
- `ITEMS` (equippable artifacts)
- `PATHS` (replaced by tier 1 picker)
- `AFFINITY_TIERS` + per-damage-type kill counters
- The Sentinel Crow scaling minion (was a greed card)
- All "synergy hub" cards (Iron Discipline, Bloodbound Ledger, etc.)
- All Pacts (Pact of Glass, Hunger, Echoes)

Spell cast() functions for spells in the deprecated systems may be
reused as future class abilities (e.g. `crescent_strike`,
`shadow_clone`, `crossbow_bolt` could anchor a Ninja class).
