import { createProjectile, createCorpse, createEssence, createSoulShard, createSummon } from './entities.js?v=cb51554320';
import { SUMMON_TYPES, RAISE_POOL, RAISE_WEIGHTS, SUMMON_TIER, RANGES } from './constants.js?v=cb51554320';
import { circleHit, dist, normalize, rand } from './utils.js?v=cb51554320';
import { spawnBurst, addShake, addFlash, addHitPause } from './fx.js?v=cb51554320';

function weightedRaiseType() {
  const bag = [];
  for (const t of RAISE_POOL) {
    for (let i = 0; i < (RAISE_WEIGHTS[t] || 1); i++) bag.push(t);
  }
  return bag[Math.floor(Math.random() * bag.length)];
}

function pickLowestTierSummon(summons) {
  const alive = summons.filter((s) => s.alive);
  if (!alive.length) return null;
  alive.sort((a, b) => {
    const ta = SUMMON_TIER[a.typeId] || 1;
    const tb = SUMMON_TIER[b.typeId] || 1;
    if (ta !== tb) return ta - tb;
    return a.hp - b.hp;
  });
  return alive[0];
}

function makeRoomForSummon(player, game) {
  if (game.entities.summons.filter((s) => s.alive).length < player.maxSummons) return;
  const weakest = pickLowestTierSummon(game.entities.summons);
  if (weakest) weakest.alive = false;
}

export function pickRaiseType(corpse) {
  const ft = corpse.fromType;
  if (ft === 'elite' || ft === 'eliteMage' || /^boss/.test(ft || '')) {
    return 'eliteUndead';
  }
  // 尸体类型影响炼成
  const map = {
    spider: 'ghoul',
    rat: 'ghoul',
    knight: 'skeleton',
    ghost: 'wraith',
    cultist: 'wraith',
    archer: 'wraith',
    zombie: null,
    abomination: 'skeleton',
  };
  if (map[ft]) return map[ft];
  return weightedRaiseType();
}

/** Bonus after raise based on corpse origin */
export function raiseCorpseBonus(summon, corpse) {
  const ft = corpse.fromType;
  if (ft === 'spider' || ft === 'rat') {
    summon.speed = Math.round(summon.speed * 1.25);
    summon.atkCd = Math.max(0.3, summon.atkCd * 0.85);
    summon.name += '·疾';
  } else if (ft === 'knight' || ft === 'abomination') {
    summon.hp = Math.round(summon.hp * 1.4);
    summon.maxHp = summon.hp;
    summon.name += '·甲';
  } else if (ft === 'lich' || ft === 'cultist' || ft === 'archer') {
    summon.dmg = Math.round(summon.dmg * 1.2);
    if (summon.baseDmg) summon.baseDmg = summon.dmg;
    summon.name += '·咒';
  }
  return summon;
}

export function raiseNearestCorpse(player, game, free = false) {
  if (!free && !player.skills.raise) {
    return { ok: false, msg: '未习得炼尸术（升级选天赋·炼尸术）' };
  }
  if (free && !player.skills.raise) {
    return { ok: false, msg: '需先习得炼尸术' };
  }
  let best = null;
  let bestD = Infinity;
  for (const c of game.entities.corpses) {
    if (!c.alive) continue;
    const d = dist(player.x, player.y, c.x, c.y);
    if (d < bestD && d < RANGES.raise) {
      bestD = d;
      best = c;
    }
  }
  if (!best) return { ok: false, msg: '附近没有尸体（Q 炼尸）' };
  if (!free && player.mp < player.raiseCost) return { ok: false, msg: '蓝量不足' };
  makeRoomForSummon(player, game);
  const type = pickRaiseType(best);
  if (!free) player.mp -= player.raiseCost;
  best.alive = false;
  const s = createSummon(type, best.x, best.y);
  applySummonPower(s, player);
  raiseCorpseBonus(s, best);
  game.entities.summons.push(s);
  // 尸潮：额外一只
  if (player.skills.horde) {
    makeRoomForSummon(player, game);
    const s2 = createSummon(type === 'eliteUndead' ? 'skeleton' : type, best.x + 14, best.y + 8);
    applySummonPower(s2, player);
    game.entities.summons.push(s2);
  }
  reapplySummonPower(game, player);
  game.stats.raises += 1;
  game.flash = { t: 0.15, color: '#7dffa0' };
  if (game.sfx) game.sfx.raise();
  if (game.fx) spawnBurst(game.fx, best.x, best.y, '#7dffa0', 8);
  return { ok: true, msg: `炼成 ${SUMMON_TYPES[type].name}${player.skills.horde ? ' ×2' : ''}` };
}

