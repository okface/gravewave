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

See `DESIGN.md` for the canonical design reference — class/tier/ability shape, point economy, and the checklist for adding new classes.

## Conventions

- **Data-driven content.** Adding an ability or enemy = one new registry entry. Don't touch the engine.
- **Uniform ability shape.** Every ability has 3 dumps (5 points each) + 3 specs (pick 1 once 6 invested). See `DESIGN.md`.
- **One point per level.** Wave clear → +1 level → +1 unspent point. Spend freely.
- **Levels 1 / 4 / 9** open a tier picker; everything else opens the level-up screen.
