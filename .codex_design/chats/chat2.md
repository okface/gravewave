# Gravewave Design Systems

_Started 2026-05-08 07:13 UTC_

---

## User

https://github.com/okface/gravewave
can you please make some quick mockups of new design systems, like 5 different styles, one highly pixelated style and others, be creative. just give like 1 char, a couple of spells and animations and an enemy just to get a feel for it each.

## Assistant

_[tool: github_get_tree]_

_[tool: github_read_file]_

_[tool: github_read_file]_

_[tool: github_read_file]_

_[tool: copy_starter_component]_

I'll build 5 distinct design-system mockups laid out side-by-side, each with a tiny animated scene showing the wizard, an enemy, and a couple of spells. Let me get the canvas scaffold and design these.

_[tool: grep]_

I'll mock up 5 distinct directions for Gravewave. Each will be a small animated scene (wizard + enemy + a couple spells) plus a quick type/color note. Read the existing index.html briefly to ground the visuals.

_[tool: snip]_

_[tool: write_file]_

I'll build 5 directions as small animated game scenes on a design canvas. Let me write the scenes.

_[tool: write_file]_

Now the main HTML composing all 5 styles on a design canvas.

_[tool: done]_

_[tool: snip]_

_[tool: fork_verifier_agent]_

Five directions are live on the canvas — drag to reorder, click any artboard's expand button to focus it.

- **01 · CRYPT.GB** — chunky 4-bit twilight pixel demake (Press Start 2P, scanlines, parallax tombstones)
- **02 · Sumi & Grave** — ink-wash brush silhouettes on parchment with a vermillion seal
- **03 · HEX.ARCADE** — neon vector wireframe over a synthwave grid (cyan wizard, magenta octahedron revenant)
- **04 · NECROTERM** — brutalist ASCII terminal where `@` is the wizard, `Z` is the zombie, `*~◆` is the fireball
- **05 · Reliquary** — tarot-card watercolor with gilt filigree, hooded figure, painted wraith

Each shows the wizard, a fireball arc, chain lightning, and an advancing enemy with a tiny HUD treatment. Tell me which direction(s) feel right and I'll push deeper — full ability set, level-up panel, tier picker, etc.

## User

wow these are awesome but it's a top down game haha. can you remake them as top down? and are they feasible for the type of backend and renderer we have? like.. will it look like this when i'm playing on my phone? remake #4 #2 and #1 as top down vertical screen

## Assistant

_[tool: snip]_

_[tool: write_file]_

Got it — gravewave is top-down so a side-on view was misleading. I'll redo #1, #2, #4 as top-down vertical (phone-shaped) and answer the feasibility question.

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: done]_

_[tool: snip]_

_[tool: fork_verifier_agent]_

Top-down vertical phone mockups are live in a new section above the side-on sketches:

- **01 · CRYPT.GB · top-down** — 100×180 pixel buffer, scaled crisp; auto-fireball on nearest, chain lightning, swarm of zombies closing from the edges
- **02 · Sumi & Grave · top-down** — wizard as a top-down ink mark (hat dot + robe ellipse + vermillion staff orb), wisp-ghosts circling, enso fireball, dry-brush chain
- **04 · NECROTERM · top-down** — `@` centered in a 22-col roguelike grid, `Z`/`z` shambling inward, `*~◆` projectiles, `─\/⚡` chain bolts

There's also a **00 · feasibility note** card up front — short answer: yes, all three drop into your existing `Renderer` cleanly. CRYPT.GB is cheapest (offscreen pixel buffer + `drawImage` scaled), NECROTERM is cheap (~770 `fillText` calls/frame, batchable by color), Sumi is mid-cost (cap splatter dots ≤ 30/frame, cache parchment grain once). Pick one and I'll wire it into the real `index.html`.

