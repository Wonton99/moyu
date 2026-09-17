import { SKILL_META, META_UPGRADES, ENEMY_TYPES, SUMMON_TYPES, CODEX_ENEMY, CODEX_SUMMON, CODEX_NEUTRAL, RARITY, rarityOf, UPGRADES } from './constants.js?v=cb51554320';
import { loadMeta, getLevel, costFor, canBuy, buyUpgrade } from './meta.js?v=cb51554320';
import { loadCodex, codexProgress } from './codex.js?v=cb51554320';
import { VERSION, CHANGELOG } from './version.js?v=cb51554320';
import { SKINS, loadSkins, buySkin } from './skins.js?v=cb51554320';
import { ACHIEVEMENTS, loadAch } from './achievements.js?v=cb51554320';
import { drawSprite } from './sprites.js?v=cb51554320';
import { loadRecords, weeklyKey, modeUnlocks } from './records.js?v=cb51554320';
import { loadSettings, saveSettings } from './settings.js?v=cb51554320';
import { RELICS } from './relics.js?v=cb51554320';
import { MASTERIES } from './mastery.js?v=cb51554320';

export function $(id) {
  return document.getElementById(id);
}

export function showOverlay(html) {
  const overlay = $('overlay');
  const panel = $('overlayPanel');
  panel.innerHTML = html;
  overlay.classList.remove('hidden');
}

export function hideOverlay() {
  $('overlay').classList.add('hidden');
}

export function updateHud(game) {
  const p = game.player;
  $('hpFill').style.width = `${Math.max(0, (p.hp / p.maxHp) * 100)}%`;
  $('hpText').textContent = `${Math.ceil(p.hp)}/${p.maxHp}`;
  $('mpFill').style.width = `${Math.max(0, (p.mp / p.maxMp) * 100)}%`;
  $('mpText').textContent = `${Math.floor(p.mp)}/${p.maxMp}`;
  const need = game.essenceNeed;
  $('xpFill').style.width = `${Math.min(100, (game.essence / need) * 100)}%`;
  $('xpText').textContent = `精华 ${game.essence}/${need}`;
  $('floorText').textContent = `第 ${game.floor} 层`;
  $('roomText').textContent = `房间 ${game.roomIndex + 1}/5`;
  $('summonText').textContent = `召唤 ${game.entities.summons.filter((s) => s.alive).length}/${p.maxSummons}`;
  $('levelText').textContent = `Lv.${game.level}`;
  updateSkills(p);
  const hint = game.messageTime > 0 ? game.message : hintText(game);
  $('hint').textContent = hint;
}

let talentPanelOpen = false;

export function toggleTalentPanel(force) {
  talentPanelOpen = typeof force === 'boolean' ? force : !talentPanelOpen;
  return talentPanelOpen;
}

export function isTalentPanelOpen() {
  return talentPanelOpen;
}

function updateSkills(player) {
  const el = $('skills');
  if (!el) return;
  const unlocked = Object.keys(SKILL_META).filter((k) => player.skills[k]);
  const total = Object.keys(SKILL_META).length;
  const parts = ['<span class="skill-chip spear on">LMB 骨矛</span>'];
  // hotbar: only unlocked talents (scales with late-game skill count)
  for (const key of unlocked) {
    const meta = SKILL_META[key];
    const label = meta.key === '被动' ? meta.name : `${meta.key} ${meta.name}`;
    parts.push(`<span class="skill-chip on">${label}</span>`);
  }
  parts.push(
    `<span class="skill-chip talent-toggle" id="talentToggle" title="Tab 查看全部天赋">天赋 ${unlocked.length}/${total}${talentPanelOpen ? ' ▲' : ' ▼'}</span>`,
  );
  el.innerHTML = parts.join('');
  updateTalentPanel(player, unlocked.length, total);
}

