/** Out-of-run best records */
const KEY = 'necromancer_records_v1';

export function loadRecords() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { bestFloor: 0, bestKills: 0, fastestWinMs: 0, endlessBest: 0 };
    return JSON.parse(raw);
  } catch {
    return { bestFloor: 0, bestKills: 0, fastestWinMs: 0, endlessBest: 0 };
  }
}

export function saveRecords(r) {
  try { localStorage.setItem(KEY, JSON.stringify(r)); } catch { /* */ }
  return r;
}

export function recordRun({ win, floor, kills, runMs, endlessFloor }) {
  const r = loadRecords();
  r.bestFloor = Math.max(r.bestFloor || 0, floor || 0);
  r.bestKills = Math.max(r.bestKills || 0, kills || 0);
  if (win) r.wins = (r.wins || 0) + 1;
  if (win && runMs > 0) {
    r.fastestWinMs = r.fastestWinMs ? Math.min(r.fastestWinMs, runMs) : runMs;
  }
  if (endlessFloor) r.endlessBest = Math.max(r.endlessBest || 0, endlessFloor);
  return saveRecords(r);
}

export function weeklyKey() {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  return `W${d.getFullYear()}-${week}`;
}

/** Mode unlocks from main progression */
export function modeUnlocks() {
  const r = loadRecords();
  const bestFloor = r.bestFloor || 0;
  const wins = r.wins || 0;
  return {
    daily: bestFloor >= 2,
    weekly: bestFloor >= 3,
    endless: wins >= 1,
    dailyHint: '主线到达第 2 层解锁',
    weeklyHint: '主线到达第 3 层解锁',
    endlessHint: '通关主线（击败第 3 层 Boss）解锁',
    bestFloor,
    wins,
  };
}
