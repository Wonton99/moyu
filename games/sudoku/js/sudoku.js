const Sudoku = (() => {
  const BOX = {
    4: [2, 2],
    6: [2, 3],
    9: [3, 3],
  };

  function boxSize(size) {
    return BOX[size];
  }

  function createEmpty(size) {
    return Array.from({ length: size }, () => Array(size).fill(0));
  }

  function shuffle(arr, rng = Math.random) {
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function candidates(grid, r, c, size) {
    const [br, bc] = boxSize(size);
    const used = new Set();
    for (let i = 0; i < size; i += 1) {
      used.add(grid[r][i]);
      used.add(grid[i][c]);
    }
    const r0 = Math.floor(r / br) * br;
    const c0 = Math.floor(c / bc) * bc;
    for (let i = 0; i < br; i += 1) {
      for (let j = 0; j < bc; j += 1) {
        used.add(grid[r0 + i][c0 + j]);
      }
    }
    const list = [];
    for (let n = 1; n <= size; n += 1) {
      if (!used.has(n)) list.push(n);
    }
    return list;
  }

  function isValidPlacement(grid, r, c, n, size) {
    const [br, bc] = boxSize(size);
    for (let i = 0; i < size; i += 1) {
      if (i !== c && grid[r][i] === n) return false;
      if (i !== r && grid[i][c] === n) return false;
    }
    const r0 = Math.floor(r / br) * br;
    const c0 = Math.floor(c / bc) * bc;
    for (let i = 0; i < br; i += 1) {
      for (let j = 0; j < bc; j += 1) {
        if ((r0 + i !== r || c0 + j !== c) && grid[r0 + i][c0 + j] === n) {
          return false;
        }
      }
    }
    return true;
  }

  function findEmpty(grid, size) {
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (grid[r][c] === 0) return [r, c];
      }
    }
    return null;
  }

  function solve(grid, size, rng = Math.random, limit = 1) {
    const work = grid.map((row) => row.slice());
    let found = 0;
    const solutions = [];

    function dfs() {
      if (found >= limit) return;
      const empty = findEmpty(work, size);
      if (!empty) {
        found += 1;
        solutions.push(work.map((row) => row.slice()));
        return;
      }
      const [r, c] = empty;
      const nums = shuffle(candidates(work, r, c, size), rng);
      for (const n of nums) {
        work[r][c] = n;
        dfs();
        work[r][c] = 0;
        if (found >= limit) return;
      }
    }

    dfs();
    return solutions;
  }

  function generateSolved(size, rng = Math.random) {
    const grid = createEmpty(size);
    const solutions = solve(grid, size, rng, 1);
    if (!solutions.length) {
      throw new Error(`无法生成 ${size}x${size} 完整盘`);
    }
    return solutions[0];
  }

  function emptyRatio(size, boardsCompleted) {
    const base = {
      4: 0.5,
      6: 0.55,
      9: 0.58,
    }[size];
    const boost = Math.min(0.18, boardsCompleted * 0.01);
    return Math.min(0.72, base + boost);
  }

  function generatePuzzle(size, boardsCompleted = 0, rng = Math.random) {
    const solution = generateSolved(size, rng);
    const grid = solution.map((row) => row.slice());
    const ratio = emptyRatio(size, boardsCompleted);
    const total = size * size;
    const targetEmpty = Math.round(total * ratio);
    const positions = [];
    for (let i = 0; i < total; i += 1) positions.push(i);
    shuffle(positions, rng);

    let emptied = 0;
    for (const idx of positions) {
      if (emptied >= targetEmpty) break;
      const r = Math.floor(idx / size);
      const c = idx % size;
      const backup = grid[r][c];
      grid[r][c] = 0;
      const unique = solve(grid, size, rng, 2).length === 1;
      if (unique) {
        emptied += 1;
      } else {
        grid[r][c] = backup;
      }
    }

    const givens = grid.map((row) => row.map((v) => (v !== 0 ? 1 : 0)));
    let filled = 0;
    let emptyCount = 0;
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (grid[r][c] === 0) emptyCount += 1;
        else filled += 1;
      }
    }

    return {
      size,
      grid,
      givens,
      solution,
      filledCount: filled,
      totalEmpty: emptyCount,
      totalCells: total,
      isBoss: false,
      iron: {},
    };
  }

  /** 标记 BOSS 铁格与血量：自动化跳过铁格，需手动填 */
  function applyBossIron(board, count = 3, hp = 16) {
    const empties = emptyCells(board);
    shuffle(empties);
    const iron = {};
    for (let i = 0; i < Math.min(count, empties.length); i += 1) {
      const [r, c] = empties[i];
      iron[`${r},${c}`] = 1;
    }
    board.isBoss = true;
    board.iron = iron;
    board.bossHp = hp;
    board.bossHpMax = hp;
    board.bossDefeated = false;
    return board;
  }

  function canPlace(board, r, c, n) {
    return isValidPlacement(board.grid, r, c, n, board.size);
  }

  function isComplete(board) {
    const { size, grid } = board;
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (grid[r][c] === 0) return false;
        if (grid[r][c] !== board.solution[r][c]) return false;
      }
    }
    return true;
  }

  function emptyCells(board) {
    const list = [];
    for (let r = 0; r < board.size; r += 1) {
      for (let c = 0; c < board.size; c += 1) {
        if (board.grid[r][c] === 0) list.push([r, c]);
      }
    }
    return list;
  }

  /** 唯余数：某空格只剩一个候选数字 */
  function findNakedSingles(board) {
    const { size, grid } = board;
    const found = [];
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (grid[r][c] !== 0) continue;
        const cands = candidates(grid, r, c, size);
        if (cands.length === 1) found.push({ r, c, n: cands[0] });
      }
    }
    return found;
  }

  /**
   * 排除法 / 唯一数：在某一行、某一列或某一宫里，
   * 数字 n 只能放进唯一一个空格。
   */
  function findHiddenSingles(board) {
    const { size, grid } = board;
    const [br, bc] = boxSize(size);
    const found = [];
    const seen = new Set();

    const push = (r, c, n) => {
      const key = `${r},${c},${n}`;
      if (seen.has(key)) return;
      seen.add(key);
      found.push({ r, c, n });
    };

    // 行
    for (let r = 0; r < size; r += 1) {
      for (let n = 1; n <= size; n += 1) {
        if (grid[r].includes(n)) continue;
        const spots = [];
        for (let c = 0; c < size; c += 1) {
          if (grid[r][c] === 0 && isValidPlacement(grid, r, c, n, size)) spots.push(c);
        }
        if (spots.length === 1) push(r, spots[0], n);
      }
    }

    // 列
    for (let c = 0; c < size; c += 1) {
      for (let n = 1; n <= size; n += 1) {
        let occupied = false;
        for (let r = 0; r < size; r += 1) {
          if (grid[r][c] === n) occupied = true;
        }
        if (occupied) continue;
        const spots = [];
        for (let r = 0; r < size; r += 1) {
          if (grid[r][c] === 0 && isValidPlacement(grid, r, c, n, size)) spots.push(r);
        }
        if (spots.length === 1) push(spots[0], c, n);
      }
    }

    // 宫
    for (let boxR = 0; boxR < size; boxR += br) {
      for (let boxC = 0; boxC < size; boxC += bc) {
        for (let n = 1; n <= size; n += 1) {
          let occupied = false;
          const spots = [];
          for (let i = 0; i < br; i += 1) {
            for (let j = 0; j < bc; j += 1) {
              const r = boxR + i;
              const c = boxC + j;
              if (grid[r][c] === n) occupied = true;
              else if (grid[r][c] === 0 && isValidPlacement(grid, r, c, n, size)) spots.push([r, c]);
            }
          }
          if (occupied) continue;
          if (spots.length === 1) push(spots[0][0], spots[0][1], n);
        }
      }
    }

    return found;
  }

  /** 扫描法已移除：不能直接按标准解乱填 */

