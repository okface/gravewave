# Visual & Animation Handoff

> Hand this list to Claude Code (or any contributor) to work through.
> Tasks are roughly in order of player impact. Each one is small enough
> to do in a single pass. Tick the box once shipped.

The renderer is in `index.html` under `const Renderer = { ... }`. Most
draw methods take `(ctx, list, t)` where `t = game.runElapsed`.

---

## Tier 2 / Tier 3 ability visuals

These were stubbed in the rebuild and are functional but plain.

- [ ] **Snow Fort** (`drawSnowForts`, ~line 7564). Currently a soft
      gradient + dashed inner ring. Suggested: a stylized hexagonal
      ice wall outline with frost crystals bloom-growing on first
      0.3s, then a slow rotating particle drift (snowflakes ↘) inside.
      Death animation: 6-piece shatter outwards on expire.
- [ ] **Fire Shield** (`drawFireShield`, ~line 7712). 3 simple radial
      gradient orbs orbiting the player. Add: trailing flame ribbon
      behind each orb (decay 0.3s, paper-warm reds), micro-spark
      burst when an orb collides with an enemy, satisfying "block"
      flash when `Player._shieldCharges` consumes a charge.
- [ ] **Shock Tower** (`drawShockTowers`, ~line 7646). Plain pillar
      with a flickering yellow head. Add: arc-to-target lightning
      visual when it fires (reuse `drawLightnings` segment logic),
      base micro-jitter on each shot, range halo pulse on each cast
      tick rather than static dashed line.
- [ ] **Wormhole** (`drawWormholes`, ~line 7676). Two spinning rings
      with a dashed connection line. Add: swirling particles drawn
      *into* portal A, ejected from portal B with a brief stretch
      effect on the enemy sprite during transit. Background distort
      ring (radial pinch) inside each portal.
- [ ] **Snow Storm** (`drawSnowStorms`, ~line 7615). Faint ring + a
      few drifting flake dots. Add: 30-50 falling-snowflake particles
      across the radius (each falls + drifts), occasional gust lines
      sweeping across, ground-frost overlay accumulating then fading
      over the storm's lifetime.
- [ ] **Black Hole** (Tier 1, gravity_bolt cast). Currently uses the
      generic `drawWells` blob. Make it visually distinct: bright
      event horizon, dark accretion disk pulled inward, light bend
      streaks coming off enemies caught in the pull radius.
- [ ] **Meteor** (Tier 3). At cast: shadow circle on ground that
      grows for ~0.6s before impact (telegraph), sparking comet
      trail descending, dust plume + cracks radiating from impact
      point, screen shake.
- [ ] **Gravital Anomaly** (Tier 2). Pulse-spawning small wells.
      Each pull well needs a faint connection thread back to the
      player, and a "pop" when it expires.

## Tier 1 ability polish

- [ ] **Fireball** — currently a yellow-orange dot. Add a curved-arc
      lob trail (it's a ranged splash spell), short flame puffs along
      the arc, ember particles trailing. Spec **Hydra** spawns nothing
      visually — needs a tiny "head" sprite (orange triangle with eye?)
      that lasts 6s then fades.
- [ ] **Chain Lightning** — `drawLightnings` works but is monochrome.
      Add an electric-blue inner core + warm-white outer halo, slight
      jitter offsets per frame, particle sparks at each chain endpoint.
- [ ] **Frost Bolt** — straight pierce projectile. Add a rotating ice
      crystal sprite, frost mist trail (cyan particles fading), screen
      tint when piercing (very subtle).

## Player / enemy feedback

- [ ] **Player cast flash** — currently `player.castFlash = 0.2` sets
      a value but isn't read by the renderer. Wire it up: a gold ring
      pulse around the wizard for 0.2s on each cast (already triggered
      in `Game.tickSpells`).
- [ ] **Damage number readability** — `drawDamageNumbers` works, but
      crit numbers don't pop enough. Suggested: scale from 1.0 → 1.4 →
      1.0 over the first 0.25s, slight red-shift, gold outline.
- [ ] **Enemy "RESIST" / "VULN" tags** — these are emitted from
      `Enemy.takeDamage` when a damage type is mismatched but the
      visual is just text. Add a brief shimmer over the enemy when
      resisting (pearlescent flash) or a subtle red overlay on vuln.
- [ ] **Enemy spawn telegraph** — `drawSpawnZones` exists but is
      static. Add a 0.4s "dust kicks up" particle flurry at each
      spawn site for the wave start so the player tracks where the
      pressure is coming from.
- [ ] **Boss spawn** — currently just bigger HP. Add a ground-crack
      animation expanding from spawn point + a dark mist trail
      behind the boss as it walks.

## HUD / overlays

- [ ] **Wave banner** has CSS in place but the animation curve is
      flat. Make it slide in from above with a brief overshoot
      (cubic-bezier easing), settle, then fade.
- [ ] **Level-up panel** (lu-panel) — when a pip is filled, it pops
      in instantly. Add a 0.18s scale-in animation + a subtle ink
      splash particle behind the pip.
- [ ] **Tier picker** cards have hover lift but no entrance animation.
      Stagger them in 0.06s apart, sliding up from +12px with fade.
- [ ] **Game over** screen is a flat overlay. Add a slow desaturation
      pass on the canvas behind it (currently the canvas keeps
      drawing in full colour through the overlay).

## Background / environment

- [ ] **Background** (`drawBackground`) is a flat parchment. Consider:
      a slow-drifting smog layer, occasional flickers (lantern light?)
      at the corners, faint ink-blot stains that fade in/out.
- [ ] **Spawn zones** — the chevrons (`drawSpawnChevrons`) are
      decent but always on. Make them pulse stronger 0.5s before
      a wave starts, then dim during the wave.
- [ ] **Camera shake** — `addShake` is wired, but big ultimates
      (Meteor, Pyroclasm) deserve a 0.3-0.5s shake, not the same
      0.18s as a basic crit.

## Sound (out of scope but listing)

The game is silent. If/when audio is added: cast SFX per ability,
hit/crit punches, enemy death thuds, wave-clear chime, level-up
chime, low rumble for boss waves.

## Code-quality cleanups (renderer-adjacent)

- [ ] Many old draw methods reference removed entity types in their
      docstrings. A pass over `Renderer` to refresh docstrings would
      help future contributors.
- [ ] Some draw methods take `(ctx, list, t)` and others take
      `(ctx, list, ...extras)`. Standardize argument order.
- [ ] `drawNinja` is dead — Ninja class is gone for now. Either keep
      it commented for future class reuse or remove entirely.

---

Working order suggestion: knock out **Snow Fort → Fire Shield → Shock
Tower → Black Hole → Meteor** first — those are the 5 abilities the
player will look at the most. Then HUD polish. Background last.
