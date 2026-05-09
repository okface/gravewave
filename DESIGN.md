# Gravewave — Design

> **Canonical doc.** Forget any prior docs (build_map, fusion notes,
> atlas, rank-picker, constellation, etc.) — this is the new ground.

## Core loop

1. Pick a **class** at run start (currently: **Wizard**).
2. Pick a **Tier 1 ability** (1 of 4). You start with this and only this.
3. Pick a **Companion** (1 of 4 minions). Stays with you the whole run.
4. Fight wave 1.
5. Wave clear → **+1 level → +1 unspent point** (single shared pool —
   spend on abilities OR your companion).
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

1. Add `CHARACTERS.<class>` definition (id, name, title, description,
   color, accent, stats: { maxHp, moveSpeed }, available: true).
2. Define **12 abilities** under `ABILITIES`:
   - 4 with `tier: 1, classId: '<class>'`
   - 4 with `tier: 2, classId: '<class>'`
   - 4 with `tier: 3, classId: '<class>'`
3. Each ability needs:
   - `cast(game, caster, mods)` function
   - 3 dumps (id, name, desc, stat, perPoint)
   - 3 specs (id, name, desc, behavior flags)
4. Implement any new entity classes if the ability needs new world state.
5. Audit every spec's behavior flag — `grep <flag>` should hit ≥ 3
   places (declaration + at least one read). Orphan flags break build
   diversity silently.

That's it. No rebalancing of card pools. No editing of UI. The level
flow + tier picker + level-up screen all read from `ABILITIES` and
work for any class.

## Class authoring guide — what each tier should provide

A class's 12 abilities aren't 12 random spells; they fill specific
**role slots** inside each tier. Hitting all the slots makes every
build viable; missing a slot makes some build paths feel hollow.

### Class-level identity

Decide three things first — they determine which abilities feel
right:

- **Role thesis** — one sentence. Wizard's: "stationary caster who
  pulls fire/frost/lightning/gravity out of the air; the ground holds,
  the spells decide." If you can't write the sentence, you're not
  ready to design the kit.
- **Movement model** — `stats.moveSpeed`. Wizard is 0 (stationary).
  A faster class would need `Player.update` to read keyboard input
  and apply velocity (currently dead — Wizard never moves).
- **Damage-type bias** — across the 12 abilities, how many are
  physical / elemental / arcane? Bias matters because enemies have
  resists (`bulwark` resists physical 0.55×, `wraith` weak to
  elemental 1.30×, `hexer` weak to arcane 1.40×, `goliath` 0.9× all
  + 1.5× when statused). A 12/0/0 single-type class gets walled by
  one boss archetype. Aim for at least 2 types in the kit.

### Tier 1 — Attack (4 ABILITIES)

The four T1 picks are how the player engages combat for the entire
run. They have to feel **mechanically distinct**, not just numerically.
Wizard's existing slots are the canonical set:

| slot | shape | wizard example |
|---|---|---|
| **Projectile (splash)** | Slow/medium projectile, AoE on impact | Fireball |
| **Instant strike** | Hitscan / instant target with chain or pierce | Chain Lightning |
| **Placed zone** | DPS over time in a fixed spot | Black Hole |
| **Piercing line** | Fast pierce projectile, often with status | Frost Bolt |

You can re-skin or remix, but the four shapes should each be
present. Two projectile-splash abilities means the player has no
real choice between them — same gameplay loop.

**T1 base damage baseline** (post 2026-05 rebalance):
- Single-target instant: ~22 dmg / 0.9s CD ≈ 24 dps
- Splash projectile:     ~24 direct + 14 splash / 1.5s CD
- Placed zone:           ~36 dps over 1.4s / 1.7s CD
- Pierce line:           ~16 dmg per hit / 1.0s CD, pierces 2

**T1 dumps** are always 3 stat tracks at 5 pts each:
- One **damage** track at +12% / pt (dmgMult)
- One **shape** track (radius +8% / pt, OR pierce/chain +1 / pt)
- One **cooldown** track at −5% / pt (cdMult, negative perPoint)

**T1 specs** are 3 build-defining picks at ≥ 6 invested. Aim for one
per archetype:
- Status / DoT amp (e.g. Ignite — adds a burn over time)
- Summon / multiplication (e.g. Hydra — chance to spawn helper)
- Targeting / placement transform (e.g. Meteor Path — falls from
  above with stun)

