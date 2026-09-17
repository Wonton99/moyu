/** Hot-tunable balance numbers (JSON-like table) */
export const BALANCE = {
  player: {
    hp: 100,
    mp: 60,
    mpRegen: 8,
    speed: 160,
    spearDmg: 12,
    spearCost: 8,
    spearCd: 0.28,
    raiseCost: 15,
    boomCost: 20,
    boomDmg: 28,
    boomRadius: 70,
    maxSummons: 6,
    curseRadius: 90,
    curseSlow: 0.3,
    refreshBase: 1,
  },
  essence: {
    base: 10,
    perLevel: 12,
  },
  corpse: {
    life: 14,
    sacrificeMp: 18,
  },
  trap: {
    spikeDmg: 8,
    spikeCd: 0.8,
    poisonDps: 4,
    poisonRadius: 48,
  },
  relic: {
    levelEvery: 3,
    eliteChance: 0.35,
    bossAlways: true,
  },
  weekly: {
    affixPool: ['blood_moon', 'spike_floor', 'toxic_fog', 'haste_dead'],
  },
};

export function getBalance() {
  return BALANCE;
}
