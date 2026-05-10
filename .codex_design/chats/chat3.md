# Gravewave Visual Polish

_Started 2026-05-08 07:39 UTC_

---

## User

https://github.com/okface/gravewave 
we've updated with design.md with tasks for you. you can also be creative and add other stuff you find. i want the game to feel more "alive" and with shocks etc. some more effects on spells that make it feel more impactful. continue with the current existing style of the project. ensure that the designs you make are possible and easily ported into the existing game, i want it to look according to your vision

## Assistant

_[tool: github_list_repos]_

_[tool: github_get_tree]_

_[tool: github_read_file]_

_[tool: github_read_file]_

_[tool: github_read_file]_

_[tool: github_import_files]_

_[tool: list_files]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: snip]_

_[tool: read_file]_

_[tool: snip]_

_[tool: update_todos]_

I have full context now. The user has an existing "Ink & Vellum" art direction (v2 art lab — vermilion/indigo/ochre on aged paper, woodcut woodblock vibe). The VISUALS.md has a clear backlog: T2/T3 abilities are stubs, plus impact polish and "shocks" — exactly what they're asking for.

Let me build a v3 art lab focused on the missing effects + the "shocks/aliveness" pass: camera shake system, hit bursts, death shatters, telegraphs, T2/T3 spell visuals (Snow Fort, Fire Shield, Shock Tower, Wormhole, Snow Storm, Meteor, Storm Cloud, Black Hole proper accretion disc, Gravital Anomaly).

I'll reuse v2's primitives + actors by loading `art-lab-v2.js`, and add new effects in `art-lab-v3.js`. New canvases use `data-v3-*` selectors so v2's init silently no-ops.

_[tool: write_file]_

_[tool: write_file]_

_[tool: update_todos]_

_[tool: snip]_

_[tool: done]_

_[tool: update_todos]_

_[tool: fork_verifier_agent]_

**v3 — Shock & Pulse** — built atop v2's primitives.

**New in this pass:**
- **Hero scene** — combat tableau with meteor crashing, storm cloud zapping, snow fort holding, enemies pushed by impact
- **T2 Defensive** — Snow Fort (hex ice wall + crystal posts + shatter death), Fire Shield (3 orbiting orbs + spark on contact + gold block flash), Shock Tower (jittering coil + jagged arc + range halo pulse), Gravital Anomaly (small wells with dashed threads back to wizard, vermilion pop on expire)
- **T3 Ultimate** — Meteor (telegraph → comet → impact flash → cracks → embers + heavy shake), Snow Storm (~50 falling flakes + gust whips + frost overlay), Wormhole (twin spinning portals + dashed seam + transit stretch), Storm Cloud (drifting ink cloud + forking strikes + scorch marks)
- **T1 distinctions** — Black Hole proper (event horizon + photon ring + spinning accretion disc + light bend streaks), Fireball Hydra spec (head sprite that spits tinies), Fireball Meteor spec (top-down swap)
- **Impact lexicon** — 4 camera shake levels (light/medium/heavy/catastrophic), 5 hit burst types (hit/crit/resist/vuln/death shatter)
- **Telegraphs** — boss spawn ground-crack, wave spawn dust kicks, meteor target lock, wave banner with overshoot

**Porting:** every spell function uses the same contract as v2 (`(ctx, w, h, t, dt, key)`), and the impact bus pattern (`Game.onImpact({x, y, kind, dmg, crit, resist, fatal})`) is described in the notes block. Each function is named `spell*` / `burst*` / `tele*` so it lifts straight into `Renderer.draw*`.

## User

please add extensive documentation in the handoff document so the agent can effectively integrate this. or did you integrate it?

## Assistant

_[tool: snip]_

_[tool: write_file]_

To clarify: **I did not integrate into the game.** v3 is an art lab — animated specifications. The integration is the next pass and needs game-side wiring (impact bus, shake transform, particle pools, telegraph windows). Let me write a thorough handoff doc.

_[tool: snip]_

_[tool: done]_

**To answer your question directly: no, I did not integrate.** v3 is the visual spec only — `index.html` was not touched.

`HANDOFF.md` now covers, in order:
- The impact bus pattern (one event funnels everything)
- Camera shake state + transform placement (HUD outside the transform)
- 5 hit-burst variants + damage-number pop math + death shatter swap
- 11 spell-by-spell integration sections — game state, hookpoints, edge cases
- Telegraph wiring (boss spawn, wave spawn, meteor target, wave banner)
- 10 micro-shock events for the "alive" feel
- Particle pool sizing + global cap (250)
- Spec → visual mappings
- A staged rollout order (8 phases, each shippable on its own)
- 7 known footguns
- 5 open product questions to answer before integrating

Each section points at the exact lab function (`spellMeteor`, `burstCrit`, `teleBoss`, etc.) so the integration agent can copy-paste, rename, and wire.

