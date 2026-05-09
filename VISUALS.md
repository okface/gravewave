# Visual & Animation Status

> Living list. Tick the box when shipped, strike it when retired,
> add new asks as we discover them. The renderer is in `index.html`
> under `const Renderer = { ... }`.

## Established design language (lock these in)

The look is **woodcut on aged parchment** — ink linework over a warm
vellum background, gold sigils, vermilion danger marks, indigo for
frost / electric cores / arcane wards. Avoid soft glow gradients
unless they're paying for a specific moment (block flash, comet
core, lens body).

Canonical palette (mirrored in `art-lab-v3.js` `PAL` constant in the
`.codex_design/project/` bundle):

```
paper    #e8dcc0  paper2 #ddcfae  paper3 #c8b88c
ink      #1a1612  inkSoft #3a322a inkMid #6a604f inkDim #8a7e68
red      #a83a2c  redDeep #7a2820 redLight #d8624c
blue     #2c4a8c  blueLight #4c6cac
gold     #c8941a  goldLight #e8b840
violet   #6a3a8a  (gravity-only)
```

Camera shake fingerprints (use `Camera.shake('light'/'medium'/
'heavy'/'catastrophic')`): light(2/0.12s) · medium(5/0.22s) · heavy
(9/0.40s) · catastrophic(14/0.70s). Catastrophic is reserved for the
single biggest event of the moment (Meteor impact, Apocalypse).

**Top-down arena.** This is the hard rule the codex bundle violates
in places: the camera is always looking *down*. Anything drawn from
"the side" (cloud-as-silhouette-above-AoE-ring, lighthouse with a
ground shadow ellipse, decoy effigy as a totem) is a translation
mistake. When porting from the bundle, re-think geometry to read
top-down — clouds are translucent discs you look *through*, not
overhead silhouettes.

## Wizard ability art — shipped from the design bundle

All ported from `.codex_design/project/art-lab-v3.js`. If you want
to tweak: edit the corresponding `Renderer.draw…` method in
`index.html`. Search by name.

- [x] **Snow Fort** — hex with frost-crystal diamond posts, dashed
      indigo inner wall, drifting flake particles, paper-clipped
      hatch interior. Recharge state shows a `REFORMING` arc.
- [x] **Fire Shield** — vermilion orbs (ink core + gold highlight)
      on elliptical orbit, analytic flame ribbons, gold pulse on
      block, ⬨ charge marks above the player.
- [x] **Shock Tower** — woodcut paper pillar with clipped ink hatch,
      ink coil head, gold flicker eye + antenna rods + crackle dot,
      dashed gold range halo pulsing per cast.
- [x] **Black Hole** (gravity_bolt cast → wells) — ink pull halo,
      8 light-bend arcs, 64-segment spinning accretion disk (gold
      every 8th + bright inner ring), spiral motes, ink event
      horizon with bright photon ring.
- [x] **Gravital Anomaly** (small wells) — dashed quadratic tether
      to player, indigo pull ring + 5 spiral ticks, vermilion pop +
      6 spark dots on expire.
- [x] **Storm Cloud** — TOP-DOWN translucent disc (we look through
      it). 4 inner puff orbs orbiting slowly, paper-hatch fur, gold
      shimmer flash, jagged forking strike from center to target
      with bright spark + 6-point gold scorch star, frayed ink rim.
- [x] **Wormhole** — radial pinch (ink → indigo → 0) + ink ring +
      spinning logarithmic spiral (indigo) + center pip + star
      marker (vermilion A / gold B). Default seam is a wavy dashed
      ink line that flows; Echo spec replaces it with a pulsing
      kill-beam.
- [x] **Meteor** — proper telegraph (ink shadow disc + 3 staggered
      vermilion warning rings + NSEW crosshair), 12-sample analytic
      comet trail, vermilion comet body with gold core + ink rim +
      4 trailing gold sparks. Impact handled by `spawnExplosion` +
      `Camera.shake('catastrophic')` from `tickMeteors`.
- [x] **Snow Storm** — pale frost fill + double-clipped indigo
      hatch (5px @ PI/3.5 + 7px @ -PI/4.5), dashed indigo perimeter
      flowing -t*10, 50 falling 3-line crossed flakes, 4 sweeping
      gust whips (pale main + indigo trailing line).
- [x] **Hydra Head** (Fireball spec) — small ink+vermilion serpent
      head with eye flicker + life bar above.
- [x] **Engagement ring** — faint dotted vermilion circle around
      player, marks the auto-target boundary so the player can see
      what their abilities will reach.

## Tier 1 attack art — done

- [x] **Fireball** — projectile with fire trail particles, splash
      explosion, Conflagration flame patch (deprecated keystone but
      patches still render).
- [x] **Chain Lightning** — electric-blue + gold double-stroke,
      jitter offsets per segment, endpoint particle bursts.
- [x] **Frost Bolt** — frost crystal with cyan trail, splinter
      fragments on Shatter spec.

## Optician ability art — first pass shipped, polish pending

Optician is the second class. Each entity has its own draw method.
The first pass works but uses simpler primitives than the Wizard's
ported versions. Worth a polish pass that gives Optician its own
woodcut vocabulary (gold/white-hot for light, mirror silver for
arcane, dark-eclipse purple for shadow).