function updateTalentPanel(player, unlockedCount, total) {
  const panel = $('talentPanel');
  if (!panel) return;
  if (!talentPanelOpen) {
    panel.classList.add('hidden');
    panel.innerHTML = '';
    return;
  }
  panel.classList.remove('hidden');
  const skillRarity = {};
  for (const u of UPGRADES) {
    if (u.unlock) skillRarity[u.unlock] = rarityOf(u);
  }
  const keys = Object.keys(SKILL_META).sort((a, b) => {
    const ra = RARITY[skillRarity[a] || 'white']?.rank ?? 4;
    const rb = RARITY[skillRarity[b] || 'white']?.rank ?? 4;
    return ra - rb;
  });
  const rows = keys.map((key) => {
    const meta = SKILL_META[key];
    const on = !!player.skills[key];
    const st = on ? '已学' : '未学';
    const r = skillRarity[key] || 'white';
    const keyLabel = meta.key === '被动' ? '被动' : meta.key;
    return `
      <div class="talent-row ${on ? 'unlocked' : 'locked'} r-${r}">
        <span class="st">${st}</span>
        <span class="nm">[${keyLabel}] ${meta.name}</span>
        <span class="ds">${meta.desc}</span>
      </div>`;
  }).join('');
  panel.innerHTML = rows + `<div class="tip">已解锁 ${unlockedCount}/${total} · Tab 收起</div>`;
}

function hintText(game) {
  if (game.state !== 'playing') return '';
  const p = game.player;
  if (!game.room.doorOpen) {
    const bits = ['清敌'];
    if (p.skills.raise) bits.push('Q');
    if (p.skills.boom) bits.push('E');
    return bits.join(' · ');
  }
  return '→';
}

export function showTitle() {
  const meta = loadMeta();
  const codex = loadCodex();
  const rec = loadRecords();
  const u = modeUnlocks();
  const prog = codexProgress(codex, {
    enemies: Object.keys(ENEMY_TYPES).length,
    summons: Object.keys(SUMMON_TYPES).length,
    skills: Object.keys(SKILL_META).length,
    neutrals: Object.keys(CODEX_NEUTRAL).length,
  });
  const modeBtn = (id, label, ok) => ok
    ? `<button class="btn mode-btn" id="${id}">${label}</button>`
    : `<button class="btn mode-btn locked" id="${id}">${label}</button>`;
  showOverlay(`
    <h1>死灵召唤师</h1>
    <p class="sub">短跑肉鸽 <span class="ver">v${VERSION}</span></p>
    <button class="btn btn-primary" id="btnStart">开始征讨</button>
    <div class="mode-row">
      ${modeBtn('btnEndless', '无尽', u.endless)}
      ${modeBtn('btnDaily', '每日', u.daily)}
      ${modeBtn('btnWeekly', '周挑战', u.weekly)}
    </div>
    <div class="util-row">
      <button class="btn btn-ghost" id="btnMeta">养成</button>
      <button class="btn btn-ghost" id="btnSkins">皮肤</button>
      <button class="btn btn-ghost" id="btnCodex">词典</button>
      <button class="btn btn-ghost" id="btnAch">成就</button>
      <button class="btn btn-ghost" id="btnSettings">设置</button>
      <button class="btn btn-ghost" id="btnChangelog">公告</button>
    </div>
    <p class="dust-line">魂尘 <b>${meta.dust}</b></p>
    <p class="codex-line">最深 ${rec.bestFloor} · 通关 ${rec.wins || 0} · 击杀 ${rec.bestKills}</p>
    <p class="codex-line dim">词典 敌 ${prog.enemies} · 召 ${prog.summons} · 天赋 ${prog.skills}</p>
  `);
}

export function showLockedMode(name, hint) {
  showOverlay(`
    <h2>${name}</h2>
    <p class="codex-line">尚未解锁</p>
    <p>${hint}</p>
    <div class="btn-row">
      <button class="btn" id="btnLockedBack">返回</button>
    </div>
  `);
}

export function showMeta() {
  const meta = loadMeta();
  const rows = META_UPGRADES.map((def) => {
    const lv = getLevel(meta, def.id);
    const maxed = def.maxLevel != null && lv >= def.maxLevel;
    const cost = maxed ? 0 : costFor(def, lv);
    const ok = canBuy(meta, def);
    const lvText = def.maxLevel === 1 ? (lv ? '已购' : '未购') : `${lv}/${def.maxLevel}`;
    return `
      <div class="meta-row ${maxed ? 'maxed' : ''}">
        <div class="meta-info">
          <div class="meta-name">${def.name} <span class="meta-lv">${lvText}</span></div>
          <div class="meta-desc">${def.desc}</div>
        </div>
        <button class="btn meta-buy ${ok ? '' : 'disabled'}" data-meta="${def.id}" ${maxed ? 'disabled' : ''}>
          ${maxed ? '已满' : `${cost} 魂尘`}
        </button>
      </div>`;
  }).join('');
  showOverlay(`
    <h2>养成</h2>
    <p>魂尘 <b class="dust">${meta.dust}</b></p>
    <div class="meta-list">${rows}</div>
    <div class="btn-row">
      <button class="btn" id="btnMetaBack">返回</button>
    </div>
  `);
}

