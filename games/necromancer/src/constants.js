export const CANVAS_W = 960;
export const CANVAS_H = 540;
export const ROOM = { x: 40, y: 50, w: 880, h: 440 };
export const DOOR = { x: ROOM.x + ROOM.w - 18, y: ROOM.y + ROOM.h / 2 - 28, w: 18, h: 56 };

export const COLORS = {
  bg: '#1a1024',
  floor: '#2a1a38',
  floorAlt: '#241632',
  wall: '#0d0814',
  wallEdge: '#3a2850',
  player: '#c8b8ff',
  playerStroke: '#9a80d0',
  summon: '#7dffa0',
  summonStroke: '#3a9a58',
  enemy: '#ff6b6b',
  enemyStroke: '#a03030',
  elite: '#ff8e3c',
  boss: '#ff3c6e',
  neutral: '#6bc8ff',
  grave: '#3a3a4a',
  graveTop: '#5a5a6a',
  corpse: '#4a3a2a',
  essence: '#ffd166',
  bone: '#f0e6d0',
  projEnemy: '#ff9e9e',
  projPlayer: '#e8d0ff',
  text: '#e8dff5',
  hint: '#ffd166',
  door: '#8a6acc',
  doorClosed: '#4a3560',
};

export const PLAYER = {
  r: 12,
  hp: 100,
  mp: 60,
  mpRegen: 8,
  speed: 160,
  spearDmg: 12,
  spearCost: 8,
  spearSpeed: 420,
  spearCd: 0.28,
  raiseCost: 15,
  boomCost: 20,
  boomDmg: 28,
  boomRadius: 70,
  maxSummons: 6,
  curseRadius: 90,
  curseSlow: 0.3,
  drain: 0,
  interactRange: 36,
};

// 开局仅左键骨矛；其余技能需天赋解锁
export const SKILL_KEYS = [
  'raise', 'boom', 'curse', 'drain', 'contract',
  'auto', 'orbit', 'dash', 'twin', 'harvest',
  'blood', 'army', 'horde', 'nova', 'armor',
];

export const SKILL_META = {
  raise: { name: '炼尸术', key: 'Q', desc: '对尸体炼成亡灵召唤物' },
  boom: { name: '尸爆', key: 'E', desc: '引爆尸体造成范围伤害' },
  curse: { name: '衰老光环', key: '被动', desc: '减缓周围敌人' },
  drain: { name: '生命汲取', key: '被动', desc: '骨矛命中回复生命' },
  contract: { name: '灵魂契约', key: 'F', desc: '契约中立生物（耗精华）' },
  auto: { name: '近身自动攻击', key: '被动', desc: '敌人进入射程后自动射骨矛（仍耗蓝）' },
  orbit: { name: '骨刺环绕', key: '被动', desc: '身边环绕骨刺，碰到敌人造成伤害' },
  dash: { name: '亡者疾冲', key: '空格', desc: '短距离冲刺，冷却 1.2s' },
  twin: { name: '双生骨矛', key: '被动', desc: '骨矛分裂为两道' },
  harvest: { name: '灵魂收割', key: '被动', desc: '精华吸附范围大幅增加' },
  blood: { name: '血债', key: '被动', desc: '击杀回复 2 点生命' },
  army: { name: '亡灵统帅', key: '被动', desc: '召唤物越多，伤害越高（每只 +4%）' },
  horde: { name: '尸潮', key: '被动', desc: '炼尸额外再多召 1 只（需炼尸术）' },
  nova: { name: '死亡反冲', key: '被动', desc: '受伤时有概率释放冲击波' },
  armor: { name: '骨甲', key: '被动', desc: '受到伤害 -20%' },
};

