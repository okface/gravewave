# Optician Polish — Handoff to Code

> Pair with `VISUALS.md` §"Optician ability art". Every item below is a
> concrete drawing recipe targeted at the corresponding `Renderer.draw…`
> method in `index.html`. Don't invent geometry — follow the recipe.
> Top-down camera always: anything drawn from "the side" is wrong.

## Optician palette (lock these in)

Add these to the renderer's `PAL` constant alongside the wizard tokens.
They are the woodcut-on-parchment vocabulary specifically for Optician.

```js
// LIGHT — gold/white-hot core
PAL.warm     = '#e8b840';   // gold (already exists — reuse)
PAL.hot      = '#fff3c8';   // white-hot core, only at peak intensity
PAL.amber    = '#d68a1e';   // mid-amber, between gold and red
// MIRROR / ARCANE — silver
PAL.silver   = '#c8c4ba';   // mirror fill (cool paper, NOT pure grey)
PAL.silverHi = '#f0ecde';   // mirror highlight strip
PAL.silverLo = '#8a8678';   // mirror shadow
// SHADOW / ECLIPSE
PAL.eclipse  = '#2a1c2e';   // dark indigo-purple, not pure ink
PAL.umbra    = '#5a3a6a';   // mid eclipse purple (matches violet hue)
```

`PAL.ink`, `PAL.inkSoft`, `PAL.paper`, `PAL.red` keep their existing
values. **Never swap them out for the Optician versions** — they are
load-bearing for the wizard kit and the burst/telegraph systems.

## Priority order

The three that read worst right now and unlock the most polish:

1. **Burning Lens** — the silhouette is wrong, beam reads as haze
2. **Lens Array beams** — borrowed Chain-Lightning render, color is muddy
3. **Blinding Flash** — currently a generic explosion, no white-out

Then in this order: Reflective Aegis · Solar Halo · Lighthouse · Solar
Eclipse · Mirror Maze · Prism Strike · Focused Beam · Prism Burst.

---

## 1 · Burning Lens — `Renderer.drawBurningLens(ctx, list, t)`

**Read now.** Heat-haze ring + flat ellipse + sun rays. Looks like
hot air, not a magnifying glass.

**Read after.** A real glass disc held above the ground, throwing a
focused **light cone** onto a **scorched circle** that grows with the
ramp curve.

**Geometry per lens (top-down, lens floats over impact spot):**

```
groundX,Y     — impact target (where the burn is)
ramp ∈ [0,1]  — current ramp progress, drives radius + brightness
scorchR       = lerp(8, 28, ramp)              // grows w/ ramp
lensR         = 18                              // disc, NOT ellipse
coneTopY      = groundY - 22                    // lens height above ground
```

Draw order (additive feel; do NOT use `globalCompositeOperation`):

1. **Scorch disc** at (groundX, groundY): `PAL.ink` fill at `0.55*ramp`
   alpha, `PAL.red` stroke at `0.7*ramp` alpha. Inner gold ember dot
   `r = scorchR*0.35`, alpha `0.6+0.4*sin(t*8)`.
2. **Ground halo**: dashed `PAL.warm` ring at `r = scorchR + 6`,
   `setLineDash([3,4])`, dashOffset = `-t*18`. Skip when `ramp < 0.15`.
3. **Light cone**: trapezoid filled with vertical gradient
   `rgba(232,184,64,0.0) → rgba(255,243,200,0.55)` from cone top to
   ground. Width: `2` at top, `scorchR*1.6` at base. Stroke ink at
   `0.18` alpha so it reads on parchment.
4. **Lens disc** at (groundX, coneTopY):
   - Fill `PAL.silver` at `0.85` alpha
   - Inner highlight: `PAL.silverHi` arc, top-left, 1.5px stroke
   - Frame: `PAL.ink` 1.5px stroke, full circle
   - Center pip: `PAL.warm` 2px dot — the focal sun
5. **Handle**: 1px ink line from disc edge `(coneTopX+lensR, coneTopY)`
   sloping up-right `+10,-6`. Read as held. Skip if it crowds nearby
   enemies.

Phases: cone pulses scorch alpha on `0.5 + 0.5*sin(t*4)`. No camera
shake — burn is continuous, not impulse.

