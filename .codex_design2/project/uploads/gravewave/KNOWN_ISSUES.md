# Gravewave — Known Issues

Bugs, wrong behaviors, and inconsistencies that exist in the current build but haven't been fixed yet. Distinct from REFACTOR_PLAN.md — these are observable problems, not just structural debt.

When fixing one of these, please move it from this file to a CHANGELOG note (or just delete the entry).

---

## Mechanical / gameplay issues

### Fire + Storm synergy doesn't work in practice

**Severity:** High — undermines the whole "elemental synergy" design pitch.

**What's expected:** Take Fireball, take Ignite, take Lightning Bolt. Fireballs ignite enemies; lightning bolts crit ignited enemies for 2× damage. The trees feel like they reinforce each other.

**What actually happens:** Lightning Bolt's targeting is `findNearestEnemy`. It always picks whatever's closest. Ignite is applied by Fireball impacts to a small set of enemies (main target + splash). The closest enemy at any given moment is rarely an ignited one, so Lightning Bolt cashes in the synergy maybe once per wave at most.

Worse: enemies that walk into a Conflagration flame patch don't get ignited (the patch deals DoT but doesn't apply ignite). So there's no easy way to keep a stream of ignited enemies for lightning to target.

**Fix path:** REFACTOR_PLAN.md → Refactor D (targeting strategies). Lightning Bolt declares `prefer: ['ignited']`, the resolver hands it ignited targets first. Then Fire + Storm becomes a real build axis.

**Workarounds in current build:** None that work cleanly. Don't promise the player synergy yet.

---

### Conflagration flame patch doesn't ignite passers-by

**Severity:** Medium.

**What's expected:** Conflagration leaves burning ground. Enemies walking through the fire should ignite (matching the visual + thematic expectation).

**What actually happens:** FlamePatch deals DoT damage to enemies in its radius, but only the original Fireball impact (main + splash) applies ignite. So the lingering flame doesn't propagate the status.

**Fix path:** Inside `tickFlamePatches` damage application, also call `applyStatusesToEnemy` with the patch's stored status payload. Patch creation should pass `applyStatus: mods.applyStatus` from the Fireball cast. Will be cleaner after Refactor A — `dealDamage` accepts an `applyStatus` field on every damage source.

---

### `freeze` status is defined but never applied

**Severity:** Low — dead code, not user-visible bug.

`Enemy.applyStatus` and `tickEnemies` both handle `freeze` (sets speedFactor to 0). But no spell, talent, or item applies it.

**Fix path:** Either wire it into a Frost-tree talent (e.g. a Frost Spike upgrade that briefly freezes on crit), or remove the freeze handling from tickEnemies / Enemy class and document that as future work.

---

### Status payload shapes are bespoke per status

**Severity:** Medium — design debt, hits any new-status work.

`slow` uses `factor` (multiplier). `ignite` uses `dps` + `dpsRatio` + `critOnHit` + `tickAcc`. `shock` uses `multiplier` and is consumed inside `Enemy.takeDamage`. There's no common interface.

Adding a new status (e.g., "vulnerable: takes +25% damage from all sources") means picking a payload shape, writing a tick handler, choosing where it applies in the damage flow.

**Fix path:** REFACTOR_PLAN.md → Refactor C.

---

### Ignite's `critOnHit` was historically missed on multiple damage paths

**Severity:** Was high; now fixed but symptomatic.

Originally Ignite only crit-amped projectile collisions. Storm chain hops, Pyroclasm AOE, Fireball splash, Storm Cloud strikes, and Gravity Well dps were all unaffected. We patched each one across multiple sessions, but this is exactly the kind of bug that the duplicated damage pipeline (REFACTOR_PLAN.md → Refactor A) keeps producing. Expect similar bugs the next time someone adds a new damage source unless A is done first.

---

### `chain_lightning` spell is reachable in the SPELLS registry but unreachable in the tree

**Severity:** Low.

The Storm tier-2 unlock used to be Chain Lightning. It was replaced with Storm Cloud (which is mechanically distinct rather than "Lightning Bolt with bigger numbers"). The Chain Lightning spell entry is still in the SPELLS registry — kept for backwards compat in case anything (logger, save data) references the spell ID — but no skill tree node grants it anymore.

If you decide it's truly dead, remove the entry from SPELLS and update the SPELL_ICONS map.

---

### The kamikaze contact damage tuning was implicitly tuned for desktop window size

**Severity:** Was high; somewhat mitigated.

Earlier in development, before the desktop frame was capped at 480×900, the difficulty curve was (unwittingly) tuned against a much larger desktop window. Spells covered a smaller fraction of the larger world, but enemies traveled a larger absolute distance, so things felt different than on phones. Now that the desktop frame matches phone dimensions, the curves align — but a few inherited numbers may still be calibrated to the old assumption. Watch for "wave 8 is suddenly harder than wave 7" cliffs and tune from TUNING.md.

---

## UI / UX issues

### Modal stat preview doesn't include all spell-specific bits

**Severity:** Low — current doc says "improvable, not broken."

The modal shows current effective values for stat talents (`Currently: +40% damage`). For spell unlock nodes, it shows the base stats from the description string but doesn't compute current effective stats with the player's existing talents.

