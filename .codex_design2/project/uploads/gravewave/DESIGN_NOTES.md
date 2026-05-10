# Gravewave — Design Notes

The reasoning behind the major design choices. Future contributors (human or AI) should read this before making big changes — knowing why something is the way it is helps push back on or extend choices intentionally rather than accidentally.

If a design decision turns out to be wrong, *change it* — but understand what it was solving for first.

---

## Two-currency progression (TP + SP)

**The choice:** Talent Points (TP, +1 per wave) buy small mods. Skill Points (SP, +1 per boss wave) buy big spell unlocks.

**The alternatives considered:**
- Single currency with all costs (1, 2, 3, 5, ...). Simpler but boring — every wave you either save or spend, with no structural reason to do either.
- Hades-style boon picks: random card draws every wave, no saved currency. Rejected because the player wanted *deterministic builds across runs* — same path = same options = real planning.

**Why two currencies:**
1. **Greed-vs-safety becomes mechanical.** Saving SP means weaker right-now (no new spell), but a tier-3 megaspell at wave 12 if you can survive that long. Spending immediately means more breadth, less depth.
2. **Wave 1 has interesting choices.** With 2 starter TP + 1 free spell, you immediately specialize. This was missing in the early "wave 1 = no choices" build.
3. **Boss waves matter more.** SP only comes from boss clears, so every 4th wave is mechanically distinct from a regular clear.

**When this would be wrong to keep:** If item drops or other reward channels become significant power axes, a third currency might be worth adding. But don't add a third casually — the current two are clear and the player can hold both totals in their head.

---

## WoW-style talent tree (vs random card draws)

**The choice:** A persistent, viewable tree per element. Tap a node, see what it does, decide whether to take it. Future nodes are visible above/below.

**The alternative:** Random card draws (Hades, Vampire Survivors, etc.) where every level-up shows you 3 random options.

**Why a tree:**
- Players asked for it explicitly: "I want to see future upgrades, not just text boxes" and "like the WoW talent tree."
- Determinism reduces frustration. In random-card games, getting the spell you wanted is luck-gated. In a tree, the same path = the same options.
- The tree is a *plan vehicle*. You can sketch out "I want to reach Pyroclasm by wave 16" and progress is visible.

**The cost of this choice:** Less variety run-to-run. The same spec build feels similar across runs. We mitigate this with item drops (random) layered on top of the deterministic tree.

**When this would be wrong:** If the meta becomes solved (one optimal path), the tree feels like a chore. The keystone forks (Pinpoint vs Storm Saturation, Conflagration vs Detonation) are the main lever for "actual decisions" — make sure they stay genuinely differentiated.

---

## Items kept random (every 5 waves)

**The choice:** While skills are deterministic, items are still RNG.

**Why:**
- The deterministic tree gives you the "build" fun. Items provide the "loot/discovery" fun. Both have value; mixing them gives both.
- Items are more powerful per-pick than talents, but rarer. Each item is a small build-shaping moment.
- Random items mean two runs with the same skill spec play differently because of which items showed up.

**Item screen now shows current loadout + "Will replace" indicator + Skip button.** This was a fix — the original UI silently overwrote a slot, leading to "wait, I didn't realize I'd lose my Stormcaller" complaints.

---

## Kamikaze enemy contact (vs gnaw / attrition)

**The choice:** Every enemy that touches the player deals one decisive hit, then dies.

**The alternative (older builds):** Enemies stay in melee range, dealing per-frame damage as long as they're touching you. Iframes prevent every-frame hits, but they still chip you down.

**Why kamikaze:**
- **Decisive feedback.** Every contact is a *visible event*, not a slow drain.
- **Better counterplay.** You can survive a wave by killing enemies *before* they reach you. Under attrition, even one mob breaching your perimeter would chunk your HP for the rest of the wave.
- **Enables boss design.** Bosses in attrition were uninteresting because reaching the player just turned into a DPS race. Kamikaze means a boss touching you is a real spike — telegraphed by the boss being slow.

**The cost:** Tuning is fragile. Each enemy's contact damage is now a single-shot value, not a per-tick value, so getting the numbers right matters more.

---

## AFK player (no movement)

**The choice:** Player is immobile in the world center. Aiming is automatic.

