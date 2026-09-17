const Meta = (() => {
  const GLOSSARY = {
    combo: {
      name: "连击",
      what: "在限时内连续填对，提高单格产出。",
      how: "手动填对 +1；填错或超时清零。窗口约 5s，随连击缩短（最低 2s）。",
    },
    iron: {
      name: "铁格",
      what: "BOSS 盘上的特殊空格，红框标记。",
      how: "仅手动可填，自动会跳过；手填伤害 ×2。破防后全部解除。",
    },
    boss: {
      name: "BOSS",
      what: "每 5 盘一场带血条的对战盘。",
      how: "填对扣血；技能有回春/破绽/铁壁。破防有额外奖励。",
    },
    variant: {
      name: "异变",
      what: "普通盘上的特殊规则，偏增益。",
      how: "约 30% 出现；按通关盘数逐步解锁。BOSS 不吃异变。",
    },
    chip: {
      name: "芯片",
      what: "研究用的永久货币。",
      how: "重置升级页按投入返还：自动化约每 200 能量 1 枚，能量奖励/其他加成约每 900 一枚。",
    },
    crit: {
      name: "暴击",
      what: "填对时概率双倍能量。",
      how: "其他加成「能量暴击」、研究、暴击领域异变可提升。",
    },
    offline: {
      name: "离线",
      what: "关闭页面后仍可累计少量能量。",
      how: "效率 12%，最多 8 小时；需已有自动化。",
    },
    daily: {
      name: "每日一题",
      what: "当天固定种子的特殊盘。",
      how: "点盘面「今日」开启；通关有额外奖励，每天一次。",
    },
    research: {
      name: "研究",
      what: "用芯片换永久属性。",
      how: "升级 → 研究。词条不会被盘面重置清掉。",
    },
    peek: {
      name: "点选窥视",
      what: "点空格时显示该格候选数。",
      how: "其他加成一次性购买。",
    },
    autoCombo: {
      name: "自动也连击",
      what: "自动化填对也计入连击。",
      how: "其他加成一次性购买。",
    },
    hiddenPair: {
      name: "隐藏数对",
      what: "两数只落在同一对格时锁定候选。",
      how: "自动化链路第 5 档，需先解锁数对法。",
    },
    deduce: {
      name: "全盘推演",
      what: "技巧用尽时兜底落子，防止卡死。",
      how: "自动化最后一档，需先解锁隐藏数对。",
    },
    autoList: {
      name: "列出候选数",
      what: "像人一样逐格写出可能数字。",
      how: "自动化第 1 档；开启盘面候选显示，约每 1.8s 写一格。",
    },
    autoCandidates: {
      name: "唯一候选",
      what: "候选只剩一个数时直接填入。",
      how: "自动化第 2 档，需先有列出候选数 Lv.1。",
    },
    autoHidden: {
      name: "排除法",
      what: "行/列/宫中某数字只能填一格。",
      how: "自动化第 3 档，需先有唯一候选 Lv.1。",
    },
    autoPointing: {
      name: "区块排除",
      what: "宫内数字锁在同一行/列后挤出唯一候选。",
      how: "自动化第 4 档，需先有排除法 Lv.1。",
    },
    autoPair: {
      name: "数对法",
      what: "同行/列/宫成对候选挤出唯一解。",
      how: "自动化第 5 档，需先有区块排除 Lv.1。",
    },
    var_rich: {
      name: "富矿盘",
      what: "本盘填对能量 ×1.8。",
      how: "通关 3 盘后可能随机出现；主题金色描边。",
    },
    var_haste: {
      name: "疾风盘",
      what: "本盘自动化间隔 ×0.55。",
      how: "通关 6 盘解锁；主题青色描边。",
    },
    var_frenzy: {
      name: "狂热盘",
      what: "连击窗口 +40%，自动也计连击。",
      how: "通关 10 盘解锁；主题粉色描边。",
    },
    var_critField: {
      name: "暴击领域",
      what: "本盘暴击率 +25%。",
      how: "通关 14 盘解锁；主题紫色描边。",
    },
    var_gold: {
      name: "黄金盘",
      what: "本盘通关奖励 ×2。",
      how: "通关 18 盘解锁；主题金黄描边。",
    },
    var_blind: {
      name: "盲战盘",
      what: "不显示候选，但能量与通关 ×1.5。",
      how: "通关 22 盘解锁；主题深灰描边。",
    },
    skinBoard: {
      name: "盘面皮肤",
      what: "只改盘面描边风格。",
      how: "升级 → 外观 → 盘面；用能量购买。",
    },
    skinAuto: {
      name: "自动化特效皮肤",
      what: "六种技巧落子特效一起换装。",
      how: "升级 → 外观 → 自动化特效；用能量购买。",
    },
    skillHeal: {
      name: "回春",
      what: "BOSS HP≤50% 时回复 15% 最大 HP。",
      how: "每场 BOSS 只触发一次。",
    },
    skillRage: {
      name: "破绽",
      what: "BOSS HP≤25% 时，你对其伤害 +50%。",
      how: "对你有利的爆发窗口。",
    },
    skillSplit: {
      name: "铁壁",
      what: "BOSS 周期性新增 1 个铁格。",
      how: "约每 12 秒；铁格上限约 6。",
    },
    energy: {
      name: "能量",
      what: "主要货币，用于升级与皮肤。",
      how: "填对、通关、成就与研究可提高产出；离线也可少量累计。",
    },
    size: {
      name: "盘面",
      what: "4×4 / 6×6 / 9×9 三种规格。",
      how: "按累计能量解锁；越大产出与难度越高。",
    },
    achievement: {
      name: "成就",
      what: "里程碑，达成后有永久小加成。",
      how: "顶栏「图鉴」→ 成就页查看。",
    },
    codex: {
      name: "图鉴",
      what: "记录异变、BOSS 技、技巧、皮肤收集。",
      how: "顶栏「图鉴」；纯收集展示，不直接加成（部分成就依赖图鉴）。",
    },
  };

  const GLOSSARY_GROUPS = [
    {
      title: "核心",
      ids: ["energy", "combo", "size", "iron", "boss", "variant", "crit", "daily", "offline"],
    },
    {
      title: "异变",
      ids: ["var_rich", "var_haste", "var_frenzy", "var_critField", "var_gold", "var_blind"],
    },
    {
      title: "自动化",
      ids: [
        "autoList",
        "autoCandidates",
        "autoHidden",
        "autoPointing",
        "autoPair",
        "autoHiddenPair",
        "deduce",
      ],
    },
    {
      title: "成长",
      ids: ["chip", "research", "achievement", "codex", "peek", "autoCombo", "skinBoard", "skinAuto"],
    },
    {
      title: "BOSS 技",
      ids: ["skillHeal", "skillRage", "skillSplit"],
    },
  ];

  function glossaryHtml(id, label) {
    const g = GLOSSARY[id];
    const text = label || (g && g.name) || id;
    return `<button type="button" class="term" data-term="${id}">${text}</button>`;
  }

  function glossaryText(id) {
    const g = GLOSSARY[id];
    if (!g) return "";
    return `${g.what}<br/><span class="muted">${g.how}</span>`;
  }

  function glossaryIndexHtml() {
    const parts = [];
    for (const group of GLOSSARY_GROUPS) {
      const items = group.ids
        .filter((id) => GLOSSARY[id])
        .map((id) => `<button type="button" class="term chip-term" data-term="${id}">${GLOSSARY[id].name}</button>`)
        .join("");
      if (!items) continue;
      parts.push(
        `<div class="dict-group"><h3>${group.title}</h3><div class="dict-terms">${items}</div></div>`
      );
    }
    return parts.join("");
  }

  const ACHIEVEMENTS = [
    { id: "board10", name: "初窥门径", desc: "累计通关 10 盘", bonus: "能量产出 +2%", check: (s) => s.boardsCompleted >= 10 },
    { id: "board50", name: "轻车熟路", desc: "累计通关 50 盘", bonus: "能量产出 +3%", check: (s) => s.boardsCompleted >= 50 },
    { id: "board100", name: "炉火纯青", desc: "累计通关 100 盘", bonus: "能量产出 +5%", check: (s) => s.boardsCompleted >= 100 },
    { id: "combo10", name: "连击达人", desc: "最高连击达到 10", bonus: "连击窗口 +0.15s", check: (s) => (s.comboBest || 0) >= 10 },
    { id: "combo20", name: "连击大师", desc: "最高连击达到 20", bonus: "连击窗口 +0.25s", check: (s) => (s.comboBest || 0) >= 20 },
    { id: "energy1k", name: "能量初聚", desc: "累计获得 1,000 能量", bonus: "通关奖励 +3%", check: (s) => s.totalEarned >= 1000 },
    { id: "energy10k", name: "能量洪流", desc: "累计获得 10,000 能量", bonus: "通关奖励 +5%", check: (s) => s.totalEarned >= 10000 },
    { id: "boss3", name: "屠夫", desc: "累计击破 3 次 BOSS 破防", bonus: "对 BOSS 伤害 +5%", check: (s) => (s.bossKills || 0) >= 3 },
    { id: "boss10", name: "讨伐者", desc: "累计击破 10 次 BOSS 破防", bonus: "对 BOSS 伤害 +10%", check: (s) => (s.bossKills || 0) >= 10 },
    { id: "codexVar", name: "异变收集家", desc: "图鉴收录 4 种异变", bonus: "异变出现率略升", check: (s) => Object.keys(s.codex && s.codex.variants || {}).length >= 4 },
    { id: "codexAllVar", name: "异变图鉴师", desc: "图鉴收录全部 6 种异变", bonus: "能量产出 +4%", check: (s) => Object.keys(s.codex && s.codex.variants || {}).length >= 6 },
    { id: "daily3", name: "日课", desc: "完成 3 次每日一题", bonus: "每日奖励 +20%", check: (s) => (s.dailyClears || 0) >= 3 },
    { id: "size9", name: "大师盘手", desc: "解锁并使用过 9×9", bonus: "9×9 产出 +5%", check: (s) => (s.used9x9 || 0) >= 1 },
  ];

  const RESEARCH = [
    { id: "energy", name: "产能优化", desc: "每级能量产出 +5%", baseCost: 2, costMult: 1.8, maxLevel: 20 },
    { id: "comboWindow", name: "节奏掌控", desc: "每级连击窗口 +0.2s", baseCost: 3, costMult: 1.9, maxLevel: 15 },
    { id: "crit", name: "弱点洞察", desc: "每级暴击率 +2%", baseCost: 4, costMult: 2.0, maxLevel: 15 },
    { id: "autoSpeed", name: "并行计算", desc: "每级自动化间隔 ×0.98", baseCost: 5, costMult: 2.1, maxLevel: 20 },
    { id: "complete", name: "收官艺术", desc: "每级通关奖励 +6%", baseCost: 3, costMult: 1.85, maxLevel: 15 },
  ];

  const SKINS = [
    { id: "default", name: "经典白", cost: 0, desc: "默认盘面" },
    { id: "mint", name: "薄荷", cost: 400, desc: "青绿描边" },
    { id: "violet", name: "紫罗兰", cost: 800, desc: "紫色描边" },
    { id: "ember", name: "余烬", cost: 1500, desc: "暖橙描边" },
    { id: "ink", name: "墨色", cost: 2500, desc: "深色描边" },
    { id: "sky", name: "晴空", cost: 4000, desc: "天蓝描边" },
  ];

  /** 自动化技能特效皮肤 */
  const AUTO_SKINS = [
    { id: "default", name: "默认配色", cost: 0, desc: "各技巧原始颜色" },
    { id: "neon", name: "霓虹", cost: 600, desc: "高饱和霓虹光效" },
    { id: "candy", name: "糖果", cost: 1200, desc: "柔粉糖果色" },
    { id: "shadow", name: "暗影", cost: 2000, desc: "深紫暗影光" },
    { id: "aurora", name: "极光", cost: 3500, desc: "青绿极光辉" },
  ];

  function defaultMeta() {
    return {
      achievements: {},
      chips: 0,
      chipsEarned: 0,
      research: { energy: 0, comboWindow: 0, crit: 0, autoSpeed: 0, complete: 0 },
      codex: { variants: {}, bossSkills: {}, techs: {} },
      skins: {
        owned: ["default"],
        board: "default",
        autoOwned: ["default"],
        auto: "default",
      },
      bossKills: 0,
      dailyClears: 0,
      dailyDate: "",
      dailyDone: false,
      used9x9: 0,
      stats: { variantsSeen: 0 },
    };
  }

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function dailySeed() {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  function mulberry32(a) {
    return function rng() {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function researchCost(id, level) {
    const def = RESEARCH.find((r) => r.id === id);
    if (!def) return Infinity;
    return Math.floor(def.baseCost * Math.pow(def.costMult, level));
  }

  function researchBonuses(research) {
    const r = research || {};
    return {
      energyMult: 1 + (r.energy || 0) * 0.05,
      comboWindowMs: (r.comboWindow || 0) * 200,
      critBonus: (r.crit || 0) * 0.02,
      autoSpeedFactor: Math.pow(0.98, r.autoSpeed || 0),
      completeMult: 1 + (r.complete || 0) * 0.06,
    };
  }

  function achievementEnergyMult(state) {
    let mult = 1;
    if (state.achievements && state.achievements.board10) mult += 0.02;
    if (state.achievements && state.achievements.board50) mult += 0.03;
    if (state.achievements && state.achievements.board100) mult += 0.05;
    if (state.achievements && state.achievements.codexAllVar) mult += 0.04;
    if (state.achievements && state.achievements.size9 && state.selectedSize === 9) mult += 0.05;
    return mult;
  }

  function achievementCompleteMult(state) {
    let mult = 1;
    if (state.achievements && state.achievements.energy1k) mult += 0.03;
    if (state.achievements && state.achievements.energy10k) mult += 0.05;
    return mult;
  }

  function achievementComboWindowMs(state) {
    let ms = 0;
    if (state.achievements && state.achievements.combo10) ms += 150;
    if (state.achievements && state.achievements.combo20) ms += 250;
    return ms;
  }

  function achievementBossDmgMult(state) {
    let mult = 1;
    if (state.achievements && state.achievements.boss3) mult += 0.05;
    if (state.achievements && state.achievements.boss10) mult += 0.1;
    return mult;
  }

  /** 通关/重置后检查成就，返回新解锁列表 */
  function checkAchievements(state) {
    const unlocked = [];
    state.achievements = state.achievements || {};
    for (const a of ACHIEVEMENTS) {
      if (state.achievements[a.id]) continue;
      if (a.check(state)) {
        state.achievements[a.id] = true;
        unlocked.push(a);
      }
    }
    return unlocked;
  }

  /** 重置返芯片：自动化更重要、大家不愿重置，给得更多 */
  const CHIP_DIVISOR = {
    auto: 200,
    income: 900,
    extra: 900,
  };

  function chipsForReset(investedEnergy, categoryId) {
    const div = CHIP_DIVISOR[categoryId] || 400;
    return Math.floor(investedEnergy / div);
  }

  function buyResearch(state, id) {
    const def = RESEARCH.find((r) => r.id === id);
    if (!def) return { ok: false, reason: "unknown" };
    const level = (state.research && state.research[id]) || 0;
    if (level >= def.maxLevel) return { ok: false, reason: "max" };
    const cost = researchCost(id, level);
    if ((state.chips || 0) < cost) return { ok: false, reason: "chips", cost };
    state.chips -= cost;
    state.research = state.research || {};
    state.research[id] = level + 1;
    return { ok: true, cost, level: state.research[id] };
  }

  function buySkin(state, id) {
    const def = SKINS.find((s) => s.id === id);
    if (!def) return { ok: false, reason: "unknown" };
    state.skins = state.skins || { owned: ["default"], board: "default", autoOwned: ["default"], auto: "default" };
    if (!state.skins.owned.includes(id)) {
      if ((state.energy || 0) < def.cost) return { ok: false, reason: "energy", cost: def.cost };
      state.energy -= def.cost;
      state.skins.owned.push(id);
    }
    state.skins.board = id;
    return { ok: true, skin: id };
  }

  function buyAutoSkin(state, id) {
    const def = AUTO_SKINS.find((s) => s.id === id);
    if (!def) return { ok: false, reason: "unknown" };
    state.skins = state.skins || { owned: ["default"], board: "default", autoOwned: ["default"], auto: "default" };
    state.skins.autoOwned = state.skins.autoOwned || ["default"];
    if (!state.skins.autoOwned.includes(id)) {
      if ((state.energy || 0) < def.cost) return { ok: false, reason: "energy", cost: def.cost };
      state.energy -= def.cost;
      state.skins.autoOwned.push(id);
    }
    state.skins.auto = id;
    return { ok: true, skin: id };
  }

  function recordVariant(state, variantId) {
    if (!variantId) return false;
    state.codex = state.codex || { variants: {}, bossSkills: {}, techs: {} };
    if (state.codex.variants[variantId]) return false;
    state.codex.variants[variantId] = true;
    state.stats = state.stats || {};
    state.stats.variantsSeen = Object.keys(state.codex.variants).length;
    return true;
  }

  function recordBossSkill(state, skillId) {
    if (!skillId) return false;
    state.codex = state.codex || { variants: {}, bossSkills: {}, techs: {} };
    if (state.codex.bossSkills[skillId]) return false;
    state.codex.bossSkills[skillId] = true;
    return true;
  }

  function recordTech(state, techId) {
    if (!techId) return false;
    state.codex = state.codex || { variants: {}, bossSkills: {}, techs: {} };
    if (state.codex.techs[techId]) return false;
    state.codex.techs[techId] = true;
    return true;
  }

  function recordBossKill(state) {
    state.bossKills = (state.bossKills || 0) + 1;
  }

  return {
    ACHIEVEMENTS,
    RESEARCH,
    SKINS,
    AUTO_SKINS,
    GLOSSARY,
    GLOSSARY_GROUPS,
    glossaryHtml,
    glossaryText,
    glossaryIndexHtml,
    defaultMeta,
    todayKey,
    dailySeed,
    mulberry32,
    researchCost,
    researchBonuses,
    achievementEnergyMult,
    achievementCompleteMult,
    achievementComboWindowMs,
    achievementBossDmgMult,
    checkAchievements,
    chipsForReset,
    buyResearch,
    buySkin,
    buyAutoSkin,
    recordVariant,
    recordBossSkill,
    recordTech,
    recordBossKill,
  };
})();