### Tier 2 — Defensive (4 ABILITIES)

T2 is "how do you stay alive long enough to scale." Each pick has to
solve a different threat shape. Wizard's existing slots:

| slot | what it solves | wizard example |
|---|---|---|
| **Damage soak** | Takes hits for you, recharges | Snow Fort |
| **Retaliation** | Punishes attackers on contact / on-block | Fire Shield |
| **Crowd control** | Pulls/slows enemies to safe zones | Gravital Anomalies |
| **Sentry / DPS extension** | Auto-attacking turret that buys uptime | Shock Tower |

**T2 baselines** (defensive-tier abilities):
- Cooldown 8–10s (they're not constant DPS, they're situational)
- Effect duration 4–8s
- Per-point dump scaling typically +13% / pt
- "On-expire" specs (Avalanche / Phoenix) need a clear trigger; if
  the entity has a recharging-shield model (Snow Fort), "expire"
  means shield-break, not life-elapse — wire the trigger in
  `Player.takeDamage`, not the entity's tick.

### Tier 3 — Ultimate (4 ABILITIES)

T3 is the big once-per-fight payoff. ~12–18s cooldowns. Each pick
should occupy a different "ultimate fantasy":

| slot | fantasy | wizard example |
|---|---|---|
| **Sustained DoT field** | "I dropped a storm and walked away" | Storm Cloud |
| **Battlefield reshape** | "I changed where enemies are" | Wormhole |
| **Single nuke** | "I deleted that elite" | Meteor |
| **Lockdown zone** | "Nothing in this circle moves" | Snow Storm |

**T3 baselines:**
- Cooldown 12–18s
- Per-point dump scaling +14–16% / pt (steeper than T1/T2 because
  fewer casts per wave)
- Spec scaling: hard-coded damage values must multiply by
  `mods.dmgMult` or they fall off the wave-10 HP curve.

### Companion (1 of 4)

Companions are the lighter slot — 2 dumps × 3 pts (max 6) + 2 specs
(pick 1 at 4 invested). Wizard's existing roles:

| role | function |
|---|---|
| **Damage redirect** | Spreads damage to clustered enemies (Linker) |
| **Tank / decoy** | Absorbs hits, taunts enemies away from player (Decoy) |
| **Sustain** | Periodic heal + lifeline spec (Mender) |
| **Aura buff** | Cycles offensive/defensive/utility buffs (Drummer) |

Each role has a clear "if you pick me, here's what your build needs
less of." Mender = you don't need defensive picks as hard. Drummer =
multiplies whatever you already do. Linker = makes your single-target
specs feel AoE. Decoy = lets you ignore positioning.

For a new class, **don't reskin all four** — pick at least one role
that genuinely changes how the class plays. A dedicated Ninja class
might add a "shadow clone" companion that spawns extra projectiles,
or a "spirit weapon" that auto-attacks in melee.

### Common pitfalls

- **Orphan spec flags.** Every `behavior: { foo: ... }` declaration
  must be read by the engine — usually inside the spell's `cast()`,
  the entity's `tickXxx`, or `Player.takeDamage`. Picking an orphan
  spec gives the player nothing. `grep` the flag name; ≥ 3 hits =
  wired (declaration + read + maybe a renderer hook).
- **Hard-coded spec damage.** A spec like "explode for 240 damage on
  expire" needs `* mods.dmgMult` so investments matter at wave 20.
- **"On expire" semantics.** If the entity has `life: 999` and just
  recharges (Snow Fort model), "expire" must mean shield-break, not
  life-elapse. Wire the trigger where the state actually changes.
- **Targeting outside the engagement ring.** Player-side targeting
  (`findNearestEnemy` / `findFarthestEnemy` / `findEnemyCluster`)
  caps to the dueling-ring radius (`game.combatRadius()`) so the
  player can see what their abilities are killing. Entity-scoped
  targeting (turrets with their own range) uses `findNearestEnemyTo`
  and bypasses the cap. Don't reach past the ring.

## Companions (minions)

Picked once at run start, after the Tier 1 ability. Lighter shape
than abilities so you don't have to micro-manage another full panel:

```
Companion
├── 2 dumps × 3 points each       (max 6 invested)
└── 2 specializations             (pick 1 once total invested ≥ 4)
```

Companion points come from the **same shared pool** as ability points.
You can dump everything into the companion if you want a strong
sidekick at the cost of slower spell scaling, or barely touch them.

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
