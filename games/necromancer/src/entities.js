import { ENEMY_TYPES, SUMMON_TYPES, PLAYER } from './constants.js?v=cb51554320';
import { rand, choice, normalize, dist } from './utils.js?v=cb51554320';

let nextId = 1;
export function uid() {
  return nextId++;
}

export function createPlayer(x, y) {
  return {
    id: uid(),
    kind: 'player',
    x, y,
    r: PLAYER.r,
    hp: PLAYER.hp,
    maxHp: PLAYER.hp,
    mp: PLAYER.mp,
    maxMp: PLAYER.mp,
    mpRegen: PLAYER.mpRegen,
    speed: PLAYER.speed,
    spearDmg: PLAYER.spearDmg,
    spearCost: PLAYER.spearCost,
    spearSpeed: PLAYER.spearSpeed,
    spearCd: PLAYER.spearCd,
    spearTimer: 0,
    raiseCost: PLAYER.raiseCost,
    boomCost: PLAYER.boomCost,
    boomDmg: PLAYER.boomDmg,
    boomRadius: PLAYER.boomRadius,
    maxSummons: PLAYER.maxSummons,
    curseRadius: 0,
    curseSlow: PLAYER.curseSlow,
    drain: 0,
    summonDmgMul: 1,
    interactRange: PLAYER.interactRange,
    autoRange: 0,
    orbitCount: 0,
    orbitDmg: 8,
    orbitAngle: 0,
    dashTimer: 0,
    twinExtra: 0,
    bloodHeal: 2,
    armorMul: 1,
    essenceMul: 1,
    shardBonus: null,
    spearPierce: 0,
    spearBounce: 0,
    spearSplash: 0,
    path: null,
    _masteries: {},
    animT: 0,
    moving: false,
    moveDir: { x: 1, y: 0 },
    atkFlash: 0,
    dashTrail: [],
    refreshLeft: 1,
    _metaLucky: false,
    skills: {
      raise: false,
      boom: false,
      curse: false,
      drain: false,
      contract: false,
      auto: false,
      orbit: false,
      dash: false,
      twin: false,
      harvest: false,
      blood: false,
      army: false,
      horde: false,
      nova: false,
      armor: false,
    },
    alive: true,
    facing: { x: 1, y: 0 },
  };
}

export function createEnemy(typeId, x, y, floor = 1) {
  const base = ENEMY_TYPES[typeId];
  const scale = 1 + (floor - 1) * 0.18;
  return {
    id: uid(),
    kind: 'enemy',
    typeId,
    x, y,
    r: base.r,
    hp: Math.round(base.hp * scale),
    maxHp: Math.round(base.hp * scale),
    dmg: Math.round(base.dmg * scale),
    speed: base.speed,
    range: base.range,
    atkCd: base.atkCd,
    atkTimer: 0,
    ranged: base.ranged,
    projSpeed: base.projSpeed || 0,
    color: base.color,
    essence: Math.round(base.essence * scale),
    isElite: !!base.isElite,
    isBoss: !!base.isBoss,
    name: base.name,
    alive: true,
    slowMul: 1,
    slowTimer: 0,
    phase: 0,
    specialTimer: 3,
  };
}

export function createSummon(typeId, x, y) {
  const base = SUMMON_TYPES[typeId];
  return {
    id: uid(),
    kind: 'summon',
    typeId,
    x, y,
    r: base.r,
    hp: base.hp,
    maxHp: base.hp,
    dmg: base.dmg,
    speed: base.speed,
    range: base.range,
    atkCd: base.atkCd,
    atkTimer: 0,
    ranged: base.ranged,
    projSpeed: base.projSpeed || 0,
    name: base.name,
    alive: true,
    slot: typeId,
  };
}

export function createCorpse(x, y, fromType) {
  return {
    id: uid(),
    kind: 'corpse',
    x, y,
    r: 10,
    fromType,
    alive: true,
    age: 0,
    life: 14,
  };
}

export function createProjectile(opts) {
  return {
    id: uid(),
    kind: 'projectile',
    x: opts.x,
    y: opts.y,
    r: opts.r || 5,
    vx: opts.vx,
    vy: opts.vy,
    dmg: opts.dmg,
    from: opts.from, // 'player' | 'enemy' | 'summon'
    color: opts.color,
    life: opts.life || 1.5,
    alive: true,
    pierce: opts.pierce || 0,
    bounce: opts.bounce || 0,
    drain: opts.drain || 0,
  };
}

export function createGrave(x, y) {
  return {
    id: uid(),
    kind: 'grave',
    x, y,
    r: 14,
    used: false,
    alive: true,
  };
}

export function createNeutral(x, y, typeId) {
  const t = typeId || choice(['wolf', 'wisp']);
  return {
    id: uid(),
    kind: 'neutral',
    x, y,
    r: 13,
    typeId: t,
    name: t === 'wisp' ? '游魂' : '野狼',
    hp: 35,
    maxHp: 35,
    speed: t === 'wisp' ? 90 : 110,
    cost: 10,
    contracted: false,
    alive: true,
    wanderT: rand(0.2, 1.2),
    wanderDir: { x: 0, y: 0 },
    homeX: x,
    homeY: y,
    panic: 0,
  };
}

export function createEssence(x, y, amount) {
  return {
    id: uid(),
    kind: 'essence',
    x, y,
    r: 6,
    amount,
    alive: true,
    age: 0,
  };
}

export function createSoulShard(x, y) {
  return {
    id: uid(),
    kind: 'soulShard',
    x, y,
    r: 8,
    alive: true,
    age: 0,
    rarity: 'gold',
  };
}

export function createRelicDrop(x, y, relic) {
  return {
    id: uid(),
    kind: 'relicDrop',
    x, y,
    r: 12,
    relic,
    rarity: relic?.rarity || 'purple',
    cursed: !!relic?.cursed,
    alive: true,
    age: 0,
  };
}

export function spawnPointInRoom(room, margin = 40) {
  const minX = room.x + margin;
  const maxX = room.x + room.w - margin;
  const minY = room.y + margin;
  const maxY = room.y + room.h - margin;
  return { x: rand(minX, maxX), y: rand(minY, maxY) };
}

export function moveToward(e, tx, ty, speed, dt) {
  const dx = tx - e.x;
  const dy = ty - e.y;
  const d = Math.hypot(dx, dy);
  if (d < 1) return;
  const step = Math.min(d, speed * dt);
  e.x += (dx / d) * step;
  e.y += (dy / d) * step;
}

export function faceTarget(e, tx, ty) {
  const n = normalize(tx - e.x, ty - e.y);
  e.facing = n;
  return n;
}

export function nearestAlive(list, x, y, filter) {
  let best = null;
  let bestD = Infinity;
  for (const e of list) {
    if (!e.alive) continue;
    if (filter && !filter(e)) continue;
    const d = dist(x, y, e.x, e.y);
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  return best;
}
