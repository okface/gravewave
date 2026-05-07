# Gravewave — Build Map

> Auto-generated from `index.html` by `tools/build_map.js`.
> Run `node tools/build_map.js` to regenerate after code changes.

## Conventions

- **Axis** — every card carries one of:
  - ⚔ **damage** — straight damage / crit
  - ◇ **utility** — pierce, chain, CDR, status effects, behavior shifts
  - 🛡 **defense** — HP, reduction, dodge, reflect, healing
  - 🜚 **greed** — ramps, synergy hubs, scaling minions, pacts
- **Tier** — `T1` (always offered), `T2` (from wave 3+), `T3` (from wave 7+).
- **bossOnly** — capstones / pacts only offered on boss waves unless their
  branch is fully advanced (then they unlock as the earned payoff).
- **Path** — gravity / electricity / fire / frost (magician); steel / shadow /
  arsenal (ninja). Plus `universal` and `vigil` (defense-cluster cards).
- **Branch** — each path has TWO branches (matching its keystone fork).
  Filling 4 branch advance cards unlocks the capstone.

## Active picker UIs

- `UI.showSpellRank` — primary picker. After each wave clear, shows ONE
  panel per owned spell with a rank pip strip + 3 mutex picks. Spec
  milestones at rank-4 and rank-8 (the rank4Specs / rank8Specs lists).
- `UI.showSpellUnlock` — when the player crosses a wave threshold and
  is offered a NEW spell unlock.
- `UI.showAtlas` — legacy "More cards" fallback. Static map of every
  card the player can take (branch + universal). Reachable from a button
  on the rank picker.

## Damage Types & Affinity

Every spell carries one of three damage types. Enemy resists table
reads from this. Killing with a type stacks affinity which auto-
grants tier rewards in `computeSpellMods`.

| spell | damage type |
|---|---|
| `aegis_pulse` | arcane |
| `arcane_missile` | arcane |
| `battle_hymn` | arcane |
| `berserkers_howl` | physical |
| `black_bolt` | arcane |
| `caltrops` | physical |
| `chain_lightning` | elemental |
| `crescent_strike` | physical |
| `crossbow_bolt` | physical |
| `doom_sigil` | arcane |
| `fireball` | elemental |
| `flicker_step` | physical |
| `frost_spike` | elemental |
| `gravity_bolt` | arcane |
| `gravity_well` | arcane |
| `ignite` | elemental |
| `lightning_bolt` | elemental |
| `magnetar_pulse` | arcane |
| `mark_of_frailty` | arcane |
| `pyroclasm` | elemental |
| `reaping_strike` | physical |
| `reflect` | physical |
| `shadow_clone` | physical |
| `shadowblade` | physical |
| `shuriken_toss` | physical |
| `smoke_bomb` | elemental |
| `soul_anchor` | arcane |
| `spring_trap` | physical |
| `static_field` | elemental |
| `storm_cloud` | elemental |
| `storm_singularity` | arcane |
| `tempest` | elemental |
| `tidal_sphere` | arcane |
| `time_dilation` | arcane |
| `wall_of_flame` | elemental |
| `wardroot` | arcane |

### Affinity tiers

| kills | tier | reward |
|---|---|---|
| 8 | T1 | +8% damage of that type |
| 20 | T2 | Hits apply baseline status (physical bleed / elemental ignite / arcane slow) |
| 40 | T3 | +20% crit chance, +30% crit damage of that type |

## Characters & Paths

### The Magician (`magician`)

- **Title**: Channeler of arcane elements
- **Base HP**: 100
- **Vibe**: A frail caster with no melee, but a deep well of arcana. Bends spacetime, calls down the storm, or burns the world to cinders — choose your element before the dark arrives.

| path | starter spell | flavor |
|---|---|---|
| **Gravity** (`gravity`) | `gravity_bolt` | Bend spacetime. Place wells that drag and grind. |
| **Storm** (`electricity`) | `lightning_bolt` | Strike fast. Chain through clusters; prime targets with shock. |
| **Fire** (`fire`) | `fireball` | Burn the world. Splash, ignite, repeat. |
| **Frost** (`frost`) | `frost_spike` | Freeze the wave. Slow, then shatter. |

### The Ninja (`ninja`)

- **Title**: Whisper of steel and shadow
- **Base HP**: 80
- **Vibe**: A glass scalpel that snowballs through Focus — every kill stacks +1 Focus, and each stack shaves 8% off all cooldowns AND adds 4% damage to your next cast. Three distinct paths: Steel cleaves and drinks blood with crit-fueled life-steal, Shadow misdirects with clones and smoke, Arsenal pre-places death with crossbow shots and traps.

| path | starter spell | flavor |
|---|---|---|
| **Steel** (`steel`) | `crescent_strike` | Close-range cleave with crit-fueled life-steal. |
| **Shadow** (`shadow`) | `shadow_clone` | Misdirection: clones, smoke, evasion. |
| **Arsenal** (`arsenal`) | `crossbow_bolt` | Pre-place death. Bow shots and traps that kill the wave for you. |

## Spell Trees (`SPELL_TREES` — per-spell rank picker)

Each owned spell has its own rank track. Rank-4 surfaces the first
mutex spec (3 options); rank-8 surfaces the second. Non-milestone
ranks draw 3 fillers from `fillerPool`.

### 🔥 Fireball `fireball`

- Tree: `fire` · CD: 1.5s · Type: `elemental`

**Filler pool** — drawn at non-milestone ranks (1-3, 5-7).

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `f_heat` | Heat | ⚔ damage | T1 | magician | dmg +18% | +18% Fireball damage. |
| `f_spread` | Spread | ◇ utility | T1 | magician | radius +18% | +18% Fireball blast radius. |
| `f_quickcast` | Quick Cast | ◇ utility | T1 | magician | cd -12% | −12% Fireball cooldown. |
| `f_ignite` | Ignite | ◇ utility | T2 | magician | status: ignite | Fireball ignites — ALL your spells crit ignited enemies for 3s. |
| `fb_heatshield` | Heatshield | 🛡 defense | T1 | magician | behavior: castShield | Each Fireball cast grants you a brief shield equal to 6% max HP for 2s. |
| `fb_searing` | Searing Touch | ⚔ damage | T1 | magician | status: ignite | Fireball ignites — 1.6s burn for 35% of impact damage. |
| `fb_pyromancer` | Pyromancer's Mark | ⚔ damage | T2 | magician | — | +25% damage to ignited enemies. Fire feeds on fire. |
| `fb_smolder` | Smolder | ◇ utility | T1 | magician | — | Ignite damage +60%. Burns linger longer in the bones. |