export function showSettings() {
  const s = loadSettings();
  showOverlay(`
    <h2>设置</h2>
    <div class="meta-list">
      <div class="meta-row">
        <div class="meta-info"><div class="meta-name">总音量</div></div>
        <input type="range" id="setVol" min="0" max="1" step="0.05" value="${s.volume}" />
      </div>
      <div class="meta-row">
        <div class="meta-info"><div class="meta-name">音效</div></div>
        <input type="range" id="setVolSfx" min="0" max="1" step="0.05" value="${s.volSfx ?? 1}" />
      </div>
      <div class="meta-row">
        <div class="meta-info"><div class="meta-name">音乐</div></div>
        <input type="range" id="setVolBgm" min="0" max="1" step="0.05" value="${s.volBgm ?? 0.7}" />
      </div>
      <div class="meta-row">
        <div class="meta-info"><div class="meta-name">界面音</div></div>
        <input type="range" id="setVolUi" min="0" max="1" step="0.05" value="${s.volUi ?? 1}" />
      </div>
      <div class="meta-row">
        <div class="meta-info"><div class="meta-name">震屏</div></div>
        <input type="range" id="setShake" min="0" max="1.5" step="0.1" value="${s.shake}" />
      </div>
      <div class="meta-row">
        <div class="meta-info"><div class="meta-name">粒子</div></div>
        <input type="range" id="setPart" min="0" max="1.5" step="0.1" value="${s.particles}" />
      </div>
      <div class="meta-row">
        <div class="meta-info"><div class="meta-name">背景音乐</div></div>
        <button class="btn meta-buy" id="setBgm">${s.bgm ? '开' : '关'}</button>
      </div>
    </div>
    <div class="btn-row"><button class="btn" id="btnSettingsBack">返回</button></div>
  `);
}

export function showWeekly() {
  const aff = weeklyAffixId();
  const names = {
    blood_moon: '血月（敌伤↑精华↑）',
    spike_floor: '尖刺地牢（大量尖刺陷阱）',
    toxic_fog: '毒雾（多处毒池）',
    haste_dead: '尸疾（敌加速）',
  };
  showOverlay(`
    <h2>周挑战</h2>
    <p class="codex-line">本周 ${weeklyKey()} · 词缀「${names[aff] || aff}」· 魂尘 ×1.5</p>
    <div class="btn-row">
      <button class="btn" id="btnWeeklyGo">出征</button>
      <button class="btn btn-alt" id="btnSettingsBack2">返回</button>
    </div>
  `);
}

function weeklyAffixId() {
  const pool = ['blood_moon', 'spike_floor', 'toxic_fog', 'haste_dead'];
  const k = weeklyKey();
  let h = 0;
  for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) | 0;
  return pool[Math.abs(h) % pool.length];
}

