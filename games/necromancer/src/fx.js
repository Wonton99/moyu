import { rand } from './utils.js?v=cb51554320';

export function makeFx() {
  return {
    particles: [],
    shake: 0,
    hitPause: 0,
    flashColor: null,
    flashT: 0,
    particleMul: 1,
  };
}

export function spawnBurst(fx, x, y, color, n = 8, speed = 90) {
  const mul = fx.particleMul ?? 1;
  const count = Math.max(1, Math.floor(n * mul));
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    const sp = rand(speed * 0.4, speed);
    fx.particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: rand(0.2, 0.45),
      maxLife: 0.45,
      color,
      size: rand(2, 4),
    });
  }
}

export function addShake(fx, amount = 6) {
  fx.shake = Math.min(14, fx.shake + amount);
}

export function addHitPause(fx, t = 0.05) {
  fx.hitPause = Math.max(fx.hitPause, t);
}

export function addFlash(fx, color, t = 0.12) {
  fx.flashColor = color;
  fx.flashT = t;
}

export function stepFx(fx, dt) {
  if (fx.shake > 0) fx.shake = Math.max(0, fx.shake - dt * 28);
  if (fx.hitPause > 0) fx.hitPause = Math.max(0, fx.hitPause - dt);
  if (fx.flashT > 0) fx.flashT = Math.max(0, fx.flashT - dt);
  for (const p of fx.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.92;
    p.vy *= 0.92;
  }
  fx.particles = fx.particles.filter((p) => p.life > 0);
}

export function drawFx(ctx, fx) {
  for (const p of fx.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

export function shakeOffset(fx) {
  if (fx.shake <= 0) return { x: 0, y: 0 };
  return {
    x: rand(-fx.shake, fx.shake),
    y: rand(-fx.shake, fx.shake),
  };
}