export function castCorpseExplosion(player, game, mx, my) {
  if (!player.skills.boom) return { ok: false, msg: '未习得尸爆（升级选天赋·尸爆）' };
  if (player.mp < player.boomCost) return { ok: false, msg: '蓝量不足' };
  let best = null;
  let bestScore = Infinity;
  for (const c of game.entities.corpses) {
    if (!c.alive) continue;
    const d = dist(mx, my, c.x, c.y);
    if (d < RANGES.boomMouse && d < bestScore) {
      bestScore = d;
      best = c;
    }
  }
  if (!best) {
    let bd = Infinity;
    for (const c of game.entities.corpses) {
      if (!c.alive) continue;
      const d = dist(player.x, player.y, c.x, c.y);
      if (d < bd && d < RANGES.boomPlayer) {
        bd = d;
        best = c;
      }
    }
  }
  if (!best) return { ok: false, msg: '需要尸体才能尸爆（E）' };
  player.mp -= player.boomCost;
  best.alive = false;
  boomAt(game, player, best.x, best.y, 0);
  return { ok: true, msg: '尸爆！' };
}

/** Recursive corpse chain explosion */
function boomAt(game, player, x, y, depth) {
  const r = player.boomRadius * (depth === 0 ? 1 : 0.75);
  const dmg = player.boomDmg * (depth === 0 ? 1 : 0.55);
  game.booms.push({ x, y, r: 6, maxR: r, life: 0.28, maxLife: 0.28 });
  for (const e of game.entities.enemies) {
    if (!e.alive) continue;
    if (dist(x, y, e.x, e.y) <= r + e.r) {
      damageEnemy(e, dmg, game);
    }
  }
  if (game.fx) {
    spawnBurst(game.fx, x, y, '#ff9e4a', 10, 120);
    addShake(game.fx, 5 + depth * 2);
  }
  if (game.sfx) game.sfx.boom();
  game.stats.booms += 1;
  game.flash = { t: 0.12, color: '#ff9e4a' };
  if (depth >= 2) return;
  // chain nearby corpses
  for (const c of game.entities.corpses) {
    if (!c.alive) continue;
    if (dist(x, y, c.x, c.y) <= r + 20) {
      c.alive = false;
      boomAt(game, player, c.x, c.y, depth + 1);
    }
  }
}

export function interact(player, game) {
  const range = player.interactRange + 8;
  for (const g of game.entities.graves) {
    if (!g.alive || g.used) continue;
    if (dist(player.x, player.y, g.x, g.y) < range + g.r) {
      if (!player.skills.raise) {
        return { ok: false, msg: '需炼尸术才能唤醒坟墓' };
      }
      makeRoomForSummon(player, game);
      g.used = true;
      const t = weightedRaiseType();
      const s = createSummon(t, g.x, g.y - 10);
      applySummonPower(s, player);
      game.entities.summons.push(s);
      game.stats.graves += 1;
      game.flash = { t: 0.15, color: '#c8b8ff' };
      return { ok: true, msg: `坟墓唤醒 ${SUMMON_TYPES[t].name}` };
    }
  }
  for (const n of game.entities.neutrals) {
    if (!n.alive || n.contracted) continue;
    if (dist(player.x, player.y, n.x, n.y) < range + n.r) {
      if (!player.skills.contract) {
        return { ok: false, msg: '需灵魂契约才能招安' };
      }
      if (game.essence < n.cost) {
        return { ok: false, msg: `契约需要 ${n.cost} 精华（${n.name}）` };
      }
      const cost = Math.max(2, n.cost - (player.contractDiscount || 0));
      if (game.essence < cost) {
        return { ok: false, msg: `契约需要 ${cost} 精华（${n.name}）` };
      }
      makeRoomForSummon(player, game);
      game.essence -= cost;
      n.contracted = true;
      n.alive = false;
      const s = createSummon('beast', n.x, n.y);
      applySummonPower(s, player);
      game.entities.summons.push(s);
      game.stats.contracts += 1;
      game.flash = { t: 0.15, color: '#6bc8ff' };
      return { ok: true, msg: `${n.name}已契约` };
    }
  }
  return null;
}

