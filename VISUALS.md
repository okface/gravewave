# Visual & Animation Status

> Living list. Tick the box when shipped, strike it when retired,
> add new asks as we discover them. The renderer is in `index.html`
> under `const Renderer = { ... }`.

---

## ⚠️ Handoff process — read this before starting a visual session

**Claude Design bundles ship in two layers** and we've been missing the
bottom one:

1. **The handoff markdown** (`OPTICIAN_HANDOFF.md`, `HANDOFF.md`) — these
   list **deltas** to add on top of the existing art. They assume the
   *base* render is already canonical.
2. **`art-lab-v*.js`** in the bundle's `project/` dir — this is the
   actual canvas-draw source for every spell + companion. The handoff
   markdown imports these implicitly. If a section says
   "polish bullets: paper halo, breath wobble, cadence pip", that's
   the polish ON TOP of the full geometry in `compMenderWisp` / etc.

**The mistake we've made repeatedly:** treating the markdown as the
whole spec, implementing only the polish bullets, skipping the
underlying lab JS. The result is placeholder-grade companions and
spells that look nothing like the design mocks.

**Process going forward:**
1. Open `.codex_design*/project/art-lab-v*.js` and find the relevant
   function (e.g. `compWarDrummer`, `spellHydra`).
2. Port that function's geometry as the **baseline** render.
3. Apply the handoff markdown's polish bullets **on top** of that baseline.
4. Then verify nothing in the markdown's "common pitfalls" or
   "acceptance" sections is violated.

The two `.codex_design*/` directories in the repo are the canonical
references — don't delete them.

---

## Established design language (lock these in)

The look is **woodcut on aged parchment** — ink linework over a warm
vellum background, gold sigils, vermilion danger marks, indigo for
frost / electric cores / arcane wards. Avoid soft glow gradients
unless they're paying for a specific moment.

Canonical palette (`PAL` constant in `index.html`):

```
paper    #e8dcc0  paper2 #ddcfae  paper3 #c8b88c
ink      #1a1612  inkSoft #3a322a inkMid #6a604f inkDim #8a7e68
red      #a83a2c  redDeep #7a2820 redLight #d8624c
blue     #2c4a8c  blueLight #4c6cac
gold     #c8941a  goldLight #e8b840
violet   #6a3a8a  (gravity-only)
```

**Optician extension** (light/mirror/shadow vocabulary):

```
warm     #e8b840  hot      #fff3c8  amber    #d68a1e
silver   #c8c4ba  silverHi #f0ecde  silverLo #8a8678
eclipse  #2a1c2e  umbra    #5a3a6a
```

**Camera shake:** `Camera.shake('light' / 'medium' / 'heavy' /
'catastrophic')`. Catastrophic is reserved for one-event-of-the-moment
(Meteor impact, Apocalypse).

**Top-down arena.** The camera always looks down. Anything drawn from
"the side" is a translation mistake — clouds are translucent discs
you look *through*, not silhouettes above an AoE ring.

**Engagement boundary.** Targeted abilities cap at the long-axis
spawn line + edge padding (`combatRadius()` in Game). Player-side
auto-target uses this; entity-scoped targeting (turrets, wells with
their own `range`) bypasses it via `findNearestEnemyTo`. The boundary
renders as **two horizontal dashed lines** at top + bottom of the
targeting cone (because spawns are vertical), not a circle.

---

## Wizard ability art — shipped from the design bundle

All ported from `.codex_design/project/art-lab-v3.js`.

- [x] **Snow Fort** — hex with paper-fill + indigo hatch + dashed
      indigo inner wall + diamond crystal posts at vertices.
      Recharging shows REFORMING arc.
- [x] **Fire Shield** — vermilion orbs (ink core + gold highlight)
      on elliptical orbit + analytic flame ribbons + gold pulse on
      block + ⬨ charge marks above the player.
- [x] **Shock Tower** — woodcut paper pillar + clipped ink hatch +
      ink coil head + gold flicker eye + antenna rods + dashed gold
      range halo pulsing per cast.