**Rank-4 specs** (mutex — pick ONE):

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `f_conflag` | Conflagration | ◇ utility | T2 | magician | KEY ×0.7 dmg; KEY ×1.4 r; behavior: lingeringFlame | Keystone: Fireball impacts leave burning ground for 2.5s. Damage ×0.7, radius ×1.4. |
| `f_detonation` | Detonation | ⚔ damage | T2 | magician | KEY ×1.5 dmg; behavior: noSplash,projectileBoost | Keystone: Fireball hits a single target with ×1.5 dmg, no splash, 1.5× speed. |
| `fb_emberstorm` | Emberstorm | ⚔ damage | T2 | magician | KEY ×0.85 dmg; behavior: emberstorm | Spec: Each Fireball impact scatters 5 small embers in a ring (35% dmg each, 1.2s ignite). |

**Rank-8 specs** (mutex — pick ONE):

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `fb_meteor` | Meteor | ⚔ damage | T3 | magician | KEY ×1.8 dmg; KEY ×1.4 r; behavior: meteor,projectileBoost | Rank-8 Spec: Fireball becomes a falling Meteor — slower travel, ×1.8 damage, ×1.4 radius. Crater stuns 0.5s. |
| `fb_hydra` | Hydra Sigil | ◇ utility | T3 | magician | behavior: hydraOnHit | Rank-8 Spec: Fireball impacts have 30% chance to spawn a hydra-head sentry (8s, auto-shoots small fireballs). |
| `fb_solarflare` | Solar Flare | ⚔ damage | T3 | magician | behavior: everyNthCast | Rank-8 Spec: Every 4th Fireball cast also detonates a 240u flame ring around you (140 dmg). |

### ❄ Frost Spike `frost_spike`

- Tree: `frost` · CD: 0.85s · Type: `elemental`

**Filler pool** — drawn at non-milestone ranks (1-3, 5-7).

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `fr_cold` | Cold Bite | ⚔ damage | T1 | magician | dmg +18% | +18% Frost Spike damage. |
| `fr_pierce` | Multi-Spike | ◇ utility | T1 | magician | pierce +2 | Frost Spike pierces +2 enemies. |
| `fr_numb` | Numb | ◇ utility | T1 | magician | status: slow | Frost Spike slows hit enemies 50% for 2.5s. |
| `fr_winter` | Deep Winter | ◇ utility | T2 | magician | cd -15% | −15% Frost Spike cooldown. The cold comes faster. |
| `fr_hypothermia` | Hypothermia | ⚔ damage | T2 | magician | vsFrozen +30% | +30% damage to frozen enemies. |
| `fr_splinter` | Brittle | ⚔ damage | T2 | magician | dmg +15% | +15% Frost Spike damage. Shards fly cleaner. |
| `fr_kiteflow` | Kiteflow | 🛡 defense | T1 | magician | behavior: castDR | For 1.5s after each Frost Spike, you take −20% damage. Stay mobile. |
| `fr_brittlebone` | Brittle Bones | ⚔ damage | T2 | magician | — | +20% damage to slowed enemies. Frostbite makes them softer. |
| `fr_chillkeen` | Chillkeen | ⚔ damage | T1 | magician | critChanceBonus +5% | +8% global crit chance. The cold sharpens your aim. |
| `fr_glacierheart` | Glacier Heart | ◇ utility | T2 | magician | heal/kill +1 | +1 HP per kill. Each death feeds the glacier. |

**Rank-4 specs** (mutex — pick ONE):

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `fr_glacial` | Glacial Path | ◇ utility | T2 | magician | behavior: freezeOnSlow | Keystone: Frost Spike freezes already-slowed enemies for 1.5s. |
| `fr_shatter` | Shatter Path | ⚔ damage | T2 | magician | behavior: splitsOnFirstHit,splitDmgMult | Keystone: First hit splits Frost Spike into 3 fragments at 65% damage. |
| `fr_iceaxis` | Ice Axis | ◇ utility | T2 | magician | behavior: iceAxis | Spec: Frost Spike pierces all enemies and applies a stronger 60% slow for 3.5s. |

**Rank-8 specs** (mutex — pick ONE):

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `fr_iceage` | Ice Age | ◇ utility | T3 | magician | behavior: everyNthCast | Rank-8 Spec: Every 5th Frost Spike cast freezes ALL enemies on screen for 1.5s. |
| `fr_glacier` | Glacier Walker | ⚔ damage | T3 | magician | KEY ×1.4 dmg; behavior: glacierTrail | Rank-8 Spec: Frost Spike leaves a frost trail that slows 70% for 3s. Travels with you. |
| `fr_permafrost` | Permafrost | ◇ utility | T3 | magician | behavior: permafrostOnKill | Rank-8 Spec: Killing a frozen enemy spawns an 80u permafrost patch — slows 60% for 6s. |

### ⚡ Lightning Bolt `lightning_bolt`

- Tree: `electricity` · CD: 0.8s · Type: `elemental`

**Filler pool** — drawn at non-milestone ranks (1-3, 5-7).

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `e_voltage` | Voltage | ⚔ damage | T1 | magician | dmg +18% | +18% Lightning Bolt damage. |
| `e_forking` | Forking | ◇ utility | T1 | magician | chain +1 | +1 chain target on Lightning Bolt. |
| `e_shock` | Shock | ◇ utility | T1 | magician | status: shock | Lightning Bolt shocks targets — next hit on a shocked enemy +50%. |
| `e_cdr` | Quick Reflex | ◇ utility | T2 | magician | — | −12% cooldown on all storm spells. |
| `lb_grounded` | Grounded | ⚔ damage | T2 | magician | — | +22% damage to slowed or shocked enemies. Conduction. |
| `lb_castheal` | Static Recharge | 🛡 defense | T1 | magician | behavior: castHeal | Each Lightning Bolt cast heals you for 2 HP. Storm sustains. |
| `lb_critwave` | Critwave | ⚔ damage | T1 | magician | critChanceBonus +5%; critMultBonus +15% | +5% global crit chance and +15% crit damage. |
| `lb_scorchedearth` | Scorched Earth | ◇ utility | T2 | magician | status: slow | Lightning Bolt also applies a 1.2s slow at 60% factor — pinning the chain. |

**Rank-4 specs** (mutex — pick ONE):

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `e_pinpoint` | Pinpoint | ⚔ damage | T2 | magician | KEY ×1.5 dmg; behavior: noChain | Keystone: Lightning Bolt ×1.5 damage, +5% crit, no chain. Single-target burst. |
| `e_storm_sat` | Storm Saturation | ◇ utility | T2 | magician | — | Keystone: Lightning Bolt arcs through 4 foes total at ×0.65 dmg. Static Field ×1.5 dmg+radius. |
| `lb_thunderspear` | Thunderspear | ⚔ damage | T2 | magician | KEY ×0.95 dmg; behavior: thunderspear | Spec: Lightning Bolt fires a piercing line bolt — first hit ×2.4 dmg, all subsequent in line ×1.0. |