export function damageEnemy(enemy, amount, game) {
  if (!enemy.alive) return;
  let dmg = amount;
  if (game.room?.affix?.enemyHpMul) {
    // hp already scaled at spawn; no change here
  }
  enemy.hp -= dmg;
  game.floatingTexts.push({
    x: enemy.x + rand(-6, 6),
    y: enemy.y - enemy.r - 4,
    text: String(Math.round(dmg)),
    color: '#ffd166',
    life: 0.6,
  });
  if (game.fx) {
    spawnBurst(game.fx, enemy.x, enemy.y, '#ffd166', 3, 50);
    addHitPause(game.fx, 0.03);
  }
  if (game.sfx) game.sfx.hit();
  if (enemy.hp <= 0) killEnemy(enemy, game);
}

export function killEnemy(enemy, game) {
  if (!enemy.alive) return;
  enemy.alive = false;
  const roomLife = 14 + (game.room?.affix?.corpseBonus || 0);
  const c = createCorpse(enemy.x, enemy.y, enemy.typeId);
  c.life = roomLife * (game.player.corpseLifeMul || 1);
  game.entities.corpses.push(c);
  const em = (game.room?.affix?.essenceMul || 1) * (game.player.essenceMul || 1);
  game.entities.essence.push(createEssence(enemy.x + rand(-8, 8), enemy.y + rand(-8, 8), enemy.essence * em));
  if (enemy.isElite || enemy.isBoss) {
    game.entities.shards.push(createSoulShard(enemy.x, enemy.y + 10));
  }
  if (enemy.isBoss) {
    game.stats.bossKills = (game.stats.bossKills || 0) + 1;
    // Boss 专属遗物立即掉落
    if (typeof game.spawnRelicDrop === 'function') game.spawnRelicDrop(true);
    if (game.fx) {
      game.fx.hitPause = Math.max(game.fx.hitPause, 0.28);
      addShake(game.fx, 14);
      addFlash(game.fx, '#ffd166', 0.2);
    }
  }
  if (enemy.isElite && game && Math.random() < 0.35 && game.pendingRelicOffer !== false) {
    // elite may drop extra relic offer next level
    game._eliteRelic = true;
  }
  if (game.player.alive && game.player.skills.blood) {
    game.player.hp = Math.min(game.player.maxHp, game.player.hp + (game.player.bloodHeal || 2));
  }
  game.stats.kills += 1;
  if (game.fx) {
    spawnBurst(game.fx, enemy.x, enemy.y, enemy.isBoss ? '#ff3c6e' : '#ff6b6b', enemy.isBoss ? 18 : 8);
    if (enemy.isBoss) addShake(game.fx, 12);
  }
  if (game.sfx) game.sfx.kill();
}

export function damageSummon(summon, amount) {
  if (!summon.alive) return;
  summon.hp -= amount;
  if (summon.hp <= 0) summon.alive = false;
}

export function sacrificeNearestCorpse(player, game) {
  let best = null;
  let bestD = Infinity;
  for (const c of game.entities.corpses) {
    if (!c.alive) continue;
    const d = dist(player.x, player.y, c.x, c.y);
    if (d < bestD && d < RANGES.raise) {
      bestD = d;
      best = c;
    }
  }
  if (!best) return { ok: false, msg: '附近无尸体' };
  best.alive = false;
  const mp = 18;
  player.mp = Math.min(player.maxMp, player.mp + mp);
  if (game.fx) spawnBurst(game.fx, best.x, best.y, '#6bc8ff', 6);
  if (game.sfx) game.sfx.contract();
  return { ok: true, msg: `献祭 +${mp}蓝` };
}