/** 从候选列表中挑一个与标准解一致、且非铁格的落子 */
  function pickMatchingMove(board, moves) {
    const usable = (moves || []).filter((m) => {
      if (!m || m.n !== board.solution[m.r][m.c]) return false;
      if (board.iron && board.iron[`${m.r},${m.c}`]) return false;
      return true;
    });
    if (!usable.length) return null;
    return usable[Math.floor(Math.random() * usable.length)];
  }

  /**
   * 区块排除：宫内某数字只能出现在同一行/列，
   * 则该行/列宫外不能填该数字；由此产生的唯一候选可落子。
   */
  function findPointingMoves(board) {
    const { size, grid } = board;
    const [br, bc] = boxSize(size);
    const elim = new Set(); // `${r},${c},${n}`

    const markElimRow = (row, n, exceptBoxC) => {
      for (let c = 0; c < size; c += 1) {
        if (Math.floor(c / bc) === exceptBoxC) continue;
        if (grid[row][c] === 0) elim.add(`${row},${c},${n}`);
      }
    };
    const markElimCol = (col, n, exceptBoxR) => {
      for (let r = 0; r < size; r += 1) {
        if (Math.floor(r / br) === exceptBoxR) continue;
        if (grid[r][col] === 0) elim.add(`${r},${col},${n}`);
      }
    };

    for (let boxR = 0; boxR < size; boxR += br) {
      for (let boxC = 0; boxC < size; boxC += bc) {
        for (let n = 1; n <= size; n += 1) {
          let occupied = false;
          const spots = [];
          for (let i = 0; i < br; i += 1) {
            for (let j = 0; j < bc; j += 1) {
              const r = boxR + i;
              const c = boxC + j;
              if (grid[r][c] === n) occupied = true;
              else if (grid[r][c] === 0 && isValidPlacement(grid, r, c, n, size)) spots.push([r, c]);
            }
          }
          if (occupied || spots.length < 2) continue;
          const rows = new Set(spots.map(([r]) => r));
          const cols = new Set(spots.map(([, c]) => c));
          if (rows.size === 1) markElimRow(spots[0][0], n, boxC / bc);
          if (cols.size === 1) markElimCol(spots[0][1], n, boxR / br);
        }
      }
    }

    const found = [];
    const seen = new Set();
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (grid[r][c] !== 0) continue;
        const cands = candidates(grid, r, c, size).filter((n) => !elim.has(`${r},${c},${n}`));
        if (cands.length === 1) {
          const key = `${r},${c},${cands[0]}`;
          if (!seen.has(key)) {
            seen.add(key);
            found.push({ r, c, n: cands[0] });
          }
        }
      }
    }
    return found;
  }

  /**
   * 数对：同一行/列/宫中两格候选完全相同且恰为两个数，
   * 则该单元其他格不能再出现这两个数；由此产生的唯一候选可落子。
   */
  function findPairMoves(board) {
    const { size, grid } = board;
    const [br, bc] = boxSize(size);
    const elim = new Set();

    const scanUnit = (cells) => {
      const pairs = [];
      for (const [r, c] of cells) {
        if (grid[r][c] !== 0) continue;
        const cands = candidates(grid, r, c, size);
        if (cands.length === 2) pairs.push({ r, c, a: cands[0], b: cands[1] });
      }
      for (let i = 0; i < pairs.length; i += 1) {
        for (let j = i + 1; j < pairs.length; j += 1) {
          const p = pairs[i];
          const q = pairs[j];
          if (p.a === q.a && p.b === q.b) {
            for (const [r, c] of cells) {
              if ((r === p.r && c === p.c) || (r === q.r && c === q.c)) continue;
              if (grid[r][c] !== 0) continue;
              elim.add(`${r},${c},${p.a}`);
              elim.add(`${r},${c},${p.b}`);
            }
          }
        }
      }
    };

    for (let r = 0; r < size; r += 1) {
      scanUnit(Array.from({ length: size }, (_, c) => [r, c]));
    }
    for (let c = 0; c < size; c += 1) {
      scanUnit(Array.from({ length: size }, (_, r) => [r, c]));
    }
    for (let boxR = 0; boxR < size; boxR += br) {
      for (let boxC = 0; boxC < size; boxC += bc) {
        const cells = [];
        for (let i = 0; i < br; i += 1) {
          for (let j = 0; j < bc; j += 1) cells.push([boxR + i, boxC + j]);
        }
        scanUnit(cells);
      }
    }

    const found = [];
    const seen = new Set();
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (grid[r][c] !== 0) continue;
        const cands = candidates(grid, r, c, size).filter((n) => !elim.has(`${r},${c},${n}`));
        if (cands.length === 1) {
          const key = `${r},${c},${cands[0]}`;
          if (!seen.has(key)) {
            seen.add(key);
            found.push({ r, c, n: cands[0] });
          }
        }
      }
    }
    return found;
  }

  /**
   * 隐藏数对：同行/列/宫里两个数字只落在同一对格子上，
   * 则这两格可去掉其他候选；由此收束出的唯一候选可落子。
   */
  function findHiddenPairMoves(board) {
    const { size, grid } = board;
    const [br, bc] = boxSize(size);
    const candMap = Array.from({ length: size }, () => Array(size).fill(null));
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (grid[r][c] === 0) candMap[r][c] = new Set(candidates(grid, r, c, size));
      }
    }

    const scanUnit = (cells) => {
      for (let a = 1; a <= size; a += 1) {
        for (let b = a + 1; b <= size; b += 1) {
          const posA = [];
          const posB = [];
          for (const [r, c] of cells) {
            const set = candMap[r][c];
            if (!set) continue;
            if (set.has(a)) posA.push(`${r},${c}`);
            if (set.has(b)) posB.push(`${r},${c}`);
          }
          if (posA.length !== 2 || posB.length !== 2) continue;
          const keyA = posA.slice().sort().join("|");
          const keyB = posB.slice().sort().join("|");
          if (keyA !== keyB) continue;
          // 两数只出现在同一对格 → 去掉这两格的其他候选
          for (const [r, c] of cells) {
            const set = candMap[r][c];
            if (!set) continue;
            if (!set.has(a) && !set.has(b)) continue;
            if (!posA.includes(`${r},${c}`)) continue;
            for (const n of [...set]) {
              if (n !== a && n !== b) set.delete(n);
            }
          }
        }
      }
    };

    for (let r = 0; r < size; r += 1) {
      scanUnit(Array.from({ length: size }, (_, c) => [r, c]));
    }
    for (let c = 0; c < size; c += 1) {
      scanUnit(Array.from({ length: size }, (_, r) => [r, c]));
    }
    for (let boxR = 0; boxR < size; boxR += br) {
      for (let boxC = 0; boxC < size; boxC += bc) {
        const cells = [];
        for (let i = 0; i < br; i += 1) {
          for (let j = 0; j < bc; j += 1) cells.push([boxR + i, boxC + j]);
        }
        scanUnit(cells);
      }
    }

    const found = [];
    const seen = new Set();
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        const set = candMap[r][c];
        if (!set || set.size !== 1) continue;
        const n = [...set][0];
        const key = `${r},${c},${n}`;
        if (!seen.has(key)) {
          seen.add(key);
          found.push({ r, c, n });
        }
      }
    }
    return found;
  }

  /**
   * 全盘推演：当前面所有技巧都无步可走时，
   * 对剩余空格做完整推演后落一子（终阶兜底，避免卡死）。
   */
  function pickDeduceMove(board) {
    const techniques = ["candidates", "hidden", "pointing", "pair", "hiddenPair"];
    for (const t of techniques) {
      if (pickMethodMove(board, t)) return null;
    }
    const empties = emptyCells(board).filter(([r, c]) => !(board.iron && board.iron[`${r},${c}`]));
    if (!empties.length) return null;
    const [r, c] = empties[Math.floor(Math.random() * empties.length)];
    return { r, c, n: board.solution[r][c] };
  }

  /** 候选数法：每个空格先列出 1–size，
   * 去掉同行、同列、同宫已出现的数字；
   * 某格候选只剩一个，直接填。
   */
  function findCandidateMoves(board) {
    const { size, grid } = board;
    const found = [];
    const seen = new Set();
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (grid[r][c] !== 0) continue;
        const cands = candidates(grid, r, c, size);
        if (cands.length === 1) {
          const key = `${r},${c},${cands[0]}`;
          if (!seen.has(key)) {
            seen.add(key);
            found.push({ r, c, n: cands[0] });
          }
        }
      }
    }
    return found;
  }

  /** 按技巧方法取一步合法落子（由简到难） */
  function pickMethodMove(board, method) {
    if (method === "candidates" || method === "naked") {
      return pickMatchingMove(board, findCandidateMoves(board));
    }
    if (method === "hidden") return pickMatchingMove(board, findHiddenSingles(board));
    if (method === "pointing") return pickMatchingMove(board, findPointingMoves(board));
    if (method === "pair") return pickMatchingMove(board, findPairMoves(board));
    if (method === "hiddenPair") return pickMatchingMove(board, findHiddenPairMoves(board));
    if (method === "deduce") return pickDeduceMove(board);
    return null;
  }

  return {
    generatePuzzle,
    canPlace,
    isComplete,
    isValidPlacement,
    boxSize,
    candidates,
    applyBossIron,
    findNakedSingles,
    findHiddenSingles,
    findPointingMoves,
    findPairMoves,
    findHiddenPairMoves,
    findCandidateMoves,
    pickMethodMove,
    pickMatchingMove,
    pickDeduceMove,
    emptyCells,
  };
})();