**Hook:** unchanged from existing `BurningLens.tick`. Reads `ramp`
from the same place; renderer just does more with it.

---

## 2 · Lens Array — `Renderer.drawLensArray(ctx, list, t, player)`

**Read now.** Three orbiting ellipses. Beams routed through
`this.lightnings` (Chain Lightning system) → orange/blue muddle.
Converged-beam moment is not legible.

**Read after.** Three real **mirror-frame lenses** orbiting the
player at 120°, each casting a thick **warm-yellow → white-hot** beam
to the same target. Convergence point gets a small heat shimmer.

**Stop using `this.lightnings`.** Add a dedicated `drawLensBeam(ctx,
fromX, fromY, toX, toY, intensity)` helper:

```js
// 3-stack, drawn back-to-front, all on the same path:
// (a) outer halo  6px  rgba(232,184,64,0.18)
// (b) mid amber   3px  rgba(214,138,30,0.85)
// (c) hot core   1.2px rgba(255,243,200,1.0)   only when intensity > 0.6
ctx.lineCap = 'round';
```

**Lens sprite (per orbit slot, NOT an ellipse anymore):**

- Body: circle `r 9`, fill `PAL.silver`, ink stroke 1.2px.
- Frame ring: ink stroke at `r 9.5`, 1.5px.
- Pivot tang: 4px ink line from circle edge toward player — reads as
  the lens being aimed.
- Center hot dot: `PAL.warm` `r 2` when intensity > 0.4, else `PAL.ink`.

**Convergence shimmer:** at the target, when all 3 beams hit:
`drawHeatShimmer(ctx, x, y, t)` — 3 gold dots on a triangle, jittered
`±1px`, alpha `0.6*sin(t*12+offset)`. Cheap, reads as "this is hot".

Shake: per beam `light` (already wired); convergence — none.

---

## 3 · Blinding Flash — `Renderer.drawBlindingFlash(ctx, flash, t)`

**Read now.** `spawnExplosion` default. Forgettable.

**Read after.** True optical white-out: full-canvas paper flash that
fades over 0.3s + radial blind-rings expanding outward.

```js
// flash.age advances 0 → 0.3 then dies
const age = flash.age;
const k   = age / 0.30;          // 0 → 1
const fade = 1 - k;              // 1 → 0

// 1) Full-canvas paper flash (DRAW BEFORE everything else this frame
//    that should be "hidden" — i.e. before enemies, after ground).
//    Use the renderer's screen-space pass so camera shake doesn't
//    move the white-out off-screen.
ctxScreen.fillStyle = `rgba(255,247,225,${fade * 0.92})`;
ctxScreen.fillRect(0, 0, W, H);

// 2) Radial blind-rings — 3 concentric, world-space, at flash.x/y
for (let i = 0; i < 3; i++) {
  const phase = clamp01(k - i*0.08);
  if (phase <= 0 || phase >= 1) continue;
  const r = lerp(8, 220, phase);
  const a = (1 - phase) * 0.55;
  ctx.strokeStyle = `rgba(255,243,200,${a})`;
  ctx.lineWidth   = 2.5;
  ctx.beginPath(); ctx.arc(flash.x, flash.y, r, 0, TT); ctx.stroke();
}

// 3) Inner gold star — 8 short rays from center, fade faster than
//    the wash so the wash carries the moment.
const rayFade = clamp01(1 - k*1.6);
if (rayFade > 0) drawStarRays(ctx, flash.x, flash.y, 8, 18, 30, PAL.warm, rayFade);
```

Shake: `medium` once at age 0. Apply enemy `blind` status as already
wired — visual swap is independent.

**Acceptance:** during the 0.3s window, you should not be able to
read enemy sprites near the player. After 0.15s the world is
returning. Color is warm white, not blue.

---

## 4 · Reflective Aegis — `Renderer.drawAegis(ctx, aegis, t, player)`

**Hand-mirror sprite, NOT a white rectangle.** Per orbit slot:

```
mirrorW  = 14
mirrorH  = 9
ang      = baseAng + t*orbitSpeed     // existing
cx, cy   = player.x + cos(ang)*orbitR,
           player.y + sin(ang)*orbitR
tilt     = ang + Math.PI/2            // mirror faces outward
```

