# Gravewave

A single-file HTML5 wave-defense roguelite. Auto-cast abilities, tiered ability picks, scale your build by spending points across dumps and specs.

The whole game lives in `index.html`. Open it in a browser. There is no build step.

Live build: <https://okface.github.io/gravewave/>

## Running

```sh
# Any static server. With Python:
python3 -m http.server 8000
# → http://localhost:8000/

# Or just double-click index.html.
```

## Verifying changes

Before shipping, syntax-check the inline script:

```sh
node -e "
const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
const m=html.match(/<script[^>]*>([\\s\\S]*?)<\\/script>/);
new Function(m[1]); console.log('OK');
"
```

Runtime testing is open-the-file-and-play. A visible red error banner traps any uncaught exception so flaky bugs surface their stack on-screen instead of silently breaking the loop.

## Design

- `DESIGN.md` — canonical design reference. Class/tier/ability shape, point economy, "adding a new class" checklist, the per-class slot map (T1 attack / T2 defensive / T3 ultimate roles).
- `VISUALS.md` — visual + animation status tracker. What's shipped, what's open, the "how the handoff process works" meta-note.
- `UI_DESIGN.md` — dump info-box format + color tokens (the standard for level-up text).

## Classes shipped

- **Wizard** — channels arcane elements (fire / frost / lightning / gravity). Stationary caster.
- **Optician** — manipulates light, lenses, mirrors, and shadow. Stationary caster with ramping concentration. Introduces the **Blind** status.

Each class has 12 abilities (4 attack T1 / 4 defensive T2 / 4 ultimate T3) and shares the 4 companions (Sigil Linker / Decoy Effigy / Mender Wisp / War Drummer).

## Conventions

- **Data-driven content.** Adding an ability or enemy = one new registry entry. Don't touch the engine.
- **Uniform ability shape.** Every ability has 3 dumps (5 points each) + 3 specs (pick 1 once 6 invested). See `DESIGN.md`.
- **One point per level.** Wave clear → +1 level → +1 unspent point. Spend freely.
- **Levels 1 / 4 / 9** open a tier picker; everything else opens the level-up screen.
- **Spec wiring discipline.** Every `behavior: { foo: ... }` flag must be read somewhere in the engine. Orphan flags silently break build diversity. Grep before you ship.

## Handing off design work

When a Claude Design bundle drops in, read both layers:

1. The `*_HANDOFF.md` markdown lists **deltas** to apply on top of an existing baseline.
2. The `art-lab-v*.js` file in the bundle is the **baseline** (the canonical canvas-draw source).

Port the `art-lab` baseline first, then layer the handoff polish bullets on top. Implementing only the markdown bullets gives you placeholder-grade visuals.
