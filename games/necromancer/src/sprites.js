// Pixel sprites: each char maps to a palette color (null = transparent)
export const PX = 2; // logical pixel size on canvas

const SPRITES = {
  player: {
    // 12x14 necromancer
    p: '#c8b8ff', d: '#6a4a9a', s: '#f0e6d0', e: '#ff4a6a', c: '#2a1840',
    rows: [
      '....dddd....',
      '...dppppd...',
      '..dpppppppd.',
      '..dpepppepd.',
      '..dpppppppd.',
      '...dssssd...',
      '..dpppppppd.',
      '.dppdppdpppd',
      '.dppdppdpppd',
      '..dpppppppd.',
      '...dd..dd...',
      '..ddd..ddd..',
      '..dd....dd..',
      '............',
    ],
  },
  skeleton: {
    s: '#e8dcc0', d: '#a89870', k: '#3a3020',
    rows: [
      '..ssss..',
      '.skskss.',
      '..ssss..',
      '...dd...',
      '.ssdds..',
      's.sd.ds.',
      '.s.ddd.s',
      '..d.d.d.',
      '..d...d.',
      '..d...d.',
      '.dd...dd',
      '........',
    ],
  },
  ghoul: {
    g: '#7dffa0', d: '#2a6a40', r: '#ff6b6b',
    rows: [
      '...gg...',
      '..grg..g',
      '.ggggg.',
      '.gdddgg.',
      'ggggggg',
      'gdggdgg',
      '.gggggg',
      '..dgggd',
      '..g.g.g',
      '.gg.ggg',
      '.g...g.',
      '........',
    ],
  },
  wraith: {
    w: '#a0e0ff', d: '#4080b0', y: '#ffd166',
    rows: [
      '..wwww..',
      '.wwwwww.',
      '.wywwyw.',
      '.wwwwww.',
      '..wwww..',
      '.wwwwww.',
      'ww.ww.ww',
      'w.wwww.w',
      '..w..w..',
      '.w....w.',
      '........',
    ],
  },
  beast: {
    b: '#6bc8ff', d: '#204060', w: '#e8f4ff',
    rows: [
      '.b....b.',
      'bbb..bbb',
      '.bbbbbb.',
      '.bdbbdb.',
      '.bwwwwb.',
      'bbbbbbbb',
      'bdbbbbdb',
      '.bbbbbb.',
      '.b.bb.b.',
      'bb....bb',
      'b......b',
      '........',
    ],
  },
  eliteUndead: {
    u: '#7dffa0', g: '#ffd166', d: '#2a6a40', r: '#ff4a4a',
    rows: [
      '...gg...',
      '..guug..',
      '.gurug..',
      '.guuuug.',
      '.guuuug.',
      'gguuuggu',
      '.uddddu.',
      '..uuuu..',
      '..u..u..',
      '.uu..uu.',
      '........',
    ],
  },
  zombie: {
    z: '#8a4a4a', d: '#4a2020', g: '#6a7a3a',
    rows: [
      '..zzzz..',
      '.zzzzzz.',
      '.zgzgzz.',
      '.zzzzzz.',
      '..zzzz..',
      'zzzzzzzz',
      'zdzzzddz',
      '.zzzzzz.',
      '..z..z..',
      '.zz..zz.',
      '........',
    ],
  },
  archer: {
    s: '#c8b890', d: '#6a5830', b: '#8b4513',
    rows: [
      '..ssss..',
      '.ssssss.',
      '.s.ds.s.',
      '..ssss..',
      '..sdds..',
      'ssssssbb',
      's.sdds.b',
      '..s.s..b',
      '..d.d..b',
      '..d...b.',
      '........',
    ],
  },
  rat: {
    r: '#6a7a3a', d: '#3a4018', p: '#c8a0a0',
    rows: [
      '........',
      '.r....r.',
      'rrrrrrrr',
      'rprrrrpr',
      '.rrrrrr.',
      '.rrrrrr.',
      'r.rrrr.r',
      '..rr.r..',
      '........',
    ],
  },
  abomination: {
    a: '#5a6a4a', d: '#2a3018', r: '#ff6b6b', b: '#3a4a2a',
    rows: [
      '...aaaa..',
      '..aaaaaa.',
      '.araraaa.',
      'aaaaaaaaa',
      'aadddd aa',
      'aaaaaaaaa',
      'abaaaaaba',
      'aa.aa.aaa',
      '.aa..aa..',
      'ba....ab.',
      '........',
    ],
  },
  elite: {
    e: '#ff8e3c', d: '#804020', y: '#ffd166',
    rows: [
      '...yy...',
      '..eeee..',
      '.eeye ee.',
      '.eeeeee.',
      '.edddde.',
      'eeeeeeee',
      'eeddeedd',
      '.eeeeee.',
      '..e..e..',
      '.ee..ee.',
      '........',
    ],
  },
  boss: {
    b: '#ff3c6e', d: '#801030', y: '#ffd166', k: '#200010',
    rows: [
      '...yyyy...',
      '..bbbbbb..',
      '.bybbbyb..',
      '.bbbbbbbb.',
      '.bkbbbbkb.',
      'bbbbbbbbbb',
      'bddbbbbddb',
      'bbbbbbbbbb',
      '.bb.bb.bb.',
      '.bb....bb.',
      'bb......bb',
      'b........b',
      '..........',
    ],
  },
  grave: {
    g: '#3a3a4a', t: '#5a5a6a', m: '#8a8a9a',
    rows: [
      '..tttt..',
      '.tmmmt..',
      '.tmmmt..',
      '.tmmmt..',
      '.ggggg..',
      '.ggggg..',
      '.ggggg..',
      '........',
    ],
  },
  corpse: {
    c: '#4a3a2a', d: '#2a1a10',
    rows: [
      '........',
      '..cccc..',
      '.ccddcc.',
      '.cccccc.',
      '..cccc..',
      '........',
    ],
  },
  essence: {
    y: '#ffd166', w: '#fff3c0',
    rows: [
      '..y..',
      '.yyy.',
      'ywywy',
      '.yyy.',
      '..y..',
    ],
  },
  shard: {
    y: '#ffd166', w: '#fff',
    rows: [
      '..y..',
      '.yyy.',
      'ywywy',
      '.yyy.',
      '..y..',
    ],
  },
  neutralWolf: {
    b: '#6bc8ff', d: '#204060', w: '#e8f4ff',
    rows: [
      '.b....b.',
      'bbb..bbb',
      '.bbbbbb.',
      '.bdbbdb.',
      '.bwwwwb.',
      'bbbbbbbb',
      'bdbbbbdb',
      '.bbbbbb.',
      '.b.bb.b.',
      'bb....bb',
      '........',
    ],
  },
  neutralWisp: {
    w: '#a0e0ff', y: '#ffd166', d: '#4080b0',
    rows: [
      '..www..',
      '.wwwww.',
      '.wywyw.',
      '.wwwww.',
      '..www..',
      '.wwwww.',
      'w.ww.w.',
      '..w.w..',
      '........',
    ],
  },
  spider: {
    p: '#6a4a9a', d: '#2a1840', r: '#ff4a6a',
    rows: [
      'p......p',
      '.pppppp.',
      'prppppr.',
      '.pppppp.',
      'p.pppp.p',
      'p..pp..p',
      'p......p',
      '........',
    ],
  },
  cultist: {
    c: '#8a40a0', d: '#3a1050', y: '#ffd166',
    rows: [
      '...yy...',
      '..cccc..',
      '.ccyccc.',
      '.cccccc.',
      '.cddddc.',
      'cccccccc',
      'cdccccdc',
      '.cccccc.',
      '..c..c..',
      '.cc..cc.',
      '........',
    ],
  },
  ghost: {
    w: '#9ad0ff', d: '#4080b0', k: '#102030',
    rows: [
      '..wwww..',
      '.wwwwww.',
      '.wkwwkw.',
      '.wwwwww.',
      '..wwww..',
      '.wwwwww.',
      'w.wwww.w',
      '..w..w..',
      '.w....w.',
      '........',
    ],
  },
  knight: {
    n: '#8a9ab0', d: '#3a4050', s: '#c0d0e0',
    rows: [
      '..ssss..',
      '.nnnnnn.',
      '.ndnn dn',
      '.nnnnnn.',
      '.nddddn.',
      'nnnnnnnn',
      'ndnnnndn',
      '.nnnnnn.',
      '..n..n..',
      '.nn..nn.',
      '........',
    ],
  },
  lich: {
    l: '#b060ff', d: '#401060', y: '#7dffa0',
    rows: [
      '...yy...',
      '..llll..',
      '.llyyll.',
      '.llllll.',
      '.lddddl.',
      'llllllll',
      'ldlllldl',
      '.llllll.',
      '..l..l..',
      '.ll..ll.',
      '........',
    ],
  },
  boss4: {
    b: '#e8dcc0', d: '#6a5830', r: '#ff4a6a',
    rows: [
      '....bb......',
      '..bbbbbb....',
      '.brrbbbb b..',
      '.bbbbbbbb...',
      'bb.dbbbb.bb.',
      'bbbbbbbbbb..',
      '.bb.dd.bbbb.',
      '..bbbb.bbbb.',
      '...bb...bb..',
      '....bb..bb..',
      '............',
    ],
  },
  boss5: {
    b: '#ff6b8a', d: '#801030', w: '#ffd0e0',
    rows: [
      '...bbbb...',
      '..bbbbbb..',
      '.bwbwbwb..',
      '.bbbbbbbb.',
      'bb.dddd.bb',
      'bbbbbbbbbb',
      'bdbbbbbbdb',
      'bbbbbbbbbb',
      '.bb.bb.bb.',
      'bb......bb',
      'b........b',
      '..........',
    ],
  },
  bossEnd: {
    c: '#20e0c0', d: '#083830', y: '#ffd166', k: '#041814',
    rows: [
      '....yyyy....',
      '...cccccc...',
      '..ccyyyycc..',
      '..cckcckcc..',
      '.cccccccccc.',
      'cc.dcccc.dcc',
      'cccccccccccc',
      'ccdccccccdcc',
      '.cccccccccc.',
      '..cc....cc..',
      '.ccc....ccc.',
      '............',
    ],
  },
  // —— 场景道具 ——
  skull: {
    s: '#e8dcc0', d: '#a89870', k: '#2a2010',
    rows: [
      '.ssss.',
      'skssks',
      '.ssss.',
      '.sdss.',
      '..s...',
      '......',
    ],
  },
  candle: {
    w: '#f0e6d0', y: '#ffd166', o: '#ff8e3c', d: '#8a7a50',
    rows: [
      '..y..',
      '..o..',
      '..o..',
      '.www.',
      '.www.',
      '.ddd.',
      '......',
    ],
  },
  corpsePile: {
    c: '#6a4a3a', d: '#3a2818', b: '#c8b890', r: '#8a3030',
    rows: [
      '....bb....',
      '..cccccc..',
      '.ccddcccc.',
      'ccrrccc dcc',
      'cccccccccc',
      '.cccccccc.',
      '..cc..cc..',
      '..........',
    ],
  },
  tomb: {
    t: '#4a4a5a', m: '#6a6a7a', d: '#2a2a34',
    rows: [
      '..mmm..',
      '.mmmmm.',
      '.mtttm.',
      '.mtttm.',
      '.mtttm.',
      'ddddddd',
      '.......',
    ],
  },
  deadTree: {
    t: '#3a2818', d: '#1a1008', b: '#5a4030',
    rows: [
      '.t....t.',
      '.tt..tt.',
      '..t..t..',
      '..tttt..',
      '...tt...',
      '...tt...',
      '..tttt..',
      '.tttttt.',
      '........',
    ],
  },
  candleCluster: {
    w: '#f0e6d0', y: '#ffd166', o: '#ff8e3c', d: '#8a7a50',
    rows: [
      '.y.y...',
      '.ooo...',
      '.ooo...',
      'www.ww.',
      'www.ww.',
      '.ddd.d.',
      '........',
    ],
  },
  cobweb: {
    g: '#9a9aaa',
    rows: [
      'g......',
      'gg.....',
      'g.g....',
      'g..g...',
      'g...g..',
      '.......',
    ],
  },
  mushroom: {
    c: '#8a4a6a', s: '#e8dcc0', d: '#4a2030',
    rows: [
      '.ccc.',
      'ccccc',
      '.sss.',
      '..s..',
      '......',
    ],
  },
  coffin: {
    b: '#4a2818', d: '#2a1808', m: '#8a6a40', g: '#c8b890',
    rows: [
      '..gggg..',
      '.gbbbbg.',
      'gbbddbbg',
      'gbmbbmbg',
      'gbbddbbg',
      '.gbbbbg.',
      '..gggg..',
      '........',
    ],
  },
  urn: {
    u: '#6a4a70', m: '#9a7aa0', d: '#3a2040',
    rows: [
      '..mm..',
      '.m..m.',
      '.uuuu.',
      '.uuuu.',
      '..dd..',
      '......',
    ],
  },
  chain: {
    g: '#7a7a8a', d: '#3a3a48',
    rows: [
      '.g.',
      'dgd',
      '.g.',
      'dgd',
      '.g.',
      'dgd',
      '....',
    ],
  },
  boneStack: {
    s: '#e8dcc0', d: '#a89870',
    rows: [
      '.ss.s.',
      'ss.ss.',
      '.ssss.',
      'ss.sss',
      '.dddd.',
      '......',
    ],
  },
  pillarBroken: {
    p: '#4a4a5a', m: '#6a6a7a', d: '#2a2a34',
    rows: [
      '.mmm.',
      '.ppp.',
      '.ppp.',
      '.ppp.',
      '.ddd.',
      '......',
    ],
  },
  well: {
    w: '#4a4a5a', m: '#6a6a7a', k: '#101018', b: '#3a2818',
    rows: [
      '..bb..',
      '.mmmm.',
      'wwkkww',
      'wwkkww',
      '.wwww.',
      '......',
    ],
  },
  statue: {
    g: '#5a5a6a', m: '#8a8a9a', d: '#2a2a34', r: '#ff4a6a',
    rows: [
      '..mm..',
      '.gggg.',
      '.grgg.',
      '.gggg.',
      'gggggg',
      'dddddd',
      '......',
    ],
  },
  // —— 场景道具 ——
};

