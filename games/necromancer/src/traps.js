import { mulberry32, rand } from './utils.js?v=cb58232421';
import { BALANCE } from './balance.js?v=cb58232421';
import { damagePlayer } from './combat.js?v=cb58232421';

/** Room traps: spikes & poison pools */
export function generateTraps(room, floorNum, roomIndex, runSeed, weeklyAffix) {
  const seed = (runSeed ^ 0x51f15 ^ floorNum * 313 ^ roomIndex * 17) >>> 0;
  const rng = mulberry32(seed);
  const traps = [];
  const wantSpike = weeklyAffix === 'spike_floor' || rng() > 0.55;
  const wantPoison = weeklyAffix === 'toxic_fog' || rng() > 0.7;
  const pad = 50;
  const n = wantSpike ? (weeklyAffix === 'spike_floor' ? 6 : 2 + Math.floor(rng() * 3)) : 0;
  for (let i = 0; i < n; i++) {
    traps.push({
      kind: 'spike',
      x: room.x + pad + rng() * (room.w - pad * 2),
      y: room.y + pad + rng() * (room.h - pad * 2),
      r: 16,
      phase: rng() * 2,
      cd: 0,
      up: true,
    });
  }
  const m = wantPoison ? (weeklyAffix === 'toxic_fog' ? 3 : 1) : 0;
  for (let i = 0; i < m; i++) {
    const x = room.x + pad + rng() * (room.w - pad * 2);
    const y = room.y + pad + rng() * (room.h - pad * 2);
    const r = BALANCE.trap.poisonRadius;
    // drifting mist puffs
    const mist = [];
    const nPuff = 6 + Math.floor(rng() * 4);
    for (let k = 0; k < nPuff; k++) {
      const a = rng() * Math.PI * 2;
      const d = rng() * r * 0.75;
      mist.push({
        ox: Math.cos(a) * d,
        oy: Math.sin(a) * d,
        vx: (rng() - 0.5) * 12,
        vy: (rng() - 0.5) * 8 - 4,
        size: 8 + rng() * 14,
        life: 1,
        maxLife: 1.2 + rng() * 1.4,
        seed: rng() * 10,
      });
    }
    traps.push({
      kind: 'poison',
      x, y,
      r,
      phase: rng() * 2,
      tick: 0,
      mist,
      bubbles: [],
    });
  }
  return traps;
}

export function stepTraps(game, dt) {
  const p = game.player;
  if (!game.traps) return;
  const t0 = game.time;
  for (const t of game.traps) {
    t.phase = (t.phase || 0) + dt;
    if (t.kind === 'spike') {
      const up = (Math.sin(t.phase * 2.2) + 1) * 0.5 > 0.35;
      t.up = up;
      if (t.cd > 0) t.cd -= dt;
      if (!p.alive) continue;
      if (!up) continue;
      if (Math.hypot(p.x - t.x, p.y - t.y) < t.r + p.r * 0.6) {
        if (t.cd <= 0) {
          t.cd = BALANCE.trap.spikeCd;
          damagePlayer(p, BALANCE.trap.spikeDmg, game);
        }
      }
    } else if (t.kind === 'poison') {
      // mist drift
      if (t.mist) {
        for (const puff of t.mist) {
          puff.life -= dt / puff.maxLife;
          puff.ox += puff.vx * dt + Math.sin(t0 * 1.3 + puff.seed) * 6 * dt;
          puff.oy += puff.vy * dt + Math.cos(t0 * 0.9 + puff.seed) * 4 * dt;
          puff.size += dt * 4;
          const dist = Math.hypot(puff.ox, puff.oy);
          if (dist > t.r * 0.95) {
            // soft bounce toward center
            puff.vx -= (puff.ox / dist) * 8 * dt;
            puff.vy -= (puff.oy / dist) * 8 * dt;
          }
          if (puff.life <= 0) {
            const a = Math.random() * Math.PI * 2;
            const d = Math.random() * t.r * 0.55;
            puff.ox = Math.cos(a) * d;
            puff.oy = Math.sin(a) * d;
            puff.vx = (Math.random() - 0.5) * 14;
            puff.vy = -6 - Math.random() * 8;
            puff.size = 8 + Math.random() * 14;
            puff.life = 1;
            puff.maxLife = 1.2 + Math.random() * 1.4;
            puff.seed = Math.random() * 10;
          }
        }
      }
      // occasional bubbles
      t.bubbles = t.bubbles || [];
      if (Math.random() < dt * 2.2 && t.bubbles.length < 8) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * t.r * 0.7;
        t.bubbles.push({
          ox: Math.cos(a) * d,
          oy: Math.sin(a) * d,
          life: 0.8 + Math.random() * 0.6,
          size: 2 + Math.random() * 3,
        });
      }
      for (const b of t.bubbles) {
        b.life -= dt;
        b.oy -= 18 * dt;
        b.ox += Math.sin(t0 * 4 + b.size) * 8 * dt;
      }
      t.bubbles = t.bubbles.filter((b) => b.life > 0);

      if (!p.alive) continue;
      const d = Math.hypot(p.x - t.x, p.y - t.y);
      if (d < t.r + p.r * 0.4) {
        t.tick = (t.tick || 0) + dt;
        if (t.tick >= 0.5) {
          t.tick = 0;
          damagePlayer(p, BALANCE.trap.poisonDps * 0.5, game);
        }
      }
    }
  }
}

