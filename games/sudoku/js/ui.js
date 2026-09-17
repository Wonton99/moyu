const UI = (() => {
  const els = {};
  let state = null;
  let selected = null;
  let toastTimer = null;
  let showAllCands = false;
  let autoIconSig = "";
  /** 已「写出候选」的格子，按思考过程慢慢铺开 */
  let listedCells = new Set();
  let listedBoardRef = null;
  const lastListReveal = { r: -1, c: -1 };

  const AUTO_ICON = {
    autoList: { ch: "记", color: "#3b82f6" },
    autoCandidates: { ch: "一", color: "#16a34a" },
    autoHidden: { ch: "排", color: "#7c3aed" },
    autoPointing: { ch: "块", color: "#ea580c" },
    autoPair: { ch: "对", color: "#db2777" },
    autoHiddenPair: { ch: "隐", color: "#0d9488" },
    autoDeduce: { ch: "推", color: "#ca8a04" },
  };

  function currentAutoInterval(autoId) {
    let interval = Economy.autoIntervalWithResearch(state.upgrades, autoId, state.research);
    if (!interval) return 0;
    const board = state.board;
    if (board && board.variant && board.variant.id === "haste") {
      interval = Math.max(200, Math.round(interval * Variants.getDef("haste").speedMult));
    }
    return interval;
  }

  function renderAutoIcons() {
    if (!els.autoStatus) return;
    const active = Economy.AUTOMATIONS.filter((a) => currentAutoInterval(a.id) > 0);
    if (!active.length) {
      els.autoStatus.innerHTML = '<span class="auto-icons-empty">未开启</span>';
      autoIconSig = "";
      return;
    }
    const sig = active.map((a) => `${a.id}:${currentAutoInterval(a.id)}`).join("|");
    if (sig === autoIconSig) return;
    autoIconSig = sig;
    els.autoStatus.innerHTML = "";
    for (const a of active) {
      const iv = currentAutoInterval(a.id);
      const meta = AUTO_ICON[a.id] || { ch: a.name[0], color: "#64748b" };
      const pip = document.createElement("span");
      pip.className = "auto-pip";
      pip.dataset.auto = a.id;
      pip.style.setProperty("--iv", `${iv}ms`);
      pip.style.setProperty("--c", meta.color);
      pip.title = `${a.name} · ${Economy.formatIntervalSec(iv)}`;
      pip.innerHTML = `<span class="auto-pip-ch">${meta.ch}</span><span class="auto-pip-bar"><i></i></span>`;
      els.autoStatus.appendChild(pip);
    }
  }

  function pulseAutoPip(autoId) {
    if (!els.autoStatus) return;
    const pip = els.autoStatus.querySelector(`[data-auto="${autoId}"]`);
    if (!pip) return;
    pip.classList.remove("fire");
    void pip.offsetWidth;
    pip.classList.add("fire");
    setTimeout(() => pip.classList.remove("fire"), 450);
  }

  function cacheEls() {
    els.energy = document.getElementById("energy");
    els.totalEarned = document.getElementById("total-earned");
    els.boardsCompleted = document.getElementById("boards-completed");
    els.autoStatus = document.getElementById("auto-status");
    els.sizeSwitch = document.getElementById("size-switch");
    els.board = document.getElementById("board");
    els.boardProgress = document.getElementById("board-progress");
    els.incomeHint = document.getElementById("income-hint");
    els.numpad = document.getElementById("numpad");
    els.upgrades = document.getElementById("upgrades");
    els.unlocks = document.getElementById("unlocks");
    els.toast = document.getElementById("toast");
    els.rules = document.getElementById("rules");
    els.hint = document.getElementById("hint");
    els.boardOverlay = document.getElementById("board-overlay");
    els.boardOverlayDesc = document.getElementById("board-overlay-desc");
    els.candToggle = document.getElementById("cand-toggle");
    els.combo = document.getElementById("combo");
    els.bossBadge = document.getElementById("boss-badge");
    els.chips = document.getElementById("chips");
    els.achPanel = document.getElementById("ach-panel");
    els.codexPanel = document.getElementById("codex-panel");
    els.dailyBtn = document.getElementById("daily-btn");
    els.metaBtn = document.getElementById("meta-btn");
    els.metaModal = document.getElementById("meta-modal");
    els.metaClose = document.getElementById("meta-close");
    els.dictModal = document.getElementById("dict-modal");
    els.dictBody = document.getElementById("dict-body");
    els.dictTitle = document.getElementById("dict-title");
    els.dictClose = document.getElementById("dict-close");
    els.dictIndex = document.getElementById("dict-index");
    els.versionBtn = document.getElementById("version-btn");
    els.changelogModal = document.getElementById("changelog-modal");
    els.changelogBody = document.getElementById("changelog-body");
    els.changelogClose = document.getElementById("changelog-close");
    els.bossBar = document.getElementById("boss-bar");
    els.bossBarTitle = document.getElementById("boss-bar-title");
    els.bossBarHp = document.getElementById("boss-bar-hp");
    els.bossBarFill = document.getElementById("boss-bar-fill");
    els.comboFloat = document.getElementById("combo-float");
    els.variantBadge = document.getElementById("variant-badge");
    els.unlockPanel = document.getElementById("unlock-panel");
  }

  let lastComboShown = 0;

  const METHOD_FX = {
    candidates: { fx: "fx-unique", tag: "t-unique" },
    hidden: { fx: "fx-hidden", tag: "t-hidden" },
    pointing: { fx: "fx-pointing", tag: "t-pointing" },
    pair: { fx: "fx-pair", tag: "t-pair" },
    hiddenPair: { fx: "fx-hiddenpair", tag: "t-hiddenpair" },
    deduce: { fx: "fx-deduce", tag: "t-deduce" },
  };

  function comboTier(combo) {
    if (combo >= 20) return 5;
    if (combo >= 15) return 4;
    if (combo >= 10) return 3;
    if (combo >= 5) return 2;
    return 1;
  }

  function showComboFloat(combo, mult) {
    if (!els.comboFloat || combo < 2) return;
    const tier = comboTier(combo);
    els.comboFloat.hidden = false;
    els.comboFloat.className = `combo-float tier-${tier}`;
    els.comboFloat.innerHTML = `<span class="cf-n">COMBO ×${combo}</span><span class="cf-sub">伤害/产出 ×${(mult || 1).toFixed(2)}</span>`;
    void els.comboFloat.offsetWidth;
    clearTimeout(window.__comboFloatTimer);
    window.__comboFloatTimer = setTimeout(() => {
      els.comboFloat.hidden = true;
    }, 850);
  }

  function maybeComboFloat(result) {
    const combo = result && result.combo;
    if (!combo || combo < 2) {
      lastComboShown = combo || 0;
      return;
    }
    if (combo > lastComboShown) {
      showComboFloat(combo, result.comboMult);
    }
    lastComboShown = combo;
  }

  function openChangelog() {
    if (!els.changelogModal || !els.changelogBody || typeof Changelog === "undefined") return;
    els.changelogBody.innerHTML = Changelog.ENTRIES.map((e) => {
      const items = e.items.map((it) => `<li>${it}</li>`).join("");
      return `<article class="changelog-entry">
        <h3><span class="changelog-ver">v${e.version}</span>${e.title}
          <span class="changelog-date">${e.date}</span></h3>
        <ul>${items}</ul>
      </article>`;
    }).join("");
    els.changelogModal.hidden = false;
  }

  function closeChangelog() {
    if (els.changelogModal) els.changelogModal.hidden = true;
  }

  function bindChangelog() {
    if (els.versionBtn) {
      els.versionBtn.textContent = `v${typeof Changelog !== "undefined" ? Changelog.VERSION : "0.9.0"}`;
      els.versionBtn.addEventListener("click", openChangelog);
    }
    if (els.changelogClose) els.changelogClose.addEventListener("click", closeChangelog);
    if (els.dailyBtn) {
      els.dailyBtn.addEventListener("click", () => {
        const res = Game.openDaily(state);
        if (res.ok) {
          selected = null;
          renderAll();
          restartAutos();
          showToast("今日一题已开启");
        } else {
          showToast("今日一题已完成");
        }
      });
    }
    if (els.changelogModal) {
      els.changelogModal.addEventListener("click", (ev) => {
        if (ev.target === els.changelogModal) closeChangelog();
      });
    }
    if (els.metaBtn) {
      els.metaBtn.addEventListener("click", () => {
        openMetaModal("ach");
      });
    }
    if (els.metaClose) {
      els.metaClose.addEventListener("click", () => {
        if (els.metaModal) els.metaModal.hidden = true;
      });
    }
    if (els.metaModal) {
      els.metaModal.addEventListener("click", (ev) => {
        if (ev.target === els.metaModal) els.metaModal.hidden = true;
      });
      bindMetaTabs();
    }
    if (els.dictClose) {
      els.dictClose.addEventListener("click", () => {
        if (els.dictModal) els.dictModal.hidden = true;
      });
    }
    if (els.dictIndex) {
      els.dictIndex.addEventListener("click", () => openDict("index"));
    }
    if (els.dictModal) {
      els.dictModal.addEventListener("click", (ev) => {
        if (ev.target === els.dictModal) els.dictModal.hidden = true;
      });
    }
    document.addEventListener("click", (ev) => {
      const t = ev.target && ev.target.closest ? ev.target.closest("[data-term]") : null;
      if (!t) return;
      const id = t.getAttribute("data-term");
      openDict(id);
    });
  }

  function openDict(id) {
    if (!els.dictModal) return;
    const onIndex = id === "index";
    if (els.dictTitle) els.dictTitle.textContent = onIndex ? "词典目录" : (Meta.GLOSSARY[id] && Meta.GLOSSARY[id].name) || "词典";
    if (els.dictIndex) els.dictIndex.hidden = onIndex;
    if (els.dictBody) {
      els.dictBody.innerHTML = onIndex ? Meta.glossaryIndexHtml() : Meta.glossaryText(id);
    }
    if (!onIndex && !Meta.GLOSSARY[id]) return;
    els.dictModal.hidden = false;
  }

  function bindMetaTabs() {
    if (!els.metaModal) return;
    const tabs = els.metaModal.querySelectorAll
      ? [].slice.call(els.metaModal.querySelectorAll("[data-meta-tab]"))
      : [];
    tabs.forEach((tab) => {
      if (tab.__metaBound) return;
      tab.__metaBound = true;
      tab.addEventListener("click", () => {
        const id = tab.getAttribute("data-meta-tab");
        setMetaTab(id);
      });
    });
  }

  function setMetaTab(id) {
    if (!els.metaModal) return;
    const tabs = els.metaModal.querySelectorAll
      ? [].slice.call(els.metaModal.querySelectorAll("[data-meta-tab]"))
      : [];
    tabs.forEach((t) => {
      const on = t.getAttribute("data-meta-tab") === id;
      t.classList.toggle("active", on);
    });
    if (els.achPanel) els.achPanel.hidden = id !== "ach";
    if (els.codexPanel) els.codexPanel.hidden = id !== "codex";
  }

  function openMetaModal(tab) {
    renderAchCodex();
    bindMetaTabs();
    if (els.metaModal) els.metaModal.hidden = false;
    setMetaTab(tab || "ach");
  }

  function fmt(n) {
    if (!Number.isFinite(n)) return "0";
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
    const rounded = Math.round(n * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  }

  function showToast(msg) {
    if (!els.toast) return;
    els.toast.hidden = false;
    els.toast.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.hidden = true;
    }, 1800);
  }

  let overlayTimer = null;

  function showBoardOverlay(desc) {
    if (!els.boardOverlay || !els.boardOverlayDesc) return;
    els.boardOverlayDesc.textContent = desc;
    els.boardOverlay.hidden = false;
    clearTimeout(overlayTimer);
    overlayTimer = setTimeout(() => {
      els.boardOverlay.hidden = true;
    }, 1000);
  }

  function floatGain(cellEl, amount) {
    if (!cellEl) return;
    const rect = cellEl.getBoundingClientRect();
    const parent = els.board.parentElement;
    const parentRect = parent.getBoundingClientRect();
    const span = document.createElement("span");
    span.className = "float-gain";
    span.textContent = `+${fmt(amount)}`;
    span.style.left = `${rect.left - parentRect.left + rect.width / 2 - 10}px`;
    span.style.top = `${rect.top - parentRect.top}px`;
    parent.appendChild(span);
    setTimeout(() => span.remove(), 850);
  }

  function boxClass(size, r, c) {
    const [br, bc] = Sudoku.boxSize(size);
    const classes = [];

    if (r % br === 0) classes.push("box-top");
    if (c % bc === 0) classes.push("box-left");
    if (c % bc === bc - 1) classes.push("box-right");
    if (r % br === br - 1) classes.push("box-bottom");

    // 最外圈交给 board 自身边框，避免双边框
    if (r === 0) classes.push("edge-top");
    if (c === 0) classes.push("edge-left");
    if (c === size - 1) classes.push("edge-right");
    if (r === size - 1) classes.push("edge-bottom");

    return classes.join(" ");
  }

  function boxLabel(size) {
    const [br, bc] = Sudoku.boxSize(size);
    return `${br}×${bc}`;
  }

  function renderHelpText() {
    const size = state.board ? state.board.size : 4;
    const n = size;
    const box = boxLabel(size);
    if (els.rules) {
      let text = `行、列、宫（${box}）内 1–${n} 不重复。`;
      text += ` ${Meta.glossaryHtml("energy")}${Meta.glossaryHtml("combo")}限时加成。`;
      if (state.board && state.board.isBoss) {
        text += ` ${Meta.glossaryHtml("boss")}：${Meta.glossaryHtml("iron")}仅手动。`;
      }
      if (state.board && state.board.variant && state.board.variant.id !== "daily") {
        text += ` ${Meta.glossaryHtml("variant")}：${Meta.glossaryHtml(`var_${state.board.variant.id}`, state.board.variant.name)}。`;
      }
      if (state.isDaily || (state.board && state.board.isDaily)) {
        text += ` ${Meta.glossaryHtml("daily")}进行中。`;
      }
      els.rules.innerHTML = text;
    }
    if (els.hint) {
      els.hint.textContent = `点空格 → 点数字或按 1–${n}。灰底不可改。`;
    }
  }

  function renderStats() {
    els.energy.textContent = fmt(state.energy);
    els.totalEarned.textContent = fmt(state.totalEarned);
    els.boardsCompleted.textContent = fmt(state.boardsCompleted);
    if (els.chips) els.chips.textContent = fmt(state.chips || 0);
    if (els.combo) {
      let combo = state.combo || 0;
      const now = Date.now();
      if (combo > 0 && state.comboDeadline && now > state.comboDeadline) {
        combo = 0;
        state.combo = 0;
        state.comboDeadline = 0;
      }
      const mult = Economy.comboMultiplier(combo);
      let left = "";
      if (combo > 0 && state.comboDeadline) {
        const sec = Math.max(0, (state.comboDeadline - now) / 1000);
        left = ` ${sec.toFixed(1)}s`;
      }
      els.combo.textContent = combo > 0 ? `${combo}×${mult.toFixed(2)}${left}` : "0";
      if (els.combo.parentElement && els.combo.parentElement.classList) {
        els.combo.parentElement.classList.toggle("hot", combo >= 5);
        els.combo.parentElement.classList.toggle("pill-combo", true);
      }
    }

    const active = Economy.AUTOMATIONS.filter((a) => Economy.autoIntervalMs(state.upgrades, a.id) > 0);
    if (!active.length) {
      if (els.autoStatus && !els.autoStatus.querySelector) {
        els.autoStatus.textContent = "未开启";
      } else if (els.autoStatus) {
        els.autoStatus.innerHTML = '<span class="auto-icons-empty">未开启</span>';
      }
    } else {
      renderAutoIcons();
    }

    const board = state.board;
    if (board) {
      const empty = board.grid.flat().filter((v) => v === 0).length;
      const ironLeft = Object.keys(board.iron || {}).filter((k) => {
        const [r, c] = k.split(",").map(Number);
        return board.grid[r][c] === 0;
      }).length;
      els.boardProgress.textContent = ironLeft ? `空格 ${empty} · 铁格 ${ironLeft}` : `空格 ${empty}`;
      if (els.bossBadge) els.bossBadge.hidden = !board.isBoss;
      if (board.isBoss && board.bossTierName) {
        els.bossBadge.textContent = `BOSS · ${board.bossTierName}`;
      } else if (els.bossBadge) {
        els.bossBadge.textContent = "BOSS";
      }
      if (els.variantBadge) {
        const v = board.variant;
        els.variantBadge.hidden = !v;
        if (v) {
          els.variantBadge.textContent = v.name;
          els.variantBadge.title = v.desc;
          els.variantBadge.style.background = v.color || "#1e3a5f";
          els.variantBadge.style.color = "#fff";
        }
      }
      const cellGain = Economy.cellEnergy(board.size, state.upgrades) * Economy.comboMultiplier(state.combo || 0);
      els.incomeHint.textContent = `填对 +${fmt(cellGain)} ⚡`;
    }
    renderBossBar();
  }

  function renderBossBar() {
    if (!els.bossBar) return;
    const board = state.board;
    const isBoss = Boolean(board && board.isBoss);
    els.bossBar.hidden = !isBoss;
    if (!isBoss || !els.bossBarFill) return;
    const max = board.bossHpMax || 1;
    const hp = Math.max(0, board.bossHp || 0);
    const pct = Math.max(0, Math.min(100, (hp / max) * 100));
    els.bossBarFill.style.width = `${pct}%`;
    els.bossBarFill.classList.toggle("low", pct < 35);
    if (els.bossBarTitle) {
      els.bossBarTitle.textContent = board.bossDefeated ? "BOSS 已破防" : "BOSS 交战中";
    }
    if (els.bossBarHp) {
      els.bossBarHp.textContent = `${Math.ceil(hp)} / ${max}`;
    }
  }

  function floatBossDamage(cellEl, dmg, ironHit) {
    if (!cellEl || !dmg) return;
    const rect = cellEl.getBoundingClientRect();
    const parent = els.board.parentElement;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    const span = document.createElement("span");
    span.className = ironHit ? "boss-dmg iron-hit" : "boss-dmg";
    span.textContent = `-${dmg}`;
    span.style.left = `${rect.left - parentRect.left + rect.width / 2 - 12}px`;
    span.style.top = `${rect.top - parentRect.top - 4}px`;
    parent.appendChild(span);
    setTimeout(() => span.remove(), 700);
  }

  function renderSizes() {
    els.sizeSwitch.innerHTML = "";
    for (const item of Economy.UNLOCKS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `size-btn${state.selectedSize === item.size ? " active" : ""}`;
      btn.textContent = `${item.size}×${item.size}`;
      const unlocked = Economy.isUnlocked(item.size, state.totalEarned);
      btn.disabled = !unlocked;
      btn.title = unlocked ? item.label : `累计获得 ${item.totalEarned} 能量后解锁`;
      btn.addEventListener("click", () => {
        const result = Game.switchSize(state, item.size);
        if (result.ok) {
          selected = null;
          renderAll();
          restartAutos();
        }
      });
      els.sizeSwitch.appendChild(btn);
    }
  }

  function cellKey(r, c) {
    return `${r},${c}`;
  }

  function syncListedBoard(board) {
    if (!board) return;
    if (listedBoardRef !== board) {
      listedBoardRef = board;
      listedCells = new Set();
      lastListReveal.r = -1;
      lastListReveal.c = -1;
    }
    // 已填上的格子不再保留铅笔标记
    for (const key of [...listedCells]) {
      const [r, c] = key.split(",").map(Number);
      if (board.grid[r][c] !== 0) listedCells.delete(key);
    }
  }

  /** 列出候选：一次只揭开一个空格（按行列顺序） */
  function revealOneCandidateCell() {
    const board = state.board;
    if (!board) return false;
    syncListedBoard(board);
    const { size, grid, givens } = board;
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (grid[r][c] !== 0 || givens[r][c]) continue;
        const key = cellKey(r, c);
        if (listedCells.has(key)) continue;
        listedCells.add(key);
        lastListReveal.r = r;
        lastListReveal.c = c;
        showAllCands = true;
        renderBoard();
        flashListReveal(r, c);
        return true;
      }
    }
    return false;
  }

  function flashListReveal(r, c) {
    const cell = els.board.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (!cell) return;
    cell.classList.remove("list-reveal");
    void cell.offsetWidth;
    cell.classList.add("list-reveal");
    setTimeout(() => cell.classList.remove("list-reveal"), 500);
  }

  function renderCandToggle() {
    if (!els.candToggle) return;
    const board = state.board;
    const blind = Boolean(board && board.variant && board.variant.id === "blind");
    const unlocked = (state.upgrades.autoList || 0) >= 1 && !blind;
    els.candToggle.hidden = !unlocked;
    if (blind) {
      showAllCands = false;
      return;
    }
    if (!unlocked) {
      showAllCands = false;
      return;
    }
    els.candToggle.textContent = showAllCands ? "候选：开" : "候选：关";
    els.candToggle.classList.toggle("on", showAllCands);
  }

  function renderBoard() {
    const board = state.board;
    if (!board) return;
    syncListedBoard(board);
    const { size, grid, givens } = board;
    els.board.style.setProperty("--n", size);
    els.board.className = "board";
    if (board.variant && board.variant.theme) {
      els.board.classList.add(`theme-${board.variant.theme}`);
    }
    if (board.isBoss) els.board.classList.add("theme-boss");
    const skinId = (state.skins && state.skins.board) || "default";
    if (skinId && skinId !== "default") els.board.classList.add(`skin-${skinId}`);
    els.board.innerHTML = "";

    renderCandToggle();
    const hasList = (state.upgrades.autoList || 0) >= 1;
    const canPeek = (state.upgrades.peekCandidates || 0) >= 1;
    const blind = Boolean(board.variant && board.variant.id === "blind");
    const selectedValue = selected ? grid[selected.r][selected.c] : 0;

    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = `cell ${boxClass(size, r, c)}`;
        cell.dataset.r = String(r);
        cell.dataset.c = String(c);

        const val = grid[r][c];
        const isSelEmpty = Boolean(selected && selected.r === r && selected.c === c && !val);
        const isListed = listedCells.has(cellKey(r, c));
        // 列出候选（自动化逐格）或「点选窥视」一次性功能
        const wantCands =
          !val &&
          !blind &&
          ((hasList && showAllCands && isListed) || (canPeek && isSelEmpty));
        if (val) {
          cell.textContent = String(val);
          cell.classList.add("filled");
        } else if (wantCands) {
          const cands = Sudoku.candidates(grid, r, c, size);
          cell.classList.add("empty", "has-cands");
          const marks = document.createElement("span");
          marks.className = "cand-marks";
          const cols = size >= 9 ? 3 : size >= 6 ? 3 : 2;
          marks.style.setProperty("--cc", String(cols));
          for (let n = 1; n <= size; n += 1) {
            const s = document.createElement("i");
            s.className = cands.includes(n) ? "cand on" : "cand";
            s.textContent = String(n);
            marks.appendChild(s);
          }
          cell.appendChild(marks);
        } else {
          cell.classList.add("empty");
          cell.textContent = "";
        }

        if (givens[r][c]) cell.classList.add("given");
        if (board.iron && board.iron[`${r},${c}`] && !val) cell.classList.add("iron");
        if (selected && selected.r === r && selected.c === c) cell.classList.add("selected");
        if (selectedValue && val === selectedValue && !(selected && selected.r === r && selected.c === c)) {
          cell.classList.add("same");
        }

        cell.addEventListener("click", () => {
          if (givens[r][c] || grid[r][c] !== 0) {
            selected = null;
          } else {
            selected = { r, c };
          }
          renderBoard();
        });

        els.board.appendChild(cell);
      }
    }
  }

  function renderNumpad() {
    const size = state.board ? state.board.size : 4;
    els.numpad.innerHTML = "";
    for (let n = 1; n <= size; n += 1) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "num-btn";
      btn.textContent = String(n);
      btn.addEventListener("click", () => placeNumber(n));
      els.numpad.appendChild(btn);
    }
  }

  function renderResearchPanel() {
    const wrap = document.createElement("div");
    wrap.className = "upgrades";
    const head = document.createElement("div");
    head.className = "upgrade-panel-hint chip-help";
    head.innerHTML =
      `${Meta.glossaryHtml("chip")} <b>◈ ${fmt(state.chips || 0)}</b><br/>` +
      `重置「自动化」更划算（约每 200 投入 1 枚）；能量/其他加成约每 900 投入 1 枚。`;
    wrap.appendChild(head);
    for (const r of Meta.RESEARCH) {
      const lvl = (state.research && state.research[r.id]) || 0;
      const cost = Meta.researchCost(r.id, lvl);
      const card = document.createElement("article");
      card.className = "upgrade-card";
      const maxed = lvl >= r.maxLevel;
      card.innerHTML = `
        <div class="upgrade-top">
          <h3>${r.name}</h3>
          <span class="upgrade-level">Lv.${lvl}/${r.maxLevel}</span>
        </div>
        <p class="upgrade-desc">${r.desc}</p>
        <div class="upgrade-bottom">
          <span class="price">${maxed ? "已满级" : `◈ ${cost} 芯片`}</span>
          <button type="button" class="buy-btn">${maxed ? "已满级" : "研究"}</button>
        </div>`;
      const btn = card.querySelector(".buy-btn");
      btn.disabled = maxed || (state.chips || 0) < cost;
      btn.addEventListener("click", () => {
        const res = Meta.buyResearch(state, r.id);
        if (res.ok) {
          Game.save(state);
          restartAutos();
          renderAll();
          showToast(`${r.name} → Lv.${res.level}`);
        }
      });
      wrap.appendChild(card);
    }
    return wrap;
  }

  function renderSkinPanel() {
    const wrap = document.createElement("div");
    wrap.className = "upgrades";
    const tabs = document.createElement("div");
    tabs.className = "upgrade-tabs";
    const mode = skinTabMode;

    const mkTab = (id, label) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `upgrade-tab${mode === id ? " active" : ""}`;
      b.textContent = label;
      b.addEventListener("click", () => {
        skinTabMode = id;
        renderUpgrades();
      });
      return b;
    };
    tabs.appendChild(mkTab("board", "盘面"));
    tabs.appendChild(mkTab("auto", "自动化特效"));
    wrap.appendChild(tabs);

    if (mode === "auto") {
      const head = document.createElement("p");
      head.className = "upgrade-panel-hint";
      head.innerHTML = `${Meta.glossaryHtml("skinAuto")}：六种技巧一起换装。`;
      wrap.appendChild(head);
      const autoOwned = (state.skins && state.skins.autoOwned) || ["default"];
      const curAuto = (state.skins && state.skins.auto) || "default";
      for (const s of Meta.AUTO_SKINS) {
        const has = autoOwned.includes(s.id);
        const card = document.createElement("article");
        card.className = "upgrade-card";
        if (curAuto === s.id) card.classList.add("upgrade-pulse");
        card.innerHTML = `
          <div class="upgrade-top">
            <h3>${s.name}</h3>
            <span class="upgrade-level">${curAuto === s.id ? "使用中" : has ? "已拥有" : "未拥有"}</span>
          </div>
          <p class="upgrade-desc">${s.desc}</p>
          <div class="upgrade-bottom">
            <span class="price">${has ? "" : `⚡ ${fmt(s.cost)}`}</span>
            <button type="button" class="buy-btn">${has ? (curAuto === s.id ? "使用中" : "使用") : "购买并使用"}</button>
          </div>`;
        const btn = card.querySelector(".buy-btn");
        btn.disabled = curAuto === s.id || (!has && (state.energy || 0) < s.cost);
        btn.addEventListener("click", () => {
          const res = Meta.buyAutoSkin(state, s.id);
          if (res.ok) {
            Game.save(state);
            applyAutoSkinClass();
            renderAll();
            showToast(`自动化特效：${s.name}`);
          }
        });
        wrap.appendChild(card);
      }
      return wrap;
    }

    const head = document.createElement("p");
    head.className = "upgrade-panel-hint";
    head.innerHTML = `${Meta.glossaryHtml("skinBoard")}：只改描边风格。`;
    wrap.appendChild(head);
    const owned = (state.skins && state.skins.owned) || ["default"];
    const cur = (state.skins && state.skins.board) || "default";
    for (const s of Meta.SKINS) {
      const has = owned.includes(s.id);
      const card = document.createElement("article");
      card.className = "upgrade-card";
      if (cur === s.id) card.classList.add("upgrade-pulse");
      card.innerHTML = `
        <div class="upgrade-top">
          <h3>${s.name}</h3>
          <span class="upgrade-level">${cur === s.id ? "使用中" : has ? "已拥有" : "未拥有"}</span>
        </div>
        <p class="upgrade-desc">${s.desc}</p>
        <div class="upgrade-bottom">
          <span class="price">${has ? "" : `⚡ ${fmt(s.cost)}`}</span>
          <button type="button" class="buy-btn">${has ? (cur === s.id ? "使用中" : "使用") : "购买并使用"}</button>
        </div>`;
      const btn = card.querySelector(".buy-btn");
      btn.disabled = cur === s.id || (!has && (state.energy || 0) < s.cost);
      btn.addEventListener("click", () => {
        const res = Meta.buySkin(state, s.id);
        if (res.ok) {
          Game.save(state);
          renderAll();
          showToast(`已切换皮肤：${s.name}`);
        }
      });
      wrap.appendChild(card);
    }
    return wrap;
  }

  function applyAutoSkinClass() {
    const root = document.body;
    if (!root) return;
    const id = (state.skins && state.skins.auto) || "default";
    root.className = String(root.className || "")
      .split(/\s+/)
      .filter((c) => c && !c.startsWith("fxskin-"))
      .join(" ");
    if (id && id !== "default") root.classList.add(`fxskin-${id}`);
  }

  function upgradeEffectText(up) {
    if (up.id === "scaleBonus") {
      const lvl = state.upgrades.scaleBonus || 0;
      return `${up.desc}。当前 ×${(1 + lvl * 0.18).toFixed(2)}（大盘）。`;
    }
    if (up.id === "passiveTick") {
      const ps = Economy.passivePerSec(state.upgrades, state.selectedSize || 4);
      const max = up.maxLevel || 0;
      const lvl = state.upgrades.passiveTick || 0;
      const lv = max ? `Lv.${lvl}/${max}` : "";
      return `${up.desc}。${lv} 当前约 ${fmt(ps)}/秒。`;
    }
    if (up.id === "doubleComplete") {
      const pct = Math.round(Economy.doubleCompleteChance(state.upgrades) * 100);
      const max = up.maxLevel || 0;
      const lvl = state.upgrades.doubleComplete || 0;
      const lv = max ? `Lv.${lvl}/${max}` : "";
      return `${up.desc}。${lv} 当前 ${pct}%。`;
    }
    const auto = Economy.getAutomation(up.id);
    if (auto) {
      const interval = Economy.autoIntervalMs(state.upgrades, up.id);
      const term = Meta.glossaryHtml(up.id, auto.name);
      if (!interval) {
        return `${up.desc}。${term}`;
      }
      const sec = Economy.formatIntervalSec(interval);
      return `${up.desc}。约每 ${sec} 一格。${term}`;
    }
    if (up.id === "autoList") {
      const owned = (state.upgrades.autoList || 0) >= 1;
      return owned
        ? `${up.desc}。当前约每 ${Economy.formatIntervalSec(Economy.autoIntervalMs(state.upgrades, "autoList"))} 写出一格候选。`
        : up.desc;
    }
    if (up.id === "critChance") {
      const chance = Math.round(Economy.critChance(state.upgrades) * 100);
      return `${up.desc}。当前暴击率 ${chance}%。`;
    }
    if (up.id === "autoCombo") {
      const owned = (state.upgrades.autoCombo || 0) >= 1;
      return owned
        ? `${up.desc}。已生效。`
        : `${up.desc}。${Meta.glossaryHtml("autoCombo")}详情`;
    }
    if (up.id === "peekCandidates") {
      const owned = (state.upgrades.peekCandidates || 0) >= 1;
      return owned
        ? `${up.desc}。已生效：点空格即可看到候选。`
        : up.desc;
    }
    return up.desc;
  }

  function buildUpgradeCard(up) {
    const level = state.upgrades[up.id] || 0;
    const cost = Economy.upgradeCost(up.id, level);
    const defMax = up.maxLevel || 0;
    const card = document.createElement("article");
    card.className = "upgrade-card";
    card.dataset.upgrade = up.id;

    let effect = upgradeEffectText(up);
    let locked = false;
    let lockNote = "";
    if (up.category === "auto" && !Economy.isAutomationUnlocked(up.id, state.upgrades)) {
      locked = true;
      const prereq = Economy.automationPrereq(up.id);
      const prereqDef = Economy.getAutomation(prereq);
      const name = prereqDef ? prereqDef.name : prereq;
      lockNote = `需先拥有「${name}」Lv.1`;
      effect = `${up.desc}。`;
      card.classList.add("locked");
    }

    card.innerHTML = `
      <div class="upgrade-top">
        <h3>${up.name}</h3>
        <span class="upgrade-level">Lv.${level}</span>
      </div>
      <p class="upgrade-desc">${effect}</p>
      <div class="upgrade-bottom">
        <span class="price">${locked ? lockNote : `⚡ ${fmt(cost)}`}</span>
        <button type="button" class="buy-btn">购买</button>
      </div>
    `;

    const buyBtn = card.querySelector(".buy-btn");
    const maxed = Boolean(defMax && level >= defMax);
    if (maxed) {
      buyBtn.textContent = "已满级";
      buyBtn.disabled = true;
    } else {
      buyBtn.disabled = locked || state.energy < cost;
    }
    buyBtn.addEventListener("click", () => {
      const result = Game.buyUpgrade(state, up.id);
      if (result.ok) {
        if (up.id === "autoList" && result.level === 1) showAllCands = true;
        if (Economy.getAutomation(up.id)) restartAutos();
        renderAll();
        flashUpgradePurchase(up.id, result.level);
      }
    });

    return card;
  }

  let upgradeTab = "income";
  let skinTabMode = "board";

  function renderUpgrades() {
    els.upgrades.innerHTML = "";

    const tabs = document.createElement("div");
    tabs.className = "upgrade-tabs";
    tabs.setAttribute("role", "tablist");

    for (const cat of Economy.CATEGORIES) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `upgrade-tab${upgradeTab === cat.id ? " active" : ""}`;
      btn.textContent = cat.label;
      btn.title = cat.desc;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", upgradeTab === cat.id ? "true" : "false");
      btn.addEventListener("click", () => {
        upgradeTab = cat.id;
        renderUpgrades();
      });
      tabs.appendChild(btn);
    }
    els.upgrades.appendChild(tabs);

    const activeCat = Economy.CATEGORIES.find((c) => c.id === upgradeTab) || Economy.CATEGORIES[0];
    const panel = document.createElement("div");
    panel.className = "upgrade-panel";
    panel.dataset.category = activeCat.id;

    const hint = document.createElement("p");
    hint.className = "upgrade-panel-hint";
    hint.textContent = activeCat.desc;
    panel.appendChild(hint);

    if (activeCat.id === "research") {
      panel.appendChild(renderResearchPanel());
      els.upgrades.appendChild(panel);
      return;
    }
    if (activeCat.id === "skin") {
      panel.appendChild(renderSkinPanel());
      els.upgrades.appendChild(panel);
      return;
    }

    const catUps = Economy.upgradesByCategory(activeCat.id);
    const hasLevels = catUps.some((u) => (state.upgrades[u.id] || 0) > 0);
    if (hasLevels) {
      const resetBtn = document.createElement("button");
      resetBtn.type = "button";
      resetBtn.className = "reset-auto-btn";
      resetBtn.dataset.armed = "0";
      resetBtn.textContent = `重置本页升级（返还 60%）`;
      resetBtn.addEventListener("click", () => {
        // 两段确认，避免 window.confirm 在预览环境无响应
        if (resetBtn.dataset.armed !== "1") {
          resetBtn.dataset.armed = "1";
          resetBtn.textContent = "再点一次确认重置";
          resetBtn.classList.add("armed");
          return;
        }
        const result = Game.resetCategory(state, activeCat.id);
        if (result.ok) {
          if (activeCat.id === "auto") restartAutos();
          renderAll();
          showToast(`已重置本页，返还 ${fmt(result.refund)} 能量${result.chips ? ` · +${result.chips} 芯片` : ""}`);
        } else {
          resetBtn.dataset.armed = "0";
          resetBtn.textContent = `重置本页升级（返还 60%）`;
          resetBtn.classList.remove("armed");
        }
      });
      panel.appendChild(resetBtn);
    }

    const list = document.createElement("div");
    list.className = "upgrades";
    for (const up of catUps) {
      list.appendChild(buildUpgradeCard(up));
    }
    panel.appendChild(list);
    els.upgrades.appendChild(panel);
  }

  function flashUpgradePurchase(upgradeId, newLevel) {
    const card = els.upgrades.querySelector(`[data-upgrade="${upgradeId}"]`);
    if (!card) return;
    card.classList.remove("upgrade-pulse");
    void card.offsetWidth;
    card.classList.add("upgrade-pulse");

    const chip = document.createElement("span");
    chip.className = "upgrade-chip";
    chip.textContent = `+1 → Lv.${newLevel}`;
    card.appendChild(chip);

    setTimeout(() => {
      chip.remove();
      card.classList.remove("upgrade-pulse");
    }, 900);
  }

  function renderUnlocks() {
    if (!els.unlocks) return;
    // 左侧进度栏已展示完整解锁，这里只保留极短提示
    const locked = Economy.UNLOCKS.filter((item) => !Economy.isUnlocked(item.size, state.totalEarned));
    if (!locked.length) {
      els.unlocks.textContent = "";
      return;
    }
    els.unlocks.textContent = locked.map((item) => `${item.size}×${item.size}`).join(" / ") + " 未开";
  }

  function renderUnlockPanel() {
    if (!els.unlockPanel) return;
    const done = state.boardsCompleted || 0;
    const earned = state.totalEarned || 0;
    const parts = [];

    parts.push(`<h3 class="unlock-group-title">${Meta.glossaryHtml("size")}</h3>`);
    for (const item of Economy.UNLOCKS) {
      const unlocked = Economy.isUnlocked(item.size, earned);
      const pct = unlocked ? 100 : Math.min(100, (earned / item.totalEarned) * 100);
      const need = unlocked ? "✓" : fmt(item.totalEarned);
      parts.push(`
        <div class="unlock-row ${unlocked ? "done" : "locked"}" title="${item.label}">
          <span class="name">${item.size}×${item.size}</span>
          <span class="need">${need}</span>
          <div class="bar"><i style="width:${pct}%"></i></div>
        </div>`);
    }

    parts.push(`<h3 class="unlock-group-title">${Meta.glossaryHtml("variant")}</h3>`);
    for (const v of Variants.POOL) {
      const unlocked = Variants.isUnlocked(v, done);
      const pct = unlocked ? 100 : Math.min(100, (done / v.unlockBoards) * 100);
      const need = unlocked ? "✓" : `${v.unlockBoards}盘`;
      const color = v.color || "#64748b";
      parts.push(`
        <div class="unlock-row ${unlocked ? "done" : "locked"}">
          <span class="name"><span class="dot" style="background:${color}"></span>${Meta.glossaryHtml(`var_${v.id}`, v.name)}</span>
          <span class="need">${need}</span>
          <div class="bar"><i style="width:${pct}%;background:${unlocked ? color : undefined}"></i></div>
        </div>`);
    }

    const tier = Game.bossTierFor(done);
    const next = Game.nextBossTier(done);
    parts.push(`<h3 class="unlock-group-title">${Meta.glossaryHtml("boss")}</h3>`);
    if (next) {
      const span = next.unlockBoards - tier.unlockBoards;
      const into = done - tier.unlockBoards;
      const pct = Math.min(100, (into / Math.max(1, span)) * 100);
      parts.push(`
        <div class="unlock-row done" title="HP×${tier.hpMult} 铁+${tier.ironBonus} 奖×${tier.rewardMult}">
          <span class="name">${tier.name}</span>
          <span class="need">HP×${tier.hpMult}</span>
          <div class="bar"><i style="width:100%"></i></div>
        </div>
        <div class="unlock-row locked" title="下一档 ${next.name}">
          <span class="name">→ ${next.name}</span>
          <span class="need">+${Math.max(0, next.unlockBoards - done)}盘</span>
          <div class="bar"><i style="width:${pct}%"></i></div>
        </div>`);
    } else {
      parts.push(`
        <div class="unlock-row done">
          <span class="name">${tier.name} 满阶</span>
          <span class="need">HP×${tier.hpMult}</span>
          <div class="bar"><i style="width:100%"></i></div>
        </div>`);
    }

    els.unlockPanel.innerHTML = parts.join("");
  }

  function renderAchCodex() {
    if (els.achPanel) {
      const done = Meta.ACHIEVEMENTS.filter((a) => state.achievements && state.achievements[a.id]);
      const parts = [];
      parts.push(
        `<div class="unlock-row done"><span class="name">已达成 ${done.length}/${Meta.ACHIEVEMENTS.length}</span><span class="need">永久加成</span></div>`
      );
      for (const a of Meta.ACHIEVEMENTS.slice(0, 6)) {
        const ok = state.achievements && state.achievements[a.id];
        parts.push(`
          <div class="unlock-row ${ok ? "done" : "locked"}" title="${a.desc} → ${a.bonus}">
            <span class="name">${ok ? "✓ " : ""}${a.name}</span>
            <span class="need">${ok ? a.bonus : a.desc}</span>
          </div>`);
      }
      els.achPanel.innerHTML = parts.join("");
    }
    if (els.codexPanel) {
      const vars = Object.keys((state.codex && state.codex.variants) || {}).length;
      const skills = Object.keys((state.codex && state.codex.bossSkills) || {}).length;
      const techs = Object.keys((state.codex && state.codex.techs) || {}).length;
      els.codexPanel.innerHTML = `
        <div class="unlock-row ${vars >= 6 ? "done" : ""}"><span class="name">异变</span><span class="need">${vars}/${Variants.POOL.length}</span></div>
        <div class="unlock-row ${skills >= 3 ? "done" : ""}"><span class="name">BOSS技</span><span class="need">${skills}/3</span></div>
        <div class="unlock-row ${techs >= 6 ? "done" : ""}"><span class="name">技巧</span><span class="need">${techs}/6</span></div>
        <div class="unlock-row done"><span class="name">皮肤</span><span class="need">${((state.skins && state.skins.owned) || ["default"]).length}/${Meta.SKINS.length}</span></div>
      `;
    }
  }

  function renderAll() {
    renderStats();
    renderSizes();
    renderBoard();
    renderNumpad();
    renderHelpText();
    renderUpgrades();
    renderUnlocks();
    renderUnlockPanel();
    renderAchCodex();
    if (els.dailyBtn) {
      const done = state.dailyDone && state.dailyDate === Meta.todayKey();
      els.dailyBtn.textContent = done ? "今日✓" : "今日";
      els.dailyBtn.classList.toggle("done", done);
      els.dailyBtn.disabled = done;
    }
    if (state.newAchievements && state.newAchievements.length) {
      const list = state.newAchievements;
      state.newAchievements = [];
      showToast(`成就解锁：${list.map((a) => a.name).join("、")}`);
    }
  }

  function flashCell(r, c, type) {
    const cell = els.board.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (!cell) return;
    cell.classList.remove("correct-flash", "wrong-flash");
    void cell.offsetWidth;
    cell.classList.add(type === "ok" ? "correct-flash" : "wrong-flash");
  }

  function placeNumber(n) {
    if (!selected) {
      showToast("先点选一个空格");
      return;
    }
    const { r, c } = selected;
    const result = Game.tryFill(state, r, c, n, { source: "manual" });
    if (!result.ok) {
      if (result.reason === "conflict" || result.reason === "bad-number" || result.reason === "wrong") {
        flashCell(r, c, "wrong");
        if (result.reason === "wrong") showToast("数字不对，连击已清零");
      } else if (result.reason === "given") {
        showToast("这是题目给定格");
      } else if (result.reason === "iron") {
        showToast("铁格仅手动可填");
      }
      renderStats();
      return;
    }

    const cellEl = els.board.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (result.gained) floatGain(cellEl, result.gained);
    if (result.bossDamage) floatBossDamage(cellEl, result.bossDamage, result.wasIron);
    selected = null;
    renderAll();
    flashCell(r, c, "ok");
    maybeComboFloat(result);

    if (result.bossDefeatedNow) {
      showBoardOverlay("BOSS 破防！铁格已解除");
    } else if (result.completed) {
      const tag = result.wasBoss ? "BOSS击破！" : result.completeDoubled ? "双倍收官！" : "完成！";
      showBoardOverlay(`${tag} 奖励 +${fmt(result.completeGain)} 能量`);
      restartAutos();
    }
  }

  function onKeydown(e) {
    if (e.key >= "1" && e.key <= "9") {
      placeNumber(Number(e.key));
      return;
    }
    if (e.key === "Escape") {
      selected = null;
      renderBoard();
    }
  }

  function restartAuto() {
    restartAutos();
  }

  const autoTimers = {};

  function clearAutoTimers() {
    for (const key of Object.keys(autoTimers)) {
      if (autoTimers[key]) clearInterval(autoTimers[key]);
      autoTimers[key] = null;
    }
  }

  function restartAutos() {
    clearAutoTimers();
    autoIconSig = "";
    renderAutoIcons();
    const board = state.board;
    const speedMult =
      board && board.variant && board.variant.id === "haste"
        ? Variants.getDef("haste").speedMult
        : 1;
    for (const auto of Economy.AUTOMATIONS) {
      let interval = Economy.autoIntervalWithResearch(state.upgrades, auto.id, state.research);
      if (!interval) continue;
      if (speedMult !== 1) interval = Math.max(200, Math.round(interval * speedMult));
      if (auto.method === "list") {
        autoTimers[auto.id] = setInterval(() => {
          const ok = revealOneCandidateCell();
          if (ok) pulseAutoPip(auto.id);
        }, interval);
        continue;
      }
      autoTimers[auto.id] = setInterval(() => {
        const result = Game.autoTick(state, auto.method);
        if (result && result.ok) {
          pulseAutoPip(auto.id);
          const r = result.r;
          const c = result.c;
          const gained = result.gained;
          const methodName = auto.name;
          if (result.bossDamage) {
            const cellEl = els.board.querySelector(`[data-r="${r}"][data-c="${c}"]`);
            floatBossDamage(cellEl, result.bossDamage, result.wasIron);
          }
          maybeComboFloat(result);
          if (result.bossDefeatedNow) {
            showBoardOverlay("BOSS 破防！铁格已解除");
            renderAll();
          } else if (result.completed) {
            const tag = result.wasBoss ? "BOSS击破！" : "自动通关";
            showBoardOverlay(`${tag} · +${fmt(result.completeGain)} 能量`);
            renderAll();
            restartAutos();
          } else {
            renderAll();
            flashAutoFill(r, c, auto.method, methodName, gained);
          }
        }
      }, interval);
    }
  }

  function flashAutoFill(r, c, methodKey, methodName, gained) {
    Meta.recordTech(state, methodKey);
    const cell = els.board.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (!cell) return;
    const fx = METHOD_FX[methodKey] || { fx: "auto-fill", tag: "" };
    cell.classList.remove("auto-fill", "fx-unique", "fx-hidden", "fx-pointing", "fx-pair", "fx-hiddenpair", "fx-deduce");
    void cell.offsetWidth;
    cell.classList.add(fx.fx);

    const tag = document.createElement("span");
    tag.className = fx.tag ? `auto-tag ${fx.tag}` : "auto-tag";
    tag.textContent = methodName;
    cell.appendChild(tag);

    if (gained) floatGain(cell, gained);

    setTimeout(() => {
      cell.classList.remove(fx.fx);
      tag.remove();
    }, 800);
  }

  function mount(gameState) {
    state = gameState;
    cacheEls();
    selected = null;
    lastComboShown = state.combo || 0;
    bindChangelog();
    applyAutoSkinClass();
    if (window.__comboTimer) clearInterval(window.__comboTimer);
    window.__comboTimer = setInterval(() => {
      if (!state) return;
      // 能量回流：每秒按等级产出
      const ps = Economy.passivePerSec(state.upgrades, state.selectedSize || 4);
      if (ps > 0) {
        state.energy += ps;
        state.totalEarned += ps;
      }
      if (state.combo > 0 || ps > 0) renderStats();
    }, 200);
    if (window.__bossSkillTimer) clearInterval(window.__bossSkillTimer);
    window.__bossSkillTimer = setInterval(() => {
      if (!state || !state.board || !state.board.isBoss || state.board.bossDefeated) return;
      const skill = Game.bossSkillTick(state);
      if (!skill) return;
      if (skill.skill === "heal") {
        showBoardOverlay(`BOSS「回春」+${skill.heal} HP`);
      } else if (skill.skill === "rage") {
        showBoardOverlay("BOSS「破绽」！受到伤害 +50%");
      } else if (skill.skill === "split") {
        showBoardOverlay("BOSS「铁壁」！新增 1 铁格");
        renderAll();
        return;
      }
      renderAll();
    }, 1000);
    if (els.candToggle) {
      els.candToggle.addEventListener("click", () => {
        if ((state.upgrades.autoList || 0) < 1) return;
        showAllCands = !showAllCands;
        renderBoard();
      });
    }
    renderAll();
    restartAutos();
    document.removeEventListener("keydown", onKeydown);
    document.addEventListener("keydown", onKeydown);
  }

  return {
    mount,
    renderAll,
    restartAuto,
    restartAutos,
    showToast,
  };
})();
