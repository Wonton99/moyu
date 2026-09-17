import { UPGRADES, rarityRank, rarityOf } from './constants.js?v=cb51554320';
import { shuffle } from './utils.js?v=cb51554320';
import { rollCurseChoice } from './relics.js?v=cb51554320';

export function essenceToLevel(level) {
  // 开局偏快：清完第一房通常能升 1 级
  return 10 + (level - 1) * 12;
}

export function upgradeAvailable(u, player, excluded) {
  if (u.curse) return true;
  if (excluded && excluded.has(u.id)) return false;
  if (!player || !player.skills) return true;
  if (u.unlock && player.skills[u.unlock]) return false;
  if (u.requires && !player.skills[u.requires]) return false;
  return true;
}

function sortByRarity(list) {
  return list.slice().sort((a, b) => {
    const ra = rarityRank(rarityOf(a));
    const rb = rarityRank(rarityOf(b));
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name, 'zh');
  });
}

/** Weighted pick: rarer unlocks appear more when locked */
function pickUnlock(unlocks) {
  if (!unlocks.length) return null;
  const weighted = [];
  for (const u of unlocks) {
    const r = rarityOf(u);
    const w = r === 'red' ? 3 : r === 'gold' ? 4 : r === 'purple' ? 5 : r === 'blue' ? 3 : 2;
    for (let i = 0; i < w; i++) weighted.push(u);
  }
  return weighted[Math.floor(Math.random() * weighted.length)];
}

export function rollUpgradeChoices(player, excluded) {
  const available = UPGRADES.filter((u) => upgradeAvailable(u, player, excluded));
  const unlocks = available.filter((u) => u.unlock);
  const normals = available.filter((u) => !u.unlock && !u.curse);

  const picks = [];
  if (unlocks.length && Math.random() < 0.85) {
    const u = pickUnlock(unlocks);
    if (u) picks.push(u);
  }
  const rest = shuffle(picks.length ? normals : available.filter((u) => !u.curse));
  for (const u of rest) {
    if (picks.length >= 3) break;
    if (!picks.find((p) => p.id === u.id)) picks.push(u);
  }
  if (picks.length < 3) {
    for (const u of shuffle(available.filter((x) => !x.curse))) {
      if (picks.length >= 3) break;
      if (!picks.find((p) => p.id === u.id)) picks.push(u);
    }
  }
  // 展示顺序：红 > 金 > 紫 > 蓝 > 白
  return sortByRarity(picks).slice(0, 3);
}

/** Chance to inject one curse card into the 3 choices (from Lv3+) */
export function maybeCurseInChoices(choices, level) {
  if (level < 3) return choices;
  if (Math.random() > 0.28) return choices;
  const curse = rollCurseChoice();
  if (!curse) return choices;
  const idx = Math.floor(Math.random() * choices.length);
  choices[idx] = {
    id: curse.id,
    name: curse.name,
    desc: curse.desc,
    curse: true,
    rarity: 'red',
    apply: curse.apply,
  };
  // keep display order after inject
  const sorted = sortByRarity(choices);
  choices.length = 0;
  for (const c of sorted) choices.push(c);
  return choices;
}

export function applyUpgrade(player, upgradeId) {
  const u = UPGRADES.find((x) => x.id === upgradeId);
  if (!u) return false;
  if (!upgradeAvailable(u, player)) return false;
  u.apply(player);
  return true;
}

export { rarityOf, rarityRank };