export function damagePlayer(player, amount, game) {
  if (!player.alive) return;
  let dmg = amount;
  if (player.glass) dmg *= 1.25;
  if (player.skills.armor) dmg *= (player.armorMul || 0.8);
  if (player.thorns > 0 && game?.entities?.enemies) {
    for (const e of game.entities.enemies) {
      if (!e.alive) continue;
      if (dist(player.x, player.y, e.x, e.y) < 50) {
        damageEnemy(e, player.thorns, game);
      }
    }
  }
  player.hp -= dmg;
  game.floatingTexts.push({
    x: player.x,
    y: player.y - 18,
    text: `-${Math.round(dmg)}`,
    color: '#ff6b8a',
    life: 0.7,
  });
  if (game.fx) {
    addShake(game.fx, 4);
    addFlash(game.fx, '#ff4a6a', 0.08);
    spawnBurst(game.fx, player.x, player.y, '#ff6b8a', 5);
  }
  if (game.sfx) game.sfx.hurt();
  // 死亡反冲
  if (player.skills.nova && Math.random() < RANGES.novaChance) {
    game.booms.push({ x: player.x, y: player.y, r: 8, maxR: RANGES.novaRadius, life: 0.25, maxLife: 0.25 });
    for (const e of game.entities.enemies) {
      if (!e.alive) continue;
      if (dist(player.x, player.y, e.x, e.y) <= RANGES.novaRadius + e.r) {
        damageEnemy(e, RANGES.novaDmg, game);
      }
    }
    game.flash = { t: 0.12, color: '#c8b8ff' };
  }
  if (player.hp <= 0) {
    player.hp = 0;
    player.alive = false;
  }
}

export function fireSpear(player, game, mx, my, force = false) {
  if (player.spearTimer > 0 || player.mp < player.spearCost) return false;
  const n = normalize(mx - player.x, my - player.y);
  if (n.x === 0 && n.y === 0) return false;
  player.facing = n;
  player.spearTimer = player.spearCd;
  player.mp -= player.spearCost;

  const shots = [];
  if (player.skills.twin) {
    const extra = 1 + (player.twinExtra || 0);
    const base = Math.atan2(n.y, n.x);
    const spread = 0.18;
    const count = 1 + extra;
    const start = -((count - 1) / 2) * spread;
    for (let i = 0; i < count; i++) {
      const a = base + start + i * spread;
      shots.push({ x: Math.cos(a), y: Math.sin(a) });
    }
  } else {
    shots.push(n);
  }

  for (const s of shots) {
    game.entities.projectiles.push(createProjectile({
      x: player.x + s.x * (player.r + 4),
      y: player.y + s.y * (player.r + 4),
      vx: s.x * player.spearSpeed,
      vy: s.y * player.spearSpeed,
      r: 5,
      dmg: player.spearDmg * (game.room?.affix?.spearRoom || 1),
      from: 'player',
      color: player.skillColor || '#e8d0ff',
      life: 1.2,
      drain: player.drain,
      pierce: player.spearPierce || 0,
      bounce: player.spearBounce || 0,
    }));
  }
  if (game.sfx) game.sfx.spear();
  void force;
  return true;
}

export function summonArmyBonus(player) {
  if (!player.skills.army) return 1;
  const n = player._aliveSummons || 0;
  return 1 + n * RANGES.armyPerSummon;
}

export function applySummonPower(summon, player) {
  if (!summon.baseDmg) summon.baseDmg = summon.dmg;
  summon.dmg = Math.round(summon.baseDmg * player.summonDmgMul * summonArmyBonus(player));
}

export function reapplySummonPower(game, player) {
  const n = game.entities.summons.filter((s) => s.alive).length;
  player._aliveSummons = n;
  for (const s of game.entities.summons) {
    if (!s.alive) continue;
    if (!s.baseDmg) s.baseDmg = s.dmg;
    s.dmg = Math.round(s.baseDmg * player.summonDmgMul * summonArmyBonus(player));
  }
}

