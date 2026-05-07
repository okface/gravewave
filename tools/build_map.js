#!/usr/bin/env node
/*
 * BUILD MAP generator.
 *
 * Reads ../index.html (or ./index.html), evaluates the inline <script>
 * in a sandbox, pulls every game registry (CHARACTERS, PATHS,
 * CONSTELLATIONS, CARDS, SPELL_TREES, SPELLS, ITEMS, ENEMIES,
 * SPELL_DAMAGE_TYPES, AFFINITY_TIERS), and prints a structured
 * BUILD_MAP.md to ../BUILD_MAP.md (or ./BUILD_MAP.md).
 *
 * Use this as a planning surface — drop your design notes directly in
 * the markdown next to the relevant table, then regenerate when the
 * code changes (your suggestion comments survive only if you keep them
 * in a separate "Notes" section at the bottom — the body is overwritten).
 *
 * Run:    node tools/build_map.js
 * Output: BUILD_MAP.md  (replaces existing file)
 */
'use strict';
const fs = require('fs');
const path = require('path');

// ---------- Locate the source HTML next to this script ----------
const repoRoot = path.resolve(__dirname, '..');
const htmlPath = path.join(repoRoot, 'index.html');
if (!fs.existsSync(htmlPath)) {
  console.error('index.html not found at', htmlPath);
  process.exit(1);
}
const html = fs.readFileSync(htmlPath, 'utf8');
const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error('Could not find inline <script> in index.html');
  process.exit(1);
}

// ---------- Sandbox: stub browser globals so the script can be eval'd ----------
const stubEl = () => ({
  classList: { add(){}, remove(){}, toggle(){}, contains: () => false },
  addEventListener(){}, setAttribute(){}, removeAttribute(){},
  appendChild(){}, querySelector: () => null, querySelectorAll: () => [],
  style: { setProperty(){} }, dataset: {}, innerHTML: '', textContent: '',
});
global.window = { addEventListener: () => {}, devicePixelRatio: 1 };
global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  createElement: stubEl,
  addEventListener(){},
};
global.performance = { now: () => 0 };
global.requestAnimationFrame = () => {};
global.cancelAnimationFrame = () => {};

// ---------- Eval the script in our sandbox (skip main() so no game loop) ----------
const body = scriptMatch[1].replace(/main\(\);/, '');
const expose = `\nreturn {
  CHARACTERS, PATHS, CONSTELLATIONS, CARDS, SPELL_TREES, SPELLS,
  ITEMS, ENEMIES, SPELL_DAMAGE_TYPES, AFFINITY_TIERS,
};`;
let registries;
try {
  registries = new Function(body + expose)();
} catch (e) {
  console.error('Failed to evaluate index.html script:', e.message);
  process.exit(1);
}
const { CHARACTERS, PATHS, CONSTELLATIONS, CARDS, SPELL_TREES, SPELLS,
        ITEMS, ENEMIES, SPELL_DAMAGE_TYPES, AFFINITY_TIERS } = registries;

// ---------- Helpers ----------
const AXIS_TAG = { damage: '⚔', utility: '◇', defense: '🛡', greed: '🜚' };
const TIER_TAG = { 1: 'T1', 2: 'T2', 3: 'T3' };

function escapeMd(s) {
  if (s == null) return '';
  return String(s)
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .replace(/  +/g, ' ');
}