**Rank-8 specs** (mutex — pick ONE):

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `lb_stormgod` | Storm God | ⚔ damage | T3 | magician | behavior: everyNthCast | Rank-8 Spec: Every 4th Lightning Bolt cast calls down 3 free Lightning Bolts at random enemies. |
| `lb_plasma` | Plasma | ⚔ damage | T3 | magician | KEY ×1.5 dmg; behavior: plasma | Rank-8 Spec: Lightning Bolt becomes a piercing plasma — ×1.5 dmg, +1 chain, all chained enemies shocked. |
| `lb_discharge` | Discharge | ◇ utility | T3 | magician | behavior: castDischarge | Rank-8 Spec: Every cast also pulses 220u shock around you — 60 dmg + shock applied. |

### ◆ Gravity Bolt `gravity_bolt`

- Tree: `gravity` · CD: 1.6s · Type: `arcane`

**Filler pool** — drawn at non-milestone ranks (1-3, 5-7).

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `g_grav_crush` | Crushing Force | ⚔ damage | T1 | magician | dmg +18% | +18% Gravity Bolt damage. |
| `g_grav_wider` | Wider Pull | ◇ utility | T1 | magician | radius +18% | +18% Gravity Bolt radius. |
| `g_grav_glacial` | Glacial Pull | ◇ utility | T1 | magician | status: slow | Gravity Bolt slows enemies inside by 45% for 2s. |
| `g_grav_void` | Voidcurrent | ⚔ damage | T1 | magician | dmg +18%; radius +15% | +18% Gravity Bolt damage and +15% radius. The void widens. |
| `g_grav_cdr` | Quickened Mind | ◇ utility | T2 | magician | — | −12% cooldown on all gravity spells. |
| `gb_singtax` | Singularity Tax | ⚔ damage | T2 | magician | — | +22% damage to slowed enemies. Pulled = punished. |
| `gb_castshield` | Voidplate | 🛡 defense | T1 | magician | behavior: castShield | Each Gravity Bolt cast grants a 5% max-HP shield for 2.5s. |
| `gb_eventreward` | Event Horizon | ◇ utility | T1 | magician | heal/kill +1 | +1 HP per kill. The void gives back what it takes. |
| `gb_density` | Density | ⚔ damage | T1 | magician | dmg +12%; radius +-10% | +12% damage and −10% radius. Mass concentrated. |

**Rank-4 specs** (mutex — pick ONE):

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `g_grav_annihil` | Annihilation | ⚔ damage | T2 | magician | KEY ×1.6 dmg; behavior: noPull | Keystone: Gravity Bolt becomes a sharp burst — ×1.6 dps, no pull, 0.55s. Single-spot annihilation. |
| `g_grav_collapse` | Collapse | ◇ utility | T2 | magician | KEY ×0.7 dmg; KEY ×1.6 r; behavior: explodeOnHit | Keystone: Gravity Bolt becomes wider/longer — radius ×1.6, dps ×0.7, 1.9s. Sweeping AOE. |
| `gb_warpfield` | Warp Field | ◇ utility | T2 | magician | KEY ×0.6 dmg; behavior: warpField | Spec: Gravity Bolt teleports enemies it touches by 80u toward you and slows them to a crawl. |

**Rank-8 specs** (mutex — pick ONE):

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `gb_blacksun` | Black Sun | ⚔ damage | T3 | magician | KEY ×1.8 dmg; KEY ×1.4 r; behavior: blackSun | Rank-8 Spec: Gravity Bolt becomes a slow Black Sun — ×2.5 life, ×1.8 dmg, pulls everything in 280u. |
| `gb_fracture` | Fracture | ◇ utility | T3 | magician | KEY ×0.7 dmg; behavior: fracture | Rank-8 Spec: Each Gravity Bolt fractures into 4 mini-bolts on impact (40% dmg each). |
| `gb_ascension` | Ascension | 🛡 defense | T3 | magician | behavior: everyNthCast | Rank-8 Spec: Every 5th cast briefly lifts you (1.5s iframes) and slams a 200u area for 200 dmg. |

### 🛡 Aegis Pulse `aegis_pulse`

- Tree: `defense` · CD: 10s · Type: `arcane`

**Filler pool** — drawn at non-milestone ranks (1-3, 5-7).

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `ae_thicker` | Thicker Plate | 🛡 defense | T1 | all | dmg +18% | +18% Aegis Pulse shield amount. |
| `ae_quickseal` | Quick Seal | ◇ utility | T1 | all | cd -15% | −15% Aegis Pulse cooldown. |
| `ae_widefield` | Wide Field | ◇ utility | T1 | all | radius +20% | +20% Aegis Pulse radius — reactive burst is wider. |
| `ae_oversize` | Oversize | 🛡 defense | T2 | all | behavior: shieldDurMult | Aegis duration +60%. |
| `ae_thornglass` | Thornglass | ⚔ damage | T1 | all | behavior: shieldedDmgBuff | While shielded, your spells deal +12% damage. |

**Rank-4 specs** (mutex — pick ONE):

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `ae_reactive` | Reactive Aegis | ⚔ damage | T2 | all | behavior: reactiveAegis | Keystone: Broken shield bursts — big damage in shield radius. |
| `ae_eternal` | Eternal Aegis | 🛡 defense | T2 | all | behavior: eternalAegis | Keystone: If shield expires unbroken, next cast layers a 2nd shield on top. |
| `ae_refractive` | Refractive Aegis | ◇ utility | T2 | all | behavior: refractiveAegis | Keystone: Shield refracts 60% of incoming damage back at the attacker. |

_Rank-8 specs: none authored yet — picker falls back to fillers past rank 4._

### ☘ Wardroot `wardroot`

- Tree: `defense` · CD: 5.5s · Type: `arcane`

**Filler pool** — drawn at non-milestone ranks (1-3, 5-7).

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `wr_thicken` | Thicken Roots | ⚔ damage | T1 | all | dmg +18% | +18% Wardroot chip damage. |
| `wr_reach` | Long Roots | ◇ utility | T1 | all | radius +18% | +18% Wardroot radius. |
| `wr_cdr` | Forest Tempo | ◇ utility | T1 | all | cd -15% | −15% Wardroot cooldown. |
| `wr_witherbloom` | Witherbloom | ⚔ damage | T2 | all | — | Slowed enemies take +15% damage from your spells. |
| `wr_grindslow` | Grinding Slow | ◇ utility | T1 | all | status: slow | Wardroot slow harshens to 35% (longer crawl). |

**Rank-4 specs** (mutex — pick ONE):

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `wr_verdant` | Verdant | 🛡 defense | T2 | all | behavior: verdantWard | Keystone: Wardroot heals you per enemy hit each pulse. |
| `wr_thorned` | Thorned | ⚔ damage | T2 | all | KEY ×1.5 dmg; behavior: thornedWard | Keystone: Wardroot reflects extra damage on hit. |
| `wr_snaring` | Snaring | ◇ utility | T2 | all | behavior: snaringWard | Keystone: Harsh slow + brief stun on enemies in the ward. |

_Rank-8 specs: none authored yet — picker falls back to fillers past rank 4._

### ✚ Soul Anchor `soul_anchor`

- Tree: `defense` · CD: 8s · Type: `arcane`

