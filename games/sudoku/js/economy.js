const Economy = (() => {
  const AUTOMATIONS = [
    {
      id: "autoList",
      name: "列出候选数",
      desc: "像人一样先把每格可能数字列出来（开启盘面候选显示）",
      method: "list",
      baseCost: 30,
      costMult: 1.5,
    },
    {
      id: "autoCandidates",
      name: "唯一候选",
      desc: "列出候选后，只剩一个数的格子直接填入",
      method: "candidates",
      baseCost: 80,
      costMult: 1.6,
    },
    {
      id: "autoHidden",
      name: "排除法",
      desc: "行/列/宫中某数字只能填一格时自动填",
      method: "hidden",
      baseCost: 160,
      costMult: 1.7,
    },
    {
      id: "autoPointing",
      name: "区块排除",
      desc: "宫内数字锁定同行/列后，挤出唯一候选再填",
      method: "pointing",
      baseCost: 280,
      costMult: 1.75,
    },
    {
      id: "autoPair",
      name: "数对法",
      desc: "同行/列/宫出现成对候选后，挤出唯一候选再填",
      method: "pair",
      baseCost: 420,
      costMult: 1.8,
    },
    {
      id: "autoHiddenPair",
      name: "隐藏数对",
      desc: "两数只落在同一对格时锁定候选，再收束落子",
      method: "hiddenPair",
      baseCost: 650,
      costMult: 1.82,
    },
    {
      id: "autoDeduce",
      name: "全盘推演",
      desc: "技巧用尽时完整推演，保证盘面不再卡死",
      method: "deduce",
      baseCost: 1000,
      costMult: 1.9,
    },
  ];

  const CATEGORIES = [
    {
      id: "income",
      label: "能量奖励",
      desc: "提升单格与通关收益",
    },
    {
      id: "auto",
      label: "自动化",
      desc: "按真人思路：先列候选 → 唯一填入 → 再上技巧",
    },
    {
      id: "extra",
      label: "其他加成",
      desc: "特殊成长与概率强化",
    },
    {
      id: "research",
      label: "研究",
      desc: "用芯片强化永久属性",
    },
    {
      id: "skin",
      label: "外观",
      desc: "用能量购买盘面皮肤",
    },
  ];

  const UPGRADES = [
    {
      id: "cellValue",
      category: "income",
      name: "填格效率",
      desc: "每级 +25% 单格能量产出",
      baseCost: 20,
      costMult: 1.55,
    },
    {
      id: "completeBonus",
      category: "income",
      name: "通关奖励",
      desc: "每级 +20% 完成整盘奖励",
      baseCost: 50,
      costMult: 1.65,
    },
    {
      id: "scaleBonus",
      category: "income",
      name: "规模效益",
      desc: "每级 6×6 / 9×9 填对产出 +18%",
      baseCost: 90,
      costMult: 1.7,
    },
    {
      id: "passiveTick",
      category: "income",
      name: "能量回流",
      desc: "每级每秒自动获得少量能量",
      baseCost: 200,
      costMult: 1.75,
      maxLevel: 15,
    },
    {
      id: "doubleComplete",
      category: "income",
      name: "双倍收官",
      desc: "每级 8% 概率通关奖励翻倍",
      baseCost: 150,
      costMult: 1.8,
      maxLevel: 10,
    },
    {
      id: "critChance",
      category: "extra",
      name: "能量暴击",
      desc: "每级填对时 5% 概率获得双倍能量",
      baseCost: 80,
      costMult: 1.72,
    },
    {
      id: "autoCombo",
      category: "extra",
      name: "自动也连击",
      desc: "一次性：自动化填对也计入手动连击（限时 5 秒）",
      baseCost: 200,
      costMult: 1,
      maxLevel: 1,
    },
    {
      id: "peekCandidates",
      category: "extra",
      name: "点选窥视",
      desc: "一次性：点选空格时显示该格候选数",
      baseCost: 60,
      costMult: 1,
      maxLevel: 1,
    },
    ...AUTOMATIONS.map((a) => ({ ...a, category: "auto" })),
  ];

  // 按技巧难度分档：入门快、进阶慢；同一技巧随等级加快
  const AUTO_INTERVALS = {
    autoList: [0, 1800, 1200, 900, 700, 500, 380, 300],
    autoCandidates: [0, 2200, 1600, 1200, 900, 700, 500, 400],
    autoHidden: [0, 2800, 2000, 1500, 1100, 800, 600, 450],
    autoPointing: [0, 3400, 2400, 1800, 1300, 1000, 750, 550],
    autoPair: [0, 4000, 2800, 2100, 1500, 1100, 850, 650],
    autoHiddenPair: [0, 4500, 3200, 2400, 1800, 1300, 1000, 750],
    autoDeduce: [0, 5500, 4000, 3000, 2200, 1600, 1200, 900],
  };

  const SIZE_META = {
    4: { cellBase: 1, sizeMult: 1, completeBase: 25 },
    6: { cellBase: 2, sizeMult: 1.5, completeBase: 60 },
    9: { cellBase: 3, sizeMult: 2.25, completeBase: 140 },
  };

  const UNLOCKS = [
    { size: 4, label: "4×4 入门盘", totalEarned: 0 },
    { size: 6, label: "6×6 进阶盘", totalEarned: 200 },
    { size: 9, label: "9×9 大师盘", totalEarned: 1200 },
  ];

  function getUpgrade(id) {
    return UPGRADES.find((u) => u.id === id);
  }

  function getAutomation(id) {
    return AUTOMATIONS.find((u) => u.id === id);
  }

  /** 自动化按难度链式解锁：需先拥有前一项 Lv.1+ */
  function automationPrereq(id) {
    const idx = AUTOMATIONS.findIndex((a) => a.id === id);
    if (idx <= 0) return null;
    return AUTOMATIONS[idx - 1].id;
  }

  function isAutomationUnlocked(id, upgrades) {
    const prereq = automationPrereq(id);
    if (!prereq) return true;
    return (upgrades[prereq] || 0) >= 1;
  }

  function upgradesByCategory(categoryId) {
    return UPGRADES.filter((u) => u.category === categoryId);
  }

  /** 从 0 升到 level 一共花掉的能量 */
  function investedEnergy(id, level) {
    let total = 0;
    for (let i = 0; i < level; i += 1) {
      total += upgradeCost(id, i);
    }
    return total;
  }

  function categoryInvested(upgrades, categoryId) {
    let total = 0;
    for (const u of upgradesByCategory(categoryId)) {
      total += investedEnergy(u.id, upgrades[u.id] || 0);
    }
    return total;
  }

  function upgradeCost(id, level) {
    const u = getUpgrade(id);
    if (!u) return Infinity;
    return Math.floor(u.baseCost * Math.pow(u.costMult, level));
  }

  function cellMultiplier(upgrades) {
    return 1 + (upgrades.cellValue || 0) * 0.25;
  }

  function scaleMultiplier(upgrades, size) {
    if (size <= 4) return 1;
    return 1 + (upgrades.scaleBonus || 0) * 0.18;
  }

  function passivePerSec(upgrades, size) {
    const lvl = upgrades.passiveTick || 0;
    if (lvl <= 0) return 0;
    const base = (SIZE_META[size] || SIZE_META[4]).cellBase;
    return lvl * base * 0.35;
  }

  function doubleCompleteChance(upgrades) {
    return Math.min(0.6, (upgrades.doubleComplete || 0) * 0.08);
  }

  function completeMultiplier(upgrades) {
    return 1 + (upgrades.completeBonus || 0) * 0.2;
  }

  function critChance(upgrades) {
    const lvl = upgrades.critChance || 0;
    return Math.min(0.5, lvl * 0.05);
  }

  function rollCellCrit(upgrades, rng = Math.random, bonus = 0) {
    const chance = Math.min(0.75, critChance(upgrades) + (bonus || 0));
    if (chance <= 0) return false;
    return rng() < chance;
  }

  /** 连击有效窗口（毫秒）：基础 5s，连击越高窗口越短，最低约 2s */
  const COMBO_WINDOW_BASE_MS = 5000;
  const COMBO_WINDOW_MIN_MS = 2000;

  function comboWindowMs(combo) {
    const c = Math.max(0, combo || 0);
    const ms = COMBO_WINDOW_BASE_MS - c * 120;
    return Math.max(COMBO_WINDOW_MIN_MS, ms);
  }

  function comboMultiplier(combo) {
    if (!combo || combo < 1) return 1;
    return 1 + Math.min(combo, 25) * 0.08;
  }

  function hasAutoCombo(upgrades) {
    return (upgrades.autoCombo || 0) >= 1;
  }

  const BOSS_COMPLETE_MULT = 2.5;

  function autoIntervalMs(upgrades, id) {
    const key = id || "autoCandidates";
    const table = AUTO_INTERVALS[key] || AUTO_INTERVALS.autoCandidates;
    const lvl = upgrades[key] || 0;
    if (lvl <= 0) return 0;
    return table[Math.min(lvl, table.length - 1)];
  }

  /** 研究加速后的自动化间隔 */
  function autoIntervalWithResearch(upgrades, id, research) {
    const base = autoIntervalMs(upgrades, id);
    if (!base) return 0;
    const rb = typeof Meta !== "undefined" ? Meta.researchBonuses(research) : { autoSpeedFactor: 1 };
    return Math.max(180, Math.round(base * rb.autoSpeedFactor));
  }

  function formatIntervalSec(ms) {
    if (!ms) return "未开启";
    const s = ms / 1000;
    if (s >= 10) return `${Math.round(s)} 秒`;
    return `${Number.isInteger(s) ? s : s.toFixed(1)} 秒`;
  }

  function cellEnergy(size, upgrades, isCrit) {
    const meta = SIZE_META[size];
    if (!meta) return 0;
    const base = meta.cellBase * meta.sizeMult * cellMultiplier(upgrades) * scaleMultiplier(upgrades, size);
    return isCrit ? base * 2 : base;
  }

  function completeEnergy(size, upgrades) {
    const meta = SIZE_META[size];
    if (!meta) return 0;
    return meta.completeBase * meta.sizeMult * completeMultiplier(upgrades);
  }

  function isUnlocked(size, totalEarned) {
    const item = UNLOCKS.find((u) => u.size === size);
    if (!item) return false;
    return totalEarned >= item.totalEarned;
  }

  function unlockedSizes(totalEarned) {
    return UNLOCKS.filter((u) => totalEarned >= u.totalEarned).map((u) => u.size);
  }

  function defaultUpgrades() {
    const ups = {
      cellValue: 0,
      completeBonus: 0,
      scaleBonus: 0,
      passiveTick: 0,
      doubleComplete: 0,
      critChance: 0,
      autoCombo: 0,
      peekCandidates: 0,
    };
    for (const a of AUTOMATIONS) ups[a.id] = 0;
    return ups;
  }

  function migrateLegacyUpgrades(rawUps) {
    const ups = defaultUpgrades();
    if (!rawUps || typeof rawUps !== "object") return ups;
    for (const u of UPGRADES) {
      const lvl = rawUps[u.id];
      ups[u.id] = Number.isFinite(lvl) ? Math.max(0, Math.floor(lvl)) : 0;
    }
    // 旧扫描/唯余 → 唯一候选
    const legacySimple = [rawUps.autoScan, rawUps.autoNaked, rawUps.autoSpeed].filter(Number.isFinite);
    if (legacySimple.length && !Number.isFinite(rawUps.autoCandidates)) {
      ups.autoCandidates = Math.max(ups.autoCandidates, ...legacySimple.map(Math.floor));
    }
    // 旧「列出候选数」一次性升级 → autoList
    if (Number.isFinite(rawUps.showCandidates) && rawUps.showCandidates >= 1 && !Number.isFinite(rawUps.autoList)) {
      ups.autoList = Math.max(ups.autoList, 1);
    }
    // 旧「自动化强化」若有等级 → 视为已买「自动也连击」
    if (Number.isFinite(rawUps.autoBoost) && rawUps.autoBoost >= 1 && !Number.isFinite(rawUps.autoCombo)) {
      ups.autoCombo = 1;
    }
    return ups;
  }

  return {
    UPGRADES,
    AUTOMATIONS,
    CATEGORIES,
    UNLOCKS,
    upgradeCost,
    upgradesByCategory,
    cellEnergy,
    completeEnergy,
    scaleMultiplier,
    passivePerSec,
    doubleCompleteChance,
    critChance,
    rollCellCrit,
    comboMultiplier,
    comboWindowMs,
    COMBO_WINDOW_BASE_MS,
    COMBO_WINDOW_MIN_MS,
    hasAutoCombo,
    BOSS_COMPLETE_MULT,
    autoIntervalMs,
    autoIntervalWithResearch,
    formatIntervalSec,
    isUnlocked,
    unlockedSizes,
    defaultUpgrades,
    migrateLegacyUpgrades,
    getAutomation,
    automationPrereq,
    isAutomationUnlocked,
    investedEnergy,
    categoryInvested,
  };
})();
