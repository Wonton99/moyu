import { SKILL_META } from './constants.js?v=cb51554320';

export const SKINS = [
  { id: 'player_violet', cat: 'player', name: '紫晶死灵', cost: 0, tint: null, desc: '默认' },
  { id: 'player_bone', cat: 'player', name: '白骨先知', cost: 40, tint: '#e8dcc0', desc: '骨白色调' },
  { id: 'player_blood', cat: 'player', name: '血宴', cost: 60, tint: '#ff6b8a', desc: '猩红调' },
  { id: 'player_frost', cat: 'player', name: '霜墓', cost: 80, tint: '#9adcff', desc: '冰蓝调' },
  { id: 'corpse_moss', cat: 'corpse', name: '苔藓尸', cost: 30, tint: '#6a8a4a', desc: '尸体偏绿' },
  { id: 'corpse_ash', cat: 'corpse', name: '灰烬尸', cost: 30, tint: '#8a8a9a', desc: '尸体偏灰' },
  { id: 'corpse_blood', cat: 'corpse', name: '血渍尸', cost: 50, tint: '#8a3030', desc: '尸体偏红' },
  { id: 'skill_amber', cat: 'skill', name: '琥珀骨矛', cost: 45, tint: '#ffd166', desc: '骨矛偏金' },
  { id: 'skill_venom', cat: 'skill', name: '剧毒骨矛', cost: 55, tint: '#7dffa0', desc: '骨矛偏绿' },
  { id: 'skill_void', cat: 'skill', name: '虚空骨矛', cost: 70, tint: '#c060ff', desc: '骨矛偏紫' },
];

export function defaultSkins() {
  return {
    owned: ['player_violet', 'corpse_moss'],
    player: 'player_violet',
    corpse: 'corpse_moss',
    skill: null,
  };
}

export function loadSkins() {
  try {
    const raw = localStorage.getItem('necromancer_skins_v1');
    if (!raw) return defaultSkins();
    const d = JSON.parse(raw);
    const base = defaultSkins();
    return {
      owned: Array.from(new Set([...base.owned, ...(d.owned || [])])),
      player: d.player || base.player,
      corpse: d.corpse || base.corpse,
      skill: d.skill || null,
    };
  } catch {
    return defaultSkins();
  }
}

export function saveSkins(s) {
  try { localStorage.setItem('necromancer_skins_v1', JSON.stringify(s)); } catch { /* */ }
  return s;
}

export function buySkin(meta, skins, id) {
  const def = SKINS.find((x) => x.id === id);
  if (!def) return { ok: false, meta, skins };
  if (skins.owned.includes(id)) {
    // equip
    const next = { ...skins, [def.cat]: id };
    saveSkins(next);
    return { ok: true, meta, skins: next };
  }
  if (meta.dust < def.cost) return { ok: false, meta, skins };
  const nextMeta = { ...meta, dust: meta.dust - def.cost };
  const next = {
    ...skins,
    owned: [...skins.owned, id],
    [def.cat]: id,
  };
  saveSkins(next);
  try { localStorage.setItem('necromancer_meta_v1', JSON.stringify(nextMeta)); } catch { /* */ }
  return { ok: true, meta: nextMeta, skins: next };
}

export function getPlayerTint(skins) {
  const def = SKINS.find((s) => s.id === skins.player);
  return def?.tint || null;
}

export function getCorpseTint(skins) {
  const def = SKINS.find((s) => s.id === skins.corpse);
  return def?.tint || null;
}

export function getSkillColor(skins) {
  const def = SKINS.find((s) => s.id === skins.skill);
  return def?.tint || '#e8d0ff';
}

/** Accent for player glow / particles */
export function getAccentColor(skins) {
  return getPlayerTint(skins) || getSkillColor(skins);
}

void SKILL_META;
