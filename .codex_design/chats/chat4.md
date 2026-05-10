# Design Handoff Spells

_Started 2026-05-09 13:30 UTC_

---

## User

please check the design.md and prepare a good handoff with all needed spells and designs. make them feel different from each other and intricate effects/designs, i like animations. 

https://github.com/okface/gravewave/tree/main

## Assistant

_[tool: list_files]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: list_files]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: questions_v2]_

Before I dive in — there's already substantial work here (art labs v1–v3, a long HANDOFF.md, DESIGN.md with 12 wizard abilities + 4 companions). I want to make sure I build the right thing.

## User

Questions timed out; go with defaults

## Assistant

_[tool: snip]_

_[tool: update_todos]_

_[tool: read_file]_

_[tool: snip]_

_[tool: read_file]_

_[tool: snip]_

_[tool: grep]_

_[tool: grep]_

_[tool: snip]_

_[tool: write_file]_

_[tool: snip]_

_[tool: grep]_

_[tool: snip]_

_[tool: read_file]_

_[tool: snip]_

_[tool: read_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: grep]_

_[tool: snip]_

_[tool: grep]_

_[tool: grep]_

_[tool: snip]_

_[tool: grep]_

_[tool: snip]_

_[tool: read_file]_

_[tool: snip]_

_[tool: read_file]_

_[tool: snip]_

_[tool: str_replace_edit]_

_[tool: write_file]_

_[tool: snip]_

_[tool: snip]_

_[tool: write_file]_

_[tool: snip]_

_[tool: done]_

_[tool: snip]_

_[tool: update_todos]_

_[tool: fork_verifier_agent]_

Done. The codex is wired up across all four files:

- **`Gravewave Spell Codex.html`** — 16 entries (12 spells + 4 companions) with side-by-side live demo + spec card, plus three-up triplets, signature/spec/hook notes, hit-burst row, telegraph row, and a differentiation matrix at the end.
- **`art-lab-v4.js`** — new companion visuals: Sigil Linker (hexagram + cascading beads), Decoy Effigy (strain → detonate), Mender Wisp (Lissajous + gold ribbon + glyphs), War Drummer (cycling Vigor/Ward/Haste with colored beat pulses).
- **`art-lab-v3.js`** — patched to expose v3 spell/burst/tele functions on `window.CodexV3`.
- **`codex-init.js`** — dispatcher that wires every canvas type.
- **`HANDOFF.md`** — rewritten as the canonical edition iv: coverage matrix, differentiation rules, shake fingerprints, palette, integration hookpoints per ability, companion specs, render-order, gotchas.

Each spell sits at a distinct intersection of geometry × particle physics × shake — no two share all three axes, and the matrix in §2 of the handoff calls out exactly which lane each one occupies.

