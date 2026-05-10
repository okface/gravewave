# Optician Interface Fixes

_Started 2026-05-09 16:14 UTC_

---

## User

please read https://github.com/okface/gravewave/blob/main/VISUALS.md and try to stick to fixing optician stuff effectively. as i don't have much tokens left for claude design. just do what's needed, no need to make a presentation for me here. just prepare it for the claude coder to import effectively. 
https://github.com/okface/gravewave/tree/main

## Assistant

_[tool: list_files]_

_[tool: github_read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: list_files]_

_[tool: snip]_

_[tool: write_file]_

I'll write a tight, coder-ready Optician polish handoff. No presentation — just concrete specs the coder can lift straight into `Renderer.draw…` methods in `index.html`.

_[tool: show_to_user]_

Wrote `OPTICIAN_HANDOFF.md` — focused, coder-ready spec covering all 11 Optician polish items from `VISUALS.md` plus the companion + code-cleanup asks. Each item gives the bad-read, target-read, concrete draw recipe (palette + geometry + phases), and acceptance criteria so the coder can lift directly into the matching `Renderer.draw…` methods.

Priorities flagged at top: Burning Lens, Lens Array beams, Blinding Flash white-out — the three that read poorest right now.