**Why:**
- Designed for mobile portrait. Adding a virtual joystick means making thumb-controlled movement feel good — a whole subgame Vampire Survivors solves elegantly with one analog stick on PC but is awkward on touch.
- "Roguelite where you build a witch and survive" focuses on build decisions, not twitch reflexes.
- The strategic axis is *what spells you have, what they target, when their cooldowns line up*. Movement would dilute that.

**The cost:** Some traditional roguelite tactics (kiting, spacing, dodging) are off the table. We compensate with iframes (0.85s) and Vigil tree's defensive options (dodge chance, damage reduction, reflect).

**When this would be wrong:** If you want to add a different character archetype (a Ranger that kites, a Warrior that charges), the AFK-only assumption is baked in. Player movement requires changing `Player.update`, the input system (currently zero touch handlers for movement), and rebalancing every spell's range/aim.

---

## Phone-shaped frame (480×900) on desktop

**The choice:** On desktop, the game container is capped at 480×900px and centered with a halo. Phones use `100vw × 100dvh`.

**Why:**
- The game is designed for portrait. Desktop play should be a fair representation of the phone experience, not a different game.
- Hidden bug protection: spell ranges, spawn distances, difficulty math were implicitly tuned against the phone-sized world. A larger desktop window made enemies travel further (taking more time to reach you) and spell ranges cover less of the world (different effective DPS). Capping desktop = removing this hidden inconsistency.

**Visual side effect:** Desktop has a noticeable "phone in a dark room" presentation. Some players might prefer fullscreen. If you want fullscreen, you'd need to redesign all the lane-based mechanics (Wall of Flame's horizontal sweep, top/bottom-only spawn) for arbitrary aspect ratios.

---

## Vertical-only spawn (top/bottom)

**The choice:** Enemies always spawn from the top or bottom edge. Hardcoded — doesn't matter what the aspect ratio is.

**Why:**
- Portrait-first design.
- Wall of Flame is a horizontal band — it's the natural counter to vertical lanes. Mechanic shape forces an interesting choice (use Wall of Flame to bisect the field).
- Predictable spawn means predictable countermeasures. Random side spawning would be more chaotic but would dilute the lane strategy.

**The cost:** No left/right drama. Some build identities (a "left side guardian" or similar) aren't expressible. Compensate with cluster vs nearest vs farthest targeting differentiation, which gives spells distinct *positional* roles within the vertical fight.

---

## Spell targeting differentiation (nearest / cluster / farthest)

**The choice:** Different spells target different things by default:
- Lightning Bolt: nearest
- Fireball: nearest
- Gravity Bolt: densest cluster
- Storm Cloud: densest cluster
- Frost Spike: farthest

**Why:**
- Without this, all spells dogpile the closest enemy. Multi-spell builds feel wasted because the second spell often hits an already-dead target.
- Cluster targeting makes Gravity feel like *gravity* (it pulls clusters into itself), Fire feel like *fire* (explosions on the nearest threat), Frost feel like *long-range pressure* (intercepting the back of the wave).

**When this would be wrong:** Without Refactor D (target priority hooks), this is dumb. Spells can't yet say "prefer ignited targets" or "prefer the boss." Real synergy is gated on D being done.

---

## Status-effect philosophy

**The current statuses are intentionally distinct in *role*:**

- **Slow** = control. Buys you time. Doesn't directly increase damage.
- **Ignite** = damage amp. Crits ignited targets. Doesn't directly slow them.
- **Shock** = burst amp. Single-use multiplier on next hit.
- **Freeze** (unused) = full stop. Reserved for hard CC.

The intent was for builds to combine these — stack slow + ignite to control AND amp at the same time. We don't yet have the targeting hooks to make these combos materialize. After Refactor D, the statuses become a real combo system.

---

## Why Storm Cloud replaced Chain Lightning

**The original tier-2 was Chain Lightning** — heavier, longer-range, more chains. Mechanically it was just "Lightning Bolt with bigger numbers and a longer cooldown." Players couldn't tell the two apart in play.

**Storm Cloud is mechanically distinct:**
- Lightning Bolt = instant, single trigger, hits nearest immediately on cooldown
- Storm Cloud = placed area, periodic strikes over 5+ seconds, applies Shock status