export function showCodex(opts = {}) {
  const focus = opts.focus || '';
  const codex = loadCodex();
  const has = (cat, id) => !!codex[cat]?.[id];
  const hl = (id) => (focus === id ? ' focus' : '');

  const enemyRows = Object.keys(ENEMY_TYPES).map((id) => {
    const t = ENEMY_TYPES[id];
    const known = has('enemies', id);
    return `
      <div class="codex-row ${known ? 'known' : 'unknown'}${hl('enemy:' + id)}">
        <div class="codex-name">${known ? t.name : '？？？'}</div>
        <div class="codex-desc">${known ? (CODEX_ENEMY[id] || '') : '尚未遭遇'}</div>
      </div>`;
  }).join('');

  const summonRows = Object.keys(SUMMON_TYPES).map((id) => {
    const t = SUMMON_TYPES[id];
    const known = has('summons', id);
    return `
      <div class="codex-row ${known ? 'known' : 'unknown'}${hl('summon:' + id)}">
        <div class="codex-name">${known ? t.name : '？？？'}</div>
        <div class="codex-desc">${known ? (CODEX_SUMMON[id] || '') : '尚未炼成'}</div>
      </div>`;
  }).join('');

  const skillRows = Object.keys(SKILL_META).map((id) => {
    const t = SKILL_META[id];
    const known = has('skills', id);
    return `
      <div class="codex-row ${known ? 'known' : 'unknown'}${hl('skill:' + id)}">
        <div class="codex-name">${known ? t.name : '？？？'}${t.key && known ? ` <span class="key-hint">[${t.key}]</span>` : ''}</div>
        <div class="codex-desc">${known ? t.desc : '尚未领悟'}</div>
      </div>`;
  }).join('');

  const neutralRows = Object.keys(CODEX_NEUTRAL).map((id) => {
    const known = has('neutrals', id);
    const name = id === 'wisp' ? '游魂' : '野狼';
    return `
      <div class="codex-row ${known ? 'known' : 'unknown'}${hl('neutral:' + id)}">
        <div class="codex-name">${known ? name : '？？？'}</div>
        <div class="codex-desc">${known ? CODEX_NEUTRAL[id] : '尚未发现'}</div>
      </div>`;
  }).join('');

  const relicRows = RELICS.map((r) => {
    const tag = r.cursed ? '[诅咒]' : r.bossOnly ? '[Boss]' : '';
    return `
      <div class="codex-row known${hl('relic:' + r.id)}">
        <div class="codex-name">${tag} ${r.name}</div>
        <div class="codex-desc">${r.desc}</div>
      </div>`;
  }).join('');

  const masteryRows = MASTERIES.map((m) => {
    const need = (m.need || []).map((k) => SKILL_META[k]?.name || k).join(' + ');
    return `
      <div class="codex-row known${hl('mastery:' + m.id)}">
        <div class="codex-name">${m.name}</div>
        <div class="codex-desc">需 ${need} · ${m.desc}</div>
      </div>`;
  }).join('');

  showOverlay(`
    <h2>词典</h2>
    <div class="meta-list codex-list" id="codexList">
      <h3>敌人</h3>${enemyRows}
      <h3>召唤</h3>${summonRows}
      <h3>天赋</h3>${skillRows}
      <h3>遗物</h3>${relicRows}
      <h3>共鸣</h3>${masteryRows}
      <h3>中立</h3>${neutralRows}
    </div>
    <div class="btn-row">
      <button class="btn" id="btnCodexBack">返回</button>
    </div>
  `);
  // scroll focused row into view
  if (focus) {
    const el = document.querySelector('.codex-row.focus');
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'center' });
    }
  }
}

export function showChangelog() {
  const blocks = CHANGELOG.map((c) => `
    <div class="log-block">
      <div class="log-ver">v${c.version} · ${c.title}</div>
      <ul class="log-items">${c.items.map((i) => `<li>${i}</li>`).join('')}</ul>
    </div>
  `).join('');
  showOverlay(`
    <h2>公告</h2>
    <p>v${VERSION}</p>
    <div class="meta-list codex-list">${blocks}</div>
    <div class="btn-row">
      <button class="btn" id="btnChangelogBack">返回</button>
    </div>
  `);
}

