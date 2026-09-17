const KEY = 'necromancer_codex_v1';

export function defaultCodex() {
  return {
    enemies: {}, // id -> true
    summons: {},
    skills: {},
    neutrals: {},
  };
}

export function loadCodex() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultCodex();
    const data = JSON.parse(raw);
    const base = defaultCodex();
    return {
      enemies: { ...base.enemies, ...(data.enemies || {}) },
      summons: { ...base.summons, ...(data.summons || {}) },
      skills: { ...base.skills, ...(data.skills || {}) },
      neutrals: { ...base.neutrals, ...(data.neutrals || {}) },
    };
  } catch {
    return defaultCodex();
  }
}

export function saveCodex(codex) {
  try {
    localStorage.setItem(KEY, JSON.stringify(codex));
  } catch { /* ignore */ }
  return codex;
}

/** Unlock one entry; returns {codex, unlocked:boolean, label} */
export function unlock(codex, category, id, label) {
  if (!codex[category]) return { codex, unlocked: false, label };
  if (codex[category][id]) return { codex, unlocked: false, label };
  const next = {
    ...codex,
    [category]: { ...codex[category], [id]: true },
  };
  saveCodex(next);
  return { codex: next, unlocked: true, label: label || id };
}

export function unlockEnemy(codex, typeId, name) {
  return unlock(codex, 'enemies', typeId, name);
}

export function unlockSummon(codex, typeId, name) {
  return unlock(codex, 'summons', typeId, name);
}

export function unlockSkill(codex, skillId, name) {
  return unlock(codex, 'skills', skillId, name);
}

export function unlockNeutral(codex, typeId, name) {
  return unlock(codex, 'neutrals', typeId, name);
}

export function codexProgress(codex, totals) {
  const count = (o) => Object.keys(o || {}).filter((k) => o[k]).length;
  return {
    enemies: `${count(codex.enemies)}/${totals.enemies}`,
    summons: `${count(codex.summons)}/${totals.summons}`,
    skills: `${count(codex.skills)}/${totals.skills}`,
    neutrals: `${count(codex.neutrals)}/${totals.neutrals}`,
  };
}

export function codexCompleteBonus(codex, totals) {
  const count = (o) => Object.keys(o || {}).filter((k) => o[k]).length;
  let dust = 0;
  if (count(codex.enemies) >= totals.enemies) dust += 30;
  if (count(codex.summons) >= totals.summons) dust += 20;
  if (count(codex.skills) >= totals.skills) dust += 25;
  if (count(codex.neutrals) >= totals.neutrals) dust += 10;
  return dust;
}
