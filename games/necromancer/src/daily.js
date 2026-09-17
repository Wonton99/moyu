import { hashString, mulberry32, todayKey } from './utils.js?v=cb51554320';

export function dailySeed() {
  return hashString(`NECRO-${todayKey()}`);
}

export function makeRng(seed) {
  const r = mulberry32(seed);
  return {
    seed,
    next: r,
    int(min, max) {
      return min + Math.floor(r() * (max - min + 1));
    },
    pick(arr) {
      return arr[Math.floor(r() * arr.length)];
    },
  };
}

export function dailyLabel() {
  return `每日 ${todayKey()}`;
}
