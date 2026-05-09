# Gravewave — Design

> **Canonical doc.** Forget any prior docs (build_map, fusion notes,
> atlas, rank-picker, constellation, etc.) — this is the new ground.

## Core loop

1. Pick a **class** at run start (**Wizard** or **Optician**).
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

## The Optician — second class (shipped)

**Role thesis:** A meticulous artificer who manipulates light through
lenses, mirrors, and shadow. Her power comes from *concentration* —
beams ramp the longer they hit, lenses build heat the longer they
linger, mirrors fold incoming damage back on itself. Build paths
fork hard between glass-cannon (max ramp + concentration) and
defensive-mirror (reflect + blind everything that approaches).

**Identity decisions (must hit all three):**
- `stats.maxHp = 90`, `moveSpeed = 0` (stationary, like Wizard).
- Damage-type bias: 9 elemental (light/heat) + 3 arcane (mirrors/
  geometry warps). Same as Wizard's bias, no new damage type
  introduced — keeps resists math simple.
- Two new mechanics introduced by this class:
  - **Ramp** — several abilities ramp damage over time on the same
    target / in the same spot. Stationary + ramp = "find a chokepoint
    and concentrate fire there." Ramp resets when target leaves the
    beam / when the entity ends.
  - **Blind status** — a new enemy debuff. Blinded enemies do 50% less
    contact damage to the player and move 30% slower. Visual: dimmed
    enemy outline + white shimmer. Wired in `Enemy.applyStatus`,
    `tickEnemies` (slow factor), and `Player.takeDamage` (contact
    damage halved when `attacker.statuses?.blind`).

### Tier 1 — Attack (pick 1, lvl 1)

| ability | shape | core twist |
|---|---|---|
| **Prism Burst** | Projectile (splash) | Splits into 3 RGB beams on impact, each beam fans outward through enemies |
| **Focused Beam** | Continuous beam | DPS RAMPS exponentially 30% → 200% over ~2s of focus on one target |
| **Burning Lens** | Placed zone | DPS RAMPS over the lens's lifetime — lasts long if undisturbed |
| **Refraction Bolt** | Piercing line | Beam REFRACTS (angle changes ±15°) on each pierce; blinds on hit |

**Prism Burst** — `dmg 22 / cd 1.5s / radius 80px`. On impact, splits
into 3 colored beams (R/G/B) that travel ~120u outward through enemies
in their path, each dealing 60% of the splash damage.
- Dumps: Heat (+12% dmg/pt), Spread (+10% beam reach/pt), Quick (-5% cd/pt).
- Specs:
  - **Spectrum** — fires 7 beams in a full color wheel instead of 3.
  - **Searing Red** — only the red beam fires, but for ×2.5 damage
    in a focused line.
  - **Zenith** — beams travel further and bounce off the engagement
    ring back inward once.

**Focused Beam** — `base 32 dps / cd 0.5s / range engagement ring`.
A CONTINUOUS beam locked on the nearest enemy. cast() refreshes the
beam intent on cooldown; Game.tickFocusedBeam runs every frame,
ramping `time-on-target` exponentially:
  factor(t) = 0.30 + 1.70 × (1 − exp(−t / 0.6))
  → t=0 30% · t=0.5 110% · t=1.0 162% · t=2.0+ ~200%.
Switching targets soft-decays the ramp (drop time-on-target by 0.4s
on a player-driven swap, 0.6s on auto re-acquire).
- Dumps: Concentrate (+12% beam DPS/pt), Quick (−5% retarget cadence
  /pt), Wide Lens (+1 grace re-target before the ramp resets/pt, max +5).
- Specs:
  - **Magnifier** — plateau rises to 260% with tau 1.0s (slower climb,
    higher ceiling — patient elite-killer).
  - **Burnthrough** — at peak intensity, the beam continuously chains
    60% of its damage to the nearest other enemy.
  - **Prism Lens** — at peak intensity, three smaller side-beams
    continuously strike nearby enemies for 40% damage each.

**Burning Lens** — `dps 18 base / cd 1.8s / radius 90px / life 1.8s`.
Drops a lens at the densest cluster. DPS ramps from 50% → 150% over
its lifetime. Sun-themed visual.
- Dumps: Heat (+12% dmg/pt), Wider (+8% radius/pt), Lasting (+12%
  life/pt — extends the ramp tail).