Rendering (in mirror's local frame, `translate(cx,cy); rotate(tilt)`):

- **Silver fill rect** `-w/2,-h/2,w,h` — `PAL.silver`
- **Highlight strip** along the long top edge: `PAL.silverHi`, 2px
  thick, inset 1px
- **Ink frame** stroke 1.2px, full rect
- **Frame nubs** (top-left + bottom-right corners): 1.5px ink dots
- **Reflection sheen**: when `aegis.charges == aegis.maxCharges`, draw
  a second `PAL.silverHi` 1px diagonal stripe across the mirror.

**Charge consume flash** — borrow Fire Shield's gold pulse, but cooler
& sharper:

```js
// On consume: aegis.flashAge = 0
const f = aegis.flashAge;
if (f >= 0 && f < 0.4) {
  const k = f/0.4;
  // Single ring instead of 3 — Aegis is single-block, not orbital
  ctx.strokeStyle = `rgba(232,236,222,${(1-k)*0.85})`;  // pale silver, not gold
  ctx.lineWidth   = 2 + 4*k;
  ctx.beginPath(); ctx.arc(player.x, player.y, lerp(20, 64, k), 0, TT); ctx.stroke();
  // Plus a tiny gold confirm spark at the consuming mirror's pos
  ctx.fillStyle = PAL.warm;
  ctx.beginPath(); ctx.arc(mirror.cx, mirror.cy, 4*(1-k), 0, TT); ctx.fill();
}
```

**Hall of Mirrors spec — outstanding ask from VISUALS.md.** The
second ring of mirrors must read as distinct from the inner ring.
Fix: outer ring uses `mirrorW=10, mirrorH=7` (smaller) AND tilt
offset `+Math.PI/8` (slightly canted, not radial-perpendicular) AND
`PAL.silverLo` frame stroke instead of `PAL.ink`. That's three
independent diffs — the eye will pick one of them up.

---

## 5 · Solar Halo — `Renderer.drawSolarHalo(ctx, halo, t, player)`

Sun orb above player + rays is fine. Two pushes:

**Ground wash buff.** Existing radial gradient is too subtle. New:

```js
const rg = ctx.createRadialGradient(player.x, player.y, 0,
                                     player.x, player.y, halo.radius);
rg.addColorStop(0.00, 'rgba(255,243,200,0.35)');
rg.addColorStop(0.60, 'rgba(232,184,64,0.18)');
rg.addColorStop(1.00, 'rgba(232,184,64,0.00)');
ctx.fillStyle = rg;
ctx.beginPath(); ctx.arc(player.x, player.y, halo.radius, 0, TT); ctx.fill();
```

Plus a dashed `PAL.warm` perimeter ring at `r = halo.radius`, dash
`[5,4]`, dashOffset `-t*8` — the wash now has a defined edge.

**Eclipse spec swap.** When `halo.spec === 'eclipse'`:

- Replace the bright sun orb with a `PAL.eclipse` disc, `PAL.umbra`
  outer corona, **white-hot rim** (1.5px `PAL.hot` stroke) — classic
  "ring of fire" eclipse silhouette.
- Ground wash colors: `rgba(42,28,46,0.32)` core → `rgba(90,58,106,0)`
  edge.
- Rays become `PAL.umbra`, half opacity, slower wobble.
- Add 4 long, thin ink rays at cardinals — eclipse "spike" feel.

Same shape, different temperature. Players should recognize this is
the same ability with the lights off.

---

## 6 · Lighthouse — `Renderer.drawLighthouse(ctx, lh, t)`

Pillar + lamp + cone is fine; cone is the weak link.

**Cone upgrades:**

```js
// Replace flat triangle fill with a directional gradient:
const beamLen = lh.range;
const halfAng = lh.spread/2;           // existing
const tipX = lh.x + cos(lh.aim)*beamLen;
const tipY = lh.y + sin(lh.aim)*beamLen;

// Path: lamp → arc-end-A → arc-end-B → close
ctx.beginPath();
ctx.moveTo(lh.x, lh.y);
ctx.arc(lh.x, lh.y, beamLen, lh.aim - halfAng, lh.aim + halfAng);
ctx.closePath();

// Linear gradient along aim axis:
const lg = ctx.createLinearGradient(lh.x, lh.y, tipX, tipY);
lg.addColorStop(0,   'rgba(255,243,200,0.55)');     // hot at lamp
lg.addColorStop(0.6, 'rgba(232,184,64,0.22)');
lg.addColorStop(1,   'rgba(232,184,64,0.00)');
ctx.fillStyle = lg;
ctx.fill();

// Bright centerline (already exists) — keep, but pulse:
const pulse = 0.7 + 0.3*Math.sin(t*4 + lh.phase);
ctx.strokeStyle = `rgba(255,243,200,${pulse*0.85})`;
ctx.lineWidth = 1.5;
ctx.beginPath();
ctx.moveTo(lh.x, lh.y); ctx.lineTo(tipX, tipY); ctx.stroke();
```

Pillar untouched. Add a 2px `PAL.warm` dot at lamp position pulsing on
the same `pulse` value — sells the "lit" state.

---

## 7 · Solar Eclipse — `Renderer.drawSolarEclipse(ctx, ecl, t)`

Radial wash + dashed ring is good. The missing read is **ramping
DPS**. Bind brightness to the ramp:

```js
const ramp = ecl.rampT;                 // 0 → 1 over the eclipse life
// Disc fill alpha: 0.18 → 0.55
const discA = lerp(0.18, 0.55, ramp);
// Rim stroke: subtle → searing
const rimA  = lerp(0.20, 0.95, ramp);
const rimW  = lerp(1.0, 2.5, ramp);
// Dashed ring outer: dash speed scales with ramp
ctx.lineDashOffset = -t * lerp(6, 22, ramp);
```

When `ramp > 0.7`, add an inner **white-hot crescent** — a thin arc
on the side opposite the sweep direction, `PAL.hot` 1.5px stroke,
alpha `(ramp-0.7)/0.3 * 0.7`. Reads as the eclipse "burning through".

No new geometry — just bind the existing draws to `ramp`.

---

## 8 · Mirror Maze — `Renderer.drawMirrorMaze(ctx, maze, t)`

Line lattice stays. Two changes:

**1. Mirror nodes.** Currently the lattice is just lines — it should
read as **mirrors connected by reflections**. At every lattice
junction, draw a 4×4 silver square (`PAL.silver` fill, `PAL.ink` 1px
stroke), tilted 45°. Reads as a node.

**2. Crystal Cage spec — force-field arcs.** When
`maze.spec === 'crystal-cage'` AND an enemy is within 6px of any
boundary segment, draw a flickering indigo arc:

```js
// For each (segA, segB) on the perimeter where enemy is close:
const mid = midpoint(segA, segB);
const perp = perpendicular(segA, segB, 8);   // bow outward
ctx.strokeStyle = `rgba(76,108,172,${0.5 + 0.5*Math.random()})`;
ctx.setLineDash([2,3]);
ctx.lineWidth = 1.4;
ctx.beginPath();
ctx.moveTo(segA.x, segA.y);
ctx.quadraticCurveTo(mid.x + perp.x, mid.y + perp.y, segB.x, segB.y);
ctx.stroke();
ctx.setLineDash([]);
```

Cap at 6 active arcs/frame. The flicker selling is the random alpha,
not a moving arc — keeps it cheap.

---

## 9 · Prism Strike — `Renderer.drawPrismStrike(ctx, strike, t)`

Pillar of light + telegraph ring is decent, just abrupt at impact
(0.55s total).

**Add a brief blow-out** — at impact moment, frame 0:

```js
if (strike.age < 0.06) {
  const k = strike.age/0.06;
  // Full-pillar white-hot wash
  ctx.fillStyle = `rgba(255,243,200,${(1-k)*0.85})`;
  ctx.fillRect(strike.x - 18, strike.y - 200, 36, 200);
  // Ground star at impact
  drawStarRays(ctx, strike.x, strike.y, 6, 14, 22, PAL.hot, 1-k);
}
```

Telegraph ring already exists; unchanged. Pillar gradient (existing)
stays. Just the 60ms peak gets brighter.

Shake: `light` at impact (existing). Don't bump it.

---

## 10 · Focused Beam — `Renderer.drawFocusedBeam(ctx, beam, t)`

Three-layer beam is already good. Only add a small heat shimmer at
the impact end — same `drawHeatShimmer` helper from §2:

```js
if (beam.intensity > 0.7) {
  drawHeatShimmer(ctx, beam.tipX, beam.tipY, t);
}
```

Don't touch the beam itself.

---

## 11 · Prism Burst beams — `Renderer.drawPrismBurst(ctx, burst, t)`

Instant rays in 7 colors. Two tweaks:

**Thicker lines.** Bump `lineWidth` from current 1.4 → 2.2. Add a
1.0px white-hot inner stroke on top for the first 0.08s of the burst
(blow-out moment).

**Endpoint sparks.** At each ray endpoint, drop a 4-point
`PAL.hot` star for 0.15s, then `PAL.warm` for the next 0.15s, then
gone. Cheap 4-line cross — no need for full star geometry.

Colors stay correct (per Spectrum: red, orange, yellow, green, blue,
indigo, violet — the existing spectrum order is right).

---

## Companion polish (lower priority, from VISUALS.md asks)

These are wizard-companion items, not Optician, but the user listed
them in the same polish pass. Keep these distinct from Optician work
above — same sprint, different file boundaries.

- **Mender Wisp** — replace small green cross with `+`-rune that
  carries a pale-paper halo. Body: `PAL.paper` 4px circle,
  `+` glyph in `PAL.warm` 1.5px strokes, halo `r 8` paper-glow at
  `0.35` alpha breathing on `sin(t*2)`. Same draw site as the
  current cross.
- **War Drummer** — on each beat, post a colored ring **at the
  player's feet** (not the drum's): aura color (vermilion / indigo /
  gold), `r 0 → 28` over 0.4s, fade out. This makes the active aura
  legible without reading the drum's glyph.