**Filler pool** — drawn at non-milestone ranks (1-3, 5-7).

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `sa_resonance` | Resonance | 🛡 defense | T1 | all | — | +45% Soul Anchor heal amount. |
| `sa_quickprayer` | Quick Prayer | ◇ utility | T1 | all | cd -12% | −12% Soul Anchor cooldown. |
| `sa_afterglow` | Afterglow | ⚔ damage | T1 | all | behavior: afterglowDmg | After Soul Anchor triggers, your damage +30% for 4s. |

**Rank-4 specs** (mutex — pick ONE):

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `sa_phoenix` | Phoenix Anchor | ⚔ damage | T2 | all | behavior: phoenixAnchor | Keystone: Soul Anchor fully heals when you fall below 50% (rare, dramatic). |
| `sa_vampiric` | Vampiric Anchor | ◇ utility | T2 | all | behavior: vampiricAnchor | Keystone: Soul Anchor also heals from kills since last cast. |
| `sa_steady` | Steady Anchor | 🛡 defense | T2 | all | KEY ×0.5 dmg; behavior: steadyAnchor | Keystone: Smaller heals but fires almost every cooldown. |

_Rank-8 specs: none authored yet — picker falls back to fillers past rank 4._

### 🗡 Shadowblade `shadowblade`

- Tree: `utility` · CD: 1s · Type: `physical`

**Filler pool** — drawn at non-milestone ranks (1-3, 5-7).

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `sb_keenedge` | Keen Edge | ⚔ damage | T1 | all | dmg +18% | +18% Shadowblade damage. |
| `sb_swift` | Swift Cuts | ◇ utility | T1 | all | cd -15% | −15% Shadowblade cooldown. |
| `sb_punctures` | Puncture | ⚔ damage | T1 | all | status: slow | Shadowblade hits apply 25% slow for 1.2s. |
| `sb_widerorbit` | Bigger Blade | ◇ utility | T1 | all | — | +30% blade size. |

**Rank-4 specs** (mutex — pick ONE):

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `sb_twinedge` | Twin Edge | ◇ utility | T2 | all | behavior: twinEdge | Keystone: Shadowblade cast spawns 2 daggers in a spread. |
| `sb_bloodbound` | Bloodbound Blade | ⚔ damage | T2 | all | behavior: bloodbound | Keystone: Each kill scored adds +4% damage to Shadowblade. Caps +50%. |
| `sb_reckless` | Reckless Blade | ⚔ damage | T2 | all | behavior: recklessBlade | Keystone: Faster + harder daggers. The blade flickers. |

_Rank-8 specs: none authored yet — picker falls back to fillers past rank 4._

### ♬ Battle Hymn `battle_hymn`

- Tree: `utility` · CD: 12s · Type: `arcane`

**Filler pool** — drawn at non-milestone ranks (1-3, 5-7).

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `bh_lyric` | Bold Lyric | ⚔ damage | T1 | all | behavior: dmgBonusAdd | +10% damage bonus while hymn is active. |
| `bh_metronome` | Metronome | ◇ utility | T1 | all | cd -15% | −15% Battle Hymn cooldown. |
| `bh_legato` | Legato | ◇ utility | T2 | all | behavior: hymnDurMult | Hymn duration +60%. |
| `bh_chorus` | Chorus | ◇ utility | T1 | all | radius +20% | +20% Battle Hymn aura radius. |

**Rank-4 specs** (mutex — pick ONE):

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `bh_crescendo` | Crescendo | ⚔ damage | T2 | all | behavior: crescendo | Keystone: Each consecutive cast within window stacks intensity. |
| `bh_battlecry` | Battle Cry | ⚔ damage | T2 | all | behavior: battleCry | Keystone: First cast in a wave grants a guaranteed crit window. |
| `bh_anthem` | Anthem of Iron | 🛡 defense | T2 | all | behavior: anthemOfIron | Keystone: Hymn also grants +15% damage reduction. |

_Rank-8 specs: none authored yet — picker falls back to fillers past rank 4._

### ⊹ Mark of Frailty `mark_of_frailty`

- Tree: `utility` · CD: 4.5s · Type: `arcane`

**Filler pool** — drawn at non-milestone ranks (1-3, 5-7).

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `mf_brand` | Deeper Brand | ⚔ damage | T1 | all | behavior: markBonusBonus | Mark bonus +10% (25% → 35%). |
| `mf_quickbrand` | Quick Brand | ◇ utility | T1 | all | cd -12% | −12% Mark cooldown. |
| `mf_critfocus` | Crit Focus | ⚔ damage | T2 | all | critChanceBonus +5% | +5% global crit chance — your spells punch through marked enemies. |
| `mf_bountypoints` | Bounty | ◇ utility | T1 | all | heal/kill +1 | +1 HP per kill — marked enemies feed you. |

**Rank-4 specs** (mutex — pick ONE):

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `mf_hunters` | Hunter's Mark | ◇ utility | T2 | all | behavior: huntersMark | Keystone: When marked enemy dies, mark jumps to next-toughest. |
| `mf_doom` | Doom Mark | ⚔ damage | T2 | all | behavior: doomMark | Keystone: Marked enemies also bleed for ~4% max HP/s. |
| `mf_soulchain` | Soulchain | ◇ utility | T2 | all | behavior: soulchain | Keystone: Killing marked spreads the mark to 3 nearby enemies. |

_Rank-8 specs: none authored yet — picker falls back to fillers past rank 4._

### ⌛ Time Dilation `time_dilation`

- Tree: `onuse` · CD: 32s · Type: `arcane`

**Filler pool** — drawn at non-milestone ranks (1-3, 5-7).

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `td_extend` | Extended Field | ◇ utility | T2 | all | behavior: extendSlow | +50% Time Dilation slow duration. |
| `td_qcd` | Tempo Tear | ◇ utility | T2 | all | cd -15% | −15% Time Dilation cooldown. |
| `td_brittle` | Time Brittle | ⚔ damage | T2 | all | — | Slowed enemies take +15% damage from your spells. |

**Rank-4 specs** (mutex — pick ONE):

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `td_distortion` | Distortion | ◇ utility | T3 | all | behavior: distortionDilation | Keystone: After main slow ends, residual slow lingers 2s longer. |
| `td_stasis` | Stasis | ⚔ damage | T3 | all | behavior: stasisDilation | Keystone: Enemies near you are FROZEN instead of slowed. |
| `td_echo` | Echo of Time | ◇ utility | T3 | all | behavior: echoDilation | Keystone: If you take 0 damage during dilation, refund 50% CD. |

_Rank-8 specs: none authored yet — picker falls back to fillers past rank 4._

### 🜏 Doom Sigil `doom_sigil`

- Tree: `onuse` · CD: 28s · Type: `arcane`

**Filler pool** — drawn at non-milestone ranks (1-3, 5-7).

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `ds_potency` | Sigil Potency | ⚔ damage | T2 | all | dmg +18% | +18% Doom Sigil damage. |
| `ds_wider` | Wider Sigil | ◇ utility | T2 | all | radius +18% | +18% Doom Sigil radius. |
| `ds_quickseal` | Quick Seal | ◇ utility | T2 | all | cd -15% | −15% Doom Sigil cooldown. |