function effectSummary(c) {
  // Compact one-line mechanical readout pulled from c.effect — separate
  // from the desc so designers can spot the raw numbers at a glance.
  const ef = c.effect || {};
  const parts = [];
  const add = (label, value, fmt) =>
    value != null && parts.push(`${label} ${fmt ? fmt(value) : value}`);
  add('dmg', ef.dmgMult,           v => `+${Math.round(v * 100)}%`);
  add('global dmg', ef.globalDmgMult, v => `×${v.toFixed(2)}`);
  add('radius', ef.radiusMult,     v => `+${Math.round(v * 100)}%`);
  add('cd', ef.cdMult,             v => `${Math.round(v * 100)}%`);
  add('crit', ef.critChance,       v => `+${Math.round(v * 100)}%`);
  add('critChanceBonus', ef.critChanceBonus, v => `+${Math.round(v * 100)}%`);
  add('critMultBonus',   ef.critMultBonus,   v => `+${Math.round(v * 100)}%`);
  add('pierce', ef.pierceBonus,    v => `+${v}`);
  add('chain',  ef.chainBonus,     v => `+${v}`);
  add('HP', ef.hpBonus,            v => `+${v}`);
  add('reduction', ef.dmgReductionBonus, v => `+${Math.round(v * 100)}%`);
  add('dodge', ef.dodgeChance,     v => `+${Math.round(v * 100)}%`);
  add('reflect', ef.reflectFactor, v => `+${Math.round(v * 100)}%`);
  add('heal/kill', ef.healPerKill, v => `+${v}`);
  add('waveHeal', ef.waveHealBonus, v => `+${Math.round(v * 100)}%`);
  add('vsFrozen', ef.dmgVsFrozen,  v => `+${Math.round(v * 100)}%`);
  add('vsHigh',   ef.dmgVsHigh,    v => `+${Math.round(v * 100)}%`);
  if (ef.unlockSpell) parts.push(`unlocks: ${ef.unlockSpell}`);
  if (ef.spawnSentinelCrow) parts.push('spawn-sentinel');
  if (ef.pact) parts.push(`pact:${ef.pact}`);
  if (ef.keystone?.modAdjust) {
    const a = ef.keystone.modAdjust;
    if (a.dmgMult)    parts.push(`KEY ×${a.dmgMult} dmg`);
    if (a.radiusMult) parts.push(`KEY ×${a.radiusMult} r`);
  }
  if (ef.keystone?.behavior) {
    parts.push('behavior: ' + Object.keys(ef.keystone.behavior).join(','));
  }
  if (ef.behavior) parts.push('behavior: ' + Object.keys(ef.behavior).join(','));
  if (ef.applyStatus) {
    parts.push('status: ' + Object.keys(ef.applyStatus).join(','));
  }
  if (ef.castDmgRamp)   parts.push(`ramp +${ef.castDmgRamp.perCast*100}%/cast cap +${ef.castDmgRamp.cap*100}%`);
  if (ef.noHitDmgRamp)  parts.push(`noHitRamp +${ef.noHitDmgRamp.perSecond*100}%/s cap +${ef.noHitDmgRamp.cap*100}%`);
  if (ef.defenseHubMult) parts.push(`hub +${Math.round(ef.defenseHubMult*100)}%/Def card`);
  if (ef.missingHpMult) parts.push(`hub +${Math.round(ef.missingHpMult*100)}%/10% missing HP`);
  if (ef.greedHubMult)  parts.push(`hub +${Math.round(ef.greedHubMult*100)}%/Greed card`);
  if (ef.utilityReductionHub) parts.push(`hub +${Math.round(ef.utilityReductionHub*100)}% red/Util card`);
  if (ef.universalPierce) parts.push(`+${ef.universalPierce} pierce all proj`);
  if (ef.universalChain)  parts.push(`+${ef.universalChain} chain all`);
  if (ef.focusCapBonus) parts.push(`+${ef.focusCapBonus} Focus cap`);
  if (ef.focusGraceBonus) parts.push(`+${ef.focusGraceBonus}s Focus grace`);
  if (ef.cloneAttackRateMult) parts.push(`+${Math.round(ef.cloneAttackRateMult*100)}% clone speed`);
  if (ef.cloneHpBonus) parts.push(`+${ef.cloneHpBonus} clone HP`);
  if (ef.cloneDurationMult) parts.push(`+${Math.round(ef.cloneDurationMult*100)}% clone duration`);
  if (ef.trapDurationMult)  parts.push(`+${Math.round(ef.trapDurationMult*100)}% trap dur`);
  return parts.length ? parts.join('; ') : '—';
}

function cardRow(c) {
  if (!c) return '`?` | — | — | — | — | (missing card def) |';
  const id = '`' + c.id + '`';
  const name = escapeMd(c.name);
  const axis = (AXIS_TAG[c.axis] || '·') + ' ' + (c.axis || '?');
  const tier = TIER_TAG[c.tier || 1];
  const cls = c.classes ? c.classes.join('+') : 'all';
  const eff = escapeMd(effectSummary(c));
  const desc = escapeMd(c.desc || '');
  return `${id} | ${name} | ${axis} | ${tier} | ${cls} | ${eff} | ${desc}`;
}

const TABLE_HEAD = '| id | name | axis | tier | class | effect | desc |';
const TABLE_SEP  = '|---|---|---|---|---|---|---|';

