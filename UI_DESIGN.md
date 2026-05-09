# Gravewave UI Design — Level-Up Dump Info Box

Authority for the level-up panel's per-dump info row. Covers the standardized
text template, the color/contrast tokens that drive readability on the
parchment background, and a per-stat reference table. Everything in this doc
is render-only — the underlying perPoint values in `ABILITIES` / `MINIONS`
stay as-is; only the string formatters (`formatDumpAt`, `formatDumpPerPoint`,
the `lu-dump-progress` row in `Renderer.renderLevelUpBody`) and three CSS
rules need to change.

---

## 1. The problem

The current dump row renders three layers of text that overlap in meaning:

```
[icon] HEAT       [● ● ● ○ ○]   +12% damage per point.
                                Now: +24% damage · +1 pt → +36% damage
```

```
[icon] BLEEDOVER  [● ○ ○]       +15% link share per point (base 20%).
                                Now: +15% link share · +1 pt → +30% link share
```

Three issues:

1. **Stacking deltas, not absolutes.** "+30% link share" reads as "you gain
   another +30%" rather than "your link share will be 50%". Player has to
   add base + invested + next in their head every time.
2. **Static description duplicates the math.** `+15% link share per point`
   says the slope; `Now: +15%` re-says the slope at 1pt; `+1pt → +30%` is the
   slope again. The static line is redundant once both Now and Next are
   present.
3. **Yellow on beige.** `--gold #b6913a` on `--paper-soft #f4e9cb`
   (the panel background) measures roughly **2.6:1 contrast** — well below
   WCAG AA's 4.5:1 minimum for body text and below even the 3:1 large-text
   floor. The "+1 pt → ..." line is the most-read piece of UI in the panel
   and it's the least readable.

A separate quality-of-life problem: ramping spells (Focused Beam, Burning
Lens, Solar Eclipse) describe their dump as `+12% beam DPS per point` and
their absolute as `+12% damage`, but the underlying base is the **floor of
the ramp**, not the steady-state DPS the player will actually see. Players
think the +4 dps is the whole story.

---

## 2. The standard template

One line, three parts, separated by middots. Always the same order:

```
<perPoint slope>. Now: <absolute current> · +1pt → <absolute next>
```

Or at MAX:

```
<perPoint slope>. Now: <absolute current> · MAX
```

Or unspent (0 pts):

```
<perPoint slope>. +1pt → <absolute first>
```

The static `dump.desc` field is **dropped from rendering**. Its content is
folded into the perPoint slope (which `formatDumpPerPoint` already computes
for the four base-aware stats). For non-base stats (pierceBonus,
beamGrace, shareBonus, etc.) the slope falls back to `dump.desc` — but in
that fallback case we still want a one-liner, so descriptions get
shortened to slope form (e.g. `"+1 chain target per dump"` not `"+1 chain
target per point (max +5)."`).

### Examples

**Fireball Heat (dmgMult, base 24 dmg, +12%):**

| State            | Render                                                                |
| ---------------- | --------------------------------------------------------------------- |
| 0 pts            | `+3 dmg per dump. +1pt → 27 dmg`                                      |
| 2 pts (filled)   | `+3 dmg per dump. Now: 30 dmg · +1pt → 33 dmg`                        |
| 5 pts (MAX)      | `+3 dmg per dump. Now: 38 dmg · MAX`                                  |

(Old: `+12% Fireball damage per point.` then `Now: +24% damage · +1 pt → +36% damage`.
Player no longer has to multiply 24 × (1 + total) themselves.)

**Sigil Linker Bleedover (shareBonus, base 20%, +15%):**

| State          | Render                                                  |
| -------------- | ------------------------------------------------------- |
| 0 pts          | `+15% link share per dump. +1pt → 35%`                  |
| 1 pt           | `+15% link share per dump. Now: 35% · +1pt → 50%`       |
| 3 pts (MAX)    | `+15% link share per dump. Now: 65% · MAX`              |

(This is the user's worked example. Note `formatDumpAt` for `shareBonus`
must be base-aware — currently it returns `+45% link share` which doesn't
include the 20% base.)

**Chain Lightning Forking (chainBonus, base 1 chain, +1):**

| State        | Render                                              |
| ------------ | --------------------------------------------------- |
| 0 pts        | `+1 chain per dump. +1pt → 2 chains`                |
| 2 pts        | `+1 chain per dump. Now: 3 chains · +1pt → 4 chains`|
| 5 pts (MAX)  | `+1 chain per dump. Now: 6 chains · MAX`            |

