# Gravewave

A single-file HTML5 wave-defense roguelite. Auto-cast spells, branching skill trees, two-currency progression, status effects.

The whole game lives in `index.html`. Open it in a browser. There is no build step.

## What's in this folder

| File | Purpose |
|---|---|
| `index.html` | The game. ~5750 lines. Single self-contained file. |
| `ARCHITECTURE.md` | How the code is structured. Read this before editing. |
| `TUNING.md` | Every balance dial in one place. Read this before tweaking numbers. |
| `REFACTOR_PLAN.md` | The four refactors that should happen before adding more features. Read this before adding more features. |
| `KNOWN_ISSUES.md` | Things that are broken or wrong but not yet fixed. |
| `DESIGN_NOTES.md` | Captured design decisions and the reasoning behind them. Helps you push back on or extend choices intentionally. |

## Reading order for a new contributor

1. **README.md** (this file) — orientation
2. **ARCHITECTURE.md** — code layout, system boundaries, data flow
3. **DESIGN_NOTES.md** — why things are the way they are
4. **REFACTOR_PLAN.md** — known debt, with concrete fix plans
5. **TUNING.md** — for balance work specifically
6. **KNOWN_ISSUES.md** — current bugs/wrong behaviors

## Testing locally

```sh
# Serve the file (any static server works). With Python:
python3 -m http.server 8000
# Open http://localhost:8000/index.html
```

Or just double-click `index.html`. There's no server-side anything.

## Verifying changes

The script tag uses `"use strict"`. Before shipping changes:

```sh
# Extract the inline JS and run node --check on it
python3 -c "
import re
html = open('index.html').read()
m = re.search(r'<script>\s*\"use strict\";(.*?)</script>', html, re.DOTALL)
open('/tmp/game.js', 'w').write(m.group(1))
" && node --check /tmp/game.js
```

That catches syntax errors. There are no unit tests yet — runtime testing is "open the file and play."

## Conventions

- **Data-driven content.** New spell, skill node, item, enemy, character → add a registry entry. Don't touch engine code.
- **CONFIG holds balance.** Per-wave HP scaling, spell cost ladder, iframes, etc. Look there before adding new constants.
- **Spell costs use two currencies.** Talent Points (TP, +1/wave) and Skill Points (SP, +1/boss-wave). See ARCHITECTURE.md → "Skill tree system" for the full economy.
- **Comments explain *why*, not what.** Existing comments are mostly load-bearing — they document non-obvious design choices. Don't strip them when refactoring.

## Current focus

The next major work item is **the damage pipeline refactor**. See REFACTOR_PLAN.md → "Refactor A". Several spells/statuses don't compose cleanly because damage application is duplicated across 11 sites. Doing that refactor first unblocks better Ignite, better target priority, easier future content.