// ---------- Build the markdown ----------
const out = [];
out.push('# Gravewave — Build Map');
out.push('');
out.push('> Auto-generated from `index.html` by `tools/build_map.js`.');
out.push('> Run `node tools/build_map.js` to regenerate after code changes.');
out.push('');
out.push('## Conventions');
out.push('');
out.push('- **Axis** — every card carries one of:');
out.push('  - ⚔ **damage** — straight damage / crit');
out.push('  - ◇ **utility** — pierce, chain, CDR, status effects, behavior shifts');
out.push('  - 🛡 **defense** — HP, reduction, dodge, reflect, healing');
out.push('  - 🜚 **greed** — ramps, synergy hubs, scaling minions, pacts');
out.push('- **Tier** — `T1` (always offered), `T2` (from wave 3+), `T3` (from wave 7+).');
out.push('- **bossOnly** — capstones / pacts only offered on boss waves unless their');
out.push('  branch is fully advanced (then they unlock as the earned payoff).');
out.push('- **Path** — gravity / electricity / fire / frost (magician); steel / shadow /');
out.push('  arsenal (ninja). Plus `universal` and `vigil` (defense-cluster cards).');
out.push('- **Branch** — each path has TWO branches (matching its keystone fork).');
out.push('  Filling 4 branch advance cards unlocks the capstone.');
out.push('');
out.push('## Active picker UIs');
out.push('');
out.push('- `UI.showSpellRank` — primary picker. After each wave clear, shows ONE');
out.push('  panel per owned spell with a rank pip strip + 3 mutex picks. Spec');
out.push('  milestones at rank-4 and rank-8 (the rank4Specs / rank8Specs lists).');
out.push('- `UI.showSpellUnlock` — when the player crosses a wave threshold and');
out.push('  is offered a NEW spell unlock.');
out.push('- `UI.showAtlas` — legacy "More cards" fallback. Static map of every');
out.push('  card the player can take (branch + universal). Reachable from a button');
out.push('  on the rank picker.');
out.push('');

// ============================================================
// Damage types + Affinity
// ============================================================
out.push('## Damage Types & Affinity');
out.push('');
out.push('Every spell carries one of three damage types. Enemy resists table');
out.push('reads from this. Killing with a type stacks affinity which auto-');
out.push('grants tier rewards in `computeSpellMods`.');
out.push('');
out.push('| spell | damage type |');
out.push('|---|---|');
const dts = SPELL_DAMAGE_TYPES || {};
for (const id of Object.keys(dts).sort()) {
  out.push(`| \`${id}\` | ${dts[id]} |`);
}
out.push('');
if (AFFINITY_TIERS && AFFINITY_TIERS.length) {
  out.push('### Affinity tiers');
  out.push('');
  out.push('| kills | tier | reward |');
  out.push('|---|---|---|');
  const rewardCopy = {
    tier1: '+8% damage of that type',
    tier2: 'Hits apply baseline status (physical bleed / elemental ignite / arcane slow)',
    tier3: '+20% crit chance, +30% crit damage of that type',
  };
  for (let i = 0; i < AFFINITY_TIERS.length; i++) {
    const t = AFFINITY_TIERS[i];
    out.push(`| ${t.kills} | T${i + 1} | ${rewardCopy[t.bonus] || t.bonus} |`);
  }
  out.push('');
}

// ============================================================
// Characters & Paths
// ============================================================
out.push('## Characters & Paths');
out.push('');
for (const charId of Object.keys(CHARACTERS)) {
  const ch = CHARACTERS[charId];
  out.push(`### ${ch.name} (\`${charId}\`)`);
  out.push('');
  out.push(`- **Title**: ${ch.title || '—'}`);
  out.push(`- **Base HP**: ${ch.stats?.maxHp ?? '?'}`);
  if (ch.description) {
    out.push(`- **Vibe**: ${escapeMd(ch.description)}`);
  }
  const charPaths = Object.values(PATHS || {}).filter(p => p.charId === charId);
  if (charPaths.length) {
    out.push('');
    out.push('| path | starter spell | flavor |');
    out.push('|---|---|---|');
    for (const p of charPaths) {
      out.push(`| **${p.name}** (\`${p.id}\`) | \`${p.starterSpell}\` | ${escapeMd(p.description || '')} |`);
    }
  }
  out.push('');
}