E.g., if you've taken Heat 2/3, opening the Fireball modal still shows "18 dmg + 11 splash" rather than your effective "25 dmg + 15 splash."

**Fix path:** REFACTOR_PLAN.md → Refactor B. After spell base stats become data, the modal can call `spell.describeStats(playerState)` to render live effective numbers.

---

### "Will replace" indicator on item screen only shows when both slots are full

**Severity:** Low — works correctly, but the feedback could be clearer.

Right now, if you have 1 empty slot and 1 filled slot, the new item goes into the empty slot — no replacement, no indicator. Good. If both are filled, the new item replaces slot 0. Clear indicator on slot 0. Also good.

But: there's no way for the player to choose **which** slot to overwrite. They get whichever gets picked by the slot-finding logic.

**Fix path (if desired):** Make the item screen show new items as "drag onto the slot you want to replace." Probably not worth doing — adds complexity for marginal benefit. Note for future consideration.

---

### Skill tree screen scroll behavior on small phones

**Severity:** Low — not currently broken, but watch out.

The tree screen has fixed-position TP/SP pills at the top and a fixed Continue button at the bottom, with the scrollable content area in between. On very tall phones (or when the address bar collapses on iOS), the scrollable area can become cramped. Multiple iOS Safari `100dvh` / `100vh` workarounds are in place. Test on real devices when changing the layout.

---

### Talent chip rank badge ("2/3") can be hard to read on the smallest phones

**Severity:** Low.

The rank badge is small and uses JetBrains Mono at 10px. On dense screens this is fine; on lower-DPI ones it can look cramped. If accessibility is a concern, bump to 12px.

---

## Stability / robustness

### `takenNodes` was an array, now a `{nodeId: rank}` map

**Severity:** Was high during the refactor; now stable but a footgun.

Anything iterating with `for (const id of playerState.takenNodes)` will fail (objects aren't iterable). All known sites have been migrated to `for (const id in obj)` / `Object.keys(obj)`. But: any future contributor not aware of this might write the array-style loop and silently get nothing. Mentioned in ARCHITECTURE.md → "Where things commonly go wrong."

If you do Refactor C/D, double-check no new iteration site uses the old pattern.

---

### Restart bug: previously, dying at wave 8 and clicking "Try Again" started you at wave 9

**Severity:** Was high; now fixed.

`Game.startRun()` reset every entity list and the `playerState`, but didn't replace the `WaveManager` instance. So `waveMgr.wave` carried over from the dead run, and `afterChoice()` happily incremented to N+1.

Fixed by recreating `this.waveMgr = new WaveManager(this)` in startRun. Worth flagging because if anyone adds new state to WaveManager (a tracking variable for difficulty escalation, say), they need to either reset it in startWave OR make sure the constructor re-init covers it. Don't add WaveManager state that survives constructor — it'll regress this bug.

---

### Status payload mutation surface

**Severity:** Low.

`enemy.statuses[name]` is read-write across multiple sites — `applyStatus`, `tickEnemies`, `takeDamage`, `dealDamage` (after Refactor A). Currently nothing protects against weird mutation orderings (e.g., a status's `tick` deleting itself while being iterated). Frame-isolated effects haven't caused problems yet, but if effects start chaining (a spell that procs another spell that hits the same enemy) this could surface.

**Fix path:** After Refactor C, each status's tick should return a result object rather than directly mutate the status; merge happens in the registry walker.

---

### Save / persistence

**Severity:** Out of scope.

There is no save system. Closing the tab loses the run. This is intentional for a roguelite — runs are discrete. But if you ever add a save system, be aware that `playerState` is the source of truth (plus `Game.waveMgr.wave` for the wave counter, plus seed information for any RNG you add).

---

## Performance

No known issues. The game is canvas-based with simple shapes and runs at 60fps even on mid-range phones with full effects active. Watch for:
- Particle counts climbing too high if Refactor A inadvertently spawns more particles per damage tick (use `isDot: true` flag for tick-based damage to skip particle spawn).
- The cached background gets invalidated if world dims become non-integer. There's a comment in `setupCanvas` about this — don't accidentally remove the `Math.floor` calls.

---

## Things that look like bugs but aren't

### Lightning Bolt has "infinite range" but Fireball has finite range

This was previously a real inconsistency — Fireball would despawn before reaching spawn-edge enemies. Now fixed: Fireball speed bumped to 340 px/s, life 3.0s = 1020 unit range, which covers the full phone-shaped world. Both spells now reach anywhere a target can spawn.

### Frost Spike pierces backward sometimes

Frost Spike now targets the **farthest** enemy, not nearest. If the closest enemy is in front of you and the farthest is behind you, the spike flies "backward" relative to threat direction. This is intentional — it's the spell's identity (interceptor that pierces across the wave). If it feels wrong, the design could change to "nearest in the player's facing direction" but that requires the player to have a facing direction, which they currently don't (AFK character).

### Gravity Bolt no longer hits visible projectile

Gravity Bolt was a slow projectile in earlier builds. It's now a placed gravity well at the densest cluster. If a player tutorial / video references the old behavior, that's stale. Description in the tree currently reflects the new behavior.