- [x] **Black Hole** — ink pull halo + 8 light-bend arcs + 64-segment
      spinning accretion disk (gold every 8th + bright inner ring) +
      spiral motes + ink event horizon with bright photon ring.
- [x] **Gravital Anomaly** — dashed quadratic tether to player +
      indigo pull ring + 5 spiral ticks + vermilion pop + 6 spark
      dots on expire.
- [x] **Storm Cloud** — TOP-DOWN translucent disc you look through.
      4 inner puff orbs + paper-hatch fur + gold disc-flash + jagged
      forking strikes + 6-point gold scorch star + frayed ink rim.
- [x] **Wormhole** — radial pinch (ink → indigo → 0) + ink ring +
      spinning logarithmic spiral + center pip + star marker
      (vermilion A / gold B). Wavy dashed seam between portals; Echo
      spec replaces seam with pulsing kill-beam.
- [x] **Meteor** — telegraph (ink shadow + 3 vermilion warning rings
      + NSEW crosshair) + 12-sample analytic comet trail + vermilion
      body with gold core + ink rim + 4 trailing gold sparks.
- [x] **Snow Storm** — pale frost fill + double-clipped indigo hatch
      + dashed indigo perimeter (-t*10 flow) + 50 falling 3-line
      crossed flakes + 4 sweeping gust whips.
- [x] **Hydra Head** (Fireball spec) — full port: triangle body
      (vermilion + ink) + gold inner ember + ink eye dot inside
      ember + hatched neck stalks + dashed vermilion charge ring.
- [x] **Engagement boundary** — two horizontal dashed lines at the
      targeting cap, vermilion, flowing.

## Tier 1 attack art — shipped

- [x] **Fireball** — projectile with fire trail + brown-grey smoke
      puffs (per-design dust pattern) + ember floaters + splash
      explosion.
- [x] **Chain Lightning** — electric-blue + gold double-stroke +
      jitter offsets per segment + endpoint particle bursts.
- [x] **Frost Bolt** — frost crystal with cyan trail; Shatter spec
      splits into 3 fragments.

## Optician ability art — shipped (priority 1-11 from OPTICIAN_HANDOFF)

- [x] **Burning Lens** — scorch disc growing with ramp + dashed gold
      ground halo + vertical-gradient light cone + silver lens disc
      (ink frame + top-left highlight + warm pip + ink handle).
- [x] **Lens Array** — circular lens sprites with mirror frame +
      pivot tang aimed at player + warm/ink center pip; beams now
      use dedicated `drawLensBeam` helper (warm halo + amber mid +
      hot core gated above 0.6); convergence shimmer at target.
- [x] **Blinding Flash** — true white-out: full-canvas paper wash
      drawn outside camera-shake + 3 staggered radial blind-rings +
      8-ray gold star.
- [x] **Reflective Aegis** — hand-mirror sprites (silver fill +
      highlight strip + ink frame + corner nubs + diagonal sheen at
      full); Hall of Mirrors outer ring distinguished via 3 diffs
      (smaller, +π/8 cant, silverLo frame); silver consume-pulse +
      gold confirm spark.
- [x] **Solar Halo** — bumped ground wash + dashed warm perimeter;
      Eclipse spec proper "ring of fire" (eclipse disc + umbra
      corona + white-hot rim + cardinal ink spike rays).
- [x] **Lighthouse** — arc-bounded wedge (top-down) with linear
      gradient along aim axis + pulsing centerline + lamp pip.
- [x] **Solar Eclipse** — disc alpha + rim alpha/width + dash flow
      speed all bind to ramp; white-hot crescent at ramp > 0.7.
- [x] **Mirror Maze** — beams shifted to warm yellow; nodes as 4×4
      silver squares tilted 45°; Crystal Cage spec arcs at boundary
      (dashed indigo, capped at 6).
- [x] **Prism Strike** — 60ms blow-out at impact (white-hot pillar
      wash + 6-ray gold ground star) + telegraph + descending pillar.
- [x] **Focused Beam** — three-layer continuous ray (warm halo +
      orange mid + white-hot core) + heat shimmer at tip when
      intensity > 0.7 + flickering crackle at peak.