// ============================================================
// Per-spell trees (the active picker registry)
// ============================================================
out.push('## Spell Trees (`SPELL_TREES` — per-spell rank picker)');
out.push('');
out.push('Each owned spell has its own rank track. Rank-4 surfaces the first');
out.push('mutex spec (3 options); rank-8 surfaces the second. Non-milestone');
out.push('ranks draw 3 fillers from `fillerPool`.');
out.push('');
const spellTrees = SPELL_TREES || {};
for (const spellId of Object.keys(spellTrees)) {
  const t = spellTrees[spellId];
  const spell = SPELLS[spellId];
  out.push(`### ${t.icon || ''} ${t.name || spellId} \`${spellId}\``);
  out.push('');
  if (spell) {
    const dt = SPELL_DAMAGE_TYPES?.[spellId] || '?';
    out.push(`- Tree: \`${spell.tree || '—'}\` · CD: ${spell.cooldown}s · Type: \`${dt}\``);
  }
  if (t.fillerPool && t.fillerPool.length) {
    out.push('');
    out.push('**Filler pool** — drawn at non-milestone ranks (1-3, 5-7).');
    out.push('');
    out.push(TABLE_HEAD);
    out.push(TABLE_SEP);
    for (const id of t.fillerPool) out.push('| ' + cardRow(CARDS[id]) + ' |');
  }
  if (t.rank4Specs && t.rank4Specs.length) {
    out.push('');
    out.push('**Rank-4 specs** (mutex — pick ONE):');
    out.push('');
    out.push(TABLE_HEAD);
    out.push(TABLE_SEP);
    for (const id of t.rank4Specs) out.push('| ' + cardRow(CARDS[id]) + ' |');
  }
  if (t.rank8Specs && t.rank8Specs.length) {
    out.push('');
    out.push('**Rank-8 specs** (mutex — pick ONE):');
    out.push('');
    out.push(TABLE_HEAD);
    out.push(TABLE_SEP);
    for (const id of t.rank8Specs) out.push('| ' + cardRow(CARDS[id]) + ' |');
  } else if (t.rank4Specs && t.rank4Specs.length) {
    out.push('');
    out.push('_Rank-8 specs: none authored yet — picker falls back to fillers past rank 4._');
  }
  out.push('');
}

// ============================================================
// Constellations (legacy 2-branch atlas, still rendered as fallback)
// ============================================================
if (CONSTELLATIONS && Object.keys(CONSTELLATIONS).length) {
  out.push('## Constellations (`CONSTELLATIONS` — atlas fallback)');
  out.push('');
  out.push('Used by `UI.showAtlas` (the "More cards" fallback). Each path has');
  out.push('two branches with 4 advance cards + 1 capstone.');
  out.push('');
  for (const pathId of Object.keys(CONSTELLATIONS)) {
    const c = CONSTELLATIONS[pathId];
    out.push(`### ${pathId.toUpperCase()} — \`${pathId}\``);
    out.push(`Starter spell: \`${c.starterSpell || '?'}\``);
    out.push('');
    for (const branch of Object.values(c.branches || {})) {
      out.push(`#### ${branch.icon || ''} ${branch.name} (\`${branch.id}\`)`);
      if (branch.flavor) out.push(`> _${branch.flavor}_`);
      out.push('');
      out.push(TABLE_HEAD);
      out.push(TABLE_SEP);
      for (const id of (branch.cards || [])) out.push('| ' + cardRow(CARDS[id]) + ' |');
      const capCard = CARDS[branch.capstone];
      if (capCard) {
        out.push('| ' + cardRow({ ...capCard, name: '★ ' + capCard.name + ' (capstone)' }) + ' |');
      }
      out.push('');
    }
  }
}

// ============================================================
// Universal pool (axis-grouped)
// ============================================================
out.push('## Universal Pool');
out.push('');
out.push('Cards available to any class regardless of path. Shown in the');
out.push('atlas fallback under the Universal rail.');
out.push('');
const byAxis = { damage: [], utility: [], defense: [], greed: [] };
for (const c of Object.values(CARDS)) {
  if (c.pathTag !== 'universal') continue;
  if (byAxis[c.axis]) byAxis[c.axis].push(c);
}
for (const axis of ['damage', 'utility', 'defense', 'greed']) {
  if (!byAxis[axis].length) continue;
  out.push(`### ${AXIS_TAG[axis]} ${axis.charAt(0).toUpperCase() + axis.slice(1)} (${byAxis[axis].length})`);
  out.push('');
  out.push(TABLE_HEAD);
  out.push(TABLE_SEP);
  for (const c of byAxis[axis]) out.push('| ' + cardRow(c) + ' |');
  out.push('');
}

// ============================================================
// Synergy hubs caps
// ============================================================
out.push('## Synergy Hubs — Caps');
out.push('');
out.push('Hubs compound but every one is hard-capped. Worst-case stack post-');
out.push('caps is ~×3.7 base damage (was ×5.6 pre-cap). Caps live in');
out.push('`Game._computeGreedMult` and `computePlayerStats`.');
out.push('');
out.push('| card | per-step | cap |');
out.push('|---|---|---|');
out.push('| Old Coin (`g_old_coin`) | +0.5%/cast | +25% |');
out.push('| Patient Steel (`g_patient_steel`) | +6%/sec no-hit (4s grace) | +25% |');
out.push('| Iron Discipline (`g_iron_discipline`) | +4%/Defense card | +24% |');
out.push('| Bloodbound Ledger (`g_bloodbound`) | +5%/10% missing HP | +30% |');
out.push("| Warden's Mantra (`g_warden_mantra`) | +2% reduction/Util card | +10% |");
out.push('| Resonance (`g_resonance`) | +4%/OTHER Greed card | +20% |');
out.push('| Pact of Glass (`p_glass`) | flat | +30% |');
out.push('');

