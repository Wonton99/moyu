const Game = (() => {
  const SAVE_KEY = "sudoku_idle_save_v1";

  function defaultState() {
    return Object.assign(
      {
        energy: 0,
        totalEarned: 0,
        upgrades: Economy.defaultUpgrades(),
        boardsCompleted: 0,
        selectedSize: 4,
        combo: 0,
        comboBest: 0,
        comboDeadline: 0,
        board: null,
        isDaily: false,
        newAchievements: [],
      },
      typeof Meta !== "undefined" ? Meta.defaultMeta() : {}
    );
  }

  const BOSS_TIERS = [
    { id: 0, name: "普通", unlockBoards: 0, hpMult: 1, ironBonus: 0, rewardMult: 1 },
    { id: 1, name: "强化", unlockBoards: 12, hpMult: 1.4, ironBonus: 1, rewardMult: 1.3 },
    { id: 2, name: "精英", unlockBoards: 25, hpMult: 1.8, ironBonus: 2, rewardMult: 1.6 },
    { id: 3, name: "传说", unlockBoards: 40, hpMult: 2.4, ironBonus: 3, rewardMult: 2 },
  ];

  function bossTierFor(boardsCompleted) {
    let cur = BOSS_TIERS[0];
    for (const t of BOSS_TIERS) {
      if (boardsCompleted >= t.unlockBoards) cur = t;
    }
    return cur;
  }

  function nextBossTier(boardsCompleted) {
    return BOSS_TIERS.find((t) => t.unlockBoards > boardsCompleted) || null;
  }

  function createBoard(size, boardsCompleted) {
    const board = Sudoku.generatePuzzle(size, boardsCompleted);
    // 每 5 盘一场 BOSS（开局第 1 盘不算）
    if (boardsCompleted > 0 && boardsCompleted % 5 === 0) {
      const tier = bossTierFor(boardsCompleted);
      const baseIron = size >= 9 ? 4 : size >= 6 ? 3 : 2;
      const ironCount = baseIron + (tier.ironBonus || 0);
      Sudoku.applyBossIron(board, ironCount);
      const baseHp = size >= 9 ? 36 : size >= 6 ? 24 : 16;
      const hp = Math.round(baseHp * (tier.hpMult || 1));
      board.bossHp = hp;
      board.bossHpMax = hp;
      board.bossDefeated = false;
      board.bossTier = tier.id;
      board.bossTierName = tier.name;
    }
    if (typeof Variants !== "undefined") {
      Variants.applyToBoard(board, boardsCompleted);
    }
    return board;
  }

  function offlineReward(state, elapsedMs) {
    if (!Number.isFinite(elapsedMs) || elapsedMs < 60000) return 0;
    const capsMs = Math.min(elapsedMs, 8 * 3600000);
    const size = state.selectedSize || 4;
    const cell = Economy.cellEnergy(size, state.upgrades, false);
    if (cell <= 0) return 0;
    let fastest = 0;
    for (const a of Economy.AUTOMATIONS) {
      if (a.method === "list") continue;
      const iv = Economy.autoIntervalMs(state.upgrades, a.id);
      if (iv > 0 && (fastest === 0 || iv < fastest)) fastest = iv;
    }
    const interval = fastest || 4000;
    const fills = capsMs / interval;
    // 离线效率 12%，避免挂机碾压在线
    return Math.floor(fills * cell * 0.12);
  }

  function bossDamage(source, isIron, comboMult, board) {
    let dmg = 1;
    if (source === "manual") dmg = 1.5;
    else dmg = 0.8;
    if (isIron && source === "manual") dmg *= 2;
    dmg *= Math.min(2, 1 + (comboMult - 1) * 0.5);
    // BOSS「破绽」：玩家伤害提高
    if (board && board.bossRage) dmg *= 1.5;
    return Math.max(0.5, Math.round(dmg * 10) / 10);
  }

  /** BOSS 技能：每秒由 UI tick 一次 */
  function bossSkillTick(state) {
    const board = state.board;
    if (!board || !board.isBoss || board.bossDefeated) return null;
    const max = board.bossHpMax || 1;
    const hp = board.bossHp || 0;
    const pct = hp / max;

    if (pct <= 0.5 && !board.bossHealUsed) {
      board.bossHealUsed = true;
      const heal = Math.floor(max * 0.15);
      board.bossHp = Math.min(max, hp + heal);
      Meta.recordBossSkill(state, "heal");
      afterMutation(state);
      save(state);
      return { skill: "heal", name: "回春", heal, bossHp: board.bossHp, bossHpMax: max };
    }
    if (pct <= 0.25 && !board.bossRageUsed) {
      board.bossRageUsed = true;
      board.bossRage = true;
      Meta.recordBossSkill(state, "rage");
      afterMutation(state);
      save(state);
      return { skill: "rage", name: "破绽", bossHp: board.bossHp, bossHpMax: max };
    }

    board.bossSkillCd = (board.bossSkillCd == null ? 10 : board.bossSkillCd) - 1;
    if (board.bossSkillCd <= 0) {
      board.bossSkillCd = 12;
      const empties = [];
      for (let r = 0; r < board.size; r += 1) {
        for (let c = 0; c < board.size; c += 1) {
          if (board.grid[r][c] !== 0 || board.givens[r][c]) continue;
          if (board.iron && board.iron[`${r},${c}`]) continue;
          empties.push([r, c]);
        }
      }
      const ironCount = Object.keys(board.iron || {}).length;
      if (empties.length && ironCount < 6) {
        const [r, c] = empties[Math.floor(Math.random() * empties.length)];
        board.iron = board.iron || {};
        board.iron[`${r},${c}`] = 1;
        Meta.recordBossSkill(state, "split");
        afterMutation(state);
        save(state);
        return { skill: "split", name: "铁壁", r, c, bossHp: board.bossHp, bossHpMax: max };
      }
    }
    return null;
  }

  /** 每日一题：当日固定种子，通关有额外奖励 */
  function openDaily(state) {
    const today = Meta.todayKey();
    if (state.dailyDate === today && state.dailyDone) {
      return { ok: false, reason: "already" };
    }
    const size = state.totalEarned >= 1200 ? 9 : state.totalEarned >= 200 ? 6 : 4;
    const rng = Meta.mulberry32(Meta.dailySeed() + size * 17);
    const board = Sudoku.generatePuzzle(size, Math.floor(state.boardsCompleted / 3), rng);
    board.isDaily = true;
    board.variant = {
      id: "daily",
      name: "每日一题",
      desc: "今日限定种子盘，通关额外奖励",
      theme: "gold",
      color: "#0369a1",
    };
    state.board = board;
    state.selectedSize = size;
    state.isDaily = true;
    state.combo = 0;
    state.comboDeadline = 0;
    save(state);
    return { ok: true, size };
  }

  function resetCategory(state, categoryId) {
    const items = Economy.upgradesByCategory(categoryId);
    if (!items.length) return { ok: false, reason: "unknown-category" };
    let invested = 0;
    let cleared = 0;
    for (const u of items) {
      const lvl = state.upgrades[u.id] || 0;
      if (lvl <= 0) continue;
      invested += Economy.investedEnergy(u.id, lvl);
      state.upgrades[u.id] = 0;
      cleared += 1;
    }
    if (!cleared) return { ok: false, reason: "nothing" };
    const refund = Math.floor(invested * 0.6);
    if (refund > 0) {
      state.energy += refund;
    }
    const chips = Meta.chipsForReset(invested, categoryId);
    state.chips = (state.chips || 0) + chips;
    state.chipsEarned = (state.chipsEarned || 0) + chips;
    save(state);
    return { ok: true, refund, invested, cleared, chips };
  }

  function isValidSize(size) {
    return size === 4 || size === 6 || size === 9;
  }

  function isSquareMatrix(rows, size) {
    return (
      Array.isArray(rows) &&
      rows.length === size &&
      rows.every((row) => Array.isArray(row) && row.length === size)
    );
  }

  function validNumberGrid(rows, size) {
    return (
      isSquareMatrix(rows, size) &&
      rows.every((row) => row.every((v) => Number.isFinite(v) && v >= 0 && v <= size))
    );
  }

  function validGivenGrid(rows, size) {
    return (
      isSquareMatrix(rows, size) &&
      rows.every((row) => row.every((v) => v === 0 || v === 1 || v === true || v === false))
    );
  }

  function normalizeSave(raw) {
    const state = defaultState();
    if (!raw || typeof raw !== "object") return state;

    if (Number.isFinite(raw.energy)) state.energy = Math.max(0, raw.energy);
    if (Number.isFinite(raw.totalEarned)) state.totalEarned = Math.max(0, raw.totalEarned);
    if (Number.isFinite(raw.boardsCompleted)) state.boardsCompleted = Math.max(0, raw.boardsCompleted);
    if (Number.isFinite(raw.combo)) state.combo = Math.max(0, Math.floor(raw.combo));
    if (Number.isFinite(raw.comboBest)) state.comboBest = Math.max(0, Math.floor(raw.comboBest));
    if (Number.isFinite(raw.comboDeadline)) state.comboDeadline = Math.max(0, raw.comboDeadline);
    if (Number.isFinite(raw.bossKills)) state.bossKills = Math.max(0, Math.floor(raw.bossKills));
    if (Number.isFinite(raw.dailyClears)) state.dailyClears = Math.max(0, Math.floor(raw.dailyClears));
    if (Number.isFinite(raw.used9x9)) state.used9x9 = Math.max(0, Math.floor(raw.used9x9));
    if (raw.dailyDate) state.dailyDate = String(raw.dailyDate);
    state.dailyDone = Boolean(raw.dailyDone) && state.dailyDate === Meta.todayKey();
    if (raw.achievements && typeof raw.achievements === "object") state.achievements = { ...raw.achievements };
    if (Number.isFinite(raw.chips)) state.chips = Math.max(0, Math.floor(raw.chips));
    if (Number.isFinite(raw.chipsEarned)) state.chipsEarned = Math.max(0, Math.floor(raw.chipsEarned));
    if (raw.research && typeof raw.research === "object") {
      for (const r of Meta.RESEARCH) {
        const lvl = raw.research[r.id];
        state.research[r.id] = Number.isFinite(lvl) ? Math.max(0, Math.floor(lvl)) : 0;
      }
    }
    if (raw.codex && typeof raw.codex === "object") {
      state.codex.variants = { ...(raw.codex.variants || {}) };
      state.codex.bossSkills = { ...(raw.codex.bossSkills || {}) };
      state.codex.techs = { ...(raw.codex.techs || {}) };
    }
    if (raw.skins && typeof raw.skins === "object") {
      const owned = Array.isArray(raw.skins.owned) ? raw.skins.owned.filter((id) => Meta.SKINS.some((s) => s.id === id)) : [];
      if (!owned.includes("default")) owned.unshift("default");
      state.skins.owned = owned;
      const boardSkin = String(raw.skins.board || "default");
      state.skins.board = owned.includes(boardSkin) ? boardSkin : "default";
      const autoOwned = Array.isArray(raw.skins.autoOwned)
        ? raw.skins.autoOwned.filter((id) => Meta.AUTO_SKINS.some((s) => s.id === id))
        : [];
      if (!autoOwned.includes("default")) autoOwned.unshift("default");
      state.skins.autoOwned = autoOwned;
      const autoSkin = String(raw.skins.auto || "default");
      state.skins.auto = autoOwned.includes(autoSkin) ? autoSkin : "default";
    }

    const ups = raw.upgrades && typeof raw.upgrades === "object" ? raw.upgrades : {};
    state.upgrades = Economy.migrateLegacyUpgrades(ups);

    const sizes = Economy.unlockedSizes(state.totalEarned);
    const rawSize = Number(raw.selectedSize);
    state.selectedSize = sizes.includes(rawSize) ? rawSize : sizes[sizes.length - 1] || 4;

    const b = raw.board;
    if (b && isValidSize(b.size) && validNumberGrid(b.grid, b.size) && validNumberGrid(b.solution, b.size) && validGivenGrid(b.givens, b.size)) {
      const size = b.size;
      const grid = b.grid.map((row) => row.map((v) => (v ? v : 0)));
      const givens = b.givens.map((row) => row.map((v) => (v ? 1 : 0)));
      const solution = b.solution.map((row) => row.map((v) => (v ? v : 0)));
      // 预填格必须与标准解一致，否则视为坏档
      const givensMatch = grid.every((row, r) =>
        row.every((v, c) => {
          if (givens[r][c]) return v === solution[r][c] && v !== 0;
          return true;
        })
      );
      if (givensMatch) {
        const iron = {};
        if (b.iron && typeof b.iron === "object") {
          for (const k of Object.keys(b.iron)) {
            if (b.iron[k]) iron[k] = 1;
          }
        }
        let variant = null;
        if (b.variant && typeof b.variant === "object" && b.variant.id && Variants.getDef(b.variant.id)) {
          const vd = Variants.getDef(b.variant.id);
          variant = { id: vd.id, name: vd.name, desc: vd.desc };
        }
        state.board = {
          size,
          grid,
          givens,
          solution,
          filledCount: grid.flat().filter((v) => v !== 0).length,
          totalEmpty: grid.flat().filter((v) => v === 0).length,
          totalCells: size * size,
          isBoss: Boolean(b.isBoss),
          iron,
          variant,
          bossHp: Number.isFinite(b.bossHp) ? Math.max(0, b.bossHp) : b.isBoss ? 16 : 0,
          bossHpMax: Number.isFinite(b.bossHpMax) ? b.bossHpMax : b.isBoss ? 16 : 0,
          bossDefeated: Boolean(b.bossDefeated),
        };
        state.selectedSize = size;
      }
    }

    if (!state.board) {
      state.board = createBoard(state.selectedSize, state.boardsCompleted);
    }

    return state;
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      const now = Date.now();
      if (!raw) {
        const s = defaultStateWithBoard();
        s.lastSeen = now;
        return s;
      }
      const parsed = JSON.parse(raw);
      const state = normalizeSave(parsed);
      const lastSeen = Number.isFinite(parsed.lastSeen) ? parsed.lastSeen : now;
      state.lastSeen = now;
      state.offlineGain = offlineReward(state, now - lastSeen);
      if (state.offlineGain > 0) {
        state.energy += state.offlineGain;
        state.totalEarned += state.offlineGain;
      }
      return state;
    } catch {
      const s = defaultStateWithBoard();
      s.lastSeen = Date.now();
      s.offlineGain = 0;
      return s;
    }
  }

  function defaultStateWithBoard() {
    const state = defaultState();
    state.board = createBoard(4, 0);
    return state;
  }

  function save(state) {
    try {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({
          energy: state.energy,
          totalEarned: state.totalEarned,
          upgrades: state.upgrades,
          boardsCompleted: state.boardsCompleted,
          selectedSize: state.selectedSize,
          board: state.board,
          combo: state.combo,
          comboBest: state.comboBest,
          comboDeadline: state.comboDeadline,
          lastSeen: Date.now(),
          achievements: state.achievements,
          chips: state.chips,
          chipsEarned: state.chipsEarned,
          research: state.research,
          codex: state.codex,
          skins: state.skins,
          bossKills: state.bossKills,
          dailyClears: state.dailyClears,
          dailyDate: state.dailyDate,
          dailyDone: state.dailyDone,
          used9x9: state.used9x9,
        })
      );
    } catch {
      // 存档失败不阻断游戏
    }
  }

  function grantEnergy(state, amount) {
    if (!Number.isFinite(amount) || amount <= 0) return 0;
    state.energy += amount;
    state.totalEarned += amount;
    return amount;
  }

  function totalEnergyMult(state) {
    const rb = Meta.researchBonuses(state.research);
    return rb.energyMult * Meta.achievementEnergyMult(state);
  }

  function totalCompleteMult(state) {
    const rb = Meta.researchBonuses(state.research);
    return rb.completeMult * Meta.achievementCompleteMult(state);
  }

  function afterMutation(state) {
    const unlocked = Meta.checkAchievements(state);
    if (unlocked.length) {
      state.newAchievements = unlocked;
    }
  }

  function tryFill(state, r, c, n, opts) {
    const source = (opts && opts.source) || "manual";
    const board = state.board;
    if (!board) return { ok: false, reason: "no-board" };
    if (r < 0 || c < 0 || r >= board.size || c >= board.size) return { ok: false, reason: "oob" };
    if (board.givens[r][c]) return { ok: false, reason: "given" };
    if (board.grid[r][c] !== 0) return { ok: false, reason: "filled" };
    if (!Number.isFinite(n) || n < 1 || n > board.size) return { ok: false, reason: "bad-number" };
    // BOSS 铁格：仅手动可填
    if (source === "auto" && board.iron && board.iron[`${r},${c}`]) {
      return { ok: false, reason: "iron" };
    }
    if (!Sudoku.canPlace(board, r, c, n)) return { ok: false, reason: "conflict" };
    if (n !== board.solution[r][c]) {
      state.combo = 0;
      state.comboDeadline = 0;
      return { ok: false, reason: "wrong" };
    }

    board.grid[r][c] = n;
    board.filledCount += 1;
    board.totalEmpty = Math.max(0, board.totalEmpty - 1);

    // 连击：限时窗口随连击缩短；超时或填错断连
    const now = Date.now();
    if (state.combo > 0 && state.comboDeadline && now > state.comboDeadline) {
      state.combo = 0;
    }
    const autoCombo = Economy.hasAutoCombo(state.upgrades) || (board.variant && board.variant.id === "frenzy");
    const countsCombo = source === "manual" || (source === "auto" && autoCombo);
    let combo = state.combo || 0;
    if (countsCombo) {
      combo += 1;
      state.combo = combo;
      const vDef = board.variant ? Variants.getDef(board.variant.id) : null;
      const windowMult = vDef && vDef.comboWindowMult ? vDef.comboWindowMult : 1;
      const rb = Meta.researchBonuses(state.research);
      const achMs = Meta.achievementComboWindowMs(state);
      state.comboDeadline =
        now + Math.round(Economy.comboWindowMs(combo) * windowMult) + rb.comboWindowMs + achMs;
      if (combo > (state.comboBest || 0)) state.comboBest = combo;
    }
    const comboMult = Economy.comboMultiplier(countsCombo ? combo : 0);

    // BOSS 对战
    let bossDamageDealt = 0;
    let bossDefeatedNow = false;
    const wasIron = Boolean(board.iron && board.iron[`${r},${c}`]);
    if (board.isBoss && !board.bossDefeated && board.bossHp > 0) {
      bossDamageDealt =
        bossDamage(source, wasIron, comboMult, board) * Meta.achievementBossDmgMult(state);
      bossDamageDealt = Math.round(bossDamageDealt * 10) / 10;
      board.bossHp = Math.max(0, board.bossHp - bossDamageDealt);
      if (board.bossHp <= 0) {
        board.bossDefeated = true;
        board.iron = {};
        bossDefeatedNow = true;
        Meta.recordBossKill(state);
        const killBonus = Math.floor(Economy.completeEnergy(board.size, state.upgrades) * 0.5);
        if (killBonus > 0) grantEnergy(state, killBonus);
      }
    }

    const rb = Meta.researchBonuses(state.research);
    const vDef = board.variant ? Variants.getDef(board.variant.id) : null;
    const critBonus = rb.critBonus + (vDef && vDef.critBonus ? vDef.critBonus : 0);
    const isCrit = Economy.rollCellCrit(state.upgrades, Math.random, critBonus);
    const energyMult =
      (vDef && vDef.energyMult ? vDef.energyMult : 1) * totalEnergyMult(state);
    const gained = grantEnergy(
      state,
      Economy.cellEnergy(board.size, state.upgrades, isCrit) * comboMult * energyMult
    );
    const completed = Sudoku.isComplete(board);
    let completeGain = 0;
    let wasBoss = Boolean(board.isBoss);
    let completeDoubled = false;
    const wasDaily = Boolean(state.isDaily || (board && board.isDaily));
    if (completed) {
      let bonus = Economy.completeEnergy(board.size, state.upgrades) * totalCompleteMult(state);
      if (wasBoss) {
        bonus *= Economy.BOSS_COMPLETE_MULT;
        const tier = BOSS_TIERS.find((t) => t.id === board.bossTier) || BOSS_TIERS[0];
        bonus *= tier.rewardMult || 1;
      }
      if (wasBoss && board.bossDefeated) bonus = Math.floor(bonus * 1.2);
      if (vDef && vDef.completeMult) bonus = Math.floor(bonus * vDef.completeMult);
      if (Math.random() < Economy.doubleCompleteChance(state.upgrades)) {
        bonus = Math.floor(bonus * 2);
        completeDoubled = true;
      }
      if (wasDaily) {
        const dailyBonus = Math.floor(bonus * 1.5 * (1 + (Meta.achievementEnergyMult(state) - 1)));
        bonus = dailyBonus;
        state.dailyClears = (state.dailyClears || 0) + 1;
        state.dailyDate = Meta.todayKey();
        state.dailyDone = true;
        state.isDaily = false;
      }
      completeGain = grantEnergy(state, bonus);
      state.boardsCompleted += 1;
      if (board.size === 9) state.used9x9 = (state.used9x9 || 0) + 1;
      state.combo = 0;
      state.comboDeadline = 0;
      state.board = createBoard(board.size, state.boardsCompleted);
    }

    if (board.variant) Meta.recordVariant(state, board.variant.id);
    afterMutation(state);
    save(state);
    return {
      ok: true,
      r,
      c,
      n,
      source,
      combo: state.combo,
      comboDeadline: state.comboDeadline,
      comboMult,
      gained,
      isCrit,
      completed,
      wasBoss,
      completeDoubled,
      wasIron,
      bossDamage: bossDamageDealt,
      bossDefeatedNow,
      bossHp: board.bossHp,
      bossHpMax: board.bossHpMax,
      bossDefeated: board.bossDefeated,
      completeGain,
      size: board.size,
    };
  }

  function buyUpgrade(state, id) {
    const def = Economy.UPGRADES.find((u) => u.id === id);
    if (!def) return { ok: false, reason: "unknown" };
    if (def.category === "auto" && !Economy.isAutomationUnlocked(id, state.upgrades)) {
      const prereq = Economy.automationPrereq(id);
      const prereqDef = Economy.getAutomation(prereq);
      return { ok: false, reason: "prereq", need: prereq, needName: prereqDef ? prereqDef.name : prereq };
    }
    const level = state.upgrades[id] || 0;
    if (def.maxLevel && level >= def.maxLevel) {
      return { ok: false, reason: "max-level" };
    }
    const cost = Economy.upgradeCost(id, level);
    if (state.energy < cost) return { ok: false, reason: "energy", cost };

    state.energy -= cost;
    state.upgrades[id] = level + 1;
    save(state);
    return { ok: true, cost, level: state.upgrades[id] };
  }

  /** 重置全部自动化等级为 0（不退还能量） */
  function resetAutomations(state) {
    return resetCategory(state, "auto");
  }

  function switchSize(state, size) {
    if (!Economy.isUnlocked(size, state.totalEarned)) return { ok: false, reason: "locked" };
    state.selectedSize = size;
    state.board = createBoard(size, state.boardsCompleted);
    save(state);
    return { ok: true, size };
  }

  function autoTick(state, method) {
    const kind = method || "list";
    // 「列出候选数」只负责显示思考过程，不落子
    if (kind === "list") {
      const interval = Economy.autoIntervalMs(state.upgrades, "autoList");
      if (!interval) return { ok: false, reason: "auto-off" };
      return { ok: false, reason: "list-only", method: "list" };
    }
    const autoDef = Economy.AUTOMATIONS.find((a) => a.method === kind);
    const autoId = autoDef ? autoDef.id : "autoCandidates";
    if (!Economy.autoIntervalMs(state.upgrades, autoId)) {
      return { ok: false, reason: "auto-off" };
    }

    const board = state.board;
    if (!board) return { ok: false, reason: "no-board" };

    const move = Sudoku.pickMethodMove(board, kind);
    if (!move) return { ok: false, reason: "no-move", method: kind };
    return tryFill(state, move.r, move.c, move.n, { source: "auto" });
  }

  return {
    SAVE_KEY,
    load,
    save,
    tryFill,
    buyUpgrade,
    resetAutomations,
    resetCategory,
    switchSize,
    autoTick,
    offlineReward,
    bossSkillTick,
    openDaily,
    BOSS_TIERS,
    bossTierFor,
    nextBossTier,
    totalEnergyMult,
    totalCompleteMult,
    defaultStateWithBoard,
  };
})();