export const ENEMY_TYPES = {
  zombie: {
    id: 'zombie', name: '丧尸', r: 12, hp: 40, dmg: 10, speed: 55,
    range: 20, atkCd: 0.9, ranged: false, color: '#8a4a4a', essence: 4,
  },
  archer: {
    id: 'archer', name: '骷髅射手', r: 11, hp: 28, dmg: 8, speed: 70,
    range: 220, atkCd: 1.4, ranged: true, projSpeed: 200, color: '#c8b890', essence: 5,
  },
  rat: {
    id: 'rat', name: '疫鼠', r: 8, hp: 16, dmg: 5, speed: 120,
    range: 16, atkCd: 0.55, ranged: false, color: '#6a7a3a', essence: 2,
  },
  spider: {
    id: 'spider', name: '墓穴蛛', r: 10, hp: 22, dmg: 7, speed: 130,
    range: 18, atkCd: 0.5, ranged: false, color: '#4a3a6a', essence: 3,
  },
  cultist: {
    id: 'cultist', name: '腐教徒', r: 11, hp: 36, dmg: 9, speed: 65,
    range: 180, atkCd: 1.5, ranged: true, projSpeed: 180, color: '#8a40a0', essence: 6,
  },
  ghost: {
    id: 'ghost', name: '怨魂', r: 11, hp: 30, dmg: 11, speed: 90,
    range: 22, atkCd: 0.8, ranged: false, color: '#9ad0ff', essence: 7,
  },
  knight: {
    id: 'knight', name: '铁甲尸骑士', r: 15, hp: 95, dmg: 14, speed: 50,
    range: 24, atkCd: 1.0, ranged: false, color: '#6a7a90', essence: 12,
  },
  lich: {
    id: 'lich', name: '巫妖祭司', r: 13, hp: 70, dmg: 12, speed: 60,
    range: 200, atkCd: 1.2, ranged: true, projSpeed: 210, color: '#b060ff', essence: 14,
  },
  abomination: {
    id: 'abomination', name: '憎恶', r: 18, hp: 110, dmg: 16, speed: 40,
    range: 26, atkCd: 1.1, ranged: false, color: '#5a6a4a', essence: 10,
  },
  elite: {
    id: 'elite', name: '精英卫士', r: 16, hp: 160, dmg: 14, speed: 75,
    range: 24, atkCd: 0.75, ranged: false, color: '#ff8e3c', essence: 18, isElite: true,
  },
  eliteMage: {
    id: 'eliteMage', name: '精英咒术师', r: 15, hp: 120, dmg: 13, speed: 70,
    range: 200, atkCd: 1.1, ranged: true, projSpeed: 220, color: '#ff6bd0', essence: 20, isElite: true,
  },
  boss1: {
    id: 'boss1', name: '腐墓领主', r: 28, hp: 420, dmg: 18, speed: 50,
    range: 36, atkCd: 1.0, ranged: false, color: '#ff3c6e', essence: 40, isBoss: true,
  },
  boss2: {
    id: 'boss2', name: '哀嚎女妖', r: 26, hp: 520, dmg: 16, speed: 70,
    range: 200, atkCd: 1.3, ranged: true, projSpeed: 240, color: '#c060ff', essence: 45, isBoss: true,
  },
  boss3: {
    id: 'boss3', name: '永夜尸王', r: 32, hp: 750, dmg: 22, speed: 45,
    range: 40, atkCd: 0.9, ranged: false, color: '#ff2060', essence: 60, isBoss: true,
  },
  boss4: {
    id: 'boss4', name: '白骨巨龙', r: 30, hp: 900, dmg: 24, speed: 55,
    range: 48, atkCd: 0.95, ranged: false, color: '#e8dcc0', essence: 70, isBoss: true,
  },
  boss5: {
    id: 'boss5', name: '血肉之母', r: 34, hp: 1100, dmg: 26, speed: 40,
    range: 36, atkCd: 1.0, ranged: false, color: '#ff6b8a', essence: 80, isBoss: true,
  },
  bossEnd: {
    id: 'bossEnd', name: '深渊观测者', r: 36, hp: 1400, dmg: 28, speed: 50,
    range: 240, atkCd: 1.1, ranged: true, projSpeed: 260, color: '#20e0c0', essence: 100, isBoss: true,
  },
};

export const BOSS_POOL = ['boss1', 'boss2', 'boss3', 'boss4', 'boss5'];