- Specs:
  - **Greenhouse** — life ×2, but DPS curve flattened (75% → 110%);
    longer total damage uptime.
  - **Solar Forge** — at peak DPS, lens explodes for 200% of total
    damage in a 1.5× radius.
  - **Refractor** — when lens dies, leaves 3 small lenses that each
    burn for 1s at 40% DPS in a tighter radius.

**Refraction Bolt** — `dmg 14 / cd 0.9s / pierces 2`. Beam projectile.
On each pierce, angle bends randomly ±15°. Applies Blind (1.5s) on
hit.
- Dumps: Cold Light (+12% dmg/pt — name is metaphorical), Pierce
  (+1/pt max +5), Quick (-5% cd/pt).
- Specs:
  - **Bouncing** — bounce angle is now ±45° (sharper deflection),
    pierces +2.
  - **Mirror Image** — splits into 2 parallel beams on first hit.
  - **Shatter** — last pierce explodes for AoE damage in 80px.

### Tier 2 — Defensive (pick 1, lvl 4)

| ability | slot | core twist |
|---|---|---|
| **Reflective Aegis** | Damage soak | 4 mirrors orbit you; absorb hits and reflect 80% back at attacker |
| **Solar Halo** | Retaliation | Sunburst above your head; close-range DoT + auto-blinds anything that approaches |
| **Lens Array** | Crowd control / focus | 3 floating lenses converge a high-DPS beam on the nearest elite |
| **Lighthouse** | Sentry / sweep | Stationary tower with a rotating beam; sweeps an arc, not a single target |

**Reflective Aegis** — `cd 8s / 4 mirrors / hits 4 / reflect 80%`.
Mirrors orbit player. Each absorbs one incoming projectile-or-contact
hit, reflects 80% damage back. Mirrors recharge individually over 5s.
- Dumps: Polish (+12% reflect strength/pt), Orbit (+10% orbit radius/
  pt), Recharge (+12% faster recharge/pt).
- Specs:
  - **Hall of Mirrors** — adds a smaller 2nd orbiting ring of 2 mirrors
    (6 total) with slower 7s recharge so it's frontloaded absorption,
    not infinite scaling.
  - **Spectrum Aegis** — each reflection blinds the attacker for 3s
    in a 60u radius.
  - **Fortified** — mirrors don't shatter — block 8 hits each, no
    recharge needed but lose the +25% strength bonus.

**Solar Halo** — `cd 9s / dps 16 contact / radius 80px / life 7s`.
A halo above the player that emits constant sunlight. Enemies in
contact range take DoT and are blinded for 1s. No block charges.
- Dumps: Flare (+13% dmg/pt), Reach (+10% radius/pt), Persist (+12%
  life/pt).
- Specs:
  - **Coronal Burst** — every 2s pulses outward for an AoE blast.
  - **Inferno Halo** — adds Ignite to the DoT.
  - **Eclipse Halo** — flips to dark mode: no damage, but radius is
    ×2 and blind duration is ×3.

**Lens Array** — `cd 10s / 3 lenses / dps 20 single-target / life 7s`.
3 lenses orbit player. They converge their beams on the nearest enemy
within 200u — pure single-target burst.
- Dumps: Focus (+13% dmg/pt), Reach (+10% targeting range/pt), Tempo
  (+10% beam intensity/pt).
- Specs:
  - **Convergence** — all 3 lenses focus one super-beam (×3 damage
    instead of stacking 3× damage).
  - **Rotation** — lenses rotate around player; beam sweeps wider
    arc, hits multiple enemies.
  - **Dispersal** — each lens picks a different target (3 separate
    beams, no convergence).

**Lighthouse** — `cd 10s / dps 20 / range 240px / life 8s`. Stationary
tower with a 360° rotating beam (~3.1s per full circle at base
rotation speed). Beam half-width 0.55 rad (≈32° each side) → realized
DPS on a stationary enemy is ~7 (advertised 20 dps × ~35% beam-arc
uptime). Damage ticks while beam intersects an enemy.
- Dumps: Voltage (+13% dmg/pt), Reach (+10% range/pt), Rotation (+12%
  rotation speed/pt).
- Specs:
  - **Twin Lights** — second opposing beam (covers 360° in half time).
  - **Solar Flare** — every full rotation, a wide AoE pulse around it.
  - **Beacon** — doesn't expire, but you can only have one.

