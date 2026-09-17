const KEY = 'necromancer_ach_v1';

export const ACHIEVEMENTS = [
  { id: 'first_blood', name: '初血', desc: '击杀 1 名敌人', },
  { id: 'kill_50', name: '屠戮', desc: '单局击杀 50', },
  { id: 'army_8', name: '亡者大军', desc: '召唤数达到 8', },
  { id: 'boss1', name: '掘墓人', desc: '击败第 1 层 Boss', },
  { id: 'win', name: '永夜征服', desc: '通关一次', },
  { id: 'raise_10', name: '炼尸宗师', desc: '单局炼尸 10 次', },
  { id: 'relic', name: '拾遗者', desc: '获得一件遗物', },
  { id: 'curse', name: '饮鸩', desc: '接受一张诅咒卡', },
  { id: 'skin', name: '换装师', desc: '购买/装备一款皮肤', },
  { id: 'daily', name: '日课', desc: '完成一局每日挑战', },
];

export function loadAch() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

export function saveAch(a) {
  try { localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* */ }
  return a;
}

/** Returns list of newly unlocked names */
export function grantAch(game, id) {
  const a = loadAch();
  if (a[id]) return [];
  a[id] = true;
  saveAch(a);
  const def = ACHIEVEMENTS.find((x) => x.id === id);
  const label = def ? `成就·${def.name}` : id;
  if (game) {
    game.message = label;
    game.messageTime = 2.5;
    game.fx = game.fx || { particles: [], shake: 0, hitPause: 0, flashT: 0 };
  }
  return [label];
}

export function checkRunAch(game) {
  const s = game.stats;
  if (s.kills >= 1) grantAch(game, 'first_blood');
  if (s.kills >= 50) grantAch(game, 'kill_50');
  if (s.raises >= 10) grantAch(game, 'raise_10');
  const alive = game.entities.summons.filter((x) => x.alive).length;
  if (alive >= 8 || game.player.maxSummons >= 8 && alive >= 8) grantAch(game, 'army_8');
  if (game.stats.bossKills >= 1) grantAch(game, 'boss1');
  if (game._gotRelic) grantAch(game, 'relic');
  if (game._gotCurse) grantAch(game, 'curse');
}
