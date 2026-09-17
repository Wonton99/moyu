const KEY = 'necromancer_meta_v1';

export function defaultMeta() {
  return {
    dust: 0,
    levels: {}, // upgradeId -> level
    stats: {
      runs: 0,
      wins: 0,
      bestFloor: 0,
      totalKills: 0,
      totalDust: 0,
    },
  };
}

export function loadMeta() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultMeta();
    const data = JSON.parse(raw);
    const base = defaultMeta();
    return {
      ...base,
      ...data,
      levels: { ...base.levels, ...(data.levels || {}) },
      stats: { ...base.stats, ...(data.stats || {}) },
    };
  } catch {
    return defaultMeta();
  }
}

export function saveMeta(meta) {
  try {
    localStorage.setItem(KEY, JSON.stringify(meta));
  } catch {
    // ignore quota / private mode
  }
  return meta;
}

export function getLevel(meta, id) {
  return meta.levels[id] || 0;
}

export function costFor(def, level) {
  if (!def.maxLevel && def.maxLevel !== 0) {
    // unlimited-ish default cap 5 unless specified
  }
  const growth = def.costGrowth || 1.6;
  return Math.round(def.baseCost * Math.pow(growth, level));
}

export function canBuy(meta, def) {
  const lv = getLevel(meta, def.id);
  if (def.maxLevel != null && lv >= def.maxLevel) return false;
  return meta.dust >= costFor(def, lv);
}

export function buyUpgrade(meta, def) {
  if (!canBuy(meta, def)) return { ok: false, meta };
  const lv = getLevel(meta, def.id);
  const next = { ...meta, dust: meta.dust - costFor(def, lv), levels: { ...meta.levels, [def.id]: lv + 1 } };
  saveMeta(next);
  return { ok: true, meta: next };
}

export function addDust(meta, amount) {
  const next = {
    ...meta,
    dust: meta.dust + amount,
    stats: {
      ...meta.stats,
      totalDust: (meta.stats.totalDust || 0) + amount,
    },
  };
  saveMeta(next);
  return next;
}

export function recordRunEnd(meta, { win, floor, kills }) {
  const next = {
    ...meta,
    stats: {
      ...meta.stats,
      runs: (meta.stats.runs || 0) + 1,
      wins: (meta.stats.wins || 0) + (win ? 1 : 0),
      bestFloor: Math.max(meta.stats.bestFloor || 0, floor),
      totalKills: (meta.stats.totalKills || 0) + kills,
    },
  };
  saveMeta(next);
  return next;
}

/** Run reward formula */
export function computeRunDust({ win, floor, roomIndex, kills, level }) {
  let dust = Math.floor(kills * 0.4) + Math.floor((level || 1) * 1.5);
  dust += Math.max(0, (floor - 1)) * 12 + (roomIndex || 0) * 2;
  if (win) dust += 40;
  return Math.max(5, dust);
}

/**
 * Apply meta levels onto a fresh player.
 * def.apply(player, level) mutates player.
 */
export function applyMetaToPlayer(player, meta, defs) {
  for (const def of defs) {
    const lv = getLevel(meta, def.id);
    if (lv > 0 && def.apply) def.apply(player, lv);
  }
  player.hp = player.maxHp;
  player.mp = player.maxMp;
  return player;
}

export function essenceMul(meta, defs) {
  const def = defs.find((d) => d.id === 'essence');
  if (!def) return 1;
  const lv = getLevel(meta, def.id);
  return 1 + (def.perLevel || 0) * lv;
}