### Tier 3 — Ultimate (pick 1, lvl 9)

| ability | slot | core twist |
|---|---|---|
| **Solar Eclipse** | Sustained DoT field | Ramps DPS over its lifetime; blinds everything inside |
| **Mirror Maze** | Battlefield reshape | 6 mirrors form a hex around you; beams between them form a kill mesh |
| **Prism Strike** | Single nuke | Concentrated beam from above; massive damage + wide blind |
| **Blinding Flash** | Lockdown zone | Mass blind 6s; initial damage burst |

**Solar Eclipse** — `cd 18s / dps 22 ramping / radius 240px / life 8s`.
A massive light disk. DPS ramps 50% → 200% over the eclipse's
lifetime. Blinds all enemies inside.
- Dumps: Heat (+14% dmg/pt), Wider (+10% radius/pt), Lasting (+12%
  life/pt).
- Specs:
  - **Total Eclipse** — radius ×1.5, but no blind (just heavy DoT).
  - **Penumbra** — radius ×0.6, ×2 DPS; outer ring slows.
  - **Darkness** — flips to shadow mode: no damage, but blinds
    enemies for the FULL eclipse duration (functionally a mass disable).

**Mirror Maze** — `cd 16s / 6 mirrors / dps 8 per beam / life 6s`.
6 mirrors spawn in a hexagon around the player. Beams between
adjacent mirrors form a damaging mesh. Enemies between mirrors take
beam damage.
- Dumps: Polish (+14% beam dmg/pt), Lattice (+10% mirror spacing/pt),
  Lasting (+12% life/pt).
- Specs:
  - **Hexagonal Cage** — 9 mirrors total (~50% more beam edges, not 100%
    — kept it from dominating Crystal Cage / Reflective Burst).
  - **Reflective Burst** — when an enemy dies inside, lattice pulses
    for AoE damage.
  - **Crystal Cage** — mirrors function as walls; enemies inside
    can't leave (blocked at boundary).

**Prism Strike** — `cd 14s / dmg 220 / radius 80px impact / blind 200px`.
A focused beam from above strikes a target spot. Massive damage to
enemies in impact radius + 4s blind in a wider radius.
- Dumps: Mass (+16% dmg/pt), Crater (+10% impact radius/pt), Cycle
  (-6% cd/pt).
- Specs:
  - **Collateral** — fires 3 secondary beams in a Y pattern after
    impact, each at 50% damage.
  - **Searing Glare** — extends blind radius to 350u and duration to 8s.
  - **Chained Solar** — instakills any enemy below 25% HP in the
    blind radius.

**Blinding Flash** — `cd 16s / dmg 100 initial / blind 6s / radius 320px`.
A massive flashbang. All enemies in range take damage and are
blinded for 6s.
- Dumps: Brightness (+14% dmg/pt), Wider (+10% radius/pt), Glare
  (+12% blind duration/pt).
- Specs:
  - **Searing Flash** — adds 80% extra burn damage on top of the disable.
  - **Cascading Light** — every 1s of blind, deals an additional
    small damage tick to each blinded enemy.
  - **Eternal Glare** — blind duration ×2 (12s); halve initial damage.

### Build identity targets

The goal: every Optician build should have a clear playstyle the
player can speak in one sentence. Examples:

| build | T1 / T2 / T3 / Companion | playstyle |
|---|---|---|
| **Glass Cannon** | Focused Beam / Lens Array / Prism Strike / Drummer | Stack damage, kill elites, hope nothing reaches you |
| **Mirror Defender** | Refraction Bolt / Reflective Aegis / Mirror Maze / Decoy | Stand still, bounce damage back, walls everywhere |
| **Greedy Sun** | Burning Lens / Lighthouse / Solar Eclipse / Linker | Multiple ramping zones overlap; high uptime |
| **Blind Tank** | Prism Burst / Solar Halo / Blinding Flash / Mender | Disable everything; tank what gets through |

If two builds end up feeling the same in playtest, a spec is too
weak / too good / too samey — fix it before shipping more abilities.

### Common companion advice for Optician

The class works fine with all four existing minions. Future
Optician-specific companion idea (not in scope yet): **Lens Imp** —
a small mascot that refracts the player's nearest spell, creating
a 40% damage echo at a different angle. Pairs with a build that
spams low-CD casts.

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