export const SUMMON_TYPES = {
  skeleton: { id: 'skeleton', name: '骷髅兵', r: 10, hp: 30, dmg: 6, speed: 110, range: 18, atkCd: 0.7, ranged: false },
  ghoul: { id: 'ghoul', name: '食尸鬼', r: 12, hp: 45, dmg: 9, speed: 140, range: 20, atkCd: 0.55, ranged: false },
  wraith: { id: 'wraith', name: '幽魂', r: 10, hp: 20, dmg: 8, speed: 100, range: 160, atkCd: 1.1, ranged: true, projSpeed: 220 },
  beast: { id: 'beast', name: '契约兽', r: 13, hp: 55, dmg: 10, speed: 150, range: 20, atkCd: 0.6, ranged: false },
  eliteUndead: { id: 'eliteUndead', name: '精英亡灵', r: 15, hp: 80, dmg: 14, speed: 100, range: 22, atkCd: 0.65, ranged: false },
};

export const RAISE_POOL = ['skeleton', 'ghoul', 'wraith'];
export const RAISE_WEIGHTS = { skeleton: 3, ghoul: 2, wraith: 1 };

export const SUMMON_TIER = {
  skeleton: 1,
  ghoul: 2,
  wraith: 2,
  beast: 3,
  eliteUndead: 4,
};

export const RANGES = {
  raise: 48,
  boomMouse: 40,
  boomPlayer: 90,
  enemyPreferSummon: 280,
  essenceMagnet: 80,
  essenceMagnetHarvest: 180,
  doorPad: 8,
  bossSpecialCd: 3.2,
  neutralCost: 10,
  shardSpear: 2,
  shardHp: 10,
  shardSummonMul: 1.08,
  floorHealMul: 0.35,
  autoRange: 200,
  orbitRadius: 34,
  orbitDmg: 8,
  orbitCount: 2,
  dashDist: 70,
  dashCd: 1.2,
  bloodHeal: 2,
  armyPerSummon: 0.04,
  novaChance: 0.35,
  novaDmg: 18,
  novaRadius: 70,
  armorMul: 0.8,
  twinSpread: 0.18,
};

// 稀有度：红 > 金 > 紫 > 蓝 > 白（数值越小越稀有）
export const RARITY = {
  red: { rank: 0, name: '红', color: '#ff4a6a', bg: 'rgba(80,16,28,0.55)', border: '#ff4a6a' },
  gold: { rank: 1, name: '金', color: '#ffd166', bg: 'rgba(70,52,12,0.55)', border: '#ffd166' },
  purple: { rank: 2, name: '紫', color: '#c060ff', bg: 'rgba(48,18,72,0.55)', border: '#c060ff' },
  blue: { rank: 3, name: '蓝', color: '#6bc8ff', bg: 'rgba(12,36,64,0.55)', border: '#6bc8ff' },
  white: { rank: 4, name: '白', color: '#e8dff5', bg: 'rgba(36,28,48,0.5)', border: '#6a5a80' },
};

export function rarityRank(r) {
  return RARITY[r]?.rank ?? 4;
}

export function rarityOf(u) {
  if (!u) return 'white';
  if (u.curse || u.rarity === 'red') return 'red';
  return u.rarity || 'white';
}

