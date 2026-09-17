import { FLOORS, ROOM_TYPE_LABEL, rollAffix, BOSS_POOL } from './constants.js?v=cb51554320';
import {
  createEnemy, createGrave, createNeutral, spawnPointInRoom,
} from './entities.js?v=cb51554320';
import { rand, randInt } from './utils.js?v=cb51554320';
import { generateRoomProps } from './props.js?v=cb52541781';

export function getFloorPlan(floorNum) {
  if (floorNum <= FLOORS.length) {
    const idx = Math.min(floorNum - 1, FLOORS.length - 1);
    return FLOORS[idx];
  }
  return {
    boss: BOSS_POOL[(floorNum - 1) % BOSS_POOL.length],
    rooms: [
      { type: 'combat' },
      { type: 'grave' },
      { type: 'combat' },
      { type: 'elite' },
      { type: 'boss' },
    ],
  };
}

export function getRoomPlan(floorNum, roomIndex) {
  const floor = getFloorPlan(floorNum);
  return floor.rooms[roomIndex] || floor.rooms[floor.rooms.length - 1];
}

export function roomTitle(floorNum, roomIndex) {
  const plan = getRoomPlan(floorNum, roomIndex);
  return `${ROOM_TYPE_LABEL[plan.type] || plan.type}`;
}

function scaleEnemy(e, room) {
  const aff = room.affix;
  if (!aff) return e;
  if (aff.enemyHpMul) {
    e.hp = Math.round(e.hp * aff.enemyHpMul);
    e.maxHp = e.hp;
  }
  if (aff.enemyDmgMul) e.dmg = Math.round(e.dmg * aff.enemyDmgMul);
  if (aff.enemySpdMul) e.speed = Math.round(e.speed * aff.enemySpdMul);
  return e;
}

function combatCount(floorNum, roomIndex) {
  if (floorNum <= 1) return 3 + (roomIndex % 2);
  if (floorNum === 2) return 3 + Math.floor(roomIndex / 2);
  return 4 + Math.floor(roomIndex / 2);
}

function poolForFloor(floorNum) {
  const types = ['zombie', 'archer'];
  if (floorNum >= 2) types.push('rat', 'spider', 'abomination');
  if (floorNum >= 3) types.push('cultist', 'ghost', 'knight');
  if (floorNum >= 4) types.push('lich', 'abomination', 'ghost');
  return types;
}

export function populateRoom(room, floorNum, roomIndex, entities, rng, game) {
  const plan = getRoomPlan(floorNum, roomIndex);
  room.type = plan.type;
  room.cleared = false;
  room.doorOpen = false;
  room.enemiesLeft = 0;
  room.affix = null;
  if (plan.type !== 'boss' && plan.type !== 'grave' && plan.type !== 'neutral') {
    if (game?.runMode === 'weekly') {
      const affId = game.weeklyAffixId || 'blood_moon';
      if (affId === 'blood_moon') room.affix = { enemyDmgMul: 1.15, essenceMul: 1.2, name: '血月' };
      else if (affId === 'spike_floor') room.affix = { enemySpdMul: 1.1, name: '尖刺' };
      else if (affId === 'toxic_fog') room.affix = { essenceMul: 1.15, name: '毒雾' };
      else if (affId === 'haste_dead') room.affix = { enemySpdMul: 1.25, name: '尸疾' };
    } else {
      const aff = rollAffix(rng);
      if (aff) aff.applyRoom(room);
    }
  } else if (plan.type === 'boss') {
    room.affix = { enemyHpMul: 1.05 };
  }
  entities.enemies.length = 0;
  entities.corpses.length = 0;
  entities.graves.length = 0;
  entities.neutrals.length = 0;
  entities.projectiles.length = 0;
  entities.essence.length = 0;
  entities.shards.length = 0;
  if (entities.relicDrops) entities.relicDrops.length = 0;

  // per-room randomized scenery
  const runSeed = (rng && rng.seed) || Date.now();
  room.props = generateRoomProps(room, floorNum, roomIndex, runSeed);

  const combatBudget = (n) => {
    const types = poolForFloor(floorNum);
    const spawned = [];
    for (let i = 0; i < n; i++) {
      const t = rng ? rng.pick(types) : types[randInt(0, types.length - 1)];
      const count = t === 'rat' || t === 'spider' ? randInt(2, 3) : 1;
      for (let c = 0; c < count; c++) {
        const p = spawnPointInRoom(room, 50);
        spawned.push(scaleEnemy(createEnemy(t, p.x, p.y, floorNum), room));
      }
    }
    return spawned;
  };

  if (plan.type === 'combat') {
    entities.enemies.push(...combatBudget(combatCount(floorNum, roomIndex)));
  } else if (plan.type === 'grave') {
    entities.enemies.push(...combatBudget(2 + Math.floor(floorNum * 0.8)));
    const graveCount = randInt(2, 4);
    for (let i = 0; i < graveCount; i++) {
      const p = spawnPointInRoom(room, 60);
      entities.graves.push(createGrave(p.x, p.y));
    }
  } else if (plan.type === 'neutral') {
    entities.enemies.push(...combatBudget(2 + Math.floor(floorNum * 0.5)));
    const nCount = randInt(1, 2);
    for (let i = 0; i < nCount; i++) {
      const p = spawnPointInRoom(room, 70);
      entities.neutrals.push(createNeutral(p.x, p.y));
    }
  } else if (plan.type === 'elite') {
    const eType = rng ? rng.pick(['elite', 'eliteMage']) : 'elite';
    entities.enemies.push(scaleEnemy(createEnemy(eType, room.x + room.w * 0.7, room.y + room.h * 0.5, floorNum), room));
    entities.enemies.push(...combatBudget(2 + floorNum));
  } else if (plan.type === 'boss') {
    const bossId = plan.boss || getFloorPlan(floorNum).boss;
    const boss = scaleEnemy(createEnemy(bossId, room.x + room.w * 0.72, room.y + room.h * 0.5, floorNum), room);
    boss.phase = 1;
    entities.enemies.push(boss);
    if (floorNum >= 2) {
      entities.enemies.push(...combatBudget(1));
    }
  }

  room.enemiesLeft = entities.enemies.filter((e) => e.alive).length;
  return room;
}

export function checkRoomClear(entities, room) {
  const left = entities.enemies.filter((e) => e.alive).length;
  room.enemiesLeft = left;
  if (left === 0 && !room.cleared) {
    room.cleared = true;
    room.doorOpen = true;
    return true;
  }
  return false;
}
