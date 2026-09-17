/** Per-room randomized scene props */
import { mulberry32 } from './utils.js?v=cb51948469';

const EDGE_Y = ['top', 'bottom'];
const EDGE_X = ['left', 'right'];

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function rint(rng, a, b) {
  return a + Math.floor(rng() * (b - a + 1));
}

/**
 * room: {x,y,w,h,type}
 * Returns { items: [{kind,x,y,scale,flip}], torches: [[x,y]], floorHoles: n, palette }
 */
export function generateRoomProps(room, floorNum, roomIndex, runSeed) {
  const seed = (runSeed ^ (floorNum * 9973) ^ (roomIndex * 7919) ^ hashType(room.type)) >>> 0;
  const rng = mulberry32(seed);
  const items = [];
  const pad = 28;
  const innerW = room.w - pad * 2;
  const innerH = room.h - pad * 2;

  const spots = [];
  const used = [];
  function freeSpot(x, y, minDist = 36) {
    for (const u of used) {
      const d = Math.hypot(u.x - x, u.y - y);
      if (d < minDist) return false;
    }
    return true;
  }
  function addSpot(x, y) {
    if (x < room.x + 16 || x > room.x + room.w - 16) return false;
    if (y < room.y + 16 || y > room.y + room.h - 16) return false;
    if (!freeSpot(x, y)) return false;
    used.push({ x, y });
    spots.push({ x, y });
    return true;
  }

  // edge corridors
  for (let i = 0; i < 14; i++) {
    const ex = pick(rng, EDGE_X);
    const ey = pick(rng, EDGE_Y);
    const x = ex === 'left' ? room.x + rint(rng, 20, 70) : room.x + room.w - rint(rng, 20, 70);
    const y = ey === 'top' ? room.y + rint(rng, 18, 60) : room.y + room.h - rint(rng, 18, 55);
    addSpot(x, y);
  }
  // mid band
  for (let i = 0; i < 8; i++) {
    const x = room.x + pad + rng() * innerW;
    const y = room.y + pad + rng() * innerH * 0.55;
    addSpot(x, y);
  }

  // type-weighted pools
  const common = ['skull', 'boneStack', 'rubble', 'mushroom', 'urn'];
  const grave = ['tomb', 'candle', 'corpsePile', 'skull', 'deadTree', 'coffin'];
  const combat = ['boneStack', 'skull', 'rubble', 'candle', 'urn', 'cobweb'];
  const elite = ['corpsePile', 'pillarBroken', 'boneStack', 'candle', 'statue'];
  const boss = ['corpsePile', 'statue', 'pillarBroken', 'deadTree', 'coffin', 'candleCluster'];
  const neutral = ['mushroom', 'urn', 'candle', 'boneStack', 'well'];

  let pool = combat;
  if (room.type === 'grave') pool = grave.concat(common);
  else if (room.type === 'elite') pool = elite.concat(common);
  else if (room.type === 'boss') pool = boss.concat(common);
  else if (room.type === 'neutral') pool = neutral.concat(common);
  else pool = combat.concat(common);

  // higher floor: denser + more special
  const density = Math.min(spots.length, 8 + floorNum + rint(rng, 0, 4));
  const count = rint(rng, Math.max(6, density - 4), density);

  for (let i = 0; i < count && i < spots.length; i++) {
    const kind = pick(rng, pool);
    const sp = spots[i];
    const scale = kind === 'corpsePile' || kind === 'deadTree' || kind === 'coffin' || kind === 'statue'
      ? rint(rng, 2, 3)
      : rint(rng, 2, 3);
    items.push({
      kind,
      x: sp.x,
      y: sp.y,
      scale,
      flip: rng() > 0.5,
      glow: kind === 'candle' || kind === 'candleCluster',
      phase: rng() * Math.PI * 2,
    });
  }

  // torches on walls
  const torches = [];
  const torchN = rint(rng, 2, 4);
  for (let i = 0; i < torchN; i++) {
    const side = rint(rng, 0, 3);
    if (side === 0) torches.push([room.x + rint(rng, 40, room.w - 40), room.y - 4]);
    else if (side === 1) torches.push([room.x + rint(rng, 40, room.w - 40), room.y + room.h + 4]);
    else if (side === 2) torches.push([room.x - 4, room.y + rint(rng, 30, room.h - 30)]);
    else torches.push([room.x + room.w + 4, room.y + rint(rng, 30, room.h - 30)]);
  }

  // corner webs chance
  if (rng() > 0.25) {
    items.push({ kind: 'cobweb', x: room.x + 10, y: room.y + 10, scale: 2, flip: false, phase: 0 });
  }
  if (rng() > 0.4) {
    items.push({ kind: 'cobweb', x: room.x + room.w - 10, y: room.y + 10, scale: 2, flip: true, phase: 0 });
  }

  // floor palette variant by seed
  const palette = pick(rng, [
    { a: '#322048', b: '#241638' },
    { a: '#2e1c3e', b: '#1c122c' },
    { a: '#35244a', b: '#261838' },
    { a: '#2a1a3c', b: '#201430' },
  ]);

  return {
    seed,
    items,
    torches,
    palette,
    sigil: rng() > 0.4,
    holeCount: rint(rng, 4, 10),
  };
}

function hashType(t) {
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
  return h >>> 0;
}