**Rank-4 specs** (mutex — pick ONE):

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `ds_twin` | Twin Sigils | ◇ utility | T3 | all | behavior: twinSigils | Keystone: Place 2 sigils. Each at 85% damage. |
| `ds_imploder` | Imploder | ⚔ damage | T3 | all | KEY ×1.3 dmg; behavior: imploderSigil | Keystone: Sigil pulls enemies inward before detonating. +15% damage. |
| `ds_heavens` | Heaven's Fall | ◇ utility | T3 | all | behavior: heavensFall | Keystone: Place 3 quick mini-sigils staggered. |

_Rank-8 specs: none authored yet — picker falls back to fillers past rank 4._

### 🜨 Berserker's Howl `berserkers_howl`

- Tree: `onuse` · CD: 40s · Type: `physical`

**Filler pool** — drawn at non-milestone ranks (1-3, 5-7).

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `bk_louder` | Louder Howl | ⚔ damage | T2 | all | behavior: dmgBonusBonus | +15% damage bonus during Howl. |
| `bk_longer` | Sustained Rage | ◇ utility | T2 | all | behavior: howlDurMult | Howl duration +40%. |
| `bk_resilient` | Iron Hide | 🛡 defense | T2 | all | behavior: howlDR | +25% damage reduction during Howl. |

**Rank-4 specs** (mutex — pick ONE):

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `bk_bloodlust` | Bloodlust | ◇ utility | T3 | all | behavior: bloodlust | Keystone: Howl lifesteal raised to 60%. |
| `bk_reckless` | Reckless Howl | ⚔ damage | T3 | all | behavior: recklessHowl | Keystone: Howl also reduces all spell CDs by 30% during its duration. |
| `bk_laststand` | Last Stand | 🛡 defense | T3 | all | behavior: lastStand | Keystone: If HP <20% on trigger, duration is 20s instead of 5s. |

_Rank-8 specs: none authored yet — picker falls back to fillers past rank 4._

### ☽ Crescent Strike `crescent_strike`

- Tree: `steel` · CD: 1.3s · Type: `physical`

**Filler pool** — drawn at non-milestone ranks (1-3, 5-7).

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `st_honed` | Honed Edge | ⚔ damage | T1 | ninja | dmg +18% | +18% Crescent Strike damage. |
| `st_long` | Long Reach | ◇ utility | T1 | ninja | radius +15% | +25% Crescent Strike radius. |
| `st_cluster` | Cluster Strike | ◇ utility | T1 | ninja | behavior: targetCluster | Crescent Strike auto-aims the densest enemy cluster instead of staying on you. |
| `st_thirst` | Vermilion Thirst | ◇ utility | T2 | ninja | behavior: lifesteal | Crescent Strike crits heal you for 30% of the damage dealt. |

**Rank-4 specs** (mutex — pick ONE):

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `st_whirl` | Whirlwind | ◇ utility | T2 | ninja | KEY ×1.3 r; behavior: whirlwind | Keystone: Crescent Strike sweeps wider, hits twice (75% + 60% damage). +18% radius. |
| `st_exec` | Executioner | ⚔ damage | T2 | ninja | KEY ×1.5 dmg; behavior: executioner | Keystone: Crescent Strike +150% damage. Instakills enemies below 15% HP. |
| `st_unlock_reaping` | Reaping Strike | ⚔ damage | T2 | ninja | unlocks: reaping_strike | Unlock Reaping Strike — heavy single-target lunge with bonus crit; heals 25% of damage (50% on crit). |

_Rank-8 specs: none authored yet — picker falls back to fillers past rank 4._

### ☯ Shadow Clone `shadow_clone`

- Tree: `shadow` · CD: 5.2s · Type: `physical`

**Filler pool** — drawn at non-milestone ranks (1-3, 5-7).

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `sh_sharper` | Sharper Mirror | ⚔ damage | T1 | ninja | dmg +18% | +18% clone shuriken damage. |
| `sh_rhythm` | Phantom Rhythm | ◇ utility | T1 | ninja | +35% clone speed | +35% clone attack speed. |
| `sh_persist` | Persistent Form | 🛡 defense | T1 | ninja | +2 clone HP | Clones can absorb +2 enemy contacts before dispersing. |
| `sh_focus_cap` | Deeper Reserves | 🜚 greed | T1 | ninja | +2 Focus cap | +2 max Focus stacks (5 → 7). |
| `sh_focus_grace` | Lingering Edge | ◇ utility | T1 | ninja | +1.5s Focus grace | Focus stacks decay 1.5s slower (4s → 5.5s grace window). |

**Rank-4 specs** (mutex — pick ONE):

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `sh_twin` | Twin Spirit | ◇ utility | T2 | ninja | behavior: twinSpirit | Keystone: Each Shadow Clone cast spawns 2 clones at slight offsets. |
| `sh_legion` | Legion | ◇ utility | T2 | ninja | behavior: legion | Keystone: When a clone dies it spawns one short-lived mini-clone. |
| `sh_unlock_smoke` | Smoke Bomb | 🛡 defense | T3 | ninja | unlocks: smoke_bomb | Unlock Smoke Bomb — drop a 130u cloud (2.4s). Slow + DoT inside; refreshes your iframes; 7s CD. |

_Rank-8 specs: none authored yet — picker falls back to fillers past rank 4._

### ➶ Crossbow Bolt `crossbow_bolt`

- Tree: `arsenal` · CD: 1.6s · Type: `physical`

**Filler pool** — drawn at non-milestone ranks (1-3, 5-7).

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `ar_tempered` | Tempered Bolts | ⚔ damage | T1 | ninja | dmg +18% | +18% Crossbow Bolt damage. |
| `ar_pierce` | Penetration | ◇ utility | T1 | ninja | pierce +2 | +2 pierce on Crossbow Bolt. |
| `ar_quickdraw` | Quickdraw | ◇ utility | T1 | ninja | cd -15% | −15% Crossbow Bolt cooldown. |
| `ar_trap_dur` | Patient Wire | ◇ utility | T2 | ninja | +50% trap dur | +50% trap duration (Caltrops + Spring Trap stay armed longer). |

**Rank-4 specs** (mutex — pick ONE):

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `ar_marks` | Marksman | ⚔ damage | T2 | ninja | behavior: marksman | Keystone: Crossbow Bolt +20% crit, +18% crit damage, executes <12% HP. |
| `ar_volley` | Volley | ◇ utility | T2 | ninja | behavior: volley | Keystone: Crossbow Bolt fires 3 bolts in a fan at 65% damage each. |
| `ar_unlock_spring` | Spring Trap | ⚔ damage | T3 | ninja | unlocks: spring_trap | Unlock Spring Trap — armed proximity mine, big AoE detonation, brief stun. |

_Rank-8 specs: none authored yet — picker falls back to fillers past rank 4._

## Constellations (`CONSTELLATIONS` — atlas fallback)