export function showPause(game) {
  const p = game.player;
  const unlocked = Object.keys(SKILL_META).filter((k) => p.skills[k]);
  const skillChips = unlocked.length
    ? unlocked.map((k) => {
      const s = SKILL_META[k];
      const label = s.key === '被动' ? s.name : `${s.key} ${s.name}`;
      return `<span class="chip-link" data-codex="skill:${k}">${label}</span>`;
    }).join('')
    : '<span class="skill-chip">仅骨矛</span>';

  const relicCounts = {};
  for (const id of game.relics || []) relicCounts[id] = (relicCounts[id] || 0) + 1;
  const relicChips = Object.entries(relicCounts).map(([id, n]) => {
    const def = RELICS.find((r) => r.id === id);
    const name = def?.name || id;
    return `<span class="chip-link" data-codex="relic:${id}">${name}${n > 1 ? `×${n}` : ''}</span>`;
  }).join('') || '<span class="skill-chip">无</span>';

  const masteryIds = p._masteries ? Object.keys(p._masteries) : [];
  const masteryChips = masteryIds.map((id) => {
    const m = MASTERIES.find((x) => x.id === id);
    return `<span class="chip-link" data-codex="mastery:${id}">${m?.name || id}</span>`;
  }).join('') || '<span class="skill-chip">无</span>';

  const affixName = game.room?.affix?.name;
  showOverlay(`
    <h2>暂停</h2>
    <div class="controls compact">
      <div><kbd>WASD</kbd> 移动 · 左键骨矛 · <kbd>Q</kbd>炼尸 <kbd>E</kbd>尸爆 <kbd>R</kbd>献祭 <kbd>F</kbd>互动</div>
      <div><kbd>空格</kbd>冲刺 · <kbd>Tab</kbd>天赋表 · 点虚线项查看说明</div>
    </div>
    <p class="codex-line">技能</p>
    <div class="pause-skills">${skillChips}</div>
    <p class="codex-line">遗物</p>
    <div class="pause-skills">${relicChips}</div>
    <p class="codex-line">共鸣</p>
    <div class="pause-skills">${masteryChips}</div>
    <p class="codex-line">
      <span class="chip-link" data-stats="1">详细属性</span>
      ${affixName ? `· <span class="chip-link" data-codex="affix:${affixName}">词缀 ${affixName}</span>` : ''}
    </p>
    <div class="btn-row">
      <button class="btn" id="btnResume">继续</button>
      <button class="btn btn-alt" id="btnAbandon">提前结束</button>
    </div>
  `);
}

export function showStatsDetail(game) {
  const p = game.player;
  const pct = (mul) => `${Math.round((1 - mul) * 100)}%`;
  const armorPct = p.skills.armor ? pct(p.armorMul || 0.8) : '0%';
  const rows = [
    ['生命', `${Math.ceil(p.hp)} / ${p.maxHp}`],
    ['蓝量', `${Math.floor(p.mp)} / ${p.maxMp}`],
    ['回蓝', `${(p.mpRegen * (game.room?.affix?.mpRegenMul || 1)).toFixed(1)}/s`],
    ['击杀回血', p.skills.blood || p.bloodHeal ? `${p.bloodHeal || 2}` : '—'],
    ['骨矛伤害', `${Math.round(p.spearDmg)}`],
    ['骨矛攻速', `${(1 / Math.max(0.05, p.spearCd)).toFixed(1)}/s`],
    ['穿透 / 弹射 / 溅射', `${p.spearPierce || 0} / ${p.spearBounce || 0} / ${p.spearSplash || 0}`],
    ['尸爆伤害 / 半径', `${Math.round(p.boomDmg)} / ${Math.round(p.boomRadius)}`],
    ['炼尸耗蓝', `${p.raiseCost}`],
    ['召唤伤害倍率', `×${(p.summonDmgMul || 1).toFixed(2)}`],
    ['召唤上限', `${p.maxSummons}`],
    ['移速', `${Math.round(p.speed)}`],
    ['减伤（骨甲）', armorPct],
    ['精华倍率', `×${(p.essenceMul || 1).toFixed(2)}`],
    ['刷新次数', `${p.refreshLeft}`],
    ['词缀', game.room?.affix?.name || '无'],
  ].map(([k, v]) => `
    <div class="codex-row known">
      <div class="codex-name">${k}</div>
      <div class="codex-desc">${v}</div>
    </div>`).join('');
  showOverlay(`
    <h2>详细属性</h2>
    <div class="meta-list codex-list pause-detail">${rows}</div>
    <div class="btn-row">
      <button class="btn" id="btnStatsBack">返回暂停</button>
      <button class="btn btn-alt" id="btnResume">继续</button>
    </div>
  `);
}