export function pickupSoulShard(player, game) {
  const bonus = player.shardBonus || { dmg: 0, hp: 0 };
  for (const s of game.entities.shards) {
    if (!s.alive) continue;
    if (dist(player.x, player.y, s.x, s.y) < player.r + s.r + 4) {
      s.alive = false;
      player.spearDmg += RANGES.shardSpear + bonus.dmg;
      const hpGain = RANGES.shardHp + bonus.hp;
      player.maxHp += hpGain;
      player.hp = Math.min(player.maxHp, player.hp + hpGain);
      player.summonDmgMul *= RANGES.shardSummonMul;
      reapplySummonPower(game, player);
      if (game.entities.summons.filter((x) => x.alive).length < player.maxSummons) {
        const es = createSummon('eliteUndead', player.x + 20, player.y);
        applySummonPower(es, player);
        game.entities.summons.push(es);
      }
      game.stats.shards += 1;
      game.message = '灵魂碎片：强化本体并召唤精英亡灵';
      game.messageTime = 2.5;
      game.flash = { t: 0.25, color: '#ffd166' };
    }
  }
}

export function absorbEssence(player, game, dt) {
  const magnet = player.skills.harvest ? RANGES.essenceMagnetHarvest : RANGES.essenceMagnet;
  for (const e of game.entities.essence) {
    if (!e.alive) continue;
    e.age += dt;
    const d = dist(player.x, player.y, e.x, e.y);
    if (d < magnet) {
      const n = normalize(player.x - e.x, player.y - e.y);
      const sp = 180 + (magnet - d) * 2;
      e.x += n.x * sp * dt;
      e.y += n.y * sp * dt;
    }
    if (d < player.r + e.r + 2) {
      e.alive = false;
      const mul = player.essenceMul || 1;
      game.essence += e.amount * mul;
      game.stats.essence += e.amount * mul;
    }
  }
}

export function stepProjectiles(game, dt) {
  const { projectiles, enemies, summons } = game.entities;
  const player = game.player;
  for (const p of projectiles) {
    if (!p.alive) continue;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) p.alive = false;

    const room = game.room;
    if (p.x < room.x || p.x > room.x + room.w || p.y < room.y || p.y > room.y + room.h) {
      p.alive = false;
      continue;
    }

    if (p.from === 'player' || p.from === 'summon') {
      for (const e of enemies) {
        if (!e.alive) continue;
        if (circleHit(p.x, p.y, p.r, e.x, e.y, e.r)) {
          damageEnemy(e, p.dmg, game);
          if (p.from === 'player' && player.spearSplash > 0) {
            for (const other of enemies) {
              if (!other.alive || other === e) continue;
              if (dist(e.x, e.y, other.x, other.y) < 36 + other.r) {
                damageEnemy(other, player.spearSplash, game);
              }
            }
          }
          if (p.drain > 0 && p.from === 'player' && player.alive) {
            player.hp = Math.min(player.maxHp, player.hp + p.drain);
          }
          if (p.pierce > 0) p.pierce -= 1;
          else if (p.bounce > 0) {
            // bounce to nearest other enemy
            p.bounce -= 1;
            let nt = null;
            let nd = Infinity;
            for (const o of enemies) {
              if (!o.alive || o === e) continue;
              const d = dist(p.x, p.y, o.x, o.y);
              if (d < nd && d < 160) { nd = d; nt = o; }
            }
            if (nt) {
              const n = normalize(nt.x - p.x, nt.y - p.y);
              p.vx = n.x * (p.from === 'player' ? player.spearSpeed : 220);
              p.vy = n.y * (p.from === 'player' ? player.spearSpeed : 220);
              p.life = Math.max(p.life, 0.6);
            } else p.alive = false;
          } else p.alive = false;
          break;
        }
      }
    } else if (p.from === 'enemy') {
      if (player.alive && circleHit(p.x, p.y, p.r, player.x, player.y, player.r)) {
        damagePlayer(player, p.dmg, game);
        p.alive = false;
        continue;
      }
      let hit = false;
      for (const n of game.entities.neutrals) {
        if (!n.alive || n.contracted) continue;
        if (circleHit(p.x, p.y, p.r, n.x, n.y, n.r)) {
          if (game.damageNeutral) game.damageNeutral(n, p.dmg);
          p.alive = false;
          hit = true;
          break;
        }
      }
      if (hit) continue;
      for (const s of summons) {
        if (!s.alive) continue;
        if (circleHit(p.x, p.y, p.r, s.x, s.y, s.r)) {
          damageSummon(s, p.dmg);
          p.alive = false;
          break;
        }
      }
    }
  }
  // cleanup
  game.entities.projectiles = projectiles.filter((p) => p.alive);
}