export const UPGRADES = [
  // —— 红：禁忌 / 高风险高回报 ——
  { id: 'talent_horde', name: '天赋·尸潮', desc: '炼尸额外多召 1 只（需炼尸术）', unlock: 'horde', requires: 'raise', rarity: 'red',
    apply: (p) => { p.skills.horde = true; } },
  { id: 'talent_nova', name: '天赋·死亡反冲', desc: '受伤概率释放冲击波', unlock: 'nova', rarity: 'red',
    apply: (p) => { p.skills.nova = true; } },

  // —— 金：强力构筑核心 ——
  { id: 'talent_auto', name: '天赋·近身自动攻击', desc: '敌人进射程自动射骨矛', unlock: 'auto', rarity: 'gold',
    apply: (p) => { p.skills.auto = true; p.autoRange = 200; } },
  { id: 'talent_twin', name: '天赋·双生骨矛', desc: '骨矛分裂为两道', unlock: 'twin', rarity: 'gold',
    apply: (p) => { p.skills.twin = true; } },
  { id: 'talent_army', name: '天赋·亡灵统帅', desc: '召唤物越多伤害越高', unlock: 'army', rarity: 'gold',
    apply: (p) => { p.skills.army = true; } },
  { id: 'twin_pow', name: '三重骨矛', desc: '再多分裂一道骨矛', requires: 'twin', rarity: 'gold',
    apply: (p) => { p.twinExtra += 1; } },

  // —— 紫：核心技能解锁 ——
  { id: 'talent_raise', name: '天赋·炼尸术', desc: '解锁 Q：对尸体炼成召唤物', unlock: 'raise', rarity: 'purple',
    apply: (p) => { p.skills.raise = true; } },
  { id: 'talent_boom', name: '天赋·尸爆', desc: '解锁 E：引爆尸体范围伤害', unlock: 'boom', rarity: 'purple',
    apply: (p) => { p.skills.boom = true; } },
  { id: 'talent_curse', name: '天赋·衰老光环', desc: '解锁光环：减缓周围敌人', unlock: 'curse', rarity: 'purple',
    apply: (p) => { p.skills.curse = true; p.curseRadius = 90; } },
  { id: 'talent_drain', name: '天赋·生命汲取', desc: '解锁吸血：骨矛命中回血 +1', unlock: 'drain', rarity: 'purple',
    apply: (p) => { p.skills.drain = true; p.drain = 1; } },
  { id: 'talent_contract', name: '天赋·灵魂契约', desc: '解锁 F：契约中立生物（耗精华）', unlock: 'contract', rarity: 'purple',
    apply: (p) => { p.skills.contract = true; } },

  // —— 蓝：实用被动 / 进阶强化 ——
  { id: 'talent_orbit', name: '天赋·骨刺环绕', desc: '环绕骨刺接触伤害', unlock: 'orbit', rarity: 'blue',
    apply: (p) => { p.skills.orbit = true; p.orbitCount = RANGES.orbitCount; } },
  { id: 'talent_dash', name: '天赋·亡者疾冲', desc: '空格短冲刺（1.2s 冷却）', unlock: 'dash', rarity: 'blue',
    apply: (p) => { p.skills.dash = true; } },
  { id: 'talent_harvest', name: '天赋·灵魂收割', desc: '精华吸附范围大幅增加', unlock: 'harvest', rarity: 'blue',
    apply: (p) => { p.skills.harvest = true; } },
  { id: 'talent_blood', name: '天赋·血债', desc: '击杀回复 2 生命', unlock: 'blood', rarity: 'blue',
    apply: (p) => { p.skills.blood = true; } },
  { id: 'talent_armor', name: '天赋·骨甲', desc: '受到伤害 -20%', unlock: 'armor', rarity: 'blue',
    apply: (p) => { p.skills.armor = true; } },
  { id: 'raise_cost', name: '廉价炼尸', desc: '炼尸耗蓝 -30%', requires: 'raise', rarity: 'blue',
    apply: (p) => { p.raiseCost = Math.max(4, Math.round(p.raiseCost * 0.7)); } },
  { id: 'boom_pow', name: '尸爆强化', desc: '尸爆伤害与半径 +30%', requires: 'boom', rarity: 'blue',
    apply: (p) => { p.boomDmg *= 1.3; p.boomRadius *= 1.3; } },
  { id: 'curse_pow', name: '衰老加深', desc: '光环减速至 50%，半径 +20', requires: 'curse', rarity: 'blue',
    apply: (p) => { p.curseSlow = 0.5; p.curseRadius += 20; } },
  { id: 'drain_pow', name: '汲取强化', desc: '吸血额外 +1', requires: 'drain', rarity: 'blue',
    apply: (p) => { p.drain += 1; } },
  { id: 'auto_pow', name: '速射', desc: '自动攻击射程 +40、攻速 +15%', requires: 'auto', rarity: 'blue',
    apply: (p) => { p.autoRange += 40; p.spearCd = Math.max(0.12, p.spearCd * 0.85); } },
  { id: 'orbit_pow', name: '骨刺增殖', desc: '环绕骨刺 +1，伤害 +4', requires: 'orbit', rarity: 'blue',
    apply: (p) => { p.orbitCount += 1; p.orbitDmg += 4; } },
  { id: 'armor_pow', name: '重骨甲', desc: '减伤再 -10%（最低 40%）', requires: 'armor', rarity: 'blue',
    apply: (p) => { p.armorMul = Math.max(0.4, p.armorMul - 0.1); } },
  { id: 'mod_pierce', name: '模组·贯穿', desc: '骨矛穿透 +1', rarity: 'blue',
    apply: (p) => { p.spearPierce = (p.spearPierce || 0) + 1; } },
  { id: 'mod_bounce', name: '模组·弹射', desc: '骨矛命中弹射 1 次', rarity: 'purple',
    apply: (p) => { p.spearBounce = (p.spearBounce || 0) + 1; } },
  { id: 'mod_splash', name: '模组·溅射', desc: '骨矛命中溅射 6 伤害', rarity: 'blue',
    apply: (p) => { p.spearSplash = (p.spearSplash || 0) + 6; } },

  // —— 白：基础数值 ——
  { id: 'hp', name: '腐骨强韧', desc: '+25 最大生命，并回复该值', rarity: 'white',
    apply: (p) => { p.maxHp += 25; p.hp = Math.min(p.maxHp, p.hp + 25); } },
  { id: 'dmg', name: '骨矛精通', desc: '骨矛伤害 +6', rarity: 'white',
    apply: (p) => { p.spearDmg += 6; } },
  { id: 'spd', name: '疾走尸步', desc: '移速 +12%', rarity: 'white',
    apply: (p) => { p.speed *= 1.12; } },
  { id: 'cap', name: '亡者军团', desc: '最大召唤数 +2', rarity: 'white',
    apply: (p) => { p.maxSummons += 2; } },
  { id: 'pow', name: '死亡契约', desc: '召唤物伤害 +25%', rarity: 'white',
    apply: (p) => { p.summonDmgMul *= 1.25; } },
  { id: 'mana', name: '灵魂井', desc: '蓝回复 +50%', rarity: 'white',
    apply: (p) => { p.mpRegen *= 1.5; } },
];

