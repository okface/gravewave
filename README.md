# Gravewave

A single-file HTML5 wave-defense roguelite. Auto-cast spells, branching skill trees, two characters (Magician + Ninja), status effects, talent inheritance via spell fusion.

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

## Conventions

- **Data-driven content.** Adding a spell, skill node, item, enemy, character, or fusion = one new registry entry. Don't touch the engine.
- **Two currencies.** Talent Points (TP, +1/wave) buy talent ranks; Skill Points (SP, +1/boss-wave) buy spell unlocks.
- **Talent trees use Diablo-style tier gates.** A node may declare `treePointsRequired: N` to require N total points spent in its tree before it unlocks.
- **Fusion = inheritance, not refund.** A fused spell declares `parents: [...]` so all talent investment in consumed parents continues to apply to the fused result. Spending isn't reset.
- **Comments explain *why*, not *what*.** Existing comments are mostly load-bearing — they document non-obvious design choices. Don't strip them when refactoring.
