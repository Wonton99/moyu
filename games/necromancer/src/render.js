import { COLORS, DOOR, ROOM_TYPE_LABEL } from './constants.js?v=cb51554320';
import { drawSprite, ENEMY_SPRITE, SUMMON_SPRITE } from './sprites.js?v=cb51554320';
import { drawFx, shakeOffset } from './fx.js?v=cb51554320';
import { loadSettings } from './settings.js?v=cb51554320';
import { drawTraps } from './traps.js?v=cb58232421';
import { loadSkins, getSkillColor } from './skins.js?v=cb51554320';

export function drawGame(ctx, game) {
  const { room, entities, player } = game;
  const settings = loadSettings();
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  const sh = shakeOffset({ shake: (game.fx?.shake || 0) * (settings.shake ?? 1) });
  ctx.translate(sh.x, sh.y);

  // outer void
  ctx.fillStyle = '#0b0712';
  ctx.fillRect(-20, -20, ctx.canvas.width + 40, ctx.canvas.height + 40);
  drawStarfield(ctx, game.time);

  drawRoomShell(ctx, room, game);
  drawFloorDetail(ctx, room, game);
  drawWallDecor(ctx, room, game);
  drawAmbientFog(ctx, room, game);
  drawTraps(ctx, game);

  drawDoor(ctx, game);

  // graves
  for (const g of entities.graves) {
    if (!g.alive) continue;
    if (!g.used) {
      const pulse = 0.1 + Math.sin(game.time * 3 + g.id) * 0.06;
      ctx.fillStyle = `rgba(200,184,255,${pulse})`;
      ctx.beginPath();
      ctx.ellipse(g.x, g.y + 4, 16, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    drawSprite(ctx, 'grave', g.x, g.y, g.used ? 2 : 3, false, g.used ? '#1a1a22' : null);
  }

  // neutrals
  for (const n of entities.neutrals) {
    if (!n.alive || n.contracted) continue;
    const key = n.typeId === 'wisp' ? 'neutralWisp' : 'neutralWolf';
    drawShadow(ctx, n.x, n.y + 10, 10);
    drawSprite(ctx, key, n.x, n.y, 3);
    pixelBar(ctx, n.x - 14, n.y - 22, 28, 3, n.hp / n.maxHp, n.panic > 0 ? '#ff9e6b' : COLORS.neutral);
    ctx.fillStyle = 'rgba(107,200,255,0.75)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('F', n.x, n.y - 26);
  }

  // corpses
  for (const c of entities.corpses) {
    if (!c.alive) continue;
    const ratio = 1 - c.age / c.life;
    drawShadow(ctx, c.x, c.y + 8, 8);
    drawSprite(ctx, 'corpse', c.x, c.y, 3, false, player.corpseTint || null);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(c.x - 8, c.y + 12, 16, 2);
    ctx.fillStyle = ratio > 0.35 ? '#8a7a50' : '#ff6b6b';
    ctx.fillRect(c.x - 8, c.y + 12, 16 * Math.max(0, ratio), 2);
  }

  // essence / shards / relics with rarity beams
  for (const e of entities.essence) {
    if (!e.alive) continue;
    const bob = Math.sin(game.time * 6 + e.id) * 2;
    drawDropBeam(ctx, e.x, e.y, 'white', 28, game.time + e.id);
    ctx.fillStyle = 'rgba(255,209,102,0.15)';
    ctx.beginPath();
    ctx.arc(e.x, e.y + bob, 8, 0, Math.PI * 2);
    ctx.fill();
    drawSprite(ctx, 'essence', e.x, e.y + bob, 2);
  }
  for (const s of entities.shards) {
    if (!s.alive) continue;
    const bob = Math.sin(game.time * 4 + s.id) * 3;
    drawDropBeam(ctx, s.x, s.y, 'gold', 56, game.time + s.id);
    ctx.fillStyle = 'rgba(255,209,102,0.22)';
    ctx.fillRect(s.x - 12, s.y - 14 + bob, 24, 28);
    drawSprite(ctx, 'shard', s.x, s.y + bob, 3);
  }
  for (const d of entities.relicDrops || []) {
    if (!d.alive) continue;
    const bob = Math.sin(game.time * 3.5 + d.id) * 3;
    const rar = d.cursed ? 'red' : (d.rarity || 'purple');
    drawDropBeam(ctx, d.x, d.y, rar, 80, game.time + d.id);
    const col = rar === 'red' ? '#ff4a6a'
      : rar === 'gold' ? '#ffd166'
        : rar === 'purple' ? '#c060ff'
          : rar === 'blue' ? '#6bc8ff' : '#e8dff5';
    ctx.fillStyle = col;
    ctx.fillRect(d.x - 8, d.y - 8 + bob, 16, 16);
    ctx.fillStyle = '#fff';
    ctx.fillRect(d.x - 3, d.y - 3 + bob, 6, 6);
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = col;
    ctx.fillText(`${d.cursed ? '诅咒·' : ''}${d.relic?.name || '?'} [F]`, d.x, d.y - 18 + bob);
  }

  // curse aura
  if (player.alive && player.skills.curse && player.curseRadius > 0) {
    ctx.strokeStyle = 'rgba(160, 80, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.curseRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // summons
  for (const s of entities.summons) {
    if (!s.alive) continue;
    const key = SUMMON_SPRITE[s.typeId] || 'skeleton';
    drawShadow(ctx, s.x, s.y + 10, s.r);
    if (s.windup > 0) {
      ctx.fillStyle = `rgba(255,209,102,${0.35 + s.windup})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r + 6, 0, Math.PI * 2);
      ctx.fill();
    }
    drawSprite(ctx, key, s.x, s.y, 3);
    if (s.typeId === 'eliteUndead') {
      ctx.strokeStyle = 'rgba(255,209,102,0.7)';
      ctx.lineWidth = 2;
      ctx.strokeRect(s.x - 14, s.y - 14, 28, 28);
    }
    pixelBar(ctx, s.x - 12, s.y - 20, 24, 3, s.hp / s.maxHp, '#7dffa0');
  }

  // enemies
  for (const e of entities.enemies) {
    if (!e.alive) continue;
    const key = ENEMY_SPRITE[e.typeId] || 'zombie';
    const scale = e.isBoss ? 4 : e.isElite ? 3 : 2;
    const eb = Math.sin(game.time * 3 + e.id) * (e.isBoss ? 1.5 : 1);
    drawShadow(ctx, e.x, e.y + 10 * (scale / 2), e.r * (scale / 2));
    if (e.isBoss) {
      const g = ctx.createRadialGradient(e.x, e.y, 8, e.x, e.y, 50);
      g.addColorStop(0, 'rgba(255,60,110,0.28)');
      g.addColorStop(1, 'rgba(255,60,110,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 50, 0, Math.PI * 2);
      ctx.fill();
    }
    drawSprite(ctx, key, e.x, e.y - eb, scale, false, e.slowTimer > 0 ? '#6040a0' : null);
    pixelBar(ctx, e.x - 12 * (scale / 2), e.y - 10 * scale - eb, 24 * (scale / 2), 3, e.hp / e.maxHp, e.isBoss ? '#ff3c6e' : '#ff6b6b');
    if (e.isBoss) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(e.name, e.x, e.y - 12 * scale - eb);
    }
  }

  // player
  if (player.alive) {
    const bob = player.moving
      ? Math.abs(Math.sin((player.animT || 0) * 10)) * 3
      : Math.sin((player.animT || 0) * 3) * 1.2;
    const lean = player.moving ? (player.moveDir?.x || 0) * 2 : 0;
    const atk = player.atkFlash > 0 ? player.atkFlash / 0.14 : 0;

    // dash afterimages
    if (player.dashTrail && player.dashTrail.length) {
      for (const t of player.dashTrail) {
        ctx.globalAlpha = Math.max(0, (t.life / (t.maxLife || 0.28)) * 0.45);
        drawSprite(ctx, 'player', t.x, t.y - 2, 3, (player.facing.x < 0), player.playerTint || null);
        ctx.globalAlpha = 1;
      }
    }

    const lg = ctx.createRadialGradient(player.x, player.y, 6, player.x, player.y, 70);
    lg.addColorStop(0, 'rgba(200,184,255,0.14)');
    lg.addColorStop(1, 'rgba(200,184,255,0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 70, 0, Math.PI * 2);
    ctx.fill();
    drawShadow(ctx, player.x, player.y + 12, 12);

    // attack recoil push
    const rx = -player.facing.x * atk * 4;
    const ry = -player.facing.y * atk * 4;
    drawSprite(
      ctx,
      'player',
      player.x + lean + rx,
      player.y - bob + ry,
      3,
      player.facing.x < 0,
      player.playerTint || null,
    );

    // cast flash tinted by skill skin
    if (atk > 0) {
      const sc = getSkillColor(loadSkins());
      ctx.fillStyle = sc;
      ctx.globalAlpha = atk * 0.7;
      const sx = player.x + player.facing.x * 16;
      const sy = player.y + player.facing.y * 16 - bob;
      ctx.fillRect(sx - 2, sy - 2, 4 + atk * 4, 4 + atk * 4);
      ctx.globalAlpha = 1;
    }

    if (player.skills.orbit && player.orbitCount > 0) {
      const r = 34;
      for (let i = 0; i < player.orbitCount; i++) {
        const a = player.orbitAngle + (i / player.orbitCount) * Math.PI * 2;
        const ox = player.x + Math.cos(a) * r;
        const oy = player.y + Math.sin(a) * r - bob * 0.3;
        ctx.fillStyle = '#f0e6d0';
        ctx.fillRect(ox - 3, oy - 3, 6, 6);
        ctx.fillStyle = '#c8b8ff';
        ctx.fillRect(ox - 1, oy - 1, 2, 2);
      }
    }
    const mx = game.input ? game.input.mouse.x : player.x + 20;
    const my = game.input ? game.input.mouse.y : player.y;
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(mx - 2, my - 2, 4, 4);
    ctx.fillStyle = 'rgba(255,209,102,0.35)';
    ctx.fillRect(mx - 4, my - 4, 8, 8);
  }

  // projectiles
  for (const p of entities.projectiles) {
    if (!p.alive) continue;
    if (p.from === 'player') {
      ctx.fillStyle = p.color || '#e8d0ff';
      ctx.fillRect(p.x - 5, p.y - 2, 10, 4);
      ctx.fillStyle = '#fff';
      ctx.fillRect(p.x - 2, p.y - 1, 4, 2);
    } else if (p.from === 'summon') {
      ctx.fillStyle = '#7dffa0';
      ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
    } else {
      ctx.fillStyle = 'rgba(255,74,74,0.25)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff9e9e';
      ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
      ctx.fillStyle = '#ff4a4a';
      ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
    }
  }

  // booms
  for (const b of game.booms) {
    if (b.life <= 0) continue;
    const t = 1 - b.life / b.maxLife;
    const r = b.r + (b.maxR - b.r) * t;
    ctx.fillStyle = `rgba(255,120,60,${0.12 * (1 - t)})`;
    ctx.beginPath();
    ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 120, 60, ${1 - t})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const x = b.x + Math.cos(a) * r;
      const y = b.y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  for (const t of game.floatingTexts) {
    if (t.life <= 0) continue;
    ctx.globalAlpha = Math.min(1, t.life * 2);
    ctx.fillStyle = t.color;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(t.text, Math.round(t.x), Math.round(t.y));
    ctx.globalAlpha = 1;
  }

  if (game.fx) drawFx(ctx, game.fx);

  drawBossBar(ctx, game);

  drawVignette(ctx);

  if (settings.particles !== 0) {
    const pad = 28;
    for (const p of entities.projectiles) {
      if (!p.alive || p.from !== 'enemy') continue;
      if (p.x > pad && p.x < ctx.canvas.width - pad && p.y > pad && p.y < ctx.canvas.height - pad) continue;
      ctx.fillStyle = 'rgba(255,74,106,0.75)';
      const cx = Math.max(6, Math.min(ctx.canvas.width - 10, p.x));
      const cy = Math.max(6, Math.min(ctx.canvas.height - 10, p.y));
      ctx.fillRect(cx - 4, cy - 4, 8, 8);
    }
  }

  ctx.fillStyle = 'rgba(232,223,245,0.45)';
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';
  const aff = room.affix ? ` ${room.affix.name}` : '';
  ctx.fillText(
    `${game.floor}/${ROOM_TYPE_LABEL[room.type] || ''}${aff} ${room.enemiesLeft}`,
    room.x + 4,
    room.y - 10,
  );

  if (room.doorOpen && player.alive) {
    drawRouteArrow(ctx, game, player);
  }

  if (game.flash && game.flash.t > 0) {
    ctx.globalAlpha = Math.min(0.45, game.flash.t * 1.2);
    ctx.fillStyle = game.flash.color;
    ctx.fillRect(-20, -20, ctx.canvas.width + 40, ctx.canvas.height + 40);
    ctx.globalAlpha = 1;
  }
  if (game.fx && game.fx.flashT > 0 && game.fx.flashColor) {
    ctx.globalAlpha = Math.min(0.35, game.fx.flashT * 2);
    ctx.fillStyle = game.fx.flashColor;
    ctx.fillRect(-20, -20, ctx.canvas.width + 40, ctx.canvas.height + 40);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function hash2(x, y) {
  let n = x * 374761393 + y * 668265263;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967296;
}

function drawStarfield(ctx, time) {
  ctx.fillStyle = 'rgba(200,184,255,0.35)';
  for (let i = 0; i < 40; i++) {
    const x = (i * 97 + 13) % ctx.canvas.width;
    const y = (i * 53 + 7) % 40;
    const tw = 0.3 + 0.7 * Math.abs(Math.sin(time * 1.5 + i));
    ctx.globalAlpha = tw * 0.5;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;
}

function drawRoomShell(ctx, room, game) {
  // outer stone frame
  ctx.fillStyle = '#120c1c';
  ctx.fillRect(room.x - 16, room.y - 16, room.w + 32, room.h + 32);
  // floor base
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(room.x, room.y, room.w, room.h);
}

function drawFloorDetail(ctx, room, game) {
  const props = room.props;
  const seed = props?.seed ?? (room.type.charCodeAt(0) + game.floor * 17);
  const palA = props?.palette?.a || '#322048';
  const palB = props?.palette?.b || '#241638';
  for (let ty = 0; ty < room.h; ty += 16) {
    for (let tx = 0; tx < room.w; tx += 16) {
      const bx = room.x + tx;
      const by = room.y + ty;
      const alt = ((tx / 16 + ty / 16 + seed) | 0) % 2 === 0;
      ctx.fillStyle = alt ? palA : palB;
      ctx.fillRect(bx, by, 16, 16);
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(bx, by, 16, 1);
      ctx.fillRect(bx, by, 1, 16);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(bx, by + 15, 16, 1);
      ctx.fillRect(bx + 15, by, 1, 16);
      const h = hash2(tx + seed, ty);
      if (h > 0.86) {
        ctx.fillStyle = '#140c20';
        ctx.fillRect(bx + 4, by + 7, 7, 1);
        ctx.fillRect(bx + 10, by + 8, 1, 4);
      }
      if (h < 0.05) {
        ctx.fillStyle = room.type === 'grave' ? 'rgba(70,110,55,0.28)' : 'rgba(110,30,45,0.22)';
        ctx.fillRect(bx + 5, by + 5, 5, 4);
      }
      if (h > 0.97) {
        ctx.fillStyle = 'rgba(120,80,180,0.25)';
        ctx.fillRect(bx + 3, by + 3, 2, 2);
      }
    }
  }
  const cx = room.x + room.w / 2;
  const cy = room.y + room.h / 2;
  if (props?.sigil !== false) {
    ctx.strokeStyle = 'rgba(160,120,220,0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 36 + (seed % 10), 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.stroke();
  }
  let tint = null;
  if (room.type === 'grave') tint = 'rgba(90,100,120,0.08)';
  if (room.type === 'boss') tint = 'rgba(140,20,40,0.1)';
  if (room.type === 'neutral') tint = 'rgba(40,90,130,0.08)';
  if (room.affix?.name === '血月') tint = 'rgba(150,20,40,0.12)';
  if (tint) {
    ctx.fillStyle = tint;
    ctx.fillRect(room.x, room.y, room.w, room.h);
  }
}

function drawWallDecor(ctx, room, game) {
  const t = game.time;
  // thick walls
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(room.x - 12, room.y - 12, room.w + 24, 12);
  ctx.fillRect(room.x - 12, room.y + room.h, room.w + 24, 12);
  ctx.fillRect(room.x - 12, room.y, 12, room.h);
  ctx.fillRect(room.x + room.w, room.y, 12, room.h);
  // brick courses
  ctx.fillStyle = COLORS.wallEdge;
  for (let x = room.x - 12; x < room.x + room.w + 12; x += 16) {
    ctx.fillRect(x, room.y - 12, 14, 2);
    ctx.fillRect(x + 6, room.y + room.h + 8, 14, 2);
  }
  for (let y = room.y; y < room.y + room.h; y += 14) {
    ctx.fillRect(room.x - 12, y, 2, 12);
    ctx.fillRect(room.x + room.w + 10, y + 4, 2, 12);
  }
  // corner pillars
  const corners = [
    [room.x - 12, room.y - 12],
    [room.x + room.w - 4, room.y - 12],
    [room.x - 12, room.y + room.h - 4],
    [room.x + room.w - 4, room.y + room.h - 4],
  ];
  for (const [cx, cy] of corners) {
    ctx.fillStyle = '#1a1228';
    ctx.fillRect(cx, cy, 16, 16);
    ctx.fillStyle = '#3a2850';
    ctx.fillRect(cx + 2, cy + 2, 12, 3);
    ctx.fillRect(cx + 2, cy + 10, 12, 3);
  }
  // wall torches / orbs
  const torches = [
    [room.x + 40, room.y - 6],
    [room.x + room.w - 50, room.y - 6],
    [room.x + room.w / 2, room.y + room.h + 4],
  ];
  for (let i = 0; i < torches.length; i++) {
    const [tx, ty] = torches[i];
    const glow = 0.55 + Math.sin(t * 5 + i * 2) * 0.25;
    const g = ctx.createRadialGradient(tx, ty, 2, tx, ty, 36);
    g.addColorStop(0, `rgba(180,100,255,${0.22 * glow})`);
    g.addColorStop(1, 'rgba(180,100,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(tx, ty, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6a4a9a';
    ctx.fillRect(tx - 2, ty - 2, 4, 6);
    ctx.fillStyle = `rgba(200,160,255,${glow})`;
    ctx.fillRect(tx - 1, ty - 4, 2, 3);
  }
  // scene props
  drawRoomProps(ctx, room, game);
}

function drawRoomProps(ctx, room, game) {
  const t = game.time;
  const props = room.props;
  if (!props) return;

  // torches from props
  for (let i = 0; i < (props.torches || []).length; i++) {
    const [tx, ty] = props.torches[i];
    const glow = 0.55 + Math.sin(t * 5 + i * 2 + (props.seed || 0)) * 0.25;
    const g = ctx.createRadialGradient(tx, ty, 2, tx, ty, 36);
    g.addColorStop(0, `rgba(180,100,255,${0.22 * glow})`);
    g.addColorStop(1, 'rgba(180,100,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(tx, ty, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6a4a9a';
    ctx.fillRect(tx - 2, ty - 2, 4, 6);
    ctx.fillStyle = `rgba(200,160,255,${glow})`;
    ctx.fillRect(tx - 1, ty - 4, 2, 3);
  }

  for (const it of props.items || []) {
    if (it.kind === 'rubble') {
      ctx.fillStyle = 'rgba(58,40,80,0.5)';
      ctx.fillRect(it.x, it.y, 5 + (it.scale % 3), 3);
      continue;
    }
    if (it.kind === 'candle' || it.kind === 'candleCluster') {
      const flick = 0.55 + Math.sin(t * 8 + it.phase) * 0.2;
      const g = ctx.createRadialGradient(it.x, it.y - 4, 2, it.x, it.y - 4, 30);
      g.addColorStop(0, `rgba(255,180,80,${0.3 * flick})`);
      g.addColorStop(1, 'rgba(255,180,80,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(it.x, it.y - 4, 30, 0, Math.PI * 2);
      ctx.fill();
    }
    if (it.kind === 'corpsePile' || it.kind === 'deadTree' || it.kind === 'coffin') {
      drawShadow(ctx, it.x, it.y + 10, 14);
    }
    if (it.kind === 'statue') {
      const g = ctx.createRadialGradient(it.x, it.y, 4, it.x, it.y, 40);
      g.addColorStop(0, 'rgba(255,80,100,0.08)');
      g.addColorStop(1, 'rgba(255,80,100,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(it.x, it.y, 40, 0, Math.PI * 2);
      ctx.fill();
    }
    if (it.kind === 'cobweb' && it.flip) {
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.scale(-1, 1);
      drawSprite(ctx, 'cobweb', 0, 0, it.scale || 2);
      ctx.restore();
    } else {
      drawSprite(ctx, it.kind, it.x, it.y, it.scale || 2, it.flip);
    }
  }
}

function drawBonePile(ctx, x, y) {
  ctx.fillStyle = '#c8b890';
  ctx.fillRect(x, y, 10, 3);
  ctx.fillRect(x + 8, y - 3, 3, 8);
  ctx.fillRect(x - 4, y + 2, 6, 2);
  ctx.fillStyle = '#8a7a50';
  ctx.fillRect(x + 2, y + 1, 4, 1);
}

function drawAmbientFog(ctx, room, game) {
  const t = game.time;
  for (let i = 0; i < 5; i++) {
    const fx = room.x + ((i * 173 + t * (8 + i * 3)) % (room.w + 40)) - 20;
    const fy = room.y + 40 + ((i * 97) % Math.max(40, room.h - 80));
    const a = 0.03 + (i % 3) * 0.01;
    const g = ctx.createRadialGradient(fx, fy, 4, fx, fy, 40 + i * 8);
    g.addColorStop(0, `rgba(160,140,200,${a})`);
    g.addColorStop(1, 'rgba(160,140,200,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(fx, fy, 40 + i * 8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawVignette(ctx) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.85);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawShadow(ctx, x, y, r) {
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.9, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawRouteArrow(ctx, game, player) {
  const doorX = DOOR.x + DOOR.w / 2;
  const doorY = DOOR.y + DOOR.h / 2;
  const dx = doorX - player.x;
  const dy = doorY - player.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;
  const t = (Math.sin(game.time * 4) * 0.5 + 0.5);
  const ax = player.x + nx * (40 + t * Math.min(120, dist * 0.35));
  const ay = player.y + ny * (40 + t * Math.min(120, dist * 0.35));
  const size = 10;
  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(Math.atan2(ny, nx));
  ctx.fillStyle = `rgba(212,192,255,${0.55 + t * 0.35})`;
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.55, size * 0.65);
  ctx.lineTo(-size * 0.2, 0);
  ctx.lineTo(-size * 0.55, -size * 0.65);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  for (let i = 0; i < 3; i++) {
    const p = 0.55 + i * 0.12;
    const cx = player.x + dx * p;
    const cy = player.y + dy * p;
    const pulse = (Math.sin(game.time * 5 - i) + 1) * 0.5;
    ctx.fillStyle = `rgba(200,184,255,${0.15 + pulse * 0.35})`;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.atan2(ny, nx));
    ctx.fillRect(-2, -6, 3, 12);
    ctx.restore();
  }
}

function drawDoor(ctx, game) {
  const room = game.room;
  const dx = DOOR.x;
  const dy = DOOR.y;
  // stone arch
  ctx.fillStyle = '#2a1a40';
  ctx.fillRect(dx - 6, dy - 8, DOOR.w + 12, DOOR.h + 16);
  ctx.fillStyle = '#3a2850';
  ctx.fillRect(dx - 4, dy - 6, DOOR.w + 8, 4);
  ctx.fillRect(dx - 4, dy + DOOR.h + 2, DOOR.w + 8, 4);
  if (room.doorOpen) {
    // light shaft
    const g = ctx.createLinearGradient(dx - 20, dy + DOOR.h / 2, dx + 8, dy + DOOR.h / 2);
    g.addColorStop(0, 'rgba(180,140,255,0)');
    g.addColorStop(1, 'rgba(200,170,255,0.35)');
    ctx.fillStyle = g;
    ctx.fillRect(dx - 24, dy, 30, DOOR.h);
    ctx.fillStyle = '#d4c0ff';
    ctx.fillRect(dx, dy, DOOR.w, DOOR.h);
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.5 + Math.sin(game.time * 4) * 0.2;
    ctx.fillRect(dx + 4, dy + 8, DOOR.w - 8, DOOR.h - 16);
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = COLORS.doorClosed;
    ctx.fillRect(dx, dy, DOOR.w, DOOR.h);
    ctx.fillStyle = '#2a1a38';
    for (let y = dy + 4; y < dy + DOOR.h - 2; y += 6) {
      ctx.fillRect(dx + 4, y, DOOR.w - 8, 2);
    }
    ctx.fillStyle = '#5a4070';
    ctx.fillRect(dx + 6, dy + DOOR.h / 2 - 2, 4, 4);
  }
}

function pixelBar(ctx, x, y, w, h, ratio, color) {
  ctx.fillStyle = '#0a0610';
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = '#3a2850';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, Math.max(0, Math.min(w, w * ratio)), h);
}

function drawBossBar(ctx, game) {
  const boss = game.entities?.enemies?.find((e) => e.alive && e.isBoss);
  if (!boss) return;
  const w = Math.min(520, ctx.canvas.width - 80);
  const x = (ctx.canvas.width - w) / 2;
  const y = 12;
  const ratio = Math.max(0, boss.hp / boss.maxHp);
  const phase = boss.phase || (ratio > 0.6 ? 1 : ratio > 0.3 ? 2 : 3);
  const phaseName = phase === 1 ? 'I 环射' : phase === 2 ? 'II 召鼠' : 'III 狂暴';

  // backdrop
  ctx.fillStyle = 'rgba(10,6,18,0.75)';
  ctx.fillRect(x - 4, y - 2, w + 8, 28);
  ctx.strokeStyle = phase >= 3 ? '#ff2060' : '#ff3c6e';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 4, y - 2, w + 8, 28);

  // name + phase
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(boss.name, x, y + 8);
  ctx.fillStyle = phase >= 3 ? '#ff8e9e' : '#ffb0c0';
  ctx.textAlign = 'right';
  ctx.fillText(`阶段 ${phaseName}`, x + w, y + 8);

  // bar
  const by = y + 12;
  const bh = 8;
  ctx.fillStyle = '#1a1024';
  ctx.fillRect(x, by, w, bh);
  ctx.fillStyle = phase >= 3 ? '#ff2060' : phase >= 2 ? '#ff3c6e' : '#ff6b8a';
  ctx.fillRect(x, by, w * ratio, bh);
  // phase notches at 60% / 30%
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x + w * 0.6 - 1, by, 2, bh);
  ctx.fillRect(x + w * 0.3 - 1, by, 2, bh);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.strokeRect(x, by, w, bh);
}

const BEAM = {
  white: [232, 223, 245],
  blue: [107, 200, 255],
  purple: [192, 96, 255],
  gold: [255, 209, 102],
  red: [255, 74, 106],
};

/** Strong vertical light pillar for drops */
function drawDropBeam(ctx, x, y, rarity, height, t) {
  const rgb = BEAM[rarity] || BEAM.purple;
  const h = Math.max(48, height);
  const w = rarity === 'red' ? 16 : rarity === 'gold' ? 14 : 12;
  const pulse = 0.7 + Math.sin(t * 5) * 0.2;
  // wide soft halo
  const halo = ctx.createRadialGradient(x, y - h * 0.3, 2, x, y - h * 0.3, w * 2.2);
  halo.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${0.35 * pulse})`);
  halo.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
  ctx.fillStyle = halo;
  ctx.fillRect(x - w * 2.2, y - h - 10, w * 4.4, h + 24);
  // main column
  const g = ctx.createLinearGradient(x, y - h, x, y + 6);
  g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
  g.addColorStop(0.25, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${0.55 * pulse})`);
  g.addColorStop(0.75, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${0.75 * pulse})`);
  g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${0.95 * pulse})`);
  ctx.fillStyle = g;
  ctx.fillRect(x - w / 2, y - h, w, h + 6);
  // core
  ctx.fillStyle = `rgba(255,255,255,${0.35 * pulse})`;
  ctx.fillRect(x - 1, y - h + 8, 2, h - 4);
  // base ring
  ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${0.7 * pulse})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y + 2, w * 1.4, 5, 0, 0, Math.PI * 2);
  ctx.stroke();
}