Used by `UI.showAtlas` (the "More cards" fallback). Each path has
two branches with 4 advance cards + 1 capstone.

### GRAVITY — `gravity`
Starter spell: `gravity_bolt`

#### ◉ Annihilator (`annihilator`)
> _Compress and explode. One thing, very dead._

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `g_grav_crush` | Crushing Force | ⚔ damage | T1 | magician | dmg +18% | +18% Gravity Bolt damage. |
| `g_grav_glacial` | Glacial Pull | ◇ utility | T1 | magician | status: slow | Gravity Bolt slows enemies inside by 45% for 2s. |
| `g_grav_cdr` | Quickened Mind | ◇ utility | T2 | magician | — | −12% cooldown on all gravity spells. |
| `g_grav_annihil` | ★ Annihilation (capstone) | ⚔ damage | T2 | magician | KEY ×1.6 dmg; behavior: noPull | Keystone: Gravity Bolt becomes a sharp burst — ×1.6 dps, no pull, 0.55s. Single-spot annihilation. |

#### ◍ Collapser (`collapser`)
> _Sweeping wells that grind whole crowds._

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `g_grav_wider` | Wider Pull | ◇ utility | T1 | magician | radius +18% | +18% Gravity Bolt radius. |
| `g_grav_well` | Gravity Well | ◇ utility | T2 | magician | unlocks: gravity_well | Unlock Gravity Well — large persistent singularity, 14 dps, 3s, 130u radius, 5s CD. |
| `g_grav_void` | Voidcurrent | ⚔ damage | T1 | magician | dmg +18%; radius +15% | +18% Gravity Bolt damage and +15% radius. The void widens. |
| `g_grav_collapse` | ★ Collapse (capstone) | ◇ utility | T2 | magician | KEY ×0.7 dmg; KEY ×1.6 r; behavior: explodeOnHit | Keystone: Gravity Bolt becomes wider/longer — radius ×1.6, dps ×0.7, 1.9s. Sweeping AOE. |

### ELECTRICITY — `electricity`
Starter spell: `lightning_bolt`

#### ⚡ Pinpoint (`pinpoint`)
> _Single bolt. Single target. Big number._

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `e_voltage` | Voltage | ⚔ damage | T1 | magician | dmg +18% | +18% Lightning Bolt damage. |
| `e_shock` | Shock | ◇ utility | T1 | magician | status: shock | Lightning Bolt shocks targets — next hit on a shocked enemy +50%. |
| `e_cdr` | Quick Reflex | ◇ utility | T2 | magician | — | −12% cooldown on all storm spells. |
| `e_pinpoint` | ★ Pinpoint (capstone) | ⚔ damage | T2 | magician | KEY ×1.5 dmg; behavior: noChain | Keystone: Lightning Bolt ×1.5 damage, +5% crit, no chain. Single-target burst. |

#### ☁ Stormcaller (`stormcaller`)
> _Many arcs, primed targets, area control._

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `e_forking` | Forking | ◇ utility | T1 | magician | chain +1 | +1 chain target on Lightning Bolt. |
| `e_unlock_cloud` | Storm Cloud | ◇ utility | T2 | magician | unlocks: storm_cloud | Unlock Storm Cloud — hovering shock dispenser, primes targets for storm damage. |
| `e_unlock_static` | Static Field | ⚔ damage | T2 | magician | unlocks: static_field | Unlock Static Field — pulsing aura around you, 5 dmg/tick within 100u, 0.5s CD. |
| `e_storm_sat` | ★ Storm Saturation (capstone) | ◇ utility | T2 | magician | — | Keystone: Lightning Bolt arcs through 4 foes total at ×0.65 dmg. Static Field ×1.5 dmg+radius. |

### FIRE — `fire`
Starter spell: `fireball`

#### 🜂 Inferno (`inferno`)
> _Burn everything. Lingering ground. Ignite chains._

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `f_spread` | Spread | ◇ utility | T1 | magician | radius +18% | +18% Fireball blast radius. |
| `f_ignite` | Ignite | ◇ utility | T2 | magician | status: ignite | Fireball ignites — ALL your spells crit ignited enemies for 3s. |
| `f_unlock_wall` | Wall of Flame | ◇ utility | T2 | magician | unlocks: wall_of_flame | Unlock Wall of Flame — sweeping horizontal fire band that chips lanes. |
| `f_conflag` | ★ Conflagration (capstone) | ◇ utility | T2 | magician | KEY ×0.7 dmg; KEY ×1.4 r; behavior: lingeringFlame | Keystone: Fireball impacts leave burning ground for 2.5s. Damage ×0.7, radius ×1.4. |

#### 💥 Bombadier (`bombadier`)
> _Detonate. Heavy slugs. Single-target burst._

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `f_heat` | Heat | ⚔ damage | T1 | magician | dmg +18% | +18% Fireball damage. |
| `f_quickcast` | Quick Cast | ◇ utility | T1 | magician | cd -12% | −12% Fireball cooldown. |
| `f_unlock_pyro` | Pyroclasm | ⚔ damage | T2 | magician | unlocks: pyroclasm | Unlock Pyroclasm — massive blast at the densest cluster. |
| `f_detonation` | ★ Detonation (capstone) | ⚔ damage | T2 | magician | KEY ×1.5 dmg; behavior: noSplash,projectileBoost | Keystone: Fireball hits a single target with ×1.5 dmg, no splash, 1.5× speed. |

### FROST — `frost`
Starter spell: `frost_spike`

#### ❄ Glacier (`glacier`)
> _Slow then freeze. Lock down the wave._

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `fr_numb` | Numb | ◇ utility | T1 | magician | status: slow | Frost Spike slows hit enemies 50% for 2.5s. |
| `fr_hypothermia` | Hypothermia | ⚔ damage | T2 | magician | vsFrozen +30% | +30% damage to frozen enemies. |
| `fr_winter` | Deep Winter | ◇ utility | T2 | magician | cd -15% | −15% Frost Spike cooldown. The cold comes faster. |
| `fr_glacial` | ★ Glacial Path (capstone) | ◇ utility | T2 | magician | behavior: freezeOnSlow | Keystone: Frost Spike freezes already-slowed enemies for 1.5s. |

#### ✦ Shatterer (`shatterer`)
> _Splintering spikes that fragment on hit._

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `fr_cold` | Cold Bite | ⚔ damage | T1 | magician | dmg +18% | +18% Frost Spike damage. |
| `fr_pierce` | Multi-Spike | ◇ utility | T1 | magician | pierce +2 | Frost Spike pierces +2 enemies. |
| `fr_splinter` | Brittle | ⚔ damage | T2 | magician | dmg +15% | +15% Frost Spike damage. Shards fly cleaner. |
| `fr_shatter` | ★ Shatter Path (capstone) | ⚔ damage | T2 | magician | behavior: splitsOnFirstHit,splitDmgMult | Keystone: First hit splits Frost Spike into 3 fragments at 65% damage. |

### STEEL — `steel`
Starter spell: `crescent_strike`