- **Sigil Linker** — bead along thread when damage is shared. On
  cascade, spawn a 3px `PAL.red` mote at the source enemy and animate
  along the thread quadratic to the receiver over 0.18s. One mote
  per (source, receiver) pair, capped at 6 concurrent.
- **Shock Tower watchtower spec** — when `tower.permanent === true`,
  draw 4 cardinal `PAL.warm` 3px dots on the ground at `r tower.r +
  6`, plus a faint `PAL.gold` ground anchor disc `r 12` under the
  pillar at `0.25` alpha. Cheap, says "this stays".
- **Snow Fort permafrost** — when `patch.kind === 'permafrost'`, drop
  the wall geometry entirely. Just a `PAL.blue` 0.18-alpha disc with
  diagonal indigo hatch (5px `PI/3.5`), dashed perimeter at `r 22`.
  Looks like ground frost, not a tiny fort.

---

## Code cleanups (still open from VISUALS.md)

These are housekeeping. Pick up after the visual polish lands.

- `Renderer` docstrings refresh — strip references to SmokeBomb,
  SpringTrap, Caltrops, Pyroclasm. Search for those four strings.
- Delete `drawNinja` if it still exists. Ninja class is deferred
  indefinitely; the draw is dead code.
- Standardize `drawXxx` arg order. Most are `(ctx, list, t)`. The
  ones that need player position (Aegis, Solar Halo, Lens Array)
  read it from `game.player` inside the body — match that pattern
  rather than threading `player` through the signature.

---

## Acceptance — what "done" looks like

For each Optician spell, the diff is acceptable if:

1. **Top-down read.** No silhouette/side-view geometry. Lens is a
   disc, not an ellipse. Lighthouse cone is on the ground.
2. **Distinct vocabulary.** Light = gold / white-hot. Mirror =
   silver. Eclipse = dark purple. No spell uses all three.
3. **No shared particle systems with the wizard kit.** Lens beams
   no longer touch `this.lightnings`. Blinding Flash no longer
   calls `spawnExplosion`.
4. **Camera shake unchanged.** Visual polish does not change shake
   class for any ability.
5. **Performance.** No new per-frame allocations. Particles use the
   existing pools. Beam helpers stroke 3 paths max.

If a step contradicts gameplay tuning numbers (radii, durations,
damage), trust gameplay — visual recipe scales to match.