(For integer counts we drop the `+` prefix on the "Now/Next" side because
they're absolute counts, not deltas. Singular/plural matters: 1 chain vs 2 chains.)

**Focused Beam Concentrate (dmgMult, ramping 32 dps base):**

| State      | Render                                                                     |
| ---------- | -------------------------------------------------------------------------- |
| 0 pts      | `+4 dps per dump (at floor). +1pt → 36 dps · ramps ×0.3→×2.0`              |
| 2 pts      | `+4 dps per dump (at floor). Now: 40 dps · +1pt → 44 dps · ramps ×0.3→×2.0`|

Ramping spells get a third clause that explains the multiplier, so
"4 dps" no longer reads as "this beam deals 4 damage per second total."
Same for Burning Lens (`ramps ×0.5→×1.5`) and Solar Eclipse (`ramps ×0.5→×2.0`).

**Frost Bolt Multi-Spike (pierceBonus, base 2 pierce, +1):**

```
+1 pierce per dump. Now: 4 pierce · +1pt → 5 pierce
```

**Snow Fort Quick Reform (durationMult on a CD-style stat, base 8s recharge, +12% faster):**

```
−1.0s recharge per dump. Now: 5.6s · +1pt → 4.6s
```

(Currently this dump is described as `+12% faster recharge per point` and
the formatter renders `+12% duration` which is the wrong word entirely.
See punch list §6.)

---

## 3. Color tokens

The dump info row uses four semantic colors. Locking these tokens means
designers don't have to hunt for hex values when authoring new dumps.

| Token                | Hex / source       | Usage                                | WCAG vs `--paper-soft` (#f4e9cb) |
| -------------------- | ------------------ | ------------------------------------ | -------------------------------- |
| `--ink`              | `#1d150c`          | Now: absolute value (the **bold** in `<b>`) | 14.8 : 1 — pass AAA              |
| `--ink-mid`          | `#5b4a35`          | Slope label, "Now:", "+1pt →" labels | 5.7 : 1 — pass AA                |
| `--vermilion`        | `#b6332a`          | Next: absolute value (the **bold** in `<b>`) | 5.5 : 1 — pass AA                |
| `--gold`  *(legacy)* | `#b6913a`          | DEPRECATED on parchment — fails AA   | 2.6 : 1 — fail                   |

**The fix:** `.lu-dump-next b` currently resolves to `var(--accent, var(--gold))`.
The accent is the spell's color (e.g. `#ffea99` for Focused Beam, `#bce8ff`
for Snow Fort) — almost always a pastel that fails WCAG even worse than
gold. Hard-code `.lu-dump-next b` to `--vermilion` instead. Vermilion is
already the brand "callout" red used for keywords elsewhere in the panel
(`.modal-state.eligible`, `.spell-state`), so it doesn't introduce a new
hue.

The "MAX" tag (`.lu-dump-max`) is the only place gold is appropriate, and
it should switch from `var(--gold)` (#b6913a, 2.6:1) to **`--vermilion-deep`**
(#7a1d18, 8.4:1). MAX is a reward state — it deserves a strong color.

| Element                | Old color                              | New color                          |
| ---------------------- | -------------------------------------- | ---------------------------------- |
| `.lu-dump-now b`       | `var(--ink)`                           | (unchanged) `var(--ink)`           |
| `.lu-dump-next b`      | `var(--accent, var(--gold))` *(fail)*  | `var(--vermilion)`                 |
| `.lu-dump-max`         | `var(--gold)` *(fail)*                 | `var(--vermilion-deep)`            |
| `.lu-dump-progress`    | `var(--ink-mid)`                       | (unchanged) `var(--ink-mid)`       |
| `.lu-dump-desc`        | `var(--ink-mid)`                       | (unchanged) — but content gets shorter |

The accent color is **kept** in two non-text places so the panel still feels
like the spell's color: the top-edge `.lu-panel::before` stripe and the
filled pip background `.lu-pip.filled`. Both are large color fields where
contrast doesn't apply.

---

## 4. When to omit fields

| Situation                                              | What to render                                  |
| ------------------------------------------------------ | ----------------------------------------------- |
| 0 pts invested                                         | slope + Next only (skip Now)                    |
| MAX (5 for ability, 3 for minion)                      | slope + Now + `MAX` (skip Next)                 |
| stat is a binary toggle / not yet authored             | fall back to `dump.desc` static text            |
| stat affects something with no visible base (e.g. attackRateMult on a non-displayed cooldown) | render slope only, no Now/Next |

For minions, the renderer currently uses `dump.desc` directly instead of
`formatDumpPerPoint`. Switch to `formatDumpPerPoint` so we get the same
"+50 HP per dump" treatment as abilities (currently it shows
`+50 max HP per point.` from desc; new version would say `+50 HP per dump.
Now: 170 HP · +1pt → 220 HP` — base read off `def.dumps` baseline).

Minion base values aren't on the dump definition though, so they need to
move there. See punch list §6.4.

---

## 5. Per-stat reference

| stat                  | Slope formatter                                    | Absolute formatter                                | Base source            | Notes                          |
| --------------------- | -------------------------------------------------- | ------------------------------------------------- | ---------------------- | ------------------------------ |
| `dmgMult`             | `+N dmg per dump`                                  | `<base × (1+total)> dmg`                          | `ab.damage`            | "dps" / "/strike" via `damageNote` |
| `radiusMult`          | `+N px per dump`                                   | `<base × (1+total)> px`                           | `ab.radius` or `.size` | round to int                   |
| `sizeMult`            | `+N px per dump`                                   | `<base × (1+total)> px`                           | `ab.size`              |                                |
| `durationMult` (positive — "+X% duration") | `+N.Ns per dump`                  | `<base × (1+total)>s`                             | `ab.duration`          |                                |
| `durationMult` (used for "faster recharge") | `−N.Ns recharge per dump`        | `<base × (1−total)>s`                             | `ab.cooldown`          | **Bug**: Snow Fort, Reflective Aegis, Solar Halo describe this as "faster recharge" but use `durationMult` which currently renders as "+X% duration". Fix: split into `rechargeMult` or special-case via a `dump.invertedDuration: true` flag. |
| `cdMult`              | `−N.Ns cd per dump`                                | `<base × (1+total)>s`                             | `ab.cooldown`          |                                |
| `attackRateMult`      | `+X% rate per dump`                                | `<base / (1+total)>s interval`                    | `ab.cooldown` or hardcoded interval | Currently displays `+X% attack rate` with no base. Could compute interval. |
| `pierceBonus`         | `+1 pierce per dump`                               | `N pierce`                                        | hard-code per spell on dump (e.g. `dump.base = 2`) | Frost Bolt base = 2. Refraction Bolt base = 2. |
| `chainBonus`          | `+1 chain per dump`                                | `N chains`                                        | `dump.base = 1`        | Chain Lightning base = 1. Singular vs plural. |
| `beamGrace`           | `+1 grace re-target per dump`                      | `N grace re-targets`                              | `dump.base = 0`        | Wide Lens. Was "grace casts" — confusing.    |
| `shareBonus`          | `+15% share per dump`                              | `<base + total> share`                            | `dump.base = 0.20`     | Sigil Linker Bleedover.        |
| `rangeMult`           | `+N px range per dump`                             | `<base × (1+total)> px range`                     | `dump.base = 240`      | Sigil Linker Reach.            |
| `linkCountBonus`      | `+1 linked enemy per dump`                         | `N linked`                                        | `dump.base = 3`        | Sigil Linker Web.              |
| `hpBonus`             | `+50 HP per dump`                                  | `<base + total> HP`                               | `dump.base = 120`      | Decoy Sturdy.                  |
| `boomMult`            | `+35% explosion per dump`                          | `<base × (1+total)> explosion`                    | hard base or % only    | Decoy Volatile.                |
| `healBonus`           | `+3 HP / pulse per dump`                           | `<base + total> HP / pulse`                       | `dump.base = 6`        | Mender Wisp Flow.              |
| `pulseFaster`         | `−0.5s pulse per dump`                             | `<base − total>s` (clamp to floor)                | `dump.base = 5`        | Mender Wisp Tempo.             |
| `auraStrengthBonus`   | `+5% aura per dump`                                | `<base × (1+total)>`                              | per-aura base          | War Drummer Might. Aura strength is itself a multiplier on the buff, complex. |
| `auraRangeMult`       | `+20% aura radius per dump`                        | `<base × (1+total)> px`                           | `dump.base = 200`      | War Drummer Reach. Need to expose aura base radius. |
| `shieldMult`          | `+15% shield per dump`                             | `<base × (1+total)> shield HP`                    | per-spell              | Used by Fortify. Currently shares `dmgMult` slot in some specs. |
| `slowMult`            | `+X% slow per dump`                                | `<computed>%`                                     | per-spell              | Optician spells.               |
| `critChance`          | `+X% crit per dump`                                | `<base + total>%`                                 | `playerStats.crit`     | Not currently a dump but listed for future. |
| `critMult`            | `+X% crit dmg per dump`                            | `<base + total>%`                                 | `playerStats.crit`     | Same.                          |

### Vocabulary fixes (sweep across `dump.desc` strings)

- "per point" → "per dump" everywhere. Internally we call them dumps; calling
  the unit "point" in user copy makes it sound like the panel-level
  unspentPoints counter, which is a different thing.
- "(max +5)" / "(max +3)" can be dropped from desc — pip count already
  shows the cap.
- "(base 20%)" / "(base 240px)" can be dropped from desc — Now / Next render
  the absolutes directly.
- "Quick Cast / Quick / Quickdraw / Quick Collapse / Quick Reform" all map
  to `cdMult` (or `durationMult` which is doing recharge duty). Pick one
  word: **Quick** for cdMult, **Reform** for "faster recharge"
  durationMult, **Lasting** for positive durationMult. Right now Snow Fort
  uses "Quick Reform" with `durationMult: +0.12` and the formatter says
  `+1.0s duration per point`, which is **wrong** — the spell uses
  `mods.durationMult` to *divide* its 8s recharge, so more pts = faster.

---

## 6. Hierarchy

Within the row, the three pieces of information rank by player attention:

1. **Now: 30 dmg** — bold, `--ink`, the truth right now.
2. **+1pt → 33 dmg** — bold, `--vermilion`, the call to action.
3. *+3 dmg per dump* — regular weight, `--ink-mid`, the slope context.

Suggested layout (one line, allowed to wrap to two on mobile):

```
+3 dmg per dump.  Now: 30 dmg · +1pt → 33 dmg
^slope (--ink-mid) ^^^^^^^^^^   ^^^^^^^^^^^^^^^
                   ink bold     vermilion bold
```

---

## 7. Per-spell audit checklist

The exhaustive sweep is in the parent agent's report. Top fixes:

- **Bleedover, Reach (Sigil Linker), Web** — base in desc, not in
  formatter; switch to absolute.
- **Snow Fort Quick Reform, Reflective Aegis Recharge, Solar Halo Persist
  (durationMult abused as recharge)** — formatter says "+X% duration"
  for stats that *reduce* a recharge. Add `dump.invertedDuration: true`
  flag, render as `−N.Ns recharge per dump`.
- **Wide Lens** — "grace casts" → "grace re-targets" (the player can't
  read "casts" as "target switches").
- **Focused Beam Concentrate, Burning Lens Heat, Solar Eclipse Heat** —
  ramping spells need `(at floor)` annotation on the slope and a `· ramps
  ×A→×B` clause showing the curve.
- **Mender Wisp Tempo** — `pulseFaster` formatter outputs `−0.5s pulse`
  but never shows the resulting interval (5s base → ?). Switch to
  absolute `Now: 4.5s interval`.
- **War Drummer Might** — `auraStrengthBonus` percent applied to a buff
  multiplier. Probably best left in desc for now; document base buffs.
- **Decoy Sturdy** — `+50 max HP per point` is fine, but no Now/Next,
  because the renderer for minions uses `dump.desc` directly. Switch to
  `formatDumpPerPoint` + `formatDumpAt` for minions too.

---

## 8. Punch list (implementation deltas)

Read-only summary; actual edits are in the agent report. In short:

1. **`formatStat`** — change "+X% link share" / etc. to compose with a
   `base` argument when supplied: `(stat, total, base) => '<absolute>'`.
2. **`formatDumpAt`** — for stats that have a meaningful base on the
   `dump` definition (not on `ab`), read `dump.base` and add it. Add
   shareBonus, rangeMult, pierceBonus, chainBonus, beamGrace,
   linkCountBonus, hpBonus, healBonus, pulseFaster cases.
3. **`formatDumpPerPoint`** — drop the `dump.desc` fallback. Synthesize a
   slope line for every stat; only fall back to `dump.desc` if the stat is
   unknown / behavioral. Replace "per point" with "per dump" in all
   composed strings.
4. **`renderLevelUpBody`** — drop the static `dump.desc` line entirely;
   just render `formatDumpPerPoint(dump, ab)` + `progress`. For minions,
   switch from `dump.desc` to `formatDumpPerPoint(dump, null)` + add a
   `dump.base` field on every minion dump.
5. **CSS** — change `.lu-dump-next b` from `var(--accent, var(--gold))` to
   `var(--vermilion)`. Change `.lu-dump-max` from `var(--gold)` to
   `var(--vermilion-deep)`. (The accent color is preserved on the panel
   stripe and pips so the spell-color identity remains.)
6. **`ABILITIES` / `MINIONS` data**:
   - Add `dump.base` to: Sigil Linker (3 dumps), Decoy Sturdy, Mender Flow
     and Tempo, Drummer Reach. Hard-code Frost Bolt + Refraction Bolt
     pierce base = 2. Hard-code Chain Lightning chain base = 1.
   - Add `dump.invertedDuration: true` to: Snow Fort Quick Reform,
     Reflective Aegis Recharge.
   - Rename "Wide Lens — grace casts" → "grace re-targets" in dump.name
     and in `formatStat['beamGrace']`.
   - Sweep all `dump.desc`: drop `(base ...)` and `(max +N)` annotations
     since pips + Now/Next render those.