export function drawTraps(ctx, game) {
  if (!game.traps) return;
  const t0 = game.time;
  for (const t of game.traps) {
    if (t.kind === 'spike') {
      const up = t.up !== false;
      ctx.fillStyle = up ? 'rgba(180,180,200,0.55)' : 'rgba(80,80,100,0.35)';
      ctx.fillRect(t.x - 12, t.y - 8, 24, 16);
      ctx.fillStyle = up ? '#c8c8d8' : '#4a4a5a';
      for (let i = -1; i <= 1; i++) {
        const h = up ? 10 + (i === 0 ? 4 : 0) : 3;
        ctx.fillRect(t.x + i * 7 - 1, t.y - h, 2, h);
      }
    } else {
      drawPoison(ctx, t, t0);
    }
  }
}

function drawPoison(ctx, t, t0) {
  // base pool with wobble
  const wob = 1 + Math.sin(t0 * 1.6 + t.phase) * 0.06;
  const pulse = 0.4 + Math.sin(t0 * 2.2 + t.phase) * 0.1;
  const r = t.r * wob;
  const g = ctx.createRadialGradient(t.x, t.y, 2, t.x, t.y, r);
  g.addColorStop(0, `rgba(70,160,50,${0.28 * pulse})`);
  g.addColorStop(0.55, `rgba(90,200,70,${0.18 * pulse})`);
  g.addColorStop(1, 'rgba(80,180,60,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
  ctx.fill();
  // edge ring
  ctx.strokeStyle = `rgba(140,240,90,${0.28 * pulse})`;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 5]);
  ctx.lineDashOffset = -t0 * 12;
  ctx.beginPath();
  ctx.arc(t.x, t.y, r * 0.92, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // drifting mist puffs
  if (t.mist) {
    for (const p of t.mist) {
      const a = Math.max(0, p.life) * 0.22;
      if (a <= 0.01) continue;
      const mx = t.x + p.ox;
      const my = t.y + p.oy;
      const mg = ctx.createRadialGradient(mx, my, 1, mx, my, p.size);
      mg.addColorStop(0, `rgba(120,220,90,${a})`);
      mg.addColorStop(0.5, `rgba(90,180,70,${a * 0.55})`);
      mg.addColorStop(1, 'rgba(90,180,70,0)');
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(mx, my, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // rising bubbles
  if (t.bubbles) {
    for (const b of t.bubbles) {
      const a = Math.min(1, b.life) * 0.55;
      ctx.fillStyle = `rgba(180,255,140,${a})`;
      ctx.beginPath();
      ctx.arc(t.x + b.ox, t.y + b.oy, b.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