export const FLOORS = [
  { boss: 'boss1', rooms: [
    { type: 'combat' },
    { type: 'combat' },
    { type: 'grave' },
    { type: 'elite' },
    { type: 'boss' },
  ]},
  { boss: 'boss2', rooms: [
    { type: 'combat' },
    { type: 'neutral' },
    { type: 'combat' },
    { type: 'elite' },
    { type: 'boss' },
  ]},
  { boss: 'boss3', rooms: [
    { type: 'combat' },
    { type: 'grave' },
    { type: 'neutral' },
    { type: 'elite' },
    { type: 'boss' },
  ]},
];

export const ROOM_TYPE_LABEL = {
  combat: '战斗',
  grave: '坟场',
  neutral: '中立生物',
  elite: '精英战',
  boss: 'Boss',
};

// —— 局外养成（魂尘）——
export const META_UPGRADES = [
  {
    id: 'hp', name: '腐骨体质', desc: '每级 +10 最大生命',
    baseCost: 15, maxLevel: 5, costGrowth: 1.55,
    apply: (p, lv) => { p.maxHp += 10 * lv; },
  },
  {
    id: 'mana', name: '灵魂深井', desc: '每级 +6 最大蓝、+0.8 回蓝',
    baseCost: 18, maxLevel: 5, costGrowth: 1.55,
    apply: (p, lv) => { p.maxMp += 6 * lv; p.mpRegen += 0.8 * lv; },
  },
  {
    id: 'spear', name: '骨矛淬炼', desc: '每级 骨矛伤害 +2',
    baseCost: 20, maxLevel: 6, costGrowth: 1.6,
    apply: (p, lv) => { p.spearDmg += 2 * lv; },
  },
  {
    id: 'cap', name: '亡者号令', desc: '每 2 级 最大召唤 +1',
    baseCost: 25, maxLevel: 4, costGrowth: 1.7,
    apply: (p, lv) => { p.maxSummons += Math.floor(lv / 2); },
  },
  {
    id: 'speed', name: '幽步', desc: '每级 移速 +3%',
    baseCost: 22, maxLevel: 4, costGrowth: 1.65,
    apply: (p, lv) => { p.speed *= 1 + 0.03 * lv; },
  },
  {
    id: 'essence', name: '精华共鸣', desc: '每级 精华获取 +10%',
    baseCost: 28, maxLevel: 5, costGrowth: 1.6, perLevel: 0.1,
    apply: (p, lv) => { p.essenceMul = 1 + 0.1 * lv; },
  },
  {
    id: 'startRaise', name: '祖传炼尸术', desc: '每局开局自带炼尸术天赋',
    baseCost: 55, maxLevel: 1, costGrowth: 1,
    apply: (p) => { p.skills.raise = true; },
  },
  {
    id: 'startLucky', name: '死灵馈赠', desc: '每局开局随机解锁 1 个未学天赋',
    baseCost: 48, maxLevel: 1, costGrowth: 1,
    apply: (p) => { p._metaLucky = true; },
  },
  {
    id: 'shard', name: '残响容器', desc: '灵魂碎片额外 +1 骨矛伤害 / +5 生命',
    baseCost: 35, maxLevel: 3, costGrowth: 1.6,
    apply: (p, lv) => { p.shardBonus = { dmg: lv, hp: 5 * lv }; },
  },
  {
    id: 'refresh', name: '灵视改写', desc: '每级 每局天赋刷新次数 +1（基础 1）',
    baseCost: 40, maxLevel: 4, costGrowth: 1.7,
    apply: (p, lv) => { p.refreshLeft = 1 + lv; },
  },
];

