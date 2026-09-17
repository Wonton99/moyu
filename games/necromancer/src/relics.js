/** Relics: unlimited stacks, world drops with rarity beam */
export const RELICS = [
  {
    id: 'bone_tooth', name: '碎骨牙', desc: '骨矛 +5，命中溅射 4 伤害', rarity: 'blue',
    apply: (p, g) => { p.spearDmg += 5; p.spearSplash = (p.spearSplash || 0) + 4; },
  },
  {
    id: 'grave_dirt', name: '墓土袋', desc: '尸体保留更久，炼尸耗蓝 -3', rarity: 'blue',
    apply: (p) => { p.corpseLifeMul = (p.corpseLifeMul || 1) * 1.5; p.raiseCost = Math.max(4, p.raiseCost - 3); },
  },
  {
    id: 'witch_eye', name: '巫眼', desc: '精华 +25%，吸附更快', rarity: 'purple',
    apply: (p) => { p.essenceMul = (p.essenceMul || 1) * 1.25; p.skills.harvest = true; },
  },
  {
    id: 'iron_rib', name: '铁肋骨', desc: '最大生命 +30', rarity: 'blue',
    apply: (p) => { p.maxHp += 30; p.hp += 30; },
  },
  {
    id: 'soul_bell', name: '魂铃', desc: '召唤伤害 +20%，上限 +1', rarity: 'purple',
    apply: (p) => { p.summonDmgMul *= 1.2; p.maxSummons += 1; },
  },
  {
    id: 'blood_vial', name: '血瓶', desc: '击杀回血 +1 并解锁血债', rarity: 'gold',
    apply: (p) => {
      p.skills.blood = true;
      p.bloodHeal = (p.bloodHeal || 2) + 1;
    },
  },
  {
    id: 'bone_spike', name: '骨钉', desc: '骨矛穿透 +1', rarity: 'purple',
    apply: (p) => { p.spearPierce = (p.spearPierce || 0) + 1; },
  },
  {
    id: 'echo_shard', name: '回响碎片', desc: '骨矛弹射 1 次', rarity: 'gold',
    apply: (p) => { p.spearBounce = (p.spearBounce || 0) + 1; },
  },
  {
    id: 'chain_urn', name: '连爆瓮', desc: '尸爆连锁更远', rarity: 'gold',
    apply: (p) => { p.boomRadius += 12; p.boomDmg *= 1.1; },
  },
  // Boss 专属
  {
    id: 'crown_bone', name: '白骨冠冕', desc: 'Boss专属：召唤伤 +40%，上限 +2', rarity: 'red', bossOnly: true,
    apply: (p) => { p.summonDmgMul *= 1.4; p.maxSummons += 2; },
  },
  {
    id: 'blood_heart', name: '污血之心', desc: 'Boss专属：最大生命 +50，击杀回 +3', rarity: 'red', bossOnly: true,
    apply: (p) => { p.maxHp += 50; p.hp += 50; p.skills.blood = true; p.bloodHeal = (p.bloodHeal || 2) + 3; },
  },
  {
    id: 'void_eye', name: '虚空之眼', desc: 'Boss专属：骨矛穿透 +2，弹射 +1', rarity: 'red', bossOnly: true,
    apply: (p) => { p.spearPierce = (p.spearPierce || 0) + 2; p.spearBounce = (p.spearBounce || 0) + 1; },
  },
  // —— 诅咒遗物（强但带永久负面）——
  {
    id: 'cursed_blade', name: '锈蚀魔刃', desc: '骨矛 +15，移速 -15%', rarity: 'red', cursed: true,
    apply: (p) => { p.spearDmg += 15; p.speed *= 0.85; },
  },
  {
    id: 'cursed_grimoire', name: '血契魔典', desc: '精华 +50%，受伤 +20%', rarity: 'red', cursed: true,
    apply: (p) => {
      p.essenceMul = (p.essenceMul || 1) * 1.5;
      p.glass = true;
      p.armorMul = (p.armorMul || 1) * 1.2;
    },
  },
  {
    id: 'cursed_crown', name: '篡位者之冠', desc: '召唤伤 +50%，最大生命 -25%', rarity: 'red', cursed: true,
    apply: (p) => {
      p.summonDmgMul *= 1.5;
      p.maxHp = Math.max(40, Math.round(p.maxHp * 0.75));
      p.hp = Math.min(p.hp, p.maxHp);
    },
  },
  {
    id: 'cursed_coin', name: '买命金币', desc: '击杀回血 +3，回蓝 -40%', rarity: 'red', cursed: true,
    apply: (p) => {
      p.skills.blood = true;
      p.bloodHeal = (p.bloodHeal || 2) + 3;
      p.mpRegen *= 0.6;
    },
  },
];

export const CURSES = [
  {
    id: 'c_weak', name: '诅咒·衰骨', desc: '最大生命 -20，骨矛 +12',
    curse: true,
    apply: (p) => { p.maxHp = Math.max(40, p.maxHp - 20); p.hp = Math.min(p.hp, p.maxHp); p.spearDmg += 12; },
  },
  {
    id: 'c_slow', name: '诅咒·铅足', desc: '移速 -12%，召唤伤害 +30%',
    curse: true,
    apply: (p) => { p.speed *= 0.88; p.summonDmgMul *= 1.3; },
  },
  {
    id: 'c_thirst', name: '诅咒·饥渴', desc: '回蓝 -30%，尸爆伤害 +50%',
    curse: true,
    apply: (p) => {
      p.mpRegen *= 0.7;
      p.boomDmg *= 1.5;
      p.boomRadius *= 1.15;
    },
  },
  {
    id: 'c_glass', name: '诅咒·玻璃魂', desc: '受伤 +25%，精华 +40%',
    curse: true,
    apply: (p) => { p.armorMul = Math.min(p.armorMul, 1) * 1.25; p.essenceMul = (p.essenceMul || 1) * 1.4; p.glass = true; },
  },
];

/** Unlimited stacks — may repeat; luck decides how many you see */
export function rollRelic(opts = {}) {
  const bossOnly = !!opts.bossOnly;
  const cursedChance = opts.cursedChance ?? 0.22;
  if (bossOnly) {
    const pool = RELICS.filter((r) => r.bossOnly);
    const src = pool.length ? pool : RELICS;
    return src[Math.floor(Math.random() * src.length)];
  }
  // cursed relics can appear from normal drops
  if (Math.random() < cursedChance) {
    const cursed = RELICS.filter((r) => r.cursed);
    if (cursed.length) {
      return cursed[Math.floor(Math.random() * cursed.length)];
    }
  }
  const pool = RELICS.filter((r) => !r.bossOnly && !r.cursed);
  const src = pool.length ? pool : RELICS.filter((r) => !r.bossOnly);
  if (!src.length) return null;
  return src[Math.floor(Math.random() * src.length)];
}

export function rollCurseChoice() {
  return CURSES[Math.floor(Math.random() * CURSES.length)];
}

export function applyRelic(player, relic) {
  if (!relic) return;
  relic.apply(player, null);
}

export function applyCurse(player, curse) {
  if (!curse) return;
  curse.apply(player, null);
}
