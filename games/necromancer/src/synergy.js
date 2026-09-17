/** Summon synergies & evolution */
export const SYNERGIES = [
  {
    id: 'bone_legion',
    name: '白骨军团',
    need: ['skeleton', 'skeleton', 'skeleton'],
    desc: '≥3 骷髅：全体召唤伤害 +15%',
    check: (summons) => summons.filter((s) => s.typeId === 'skeleton').length >= 3,
    apply: (p) => { p.summonDmgMul *= 1.15; },
  },
  {
    id: 'feast',
    name: '饕餮',
    need: ['ghoul', 'ghoul'],
    desc: '≥2 食尸鬼：击杀额外 +1 生命',
    check: (summons) => summons.filter((s) => s.typeId === 'ghoul').length >= 2,
    apply: (p) => { p.bloodHeal = (p.bloodHeal || 2) + 1; p.skills.blood = true; },
  },
  {
    id: 'veil',
    name: '幽幕',
    need: ['wraith', 'wraith'],
    desc: '≥2 幽魂：精华获取 +20%',
    check: (summons) => summons.filter((s) => s.typeId === 'wraith').length >= 2,
    apply: (p) => { p.essenceMul = (p.essenceMul || 1) * 1.2; },
  },
  {
    id: 'mixed_host',
    name: '混编军势',
    need: ['skeleton', 'ghoul', 'wraith'],
    desc: '三类齐全：召唤上限 +1',
    check: (summons) => {
      const set = new Set(summons.map((s) => s.typeId));
      return set.has('skeleton') && set.has('ghoul') && set.has('wraith');
    },
    apply: (p) => { p.maxSummons += 1; },
  },
];

export const EVOLUTIONS = {
  skeleton: { count: 3, into: 'eliteUndead', name: '骸骨统领' },
  ghoul: { count: 3, into: 'eliteUndead', name: '狂暴食尸鬼王' },
  wraith: { count: 3, into: 'eliteUndead', name: '幽魂君主' },
};

export function activeSynergies(summons) {
  return SYNERGIES.filter((s) => s.check(summons));
}

export function applySynergies(player, summons) {
  const acts = activeSynergies(summons);
  for (const s of acts) s.apply(player);
  return acts.map((s) => s.name);
}

/** Try evolve same-type stacks; returns list of messages */
export function tryEvolve(summons, player, game) {
  const msgs = [];
  const byType = {};
  for (const s of summons) {
    if (!s.alive) continue;
    byType[s.typeId] = byType[s.typeId] || [];
    byType[s.typeId].push(s);
  }
  for (const [typeId, list] of Object.entries(byType)) {
    const evo = EVOLUTIONS[typeId];
    if (!evo || list.length < evo.count) continue;
    const keep = list[0];
    for (let i = 1; i < evo.count; i++) list[i].alive = false;
    keep.typeId = evo.into;
    keep.name = evo.name;
    keep.r = 15;
    keep.hp = Math.max(keep.hp, 80);
    keep.maxHp = Math.max(keep.maxHp, 80);
    keep.dmg = Math.round(keep.dmg * 1.35);
    keep.baseDmg = keep.dmg;
    if (game?.sfx) game.sfx.relic();
    if (game?.fx) {
      // light flash via message
    }
    msgs.push(`进化·${evo.name}`);
  }
  return msgs;
}
