const Variants = (() => {
  const POOL = [
    {
      id: "rich",
      name: "富矿盘",
      desc: "本盘填对能量 ×1.8",
      energyMult: 1.8,
      theme: "rich",
      color: "#ca8a04",
      unlockBoards: 3,
    },
    {
      id: "haste",
      name: "疾风盘",
      desc: "本盘自动化间隔 ×0.55（挂机更快）",
      speedMult: 0.55,
      theme: "haste",
      color: "#0891b2",
      unlockBoards: 6,
    },
    {
      id: "frenzy",
      name: "狂热盘",
      desc: "连击窗口 +40%，且自动也计连击",
      comboWindowMult: 1.4,
      forceAutoCombo: true,
      theme: "frenzy",
      color: "#db2777",
      unlockBoards: 10,
    },
    {
      id: "critField",
      name: "暴击领域",
      desc: "本盘暴击率 +25%",
      critBonus: 0.25,
      theme: "crit",
      color: "#7c3aed",
      unlockBoards: 14,
    },
    {
      id: "gold",
      name: "黄金盘",
      desc: "本盘通关奖励 ×2",
      completeMult: 2,
      theme: "gold",
      color: "#d97706",
      unlockBoards: 18,
    },
    {
      id: "blind",
      name: "盲战盘",
      desc: "本盘不显示候选，但能量与通关 ×1.5",
      hideCands: true,
      energyMult: 1.5,
      completeMult: 1.5,
      theme: "blind",
      color: "#4b5563",
      unlockBoards: 22,
    },
  ];

  function getDef(id) {
    return POOL.find((p) => p.id === id) || null;
  }

  function isUnlocked(def, boardsCompleted) {
    return boardsCompleted >= (def.unlockBoards || 0);
  }

  function unlockedPool(boardsCompleted) {
    return POOL.filter((p) => isUnlocked(p, boardsCompleted));
  }

  /** 普通盘约 30% 概率出现异变；仅从已解锁池抽取 */
  function rollForBoard(boardsCompleted, isBoss, rng = Math.random) {
    if (isBoss) return null;
    const pool = unlockedPool(boardsCompleted);
    if (!pool.length) return null;
    if (rng() > 0.3) return null;
    return pool[Math.floor(rng() * pool.length)];
  }

  function applyToBoard(board, boardsCompleted, rng = Math.random) {
    const def = rollForBoard(boardsCompleted, board.isBoss, rng);
    if (!def) {
      board.variant = null;
      return null;
    }
    board.variant = { id: def.id, name: def.name, desc: def.desc, theme: def.theme, color: def.color };
    return board.variant;
  }

  return {
    POOL,
    getDef,
    isUnlocked,
    unlockedPool,
    rollForBoard,
    applyToBoard,
  };
})();