// 词典条目（flavor）
export const CODEX_ENEMY = {
  zombie: '墓园里最普通的行尸，慢但执着。',
  archer: '还残留着生前射术的骷髅，会拉开距离放冷箭。',
  rat: '疫鼠成群，血少却难缠。',
  spider: '墓穴蛛：速度极快，喜欢扑脸。',
  cultist: '腐教徒：远程暗影弹。',
  ghost: '怨魂：飘忽近战，伤害不俗。',
  knight: '铁甲尸骑士：厚甲坦克。',
  lich: '巫妖祭司：强力远程咒术。',
  abomination: '缝合憎恶，血厚攻高，走得慢。',
  elite: '精英卫士：击杀后必掉灵魂碎片。',
  eliteMage: '精英咒术师：远程精英，同样掉碎片。',
  boss1: '第 1 层领主·腐墓领主。近战猛冲。',
  boss2: '第 2 层领主·哀嚎女妖。远程弹幕。',
  boss3: '最终 Boss·永夜尸王。召唤鼠群与环形弹。',
  boss4: '白骨巨龙：扇形骨刺与俯冲。',
  boss5: '血肉之母：喷吐血肉弹幕并分裂。',
  bossEnd: '深渊观测者：无尽层尽头的存在。',
};

export const CODEX_SUMMON = {
  skeleton: '最基础的炼尸产物，可靠炮灰。',
  ghoul: '更快更凶的近战食尸鬼。',
  wraith: '远程幽魂，飘在后排输出。',
  beast: '中立生物契约后的战兽。',
  eliteUndead: '由精英/精英碎片转化的高阶亡灵。',
};

export const CODEX_NEUTRAL = {
  wolf: '游荡野狼：F 契约后变为契约兽。',
  wisp: '漂泊游魂：F 契约后同样入队。',
};

export const CORPSE_LIFE = 14; // seconds before rot
export const SACRIFICE_MP = 18;

export const ROOM_AFFIXES = [
  { id: 'blood_moon', name: '血月', desc: '敌 +15% 伤，精华 +20%',
    applyRoom: (room) => { room.affix = { enemyDmgMul: 1.15, essenceMul: 1.2 }; } },
  { id: 'grave_fog', name: '墓雾', desc: '敌移速 -10%，尸保留 +5s',
    applyRoom: (room) => { room.affix = { enemySpdMul: 0.9, corpseBonus: 5 }; } },
  { id: 'hunger', name: '饥馑', desc: '敌 +20% 血，召唤伤 +15%',
    applyRoom: (room) => { room.affix = { enemyHpMul: 1.2, summonDmgRoom: 1.15 }; } },
  { id: 'still', name: '静默', desc: '回蓝 -40%，骨矛伤 +20%',
    applyRoom: (room) => { room.affix = { mpRegenMul: 0.6, spearRoom: 1.2 }; } },
];

export function rollAffix(rng) {
  if (!rng || rng.next() < 0.25) return null;
  return ROOM_AFFIXES[Math.floor((rng ? rng.next() : Math.random()) * ROOM_AFFIXES.length)];
}