export function drawSprite(ctx, key, x, y, scale = 2, flip = false, tint = null) {
  const sp = SPRITES[key] || SPRITES.zombie;
  const rows = sp.rows;
  const h = rows.length;
  const w = rows[0].length;
  const ox = Math.round(x - (w * scale) / 2);
  const oy = Math.round(y - (h * scale) / 2);
  for (let r = 0; r < h; r++) {
    const row = rows[r];
    for (let c = 0; c < w; c++) {
      const ch = row[c];
      if (ch === '.' || ch === ' ') continue;
      let col = sp[ch];
      if (!col) continue;
      if (tint) col = mixColor(col, tint, 0.35);
      const px = flip ? ox + (w - 1 - c) * scale : ox + c * scale;
      ctx.fillStyle = col;
      ctx.fillRect(px, oy + r * scale, scale, scale);
    }
  }
}

export function spriteWidth(key, scale = 2) {
  const sp = SPRITES[key] || SPRITES.zombie;
  return sp.rows[0].length * scale;
}

export function spriteHeight(key, scale = 2) {
  const sp = SPRITES[key] || SPRITES.zombie;
  return sp.rows.length * scale;
}

function mixColor(a, b, t) {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const r = Math.round(pa.r + (pb.r - pa.r) * t);
  const g = Math.round(pa.g + (pb.g - pa.g) * t);
  const bl = Math.round(pa.b + (pb.b - pa.b) * t);
  return `rgb(${r},${g},${bl})`;
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export const ENEMY_SPRITE = {
  zombie: 'zombie',
  archer: 'archer',
  rat: 'rat',
  spider: 'spider',
  cultist: 'cultist',
  ghost: 'ghost',
  knight: 'knight',
  lich: 'lich',
  abomination: 'abomination',
  elite: 'elite',
  eliteMage: 'lich',
  boss1: 'boss',
  boss2: 'boss',
  boss3: 'boss',
  boss4: 'boss4',
  boss5: 'boss5',
  bossEnd: 'bossEnd',
};

export const SUMMON_SPRITE = {
  skeleton: 'skeleton',
  ghoul: 'ghoul',
  wraith: 'wraith',
  beast: 'beast',
  eliteUndead: 'eliteUndead',
};