#### ☷ The Cleaver (`cleaver`)
> _Wider sweeps. Crush the whole crowd._

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `st_long` | Long Reach | ◇ utility | T1 | ninja | radius +15% | +25% Crescent Strike radius. |
| `st_cluster` | Cluster Strike | ◇ utility | T1 | ninja | behavior: targetCluster | Crescent Strike auto-aims the densest enemy cluster instead of staying on you. |
| `st_thirst` | Vermilion Thirst | ◇ utility | T2 | ninja | behavior: lifesteal | Crescent Strike crits heal you for 30% of the damage dealt. |
| `st_whirl` | ★ Whirlwind (capstone) | ◇ utility | T2 | ninja | KEY ×1.3 r; behavior: whirlwind | Keystone: Crescent Strike sweeps wider, hits twice (75% + 60% damage). +18% radius. |

#### ⚔ The Executor (`executor`)
> _Single-target finishers. Crit and execute._

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `st_honed` | Honed Edge | ⚔ damage | T1 | ninja | dmg +18% | +18% Crescent Strike damage. |
| `st_unlock_reaping` | Reaping Strike | ⚔ damage | T2 | ninja | unlocks: reaping_strike | Unlock Reaping Strike — heavy single-target lunge with bonus crit; heals 25% of damage (50% on crit). |
| `st_reap_blood` | Bloodthirst | ⚔ damage | T2 | ninja | behavior: bloodthirst | Reaping Strike +60% damage to enemies under 40% HP. |
| `st_exec` | ★ Executioner (capstone) | ⚔ damage | T2 | ninja | KEY ×1.5 dmg; behavior: executioner | Keystone: Crescent Strike +150% damage. Instakills enemies below 15% HP. |

### SHADOW — `shadow`
Starter spell: `shadow_clone`

#### ☯ Mirror (`mirror`)
> _Decoys, taunts, persistent reflections._

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `sh_sharper` | Sharper Mirror | ⚔ damage | T1 | ninja | dmg +18% | +18% clone shuriken damage. |
| `sh_rhythm` | Phantom Rhythm | ◇ utility | T1 | ninja | +35% clone speed | +35% clone attack speed. |
| `sh_persist` | Persistent Form | 🛡 defense | T1 | ninja | +2 clone HP | Clones can absorb +2 enemy contacts before dispersing. |
| `sh_legion` | ★ Legion (capstone) | ◇ utility | T2 | ninja | behavior: legion | Keystone: When a clone dies it spawns one short-lived mini-clone. |

#### ☾ Phantom (`phantom`)
> _Vanish. Smoke, iframes, untouchable._

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `sh_unlock_flicker` | Flicker Step | ⚔ damage | T1 | ninja | unlocks: flicker_step | Unlock Flicker Step — vanish to nearest foe and slash a 70u disc, 18 dmg, 0.5s iframes, 4s CD. |
| `sh_flicker_dmg` | Killing Edge | ⚔ damage | T2 | ninja | dmg +18% | +18% Flicker Step damage. |
| `sh_flicker_long` | Long Vanish | 🛡 defense | T2 | ninja | behavior: longIframes | Flicker Step iframes extend from 0.5s → 1.0s. |
| `sh_unlock_smoke` | ★ Smoke Bomb (capstone) | 🛡 defense | T3 | ninja | unlocks: smoke_bomb | Unlock Smoke Bomb — drop a 130u cloud (2.4s). Slow + DoT inside; refreshes your iframes; 7s CD. |

### ARSENAL — `arsenal`
Starter spell: `crossbow_bolt`

#### ➶ Sharpshooter (`sharpshooter`)
> _Pierce. Crit. Snipe from far away._

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `ar_tempered` | Tempered Bolts | ⚔ damage | T1 | ninja | dmg +18% | +18% Crossbow Bolt damage. |
| `ar_pierce` | Penetration | ◇ utility | T1 | ninja | pierce +2 | +2 pierce on Crossbow Bolt. |
| `ar_quickdraw` | Quickdraw | ◇ utility | T1 | ninja | cd -15% | −15% Crossbow Bolt cooldown. |
| `ar_marks` | ★ Marksman (capstone) | ⚔ damage | T2 | ninja | behavior: marksman | Keystone: Crossbow Bolt +20% crit, +18% crit damage, executes <12% HP. |

#### ✜ Trapper (`trapper`)
> _Pre-place death. Caltrops, mines, stuns._

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `ar_unlock_caltrops` | Caltrops | ◇ utility | T1 | ninja | unlocks: caltrops | Unlock Caltrops — bleed/slow zone (5s, 110u, 22 dps). Punishes enemies that pile in. |
| `ar_caltrops_dmg` | Razor Spikes | ⚔ damage | T2 | ninja | dmg +18% | +18% Caltrops damage. |
| `ar_caltrops_bleed` | Deep Bleed | ◇ utility | T2 | ninja | behavior: deepBleed | Caltrops bleed for 60% of damage over 3s (was 35%). |
| `ar_unlock_spring` | ★ Spring Trap (capstone) | ⚔ damage | T3 | ninja | unlocks: spring_trap | Unlock Spring Trap — armed proximity mine, big AoE detonation, brief stun. |

## Universal Pool

Cards available to any class regardless of path. Shown in the
atlas fallback under the Universal rail.

### ⚔ Damage (2)

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `d_sharper` | Sharper Mind | ⚔ damage | T1 | all | global dmg ×1.10 | +18% damage to all spells. |
| `d_overcharge` | Overcharge | ⚔ damage | T2 | all | global dmg ×1.10 | +22% damage to all spells. Stacks with Sharper Mind. |

### ◇ Utility (3)

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `u_jagged` | Jagged Edge | ◇ utility | T1 | all | critChanceBonus +5% | +5% global crit chance. |
| `u_lethal` | Lethal Aim | ◇ utility | T2 | all | critMultBonus +15% | +15% global critical damage. |
| `u_quickcast` | Quick Cast | ◇ utility | T1 | all | — | −12% cooldown on ALL spells. |

### 🛡 Defense (7)

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `v_recover` | Recover | 🛡 defense | T1 | all | waveHeal +18% | +18% wave-end heal. The vigil archetype. |
| `v_hardened` | Hardened | 🛡 defense | T1 | all | HP +25 | +25 max HP (and heals you for the same). |
| `v_iron_skin` | Iron Skin | 🛡 defense | T2 | all | reduction +8% | −8% damage taken from all sources. |
| `v_phase_shift` | Phase Shift | 🛡 defense | T2 | all | dodge +12% | 12% chance to dodge any incoming damage. |
| `v_reflect` | Reflective Aura | 🛡 defense | T2 | all | reflect +15% | Reflect 15% of damage taken back at the attacker. |
| `v_meditation` | Battle Meditation | 🛡 defense | T1 | all | heal/kill +1 | +1 HP per kill. |
| `v_eternal` | Eternal Vigil | 🛡 defense | T3 | all | — | Once per run, revive at 40% HP when killed. |