export function showSkins() {
  const meta = loadMeta();
  const skins = loadSkins();
  const groups = ['player', 'corpse', 'skill'];
  const titles = { player: '人物', corpse: '尸体', skill: '技能' };
  let rows = '';
  for (const cat of groups) {
    rows += `<h3>${titles[cat]}</h3>`;
    for (const s of SKINS.filter((x) => x.cat === cat)) {
      const owned = skins.owned.includes(s.id);
      const equipped = skins[cat] === s.id;
      const label = equipped ? '使用中' : owned ? '装备' : `${s.cost} 尘`;
      rows += `
        <div class="meta-row skin-row ${equipped ? 'maxed' : ''}" data-skin-hover="${s.id}" data-cat="${cat}" data-tint="${s.tint || ''}">
          <div class="meta-info">
            <div class="meta-name">${s.name}</div>
            <div class="meta-desc">${s.desc}</div>
          </div>
          <button class="btn meta-buy" data-skin="${s.id}" ${equipped ? 'disabled' : ''}>${label}</button>
        </div>`;
    }
  }
  const eq = SKINS.find((s) => s.id === skins.player) || SKINS[0];
  showOverlay(`
    <h2>皮肤</h2>
    <p>魂尘 <b class="dust">${meta.dust}</b> · 悬停预览</p>
    <div class="skin-layout">
      <div class="meta-list codex-list skin-list">${rows}</div>
      <div class="skin-preview-box">
        <canvas id="skinPreview" width="160" height="160"></canvas>
        <div id="skinPreviewLabel" class="skin-preview-label">${eq.name}</div>
      </div>
    </div>
    <div class="btn-row"><button class="btn" id="btnSkinsBack">返回</button></div>
  `);
  // default preview = equipped player
  drawSkinPreview('player', skins.player);
}

