/**
 * 天赋共鸣：集齐指定天赋后自动解锁强力加成（无「流派」卡）。
 * check(player) 返回 true 时触发一次 apply(player)，并写入 player._masteries[id]。
 */
export const MASTERIES = [
  {
    id: 'bone_master',
    name: '骨矛共鸣',
    desc: '骨矛伤害 +20%，穿透 +1',
    need: ['twin', 'auto'],
    check: (p) => p.skills.twin && p.skills.auto,
    apply: (p) => {
      p.spearDmg = Math.round(p.spearDmg * 1.2);
      p.spearPierce = (p.spearPierce || 0) + 1;
    },
  },
  {
    id: 'horde_master',
    name: '亡者共鸣',
    desc: '召唤伤 +25%，上限 +1',
    need: ['raise', 'army'],
    check: (p) => p.skills.raise && p.skills.army,
    apply: (p) => {
      p.summonDmgMul *= 1.25;
      p.maxSummons += 1;
    },
  },
  {
    id: 'blood_master',
    name: '血肉共鸣',
    desc: '击杀回血翻倍，最大生命 +15',
    need: ['blood', 'armor'],
    check: (p) => p.skills.blood && p.skills.armor,
    apply: (p) => {
      p.bloodHeal = (p.bloodHeal || 2) * 2;
      p.maxHp += 15;
      p.hp += 15;
    },
  },
  {
    id: 'void_master',
    name: '虚空共鸣',
    desc: '尸爆范围 +30%，回蓝 +50%',
    need: ['boom', 'harvest'],
    check: (p) => p.skills.boom && p.skills.harvest,
    apply: (p) => {
      p.boomRadius *= 1.3;
      p.boomDmg *= 1.1;
      p.mpRegen *= 1.5;
    },
  },
  {
    id: 'veil_master',
    name: '幽幕共鸣',
    desc: '光环减速更强，移速 +8%',
    need: ['curse', 'dash'],
    check: (p) => p.skills.curse && p.skills.dash,
    apply: (p) => {
      p.curseSlow = Math.max(p.curseSlow, 0.45);
      p.curseRadius += 15;
      p.speed *= 1.08;
    },
  },
  {
    id: 'storm_master',
    name: '风暴共鸣',
    desc: '骨矛弹射 +1，环绕骨刺 +1',
    need: ['orbit', 'twin'],
    check: (p) => p.skills.orbit && p.skills.twin,
    apply: (p) => {
      p.spearBounce = (p.spearBounce || 0) + 1;
      p.orbitCount = (p.orbitCount || 0) + 1;
    },
  },
  {
    id: 'pact_master',
    name: '契约共鸣',
    desc: '契约消耗 -4，召唤伤 +15%',
    need: ['contract', 'raise'],
    check: (p) => p.skills.contract && p.skills.raise,
    apply: (p) => {
      p.summonDmgMul *= 1.15;
      // cheap contract handled via RANGES.neutralCost at interact — store on player
      p.contractDiscount = 4;
    },
  },
  {
    id: 'thorn_master',
    name: '棘甲共鸣',
    desc: '受击反伤 6，并再减伤 5%',
    need: ['armor', 'nova'],
    check: (p) => p.skills.armor && p.skills.nova,
    apply: (p) => {
      p.thorns = (p.thorns || 0) + 6;
      p.armorMul = Math.max(0.4, p.armorMul - 0.05);
    },
  },
];

/** Returns list of newly activated mastery names */
export function checkMasteries(player, game) {
  if (!player._masteries) player._masteries = {};
  const got = [];
  for (const m of MASTERIES) {
    if (player._masteries[m.id]) continue;
    if (!m.check(player)) continue;
    m.apply(player);
    player._masteries[m.id] = true;
    got.push(m.name);
    if (game) {
      game.message = `共鸣·${m.name}`;
      game.messageTime = 2.2;
      if (game.sfx) game.sfx.relic();
      if (game.fx) {
        game.fx.flashT = 0.15;
        game.fx.flashColor = '#ffd166';
      }
    }
  }
  return got;
}

export function activeMasteryNames(player) {
  if (!player?._masteries) return [];
  return MASTERIES.filter((m) => player._masteries[m.id]).map((m) => m.name);
}