### 🜚 Greed (9)

| id | name | axis | tier | class | effect | desc |
|---|---|---|---|---|---|---|
| `g_old_coin` | Old Coin | 🜚 greed | T2 | all | ramp +0.5%/cast cap +25% | Each spell cast banks +0.5% damage to all spells. Caps at +25%. |
| `g_patient_steel` | Patient Steel | 🜚 greed | T2 | all | noHitRamp +6%/s cap +25% | After 4s without taking damage, gain +6% damage every second (caps +25%, resets on hit). |
| `g_iron_discipline` | Iron Discipline | 🜚 greed | T2 | all | hub +4%/Def card | +4% spell damage per Defense card taken (caps +24%). |
| `g_bloodbound` | Bloodbound Ledger | 🜚 greed | T2 | all | hub +5%/10% missing HP | +5% damage per 10% of missing HP (caps +30% at low HP). Hurt more, hit harder. |
| `g_warden_mantra` | Warden's Mantra | 🜚 greed | T2 | all | hub +2% red/Util card | +2% damage reduction per Utility card taken (caps −10%). |
| `g_sentinel_crow` | Sentinel Crow | 🜚 greed | T2 | all | spawn-sentinel | Spawn an immortal stationary ally. It throws a slow projectile every 2s — damage scales +4% per kill you score. |
| `p_glass` | Pact of Glass | 🜚 greed | T3 | all | pact:glass | Halve your max HP permanently. +30% damage to all spells. |
| `p_hunger` | Pact of Hunger | 🜚 greed | T3 | ninja | pact:hunger | Every cast costs 2 HP. Every cast also generates +1 Focus stack instantly. |
| `p_echoes` | Pact of Echoes | 🜚 greed | T3 | all | pact:echoes | Every spell echoes after 0.5s at 50% damage. You lose 4 HP per cast. |

## Synergy Hubs — Caps

Hubs compound but every one is hard-capped. Worst-case stack post-
caps is ~×3.7 base damage (was ×5.6 pre-cap). Caps live in
`Game._computeGreedMult` and `computePlayerStats`.

| card | per-step | cap |
|---|---|---|
| Old Coin (`g_old_coin`) | +0.5%/cast | +25% |
| Patient Steel (`g_patient_steel`) | +6%/sec no-hit (4s grace) | +25% |
| Iron Discipline (`g_iron_discipline`) | +4%/Defense card | +24% |
| Bloodbound Ledger (`g_bloodbound`) | +5%/10% missing HP | +30% |
| Warden's Mantra (`g_warden_mantra`) | +2% reduction/Util card | +10% |
| Resonance (`g_resonance`) | +4%/OTHER Greed card | +20% |
| Pact of Glass (`p_glass`) | flat | +30% |

## Items

Equipment slots (max 2). Item drop on every 5th wave + starter pick.
`classes` whitelist filters offers per character.

| id | name | rarity | classes | description |
|---|---|---|---|---|
| `crystal_focus` | Crystal Focus | common | all | −10% cooldown on all spells. |
| `warden_seal` | Warden Seal | common | all | +25 maximum health. |
| `cinder_brand` | Cinder Brand | common | magician | Your fire spells brand targets — they take a critical hit from every spell of yours for 3s. |
| `iron_glove` | Iron Glove | common | all | +15 max HP and 5% damage reduction. The defensive baseline. |
| `whetstone` | Whetstone | common | ninja | +15% physical damage. Ninjas only — this stone hates magic. |
| `black_wax` | Black Wax | common | ninja | Caltrops and Spring Trap last +35% longer. |
| `jagged_prism` | Jagged Prism | rare | all | +8% global critical strike chance and +20% critical damage. |
| `voidstone` | Voidstone | rare | all | +18% damage to all spells, but cooldowns are 6% longer. |
| `stormcaller` | Stormcaller | rare | magician | Each spell cast has a 12% chance to also fire a free Lightning Bolt. |
| `frostbite_lens` | Frostbite Lens | rare | all | Slowed enemies take +15% damage from your spells. |
| `stormcoil` | Stormcoil | rare | magician | Lightning spells bounce one extra time. Shocked enemies take +12% damage. |
| `gravecharm` | Gravecharm | rare | magician | Gravity-tree spells deal +20% damage and have +10% larger radius. |
| `crows_eye` | Crow's Eye | rare | ninja | +5% global crit chance. Projectiles travel 25% faster. |
| `mempo_mask` | Mempo Mask | rare | ninja | +1 max Focus stack. +0.5s grace before stacks decay. |
| `glyph_of_echo` | Glyph of Echo | epic | all | Spells echo a moment later, repeating at 35% damage. |
| `abyssal_mantle` | Abyssal Mantle | epic | all | Once per wave, lethal damage spares you at 1 HP and grants 1.5s of iframes. |

## Enemies & Resistances

| id | name | hp | speed | dmg | minWave | resists (P/E/A) | special |
|---|---|---|---|---|---|---|---|
| `shade` | Shade | 18 | 70 | 11 | 1 | 1.00 / 1.00 / 1.00 | — |
| `husk` | Husk | 48 | 50 | 17 | 2 | 1.00 / 1.00 / 1.00 | — |
| `swarmling` | Swarmling | 8 | 90 | 5 | 2 | 1.00 / 1.00 / 1.00 | groups of 4-6 |
| `wisp` | Wisp | 14 | 130 | 8 | 3 | 1.00 / 1.00 / 1.00 | — |
| `bulwark` | Bulwark | 240 | 26 | 24 | 4 | 0.55 / 1.30 / 1.00 | — |
| `wraith` | Wraith | 36 | 100 | 12 | 5 | 1.00 / 1.30 / 1.00 | 30% projectile dodge |
| `hexer` | Hexer | 42 | 38 | 14 | 6 | 1.00 / 1.00 / 1.40 | ranged caster |
| `goliath` | Goliath | 320 | 24 | 30 | 5 | 0.90 / 0.90 / 0.90 | boss; +50% if status'd |

## Coverage Stats

Sanity-check counts so you can see at a glance whether a path is
thin or rich.

| set | count |
|---|---|
| total cards | 190 |
| spells | 34 |
| items | 16 |
| enemies | 8 |
| paths | 7 |
| spell trees | 16 |
| universal cards | 21 |
| path `gravity` cards | 16 |
| path `electricity` cards | 16 |
| path `fire` cards | 16 |
| path `frost` cards | 16 |
| path `steel` cards | 9 |
| path `shadow` cards | 13 |
| path `arsenal` cards | 13 |
| path `defense` cards | 25 |
| path `utility` cards | 24 |
| path `onuse` cards | 21 |

## Notes & Suggestions

> This section is overwritten on every regen. To keep notes between
> regenerations, drop them in a sibling file (e.g. `BUILD_NOTES.md`)
> instead of here.

Use this space (and rerun the generator after) to plan additions:

- [ ] _new card / spell / enemy idea_
- [ ] _balance concern (cite card id)_
- [ ] _missing branch coverage_