- [ ] **Burning Lens** — currently a heat-haze ring + simple lens
      ellipse + sun rays. Could read more "magnifying glass focused
      beam burning the ground": a real lens disc with a focused
      light cone hitting the ground + scorched circle that grows
      with the ramp curve.
- [ ] **Reflective Aegis** — small white-rectangle mirrors orbiting
      the player. Should be a more substantial mirror sprite
      (silver fill + ink frame + paper highlight to read like a
      hand mirror). Reflection flashes when a charge is consumed
      could borrow from the Fire Shield gold-pulse pattern.
- [ ] **Solar Halo** — sun orb above the player with rays. Decent.
      Could add a faint warm-yellow ground wash (currently has the
      radial gradient but it could pop more). Eclipse spec needs a
      darker, more sinister visual swap.
- [ ] **Lens Array** — 3 ellipse lenses orbit the player. Beams
      currently routed through `this.lightnings` (which were tuned
      for Chain Lightning — orange/blue) so the converged-beam look
      is muddy. A dedicated `drawLensBeam` that draws thick warm-
      yellow→white-hot beams from each lens to the target would
      read better.
- [ ] **Lighthouse** — paper pillar + lamp + cone beam with bright
      centerline. Decent but the cone is a flat triangle — could
      use a soft gradient + slight pulse.
- [ ] **Solar Eclipse** — radial wash + dashed ring. Works but the
      RAMPING DPS isn't visualized — the disc should visibly grow
      brighter as the ramp climbs.
- [ ] **Mirror Maze** — line lattice. Functional. Crystal Cage spec
      should make the wall *read as a wall* — maybe add little
      indigo "force-field" arcs between mirrors when an enemy
      bumps the boundary.
- [ ] **Prism Strike** — pillar of light from above + telegraph
      ring. Decent but very fast (0.55s). Could use a brighter
      blow-out at impact.
- [ ] **Focused Beam** (continuous ray) — three-layer beam (warm
      halo + orange mid + white-hot core) plus crackle at peak.
      Already pretty good. Might want a small heat shimmer at
      impact point.
- [ ] **Blinding Flash** — currently the spawnExplosion default.
      Should be a true white-out: full-canvas paper flash that
      fades over ~0.3s + radial blind-rings expanding outward.
- [ ] **Prism Burst beams** — instant rays in 7 colors at peak
      Spectrum. The colors are correct but the lines could be
      thicker + have a brief endpoint spark.

## Status / hit visuals — shipped

- [x] **Player cast flash** — gold ring pulse on `castFlash > 0`.
- [x] **Damage number readability** — crits scale + gold outline.
- [x] **RESIST / VULN tags** — pearlescent shimmer on resist,
      red wash on vuln (with rgba shimmer overlay).
- [x] **Enemy death** — particle burst + ring.
- [x] **Boss spawn** — telegraph + mist trail + ground crack.
- [x] **Game over** — slow desaturation pass + smog overlay.
- [x] **Wave banner** — overshoot + settle.
- [x] **Spawn zones** — chevrons pulse stronger near wave start.
- [x] **Blind status** — pulsing white veil + ✕ eyes (Optician).

## Outstanding asks

- [ ] **Reflective Aegis spec — Hall of Mirrors** — the second ring
      of mirrors should be visually distinct from the inner ring.
      Currently they look identical. Maybe smaller mirrors at a
      slightly different tilt, or a different stroke color.
- [ ] **Mender Wisp** companion — current visual is a small green
      cross. Could be a tiny floating spirit (paper flame? ✚-rune
      with a pale halo?).
- [ ] **War Drummer** companion — the cycling-aura state isn't
      strongly readable. The active aura (vigor/ward/haste) should
      flash a colored pulse on the player on each beat.
- [ ] **Sigil Linker** companion — link threads currently are flat
      dashed lines. Could pulse along the chain when damage is
      shared (small mote travelling along the line).
- [ ] **Shock Tower watchtower spec (permanent)** — there's no
      visual cue that this tower won't expire. A faint ground
      anchor / additional cardinal sigils around the base would
      help.
- [ ] **Snow Fort permafrost patches** — when the fort breaks and
      Permafrost spec drops a lingering icy patch, it currently
      looks identical to a tiny fort. Could be more clearly a
      "ground patch" (no walls, just a frosted disc with hatch).

## Retired / no-op

These were on the list but the underlying feature is gone or the
work is shipped:

- ~~Pyroclasm~~ — spell removed.
- ~~Ninja class draws~~ — class deferred; supporting draws are dead
  code that can be deleted.
- ~~Background lantern flickers~~ — added (corner lanterns +
  drifting smog).
- ~~Tier picker stagger~~ — already animated (`animationDelay` on
  cards).
- ~~Pip pop on level-up~~ — shipped.

## Code-quality cleanups (still open)

- [ ] Pass over `Renderer` to refresh docstrings. Many reference
      removed entities (e.g. SmokeBomb / SpringTrap / Caltrops).
- [ ] `drawNinja` (if it still exists) — delete; Ninja class is
      deferred indefinitely.
- [ ] Standardize arg order across `drawXxx` — most take `(ctx,
      list, t)`; a few take `(ctx, list, player, t)` because they
      need the player position. Document that `player` arg or pull
      from `game.player` inside.

---

**Working order suggestion:** finish the Optician polish (Burning
Lens + Lens Array beams + Blinding Flash white-out are the three
that read poorly right now), then the companion polish, then code
cleanups.