export function drawSkinPreview(cat, skinId) {
  const canvas = document.getElementById('skinPreview');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const def = SKINS.find((s) => s.id === skinId);
  const label = document.getElementById('skinPreviewLabel');
  if (label && def) label.textContent = `${def.name} · ${def.desc}`;

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // stage
  ctx.fillStyle = '#1a1024';
  ctx.fillRect(0, 0, 160, 160);
  for (let y = 0; y < 160; y += 8) {
    for (let x = 0; x < 160; x += 8) {
      if (((x + y) / 8) % 2 === 0) {
        ctx.fillStyle = '#241638';
        ctx.fillRect(x, y, 8, 8);
      }
    }
  }
  ctx.strokeStyle = '#3a2850';
  ctx.strokeRect(8, 8, 144, 144);

  const tint = def?.tint || null;
  if (cat === 'player' || cat === 'corpse') {
    const key = cat === 'player' ? 'player' : 'corpse';
    // scale 5 for visibility
    drawSprite(ctx, key, 80, 78, 5, false, tint);
    ctx.fillStyle = '#a898c0';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(cat === 'player' ? '死灵师' : '尸体', 80, 130);
  } else {
    // skill: bone spear trail
    const col = tint || '#e8d0ff';
    ctx.fillStyle = col;
    for (let i = 0; i < 4; i++) {
      const x = 36 + i * 28;
      const a = 1 - i * 0.2;
      ctx.globalAlpha = a;
      ctx.fillRect(x, 76, 18, 8);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#fff';
    ctx.fillRect(126, 78, 10, 4);
    // impact pixels
    ctx.fillStyle = col;
    ctx.fillRect(48, 58, 4, 4);
    ctx.fillRect(60, 92, 3, 3);
    ctx.fillStyle = '#a898c0';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('骨矛', 80, 130);
  }
}

export function showAchievements() {
  const ach = loadAch();
  const rows = ACHIEVEMENTS.map((a) => {
    const on = !!ach[a.id];
    return `
      <div class="codex-row ${on ? 'known' : 'unknown'}">
        <div class="codex-name">${a.name}</div>
        <div class="codex-desc">${on ? a.desc : '未解锁'}</div>
      </div>`;
  }).join('');
  showOverlay(`
    <h2>成就</h2>
    <div class="meta-list codex-list">${rows}</div>
    <div class="btn-row"><button class="btn" id="btnAchBack">返回</button></div>
  `);
}

export function showUpgrade(choices, game) {
  const cards = choices.map((u, i) => {
    const r = rarityOf(u);
    const tag = u.unlock
      ? '<div class="talent-tag">天赋</div>'
      : u.curse
        ? '<div class="curse-tag">诅咒</div>'
        : '';
    return `
    <div class="upgrade-card r-${r} ${u.unlock ? 'is-talent' : ''} ${u.curse ? 'is-curse' : ''}" data-id="${u.id}">
      ${tag}
      <div class="name">${u.name}</div>
      <div class="desc">${u.desc}</div>
      <div class="key">按 ${i + 1} / Enter</div>
      ${u.curse ? '' : `<button class="exclude-btn" data-exclude="${u.id}" title="本局不再出现">×</button>`}
    </div>
  `;
  }).join('');
  const left = game.player?.refreshLeft ?? 0;
  const exN = game.excludedUpgrades?.size || 0;
  showOverlay(`
    <h2>强化 Lv.${game.level}</h2>
    <div class="upgrade-grid">${cards}</div>
    <div class="btn-row">
      <button class="btn btn-alt" id="btnRefreshUp" ${left <= 0 ? 'disabled' : ''}>刷新（剩余 ${left}）· R</button>
    </div>
    <p class="codex-line">点 × 本局排除${exN ? ` · 已排除 ${exN}` : ''}</p>
  `);
}

export function showRelicConfirm(relic, game) {
  const r = relic?.rarity || 'purple';
  const cursed = !!relic?.cursed;
  const glow = {
    red: '0 0 18px rgba(255,74,106,0.5)',
    gold: '0 0 16px rgba(255,209,102,0.45)',
    purple: '0 0 14px rgba(192,96,255,0.4)',
    blue: '0 0 12px rgba(107,200,255,0.35)',
  }[r] || '';
  showOverlay(`
    <h2>${cursed ? '诅咒遗物' : '发现遗物'}</h2>
    <div class="upgrade-grid" style="grid-template-columns:1fr;max-width:360px;margin:14px auto">
      <div class="upgrade-card r-${r} ${cursed ? 'is-curse' : ''}" style="box-shadow:${glow}">
        <div class="talent-tag">${cursed ? '诅咒' : '遗物'}</div>
        <div class="name">${relic?.name || '???'}</div>
        <div class="desc">${relic?.desc || ''}</div>
        ${cursed ? '<div class="desc" style="color:#ff8e9e;margin-top:6px">永久负面，慎取</div>' : ''}
      </div>
    </div>
    <p class="codex-line">${cursed ? '强而危险，是否拾取？' : '是否拾取？'}</p>
    <div class="btn-row">
      <button class="btn" id="btnRelicTake">拾取</button>
      <button class="btn btn-alt" id="btnRelicSkip">放弃</button>
    </div>
  `);
}

export function showRelicPick(relic, game) {
  showRelicConfirm(relic, game);
}

export function showVictory(game) {
  const s = game.stats;
  const dust = game.lastDust || 0;
  showOverlay(`
    <h1 class="victory">永夜征服</h1>
    <p>尸王已陨。你的亡者军团踏平了墓园。</p>
    <div class="stats-row">
      <span>击杀 ${s.kills}</span>
      <span>炼尸 ${s.raises}</span>
      <span>坟墓 ${s.graves}</span>
      <span>契约 ${s.contracts}</span>
      <span>尸爆 ${s.booms}</span>
      <span>碎片 ${s.shards}</span>
      <span>精华 ${Math.floor(s.essence)}</span>
    </div>
    <p class="dust-line">获得魂尘 <b>+${dust}</b> · 当前 ${game.meta.dust}</p>
    <div class="btn-row">
      <button class="btn" id="btnRestart">再来一局</button>
      <button class="btn btn-alt" id="btnMeta">去养成</button>
    </div>
  `);
}

export function showDefeat(game, abandoned) {
  const s = game.stats;
  const dust = game.lastDust || 0;
  showOverlay(`
    <h1 class="defeat">${abandoned ? '本局结束' : '死灵师陨落'}</h1>
    <p>${abandoned ? '你主动结束了征讨。' : '本体死亡。'}第 ${game.floor} 层 · 房间 ${game.roomIndex + 1}</p>
    <div class="stats-row">
      <span>击杀 ${s.kills}</span>
      <span>炼尸 ${s.raises}</span>
      <span>精华 ${Math.floor(s.essence)}</span>
    </div>
    <p class="dust-line">获得魂尘 <b>+${dust}</b> · 当前 ${game.meta.dust}</p>
    <div class="btn-row">
      <button class="btn" id="btnRestart">重新征讨</button>
      <button class="btn btn-alt" id="btnMeta">去养成</button>
    </div>
  `);
}

export function tryBuyMeta(id) {
  const def = META_UPGRADES.find((d) => d.id === id);
  if (!def) return loadMeta();
  const meta = loadMeta();
  const res = buyUpgrade(meta, def);
  return res.meta;
}