- [x] **Prism Burst** — thicker mid-stroke (2.2px) + white-hot inner
      core during 0.08s blow-out + 4-line endpoint sparks (hot →
      warm fade).

## Companion art — full ports from art-lab-v4.js

- [x] **Sigil Linker** — quadratic-curve threads with wandering
      mid-point + 2-pass render (vermilion glow under + ink line on
      top); rotating HEXAGRAM body (two interlocked triangles in a
      ring + halo + center red pip); cascade beads with vermilion
      outer + gold inner core.
- [x] **Decoy Effigy** — full straw mannequin: stake + burlap rect
      body with cross-stitches + vermilion twine belt + twig arms +
      burlap-sack head with X eyes + stitched red mouth + crown-of-
      thorns horns; pulsing taunt bands; strain phase below 30% HP
      (wobble + cracks + leaking embers); detonate animation (fill
      flash + 14 straw shards + ink puff).
- [x] **Mender Wisp** — 7-dot analytic past-position trail +
      breathing paper halo + paper core + warm-gold cross + dashed
      cadence pip with gold arc filling 0→TAU; on heal pulse: 4-stroke
      gold ribbon + 3 plus glyphs at player + concentric gold pulse.
- [x] **War Drummer** — full drum cylinder + animated stick striking
      on beat + glyph stamp on skin (sword/shield/wing for V/W/H) +
      aura-color X laces + ink legs + ink shadow; aura field around
      player; beat-ring decay (3 alive at once); aura banner above
      player with name + underline.

## Status / hit visuals — shipped

- [x] Player cast flash, damage number readability, RESIST/VULN tags,
      enemy death burst, boss spawn telegraph, game-over desat,
      wave banner overshoot, spawn-zone chevrons, Blind status veil.

## Outstanding / nice-to-have

These are quality-of-life polish, not blockers:

- [ ] **Decoy taunt** — currently spawns at `(player.x + 75, player.y - 75)`.
      Could be smarter: sample direction toward `findEnemyCluster` so
      it always sits "between you and the swarm".
- [ ] **War Drummer aura banner** — currently always renders. Should
      slide in / out on aura swap (sub < 0.1 / sub > 0.9 like the lab
      version) so the swap is readable.
- [ ] **Snow Fort permafrost** — patch already drops the wall geometry
      and uses ground-frost style. Could add tiny snowflake spawns
      inside the patch for life.
- [ ] **Lens Array Hall of Mirrors** — design has the smaller outer
      mirrors at +π/8 cant which we did. Could go further with a
      slight color tint difference if it still doesn't read distinct.
- [ ] **Linker thread cap when many enemies** — design connects
      sigil → each enemy. With Web spec at +3, that's 6 threads
      from one sigil — verify it doesn't get visually noisy.

## Retired / no-op

- ~~Pyroclasm~~ — spell removed.
- ~~Ninja class draws~~ — class deferred; `drawNinja` now stubbed.
- ~~Background lantern flickers~~ — added.
- ~~Tier picker stagger~~ — already animated.
- ~~Pip pop on level-up~~ — shipped.

## Code-quality cleanups (still open)

- [ ] Pass over `Renderer` to refresh docstrings. Some still
      reference removed entities (SmokeBomb / SpringTrap / Caltrops).
- [ ] `pyroclasm` is in `SPELL_DAMAGE_TYPES` but the spell is gone —
      can be removed.
- [ ] `lingeringFlame` behavior flag is checked in fireball.cast but
      never set by any spec — dead branch.
- [ ] `drawXxx` arg order — most take `(ctx, list, t)`, some take
      `(ctx, list, player, t)`, one takes `(ctx, list, t, enemies)`.
      `_currentGame` stash on Renderer was added so subs can access
      cross-system state — if we keep using that, retire the
      explicit threading.

---

**Where we are:** Wizard + Optician + companion art is now at design
parity. Outstanding items above are nice-to-haves. Code cleanups are
the next "owed work" — easy gains, low risk.