The *shape* of the spell is different. Storm Cloud doesn't compete with Lightning Bolt for casts — it sits on a long cooldown, deploys, then ticks while Lightning Bolt does its normal spam. **The two synergize**: Storm Cloud shocks targets (next storm hit deals +50%), and your Lightning Bolt cashes those shocks in.

**Lesson:** Tier-2 should be mechanically distinct from tier-1, not "tier-1 with bigger numbers." Apply this when designing future spells.

---

## Why Vigil tree (defense) is per-character, not universal

**The choice:** Vigil is one of the magician's 5 elemental trees, not a separate "defense tab" attached to all characters.

**Why:**
- Keeps the tree count consistent (5 trees per character).
- Makes "skip Vigil entirely" a real build choice. A pure Fire build with no Vigil takes more risk for more damage.
- Future characters (Ranger, Warrior) can have *their own* defensive tree (e.g., Warrior's "Iron" tree with armor, parry mechanics) instead of inheriting the magician's frail-mage defense.

**The cost:** Players can't grab a single defensive perk without committing to Vigil. If wave 8 is brutal because of one player who skipped Vigil entirely, that's the design saying "Vigil is mandatory after a certain point." We try to balance this with the wave-end heal (everyone gets it, regardless of Vigil), so a Vigil-less build is hard but not impossible.

---

## Why path-select grants tier-1 free + 2 starter TP

**The choice:** When you pick "Fire path" at run start, you get Fireball unlocked AND 2 talent points to spend before wave 1 starts.

**Why:**
- Wave 1 with no spells = unwinnable. Tier-1 free fixes that.
- Wave 1 with one bare-base tier-1 spell = brutal. Adding 2 starter TP lets you immediately spec into +40% damage on your one spell, making wave 1 actually winnable.
- The "spend before starting" moment is a flavor of "spec your character" that the WoW-style tree wants to lean into.

**Tuning lever:** If wave 1 still feels too hard, bump starter TP to 3. If wave 1 feels too easy, drop starter TP to 1.

---

## Modal popup pattern (vs inline descriptions)

**The choice:** Tap a node in the tree, a modal popup shows full description + current effective values + Learn button. Closing returns you to the tree.

**Why:**
- Compact tree. Each node is a chip with just the name. Without modals, descriptions inline would make the tree massive.
- Live stat preview. The modal can show "Currently: +40% damage / Next rank: +60% damage." Inline would have to choose between current OR next.
- Tap-feel. Modal is a deliberate "I'm investigating this" gesture vs accidentally hovering and reading 30 descriptions.

**The cost:** One extra tap to learn a node. We don't show all current effects "at a glance" — you have to tap each one. We have a quick fix planned (REFACTOR_PLAN.md → Refactor B) that adds an automatic stat preview to spell unlock cards.

---

## Comments are load-bearing

**The choice:** Most non-trivial code blocks have comments explaining the *why*, not the *what*. Some are quite long.

**Why:**
- This codebase has gone through ~5 major design pivots (random cards → tree, gnaw → kamikaze, single currency → two, etc.). Each pivot left "ghost decisions" in the code that are non-obvious.
- A future contributor (or future-you, or a Claude Code agent) can read the comment and understand the reasoning without spelunking through git history.
- Numbers especially — every magic number near a comment exists because we tuned it deliberately. Stripping the comment loses the calibration story.

**Don't strip these in refactors.** Update them when the underlying logic changes. If a comment describes outdated reasoning, fix the comment.

**When in doubt:** add a comment. Erring on the side of over-documentation has been the right call for this project.

---

## Why one file (vs split modules)

**The current state:** 5750 lines of `index.html`, all in one file.

**Why this is current:**
- Single-file HTML is the simplest distributable. Email it, host it on S3, double-click it locally — no build step, no module loading.
- For an iterative dev loop with Claude editing the file, one file = one place to look.

**Why this should change soon:**
- 5750 lines is past the comfort threshold for navigation.
- File is approaching the limit where edit collisions / search-and-replace mistakes become common.
- Once a Claude Code agent in VSCode picks this up, multi-file editing is much faster.

**See REFACTOR_PLAN.md → Refactor E** for a recommended split. Not urgent but worth doing before adding much more content.