// ============================================================
// Items (class-tagged)
// ============================================================
out.push('## Items');
out.push('');
out.push('Equipment slots (max 2). Item drop on every 5th wave + starter pick.');
out.push('`classes` whitelist filters offers per character.');
out.push('');
out.push('| id | name | rarity | classes | description |');
out.push('|---|---|---|---|---|');
for (const it of Object.values(ITEMS || {})) {
  const cls = it.classes ? it.classes.join('+') : 'all';
  out.push(`| \`${it.id}\` | ${escapeMd(it.name)} | ${it.rarity} | ${cls} | ${escapeMd(it.description || '')} |`);
}
out.push('');

// ============================================================
// Enemies + resistances
// ============================================================
out.push('## Enemies & Resistances');
out.push('');
out.push('| id | name | hp | speed | dmg | minWave | resists (P/E/A) | special |');
out.push('|---|---|---|---|---|---|---|---|');
for (const e of Object.values(ENEMIES || {})) {
  const r = e.resists || {};
  const rs = `${(r.physical ?? 1).toFixed(2)} / ${(r.elemental ?? 1).toFixed(2)} / ${(r.arcane ?? 1).toFixed(2)}`;
  const special = [];
  if (e.boss) special.push('boss');
  if (e.dodgeChance) special.push(`${Math.round(e.dodgeChance * 100)}% projectile dodge`);
  if (e.kind === 'ranged') special.push('ranged caster');
  if (e.statusVulnerable) special.push(`+${Math.round((e.statusVulnerable - 1) * 100)}% if status'd`);
  if (e.group) special.push(`groups of ${e.group.min}-${e.group.max}`);
  out.push(`| \`${e.id}\` | ${e.name} | ${e.hp} | ${e.speed} | ${e.damage} | ${e.minWave} | ${rs} | ${special.join('; ') || '—'} |`);
}
out.push('');

// ============================================================
// Coverage stats
// ============================================================
out.push('## Coverage Stats');
out.push('');
out.push('Sanity-check counts so you can see at a glance whether a path is');
out.push('thin or rich.');
out.push('');
out.push('| set | count |');
out.push('|---|---|');
out.push(`| total cards | ${Object.keys(CARDS).length} |`);
out.push(`| spells | ${Object.keys(SPELLS).length} |`);
out.push(`| items | ${Object.keys(ITEMS || {}).length} |`);
out.push(`| enemies | ${Object.keys(ENEMIES || {}).length} |`);
out.push(`| paths | ${Object.keys(PATHS || {}).length} |`);
out.push(`| spell trees | ${Object.keys(SPELL_TREES || {}).length} |`);
const universalCount = Object.values(CARDS).filter(c => c.pathTag === 'universal').length;
out.push(`| universal cards | ${universalCount} |`);
const byPath = {};
for (const c of Object.values(CARDS)) {
  if (!c.pathTag || c.pathTag === 'universal' || c.pathTag === 'vigil') continue;
  byPath[c.pathTag] = (byPath[c.pathTag] || 0) + 1;
}
for (const [p, n] of Object.entries(byPath)) {
  out.push(`| path \`${p}\` cards | ${n} |`);
}
out.push('');

// ============================================================
// Suggestions area — preserved when regenerating? No: full overwrite.
// User can keep their notes in a sibling file (BUILD_NOTES.md) or below.
// ============================================================
out.push('## Notes & Suggestions');
out.push('');
out.push('> This section is overwritten on every regen. To keep notes between');
out.push('> regenerations, drop them in a sibling file (e.g. `BUILD_NOTES.md`)');
out.push('> instead of here.');
out.push('');
out.push('Use this space (and rerun the generator after) to plan additions:');
out.push('');
out.push('- [ ] _new card / spell / enemy idea_');
out.push('- [ ] _balance concern (cite card id)_');
out.push('- [ ] _missing branch coverage_');
out.push('');

// ---------- Write ----------
const outPath = path.join(repoRoot, 'BUILD_MAP.md');
fs.writeFileSync(outPath, out.join('\n'));
console.log('Wrote', outPath, '(' + out.length + ' lines)');
